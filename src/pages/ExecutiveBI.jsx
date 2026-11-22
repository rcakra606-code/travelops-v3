import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, DollarSign, TrendingUp, Sparkles, Download, Printer, ShieldAlert,
  SlidersHorizontal, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import BiPageHeader from '../components/bi/BiPageHeader';
import BiFilterBar from '../components/bi/BiFilterBar';
import { BiLoadingGrid } from '../components/bi/BiStates';
import OperationalAnalyticsTab from '../components/bi/OperationalAnalyticsTab';
import FinancialAnalyticsTab from '../components/bi/FinancialAnalyticsTab';
import BusinessAnalyticsTab from '../components/bi/BusinessAnalyticsTab';
import AiBusinessInsightsPanel from '../components/bi/AiBusinessInsightsPanel';
import { useAuth } from '../context/AuthContext';
import { useTours } from '../context/TourContext';
import { useDocuments } from '../context/DocumentContext';
import { useHotels } from '../context/HotelContext';
import { useCruises } from '../context/CruiseContext';
import { useTelecoms } from '../context/TelecomContext';
import { useCorporate } from '../context/CorporateContext';
import { useSales } from '../context/SalesContext';
import { useProductivity } from '../context/ProductivityContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useToast } from '../context/ToastContext';
import { computeExecutiveBiAnalytics } from '../utils/biAnalyticsEngine';
import { escapeCsvCell, formatIdr, formatPercent } from '../utils/formatters';

const BI_TABS = [
  { id: 'operational', label: 'Operasional', icon: Activity },
  { id: 'financial', label: 'Finansial', icon: DollarSign },
  { id: 'business', label: 'Bisnis & Pertumbuhan', icon: TrendingUp },
  { id: 'ai', label: 'AI BI Analyst', icon: Sparkles }
];

