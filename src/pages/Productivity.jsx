import { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import BiPageHeader from '../components/bi/BiPageHeader';
import ProductivityOverviewTab from '../components/productivity/ProductivityOverviewTab';
import ProductivityComparisonTab from '../components/productivity/ProductivityComparisonTab';
import ProductivityReportTab from '../components/productivity/ProductivityReportTab';
import ProductivityDatabaseTab from '../components/productivity/ProductivityDatabaseTab';
import ProductivityEntryModal from '../components/productivity/ProductivityEntryModal';
import ProductivityInspectorDrawer from '../components/productivity/ProductivityInspectorDrawer';
import {
  useProductivity,
  PRODUCTIVITY_CATEGORIES,
  PRODUCTIVITY_TYPES
} from '../context/ProductivityContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDataTable } from '../hooks/useDataTable';
import {
  Plus, UploadCloud, Activity, BarChart2, FileText, Database,
  ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import { formatMonthLabel } from '../utils/formatters';
import { resolveHorizonRange, shiftYearMonth } from '../utils/staffPerformanceEngine';
import {
  getRecordMonth,
  enrichProductivityRecords,
  computeProductivityOverview,
  computeComparisonPresetDates,
  computeProductivityComparison,
  computeManagementPnlReport
} from '../utils/productivityEngine';

const HORIZON_MODES = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'Monthly' },
  { id: 'quarter', label: 'Quarterly' },
  { id: 'year', label: 'Full Year' },
  { id: 'custom', label: 'Custom' }
];

