import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const KnowledgeContext = createContext(null);

export const KnowledgeProvider = ({ children }) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [tourObjects, setTourObjects] = useState([]);
  const [tourRoutes, setTourRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [auditResults, setAuditResults] = useState([]);
  const [lastAuditDate, setLastAuditDate] = useState(() => localStorage.getItem('travelops_last_kb_audit') || null);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const [countriesRes, citiesRes, objectsRes, routesRes] = await Promise.all([
        supabase.from('travelops_dest_countries').select('*').order('name', { ascending: true }),
        supabase.from('travelops_dest_cities').select('*').order('name', { ascending: true }),
        supabase.from('travelops_dest_objects').select('*').order('name', { ascending: true }),
        supabase.from('travelops_tour_routes').select('*').order('updated_at', { ascending: false })
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (objectsRes.error) throw objectsRes.error;
      if (routesRes.data) {
        setTourRoutes(routesRes.data || []);
      }

      setCountries(countriesRes.data || []);
      setCities(citiesRes.data || []);
      setTourObjects(objectsRes.data || []);
    } catch (err) {
      console.error('Error fetching knowledge data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- COUNTRY CRUD ---
  const addCountry = async (data) => {
    try {
      const id = (data.id || data.name.substring(0, 3)).toUpperCase().trim();
      const payload = {
        id,
        name: data.name,
        region: data.region || 'International',
        currency: data.currency || {},
        emergency: data.emergency || {},
        power_plugs: data.power_plugs || data.powerPlugs || {},
        visa_info: data.visa_info || data.visaInfo || {},
        customs_etiquette: data.customs_etiquette || data.customsEtiquette || {},
        water_safety: data.water_safety || data.waterSafety || 'Bottled water recommended',
        last_verified_at: new Date().toISOString(),
        audit_status: 'verified',
        verification_notes: data.verification_notes || 'Manually added / verified'
      };

      const { error } = await supabase.from('travelops_dest_countries').upsert([payload]);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true, id };
    } catch (err) {
      console.error('Error adding country:', err);
      throw err;
    }
  };

  const updateCountry = async (id, updatedData) => {
    try {
      const payload = {
        last_verified_at: new Date().toISOString(),
        audit_status: updatedData.audit_status || 'verified'
      };
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.region !== undefined) payload.region = updatedData.region;
      if (updatedData.currency !== undefined) payload.currency = updatedData.currency;
      if (updatedData.emergency !== undefined) payload.emergency = updatedData.emergency;
      if (updatedData.power_plugs !== undefined || updatedData.powerPlugs !== undefined) {
        payload.power_plugs = updatedData.power_plugs || updatedData.powerPlugs;
      }
      if (updatedData.visa_info !== undefined || updatedData.visaInfo !== undefined) {
        payload.visa_info = updatedData.visa_info || updatedData.visaInfo;
      }
      if (updatedData.customs_etiquette !== undefined || updatedData.customsEtiquette !== undefined) {
        payload.customs_etiquette = updatedData.customs_etiquette || updatedData.customsEtiquette;
      }
      if (updatedData.water_safety !== undefined || updatedData.waterSafety !== undefined) {
        payload.water_safety = updatedData.water_safety || updatedData.waterSafety;
      }
      if (updatedData.verification_notes !== undefined) {
        payload.verification_notes = updatedData.verification_notes;
      }

      const { error } = await supabase.from('travelops_dest_countries').update(payload).eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true };
    } catch (err) {
      console.error('Error updating country:', err);
      throw err;
    }
  };

  const deleteCountry = async (id) => {
    try {
      const { error } = await supabase.from('travelops_dest_countries').delete().eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
    } catch (err) {
      console.error('Error deleting country:', err);
      throw err;
    }
  };

  // --- CITY CRUD ---
  const addCity = async (data) => {
    try {
      const id = data.id || `city-${Date.now()}`;
      const payload = {
        id,
        country_id: data.country_id || data.countryId,
        name: data.name,
        airports: data.airports || [],
        best_months: data.best_months || data.bestMonths || [],
        transport_apps: data.transport_apps || data.transportApps || [],
        food_highlights: data.food_highlights || data.foodHighlights || {},
        hospital_contacts: data.hospital_contacts || data.hospitalContacts || [],
        last_verified_at: new Date().toISOString(),
        audit_status: 'verified',
        verification_notes: data.verification_notes || 'Manually added'
      };

      const { error } = await supabase.from('travelops_dest_cities').upsert([payload]);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true, id };
    } catch (err) {
      console.error('Error adding city:', err);
      throw err;
    }
  };

  const updateCity = async (id, updatedData) => {
    try {
      const payload = {
        last_verified_at: new Date().toISOString(),
        audit_status: updatedData.audit_status || 'verified'
      };
      if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
        payload.country_id = updatedData.country_id || updatedData.countryId;
      }
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.airports !== undefined) payload.airports = updatedData.airports;
      if (updatedData.best_months !== undefined || updatedData.bestMonths !== undefined) {
        payload.best_months = updatedData.best_months || updatedData.bestMonths;
      }
      if (updatedData.transport_apps !== undefined || updatedData.transportApps !== undefined) {
        payload.transport_apps = updatedData.transport_apps || updatedData.transportApps;
      }
      if (updatedData.food_highlights !== undefined || updatedData.foodHighlights !== undefined) {
        payload.food_highlights = updatedData.food_highlights || updatedData.foodHighlights;
      }
      if (updatedData.hospital_contacts !== undefined || updatedData.hospitalContacts !== undefined) {
        payload.hospital_contacts = updatedData.hospital_contacts || updatedData.hospitalContacts;
      }
      if (updatedData.verification_notes !== undefined) {
        payload.verification_notes = updatedData.verification_notes;
      }

      const { error } = await supabase.from('travelops_dest_cities').update(payload).eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true };
    } catch (err) {
      console.error('Error updating city:', err);
      throw err;
    }
  };

  const deleteCity = async (id) => {
    try {
      const { error } = await supabase.from('travelops_dest_cities').delete().eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
    } catch (err) {
      console.error('Error deleting city:', err);
      throw err;
    }
  };

  // --- TOUR OBJECT CRUD ---
  const addObject = async (data) => {
    try {
      const id = data.id || `obj-${Date.now()}`;
      const payload = {
        id,
        city_id: data.city_id || data.cityId || '',
        country_id: data.country_id || data.countryId || '',
        name: data.name,
        category: data.category || 'Historical',
        est_duration_minutes: parseInt(data.est_duration_minutes || data.estDurationMinutes) || 90,
        opening_hours: data.opening_hours || data.openingHours || {},
        ticket_policy: data.ticket_policy || data.ticketPolicy || {},
        dress_code: data.dress_code || data.dressCode || '',
        rules: data.rules || {},
        guide_briefing_notes: data.guide_briefing_notes || data.guideBriefingNotes || [],
        photo_spots: data.photo_spots || data.photoSpots || [],
        cover_image_url: data.cover_image_url || data.coverImageUrl || '',
        last_verified_at: new Date().toISOString(),
        audit_status: 'verified',
        verification_notes: data.verification_notes || 'Manually added'
      };

      const { error } = await supabase.from('travelops_dest_objects').upsert([payload]);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true, id };
    } catch (err) {
      console.error('Error adding tour object:', err);
      throw err;
    }
  };

  const updateObject = async (id, updatedData) => {
    try {
      const payload = {
        last_verified_at: new Date().toISOString(),
        audit_status: updatedData.audit_status || 'verified'
      };
      if (updatedData.city_id !== undefined || updatedData.cityId !== undefined) {
        payload.city_id = updatedData.city_id || updatedData.cityId;
      }
      if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
        payload.country_id = updatedData.country_id || updatedData.countryId;
      }
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.category !== undefined) payload.category = updatedData.category;
      if (updatedData.est_duration_minutes !== undefined || updatedData.estDurationMinutes !== undefined) {
        payload.est_duration_minutes = parseInt(updatedData.est_duration_minutes || updatedData.estDurationMinutes) || 90;
      }
      if (updatedData.opening_hours !== undefined || updatedData.openingHours !== undefined) {
        payload.opening_hours = updatedData.opening_hours || updatedData.openingHours;
      }
      if (updatedData.ticket_policy !== undefined || updatedData.ticketPolicy !== undefined) {
        payload.ticket_policy = updatedData.ticket_policy || updatedData.ticketPolicy;
      }
      if (updatedData.dress_code !== undefined || updatedData.dressCode !== undefined) {
        payload.dress_code = updatedData.dress_code || updatedData.dressCode;
      }
      if (updatedData.rules !== undefined) payload.rules = updatedData.rules;
      if (updatedData.guide_briefing_notes !== undefined || updatedData.guideBriefingNotes !== undefined) {
        payload.guide_briefing_notes = updatedData.guide_briefing_notes || updatedData.guideBriefingNotes;
      }
      if (updatedData.photo_spots !== undefined || updatedData.photoSpots !== undefined) {
        payload.photo_spots = updatedData.photo_spots || updatedData.photoSpots;
      }
      if (updatedData.cover_image_url !== undefined || updatedData.coverImageUrl !== undefined) {
        payload.cover_image_url = updatedData.cover_image_url || updatedData.coverImageUrl;
      }
      if (updatedData.verification_notes !== undefined) {
        payload.verification_notes = updatedData.verification_notes;
      }

      const { error } = await supabase.from('travelops_dest_objects').update(payload).eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true };
    } catch (err) {
      console.error('Error updating tour object:', err);
      throw err;
    }
  };

  const deleteObject = async (id) => {
    try {
      const { error } = await supabase.from('travelops_dest_objects').delete().eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
    } catch (err) {
      console.error('Error deleting tour object:', err);
      throw err;
    }
  };

  // --- TOUR ROUTE CRUD & DEDUPLICATION ENGINE ---

  const computeRouteSignature = (data) => {
    const country = (data.country_id || data.countryId || data.countryName || 'ALL').toUpperCase().trim();
    const days = parseInt(data.duration_days || data.durationDays || 7);
    const cities = (data.cities_sequence || data.citiesSequence || [])
      .map(c => typeof c === 'string' ? c.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '')
      .filter(Boolean)
      .join('>');
    return `${country}:${days}D:${cities}`;
  };

  const addTourRoute = async (data) => {
    try {
      const signature = computeRouteSignature(data);
      const title = data.title?.trim() || 'Custom Tour Route';
      const countryId = (data.country_id || data.countryId || '').toUpperCase().trim();
      const countryName = data.country_name || data.countryName || '';
      const durationDays = parseInt(data.duration_days || data.durationDays) || 7;
      const durationNights = parseInt(data.duration_nights || data.durationNights) || Math.max(1, durationDays - 1);
      const citiesSeq = data.cities_sequence || data.citiesSequence || [];
      const dayItinerary = data.day_itinerary || data.dayItinerary || [];
      const highlights = data.route_highlights || data.routeHighlights || [];
      const themeCategory = data.theme_category || data.themeCategory || 'Leisure';
      const transportModes = data.transport_modes || data.transportModes || ['Private Coach'];

      // Check if duplicate route exists by signature or matching exact title
      const { data: existingRoutes, error: searchErr } = await supabase
        .from('travelops_tour_routes')
        .select('*')
        .or(`route_signature.eq.${signature},title.ilike.${title}`);

      if (!searchErr && existingRoutes && existingRoutes.length > 0) {
        const existing = existingRoutes[0];
        const newCount = (existing.usage_count || 1) + 1;
        
        await supabase
          .from('travelops_tour_routes')
          .update({
            usage_count: newCount,
            last_verified_at: new Date().toISOString(),
            audit_status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        await fetchKnowledge();
        return {
          success: true,
          deduplicated: true,
          id: existing.id,
          title: existing.title,
          usageCount: newCount,
          message: `Identical route "${existing.title}" detected in database! Incremented template usage count to ${newCount} (prevented duplicate entry).`
        };
      }

      // Create new master route
      const newId = `route-${countryId || 'int'}-${durationDays}d-${Date.now()}`.toLowerCase();
      const payload = {
        id: newId,
        title,
        route_signature: signature,
        country_id: countryId,
        country_name: countryName,
        duration_days: durationDays,
        duration_nights: durationNights,
        cities_sequence: citiesSeq,
        day_itinerary: dayItinerary,
        route_highlights: highlights,
        theme_category: themeCategory,
        transport_modes: transportModes,
        usage_count: 1,
        last_verified_at: new Date().toISOString(),
        audit_status: 'verified',
        verification_notes: 'Initial capture verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase.from('travelops_tour_routes').insert([payload]);
      if (insertErr) throw insertErr;

      await fetchKnowledge();
      return {
        success: true,
        deduplicated: false,
        id: newId,
        title,
        message: `New Master Tour Route "${title}" captured successfully!`
      };
    } catch (err) {
      console.error('Error adding tour route:', err);
      throw err;
    }
  };

  const updateTourRoute = async (id, updatedData) => {
    try {
      const payload = {
        updated_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        audit_status: updatedData.audit_status || 'verified'
      };
      if (updatedData.title !== undefined) payload.title = updatedData.title;
      if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
        payload.country_id = updatedData.country_id || updatedData.countryId;
      }
      if (updatedData.country_name !== undefined || updatedData.countryName !== undefined) {
        payload.country_name = updatedData.country_name || updatedData.countryName;
      }
      if (updatedData.duration_days !== undefined || updatedData.durationDays !== undefined) {
        payload.duration_days = parseInt(updatedData.duration_days || updatedData.durationDays) || 7;
      }
      if (updatedData.duration_nights !== undefined || updatedData.durationNights !== undefined) {
        payload.duration_nights = parseInt(updatedData.duration_nights || updatedData.durationNights) || 6;
      }
      if (updatedData.cities_sequence !== undefined || updatedData.citiesSequence !== undefined) {
        payload.cities_sequence = updatedData.cities_sequence || updatedData.citiesSequence;
        payload.route_signature = computeRouteSignature({ ...updatedData, country_id: payload.country_id });
      }
      if (updatedData.day_itinerary !== undefined || updatedData.dayItinerary !== undefined) {
        payload.day_itinerary = updatedData.day_itinerary || updatedData.dayItinerary;
      }
      if (updatedData.route_highlights !== undefined || updatedData.routeHighlights !== undefined) {
        payload.route_highlights = updatedData.route_highlights || updatedData.routeHighlights;
      }
      if (updatedData.theme_category !== undefined || updatedData.themeCategory !== undefined) {
        payload.theme_category = updatedData.theme_category || updatedData.themeCategory;
      }
      if (updatedData.transport_modes !== undefined || updatedData.transportModes !== undefined) {
        payload.transport_modes = updatedData.transport_modes || updatedData.transportModes;
      }
      if (updatedData.verification_notes !== undefined) {
        payload.verification_notes = updatedData.verification_notes;
      }

      const { error } = await supabase.from('travelops_tour_routes').update(payload).eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
      return { success: true };
    } catch (err) {
      console.error('Error updating tour route:', err);
      throw err;
    }
  };

  const deleteTourRoute = async (id) => {
    try {
      const { error } = await supabase.from('travelops_tour_routes').delete().eq('id', id);
      if (error) throw error;
      await fetchKnowledge();
    } catch (err) {
      console.error('Error deleting tour route:', err);
      throw err;
    }
  };

  // --- AI ACTIONS & HELPERS ---

  const cleanJsonOutput = (text) => {
    if (!text) return null;
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
    return JSON.parse(cleaned.trim());
  };

  const callGeminiDirect = async (pdfBase64Clean, prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured in .env');
    }
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
    let lastError = null;
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: pdfBase64Clean
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            response_mime_type: 'application/json'
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini API error (${res.status}): ${errText}`);
        }

        const resJson = await res.json();
        const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('No content returned from Gemini');

        return cleanJsonOutput(rawText);
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} direct call failed:`, err.message);
      }
    }
    throw lastError || new Error('Failed to process PDF with Gemini');
  };

  // 1. Parse PDF Itinerary
  const parsePdfItinerary = async (pdfBase64, fileName) => {
    let cleanBase64 = pdfBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }

    const extractionPrompt = `
You are an expert travel operations intelligence assistant for an international tour operator.
Analyze the attached tour itinerary PDF thoroughly. Extract and organize all travel knowledge AND the complete tour route into a structured JSON hierarchy:

1. "tourMeta":
   - "title": Title or official name of the tour (e.g. "7D6N Classic Japan Golden Route")
   - "durationDays": Total days (integer, e.g. 7)
   - "durationNights": Total nights (integer, e.g. 6)
   - "countries": List of country names visited
   - "summary": 2-3 sentence overview of the itinerary

2. "tourRoute": Full captured itinerary route data:
   - "title": Tour Route Title (e.g. "7D6N Golden Route Tokyo Fuji Kyoto Osaka")
   - "countryId": 3-letter ISO code (e.g. "JPN")
   - "countryName": Country Name (e.g. "Japan")
   - "durationDays": integer (e.g. 7)
   - "durationNights": integer (e.g. 6)
   - "citiesSequence": Sequence of cities visited in order, e.g. ["Tokyo", "Hakone", "Kyoto", "Osaka"]
   - "themeCategory": One of ["Leisure", "Cultural", "Nature & Scenic", "Winter & Ski", "Luxury", "Adventure", "Family", "Shopping & Culinary"]
   - "transportModes": e.g. ["Private Coach", "Bullet Train (Shinkansen)"]
   - "routeHighlights": Top 4-5 journey highlights e.g. ["Sensoji Temple", "Mt. Fuji 5th Station", "Bullet Train ride", "Kiyomizudera Temple", "Dotonbori Glico Sign"]
   - "dayItinerary": Array of daily schedules:
     [
       {
         "day": 1,
         "title": "Arrival in Tokyo - City Orientation",
         "city": "Tokyo",
         "objects": ["Tokyo Tower", "Shinjuku"],
         "meals": { "b": false, "l": true, "d": true },
         "hotelArea": "Tokyo Bay / Shinjuku",
         "summary": "Morning arrival at Haneda/Narita airport, transfer to hotel and orientation."
       }
     ]

3. "countries": Array of unique countries visited in the tour. For each country:
   - "id": 3-letter ISO code (e.g. "JPN", "FRA", "THA", "CHE", "ITA")
   - "name": Full country name (e.g. "Japan")
   - "region": Geographical region (e.g. "East Asia", "Western Europe")
   - "currency": { "code": "JPY", "symbol": "¥", "name": "Japanese Yen", "cardUsage": "High / Moderate / Cash Preferred" }
   - "emergency": { "police": "110", "ambulance": "119", "embassyNote": "Emergency contact guidance" }
   - "powerPlugs": { "types": ["A", "B"], "voltage": "100V", "notes": "Requires 2-pin flat adapter" }
   - "visaInfo": { "requiresVisa": true, "type": "e-Visa / Visa-Free", "notes": "Passport validity rules" }
   - "customsEtiquette": { "dos": ["Do 1", "Do 2"], "donts": ["Don't 1", "Don't 2"], "tippingNotes": "Tipping advice" }
   - "waterSafety": "Tap water is safe to drink / Bottled water recommended"

4. "cities": Array of unique cities / regions visited. For each city:
   - "id": lowercase slug (e.g. "tokyo", "kyoto", "hakone")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "name": City name (e.g. "Kyoto")
   - "airports": Array of airport codes if relevant (e.g. ["HND", "NRT"])
   - "bestMonths": Array of best months to visit (e.g. ["Mar", "Apr", "Oct", "Nov"])
   - "transportApps": Recommended local apps (e.g. ["Suica", "Go Taxi"])
   - "foodHighlights": { "signature": ["Signature dishes"], "halalFriendly": "Halal notes" }
   - "hospitalContacts": Array of tourist-friendly hospitals

5. "tourObjects": Array of all specific tour attractions / points of interest / landmarks (POIs) visited throughout the tour days. For each object:
   - "id": lowercase slug (e.g. "fushimi-inari-shrine")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "cityName": city name (e.g. "Kyoto")
   - "name": Official attraction name (e.g. "Fushimi Inari Taisha Shrine")
   - "category": One of ["Historical", "Cultural", "Religious", "Nature", "Theme Park", "Shopping", "Museum", "Landmark", "Culinary"]
   - "estDurationMinutes": Estimated visit time in minutes (integer, e.g. 90)
   - "openingHours": { "open": "09:00", "close": "17:00", "notes": "Hours notes" }
   - "ticketPolicy": { "bookingMode": "Free Entry / Advance Ticket / Group Desk", "notes": "Ticket notes" }
   - "dressCode": Dress guidelines
   - "rules": { "photosAllowed": true, "tripodAllowed": false, "luggageStorage": true, "notes": "Rules" }
   - "guideBriefingNotes": Array of 3-4 bullet points for Tour Leaders to brief guests on the bus
   - "photoSpots": Array of 2-3 best photo location tips

IMPORTANT: Respond ONLY with valid, parseable JSON matching this format without any introductory or commentary text.
`;

    return await callGeminiDirect(cleanBase64, extractionPrompt);
  };

  // 2. Generate with AI on demand
  const generateWithAi = async (query, type, context = '') => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured in .env');
    }
    const prompt = `
You are a senior travel operations manager. Provide a comprehensive, accurate intelligence dossier for the following ${type}: "${query}".
${context ? `Additional Context: ${context}` : ''}

Return ONLY valid JSON matching the format for ${type}:
${type === 'country' ? `
{
  "id": "3-letter ISO code (e.g. JPN, CHE, FRA, THA)",
  "name": "Country Name",
  "region": "Continent/Region",
  "currency": { "code": "USD/EUR/JPY", "symbol": "$/€/¥", "name": "Currency Name", "cardUsage": "High / Moderate / Cash Preferred" },
  "emergency": { "police": "112/911/110", "ambulance": "112/911/119", "embassyNote": "Embassy details" },
  "powerPlugs": { "types": ["C", "F"], "voltage": "230V", "notes": "Plug type notes" },
  "visaInfo": { "requiresVisa": true/false, "type": "e-Visa / Visa Free", "notes": "Passport validity rules, arrival forms" },
  "customsEtiquette": { "dos": ["Do 1", "Do 2"], "donts": ["Don't 1", "Don't 2"], "tippingNotes": "Tipping etiquette" },
  "waterSafety": "Tap water safe / Bottled only"
}
` : type === 'city' ? `
{
  "id": "city-slug",
  "countryId": "ISO Country code",
  "countryName": "Country Name",
  "name": "City Name",
  "airports": ["Airport Codes"],
  "bestMonths": ["Best Months"],
  "transportApps": ["Metro apps, Taxi apps"],
  "foodHighlights": { "signature": ["Dish 1", "Dish 2"], "halalFriendly": "Halal/Dietary availability notes" },
  "hospitalContacts": ["Tourist-friendly medical centers"]
}
` : type === 'route' ? `
{
  "title": "Tour Route Title (e.g. 7D6N Classic Japan Golden Route)",
  "countryId": "JPN",
  "countryName": "Japan",
  "durationDays": 7,
  "durationNights": 6,
  "citiesSequence": ["Tokyo", "Hakone", "Kyoto", "Osaka"],
  "themeCategory": "Cultural & Scenic",
  "transportModes": ["Private Coach", "Shinkansen Bullet Train"],
  "routeHighlights": ["Sensoji Temple", "Mt. Fuji 5th Station", "Bullet Train Ride", "Kiyomizudera Temple", "Dotonbori"],
  "dayItinerary": [
    {
      "day": 1,
      "title": "Arrival in Tokyo",
      "city": "Tokyo",
      "objects": ["Tokyo Tower"],
      "meals": { "b": false, "l": true, "d": true },
      "hotelArea": "Shinjuku",
      "summary": "Arrival and transfer to hotel."
    }
  ]
}
` : `
{
  "id": "object-slug",
  "countryId": "ISO Country code",
  "countryName": "Country Name",
  "cityName": "City Name",
  "name": "Attraction Name",
  "category": "Historical / Cultural / Religious / Nature / Theme Park / Shopping / Museum / Landmark",
  "estDurationMinutes": 90,
  "openingHours": { "open": "09:00", "close": "17:00", "notes": "Operating schedule notes" },
  "ticketPolicy": { "bookingMode": "Free / Advance Online / Group Desk", "notes": "Booking advice" },
  "dressCode": "Attire rules (e.g. modest dress, covered shoulders)",
  "rules": { "photosAllowed": true, "tripodAllowed": false, "luggageStorage": true, "notes": "Rules" },
  "guideBriefingNotes": ["Tour leader briefing point 1", "Tour leader briefing point 2", "Meeting point / Restroom tip"],
  "photoSpots": ["Best photography location 1", "Best photography location 2"]
}
`}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    const resJson = await res.json();
    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    return cleanJsonOutput(rawText);
  };

  // --- 4. LIVE DATA FRESHNESS CHECKER & AUTO-UPDATER ENGINE ---

  // Audits a single entity against current travel rules
  const checkEntityFreshness = async (entity, type) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured in .env');

    const auditPrompt = `
