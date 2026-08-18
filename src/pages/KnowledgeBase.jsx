import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useKnowledge } from '../context/KnowledgeContext';
import { 
  Globe, MapPin, Building, Compass, Sparkles, UploadCloud, Search, 
  Plus, Filter, Clock, ShieldAlert, Zap, FileText, CheckCircle2, 
  AlertTriangle, Trash2, Edit3, ChevronRight, ChevronDown, 
  ExternalLink, Info, Coffee, HelpCircle, X, Eye, Printer, Copy, Check,
  Route, ArrowRight, Calendar, Layers, CheckCheck, RefreshCw, Activity,
  SlidersHorizontal, CheckCircle, AlertCircle, ArrowUpRight, BookOpen
} from 'lucide-react';

const KnowledgeBase = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'objects', 'cities', 'countries', 'matrix'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTheme, setSelectedTheme] = useState('All');

  // Modals & Drawers State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualType, setManualType] = useState('route'); // 'route', 'object', 'city', 'country'
  const [selectedItem, setSelectedItem] = useState(null); // for detail inspector
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideCountry, setGuideCountry] = useState('');

  // Live Data Checker State
  const [showCheckerModal, setShowCheckerModal] = useState(false);
  const [checkerFilter, setCheckerFilter] = useState('all'); // 'all', 'updates_only', 'verified_only'
  const [checkerTypeFilter, setCheckerTypeFilter] = useState('all'); // 'all', 'country', 'city', 'object', 'route'
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [singleAuditingId, setSingleAuditingId] = useState(null);
  const [singleAuditResult, setSingleAuditResult] = useState(null);

  // PDF Importer State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStage, setExtractStage] = useState(0);
  const [extractResult, setExtractResult] = useState(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // AI Quick Add State
  const [aiQuery, setAiQuery] = useState('');
  const [aiType, setAiType] = useState('route');
  const [aiContext, setAiContext] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  const { 
    countries, cities, tourObjects, tourRoutes, loading,
    isAuditing, auditProgress, auditResults, lastAuditDate,
    addCountry, updateCountry, deleteCountry,
    addCity, updateCity, deleteCity,
    addObject, updateObject, deleteObject,
    addTourRoute, updateTourRoute, deleteTourRoute,
    computeRouteSignature, parsePdfItinerary, generateWithAi, saveExtractedKnowledge,
    checkEntityFreshness, runBatchKnowledgeChecker, applyEntityUpdate, applyAllPendingUpdates
  } = useKnowledge();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Regions list
  const regions = useMemo(() => {
    const set = new Set(countries.map(c => c.region).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [countries]);

  const categories = ['All', 'Historical', 'Cultural', 'Religious', 'Nature', 'Theme Park', 'Shopping', 'Museum', 'Landmark', 'Culinary'];
  const themes = ['All', 'Leisure', 'Cultural', 'Nature & Scenic', 'Winter & Ski', 'Luxury', 'Adventure', 'Family', 'Shopping & Culinary'];

  // Filtered Tour Routes
  const filteredRoutes = useMemo(() => {
    return tourRoutes.filter(r => {
      const matchSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.general_info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.country_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.country_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.cities_sequence || []).some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (r.route_highlights || []).some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
      const country = countries.find(c => c.id === r.country_id);
      const matchRegion = selectedRegion === 'All' || country?.region === selectedRegion;
      const matchTheme = selectedTheme === 'All' || r.theme_category?.toLowerCase() === selectedTheme.toLowerCase();
      return matchSearch && matchRegion && matchTheme;
    });
  }, [tourRoutes, countries, searchQuery, selectedRegion, selectedTheme]);

  // Filtered Countries
  const filteredCountries = useMemo(() => {
    return countries.filter(c => {
      const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.general_info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.region?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = selectedRegion === 'All' || c.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [countries, searchQuery, selectedRegion]);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities.filter(ct => {
      const country = countries.find(c => c.id === ct.country_id);
      const matchSearch = ct.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ct.general_info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          country?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = selectedRegion === 'All' || country?.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [cities, countries, searchQuery, selectedRegion]);

  // Filtered Tour Objects
  const filteredObjects = useMemo(() => {
    return tourObjects.filter(obj => {
      const country = countries.find(c => c.id === obj.country_id);
      const city = cities.find(ct => ct.id === obj.city_id);
      const matchSearch = obj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.general_info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          country?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          city?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.dress_code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = selectedRegion === 'All' || country?.region === selectedRegion;
      const matchCat = selectedCategory === 'All' || obj.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchRegion && matchCat;
    });
  }, [tourObjects, countries, cities, searchQuery, selectedRegion, selectedCategory]);

  // Handle PDF File Upload
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF file.');
      return;
    }
    setPdfFile(file);
    setExtractResult(null);
    setCommitSuccess(false);

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Start PDF Extraction with Gemini
  const handleStartExtraction = async () => {
    if (!pdfBase64) {
      alert('Please select a PDF file first.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractStage(1);

      setTimeout(() => setExtractStage(2), 1200);
      setTimeout(() => setExtractStage(3), 2800);

      const data = await parsePdfItinerary(pdfBase64, pdfFile?.name);
      setExtractStage(4);
      setExtractResult(data);
    } catch (err) {
      alert('Extraction Error: ' + err.message);
      setExtractStage(0);
    } finally {
      setIsExtracting(false);
    }
  };

  // Commit Extracted Knowledge to Supabase
  const handleCommitExtracted = async () => {
    if (!extractResult) return;
    try {
      setIsCommitting(true);
      await saveExtractedKnowledge(extractResult);
      setCommitSuccess(true);
      setCommitMessage('Knowledge & Tour Route successfully saved and deduplicated!');
      setTimeout(() => {
        setShowPdfModal(false);
        setPdfFile(null);
        setPdfBase64('');
        setExtractResult(null);
        setCommitSuccess(false);
        setExtractStage(0);
      }, 1500);
    } catch (err) {
      alert('Failed to save to database: ' + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  // Handle AI Quick Dossier Generation
  const handleGenerateAi = async () => {
    if (!aiQuery.trim()) {
      alert('Please enter a destination, route, or attraction name.');
      return;
    }
    try {
      setIsAiGenerating(true);
      setAiGeneratedData(null);
      const data = await generateWithAi(aiQuery, aiType, aiContext);
      setAiGeneratedData(data);
    } catch (err) {
      alert('AI Generation Error: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save AI Generated Item
  const handleSaveAiData = async () => {
    if (!aiGeneratedData) return;
    try {
      if (aiType === 'country') {
        await addCountry(aiGeneratedData);
      } else if (aiType === 'city') {
        await addCity(aiGeneratedData);
      } else if (aiType === 'route') {
        const res = await addTourRoute(aiGeneratedData);
        alert(res.message || 'Route saved successfully!');
      } else {
        await addObject(aiGeneratedData);
      }
      setShowAiModal(false);
      setAiQuery('');
      setAiGeneratedData(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  // Delete handler with confirmation
  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      if (type === 'country') await deleteCountry(id);
      if (type === 'city') await deleteCity(id);
      if (type === 'object') await deleteObject(id);
      if (type === 'route') await deleteTourRoute(id);
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Single Item Freshness Check
  const handleCheckSingleFreshness = async (item, type) => {
    try {
      setSingleAuditingId(item.id);
      setSingleAuditResult(null);
      const res = await checkEntityFreshness(item, type);
      setSingleAuditResult(res);
    } catch (err) {
      alert('Freshness check failed: ' + err.message);
    } finally {
      setSingleAuditingId(null);
    }
  };

  // Apply Single Audited Update
  const handleApplySingleUpdate = async (itemResult) => {
    try {
      await applyEntityUpdate(itemResult.id, itemResult.type, itemResult.updatedEntity);
      alert(`✓ Updated ${itemResult.name} successfully!`);
    } catch (err) {
      alert('Failed to apply update: ' + err.message);
    }
  };

  // Apply 1-Click All Pending Updates
  const handleApplyAllUpdates = async () => {
    try {
      setIsApplyingAll(true);
      const res = await applyAllPendingUpdates();
      alert(res.message);
    } catch (err) {
      alert('Failed to apply updates: ' + err.message);
    } finally {
      setIsApplyingAll(false);
    }
  };

  // Category Color Map
  const getCategoryColor = (cat) => {
    const map = {
      'Historical': '#f59e0b',
      'Cultural': '#8b5cf6',
      'Religious': '#ec4899',
      'Nature': '#10b981',
      'Nature & Scenic': '#10b981',
      'Theme Park': '#06b6d4',
      'Shopping': '#3b82f6',
      'Shopping & Culinary': '#3b82f6',
      'Museum': '#6366f1',
      'Landmark': '#eab308',
      'Culinary': '#f97316',
      'Winter & Ski': '#38bdf8',
      'Luxury': '#eab308',
      'Adventure': '#ef4444'
    };
    return map[cat] || 'var(--primary)';
  };

  // Copy TL Briefing to Clipboard
  const handleCopyGuideText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Audit Metrics Calculation
  const auditMetrics = useMemo(() => {
    const total = auditResults.length;
    const updatesCount = auditResults.filter(r => r.status === 'update_available' || (r.changes && r.changes.length > 0)).length;
    const criticalCount = auditResults.filter(r => r.status === 'critical_alert').length;
    const verifiedCount = total - updatesCount - criticalCount;
    return { total, updatesCount, criticalCount, verifiedCount };
  }, [auditResults]);

  // Filtered Audit Results
  const filteredAuditResults = useMemo(() => {
    return auditResults.filter(r => {
      const matchType = checkerTypeFilter === 'all' || r.type === checkerTypeFilter;
      const matchStatus = checkerFilter === 'all' ? true :
                          checkerFilter === 'updates_only' ? (r.status !== 'verified' || (r.changes && r.changes.length > 0)) :
                          (r.status === 'verified' && (!r.changes || r.changes.length === 0));
      return matchType && matchStatus;
    });
  }, [auditResults, checkerFilter, checkerTypeFilter]);

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeSidebarOnMobile} />
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">

            {/* Page Header */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <Compass size={22} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                      Destination & Route Intelligence Hub
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                      Master tour routes catalog, live travel updates checker, visa & POI intelligence with executive overviews
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowCheckerModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.18), rgba(249, 115, 22, 0.18))',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.15)'
                  }}
                >
                  <span className="pulse-dot pulse-dot-amber" />
                  <Zap size={15} /> ⚡ Live Data Checker
                </button>

                <button
                  onClick={() => setShowPdfModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
                  }}
                >
                  <UploadCloud size={16} /> Import Itinerary PDF
                </button>

                <button
                  onClick={() => {
                    setAiGeneratedData(null);
                    setShowAiModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-indigo)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={16} /> Quick AI Dossier
                </button>

                <button
                  onClick={() => setShowManualModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Add Entry
                </button>

                <button
                  onClick={() => setShowGuideModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--success)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={16} /> TL Pocket Guide
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.12)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Route size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Master Tour Routes</span>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{tourRoutes.length}</h3>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Globe size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Countries Covered</span>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{countries.length}</h3>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Tour Objects & POIs</span>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{tourObjects.length}</h3>
                </div>
              </div>

              <div 
                className="card" 
                onClick={() => setShowCheckerModal(true)}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', border: '1px solid rgba(234, 179, 8, 0.3)' }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.15)', color: '#eab308',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Activity size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Intelligence Health</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                    <span className="pulse-dot pulse-dot-green" />
                    <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {lastAuditDate ? `Audited Recently` : `Ready to Scan`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                
                {/* Search */}
                <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
                  <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search routes, city stops, attractions, dress codes, countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem 0.6rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'rgba(0, 0, 0, 0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {/* Region Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Region:</span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    style={{
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Theme Filter (For Routes) */}
                {activeTab === 'routes' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Theme:</span>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      style={{
                        padding: '0.55rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {themes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {/* Category Filter (Active only for Objects) */}
                {activeTab === 'objects' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        padding: '0.55rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              <button
                className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
                onClick={() => setActiveTab('routes')}
              >
                🛣️ Master Tour Routes ({filteredRoutes.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'objects' ? 'active' : ''}`}
                onClick={() => setActiveTab('objects')}
              >
                📍 Tour Objects & POIs ({filteredObjects.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'cities' ? 'active' : ''}`}
                onClick={() => setActiveTab('cities')}
              >
                🏙️ Cities & Hubs ({filteredCities.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'countries' ? 'active' : ''}`}
                onClick={() => setActiveTab('countries')}
              >
                🌍 Countries & Logistics ({filteredCountries.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix')}
              >
                🗂️ Tour Route Matrix
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid rgba(6, 182, 212, 0.2)', borderLeftColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Loading destination & route intelligence...
              </div>
            ) : (
              <>
                {/* 1. MASTER TOUR ROUTES TAB */}
                {activeTab === 'routes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {filteredRoutes.length === 0 ? (
                      <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <Route size={40} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.25rem' }}>No Master Tour Routes Captured Yet</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                          Upload an itinerary PDF or click "Quick AI Dossier" to capture routes automatically with duplicate prevention.
                        </p>
                      </div>
                    ) : (
                      filteredRoutes.map(route => {
                        const themeColor = getCategoryColor(route.theme_category);

                        return (
                          <div
                            key={route.id}
                            className="card fade-in"
                            style={{
                              padding: '1.35rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              position: 'relative',
                              borderTop: `3px solid ${themeColor}`,
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            <div>
                              {/* Header & Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '6px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)'
                                  }}>
                                    {route.duration_days}D{route.duration_nights}N
                                  </span>

                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: '700',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '6px',
                                    background: `${themeColor}20`,
                                    color: themeColor,
                                    border: `1px solid ${themeColor}40`
                                  }}>
                                    {route.theme_category || 'Leisure'}
                                  </span>

                                  {route.usage_count > 1 && (
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: '700',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '6px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: 'var(--success)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}>
                                      <RefreshCw size={11} /> {route.usage_count}x Departures
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDelete('route', route.id, route.title)}
                                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.15rem' }}
                                  title="Delete Route"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Title */}
                              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: '800', lineHeight: '1.3' }}>
                                {route.title}
                              </h3>

                              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}>
                                🌍 {route.country_name || route.country_id}
                              </p>

                              {/* Short General Info */}
                              {route.general_info && (
                                <p style={{
                                  margin: '0 0 0.75rem',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-subtle)',
                                  lineHeight: '1.4',
                                  fontStyle: 'italic',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  borderLeft: '2px solid var(--primary)'
                                }}>
                                  "{route.general_info}"
                                </p>
                              )}

                              {/* City Sequence Pathway */}
                              <div style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '0.65rem',
                                marginBottom: '0.85rem'
                              }}>
                                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700', letterSpacing: '0.04em' }}>
                                  Journey Route Flow:
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                                  {(route.cities_sequence || []).map((city, idx) => (
                                    <React.Fragment key={idx}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-main)',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                      }}>
                                        {city}
                                      </span>
                                      {idx < (route.cities_sequence || []).length - 1 && (
                                        <ArrowRight size={12} color="var(--primary)" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>

                              {/* Route Highlights */}
                              {route.route_highlights && route.route_highlights.length > 0 && (
                                <div style={{ marginBottom: '0.85rem' }}>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    {route.route_highlights.slice(0, 3).map((hl, i) => (
                                      <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', background: 'rgba(255, 255, 255, 0.03)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                        ✨ {hl}
                                      </span>
                                    ))}
                                    {route.route_highlights.length > 3 && (
                                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>
                                        +{route.route_highlights.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Button */}
                            <button
                              onClick={() => setSelectedItem({ ...route, entityType: 'route' })}
                              style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Eye size={14} /> View Day-by-Day Journey Itinerary
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 2. TOUR OBJECTS TAB */}
                {activeTab === 'objects' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredObjects.length === 0 ? (
                      <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <Compass size={40} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.25rem' }}>No Tour Objects Found</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                          Upload an itinerary PDF or click "Quick AI Dossier" to extract attractions automatically.
                        </p>
                      </div>
                    ) : (
                      filteredObjects.map(obj => {
                        const country = countries.find(c => c.id === obj.country_id);
                        const city = cities.find(ct => ct.id === obj.city_id);
                        const catColor = getCategoryColor(obj.category);

                        return (
                          <div
                            key={obj.id}
                            className="card fade-in"
                            style={{
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              position: 'relative',
                              borderTop: `3px solid ${catColor}`,
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            <div>
                              {/* Header & Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '700',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  background: `${catColor}20`,
                                  color: catColor,
                                  border: `1px solid ${catColor}40`
                                }}>
                                  {obj.category || 'Historical'}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Clock size={13} /> {obj.est_duration_minutes || 90}m
                                  </span>
                                  <button
                                    onClick={() => handleDelete('object', obj.id, obj.name)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.15rem' }}
                                    title="Delete Object"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: '700' }}>
                                {obj.name}
                              </h3>

                              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                                <MapPin size={13} /> {city?.name || 'Local City'}, {country?.name || obj.country_id}
                              </p>

                              {/* General Info */}
                              {obj.general_info && (
                                <p style={{
                                  margin: '0 0 0.75rem',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-subtle)',
                                  lineHeight: '1.4',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  borderLeft: `2px solid ${catColor}`
                                }}>
                                  {obj.general_info}
                                </p>
                              )}

                              {obj.dress_code && (
                                <div style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '6px',
                                  padding: '0.45rem 0.65rem',
                                  marginBottom: '0.75rem',
                                  fontSize: '0.75rem',
                                  color: '#f87171',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}>
                                  <AlertTriangle size={13} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {obj.dress_code}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedItem({ ...obj, entityType: 'object' })}
                              style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Eye size={14} /> View Full Dossier & Rules
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. CITIES TAB */}
                {activeTab === 'cities' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredCities.length === 0 ? (
                      <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <Building size={40} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.25rem' }}>No Cities Found</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                          Add cities manually or extract them automatically from your tour PDFs.
                        </p>
                      </div>
                    ) : (
                      filteredCities.map(ct => {
                        const country = countries.find(c => c.id === ct.country_id);
                        const cityObjects = tourObjects.filter(o => o.city_id === ct.id);

                        return (
                          <div key={ct.id} className="card fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: 'var(--accent-indigo)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}>
                                  {country?.name || ct.country_id}
                                </span>
                                <button
                                  onClick={() => handleDelete('city', ct.id, ct.name)}
                                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: '800' }}>
                                {ct.name}
                              </h3>

                              {ct.general_info && (
                                <p style={{
                                  margin: '0 0 0.75rem',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-subtle)',
                                  lineHeight: '1.4',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  borderLeft: '2px solid var(--accent-indigo)'
                                }}>
                                  {ct.general_info}
                                </p>
                              )}

                              {ct.airports && ct.airports.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                  {ct.airports.map(ap => (
                                    <span key={ap} style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                      ✈️ {ap}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                📍 <strong>{cityObjects.length}</strong> linked attractions
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedItem({ ...ct, entityType: 'city' })}
                              style={{
                                width: '100%',
                                marginTop: '1rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View City Intel & Hospitals
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 4. COUNTRIES TAB */}
                {activeTab === 'countries' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredCountries.length === 0 ? (
                      <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <Globe size={40} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.25rem' }}>No Countries Found</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                          Click "Import Itinerary PDF" or "Quick AI Dossier" to add destination countries.
                        </p>
                      </div>
                    ) : (
                      filteredCountries.map(c => {
                        const countryCities = cities.filter(ct => ct.country_id === c.id);
                        const countryObjects = tourObjects.filter(o => o.country_id === c.id);
                        const countryRoutes = tourRoutes.filter(r => r.country_id === c.id);
                        const visa = c.visa_info || {};
                        const emergency = c.emergency || {};
                        const plugs = c.power_plugs || {};
                        const currency = c.currency || {};

                        return (
                          <div key={c.id} className="card fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)'
                                  }}>
                                    {c.id}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.region}</span>
                                </div>

                                <button
                                  onClick={() => handleDelete('country', c.id, c.name)}
                                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.3rem', fontWeight: '800' }}>
                                {c.name}
                              </h3>

                              {c.general_info && (
                                <p style={{
                                  margin: '0 0 0.75rem',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-subtle)',
                                  lineHeight: '1.4',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  borderLeft: '2px solid var(--primary)'
                                }}>
                                  {c.general_info}
                                </p>
                              )}

                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                marginBottom: '0.85rem',
                                background: visa.requiresVisa ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: visa.requiresVisa ? '#f87171' : 'var(--success)',
                                border: `1px solid ${visa.requiresVisa ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                              }}>
                                🛂 {visa.requiresVisa ? `Visa Required (${visa.type || 'e-Visa'})` : 'Visa-Free Entry'}
                              </div>

                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '0.65rem',
                                marginBottom: '0.85rem',
                                fontSize: '0.75rem'
                              }}>
                                <div>
                                  <span style={{ color: 'var(--text-subtle)' }}>Currency:</span>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                    {currency.symbol || ''} {currency.code || 'N/A'}
                                  </div>
                                </div>

                                <div>
                                  <span style={{ color: 'var(--text-subtle)' }}>Power Plugs:</span>
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                    {plugs.types ? plugs.types.join('/') : 'Type C'} ({plugs.voltage || '220V'})
                                  </div>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                🛣️ {countryRoutes.length} Routes • 🏙️ {countryCities.length} Cities • 📍 {countryObjects.length} Attractions
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedItem({ ...c, entityType: 'country' })}
                              style={{
                                width: '100%',
                                marginTop: '1rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View Country Dossier & Dos & Don'ts
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 5. TOUR ROUTE MATRIX TAB */}
                {activeTab === 'matrix' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {countries.length === 0 ? (
                      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Compass size={40} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                        <h4>Knowledge Base Empty</h4>
                        <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>Upload an itinerary PDF to build the hierarchy automatically.</p>
                      </div>
                    ) : (
                      countries.map(c => {
                        const countryCities = cities.filter(ct => ct.country_id === c.id);
                        const countryRoutes = tourRoutes.filter(r => r.country_id === c.id);

                        return (
                          <div key={c.id} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <Globe size={20} color="var(--primary)" />
                                <div>
                                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{c.name} ({c.id})</h3>
                                  {c.general_info && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.general_info}</p>}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                                {countryRoutes.length} Master Routes • {countryCities.length} Cities
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                              {countryCities.map(ct => {
                                const cityObjects = tourObjects.filter(o => o.city_id === ct.id);

                                return (
                                  <div key={ct.id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem' }}>
                                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <Building size={15} /> {ct.name}
                                    </h4>
                                    {ct.general_info && <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>{ct.general_info}</p>}

                                    {cityObjects.length === 0 ? (
                                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>No attractions linked yet</p>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {cityObjects.map(obj => (
                                          <div
                                            key={obj.id}
                                            onClick={() => setSelectedItem({ ...obj, entityType: 'object' })}
                                            style={{
                                              fontSize: '0.78rem',
                                              padding: '0.35rem 0.5rem',
                                              borderRadius: '4px',
                                              background: 'rgba(255, 255, 255, 0.03)',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <span>📍 {obj.name}</span>
                                            <span style={{ fontSize: '0.68rem', color: getCategoryColor(obj.category) }}>{obj.category}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LIVE DATA FRESHNESS CHECKER & AUTO-UPDATER                         */}
      {/* ========================================================================= */}
      {showCheckerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '880px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2))',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308'
                }}>
                  <Zap size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                    Live Knowledge Base Freshness Checker
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    AI-powered audit for visa rules, opening hours, dress codes & ticketing updates with 1-click Auto-Update
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCheckerModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className={`pulse-dot ${isAuditing ? 'pulse-dot-amber' : auditMetrics.updatesCount > 0 ? 'pulse-dot-amber' : 'pulse-dot-green'}`} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {isAuditing ? 'Auditing Knowledge Base in Real-Time...' :
                     auditResults.length > 0 ? `Audit Complete (${auditMetrics.updatesCount} updates available)` :
                     'Audit Ready to Run'}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  {lastAuditDate ? `Last verified: ${new Date(lastAuditDate).toLocaleString()}` : 'Database has not been audited yet'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  disabled={isAuditing}
                  onClick={() => runBatchKnowledgeChecker({ filterType: 'all' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={isAuditing ? 'spinner' : ''} /> {isAuditing ? 'Auditing...' : 'Run Freshness Scan'}
                </button>

                {auditMetrics.updatesCount > 0 && (
                  <button
                    disabled={isApplyingAll || isAuditing}
                    onClick={handleApplyAllUpdates}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCheck size={16} /> {isApplyingAll ? 'Updating All...' : `⚡ Auto-Update All (${auditMetrics.updatesCount})`}
                  </button>
                )}
              </div>
            </div>

            {isAuditing && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.4rem', color: '#eab308' }}>
                  <span>Auditing item {auditProgress.current} of {auditProgress.total}: {auditProgress.currentItem}</span>
                  <span>{Math.round((auditProgress.current / (auditProgress.total || 1)) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(auditProgress.current / (auditProgress.total || 1)) * 100}%`, height: '100%', background: '#eab308', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Metrics Breakdown */}
            {auditResults.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: '600' }}>Items Audited</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{auditMetrics.total}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '600' }}>🟢 Verified (Up-to-Date)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)' }}>{auditMetrics.verifiedCount}</div>
                </div>

                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: '600' }}>🟡 Updates Available</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#eab308' }}>{auditMetrics.updatesCount}</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '600' }}>🔴 Critical Alerts</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171' }}>{auditMetrics.criticalCount}</div>
                </div>
              </div>
            )}

            {/* Audit Results List & Visual Diffs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {auditResults.length === 0 && !isAuditing ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  <Activity size={44} color="#eab308" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-main)' }}>
                    No Knowledge Audit Performed Yet
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8rem' }}>
                    Click "Run Freshness Scan" to check all stored destination rules, visa policies, dress codes & ticketing updates.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => runBatchKnowledgeChecker({ filterType: 'all' })}
                    style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <Zap size={16} /> Start Full Freshness Scan
                  </button>
                </div>
              ) : (
                filteredAuditResults.map(item => {
                  const hasUpdates = item.changes && item.changes.length > 0;
                  const statusColor = item.status === 'critical_alert' ? '#f87171' : hasUpdates ? '#eab308' : 'var(--success)';

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${hasUpdates ? 'rgba(234, 179, 8, 0.3)' : 'var(--border)'}`,
                        borderRadius: '10px',
                        padding: '1.1rem',
                        borderLeft: `4px solid ${statusColor}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--primary)'
                            }}>
                              {item.type === 'object' ? '📍 Attraction' : item.type === 'country' ? '🌍 Country' : item.type === 'city' ? '🏙️ City' : '🛣️ Route'}
                            </span>

                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              background: `${statusColor}20`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`
                            }}>
                              {item.status === 'critical_alert' ? '🔴 Critical Alert' : hasUpdates ? '🟡 Update Available' : '🟢 Verified (Up-to-Date)'}
                            </span>
                          </div>

                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                            {item.name}
                          </h3>
                        </div>

                        {hasUpdates && (
                          <button
                            onClick={() => handleApplySingleUpdate(item)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--success)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={13} /> Apply Update
                          </button>
                        )}
                      </div>

                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: '1.4' }}>
                        {item.summary}
                      </p>

                      {hasUpdates && (
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Detected Field Diffs:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.45rem' }}>
                            {item.changes.map((ch, idx) => (
                              <div key={idx} style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <strong style={{ color: 'var(--text-main)' }}>{ch.label || ch.field}</strong>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>{ch.reason}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.06)', padding: '0.35rem', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', display: 'block', opacity: 0.8 }}>Current:</span>
                                    {typeof ch.oldValue === 'object' ? JSON.stringify(ch.oldValue) : String(ch.oldValue || 'None')}
                                  </div>
                                  <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.06)', padding: '0.35rem', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', display: 'block', opacity: 0.8 }}>Updated:</span>
                                    {typeof ch.newValue === 'object' ? JSON.stringify(ch.newValue) : String(ch.newValue || 'Updated')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowCheckerModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SMART PDF ITINERARY IMPORTER                                       */}
      {/* ========================================================================= */}
      {showPdfModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff'
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                    Smart Itinerary PDF & Route Extractor
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Auto-captures master tour routes, sequence of stops & attractions with duplicate elimination
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPdfModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Dropzone Area */}
            {!extractResult && (
              <div>
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    marginBottom: '1.25rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('pdf-upload-input').click()}
                >
                  <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>
                    {pdfFile ? pdfFile.name : 'Click or Drag & Drop Tour Itinerary PDF'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    {pdfFile ? `${(pdfFile.size / 1024).toFixed(1)} KB • Ready for AI Multimodal Scan` : 'Supports brochures, day-by-day itineraries, flight schedules, and booking sheets'}
                  </p>
                  <input
                    id="pdf-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {isExtracting && (
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.06)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                      <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(6, 182, 212, 0.2)', borderLeftColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {extractStage === 1 && 'Scanning PDF visual layout & reading itinerary stream...'}
                        {extractStage === 2 && 'Mapping city stop sequence & constructing daily itinerary timeline...'}
                        {extractStage === 3 && 'Enriching dress codes, POI rules, and verifying against duplicate routes...'}
                        {extractStage === 4 && 'Complete! Ready for review.'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.72rem' }}>
                      <div style={{ color: extractStage >= 1 ? 'var(--success)' : 'var(--text-subtle)', fontWeight: '600' }}>
                        ✓ 1. Read Document
                      </div>
                      <div style={{ color: extractStage >= 2 ? 'var(--success)' : 'var(--text-subtle)', fontWeight: '600' }}>
                        ✓ 2. Capture Route Flow
                      </div>
                      <div style={{ color: extractStage >= 3 ? 'var(--success)' : 'var(--text-subtle)', fontWeight: '600' }}>
                        ✓ 3. Deduplicate & Verify
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowPdfModal(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    disabled={!pdfFile || isExtracting}
                    onClick={handleStartExtraction}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <Sparkles size={16} /> Start AI Extraction
                  </button>
                </div>
              </div>
            )}

            {/* Extraction Review Matrix */}
            {extractResult && (
              <div className="fade-in">
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: 'var(--success)', fontSize: '0.95rem' }}>
                      ✨ Extracted: {extractResult.tourRoute?.title || extractResult.tourMeta?.title || 'Master Tour Route'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)' }}>
                      <strong>{extractResult.tourRoute?.durationDays || 7}D{extractResult.tourRoute?.durationNights || 6}N</strong> • {extractResult.countries?.length || 0} Countries • {extractResult.cities?.length || 0} Cities • {extractResult.tourObjects?.length || 0} Attractions
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.6rem', borderRadius: '6px', color: 'var(--success)', fontWeight: '700' }}>
                    Auto-Deduplication Ready
                  </span>
                </div>

                {/* Extracted Tour Objects Preview */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Extracted Tour Objects & Rules:
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ width: '100%', fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th>Attraction / Object</th>
                          <th>City / Country</th>
                          <th>Category</th>
                          <th>Duration</th>
                          <th>General Info Overview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractResult.tourObjects?.map((obj, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: '700' }}>{obj.name}</td>
                            <td>{obj.cityName || obj.city_id}, {obj.countryName || obj.country_id}</td>
                            <td><span style={{ color: getCategoryColor(obj.category), fontWeight: '600' }}>{obj.category}</span></td>
                            <td>{obj.estDurationMinutes || 90} mins</td>
                            <td style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                              {obj.generalInfo || obj.general_info || 'Overview extracted'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {commitMessage && (
                  <div style={{ marginBottom: '1rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>
                    ✓ {commitMessage}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setExtractResult(null);
                      setExtractStage(0);
                      setCommitMessage('');
                    }}
                  >
                    ← Upload Another PDF
                  </button>

                  <button
                    className="btn btn-primary"
                    disabled={isCommitting || commitSuccess}
                    onClick={handleCommitExtracted}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: commitSuccess ? 'var(--success)' : undefined }}
                  >
                    {isCommitting ? 'Saving & Deduplicating...' : commitSuccess ? '✓ Saved & Deduplicated!' : '💾 Save & Deduplicate to Database'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK AI DOSSIER & ROUTE GENERATOR                                 */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={22} color="var(--accent-indigo)" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Quick AI Travel Intelligence</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                Intelligence Entity:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {['route', 'object', 'city', 'country'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiType(t)}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: '6px',
                      border: `1px solid ${aiType === t ? 'var(--primary)' : 'var(--border)'}`,
                      background: aiType === t ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: aiType === t ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {t === 'route' ? '🛣️ Tour Route' : t === 'object' ? '📍 Tour POI' : t === 'city' ? '🏙️ City' : '🌍 Country'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                {aiType === 'route' ? 'Tour Route Name / Cities Sequence:' : aiType === 'object' ? 'Attraction / Object Name:' : aiType === 'city' ? 'City & Country Name:' : 'Country Name:'}
              </label>
              <input
                type="text"
                placeholder={aiType === 'route' ? 'e.g. 7D6N Japan Golden Route Tokyo Hakone Kyoto Osaka' : aiType === 'object' ? 'e.g. Louvre Museum, Paris or Mount Fuji 5th Station' : aiType === 'city' ? 'e.g. Kyoto, Japan' : 'e.g. Switzerland'}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-main)', fontSize: '0.85rem'
                }}
              />
            </div>

            {aiGeneratedData && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                maxHeight: '220px',
                overflowY: 'auto',
                fontSize: '0.8rem'
              }}>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--primary)' }}>
                  ✓ Generated: {aiGeneratedData.title || aiGeneratedData.name}
                </h4>
                {aiGeneratedData.generalInfo && (
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '4px' }}>
                    "{aiGeneratedData.generalInfo}"
                  </p>
                )}
                {aiType === 'route' && (
                  <p style={{ margin: '0 0 0.4rem', color: 'var(--text-subtle)' }}>
                    <strong>Stops:</strong> {aiGeneratedData.citiesSequence?.join(' → ')}<br />
                    <strong>Theme:</strong> {aiGeneratedData.themeCategory} • <strong>Duration:</strong> {aiGeneratedData.durationDays}D{aiGeneratedData.durationNights}N
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAiModal(false)}>Close</button>
              
              {!aiGeneratedData ? (
                <button
                  className="btn btn-primary"
                  disabled={isAiGenerating || !aiQuery.trim()}
                  onClick={handleGenerateAi}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Sparkles size={16} /> {isAiGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveAiData}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--success)' }}
                >
                  <CheckCircle2 size={16} /> Save to Database (Deduplicated)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL ADD ENTRY                                                   */}
      {/* ========================================================================= */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Add Knowledge / Route Entry</h2>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              try {
                if (manualType === 'route') {
                  const citiesArr = form.routeCities.value.split(',').map(s => s.trim()).filter(Boolean);
                  const highlightsArr = form.routeHighlights.value.split(',').map(s => s.trim()).filter(Boolean);
                  const res = await addTourRoute({
                    title: form.routeTitle.value,
                    general_info: form.generalInfo.value,
                    country_id: form.routeCountryId.value,
                    duration_days: parseInt(form.routeDays.value) || 7,
                    duration_nights: parseInt(form.routeNights.value) || 6,
                    theme_category: form.routeTheme.value,
                    cities_sequence: citiesArr,
                    route_highlights: highlightsArr
                  });
                  alert(res.message || 'Route added successfully!');
                } else if (manualType === 'country') {
                  await addCountry({
                    id: form.countryId.value,
                    name: form.countryName.value,
                    general_info: form.generalInfo.value,
                    region: form.countryRegion.value,
                    water_safety: form.waterSafety.value
                  });
                  alert('Country added successfully!');
                } else if (manualType === 'city') {
                  await addCity({
                    country_id: form.cityCountryId.value,
                    name: form.cityName.value,
                    general_info: form.generalInfo.value
                  });
                  alert('City added successfully!');
                } else {
                  await addObject({
                    name: form.objName.value,
                    general_info: form.generalInfo.value,
                    country_id: form.objCountryId.value,
                    category: form.objCategory.value,
                    est_duration_minutes: parseInt(form.objDuration.value) || 90,
                    dress_code: form.objDressCode.value
                  });
                  alert('Attraction added successfully!');
                }
                setShowManualModal(false);
              } catch (err) {
                alert('Error: ' + err.message);
              }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>Entry Type:</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                >
                  <option value="route">🛣️ Master Tour Route</option>
                  <option value="object">📍 Tour Object / Attraction</option>
                  <option value="city">🏙️ City Hub</option>
                  <option value="country">🌍 Country</option>
                </select>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Short General Information / Overview:</label>
                <textarea
                  name="generalInfo"
                  rows={2}
                  placeholder="Concise 1-2 sentence executive overview..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              {manualType === 'route' && (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tour Route Title:</label>
                    <input name="routeTitle" placeholder="e.g. 7D6N Classic Japan Golden Route" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Country:</label>
                      <select name="routeCountryId" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: '#fff' }}>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Days:</label>
                      <input name="routeDays" type="number" defaultValue={7} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nights:</label>
                      <input name="routeNights" type="number" defaultValue={6} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Cities in Sequence (comma separated):</label>
                    <input name="routeCities" placeholder="e.g. Tokyo, Hakone, Kyoto, Osaka" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                </>
              )}

              {manualType === 'country' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>ISO Code:</label>
                    <input name="countryId" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Country Name:</label>
                    <input name="countryName" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                </div>
              )}

              {manualType === 'city' && (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Country:</label>
                    <select name="cityCountryId" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: '#fff' }}>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>City Name:</label>
                    <input name="cityName" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                </>
              )}

              {manualType === 'object' && (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Country:</label>
                    <select name="objCountryId" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: '#fff' }}>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Attraction / Object Name:</label>
                    <input name="objName" required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Category:</label>
                      <select name="objCategory" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: '#fff' }}>
                        {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Duration (Mins):</label>
                      <input name="objDuration" type="number" defaultValue={90} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL INSPECTOR                                                   */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.04em' }}>
                  {selectedItem.entityType === 'route' ? 'Master Tour Route Dossier' : `${selectedItem.entityType} Intelligence`}
                </span>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.35rem', fontWeight: '800' }}>
                  {selectedItem.title || selectedItem.name}
                </h2>
              </div>
              <button onClick={() => { setSelectedItem(null); setSingleAuditResult(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* General Info / Overview Highlight Box */}
            {selectedItem.general_info && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <BookOpen size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                    General Information & Character Overview:
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                    {selectedItem.general_info}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Single-Item Live Audit Bar */}
            <div style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: '#eab308' }}>Live Intelligence Status:</strong>
                <span style={{ marginLeft: '0.4rem', color: 'var(--text-subtle)' }}>
                  {selectedItem.last_verified_at ? `Verified ${new Date(selectedItem.last_verified_at).toLocaleDateString()}` : 'Not yet verified'}
                </span>
              </div>

              <button
                disabled={singleAuditingId === selectedItem.id}
                onClick={() => handleCheckSingleFreshness(selectedItem, selectedItem.entityType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#eab308',
                  color: '#000',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Zap size={13} /> {singleAuditingId === selectedItem.id ? 'Checking...' : 'Check Live Freshness'}
              </button>
            </div>

            {singleAuditResult && (
              <div style={{
                background: singleAuditResult.changes && singleAuditResult.changes.length > 0 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${singleAuditResult.changes && singleAuditResult.changes.length > 0 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '8px',
                padding: '0.85rem',
                marginBottom: '1rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ color: singleAuditResult.changes && singleAuditResult.changes.length > 0 ? '#eab308' : 'var(--success)' }}>
                    {singleAuditResult.status === 'verified' ? '✓ Data Verified - 100% Up to Date' : '🟡 Updates Detected'}
                  </strong>
                  {singleAuditResult.changes && singleAuditResult.changes.length > 0 && (
                    <button
                      onClick={async () => {
                        await handleApplySingleUpdate({ id: selectedItem.id, type: selectedItem.entityType, name: selectedItem.name || selectedItem.title, updatedEntity: singleAuditResult.updatedEntity });
                        setSingleAuditResult(null);
                        setSelectedItem(null);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                    >
                      Apply Update Now
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, color: 'var(--text-main)' }}>{singleAuditResult.summary}</p>
              </div>
            )}

            {/* Route Details & Day-by-Day Timeline */}
            {selectedItem.entityType === 'route' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Duration:</span>
                    <div style={{ fontWeight: '700', color: 'var(--primary)' }}>{selectedItem.duration_days}D{selectedItem.duration_nights}N</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Theme:</span>
                    <div style={{ fontWeight: '700' }}>{selectedItem.theme_category || 'Leisure'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Departures / Usage:</span>
                    <div style={{ fontWeight: '700', color: 'var(--success)' }}>{selectedItem.usage_count || 1} Departures</div>
                  </div>
                </div>

                {/* Cities Pathway */}
                <div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
                    🛣️ City Stops Sequence:
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(selectedItem.cities_sequence || []).map((city, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                          {city}
                        </span>
                        {idx < (selectedItem.cities_sequence || []).length - 1 && (
                          <ArrowRight size={13} color="var(--text-subtle)" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Day by Day Schedule */}
                {selectedItem.day_itinerary && selectedItem.day_itinerary.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>
                      📅 Day-by-Day Master Schedule:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {selectedItem.day_itinerary.map((day, i) => (
                        <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.8rem' }}>
                              Day {day.day || i + 1}: {day.title || `Day ${i + 1}`}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              📍 {day.city || 'Transit'}
                            </span>
                          </div>
                          {day.summary && <p style={{ margin: '0 0 0.35rem', color: 'var(--text-subtle)', fontSize: '0.78rem' }}>{day.summary}</p>}
                          {day.objects && day.objects.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-main)' }}>
                              <strong>Highlights:</strong> {day.objects.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Object Details */}
            {selectedItem.entityType === 'object' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Category:</span>
                    <div style={{ fontWeight: '700', color: getCategoryColor(selectedItem.category) }}>{selectedItem.category}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Estimated Duration:</span>
                    <div style={{ fontWeight: '700' }}>⏱️ {selectedItem.est_duration_minutes || 90} Minutes</div>
                  </div>
                </div>

                {selectedItem.dress_code && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.75rem' }}>
                    <span style={{ color: '#f87171', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={15} /> Dress Code & Guest Attire
                    </span>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-main)' }}>{selectedItem.dress_code}</p>
                  </div>
                )}

                {selectedItem.guide_briefing_notes && selectedItem.guide_briefing_notes.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.45rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
                      🎙️ Tour Leader Briefing Points (Share on Coach):
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      {selectedItem.guide_briefing_notes.map((note, i) => (
                        <li key={i} style={{ marginBottom: '0.35rem' }}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* City Details */}
            {selectedItem.entityType === 'city' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Destination Country:</span>
                    <div style={{ fontWeight: '700', color: 'var(--accent-indigo)' }}>
                      {countries.find(c => c.id === selectedItem.country_id)?.name || selectedItem.country_id}
                    </div>
                  </div>
                  {selectedItem.airports && selectedItem.airports.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Gateway Airports:</span>
                      <div style={{ fontWeight: '700' }}>
                        ✈️ {selectedItem.airports.join(', ')}
                      </div>
                    </div>
                  )}
                  {selectedItem.best_months && selectedItem.best_months.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Best Travel Months:</span>
                      <div style={{ fontWeight: '700', color: 'var(--success)' }}>
                        🗓️ {selectedItem.best_months.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Local Transit & Transport Apps */}
                {selectedItem.transport_apps && selectedItem.transport_apps.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
                      📱 Recommended Transit & City Apps:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedItem.transport_apps.map((app, i) => (
                        <span key={i} style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          📲 {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food Highlights & Halal Intelligence */}
                {selectedItem.food_highlights && (
                  <div style={{ background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Coffee size={15} /> Gastronomy & Halal / Dietary Intelligence
                    </h4>
                    
                    {selectedItem.food_highlights.signature && selectedItem.food_highlights.signature.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>Must-Try Signature Dishes:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {selectedItem.food_highlights.signature.map((d, i) => (
                            <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              🍽️ {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedItem.food_highlights.halalFriendly && (
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        <strong style={{ color: 'var(--success)' }}>Halal & Muslim-Friendly Dining:</strong> {selectedItem.food_highlights.halalFriendly}
                      </div>
                    )}

                    {selectedItem.food_highlights.mosques && selectedItem.food_highlights.mosques.length > 0 && (
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                        <strong>🕌 Prayer Facilities / Mosques:</strong>
                        <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-subtle)' }}>
                          {selectedItem.food_highlights.mosques.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    )}

                    {selectedItem.food_highlights.ingredientCautions && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                        ⚠️ <strong>Ingredient Caution:</strong> {selectedItem.food_highlights.ingredientCautions}
                      </div>
                    )}
                  </div>
                )}

                {/* Emergency Hospital Contacts */}
                {selectedItem.hospital_contacts && selectedItem.hospital_contacts.length > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldAlert size={15} /> Tourist-Friendly Medical Centers & 24/7 ER
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {selectedItem.hospital_contacts.map((hosp, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem', fontSize: '0.78rem' }}>{hosp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Country Details */}
            {selectedItem.entityType === 'country' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                {selectedItem.customs_etiquette?.dos && (
                  <div>
                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                      ✓ Cultural Dos & Etiquette:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {selectedItem.customs_etiquette.dos.map((item, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedItem.customs_etiquette?.donts && (
                  <div>
                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: '#f87171' }}>
                      ✕ Cultural Don'ts & Sensitive Norms:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {selectedItem.customs_etiquette.donts.map((item, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setSingleAuditResult(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TOUR LEADER POCKET GUIDE EXPORTER                                  */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FileText size={22} color="var(--success)" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Tour Leader Pocket Guide</h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Generate printable briefing cheat sheet or WhatsApp summary for field staff</p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem' }}>Select Destination Country:</label>
              <select
                value={guideCountry}
                onChange={(e) => setGuideCountry(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: '#fff' }}
              >
                <option value="">-- Choose Country --</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </div>

            {guideCountry && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                lineHeight: '1.5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
                    📋 Field Briefing Sheet: {countries.find(c => c.id === guideCountry)?.name}
                  </h3>
                  <button
                    onClick={() => {
                      const c = countries.find(co => co.id === guideCountry);
                      const objs = tourObjects.filter(o => o.country_id === guideCountry);
                      const text = `*TRAVELOPS TOUR LEADER POCKET GUIDE: ${c?.name}*\n` +
                        `🚨 Emergency Police/Amb: ${c?.emergency?.police || '112'} / ${c?.emergency?.ambulance || '112'}\n` +
                        `🔌 Power: ${c?.power_plugs?.types?.join('/') || 'Type C'} (${c?.power_plugs?.voltage || '220V'})\n` +
                        `💧 Water: ${c?.water_safety || 'Bottled'}\n\n` +
                        `*ATTRACTION RESTRICTIONS & BRIEFINGS:*\n` +
                        objs.map(o => `• *${o.name}* (${o.est_duration_minutes || 90}m)\n  Dress: ${o.dress_code || 'Standard'}\n  Tip: ${o.guide_briefing_notes?.[0] || 'N/A'}`).join('\n\n');
                      handleCopyGuideText(text);
                    }}
                    style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--primary)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy to WhatsApp'}
                  </button>
                </div>

                <div style={{ color: 'var(--text-subtle)' }}>
                  {tourObjects.filter(o => o.country_id === guideCountry).map(o => (
                    <div key={o.id} style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>📍 {o.name}</strong> ({o.est_duration_minutes || 90} mins)
                      <div style={{ color: '#f87171', fontSize: '0.75rem' }}>Dress: {o.dress_code || 'None'}</div>
                      <div style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>Note: {o.guide_briefing_notes?.[0] || 'Standard operations'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowGuideModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Printer size={15} /> Print Field Packet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KnowledgeBase;
