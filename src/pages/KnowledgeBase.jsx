import { useState, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import ExportMenu from '../components/ExportMenu';
import Pagination from '../components/Pagination';
import { useKnowledge } from '../context/KnowledgeContext';
import { useTours } from '../context/TourContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import EntryFormModal from '../components/knowledge/EntryFormModal';
import DossierDrawer from '../components/knowledge/DossierDrawer';
import { PocketGuideModal, FreshnessCheckerModal } from '../components/knowledge/GuideAndCheckerModals';
import { AiDossierModal, PdfImportModal } from '../components/knowledge/AiAndPdfModals';
import { Badge, ConfirmModal } from '../components/knowledge/KnowledgeUI';
import {
  OBJECT_CATEGORIES, ROUTE_THEMES, getCategoryColor, isCancelledStatus, listText, freshnessBadge, formatDate
} from '../components/knowledge/knowledgeHelpers';
import {
  Globe, MapPin, Building, Compass, Sparkles, UploadCloud, Search, Plus, Zap, FileText,
  Trash2, Edit3, Eye, Route, Activity, Users, RotateCcw, Clock, Shirt, Plane
} from 'lucide-react';

const PAGE_SIZE = 12;

const KnowledgeBase = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [visaFilter, setVisaFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);

  const [entryModal, setEntryModal] = useState(null); // { mode, type, entity, key }
  const [selected, setSelected] = useState(null); // { type, id }
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, item }
  const [deleting, setDeleting] = useState(false);
  const [guideModal, setGuideModal] = useState(null); // { mode, id }
  const [showChecker, setShowChecker] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [auditingId, setAuditingId] = useState(null);
  const [singleAudit, setSingleAudit] = useState(null);

  const {
    countries, cities, tourObjects, tourRoutes, loading,
    isAuditing, auditProgress, auditResults, lastAuditDate,
    addCountry, updateCountry, deleteCountry,
    addCity, updateCity, deleteCity,
    addObject, updateObject, deleteObject,
    addTourRoute, updateTourRoute, deleteTourRoute,
    parsePdfItinerary, generateWithAi, saveExtractedKnowledge,
    checkEntityFreshness, runBatchKnowledgeChecker, applyEntityUpdate, applyAllPendingUpdates
  } = useKnowledge();
  const { tours = [] } = useTours() || {};
  const { theme } = useTheme();
  const { toast } = useToast();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Every filter change resets pagination back to page 1
  const withReset = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  // ---------------- Lookups ----------------
  const countryById = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);
  const cityById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities]);

  // Active (non-cancelled) tour demand per country (matched by ISO or name)
  const demandByCountry = useMemo(() => {
    const map = {};
    const resolve = (raw) => {
      const v = String(raw || '').trim().toLowerCase();
      if (!v) return null;
      return countries.find((c) => c.id.toLowerCase() === v || String(c.name || '').toLowerCase() === v) || null;
    };
    tours.forEach((t) => {
      if (isCancelledStatus(t.status)) return;
      const c = resolve(t.country);
      if (!c) return;
      if (!map[c.id]) map[c.id] = { tours: 0, pax: 0 };
      map[c.id].tours += 1;
      map[c.id].pax += Number(t.paxCount) || 0;
    });
    return map;
  }, [tours, countries]);

  const totalActiveTours = Object.values(demandByCountry).reduce((s, d) => s + d.tours, 0);
  const totalActivePax = Object.values(demandByCountry).reduce((s, d) => s + d.pax, 0);
  const staleCount = [...countries, ...cities, ...tourObjects, ...tourRoutes].filter(
    (e) => freshnessBadge(e.last_verified_at).label !== 'Fresh'
  ).length;

  const regions = useMemo(() => ['All', ...new Set(countries.map((c) => c.region).filter(Boolean))], [countries]);

  // ---------------- Filtering & sorting ----------------
  const q = searchQuery.trim().toLowerCase();
  const has = (v) => String(v || '').toLowerCase().includes(q);

  const passesCountry = useCallback(
    (countryId) => {
      const c = countryById.get(countryId);
      if (selectedCountry !== 'All' && countryId !== selectedCountry) return false;
      if (selectedRegion !== 'All' && c?.region !== selectedRegion) return false;
      if (visaFilter !== 'All') {
        const req = Boolean(c?.visa_info?.requiresVisa);
        if (visaFilter === 'required' && !req) return false;
        if (visaFilter === 'free' && (req || !c)) return false;
      }
      return true;
    },
    [countryById, selectedCountry, selectedRegion, visaFilter]
  );

  const sortList = useCallback(
    (list, { nameKey = 'name', popular, duration }) => {
      const arr = [...list];
      if (sortBy === 'alpha') arr.sort((a, b) => String(a[nameKey] || '').localeCompare(String(b[nameKey] || '')));
      else if (sortBy === 'recent') arr.sort((a, b) => new Date(b.last_verified_at || 0) - new Date(a.last_verified_at || 0));
      else if (sortBy === 'duration' && duration) arr.sort((a, b) => duration(b) - duration(a));
      else if (popular) arr.sort((a, b) => popular(b) - popular(a));
      return arr;
    },
    [sortBy]
  );

  const filteredRoutes = useMemo(() => {
    const list = tourRoutes.filter((r) => {
      const matchSearch = !q || has(r.title) || has(r.general_info) || has(r.country_name) || has(r.country_id) ||
        listText(r.cities_sequence).some(has) || listText(r.route_highlights).some(has);
      const matchTheme = selectedTheme === 'All' || String(r.theme_category || '').toLowerCase() === selectedTheme.toLowerCase();
      return matchSearch && matchTheme && passesCountry(r.country_id);
    });
    return sortList(list, { nameKey: 'title', popular: (r) => Number(r.usage_count) || 0, duration: (r) => Number(r.duration_days) || 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourRoutes, q, selectedTheme, passesCountry, sortList]);

  const filteredObjects = useMemo(() => {
    const list = tourObjects.filter((o) => {
      const ct = cityById.get(o.city_id);
      const c = countryById.get(o.country_id);
      const matchSearch = !q || has(o.name) || has(o.general_info) || has(o.category) || has(o.dress_code) || has(ct?.name) || has(c?.name);
      const matchCat = selectedCategory === 'All' || String(o.category || '').toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat && passesCountry(o.country_id);
    });
    return sortList(list, { popular: (o) => demandByCountry[o.country_id]?.tours || 0, duration: (o) => Number(o.est_duration_minutes) || 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourObjects, q, selectedCategory, passesCountry, sortList, cityById, countryById, demandByCountry]);

  const filteredCities = useMemo(() => {
    const list = cities.filter((ct) => {
      const c = countryById.get(ct.country_id);
      const matchSearch = !q || has(ct.name) || has(ct.general_info) || has(c?.name) || listText(ct.airports).some(has);
      return matchSearch && passesCountry(ct.country_id);
    });
    return sortList(list, { popular: (ct) => tourObjects.filter((o) => o.city_id === ct.id).length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, q, passesCountry, sortList, countryById, tourObjects]);

  const filteredCountries = useMemo(() => {
    const list = countries.filter((c) => {
      const matchSearch = !q || has(c.name) || has(c.id) || has(c.region) || has(c.general_info);
      return matchSearch && passesCountry(c.id);
    });
    return sortList(list, { popular: (c) => demandByCountry[c.id]?.tours || 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, q, passesCountry, sortList, demandByCountry]);

  const tabData = { routes: filteredRoutes, objects: filteredObjects, cities: filteredCities, countries: filteredCountries };
  const activeList = tabData[activeTab] || [];
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = activeList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters =
    searchQuery || selectedRegion !== 'All' || selectedCountry !== 'All' || visaFilter !== 'All' ||
    selectedCategory !== 'All' || selectedTheme !== 'All' || sortBy !== 'popular';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRegion('All');
    setSelectedCountry('All');
    setVisaFilter('All');
    setSelectedCategory('All');
    setSelectedTheme('All');
    setSortBy('popular');
    setPage(1);
  };

  // ---------------- Export ----------------
  const exportConfig = useMemo(() => {
    const cName = (id) => countryById.get(id)?.name || id || '';
    if (activeTab === 'routes' || activeTab === 'matrix') {
      return {
        filename: 'master_tour_routes',
        columns: [
          { header: 'Title', key: 'title' }, { header: 'Country', key: 'country' }, { header: 'Duration', key: 'duration' },
          { header: 'Theme', key: 'theme_category' }, { header: 'City Sequence', key: 'cities' }, { header: 'Departures', key: 'usage_count' },
          { header: 'Highlights', key: 'highlights' }, { header: 'Last Verified', key: 'verified' }
        ],
        data: filteredRoutes.map((r) => ({
          ...r, country: r.country_name || cName(r.country_id), duration: `${r.duration_days}D${r.duration_nights}N`,
          cities: listText(r.cities_sequence).join(' > '), highlights: listText(r.route_highlights).join(', '), verified: formatDate(r.last_verified_at)
        }))
      };
    }
    if (activeTab === 'objects') {
      return {
        filename: 'tour_attractions',
        columns: [
          { header: 'Attraction', key: 'name' }, { header: 'Category', key: 'category' }, { header: 'City', key: 'city' },
          { header: 'Country', key: 'country' }, { header: 'Duration (min)', key: 'est_duration_minutes' }, { header: 'Hours', key: 'hours' },
          { header: 'Ticketing', key: 'ticket' }, { header: 'Dress Code', key: 'dress_code' }
        ],
        data: filteredObjects.map((o) => ({
          ...o, city: cityById.get(o.city_id)?.name || '', country: cName(o.country_id),
          hours: o.opening_hours?.open ? `${o.opening_hours.open}-${o.opening_hours.close || ''}` : '', ticket: o.ticket_policy?.bookingMode || ''
        }))
      };
    }
    if (activeTab === 'cities') {
      return {
        filename: 'destination_cities',
        columns: [
          { header: 'City', key: 'name' }, { header: 'Country', key: 'country' }, { header: 'Airports', key: 'airports_s' },
          { header: 'Best Months', key: 'months' }, { header: 'Apps', key: 'apps' }, { header: 'Halal Friendly', key: 'halal' }
        ],
        data: filteredCities.map((ct) => ({
          ...ct, country: cName(ct.country_id), airports_s: listText(ct.airports).join(', '), months: listText(ct.best_months).join(', '),
          apps: listText(ct.transport_apps).join(', '), halal: ct.food_highlights?.halalFriendly ? 'Yes' : 'No'
        }))
      };
    }
    return {
      filename: 'destination_countries',
      columns: [
        { header: 'ISO', key: 'id' }, { header: 'Country', key: 'name' }, { header: 'Region', key: 'region' }, { header: 'Visa', key: 'visa' },
        { header: 'Currency', key: 'cur' }, { header: 'Police', key: 'police' }, { header: 'Ambulance', key: 'amb' }, { header: 'Active Tours', key: 'tours' }, { header: 'Active Pax', key: 'pax' }
      ],
      data: filteredCountries.map((c) => ({
        ...c, visa: c.visa_info?.requiresVisa ? `Required ${c.visa_info?.type || ''}` : 'Visa-free', cur: c.currency?.code || '',
        police: c.emergency?.police || '', amb: c.emergency?.ambulance || '', tours: demandByCountry[c.id]?.tours || 0, pax: demandByCountry[c.id]?.pax || 0
      }))
    };
  }, [activeTab, filteredRoutes, filteredObjects, filteredCities, filteredCountries, countryById, cityById, demandByCountry]);

  // ---------------- Selected entity (always live from context) ----------------
  const selectedItem = useMemo(() => {
    if (!selected) return null;
    const pool = { route: tourRoutes, object: tourObjects, city: cities, country: countries }[selected.type] || [];
    const item = pool.find((x) => x.id === selected.id);
    return item ? { type: selected.type, item } : null;
  }, [selected, tourRoutes, tourObjects, cities, countries]);

  const openDossier = (type, item) => {
    setSingleAudit(null);
    setSelected({ type, id: item.id });
  };

  // ---------------- CRUD handlers ----------------
  const openCreate = (type = 'route') => setEntryModal({ mode: 'create', type, entity: null, key: `create-${Date.now()}` });
  const openEdit = (type, item) => setEntryModal({ mode: 'edit', type, entity: item, key: `edit-${item.id}-${Date.now()}` });

  const handleEntrySubmit = async ({ type, payload, mode, id }) => {
    if (mode === 'create') {
      if (type === 'route') {
        const res = await addTourRoute(payload);
        if (res?.deduplicated) toast.info(res.message);
        else toast.success(res?.message || 'Route saved');
      } else if (type === 'object') {
        await addObject(payload);
        toast.success(`Attraction "${payload.name}" added`);
      } else if (type === 'city') {
        await addCity(payload);
        toast.success(`City "${payload.name}" added`);
      } else {
        if (countryById.has(payload.id)) throw new Error(`Country ${payload.id} already exists — edit it instead.`);
        await addCountry(payload);
        toast.success(`Country "${payload.name}" added`);
      }
    } else {
      if (type === 'route') await updateTourRoute(id, payload);
      else if (type === 'object') {
        const next = { ...payload };
        if (!next.city_id && next.cityName) {
          const res = await addCity({ name: next.cityName, country_id: next.country_id });
          next.city_id = res.id;
        }
        delete next.cityName;
        await updateObject(id, next);
      } else if (type === 'city') await updateCity(id, payload);
      else {
        const next = { ...payload };
        delete next.id;
        await updateCountry(id, next);
      }
      toast.success('Changes saved & re-verified');
    }
    setEntryModal(null);
  };

  const requestDelete = (type, item) => setConfirmDelete({ type, item });

  const performDelete = async () => {
    if (!confirmDelete) return;
    const { type, item } = confirmDelete;
    try {
      setDeleting(true);
      if (type === 'country') await deleteCountry(item.id);
      else if (type === 'city') await deleteCity(item.id);
      else if (type === 'object') await deleteObject(item.id);
      else await deleteTourRoute(item.id);
      if (selected?.id === item.id) setSelected(null);
      toast.success(`Deleted "${item.title || item.name}"`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- AI, audit handlers ----------------
  const handleSaveAi = async (type, data) => {
    if (type === 'country') await addCountry(data);
    else if (type === 'city') await addCity(data);
    else if (type === 'route') {
      const res = await addTourRoute(data);
      toast.info(res?.message || 'Route saved');
    } else await addObject(data);
    if (type !== 'route') toast.success('AI dossier saved to knowledge base');
    setShowAi(false);
  };

  const handleCheckSingle = async (item, type) => {
    try {
      setAuditingId(item.id);
      setSingleAudit(null);
      const res = await checkEntityFreshness(item, type);
      setSingleAudit({ ...res, id: item.id, type, name: item.title || item.name, updatedEntity: res.updatedEntity || item });
      if (res.status === 'verified' && !(res.changes || []).length) toast.success('Data verified — no changes needed');
      else toast.warning(`${(res.changes || []).length} suggested update(s) found`);
    } catch (err) {
      toast.error(`Freshness check failed: ${err.message}`);
    } finally {
      setAuditingId(null);
    }
  };

  const handleApplyAudit = async (r) => {
    try {
      await applyEntityUpdate(r.id, r.type, r.updatedEntity);
      toast.success(`Updated "${r.name}"`);
      setSingleAudit((prev) => (prev && prev.id === r.id ? null : prev));
    } catch (err) {
      toast.error(`Failed to apply update: ${err.message}`);
    }
  };

  const handleRunScan = async (scope) => {
    try {
      const results = await runBatchKnowledgeChecker({ filterType: scope });
      const pending = results.filter((r) => r.status !== 'verified' || (r.changes || []).length).length;
      toast.info(`Scan complete: ${results.length} checked, ${pending} need attention`);
    } catch (err) {
      toast.error(`Scan failed: ${err.message}`);
    }
  };

  const handleApplyAll = async () => {
    try {
      setIsApplyingAll(true);
      const res = await applyAllPendingUpdates();
      toast.success(res.message);
    } catch (err) {
      toast.error(`Failed to apply updates: ${err.message}`);
    } finally {
      setIsApplyingAll(false);
    }
  };

  // ---------------- UI helpers ----------------
  const btn = (bg, color, border) => ({
    display: 'flex', alignItems: 'center', gap: '0.45rem', background: bg, color, border: border || 'none',
    padding: '0.55rem 1rem', borderRadius: 8, fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer'
  });
  const selectStyle = {
    padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-main)', fontSize: '0.82rem'
  };
  const cardStyle = (accent) => ({
    padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', cursor: 'pointer',
    borderTop: `3px solid ${accent}`, transition: 'transform 0.15s, box-shadow 0.15s'
  });

  const renderActions = (type, item) => (
    <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => openDossier(type, item)} style={{ ...btn('transparent', neonBlue, `1px solid ${neonBlue}`), padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
        <Eye size={12} /> Dossier
      </button>
      <button type="button" onClick={() => openEdit(type, item)} style={{ ...btn('transparent', 'var(--text-main)', '1px solid var(--border)'), padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
        <Edit3 size={12} /> Edit
      </button>
      <button type="button" onClick={() => requestDelete(type, item)} aria-label="Delete" style={{ ...btn('transparent', '#ef4444', '1px solid rgba(239,68,68,0.35)'), padding: '0.3rem 0.5rem', fontSize: '0.72rem', marginLeft: 'auto' }}>
        <Trash2 size={12} />
      </button>
    </div>
  );

  const renderFresh = (iso) => {
    const f = freshnessBadge(iso);
    return <Badge color={f.color}>{f.label}</Badge>;
  };

  const renderDemand = (countryId) => {
    const d = demandByCountry[countryId];
    return d?.tours ? <Badge color="#10b981" title="Active (non-cancelled) tours & booked pax"><Users size={10} /> {d.tours} tours · {d.pax} pax</Badge> : null;
  };

  const renderEmpty = (icon, title, text) => (
    <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>{icon}</div>
      <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>{text}</p>
      {hasActiveFilters && <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={resetFilters}>Reset Filters</button>}
    </div>
  );

  const kpis = [
    { label: 'Master Tour Routes', value: tourRoutes.length, icon: <Route size={20} />, color: neonBlue },
    { label: 'Countries · Cities', value: `${countries.length} · ${cities.length}`, icon: <Globe size={20} />, color: '#6366f1' },
    { label: 'Attractions & POIs', value: tourObjects.length, icon: <MapPin size={20} />, color: '#f59e0b' },
    { label: 'Active Tours · Pax', value: `${totalActiveTours} · ${totalActivePax}`, icon: <Users size={20} />, color: '#10b981' },
    { label: 'Needs Re-Verification', value: staleCount, icon: <Activity size={20} />, color: staleCount ? '#ef4444' : '#10b981', onClick: () => setShowChecker(true), sub: lastAuditDate ? `Last scan ${formatDate(lastAuditDate)}` : 'Never scanned' }
  ];

  const tabs = [
    ['routes', '🛣️ Master Routes', filteredRoutes.length],
    ['objects', '📍 Attractions & POIs', filteredObjects.length],
    ['cities', '🏙️ Cities & Hubs', filteredCities.length],
    ['countries', '🌍 Countries & Logistics', filteredCountries.length],
    ['matrix', '🗂️ Route Matrix', null]
  ];

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' };

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeSidebarOnMobile} />
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neonBlue, background: `color-mix(in srgb, ${neonBlue} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${neonBlue} 40%, transparent)`, boxShadow: isLight ? 'none' : `0 0 14px color-mix(in srgb, ${neonBlue} 35%, transparent)` }}>
                  <Compass size={22} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Travel Guide & Tips</h1>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Destination intelligence, master routes, POI rules & tour leader field briefings</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowChecker(true)} style={btn('rgba(234,179,8,0.14)', isLight ? '#a16207' : '#eab308', '1px solid rgba(234,179,8,0.4)')}>
                  <Zap size={15} /> Live Data Checker
                </button>
                <button type="button" onClick={() => setShowPdf(true)} style={btn(neonBlue, isLight ? '#fff' : '#001018')}>
                  <UploadCloud size={15} /> Import Itinerary PDF
                </button>
                <button type="button" onClick={() => setShowAi(true)} style={btn('rgba(99,102,241,0.14)', isLight ? '#4338ca' : '#a5b4fc', '1px solid rgba(99,102,241,0.35)')}>
                  <Sparkles size={15} /> Quick AI Dossier
                </button>
                <button type="button" onClick={() => setGuideModal({ mode: 'route', id: '' })} style={btn('rgba(16,185,129,0.12)', isLight ? '#047857' : '#34d399', '1px solid rgba(16,185,129,0.35)')}>
                  <FileText size={15} /> TL Pocket Guide
                </button>
                <button type="button" onClick={() => openCreate(activeTab === 'objects' ? 'object' : activeTab === 'cities' ? 'city' : activeTab === 'countries' ? 'country' : 'route')} style={btn('var(--bg-surface)', 'var(--text-main)', '1px solid var(--border)')}>
                  <Plus size={15} /> Add Entry
                </button>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpis.map((k) => (
                <div key={k.label} className="card" onClick={k.onClick} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: k.onClick ? 'pointer' : 'default', borderLeft: `3px solid ${k.color}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, background: `color-mix(in srgb, ${k.color} 14%, transparent)` }}>{k.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{k.label}</span>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{k.value}</h3>
                    {k.sub && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{k.sub}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="card" style={{ padding: '0.9rem 1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <Search size={15} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search routes, cities, attractions, dress codes, countries…"
                  value={searchQuery}
                  onChange={(e) => withReset(setSearchQuery)(e.target.value)}
                  style={{ ...selectStyle, width: '100%', paddingLeft: '2.2rem', boxSizing: 'border-box' }}
                />
              </div>
              <select value={selectedRegion} onChange={(e) => withReset(setSelectedRegion)(e.target.value)} style={selectStyle} aria-label="Region">
                {regions.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
              </select>
              <select value={selectedCountry} onChange={(e) => withReset(setSelectedCountry)(e.target.value)} style={selectStyle} aria-label="Country">
                <option value="All">All Countries</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={visaFilter} onChange={(e) => withReset(setVisaFilter)(e.target.value)} style={selectStyle} aria-label="Visa">
                <option value="All">Any Visa Rule</option>
                <option value="free">Visa-Free</option>
                <option value="required">Visa Required</option>
              </select>
              {activeTab === 'routes' && (
                <select value={selectedTheme} onChange={(e) => withReset(setSelectedTheme)(e.target.value)} style={selectStyle} aria-label="Theme">
                  <option value="All">All Themes</option>
                  {ROUTE_THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              {activeTab === 'objects' && (
                <select value={selectedCategory} onChange={(e) => withReset(setSelectedCategory)(e.target.value)} style={selectStyle} aria-label="Category">
                  <option value="All">All Categories</option>
                  {OBJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select value={sortBy} onChange={(e) => withReset(setSortBy)(e.target.value)} style={selectStyle} aria-label="Sort by">
                <option value="popular">Sort: Most Departures / Popular</option>
                <option value="recent">Sort: Recently Verified</option>
                <option value="alpha">Sort: Alphabetical A–Z</option>
                <option value="duration">Sort: Longest Duration</option>
              </select>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} style={btn('transparent', 'var(--text-subtle)', '1px solid var(--border)')}>
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <ExportMenu data={exportConfig.data} columns={exportConfig.columns} filename={exportConfig.filename} />
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              {tabs.map(([id, label, count]) => (
                <button key={id} type="button" className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => { setActiveTab(id); setPage(1); }}>
                  {label}{count !== null ? ` (${count})` : ''}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>Loading destination & route intelligence…</div>
            ) : (
              <>
                {/* ROUTES */}
                {activeTab === 'routes' && (
                  <div style={grid}>
                    {pageItems.length === 0 ? (
                      renderEmpty(<Route size={40} />, "No master routes found", 'Import an itinerary PDF or use "Quick AI Dossier" to capture routes with duplicate prevention.')
                    ) : pageItems.map((r) => {
                      const color = getCategoryColor(r.theme_category);
                      return (
                        <div key={r.id} className="card" style={cardStyle(color)} onClick={() => openDossier('route', r)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{r.title}</h3>
                            <Badge color={neonBlue}>{r.duration_days}D{r.duration_nights}N</Badge>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <Badge color={color}>{r.theme_category || 'Leisure'}</Badge>
                            <Badge color="#8b5cf6">{r.usage_count || 1}× departures</Badge>
                            {renderDemand(r.country_id)}
                            {renderFresh(r.last_verified_at)}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>🌍 {r.country_name || countryById.get(r.country_id)?.name || r.country_id}</span>
                          {r.general_info && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.general_info}</p>}
                          {listText(r.cities_sequence).length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>🛣️ {listText(r.cities_sequence).join(' → ')}</div>
                          )}
                          {renderActions('route', r)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* OBJECTS */}
                {activeTab === 'objects' && (
                  <div style={grid}>
                    {pageItems.length === 0 ? (
                      renderEmpty(<MapPin size={40} />, "No attractions found", "Add attractions manually, via AI dossier, or from an itinerary PDF.")
                    ) : pageItems.map((o) => {
                      const color = getCategoryColor(o.category);
                      const ct = cityById.get(o.city_id);
                      return (
                        <div key={o.id} className="card" style={cardStyle(color)} onClick={() => openDossier('object', o)}>
                          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>{o.name}</h3>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <Badge color={color}>{o.category}</Badge>
                            <Badge color={neonBlue}><Clock size={10} /> {o.est_duration_minutes || 90} min</Badge>
                            {renderFresh(o.last_verified_at)}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>📍 {ct?.name || 'Unlinked city'} · {countryById.get(o.country_id)?.name || o.country_id}</span>
                          {o.opening_hours?.open && <span style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>🕘 {o.opening_hours.open}–{o.opening_hours.close}</span>}
                          {o.dress_code && <span style={{ fontSize: '0.74rem', color: isLight ? '#b45309' : '#fbbf24', display: 'flex', gap: 4, alignItems: 'center' }}><Shirt size={12} /> {o.dress_code}</span>}
                          {renderActions('object', o)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CITIES */}
                {activeTab === 'cities' && (
                  <div style={grid}>
                    {pageItems.length === 0 ? (
                      renderEmpty(<Building size={40} />, "No cities found", "Cities are auto-created when attractions or PDFs reference them.")
                    ) : pageItems.map((ct) => {
                      const poiCount = tourObjects.filter((o) => o.city_id === ct.id).length;
                      return (
                        <div key={ct.id} className="card" style={cardStyle('#6366f1')} onClick={() => openDossier('city', ct)}>
                          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>{ct.name}</h3>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <Badge color="#6366f1">🌍 {countryById.get(ct.country_id)?.name || ct.country_id}</Badge>
                            <Badge color="#f59e0b">{poiCount} POIs</Badge>
                            {ct.food_highlights?.halalFriendly && <Badge color="#10b981">Halal-friendly</Badge>}
                            {renderFresh(ct.last_verified_at)}
                          </div>
                          {listText(ct.airports).length > 0 && <span style={{ fontSize: '0.74rem', color: 'var(--text-main)', display: 'flex', gap: 4, alignItems: 'center' }}><Plane size={12} /> {listText(ct.airports).join(', ')}</span>}
                          {ct.general_info && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ct.general_info}</p>}
                          {renderActions('city', ct)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* COUNTRIES */}
                {activeTab === 'countries' && (
                  <div style={grid}>
                    {pageItems.length === 0 ? (
                      renderEmpty(<Globe size={40} />, "No countries found", "Add a country or generate one with Quick AI Dossier.")
                    ) : pageItems.map((c) => {
                      const req = Boolean(c.visa_info?.requiresVisa);
                      return (
                        <div key={c.id} className="card" style={cardStyle(neonBlue)} onClick={() => openDossier('country', c)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{c.name}</h3>
                            <Badge color={neonBlue}>{c.id}</Badge>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {c.region && <Badge color="#6366f1">{c.region}</Badge>}
                            <Badge color={req ? '#ef4444' : '#10b981'}>{req ? `Visa required${c.visa_info?.type ? ` · ${c.visa_info.type}` : ''}` : 'Visa-free'}</Badge>
                            {renderDemand(c.id)}
                            {renderFresh(c.last_verified_at)}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-main)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.6rem' }}>
                            <span>💱 {c.currency?.code || '—'}</span>
                            <span>🚨 {c.emergency?.police || '—'} / {c.emergency?.ambulance || '—'}</span>
                            <span>🔌 {listText(c.power_plugs?.types).join('/') || '—'} {c.power_plugs?.voltage || ''}</span>
                            <span>🚰 {c.water_safety ? String(c.water_safety).slice(0, 26) : '—'}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            {tourRoutes.filter((r) => r.country_id === c.id).length} routes · {cities.filter((ct) => ct.country_id === c.id).length} cities · {tourObjects.filter((o) => o.country_id === c.id).length} POIs
                          </span>
                          {renderActions('country', c)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MATRIX */}
                {activeTab === 'matrix' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredCountries.length === 0 ? (
                      renderEmpty(<Compass size={40} />, "Knowledge base empty", "Upload an itinerary PDF to build the hierarchy automatically.")
                    ) : filteredCountries.map((c) => {
                      const cCities = cities.filter((ct) => ct.country_id === c.id);
                      const cRoutes = tourRoutes.filter((r) => r.country_id === c.id);
                      return (
                        <div key={c.id} className="card" style={{ padding: '1.2rem', borderLeft: `3px solid ${neonBlue}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem', paddingBottom: '0.7rem', borderBottom: '1px solid var(--border)' }}>
                            <button type="button" onClick={() => openDossier('country', c)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                              <Globe size={18} color={neonBlue} />
                              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{c.name} ({c.id})</span>
                            </button>
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {renderDemand(c.id)}
                              <Badge color={neonBlue}>{cRoutes.length} routes</Badge>
                              <Badge color="#6366f1">{cCities.length} cities</Badge>
                            </div>
                          </div>
                          {cRoutes.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                              {cRoutes.map((r) => (
                                <button key={r.id} type="button" onClick={() => openDossier('route', r)} style={{ ...btn('transparent', neonBlue, `1px solid color-mix(in srgb, ${neonBlue} 40%, transparent)`), padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderRadius: 999 }}>
                                  🛣️ {r.title}
                                </button>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.8rem' }}>
                            {cCities.map((ct) => {
                              const cityPois = tourObjects.filter((o) => o.city_id === ct.id);
                              return (
                                <div key={ct.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.8rem' }}>
                                  <button type="button" onClick={() => openDossier('city', ct)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', margin: '0 0 0.4rem', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#4338ca' : '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Building size={14} /> {ct.name}
                                  </button>
                                  {cityPois.length === 0 ? (
                                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>No attractions linked yet</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                      {cityPois.map((o) => (
                                        <button key={o.id} type="button" onClick={() => openDossier('object', o)} style={{ fontSize: '0.76rem', padding: '0.3rem 0.5rem', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-main)', textAlign: 'left' }}>
                                          <span>📍 {o.name}</span>
                                          <span style={{ fontSize: '0.66rem', color: getCategoryColor(o.category), fontWeight: 700 }}>{o.category}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab !== 'matrix' && activeList.length > PAGE_SIZE && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={activeList.length} itemsPerPage={PAGE_SIZE} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals & drawer */}
      {entryModal && (
        <EntryFormModal
          key={entryModal.key}
          mode={entryModal.mode}
          initialType={entryModal.type}
          entity={entryModal.entity}
          countries={countries}
          cities={cities}
          onClose={() => setEntryModal(null)}
          onSubmit={handleEntrySubmit}
        />
      )}

      <DossierDrawer
        selected={selectedItem}
        onClose={() => setSelected(null)}
        onNavigate={openDossier}
        onEdit={openEdit}
        onDelete={requestDelete}
        onCheckFreshness={handleCheckSingle}
        onApplyAudit={handleApplyAudit}
        auditingId={auditingId}
        singleAudit={singleAudit}
        countries={countries}
        cities={cities}
        tourObjects={tourObjects}
        tourRoutes={tourRoutes}
        demandByCountry={demandByCountry}
        neonBlue={neonBlue}
        toast={toast}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Delete knowledge entry?"
        message={confirmDelete ? `"${confirmDelete.item.title || confirmDelete.item.name}" will be permanently removed from the shared knowledge base. This cannot be undone.` : ''}
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {guideModal && (
        <PocketGuideModal
          initialMode={guideModal.mode}
          initialId={guideModal.id}
          onClose={() => setGuideModal(null)}
          countries={countries}
          cities={cities}
          tourObjects={tourObjects}
          tourRoutes={tourRoutes}
          toast={toast}
          neonBlue={neonBlue}
        />
      )}

      {showChecker && (
        <FreshnessCheckerModal
          onClose={() => setShowChecker(false)}
          isAuditing={isAuditing}
          auditProgress={auditProgress}
          auditResults={auditResults}
          lastAuditDate={lastAuditDate}
          counts={{ route: tourRoutes.length, object: tourObjects.length, city: cities.length, country: countries.length }}
          onRunScan={handleRunScan}
          onApplyOne={handleApplyAudit}
          onApplyAll={handleApplyAll}
          isApplyingAll={isApplyingAll}
          neonBlue={neonBlue}
        />
      )}

      {showAi && <AiDossierModal onClose={() => setShowAi(false)} generateWithAi={generateWithAi} onSave={handleSaveAi} toast={toast} />}

      {showPdf && <PdfImportModal onClose={() => setShowPdf(false)} parsePdfItinerary={parsePdfItinerary} saveExtractedKnowledge={saveExtractedKnowledge} toast={toast} />}
    </div>
  );
};

export default KnowledgeBase;
