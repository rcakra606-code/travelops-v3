// Pure helpers shared by the Travel Guide & Tips (Knowledge Base) page and its modals.

export const OBJECT_CATEGORIES = [
  'Historical',
  'Cultural',
  'Religious',
  'Nature',
  'Theme Park',
  'Shopping',
  'Museum',
  'Landmark',
  'Culinary'
];

export const ROUTE_THEMES = [
  'Leisure',
  'Cultural',
  'Nature & Scenic',
  'Winter & Ski',
  'Luxury',
  'Adventure',
  'Family',
  'Shopping & Culinary'
];

export const ENTITY_LABELS = {
  route: 'Master Tour Route',
  object: 'Attraction / POI',
  city: 'City & Hub',
  country: 'Country'
};

const CATEGORY_COLORS = {
  Historical: '#f59e0b',
  Cultural: '#8b5cf6',
  Religious: '#ec4899',
  Nature: '#10b981',
  'Nature & Scenic': '#10b981',
  'Theme Park': '#06b6d4',
  Shopping: '#3b82f6',
  'Shopping & Culinary': '#3b82f6',
  Museum: '#6366f1',
  Landmark: '#eab308',
  Culinary: '#f97316',
  'Winter & Ski': '#38bdf8',
  Luxury: '#eab308',
  Adventure: '#ef4444',
  Family: '#14b8a6',
  Leisure: '#0ea5e9'
};

export const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || 'var(--primary)';

export const isCancelledStatus = (status) => {
  const s = String(status || '').toLowerCase().trim();
  return s === 'cancel' || s === 'cancelled' || s === 'canceled';
};

// "a, b\nc" -> ['a','b','c']
export const splitList = (val, { newlineOnly = false } = {}) => {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  const pattern = newlineOnly ? /\n/ : /[\n,]/;
  return String(val || '')
    .split(pattern)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const joinList = (arr, sep = ', ') =>
  Array.isArray(arr) ? arr.filter(Boolean).join(sep) : String(arr || '');

const toText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.name || v.label || v.title || JSON.stringify(v);
  return String(v);
};

export const listText = (arr) => (Array.isArray(arr) ? arr.map(toText).filter(Boolean) : []);

