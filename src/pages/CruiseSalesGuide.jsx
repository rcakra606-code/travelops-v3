import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import ConfirmModal from '../components/ConfirmModal';
import CruiseGuideDossierDrawer from '../components/cruise/CruiseGuideDossierDrawer';
import CruiseGuideFormModal from '../components/cruise/CruiseGuideFormModal';
import CruiseAiFreshnessModal from '../components/cruise/CruiseAiFreshnessModal';
import FleetExplorerTab from '../components/cruise/FleetExplorerTab';
import {
  CabinDeckTab,
  ComparisonTab,
  ComplianceTab,
  PlaybookTab,
  PricingCalculatorTab,
  SeasonalityTab
} from '../components/cruise/CruiseGuideTabs';
import { supabase } from '../supabaseClient';
import { QUERY_KEYS } from '../lib/queryClient';
import { useAuth } from '../context/AuthContext';
import { useCruises } from '../context/CruiseContext';
import { useToast } from '../context/ToastContext';
import {
  CLIENT_PROFILES,
  CRUISE_REGIONS,
  SEED_CRUISE_GUIDES
} from '../utils/cruiseSalesGuideData';
import {
  buildPreSailingChecklistWhatsApp,
  buildShipWhatsAppBriefing,
  formatBudgetTier,
  formatGratuityBadge,
  getRegionLabel,
  normalizeCruiseGuide,
  recommendCruises,
  toCruiseGuideDbPayload
} from '../utils/cruiseSalesGuideHelpers';
import {
  generatePreSailingChecklistPdf,
  generateShipInfoPdf
} from '../utils/cruiseSalesGuidePdf';
import {
  applyCruiseAuditToGuide,
  getCruiseFreshnessStatus
} from '../utils/cruiseAiFreshnessAgent';
import {
  Ship, Search, Plus, Copy, Check, FileDown, Eye, Scale, BedDouble, Calculator,
  ShieldAlert, CalendarDays, MessageSquare, Sparkles, Anchor, Edit3, RotateCcw, Database, Bot
} from 'lucide-react';

const TABS = [
  { id: 'brands', label: 'Brand & Ringkasan', icon: <Ship size={15} /> },
  { id: 'fleet', label: 'Armada Kapal', icon: <Anchor size={15} /> },
  { id: 'compare', label: 'Bandingkan', icon: <Scale size={15} /> },
  { id: 'cabins', label: 'Kabin & Deck', icon: <BedDouble size={15} /> },
  { id: 'pricing', label: 'Harga & Kalkulator', icon: <Calculator size={15} /> },
  { id: 'compliance', label: 'Aturan Wajib', icon: <ShieldAlert size={15} /> },
  { id: 'seasonality', label: 'Musim & Rute', icon: <CalendarDays size={15} /> },
  { id: 'playbook', label: 'Playbook & FAQ', icon: <MessageSquare size={15} /> }
];

const halalBadgeStyle = (status) => {
  if (status === 'Certified Halal Kitchen') {
    return { bg: 'rgba(16,185,129,0.14)', color: '#10b981', border: 'rgba(16,185,129,0.35)' };
  }
  if (status === 'Pre-Order Halal') {
    return { bg: 'rgba(14,165,233,0.14)', color: '#0284c7', border: 'rgba(14,165,233,0.35)' };
  }
  return { bg: 'rgba(245,158,11,0.14)', color: '#d97706', border: 'rgba(245,158,11,0.35)' };
};

const fetchCruiseGuidesFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_cruise_guides')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('brand_name', { ascending: true });

  if (error) {
    return { items: SEED_CRUISE_GUIDES, source: 'seed', dbError: error.message };
  }
  if (!data || data.length === 0) {
    return { items: SEED_CRUISE_GUIDES, source: 'seed-empty', dbError: null };
  }
  return {
    items: data.map(normalizeCruiseGuide).filter(Boolean),
    source: 'supabase',
    dbError: null
  };
};

