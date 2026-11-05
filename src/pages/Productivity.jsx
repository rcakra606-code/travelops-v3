import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import ExportMenu from '../components/ExportMenu';
import Pagination from '../components/Pagination';
import {
  useProductivity,
  PRODUCTIVITY_CATEGORIES,
  PRODUCTIVITY_TYPES
} from '../context/ProductivityContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useDataTable } from '../hooks/useDataTable';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  BarChart2,
  PieChart as PieChartIcon,
  FileText,
  Database,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  UploadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  RotateCcw,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Printer,
  Lock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SALES_QUICK_ADD = [
  { label: '+10M', value: 10000000 },
  { label: '+25M', value: 25000000 },
  { label: '+50M', value: 50000000 },
  { label: '+100M', value: 100000000 },
  { label: '+250M', value: 250000000 }
];

const MARGIN_PRESETS = [5, 8, 10, 12, 15, 20];

const IMPORT_TEMPLATE_HEADERS = [
  'Period',
  'Consultant',
  'Product Category',
  'Sales Type',
  'Sales Amount (IDR)',
  'Profit Amount (IDR)',
  'Remarks'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const formatNumberId = (val) =>
  new Intl.NumberFormat('id-ID').format(Math.round(Number(val) || 0));

const formatCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  if (num < 0) return `-Rp ${formatNumberId(Math.abs(num))}`;
  return `Rp ${formatNumberId(num)}`;
};