export const formatDate = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const daysSince = (iso) => {
  if (!iso) return Infinity;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

export const freshnessBadge = (iso) => {
  const days = daysSince(iso);
  if (days <= 30) return { label: 'Fresh', color: '#10b981' };
  if (days <= 90) return { label: `${days}d old`, color: '#f59e0b' };
  if (days === Infinity) return { label: 'Unverified', color: '#ef4444' };
  return { label: `Stale · ${days}d`, color: '#ef4444' };
};

// ---------------------------------------------------------------------------
// Controlled form state <-> entity payload mapping (Create & Edit)
// ---------------------------------------------------------------------------

export const emptyForm = (type) => {
  switch (type) {
    case 'route':
      return {
        title: '',
        country_id: '',
        duration_days: 7,
        duration_nights: 6,
        theme_category: 'Leisure',
        transport_modes: 'Private Coach',
        cities_sequence: '',
        route_highlights: '',
        general_info: '',
        day_itinerary: []
      };
    case 'object':
      return {
        name: '',
        country_id: '',
        city_id: '',
        cityName: '',
        category: 'Historical',
        est_duration_minutes: 90,
        open: '',
        close: '',
        hoursNotes: '',
        bookingMode: '',
        ticketNotes: '',
        dress_code: '',
        photosAllowed: true,
        tripodAllowed: false,
        luggageStorage: false,
        rulesNotes: '',
        guide_briefing_notes: '',
        photo_spots: '',
        general_info: ''
      };
    case 'city':
      return {
        name: '',
        country_id: '',
        airports: '',
        best_months: '',
        transport_apps: '',
        halalFriendly: false,
        signatureDishes: '',
        mosques: '',
        ingredientCautions: '',
        hospital_contacts: '',
        general_info: ''
      };
    case 'country':
    default:
      return {
        id: '',
        name: '',
        region: '',
        currencyCode: '',
        currencySymbol: '',
        currencyName: '',
        cardUsage: '',
        requiresVisa: false,
        visaType: '',
        visaNotes: '',
        plugTypes: '',
        voltage: '',
        plugNotes: '',
        water_safety: '',
        police: '',
        ambulance: '',
        embassyNote: '',
        dos: '',
        donts: '',
        tippingNotes: '',
        general_info: ''
      };
  }
};

export const formFromEntity = (type, e = {}) => {
  if (type === 'route') {
    return {
      title: e.title || '',
      country_id: e.country_id || '',
      duration_days: e.duration_days || 7,
      duration_nights: e.duration_nights || Math.max(1, (e.duration_days || 7) - 1),
      theme_category: e.theme_category || 'Leisure',
      transport_modes: joinList(e.transport_modes),
      cities_sequence: joinList(e.cities_sequence),
      route_highlights: joinList(e.route_highlights),
      general_info: e.general_info || '',
      day_itinerary: Array.isArray(e.day_itinerary) ? e.day_itinerary : []
    };
  }
  if (type === 'object') {
    const oh = e.opening_hours || {};
    const tp = e.ticket_policy || {};
    const rules = e.rules || {};
    return {
      name: e.name || '',
      country_id: e.country_id || '',
      city_id: e.city_id || '',
      cityName: '',
      category: e.category || 'Historical',
      est_duration_minutes: e.est_duration_minutes || 90,
      open: oh.open || '',
      close: oh.close || '',
      hoursNotes: oh.notes || '',
      bookingMode: tp.bookingMode || '',
      ticketNotes: tp.notes || '',
      dress_code: e.dress_code || '',
      photosAllowed: rules.photosAllowed !== false,
      tripodAllowed: Boolean(rules.tripodAllowed),
      luggageStorage: Boolean(rules.luggageStorage),
      rulesNotes: rules.notes || '',
      guide_briefing_notes: listText(e.guide_briefing_notes).join('\n'),
      photo_spots: listText(e.photo_spots).join('\n'),
      general_info: e.general_info || ''
    };
  }
  if (type === 'city') {
    const fh = e.food_highlights || {};
    return {
      name: e.name || '',
      country_id: e.country_id || '',
      airports: listText(e.airports).join(', '),
      best_months: listText(e.best_months).join(', '),
      transport_apps: listText(e.transport_apps).join(', '),
      halalFriendly: Boolean(fh.halalFriendly),
      signatureDishes: listText(fh.signature).join(', '),
      mosques: listText(fh.mosques).join('\n'),
      ingredientCautions: toText(fh.ingredientCautions),
      hospital_contacts: listText(e.hospital_contacts).join('\n'),
      general_info: e.general_info || ''
    };
  }
  const cur = e.currency || {};
  const em = e.emergency || {};
  const pp = e.power_plugs || {};
  const visa = e.visa_info || {};
  const ce = e.customs_etiquette || {};
  return {
    id: e.id || '',
    name: e.name || '',
    region: e.region || '',
    currencyCode: cur.code || '',
    currencySymbol: cur.symbol || '',
    currencyName: cur.name || '',
    cardUsage: cur.cardUsage || '',
    requiresVisa: Boolean(visa.requiresVisa),
    visaType: visa.type || '',
    visaNotes: visa.notes || '',
    plugTypes: listText(pp.types).join(', ') || toText(pp.types),
    voltage: pp.voltage || '',
    plugNotes: pp.notes || '',
    water_safety: e.water_safety || '',
    police: em.police || '',
    ambulance: em.ambulance || '',
    embassyNote: em.embassyNote || '',
    dos: listText(ce.dos).join('\n'),
    donts: listText(ce.donts).join('\n'),
    tippingNotes: ce.tippingNotes || '',
    general_info: e.general_info || ''
  };
};

export const payloadFromForm = (type, f, { countries = [], original = {} } = {}) => {
  if (type === 'route') {
    const country = countries.find((c) => c.id === f.country_id);
    return {
      title: f.title.trim(),
      country_id: f.country_id,
      country_name: country?.name || original.country_name || f.country_id,
      duration_days: parseInt(f.duration_days, 10) || 7,
      duration_nights: parseInt(f.duration_nights, 10) || 6,
      theme_category: f.theme_category,
      transport_modes: splitList(f.transport_modes),
      cities_sequence: splitList(f.cities_sequence),
      route_highlights: splitList(f.route_highlights),
      general_info: f.general_info.trim(),
      day_itinerary: f.day_itinerary || []
    };
  }
  if (type === 'object') {
    return {
      name: f.name.trim(),
      country_id: f.country_id,
      city_id: f.city_id,
      cityName: f.cityName.trim(),
      category: f.category,
      est_duration_minutes: parseInt(f.est_duration_minutes, 10) || 90,
      opening_hours: { ...(original.opening_hours || {}), open: f.open, close: f.close, notes: f.hoursNotes },
      ticket_policy: { ...(original.ticket_policy || {}), bookingMode: f.bookingMode, notes: f.ticketNotes },
      dress_code: f.dress_code.trim(),
      rules: {
        ...(original.rules || {}),
        photosAllowed: f.photosAllowed,
        tripodAllowed: f.tripodAllowed,
        luggageStorage: f.luggageStorage,
        notes: f.rulesNotes
      },
      guide_briefing_notes: splitList(f.guide_briefing_notes, { newlineOnly: true }),
      photo_spots: splitList(f.photo_spots),
      general_info: f.general_info.trim()
    };
  }
  if (type === 'city') {
    return {
      name: f.name.trim(),
      country_id: f.country_id,
      airports: splitList(f.airports),
      best_months: splitList(f.best_months),
      transport_apps: splitList(f.transport_apps),
      food_highlights: {
        ...(original.food_highlights || {}),
        signature: splitList(f.signatureDishes),
        halalFriendly: f.halalFriendly,
        mosques: splitList(f.mosques, { newlineOnly: true }),
        ingredientCautions: f.ingredientCautions
      },
      hospital_contacts: splitList(f.hospital_contacts, { newlineOnly: true }),
      general_info: f.general_info.trim()
    };
  }
  return {
    id: f.id.trim().toUpperCase(),
    name: f.name.trim(),
    region: f.region.trim() || 'International',
    currency: {
      ...(original.currency || {}),
      code: f.currencyCode.trim().toUpperCase(),
      symbol: f.currencySymbol.trim(),
      name: f.currencyName.trim(),
      cardUsage: f.cardUsage
    },
    visa_info: {
      ...(original.visa_info || {}),
      requiresVisa: f.requiresVisa,
      type: f.visaType,
      notes: f.visaNotes
    },
    power_plugs: {
      ...(original.power_plugs || {}),
      types: splitList(f.plugTypes),
      voltage: f.voltage,
      notes: f.plugNotes
    },
    water_safety: f.water_safety,
    emergency: {
      ...(original.emergency || {}),
      police: f.police,
      ambulance: f.ambulance,
      embassyNote: f.embassyNote
    },
    customs_etiquette: {
      ...(original.customs_etiquette || {}),
      dos: splitList(f.dos, { newlineOnly: true }),
      donts: splitList(f.donts, { newlineOnly: true }),
      tippingNotes: f.tippingNotes
    },
    general_info: f.general_info.trim()
  };
};

// ---------------------------------------------------------------------------
// WhatsApp / Field briefing builders
// ---------------------------------------------------------------------------

const countryBlock = (c) => {
  if (!c) return [];
  const lines = [`🌍 *${c.name} (${c.id})* — ${c.region || ''}`];
  if (c.general_info) lines.push(c.general_info);
  const v = c.visa_info || {};
  lines.push(
    `🛂 Visa: ${v.requiresVisa ? `REQUIRED${v.type ? ` (${v.type})` : ''}` : 'Visa-free / on arrival'}${v.notes ? ` — ${v.notes}` : ''}`
  );
  const em = c.emergency || {};
  if (em.police || em.ambulance) {
    lines.push(`🚨 Police: ${em.police || '-'} · Ambulance: ${em.ambulance || '-'}`);
  }
  if (em.embassyNote) lines.push(`🏛️ Embassy: ${em.embassyNote}`);
  const cur = c.currency || {};
  if (cur.code) {
    lines.push(`💱 Currency: ${cur.code}${cur.symbol ? ` (${cur.symbol})` : ''}${cur.cardUsage ? ` — ${cur.cardUsage}` : ''}`);
  }
  const pp = c.power_plugs || {};
  if (pp.types || pp.voltage) {
    lines.push(`🔌 Plugs: ${listText(pp.types).join('/') || toText(pp.types)} ${pp.voltage || ''}${pp.notes ? ` — ${pp.notes}` : ''}`);
  }
  if (c.water_safety) lines.push(`🚰 Tap water: ${c.water_safety}`);
  const ce = c.customs_etiquette || {};
  const dos = listText(ce.dos);
  const donts = listText(ce.donts);
  if (dos.length) lines.push(`✅ Do: ${dos.join('; ')}`);
  if (donts.length) lines.push(`⛔ Don't: ${donts.join('; ')}`);
  if (ce.tippingNotes) lines.push(`💵 Tipping: ${ce.tippingNotes}`);
  return lines;
};

const cityBlock = (ct) => {
  const lines = [`🏙️ *${ct.name}*`];
  if (ct.general_info) lines.push(ct.general_info);
  const apps = listText(ct.transport_apps);
  if (apps.length) lines.push(`🚕 Apps: ${apps.join(', ')}`);
  const fh = ct.food_highlights || {};
  const sig = listText(fh.signature);
  if (sig.length || fh.halalFriendly) {
    lines.push(`🍜 Food: ${sig.join(', ') || '-'}${fh.halalFriendly ? ' · Halal-friendly ✓' : ''}`);
  }
  if (fh.ingredientCautions) lines.push(`⚠️ Ingredient cautions: ${toText(fh.ingredientCautions)}`);
  const hosp = listText(ct.hospital_contacts);
  if (hosp.length) lines.push(`🏥 Hospitals: ${hosp.join(' | ')}`);
  return lines;
};

const objectBlock = (o) => {
  const lines = [`📍 *${o.name}* (${o.category || 'POI'}, ~${o.est_duration_minutes || 90} min)`];
  const oh = o.opening_hours || {};
  if (oh.open || oh.close) lines.push(`   🕘 ${oh.open || '?'}–${oh.close || '?'}${oh.notes ? ` (${oh.notes})` : ''}`);
  const tp = o.ticket_policy || {};
  if (tp.bookingMode || tp.notes) lines.push(`   🎟️ ${tp.bookingMode || ''}${tp.notes ? ` — ${tp.notes}` : ''}`);
  if (o.dress_code) lines.push(`   👔 Dress code: ${o.dress_code}`);
  const notes = listText(o.guide_briefing_notes);
  if (notes.length) lines.push(`   🎤 Bus briefing: ${notes.join(' / ')}`);
  return lines;
};

export const buildEntityBriefing = (entity, type, ctx = {}) => {
  const { countries = [], cities = [], tourObjects = [] } = ctx;
  if (!entity) return '';
  if (type === 'country') return countryBlock(entity).join('\n');
  if (type === 'city') {
    const c = countries.find((x) => x.id === entity.country_id);
    return [...cityBlock(entity), c ? `(${c.name})` : ''].filter(Boolean).join('\n');
  }
  if (type === 'object') {
    const ct = cities.find((x) => x.id === entity.city_id);
    const lines = objectBlock(entity);
    if (ct) lines.splice(1, 0, `   🏙️ ${ct.name}`);
    if (entity.general_info) lines.push(`   ℹ️ ${entity.general_info}`);
    return lines.join('\n');
  }
  return buildRouteBriefing(entity, { countries, cities, tourObjects });
};

export const buildRouteBriefing = (route, { countries = [], cities = [], tourObjects = [] } = {}) => {
  if (!route) return '';
  const country = countries.find((c) => c.id === route.country_id);
  const lines = [
    `🧭 *TOUR LEADER FIELD BRIEFING*`,
    `*${route.title}* — ${route.duration_days || '?'}D${route.duration_nights || '?'}N`,
    route.general_info || '',
    `🛣️ Route: ${listText(route.cities_sequence).join(' → ')}`,
    `🚌 Transport: ${listText(route.transport_modes).join(', ') || '-'}`,
    ''
  ];
  if (country) lines.push(...countryBlock(country), '');

  const seqNames = listText(route.cities_sequence).map((n) => n.toLowerCase());
  const routeCities = cities.filter(
    (ct) => seqNames.includes(String(ct.name || '').toLowerCase()) && (!route.country_id || ct.country_id === route.country_id || !ct.country_id)
  );
  routeCities.forEach((ct) => lines.push(...cityBlock(ct), ''));

  const days = Array.isArray(route.day_itinerary) ? route.day_itinerary : [];
  if (days.length) {
    lines.push('📅 *DAY-BY-DAY*');
    days.forEach((d, i) => {
      const m = d.meals || {};
      const meals = ['b', 'l', 'd'].filter((k) => m[k]).map((k) => k.toUpperCase()).join('/') || '-';
      lines.push(`Day ${d.day || i + 1}: ${d.title || ''}${d.city ? ` (${d.city})` : ''} · Meals: ${meals}${d.hotelArea ? ` · Hotel: ${d.hotelArea}` : ''}`);
      if (d.summary) lines.push(`   ${d.summary}`);
      listText(d.objects).forEach((objName) => {
        const poi = tourObjects.find((o) => String(o.name || '').toLowerCase() === objName.toLowerCase());
        if (poi) lines.push(...objectBlock(poi));
        else lines.push(`   📍 ${objName}`);
      });
    });
  }
  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();
};

export const buildCountryGuide = (country, { cities = [], tourObjects = [], tourRoutes = [] } = {}) => {
  if (!country) return '';
  const lines = [`🧭 *DESTINATION FIELD BRIEFING*`, '', ...countryBlock(country), ''];
  const countryCities = cities.filter((ct) => ct.country_id === country.id);
  countryCities.forEach((ct) => {
    lines.push(...cityBlock(ct));
    tourObjects
      .filter((o) => o.city_id === ct.id)
      .forEach((o) => lines.push(...objectBlock(o)));
    lines.push('');
  });
  const orphan = tourObjects.filter(
    (o) => o.country_id === country.id && !countryCities.some((ct) => ct.id === o.city_id)
  );
  if (orphan.length) {
    lines.push('📍 *Other attractions*');
    orphan.forEach((o) => lines.push(...objectBlock(o)));
    lines.push('');
  }
  const routes = tourRoutes.filter((r) => r.country_id === country.id);
  if (routes.length) {
    lines.push('🛣️ *Master routes*');
    routes.forEach((r) => lines.push(`• ${r.title} (${r.duration_days}D${r.duration_nights}N): ${listText(r.cities_sequence).join(' → ')}`));
  }
  return lines.join('\n').trim();
};

export const printText = (title, text) => {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<strong>$1</strong>');
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#0f172a;line-height:1.55;font-size:13px}
h1{font-size:18px;border-bottom:3px solid #0284c7;padding-bottom:8px;color:#0284c7}
pre{white-space:pre-wrap;font-family:inherit}</style></head>
<body><h1>${esc(title)}</h1><pre>${esc(text)}</pre></body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
};