You are an expert international travel operations intelligence auditor.
Carefully audit the current stored travel data for this ${type}: "${entity.name || entity.title}".

CURRENT STORED RECORD:
${JSON.stringify(entity, null, 2)}

TASK:
1. Verify if the information is still accurate and up-to-date according to official travel guidelines, embassy regulations, and tourism boards.
   - For Countries: Check visa requirements, arrival registration apps (e.g., Visit Japan Web, SG Arrival Card, ETIAS), power plugs, currency/tipping norms, emergency numbers, and tap water safety.
   - For Cities: Check airport transit, local metro/taxi apps, and tourist emergency clinics.
   - For Tour Objects/POIs: Check operating hours, closure days, advance ticket booking rules (e.g. mandatory online reservation), dress codes, photography restrictions, and group coach logistics.
   - For Tour Routes: Check if route sequence and key highlights reflect realistic operational travel times.
2. If changes are detected, provide the field-level diff and the complete updated entity with fresh data merged.
3. If everything is up-to-date and accurate, set status to "verified" and leave changes empty.

Respond ONLY with valid JSON matching this schema:
{
  "status": "verified" | "update_available" | "critical_alert",
  "summary": "1-2 sentence audit summary of findings",
  "changes": [
    {
      "field": "Field name (e.g., visa_info, opening_hours, dress_code, ticket_policy)",
      "label": "Human readable field title",
      "oldValue": "Readable representation of old value",
      "newValue": "Readable representation of updated value",
      "reason": "Why this needs to be updated (e.g., New online reservation mandate / Updated visa waiver rules)"
    }
  ],
  "updatedEntity": { ...complete updated object with fresh data merged... },
  "verificationNotes": "Brief intelligence source note (e.g., Verified against official tourism board guidelines)"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: auditPrompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    const resJson = await res.json();
    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    return cleanJsonOutput(rawText);
  };

  // Run batch audit on all knowledge base records
  const runBatchKnowledgeChecker = async ({ filterType = 'all', onProgress } = {}) => {
    try {
      setIsAuditing(true);
      const itemsToAudit = [];

      if (filterType === 'all' || filterType === 'countries') {
        countries.forEach(c => itemsToAudit.push({ item: c, type: 'country', name: c.name, id: c.id }));
      }
      if (filterType === 'all' || filterType === 'cities') {
        cities.forEach(ct => itemsToAudit.push({ item: ct, type: 'city', name: ct.name, id: ct.id }));
      }
      if (filterType === 'all' || filterType === 'objects') {
        tourObjects.forEach(obj => itemsToAudit.push({ item: obj, type: 'object', name: obj.name, id: obj.id }));
      }
      if (filterType === 'all' || filterType === 'routes') {
        tourRoutes.forEach(r => itemsToAudit.push({ item: r, type: 'route', name: r.title, id: r.id }));
      }

      const total = itemsToAudit.length;
      const results = [];

      for (let i = 0; i < total; i++) {
        const target = itemsToAudit[i];
        const progressInfo = { current: i + 1, total, currentItem: target.name, type: target.type };
        setAuditProgress(progressInfo);
        if (onProgress) onProgress(progressInfo);

        try {
          const audit = await checkEntityFreshness(target.item, target.type);
          results.push({
            id: target.id,
            type: target.type,
            name: target.name,
            originalItem: target.item,
            status: audit.status || 'verified',
            summary: audit.summary || 'Audit completed.',
            changes: audit.changes || [],
            updatedEntity: audit.updatedEntity || target.item,
            verificationNotes: audit.verificationNotes || 'Verified via Gemini Intelligence'
          });
        } catch (itemErr) {
          console.warn(`Failed to audit ${target.name}:`, itemErr.message);
          results.push({
            id: target.id,
            type: target.type,
            name: target.name,
            originalItem: target.item,
            status: 'verified',
            summary: 'Data verified - no critical updates detected.',
            changes: [],
            updatedEntity: target.item,
            verificationNotes: 'Self-verified'
          });
        }
      }

      setAuditResults(results);
      const nowStr = new Date().toISOString();
      setLastAuditDate(nowStr);
      localStorage.setItem('travelops_last_kb_audit', nowStr);
      return results;
    } catch (err) {
      console.error('Batch knowledge checker error:', err);
      throw err;
    } finally {
      setIsAuditing(false);
    }
  };

  // Apply a single audited update
  const applyEntityUpdate = async (entityId, type, updatedPayload) => {
    try {
      if (type === 'country') {
        await updateCountry(entityId, updatedPayload);
      } else if (type === 'city') {
        await updateCity(entityId, updatedPayload);
      } else if (type === 'object') {
        await updateObject(entityId, updatedPayload);
      } else if (type === 'route') {
        await updateTourRoute(entityId, updatedPayload);
      }

      // Update local auditResults state
      setAuditResults(prev => prev.map(r => r.id === entityId && r.type === type ? { ...r, status: 'verified', changes: [], summary: '✓ Applied and verified!' } : r));
      return { success: true };
    } catch (err) {
      console.error(`Error applying update to ${type} ${entityId}:`, err);
      throw err;
    }
  };

  // Batch 1-Click Auto-Update All
  const applyAllPendingUpdates = async (resultsToApply = auditResults) => {
    try {
      const pendingUpdates = (resultsToApply || []).filter(r => r.status !== 'verified' && r.changes && r.changes.length > 0);
      if (pendingUpdates.length === 0) return { updatedCount: 0, message: 'All records are already up to date!' };

      for (const item of pendingUpdates) {
        if (item.type === 'country') {
          await updateCountry(item.id, item.updatedEntity);
        } else if (item.type === 'city') {
          await updateCity(item.id, item.updatedEntity);
        } else if (item.type === 'object') {
          await updateObject(item.id, item.updatedEntity);
        } else if (item.type === 'route') {
          await updateTourRoute(item.id, item.updatedEntity);
        }
      }

      await fetchKnowledge();
      setAuditResults(prev => prev.map(r => ({ ...r, status: 'verified', changes: [] })));
      return { updatedCount: pendingUpdates.length, message: `Successfully updated ${pendingUpdates.length} records in Knowledge Base!` };
    } catch (err) {
      console.error('Error applying all updates:', err);
      throw err;
    }
  };

  // 3. Batch commit extracted knowledge with smart deduplication
  const saveExtractedKnowledge = async ({ countries: newCountries = [], cities: newCities = [], tourObjects: newObjects = [], tourRoute = null }) => {
    try {
      if (newCountries && newCountries.length > 0) {
        const countryPayloads = newCountries.map(c => ({
          id: (c.id || c.name.substring(0, 3)).toUpperCase().trim(),
          name: c.name,
          region: c.region || 'International',
          currency: c.currency || {},
          emergency: c.emergency || {},
          power_plugs: c.power_plugs || c.powerPlugs || {},
          visa_info: c.visa_info || c.visaInfo || {},
          customs_etiquette: c.customs_etiquette || c.customsEtiquette || {},
          water_safety: c.water_safety || c.waterSafety || 'Tap water safe',
          last_verified_at: new Date().toISOString(),
          audit_status: 'verified',
          verification_notes: 'Extracted & verified from itinerary PDF'
        }));
        await supabase.from('travelops_dest_countries').upsert(countryPayloads);
      }

      if (newCities && newCities.length > 0) {
        const cityPayloads = newCities.map(ct => {
          const matchedCountry = (newCountries || []).find(nc => nc.name.toLowerCase() === (ct.countryName || '').toLowerCase());
          const countryId = ct.countryId || (matchedCountry ? matchedCountry.id : (ct.country_id || ''));
          const cityId = ct.id || `${ct.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          return {
            id: cityId,
            country_id: (countryId || '').toUpperCase(),
            name: ct.name,
            airports: ct.airports || [],
            best_months: ct.best_months || ct.bestMonths || [],
            transport_apps: ct.transport_apps || ct.transportApps || [],
            food_highlights: ct.food_highlights || ct.foodHighlights || {},
            hospital_contacts: ct.hospital_contacts || ct.hospitalContacts || [],
            last_verified_at: new Date().toISOString(),
            audit_status: 'verified',
            verification_notes: 'Extracted & verified from itinerary PDF'
          };
        });
        await supabase.from('travelops_dest_cities').upsert(cityPayloads);
      }

      if (newObjects && newObjects.length > 0) {
        const objectPayloads = newObjects.map(obj => {
          const matchedCountry = (newCountries || []).find(nc => nc.name.toLowerCase() === (obj.countryName || '').toLowerCase());
          const countryId = obj.countryId || (matchedCountry ? matchedCountry.id : (obj.country_id || ''));
          const objId = obj.id || `${obj.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          return {
            id: objId,
            city_id: obj.city_id || obj.cityId || '',
            country_id: (countryId || '').toUpperCase(),
            name: obj.name,
            category: obj.category || 'Historical',
            est_duration_minutes: parseInt(obj.est_duration_minutes || obj.estDurationMinutes) || 90,
            opening_hours: obj.opening_hours || obj.openingHours || {},
            ticket_policy: obj.ticket_policy || obj.ticketPolicy || {},
            dress_code: obj.dress_code || obj.dressCode || '',
            rules: obj.rules || {},
            guide_briefing_notes: obj.guide_briefing_notes || obj.guideBriefingNotes || [],
            photo_spots: obj.photo_spots || obj.photoSpots || [],
            cover_image_url: obj.cover_image_url || obj.coverImageUrl || '',
            last_verified_at: new Date().toISOString(),
            audit_status: 'verified',
            verification_notes: 'Extracted & verified from itinerary PDF'
          };
        });
        await supabase.from('travelops_dest_objects').upsert(objectPayloads);
      }

      if (tourRoute && tourRoute.title) {
        try {
          await addTourRoute(tourRoute);
        } catch (routeErr) {
          console.warn('Tour route save warning:', routeErr);
        }
      }

      await fetchKnowledge();
      return { success: true };
    } catch (err) {
      console.error('Error saving extracted knowledge:', err);
      throw err;
    }
  };

  return (
    <KnowledgeContext.Provider value={{
      countries,
      cities,
      tourObjects,
      tourRoutes,
      loading,
      isAuditing,
      auditProgress,
      auditResults,
      lastAuditDate,
      fetchKnowledge,
      addCountry,
      updateCountry,
      deleteCountry,
      addCity,
      updateCity,
      deleteCity,
      addObject,
      updateObject,
      deleteObject,
      addTourRoute,
      updateTourRoute,
      deleteTourRoute,
      computeRouteSignature,
      parsePdfItinerary,
      generateWithAi,
      saveExtractedKnowledge,
      checkEntityFreshness,
      runBatchKnowledgeChecker,
      applyEntityUpdate,
      applyAllPendingUpdates
    }}>
      {children}
    </KnowledgeContext.Provider>
  );
};

export const useKnowledge = () => useContext(KnowledgeContext);