const formatCompactIdr = (val) => {
  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1000000000) return `${sign}Rp ${(abs / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `${sign}Rp ${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}Rp ${(abs / 1000).toFixed(0)}K`;
  return `${sign}Rp ${Math.round(abs)}`;
};

const parseDigitsInput = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return 0;
  const digits = String(raw).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

const getRecordMonth = (dateStr) => {
  if (!dateStr) return '';
  return String(dateStr).trim().slice(0, 7);
};

const formatPeriodLabel = (ym) => {
  if (!ym || ym.length < 7) return ym || '-';
  const [y, m] = ym.slice(0, 7).split('-');
  const mIdx = Number(m) - 1;
  if (mIdx >= 0 && mIdx < 12) {
    return `${MONTH_SHORT[mIdx]} ${y}`;
  }
  return ym;
};

const shiftYearMonth = (ym, deltaMonths) => {
  const [yStr, mStr] = (ym || '').split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = (Number(mStr) || 1) - 1;
  const d = new Date(y, m + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const ProductivityChartTooltip = ({ active, payload, label, isLight }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(10, 17, 34, 0.96)',
        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.28)' : 'rgba(0, 212, 255, 0.3)'}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 0.95rem',
        boxShadow: isLight
          ? '0 10px 25px rgba(2, 132, 199, 0.14)'
          : '0 12px 28px rgba(0, 0, 0, 0.55)',
        minWidth: '190px'
      }}
    >
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.45rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.35rem'
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {payload.map((entry, idx) => {
          const isPercent =
            String(entry.name || '').includes('%') || entry.dataKey === 'marginPct';
          return (
            <div
              key={`${entry.dataKey}-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
                fontSize: '0.78rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: entry.color || 'var(--primary)',
                    display: 'inline-block'
                  }}
                />
                {entry.name}
              </span>
              <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>
                {isPercent ? `${Number(entry.value || 0).toFixed(2)}%` : formatCurrency(entry.value)}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const { theme } = useTheme();
  const { toast } = useToast();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';
  const skyAccent = isLight ? '#0ea5e9' : '#38bdf8';
  const emeraldColor = '#10b981';
  const amberColor = '#f59e0b';
  const cyanSecondary = isLight ? '#0369a1' : '#22d3ee';

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';

  const canAdd = isAdmin || isManager || isStaff;
  const canEditAny = isAdmin || isManager;
  const canDelete = isAdmin;
  const canEditRecord = (rec) => {
    if (!rec) return false;
    if (canEditAny) return true;
    return isStaff && rec.staff === user?.name;
  };

  const activeStaff = useMemo(() => {
    const active = (users || []).filter((u) => u.status === 'Active');
    return active;
  }, [users]);

  const staffOptions = useMemo(() => {
    const inactiveNames = new Set(
      (users || [])
        .filter((u) => u.status === 'Inactive' && u.name)
        .map((u) => u.name.toLowerCase().trim())
    );
    const names = new Set(activeStaff.map((u) => u.name).filter(Boolean));
    (productivityData || []).forEach((r) => {
      if (r.staff && !inactiveNames.has(r.staff.toLowerCase().trim())) {
        names.add(r.staff);
      }
    });
    if (user?.name && !inactiveNames.has(user.name.toLowerCase().trim())) {
      names.add(user.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [activeStaff, productivityData, user, users]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Initial smart period detection (defaults to current month, or latest month with data if current month is empty)
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentYearNum = today.getFullYear();
  const currentQuarterNum = Math.floor(today.getMonth() / 3) + 1;

  const [activeTab, setActiveTab] = useState('overview');

  // Unified Global Filter Bar State
  const [horizonMode, setHorizonMode] = useState('all'); // 'month' | 'quarter' | 'year' | 'custom' | 'all'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNum);
  const [customStartMonth, setCustomStartMonth] = useState(`${currentYearNum}-01`);
  const [customEndMonth, setCustomEndMonth] = useState(currentMonthStr);

  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All'); // 'All' | 'Retail' | 'Corporate'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Comparison Tab State
  const [comparisonMode, setComparisonMode] = useState('period'); // 'type' | 'period'
  const [compPreset, setCompPreset] = useState('YoY');
  const [compP1Start, setCompP1Start] = useState(currentMonthStr);
  const [compP1End, setCompP1End] = useState(currentMonthStr);
  const [compP2Start, setCompP2Start] = useState(shiftYearMonth(currentMonthStr, -12));
  const [compP2End, setCompP2End] = useState(shiftYearMonth(currentMonthStr, -12));

  // Database Tab State
  const [showImporter, setShowImporter] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const getDefaultForm = (overrides = {}) => ({
    date: horizonMode === 'month' ? selectedMonth : currentMonthStr,
    staff: isStaff
      ? user?.name || ''
      : selectedStaffFilter !== 'All'
        ? selectedStaffFilter
        : activeStaff[0]?.name || user?.name || '',
    category: selectedCategoryFilter !== 'All' ? selectedCategoryFilter : 'Flight',
    type: selectedTypeFilter !== 'All' ? selectedTypeFilter : 'Retail',
    salesAmount: 0,
    profitAmount: 0,
    remarks: '',
    ...overrides
  });

  const [formData, setFormData] = useState(() => getDefaultForm());

  // Drawer Inspector State ('record' or 'category')
  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    mode: 'record', // 'record' | 'category'
    recordId: null,
    categoryName: null,
    segmentFilter: 'All'
  });

  // Delete Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    mode: 'single', // 'single' | 'bulk'
    targetId: null,
    label: ''
  });

  // Resolve Active Global Date Window [rangeStart, rangeEnd] as YYYY-MM strings (null = All Time)
  const activePeriodRange = useMemo(() => {
    if (horizonMode === 'all') {
      return { start: null, end: null, label: 'All Time' };
    }
    if (horizonMode === 'month') {
      return {
        start: selectedMonth,
        end: selectedMonth,
        label: formatPeriodLabel(selectedMonth)
      };
    }
    if (horizonMode === 'quarter') {
      const startM = (selectedQuarter - 1) * 3 + 1;
      const endM = startM + 2;
      const s = `${selectedYear}-${String(startM).padStart(2, '0')}`;
      const e = `${selectedYear}-${String(endM).padStart(2, '0')}`;
      return { start: s, end: e, label: `Q${selectedQuarter} ${selectedYear}` };
    }
    if (horizonMode === 'year') {
      return {
        start: `${selectedYear}-01`,
        end: `${selectedYear}-12`,
        label: `FY ${selectedYear}`
      };
    }
    const s = customStartMonth <= customEndMonth ? customStartMonth : customEndMonth;
    const e = customStartMonth <= customEndMonth ? customEndMonth : customStartMonth;
    return {
      start: s,
      end: e,
      label: `${formatPeriodLabel(s)} – ${formatPeriodLabel(e)}`
    };
  }, [
    horizonMode,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    customStartMonth,
    customEndMonth
  ]);

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

  // Enriched base records with safe numeric coercion & computed marginPct
  const enrichedAllRecords = useMemo(() => {
    return (productivityData || []).map((r) => {
      const sales = Number(r.salesAmount) || 0;
      const profit = Number(r.profitAmount) || 0;
      const marginPct = sales > 0 ? Number(((profit / sales) * 100).toFixed(2)) : 0;
      const ym = getRecordMonth(r.date);
      return {
        ...r,
        salesAmount: sales,
        profitAmount: profit,
        marginPct,
        yearMonth: ym,
        periodLabel: formatPeriodLabel(ym)
      };
    });
  }, [productivityData]);

  // Global Filtered Records (applies Horizon Period + Consultant + Segment + Category)
  const filteredData = useMemo(() => {
    return enrichedAllRecords.filter((r) => {
      if (selectedStaffFilter !== 'All' && r.staff !== selectedStaffFilter) return false;
      if (selectedTypeFilter !== 'All' && r.type !== selectedTypeFilter) return false;
      if (selectedCategoryFilter !== 'All' && r.category !== selectedCategoryFilter) return false;
      if (activePeriodRange.start && activePeriodRange.end) {
        if (!r.yearMonth) return false;
        if (r.yearMonth < activePeriodRange.start || r.yearMonth > activePeriodRange.end) {
          return false;
        }
      }
      return true;
    });
  }, [
    enrichedAllRecords,
    selectedStaffFilter,
    selectedTypeFilter,
    selectedCategoryFilter,
    activePeriodRange
  ]);

  // Records filtered ONLY by Staff/Category/Type (ignoring period) for Comparison Tab & Time-Series
  const staffScopedRecords = useMemo(() => {
    return enrichedAllRecords.filter((r) => {
      if (selectedStaffFilter !== 'All' && r.staff !== selectedStaffFilter) return false;
      if (selectedCategoryFilter !== 'All' && r.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [enrichedAllRecords, selectedStaffFilter, selectedCategoryFilter]);

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

  // ==========================================
  // OVERVIEW KPI & CHART ANALYTICS
  // ==========================================
  const overviewMetrics = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    let retailSales = 0;
    let retailProfit = 0;
    let corpSales = 0;
    let corpProfit = 0;
    let flightSales = 0;
    let hotelSales = 0;

    const catMap = {};
    PRODUCTIVITY_CATEGORIES.forEach((c) => {
      catMap[c] = { name: c, Sales: 0, Profit: 0, count: 0, marginPct: 0 };
    });

    const monthMap = {};
    const staffMap = {};

    filteredData.forEach((r) => {
      totalSales += r.salesAmount;
      totalProfit += r.profitAmount;

      if (r.type === 'Corporate') {
        corpSales += r.salesAmount;
        corpProfit += r.profitAmount;
      } else {
        retailSales += r.salesAmount;
        retailProfit += r.profitAmount;
      }

      if (r.category === 'Flight') flightSales += r.salesAmount;
      if (r.category === 'Hotel') hotelSales += r.salesAmount;

      const catKey = catMap[r.category] ? r.category : 'Other';
      catMap[catKey].Sales += r.salesAmount;
      catMap[catKey].Profit += r.profitAmount;
      catMap[catKey].count += 1;

      if (r.yearMonth) {
        if (!monthMap[r.yearMonth]) {
          monthMap[r.yearMonth] = {
            ym: r.yearMonth,
            label: formatPeriodLabel(r.yearMonth),
            Sales: 0,
            Profit: 0,
            count: 0
          };
        }
        monthMap[r.yearMonth].Sales += r.salesAmount;
        monthMap[r.yearMonth].Profit += r.profitAmount;
        monthMap[r.yearMonth].count += 1;
      }

      const staffKey = r.staff || 'Unassigned';
      if (!staffMap[staffKey]) {
        staffMap[staffKey] = {
          name: staffKey,
          Sales: 0,
          Profit: 0,
          count: 0,
          RetailProfit: 0,
          CorporateProfit: 0
        };
      }
      staffMap[staffKey].Sales += r.salesAmount;
      staffMap[staffKey].Profit += r.profitAmount;
      staffMap[staffKey].count += 1;
      if (r.type === 'Corporate') {
        staffMap[staffKey].CorporateProfit += r.profitAmount;
      } else {
        staffMap[staffKey].RetailProfit += r.profitAmount;
      }
    });

    const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const crossSellRate = flightSales > 0 ? (hotelSales / flightSales) * 100 : 0;
    const retailSharePct = totalProfit > 0 ? (retailProfit / totalProfit) * 100 : 0;

    const categoryChartData = Object.values(catMap)
      .map((c) => ({
        ...c,
        marginPct: c.Sales > 0 ? Number(((c.Profit / c.Sales) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.Sales - a.Sales);

    const topCategory =
      categoryChartData.find((c) => c.Profit > 0 || c.Sales > 0) || null;

    const monthlyTrendData = Object.values(monthMap)
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .slice(-12)
      .map((m) => ({
        ...m,
        marginPct: m.Sales > 0 ? Number(((m.Profit / m.Sales) * 100).toFixed(2)) : 0
      }));

    const consultantLeaderboard = Object.values(staffMap)
      .map((s) => ({
        ...s,
        marginPct: s.Sales > 0 ? Number(((s.Profit / s.Sales) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.Profit - a.Profit);

    return {
      totalSales,
      totalProfit,
      overallMargin,
      retailSales,
      retailProfit,
      corpSales,
      corpProfit,
      retailSharePct,
      crossSellRate,
      topCategory,
      categoryChartData,
      monthlyTrendData,
      consultantLeaderboard,
      recordCount: filteredData.length
    };
  }, [filteredData]);

  // ==========================================
  // COMPARISON ANALYTICS (WITH NORMALIZED YYYY-MM)
  // ==========================================
  const applyComparisonPreset = (preset) => {
    setCompPreset(preset);
    const baseYm = horizonMode === 'month' ? selectedMonth : currentMonthStr;
    if (preset === 'MoM') {
      const prev = shiftYearMonth(baseYm, -1);
      setCompP1Start(baseYm);
      setCompP1End(baseYm);
      setCompP2Start(prev);
      setCompP2End(prev);
    } else if (preset === 'QoQ') {
      const p1Start = shiftYearMonth(baseYm, -2);
      const p2End = shiftYearMonth(baseYm, -3);
      const p2Start = shiftYearMonth(baseYm, -5);
      setCompP1Start(p1Start);
      setCompP1End(baseYm);
      setCompP2Start(p2Start);
      setCompP2End(p2End);
    } else if (preset === 'YoY') {
      const prevYr = shiftYearMonth(baseYm, -12);
      setCompP1Start(baseYm);
      setCompP1End(baseYm);
      setCompP2Start(prevYr);
      setCompP2End(prevYr);
    } else if (preset === 'YTD') {
      const yr = Number(baseYm.slice(0, 4)) || currentYearNum;
      const mPart = baseYm.slice(5, 7);
      setCompP1Start(`${yr}-01`);
      setCompP1End(`${yr}-${mPart}`);
      setCompP2Start(`${yr - 1}-01`);
      setCompP2End(`${yr - 1}-${mPart}`);
    }
  };

  const comparisonAnalytics = useMemo(() => {
    const p1S = compP1Start <= compP1End ? compP1Start : compP1End;
    const p1E = compP1Start <= compP1End ? compP1End : compP1Start;
    const p2S = compP2Start <= compP2End ? compP2Start : compP2End;
    const p2E = compP2Start <= compP2End ? compP2End : compP2Start;

    const dataP1 = staffScopedRecords.filter(
      (r) =>
        r.yearMonth >= p1S &&
        r.yearMonth <= p1E &&
        (selectedTypeFilter === 'All' || r.type === selectedTypeFilter)
    );
    const dataP2 = staffScopedRecords.filter(
      (r) =>
        r.yearMonth >= p2S &&
        r.yearMonth <= p2E &&
        (selectedTypeFilter === 'All' || r.type === selectedTypeFilter)
    );

    // Retail vs Corporate in Period 1
    const typeMap = {};
    PRODUCTIVITY_CATEGORIES.forEach((c) => {
      typeMap[c] = {
        name: c,
        RetailSales: 0,
        CorporateSales: 0,
        RetailProfit: 0,
        CorporateProfit: 0
      };
    });
    const dataP1AllSegments = staffScopedRecords.filter(
      (r) => r.yearMonth >= p1S && r.yearMonth <= p1E
    );
    dataP1AllSegments.forEach((r) => {
      const key = typeMap[r.category] ? r.category : 'Other';
      if (r.type === 'Corporate') {
        typeMap[key].CorporateSales += r.salesAmount;
        typeMap[key].CorporateProfit += r.profitAmount;
      } else {
        typeMap[key].RetailSales += r.salesAmount;
        typeMap[key].RetailProfit += r.profitAmount;
      }
    });

    // Period 1 vs Period 2
    const periodMap = {};
    PRODUCTIVITY_CATEGORIES.forEach((c) => {
      periodMap[c] = {
        name: c,
        P1Sales: 0,
        P2Sales: 0,
        P1Profit: 0,
        P2Profit: 0
      };
    });

    let p1SalesTotal = 0;
    let p1ProfitTotal = 0;
    let p2SalesTotal = 0;
    let p2ProfitTotal = 0;
    let p1Flight = 0;
    let p1Hotel = 0;

    dataP1.forEach((r) => {
      const key = periodMap[r.category] ? r.category : 'Other';
      periodMap[key].P1Sales += r.salesAmount;
      periodMap[key].P1Profit += r.profitAmount;
      p1SalesTotal += r.salesAmount;
      p1ProfitTotal += r.profitAmount;
      if (r.category === 'Flight') p1Flight += r.salesAmount;
      if (r.category === 'Hotel') p1Hotel += r.salesAmount;
    });

    dataP2.forEach((r) => {
      const key = periodMap[r.category] ? r.category : 'Other';
      periodMap[key].P2Sales += r.salesAmount;
      periodMap[key].P2Profit += r.profitAmount;
      p2SalesTotal += r.salesAmount;
      p2ProfitTotal += r.profitAmount;
    });

    const p1Margin = p1SalesTotal > 0 ? (p1ProfitTotal / p1SalesTotal) * 100 : 0;
    const p2Margin = p2SalesTotal > 0 ? (p2ProfitTotal / p2SalesTotal) * 100 : 0;
    const salesGrowthPct =
      p2SalesTotal > 0 ? ((p1SalesTotal - p2SalesTotal) / p2SalesTotal) * 100 : null;
    const profitGrowthPct =
      p2ProfitTotal > 0 ? ((p1ProfitTotal - p2ProfitTotal) / p2ProfitTotal) * 100 : null;
    const marginShiftPts = p1Margin - p2Margin;
    const p1CrossSell = p1Flight > 0 ? (p1Hotel / p1Flight) * 100 : 0;

    return {
      compTypeData: Object.values(typeMap),
      compPeriodData: Object.values(periodMap),
      p1SalesTotal,
      p1ProfitTotal,
      p2SalesTotal,
      p2ProfitTotal,
      p1Margin,
      p2Margin,
      salesGrowthPct,
      profitGrowthPct,
      marginShiftPts,
      p1CrossSell,
      p1Count: dataP1.length,
      p2Count: dataP2.length
    };
  }, [
    staffScopedRecords,
    compP1Start,
    compP1End,
    compP2Start,
    compP2End,
    selectedTypeFilter
  ]);

  // ==========================================
  // MANAGEMENT P&L REPORT (UNIFIED WITH GLOBAL FILTER)
  // ==========================================
  const reportRows = useMemo(() => {
    const rows = [];
    const grandSales = filteredData.reduce((s, r) => s + r.salesAmount, 0);
    const grandProfit = filteredData.reduce((s, r) => s + r.profitAmount, 0);

    PRODUCTIVITY_CATEGORIES.forEach((cat) => {
      PRODUCTIVITY_TYPES.forEach((type) => {
        const subset = filteredData.filter(
          (r) => r.category === cat && r.type === type
        );
        if (subset.length === 0) return;
        const sales = subset.reduce((s, r) => s + r.salesAmount, 0);
        const profit = subset.reduce((s, r) => s + r.profitAmount, 0);
        if (sales === 0 && profit === 0) return;

        const margin = sales > 0 ? Number(((profit / sales) * 100).toFixed(2)) : 0;
        const revenueShare =
          grandSales > 0 ? Number(((sales / grandSales) * 100).toFixed(1)) : 0;
        rows.push({
          category: cat,
          type,
          count: subset.length,
          sales,
          profit,
          margin,
          revenueShare,
          isTotal: false
        });
      });
    });

    rows.sort((a, b) => b.sales - a.sales);

    if (rows.length > 0) {
      const totalMargin =
        grandSales > 0 ? Number(((grandProfit / grandSales) * 100).toFixed(2)) : 0;
      rows.push({
        category: 'GRAND TOTAL',
        type: 'All Segments',
        count: filteredData.length,
        sales: grandSales,
        profit: grandProfit,
        margin: totalMargin,
        revenueShare: 100,
        isTotal: true
      });
    }
    return rows;
  }, [filteredData]);

  // ==========================================
  // DATABASE TABLE HOOK (`useDataTable`)
  // ==========================================
  const {
    sortConfig,
    currentPage,
    globalSearch,
    handleSort,
    handleGlobalSearch,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems
  } = useDataTable(filteredData, { key: 'yearMonth', direction: 'desc' }, itemsPerPage);

  // ==========================================
  // MODAL & CRUD HANDLERS
  // ==========================================
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
      setFormData(getDefaultForm());
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
    toast.info('Loaded copy into form — review period or amounts and save.');
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingRec(null);
  };

  const saveFormRecord = async (keepOpenForNext = false) => {
    const cleanStaff = isStaff ? user?.name || formData.staff : formData.staff;
    if (!formData.date) {
      toast.warning('Please select a Period (Month/Year).');
      return;
    }
    if (!cleanStaff) {
      toast.warning('Please select a Consultant.');
      return;
    }

    const salesVal = Number(formData.salesAmount) || 0;
    const profitVal = Number(formData.profitAmount) || 0;
    if (salesVal === 0 && profitVal === 0) {
      toast.warning('Please enter a Sales or Profit amount greater than Rp 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        staff: cleanStaff,
        salesAmount: salesVal,
        profitAmount: profitVal
      };
      if (editingRec) {
        await updateRecord(editingRec.id, payload);
        toast.success(`Updated ${payload.category} (${payload.type}) record for ${cleanStaff}.`);
      } else {
        await addRecord(payload);
        toast.success(`Logged ${payload.category} (${payload.type}) productivity for ${cleanStaff}.`);
      }

      if (keepOpenForNext && !editingRec) {
        setFormData((prev) => ({
          ...prev,
          salesAmount: 0,
          profitAmount: 0,
          remarks: ''
        }));
      } else {
        setIsModalOpen(false);
        setEditingRec(null);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save productivity record.');
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
      label: `${rec.category} (${rec.type}) • ${rec.staff} • ${formatPeriodLabel(rec.yearMonth)}`
    });
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      isOpen: true,
      mode: 'bulk',
      targetId: null,
      label: `${selectedIds.length} selected productivity records`
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirmState.mode === 'bulk') {
        const count = await bulkDeleteRecords(selectedIds);
        setSelectedIds([]);
        toast.success(`Deleted ${count} productivity records.`);
      } else if (confirmState.targetId) {
        await deleteRecord(confirmState.targetId);
        setSelectedIds((prev) => prev.filter((id) => id !== confirmState.targetId));
        if (drawerState.recordId === confirmState.targetId) {
          setDrawerState((prev) => ({ ...prev, isOpen: false }));
        }
        toast.success('Productivity record deleted.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete record(s).');
    } finally {
      setConfirmState({ isOpen: false, mode: 'single', targetId: null, label: '' });
    }
  };

  const handleSpreadsheetImport = async (rows) => {
    try {
      const res = await bulkImport(rows);
      setShowImporter(false);
      toast.success(
        `Imported ${res.importedCount} productivity records${res.skippedCount > 0 ? ` (${res.skippedCount} empty rows skipped)` : ''}.`
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to import spreadsheet.');
    }
  };

  // Multi-select helpers
  const visiblePageIds = useMemo(() => paginatedData.map((r) => r.id), [paginatedData]);
  const allVisibleSelected =
    visiblePageIds.length > 0 && visiblePageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visiblePageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visiblePageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Drawer Inspection Data
  const inspectedRecord = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'record' || !drawerState.recordId) {
      return null;
    }
    return enrichedAllRecords.find((r) => r.id === drawerState.recordId) || null;
  }, [drawerState, enrichedAllRecords]);

  const inspectedCategoryStats = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'category' || !drawerState.categoryName) {
      return null;
    }
    const records = filteredData.filter(
      (r) =>
        r.category === drawerState.categoryName &&
        (drawerState.segmentFilter === 'All' || r.type === drawerState.segmentFilter)
    );
    const sales = records.reduce((s, r) => s + r.salesAmount, 0);
    const profit = records.reduce((s, r) => s + r.profitAmount, 0);
    const margin = sales > 0 ? (profit / sales) * 100 : 0;

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
      margin,
      records: [...records].sort((a, b) => b.profitAmount - a.profitAmount),
      staffRanking: Object.values(byStaff).sort((a, b) => b.profit - a.profit)
    };
  }, [drawerState, filteredData]);

  const openRecordDrawer = (rec) => {
    setDrawerState({
      isOpen: true,
      mode: 'record',
      recordId: rec.id,
      categoryName: null,
      segmentFilter: 'All'
    });
  };

  const openCategoryDrawer = (categoryName, segmentFilter = 'All') => {
    if (!categoryName || categoryName === 'GRAND TOTAL') return;
    setDrawerState({
      isOpen: true,
      mode: 'category',
      recordId: null,
      categoryName,
      segmentFilter
    });
  };

  // Live Modal Margin Calculation
  const formSalesNum = Number(formData.salesAmount) || 0;
  const formProfitNum = Number(formData.profitAmount) || 0;
  const formMarginPct = formSalesNum > 0 ? (formProfitNum / formSalesNum) * 100 : 0;
  const isProfitExceedingSales = formSalesNum > 0 && formProfitNum > formSalesNum;

  const databaseExportColumns = [
    { header: 'Record ID', key: 'id' },
    { header: 'Period', key: 'date' },
    { header: 'Consultant', key: 'staff' },
    { header: 'Category', key: 'category' },
    { header: 'Segment', key: 'type' },
    { header: 'Sales Amount', key: 'salesAmount', format: 'currency' },
    { header: 'Profit Amount', key: 'profitAmount', format: 'currency' },
    { header: 'Margin %', key: 'marginPct', format: 'percent' },
    { header: 'Remarks', key: 'remarks' }
  ];

  const reportExportColumns = [
    { header: 'Product Category', key: 'category' },
    { header: 'Segment', key: 'type' },
    { header: 'Entries', key: 'count' },
    { header: 'Total Sales', key: 'sales', format: 'currency' },
    { header: 'Total Profit', key: 'profit', format: 'currency' },
    { header: 'Profit Margin', key: 'margin', format: 'percent' },
    { header: 'Revenue Share', key: 'revenueShare', format: 'percent' }
  ];

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={13} style={{ opacity: 0.35 }} />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={13} color={neonBlue} />
    ) : (
      <ChevronDown size={13} color={neonBlue} />
    );
  };

  const getMarginBadgeStyle = (pct) => {
    const val = Number(pct) || 0;
    if (val >= 12) {
      return {
        color: '#10b981',
        background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.16)',
        border: '1px solid rgba(16, 185, 129, 0.28)'
      };
    }
    if (val >= 7) {
      return {
        color: neonBlue,
        background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 212, 255, 0.14)',
        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.26)' : 'rgba(0, 212, 255, 0.28)'}`
      };
    }
    if (val >= 4) {
      return {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.13)',
        border: '1px solid rgba(245, 158, 11, 0.28)'
      };
    }
    return {
      color: '#ef4444',
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.28)'
    };
  };

  const getSegmentBadgeStyle = (type) => {
    if (type === 'Corporate') {
      return {
        background: isLight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(56, 189, 248, 0.15)',
        color: isLight ? '#0369a1' : '#38bdf8',
        border: `1px solid ${isLight ? 'rgba(14, 165, 233, 0.28)' : 'rgba(56, 189, 248, 0.3)'}`
      };
    }
    return {
      background: isLight ? 'rgba(16, 185, 129, 0.11)' : 'rgba(16, 185, 129, 0.15)',
      color: isLight ? '#047857' : '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.28)'
    };
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={closeMobile}
      />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            {/* EXECUTIVE PAGE HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: isLight
                      ? 'rgba(2, 132, 199, 0.1)'
                      : 'rgba(0, 212, 255, 0.12)',
                    color: neonBlue,
                    border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.22)' : 'rgba(0, 212, 255, 0.25)'}`,
                    marginBottom: '0.5rem'
                  }}
                >
                  <Sparkles size={13} /> Daily Tasks & Revenue Intelligence
                </div>
                <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  Productivity Dashboard
                </h1>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Track product-line sales, net profit margins, Retail vs Corporate mix, and consultant output for{' '}
                  <strong style={{ color: neonBlue }}>{activePeriodRange.label}</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {canAdd && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setActiveTab('database');
                      setShowImporter((prev) => !prev);
                    }}
                    style={{
                      background: isLight
                        ? 'rgba(2, 132, 199, 0.08)'
                        : 'rgba(0, 212, 255, 0.1)',
                      border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(0, 212, 255, 0.28)'}`,
                      color: neonBlue,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 0.95rem',
                      fontWeight: 600
                    }}
                  >
                    <UploadCloud size={16} /> Import Excel/CSV
                  </button>
                )}

                {canAdd && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenModal()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.62rem 1.1rem',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={18} /> Log Productivity
                  </button>
                )}
              </div>
            </div>

            {/* UNIFIED GLOBAL PERIOD, SEGMENT & CONSULTANT FILTER BAR */}
            <div
              className="card"
              style={{
                padding: '0.95rem 1.15rem',
                marginBottom: '1.35rem',
                background: isLight
                  ? 'linear-gradient(135deg, #ffffff 0%, #f4faff 100%)'
                  : 'linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(9, 15, 30, 0.95) 100%)',
                border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.18)' : 'rgba(0, 212, 255, 0.18)'}`
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}
              >
                {/* Horizon Mode Selector + Active Period Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'var(--bg-surface)',
                      padding: '0.22rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border)',
                      gap: '0.2rem'
                    }}
                  >
                    {[
                      { id: 'all', label: 'All Time' },
                      { id: 'month', label: 'Monthly' },
                      { id: 'quarter', label: 'Quarterly' },
                      { id: 'year', label: 'Full Year' },
                      { id: 'custom', label: 'Custom' }
                    ].map((mode) => {
                      const active = horizonMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setHorizonMode(mode.id)}
                          style={{
                            border: 'none',
                            borderRadius: '0.45rem',
                            padding: '0.36rem 0.7rem',
                            fontSize: '0.78rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            background: active ? 'var(--primary)' : 'transparent',
                            color: active ? 'var(--primary-fg, #fff)' : 'var(--text-muted)',
                            transition: 'all 0.15s'
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
                        gap: '0.3rem',
                        background: 'var(--bg-surface)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '0.6rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))}
                        title="Previous Month"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex'
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(currentMonthStr)}
                        style={{
                          background:
                            selectedMonth === currentMonthStr
                              ? 'rgba(0, 168, 255, 0.15)'
                              : 'transparent',
                          border: 'none',
                          borderRadius: '0.35rem',
                          color: neonBlue,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.22rem 0.45rem',
                          cursor: 'pointer'
                        }}
                      >
                        Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))}
                        title="Next Month"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex'
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {horizonMode === 'quarter' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          background: 'var(--bg-surface)',
                          borderRadius: '0.55rem',
                          border: '1px solid var(--border)',
                          padding: '0.18rem'
                        }}
                      >
                        {[1, 2, 3, 4].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setSelectedQuarter(q)}
                            style={{
                              border: 'none',
                              borderRadius: '0.4rem',
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background:
                                selectedQuarter === q ? 'var(--primary)' : 'transparent',
                              color:
                                selectedQuarter === q
                                  ? 'var(--primary-fg, #fff)'
                                  : 'var(--text-muted)'
                            }}
                          >
                            Q{q}
                          </button>
                        ))}
                      </div>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.38rem 0.65rem',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {horizonMode === 'year' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        borderRadius: '0.55rem',
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          FY {yr}
                        </option>
                      ))}
                    </select>
                  )}

                  {horizonMode === 'custom' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="month"
                        value={customStartMonth}
                        onChange={(e) => e.target.value && setCustomStartMonth(e.target.value)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.36rem 0.55rem',
                          fontSize: '0.8rem'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="month"
                        value={customEndMonth}
                        onChange={(e) => e.target.value && setCustomEndMonth(e.target.value)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.36rem 0.55rem',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Segment, Category & Consultant Selectors */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  {/* Retail / Corporate Toggle */}
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'var(--bg-surface)',
                      padding: '0.2rem',
                      borderRadius: '0.55rem',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {['All', 'Retail', 'Corporate'].map((seg) => {
                      const active = selectedTypeFilter === seg;
                      return (
                        <button
                          key={seg}
                          type="button"
                          onClick={() => setSelectedTypeFilter(seg)}
                          style={{
                            border: 'none',
                            borderRadius: '0.4rem',
                            padding: '0.32rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            background: active
                              ? isLight
                                ? 'rgba(2, 132, 199, 0.14)'
                                : 'rgba(0, 212, 255, 0.18)'
                              : 'transparent',
                            color: active ? neonBlue : 'var(--text-muted)'
                          }}
                        >
                          {seg}
                        </button>
                      );
                    })}
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      borderRadius: '0.55rem',
                      padding: '0.42rem 0.7rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Categories</option>
                    {PRODUCTIVITY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Consultant Dropdown */}
                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      borderRadius: '0.55rem',
                      padding: '0.42rem 0.7rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Consultants</option>
                    {staffOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      title="Reset all filters"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        borderRadius: '0.55rem',
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MODULE NAVIGATION TABS */}
            <div
              className="tabs-container"
              style={{
                marginBottom: '1.4rem',
                display: 'flex',
                gap: '0.45rem',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap'
              }}
            >
              {[
                { id: 'overview', label: 'Executive Overview', icon: Activity },
                { id: 'comparison', label: 'Variance & Comparison', icon: BarChart2 },
                { id: 'report', label: 'Management P&L Report', icon: FileText },
                {
                  id: 'database',
                  label: `Productivity Database (${filteredData.length})`,
                  icon: Database
                }
              ].map((t) => {
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <IconComp size={16} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* ========================================================= */}
            {/* TAB 1: EXECUTIVE OVERVIEW                                 */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                {/* 5 CLICKABLE KPI CARDS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  {/* KPI 1: Total Gross Sales */}
                  <div
                    className="card"
                    onClick={() => setActiveTab('database')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.15rem 1.25rem',
                      borderTop: `3px solid ${emeraldColor}`,
                      transition: 'transform 0.15s'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Total Gross Sales
                    </div>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: emeraldColor,
                        marginTop: '0.4rem'
                      }}
                    >
                      {formatCompactIdr(overviewMetrics.totalSales)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.35rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{formatCurrency(overviewMetrics.totalSales)}</span>
                      <strong style={{ color: 'var(--text-main)' }}>
                        {overviewMetrics.recordCount} entries
                      </strong>
                    </div>
                  </div>

                  {/* KPI 2: Total Net Profit */}
                  <div
                    className="card"
                    onClick={() => setActiveTab('report')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.15rem 1.25rem',
                      borderTop: `3px solid ${neonBlue}`
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Total Net Profit
                    </div>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: neonBlue,
                        marginTop: '0.4rem'
                      }}
                    >
                      {formatCompactIdr(overviewMetrics.totalProfit)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.35rem'
                      }}
                    >
                      Avg{' '}
                      <strong style={{ color: 'var(--text-main)' }}>
                        {formatCompactIdr(
                          overviewMetrics.recordCount > 0
                            ? overviewMetrics.totalProfit / overviewMetrics.recordCount
                            : 0
                        )}
                      </strong>{' '}
                      profit / entry
                    </div>
                  </div>

                  {/* KPI 3: Blended Profit Margin % */}
                  <div
                    className="card"
                    onClick={() => setActiveTab('report')}
                    style={{
                      cursor: 'pointer',
                      padding: '1.15rem 1.25rem',
                      borderTop: `3px solid ${amberColor}`
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Blended Profit Margin
                    </div>
                    <div
                      style={{
                        fontSize: '1.55rem',
                        fontWeight: 800,
                        color:
                          overviewMetrics.overallMargin >= 10
                            ? emeraldColor
                            : overviewMetrics.overallMargin >= 6
                              ? neonBlue
                              : amberColor,
                        marginTop: '0.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <TrendingUp size={22} />
                      {overviewMetrics.overallMargin.toFixed(2)}%
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.35rem'
                      }}
                    >
                      {overviewMetrics.overallMargin >= 10
                        ? 'Exceeds 10% agency benchmark'
                        : 'Target benchmark: 10.0%+'}
                    </div>
                  </div>

                  {/* KPI 4: Retail vs Corporate Split */}
                  <div
                    className="card"
                    onClick={() => {
                      setComparisonMode('type');
                      setActiveTab('comparison');
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '1.15rem 1.25rem',
                      borderTop: `3px solid ${skyAccent}`
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Retail vs Corporate Profit
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginTop: '0.45rem'
                      }}
                    >
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: emeraldColor }}>
                        R: {overviewMetrics.retailSharePct.toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: neonBlue }}>
                        C:{' '}
                        {overviewMetrics.totalProfit > 0
                          ? (100 - overviewMetrics.retailSharePct).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        borderRadius: '999px',
                        background: 'var(--bg-surface)',
                        overflow: 'hidden',
                        marginTop: '0.45rem',
                        display: 'flex'
                      }}
                    >
                      <div
                        style={{
                          width: `${overviewMetrics.retailSharePct}%`,
                          background: emeraldColor
                        }}
                      />
                      <div
                        style={{
                          width: `${overviewMetrics.totalProfit > 0 ? 100 - overviewMetrics.retailSharePct : 0}%`,
                          background: neonBlue
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.35rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{formatCompactIdr(overviewMetrics.retailProfit)}</span>
                      <span>{formatCompactIdr(overviewMetrics.corpProfit)}</span>
                    </div>
                  </div>

                  {/* KPI 5: Top Category & Flight-to-Hotel Cross-Sell */}
                  <div
                    className="card"
                    onClick={() =>
                      overviewMetrics.topCategory &&
                      openCategoryDrawer(overviewMetrics.topCategory.name)
                    }
                    style={{
                      cursor: overviewMetrics.topCategory ? 'pointer' : 'default',
                      padding: '1.15rem 1.25rem',
                      borderTop: `3px solid ${cyanSecondary}`
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Top Category & Cross-Sell
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{overviewMetrics.topCategory?.name || 'No Data'}</span>
                      {overviewMetrics.topCategory && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: neonBlue,
                            fontWeight: 700
                          }}
                        >
                          {formatCompactIdr(overviewMetrics.topCategory.Profit)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.4rem'
                      }}
                    >
                      Hotel/Flight Cross-Sell:{' '}
                      <strong style={{ color: neonBlue }}>
                        {overviewMetrics.crossSellRate.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ROW 1 CHARTS: CATEGORY PERFORMANCE + MONTHLY REVENUE/MARGIN TREND */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(410px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  {/* Chart 1: Sales & Profit by Product Category */}
                  <div className="card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '0.98rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            color: 'var(--text-main)'
                          }}
                        >
                          <BarChart2 size={18} color={neonBlue} /> Sales & Profit by Category
                        </h3>
                        <p
                          style={{
                            margin: '0.2rem 0 0 0',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Click any category bar to inspect consultant split & deal remarks
                        </p>
                      </div>
                    </div>

                    <div style={{ height: '330px', width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={overviewMetrics.categoryChartData}
                          margin={{ top: 8, right: 10, left: 10, bottom: 18 }}
                          onClick={(state) => {
                            if (state?.activeLabel) {
                              openCategoryDrawer(state.activeLabel);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            angle={-22}
                            textAnchor="end"
                            height={48}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                          />
                          <RechartsTooltip
                            content={<ProductivityChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                          <Bar
                            dataKey="Sales"
                            name="Gross Sales"
                            fill={emeraldColor}
                            radius={[4, 4, 0, 0]}
                            style={{ cursor: 'pointer' }}
                          />
                          <Bar
                            dataKey="Profit"
                            name="Net Profit"
                            fill={neonBlue}
                            radius={[4, 4, 0, 0]}
                            style={{ cursor: 'pointer' }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Monthly Sales, Profit & Margin % Trajectory */}
                  <div className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '0.98rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          color: 'var(--text-main)'
                        }}
                      >
                        <TrendingUp size={18} color={emeraldColor} /> Monthly Trajectory & Margin %
                      </h3>
                      <p
                        style={{
                          margin: '0.2rem 0 0 0',
                          fontSize: '0.76rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        Up to 12-month revenue, profit & blended margin % progression
                      </p>
                    </div>

                    {overviewMetrics.monthlyTrendData.length > 0 ? (
                      <div style={{ height: '330px', width: '100%' }}>
                        <ResponsiveContainer>
                          <ComposedChart
                            data={overviewMetrics.monthlyTrendData}
                            margin={{ top: 8, right: 12, left: 10, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="label"
                              stroke="var(--text-muted)"
                              fontSize={11}
                            />
                            <YAxis
                              yAxisId="left"
                              stroke="var(--text-muted)"
                              fontSize={11}
                              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke={amberColor}
                              fontSize={11}
                              tickFormatter={(val) => `${val}%`}
                            />
                            <RechartsTooltip
                              content={<ProductivityChartTooltip isLight={isLight} />}
                            />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="Sales"
                              name="Sales"
                              fill={isLight ? '#38bdf8' : 'rgba(0, 212, 255, 0.38)'}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="Profit"
                              name="Profit"
                              fill={emeraldColor}
                              radius={[4, 4, 0, 0]}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="marginPct"
                              name="Margin %"
                              stroke={amberColor}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: amberColor }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: '330px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem'
                        }}
                      >
                        No monthly trend records match the current filters.
                      </div>
                    )}
                  </div>
                </div>

                {/* ROW 2 CHARTS: RETAIL VS CORPORATE DONUT + CONSULTANT LEADERBOARD */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {/* Chart 3: Retail vs Corporate Profit & Sales Split */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.98rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <PieChartIcon size={18} color={neonBlue} /> Retail vs Corporate Profit Mix
                    </h3>
                    <p
                      style={{
                        margin: '0 0 0.85rem 0',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      B2C Retail vs B2B Corporate net profit contribution
                    </p>

                    <div style={{ height: '275px', width: '100%' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Retail Profit',
                                value: Math.max(0, overviewMetrics.retailProfit),
                                color: emeraldColor
                              },
                              {
                                name: 'Corporate Profit',
                                value: Math.max(0, overviewMetrics.corpProfit),
                                color: neonBlue
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={104}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            <Cell fill={emeraldColor} />
                            <Cell fill={neonBlue} />
                          </Pie>
                          <RechartsTooltip
                            content={<ProductivityChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <div
                        style={{
                          padding: '0.7rem 0.85rem',
                          borderRadius: '0.65rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Retail Sales / Profit
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: emeraldColor }}>
                          {formatCompactIdr(overviewMetrics.retailProfit)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Gross: {formatCompactIdr(overviewMetrics.retailSales)}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '0.7rem 0.85rem',
                          borderRadius: '0.65rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Corporate Sales / Profit
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: neonBlue }}>
                          {formatCompactIdr(overviewMetrics.corpProfit)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Gross: {formatCompactIdr(overviewMetrics.corpSales)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 4: Consultant Productivity Leaderboard */}
                  <div className="card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '0.98rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            color: 'var(--text-main)'
                          }}
                        >
                          <Award size={18} color={amberColor} /> Consultant Profit Leaderboard
                        </h3>
                        <p
                          style={{
                            margin: '0.2rem 0 0 0',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Click a consultant to filter the dashboard by their output
                        </p>
                      </div>
                    </div>

                    {overviewMetrics.consultantLeaderboard.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          maxHeight: '350px',
                          overflowY: 'auto',
                          paddingRight: '0.25rem'
                        }}
                      >
                        {overviewMetrics.consultantLeaderboard.map((c, idx) => {
                          const maxProfit =
                            overviewMetrics.consultantLeaderboard[0]?.Profit || 1;
                          const pctBar = Math.min(
                            100,
                            Math.max(4, (c.Profit / maxProfit) * 100)
                          );
                          const isSelected = selectedStaffFilter === c.name;
                          return (
                            <div
                              key={c.name}
                              onClick={() =>
                                setSelectedStaffFilter(isSelected ? 'All' : c.name)
                              }
                              style={{
                                padding: '0.75rem 0.9rem',
                                borderRadius: '0.7rem',
                                background: isSelected
                                  ? isLight
                                    ? 'rgba(2, 132, 199, 0.09)'
                                    : 'rgba(0, 212, 255, 0.11)'
                                  : 'var(--bg-surface)',
                                border: `1px solid ${
                                  isSelected ? neonBlue : 'var(--border)'
                                }`,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '0.4rem'
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.55rem'
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      background:
                                        idx === 0
                                          ? 'rgba(245, 158, 11, 0.2)'
                                          : idx === 1
                                            ? 'rgba(0, 168, 255, 0.16)'
                                            : 'var(--bg-card)',
                                      color:
                                        idx === 0
                                          ? amberColor
                                          : idx === 1
                                            ? neonBlue
                                            : 'var(--text-muted)'
                                    }}
                                  >
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <strong
                                      style={{
                                        fontSize: '0.86rem',
                                        color: 'var(--text-main)'
                                      }}
                                    >
                                      {c.name}
                                    </strong>
                                    <span
                                      style={{
                                        marginLeft: '0.45rem',
                                        fontSize: '0.72rem',
                                        color: 'var(--text-muted)'
                                      }}
                                    >
                                      ({c.count} entries)
                                    </span>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <span
                                    style={{
                                      ...getMarginBadgeStyle(c.marginPct),
                                      padding: '0.14rem 0.48rem',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    {c.marginPct}%
                                  </span>
                                  <strong
                                    style={{
                                      fontSize: '0.88rem',
                                      color: neonBlue,
                                      fontFamily: 'monospace'
                                    }}
                                  >
                                    {formatCompactIdr(c.Profit)}
                                  </strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  width: '100%',
                                  height: '6px',
                                  borderRadius: '999px',
                                  background: 'var(--bg-card)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pctBar}%`,
                                    height: '100%',
                                    borderRadius: '999px',
                                    background: `linear-gradient(90deg, ${neonBlue}, ${emeraldColor})`
                                  }}
                                />
                              </div>

                              <div
                                style={{
                                  marginTop: '0.32rem',
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span>Gross Sales: {formatCurrency(c.Sales)}</span>
                                <span>
                                  R: {formatCompactIdr(c.RetailProfit)} • C:{' '}
                                  {formatCompactIdr(c.CorporateProfit)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '2.5rem 1rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem'
                        }}
                      >
                        No consultant productivity records found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: VARIANCE & COMPARISON                              */}
            {/* ========================================================= */}
            {activeTab === 'comparison' && (
              <div className="fade-in">
                {/* Mode Toggle + 1-Click Presets */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.15rem',
                    flexWrap: 'wrap',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn ${comparisonMode === 'period' ? 'btn-primary' : ''}`}
                      onClick={() => setComparisonMode('period')}
                      style={
                        comparisonMode !== 'period'
                          ? {
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-main)'
                            }
                          : {}
                      }
                    >
                      Period vs Period (YoY / QoQ / MoM)
                    </button>
                    <button
                      type="button"
                      className={`btn ${comparisonMode === 'type' ? 'btn-primary' : ''}`}
                      onClick={() => setComparisonMode('type')}
                      style={
                        comparisonMode !== 'type'
                          ? {
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-main)'
                            }
                          : {}
                      }
                    >
                      Retail vs Corporate Breakdown
                    </button>
                  </div>

                  {comparisonMode === 'period' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'var(--bg-card)',
                        padding: '0.28rem',
                        borderRadius: '0.6rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          padding: '0 0.45rem',
                          fontWeight: 600
                        }}
                      >
                        Quick Presets:
                      </span>
                      {['MoM', 'QoQ', 'YoY', 'YTD'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyComparisonPreset(preset)}
                          style={{
                            border: 'none',
                            borderRadius: '0.42rem',
                            padding: '0.32rem 0.68rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background:
                              compPreset === preset ? 'var(--primary)' : 'transparent',
                            color:
                              compPreset === preset
                                ? 'var(--primary-fg, #fff)'
                                : 'var(--text-main)'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Period Selectors Card */}
                <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: neonBlue, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={16} />
                        {comparisonMode === 'period' ? 'Period 1 (Current):' : 'Comparison Window:'}
                      </strong>
                      <input
                        type="month"
                        value={compP1Start}
                        onChange={(e) => {
                          setCompPreset('Custom');
                          setCompP1Start(e.target.value);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.45rem',
                          fontSize: '0.82rem'
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                      <input
                        type="month"
                        value={compP1End}
                        onChange={(e) => {
                          setCompPreset('Custom');
                          setCompP1End(e.target.value);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.45rem',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>

                    {comparisonMode === 'period' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <strong style={{ color: amberColor, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={16} /> Period 2 (Baseline):
                        </strong>
                        <input
                          type="month"
                          value={compP2Start}
                          onChange={(e) => {
                            setCompPreset('Custom');
                            setCompP2Start(e.target.value);
                          }}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            padding: '0.42rem 0.65rem',
                            borderRadius: '0.45rem',
                            fontSize: '0.82rem'
                          }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                        <input
                          type="month"
                          value={compP2End}
                          onChange={(e) => {
                            setCompPreset('Custom');
                            setCompP2End(e.target.value);
                          }}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            padding: '0.42rem 0.65rem',
                            borderRadius: '0.45rem',
                            fontSize: '0.82rem'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 EXECUTIVE VARIANCE DELTA CARDS (WHEN IN PERIOD MODE) */}
                {comparisonMode === 'period' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {/* Sales Variance */}
                    <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Sales Variance (P1 vs P2)
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                        {formatCompactIdr(
                          comparisonAnalytics.p1SalesTotal - comparisonAnalytics.p2SalesTotal
                        )}
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {comparisonAnalytics.salesGrowthPct !== null ? (
                          <span
                            style={{
                              color:
                                comparisonAnalytics.salesGrowthPct >= 0
                                  ? emeraldColor
                                  : '#ef4444',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            {comparisonAnalytics.salesGrowthPct >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {comparisonAnalytics.salesGrowthPct >= 0 ? '+' : ''}
                            {comparisonAnalytics.salesGrowthPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No P2 baseline</span>
                        )}
                        <span style={{ color: 'var(--text-muted)' }}>
                          ({formatCompactIdr(comparisonAnalytics.p1SalesTotal)} vs{' '}
                          {formatCompactIdr(comparisonAnalytics.p2SalesTotal)})
                        </span>
                      </div>
                    </div>

                    {/* Profit Variance */}
                    <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Net Profit Variance
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: neonBlue, marginTop: '0.35rem' }}>
                        {formatCompactIdr(
                          comparisonAnalytics.p1ProfitTotal - comparisonAnalytics.p2ProfitTotal
                        )}
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {comparisonAnalytics.profitGrowthPct !== null ? (
                          <span
                            style={{
                              color:
                                comparisonAnalytics.profitGrowthPct >= 0
                                  ? emeraldColor
                                  : '#ef4444',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            {comparisonAnalytics.profitGrowthPct >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {comparisonAnalytics.profitGrowthPct >= 0 ? '+' : ''}
                            {comparisonAnalytics.profitGrowthPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No P2 baseline</span>
                        )}
                        <span style={{ color: 'var(--text-muted)' }}>
                          ({formatCompactIdr(comparisonAnalytics.p1ProfitTotal)} vs{' '}
                          {formatCompactIdr(comparisonAnalytics.p2ProfitTotal)})
                        </span>
                      </div>
                    </div>

                    {/* Margin Shift */}
                    <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Margin Yield Shift
                      </div>
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          color:
                            comparisonAnalytics.marginShiftPts >= 0 ? emeraldColor : '#ef4444',
                          marginTop: '0.35rem'
                        }}
                      >
                        {comparisonAnalytics.marginShiftPts >= 0 ? '+' : ''}
                        {comparisonAnalytics.marginShiftPts.toFixed(2)} pts
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        P1: <strong>{comparisonAnalytics.p1Margin.toFixed(2)}%</strong> vs P2:{' '}
                        <strong>{comparisonAnalytics.p2Margin.toFixed(2)}%</strong>
                      </div>
                    </div>

                    {/* Cross-Sell Attachment Ratio */}
                    <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        P1 Hotel/Flight Cross-Sell
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: neonBlue, marginTop: '0.35rem' }}>
                        {comparisonAnalytics.p1CrossSell.toFixed(1)}%
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Entries: {comparisonAnalytics.p1Count} (P1) vs {comparisonAnalytics.p2Count} (P2)
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPARISON CHARTS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      {comparisonMode === 'type'
                        ? 'Retail vs Corporate Gross Sales'
                        : 'Period 1 vs Period 2 Gross Sales'}
                    </h3>
                    <div style={{ height: '360px', width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={
                            comparisonMode === 'type'
                              ? comparisonAnalytics.compTypeData
                              : comparisonAnalytics.compPeriodData
                          }
                          margin={{ top: 8, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            angle={-22}
                            textAnchor="end"
                            height={48}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                          />
                          <RechartsTooltip
                            content={<ProductivityChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                          {comparisonMode === 'type' ? (
                            <>
                              <Bar
                                dataKey="RetailSales"
                                name="Retail Sales"
                                fill={emeraldColor}
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="CorporateSales"
                                name="Corporate Sales"
                                fill={neonBlue}
                                radius={[4, 4, 0, 0]}
                              />
                            </>
                          ) : (
                            <>
                              <Bar
                                dataKey="P1Sales"
                                name="Period 1 Sales"
                                fill={neonBlue}
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="P2Sales"
                                name="Period 2 Sales"
                                fill={amberColor}
                                radius={[4, 4, 0, 0]}
                              />
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      {comparisonMode === 'type'
                        ? 'Retail vs Corporate Net Profit'
                        : 'Period 1 vs Period 2 Net Profit'}
                    </h3>
                    <div style={{ height: '360px', width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={
                            comparisonMode === 'type'
                              ? comparisonAnalytics.compTypeData
                              : comparisonAnalytics.compPeriodData
                          }
                          margin={{ top: 8, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            angle={-22}
                            textAnchor="end"
                            height={48}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                          />
                          <RechartsTooltip
                            content={<ProductivityChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                          {comparisonMode === 'type' ? (
                            <>
                              <Bar
                                dataKey="RetailProfit"
                                name="Retail Profit"
                                fill={emeraldColor}
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="CorporateProfit"
                                name="Corporate Profit"
                                fill={neonBlue}
                                radius={[4, 4, 0, 0]}
                              />
                            </>
                          ) : (
                            <>
                              <Bar
                                dataKey="P1Profit"
                                name="Period 1 Profit"
                                fill={emeraldColor}
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="P2Profit"
                                name="Period 2 Profit"
                                fill={amberColor}
                                radius={[4, 4, 0, 0]}
                              />
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: MANAGEMENT P&L REPORT                              */}
            {/* ========================================================= */}
            {activeTab === 'report' && (
              <div className="fade-in">
                <div className="card" style={{ overflowX: 'auto' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.15rem',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        Productivity P&amp;L Statement — {activePeriodRange.label}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Click any category row to drill down into consultant share and individual entries.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => window.print()}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.84rem'
                        }}
                      >
                        <Printer size={15} /> Print
                      </button>
                      <ExportMenu
                        data={reportRows}
                        columns={reportExportColumns}
                        filename={`Productivity_PnL_${activePeriodRange.label.replace(/\s+/g, '_')}`}
                      />
                    </div>
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>PRODUCT CATEGORY</th>
                        <th>SEGMENT</th>
                        <th style={{ textAlign: 'center' }}>ENTRIES</th>
                        <th style={{ textAlign: 'right' }}>TOTAL SALES</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PROFIT</th>
                        <th style={{ textAlign: 'right' }}>MARGIN (%)</th>
                        <th style={{ textAlign: 'right' }}>SALES SHARE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row, idx) => (
                        <tr
                          key={`${row.category}-${row.type}-${idx}`}
                          onClick={() =>
                            !row.isTotal && openCategoryDrawer(row.category, row.type)
                          }
                          style={{
                            cursor: row.isTotal ? 'default' : 'pointer',
                            background: row.isTotal
                              ? isLight
                                ? 'rgba(2, 132, 199, 0.08)'
                                : 'rgba(0, 212, 255, 0.09)'
                              : undefined,
                            fontWeight: row.isTotal ? 800 : 500
                          }}
                        >
                          <td
                            style={{
                              color: row.isTotal ? neonBlue : 'var(--text-main)',
                              fontWeight: row.isTotal ? 800 : 600
                            }}
                          >
                            {row.category}
                          </td>
                          <td>
                            {row.isTotal ? (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {row.type}
                              </span>
                            ) : (
                              <span
                                style={{
                                  ...getSegmentBadgeStyle(row.type),
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.73rem',
                                  fontWeight: 700
                                }}
                              >
                                {row.type}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                            {row.count}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              color: emeraldColor,
                              fontFamily: 'monospace',
                              fontWeight: 700
                            }}
                          >
                            {formatCurrency(row.sales)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              color: neonBlue,
                              fontFamily: 'monospace',
                              fontWeight: 700
                            }}
                          >
                            {formatCurrency(row.profit)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                ...getMarginBadgeStyle(row.margin),
                                padding: '0.18rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                fontFamily: 'monospace'
                              }}
                            >
                              {Number(row.margin).toFixed(2)}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', minWidth: '125px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                justifyContent: 'flex-end'
                              }}
                            >
                              <div
                                style={{
                                  width: '48px',
                                  height: '6px',
                                  borderRadius: '999px',
                                  background: 'var(--bg-surface)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, row.revenueShare)}%`,
                                    height: '100%',
                                    background: neonBlue
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  fontFamily: 'monospace',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                {Number(row.revenueShare).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {reportRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: 'center',
                              padding: '2.5rem',
                              color: 'var(--text-muted)'
                            }}
                          >
                            No productivity records match the selected period and filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: PRODUCTIVITY DATABASE                              */}
            {/* ========================================================= */}
            {activeTab === 'database' && (
              <div className="fade-in">
                {/* Collapsible Spreadsheet Importer */}
                {showImporter && canAdd && (
                  <CsvImportUtility
                    onImport={handleSpreadsheetImport}
                    templateHeaders={IMPORT_TEMPLATE_HEADERS}
                  />
                )}

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Database Toolbar */}
                  <div
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        flex: '1 1 280px',
                        maxWidth: '420px',
                        position: 'relative'
                      }}
                    >
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '0.85rem',
                          color: 'var(--text-muted)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search consultant, category, period, remarks, ID..."
                        value={globalSearch}
                        onChange={(e) => handleGlobalSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 2rem 0.55rem 2.35rem',
                          borderRadius: '0.6rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          outline: 'none'
                        }}
                      />
                      {globalSearch && (
                        <button
                          type="button"
                          onClick={() => handleGlobalSearch('')}
                          style={{
                            position: 'absolute',
                            right: '0.6rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                      {canDelete && selectedIds.length > 0 && (
                        <button
                          type="button"
                          className="btn"
                          onClick={requestBulkDelete}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Trash2 size={15} /> Delete Selected ({selectedIds.length})
                        </button>
                      )}

                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                      </select>

                      {canAdd && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setShowImporter((prev) => !prev)}
                          style={{
                            background: showImporter
                              ? 'rgba(0, 168, 255, 0.16)'
                              : 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: showImporter ? neonBlue : 'var(--text-main)',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <UploadCloud size={15} /> Import
                        </button>
                      )}

                      <ExportMenu
                        data={filteredData}
                        columns={databaseExportColumns}
                        filename="Productivity_Database"
                      />
                    </div>
                  </div>

                  {/* Quick Category Filter Pills */}
                  <div
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      gap: '0.4rem',
                      overflowX: 'auto'
                    }}
                  >
                    {['All', ...PRODUCTIVITY_CATEGORIES].map((cat) => {
                      const active = selectedCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat)}
                          style={{
                            border: `1px solid ${active ? neonBlue : 'var(--border)'}`,
                            background: active
                              ? isLight
                                ? 'rgba(2, 132, 199, 0.12)'
                                : 'rgba(0, 212, 255, 0.16)'
                              : 'var(--bg-card)',
                            color: active ? neonBlue : 'var(--text-muted)',
                            borderRadius: '999px',
                            padding: '0.24rem 0.72rem',
                            fontSize: '0.75rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sortable Data Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {canDelete && (
                            <th style={{ width: '38px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={toggleSelectAllPage}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                          )}
                          <th
                            onClick={() => handleSort('yearMonth')}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              PERIOD {renderSortIcon('yearMonth')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('staff')}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              CONSULTANT {renderSortIcon('staff')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('category')}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              CATEGORY {renderSortIcon('category')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('type')}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              SEGMENT {renderSortIcon('type')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('salesAmount')}
                            style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              SALES {renderSortIcon('salesAmount')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('profitAmount')}
                            style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              PROFIT {renderSortIcon('profitAmount')}
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort('marginPct')}
                            style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              MARGIN {renderSortIcon('marginPct')}
                            </span>
                          </th>
                          <th>REMARKS</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((rec) => {
                          const isChecked = selectedIds.includes(rec.id);
                          const editable = canEditRecord(rec);
                          return (
                            <tr
                              key={rec.id}
                              onClick={() => openRecordDrawer(rec)}
                              style={{
                                cursor: 'pointer',
                                background: isChecked
                                  ? isLight
                                    ? 'rgba(2, 132, 199, 0.06)'
                                    : 'rgba(0, 212, 255, 0.07)'
                                  : undefined
                              }}
                            >
                              {canDelete && (
                                <td
                                  style={{ textAlign: 'center' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelectRow(rec.id)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                              )}
                              <td>
                                <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                                  {rec.periodLabel}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {rec.date}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{rec.staff}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {rec.category}
                                </span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    ...getSegmentBadgeStyle(rec.type),
                                    padding: '0.18rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.73rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {rec.type}
                                </span>
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  color: emeraldColor,
                                  fontWeight: 700,
                                  fontFamily: 'monospace'
                                }}
                              >
                                {formatCurrency(rec.salesAmount)}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  color: neonBlue,
                                  fontWeight: 700,
                                  fontFamily: 'monospace'
                                }}
                              >
                                {formatCurrency(rec.profitAmount)}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span
                                  style={{
                                    ...getMarginBadgeStyle(rec.marginPct),
                                    padding: '0.16rem 0.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {rec.marginPct.toFixed(2)}%
                                </span>
                              </td>
                              <td
                                style={{
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                  color: rec.remarks ? 'var(--text-main)' : 'var(--text-muted)'
                                }}
                                title={rec.remarks || ''}
                              >
                                {rec.remarks || '—'}
                              </td>
                              <td
                                style={{ textAlign: 'right' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    gap: '0.35rem',
                                    justifyContent: 'flex-end'
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn"
                                    title="Inspect Details"
                                    onClick={() => openRecordDrawer(rec)}
                                    style={{
                                      padding: '0.4rem',
                                      background: 'var(--bg-surface)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-main)'
                                    }}
                                  >
                                    <Eye size={14} />
                                  </button>
                                  {canAdd && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title="Duplicate Entry"
                                      onClick={() => handleDuplicateRecord(rec)}
                                      style={{
                                        padding: '0.4rem',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)',
                                        color: neonBlue
                                      }}
                                    >
                                      <Copy size={14} />
                                    </button>
                                  )}
                                  {editable && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title="Edit Entry"
                                      onClick={() => handleOpenModal(rec)}
                                      style={{
                                        padding: '0.4rem',
                                        background: isLight
                                          ? 'rgba(2, 132, 199, 0.1)'
                                          : 'rgba(0, 212, 255, 0.12)',
                                        color: neonBlue
                                      }}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title="Delete Entry"
                                      onClick={() => requestSingleDelete(rec)}
                                      style={{
                                        padding: '0.4rem',
                                        background: 'rgba(239, 68, 68, 0.11)',
                                        color: '#ef4444'
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedData.length === 0 && (
                          <tr>
                            <td
                              colSpan={canDelete ? 10 : 9}
                              style={{
                                textAlign: 'center',
                                padding: '2.75rem 1rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {loading
                                ? 'Loading productivity records...'
                                : 'No productivity records match your search or active filters.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SMART IDR & MARGIN CALCULATOR ENTRY MODAL                 */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '760px',
              width: '95%',
              background: 'var(--bg-card)',
              padding: 0,
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
              }}
            >
              <div>
                <h2
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                    fontSize: '1.15rem',
                    color: neonBlue
                  }}
                >
                  {editingRec ? <Edit2 size={20} /> : <Plus size={20} />}
                  {editingRec ? 'Edit Productivity Entry' : 'Log Productivity / Daily Task Revenue'}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isStaff
                    ? `Logging under your consultant profile (${user?.name})`
                    : 'Enter gross sales and net profit — or click a margin % chip to auto-calculate profit'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.35rem 1.5rem', maxHeight: '82vh', overflowY: 'auto' }}>
              {/* Period + Consultant Row */}
              <div className="form-grid" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group">
                  <label>
                    Period (Month / Year) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      padding: '0.68rem 0.9rem',
                      borderRadius: '0.55rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Consultant <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    {isStaff && (
                      <span style={{ fontSize: '0.7rem', color: neonBlue, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Lock size={11} /> Locked to your profile
                      </span>
                    )}
                  </label>
                  {isStaff ? (
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '0.68rem 0.9rem',
                        borderRadius: '0.55rem',
                        width: '100%',
                        fontWeight: 700,
                        opacity: 0.85
                      }}
                    />
                  ) : (
                    <select
                      required
                      value={formData.staff}
                      onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '0.68rem 0.9rem',
                        borderRadius: '0.55rem',
                        width: '100%',
                        fontWeight: 600
                      }}
                    >
                      <option value="">Select Consultant</option>
                      {staffOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Segment Pills + Product Category Pills */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.45rem', color: 'var(--text-muted)' }}>
                  Sales Segment <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  {PRODUCTIVITY_TYPES.map((seg) => {
                    const active = formData.type === seg;
                    return (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: seg })}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.6rem',
                          border: `1.5px solid ${active ? neonBlue : 'var(--border)'}`,
                          background: active
                            ? isLight
                              ? 'rgba(2, 132, 199, 0.1)'
                              : 'rgba(0, 212, 255, 0.14)'
                            : 'var(--bg-surface)',
                          color: active ? neonBlue : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {seg === 'Retail' ? 'Retail (B2C / FIT)' : 'Corporate (B2B / Company)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.45rem', color: 'var(--text-muted)' }}>
                  Product Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {PRODUCTIVITY_CATEGORIES.map((cat) => {
                    const active = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        style={{
                          padding: '0.42rem 0.85rem',
                          borderRadius: '999px',
                          border: `1px solid ${active ? neonBlue : 'var(--border)'}`,
                          background: active ? 'var(--primary)' : 'var(--bg-surface)',
                          color: active ? 'var(--primary-fg, #fff)' : 'var(--text-main)',
                          fontSize: '0.79rem',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formatted IDR Currency Inputs + Quick Presets */}
              <div className="form-grid" style={{ marginBottom: '0.9rem' }}>
                <div className="input-group">
                  <label>
                    Gross Sales Amount (IDR) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: emeraldColor
                      }}
                    >
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formSalesNum > 0 ? formatNumberId(formSalesNum) : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salesAmount: parseDigitsInput(e.target.value)
                        })
                      }
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        borderRadius: '0.55rem',
                        width: '100%',
                        padding: '0.7rem 0.9rem 0.7rem 2.45rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {SALES_QUICK_ADD.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            salesAmount: (Number(prev.salesAmount) || 0) + p.value
                          }))
                        }
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.72rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: emeraldColor,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                    {formSalesNum > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, salesAmount: 0 }))}
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.72rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    Net Profit Amount (IDR) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: neonBlue
                      }}
                    >
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formProfitNum > 0 ? formatNumberId(formProfitNum) : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profitAmount: parseDigitsInput(e.target.value)
                        })
                      }
                      style={{
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isProfitExceedingSales ? '#f59e0b' : 'var(--border)'}`,
                        color: 'var(--text-main)',
                        borderRadius: '0.55rem',
                        width: '100%',
                        padding: '0.7rem 0.9rem 0.7rem 2.45rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap', marginTop: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calc Margin:</span>
                    {MARGIN_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (formSalesNum <= 0) {
                            toast.info('Enter Gross Sales first to auto-calculate profit by margin %.');
                            return;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            profitAmount: Math.round((Number(prev.salesAmount) || 0) * (pct / 100))
                          }));
                        }}
                        style={{
                          padding: '0.2rem 0.46rem',
                          fontSize: '0.72rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: neonBlue,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Margin & Yield Preview Bar */}
              <div
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '0.65rem',
                  background: isProfitExceedingSales
                    ? 'rgba(245, 158, 11, 0.1)'
                    : isLight
                      ? 'rgba(2, 132, 199, 0.06)'
                      : 'rgba(0, 212, 255, 0.07)',
                  border: `1px solid ${
                    isProfitExceedingSales
                      ? 'rgba(245, 158, 11, 0.35)'
                      : isLight
                        ? 'rgba(2, 132, 199, 0.2)'
                        : 'rgba(0, 212, 255, 0.2)'
                  }`,
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  {isProfitExceedingSales ? (
                    <>
                      <AlertTriangle size={16} color={amberColor} />
                      <span style={{ color: amberColor, fontWeight: 600 }}>
                        Heads up: Net Profit exceeds Gross Sales ({formMarginPct.toFixed(1)}%). Verify digits before saving.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} color={emeraldColor} />
                      <span style={{ color: 'var(--text-muted)' }}>
                        Live Calculated Margin:{' '}
                        <strong style={{ color: 'var(--text-main)' }}>
                          {formMarginPct.toFixed(2)}%
                        </strong>
                      </span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  COGS / Net Supplier Cost:{' '}
                  <strong style={{ color: 'var(--text-main)' }}>
                    {formatCurrency(Math.max(0, formSalesNum - formProfitNum))}
                  </strong>
                </div>
              </div>

              {/* Remarks */}
              <div className="input-group">
                <label>Remarks / Client / Booking Notes</label>
                <textarea
                  placeholder="Optional deal context, corporate account name, booking reference, or daily task note..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.55rem',
                    padding: '0.75rem 0.9rem',
                    width: '100%',
                    color: 'var(--text-main)',
                    minHeight: '76px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.65rem',
                  marginTop: '1.35rem',
                  paddingTop: '1.1rem',
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)'
                  }}
                >
                  Cancel
                </button>
                {!editingRec && (
                  <button
                    type="button"
                    className="btn"
                    disabled={isSaving}
                    onClick={() => saveFormRecord(true)}
                    style={{
                      background: isLight
                        ? 'rgba(2, 132, 199, 0.1)'
                        : 'rgba(0, 212, 255, 0.14)',
                      border: `1px solid ${neonBlue}`,
                      color: neonBlue,
                      fontWeight: 700
                    }}
                  >
                    Save &amp; Add Another
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ fontWeight: 700 }}
                >
                  {isSaving ? 'Saving...' : editingRec ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER (RECORD & CATEGORY P&L INSPECTOR)       */}
      {/* ========================================================= */}
      <SlideOverDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        title={
          drawerState.mode === 'record' && inspectedRecord
            ? `${inspectedRecord.category} (${inspectedRecord.type})`
            : inspectedCategoryStats
              ? `${inspectedCategoryStats.category} P&L Breakdown`
              : 'Productivity Inspector'
        }
        subtitle={
          drawerState.mode === 'record' && inspectedRecord
            ? `${inspectedRecord.staff} • ${inspectedRecord.periodLabel} • ID: ${inspectedRecord.id}`
            : inspectedCategoryStats
              ? `${activePeriodRange.label} • Segment: ${inspectedCategoryStats.segment}`
              : ''
        }
        footer={
          drawerState.mode === 'record' && inspectedRecord ? (
            <>
              {canAdd && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleDuplicateRecord(inspectedRecord)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Copy size={15} /> Duplicate
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => requestSingleDelete(inspectedRecord)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Trash2 size={15} /> Delete
                </button>
              )}
              {canEditRecord(inspectedRecord) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setDrawerState((prev) => ({ ...prev, isOpen: false }));
                    handleOpenModal(inspectedRecord);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit2 size={15} /> Edit Record
                </button>
              )}
            </>
          ) : null
        }
      >
        {drawerState.mode === 'record' && inspectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '0.7rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Gross Sales
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: emeraldColor, marginTop: '0.25rem' }}>
                  {formatCurrency(inspectedRecord.salesAmount)}
                </div>
              </div>
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '0.7rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Net Profit
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: neonBlue, marginTop: '0.25rem' }}>
                  {formatCurrency(inspectedRecord.profitAmount)}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Profit Margin</span>
                <span
                  style={{
                    ...getMarginBadgeStyle(inspectedRecord.marginPct),
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                >
                  {inspectedRecord.marginPct.toFixed(2)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Implied Supplier Cost</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {formatCurrency(
                    Math.max(0, inspectedRecord.salesAmount - inspectedRecord.profitAmount)
                  )}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consultant</span>
                <strong>{inspectedRecord.staff}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Segment</span>
                <span
                  style={{
                    ...getSegmentBadgeStyle(inspectedRecord.type),
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {inspectedRecord.type}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Period</span>
                <strong>{inspectedRecord.periodLabel} ({inspectedRecord.date})</strong>
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Remarks &amp; Notes
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {inspectedRecord.remarks || 'No additional remarks recorded for this entry.'}
              </p>
            </div>
          </div>
        )}

        {drawerState.mode === 'category' && inspectedCategoryStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SALES</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: emeraldColor, marginTop: '0.2rem' }}>
                  {formatCompactIdr(inspectedCategoryStats.sales)}
                </div>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROFIT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: neonBlue, marginTop: '0.2rem' }}>
                  {formatCompactIdr(inspectedCategoryStats.profit)}
                </div>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MARGIN</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: amberColor, marginTop: '0.2rem' }}>
                  {inspectedCategoryStats.margin.toFixed(2)}%
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.55rem 0', fontSize: '0.84rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Consultant Contribution ({inspectedCategoryStats.staffRanking.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {inspectedCategoryStats.staffRanking.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.6rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{s.name}</strong>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {s.count} entries • Sales: {formatCompactIdr(s.sales)}
                      </div>
                    </div>
                    <strong style={{ color: neonBlue, fontFamily: 'monospace', fontSize: '0.86rem' }}>
                      {formatCurrency(s.profit)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.55rem 0', fontSize: '0.84rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Underlying Entries ({inspectedCategoryStats.records.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {inspectedCategoryStats.records.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => openRecordDrawer(r)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.6rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 700 }}>
                        {r.staff} • <span style={{ color: neonBlue }}>{r.periodLabel}</span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {r.type} {r.remarks ? `• ${r.remarks}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: neonBlue }}>
                        {formatCompactIdr(r.profitAmount)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {r.marginPct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                */}
      {/* ========================================================= */}
      {confirmState.isOpen && (
        <div
          className="modal-overlay"
          onClick={() =>
            setConfirmState({ isOpen: false, mode: 'single', targetId: null, label: '' })
          }
        >
          <div
            className="modal-content fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.9rem',
              padding: '1.4rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Confirm Deletion
              </h3>
            </div>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--text-main)' }}>{confirmState.label}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setConfirmState({ isOpen: false, mode: 'single', targetId: null, label: '' })
                }
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productivity;
