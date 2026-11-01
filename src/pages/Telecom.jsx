import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import { useTelecoms } from '../context/TelecomContext';
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
  User,
  Phone,
  Package,
  CreditCard,
  Building,
  BarChart2,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  Wifi,
  Smartphone,
  Globe,
  Calendar,
  Search,
  UploadCloud,
  Copy,
  RotateCcw,
  MessageCircle,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

const PRODUCT_TYPES = [
  'eSIM',
  'Travel SIM Card',
  'Pocket WiFi / Modem',
  'Roaming Data Pass'
];

const POPULAR_REGIONS = [
  'Japan',
  'South Korea',
  'Singapore & Malaysia',
  'China / HK / Macau',
  'Europe / Schengen',
  'USA & Canada',
  'Australia & NZ',
  'Thailand',
  'Taiwan',
  'Global Multi-Country'
];

const POPULAR_BANKS = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'CIMB Niaga',
  'Permata',
  'Bank Jago',
  'SeaBank'
];

const DEPOSIT_PRESETS = [0, 300000, 500000, 750000, 1000000];
const DURATION_PRESETS = [3, 5, 7, 10, 14, 15, 30];

const COUNTRIES = [
  'Global Multi-Country',
  'Europe / Schengen',
  'Southeast Asia (ASEAN)',
  'China / HK / Macau',
  'Singapore & Malaysia',
  'USA & Canada',
  'Australia & NZ',
  'Middle East',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Belgium', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria',
  'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Fiji', 'Finland', 'France',
  'Georgia', 'Germany', 'Greece', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau',
  'Madagascar', 'Malaysia', 'Maldives', 'Malta', 'Mauritius', 'Mexico', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Myanmar',
  'Nepal', 'Netherlands', 'New Zealand', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Seychelles', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Tunisia', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vietnam'
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['#00a8ff', '#38bdf8', '#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

const IMPORT_TEMPLATE_HEADERS = [
  'Traveler Name',
  'Phone / WhatsApp',
  'Product Type',
  'Coverage Region',
  'Start Date',
  'End Date',
  'Est. Pickup Date',
  'Pickup Date',
  'Return Date',
  'Deposit Status',
  'Deposit Amount',
  'Bank',
  'Account Number',
  'Account Holder',
  'Staff'
];

const parseLocalDay = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const parsed = new Date(`${clean}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDaysToDateStr = (dateStr, days) => {
  const base = parseLocalDay(dateStr) || new Date();
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toDateInputStr(next);
};

const formatDisplayDate = (dateStr, includeYear = true) => {
  const d = parseLocalDay(dateStr);
  if (!d) return dateStr || '-';
  return d.toLocaleDateString(
    'en-GB',
    includeYear
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: 'short' }
  );
};

const getDayDiffFromToday = (dateStr) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const getRoamingDaysCount = (startStr, endStr) => {
  const s = parseLocalDay(startStr);
  const e = parseLocalDay(endStr);
  if (!s || !e || e < s) return null;
  return Math.round((e - s) / 86400000) + 1;
};

const formatIdr = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);

const normalizeWhatsAppDigits = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }
  return digits;
};

const checkRequiresPhysicalReturn = (typeProduct, jumlahDeposit, depositStatus) => {
  const lower = String(typeProduct || '').toLowerCase();
  const isHardware =
    lower.includes('wifi') ||
    lower.includes('modem') ||
    lower.includes('router') ||
    lower.includes('mifi') ||
    lower.includes('pocket');
  const hasDeposit =
    Number(jumlahDeposit) > 0 || depositStatus === 'Sudah';
  return isHardware || hasDeposit;
};

const getLifecycleMeta = (lifecycle, isLight) => {
  if (lifecycle === 'Completed') {
    return {
      label: 'Completed',
      badgeClass: 'badge-success',
      customStyle: null
    };
  }
  if (lifecycle === 'Overdue Return') {
    return {
      label: 'Overdue Return',
      badgeClass: 'badge-danger',
      customStyle: null
    };
  }
  if (lifecycle === 'Return Due') {
    return {
      label: 'Return Due',
      badgeClass: 'badge-warning',
      customStyle: null
    };
  }
  if (lifecycle === 'Active Roaming') {
    return {
      label: 'Active Roaming',
      badgeClass: 'badge-primary',
      customStyle: isLight
        ? {
            background: 'rgba(0, 168, 255, 0.14)',
            color: '#0284c7',
            border: '1px solid rgba(2, 132, 199, 0.28)'
          }
        : null
    };
  }
  if (lifecycle === 'Handed Over') {
    return {
      label: 'Handed Over',
      badgeClass: 'badge-primary',
      customStyle: {
        background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
        color: isLight ? '#047857' : '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }
    };
  }
  return {
    label: 'Upcoming',
    badgeClass: 'badge-warning',
    customStyle: {
      background: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.18)',
      color: isLight ? '#4338ca' : '#a5b4fc',
      border: '1px solid rgba(99, 102, 241, 0.28)'
    }
  };
};

const getDepositMeta = (status, amount, isLight) => {
  const num = Number(amount) || 0;
  if (status === 'Refunded') {
    return {
      label: 'Refunded',
      badgeClass: 'badge-success',
      customStyle: null
    };
  }
  if (status === 'Sudah') {
    return {
      label: 'Deposit Held',
      badgeClass: 'badge-warning',
      customStyle: null
    };
  }
  if (status === 'Belum' && num > 0) {
    return {
      label: 'Pending Deposit',
      badgeClass: 'badge-danger',
      customStyle: null
    };
  }
  return {
    label: 'No Deposit',
    badgeClass: 'badge-neutral',
    customStyle: {
      background: isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.14)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)'
    }
  };
};

const getTelecomStepperStage = (item) => {
  if (item.lifecycleStatus === 'Completed') return 3;
  if (
    item.lifecycleStatus === 'Active Roaming' ||
    item.lifecycleStatus === 'Return Due' ||
    item.lifecycleStatus === 'Overdue Return'
  ) {
    return 2;
  }
  if (item.tanggalPengambilan || item.lifecycleStatus === 'Handed Over') return 1;
  return 0;
};

const TelecomChartTooltip = ({ active, payload, label, isLight }) => {
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
            marginTop: '0.15rem'
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
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

const Telecom = () => {
  const {
    telecoms,
    addTelecom,
    updateTelecom,
    deleteTelecom,
    bulkUpdateTelecomWorkflow,
    bulkDeleteTelecoms,
    bulkImportTelecoms
  } = useTelecoms();
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();

  const isLight = theme === 'light';
  const currentUserName = user?.name || '';
  const currentUserRole = user?.role || '';

  const activeStaff = useMemo(
    () => (users || []).filter((u) => u.status === 'Active'),
    [users]
  );

  const defaultStaffName = useMemo(() => {
    if (currentUserName && activeStaff.some((u) => u.name === currentUserName)) {
      return currentUserName;
    }
    return currentUserName || '';
  }, [currentUserName, activeStaff]);

  const isAdmin = currentUserRole === 'Admin';
  const isManager = currentUserRole === 'Manager';
  const isStaff = currentUserRole === 'Staff';
  const canDelete = isAdmin;
  const canEditRecord = (recordStaff) =>
    isAdmin || isManager || (isStaff && recordStaff === currentUserName);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState(() =>
    location.state?.openTab === 'database' ? 'database' : 'dashboard'
  );
  const [showImport, setShowImport] = useState(false);
  const [selectedYear, setSelectedYear] = useState('All');

  // Table scope & bulk selection
  const [tableScope, setTableScope] = useState('all'); // 'all' | 'upcoming' | 'active' | 'return_due' | 'deposit_held' | 'completed' | 'mine'
  const [selectedIds, setSelectedIds] = useState([]);

  // Booking / Edit Modal & Drawer States
  const [isModalOpen, setIsModalOpen] = useState(() => Boolean(location.state?.openNew));
  const [editingTel, setEditingTel] = useState(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewTelId, setPreviewTelId] = useState(null);

  // Region dropdown state
  const [countrySearch, setCountrySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const buildEmptyForm = (prefillStart = '') => {
    const startStr = prefillStart || toDateInputStr(new Date());
    return {
      nama: '',
      noTelephone: '',
      typeProduct: 'eSIM',
      region: '',
      tanggalMulai: startStr,
      tanggalSelesai: addDaysToDateStr(startStr, 6),
      estimasiPengambilan: '',
      tanggalPengambilan: '',
      tanggalPengembalian: '',
      depositStatus: 'None',
      jumlahDeposit: '',
      bank: '',
      noRekening: '',
      namaRekening: '',
      staff: defaultStaffName
    };
  };

  const [formData, setFormData] = useState(() =>
    buildEmptyForm(location.state?.prefillDate || '')
  );

  // Quick Handover / Return & Deposit Settlement Modal
  const [quickSettlementTel, setQuickSettlementTel] = useState(null);
  const [settlementMode, setSettlementMode] = useState('return'); // 'pickup' | 'return'
  const [settlementData, setSettlementData] = useState({
    actionDate: toDateInputStr(new Date()),
    depositStatus: 'Refunded'
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Enrich records with accurate local-date Roaming & Device Lifecycle
  const enrichedTelecoms = useMemo(() => {
    return telecoms.map((t) => {
      const normalizedProduct = (t.typeProduct || '').trim() || 'Travel SIM / WiFi';
      const depositAmt = Number(t.jumlahDeposit) || 0;
      const requiresReturn = checkRequiresPhysicalReturn(
        normalizedProduct,
        depositAmt,
        t.depositStatus
      );

      const diffStart = getDayDiffFromToday(t.tanggalMulai);
      const diffEnd = getDayDiffFromToday(t.tanggalSelesai);
      const pickupTargetStr = t.estimasiPengambilan || t.tanggalMulai;
      const diffPickup = getDayDiffFromToday(pickupTargetStr);
      const roamingDays = getRoamingDaysCount(t.tanggalMulai, t.tanggalSelesai);

      let lifecycleStatus;
      if (t.tanggalPengembalian) {
        lifecycleStatus = 'Completed';
      } else if (!requiresReturn && diffEnd !== null && diffEnd < 0) {
        lifecycleStatus = 'Completed';
      } else if (requiresReturn && diffEnd !== null && diffEnd < 0) {
        lifecycleStatus = 'Overdue Return';
      } else if (requiresReturn && diffEnd === 0) {
        lifecycleStatus = 'Return Due';
      } else if (diffStart !== null && diffStart > 0) {
        lifecycleStatus = t.tanggalPengambilan ? 'Handed Over' : 'Upcoming';
      } else {
        lifecycleStatus = 'Active Roaming';
      }

      const isCompleted = lifecycleStatus === 'Completed';
      const isActiveOrHanded =
        lifecycleStatus === 'Active Roaming' ||
        lifecycleStatus === 'Handed Over' ||
        lifecycleStatus === 'Return Due';
      const isReturnDueOrOverdue =
        lifecycleStatus === 'Overdue Return' || lifecycleStatus === 'Return Due';
      const isUpcomingPickup =
        !isCompleted &&
        !t.tanggalPengambilan &&
        diffPickup !== null &&
        diffPickup >= -1 &&
        diffPickup <= 14;
      const isUpcomingPickup7d =
        !isCompleted &&
        !t.tanggalPengambilan &&
        diffPickup !== null &&
        diffPickup >= -1 &&
        diffPickup <= 7;
      const isDepositHeld = t.depositStatus === 'Sudah';
      const needsDepositRefund =
        isDepositHeld &&
        (Boolean(t.tanggalPengembalian) || (diffEnd !== null && diffEnd <= 0));

      const startYear =
        t.tanggalMulai && /^\d{4}/.test(t.tanggalMulai)
          ? t.tanggalMulai.substring(0, 4)
          : '';

      return {
        ...t,
        typeProduct: normalizedProduct,
        jumlahDeposit: depositAmt,
        requiresReturn,
        diffStart,
        diffEnd,
        diffPickup,
        roamingDays,
        lifecycleStatus,
        isCompleted,
        isActiveOrHanded,
        isReturnDueOrOverdue,
        isUpcomingPickup,
        isUpcomingPickup7d,
        isDepositHeld,
        needsDepositRefund,
        startYear
      };
    });
  }, [telecoms]);

  const previewTelecom = useMemo(
    () => enrichedTelecoms.find((t) => t.id === previewTelId) || null,
    [enrichedTelecoms, previewTelId]
  );

  const availableYears = useMemo(() => {
    const set = new Set();
    enrichedTelecoms.forEach((t) => {
      if (t.startYear) set.add(t.startYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [enrichedTelecoms]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [countrySearch]);

  const handleOpenModal = (tel = null) => {
    setIsDuplicateMode(false);
    setShowDropdown(false);
    if (tel) {
      setEditingTel(tel);
      setFormData({
        nama: tel.nama || '',
        noTelephone: tel.noTelephone || '',
        typeProduct: tel.typeProduct || 'eSIM',
        region: tel.region || '',
        tanggalMulai: tel.tanggalMulai || '',
        tanggalSelesai: tel.tanggalSelesai || '',
        estimasiPengambilan: tel.estimasiPengambilan || '',
        tanggalPengambilan: tel.tanggalPengambilan || '',
        tanggalPengembalian: tel.tanggalPengembalian || '',
        depositStatus:
          tel.depositStatus || (Number(tel.jumlahDeposit) > 0 ? 'Belum' : 'None'),
        jumlahDeposit: tel.jumlahDeposit ? String(tel.jumlahDeposit) : '',
        bank: tel.bank || '',
        noRekening: tel.noRekening || '',
        namaRekening: tel.namaRekening || '',
        staff: tel.staff || defaultStaffName
      });
      setCountrySearch(tel.region || '');
    } else {
      setEditingTel(null);
      const fresh = buildEmptyForm('');
      setFormData(fresh);
      setCountrySearch('');
    }
    setIsModalOpen(true);
  };

  const handleDuplicateTelecom = (tel) => {
    if (!tel) return;
    setEditingTel(null);
    setIsDuplicateMode(true);
    setShowDropdown(false);
    setFormData({
      nama: '',
      noTelephone: tel.noTelephone || '',
      typeProduct: tel.typeProduct || 'eSIM',
      region: tel.region || '',
      tanggalMulai: tel.tanggalMulai || toDateInputStr(new Date()),
      tanggalSelesai: tel.tanggalSelesai || '',
      estimasiPengambilan: tel.estimasiPengambilan || '',
      tanggalPengambilan: '',
      tanggalPengembalian: '',
      depositStatus:
        tel.depositStatus === 'Refunded'
          ? Number(tel.jumlahDeposit) > 0
            ? 'Belum'
            : 'None'
          : tel.depositStatus || 'None',
      jumlahDeposit: tel.jumlahDeposit ? String(tel.jumlahDeposit) : '',
      bank: tel.bank || '',
      noRekening: tel.noRekening || '',
      namaRekening: tel.namaRekening || '',
      staff: defaultStaffName || tel.staff || ''
    });
    setCountrySearch(tel.region || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTel(null);
    setIsDuplicateMode(false);
    setShowDropdown(false);
  };

  const handleSelectProductChip = (prod) => {
    setFormData((prev) => {
      const isWifi = prod.toLowerCase().includes('wifi');
      const next = { ...prev, typeProduct: prod };
      if (!editingTel) {
        if (isWifi && (!prev.jumlahDeposit || Number(prev.jumlahDeposit) === 0)) {
          next.jumlahDeposit = '500000';
          next.depositStatus = prev.depositStatus === 'None' ? 'Sudah' : prev.depositStatus;
        } else if (!isWifi && prev.jumlahDeposit === '500000' && prev.depositStatus !== 'Refunded') {
          next.jumlahDeposit = '';
          next.depositStatus = 'None';
        }
      }
      return next;
    });
  };

  const handleCountrySelect = (country) => {
    setCountrySearch(country);
    setFormData((prev) => ({ ...prev, region: country }));
    setShowDropdown(false);
  };

  const handleApplyDuration = (days) => {
    const startBase = formData.tanggalMulai || toDateInputStr(new Date());
    setFormData((prev) => ({
      ...prev,
      tanggalMulai: startBase,
      tanggalSelesai: addDaysToDateStr(startBase, Math.max(0, days - 1))
    }));
  };

  const handleApplyPickupOffset = (offsetDays) => {
    if (!formData.tanggalMulai) return;
    setFormData((prev) => ({
      ...prev,
      estimasiPengambilan: addDaysToDateStr(prev.tanggalMulai, offsetDays)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.warning('Please enter the Traveler Name.');
      return;
    }
    if (!formData.region.trim()) {
      toast.warning('Please select or enter a Coverage Region / Country.');
      return;
    }
    if (!formData.tanggalMulai) {
      toast.warning('Please select a Roaming Start Date.');
      return;
    }
    if (
      formData.tanggalMulai &&
      formData.tanggalSelesai &&
      formData.tanggalSelesai < formData.tanggalMulai
    ) {
      toast.error('Roaming End Date cannot be earlier than Start Date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const depAmount = Number(formData.jumlahDeposit) || 0;
      const cleanDepStatus =
        depAmount === 0 && formData.depositStatus === 'Belum'
          ? 'None'
          : formData.depositStatus || (depAmount > 0 ? 'Belum' : 'None');

      const payload = {
        ...formData,
        nama: formData.nama.trim(),
        noTelephone: formData.noTelephone.trim(),
        typeProduct: (formData.typeProduct || 'eSIM').trim(),
        region: formData.region.trim(),
        jumlahDeposit: depAmount,
        depositStatus: cleanDepStatus,
        staff: formData.staff || defaultStaffName
      };

      if (editingTel) {
        await updateTelecom(editingTel.id, payload);
        toast.success(`Updated ${payload.typeProduct} order for ${payload.nama}.`);
      } else {
        await addTelecom(payload);
        toast.success(`Added ${payload.typeProduct} order for ${payload.nama}.`);
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err?.message || 'Failed to save Travel SIM / WiFi record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tel) => {
    if (
      !window.confirm(
        `Delete ${tel.typeProduct || 'Travel SIM / WiFi'} order for "${tel.nama}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteTelecom(tel.id);
      if (previewTelId === tel.id) setPreviewTelId(null);
      setSelectedIds((prev) => prev.filter((item) => item !== tel.id));
      toast.success(`Deleted record for "${tel.nama}".`);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete record.');
    }
  };

  const handleOpenQuickSettlement = (tel, mode = 'return') => {
    setQuickSettlementTel(tel);
    setSettlementMode(mode);
    setSettlementData({
      actionDate:
        mode === 'pickup'
          ? tel.tanggalPengambilan || toDateInputStr(new Date())
          : tel.tanggalPengembalian || toDateInputStr(new Date()),
      depositStatus:
        tel.depositStatus === 'Sudah'
          ? mode === 'return'
            ? 'Refunded'
            : 'Sudah'
          : tel.depositStatus || 'None'
    });
  };

  const handleQuickSettlementSubmit = async (e) => {
    e.preventDefault();
    if (!quickSettlementTel) return;
    try {
      if (settlementMode === 'pickup') {
        await updateTelecom(quickSettlementTel.id, {
          tanggalPengambilan: settlementData.actionDate,
          depositStatus: settlementData.depositStatus
        });
        toast.success(`Recorded handover / dispatch for ${quickSettlementTel.nama}.`);
      } else {
        await updateTelecom(quickSettlementTel.id, {
          tanggalPengambilan:
            quickSettlementTel.tanggalPengambilan ||
            quickSettlementTel.tanggalMulai ||
            settlementData.actionDate,
          tanggalPengembalian: settlementData.actionDate,
          depositStatus: settlementData.depositStatus
        });
        toast.success(`Confirmed completion & deposit status for ${quickSettlementTel.nama}.`);
      }
      setQuickSettlementTel(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update status.');
    }
  };

  const handleQuickRefundOnly = async (tel) => {
    try {
      await updateTelecom(tel.id, {
        depositStatus: 'Refunded'
      });
      toast.success(`Marked deposit as Refunded for ${tel.nama}.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update deposit refund status.');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateTelecomWorkflow(selectedIds, action);
      const labelMap = {
        pickup: 'Handed Over / Dispatched',
        return: 'Returned / Completed',
        deposit_refunded: 'Deposit Refunded',
        deposit_held: 'Deposit Held'
      };
      toast.success(
        `Updated ${selectedIds.length} order(s) to ${labelMap[action] || 'updated status'}.`
      );
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.length} selected Travel SIM / WiFi record(s)?`
      )
    ) {
      return;
    }
    try {
      await bulkDeleteTelecoms(selectedIds);
      if (previewTelId && selectedIds.includes(previewTelId)) {
        setPreviewTelId(null);
      }
      toast.success(`Deleted ${selectedIds.length} record(s).`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk delete failed.');
    }
  };

  const handleCsvImport = async (rows) => {
    try {
      const count = await bulkImportTelecoms(rows, defaultStaffName);
      toast.success(`Imported ${count} Travel SIM / WiFi record(s) successfully!`);
      setShowImport(false);
      setActiveTab('database');
    } catch (err) {
      toast.error(err?.message || 'Failed to import spreadsheet.');
    }
  };

  const handleCopyText = async (text, label = 'Copied to clipboard') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const handleCopyBankSummary = (tel) => {
    const parts = [
      tel.bank ? `Bank: ${tel.bank}` : null,
      tel.noRekening ? `Account: ${tel.noRekening}` : null,
      tel.namaRekening ? `Holder: ${tel.namaRekening}` : null,
      tel.jumlahDeposit ? `Refund Amount: ${formatIdr(tel.jumlahDeposit)}` : null
    ].filter(Boolean);
    if (parts.length === 0) return;
    handleCopyText(parts.join(' | '), `Copied refund bank details for ${tel.nama}`);
  };

  const handleSendPickupWhatsApp = (tel) => {
    const traveler = tel.nama || 'Valued Traveler';
    const prod = tel.typeProduct || 'Travel SIM / Pocket WiFi';
    const isEsim = prod.toLowerCase().includes('esim');
    const period = [
      formatDisplayDate(tel.tanggalMulai, true),
      tel.tanggalSelesai ? `to ${formatDisplayDate(tel.tanggalSelesai, true)}` : null
    ]
      .filter(Boolean)
      .join(' ');
    const pickupNote = tel.tanggalPengambilan
      ? `\n- Handover / Sent Date: ${formatDisplayDate(tel.tanggalPengambilan, true)}`
      : tel.estimasiPengambilan
      ? `\n- Scheduled Handover: ${formatDisplayDate(tel.estimasiPengambilan, true)}`
      : '';
    const depositLine =
      Number(tel.jumlahDeposit) > 0
        ? `\n- Security Deposit: ${formatIdr(tel.jumlahDeposit)} (${
            tel.depositStatus === 'Sudah'
              ? 'Received'
              : tel.depositStatus === 'Refunded'
              ? 'Refunded'
              : 'Pending'
          })`
        : '';
    const tip = isEsim
      ? 'Tip: Install your eSIM QR code while connected to Wi-Fi before departure, and turn on Data Roaming upon landing.'
      : 'Please check your SIM / Pocket WiFi kit upon receipt and turn on Data Roaming once you arrive at your destination.';

    const message = `Hello ${traveler},\n\nHere are your *${prod}* roaming details for *${tel.region || 'your trip'}*:\n- Coverage: ${tel.region || '-'}\n- Roaming Period: ${period}${pickupNote}${depositLine}\n\n${tip}\n\nSafe travels,\nTravelOps Team`;

    const digits = normalizeWhatsAppDigits(tel.noTelephone);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendReturnRefundWhatsApp = (tel) => {
    const traveler = tel.nama || 'Valued Traveler';
    const prod = tel.typeProduct || 'Pocket WiFi / Travel SIM';
    let message;

    if (tel.depositStatus === 'Refunded') {
      const bankNote = tel.bank
        ? ` to your *${tel.bank}* account (${tel.noRekening || '-'} a/n ${tel.namaRekening || traveler})`
        : '';
      message = `Hello ${traveler},\n\nThank you for returning the *${prod}* (${tel.region || '-'})! Your security deposit of *${formatIdr(tel.jumlahDeposit)}* has been refunded${bankNote}.\n\nWe look forward to assisting your next journey!\nTravelOps Team`;
    } else if (tel.tanggalPengembalian && tel.depositStatus === 'Sudah') {
      const bankNote = tel.bank
        ? ` to ${tel.bank} ${tel.noRekening || ''} (${tel.namaRekening || traveler})`
        : '';
      message = `Hello ${traveler},\n\nWe have received your returned *${prod}* on ${formatDisplayDate(tel.tanggalPengembalian, true)}. Your security deposit refund of *${formatIdr(tel.jumlahDeposit)}*${bankNote} is currently being processed by our finance team.\n\nThank you,\nTravelOps Team`;
    } else {
      const endFormatted = tel.tanggalSelesai
        ? formatDisplayDate(tel.tanggalSelesai, true)
        : 'your trip end date';
      const refundNote =
        Number(tel.jumlahDeposit) > 0
          ? ` Once received and checked, we will process your *${formatIdr(tel.jumlahDeposit)}* security deposit refund right away.`
          : '';
      message = `Hello ${traveler},\n\nWelcome back from *${tel.region || 'your trip'}*! This is a friendly reminder regarding the return of your *${prod}* kit (roaming period ended ${endFormatted}).${refundNote}\n\nPlease let us know your preferred courier or drop-off schedule.\n\nBest regards,\nTravelOps Team`;
    }

    const digits = normalizeWhatsAppDigits(tel.noTelephone);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Scope counts for All Orders pills
  const scopeCounts = useMemo(() => {
    let upcoming = 0;
    let active = 0;
    let returnDue = 0;
    let depositHeld = 0;
    let completed = 0;
    let mine = 0;

    enrichedTelecoms.forEach((t) => {
      if (t.lifecycleStatus === 'Upcoming' || t.isUpcomingPickup7d) upcoming += 1;
      if (t.lifecycleStatus === 'Active Roaming' || t.lifecycleStatus === 'Handed Over') {
        active += 1;
      }
      if (t.isReturnDueOrOverdue) returnDue += 1;
      if (t.isDepositHeld) depositHeld += 1;
      if (t.isCompleted) completed += 1;
      if (currentUserName && t.staff === currentUserName) mine += 1;
    });

    return {
      all: enrichedTelecoms.length,
      upcoming,
      active,
      return_due: returnDue,
      deposit_held: depositHeld,
      completed,
      mine
    };
  }, [enrichedTelecoms, currentUserName]);

  const scopedTelecoms = useMemo(() => {
    return enrichedTelecoms.filter((t) => {
      if (tableScope === 'upcoming') {
        return t.lifecycleStatus === 'Upcoming' || t.isUpcomingPickup7d;
      }
      if (tableScope === 'active') {
        return (
          t.lifecycleStatus === 'Active Roaming' || t.lifecycleStatus === 'Handed Over'
        );
      }
      if (tableScope === 'return_due') return t.isReturnDueOrOverdue;
      if (tableScope === 'deposit_held') return t.isDepositHeld;
      if (tableScope === 'completed') return t.isCompleted;
      if (tableScope === 'mine') return Boolean(currentUserName) && t.staff === currentUserName;
      return true;
    });
  }, [enrichedTelecoms, tableScope, currentUserName]);

  const {
    sortConfig,
    filters,
    globalSearch,
    handleSort,
    handleFilterChange,
    handleGlobalSearch,
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    itemsPerPage
  } = useDataTable(scopedTelecoms, { key: 'tanggalMulai', direction: 'desc' }, 10);

  const exportableTableData = useMemo(() => {
    let list = [...scopedTelecoms];
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      list = list.filter((item) =>
        [
          item.nama,
          item.noTelephone,
          item.typeProduct,
          item.region,
          item.tanggalMulai,
          item.tanggalSelesai,
          item.bank,
          item.noRekening,
          item.namaRekening,
          item.staff,
          item.lifecycleStatus,
          item.depositStatus
        ].some((val) => val && String(val).toLowerCase().includes(q))
      );
    }
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        list = list.filter((item) =>
          String(item[key] || '').toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });
    return list;
  }, [scopedTelecoms, globalSearch, filters]);

  const hasActiveFilters =
    tableScope !== 'all' ||
    Boolean(globalSearch) ||
    Object.values(filters).some((v) => Boolean(v));

  const handleResetAllFilters = () => {
    setTableScope('all');
    handleGlobalSearch('');
    Object.keys(filters).forEach((k) => handleFilterChange(k, ''));
    setCurrentPage(1);
  };

  const drillIntoOrders = ({ scope = 'all', search = '' }) => {
    setTableScope(scope);
    handleGlobalSearch(search);
    Object.keys(filters).forEach((k) => handleFilterChange(k, ''));
    setCurrentPage(1);
    setActiveTab('database');
  };

  // Overview analytics filtered by selectedYear
  const overviewMetrics = useMemo(() => {
    const yearFiltered =
      selectedYear === 'All'
        ? enrichedTelecoms
        : enrichedTelecoms.filter((t) => t.startYear === selectedYear);

    const activeList = yearFiltered.filter(
      (t) =>
        t.lifecycleStatus === 'Active Roaming' || t.lifecycleStatus === 'Handed Over'
    );
    const upcoming7dList = yearFiltered.filter(
      (t) => t.lifecycleStatus === 'Upcoming' || t.isUpcomingPickup7d
    );
    const returnDueList = yearFiltered.filter((t) => t.isReturnDueOrOverdue);
    const overdueCount = yearFiltered.filter(
      (t) => t.lifecycleStatus === 'Overdue Return'
    ).length;
    const heldDepositsList = yearFiltered.filter((t) => t.isDepositHeld);
    const totalHeldDepositIdr = heldDepositsList.reduce(
      (sum, t) => sum + (Number(t.jumlahDeposit) || 0),
      0
    );
    const readyToRefundCount = heldDepositsList.filter(
      (t) => t.needsDepositRefund
    ).length;
    const completedList = yearFiltered.filter((t) => t.isCompleted);

    const durations = yearFiltered
      .map((t) => t.roamingDays)
      .filter((d) => d !== null && d > 0);
    const avgDurationDays =
      durations.length > 0
        ? Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length)
        : null;

    // Watchlist 1: Upcoming Handovers & Pickups (next 14 days)
    const pickupWatchlist = yearFiltered
      .filter(
        (t) =>
          !t.isCompleted &&
          !t.tanggalPengambilan &&
          ((t.diffPickup !== null && t.diffPickup >= -2 && t.diffPickup <= 14) ||
            t.lifecycleStatus === 'Upcoming')
      )
      .sort((a, b) => (a.diffPickup ?? 999) - (b.diffPickup ?? 999))
      .slice(0, 6);

    // Watchlist 2: Device Returns & Unrefunded Deposits
    const returnRefundWatchlist = yearFiltered
      .filter(
        (t) =>
          t.isReturnDueOrOverdue ||
          t.needsDepositRefund ||
          (t.requiresReturn &&
            !t.tanggalPengembalian &&
            t.diffEnd !== null &&
            t.diffEnd <= 3)
      )
      .sort((a, b) => (a.diffEnd ?? 999) - (b.diffEnd ?? 999))
      .slice(0, 6);

    // Chart 1: Monthly Orders vs Completed
    const monthlyBuckets = MONTH_LABELS.map((m) => ({
      name: m,
      Orders: 0,
      Completed: 0
    }));
    yearFiltered.forEach((t) => {
      const sDate = parseLocalDay(t.tanggalMulai);
      if (sDate) {
        monthlyBuckets[sDate.getMonth()].Orders += 1;
        if (t.isCompleted) {
          monthlyBuckets[sDate.getMonth()].Completed += 1;
        }
      }
    });

    // Chart 2: Product Mix
    const prodMap = {};
    yearFiltered.forEach((t) => {
      const p = t.typeProduct || 'Travel SIM / WiFi';
      prodMap[p] = (prodMap[p] || 0) + 1;
    });
    const productMixData = Object.keys(prodMap)
      .map((name, idx) => ({
        name,
        value: prodMap[name],
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Chart 3: Top Coverage Regions
    const regMap = {};
    yearFiltered.forEach((t) => {
      const r = (t.region || '').trim() || 'Unspecified';
      regMap[r] = (regMap[r] || 0) + 1;
    });
    const topRegionsData = Object.keys(regMap)
      .map((name) => ({ name, count: regMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Chart 4: Workload by Consultant
    const staffMap = {};
    yearFiltered.forEach((t) => {
      const s = (t.staff || '').trim() || 'Unassigned';
      const shortName = s.split(' ')[0];
      if (!staffMap[s]) {
        staffMap[s] = { name: shortName, fullName: s, Active: 0, Completed: 0 };
      }
      if (t.isCompleted) staffMap[s].Completed += 1;
      else staffMap[s].Active += 1;
    });
    const staffChartData = Object.values(staffMap).sort(
      (a, b) => b.Active + b.Completed - (a.Active + a.Completed)
    );

    return {
      totalCount: yearFiltered.length,
      activeCount: activeList.length,
      upcoming7dCount: upcoming7dList.length,
      returnDueCount: returnDueList.length,
      overdueCount,
      heldDepositCount: heldDepositsList.length,
      totalHeldDepositIdr,
      readyToRefundCount,
      completedCount: completedList.length,
      avgDurationDays,
      pickupWatchlist,
      returnRefundWatchlist,
      monthlyBuckets,
      productMixData,
      topRegionsData,
      staffChartData
    };
  }, [enrichedTelecoms, selectedYear]);

  const pageIds = useMemo(() => paginatedData.map((d) => d.id), [paginatedData]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllOnPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportColumns = [
    { header: 'Traveler Name', key: 'nama', format: null },
    { header: 'Phone / WhatsApp', key: 'noTelephone', format: null },
    { header: 'Product Type', key: 'typeProduct', format: null },
    { header: 'Coverage Region', key: 'region', format: null },
    { header: 'Start Date', key: 'tanggalMulai', format: null },
    { header: 'End Date', key: 'tanggalSelesai', format: null },
    { header: 'Days', key: 'roamingDays', format: null },
    { header: 'Lifecycle Status', key: 'lifecycleStatus', format: null },
    { header: 'Est. Pickup Date', key: 'estimasiPengambilan', format: null },
    { header: 'Pickup / Sent Date', key: 'tanggalPengambilan', format: null },
    { header: 'Return Date', key: 'tanggalPengembalian', format: null },
    { header: 'Deposit Status', key: 'depositStatus', format: null },
    { header: 'Deposit Amount (IDR)', key: 'jumlahDeposit', format: 'currency' },
    { header: 'Refund Bank', key: 'bank', format: null },
    { header: 'Account Number', key: 'noRekening', format: null },
    { header: 'Account Holder', key: 'namaRekening', format: null },
    { header: 'Consultant (PIC)', key: 'staff', format: null }
  ];

  const formInputStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    borderRadius: '0.6rem',
    width: '100%',
    padding: '0.68rem 0.9rem',
    fontSize: '0.875rem',
    outline: 'none'
  };

  const formIconInputStyle = {
    ...formInputStyle,
    paddingLeft: '2.35rem'
  };

  const formIconStyle = {
    position: 'absolute',
    left: '0.78rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--primary)',
    pointerEvents: 'none'
  };

  const chipButtonStyle = (isActive) => ({
    padding: '0.28rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.74rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
    background: isActive
      ? isLight
        ? 'rgba(0, 168, 255, 0.14)'
        : 'rgba(56, 189, 248, 0.18)'
      : 'var(--bg-surface)',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'all 0.15s ease'
  });

  const liveFormDays = getRoamingDaysCount(
    formData.tanggalMulai,
    formData.tanggalSelesai
  );

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
            {/* Page Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
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
                    background: isLight
                      ? 'rgba(0, 168, 255, 0.1)'
                      : 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--primary)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    marginBottom: '0.45rem'
                  }}
                >
                  <Wifi size={13} /> ROAMING, eSIM &amp; POCKET WIFI DESK
                </div>
                <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  Travel SIM &amp; eSIM
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  Manage eSIM dispatches, physical SIM handovers, Pocket WiFi device returns, and security deposit refunds.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap'
                }}
              >
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
                    color: showImport ? 'var(--primary)' : 'var(--text-main)'
                  }}
                >
                  <UploadCloud size={17} /> Import Excel / CSV
                </button>
                <ExportMenu
                  data={exportableTableData}
                  columns={exportColumns}
                  filename="TravelOps_SIM_WiFi"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={18} /> New SIM / WiFi Order
                </button>
              </div>
            </div>

            {/* Collapsible Spreadsheet Import Panel */}
            {showImport && (
              <div
                className="card fade-in"
                style={{
                  marginBottom: '1.5rem',
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
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      Batch Import Travel SIM, eSIM &amp; Pocket WiFi Orders
                    </h3>
                    <p
                      style={{
                        margin: '0.2rem 0 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Upload a `.csv` or `.xlsx` roster. Supports both English and legacy Indonesian column headers.
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

            {/* Main View Tabs + Year Pills */}
            <div
              className="tabs-container"
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <BarChart2 size={16} /> Roaming Overview
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                  onClick={() => setActiveTab('database')}
                >
                  <FileText size={16} /> All Orders &amp; Devices
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
                    {enrichedTelecoms.length}
                  </span>
                </button>
              </div>

              {activeTab === 'dashboard' && availableYears.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    paddingBottom: '0.45rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginRight: '0.2rem'
                    }}
                  >
                    Start Year:
                  </span>
                  {['All', ...availableYears].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      style={chipButtonStyle(selectedYear === yr)}
                    >
                      {yr === 'All' ? 'All Years' : yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeTab === 'dashboard' ? (
              <div className="fade-in">
                {/* 5 Clickable KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                    gap: '1.1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div
                    className="card"
                    onClick={() => drillIntoOrders({ scope: 'active' })}
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
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Active Roaming
                      </span>
                      <Wifi size={18} color="#00a8ff" />
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.4rem'
                      }}
                    >
                      {overviewMetrics.activeCount}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem'
                      }}
                    >
                      Travelers currently connected
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => drillIntoOrders({ scope: 'upcoming' })}
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
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Upcoming Pickups
                      </span>
                      <Calendar size={18} color="#6366f1" />
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '0.4rem'
                      }}
                    >
                      {overviewMetrics.upcoming7dCount}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem'
                      }}
                    >
                      Awaiting handover / eSIM QR
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => drillIntoOrders({ scope: 'return_due' })}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '3px solid #ef4444',
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
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Return Due / Overdue
                      </span>
                      <AlertTriangle size={18} color="#ef4444" />
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color:
                          overviewMetrics.returnDueCount > 0
                            ? '#ef4444'
                            : 'var(--text-main)',
                        marginTop: '0.4rem'
                      }}
                    >
                      {overviewMetrics.returnDueCount}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem'
                      }}
                    >
                      {overviewMetrics.overdueCount > 0
                        ? `${overviewMetrics.overdueCount} device(s) past end date`
                        : 'All devices on schedule'}
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => drillIntoOrders({ scope: 'deposit_held' })}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '3px solid #f59e0b',
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
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Deposits Held
                      </span>
                      <DollarSign size={18} color="#f59e0b" />
                    </div>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#f59e0b',
                        marginTop: '0.55rem'
                      }}
                    >
                      {formatIdr(overviewMetrics.totalHeldDepositIdr)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                      }}
                    >
                      {overviewMetrics.heldDepositCount} customer(s)
                      {overviewMetrics.readyToRefundCount > 0
                        ? ` · ${overviewMetrics.readyToRefundCount} ready to refund`
                        : ''}
                    </div>
                  </div>

                  <div
                    className="card"
                    onClick={() => drillIntoOrders({ scope: 'completed' })}
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
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Completed Orders
                      </span>
                      <CheckCircle2 size={18} color="#10b981" />
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#10b981',
                        marginTop: '0.4rem'
                      }}
                    >
                      {overviewMetrics.completedCount}
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem'
                      }}
                    >
                      {overviewMetrics.avgDurationDays !== null
                        ? `Avg trip: ${overviewMetrics.avgDurationDays}d roaming`
                        : `${overviewMetrics.totalCount} total order(s)`}
                    </div>
                  </div>
                </div>

                {/* Operational Watchlists: Upcoming Handovers & Return/Deposit Settlement */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* Watchlist 1: Upcoming Handovers & eSIM Dispatches */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.9rem'
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
                          <Smartphone size={17} color="#6366f1" /> Upcoming Pickups &amp; eSIM Dispatches
                        </h3>
                        <p
                          style={{
                            margin: '0.15rem 0 0 0',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Orders awaiting SIM/WiFi handover or eSIM QR code delivery
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => drillIntoOrders({ scope: 'upcoming' })}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)'
                        }}
                      >
                        View All
                      </button>
                    </div>

                    {overviewMetrics.pickupWatchlist.length === 0 ? (
                      <div
                        style={{
                          padding: '1.75rem 1rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.84rem',
                          background: 'var(--bg-surface)',
                          borderRadius: '0.75rem',
                          border: '1px dashed var(--border)'
                        }}
                      >
                        No pending SIM or Pocket WiFi handovers right now.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {overviewMetrics.pickupWatchlist.map((t) => {
                          const targetDate = t.estimasiPengambilan || t.tanggalMulai;
                          const badgeText =
                            t.diffPickup === 0
                              ? 'Today'
                              : t.diffPickup === 1
                              ? 'Tomorrow'
                              : t.diffPickup !== null && t.diffPickup < 0
                              ? `${Math.abs(t.diffPickup)}d ago`
                              : t.diffPickup !== null
                              ? `In ${t.diffPickup}d`
                              : 'Scheduled';
                          return (
                            <div
                              key={t.id}
                              onClick={() => setPreviewTelId(t.id)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.7rem 0.85rem',
                                borderRadius: '0.7rem',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: '0.86rem',
                                      color: 'var(--text-main)'
                                    }}
                                  >
                                    {t.nama}
                                  </strong>
                                  <span
                                    className="badge badge-primary"
                                    style={{ fontSize: '0.68rem' }}
                                  >
                                    {t.typeProduct} · {t.region || '-'}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.2rem'
                                  }}
                                >
                                  {t.estimasiPengambilan ? 'Pickup: ' : 'Starts: '}
                                  {formatDisplayDate(targetDate, false)}
                                  {t.roamingDays ? ` · ${t.roamingDays}d trip` : ''}
                                  {t.staff ? ` · PIC: ${t.staff}` : ''}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  flexShrink: 0
                                }}
                              >
                                <span
                                  className={`badge ${
                                    t.diffPickup !== null && t.diffPickup <= 1
                                      ? 'badge-warning'
                                      : 'badge-primary'
                                  }`}
                                >
                                  {badgeText}
                                </span>
                                {canEditRecord(t.staff) && (
                                  <button
                                    type="button"
                                    className="btn"
                                    title="Record Pickup / Sent"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenQuickSettlement(t, 'pickup');
                                    }}
                                    style={{
                                      padding: '0.32rem 0.5rem',
                                      background: 'rgba(0, 168, 255, 0.12)',
                                      color: 'var(--primary)'
                                    }}
                                  >
                                    <CheckSquare size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn"
                                  title="Send Pickup / Activation WhatsApp"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendPickupWhatsApp(t);
                                  }}
                                  style={{
                                    padding: '0.32rem 0.5rem',
                                    background: 'rgba(16, 185, 129, 0.14)',
                                    color: '#10b981'
                                  }}
                                >
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Watchlist 2: Device Return & Deposit Refund Watchlist */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.9rem'
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
                          <Clock size={17} color="#f59e0b" /> Device Return &amp; Deposit Refund Watchlist
                        </h3>
                        <p
                          style={{
                            margin: '0.15rem 0 0 0',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Devices due back soon and security deposits ready to refund
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => drillIntoOrders({ scope: 'return_due' })}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)'
                        }}
                      >
                        View Queue
                      </button>
                    </div>

                    {overviewMetrics.returnRefundWatchlist.length === 0 ? (
                      <div
                        style={{
                          padding: '1.75rem 1rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.84rem',
                          background: 'var(--bg-surface)',
                          borderRadius: '0.75rem',
                          border: '1px dashed var(--border)'
                        }}
                      >
                        All Pocket WiFi devices are returned and no deposits are overdue.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {overviewMetrics.returnRefundWatchlist.map((t) => {
                          const isReturnedWaitingRefund =
                            Boolean(t.tanggalPengembalian) && t.isDepositHeld;
                          const badgeLabel = isReturnedWaitingRefund
                            ? 'Refund Pending'
                            : t.diffEnd !== null && t.diffEnd < 0
                            ? `${Math.abs(t.diffEnd)}d Overdue`
                            : t.diffEnd === 0
                            ? 'Ends Today'
                            : `Ends in ${t.diffEnd}d`;
                          const badgeClass = isReturnedWaitingRefund
                            ? 'badge-warning'
                            : t.diffEnd !== null && t.diffEnd < 0
                            ? 'badge-danger'
                            : 'badge-warning';

                          return (
                            <div
                              key={t.id}
                              onClick={() => setPreviewTelId(t.id)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.7rem 0.85rem',
                                borderRadius: '0.7rem',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: '0.86rem',
                                      color: 'var(--text-main)'
                                    }}
                                  >
                                    {t.nama}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--text-muted)'
                                    }}
                                  >
                                    {t.typeProduct} ({t.region || '-'})
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.2rem'
                                  }}
                                >
                                  End: {formatDisplayDate(t.tanggalSelesai, false)}
                                  {t.jumlahDeposit > 0
                                    ? ` · Deposit: ${formatIdr(t.jumlahDeposit)}${
                                        t.bank ? ` (${t.bank})` : ''
                                      }`
                                    : ''}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  flexShrink: 0
                                }}
                              >
                                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                                {canEditRecord(t.staff) && (
                                  <button
                                    type="button"
                                    className="btn"
                                    title={
                                      isReturnedWaitingRefund
                                        ? 'Mark Deposit Refunded'
                                        : 'Confirm Device Return & Refund'
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isReturnedWaitingRefund) {
                                        handleQuickRefundOnly(t);
                                      } else {
                                        handleOpenQuickSettlement(t, 'return');
                                      }
                                    }}
                                    style={{
                                      padding: '0.32rem 0.5rem',
                                      background: 'rgba(16, 185, 129, 0.14)',
                                      color: '#10b981'
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn"
                                  title="Send Return / Refund WhatsApp"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendReturnRefundWhatsApp(t);
                                  }}
                                  style={{
                                    padding: '0.32rem 0.5rem',
                                    background: 'rgba(0, 168, 255, 0.12)',
                                    color: 'var(--primary)'
                                  }}
                                >
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Analytics Charts (2x2 Grid) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {/* Chart 1: Monthly Orders vs Completed */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <BarChart2 size={17} color="var(--primary)" /> Monthly Roaming Orders vs Completed
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overviewMetrics.monthlyBuckets}
                          margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            allowDecimals={false}
                          />
                          <RechartsTooltip
                            content={<TelecomChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                          <Bar
                            dataKey="Orders"
                            name="Total Orders"
                            fill="#00a8ff"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Completed"
                            name="Completed"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Product Mix */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Package size={17} color="var(--primary)" /> Product Mix (eSIM, SIM &amp; Pocket WiFi)
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.productMixData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={overviewMetrics.productMixData}
                              cx="50%"
                              cy="50%"
                              innerRadius={58}
                              outerRadius={92}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {overviewMetrics.productMixData.map((entry, idx) => (
                                <Cell key={`prod-cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              content={<TelecomChartTooltip isLight={isLight} />}
                            />
                            <Legend />
                          </PieChart>
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
                          No product records yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart 3: Top Coverage Regions */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Globe size={17} color="var(--primary)" /> Top Coverage Regions
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.topRegionsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={overviewMetrics.topRegionsData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              type="number"
                              stroke="var(--text-muted)"
                              fontSize={12}
                              allowDecimals={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="var(--text-muted)"
                              fontSize={12}
                              width={110}
                            />
                            <RechartsTooltip
                              content={<TelecomChartTooltip isLight={isLight} />}
                            />
                            <Bar
                              dataKey="count"
                              name="Orders"
                              fill="#00a8ff"
                              radius={[0, 6, 6, 0]}
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
                          No coverage region data yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart 4: Workload by Consultant */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)'
                      }}
                    >
                      <User size={17} color="var(--primary)" /> Workload by Consultant
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.staffChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={overviewMetrics.staffChartData}
                            margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={12}
                              allowDecimals={false}
                            />
                            <RechartsTooltip
                              content={<TelecomChartTooltip isLight={isLight} />}
                            />
                            <Legend />
                            <Bar
                              dataKey="Active"
                              name="Active / Upcoming"
                              stackId="a"
                              fill="#00a8ff"
                            />
                            <Bar
                              dataKey="Completed"
                              name="Completed"
                              stackId="a"
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
                          No consultant workload data yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ALL ORDERS & DEVICES DATABASE TAB */
              <div className="fade-in">
                {/* Quick Scope Filter Pills */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.45rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem'
                  }}
                >
                  {[
                    { id: 'all', label: 'All Orders', count: scopeCounts.all },
                    {
                      id: 'upcoming',
                      label: 'Upcoming Pickup',
                      count: scopeCounts.upcoming
                    },
                    { id: 'active', label: 'Active Roaming', count: scopeCounts.active },
                    {
                      id: 'return_due',
                      label: 'Return Due / Overdue',
                      count: scopeCounts.return_due
                    },
                    {
                      id: 'deposit_held',
                      label: 'Deposit Held',
                      count: scopeCounts.deposit_held
                    },
                    {
                      id: 'completed',
                      label: 'Completed',
                      count: scopeCounts.completed
                    },
                    { id: 'mine', label: 'My Workload', count: scopeCounts.mine }
                  ].map((pill) => {
                    const active = tableScope === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          setTableScope(pill.id);
                          setCurrentPage(1);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.42rem 0.8rem',
                          borderRadius: '999px',
                          fontSize: '0.79rem',
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
                            padding: '0.05rem 0.42rem',
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

                {/* Unified Instant Search & Bulk Action Toolbar */}
                <div
                  className="card"
                  style={{
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      flex: '1 1 320px',
                      maxWidth: '480px'
                    }}
                  >
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search traveler, phone, product, region, bank account, or staff..."
                      value={globalSearch}
                      onChange={(e) => handleGlobalSearch(e.target.value)}
                      style={{
                        ...formInputStyle,
                        paddingLeft: '2.4rem',
                        paddingRight: globalSearch ? '2.2rem' : '0.9rem'
                      }}
                    />
                    {globalSearch && (
                      <button
                        type="button"
                        onClick={() => handleGlobalSearch('')}
                        style={{
                          position: 'absolute',
                          right: '0.65rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    {selectedIds.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '0.6rem',
                          background: isLight
                            ? 'rgba(0, 168, 255, 0.08)'
                            : 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(0, 168, 255, 0.25)',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--primary)'
                          }}
                        >
                          {selectedIds.length} selected
                        </span>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkAction('pickup')}
                          style={{
                            padding: '0.28rem 0.6rem',
                            fontSize: '0.75rem',
                            background: 'rgba(0, 168, 255, 0.14)',
                            color: 'var(--primary)'
                          }}
                        >
                          <Smartphone size={13} /> Mark Picked Up
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkAction('return')}
                          style={{
                            padding: '0.28rem 0.6rem',
                            fontSize: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.14)',
                            color: '#10b981'
                          }}
                        >
                          <CheckCircle2 size={13} /> Mark Returned
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkAction('deposit_refunded')}
                          style={{
                            padding: '0.28rem 0.6rem',
                            fontSize: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b'
                          }}
                        >
                          <DollarSign size={13} /> Refund Deposit
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="btn"
                            onClick={handleBulkDelete}
                            style={{
                              padding: '0.28rem 0.6rem',
                              fontSize: '0.75rem',
                              background: 'rgba(239, 68, 68, 0.14)',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    )}

                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="btn"
                        onClick={handleResetAllFilters}
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <RotateCcw size={14} /> Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Data Table Card */}
                <div
                  className="card"
                  style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    style={{
                      overflowX: 'auto',
                      borderTopLeftRadius: '1rem',
                      borderTopRightRadius: '1rem'
                    }}
                  >
                    <table className="data-table">
                      <thead
                        style={{
                          background: isLight
                            ? '#f1f7fe'
                            : 'rgba(14, 24, 45, 0.92)',
                          borderBottom: '1px solid var(--border)'
                        }}
                      >
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={allPageSelected}
                              onChange={toggleSelectAllOnPage}
                              aria-label="Select all orders on page"
                            />
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'nama'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('nama')}
                            >
                              TRAVELER &amp; PHONE <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'region'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('region')}
                            >
                              PRODUCT &amp; COVERAGE <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'tanggalMulai'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('tanggalMulai')}
                            >
                              ROAMING PERIOD <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'lifecycleStatus'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('lifecycleStatus')}
                            >
                              HANDOVER &amp; STATUS <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'jumlahDeposit'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('jumlahDeposit')}
                            >
                              DEPOSIT &amp; REFUND <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                color:
                                  sortConfig?.key === 'staff'
                                    ? 'var(--primary)'
                                    : 'inherit'
                              }}
                              onClick={() => handleSort('staff')}
                            >
                              CONSULTANT <ArrowUpDown size={13} />
                            </div>
                          </th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((tel) => {
                          const lifeMeta = getLifecycleMeta(
                            tel.lifecycleStatus,
                            isLight
                          );
                          const depMeta = getDepositMeta(
                            tel.depositStatus,
                            tel.jumlahDeposit,
                            isLight
                          );
                          const isSelected = selectedIds.includes(tel.id);

                          return (
                            <tr
                              key={tel.id}
                              onClick={() => setPreviewTelId(tel.id)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected
                                  ? isLight
                                    ? 'rgba(0, 168, 255, 0.06)'
                                    : 'rgba(56, 189, 248, 0.08)'
                                  : undefined
                              }}
                            >
                              <td
                                style={{ textAlign: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(tel.id)}
                                  aria-label={`Select ${tel.nama}`}
                                />
                              </td>
                              <td>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {tel.nama}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.76rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.15rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <Phone size={11} /> {tel.noTelephone || '-'}
                                </div>
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <span
                                    className="badge badge-primary"
                                    style={{ fontSize: '0.68rem' }}
                                  >
                                    {tel.typeProduct}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    marginTop: '0.25rem'
                                  }}
                                >
                                  {tel.region || '-'}
                                </div>
                              </td>
                              <td>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {formatDisplayDate(tel.tanggalMulai, true)}
                                  {tel.tanggalSelesai
                                    ? ` → ${formatDisplayDate(tel.tanggalSelesai, false)}`
                                    : ' → Open'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.73rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.18rem'
                                  }}
                                >
                                  {tel.roamingDays
                                    ? `${tel.roamingDays} day${tel.roamingDays > 1 ? 's' : ''} roaming`
                                    : 'Flexible duration'}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <span
                                    className={`badge ${lifeMeta.badgeClass}`}
                                    style={lifeMeta.customStyle || undefined}
                                  >
                                    {lifeMeta.label}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.25rem'
                                  }}
                                >
                                  {tel.tanggalPengembalian
                                    ? `Returned ${formatDisplayDate(tel.tanggalPengembalian, false)}`
                                    : tel.tanggalPengambilan
                                    ? `Handed ${formatDisplayDate(tel.tanggalPengambilan, false)}`
                                    : tel.estimasiPengambilan
                                    ? `Est. pickup ${formatDisplayDate(tel.estimasiPengambilan, false)}`
                                    : 'No handover date'}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <span
                                    className={`badge ${depMeta.badgeClass}`}
                                    style={depMeta.customStyle || undefined}
                                  >
                                    {depMeta.label}
                                  </span>
                                </div>
                                {tel.jumlahDeposit > 0 && (
                                  <div
                                    style={{
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      color: 'var(--text-main)',
                                      marginTop: '0.22rem'
                                    }}
                                  >
                                    {formatIdr(tel.jumlahDeposit)}
                                    {tel.bank ? ` · ${tel.bank}` : ''}
                                  </div>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {tel.staff || 'Unassigned'}
                                </span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    className="btn"
                                    title="Inspect Order Details"
                                    onClick={() => setPreviewTelId(tel.id)}
                                    style={{
                                      padding: '0.42rem',
                                      background: 'rgba(0, 168, 255, 0.12)',
                                      color: 'var(--primary)'
                                    }}
                                  >
                                    <Eye size={15} />
                                  </button>

                                  {canEditRecord(tel.staff) && !tel.isCompleted && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title={
                                        !tel.tanggalPengambilan &&
                                        tel.lifecycleStatus === 'Upcoming'
                                          ? 'Record Pickup / QR Sent'
                                          : 'Confirm Return / Complete'
                                      }
                                      onClick={() =>
                                        handleOpenQuickSettlement(
                                          tel,
                                          !tel.tanggalPengambilan &&
                                            tel.lifecycleStatus === 'Upcoming'
                                            ? 'pickup'
                                            : 'return'
                                        )
                                      }
                                      style={{
                                        padding: '0.42rem',
                                        background: 'rgba(16, 185, 129, 0.14)',
                                        color: '#10b981'
                                      }}
                                    >
                                      <CheckCircle2 size={15} />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn"
                                    title="Duplicate for Group / Family Traveler"
                                    onClick={() => handleDuplicateTelecom(tel)}
                                    style={{
                                      padding: '0.42rem',
                                      background: 'rgba(99, 102, 241, 0.12)',
                                      color: '#6366f1'
                                    }}
                                  >
                                    <Copy size={15} />
                                  </button>

                                  {canEditRecord(tel.staff) && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title="Edit Order"
                                      onClick={() => handleOpenModal(tel)}
                                      style={{
                                        padding: '0.42rem',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)'
                                      }}
                                    >
                                      <Edit2 size={15} />
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="btn"
                                      title="Delete Order"
                                      onClick={() => handleDelete(tel)}
                                      style={{
                                        padding: '0.42rem',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#ef4444'
                                      }}
                                    >
                                      <Trash2 size={15} />
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
                              colSpan="8"
                              style={{
                                textAlign: 'center',
                                padding: '2.5rem 1rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {enrichedTelecoms.length === 0
                                ? 'No Travel SIM, eSIM, or Pocket WiFi orders yet. Click "New SIM / WiFi Order" to create one.'
                                : 'No orders match your active search or scope filter.'}
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

      {/* ADD / EDIT / DUPLICATE ORDER MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content fade-in"
            style={{
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              padding: 0,
              border: '1px solid var(--border)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: isLight ? '#f4f9ff' : 'var(--bg-surface)',
                position: 'sticky',
                top: 0,
                zIndex: 5
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
                    color: 'var(--text-main)'
                  }}
                >
                  <Wifi size={20} color="var(--primary)" />
                  {editingTel
                    ? 'Edit SIM / Pocket WiFi Order'
                    : isDuplicateMode
                    ? 'Duplicate Order for Group / Family Traveler'
                    : 'New Travel SIM, eSIM or Pocket WiFi Order'}
                </h2>
                {isDuplicateMode && (
                  <p
                    style={{
                      margin: '0.2rem 0 0 0',
                      fontSize: '0.78rem',
                      color: 'var(--primary)'
                    }}
                  >
                    Coverage, roaming dates, and deposit settings were copied—just enter the next traveler&apos;s name.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              {/* Section 1: Traveler & Product */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--primary)',
                  marginBottom: '0.75rem'
                }}
              >
                1. Traveler &amp; Roaming Product
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="input-group">
                  <label>
                    Traveler Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={formIconStyle} />
                    <input
                      type="text"
                      required
                      placeholder="Full traveler name"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      style={formIconInputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    Phone / WhatsApp <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={formIconStyle} />
                    <input
                      type="text"
                      required
                      placeholder="0812... or +62812..."
                      value={formData.noTelephone}
                      onChange={(e) =>
                        setFormData({ ...formData, noTelephone: e.target.value })
                      }
                      style={formIconInputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Product Type + 1-click Chips */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Product Type</label>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}
                >
                  {PRODUCT_TYPES.map((prod) => (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => handleSelectProductChip(prod)}
                      style={chipButtonStyle(formData.typeProduct === prod)}
                    >
                      {prod}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <Package size={16} style={formIconStyle} />
                  <input
                    type="text"
                    placeholder="e.g. eSIM Unlimited 10GB, Pocket WiFi Japan, Physical SIM..."
                    value={formData.typeProduct}
                    onChange={(e) =>
                      setFormData({ ...formData, typeProduct: e.target.value })
                    }
                    style={formIconInputStyle}
                  />
                </div>
              </div>

              {/* Coverage Region + Popular Chips + Searchable Dropdown */}
              <div
                className="input-group"
                ref={dropdownRef}
                style={{ position: 'relative', marginBottom: '1.35rem' }}
              >
                <label>
                  Coverage Region / Destination <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.35rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}
                >
                  {POPULAR_REGIONS.map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => handleCountrySelect(reg)}
                      style={chipButtonStyle(formData.region === reg)}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={formIconStyle} />
                  <input
                    type="text"
                    required
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setFormData({ ...formData, region: e.target.value });
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Select a chip above or type any country / multi-country region..."
                    style={formIconInputStyle}
                  />
                </div>
                {showDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.25rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.6rem',
                      maxHeight: '190px',
                      overflowY: 'auto',
                      zIndex: 20,
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <div
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          style={{
                            padding: '0.6rem 0.9rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem'
                          }}
                        >
                          {country}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '0.65rem 0.9rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem'
                        }}
                      >
                        Press Tab or continue—custom region &quot;{countrySearch}&quot; will be saved.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Roaming Schedule & Handover */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--primary)'
                  }}
                >
                  2. Roaming Dates &amp; Handover Schedule
                </span>
                {liveFormDays !== null && (
                  <span className="badge badge-primary">
                    <Sparkles size={11} style={{ marginRight: '0.25rem' }} />
                    {liveFormDays} Day{liveFormDays > 1 ? 's' : ''} Roaming
                  </span>
                )}
              </div>

              <div className="form-grid" style={{ marginBottom: '0.65rem' }}>
                <div className="input-group">
                  <label>
                    Roaming Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalMulai: e.target.value })
                    }
                    style={formInputStyle}
                  />
                </div>

                <div className="input-group">
                  <label>Roaming End Date</label>
                  <input
                    type="date"
                    value={formData.tanggalSelesai}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalSelesai: e.target.value })
                    }
                    style={formInputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Quick duration:
                </span>
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleApplyDuration(d)}
                    style={chipButtonStyle(liveFormDays === d)}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              <div className="form-grid" style={{ marginBottom: '1.35rem' }}>
                <div className="input-group">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <label style={{ marginBottom: 0 }}>Est. Pickup / QR Send Date</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleApplyPickupOffset(-2)}
                        style={{
                          ...chipButtonStyle(false),
                          padding: '0.12rem 0.45rem',
                          fontSize: '0.68rem'
                        }}
                      >
                        H-2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPickupOffset(-1)}
                        style={{
                          ...chipButtonStyle(false),
                          padding: '0.12rem 0.45rem',
                          fontSize: '0.68rem'
                        }}
                      >
                        H-1
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={formData.estimasiPengambilan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimasiPengambilan: e.target.value
                      })
                    }
                    style={{ ...formInputStyle, marginTop: '0.35rem' }}
                  />
                </div>

                <div className="input-group">
                  <label>Actual Pickup / Sent Date</label>
                  <input
                    type="date"
                    value={formData.tanggalPengambilan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalPengambilan: e.target.value
                      })
                    }
                    style={formInputStyle}
                  />
                </div>

                <div className="input-group">
                  <label>Actual Device Return Date</label>
                  <input
                    type="date"
                    value={formData.tanggalPengembalian}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalPengembalian: e.target.value
                      })
                    }
                    style={formInputStyle}
                  />
                </div>

                <div className="input-group">
                  <label>
                    Assigned Consultant (PIC) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.staff}
                    onChange={(e) =>
                      setFormData({ ...formData, staff: e.target.value })
                    }
                    style={formInputStyle}
                  >
                    <option value="">Select Consultant</option>
                    {activeStaff.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Security Deposit & Refund Bank Account */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--primary)',
                  marginBottom: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                3. Security Deposit &amp; Refund Bank Account (Pocket WiFi / Rental)
              </div>

              <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                <div className="input-group">
                  <label>Deposit Status</label>
                  <select
                    value={formData.depositStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, depositStatus: e.target.value })
                    }
                    style={formInputStyle}
                  >
                    <option value="None">No Deposit Required (eSIM / Purchased SIM)</option>
                    <option value="Belum">Pending Deposit (Unpaid)</option>
                    <option value="Sudah">Deposit Held (Collected)</option>
                    <option value="Refunded">Deposit Refunded to Traveler</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Deposit Amount (IDR)</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formData.jumlahDeposit}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          jumlahDeposit: clean,
                          depositStatus:
                            Number(clean) > 0 && prev.depositStatus === 'None'
                              ? 'Sudah'
                              : prev.depositStatus
                        }));
                      }}
                      style={{ ...formInputStyle, paddingLeft: '2.35rem' }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.3rem',
                      flexWrap: 'wrap',
                      marginTop: '0.4rem'
                    }}
                  >
                    {DEPOSIT_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            jumlahDeposit: amt === 0 ? '' : String(amt),
                            depositStatus:
                              amt === 0
                                ? 'None'
                                : prev.depositStatus === 'None'
                                ? 'Sudah'
                                : prev.depositStatus
                          }))
                        }
                        style={{
                          ...chipButtonStyle(
                            Number(formData.jumlahDeposit || 0) === amt
                          ),
                          padding: '0.18rem 0.52rem',
                          fontSize: '0.7rem'
                        }}
                      >
                        {amt === 0 ? 'Rp 0' : `Rp ${amt / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {formData.depositStatus !== 'None' && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <span
                      style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}
                    >
                      Quick Bank:
                    </span>
                    {POPULAR_BANKS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFormData({ ...formData, bank: b })}
                        style={{
                          ...chipButtonStyle(formData.bank === b),
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.71rem'
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  <div className="form-grid">
                    <div className="input-group">
                      <label>Refund Bank Name</label>
                      <div style={{ position: 'relative' }}>
                        <Building size={16} style={formIconStyle} />
                        <input
                          type="text"
                          placeholder="e.g. BCA, Mandiri..."
                          value={formData.bank}
                          onChange={(e) =>
                            setFormData({ ...formData, bank: e.target.value })
                          }
                          style={formIconInputStyle}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Bank Account Number</label>
                      <div style={{ position: 'relative' }}>
                        <CreditCard size={16} style={formIconStyle} />
                        <input
                          type="text"
                          placeholder="Account number for refund"
                          value={formData.noRekening}
                          onChange={(e) =>
                            setFormData({ ...formData, noRekening: e.target.value })
                          }
                          style={formIconInputStyle}
                        />
                      </div>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <label style={{ marginBottom: 0 }}>Account Holder Name</label>
                        {formData.nama && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                namaRekening: prev.nama
                              }))
                            }
                            style={{
                              ...chipButtonStyle(false),
                              padding: '0.15rem 0.55rem',
                              fontSize: '0.7rem'
                            }}
                          >
                            Same as Traveler ({formData.nama})
                          </button>
                        )}
                      </div>
                      <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                        <User size={16} style={formIconStyle} />
                        <input
                          type="text"
                          placeholder="Bank account holder name"
                          value={formData.namaRekening}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              namaRekening: e.target.value
                            })
                          }
                          style={formIconInputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={handleCloseModal}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingTel
                    ? 'Save Changes'
                    : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PICKUP / RETURN & DEPOSIT SETTLEMENT MODAL */}
      {quickSettlementTel && (
        <div className="modal-overlay">
          <div
            className="modal-content fade-in"
            style={{
              maxWidth: '480px',
              background: 'var(--bg-card)',
              padding: 0,
              border: '1px solid var(--border)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.15rem 1.4rem',
                borderBottom: '1px solid var(--border)',
                background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {settlementMode === 'pickup'
                  ? 'Record Handover / eSIM Dispatch'
                  : 'Confirm Device Return & Deposit'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickSettlementTel(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickSettlementSubmit} style={{ padding: '1.4rem' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.7rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {quickSettlementTel.nama}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.15rem'
                  }}
                >
                  {quickSettlementTel.typeProduct} · {quickSettlementTel.region}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>
                  {settlementMode === 'pickup'
                    ? 'Pickup / Dispatch Date'
                    : 'Return / Completion Date'}
                </label>
                <input
                  type="date"
                  required
                  value={settlementData.actionDate}
                  onChange={(e) =>
                    setSettlementData({
                      ...settlementData,
                      actionDate: e.target.value
                    })
                  }
                  style={formInputStyle}
                />
              </div>

              {(quickSettlementTel.jumlahDeposit > 0 ||
                quickSettlementTel.depositStatus !== 'None') && (
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label>
                    Security Deposit Status ({formatIdr(quickSettlementTel.jumlahDeposit)})
                  </label>
                  <select
                    value={settlementData.depositStatus}
                    onChange={(e) =>
                      setSettlementData({
                        ...settlementData,
                        depositStatus: e.target.value
                      })
                    }
                    style={formInputStyle}
                  >
                    <option value="Belum">Pending Deposit (Unpaid)</option>
                    <option value="Sudah">Deposit Held (Not Yet Refunded)</option>
                    <option value="Refunded">Deposit Refunded to Traveler</option>
                    <option value="None">No Deposit</option>
                  </select>

                  {(quickSettlementTel.bank || quickSettlementTel.noRekening) && (
                    <div
                      style={{
                        marginTop: '0.6rem',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '0.6rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        <strong>{quickSettlementTel.bank || 'Bank'}</strong> ·{' '}
                        {quickSettlementTel.noRekening || '-'}
                        {quickSettlementTel.namaRekening
                          ? ` (${quickSettlementTel.namaRekening})`
                          : ''}
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleCopyBankSummary(quickSettlementTel)}
                        style={{
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.72rem',
                          background: 'rgba(0, 168, 255, 0.12)',
                          color: 'var(--primary)'
                        }}
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.65rem',
                  marginTop: '1.25rem'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => setQuickSettlementTel(null)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)'
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER INSPECTOR DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(previewTelecom)}
        onClose={() => setPreviewTelId(null)}
        title={previewTelecom ? previewTelecom.nama : 'Order Inspector'}
        subtitle={
          previewTelecom
            ? `${previewTelecom.typeProduct} · ${previewTelecom.region || 'Coverage Unspecified'}`
            : ''
        }
        width="540px"
        footer={
          previewTelecom && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                width: '100%'
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = previewTelecom;
                  setPreviewTelId(null);
                  handleDuplicateTelecom(target);
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)'
                }}
              >
                <Copy size={15} /> Duplicate for Group
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {canEditRecord(previewTelecom.staff) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const target = previewTelecom;
                      setPreviewTelId(null);
                      handleOpenModal(target);
                    }}
                  >
                    <Edit2 size={15} /> Edit Order
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {previewTelecom && (
          <div
            style={{
              padding: '1.35rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem'
            }}
          >
            {/* Status Badges Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {(() => {
                  const lm = getLifecycleMeta(
                    previewTelecom.lifecycleStatus,
                    isLight
                  );
                  const dm = getDepositMeta(
                    previewTelecom.depositStatus,
                    previewTelecom.jumlahDeposit,
                    isLight
                  );
                  return (
                    <>
                      <span
                        className={`badge ${lm.badgeClass}`}
                        style={lm.customStyle || undefined}
                      >
                        {lm.label}
                      </span>
                      <span
                        className={`badge ${dm.badgeClass}`}
                        style={dm.customStyle || undefined}
                      >
                        {dm.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                ID: {previewTelecom.id}
              </span>
            </div>

            {/* 4-Stage Visual Roaming Stepper */}
            {(() => {
              const stage = getTelecomStepperStage(previewTelecom);
              const steps = [
                'Booked',
                'Handed Over',
                'Active Roaming',
                'Returned & Settled'
              ];
              return (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.4rem'
                    }}
                  >
                    {steps.map((label, idx) => {
                      const done = idx <= stage;
                      return (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              height: '6px',
                              borderRadius: '999px',
                              background: done ? 'var(--primary)' : 'var(--border)',
                              marginBottom: '0.45rem'
                            }}
                          />
                          <div
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: done ? 700 : 500,
                              color: done ? 'var(--text-main)' : 'var(--text-muted)'
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quick Workflow Actions */}
            {canEditRecord(previewTelecom.staff) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!previewTelecom.tanggalPengambilan && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      handleOpenQuickSettlement(previewTelecom, 'pickup')
                    }
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: 'rgba(0, 168, 255, 0.12)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(0, 168, 255, 0.28)'
                    }}
                  >
                    <Smartphone size={15} /> Record Pickup / Sent
                  </button>
                )}
                {!previewTelecom.tanggalPengembalian && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      handleOpenQuickSettlement(previewTelecom, 'return')
                    }
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: 'rgba(16, 185, 129, 0.14)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle2 size={15} /> Confirm Return / Complete
                  </button>
                )}
                {previewTelecom.depositStatus === 'Sudah' && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleQuickRefundOnly(previewTelecom)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: 'rgba(245, 158, 11, 0.14)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <DollarSign size={15} /> Mark Deposit Refunded
                  </button>
                )}
              </div>
            )}

            {/* WhatsApp Concierge Templates */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.8rem',
                background: isLight
                  ? 'rgba(16, 185, 129, 0.06)'
                  : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.24)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#10b981',
                  marginBottom: '0.6rem'
                }}
              >
                WhatsApp Traveler Concierge
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleSendPickupWhatsApp(previewTelecom)}
                  style={{
                    flex: '1 1 180px',
                    justifyContent: 'center',
                    background: '#10b981',
                    color: '#ffffff'
                  }}
                >
                  <MessageCircle size={15} /> Pickup / Activation WA
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleSendReturnRefundWhatsApp(previewTelecom)}
                  style={{
                    flex: '1 1 180px',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10b981'
                  }}
                >
                  <MessageCircle size={15} /> Return / Refund WA
                </button>
              </div>
            </div>

            {/* Roaming & Schedule Details */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.9rem'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Phone / WhatsApp
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>{previewTelecom.noTelephone || '-'}</span>
                  {previewTelecom.noTelephone && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          previewTelecom.noTelephone,
                          'Copied phone number'
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Consultant (PIC)
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {previewTelecom.staff || 'Unassigned'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Roaming Start
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatDisplayDate(previewTelecom.tanggalMulai, true)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Roaming End
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatDisplayDate(previewTelecom.tanggalSelesai, true)}
                  {previewTelecom.roamingDays
                    ? ` (${previewTelecom.roamingDays}d)`
                    : ''}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Est. Pickup / Dispatch
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatDisplayDate(previewTelecom.estimasiPengambilan, true)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Actual Pickup / Sent
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatDisplayDate(previewTelecom.tanggalPengambilan, true)}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Device Return / Completion Date
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatDisplayDate(previewTelecom.tanggalPengembalian, true)}
                </div>
              </div>
            </div>

            {/* Deposit & Refund Bank Card */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)'
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
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)'
                  }}
                >
                  Security Deposit &amp; Refund Bank
                </span>
                {(previewTelecom.noRekening || previewTelecom.bank) && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleCopyBankSummary(previewTelecom)}
                    style={{
                      padding: '0.28rem 0.6rem',
                      fontSize: '0.74rem',
                      background: 'rgba(0, 168, 255, 0.12)',
                      color: 'var(--primary)'
                    }}
                  >
                    <Copy size={13} /> Copy Refund Account
                  </button>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Deposit Amount
                  </div>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color:
                        previewTelecom.jumlahDeposit > 0
                          ? 'var(--primary)'
                          : 'var(--text-muted)',
                      marginTop: '0.15rem'
                    }}
                  >
                    {formatIdr(previewTelecom.jumlahDeposit)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Bank Name
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginTop: '0.15rem'
                    }}
                  >
                    {previewTelecom.bank || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Account Number
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginTop: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{previewTelecom.noRekening || '-'}</span>
                    {previewTelecom.noRekening && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            previewTelecom.noRekening,
                            'Copied account number'
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Account Holder
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginTop: '0.15rem'
                    }}
                  >
                    {previewTelecom.namaRekening || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default Telecom;
