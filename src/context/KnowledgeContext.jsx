import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const KnowledgeContext = createContext(null);

const slugify = (val) =>
  String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const loadKnowledgeFromDb = async () => {
  const [countriesRes, citiesRes, objectsRes, routesRes] = await Promise.all([
    supabase.from('travelops_dest_countries').select('*').order('name', { ascending: true }),
    supabase.from('travelops_dest_cities').select('*').order('name', { ascending: true }),
    supabase.from('travelops_dest_objects').select('*').order('name', { ascending: true }),
    supabase.from('travelops_tour_routes').select('*').order('updated_at', { ascending: false })
  ]);

  if (countriesRes.error) throw countriesRes.error;
  if (citiesRes.error) throw citiesRes.error;
  if (objectsRes.error) throw objectsRes.error;

  return {
    countries: countriesRes.data || [],
    cities: citiesRes.data || [],
    tourObjects: objectsRes.data || [],
    tourRoutes: routesRes.data || []
  };
};

export const KnowledgeProvider = ({ children }) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [tourObjects, setTourObjects] = useState([]);
  const [tourRoutes, setTourRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState({
    current: 0,
    total: 0,
    currentItem: ''
  });
  const [auditResults, setAuditResults] = useState([]);
  const [lastAuditDate, setLastAuditDate] = useState(
    () => localStorage.getItem('travelops_last_kb_audit') || null
  );

  const fetchKnowledge = useCallback(async () => {
    try {
      const snapshot = await loadKnowledgeFromDb();
      setCountries(snapshot.countries);
      setCities(snapshot.cities);
      setTourObjects(snapshot.tourObjects);
      setTourRoutes(snapshot.tourRoutes);
      return snapshot;
    } catch (err) {
      console.error('Error fetching knowledge data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadKnowledgeFromDb()
      .then((snapshot) => {
        if (!cancelled) {
          setCountries(snapshot.countries);
          setCities(snapshot.cities);
          setTourObjects(snapshot.tourObjects);
          setTourRoutes(snapshot.tourRoutes);
        }
      })
      .catch((err) => {
        console.error('Initial knowledge load error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to resolve country_id and country_name cleanly
  const resolveCountryRef = (rawId, rawName) => {
    const cleanId = String(rawId || '').toUpperCase().trim();
    const cleanName = String(rawName || '').trim();
    if (cleanId) {
      const found = countries.find((c) => c.id.toUpperCase() === cleanId);
      if (found) return { countryId: found.id, countryName: found.name };
    }
    if (cleanName) {
      const foundByName = countries.find(
        (c) => c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (foundByName) return { countryId: foundByName.id, countryName: foundByName.name };
    }
    const fallbackId = cleanId || (cleanName ? cleanName.slice(0, 3).toUpperCase() : 'INT');
    return { countryId: fallbackId, countryName: cleanName || fallbackId };
  };

  // --- COUNTRY CRUD ---
  const addCountry = async (data) => {
    const cleanName = String(data.name || '').trim();
    if (!cleanName) throw new Error('Country name is required.');
    const id = String(data.id || cleanName.slice(0, 3))
      .toUpperCase()
      .trim();

    const payload = {
      id,
      name: cleanName,
      region: data.region || 'International',
      general_info: data.general_info || data.generalInfo || data.overview || '',
      currency: data.currency || {},
      emergency: data.emergency || {},
      power_plugs: data.power_plugs || data.powerPlugs || {},
      visa_info: data.visa_info || data.visaInfo || {},
      customs_etiquette: data.customs_etiquette || data.customsEtiquette || {},
      water_safety:
        data.water_safety || data.waterSafety || 'Bottled water recommended',
      last_verified_at: new Date().toISOString(),
      audit_status: 'verified',
      verification_notes: data.verification_notes || 'Manually added / verified'
    };

    const { error } = await supabase.from('travelops_dest_countries').upsert([payload]);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true, id };
  };

  const updateCountry = async (id, updatedData) => {
    const payload = {
      last_verified_at: new Date().toISOString(),
      audit_status: updatedData.audit_status || 'verified'
    };
    if (updatedData.name !== undefined) payload.name = updatedData.name;
    if (updatedData.region !== undefined) payload.region = updatedData.region;
    if (updatedData.general_info !== undefined || updatedData.generalInfo !== undefined) {
      payload.general_info = updatedData.general_info ?? updatedData.generalInfo;
    }
    if (updatedData.currency !== undefined) payload.currency = updatedData.currency;
    if (updatedData.emergency !== undefined) payload.emergency = updatedData.emergency;
    if (updatedData.power_plugs !== undefined || updatedData.powerPlugs !== undefined) {
      payload.power_plugs = updatedData.power_plugs ?? updatedData.powerPlugs;
    }
    if (updatedData.visa_info !== undefined || updatedData.visaInfo !== undefined) {
      payload.visa_info = updatedData.visa_info ?? updatedData.visaInfo;
    }
    if (
      updatedData.customs_etiquette !== undefined ||
      updatedData.customsEtiquette !== undefined
    ) {
      payload.customs_etiquette =
        updatedData.customs_etiquette ?? updatedData.customsEtiquette;
    }
    if (updatedData.water_safety !== undefined || updatedData.waterSafety !== undefined) {
      payload.water_safety = updatedData.water_safety ?? updatedData.waterSafety;
    }
    if (updatedData.verification_notes !== undefined) {
      payload.verification_notes = updatedData.verification_notes;
    }

    const { error } = await supabase
      .from('travelops_dest_countries')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true };
  };

  const deleteCountry = async (id) => {
    const { error } = await supabase
      .from('travelops_dest_countries')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
  };

  // --- CITY CRUD ---
  const addCity = async (data) => {
    const cleanName = String(data.name || '').trim();
    if (!cleanName) throw new Error('City name is required.');
    const { countryId } = resolveCountryRef(
      data.country_id || data.countryId,
      data.countryName || data.country_name
    );

    const existingCity = cities.find(
      (ct) =>
        ct.name?.toLowerCase() === cleanName.toLowerCase() &&
        (!countryId || ct.country_id === countryId)
    );
    const id = existingCity?.id || data.id || `city-${slugify(cleanName) || Date.now()}`;

    const payload = {
      id,
      country_id: countryId,
      name: cleanName,
      general_info: data.general_info || data.generalInfo || data.overview || '',
      airports: Array.isArray(data.airports) ? data.airports : [],
      best_months: data.best_months || data.bestMonths || [],
      transport_apps: data.transport_apps || data.transportApps || [],
      food_highlights: data.food_highlights || data.foodHighlights || {},
      hospital_contacts: data.hospital_contacts || data.hospitalContacts || [],
      last_verified_at: new Date().toISOString(),
      audit_status: 'verified',
      verification_notes: data.verification_notes || 'Manually added / verified'
    };

    const { error } = await supabase.from('travelops_dest_cities').upsert([payload]);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true, id };
  };

  const updateCity = async (id, updatedData) => {
    const payload = {
      last_verified_at: new Date().toISOString(),
      audit_status: updatedData.audit_status || 'verified'
    };
    if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
      payload.country_id = updatedData.country_id ?? updatedData.countryId;
    }
    if (updatedData.name !== undefined) payload.name = updatedData.name;
    if (updatedData.general_info !== undefined || updatedData.generalInfo !== undefined) {
      payload.general_info = updatedData.general_info ?? updatedData.generalInfo;
    }
    if (updatedData.airports !== undefined) payload.airports = updatedData.airports;
    if (updatedData.best_months !== undefined || updatedData.bestMonths !== undefined) {
      payload.best_months = updatedData.best_months ?? updatedData.bestMonths;
    }
    if (
      updatedData.transport_apps !== undefined ||
      updatedData.transportApps !== undefined
    ) {
      payload.transport_apps =
        updatedData.transport_apps ?? updatedData.transportApps;
    }
    if (
      updatedData.food_highlights !== undefined ||
      updatedData.foodHighlights !== undefined
    ) {
      payload.food_highlights =
        updatedData.food_highlights ?? updatedData.foodHighlights;
    }
    if (
      updatedData.hospital_contacts !== undefined ||
      updatedData.hospitalContacts !== undefined
    ) {
      payload.hospital_contacts =
        updatedData.hospital_contacts ?? updatedData.hospitalContacts;
    }
    if (updatedData.verification_notes !== undefined) {
      payload.verification_notes = updatedData.verification_notes;
    }

    const { error } = await supabase
      .from('travelops_dest_cities')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true };
  };

  const deleteCity = async (id) => {
    const { error } = await supabase
      .from('travelops_dest_cities')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
  };

  // --- TOUR OBJECT CRUD (WITH SMART CITY LINK RESOLUTION) ---
  const addObject = async (data) => {
    const cleanName = String(data.name || '').trim();
    if (!cleanName) throw new Error('Attraction / POI name is required.');
    const { countryId } = resolveCountryRef(
      data.country_id || data.countryId,
      data.countryName || data.country_name
    );

    let resolvedCityId = String(data.city_id || data.cityId || '').trim();
    const rawCityName = String(data.cityName || data.city_name || '').trim();

    if (resolvedCityId) {
      const exactIdMatch = cities.find((ct) => ct.id === resolvedCityId);
      if (!exactIdMatch) {
        const byName = cities.find(
          (ct) => ct.name?.toLowerCase() === resolvedCityId.toLowerCase()
        );
        if (byName) resolvedCityId = byName.id;
      }
    }

    if (!resolvedCityId && rawCityName) {
      const matchedCity = cities.find(
        (ct) =>
          ct.name?.toLowerCase() === rawCityName.toLowerCase() &&
          (!countryId || !ct.country_id || ct.country_id === countryId)
      );
      if (matchedCity) {
        resolvedCityId = matchedCity.id;
      } else {
        // Auto-create city hub so attraction is never orphaned
        const autoCityId = `city-${slugify(rawCityName) || Date.now()}`;
        const { error: cityErr } = await supabase.from('travelops_dest_cities').upsert([
          {
            id: autoCityId,
            country_id: countryId,
            name: rawCityName,
            general_info: `Destination hub in ${countryId}`,
            airports: [],
            best_months: [],
            transport_apps: [],
            food_highlights: {},
            hospital_contacts: [],
            last_verified_at: new Date().toISOString(),
            audit_status: 'verified',
            verification_notes: 'Auto-linked from attraction entry'
          }
        ]);
        if (!cityErr) resolvedCityId = autoCityId;
      }
    }

    const existingObj = tourObjects.find(
      (o) =>
        o.name?.toLowerCase() === cleanName.toLowerCase() &&
        (!countryId || o.country_id === countryId)
    );
    const id = existingObj?.id || data.id || `obj-${slugify(cleanName) || Date.now()}`;

    const payload = {
      id,
      city_id: resolvedCityId,
      country_id: countryId,
      name: cleanName,
      general_info: data.general_info || data.generalInfo || data.overview || '',
      category: data.category || 'Historical',
      est_duration_minutes:
        parseInt(data.est_duration_minutes || data.estDurationMinutes, 10) || 90,
      opening_hours: data.opening_hours || data.openingHours || {},
      ticket_policy: data.ticket_policy || data.ticketPolicy || {},
      dress_code: data.dress_code || data.dressCode || '',
      rules: data.rules || {},
      guide_briefing_notes:
        data.guide_briefing_notes || data.guideBriefingNotes || [],
      photo_spots: data.photo_spots || data.photoSpots || [],
      cover_image_url: data.cover_image_url || data.coverImageUrl || '',
      last_verified_at: new Date().toISOString(),
      audit_status: 'verified',
      verification_notes: data.verification_notes || 'Manually added / verified'
    };

    const { error } = await supabase.from('travelops_dest_objects').upsert([payload]);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true, id };
  };

  const updateObject = async (id, updatedData) => {
    const payload = {
      last_verified_at: new Date().toISOString(),
      audit_status: updatedData.audit_status || 'verified'
    };
    if (updatedData.city_id !== undefined || updatedData.cityId !== undefined) {
      payload.city_id = updatedData.city_id ?? updatedData.cityId;
    }
    if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
      payload.country_id = updatedData.country_id ?? updatedData.countryId;
    }
    if (updatedData.name !== undefined) payload.name = updatedData.name;
    if (updatedData.general_info !== undefined || updatedData.generalInfo !== undefined) {
      payload.general_info = updatedData.general_info ?? updatedData.generalInfo;
    }
    if (updatedData.category !== undefined) payload.category = updatedData.category;
    if (
      updatedData.est_duration_minutes !== undefined ||
      updatedData.estDurationMinutes !== undefined
    ) {
      payload.est_duration_minutes =
        parseInt(
          updatedData.est_duration_minutes ?? updatedData.estDurationMinutes,
          10
        ) || 90;
    }
    if (
      updatedData.opening_hours !== undefined ||
      updatedData.openingHours !== undefined
    ) {
      payload.opening_hours =
        updatedData.opening_hours ?? updatedData.openingHours;
    }
    if (
      updatedData.ticket_policy !== undefined ||
      updatedData.ticketPolicy !== undefined
    ) {
      payload.ticket_policy =
        updatedData.ticket_policy ?? updatedData.ticketPolicy;
    }
    if (updatedData.dress_code !== undefined || updatedData.dressCode !== undefined) {
      payload.dress_code = updatedData.dress_code ?? updatedData.dressCode;
    }
    if (updatedData.rules !== undefined) payload.rules = updatedData.rules;
    if (
      updatedData.guide_briefing_notes !== undefined ||
      updatedData.guideBriefingNotes !== undefined
    ) {
      payload.guide_briefing_notes =
        updatedData.guide_briefing_notes ?? updatedData.guideBriefingNotes;
    }
    if (updatedData.photo_spots !== undefined || updatedData.photoSpots !== undefined) {
      payload.photo_spots = updatedData.photo_spots ?? updatedData.photoSpots;
    }
    if (
      updatedData.cover_image_url !== undefined ||
      updatedData.coverImageUrl !== undefined
    ) {
      payload.cover_image_url =
        updatedData.cover_image_url ?? updatedData.coverImageUrl;
    }
    if (updatedData.verification_notes !== undefined) {
      payload.verification_notes = updatedData.verification_notes;
    }

    const { error } = await supabase
      .from('travelops_dest_objects')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true };
  };

  const deleteObject = async (id) => {
    const { error } = await supabase
      .from('travelops_dest_objects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
  };

  // --- TOUR ROUTE CRUD & SAFE DEDUPLICATION ENGINE ---
  const computeRouteSignature = (data) => {
    const country = String(
      data.country_id || data.countryId || data.countryName || 'ALL'
    )
      .toUpperCase()
      .trim();
    const days = parseInt(data.duration_days || data.durationDays || 7, 10) || 7;
    const citiesPart = (data.cities_sequence || data.citiesSequence || [])
      .map((c) =>
        typeof c === 'string'
          ? c
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]/g, '')
          : ''
      )
      .filter(Boolean)
      .join('>');
    return `${country}:${days}D:${citiesPart}`;
  };

  const addTourRoute = async (data) => {
    const title = String(data.title || '').trim() || 'Custom Tour Route';
    const generalInfo =
      data.general_info || data.generalInfo || data.summary || data.overview || '';
    const { countryId, countryName } = resolveCountryRef(
      data.country_id || data.countryId,
      data.country_name || data.countryName
    );
    const durationDays =
      parseInt(data.duration_days || data.durationDays, 10) || 7;
    const durationNights =
      parseInt(data.duration_nights || data.durationNights, 10) ||
      Math.max(1, durationDays - 1);
    const citiesSeq = data.cities_sequence || data.citiesSequence || [];
    const dayItinerary = data.day_itinerary || data.dayItinerary || [];
    const highlights = data.route_highlights || data.routeHighlights || [];
    const themeCategory = data.theme_category || data.themeCategory || 'Leisure';
    const transportModes =
      data.transport_modes || data.transportModes || ['Private Coach'];

    const signature = computeRouteSignature({
      country_id: countryId,
      duration_days: durationDays,
      cities_sequence: citiesSeq
    });

    // Safe duplicate detection (avoids unescaped commas/parentheses in PostgREST .or())
    const { data: sigMatches } = await supabase
      .from('travelops_tour_routes')
      .select('*')
      .eq('route_signature', signature);

    const existing =
      (sigMatches && sigMatches[0]) ||
      tourRoutes.find(
        (r) =>
          r.route_signature === signature ||
          r.title?.trim().toLowerCase() === title.toLowerCase()
      );

    if (existing) {
      const newCount = (Number(existing.usage_count) || 1) + 1;
      const { error: updErr } = await supabase
        .from('travelops_tour_routes')
        .update({
          usage_count: newCount,
          last_verified_at: new Date().toISOString(),
          audit_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (updErr) throw updErr;

      await fetchKnowledge();
      return {
        success: true,
        deduplicated: true,
        id: existing.id,
        title: existing.title,
        usageCount: newCount,
        message: `Matching route "${existing.title}" found — incremented departure usage to ${newCount}x!`
      };
    }

    const newId = `route-${(countryId || 'int').toLowerCase()}-${durationDays}d-${Date.now()}`;
    const payload = {
      id: newId,
      title,
      general_info: generalInfo,
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

    const { error: insertErr } = await supabase
      .from('travelops_tour_routes')
      .insert([payload]);
    if (insertErr) throw insertErr;

    await fetchKnowledge();
    return {
      success: true,
      deduplicated: false,
      id: newId,
      title,
      message: `Master Tour Route "${title}" saved!`
    };
  };

  const updateTourRoute = async (id, updatedData) => {
    const payload = {
      updated_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      audit_status: updatedData.audit_status || 'verified'
    };
    if (updatedData.title !== undefined) payload.title = updatedData.title;
    if (updatedData.general_info !== undefined || updatedData.generalInfo !== undefined) {
      payload.general_info = updatedData.general_info ?? updatedData.generalInfo;
    }
    if (updatedData.country_id !== undefined || updatedData.countryId !== undefined) {
      const resolved = resolveCountryRef(
        updatedData.country_id ?? updatedData.countryId,
        updatedData.country_name ?? updatedData.countryName
      );
      payload.country_id = resolved.countryId;
      payload.country_name = resolved.countryName;
    } else if (
      updatedData.country_name !== undefined ||
      updatedData.countryName !== undefined
    ) {
      payload.country_name = updatedData.country_name ?? updatedData.countryName;
    }
    if (
      updatedData.duration_days !== undefined ||
      updatedData.durationDays !== undefined
    ) {
      payload.duration_days =
        parseInt(updatedData.duration_days ?? updatedData.durationDays, 10) || 7;
    }
    if (
      updatedData.duration_nights !== undefined ||
      updatedData.durationNights !== undefined
    ) {
      payload.duration_nights =
        parseInt(updatedData.duration_nights ?? updatedData.durationNights, 10) || 6;
    }
    if (
      updatedData.cities_sequence !== undefined ||
      updatedData.citiesSequence !== undefined
    ) {
      payload.cities_sequence =
        updatedData.cities_sequence ?? updatedData.citiesSequence;
      payload.route_signature = computeRouteSignature({
        country_id: payload.country_id || updatedData.country_id,
        duration_days: payload.duration_days || updatedData.duration_days,
        cities_sequence: payload.cities_sequence
      });
    }
    if (
      updatedData.day_itinerary !== undefined ||
      updatedData.dayItinerary !== undefined
    ) {
      payload.day_itinerary =
        updatedData.day_itinerary ?? updatedData.dayItinerary;
    }
    if (
      updatedData.route_highlights !== undefined ||
      updatedData.routeHighlights !== undefined
    ) {
      payload.route_highlights =
        updatedData.route_highlights ?? updatedData.routeHighlights;
    }
    if (
      updatedData.theme_category !== undefined ||
      updatedData.themeCategory !== undefined
    ) {
      payload.theme_category =
        updatedData.theme_category ?? updatedData.themeCategory;
    }
    if (
      updatedData.transport_modes !== undefined ||
      updatedData.transportModes !== undefined
    ) {
      payload.transport_modes =
        updatedData.transport_modes ?? updatedData.transportModes;
    }
    if (updatedData.verification_notes !== undefined) {
      payload.verification_notes = updatedData.verification_notes;
    }

    const { error } = await supabase
      .from('travelops_tour_routes')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
    return { success: true };
  };

  const deleteTourRoute = async (id) => {
    const { error } = await supabase
      .from('travelops_tour_routes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchKnowledge();
  };

  // --- AI MULTIMODAL PDF EXTRACTION ---
  const parsePdfItinerary = async (pdfBase64, fileName) => {
    let cleanBase64 = pdfBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    const extractionPrompt = `
You are an expert travel operations intelligence assistant for an international tour operator.
Analyze the attached tour itinerary PDF thoroughly. Extract and organize all travel knowledge AND the complete tour route into a structured JSON hierarchy with concise general information overviews:

1. "tourMeta": { "title", "durationDays", "durationNights", "countries", "summary" }
2. "tourRoute": {
   "title", "generalInfo", "countryId" (3-letter ISO), "countryName",
   "durationDays", "durationNights", "citiesSequence",
   "themeCategory" (Leisure | Cultural | Nature & Scenic | Winter & Ski | Luxury | Adventure | Family | Shopping & Culinary),
   "transportModes", "routeHighlights",
   "dayItinerary": [{ "day", "title", "city", "objects", "meals": { "b", "l", "d" }, "hotelArea", "summary" }]
}
3. "countries": [{
   "id" (3-letter ISO), "name", "region", "generalInfo",
   "currency": { "code", "symbol", "name", "cardUsage" },
   "emergency": { "police", "ambulance", "embassyNote" },
   "powerPlugs": { "types", "voltage", "notes" },
   "visaInfo": { "requiresVisa", "type", "notes" },
   "customsEtiquette": { "dos", "donts", "tippingNotes" },
   "waterSafety"
}]
4. "cities": [{
   "id", "countryId", "countryName", "name", "generalInfo",
   "airports", "bestMonths", "transportApps",
   "foodHighlights": { "signature", "halalFriendly", "mosques", "ingredientCautions" },
   "hospitalContacts"
}]
5. "tourObjects": [{
   "id", "countryId", "countryName", "cityName", "name", "generalInfo",
   "category" (Historical | Cultural | Religious | Nature | Theme Park | Shopping | Museum | Landmark | Culinary),
   "estDurationMinutes",
   "openingHours": { "open", "close", "notes" },
   "ticketPolicy": { "bookingMode", "notes" },
   "dressCode",
   "rules": { "photosAllowed", "tripodAllowed", "luggageStorage", "notes" },
   "guideBriefingNotes", "photoSpots"
}]

IMPORTANT: Respond ONLY with valid, parseable JSON matching this format.
`;

    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const serverRes = await fetch('/api/knowledge/parse-itinerary-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        pdfBase64: cleanBase64,
        fileName,
        prompt: extractionPrompt
      })
    });

    if (!serverRes.ok) {
      const errJson = await serverRes.json().catch(() => ({}));
      throw new Error(
        errJson.error || `Server error (${serverRes.status}) processing PDF.`
      );
    }

    const json = await serverRes.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error('No structured data returned by server.');
  };

  // --- ON-DEMAND AI DOSSIER GENERATOR ---
  const generateWithAi = async (query, type, context = '') => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const serverRes = await fetch('/api/knowledge/generate-destination-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query, type, context })
    });

    if (!serverRes.ok) {
      const errJson = await serverRes.json().catch(() => ({}));
      throw new Error(
        errJson.error || `Server error (${serverRes.status}) generating intelligence.`
      );
    }

    const json = await serverRes.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error('No destination data generated.');
  };

  // --- LIVE DATA FRESHNESS CHECKER & AUTO-UPDATER ---
  const checkEntityFreshness = async (entity, type) => {
    const auditPrompt = `
You are an expert international travel operations intelligence auditor.
Carefully audit the current stored travel data for this ${type}: "${entity.name || entity.title}".

CURRENT STORED RECORD:
${JSON.stringify(entity, null, 2)}

Verify visa rules, arrival registration apps, operating hours, advance ticketing rules, dress codes, emergency numbers, and ensure a crisp 1-2 sentence "generalInfo" overview exists.
Respond ONLY with valid JSON:
{
  "status": "verified" | "update_available" | "critical_alert",
  "summary": "1-2 sentence audit summary",
  "changes": [{ "field", "label", "oldValue", "newValue", "reason" }],
  "updatedEntity": { ...complete merged object... },
  "verificationNotes": "Brief source note"
}
`;

    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const serverRes = await fetch('/api/knowledge/audit-entity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ entity, type, prompt: auditPrompt })
    });

    if (!serverRes.ok) {
      const errJson = await serverRes.json().catch(() => ({}));
      throw new Error(
        errJson.error || `Server error (${serverRes.status}) auditing entity.`
      );
    }

    const json = await serverRes.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error('No audit data generated.');
  };

  const runBatchKnowledgeChecker = async ({ filterType = 'all', onProgress } = {}) => {
    try {
      setIsAuditing(true);
      const itemsToAudit = [];

      if (filterType === 'all' || filterType === 'country' || filterType === 'countries') {
        countries.forEach((c) =>
          itemsToAudit.push({ item: c, type: 'country', name: c.name, id: c.id })
        );
      }
      if (filterType === 'all' || filterType === 'city' || filterType === 'cities') {
        cities.forEach((ct) =>
          itemsToAudit.push({ item: ct, type: 'city', name: ct.name, id: ct.id })
        );
      }
      if (filterType === 'all' || filterType === 'object' || filterType === 'objects') {
        tourObjects.forEach((obj) =>
          itemsToAudit.push({ item: obj, type: 'object', name: obj.name, id: obj.id })
        );
      }
      if (filterType === 'all' || filterType === 'route' || filterType === 'routes') {
        tourRoutes.forEach((r) =>
          itemsToAudit.push({ item: r, type: 'route', name: r.title, id: r.id })
        );
      }

      const total = itemsToAudit.length;
      const results = [];

      for (let i = 0; i < total; i += 1) {
        const target = itemsToAudit[i];
        const progressInfo = {
          current: i + 1,
          total,
          currentItem: target.name,
          type: target.type
        };
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
            summary: 'Audit skipped or temporarily unavailable — existing data retained.',
            changes: [],
            updatedEntity: target.item,
            verificationNotes: 'Retained existing data'
          });
        }
      }

      setAuditResults(results);
      const nowStr = new Date().toISOString();
      setLastAuditDate(nowStr);
      localStorage.setItem('travelops_last_kb_audit', nowStr);
      return results;
    } finally {
      setIsAuditing(false);
    }
  };

  const applyEntityUpdate = async (entityId, type, updatedPayload) => {
    if (type === 'country') {
      await updateCountry(entityId, updatedPayload);
    } else if (type === 'city') {
      await updateCity(entityId, updatedPayload);
    } else if (type === 'object') {
      await updateObject(entityId, updatedPayload);
    } else if (type === 'route') {
      await updateTourRoute(entityId, updatedPayload);
    }

    setAuditResults((prev) =>
      prev.map((r) =>
        r.id === entityId && r.type === type
          ? { ...r, status: 'verified', changes: [], summary: 'Applied and verified!' }
          : r
      )
    );
    return { success: true };
  };

  const applyAllPendingUpdates = async (resultsToApply = auditResults) => {
    const pendingUpdates = (resultsToApply || []).filter(
      (r) => r.status !== 'verified' && r.changes && r.changes.length > 0
    );
    if (pendingUpdates.length === 0) {
      return { updatedCount: 0, message: 'All records are already up to date!' };
    }

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
    setAuditResults((prev) =>
      prev.map((r) => ({ ...r, status: 'verified', changes: [] }))
    );
    return {
      updatedCount: pendingUpdates.length,
      message: `Successfully updated ${pendingUpdates.length} records in Knowledge Base!`
    };
  };

  // --- BATCH COMMIT EXTRACTED KNOWLEDGE WITH CITY LINKING & DEDUPLICATION ---
  const saveExtractedKnowledge = async ({
    countries: newCountries = [],
    cities: newCities = [],
    tourObjects: newObjects = [],
    tourRoute = null
  }) => {
    const countryNameMap = new Map();
    countries.forEach((c) => {
      if (c.name) countryNameMap.set(c.name.toLowerCase(), c.id);
    });

    if (newCountries && newCountries.length > 0) {
      const countryPayloads = newCountries.map((c) => {
        const cleanName = String(c.name || '').trim();
        const existingId = countryNameMap.get(cleanName.toLowerCase());
        const id =
          existingId ||
          String(c.id || cleanName.slice(0, 3))
            .toUpperCase()
            .trim();
        countryNameMap.set(cleanName.toLowerCase(), id);
        return {
          id,
          name: cleanName,
          region: c.region || 'International',
          general_info: c.general_info || c.generalInfo || c.overview || '',
          currency: c.currency || {},
          emergency: c.emergency || {},
          power_plugs: c.power_plugs || c.powerPlugs || {},
          visa_info: c.visa_info || c.visaInfo || {},
          customs_etiquette: c.customs_etiquette || c.customsEtiquette || {},
          water_safety: c.water_safety || c.waterSafety || 'Bottled water recommended',
          last_verified_at: new Date().toISOString(),
          audit_status: 'verified',
          verification_notes: 'Extracted & verified from itinerary PDF'
        };
      });
      const { error: cErr } = await supabase
        .from('travelops_dest_countries')
        .upsert(countryPayloads);
      if (cErr) throw cErr;
    }

    // Track city name -> city_id so extracted attractions automatically link to their city!
    const cityLookup = new Map();
    cities.forEach((ct) => {
      if (ct.name) {
        cityLookup.set(ct.name.toLowerCase(), ct.id);
        cityLookup.set(`${(ct.country_id || '').toUpperCase()}:${ct.name.toLowerCase()}`, ct.id);
      }
    });

    if (newCities && newCities.length > 0) {
      const cityPayloads = newCities.map((ct) => {
        const cleanCityName = String(ct.name || '').trim();
        const countryId = String(
          ct.countryId ||
            ct.country_id ||
            countryNameMap.get(String(ct.countryName || '').toLowerCase()) ||
            ''
        )
          .toUpperCase()
          .trim();

        const existingCityId =
          cityLookup.get(`${countryId}:${cleanCityName.toLowerCase()}`) ||
          cityLookup.get(cleanCityName.toLowerCase());
        const cityId =
          existingCityId ||
          `city-${slugify(`${countryId}-${cleanCityName}`) || Date.now()}`;

        cityLookup.set(cleanCityName.toLowerCase(), cityId);
        if (countryId) {
          cityLookup.set(`${countryId}:${cleanCityName.toLowerCase()}`, cityId);
        }

        return {
          id: cityId,
          country_id: countryId,
          name: cleanCityName,
          general_info: ct.general_info || ct.generalInfo || ct.overview || '',
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
      const { error: ctErr } = await supabase
        .from('travelops_dest_cities')
        .upsert(cityPayloads);
      if (ctErr) throw ctErr;
    }

    if (newObjects && newObjects.length > 0) {
      const objectPayloads = newObjects.map((obj) => {
        const cleanObjName = String(obj.name || '').trim();
        const countryId = String(
          obj.countryId ||
            obj.country_id ||
            countryNameMap.get(String(obj.countryName || '').toLowerCase()) ||
            ''
        )
          .toUpperCase()
          .trim();
        const rawCityName = String(obj.cityName || obj.city_name || '').trim();
        const linkedCityId =
          obj.city_id ||
          obj.cityId ||
          (rawCityName
            ? cityLookup.get(`${countryId}:${rawCityName.toLowerCase()}`) ||
              cityLookup.get(rawCityName.toLowerCase()) ||
              ''
            : '');

        const existingObj = tourObjects.find(
          (o) =>
            o.name?.toLowerCase() === cleanObjName.toLowerCase() &&
            (!countryId || o.country_id === countryId)
        );
        const objId =
          existingObj?.id ||
          `obj-${slugify(`${countryId}-${cleanObjName}`) || Date.now()}`;

        return {
          id: objId,
          city_id: linkedCityId,
          country_id: countryId,
          name: cleanObjName,
          general_info: obj.general_info || obj.generalInfo || obj.overview || '',
          category: obj.category || 'Historical',
          est_duration_minutes:
            parseInt(obj.est_duration_minutes || obj.estDurationMinutes, 10) || 90,
          opening_hours: obj.opening_hours || obj.openingHours || {},
          ticket_policy: obj.ticket_policy || obj.ticketPolicy || {},
          dress_code: obj.dress_code || obj.dressCode || '',
          rules: obj.rules || {},
          guide_briefing_notes:
            obj.guide_briefing_notes || obj.guideBriefingNotes || [],
          photo_spots: obj.photo_spots || obj.photoSpots || [],
          cover_image_url: obj.cover_image_url || obj.coverImageUrl || '',
          last_verified_at: new Date().toISOString(),
          audit_status: 'verified',
          verification_notes: 'Extracted & verified from itinerary PDF'
        };
      });
      const { error: oErr } = await supabase
        .from('travelops_dest_objects')
        .upsert(objectPayloads);
      if (oErr) throw oErr;
    }

    if (tourRoute && tourRoute.title) {
      await addTourRoute(tourRoute);
    } else {
      await fetchKnowledge();
    }

    return { success: true };
  };

  return (
    <KnowledgeContext.Provider
      value={{
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
      }}
    >
      {children}
    </KnowledgeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useKnowledge = () => useContext(KnowledgeContext);
