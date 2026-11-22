import { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import ExportMenu from '../components/ExportMenu';
import BiPageHeader from '../components/bi/BiPageHeader';
import BiKpiCard from '../components/bi/BiKpiCard';
import StaffScorecardTab from '../components/staff/StaffScorecardTab';
import StaffProductivityTab from '../components/staff/StaffProductivityTab';
import StaffOperationsTab from '../components/staff/StaffOperationsTab';
import StaffQuotaTab from '../components/staff/StaffQuotaTab';
import StaffInspectorDrawer from '../components/staff/StaffInspectorDrawer';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useSales } from '../context/SalesContext';
import { useProductivity, PRODUCTIVITY_CATEGORIES } from '../context/ProductivityContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useDataTable } from '../hooks/useDataTable';
import {
  UserCheck, Target, Briefcase, BarChart2, Award, Printer,
  ChevronLeft, ChevronRight, RotateCcw, Clock, TrendingUp, DollarSign
} from 'lucide-react';
import { formatCompactIdr, formatPercent } from '../utils/formatters';
import {
  isSameStaff,
  getYearMonth,
  shiftYearMonth,
  resolveHorizonRange,
  matchesHorizonRange,
  buildStaffRoster,
  computeConsultantScorecards,
  computeSalesQuotaAnalytics,
  computeStaffProductivityBreakdown,
  computeStaffOperationsAnalytics
} from '../utils/staffPerformanceEngine';

const SCORECARD_EXPORT_COLUMNS = [
  { header: 'Consultant', key: 'staffName' },
  { header: 'Tier', key: 'tierLabel' },
  { header: 'Target Sales', key: 'targetSales', format: 'currency' },
  { header: 'Actual Sales', key: 'actualSales', format: 'currency' },
  { header: 'Sales Quota %', key: 'salesQuotaPct', format: 'percent' },
  { header: 'Productivity Sales', key: 'prodSales', format: 'currency' },
  { header: 'Productivity Profit', key: 'prodProfit', format: 'currency' },
  { header: 'Margin %', key: 'prodMarginPct', format: 'percent' },
  { header: 'Cross-Sell %', key: 'crossSellPct', format: 'percent' },
  { header: 'Ops Files Handled', key: 'totalOpsFiles' },
  { header: 'Approved OT (Hrs)', key: 'overtimeApprovedHrs' }
];

const HORIZON_MODES = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'Monthly' },
  { id: 'quarter', label: 'Quarterly' },
  { id: 'year', label: 'Full Year' },
  { id: 'custom', label: 'Custom' }
];