const Productivity = () => {
  const {
    productivityData,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    bulkDeleteRecords,
    bulkImport
  } = useProductivity();
  const { users } = useUsers();
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';

  const canAdd = isAdmin || isManager || isStaff;
  const canEditAny = isAdmin || isManager;
  const canDelete = isAdmin;
  const canEditRecord = useCallback(
    (rec) => {
      if (!rec) return false;
      if (canEditAny) return true;
      return isStaff && rec.staff === user?.name;
    },
    [canEditAny, isStaff, user?.name]
  );

  const activeStaff = useMemo(
    () => (users || []).filter((u) => u.status === 'Active' && (u.role || '').toLowerCase() !== 'admin'),
    [users]
  );

  const staffOptions = useMemo(() => {
    const inactiveNames = new Set(
      (users || []).filter((u) => u.status === 'Inactive' && u.name).map((u) => u.name.toLowerCase().trim())
    );
    const adminNames = new Set(
      (users || []).filter((u) => (u.role || '').toLowerCase() === 'admin' && u.name).map((u) => u.name.toLowerCase().trim())
    );
    const names = new Set(activeStaff.map((u) => u.name).filter(Boolean));
    (productivityData || []).forEach((r) => {
      const clean = (r.staff || '').toLowerCase().trim();
      if (clean && !inactiveNames.has(clean) && !adminNames.has(clean)) names.add(r.staff);
    });
    if (user?.name && (user.role || '').toLowerCase() !== 'admin' && !inactiveNames.has(user.name.toLowerCase().trim())) {
      names.add(user.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [activeStaff, productivityData, user, users]);

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

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentYearNum = today.getFullYear();
  const currentQuarterNum = Math.floor(today.getMonth() / 3) + 1;

  const [activeTab, setActiveTab] = useState('overview');
  const [horizonMode, setHorizonMode] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNum);
  const [customStartMonth, setCustomStartMonth] = useState(`${currentYearNum}-01`);
  const [customEndMonth, setCustomEndMonth] = useState(currentMonthStr);

  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Comparison Tab State
  const [comparisonMode, setComparisonMode] = useState('period');
  const [compPreset, setCompPreset] = useState('YoY');
  const [compP1Start, setCompP1Start] = useState(currentMonthStr);
  const [compP1End, setCompP1End] = useState(currentMonthStr);
  const [compP2Start, setCompP2Start] = useState(() => shiftYearMonth(currentMonthStr, -12));
  const [compP2End, setCompP2End] = useState(() => shiftYearMonth(currentMonthStr, -12));

  // Database & Modal State
  const [showImporter, setShowImporter] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const buildDefaultForm = (overrides = {}) => ({
    date: horizonMode === 'month' ? selectedMonth : currentMonthStr,
    staff: isStaff
      ? user?.name || ''
      : selectedStaffFilter !== 'All'
        ? selectedStaffFilter
        : activeStaff[0]?.name || '',
    category: selectedCategoryFilter !== 'All' ? selectedCategoryFilter : 'Flight',
    type: selectedTypeFilter !== 'All' ? selectedTypeFilter : 'Retail',
    salesAmount: 0,
    profitAmount: 0,
    remarks: '',
    ...overrides
  });

  const [formData, setFormData] = useState(() => buildDefaultForm());

  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    mode: 'record',
    recordId: null,
    categoryName: null,
    segmentFilter: 'All'
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    mode: 'single',
    targetId: null,
    label: ''
  });

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

  const availableYears = useMemo(() => {
    const yrs = new Set([currentYearNum - 1, currentYearNum, currentYearNum + 1]);
    (productivityData || []).forEach((r) => {
      const ym = getRecordMonth(r.date);
      if (ym.length >= 4) {
        const y = Number(ym.slice(0, 4));
        if (Number.isFinite(y) && y > 2000) yrs.add(y);
      }
    });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [productivityData, currentYearNum]);

  const enrichedAllRecords = useMemo(() => enrichProductivityRecords(productivityData), [productivityData]);

  const filteredData = useMemo(
    () =>
      enrichedAllRecords.filter((r) => {
        if (selectedStaffFilter !== 'All' && r.staff !== selectedStaffFilter) return false;
        if (selectedTypeFilter !== 'All' && r.type !== selectedTypeFilter) return false;
        if (selectedCategoryFilter !== 'All' && r.category !== selectedCategoryFilter) return false;
        if (activePeriodRange.start && activePeriodRange.end) {
          if (!r.yearMonth) return false;
          if (r.yearMonth < activePeriodRange.start || r.yearMonth > activePeriodRange.end) return false;
        }
        return true;
      }),
    [enrichedAllRecords, selectedStaffFilter, selectedTypeFilter, selectedCategoryFilter, activePeriodRange]
  );

  const staffScopedRecords = useMemo(
    () =>
      enrichedAllRecords.filter((r) => {
        if (selectedStaffFilter !== 'All' && r.staff !== selectedStaffFilter) return false;
        if (selectedCategoryFilter !== 'All' && r.category !== selectedCategoryFilter) return false;
        return true;
      }),
    [enrichedAllRecords, selectedStaffFilter, selectedCategoryFilter]
  );

  const hasActiveFilters =
    horizonMode !== 'all' ||
    selectedStaffFilter !== 'All' ||
    selectedTypeFilter !== 'All' ||
    selectedCategoryFilter !== 'All';

  const handleResetFilters = () => {
    setHorizonMode('all');
    setSelectedStaffFilter('All');
    setSelectedTypeFilter('All');
    setSelectedCategoryFilter('All');
  };

  // Pure Analytics Engines
  const overviewMetrics = useMemo(
    () => computeProductivityOverview(filteredData, PRODUCTIVITY_CATEGORIES),
    [filteredData]
  );

  const comparisonAnalytics = useMemo(
    () =>
      computeProductivityComparison({
        staffScopedRecords,
        categories: PRODUCTIVITY_CATEGORIES,
        compP1Start,
        compP1End,
        compP2Start,
        compP2End,
        selectedTypeFilter
      }),
    [staffScopedRecords, compP1Start, compP1End, compP2Start, compP2End, selectedTypeFilter]
  );

  const reportRows = useMemo(
    () => computeManagementPnlReport(filteredData, PRODUCTIVITY_CATEGORIES, PRODUCTIVITY_TYPES),
    [filteredData]
  );

  const tableState = useDataTable(filteredData, { key: 'yearMonth', direction: 'desc' }, itemsPerPage);

  const applyComparisonPreset = (preset) => {
    setCompPreset(preset);
    const baseYm = horizonMode === 'month' ? selectedMonth : currentMonthStr;
    const dates = computeComparisonPresetDates(preset, baseYm, currentYearNum);
    setCompP1Start(dates.p1Start);
    setCompP1End(dates.p1End);
    setCompP2Start(dates.p2Start);
    setCompP2End(dates.p2End);
  };

  // CRUD & Modal Handlers
  const handleOpenModal = (rec = null) => {
    if (rec) {
      setEditingRec(rec);
      setFormData({
        date: getRecordMonth(rec.date) || currentMonthStr,
        staff: isStaff ? user?.name || rec.staff : rec.staff || '',
        category: rec.category || 'Flight',
        type: rec.type || 'Retail',
        salesAmount: Number(rec.salesAmount) || 0,
        profitAmount: Number(rec.profitAmount) || 0,
        remarks: rec.remarks || ''
      });
    } else {
      setEditingRec(null);
      setFormData(buildDefaultForm());
    }
    setIsModalOpen(true);
  };

  const handleDuplicateRecord = (rec) => {
    setEditingRec(null);
    setFormData({
      date: getRecordMonth(rec.date) || currentMonthStr,
      staff: isStaff ? user?.name || rec.staff : rec.staff || '',
      category: rec.category || 'Flight',
      type: rec.type || 'Retail',
      salesAmount: Number(rec.salesAmount) || 0,
      profitAmount: Number(rec.profitAmount) || 0,
      remarks: rec.remarks ? `${rec.remarks} (Copy)` : ''
    });
    setDrawerState((prev) => ({ ...prev, isOpen: false }));
    setIsModalOpen(true);
    toast.info('Salinan dimuat ke form — silakan tinjau periode atau nominal lalu simpan.');
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingRec(null);
  };

  const saveFormRecord = async (keepOpenForNext = false) => {
    const cleanStaff = isStaff ? user?.name || formData.staff : formData.staff;
    if (!formData.date) {
      toast.warning('Pilih Periode (Bulan/Tahun) terlebih dahulu.');
      return;
    }
    if (!cleanStaff) {
      toast.warning('Pilih Konsultan terlebih dahulu.');
      return;
    }
    const salesVal = Number(formData.salesAmount) || 0;
    const profitVal = Number(formData.profitAmount) || 0;
    if (salesVal === 0 && profitVal === 0) {
      toast.warning('Masukkan nominal Sales atau Profit lebih dari Rp 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData, staff: cleanStaff, salesAmount: salesVal, profitAmount: profitVal };
      if (editingRec) {
        await updateRecord(editingRec.id, payload);
        toast.success(`Berhasil memperbarui data ${payload.category} (${payload.type}) untuk ${cleanStaff}.`);
      } else {
        await addRecord(payload);
        toast.success(`Berhasil mencatat produktivitas ${payload.category} (${payload.type}) untuk ${cleanStaff}.`);
      }

      if (keepOpenForNext && !editingRec) {
        setFormData((prev) => ({ ...prev, salesAmount: 0, profitAmount: 0, remarks: '' }));
      } else {
        setIsModalOpen(false);
        setEditingRec(null);
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan data produktivitas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveFormRecord(false);
  };

  const requestSingleDelete = (rec) => {
    setConfirmState({
      isOpen: true,
      mode: 'single',
      targetId: rec.id,
      label: `${rec.category} (${rec.type}) · ${rec.staff} · ${formatMonthLabel(rec.yearMonth)}`
    });
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      isOpen: true,
      mode: 'bulk',
      targetId: null,
      label: `${selectedIds.length} data produktivitas terpilih`
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirmState.mode === 'bulk') {
        const count = await bulkDeleteRecords(selectedIds);
        setSelectedIds([]);
        toast.success(`Berhasil menghapus ${count} data produktivitas.`);
      } else if (confirmState.targetId) {
        await deleteRecord(confirmState.targetId);
        setSelectedIds((prev) => prev.filter((id) => id !== confirmState.targetId));
        if (drawerState.recordId === confirmState.targetId) {
          setDrawerState((prev) => ({ ...prev, isOpen: false }));
        }
        toast.success('Data produktivitas berhasil dihapus.');
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus data.');
    } finally {
      setConfirmState({ isOpen: false, mode: 'single', targetId: null, label: '' });
    }
  };

  const handleSpreadsheetImport = async (rows) => {
    try {
      const res = await bulkImport(rows);
      setShowImporter(false);
      toast.success(
        `Berhasil mengimpor ${res.importedCount} catatan${res.skippedCount > 0 ? ` (${res.skippedCount} baris kosong dilewati)` : ''}.`
      );
    } catch (err) {
      toast.error(err?.message || 'Gagal mengimpor spreadsheet.');
    }
  };

  // Multi-select helpers
  const visiblePageIds = useMemo(() => tableState.paginatedData.map((r) => r.id), [tableState.paginatedData]);
  const allVisibleSelected = visiblePageIds.length > 0 && visiblePageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visiblePageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visiblePageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Drawer Inspection Data
  const inspectedRecord = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'record' || !drawerState.recordId) return null;
    return enrichedAllRecords.find((r) => r.id === drawerState.recordId) || null;
  }, [drawerState, enrichedAllRecords]);

  const inspectedCategoryStats = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'category' || !drawerState.categoryName) return null;
    const records = filteredData.filter(
      (r) => r.category === drawerState.categoryName && (drawerState.segmentFilter === 'All' || r.type === drawerState.segmentFilter)
    );
    const sales = records.reduce((s, r) => s + r.salesAmount, 0);
    const profit = records.reduce((s, r) => s + r.profitAmount, 0);
    const byStaff = {};
    records.forEach((r) => {
      const k = r.staff || 'Unassigned';
      if (!byStaff[k]) byStaff[k] = { name: k, sales: 0, profit: 0, count: 0 };
      byStaff[k].sales += r.salesAmount;
      byStaff[k].profit += r.profitAmount;
      byStaff[k].count += 1;
    });
    return {
      category: drawerState.categoryName,
      segment: drawerState.segmentFilter,
      sales,
      profit,
      margin: sales > 0 ? (profit / sales) * 100 : 0,
      records: [...records].sort((a, b) => b.profitAmount - a.profitAmount),
      staffRanking: Object.values(byStaff).sort((a, b) => b.profit - a.profit)
    };
  }, [drawerState, filteredData]);

  const openRecordDrawer = useCallback((rec) => {
    setDrawerState({ isOpen: true, mode: 'record', recordId: rec.id, categoryName: null, segmentFilter: 'All' });
  }, []);

  const openCategoryDrawer = useCallback((categoryName, segmentFilter = 'All') => {
    if (!categoryName || categoryName === 'GRAND TOTAL') return;
    setDrawerState({ isOpen: true, mode: 'category', recordId: null, categoryName, segmentFilter });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Executive Overview', icon: Activity },
    { id: 'comparison', label: 'Variance & Comparison', icon: BarChart2 },
    { id: 'report', label: 'Management P&L Report', icon: FileText },
    { id: 'database', label: `Productivity Database (${filteredData.length})`, icon: Database }
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
              eyebrow="Daily Tasks & Revenue Intelligence"
              title="Produktivitas & P&L"
              subtitle={`Pantau omset per lini produk, gross margin, komposisi Retail vs Corporate, dan output konsultan pada periode ${activePeriodRange.label}.`}
              metaBadge={<span className="bi-micro-badge">{filteredData.length} entri</span>}
              actions={
                canAdd ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary no-print"
                      onClick={() => {
                        setActiveTab('database');
                        setShowImporter((prev) => !prev);
                      }}
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', borderRadius: '8px' }}
                    >
                      <UploadCloud size={14} aria-hidden="true" /> Import Excel/CSV
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary no-print"
                      onClick={() => handleOpenModal()}
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 700 }}
                    >
                      <Plus size={15} aria-hidden="true" /> Log Productivity
                    </button>
                  </>
                ) : null
              }
            />

            {/* Global Period, Segment, Category & Consultant Filter Bar */}
            <div
              className="bi-filter-bar no-print"
              role="region"
              aria-label="Filter Produktivitas dan P&L"
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
                  aria-label="Horizon waktu"
                  style={{ display: 'inline-flex', flexWrap: 'wrap', background: 'var(--bg-surface)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)', gap: '2px' }}
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
                          padding: '0.32rem 0.62rem',
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
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-surface)', padding: '0.18rem 0.35rem', borderRadius: '7px', border: '1px solid var(--border)' }}>
                    <button type="button" aria-label="Bulan sebelumnya" onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                      <ChevronLeft size={15} />
                    </button>
                    <input type="month" aria-label="Pilih bulan" value={selectedMonth} onChange={(e) => e.target.value && setSelectedMonth(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600 }} />
                    <button type="button" onClick={() => setSelectedMonth(currentMonthStr)} style={{ background: selectedMonth === currentMonthStr ? 'var(--primary-soft)' : 'transparent', border: 'none', borderRadius: '5px', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, padding: '0.18rem 0.4rem', cursor: 'pointer' }}>
                      Current
                    </button>
                    <button type="button" aria-label="Bulan berikutnya" onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {horizonMode === 'quarter' && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div role="group" aria-label="Pilih kuartal" style={{ display: 'inline-flex', background: 'var(--bg-surface)', borderRadius: '7px', border: '1px solid var(--border)', padding: '2px' }}>
                      {[1, 2, 3, 4].map((q) => (
                        <button key={q} type="button" aria-pressed={selectedQuarter === q} onClick={() => setSelectedQuarter(q)} style={{ border: 'none', borderRadius: '5px', padding: '0.25rem 0.5rem', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', background: selectedQuarter === q ? 'var(--bg-card)' : 'transparent', color: selectedQuarter === q ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          Q{q}
                        </button>
                      ))}
                    </div>
                    <select aria-label="Pilih tahun kuartal" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.32rem 0.58rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      {availableYears.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                    </select>
                  </div>
                )}

                {horizonMode === 'year' && (
                  <select aria-label="Pilih tahun fiskal" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.34rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
                    {availableYears.map((yr) => <option key={yr} value={yr}>FY {yr}</option>)}
                  </select>
                )}

                {horizonMode === 'custom' && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input type="month" aria-label="Bulan mulai" value={customStartMonth} onChange={(e) => e.target.value && setCustomStartMonth(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s/d</span>
                    <input type="month" aria-label="Bulan selesai" value={customEndMonth} onChange={(e) => e.target.value && setCustomEndMonth(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <div role="group" aria-label="Filter segmen" style={{ display: 'inline-flex', background: 'var(--bg-surface)', padding: '2px', borderRadius: '7px', border: '1px solid var(--border)' }}>
                  {['All', 'Retail', 'Corporate'].map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      aria-pressed={selectedTypeFilter === seg}
                      onClick={() => setSelectedTypeFilter(seg)}
                      style={{
                        border: 'none',
                        borderRadius: '5px',
                        padding: '0.28rem 0.58rem',
                        fontSize: '0.74rem',
                        fontWeight: selectedTypeFilter === seg ? 700 : 500,
                        cursor: 'pointer',
                        background: selectedTypeFilter === seg ? 'var(--bg-card)' : 'transparent',
                        color: selectedTypeFilter === seg ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      {seg}
                    </button>
                  ))}
                </div>

                <select aria-label="Filter kategori produk" value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.34rem 0.6rem', fontSize: '0.77rem', fontWeight: 600 }}>
                  <option value="All">All Categories</option>
                  {PRODUCTIVITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select aria-label="Filter konsultan" value={selectedStaffFilter} onChange={(e) => setSelectedStaffFilter(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '7px', padding: '0.34rem 0.6rem', fontSize: '0.77rem', fontWeight: 600 }}>
                  <option value="All">All Consultants</option>
                  {staffOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.28)', color: 'var(--danger)', borderRadius: '7px', padding: '0.34rem 0.62rem', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Accessible Domain Tabs */}
            <div
              className="bi-domain-tabs no-print"
              role="tablist"
              aria-label="Tab Produktivitas dan P&L"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderBottom: '1px solid var(--border)', marginBottom: '1.15rem', overflowX: 'auto' }}
            >
              {tabs.map((t) => {
                const IconComp = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`prod-tab-${t.id}`}
                    aria-selected={active}
                    aria-controls={`prod-panel-${t.id}`}
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

            <div role="tabpanel" id={`prod-panel-${activeTab}`} aria-labelledby={`prod-tab-${activeTab}`}>
              {activeTab === 'overview' && (
                <ProductivityOverviewTab
                  overviewMetrics={overviewMetrics}
                  selectedStaffFilter={selectedStaffFilter}
                  onSelectStaffFilter={setSelectedStaffFilter}
                  onOpenCategoryDrawer={openCategoryDrawer}
                  onSwitchTab={(tab, compMode) => {
                    if (compMode) setComparisonMode(compMode);
                    setActiveTab(tab);
                  }}
                />
              )}

              {activeTab === 'comparison' && (
                <ProductivityComparisonTab
                  comparisonMode={comparisonMode}
                  onComparisonModeChange={setComparisonMode}
                  compPreset={compPreset}
                  onApplyPreset={applyComparisonPreset}
                  compP1Start={compP1Start}
                  compP1End={compP1End}
                  compP2Start={compP2Start}
                  compP2End={compP2End}
                  onP1StartChange={(v) => { setCompPreset('Custom'); setCompP1Start(v); }}
                  onP1EndChange={(v) => { setCompPreset('Custom'); setCompP1End(v); }}
                  onP2StartChange={(v) => { setCompPreset('Custom'); setCompP2Start(v); }}
                  onP2EndChange={(v) => { setCompPreset('Custom'); setCompP2End(v); }}
                  comparisonAnalytics={comparisonAnalytics}
                />
              )}

              {activeTab === 'report' && (
                <ProductivityReportTab
                  reportRows={reportRows}
                  activePeriodLabel={activePeriodRange.label}
                  onOpenCategoryDrawer={openCategoryDrawer}
                />
              )}

              {activeTab === 'database' && (
                <ProductivityDatabaseTab
                  loading={loading}
                  canAdd={canAdd}
                  canDelete={canDelete}
                  canEditRecord={canEditRecord}
                  showImporter={showImporter}
                  onToggleImporter={() => setShowImporter((prev) => !prev)}
                  onSpreadsheetImport={handleSpreadsheetImport}
                  categories={PRODUCTIVITY_CATEGORIES}
                  selectedCategoryFilter={selectedCategoryFilter}
                  onSelectCategoryFilter={setSelectedCategoryFilter}
                  filteredData={filteredData}
                  tableState={tableState}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  selectedIds={selectedIds}
                  allVisibleSelected={allVisibleSelected}
                  onToggleSelectAllPage={toggleSelectAllPage}
                  onToggleSelectRow={toggleSelectRow}
                  onRequestBulkDelete={requestBulkDelete}
                  onRequestSingleDelete={requestSingleDelete}
                  onOpenRecordDrawer={openRecordDrawer}
                  onDuplicateRecord={handleDuplicateRecord}
                  onEditRecord={handleOpenModal}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <ProductivityEntryModal
        isOpen={isModalOpen}
        editingRec={editingRec}
        isSaving={isSaving}
        isStaff={isStaff}
        userName={user?.name || ''}
        staffOptions={staffOptions}
        categories={PRODUCTIVITY_CATEGORIES}
        types={PRODUCTIVITY_TYPES}
        formData={formData}
        onChangeFormData={setFormData}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onSaveAndAddAnother={() => saveFormRecord(true)}
        onInfoToast={(msg) => toast.info(msg)}
      />

      <ProductivityInspectorDrawer
        drawerState={drawerState}
        onCloseDrawer={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        activePeriodLabel={activePeriodRange.label}
        inspectedRecord={inspectedRecord}
        inspectedCategoryStats={inspectedCategoryStats}
        canAdd={canAdd}
        canDelete={canDelete}
        canEditRecord={canEditRecord}
        onDuplicateRecord={handleDuplicateRecord}
        onRequestSingleDelete={requestSingleDelete}
        onEditRecord={handleOpenModal}
        onOpenRecordDrawer={openRecordDrawer}
        confirmState={confirmState}
        onCloseConfirm={() => setConfirmState({ isOpen: false, mode: 'single', targetId: null, label: '' })}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default Productivity;