const CruiseSalesGuide = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('brands');
  const [fleetBrandFilter, setFleetBrandFilter] = useState('all');
  const [fleetFilterNonce, setFleetFilterNonce] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareIds, setCompareIds] = useState(['disney-cruise-line', 'stardream-cruises', 'royal-caribbean']);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [formModal, setFormModal] = useState(null); // { mode, guide, key }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [showAiAgent, setShowAiAgent] = useState(false);
  const [auditResults, setAuditResults] = useState([]);
  const [lastAiScanAt, setLastAiScanAt] = useState(() => {
    try {
      return localStorage.getItem('travelops_last_cruise_ai_audit') || null;
    } catch {
      return null;
    }
  });
  const [auditingBrandId, setAuditingBrandId] = useState(null);
  const [singleAuditResult, setSingleAuditResult] = useState(null);
  const [auditingShipKey, setAuditingShipKey] = useState(null);
  const [shipAuditMap, setShipAuditMap] = useState({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { cruises = [] } = useCruises() || {};
  const { toast } = useToast();

  const canEdit =
    user?.role === 'Admin' ||
    user?.role === 'Manager' ||
    user?.email === 'admin@travelops.com';

  const { data: guideSnapshot, isLoading } = useQuery({
    queryKey: QUERY_KEYS.cruiseGuides,
    queryFn: fetchCruiseGuidesFromDb,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000
  });

  const guides = useMemo(() => guideSnapshot?.items || SEED_CRUISE_GUIDES, [guideSnapshot]);
  const dataSource = guideSnapshot?.source || 'seed';
  const totalOperatingShips = useMemo(
    () => guides.reduce((sum, g) => sum + (g.featuredShips?.length || 0), 0),
    [guides]
  );
  const staleBrandCount = useMemo(
    () => guides.filter((g) => getCruiseFreshnessStatus(g.lastVerifiedAt, g.auditStatus).needsCheck).length,
    [guides]
  );

  // Live booking counts per cruise brand from TravelOps Cruise module
  const bookingCountByBrand = useMemo(() => {
    const map = {};
    (cruises || []).forEach((c) => {
      const rawBrand = String(c.cruiseBrand || c.cruise_brand || '').toLowerCase();
      const rawShip = String(c.shipName || c.ship_name || '').toLowerCase();
      guides.forEach((g) => {
        const bMatch =
          rawBrand &&
          (g.brandName.toLowerCase().includes(rawBrand) ||
            rawBrand.includes(g.brandName.toLowerCase().split(' ')[0]));
        const sMatch =
          rawShip &&
          (g.featuredShips || []).some((s) => rawShip.includes(s.name.toLowerCase()));
        if (bMatch || sMatch) {
          map[g.id] = (map[g.id] || 0) + 1;
        }
      });
    });
    return map;
  }, [cruises, guides]);

  const rankedResults = useMemo(
    () =>
      recommendCruises(guides, {
        profile: selectedProfile,
        region: selectedRegion,
        query: searchQuery
      }),
    [guides, selectedProfile, selectedRegion, searchQuery]
  );

  const selectedGuide = useMemo(
    () => guides.find((g) => g.id === selectedGuideId) || null,
    [guides, selectedGuideId]
  );

  const hasProfilerFilter = selectedProfile !== 'all' || selectedRegion !== 'all' || Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSelectedProfile('all');
    setSelectedRegion('all');
    setSearchQuery('');
  };

  const toggleCompare = (guideId) => {
    setCompareIds((prev) => {
      if (prev.includes(guideId)) {
        return prev.filter((id) => id !== guideId);
      }
      if (prev.length >= 3) {
        toast.info('Maksimal 3 brand untuk dibandingkan — pilihan pertama diganti.');
        return [...prev.slice(1), guideId];
      }
      return [...prev, guideId];
    });
  };

  const handleSaveGuide = async (guidePayload) => {
    const dbRow = toCruiseGuideDbPayload(guidePayload, user?.name || user?.email || 'Admin');
    const { error } = await supabase.from('travelops_cruise_guides').upsert([dbRow]);
    if (error) {
      throw new Error(
        `Database belum siap (${error.message}). Jalankan SQL migrasi travelops_cruise_guides di Supabase terlebih dahulu.`
      );
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });
    toast.success(`Panduan "${guidePayload.brandName}" berhasil disimpan!`);
  };

  const handleDeleteGuide = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('travelops_cruise_guides')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      if (selectedGuideId === deleteTarget.id) setSelectedGuideId(null);
      setCompareIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });
      toast.success(`Brand "${deleteTarget.brandName}" dihapus.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Gagal menghapus: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncSeedToDb = async () => {
    try {
      setSeeding(true);
      const rows = SEED_CRUISE_GUIDES.map((g) => toCruiseGuideDbPayload(g, user?.name || 'Admin Seed'));
      const { error } = await supabase.from('travelops_cruise_guides').upsert(rows);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });
      toast.success('10 data awal brand cruise berhasil disinkronkan ke Supabase!');
    } catch (err) {
      toast.error(`Gagal sinkronisasi ke database: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyShipWa = async (guide) => {
    try {
      await navigator.clipboard.writeText(buildShipWhatsAppBriefing(guide));
      setCopiedId(guide.id);
      toast.success(`Ringkasan WhatsApp ${guide.brandName} disalin!`);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error('Gagal menyalin ke clipboard.');
    }
  };

  const handleCopyChecklistWa = async () => {
    try {
      await navigator.clipboard.writeText(buildPreSailingChecklistWhatsApp());
      toast.success('Checklist Persiapan Berlayar disalin untuk WhatsApp!');
    } catch {
      toast.error('Gagal menyalin ke clipboard.');
    }
  };

  const handleDownloadShipPdf = async (guide) => {
    try {
      setExportingId(guide.id);
      await generateShipInfoPdf(guide, user?.name || '');
      toast.success(`PDF Info ${guide.brandName} berhasil diunduh!`);
    } catch (err) {
      toast.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingId(null);
    }
  };

  const handleDownloadChecklistPdf = async () => {
    try {
      setExportingId('checklist');
      await generatePreSailingChecklistPdf(user?.name || '');
      toast.success('PDF Checklist Persiapan Berlayar diunduh!');
    } catch (err) {
      toast.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingId(null);
    }
  };

  const handleCreateBooking = (guide, ship = null) => {
    navigate('/cruise', {
      state: {
        openNew: true,
        prefillBrand: guide.brandName,
        prefillShip: ship?.name || guide.featuredShips?.[0]?.name || ''
      }
    });
  };

  const openBrandFleet = (brandId) => {
    setFleetBrandFilter(brandId);
    setFleetFilterNonce((n) => n + 1);
    setActiveTab('fleet');
  };

  // ---------------- Cruise AI Freshness Agent Handlers ----------------
  const requestCruiseAiAudit = async ({ mode = 'brand', guide, ship = null }) => {
    let token = '';
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || '';
    } catch {
      // ignore
    }

    const res = await fetch('/api/cruise-guide/ai-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ mode, guide, ship })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || `Gagal menjalankan AI Agent (HTTP ${res.status}).`);
    }
    return json.data;
  };

  const applyAuditResultToDb = async (auditResult, { silent = false } = {}) => {
    const targetGuide = guides.find((g) => g.id === auditResult.guideId);
    if (!targetGuide) throw new Error('Brand target tidak ditemukan.');
    const merged = applyCruiseAuditToGuide(targetGuide, auditResult, {
      updatedBy: `${user?.name || 'Admin'} (Cruise AI Agent)`
    });
    const dbRow = toCruiseGuideDbPayload(merged, `${user?.name || 'Admin'} (Cruise AI Agent)`);
    const { error } = await supabase.from('travelops_cruise_guides').upsert([dbRow]);
    if (error) throw error;

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });

    setAuditResults((prev) =>
      prev.map((item) =>
        item.guideId === auditResult.guideId && item.shipName === auditResult.shipName
          ? { ...item, applied: true, status: 'verified', totalChanges: 0 }
          : item
      )
    );
    setSingleAuditResult((prev) =>
      prev && prev.guideId === auditResult.guideId ? { ...prev, applied: true, status: 'verified', totalChanges: 0 } : prev
    );
    if (auditResult.shipName) {
      setShipAuditMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k]?.guideId === auditResult.guideId && next[k]?.shipName === auditResult.shipName) {
            next[k] = { ...next[k], applied: true, status: 'verified', totalChanges: 0 };
          }
        });
        return next;
      });
    }
    if (!silent) {
      toast.success(`Pembaruan AI untuk "${targetGuide.brandName}" berhasil diterapkan ke database!`);
    }
  };

  const handleMarkVerified = async (auditResult) => {
    const nowIso = auditResult.verifiedAt || new Date().toISOString();
    const { error } = await supabase
      .from('travelops_cruise_guides')
      .update({
        last_verified_at: nowIso,
        audit_status: 'verified',
        verification_notes: auditResult.verificationNotes || 'Terverifikasi oleh Cruise AI Agent',
        updated_at: nowIso
      })
      .eq('id', auditResult.guideId);
    if (error) {
      toast.error(`Gagal menyimpan status verifikasi: ${error.message}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });
    setAuditResults((prev) =>
      prev.map((item) => (item.guideId === auditResult.guideId ? { ...item, applied: true } : item))
    );
    setSingleAuditResult((prev) =>
      prev && prev.guideId === auditResult.guideId ? { ...prev, applied: true } : prev
    );
    toast.success(`"${auditResult.brandName}" ditandai terverifikasi!`);
  };

  const handleRunAuditBrand = async (guide, { autoApply = false } = {}) => {
    try {
      const result = await requestCruiseAiAudit({ mode: 'brand', guide });
      let finalResult = result;
      if (autoApply && canEdit && result.totalChanges > 0) {
        await applyAuditResultToDb(result, { silent: true });
        finalResult = { ...result, applied: true };
      } else if (autoApply && canEdit && result.totalChanges === 0) {
        await supabase
          .from('travelops_cruise_guides')
          .update({
            last_verified_at: result.verifiedAt,
            audit_status: 'verified',
            verification_notes: result.verificationNotes,
            updated_at: result.verifiedAt
          })
          .eq('id', guide.id);
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cruiseGuides });
        finalResult = { ...result, applied: true };
      }

      setAuditResults((prev) => {
        const idx = prev.findIndex((x) => x.guideId === guide.id && !x.shipName);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = finalResult;
          return copy;
        }
        return [finalResult, ...prev];
      });
      const nowIso = new Date().toISOString();
      setLastAiScanAt(nowIso);
      try {
        localStorage.setItem('travelops_last_cruise_ai_audit', nowIso);
      } catch {
        // ignore
      }
      return finalResult;
    } catch (err) {
      toast.error(`Gagal audit ${guide.brandName}: ${err.message}`);
      return null;
    }
  };

  const handleAuditSingleBrandInDrawer = async (guide) => {
    try {
      setAuditingBrandId(guide.id);
      const result = await handleRunAuditBrand(guide, { autoApply: false });
      if (result) {
        setSingleAuditResult(result);
        if (result.totalChanges > 0) {
          toast.warning(`AI menemukan ${result.totalChanges} rekomendasi update untuk ${guide.brandName}.`);
        } else {
          toast.success(`${guide.brandName} terverifikasi akurat!`);
        }
      }
    } finally {
      setAuditingBrandId(null);
    }
  };

  const handleAuditSingleShip = async (entry) => {
    try {
      setAuditingShipKey(entry.key);
      const result = await requestCruiseAiAudit({
        mode: 'ship',
        guide: entry.guide,
        ship: entry.ship
      });
      setShipAuditMap((prev) => ({ ...prev, [entry.key]: result }));
      if (result.totalChanges > 0) {
        toast.warning(`AI menemukan ${result.totalChanges} pembaruan untuk kapal ${entry.ship.name}.`);
      } else {
        toast.success(`Kapal ${entry.ship.name} terverifikasi masih aktif & akurat!`);
      }
    } catch (err) {
      toast.error(`Gagal cek AI kapal ${entry.ship.name}: ${err.message}`);
    } finally {
      setAuditingShipKey(null);
    }
  };

  const handleApplyAllUpdates = async () => {
    const pending = auditResults.filter((r) => r.totalChanges > 0 && !r.applied);
    if (pending.length === 0) return;
    let appliedCount = 0;
    for (const item of pending) {
      try {
        await applyAuditResultToDb(item, { silent: true });
        appliedCount += 1;
      } catch (err) {
        toast.error(`Gagal menerapkan update ${item.brandName}: ${err.message}`);
      }
    }
    if (appliedCount > 0) {
      toast.success(`${appliedCount} brand berhasil diperbarui otomatis ke database!`);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isSidebarOpen}
        closeMobile={() => {
          if (window.innerWidth <= 768) setIsSidebarOpen(false);
        }}
      />
      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <main className="main-content">
        <TopNav
          toggleSidebar={() => setIsSidebarOpen((v) => !v)}
          title="Panduan Penjualan Kapal Pesiar"
        />

        <div className="content-area fade-in">
          <div
            className="page-container"
            style={{
              maxWidth: '1460px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
              paddingBottom: '4.5rem'
            }}
          >
            {/* Hero Header */}
            <div
              className="card"
              style={{
                padding: '1.35rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.11) 0%, rgba(37,99,235,0.05) 55%, var(--bg-card) 100%)',
                borderLeft: '4px solid var(--primary)',
                overflow: 'visible'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ maxWidth: '680px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em', padding: '0.2rem 0.6rem', borderRadius: 999, background: 'rgba(14,165,233,0.16)', color: 'var(--primary)' }}>
                      ⚓ CRUISE SALES ENABLEMENT HUB
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      <Database size={12} />
                      {dataSource === 'supabase'
                        ? `Live Database · ${guides.length} Brand · ${totalOperatingShips} Kapal Aktif`
                        : `Katalog Referensi · ${guides.length} Brand · ${totalOperatingShips} Kapal Aktif`}
                    </span>
                  </div>
                  <h1 style={{ margin: '0.5rem 0 0.3rem', fontSize: '1.48rem', fontWeight: 800, lineHeight: 1.2 }}>
                    Panduan Penjualan Kapal Pesiar
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-subtle)', lineHeight: 1.55 }}>
                    Cocokkan kapal terbaik sesuai profil klien, bandingkan fitur & aturan Halal secara instan, hitung estimasi gratuity, lalu kirim ringkasan WhatsApp atau PDF langsung ke calon peserta.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAiAgent(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      padding: '0.5rem 0.9rem',
                      background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                      border: 'none'
                    }}
                  >
                    <Bot size={15} />
                    <span>AI Freshness Agent</span>
                    {staleBrandCount > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.06rem 0.42rem', borderRadius: 999, background: 'rgba(255,255,255,0.22)' }}>
                        {staleBrandCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCopyChecklistWa}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.79rem', padding: '0.48rem 0.8rem' }}
                  >
                    <Copy size={14} /> Checklist WA
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDownloadChecklistPdf}
                    disabled={exportingId === 'checklist'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.79rem', padding: '0.48rem 0.8rem' }}
                  >
                    <FileDown size={14} /> {exportingId === 'checklist' ? 'PDF…' : 'PDF Checklist'}
                  </button>
                  {canEdit && dataSource !== 'supabase' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSyncSeedToDb}
                      disabled={seeding}
                      title="Sinkronkan 10 data awal ke tabel Supabase travelops_cruise_guides"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.79rem', padding: '0.48rem 0.8rem' }}
                    >
                      <Database size={14} /> {seeding ? 'Sync…' : 'Sync DB'}
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setFormModal({ mode: 'create', guide: null, key: `new-${Date.now()}` })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                    >
                      <Plus size={15} /> Tambah Brand
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Client Profiler (Recessed Panel) */}
              <div
                style={{
                  marginTop: '1.05rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '11px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    <Sparkles size={14} color="var(--primary)" /> Cocokkan Kapal untuk Klien (Quick Profiler)
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (activeTab !== 'brands') setActiveTab('brands');
                        }}
                        placeholder="Cari kapal, brand, halal, fitur..."
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.7rem 0.4rem 2rem',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.79rem'
                        }}
                      />
                    </div>
                    {hasProfilerFilter && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '0.38rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--text-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Client Profile Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', minWidth: '82px' }}>Profil Tamu:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedProfile('all'); setActiveTab('brands'); }}
                    style={{
                      padding: '0.26rem 0.68rem',
                      borderRadius: 999,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: `1px solid ${selectedProfile === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedProfile === 'all' ? 'var(--primary)' : 'var(--bg-card)',
                      color: selectedProfile === 'all' ? '#fff' : 'var(--text-subtle)'
                    }}
                  >
                    Semua Profil
                  </button>
                  {CLIENT_PROFILES.map((p) => {
                    const active = selectedProfile === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.shortDesc}
                        onClick={() => { setSelectedProfile(p.id); setActiveTab('brands'); }}
                        style={{
                          padding: '0.26rem 0.68rem',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1px solid ${active ? p.color : 'var(--border)'}`,
                          background: active ? p.color : 'var(--bg-card)',
                          color: active ? '#fff' : 'var(--text-main)'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Region Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', minWidth: '82px' }}>Wilayah Rute:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('all'); setActiveTab('brands'); }}
                    style={{
                      padding: '0.24rem 0.64rem',
                      borderRadius: 999,
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${selectedRegion === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedRegion === 'all' ? 'rgba(14,165,233,0.16)' : 'var(--bg-card)',
                      color: selectedRegion === 'all' ? 'var(--primary)' : 'var(--text-subtle)'
                    }}
                  >
                    Semua Wilayah
                  </button>
                  {CRUISE_REGIONS.map((r) => {
                    const active = selectedRegion === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setSelectedRegion(r.id); setActiveTab('brands'); }}
                        style={{
                          padding: '0.24rem 0.64rem',
                          borderRadius: 999,
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'rgba(14,165,233,0.16)' : 'var(--bg-card)',
                          color: active ? 'var(--primary)' : 'var(--text-subtle)'
                        }}
                      >
                        {r.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Unified Segmented Tab Navigation Rail */}
            <div
              style={{
                display: 'flex',
                gap: '0.32rem',
                flexWrap: 'wrap',
                padding: '0.38rem',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
              }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.48rem 0.88rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: active ? 'var(--primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-subtle)',
                      fontSize: '0.81rem',
                      fontWeight: active ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s'
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.id === 'brands' && (
                      <span style={{ fontSize: '0.7rem', padding: '0.06rem 0.42rem', borderRadius: 999, background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--text-main)' }}>
                        {rankedResults.length}
                      </span>
                    )}
                    {tab.id === 'fleet' && (
                      <span style={{ fontSize: '0.7rem', padding: '0.06rem 0.42rem', borderRadius: 999, background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--text-main)' }}>
                        {totalOperatingShips}
                      </span>
                    )}
                    {tab.id === 'compare' && (
                      <span style={{ fontSize: '0.7rem', padding: '0.06rem 0.42rem', borderRadius: 999, background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--text-main)' }}>
                        {compareIds.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: BRAND & SHIP CARDS */}
            {activeTab === 'brands' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hasProfilerFilter && rankedResults.length > 0 && (
                  <div
                    style={{
                      padding: '0.7rem 1rem',
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <span>
                      ✨ <strong>Rekomendasi Teratas ({rankedResults.length} cocok):</strong>{' '}
                      {rankedResults
                        .slice(0, 3)
                        .map((r) => r.guide.brandName)
                        .join(' · ')}
                    </span>
                    {rankedResults.length >= 2 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setCompareIds(rankedResults.slice(0, 3).map((r) => r.guide.id));
                          setActiveTab('compare');
                        }}
                        style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Bandingkan Top {Math.min(3, rankedResults.length)} →
                      </button>
                    )}
                  </div>
                )}

                {isLoading ? (
                  <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                    Memuat katalog panduan kapal pesiar…
                  </div>
                ) : rankedResults.length === 0 ? (
                  <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <Ship size={28} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem' }}>Tidak ada brand yang cocok dengan kombinasi filter ini</h4>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      Coba reset salah satu filter profil tamu atau wilayah rute.
                    </p>
                    <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.1rem' }}>
                    {rankedResults.map(({ guide, matchReasons }) => {
                      const hStyle = halalBadgeStyle(guide.halalStatus);
                      const fresh = getCruiseFreshnessStatus(guide.lastVerifiedAt, guide.auditStatus);
                      const isCompared = compareIds.includes(guide.id);
                      const count = bookingCountByBrand[guide.id] || 0;

                      return (
                        <div
                          key={guide.id}
                          className="card"
                          onClick={() => setSelectedGuideId(guide.id)}
                          style={{
                            padding: '1.2rem 1.25rem',
                            borderTop: `3px solid ${guide.accentColor || 'var(--primary)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          {/* Header row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25 }}>
                                {guide.brandName}
                              </h3>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                                <span>{guide.segment}</span>
                                <span>·</span>
                                <strong style={{ color: 'var(--text-main)' }}>{formatBudgetTier(guide.budgetTier)}</strong>
                                {guide.vipClubName && (
                                  <>
                                    <span>·</span>
                                    <span>VIP: {guide.vipClubName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(guide.id);
                              }}
                              title={isCompared ? 'Hapus dari perbandingan' : 'Tambahkan ke tab Bandingkan'}
                              style={{
                                padding: '0.26rem 0.6rem',
                                borderRadius: 8,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: `1px solid ${isCompared ? 'var(--primary)' : 'var(--border)'}`,
                                background: isCompared ? 'rgba(14,165,233,0.16)' : 'var(--bg-surface)',
                                color: isCompared ? 'var(--primary)' : 'var(--text-subtle)',
                                flexShrink: 0
                              }}
                            >
                              {isCompared ? '✓ Dibandingkan' : '+ Bandingkan'}
                            </button>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.82rem',
                              color: 'var(--text-subtle)',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {guide.tagline}
                          </p>

                          {/* Match reasons when filtering */}
                          {matchReasons.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
                              {matchReasons.map((reason, idx) => (
                                <span key={idx} style={{ fontSize: '0.71rem', fontWeight: 700, padding: '0.16rem 0.5rem', borderRadius: 6, background: 'rgba(16,185,129,0.14)', color: '#10b981' }}>
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Key Badges — Clean compact row */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.38rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: 999,
                                background: hStyle.bg,
                                color: hStyle.color,
                                border: `1px solid ${hStyle.border}`
                              }}
                            >
                              🌙 {guide.halalStatus}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: 999,
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)'
                              }}
                            >
                              💵 {formatGratuityBadge(guide)}
                            </span>
                            {count > 0 && (
                              <span style={{ fontSize: '0.71rem', fontWeight: 700, padding: '0.2rem 0.52rem', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                {count} booking
                              </span>
                            )}
                            <span
                              title={`Status Freshness AI: ${fresh.label}`}
                              style={{
                                marginLeft: 'auto',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: fresh.tone,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: fresh.tone }} />
                              {fresh.label}
                            </span>
                          </div>

                          {/* Featured ships summary box */}
                          <div style={{ fontSize: '0.78rem', padding: '0.62rem 0.78rem', borderRadius: 9, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                <Anchor size={13} color={guide.accentColor} />
                                <span>{(guide.featuredShips || []).length} Kapal Beroperasi</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBrandFleet(guide.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: 'var(--primary)',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Lihat semua →
                              </button>
                            </div>
                            <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <strong>Unggulan:</strong> {(guide.featuredShips || []).slice(0, 3).map((s) => s.name).join(', ')}
                              {(guide.featuredShips || []).length > 3 ? ` (+${guide.featuredShips.length - 3} lainnya)` : ''}
                            </div>
                            <div style={{ color: 'var(--text-subtle)', fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <strong>Homeport:</strong> {(guide.homeports || []).slice(0, 2).join(', ') || '—'} · {(guide.regions || []).slice(0, 3).map(getRegionLabel).join(', ')}
                            </div>
                          </div>

                          {/* Top 2 highlights — crisp checkmark list */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.34rem', fontSize: '0.79rem', color: 'var(--text-subtle)', lineHeight: 1.48 }}>
                            {(guide.highlights || []).slice(0, 2).map((h, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                                <span style={{ color: guide.accentColor || 'var(--primary)', fontWeight: 800, flexShrink: 0, marginTop: '1px' }}>•</span>
                                <span
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {h}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Card Footer Actions */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: 'auto',
                              paddingTop: '0.7rem',
                              borderTop: '1px solid var(--border)',
                              display: 'flex',
                              gap: '0.42rem',
                              alignItems: 'center'
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setSelectedGuideId(guide.id)}
                              style={{ padding: '0.36rem 0.72rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Eye size={13} /> Detail
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleCopyShipWa(guide)}
                              style={{ padding: '0.36rem 0.75rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              {copiedId === guide.id ? <Check size={13} /> : <Copy size={13} />}
                              {copiedId === guide.id ? 'Disalin' : 'Copy WA'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleDownloadShipPdf(guide)}
                              disabled={exportingId === guide.id}
                              style={{ padding: '0.36rem 0.68rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <FileDown size={13} /> PDF
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setFormModal({ mode: 'edit', guide, key: `edit-${guide.id}-${Date.now()}` })}
                                aria-label={`Edit ${guide.brandName}`}
                                title="Edit brand & armada"
                                style={{ marginLeft: 'auto', padding: '0.36rem 0.54rem', fontSize: '0.76rem' }}
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fleet' && (
              <FleetExplorerTab
                key={`fleet-${fleetBrandFilter}-${fleetFilterNonce}`}
                guides={guides}
                initialBrandId={fleetBrandFilter}
                canEdit={canEdit}
                onOpenBrandDossier={(id) => setSelectedGuideId(id)}
                onCreateBooking={handleCreateBooking}
                onAuditShip={handleAuditSingleShip}
                auditingShipKey={auditingShipKey}
                shipAuditMap={shipAuditMap}
                onApplyAudit={(r) => applyAuditResultToDb(r)}
                consultantName={user?.name || ''}
                toast={toast}
              />
            )}

            {activeTab === 'compare' && (
              <ComparisonTab
                guides={guides}
                compareIds={compareIds}
                setCompareIds={setCompareIds}
                consultantName={user?.name || ''}
                toast={toast}
              />
            )}

            {activeTab === 'cabins' && <CabinDeckTab toast={toast} />}

            {activeTab === 'pricing' && <PricingCalculatorTab guides={guides} toast={toast} />}

            {activeTab === 'compliance' && (
              <ComplianceTab consultantName={user?.name || ''} toast={toast} />
            )}

            {activeTab === 'seasonality' && (
              <SeasonalityTab
                onSelectRegion={(regionId) => {
                  setSelectedRegion(regionId);
                  setActiveTab('brands');
                }}
              />
            )}

            {activeTab === 'playbook' && <PlaybookTab toast={toast} />}
          </div>
        </div>
      </main>

      {/* Dossier Drawer */}
      <CruiseGuideDossierDrawer
        guide={selectedGuide}
        onClose={() => setSelectedGuideId(null)}
        canEdit={canEdit}
        onEdit={(g) => setFormModal({ mode: 'edit', guide: g, key: `edit-${g.id}-${Date.now()}` })}
        onDelete={(g) => setDeleteTarget(g)}
        onCreateBooking={handleCreateBooking}
        onAuditBrand={handleAuditSingleBrandInDrawer}
        auditingBrandId={auditingBrandId}
        singleAuditResult={singleAuditResult}
        onApplyAudit={(r) => applyAuditResultToDb(r)}
        onMarkVerified={handleMarkVerified}
        bookingCount={selectedGuide ? bookingCountByBrand[selectedGuide.id] || 0 : 0}
        consultantName={user?.name || ''}
        toast={toast}
      />

      {/* Cruise AI Freshness Agent Modal */}
      <CruiseAiFreshnessModal
        isOpen={showAiAgent}
        guides={guides}
        canEdit={canEdit}
        auditResults={auditResults}
        lastScanAt={lastAiScanAt}
        onRunAuditBrand={handleRunAuditBrand}
        onApplyAudit={(r) => applyAuditResultToDb(r)}
        onMarkVerified={handleMarkVerified}
        onApplyAllUpdates={handleApplyAllUpdates}
        onClearResults={() => setAuditResults([])}
        onClose={() => setShowAiAgent(false)}
      />

      {/* Admin Add/Edit Modal */}
      {formModal && (
        <CruiseGuideFormModal
          key={formModal.key}
          isOpen
          mode={formModal.mode}
          initialGuide={formModal.guide}
          onClose={() => setFormModal(null)}
          onSave={handleSaveGuide}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Hapus Panduan "${deleteTarget?.brandName || ''}"?`}
        message="Data panduan brand ini akan dihapus dari database Supabase. Anda dapat menambahkannya kembali kapan saja."
        confirmText={deleting ? 'Menghapus…' : 'Hapus'}
        cancelText="Batal"
        isDanger
        onConfirm={handleDeleteGuide}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CruiseSalesGuide;