const StaffPerformance = () => {
  const { user } = useAuth();
  const { users } = useUsers();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { telecoms } = useTelecoms();
  const { sales } = useSales();
  const { productivityData } = useProductivity();
  const { overtimes } = useOvertimes();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isStaffRole = user?.role === 'Staff';

  // Multi-Horizon Period Filter State
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentYearNum = today.getFullYear();
  const currentQuarterNum = Math.floor(today.getMonth() / 3) + 1;

  const [horizonMode, setHorizonMode] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNum);
  const [customStartMonth, setCustomStartMonth] = useState(`${currentYearNum}-01`);
  const [customEndMonth, setCustomEndMonth] = useState(currentMonthStr);

  const [selectedStaff, setSelectedStaff] = useState(() => (isStaffRole ? user?.name || 'All' : 'All'));
  const [activeTab, setActiveTab] = useState('scorecard');
  const [prodChartMetric, setProdChartMetric] = useState('sales');
  const [toursPerPage, setToursPerPage] = useState(10);

  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    mode: 'consultant',
    staffName: null,
    categoryName: null,
    tourId: null
  });

  const staffNameFilter = isStaffRole ? user?.name || '' : selectedStaff;

  const staffRoster = useMemo(
    () =>
      buildStaffRoster({
        users,
        sales,
        productivityData,
        tours,
        cruises,
        hotels,
        documents,
        telecoms,
        overtimes,
        currentUser: user
      }),
    [users, sales, productivityData, tours, cruises, hotels, documents, telecoms, overtimes, user]
  );

  const availableYears = useMemo(() => {
    const yrs = new Set([currentYearNum - 1, currentYearNum, currentYearNum + 1]);
    const collectYear = (raw) => {
      const ym = getYearMonth(raw);
      if (ym) {
        const y = Number(ym.slice(0, 4));
        if (y > 2000) yrs.add(y);
      }
    };
    (sales || []).forEach((s) => collectYear(s.period));
    (productivityData || []).forEach((p) => collectYear(p.date));
    (tours || []).forEach((t) => collectYear(t.departureDate));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [sales, productivityData, tours, currentYearNum]);

  const activePeriodRange = useMemo(
    () =>
      resolveHorizonRange({
        horizonMode,
        selectedMonth,
        selectedQuarter,
        selectedYear,
        customStartMonth,
        customEndMonth
      }),
    [horizonMode, selectedMonth, selectedQuarter, selectedYear, customStartMonth, customEndMonth]
  );

  const hasActiveFilters = horizonMode !== 'all' || (!isStaffRole && selectedStaff !== 'All');

  const handleResetFilters = () => {
    setHorizonMode('all');
    if (!isStaffRole) setSelectedStaff('All');
  };

  // Core BI Engines (Pure & Unit-Tested)
  const consultantScorecards = useMemo(
    () =>
      computeConsultantScorecards({
        staffRoster,
        sales,
        productivityData,
        tours,
        cruises,
        hotels,
        documents,
        telecoms,
        overtimes,
        periodRange: activePeriodRange,
        staffNameFilter
      }),
    [staffRoster, sales, productivityData, tours, cruises, hotels, documents, telecoms, overtimes, activePeriodRange, staffNameFilter]
  );

  const { metrics: salesMetrics, chartData: salesChartData } = useMemo(
    () =>
      computeSalesQuotaAnalytics({
        sales,
        periodRange: activePeriodRange,
        staffNameFilter
      }),
    [sales, activePeriodRange, staffNameFilter]
  );

  const productivityAnalytics = useMemo(
    () =>
      computeStaffProductivityBreakdown({
        productivityData,
        categories: PRODUCTIVITY_CATEGORIES,
        periodRange: activePeriodRange,
        staffNameFilter
      }),
    [productivityData, activePeriodRange, staffNameFilter]
  );

  const operationsAnalytics = useMemo(
    () =>
      computeStaffOperationsAnalytics({
        tours,
        cruises,
        hotels,
        documents,
        telecoms,
        overtimes,
        periodRange: activePeriodRange,
        staffNameFilter
      }),
    [tours, cruises, hotels, documents, telecoms, overtimes, activePeriodRange, staffNameFilter]
  );

  const tourTable = useDataTable(
    operationsAnalytics.normalizedTourRows,
    { key: 'departureDate', direction: 'desc' },
    toursPerPage
  );

  // SlideOverDrawer Inspector Computations
  const inspectedConsultant = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'consultant' || !drawerState.staffName) return null;
    const card = consultantScorecards.find((c) => isSameStaff(c.staffName, drawerState.staffName)) || null;
    const recentCategories = {};
    (productivityData || [])
      .filter((p) => isSameStaff(p.staff, drawerState.staffName) && matchesHorizonRange(p.date, activePeriodRange))
      .forEach((p) => {
        const k = p.category || 'Other';
        if (!recentCategories[k]) recentCategories[k] = { name: k, sales: 0, profit: 0 };
        recentCategories[k].sales += Number(p.salesAmount) || 0;
        recentCategories[k].profit += Number(p.profitAmount) || 0;
      });

    const recentOvertimes = (overtimes || [])
      .filter((o) => isSameStaff(o.staff, drawerState.staffName) && matchesHorizonRange(o.date, activePeriodRange))
      .slice(0, 6);

    return {
      card,
      topCategories: Object.values(recentCategories).sort((a, b) => b.profit - a.profit),
      recentOvertimes
    };
  }, [drawerState, consultantScorecards, productivityData, overtimes, activePeriodRange]);

  const inspectedCategory = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'category' || !drawerState.categoryName) return null;
    const entries = productivityAnalytics.filteredRecords.filter((p) => p.category === drawerState.categoryName);
    const byStaff = {};
    entries.forEach((p) => {
      const k = p.staff || 'Unassigned';
      if (!byStaff[k]) byStaff[k] = { name: k, sales: 0, profit: 0, count: 0 };
      byStaff[k].sales += Number(p.salesAmount) || 0;
      byStaff[k].profit += Number(p.profitAmount) || 0;
      byStaff[k].count += 1;
    });
    return {
      category: drawerState.categoryName,
      entries,
      staffSplit: Object.values(byStaff).sort((a, b) => b.profit - a.profit)
    };
  }, [drawerState, productivityAnalytics.filteredRecords]);

  const inspectedTour = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'tour' || !drawerState.tourId) return null;
    return operationsAnalytics.normalizedTourRows.find((t) => t.id === drawerState.tourId) || null;
  }, [drawerState, operationsAnalytics.normalizedTourRows]);

  const openConsultantDrawer = useCallback((staffName) => {
    setDrawerState({ isOpen: true, mode: 'consultant', staffName, categoryName: null, tourId: null });
  }, []);

  const openCategoryDrawer = useCallback((categoryName) => {
    setDrawerState({ isOpen: true, mode: 'category', staffName: null, categoryName, tourId: null });
  }, []);

  const openTourDrawer = useCallback((tourId) => {
    setDrawerState({ isOpen: true, mode: 'tour', staffName: null, categoryName: null, tourId });
  }, []);

  const tabs = [
    {
      id: 'scorecard',
      label: isStaffRole ? 'My 360° Scorecard' : `Team Leaderboard (${consultantScorecards.length})`,
      icon: Award
    },
    { id: 'productivity', label: 'Productivity & Cross-Sell', icon: BarChart2 },
    { id: 'operations', label: `Tours, Operations & Overtime (${operationsAnalytics.totalOpsHandled})`, icon: Briefcase },
    { id: 'target_sales', label: 'Target vs Achievement', icon: Target }
  ];

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <main className="content-area">
          <div className="page-container">
            <BiPageHeader
              eyebrow="360° Consultant Appraisal & Workload Intelligence"
              title="Performa Konsultan"
              subtitle={`Evaluasi ${staffNameFilter === 'All' ? 'Seluruh Konsultan Aktif' : staffNameFilter} pada periode ${activePeriodRange.label} lintas Kuota Sales, Produktivitas P&L, Operasional, dan Lembur.`}
              metaBadge={<span className="bi-micro-badge">{activePeriodRange.label}</span>}
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn-secondary no-print"
                    onClick={() => window.print()}
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', borderRadius: '8px' }}
                  >
                    <Printer size={14} aria-hidden="true" /> Cetak Evaluasi
                  </button>
                  <ExportMenu
                    data={consultantScorecards}
                    columns={SCORECARD_EXPORT_COLUMNS}
                    filename={`Staff_Appraisal_${activePeriodRange.label.replace(/\s+/g, '_')}`}
                  />
                </>
              }
            />

            {/* Multi-Horizon Filter Bar */}
            <div
              className="bi-filter-bar no-print"
              role="region"
              aria-label="Filter Periode dan Konsultan"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.68rem 0.9rem',
                marginBottom: '1.1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div
                  role="group"
                  aria-label="Mode horizon waktu"
                  style={{
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    background: 'var(--bg-surface)',
                    padding: '2px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    gap: '2px'
                  }}
                >
                  {HORIZON_MODES.map((mode) => {
                    const active = horizonMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setHorizonMode(mode.id)}
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.32rem 0.65rem',
                          fontSize: '0.76rem',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                          background: active ? 'var(--bg-card)' : 'transparent',
                          color: active ? 'var(--text-main)' : 'var(--text-muted)',
                          boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none'
                        }}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {horizonMode === 'month' && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'var(--bg-surface)',
                      padding: '0.18rem 0.35rem',
                      borderRadius: '7px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Bulan sebelumnya"
                      onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <input
                      type="month"
                      aria-label="Pilih bulan"
                      value={selectedMonth}
                      onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(currentMonthStr)}
                      style={{
                        background: selectedMonth === currentMonthStr ? 'var(--primary-soft)' : 'transparent',
                        border: 'none',
                        borderRadius: '5px',
                        color: 'var(--primary)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.18rem 0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      Current
                    </button>
                    <button
                      type="button"
                      aria-label="Bulan berikutnya"
                      onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {horizonMode === 'quarter' && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div
                      role="group"
                      aria-label="Pilih kuartal"
                      style={{ display: 'inline-flex', background: 'var(--bg-surface)', borderRadius: '7px', border: '1px solid var(--border)', padding: '2px' }}
                    >
                      {[1, 2, 3, 4].map((q) => (
                        <button
                          key={q}
                          type="button"
                          aria-pressed={selectedQuarter === q}
                          onClick={() => setSelectedQuarter(q)}
                          style={{
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: selectedQuarter === q ? 'var(--bg-card)' : 'transparent',
                            color: selectedQuarter === q ? 'var(--text-main)' : 'var(--text-muted)'
                          }}
                        >
                          Q{q}
                        </button>
                      ))}
                    </div>
                    <select
                      aria-label="Pilih tahun kuartal"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        borderRadius: '7px',
                        padding: '0.32rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}

                {horizonMode === 'year' && (
                  <select
                    aria-label="Pilih tahun fiskal"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      borderRadius: '7px',
                      padding: '0.34rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>FY {yr}</option>
                    ))}
                  </select>
                )}

                {horizonMode === 'custom' && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      type="month"
                      aria-label="Bulan mulai"
                      value={customStartMonth}
                      onChange={(e) => e.target.value && setCustomStartMonth(e.target.value)}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s/d</span>
                    <input
                      type="month"
                      aria-label="Bulan selesai"
                      value={customEndMonth}
                      onChange={(e) => e.target.value && setCustomEndMonth(e.target.value)}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--bg-surface)',
                    padding: '0.32rem 0.7rem',
                    borderRadius: '7px',
                    border: `1px solid ${staffNameFilter !== 'All' ? 'var(--primary)' : 'var(--border)'}`
                  }}
                >
                  <UserCheck size={14} color="var(--primary)" aria-hidden="true" />
                  {isStaffRole ? (
                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{user?.name}</strong>
                  ) : (
                    <select
                      aria-label="Filter konsultan"
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <option value="All" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                        Seluruh Konsultan ({staffRoster.length})
                      </option>
                      {staffRoster.map((name) => (
                        <option key={name} value={name} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.28)',
                      color: 'var(--danger)',
                      borderRadius: '7px',
                      padding: '0.34rem 0.65rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.28rem'
                    }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* 5-Card Enterprise Executive KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: '0.85rem', marginBottom: '1.15rem' }}>
              <BiKpiCard
                label="Sales Quota Attainment"
                value={salesMetrics.targetSales > 0 ? formatPercent(salesMetrics.salesRate, 1) : 'No Quota'}
                subValue={`${formatCompactIdr(salesMetrics.achievementSales)} / ${formatCompactIdr(salesMetrics.targetSales)}`}
                tone={salesMetrics.targetSales === 0 ? 'neutral' : salesMetrics.salesRate >= 100 ? 'success' : salesMetrics.salesRate >= 75 ? 'primary' : 'warning'}
                icon={<Target size={15} />}
                drilldownLabel="Kuota"
                onClick={() => setActiveTab('target_sales')}
              />
              <BiKpiCard
                label="Productivity Gross Profit"
                value={formatCompactIdr(productivityAnalytics.grandProfit)}
                subValue={`Sales ${formatCompactIdr(productivityAnalytics.grandSales)} · Margin ${formatPercent(productivityAnalytics.grandMargin, 1)}`}
                tone="success"
                icon={<DollarSign size={15} />}
                drilldownLabel="P&L"
                onClick={() => setActiveTab('productivity')}
              />
              <BiKpiCard
                label="360° Operational Files"
                value={`${operationsAnalytics.totalOpsHandled} files`}
                subValue={`${operationsAnalytics.activeTourCount} Tour · ${operationsAnalytics.cruiseCount} Cr · ${operationsAnalytics.hotelCount} Htl · ${operationsAnalytics.docCount} Doc · ${operationsAnalytics.telecomCount} SIM`}
                tone="primary"
                icon={<Briefcase size={15} />}
                drilldownLabel="Ops"
                onClick={() => setActiveTab('operations')}
              />
              <BiKpiCard
                label="Hotel / Flight Cross-Sell"
                value={formatPercent(productivityAnalytics.blendedCrossSell, 1)}
                subValue={`Retail ${formatPercent(productivityAnalytics.retailCrossSell, 1)} · Corp ${formatPercent(productivityAnalytics.corpCrossSell, 1)}`}
                tone="warning"
                icon={<TrendingUp size={15} />}
                drilldownLabel="Detail"
                onClick={() => setActiveTab('productivity')}
              />
              <BiKpiCard
                label="Approved Overtime"
                value={`${operationsAnalytics.approvedOtHours} hrs`}
                subValue={
                  operationsAnalytics.pendingOtHours > 0
                    ? `+${operationsAnalytics.pendingOtHours} hrs menunggu persetujuan`
                    : 'Seluruh lembur tercatat telah ditinjau'
                }
                tone={operationsAnalytics.pendingOtHours > 0 ? 'warning' : 'neutral'}
                icon={<Clock size={15} />}
                drilldownLabel="Ops"
                onClick={() => setActiveTab('operations')}
              />
            </div>

            {/* Accessible Domain Tabs */}
            <div
              className="bi-domain-tabs no-print"
              role="tablist"
              aria-label="Tab Performa Konsultan"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.15rem',
                overflowX: 'auto'
              }}
            >
              {tabs.map((t) => {
                const IconComp = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`staff-tab-${t.id}`}
                    aria-selected={active}
                    aria-controls={`staff-panel-${t.id}`}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.62rem 0.9rem',
                      border: 'none',
                      borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                      background: 'transparent',
                      color: active ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <IconComp size={15} color={active ? 'var(--primary)' : 'currentColor'} aria-hidden="true" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" id={`staff-panel-${activeTab}`} aria-labelledby={`staff-tab-${activeTab}`}>
              {activeTab === 'scorecard' && (
                <StaffScorecardTab
                  consultantScorecards={consultantScorecards}
                  staffNameFilter={staffNameFilter}
                  selectedStaff={selectedStaff}
                  isStaffRole={isStaffRole}
                  onSelectStaff={setSelectedStaff}
                  onInspectConsultant={openConsultantDrawer}
                />
              )}

              {activeTab === 'productivity' && (
                <StaffProductivityTab
                  productivityAnalytics={productivityAnalytics}
                  prodChartMetric={prodChartMetric}
                  onMetricChange={setProdChartMetric}
                  onInspectCategory={openCategoryDrawer}
                />
              )}

              {activeTab === 'operations' && (
                <StaffOperationsTab
                  operationsAnalytics={operationsAnalytics}
                  tourTable={tourTable}
                  toursPerPage={toursPerPage}
                  onToursPerPageChange={setToursPerPage}
                  onInspectTour={openTourDrawer}
                />
              )}

              {activeTab === 'target_sales' && (
                <StaffQuotaTab
                  salesMetrics={salesMetrics}
                  salesChartData={salesChartData}
                  staffNameFilter={staffNameFilter}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <StaffInspectorDrawer
        drawerState={drawerState}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        activePeriodLabel={activePeriodRange.label}
        staffNameFilter={staffNameFilter}
        isStaffRole={isStaffRole}
        inspectedConsultant={inspectedConsultant}
        inspectedCategory={inspectedCategory}
        inspectedTour={inspectedTour}
        onFocusConsultant={(name) => {
          setSelectedStaff(name);
          setDrawerState((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};

export default StaffPerformance;
