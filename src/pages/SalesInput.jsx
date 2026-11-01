import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import ExportMenu from '../components/ExportMenu';
import { useSales } from '../context/SalesContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useProductivity } from '../context/ProductivityContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  Plus,
  BarChart2,
  DollarSign,
  Target,
  TrendingUp,
  PieChart,
  Printer,
  Award,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  UploadCloud,
  Search,
  X,
  Eye,
  ArrowUpDown,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const SALES_TARGET_PRESETS = [
  { label: 'Rp 100M', value: 100000000 },
  { label: 'Rp 250M', value: 250000000 },
  { label: 'Rp 500M', value: 500000000 },
  { label: 'Rp 750M', value: 750000000 },
  { label: 'Rp 1B', value: 1000000000 }
];

const MARGIN_TARGET_PRESETS = [8, 10, 12, 15, 20];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CHART_COLORS = [
  '#00a8ff',
  '#10b981',
  '#38bdf8',
  '#6366f1',
  '#f59e0b',
  '#0284c7',
  '#ec4899',
  '#64748b'
];

const IMPORT_TEMPLATE_HEADERS = [
  'Period',
  'Consultant',
  'Target Sales (IDR)',
  'Target Profit (IDR)',
  'Actual Sales (IDR)',
  'Actual Profit (IDR)'
];

const formatNumberId = (value) =>
  new Intl.NumberFormat('id-ID').format(Math.round(Number(value) || 0));

const formatIdr = (value) => {
  const num = Math.round(Number(value) || 0);
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
  return `${sign}Rp ${formatNumberId(abs)}`;
};

const formatPercent = (value, decimals = 1) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
};

const getCurrentMonthString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const shiftMonthString = (periodStr, deltaMonths) => {
  const match = String(periodStr || '').match(/^(\d{4})-(\d{2})$/);
  const baseYear = match ? Number(match[1]) : new Date().getFullYear();
  const baseMonthIdx = match ? Number(match[2]) - 1 : new Date().getMonth();
  const d = new Date(baseYear, baseMonthIdx + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatPeriodLabel = (periodStr) => {
  const match = String(periodStr || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return periodStr || '-';
  const monthIdx = Number(match[2]) - 1;
  const mName = MONTH_NAMES_SHORT[monthIdx] || match[2];
  return `${mName} ${match[1]}`;
};

const periodMatchesHorizon = (periodStr, horizonMode, selectedPeriod, selectedYear, selectedQuarter) => {
  if (!periodStr) return false;
  if (horizonMode === 'all') return true;
  if (horizonMode === 'month') return periodStr === selectedPeriod;
  if (!periodStr.startsWith(`${selectedYear}-`)) return false;
  if (horizonMode === 'year') return true;
  if (horizonMode === 'quarter') {
    const m = Number(periodStr.substring(5, 7));
    if (!m) return false;
    const q = Math.ceil(m / 3);
    return `Q${q}` === selectedQuarter;
  }
  return periodStr === selectedPeriod;
};

const SalesChartTooltip = ({ active, payload, label, isLight, isPercent = false }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: isLight ? '#ffffff' : '#0b1325',
        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.28)'}`,
        borderRadius: '10px',
        padding: '0.65rem 0.85rem',
        boxShadow: isLight
          ? '0 10px 25px rgba(2, 132, 199, 0.12)'
          : '0 10px 28px rgba(0, 0, 0, 0.55)',
        fontSize: '0.8rem'
      }}
    >
      {label && (
        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
          {label}
        </div>
      )}
      {payload.map((entry, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-main)',
            marginTop: '0.18rem'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: entry.color || entry.payload?.color || '#00a8ff',
              display: 'inline-block'
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
          <strong>
            {isPercent ? formatPercent(Number(entry.value) || 0, 1) : formatIdr(entry.value)}
          </strong>
        </div>
      ))}
    </div>
  );
};