const ExecutiveBI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { tours, loading: toursLoading } = useTours();
  const { documents, loading: docsLoading } = useDocuments();
  const { hotels, loading: hotelsLoading } = useHotels();
  const { cruises, loading: cruisesLoading } = useCruises();
  const { telecoms, loading: telecomsLoading } = useTelecoms();
  const { corporateAccounts, corporateSales, loading: corpLoading } = useCorporate();
  const { sales, loading: salesLoading } = useSales();
  const { productivityData, loading: prodLoading } = useProductivity();
  const { overtimes, loading: otLoading } = useOvertimes();

  const isStaffOnly = user?.role === 'Staff';
  const canViewAllScope = !isStaffOnly;
  const userName = user?.name || '';
  const userRole = user?.role || 'Staff';

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('operational');
  const [periodPreset, setPeriodPreset] = useState('this_quarter');
  const [selectedScope, setSelectedScope] = useState(() => (isStaffOnly ? 'mine' : 'all'));
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem('travelops_bi_density') === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleDensity = useCallback((nextDensity) => {
    setDensity(nextDensity);
    try {
      localStorage.setItem('travelops_bi_density', nextDensity);
    } catch {
      // ignore
    }
  }, []);

  const effectiveScope = canViewAllScope ? selectedScope : 'mine';

  useEffect(() => {
    const onResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  }, []);

  const isColdLoading =
    toursLoading &&
    docsLoading &&
    hotelsLoading &&
    cruisesLoading &&
    telecomsLoading &&
    corpLoading &&
    salesLoading &&
    prodLoading &&
    otLoading &&
    (tours || []).length === 0;

  const analytics = useMemo(
    () =>
      computeExecutiveBiAnalytics({
        tours,
        documents,
        hotels,
        cruises,
        telecoms,
        corporateAccounts,
        corporateSales,
        sales,
        productivityData,
        overtimes,
        periodPreset,
        scope: effectiveScope,
        staffName: userName
      }),
    [
      tours,
      documents,
      hotels,
      cruises,
      telecoms,
      corporateAccounts,
      corporateSales,
      sales,
      productivityData,
      overtimes,
      periodPreset,
      effectiveScope,
      userName
    ]
  );

  const handleDrilldown = useCallback(
    (path, navState) => {
      if (!path) return;
      navigate(path, navState ? { state: { ...navState, _ts: Date.now() } } : undefined);
    },
    [navigate]
  );

  const handleExportCsv = useCallback(() => {
    try {
      const { operational, financial, business, meta } = analytics;
      const rows = [
        ['Domain', 'Metrik', 'Nilai Periode Aktif', 'Perubahan vs Pembanding', 'Catatan'],
        [
          'Metadata',
          'Periode Analisis',
          meta.currentWindowLabel,
          meta.previousWindowLabel || 'All Time',
          meta.scope === 'mine' ? `Portofolio Saya (${userName})` : 'Seluruh Cabang'
        ],
        [
          'Operational',
          'Total Booking Lintas Modul',
          operational.kpis.totalBookings.value,
          operational.kpis.totalBookings.delta?.label || '-',
          operational.kpis.totalBookings.breakdown
        ],
        [
          'Operational',
          'Total Pax Aktif',
          operational.kpis.totalPax.value,
          operational.kpis.totalPax.delta?.label || '-',
          'Tour + Cruise non-batal'
        ],
        [
          'Operational',
          'Tour Confirmation Rate',
          formatPercent(operational.kpis.tourConfirmationRate.value, 1),
          operational.kpis.tourConfirmationRate.delta?.label || '-',
          `${operational.kpis.tourConfirmationRate.confirmed}/${operational.kpis.tourConfirmationRate.total} tour`
        ],
        [
          'Operational',
          'Avg Turnaround Visa/Dokumen (Hari)',
          operational.kpis.avgDocTurnaroundDays.value !== null
            ? operational.kpis.avgDocTurnaroundDays.value.toFixed(1)
            : '-',
          '-',
          `Overdue: ${operational.kpis.avgDocTurnaroundDays.overdueCount}`
        ],
        [
          'Financial',
          'Total Revenue Operasional',
          formatIdr(financial.kpis.operationalRevenue.value),
          financial.kpis.operationalRevenue.delta?.label || '-',
          'Tour Aktif + Corporate B2B + Fee Dokumen'
        ],
        [
          'Financial',
          'Gross Profit Tercatat',
          formatIdr(financial.kpis.grossProfit.value),
          financial.kpis.grossProfit.delta?.label || '-',
          `Gross Margin: ${formatPercent(financial.kpis.grossProfit.marginPct, 1)}`
        ],
        [
          'Financial',
          'Piutang Tour Aktif (AR)',
          formatIdr(financial.kpis.outstandingReceivables.value),
          '-',
          `Mendesak <= H-7: ${formatIdr(financial.kpis.outstandingReceivables.urgentAmount)}`
        ],
        [
          'Financial',
          'Nilai Pembatalan Tour',
          formatIdr(financial.kpis.cancelledBookingValue.value),
          financial.kpis.cancelledBookingValue.delta?.label || '-',
          `${financial.kpis.cancelledBookingValue.cancelledCount} booking batal`
        ],
        [
          'Business',
          'Avg Tour Order Value',
          formatIdr(business.kpis.avgTourOrderValue.value),
          business.kpis.avgTourOrderValue.delta?.label || '-',
          `Rev/Pax: ${formatIdr(business.kpis.avgTourOrderValue.revenuePerPax)}`
        ],
        [
          'Business',
          'Pencapaian Target Sales',
          business.kpis.quotaAttainment.value !== null
            ? formatPercent(business.kpis.quotaAttainment.value, 1)
            : '-',
          '-',
          `${business.kpis.quotaAttainment.tiers.achieved} Achieved / ${business.kpis.quotaAttainment.totalConsultants} konsultan`
        ]
      ];

      const csv = rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TravelOps_Executive_BI_${periodPreset}_${effectiveScope}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Ringkasan Executive BI berhasil diekspor ke CSV.');
    } catch {
      toast.error('Gagal mengekspor CSV.');
    }
  }, [analytics, effectiveScope, periodPreset, toast, userName]);

  const signalCount = analytics.signals.length;
  const criticalCount = analytics.signals.filter((s) => s.severity === 'critical').length;

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        <main className="content-area">
          <div className="page-container" data-bi-density={density}>
            <BiPageHeader
              eyebrow="Enterprise Business Intelligence"
              title="Executive Analytics Hub"
              subtitle="Pemantauan terpadu kinerja Operasional, Finansial, dan Komersial berbasis data riil Supabase dengan AI BI Analyst."
              metaBadge={
                <span className="bi-micro-badge">
                  {analytics.meta.totalRecordsAnalyzed} transaksi periode ini
                </span>
              }
              actions={
                <>
                  <div
                    role="group"
                    aria-label="Kepadatan tampilan"
                    className="no-print"
                    style={{
                      display: 'inline-flex',
                      background: 'var(--bg-surface)',
                      padding: '2px',
                      borderRadius: '7px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {[
                      { id: 'comfortable', label: 'Nyaman' },
                      { id: 'compact', label: 'Padat' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={density === d.id}
                        onClick={() => toggleDensity(d.id)}
                        style={{
                          border: 'none',
                          borderRadius: '5px',
                          padding: '0.28rem 0.55rem',
                          fontSize: '0.73rem',
                          fontWeight: density === d.id ? 700 : 500,
                          cursor: 'pointer',
                          background: density === d.id ? 'var(--bg-card)' : 'transparent',
                          color: density === d.id ? 'var(--text-main)' : 'var(--text-muted)'
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="btn btn-secondary no-print"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', borderRadius: '8px' }}
                  >
                    <Download size={14} aria-hidden="true" />
                    Ekspor CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-secondary no-print"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', borderRadius: '8px' }}
                  >
                    <Printer size={14} aria-hidden="true" />
                    Cetak Ringkasan
                  </button>
                </>
              }
            />

            {/* Mobile Filter Drawer Trigger */}
            <div className="bi-mobile-filter-toggle no-print" style={{ marginBottom: '0.65rem', width: '100%' }}>
              <button
                type="button"
                aria-expanded={mobileFilterOpen}
                onClick={() => setMobileFilterOpen((prev) => !prev)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  padding: '0.48rem 0.78rem',
                  borderRadius: '8px'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  Filter: <strong>{analytics.meta.currentWindowLabel}</strong> · {effectiveScope === 'mine' ? 'Portofolio Saya' : 'Seluruh Cabang'}
                </span>
                {mobileFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Global Period & RBAC Scope Filter Bar */}
            <div className={`bi-filter-collapsible ${mobileFilterOpen ? '' : 'is-collapsed-mobile'}`}>
              <BiFilterBar
                periodPreset={periodPreset}
                onPeriodChange={setPeriodPreset}
                periodWindowLabel={analytics.meta.currentWindowLabel}
                comparisonWindowLabel={analytics.meta.previousWindowLabel}
                scope={effectiveScope}
                onScopeChange={setSelectedScope}
                canViewAllScope={canViewAllScope}
              />
            </div>

            {/* Executive Anomaly Pulse Banner (Always visible across Operational/Financial/Business tabs) */}
            {activeTab !== 'ai' && signalCount > 0 && (
              <div
                role="status"
                className="no-print"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  padding: '0.58rem 0.88rem',
                  marginBottom: '0.9rem',
                  borderRadius: '8px',
                  background: criticalCount > 0 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${criticalCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  fontSize: '0.77rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <ShieldAlert size={15} color={criticalCount > 0 ? 'var(--danger)' : 'var(--warning)'} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ color: 'var(--text-main)' }}>
                    <strong>{signalCount} sinyal bisnis terdeteksi</strong>
                    {criticalCount > 0 ? ` (${criticalCount} kritis)` : ''}: {analytics.signals[0].title}
                    {signalCount > 1 ? ` + ${signalCount - 1} lainnya` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Tinjau di AI BI Analyst <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Domain Navigation Tabs */}
            <div
              className="bi-domain-tabs no-print"
              role="tablist"
              aria-label="Domain Business Intelligence"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.15rem',
                overflowX: 'auto',
                paddingBottom: '0.1rem'
              }}
            >
              {BI_TABS.map((tab) => {
                const IconComp = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`bi-tab-${tab.id}`}
                    aria-selected={active}
                    aria-controls={`bi-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.42rem',
                      padding: '0.62rem 0.95rem',
                      border: 'none',
                      borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                      background: 'transparent',
                      color: active ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.83rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.14s ease, border-color 0.14s ease'
                    }}
                  >
                    <IconComp size={15} color={active ? 'var(--primary)' : 'currentColor'} aria-hidden="true" />
                    <span>{tab.label}</span>
                    {tab.id === 'ai' && signalCount > 0 && (
                      <span
                        title={`${signalCount} sinyal anomali terdeteksi`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.18rem',
                          padding: '0.06rem 0.4rem',
                          borderRadius: '9999px',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          background: criticalCount > 0 ? 'rgba(244, 63, 94, 0.14)' : 'rgba(245, 158, 11, 0.15)',
                          color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)'
                        }}
                      >
                        <ShieldAlert size={10} aria-hidden="true" />
                        {signalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active BI Panel */}
            {isColdLoading ? (
              <BiLoadingGrid kpiCount={4} />
            ) : (
              <div
                role="tabpanel"
                id={`bi-panel-${activeTab}`}
                aria-labelledby={`bi-tab-${activeTab}`}
              >
                {activeTab === 'operational' && (
                  <OperationalAnalyticsTab analytics={analytics} onNavigate={handleDrilldown} />
                )}
                {activeTab === 'financial' && (
                  <FinancialAnalyticsTab analytics={analytics} onNavigate={handleDrilldown} />
                )}
                {activeTab === 'business' && (
                  <BusinessAnalyticsTab analytics={analytics} onNavigate={handleDrilldown} />
                )}
                {activeTab === 'ai' && (
                  <AiBusinessInsightsPanel
                    analytics={analytics}
                    userRole={userRole}
                    onNavigate={handleDrilldown}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExecutiveBI;