const SalesInput = () => {
  const {
    sales: salesData,
    addSale,
    updateSale,
    deleteSale,
    bulkDeleteSales,
    clonePeriodTargets,
    bulkSyncWorkspaceActuals,
    bulkImportSales
  } = useSales();
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  // Cross-module workspace feeds for Live Actuals Estimator & Sync
  const { productivityData } = useProductivity();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();

  const isLight = theme === 'light';
  const currentUserName = user?.name || '';
  const currentUserRole = user?.role || '';

  const isAdmin = currentUserRole === 'Admin';
  const isManager = currentUserRole === 'Manager';
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canAdd = isAdmin || isManager;

  const activeStaff = useMemo(
    () => (users || []).filter((u) => u.status === 'Active'),
    [users]
  );

  const initialMonth = getCurrentMonthString();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'database'
  const [showImport, setShowImport] = useState(false);

  // Flexible Time Horizon State
  const [horizonMode, setHorizonMode] = useState('month'); // 'month' | 'quarter' | 'year' | 'all'
  const [selectedPeriod, setSelectedPeriod] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(() => initialMonth.substring(0, 4));
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const m = Number(initialMonth.substring(5, 7));
    return `Q${Math.ceil(m / 3)}`;
  });

  // Table Scope, Search, Sort & Bulk Selection
  const [tableScope, setTableScope] = useState('all'); // 'all' | 'achieved' | 'on_track' | 'coaching' | 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'salesPct',
    direction: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState([]);

  // Quick Entry / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    period: initialMonth,
    staffName: '',
    targetSales: '',
    targetProfit: '',
    achievementSales: '',
    achievementProfit: ''
  });

  // SlideOverDrawer Consultant Scorecard State
  const [inspectStaffName, setInspectStaffName] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const availableYears = useMemo(() => {
    const set = new Set([initialMonth.substring(0, 4)]);
    (salesData || []).forEach((s) => {
      if (s.period && /^\d{4}/.test(s.period)) {
        set.add(s.period.substring(0, 4));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [salesData, initialMonth]);

  // Compute live workspace revenue, profit & deal counts per (staffName, YYYY-MM)
  const workspaceByPeriodStaff = useMemo(() => {
    const map = {};
    const ensureBucket = (period, staff) => {
      if (!period || !staff) return null;
      const cleanPeriod = period.substring(0, 7);
      if (!/^\d{4}-\d{2}$/.test(cleanPeriod)) return null;
      const cleanStaff = staff.trim();
      if (!cleanStaff) return null;
      if (!map[cleanPeriod]) map[cleanPeriod] = {};
      const lower = cleanStaff.toLowerCase();
      if (!map[cleanPeriod][lower]) {
        map[cleanPeriod][lower] = {
          staffName: cleanStaff,
          productivitySales: 0,
          productivityProfit: 0,
          productivityCount: 0,
          tourSales: 0,
          tourProfit: 0,
          tourCount: 0,
          docSales: 0,
          docCount: 0,
          cruiseCount: 0,
          hotelCount: 0
        };
      }
      return map[cleanPeriod][lower];
    };

    (productivityData || []).forEach((p) => {
      const b = ensureBucket(p.date, p.staff);
      if (b) {
        b.productivitySales += Number(p.salesAmount) || 0;
        b.productivityProfit += Number(p.profitAmount) || 0;
        b.productivityCount += 1;
      }
    });

    (tours || []).forEach((t) => {
      if (['Cancel', 'Cancelled'].includes(t.status)) return;
      const tDate = t.internals?.bookingDate || t.departureDate || '';
      const tStaff = t.staffName || t.internals?.staffName || '';
      const b = ensureBucket(tDate, tStaff);
      if (b) {
        const rev =
          Number(
            t.totalOmset ??
              t.financials?.totalSellingPrice ??
              t.financials?.totalOmset
          ) || 0;
        const prof =
          Number(
            t.financials?.profit ??
              (Number(t.totalSellingPrice || 0) - Number(t.totalNettPrice || 0))
          ) || 0;
        b.tourSales += rev;
        b.tourProfit += prof;
        b.tourCount += 1;
      }
    });

    (documents || []).forEach((d) => {
      const b = ensureBucket(d.receiveDate, d.staff);
      if (b) {
        b.docSales += Number(d.price) || 0;
        b.docCount += 1;
      }
    });

    (cruises || []).forEach((c) => {
      if (['Cancel', 'Cancelled'].includes(c.status)) return;
      const b = ensureBucket(c.sailingStart, c.staff);
      if (b) b.cruiseCount += 1;
    });

    (hotels || []).forEach((h) => {
      if (['Cancel', 'Cancelled'].includes(h.status)) return;
      const b = ensureBucket(h.checkIn, h.staff);
      if (b) b.hotelCount += 1;
    });

    return map;
  }, [productivityData, tours, documents, cruises, hotels]);

  const getLiveStatsForStaffHorizon = (staffName, mode, period, year, quarter) => {
    const lower = (staffName || '').trim().toLowerCase();
    const acc = {
      sales: 0,
      profit: 0,
      productivitySales: 0,
      productivityProfit: 0,
      productivityCount: 0,
      tourSales: 0,
      tourProfit: 0,
      tourCount: 0,
      docSales: 0,
      docCount: 0,
      cruiseCount: 0,
      hotelCount: 0
    };
    if (!lower) return acc;

    Object.keys(workspaceByPeriodStaff).forEach((pKey) => {
      if (!periodMatchesHorizon(pKey, mode, period, year, quarter)) return;
      const entry = workspaceByPeriodStaff[pKey]?.[lower];
      if (!entry) return;
      acc.productivitySales += entry.productivitySales;
      acc.productivityProfit += entry.productivityProfit;
      acc.productivityCount += entry.productivityCount;
      acc.tourSales += entry.tourSales;
      acc.tourProfit += entry.tourProfit;
      acc.tourCount += entry.tourCount;
      acc.docSales += entry.docSales;
      acc.docCount += entry.docCount;
      acc.cruiseCount += entry.cruiseCount;
      acc.hotelCount += entry.hotelCount;
    });

    acc.sales = acc.productivitySales + acc.tourSales + acc.docSales;
    acc.profit = acc.productivityProfit + acc.tourProfit;
    return acc;
  };

  // Keep formData.period synced when user changes selectedPeriod via top controls
  const handleSelectPeriod = (nextPeriod) => {
    if (!nextPeriod) return;
    setSelectedPeriod(nextPeriod);
    setSelectedYear(nextPeriod.substring(0, 4));
    const m = Number(nextPeriod.substring(5, 7));
    if (m) setSelectedQuarter(`Q${Math.ceil(m / 3)}`);
    setSelectedIds([]);

    if (!editingId) {
      setFormData((prev) => {
        if (!prev.staffName) {
          return { ...prev, period: nextPeriod };
        }
        const match = (salesData || []).find(
          (s) =>
            s.period === nextPeriod &&
            s.staffName.toLowerCase() === prev.staffName.toLowerCase()
        );
        if (match) {
          return {
            period: nextPeriod,
            staffName: match.staffName,
            targetSales: String(match.targetSales || ''),
            targetProfit: String(match.targetProfit || ''),
            achievementSales: String(match.achievementSales || ''),
            achievementProfit: String(match.achievementProfit || '')
          };
        }
        return { ...prev, period: nextPeriod };
      });
    }
  };

  // Detect if current (staffName, period) in form matches an existing record
  const matchedExistingInForm = useMemo(() => {
    if (!formData.staffName || !formData.period) return null;
    return (
      (salesData || []).find(
        (s) =>
          s.period === formData.period &&
          s.staffName.toLowerCase() === formData.staffName.toLowerCase()
      ) || null
    );
  }, [salesData, formData.staffName, formData.period]);

  const handleFormStaffOrPeriodChange = (nextStaff, nextPeriod) => {
    const existing = (salesData || []).find(
      (s) =>
        s.period === nextPeriod &&
        nextStaff &&
        s.staffName.toLowerCase() === nextStaff.toLowerCase()
    );
    if (existing) {
      setEditingId(existing.id);
      setFormData({
        period: existing.period,
        staffName: existing.staffName,
        targetSales: existing.targetSales ? String(existing.targetSales) : '',
        targetProfit: existing.targetProfit ? String(existing.targetProfit) : '',
        achievementSales: existing.achievementSales
          ? String(existing.achievementSales)
          : '',
        achievementProfit: existing.achievementProfit
          ? String(existing.achievementProfit)
          : ''
      });
    } else {
      setEditingId(null);
      setFormData((prev) => ({
        ...prev,
        period: nextPeriod,
        staffName: nextStaff
      }));
    }
  };

  const handleClear = () => {
    setFormData({
      period: selectedPeriod,
      staffName: '',
      targetSales: '',
      targetProfit: '',
      achievementSales: '',
      achievementProfit: ''
    });
    setEditingId(null);
  };

  const handleFillFormWithLiveActuals = () => {
    if (!formData.staffName || !formData.period) {
      toast.warning('Select a Consultant and Period first to pull live actuals.');
      return;
    }
    const live = getLiveStatsForStaffHorizon(
      formData.staffName,
      'month',
      formData.period,
      formData.period.substring(0, 4),
      'Q1'
    );
    setFormData((prev) => ({
      ...prev,
      achievementSales: String(Math.round(live.sales)),
      achievementProfit: String(Math.round(live.profit))
    }));
    toast.info(
      `Loaded live tracked actuals (${formatIdr(live.sales)} sales, ${formatIdr(
        live.profit
      )} profit) for ${formData.staffName}.`
    );
  };

  const handleApplyTargetMarginPct = (pct) => {
    const baseSales = Number(formData.targetSales) || 0;
    if (baseSales <= 0) {
      toast.warning('Enter Target Sales first to calculate Target Profit from margin %.');
      return;
    }
    const computedProfit = Math.round((baseSales * pct) / 100);
    setFormData((prev) => ({
      ...prev,
      targetProfit: String(computedProfit)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffName) {
      toast.warning('Please select a Staff Consultant.');
      return;
    }
    if (!formData.period) {
      toast.warning('Please select a target Period.');
      return;
    }

    setIsSubmitting(true);
    try {
      const salePayload = {
        staffName: formData.staffName.trim(),
        targetSales: Number(formData.targetSales) || 0,
        targetProfit: Number(formData.targetProfit) || 0,
        achievementSales: Number(formData.achievementSales) || 0,
        achievementProfit: Number(formData.achievementProfit) || 0,
        period: formData.period
      };

      if (editingId) {
        await updateSale(editingId, salePayload);
        toast.success(
          `Updated ${formatPeriodLabel(salePayload.period)} quota for ${salePayload.staffName}.`
        );
      } else {
        const res = await addSale(salePayload);
        toast.success(
          res?.mode === 'updated'
            ? `Updated existing ${formatPeriodLabel(salePayload.period)} quota for ${salePayload.staffName}.`
            : `Added ${formatPeriodLabel(salePayload.period)} quota for ${salePayload.staffName}.`
        );
      }
      if (horizonMode === 'month' && salePayload.period !== selectedPeriod) {
        setSelectedPeriod(salePayload.period);
      }
      handleClear();
    } catch (err) {
      toast.error(err?.message || 'Failed to save sales quota record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    if (row.isAggregated && row.recordCount > 1) {
      setInspectStaffName(row.staffName);
      return;
    }
    if (horizonMode !== 'month' && row.period) {
      setHorizonMode('month');
      setSelectedPeriod(row.period);
    }
    setFormData({
      period: row.period || selectedPeriod,
      staffName: row.staffName,
      targetSales: String(row.targetSales || ''),
      targetProfit: String(row.targetProfit || ''),
      achievementSales: String(row.achievementSales || ''),
      achievementProfit: String(row.achievementProfit || '')
    });
    setEditingId(row.id);
    setIsFormOpen(true);
    setActiveTab('database');
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (
      !window.confirm(
        `Delete ${formatPeriodLabel(row.period)} quota record for "${row.staffName}"?`
      )
    ) {
      return;
    }
    try {
      await deleteSale(row.id);
      setSelectedIds((prev) => prev.filter((item) => item !== row.id));
      toast.success(`Deleted quota record for "${row.staffName}".`);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete quota record.');
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.length} selected quota record(s)?`
      )
    ) {
      return;
    }
    try {
      await bulkDeleteSales(selectedIds);
      toast.success(`Deleted ${selectedIds.length} quota record(s).`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk delete failed.');
    }
  };

  const handleClonePreviousMonth = async () => {
    const prevPeriod = shiftMonthString(selectedPeriod, -1);
    try {
      const count = await clonePeriodTargets(prevPeriod, selectedPeriod);
      toast.success(
        `Copied ${count} consultant quota(s) from ${formatPeriodLabel(
          prevPeriod
        )} into ${formatPeriodLabel(selectedPeriod)}!`
      );
    } catch (err) {
      toast.warning(err?.message || 'Could not copy previous month targets.');
    }
  };

  const handleSyncTeamLiveActuals = async () => {
    const monthBucket = workspaceByPeriodStaff[selectedPeriod] || {};
    const actualsMap = {};

    // Include existing quota staff in selectedPeriod as well as active staff with deals
    (salesData || [])
      .filter((s) => s.period === selectedPeriod)
      .forEach((s) => {
        const live = monthBucket[s.staffName.toLowerCase()];
        actualsMap[s.staffName] = {
          sales: live
            ? live.productivitySales + live.tourSales + live.docSales
            : s.achievementSales,
          profit: live
            ? live.productivityProfit + live.tourProfit
            : s.achievementProfit
        };
      });

    Object.values(monthBucket).forEach((entry) => {
      const existingKey = Object.keys(actualsMap).find(
        (k) => k.toLowerCase() === entry.staffName.toLowerCase()
      );
      if (!existingKey) {
        actualsMap[entry.staffName] = {
          sales: entry.productivitySales + entry.tourSales + entry.docSales,
          profit: entry.productivityProfit + entry.tourProfit
        };
      }
    });

    if (Object.keys(actualsMap).length === 0) {
      toast.warning(
        `No tracked bookings or quota rows found in ${formatPeriodLabel(selectedPeriod)}.`
      );
      return;
    }

    try {
      const res = await bulkSyncWorkspaceActuals(selectedPeriod, actualsMap);
      toast.success(
        `Synced live workspace actuals for ${formatPeriodLabel(selectedPeriod)} (${
          res.updated
        } updated, ${res.created} added).`
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to sync workspace actuals.');
    }
  };

  const handleSyncSingleConsultant = async (row) => {
    if (!row || horizonMode !== 'month') return;
    try {
      if (row.id) {
        await updateSale(row.id, {
          achievementSales: Math.round(row.liveSales),
          achievementProfit: Math.round(row.liveProfit)
        });
      } else {
        await addSale({
          staffName: row.staffName,
          period: selectedPeriod,
          targetSales: 0,
          targetProfit: 0,
          achievementSales: Math.round(row.liveSales),
          achievementProfit: Math.round(row.liveProfit)
        });
      }
      toast.success(`Synced live workspace actuals for ${row.staffName}.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to sync consultant actuals.');
    }
  };

  const handleCsvImport = async (rows) => {
    try {
      const count = await bulkImportSales(rows, selectedPeriod);
      toast.success(`Imported / updated ${count} quota record(s) successfully!`);
      setShowImport(false);
      setActiveTab('database');
    } catch (err) {
      toast.error(err?.message || 'Failed to import spreadsheet.');
    }
  };

  // Aggregate & enrich rows for the selected horizon
  const horizonRows = useMemo(() => {
    const matching = (salesData || []).filter((s) =>
      periodMatchesHorizon(
        s.period,
        horizonMode,
        selectedPeriod,
        selectedYear,
        selectedQuarter
      )
    );

    const byStaff = new Map();
    matching.forEach((s) => {
      const key = (s.staffName || 'Unassigned').trim().toLowerCase();
      const prev = byStaff.get(key);
      if (!prev) {
        byStaff.set(key, {
          id: s.id,
          staffName: s.staffName || 'Unassigned',
          period: s.period,
          targetSales: Number(s.targetSales) || 0,
          targetProfit: Number(s.targetProfit) || 0,
          achievementSales: Number(s.achievementSales) || 0,
          achievementProfit: Number(s.achievementProfit) || 0,
          recordCount: 1,
          isAggregated: horizonMode !== 'month'
        });
      } else {
        prev.targetSales += Number(s.targetSales) || 0;
        prev.targetProfit += Number(s.targetProfit) || 0;
        prev.achievementSales += Number(s.achievementSales) || 0;
        prev.achievementProfit += Number(s.achievementProfit) || 0;
        prev.recordCount += 1;
        prev.isAggregated = true;
      }
    });

    return Array.from(byStaff.values()).map((r) => {
      const salesPct =
        r.targetSales > 0 ? (r.achievementSales / r.targetSales) * 100 : 0;
      const profitPct =
        r.targetProfit > 0 ? (r.achievementProfit / r.targetProfit) * 100 : 0;
      const targetMarginPct =
        r.targetSales > 0 ? (r.targetProfit / r.targetSales) * 100 : 0;
      const marginPct =
        r.achievementSales > 0
          ? (r.achievementProfit / r.achievementSales) * 100
          : 0;
      const salesVariance = r.achievementSales - r.targetSales;
      const profitVariance = r.achievementProfit - r.targetProfit;

      let attainmentBand = 'coaching';
      if (r.targetSales > 0 && salesPct >= 100) attainmentBand = 'achieved';
      else if (r.targetSales > 0 && salesPct >= 70) attainmentBand = 'on_track';

      const live = getLiveStatsForStaffHorizon(
        r.staffName,
        horizonMode,
        selectedPeriod,
        selectedYear,
        selectedQuarter
      );

      return {
        ...r,
        salesPct,
        profitPct,
        targetMarginPct,
        marginPct,
        salesVariance,
        profitVariance,
        attainmentBand,
        liveSales: live.sales,
        liveProfit: live.profit,
        liveDetails: live
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    salesData,
    horizonMode,
    selectedPeriod,
    selectedYear,
    selectedQuarter,
    workspaceByPeriodStaff
  ]);

  const horizonLabel = useMemo(() => {
    if (horizonMode === 'month') return formatPeriodLabel(selectedPeriod);
    if (horizonMode === 'quarter') return `${selectedQuarter} ${selectedYear}`;
    if (horizonMode === 'year') return `Full Year ${selectedYear}`;
    return 'All Recorded Periods';
  }, [horizonMode, selectedPeriod, selectedQuarter, selectedYear]);

  // Totals across active horizon
  const totals = useMemo(() => {
    const base = horizonRows.reduce(
      (acc, curr) => {
        acc.targetSales += curr.targetSales;
        acc.targetProfit += curr.targetProfit;
        acc.achievementSales += curr.achievementSales;
        acc.achievementProfit += curr.achievementProfit;
        acc.liveSales += curr.liveSales;
        acc.liveProfit += curr.liveProfit;
        return acc;
      },
      {
        targetSales: 0,
        targetProfit: 0,
        achievementSales: 0,
        achievementProfit: 0,
        liveSales: 0,
        liveProfit: 0
      }
    );

    const salesPct =
      base.targetSales > 0
        ? (base.achievementSales / base.targetSales) * 100
        : 0;
    const profitPct =
      base.targetProfit > 0
        ? (base.achievementProfit / base.targetProfit) * 100
        : 0;
    const targetMarginPct =
      base.targetSales > 0 ? (base.targetProfit / base.targetSales) * 100 : 0;
    const realizedMarginPct =
      base.achievementSales > 0
        ? (base.achievementProfit / base.achievementSales) * 100
        : 0;
    const salesVariance = base.achievementSales - base.targetSales;

    return {
      ...base,
      salesPct,
      profitPct,
      targetMarginPct,
      realizedMarginPct,
      salesVariance
    };
  }, [horizonRows]);

  // Logged-in consultant's personal quota row (great motivation banner for Staff!)
  const myQuotaRow = useMemo(() => {
    if (!currentUserName) return null;
    return (
      horizonRows.find(
        (r) => r.staffName.toLowerCase() === currentUserName.toLowerCase()
      ) || null
    );
  }, [horizonRows, currentUserName]);

  // Scope counts for table pills
  const scopeCounts = useMemo(() => {
    let achieved = 0;
    let onTrack = 0;
    let coaching = 0;
    let mine = 0;

    horizonRows.forEach((r) => {
      if (r.attainmentBand === 'achieved') achieved += 1;
      else if (r.attainmentBand === 'on_track') onTrack += 1;
      else coaching += 1;
      if (
        currentUserName &&
        r.staffName.toLowerCase() === currentUserName.toLowerCase()
      ) {
        mine += 1;
      }
    });

    return {
      all: horizonRows.length,
      achieved,
      on_track: onTrack,
      coaching,
      mine
    };
  }, [horizonRows, currentUserName]);

  // Filtered & sorted rows for table & ExportMenu
  const displayRows = useMemo(() => {
    let list = horizonRows.filter((r) => {
      if (tableScope === 'achieved') return r.attainmentBand === 'achieved';
      if (tableScope === 'on_track') return r.attainmentBand === 'on_track';
      if (tableScope === 'coaching') return r.attainmentBand === 'coaching';
      if (tableScope === 'mine') {
        return (
          Boolean(currentUserName) &&
          r.staffName.toLowerCase() === currentUserName.toLowerCase()
        );
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.staffName.toLowerCase().includes(q) ||
          (r.period && r.period.toLowerCase().includes(q))
      );
    }

    if (sortConfig.key) {
      list = [...list].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [horizonRows, tableScope, searchQuery, sortConfig, currentUserName]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Charts & Leaderboard Data
  const dashboardAnalytics = useMemo(() => {
    const rankedByAttainment = [...horizonRows].sort((a, b) => {
      if (b.salesPct !== a.salesPct) return b.salesPct - a.salesPct;
      return b.achievementSales - a.achievementSales;
    });

    const consultantBarData = rankedByAttainment.map((r) => ({
      name: r.staffName.split(' ')[0],
      fullName: r.staffName,
      Target: r.targetSales,
      Actual: r.achievementSales
    }));

    const profitPieData = rankedByAttainment
      .filter((r) => r.achievementProfit > 0)
      .map((r, idx) => ({
        name: r.staffName.split(' ')[0],
        value: r.achievementProfit,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }));

    const marginCompareData = rankedByAttainment.map((r) => ({
      name: r.staffName.split(' ')[0],
      'Target Margin %': Number(r.targetMarginPct.toFixed(2)),
      'Realized Margin %': Number(r.marginPct.toFixed(2))
    }));

    // Full-Year Monthly Trajectory (Jan - Dec of selectedYear)
    const activeYr =
      horizonMode === 'month' ? selectedPeriod.substring(0, 4) : selectedYear;
    const monthlyTrend = MONTH_NAMES_SHORT.map((mName, idx) => {
      const pStr = `${activeYr}-${String(idx + 1).padStart(2, '0')}`;
      const rows = (salesData || []).filter((s) => s.period === pStr);
      let tSales = 0;
      let aSales = 0;
      let aProfit = 0;
      rows.forEach((s) => {
        tSales += Number(s.targetSales) || 0;
        aSales += Number(s.achievementSales) || 0;
        aProfit += Number(s.achievementProfit) || 0;
      });
      return {
        name: mName,
        period: pStr,
        'Target Sales': tSales,
        'Actual Sales': aSales,
        'Actual Profit': aProfit
      };
    });

    return {
      activeYr,
      rankedByAttainment,
      consultantBarData,
      profitPieData,
      marginCompareData,
      monthlyTrend
    };
  }, [horizonRows, horizonMode, selectedPeriod, selectedYear, salesData]);

  // Inspected Consultant Scorecard Data for SlideOverDrawer
  const inspectedScorecard = useMemo(() => {
    if (!inspectStaffName) return null;
    const currentRow =
      horizonRows.find(
        (r) => r.staffName.toLowerCase() === inspectStaffName.toLowerCase()
      ) || null;

    const historyRows = (salesData || [])
      .filter(
        (s) => s.staffName.toLowerCase() === inspectStaffName.toLowerCase()
      )
      .sort((a, b) => (a.period || '').localeCompare(b.period || ''))
      .map((h) => ({
        ...h,
        label: formatPeriodLabel(h.period),
        salesPct:
          h.targetSales > 0 ? (h.achievementSales / h.targetSales) * 100 : 0,
        marginPct:
          h.achievementSales > 0
            ? (h.achievementProfit / h.achievementSales) * 100
            : 0
      }));

    const live = getLiveStatsForStaffHorizon(
      inspectStaffName,
      horizonMode,
      selectedPeriod,
      selectedYear,
      selectedQuarter
    );

    return {
      staffName: inspectStaffName,
      currentRow,
      historyRows,
      live
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inspectStaffName,
    horizonRows,
    salesData,
    horizonMode,
    selectedPeriod,
    selectedYear,
    selectedQuarter,
    workspaceByPeriodStaff
  ]);

  const getStatusBadgeForPercent = (percent) => {
    if (percent >= 100) {
      return (
        <span className="badge badge-success font-mono">
          <span className="pulse-dot pulse-dot-green" /> {formatPercent(percent, 1)}
        </span>
      );
    }
    if (percent >= 70) {
      return (
        <span className="badge badge-warning font-mono">
          <span className="pulse-dot pulse-dot-amber" /> {formatPercent(percent, 1)}
        </span>
      );
    }
    return (
      <span className="badge badge-danger font-mono">
        {formatPercent(percent, 1)}
      </span>
    );
  };

  const selectableRowIds = useMemo(
    () =>
      horizonMode === 'month'
        ? displayRows.map((r) => r.id).filter(Boolean)
        : [],
    [horizonMode, displayRows]
  );

  const allSelected =
    selectableRowIds.length > 0 &&
    selectableRowIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableRowIds);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportRows = useMemo(
    () =>
      displayRows.map((r) => ({
        horizon: horizonMode === 'month' ? r.period : horizonLabel,
        staffName: r.staffName,
        targetSales: r.targetSales,
        achievementSales: r.achievementSales,
        salesVariance: r.salesVariance,
        salesPctFormatted: formatPercent(r.salesPct, 2),
        targetProfit: r.targetProfit,
        achievementProfit: r.achievementProfit,
        profitPctFormatted: formatPercent(r.profitPct, 2),
        marginPctFormatted: formatPercent(r.marginPct, 2),
        liveWorkspaceSales: Math.round(r.liveSales)
      })),
    [displayRows, horizonMode, horizonLabel]
  );

  const exportColumns = [
    { header: 'Period', key: 'horizon', format: null },
    { header: 'Consultant', key: 'staffName', format: null },
    { header: 'Target Sales (IDR)', key: 'targetSales', format: 'currency' },
    { header: 'Actual Sales (IDR)', key: 'achievementSales', format: 'currency' },
    { header: 'Sales Gap / Surplus (IDR)', key: 'salesVariance', format: 'currency' },
    { header: 'Sales Attainment %', key: 'salesPctFormatted', format: null },
    { header: 'Target Profit (IDR)', key: 'targetProfit', format: 'currency' },
    { header: 'Actual Profit (IDR)', key: 'achievementProfit', format: 'currency' },
    { header: 'Profit Attainment %', key: 'profitPctFormatted', format: null },
    { header: 'Realized Margin %', key: 'marginPctFormatted', format: null },
    { header: 'Live Tracked Sales (IDR)', key: 'liveWorkspaceSales', format: 'currency' }
  ];

  const chipStyle = (active) => ({
    padding: '0.28rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.74rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
    background: active
      ? isLight
        ? 'rgba(0, 168, 255, 0.14)'
        : 'rgba(56, 189, 248, 0.18)'
      : 'var(--bg-surface)',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'all 0.15s ease'
  });

  const inputBoxStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    borderRadius: '0.6rem',
    width: '100%',
    padding: '0.62rem 0.85rem',
    fontSize: '0.86rem',
    outline: 'none'
  };

  return (
    <div className="app-container fade-in">
      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={closeMobile}
      />
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            {/* Page Header */}
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
                    gap: '0.4rem',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '999px',
                    background: isLight
                      ? 'rgba(0, 168, 255, 0.1)'
                      : 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--primary)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    marginBottom: '0.45rem'
                  }}
                >
                  <Target size={13} /> QUOTA, REVENUE &amp; MARGIN INTELLIGENCE
                </div>
                <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  Sales &amp; Goals
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  Track consultant sales targets, sync live workspace revenue, and benchmark profit margins across any horizon.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  flexWrap: 'wrap'
                }}
              >
                {canAdd && horizonMode === 'month' && (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleClonePreviousMonth}
                      title={`Copy consultant quotas from ${formatPeriodLabel(
                        shiftMonthString(selectedPeriod, -1)
                      )}`}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <Copy size={15} /> Copy Prev Month
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleSyncTeamLiveActuals}
                      title="Pull live tracked sales & profit from Productivity, Tours, and Visas"
                      style={{
                        background: isLight
                          ? 'rgba(0, 168, 255, 0.1)'
                          : 'rgba(56, 189, 248, 0.14)',
                        border: '1px solid rgba(0, 168, 255, 0.3)',
                        color: 'var(--primary)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <RefreshCw size={15} /> Sync Live Actuals
                    </button>
                  </>
                )}

                {canAdd && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowImport((prev) => !prev)}
                    style={{
                      background: showImport
                        ? isLight
                          ? 'rgba(0, 168, 255, 0.12)'
                          : 'rgba(56, 189, 248, 0.16)'
                        : 'var(--bg-card)',
                      border: `1px solid ${showImport ? 'var(--primary)' : 'var(--border)'}`,
                      color: showImport ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <UploadCloud size={15} /> Import Excel / CSV
                  </button>
                )}

                <ExportMenu
                  data={exportRows}
                  columns={exportColumns}
                  filename={`TravelOps_Sales_Goals_${horizonLabel.replace(/\s+/g, '_')}`}
                />

                <button
                  type="button"
                  className="btn"
                  onClick={() => window.print()}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem'
                  }}
                >
                  <Printer size={15} /> Print
                </button>
              </div>
            </div>

            {/* Collapsible Spreadsheet Import Panel */}
            {showImport && canAdd && (
              <div
                className="card fade-in"
                style={{
                  marginBottom: '1.35rem',
                  border: '1px solid var(--primary)',
                  background: isLight
                    ? 'linear-gradient(180deg, #f5fbff 0%, #ffffff 100%)'
                    : 'rgba(14, 24, 45, 0.85)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Batch Import Sales Quotas &amp; Achievements
                    </h3>
                    <p
                      style={{
                        margin: '0.2rem 0 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Existing consultant-month records are automatically updated without creating duplicates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <CsvImportUtility
                  onImport={handleCsvImport}
                  templateHeaders={IMPORT_TEMPLATE_HEADERS}
                />
              </div>
            )}

            {/* Time Horizon & Period Selector Bar */}
            <div
              className="card"
              style={{
                padding: '0.85rem 1.1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
                flexWrap: 'wrap'
              }}
            >
              {/* View Mode Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginRight: '0.25rem'
                  }}
                >
                  Horizon:
                </span>
                {[
                  { id: 'month', label: 'Monthly' },
                  { id: 'quarter', label: 'Quarterly' },
                  { id: 'year', label: 'Full Year' },
                  { id: 'all', label: 'All Periods' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setHorizonMode(m.id);
                      setSelectedIds([]);
                    }}
                    style={chipStyle(horizonMode === m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Period Controls */}
              {horizonMode === 'month' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    title="Previous Month"
                    onClick={() =>
                      handleSelectPeriod(shiftMonthString(selectedPeriod, -1))
                    }
                    style={{
                      padding: '0.38rem 0.55rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--bg-surface)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <input
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => handleSelectPeriod(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: 0,
                        width: 'auto'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn"
                    title="Next Month"
                    onClick={() =>
                      handleSelectPeriod(shiftMonthString(selectedPeriod, 1))
                    }
                    style={{
                      padding: '0.38rem 0.55rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  {selectedPeriod !== initialMonth && (
                    <button
                      type="button"
                      onClick={() => handleSelectPeriod(initialMonth)}
                      style={chipStyle(false)}
                    >
                      This Month
                    </button>
                  )}
                </div>
              )}

              {(horizonMode === 'quarter' || horizonMode === 'year') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      style={chipStyle(selectedYear === yr)}
                    >
                      {yr}
                    </button>
                  ))}

                  {horizonMode === 'quarter' && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.3rem',
                        marginLeft: '0.35rem',
                        paddingLeft: '0.55rem',
                        borderLeft: '1px solid var(--border)'
                      }}
                    >
                      {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuarter(q)}
                          style={chipStyle(selectedQuarter === q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Personal Goal Banner for Logged-In Consultant (if present in active horizon) */}
            {myQuotaRow && (
              <div
                className="card fade-in"
                onClick={() => setInspectStaffName(myQuotaRow.staffName)}
                style={{
                  marginBottom: '1.25rem',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 168, 255, 0.32)',
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(0, 168, 255, 0.08) 0%, #ffffff 100%)'
                    : 'linear-gradient(135deg, rgba(0, 168, 255, 0.14) 0%, rgba(14, 24, 45, 0.9) 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(0, 168, 255, 0.16)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--primary)'
                      }}
                    >
                      My Goal &amp; Pace · {horizonLabel}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.1rem'
                      }}
                    >
                      {formatIdr(myQuotaRow.achievementSales)}{' '}
                      <span
                        style={{
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                          fontSize: '0.84rem'
                        }}
                      >
                        of {formatIdr(myQuotaRow.targetSales)} quota
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ minWidth: '170px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Attainment</span>
                      <strong style={{ color: 'var(--text-main)' }}>
                        {formatPercent(myQuotaRow.salesPct, 1)}
                      </strong>
                    </div>
                    <div
                      style={{
                        height: '7px',
                        borderRadius: '999px',
                        background: isLight
                          ? 'rgba(2, 132, 199, 0.12)'
                          : 'rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, myQuotaRow.salesPct))}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background:
                            myQuotaRow.salesPct >= 100
                              ? '#10b981'
                              : 'linear-gradient(90deg, #00a8ff, #38bdf8)'
                        }}
                      />
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      myQuotaRow.salesVariance >= 0
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {myQuotaRow.salesVariance >= 0
                      ? `+${formatCompactIdr(myQuotaRow.salesVariance)} Surplus`
                      : `${formatCompactIdr(Math.abs(myQuotaRow.salesVariance))} to Goal`}
                  </span>
                </div>
              </div>
            )}

            {/* Main Navigation Tabs */}
            <div
              className="tabs-container"
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <BarChart2 size={16} /> Quota Analytics &amp; Leaderboard
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                  onClick={() => setActiveTab('database')}
                >
                  <FileText size={16} /> Quota Table &amp; Input
                  <span
                    style={{
                      marginLeft: '0.35rem',
                      padding: '0.1rem 0.48rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      background:
                        activeTab === 'database'
                          ? 'rgba(0, 168, 255, 0.18)'
                          : 'var(--bg-surface)',
                      color:
                        activeTab === 'database'
                          ? 'var(--primary)'
                          : 'var(--text-muted)'
                    }}
                  >
                    {horizonRows.length}
                  </span>
                </button>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '0.4rem' }}>
                Showing: <strong style={{ color: 'var(--text-main)' }}>{horizonLabel}</strong>
              </span>
            </div>

            {/* TAB 1: QUOTA ANALYTICS & LEADERBOARD */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                {/* 5 Clickable KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '1.1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div
                    className="card"
                    onClick={() => {
                      setTableScope('all');
                      setActiveTab('database');
                    }}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '3px solid #00a8ff',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        Team Sales Quota
                      </span>
                      <Target size={18} color="#00a8ff" />
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.5rem'
                      }}
                    >
                      {formatCompactIdr(totals.targetSales)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                      }}
                    >
                      {horizonRows.length} consultant(s) in {horizonLabel}
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => {
                      setTableScope('achieved');
                      setActiveTab('database');
                    }}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '3px solid #10b981',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        Actual Sales
                      </span>
                      <TrendingUp size={18} color="#10b981" />
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#10b981',
                        marginTop: '0.5rem'
                      }}
                    >
                      {formatCompactIdr(totals.achievementSales)}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      {getStatusBadgeForPercent(totals.salesPct)}
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => {
                      setTableScope(
                        totals.salesVariance >= 0 ? 'achieved' : 'coaching'
                      );
                      setActiveTab('database');
                    }}
                    style={{
                      cursor: 'pointer',
                      borderLeft: `3px solid ${
                        totals.salesVariance >= 0 ? '#10b981' : '#f59e0b'
                      }`,
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {totals.salesVariance >= 0 ? 'Quota Surplus' : 'Remaining to Goal'}
                      </span>
                      {totals.salesVariance >= 0 ? (
                        <CheckCircle2 size={18} color="#10b981" />
                      ) : (
                        <AlertTriangle size={18} color="#f59e0b" />
                      )}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: totals.salesVariance >= 0 ? '#10b981' : '#f59e0b',
                        marginTop: '0.5rem'
                      }}
                    >
                      {totals.salesVariance >= 0
                        ? `+${formatCompactIdr(totals.salesVariance)}`
                        : formatCompactIdr(Math.abs(totals.salesVariance))}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                      }}
                    >
                      {scopeCounts.achieved} hit ≥100% · {scopeCounts.coaching} below 70%
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => {
                      setTableScope('all');
                      setActiveTab('database');
                    }}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '3px solid #6366f1',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        Actual Profit
                      </span>
                      <DollarSign size={18} color="#6366f1" />
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.5rem'
                      }}
                    >
                      {formatCompactIdr(totals.achievementProfit)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                      }}
                    >
                      Target: {formatCompactIdr(totals.targetProfit)} (
                      {formatPercent(totals.profitPct, 1)})
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{
                      borderLeft: '3px solid #38bdf8',
                      padding: '1.15rem 1.25rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}
                      >
                        Realized Margin
                      </span>
                      <PieChart size={18} color="#38bdf8" />
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        marginTop: '0.5rem'
                      }}
                    >
                      {formatPercent(totals.realizedMarginPct, 2)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                      }}
                    >
                      Target margin: {formatPercent(totals.targetMarginPct, 2)}
                    </div>
                  </div>
                </div>

                {/* Ranked Consultant Leaderboard Podium */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Award size={18} color="#f59e0b" /> Consultant Quota Leaderboard ({horizonLabel})
                    </h3>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Click any consultant card to open their full scorecard
                    </span>
                  </div>

                  {dashboardAnalytics.rankedByAttainment.length === 0 ? (
                    <div
                      style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-surface)',
                        borderRadius: '0.75rem',
                        border: '1px dashed var(--border)'
                      }}
                    >
                      No quota records found for {horizonLabel}. Switch to{' '}
                      <strong>Quota Table &amp; Input</strong> or click{' '}
                      <strong>Copy Prev Month</strong> to set up targets.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '0.9rem'
                      }}
                    >
                      {dashboardAnalytics.rankedByAttainment.slice(0, 6).map((item, idx) => {
                        const rankColors = ['#f59e0b', '#94a3b8', '#d97706'];
                        const badgeColor = rankColors[idx] || 'var(--primary)';
                        return (
                          <div
                            key={item.staffName}
                            onClick={() => setInspectStaffName(item.staffName)}
                            style={{
                              padding: '0.95rem 1.05rem',
                              borderRadius: '0.8rem',
                              background: 'var(--bg-surface)',
                              border:
                                idx === 0
                                  ? '1px solid rgba(245, 158, 11, 0.45)'
                                  : '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.45rem'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <span
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: `${badgeColor}22`,
                                    color: badgeColor,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  #{idx + 1}
                                </span>
                                <strong
                                  style={{
                                    color: 'var(--text-main)',
                                    fontSize: '0.92rem'
                                  }}
                                >
                                  {item.staffName}
                                </strong>
                              </div>
                              {getStatusBadgeForPercent(item.salesPct)}
                            </div>

                            <div
                              style={{
                                height: '6px',
                                borderRadius: '999px',
                                background: isLight
                                  ? 'rgba(2, 132, 199, 0.1)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                overflow: 'hidden',
                                marginBottom: '0.55rem'
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, item.salesPct))}%`,
                                  height: '100%',
                                  borderRadius: '999px',
                                  background:
                                    item.salesPct >= 100
                                      ? '#10b981'
                                      : item.salesPct >= 70
                                      ? '#00a8ff'
                                      : '#f59e0b'
                                }}
                              />
                            </div>

                            <div
                              className="font-mono"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.76rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              <span>
                                Sales:{' '}
                                <strong style={{ color: 'var(--text-main)' }}>
                                  {formatCompactIdr(item.achievementSales)}
                                </strong>
                              </span>
                              <span>
                                Margin:{' '}
                                <strong style={{ color: 'var(--primary)' }}>
                                  {formatPercent(item.marginPct, 1)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4 Neon Sky Blue Charts Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(390px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {/* Chart 1: Consultant Target vs Actual Sales */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <BarChart2 size={17} color="var(--primary)" /> Target vs Actual Sales by Consultant
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      {dashboardAnalytics.consultantBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dashboardAnalytics.consultantBarData}
                            margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="name"
                              stroke="var(--text-muted)"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                            />
                            <RechartsTooltip
                              content={<SalesChartTooltip isLight={isLight} />}
                            />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar
                              dataKey="Target"
                              name="Target Sales"
                              fill="#00a8ff"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="Actual"
                              name="Actual Sales"
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          No consultant quota data for {horizonLabel}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart 2: Full-Year Monthly Trajectory */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <TrendingUp size={17} color="var(--primary)" /> {dashboardAnalytics.activeYr} Monthly Sales &amp; Profit Trajectory
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardAnalytics.monthlyTrend}
                          margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                          />
                          <RechartsTooltip
                            content={<SalesChartTooltip isLight={isLight} />}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          <Bar
                            dataKey="Target Sales"
                            fill="#38bdf8"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Actual Sales"
                            fill="#0284c7"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Actual Profit"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Profit Contribution Share */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <PieChart size={17} color="var(--primary)" /> Profit Contribution Share
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      {dashboardAnalytics.profitPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={dashboardAnalytics.profitPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={96}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {dashboardAnalytics.profitPieData.map((entry, index) => (
                                <Cell key={`profit-cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              content={<SalesChartTooltip isLight={isLight} />}
                            />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          </RePieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          No profit achievements recorded for {horizonLabel}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart 4: Target vs Realized Margin % */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Sparkles size={17} color="var(--primary)" /> Target vs Realized Profit Margin (%)
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      {dashboardAnalytics.marginCompareData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dashboardAnalytics.marginCompareData}
                            margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="name"
                              stroke="var(--text-muted)"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(val) => `${val}%`}
                            />
                            <RechartsTooltip
                              content={
                                <SalesChartTooltip isLight={isLight} isPercent />
                              }
                            />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar
                              dataKey="Target Margin %"
                              fill="#6366f1"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="Realized Margin %"
                              fill="#00a8ff"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          No margin comparison data for {horizonLabel}.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUOTA TABLE & QUICK INPUT */}
            {activeTab === 'database' && (
              <div className="fade-in">
                {/* Quick Sales Quota Entry Form (Admin & Manager) */}
                {canAdd && (
                  <div className="card" style={{ marginBottom: '1.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: isFormOpen ? '1.1rem' : 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: '1.02rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            color: 'var(--text-main)'
                          }}
                        >
                          <Plus size={18} color="var(--primary)" />
                          {editingId || matchedExistingInForm
                            ? 'Update Consultant Monthly Quota'
                            : 'Assign Monthly Consultant Quota'}
                        </h2>
                        {matchedExistingInForm && (
                          <span className="badge badge-primary">
                            Loaded existing {formatPeriodLabel(formData.period)} record for{' '}
                            {matchedExistingInForm.staffName}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        {isFormOpen && formData.staffName && (
                          <button
                            type="button"
                            className="btn"
                            onClick={handleFillFormWithLiveActuals}
                            style={{
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.75rem',
                              background: 'rgba(0, 168, 255, 0.12)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(0, 168, 255, 0.25)'
                            }}
                          >
                            <RefreshCw size={13} /> Pull Live Actuals
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsFormOpen((prev) => !prev)}
                          className="btn"
                          style={{
                            padding: '0.32rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)'
                          }}
                        >
                          {isFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isFormOpen ? 'Collapse' : 'Expand Form'}
                        </button>
                      </div>
                    </div>

                    {isFormOpen && (
                      <form onSubmit={handleSubmit}>
                        {/* Preset Chips Row */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.65rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.65rem',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            marginBottom: '1rem'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                              Quick Sales Target:
                            </span>
                            {SALES_TARGET_PRESETS.map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetSales: String(p.value)
                                  }))
                                }
                                style={chipStyle(
                                  Number(formData.targetSales) === p.value
                                )}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                              Auto Target Profit Margin:
                            </span>
                            {MARGIN_TARGET_PRESETS.map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleApplyTargetMarginPct(pct)}
                                style={chipStyle(false)}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                            gap: '0.9rem',
                            alignItems: 'end'
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Target Month
                            </label>
                            <input
                              type="month"
                              value={formData.period}
                              onChange={(e) =>
                                handleFormStaffOrPeriodChange(
                                  formData.staffName,
                                  e.target.value
                                )
                              }
                              required
                              style={inputBoxStyle}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Consultant
                            </label>
                            <select
                              value={formData.staffName}
                              onChange={(e) =>
                                handleFormStaffOrPeriodChange(
                                  e.target.value,
                                  formData.period
                                )
                              }
                              required
                              style={inputBoxStyle}
                            >
                              <option value="">Select Consultant...</option>
                              {activeStaff.map((u) => (
                                <option key={u.id} value={u.name}>
                                  {u.name} ({u.role})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Target Sales (IDR)
                            </label>
                            <input
                              type="text"
                              value={
                                formData.targetSales
                                  ? formatNumberId(formData.targetSales)
                                  : ''
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  targetSales: e.target.value.replace(/[^0-9]/g, '')
                                })
                              }
                              placeholder="0"
                              style={inputBoxStyle}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Target Profit (IDR)
                            </label>
                            <input
                              type="text"
                              value={
                                formData.targetProfit
                                  ? formatNumberId(formData.targetProfit)
                                  : ''
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  targetProfit: e.target.value.replace(/[^0-9]/g, '')
                                })
                              }
                              placeholder="0"
                              style={inputBoxStyle}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Actual Sales (IDR)
                            </label>
                            <input
                              type="text"
                              value={
                                formData.achievementSales
                                  ? formatNumberId(formData.achievementSales)
                                  : ''
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  achievementSales: e.target.value.replace(
                                    /[^0-9]/g,
                                    ''
                                  )
                                })
                              }
                              placeholder="0"
                              style={inputBoxStyle}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)'
                              }}
                            >
                              Actual Profit (IDR)
                            </label>
                            <input
                              type="text"
                              value={
                                formData.achievementProfit
                                  ? formatNumberId(formData.achievementProfit)
                                  : ''
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  achievementProfit: e.target.value.replace(
                                    /[^0-9]/g,
                                    ''
                                  )
                                })
                              }
                              placeholder="0"
                              style={inputBoxStyle}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={isSubmitting}
                              style={{ flex: 2, justifyContent: 'center' }}
                            >
                              <Plus size={15} />
                              {isSubmitting
                                ? 'Saving...'
                                : editingId || matchedExistingInForm
                                ? 'Update Quota'
                                : 'Save Quota'}
                            </button>
                            <button
                              type="button"
                              onClick={handleClear}
                              className="btn"
                              style={{
                                flex: 1,
                                justifyContent: 'center',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)'
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Scope Filter Pills & Search Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All Consultants', count: scopeCounts.all },
                      {
                        id: 'achieved',
                        label: 'Achieved (≥100%)',
                        count: scopeCounts.achieved
                      },
                      {
                        id: 'on_track',
                        label: 'On Track (70–99%)',
                        count: scopeCounts.on_track
                      },
                      {
                        id: 'coaching',
                        label: 'Needs Coaching (<70%)',
                        count: scopeCounts.coaching
                      },
                      { id: 'mine', label: 'My Quota', count: scopeCounts.mine }
                    ].map((pill) => {
                      const active = tableScope === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setTableScope(pill.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.38rem',
                            padding: '0.4rem 0.78rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: active
                              ? '1px solid var(--primary)'
                              : '1px solid var(--border)',
                            background: active
                              ? isLight
                                ? 'rgba(0, 168, 255, 0.12)'
                                : 'rgba(56, 189, 248, 0.16)'
                              : 'var(--bg-card)',
                            color: active ? 'var(--primary)' : 'var(--text-main)'
                          }}
                        >
                          <span>{pill.label}</span>
                          <span
                            style={{
                              padding: '0.04rem 0.42rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              background: active
                                ? 'rgba(0, 168, 255, 0.2)'
                                : 'var(--bg-surface)',
                              color: active ? 'var(--primary)' : 'var(--text-muted)'
                            }}
                          >
                            {pill.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <Search
                        size={15}
                        style={{
                          position: 'absolute',
                          left: '0.8rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search consultant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          ...inputBoxStyle,
                          paddingLeft: '2.25rem',
                          paddingRight: searchQuery ? '2rem' : '0.8rem'
                        }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '0.6rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {selectedIds.length > 0 && canDelete && horizonMode === 'month' && (
                      <button
                        type="button"
                        className="btn"
                        onClick={handleBulkDelete}
                        style={{
                          padding: '0.48rem 0.75rem',
                          fontSize: '0.78rem',
                          background: 'rgba(239, 68, 68, 0.14)',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={14} /> Delete ({selectedIds.length})
                      </button>
                    )}

                    {(tableScope !== 'all' || searchQuery) && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setTableScope('all');
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '0.48rem 0.75rem',
                          fontSize: '0.78rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <RotateCcw size={14} /> Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Quota & Achievement Data Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      className="data-table"
                      style={{ width: '100%', minWidth: '1060px' }}
                    >
                      <thead
                        style={{
                          background: isLight
                            ? '#f1f7fe'
                            : 'rgba(14, 24, 45, 0.92)',
                          borderBottom: '1px solid var(--border)'
                        }}
                      >
                        <tr>
                          {horizonMode === 'month' && canDelete && (
                            <th style={{ width: '38px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                aria-label="Select all quota rows"
                              />
                            </th>
                          )}
                          <th>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('staffName')}
                            >
                              CONSULTANT <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('targetSales')}
                            >
                              TARGET SALES <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('achievementSales')}
                            >
                              ACTUAL SALES <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ minWidth: '175px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('salesPct')}
                            >
                              QUOTA PROGRESS &amp; GAP <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('targetProfit')}
                            >
                              TARGET PROFIT <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('achievementProfit')}
                            >
                              ACTUAL PROFIT <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('profitPct')}
                            >
                              % PROFIT <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSort('marginPct')}
                            >
                              MARGIN <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row) => {
                          const hasUnsyncedLive =
                            Math.round(row.liveSales) > 0 &&
                            Math.round(row.liveSales) !==
                              Math.round(row.achievementSales);
                          const isChecked =
                            row.id && selectedIds.includes(row.id);

                          return (
                            <tr
                              key={`${row.staffName}-${row.period || horizonMode}`}
                              onClick={() => setInspectStaffName(row.staffName)}
                              style={{
                                cursor: 'pointer',
                                background: isChecked
                                  ? isLight
                                    ? 'rgba(0, 168, 255, 0.06)'
                                    : 'rgba(56, 189, 248, 0.08)'
                                  : undefined
                              }}
                            >
                              {horizonMode === 'month' && canDelete && (
                                <td
                                  style={{ textAlign: 'center' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(isChecked)}
                                    onChange={() => toggleSelectOne(row.id)}
                                    aria-label={`Select ${row.staffName}`}
                                  />
                                </td>
                              )}
                              <td>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {row.staffName}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.73rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.15rem'
                                  }}
                                >
                                  {row.isAggregated
                                    ? `${row.recordCount} month(s) combined`
                                    : formatPeriodLabel(row.period)}
                                </div>
                              </td>
                              <td
                                className="font-mono"
                                style={{
                                  textAlign: 'right',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                {formatIdr(row.targetSales)}
                              </td>
                              <td
                                className="font-mono"
                                style={{ textAlign: 'right' }}
                              >
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {formatIdr(row.achievementSales)}
                                </div>
                                {hasUnsyncedLive && (
                                  <div
                                    style={{
                                      fontSize: '0.7rem',
                                      color: 'var(--primary)',
                                      marginTop: '0.15rem'
                                    }}
                                  >
                                    Tracked: {formatCompactIdr(row.liveSales)}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    marginBottom: '0.28rem'
                                  }}
                                >
                                  {getStatusBadgeForPercent(row.salesPct)}
                                  <span
                                    className="font-mono"
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      color:
                                        row.salesVariance >= 0
                                          ? '#10b981'
                                          : 'var(--text-muted)'
                                    }}
                                  >
                                    {row.salesVariance >= 0
                                      ? `+${formatCompactIdr(row.salesVariance)}`
                                      : `-${formatCompactIdr(
                                          Math.abs(row.salesVariance)
                                        )}`}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: '5px',
                                    borderRadius: '999px',
                                    background: isLight
                                      ? 'rgba(2, 132, 199, 0.12)'
                                      : 'rgba(255, 255, 255, 0.08)',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, row.salesPct)
                                      )}%`,
                                      height: '100%',
                                      borderRadius: '999px',
                                      background:
                                        row.salesPct >= 100
                                          ? '#10b981'
                                          : row.salesPct >= 70
                                          ? '#00a8ff'
                                          : '#f59e0b'
                                    }}
                                  />
                                </div>
                              </td>
                              <td
                                className="font-mono"
                                style={{
                                  textAlign: 'right',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                {formatIdr(row.targetProfit)}
                              </td>
                              <td
                                className="font-mono"
                                style={{
                                  textAlign: 'right',
                                  fontWeight: 700,
                                  color: '#10b981'
                                }}
                              >
                                {formatIdr(row.achievementProfit)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {getStatusBadgeForPercent(row.profitPct)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="font-mono"
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                    fontSize: '0.82rem'
                                  }}
                                >
                                  {formatPercent(row.marginPct, 1)}
                                </span>
                              </td>
                              <td
                                style={{ textAlign: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.35rem',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn"
                                    title="Open Consultant Scorecard"
                                    onClick={() =>
                                      setInspectStaffName(row.staffName)
                                    }
                                    style={{
                                      padding: '0.4rem',
                                      background: 'rgba(0, 168, 255, 0.12)',
                                      color: 'var(--primary)'
                                    }}
                                  >
                                    <Eye size={14} />
                                  </button>

                                  {canEditAny &&
                                    horizonMode === 'month' &&
                                    hasUnsyncedLive && (
                                      <button
                                        type="button"
                                        className="btn"
                                        title="Sync Live Workspace Actuals"
                                        onClick={() =>
                                          handleSyncSingleConsultant(row)
                                        }
                                        style={{
                                          padding: '0.4rem',
                                          background:
                                            'rgba(16, 185, 129, 0.14)',
                                          color: '#10b981'
                                        }}
                                      >
                                        <RefreshCw size={14} />
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    onClick={() => canEditAny && handleEdit(row)}
                                    disabled={!canEditAny}
                                    title={
                                      canEditAny
                                        ? row.isAggregated
                                          ? 'Inspect monthly records to edit'
                                          : 'Edit Quota'
                                        : 'Requires Manager or Admin role'
                                    }
                                    style={{
                                      background: 'var(--bg-surface)',
                                      color: canEditAny
                                        ? 'var(--text-main)'
                                        : 'var(--text-muted)',
                                      border: '1px solid var(--border)',
                                      padding: '0.4rem',
                                      borderRadius: '6px',
                                      cursor: canEditAny
                                        ? 'pointer'
                                        : 'not-allowed',
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {canEditAny ? (
                                      <Edit2 size={14} />
                                    ) : (
                                      <Lock size={14} />
                                    )}
                                  </button>

                                  {horizonMode === 'month' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        canDelete && handleDelete(row)
                                      }
                                      disabled={!canDelete}
                                      title={
                                        canDelete
                                          ? 'Delete Quota Record'
                                          : 'Requires Admin role'
                                      }
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#ef4444',
                                        border:
                                          '1px solid rgba(239, 68, 68, 0.22)',
                                        padding: '0.4rem',
                                        borderRadius: '6px',
                                        cursor: canDelete
                                          ? 'pointer'
                                          : 'not-allowed',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      {canDelete ? (
                                        <Trash2 size={14} />
                                      ) : (
                                        <Lock size={14} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {displayRows.length === 0 && (
                          <tr>
                            <td
                              colSpan={horizonMode === 'month' && canDelete ? 10 : 9}
                              style={{
                                textAlign: 'center',
                                padding: '2.5rem 1rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              No quota records found for {horizonLabel}.
                            </td>
                          </tr>
                        )}

                        {displayRows.length > 0 && (
                          <tr
                            style={{
                              background: isLight
                                ? '#f1f7fe'
                                : 'rgba(56, 189, 248, 0.08)',
                              fontWeight: 800,
                              borderTop: '2px solid var(--border)'
                            }}
                          >
                            {horizonMode === 'month' && canDelete && <td />}
                            <td style={{ color: 'var(--primary)', fontWeight: 800 }}>
                              TEAM TOTAL ({displayRows.length})
                            </td>
                            <td
                              className="font-mono"
                              style={{
                                textAlign: 'right',
                                color: 'var(--text-main)'
                              }}
                            >
                              {formatIdr(totals.targetSales)}
                            </td>
                            <td
                              className="font-mono"
                              style={{
                                textAlign: 'right',
                                color: 'var(--text-main)'
                              }}
                            >
                              {formatIdr(totals.achievementSales)}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}
                              >
                                {getStatusBadgeForPercent(totals.salesPct)}
                                <span
                                  className="font-mono"
                                  style={{
                                    fontSize: '0.74rem',
                                    color:
                                      totals.salesVariance >= 0
                                        ? '#10b981'
                                        : '#f59e0b'
                                  }}
                                >
                                  {totals.salesVariance >= 0
                                    ? `+${formatCompactIdr(totals.salesVariance)}`
                                    : `-${formatCompactIdr(
                                        Math.abs(totals.salesVariance)
                                      )}`}
                                </span>
                              </div>
                            </td>
                            <td
                              className="font-mono"
                              style={{
                                textAlign: 'right',
                                color: 'var(--text-main)'
                              }}
                            >
                              {formatIdr(totals.targetProfit)}
                            </td>
                            <td
                              className="font-mono"
                              style={{
                                textAlign: 'right',
                                color: '#10b981'
                              }}
                            >
                              {formatIdr(totals.achievementProfit)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {getStatusBadgeForPercent(totals.profitPct)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className="font-mono"
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--primary)'
                                }}
                              >
                                {formatPercent(totals.realizedMarginPct, 1)}
                              </span>
                            </td>
                            <td />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLIDE-OVER CONSULTANT QUOTA SCORECARD DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(inspectedScorecard)}
        onClose={() => setInspectStaffName(null)}
        title={
          inspectedScorecard
            ? `${inspectedScorecard.staffName} — Quota Scorecard`
            : 'Consultant Scorecard'
        }
        subtitle={`Horizon: ${horizonLabel}`}
        width="560px"
        footer={
          inspectedScorecard &&
          canEditAny &&
          horizonMode === 'month' &&
          inspectedScorecard.currentRow && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() =>
                  handleSyncSingleConsultant(inspectedScorecard.currentRow)
                }
                style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <RefreshCw size={14} /> Apply Live Actuals
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = inspectedScorecard.currentRow;
                  setInspectStaffName(null);
                  handleEdit(target);
                }}
              >
                <Edit2 size={14} /> Edit Monthly Quota
              </button>
            </div>
          )
        }
      >
        {inspectedScorecard && (
          <div
            style={{
              padding: '1.35rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem'
            }}
          >
            {/* Current Horizon Attainment Card */}
            {inspectedScorecard.currentRow ? (
              <div
                style={{
                  padding: '1.05rem',
                  borderRadius: '0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--primary)'
                    }}
                  >
                    Sales &amp; Profit Attainment ({horizonLabel})
                  </span>
                  {getStatusBadgeForPercent(
                    inspectedScorecard.currentRow.salesPct
                  )}
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Sales</span>
                    <span className="font-mono" style={{ color: 'var(--text-main)' }}>
                      <strong>
                        {formatIdr(inspectedScorecard.currentRow.achievementSales)}
                      </strong>{' '}
                      / {formatIdr(inspectedScorecard.currentRow.targetSales)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: isLight
                        ? 'rgba(2, 132, 199, 0.12)'
                        : 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, inspectedScorecard.currentRow.salesPct)
                        )}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background:
                          inspectedScorecard.currentRow.salesPct >= 100
                            ? '#10b981'
                            : '#00a8ff'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                    <span className="font-mono" style={{ color: 'var(--text-main)' }}>
                      <strong>
                        {formatIdr(inspectedScorecard.currentRow.achievementProfit)}
                      </strong>{' '}
                      / {formatIdr(inspectedScorecard.currentRow.targetProfit)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: isLight
                        ? 'rgba(2, 132, 199, 0.12)'
                        : 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, inspectedScorecard.currentRow.profitPct)
                        )}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: '#10b981'
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Sales Gap / Surplus
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color:
                          inspectedScorecard.currentRow.salesVariance >= 0
                            ? '#10b981'
                            : '#f59e0b',
                        marginTop: '0.15rem'
                      }}
                    >
                      {inspectedScorecard.currentRow.salesVariance >= 0
                        ? `+${formatIdr(inspectedScorecard.currentRow.salesVariance)}`
                        : formatIdr(inspectedScorecard.currentRow.salesVariance)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Realized vs Target Margin
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: 'var(--primary)',
                        marginTop: '0.15rem'
                      }}
                    >
                      {formatPercent(inspectedScorecard.currentRow.marginPct, 2)}{' '}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        (Target{' '}
                        {formatPercent(
                          inspectedScorecard.currentRow.targetMarginPct,
                          1
                        )}
                        )
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem'
                }}
              >
                No quota assigned in {horizonLabel} for this consultant.
              </div>
            )}

            {/* Live Workspace Activity Breakdown */}
            <div
              style={{
                padding: '1.05rem',
                borderRadius: '0.85rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem'
                }}
              >
                Live Tracked Workspace Activity ({horizonLabel})
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.7rem'
                }}
              >
                <div
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.65rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Daily Productivity ({inspectedScorecard.live.productivityCount})
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      marginTop: '0.2rem'
                    }}
                  >
                    {formatCompactIdr(inspectedScorecard.live.productivitySales)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                    Profit: {formatCompactIdr(inspectedScorecard.live.productivityProfit)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.65rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Tours &amp; Trips ({inspectedScorecard.live.tourCount})
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      marginTop: '0.2rem'
                    }}
                  >
                    {formatCompactIdr(inspectedScorecard.live.tourSales)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                    Profit: {formatCompactIdr(inspectedScorecard.live.tourProfit)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.65rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Visas &amp; Documents ({inspectedScorecard.live.docCount})
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      marginTop: '0.2rem'
                    }}
                  >
                    {formatCompactIdr(inspectedScorecard.live.docSales)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.65rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Cruises &amp; Hotels Handled
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      marginTop: '0.2rem'
                    }}
                  >
                    {inspectedScorecard.live.cruiseCount} Cruises ·{' '}
                    {inspectedScorecard.live.hotelCount} Hotels
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Monthly Quota Trajectory */}
            <div
              style={{
                padding: '1.05rem',
                borderRadius: '0.85rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem'
                }}
              >
                Historical Monthly Quota Records ({inspectedScorecard.historyRows.length})
              </div>

              {inspectedScorecard.historyRows.length > 0 ? (
                <>
                  <div style={{ height: '170px', width: '100%', marginBottom: '0.85rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={inspectedScorecard.historyRows}
                        margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="label"
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                        />
                        <RechartsTooltip
                          content={<SalesChartTooltip isLight={isLight} />}
                        />
                        <Bar
                          dataKey="targetSales"
                          name="Target"
                          fill="#00a8ff"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="achievementSales"
                          name="Actual"
                          fill="#10b981"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {[...inspectedScorecard.historyRows].reverse().map((h) => (
                      <div
                        key={h.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.6rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            {h.label}
                          </strong>
                          <div
                            className="font-mono"
                            style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}
                          >
                            {formatCompactIdr(h.achievementSales)} /{' '}
                            {formatCompactIdr(h.targetSales)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {getStatusBadgeForPercent(h.salesPct)}
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setHorizonMode('month');
                              handleSelectPeriod(h.period);
                              setInspectStaffName(null);
                              if (canEditAny) {
                                handleEdit(h);
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.72rem',
                              background: 'rgba(0, 168, 255, 0.12)',
                              color: 'var(--primary)'
                            }}
                          >
                            {canEditAny ? 'Edit' : 'Open'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No historical monthly records yet.
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default SalesInput;
