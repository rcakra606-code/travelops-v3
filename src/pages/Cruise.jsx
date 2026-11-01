import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import { useCruises } from '../context/CruiseContext';
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
  Ship,
  Anchor,
  MapPin,
  User,
  Phone,
  Mail,
  Ticket,
  BarChart2,
  FileText,
  Users,
  Compass,
  Eye,
  ArrowUpDown,
  Search,
  UploadCloud,
  Moon,
  Copy,
  Share2,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  XCircle,
  CreditCard,
  MessageCircle
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

const POPULAR_CRUISE_BRANDS = [
  'Royal Caribbean',
  'Resorts World Cruises',
  'Disney Cruise Line',
  'Princess Cruises',
  'MSC Cruises',
  'Celebrity Cruises',
  'Norwegian Cruise Line',
  'Costa Cruises'
];

const BRAND_SHIPS_MAP = {
  'Royal Caribbean': [
    'Ovation of the Seas',
    'Anthem of the Seas',
    'Spectrum of the Seas',
    'Quantum of the Seas',
    'Icon of the Seas',
    'Symphony of the Seas'
  ],
  'Resorts World Cruises': ['Genting Dream', 'Resorts World One', 'Star Scorpio'],
  'Disney Cruise Line': ['Disney Adventure', 'Disney Wish', 'Disney Treasure', 'Disney Wonder'],
  'Princess Cruises': ['Diamond Princess', 'Discovery Princess', 'Sun Princess', 'Royal Princess'],
  'MSC Cruises': ['MSC Bellissima', 'MSC World Europa', 'MSC Euribia'],
  'Celebrity Cruises': ['Celebrity Solstice', 'Celebrity Millennium', 'Celebrity Edge', 'Celebrity Ascent'],
  'Norwegian Cruise Line': ['Norwegian Spirit', 'Norwegian Prima', 'Norwegian Encore'],
  'Costa Cruises': ['Costa Serena', 'Costa Toscana', 'Costa Smeralda']
};

const DEFAULT_SHIP_SUGGESTIONS = [
  'Genting Dream',
  'Disney Adventure',
  'Ovation of the Seas',
  'Anthem of the Seas',
  'Diamond Princess',
  'MSC Bellissima'
];

const POPULAR_CABIN_TYPES = [
  '1x Interior Stateroom',
  '1x Oceanview Stateroom',
  '1x Balcony Stateroom',
  '1x Palace / Junior Suite',
  '2x Connecting Balcony'
];

const POPULAR_ROUTES = [
  'Singapore - Penang - Phuket - Singapore',
  'Singapore - Port Klang (KL) - Singapore',
  'Singapore - High Seas - Singapore',
  'Yokohama - Shimizu (Mt. Fuji) - Kobe - Busan - Yokohama',
  'Barcelona - Marseille - Rome - Naples - Barcelona'
];

const VOYAGE_NIGHT_PRESETS = [2, 3, 4, 5, 7, 10];
const PAYMENT_LEAD_PRESETS = [90, 60, 45, 30];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['#00a8ff', '#38bdf8', '#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

const IMPORT_TEMPLATE_HEADERS = [
  'Cruise Brand',
  'Ship Name',
  'Reservation Code',
  'Cabin / Category',
  'Sailing Start',
  'Sailing End',
  'Final Payment Date',
  'Route',
  'Lead Passenger (PIC)',
  'Accompanying Passengers',
  'Phone Number',
  'Email',
  'Staff',
  'Status'
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

const calculateVoyageNights = (sailingStart, sailingEnd) => {
  const inDate = parseLocalDay(sailingStart);
  const outDate = parseLocalDay(sailingEnd);
  if (!inDate || !outDate) return null;
  const diff = Math.round((outDate - inDate) / 86400000);
  return diff >= 0 ? diff : null;
};

const formatDisplayDate = (dateStr, includeYear = true) => {
  const d = parseLocalDay(dateStr);
  if (!d) return dateStr || '-';
  return d.toLocaleDateString(
    'en-GB',
    includeYear ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' }
  );
};

const isCancelledCruise = (status) => status === 'Cancel' || status === 'Cancelled';

const getDayDiffFromToday = (dateStr) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const splitPassengerInput = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/[\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
};

const buildWhatsAppLink = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}`;
};

const getStatusMeta = (status, isLight) => {
  if (status === 'Active') {
    return {
      label: 'At Sea',
      badgeClass: 'badge-success',
      customStyle: null,
      dotColor: '#10b981'
    };
  }
  if (status === 'Upcoming') {
    return {
      label: 'Upcoming',
      badgeClass: 'badge-primary',
      customStyle: null,
      dotColor: '#00a8ff'
    };
  }
  if (isCancelledCruise(status)) {
    return {
      label: 'Cancelled',
      badgeClass: 'badge-danger',
      customStyle: null,
      dotColor: '#ef4444'
    };
  }
  return {
    label: 'Completed',
    badgeClass: '',
    customStyle: {
      background: isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.14)',
      color: isLight ? '#475569' : '#94a3b8',
      border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)'}`
    },
    dotColor: '#64748b'
  };
};

const CruiseChartTooltip = ({ active, payload, label, isLight }) => {
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

const Cruise = () => {
  const {
    cruises,
    addCruise,
    updateCruise,
    deleteCruise,
    bulkUpdateCruiseStatus,
    bulkDeleteCruises,
    bulkImportCruises
  } = useCruises();
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

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
  const [tableScope, setTableScope] = useState('all'); // 'all' | 'active' | 'soon' | 'payment_due' | 'missing_ref' | 'mine' | 'past' | 'cancelled'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal & Drawer state
  const [isModalOpen, setIsModalOpen] = useState(() => Boolean(location.state?.openNew));
  const [editingCruise, setEditingCruise] = useState(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewCruiseId, setPreviewCruiseId] = useState(null);
  const [participantInput, setParticipantInput] = useState('');

  const buildEmptyForm = (prefillDate = '') => ({
    cruiseBrand: '',
    shipName: '',
    cruiseLine: '',
    sailingStart: prefillDate || '',
    sailingEnd: prefillDate ? addDaysToDateStr(prefillDate, 3) : '',
    finalPaymentDate: '',
    route: '',
    picName: '',
    participants: [],
    phoneNumber: '',
    email: '',
    reservationCode: '',
    staff: defaultStaffName,
    statusMode: 'AUTO'
  });

  const [formData, setFormData] = useState(() =>
    buildEmptyForm(location.state?.prefillDate || '')
  );

  const previewCruise = useMemo(
    () => cruises.find((c) => c.id === previewCruiseId) || null,
    [cruises, previewCruiseId]
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleOpenModal = (cruise = null) => {
    setIsDuplicateMode(false);
    setParticipantInput('');
    if (cruise) {
      setEditingCruise(cruise);
      setFormData({
        cruiseBrand: cruise.cruiseBrand || '',
        shipName: cruise.shipName || '',
        cruiseLine: cruise.cruiseLine || '',
        sailingStart: cruise.sailingStart || '',
        sailingEnd: cruise.sailingEnd || '',
        finalPaymentDate: cruise.finalPaymentDate || '',
        route: cruise.route || '',
        picName: cruise.picName || '',
        participants: Array.isArray(cruise.participants) ? [...cruise.participants] : [],
        phoneNumber: cruise.phoneNumber || '',
        email: cruise.email || '',
        reservationCode: cruise.reservationCode || cruise.bookingRef || '',
        staff: cruise.staff || defaultStaffName,
        statusMode: isCancelledCruise(cruise.status) ? 'Cancelled' : 'AUTO'
      });
    } else {
      setEditingCruise(null);
      setFormData(buildEmptyForm(''));
    }
    setIsModalOpen(true);
  };

  const handleDuplicateCabin = (cruise) => {
    if (!cruise) return;
    setEditingCruise(null);
    setIsDuplicateMode(true);
    setParticipantInput('');
    setFormData({
      cruiseBrand: cruise.cruiseBrand || '',
      shipName: cruise.shipName || '',
      cruiseLine: cruise.cruiseLine || '',
      sailingStart: cruise.sailingStart || '',
      sailingEnd: cruise.sailingEnd || '',
      finalPaymentDate: cruise.finalPaymentDate || '',
      route: cruise.route || '',
      picName: '',
      participants: [],
      phoneNumber: '',
      email: '',
      reservationCode: '',
      staff: defaultStaffName || cruise.staff || '',
      statusMode: 'AUTO'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCruise(null);
    setIsDuplicateMode(false);
    setParticipantInput('');
  };

  const handleAddParticipantsFromInput = () => {
    const names = splitPassengerInput(participantInput);
    if (names.length === 0) return;
    setFormData((prev) => {
      const existingLower = new Set(prev.participants.map((p) => p.toLowerCase()));
      const additions = names.filter((n) => !existingLower.has(n.toLowerCase()));
      return {
        ...prev,
        participants: [...prev.participants, ...additions]
      };
    });
    setParticipantInput('');
  };

  const handleParticipantKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipantsFromInput();
    }
  };

  const removeParticipant = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const handleApplyNightPreset = (nights) => {
    const baseStart = formData.sailingStart || toDateInputStr(new Date());
    const nextEnd = addDaysToDateStr(baseStart, nights);
    setFormData((prev) => ({
      ...prev,
      sailingStart: baseStart,
      sailingEnd: nextEnd
    }));
  };

  const handleApplyPaymentLead = (daysBefore) => {
    if (!formData.sailingStart) {
      toast.info('Select a Sailing Start date first to calculate payment deadline.');
      return;
    }
    const deadline = addDaysToDateStr(formData.sailingStart, -daysBefore);
    setFormData((prev) => ({
      ...prev,
      finalPaymentDate: deadline
    }));
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

  const getVoyagePortalPath = (cruise) => {
    const code = (cruise?.reservationCode || cruise?.bookingRef || '').trim() || cruise?.id || '';
    return code ? `/track/${encodeURIComponent(code)}` : '';
  };

  const handleCopyVoyagePortal = (cruise) => {
    const path = getVoyagePortalPath(cruise);
    if (!path) return;
    const url = `${window.location.origin}${path}`;
    handleCopyText(
      url,
      `Voyage Pass link copied for ${cruise.shipName || cruise.cruiseBrand || 'sailing'}`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cruiseBrand.trim() || !formData.shipName.trim()) {
      toast.warning('Please enter both Cruise Brand and Ship Name.');
      return;
    }
    if (!formData.sailingStart || !formData.sailingEnd) {
      toast.warning('Please select both Sailing Start and Sailing End dates.');
      return;
    }
    const nights = calculateVoyageNights(formData.sailingStart, formData.sailingEnd);
    if (nights === null) {
      toast.error('Sailing End date must be on or after the Sailing Start date.');
      return;
    }
    if (!formData.picName.trim()) {
      toast.warning('Please enter the Lead Passenger (PIC) name.');
      return;
    }

    // Merge any un-submitted text in participantInput
    let mergedParticipants = [...formData.participants];
    if (participantInput.trim()) {
      const extra = splitPassengerInput(participantInput);
      const existingLower = new Set(mergedParticipants.map((p) => p.toLowerCase()));
      extra.forEach((name) => {
        if (!existingLower.has(name.toLowerCase())) {
          mergedParticipants.push(name);
          existingLower.add(name.toLowerCase());
        }
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cruiseBrand: formData.cruiseBrand.trim(),
        shipName: formData.shipName.trim(),
        cruiseLine: formData.cruiseLine.trim(),
        sailingStart: formData.sailingStart,
        sailingEnd: formData.sailingEnd,
        finalPaymentDate: formData.finalPaymentDate || null,
        route: formData.route.trim(),
        picName: formData.picName.trim(),
        participants: mergedParticipants,
        paxCount: 1 + mergedParticipants.length,
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        reservationCode: formData.reservationCode.trim(),
        staff: formData.staff || defaultStaffName,
        status: formData.statusMode === 'Cancelled' ? 'Cancelled' : 'AUTO'
      };

      if (editingCruise) {
        await updateCruise(editingCruise.id, payload);
        toast.success(`Updated voyage on ${payload.shipName} (${payload.picName}).`);
      } else {
        await addCruise(payload);
        toast.success(`Created cruise booking on ${payload.shipName} (${payload.picName}).`);
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err?.message || 'Failed to save cruise booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cruise) => {
    if (
      !window.confirm(
        `Delete cruise booking for "${cruise.picName}" on ${cruise.shipName || cruise.cruiseBrand}?`
      )
    ) {
      return;
    }
    try {
      await deleteCruise(cruise.id);
      if (previewCruiseId === cruise.id) setPreviewCruiseId(null);
      setSelectedIds((prev) => prev.filter((item) => item !== cruise.id));
      toast.success(`Deleted booking for "${cruise.picName}".`);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete cruise booking.');
    }
  };

  const handleBulkStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateCruiseStatus(selectedIds, targetStatus);
      toast.success(
        targetStatus === 'Cancelled'
          ? `Marked ${selectedIds.length} voyage(s) as Cancelled.`
          : `Synced voyage status for ${selectedIds.length} booking(s).`
      );
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk status update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected cruise booking(s)?`)) {
      return;
    }
    try {
      await bulkDeleteCruises(selectedIds);
      if (previewCruiseId && selectedIds.includes(previewCruiseId)) {
        setPreviewCruiseId(null);
      }
      toast.success(`Deleted ${selectedIds.length} cruise booking(s).`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk delete failed.');
    }
  };

  const handleCsvImport = async (rows) => {
    try {
      const count = await bulkImportCruises(rows, defaultStaffName);
      toast.success(`Imported ${count} cruise booking(s) successfully!`);
      setShowImport(false);
      setActiveTab('database');
    } catch (err) {
      toast.error(err?.message || 'Failed to import spreadsheet.');
    }
  };

  // Enrich cruises with computed voyage nights, totalPax, passenger manifest text, and countdowns
  const enrichedCruises = useMemo(() => {
    return cruises.map((c) => {
      const participants = Array.isArray(c.participants) ? c.participants : [];
      const totalPax =
        participants.length > 0
          ? 1 + participants.length
          : Math.max(1, Number(c.paxCount) || 1);
      const nights = calculateVoyageNights(c.sailingStart, c.sailingEnd) ?? 0;
      const paxNights = Math.max(nights, 1) * totalPax;
      const diffSailing = getDayDiffFromToday(c.sailingStart);
      const diffPayment = getDayDiffFromToday(c.finalPaymentDate);
      const refCode = (c.reservationCode || c.bookingRef || '').trim();
      const hasRef = Boolean(refCode);
      const sailingYear =
        c.sailingStart && /^\d{4}/.test(c.sailingStart) ? c.sailingStart.substring(0, 4) : '';
      const isCanc = isCancelledCruise(c.status);

      // Payment is due soon if sailing hasn't completed/cancelled and finalPaymentDate is <= 14 days from today (including overdue)
      const isPaymentUrgent =
        !isCanc &&
        c.status !== 'Past Date' &&
        Boolean(c.finalPaymentDate) &&
        diffPayment !== null &&
        diffPayment <= 14;

      const accompanyingText = participants.join(', ');
      const allPassengersText = [c.picName, ...participants].filter(Boolean).join(', ');

      return {
        ...c,
        refCode,
        hasRef,
        participants,
        totalPax,
        nights,
        paxNights: nights > 0 ? paxNights : 0,
        diffSailing,
        diffPayment,
        isPaymentUrgent,
        sailingYear,
        accompanyingText,
        allPassengersText
      };
    });
  }, [cruises]);

  const availableYears = useMemo(() => {
    const set = new Set();
    enrichedCruises.forEach((c) => {
      if (c.sailingYear) set.add(c.sailingYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [enrichedCruises]);

  // Scope counts for All Voyages pills
  const scopeCounts = useMemo(() => {
    let active = 0;
    let soon = 0;
    let paymentDue = 0;
    let missingRef = 0;
    let mine = 0;
    let past = 0;
    let cancelled = 0;

    enrichedCruises.forEach((c) => {
      const isCanc = isCancelledCruise(c.status);
      if (isCanc) {
        cancelled += 1;
      } else {
        if (c.status === 'Active' || c.status === 'Upcoming') active += 1;
        if (
          c.status === 'Active' ||
          (c.diffSailing !== null && c.diffSailing >= 0 && c.diffSailing <= 14)
        ) {
          soon += 1;
        }
        if (c.isPaymentUrgent) {
          paymentDue += 1;
        }
        if (!c.hasRef && c.status !== 'Past Date') {
          missingRef += 1;
        }
        if (c.status === 'Past Date') {
          past += 1;
        }
      }
      if (currentUserName && c.staff === currentUserName) {
        mine += 1;
      }
    });

    return {
      all: enrichedCruises.length,
      active,
      soon,
      payment_due: paymentDue,
      missing_ref: missingRef,
      mine,
      past,
      cancelled
    };
  }, [enrichedCruises, currentUserName]);

  const scopedCruises = useMemo(() => {
    return enrichedCruises.filter((c) => {
      const isCanc = isCancelledCruise(c.status);
      if (tableScope === 'active') return !isCanc && (c.status === 'Active' || c.status === 'Upcoming');
      if (tableScope === 'soon') {
        return (
          !isCanc &&
          (c.status === 'Active' ||
            (c.diffSailing !== null && c.diffSailing >= 0 && c.diffSailing <= 14))
        );
      }
      if (tableScope === 'payment_due') return c.isPaymentUrgent;
      if (tableScope === 'missing_ref') return !isCanc && c.status !== 'Past Date' && !c.hasRef;
      if (tableScope === 'mine') return Boolean(currentUserName) && c.staff === currentUserName;
      if (tableScope === 'past') return !isCanc && c.status === 'Past Date';
      if (tableScope === 'cancelled') return isCanc;
      return true;
    });
  }, [enrichedCruises, tableScope, currentUserName]);

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
  } = useDataTable(scopedCruises, { key: 'sailingStart', direction: 'desc' }, 10);

  const exportableTableData = useMemo(() => {
    let list = [...scopedCruises];
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      list = list.filter((item) =>
        [
          item.cruiseBrand,
          item.shipName,
          item.refCode,
          item.cruiseLine,
          item.route,
          item.picName,
          item.allPassengersText,
          item.phoneNumber,
          item.email,
          item.staff,
          item.status
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
  }, [scopedCruises, globalSearch, filters]);

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

  const drillIntoVoyages = ({ scope = 'all', search = '' }) => {
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
        ? enrichedCruises
        : enrichedCruises.filter((c) => c.sailingYear === selectedYear);

    const nonCancelled = yearFiltered.filter((c) => !isCancelledCruise(c.status));
    const atSeaList = nonCancelled.filter((c) => c.status === 'Active');
    const upcomingList = nonCancelled.filter((c) => c.status === 'Upcoming');
    const sailing14d = upcomingList.filter(
      (c) => c.diffSailing !== null && c.diffSailing >= 0 && c.diffSailing <= 14
    );
    const paymentDueList = nonCancelled.filter((c) => c.isPaymentUrgent);
    const missingRefList = nonCancelled.filter(
      (c) => c.status !== 'Past Date' && !c.hasRef
    );

    const totalPassengers = nonCancelled.reduce((sum, c) => sum + c.totalPax, 0);
    const totalPaxNights = nonCancelled.reduce((sum, c) => sum + c.paxNights, 0);
    const totalVoyageNights = nonCancelled.reduce((sum, c) => sum + c.nights, 0);
    const avgNights =
      nonCancelled.length > 0 ? (totalVoyageNights / nonCancelled.length).toFixed(1) : '0.0';

    // Actionable Radar: At Sea, Sailing in <= 14d, or Final Payment Due in <= 14d
    const radarVoyages = enrichedCruises
      .filter(
        (c) =>
          !isCancelledCruise(c.status) &&
          (c.status === 'Active' ||
            (c.diffSailing !== null && c.diffSailing >= 0 && c.diffSailing <= 14) ||
            c.isPaymentUrgent)
      )
      .sort((a, b) => (a.sailingStart || '').localeCompare(b.sailingStart || ''))
      .slice(0, 6);

    // Monthly Sailings & Passengers
    const monthlyBuckets = MONTH_LABELS.map((m) => ({
      month: m,
      Sailings: 0,
      Passengers: 0
    }));
    nonCancelled.forEach((c) => {
      const d = parseLocalDay(c.sailingStart);
      if (d) {
        const idx = d.getMonth();
        monthlyBuckets[idx].Sailings += 1;
        monthlyBuckets[idx].Passengers += c.totalPax;
      }
    });

    // Cruise Brands Breakdown
    const brandCounts = {};
    nonCancelled.forEach((c) => {
      const brand = c.cruiseBrand || 'Other Line';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    const brandData = Object.keys(brandCounts)
      .map((name, idx) => ({
        name,
        value: brandCounts[name],
        pct:
          nonCancelled.length > 0
            ? Math.round((brandCounts[name] / nonCancelled.length) * 100)
            : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Bookings by Consultant (PIC)
    const staffCounts = {};
    nonCancelled.forEach((c) => {
      const s = c.staff || 'Unassigned';
      if (!staffCounts[s]) {
        const parts = s.trim().split(/\s+/);
        const label = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        staffCounts[s] = { fullName: s, name: label, Bookings: 0, Passengers: 0 };
      }
      staffCounts[s].Bookings += 1;
      staffCounts[s].Passengers += c.totalPax;
    });
    const staffData = Object.values(staffCounts).sort((a, b) => b.Bookings - a.Bookings);

    // Top Ships Ranking
    const shipCounts = {};
    nonCancelled.forEach((c) => {
      const ship = (c.shipName || c.cruiseBrand || 'Unspecified Ship').trim();
      if (!shipCounts[ship]) {
        shipCounts[ship] = {
          name: ship,
          brand: c.cruiseBrand || '',
          bookings: 0,
          pax: 0
        };
      }
      shipCounts[ship].bookings += 1;
      shipCounts[ship].pax += c.totalPax;
    });
    const shipData = Object.values(shipCounts)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6);

    return {
      nonCancelledCount: nonCancelled.length,
      atSeaCount: atSeaList.length,
      upcomingCount: upcomingList.length,
      activeAndUpcomingCount: atSeaList.length + upcomingList.length,
      sailing14dCount: sailing14d.length,
      paymentDueCount: paymentDueList.length,
      missingRefCount: missingRefList.length,
      totalPassengers,
      totalPaxNights,
      avgNights,
      radarVoyages,
      monthlyBuckets,
      brandData,
      staffData,
      shipData
    };
  }, [enrichedCruises, selectedYear]);

  const exportColumns = [
    { header: 'Cruise Brand', key: 'cruiseBrand', format: null },
    { header: 'Ship Name', key: 'shipName', format: null },
    { header: 'Reservation Code', key: 'refCode', format: null },
    { header: 'Cabin / Category', key: 'cruiseLine', format: null },
    { header: 'Sailing Start', key: 'sailingStart', format: null },
    { header: 'Sailing End', key: 'sailingEnd', format: null },
    { header: 'Nights', key: 'nights', format: null },
    { header: 'Final Payment Date', key: 'finalPaymentDate', format: null },
    { header: 'Route', key: 'route', format: null },
    { header: 'Lead Passenger (PIC)', key: 'picName', format: null },
    { header: 'Accompanying Passengers', key: 'accompanyingText', format: null },
    { header: 'Total Pax', key: 'totalPax', format: null },
    { header: 'Phone Number', key: 'phoneNumber', format: null },
    { header: 'Email', key: 'email', format: null },
    { header: 'Staff', key: 'staff', format: null },
    { header: 'Status', key: 'status', format: null }
  ];

  // Page-level selection helpers
  const pageIds = paginatedData.map((c) => c.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
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

  const formNights = calculateVoyageNights(formData.sailingStart, formData.sailingEnd);
  const pendingTypedPax = splitPassengerInput(participantInput).length;
  const formTotalPax = 1 + formData.participants.length + pendingTypedPax;
  const shipSuggestions =
    BRAND_SHIPS_MAP[formData.cruiseBrand] || DEFAULT_SHIP_SUGGESTIONS;

  const subtleSurface = isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.05)';
  const chipBg = isLight ? '#f0f7ff' : 'rgba(56, 189, 248, 0.08)';
  const chipBorder = isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.22)';

  const fieldStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    borderRadius: '0.6rem',
    width: '100%',
    padding: '0.7rem 0.9rem',
    outline: 'none',
    fontSize: '0.875rem'
  };

  const iconFieldStyle = {
    ...fieldStyle,
    paddingLeft: '2.35rem'
  };

  const iconAdornmentStyle = {
    position: 'absolute',
    left: '0.8rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--primary)',
    pointerEvents: 'none'
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
                <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  Cruise Management
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Manage cruise lines, cabin categories, passenger manifests, final payment deadlines, and digital Voyage Passes.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowImport((prev) => !prev)}
                  style={{
                    background: showImport
                      ? 'rgba(0, 168, 255, 0.14)'
                      : isLight
                      ? '#ffffff'
                      : 'var(--bg-surface)',
                    border: `1px solid ${showImport ? 'var(--primary)' : 'var(--border)'}`,
                    color: showImport ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <UploadCloud size={17} /> Import Excel / CSV
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={18} /> Add Cruise Booking
                </button>
              </div>
            </div>

            {/* Collapsible Spreadsheet Import */}
            {showImport && (
              <CsvImportUtility
                onImport={handleCsvImport}
                templateHeaders={IMPORT_TEMPLATE_HEADERS}
              />
            )}

            {/* Navigation Tabs + Period / Export Controls */}
            <div
              className="tabs-container"
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap',
                paddingBottom: '0.15rem'
              }}
            >
              <button
                type="button"
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart2 size={16} /> Overview & Sailings
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <FileText size={16} /> All Voyages
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background:
                      activeTab === 'database'
                        ? 'rgba(0, 168, 255, 0.18)'
                        : isLight
                        ? '#e2e8f0'
                        : 'rgba(148, 163, 184, 0.16)',
                    color: activeTab === 'database' ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  {cruises.length}
                </span>
              </button>

              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                  paddingBottom: '0.4rem'
                }}
              >
                {activeTab === 'dashboard' && availableYears.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.65)',
                      padding: '0.22rem',
                      borderRadius: '999px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {['All', ...availableYears].map((yr) => {
                      const active = selectedYear === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setSelectedYear(yr)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.28rem 0.7rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: active ? 'var(--primary)' : 'transparent',
                            color: active ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {yr === 'All' ? 'All Years' : yr}
                        </button>
                      );
                    })}
                  </div>
                )}

                <ExportMenu
                  data={activeTab === 'database' ? exportableTableData : enrichedCruises}
                  columns={exportColumns}
                  filename={activeTab === 'database' ? 'Cruise_Voyages_Filtered' : 'Cruise_Voyages_All'}
                />
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="fade-in">
                {/* 5 Maritime KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. At Sea & Upcoming Sailings */}
                  <div
                    className="card"
                    onClick={() => drillIntoVoyages({ scope: 'active' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid var(--primary)'
                    }}
                    title="Click to view At Sea & Upcoming voyages"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.45rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        At Sea & Upcoming
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: 'rgba(0, 168, 255, 0.12)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Compass size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.activeAndUpcomingCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem' }}>
                      {overviewMetrics.atSeaCount > 0
                        ? `${overviewMetrics.atSeaCount} at sea · ${overviewMetrics.sailing14dCount} sailing in 14d`
                        : `${overviewMetrics.sailing14dCount} embarking in next 14 days`}
                    </div>
                  </div>

                  {/* 2. Total Cruise Passengers */}
                  <div
                    className="card"
                    style={{
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #10b981'
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
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Total Passengers
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Users size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.totalPassengers}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Across {overviewMetrics.nonCancelledCount} confirmed bookings
                    </div>
                  </div>

                  {/* 3. Total Passenger-Nights */}
                  <div
                    className="card"
                    style={{
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #38bdf8'
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
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Passenger-Nights
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: 'rgba(56, 189, 248, 0.14)',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Moon size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.totalPaxNights}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Avg {overviewMetrics.avgNights} nights per voyage
                    </div>
                  </div>

                  {/* 4. Final Payment Deadlines (14d) */}
                  <div
                    className="card"
                    onClick={() => drillIntoVoyages({ scope: 'payment_due' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: `3px solid ${overviewMetrics.paymentDueCount > 0 ? '#f59e0b' : '#10b981'}`
                    }}
                    title="Click to inspect bookings with final payment due within 14 days"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.45rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Payment Due (14d)
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background:
                            overviewMetrics.paymentDueCount > 0
                              ? 'rgba(245, 158, 11, 0.14)'
                              : 'rgba(16, 185, 129, 0.12)',
                          color: overviewMetrics.paymentDueCount > 0 ? '#f59e0b' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CreditCard size={17} />
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: overviewMetrics.paymentDueCount > 0 ? '#f59e0b' : 'var(--text-main)',
                        lineHeight: 1.1
                      }}
                    >
                      {overviewMetrics.paymentDueCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {overviewMetrics.paymentDueCount > 0
                        ? 'Click to review deadlines ->'
                        : 'No urgent payment deadlines'}
                    </div>
                  </div>

                  {/* 5. Missing Booking Ref */}
                  <div
                    className="card"
                    onClick={() => drillIntoVoyages({ scope: 'missing_ref' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: `3px solid ${overviewMetrics.missingRefCount > 0 ? '#f59e0b' : '#10b981'}`
                    }}
                    title="Click to follow up bookings missing a cruise reservation code"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.45rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Missing Booking Ref
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background:
                            overviewMetrics.missingRefCount > 0
                              ? 'rgba(245, 158, 11, 0.14)'
                              : 'rgba(16, 185, 129, 0.12)',
                          color: overviewMetrics.missingRefCount > 0 ? '#f59e0b' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {overviewMetrics.missingRefCount > 0 ? (
                          <AlertTriangle size={17} />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: overviewMetrics.missingRefCount > 0 ? '#f59e0b' : 'var(--text-main)',
                        lineHeight: 1.1
                      }}
                    >
                      {overviewMetrics.missingRefCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {overviewMetrics.missingRefCount > 0
                        ? 'Click to input cruise refs ->'
                        : 'All active bookings confirmed'}
                    </div>
                  </div>
                </div>

                {/* Actionable Upcoming Sailings & Final Payment Radar */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.4rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <CalendarDays size={18} color="var(--primary)" />
                        Upcoming Embarkations & Final Payment Radar (Next 14 Days)
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Monitor active voyages, upcoming sailings, final payment deadlines, and share digital Voyage Passes.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => drillIntoVoyages({ scope: 'soon' })}
                      style={{
                        padding: '0.42rem 0.85rem',
                        fontSize: '0.8rem',
                        background: subtleSurface,
                        border: `1px solid ${chipBorder}`,
                        color: 'var(--primary)'
                      }}
                    >
                      Open 14-Day Queue ({scopeCounts.soon})
                    </button>
                  </div>

                  {overviewMetrics.radarVoyages.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {overviewMetrics.radarVoyages.map((voyage) => {
                        const isAtSea = voyage.status === 'Active';
                        const sailLabel = isAtSea
                          ? 'At Sea'
                          : voyage.diffSailing === 0
                          ? 'Sails Today'
                          : voyage.diffSailing === 1
                          ? 'Tomorrow'
                          : voyage.diffSailing !== null && voyage.diffSailing > 1
                          ? `Sails in ${voyage.diffSailing}d`
                          : 'Upcoming';

                        return (
                          <div
                            key={voyage.id}
                            onClick={() => setPreviewCruiseId(voyage.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              flexWrap: 'wrap',
                              padding: '0.8rem 1rem',
                              borderRadius: '0.75rem',
                              background: subtleSurface,
                              border: '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '250px', flex: 1 }}>
                              <span
                                style={{
                                  padding: '0.28rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  background: isAtSea
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : voyage.diffSailing !== null && voyage.diffSailing <= 2
                                    ? 'rgba(245, 158, 11, 0.16)'
                                    : 'rgba(0, 168, 255, 0.14)',
                                  color: isAtSea
                                    ? '#10b981'
                                    : voyage.diffSailing !== null && voyage.diffSailing <= 2
                                    ? '#f59e0b'
                                    : 'var(--primary)'
                                }}
                              >
                                {sailLabel}
                              </span>

                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    fontSize: '0.92rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <span>{voyage.shipName || voyage.cruiseBrand}</span>
                                  {voyage.cruiseBrand && voyage.shipName && (
                                    <span style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>
                                      · {voyage.cruiseBrand}
                                    </span>
                                  )}
                                  {voyage.isPaymentUrgent && (
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '0.1rem 0.48rem',
                                        borderRadius: '999px',
                                        background:
                                          voyage.diffPayment < 0
                                            ? 'rgba(239, 68, 68, 0.14)'
                                            : 'rgba(245, 158, 11, 0.16)',
                                        color: voyage.diffPayment < 0 ? '#ef4444' : '#f59e0b'
                                      }}
                                    >
                                      {voyage.diffPayment < 0
                                        ? `Pay Due ${Math.abs(voyage.diffPayment)}d ago`
                                        : voyage.diffPayment === 0
                                        ? 'Payment Due Today'
                                        : `Payment Due in ${voyage.diffPayment}d`}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {formatDisplayDate(voyage.sailingStart, false)} → {formatDisplayDate(voyage.sailingEnd, true)}
                                  {voyage.nights > 0 ? ` (${voyage.nights}N)` : ''}
                                  {voyage.cruiseLine ? ` · ${voyage.cruiseLine}` : ''}
                                  {` · ${voyage.picName || 'Guest'} (${voyage.totalPax} Pax)`}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {voyage.hasRef ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(voyage.refCode, `Copied Ref ${voyage.refCode}`)
                                  }
                                  style={{
                                    border: `1px solid ${chipBorder}`,
                                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
                                    color: 'var(--text-main)',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                  title="Click to copy reservation code"
                                >
                                  <Ticket size={12} color="var(--primary)" /> {voyage.refCode}
                                </button>
                              ) : canEditRecord(voyage.staff) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(voyage)}
                                  style={{
                                    border: '1px dashed rgba(245, 158, 11, 0.55)',
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    color: '#f59e0b',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  + Input Ref
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                  Pending Ref
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn"
                                onClick={() => handleCopyVoyagePortal(voyage)}
                                style={{
                                  padding: '0.36rem 0.6rem',
                                  background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--primary)'
                                }}
                                title="Copy Cruise Voyage Pass Link"
                              >
                                <Share2 size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn"
                                onClick={() => setPreviewCruiseId(voyage.id)}
                                style={{
                                  padding: '0.36rem 0.6rem',
                                  background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-main)'
                                }}
                                title="Inspect Voyage"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '1.4rem',
                        textAlign: 'center',
                        borderRadius: '0.75rem',
                        background: subtleSurface,
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem'
                      }}
                    >
                      No cruise embarkations, active voyages, or urgent final payments within the next 14 days.
                    </div>
                  )}
                </div>

                {/* Analytics Grid (2x2 Responsive) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. Monthly Sailings & Passengers Trend */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)'
                      }}
                    >
                      <BarChart2 size={18} color="var(--primary)" />
                      Monthly Sailings & Passengers ({selectedYear === 'All' ? 'All Years' : selectedYear})
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.nonCancelledCount > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.monthlyBuckets} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<CruiseChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Sailings" fill="#00a8ff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Passengers" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No sailing activity for this period.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Bookings by Consultant */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)'
                      }}
                    >
                      <Users size={18} color="var(--primary)" />
                      Bookings by Consultant (PIC)
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.staffData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.staffData} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<CruiseChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Bookings" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Passengers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No consultant data available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Cruise Brands Distribution (Clickable Drill-Down) */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)'
                      }}
                    >
                      <Ship size={18} color="var(--primary)" />
                      Cruise Brands Breakdown
                    </h3>
                    {overviewMetrics.brandData.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1rem', alignItems: 'center', minHeight: '240px' }}>
                        <div style={{ height: '180px', width: '160px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={overviewMetrics.brandData.slice(0, 7)}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={72}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {overviewMetrics.brandData.slice(0, 7).map((entry, idx) => (
                                  <Cell key={`brand-cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<CruiseChartTooltip isLight={isLight} />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {overviewMetrics.brandData.slice(0, 6).map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => drillIntoVoyages({ scope: 'all', search: item.name })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: subtleSurface,
                                border: '1px solid var(--border)',
                                borderRadius: '0.55rem',
                                padding: '0.42rem 0.7rem',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem'
                              }}
                              title={`Filter voyages on ${item.name}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
                                <span
                                  style={{
                                    width: '9px',
                                    height: '9px',
                                    borderRadius: '50%',
                                    background: item.color
                                  }}
                                />
                                {item.name}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                                {item.value} ({item.pct}%)
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No cruise brand records yet.
                      </div>
                    )}
                  </div>

                  {/* 4. Top Ships Ranking */}
                  <div className="card">
                    <h3
                      style={{
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)'
                      }}
                    >
                      <Anchor size={18} color="var(--primary)" />
                      Most Booked Cruise Ships
                    </h3>
                    {overviewMetrics.shipData.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center', minHeight: '240px' }}>
                        {overviewMetrics.shipData.map((ship) => {
                          const maxBookings = Math.max(overviewMetrics.shipData[0]?.bookings || 1, 1);
                          const widthPct = Math.max(8, Math.round((ship.bookings / maxBookings) * 100));
                          return (
                            <div
                              key={ship.name}
                              onClick={() => drillIntoVoyages({ scope: 'all', search: ship.name })}
                              style={{ cursor: 'pointer' }}
                              title={`Filter voyages on ${ship.name}`}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.82rem',
                                  marginBottom: '0.28rem'
                                }}
                              >
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {ship.name}
                                  {ship.brand && ship.brand !== ship.name ? (
                                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                                      {' '}· {ship.brand}
                                    </span>
                                  ) : null}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {ship.bookings} {ship.bookings === 1 ? 'cabin' : 'cabins'} · {ship.pax} Pax
                                </span>
                              </div>
                              <div
                                style={{
                                  height: '8px',
                                  borderRadius: '999px',
                                  background: isLight ? '#e2e8f0' : 'rgba(148, 163, 184, 0.14)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${widthPct}%`,
                                    height: '100%',
                                    borderRadius: '999px',
                                    background: 'linear-gradient(90deg, #00a8ff, #38bdf8)'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No ship records yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ALL VOYAGES TAB */
              <div className="fade-in">
                {/* Scope Pills + Unified Instant Search */}
                <div
                  className="card"
                  style={{
                    padding: '1rem 1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9rem'
                  }}
                >
                  {/* Scope Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All Voyages', count: scopeCounts.all },
                      { id: 'active', label: 'At Sea & Upcoming', count: scopeCounts.active },
                      { id: 'soon', label: 'Sailing Soon (14d)', count: scopeCounts.soon },
                      { id: 'payment_due', label: 'Payment Due (14d)', count: scopeCounts.payment_due },
                      { id: 'missing_ref', label: 'Missing Ref', count: scopeCounts.missing_ref },
                      { id: 'mine', label: 'My Bookings', count: scopeCounts.mine },
                      { id: 'past', label: 'Completed', count: scopeCounts.past },
                      { id: 'cancelled', label: 'Cancelled', count: scopeCounts.cancelled }
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
                            border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background: active
                              ? 'rgba(0, 168, 255, 0.14)'
                              : isLight
                              ? '#f8fafc'
                              : 'rgba(15, 23, 42, 0.45)',
                            color: active ? 'var(--primary)' : 'var(--text-main)',
                            borderRadius: '999px',
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.78rem',
                            fontWeight: active ? 700 : 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{pill.label}</span>
                          <span
                            style={{
                              padding: '0.06rem 0.44rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: active
                                ? 'var(--primary)'
                                : isLight
                                ? '#e2e8f0'
                                : 'rgba(148, 163, 184, 0.18)',
                              color: active ? '#ffffff' : 'var(--text-muted)'
                            }}
                          >
                            {pill.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Unified Search Input + Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search cruise line, ship, reservation code, cabin, route, lead PIC, passenger names, phone, or staff..."
                        value={globalSearch}
                        onChange={(e) => handleGlobalSearch(e.target.value)}
                        style={{
                          ...fieldStyle,
                          paddingLeft: '2.45rem',
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
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Clear search"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="btn"
                        onClick={handleResetAllFilters}
                        style={{
                          background: subtleSurface,
                          border: `1px solid ${chipBorder}`,
                          color: 'var(--primary)',
                          padding: '0.62rem 0.95rem',
                          fontSize: '0.82rem'
                        }}
                      >
                        <RotateCcw size={15} /> Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Bulk Selection Bar */}
                  {selectedIds.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '0.65rem',
                        background: isLight ? '#eef7ff' : 'rgba(0, 168, 255, 0.1)',
                        border: '1px solid rgba(0, 168, 255, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <span>{selectedIds.length} voyage(s) selected</span>
                        <button
                          type="button"
                          onClick={() => setSelectedIds([])}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'underline'
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkStatus('AUTO')}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.78rem',
                            background: 'rgba(16, 185, 129, 0.14)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.28)'
                          }}
                        >
                          <CheckCircle2 size={14} /> Restore Auto Status
                        </button>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkStatus('Cancelled')}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.78rem',
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.28)'
                          }}
                        >
                          <XCircle size={14} /> Mark Cancelled
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            className="btn"
                            onClick={handleBulkDelete}
                            style={{
                              padding: '0.38rem 0.75rem',
                              fontSize: '0.78rem',
                              background: 'rgba(239, 68, 68, 0.14)',
                              color: 'var(--danger)',
                              border: '1px solid rgba(239, 68, 68, 0.28)'
                            }}
                          >
                            <Trash2 size={14} /> Delete Selected
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme-Aware Voyages Table */}
                <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead
                        style={{
                          background: isLight ? '#f4f9ff' : 'rgba(15, 23, 42, 0.85)',
                          borderBottom: '1px solid var(--border)'
                        }}
                      >
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={allPageSelected}
                              onChange={toggleSelectAllPage}
                              aria-label="Select all voyages on page"
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('shipName')}
                            >
                              SHIP, BRAND & REF
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'shipName' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('sailingStart')}
                            >
                              SAILING & PAYMENT
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'sailingStart' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('route')}
                            >
                              ROUTE & CABIN
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'route' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('picName')}
                            >
                              LEAD PIC & PAX
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'picName' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('staff')}
                            >
                              STAFF
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'staff' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('status')}
                            >
                              STATUS
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'status' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedData.map((crs) => {
                          const statusMeta = getStatusMeta(crs.status, isLight);
                          const isSelected = selectedIds.includes(crs.id);
                          const isCancelled = isCancelledCruise(crs.status);
                          const editable = canEditRecord(crs.staff);

                          let countdownTag = null;
                          if (
                            !isCancelled &&
                            crs.status === 'Upcoming' &&
                            crs.diffSailing !== null &&
                            crs.diffSailing >= 0 &&
                            crs.diffSailing <= 14
                          ) {
                            countdownTag =
                              crs.diffSailing === 0
                                ? 'Today'
                                : crs.diffSailing === 1
                                ? 'Tomorrow'
                                : `In ${crs.diffSailing}d`;
                          }

                          return (
                            <tr
                              key={crs.id}
                              onClick={() => setPreviewCruiseId(crs.id)}
                              style={{
                                cursor: 'pointer',
                                opacity: isCancelled ? 0.72 : 1,
                                background: isSelected
                                  ? isLight
                                    ? 'rgba(0, 168, 255, 0.06)'
                                    : 'rgba(0, 168, 255, 0.09)'
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
                                  onChange={() => toggleSelectOne(crs.id)}
                                  aria-label={`Select ${crs.shipName || crs.cruiseBrand}`}
                                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                              </td>

                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {crs.shipName || crs.cruiseBrand || '-'}
                                </div>
                                {crs.cruiseBrand && crs.shipName && (
                                  <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                                    {crs.cruiseBrand}
                                  </div>
                                )}
                                <div
                                  style={{ marginTop: '0.2rem' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {crs.hasRef ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyText(
                                          crs.refCode,
                                          `Copied reservation code ${crs.refCode}`
                                        )
                                      }
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: 'var(--primary)',
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                      title="Click to copy reservation code"
                                    >
                                      Ref: {crs.refCode} <Copy size={11} />
                                    </button>
                                  ) : !isCancelled && crs.status !== 'Past Date' && editable ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenModal(crs)}
                                      style={{
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        border: '1px dashed rgba(245, 158, 11, 0.5)',
                                        borderRadius: '0.35rem',
                                        padding: '0.1rem 0.45rem',
                                        color: '#f59e0b',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      + Add Ref #
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      No Ref #
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                  {formatDisplayDate(crs.sailingStart, false)} → {formatDisplayDate(crs.sailingEnd, true)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.22rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '0.08rem 0.45rem',
                                      borderRadius: '999px',
                                      background: chipBg,
                                      border: `1px solid ${chipBorder}`,
                                      color: 'var(--primary)'
                                    }}
                                  >
                                    {crs.nights} {crs.nights === 1 ? 'Night' : 'Nights'}
                                  </span>

                                  {countdownTag && (
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '0.08rem 0.45rem',
                                        borderRadius: '999px',
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        color: '#f59e0b'
                                      }}
                                    >
                                      {countdownTag}
                                    </span>
                                  )}
                                </div>

                                {crs.finalPaymentDate && (
                                  <div
                                    style={{
                                      fontSize: '0.73rem',
                                      marginTop: '0.22rem',
                                      fontWeight: crs.isPaymentUrgent ? 700 : 500,
                                      color: crs.isPaymentUrgent
                                        ? crs.diffPayment < 0
                                          ? '#ef4444'
                                          : '#f59e0b'
                                        : 'var(--text-muted)'
                                    }}
                                  >
                                    Pay Due: {formatDisplayDate(crs.finalPaymentDate, true)}
                                  </div>
                                )}
                              </td>

                              <td>
                                <div
                                  style={{
                                    maxWidth: '210px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: 600,
                                    fontSize: '0.83rem',
                                    color: 'var(--text-main)'
                                  }}
                                  title={crs.route}
                                >
                                  {crs.route || '-'}
                                </div>
                                {crs.cruiseLine && (
                                  <div style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                                    {crs.cruiseLine}
                                  </div>
                                )}
                              </td>

                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)' }}>
                                    {crs.picName || '-'}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.71rem',
                                      fontWeight: 700,
                                      padding: '0.08rem 0.45rem',
                                      borderRadius: '999px',
                                      background: chipBg,
                                      border: `1px solid ${chipBorder}`,
                                      color: 'var(--primary)',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {crs.totalPax} Pax
                                  </span>
                                </div>
                                {crs.participants.length > 0 && (
                                  <div
                                    style={{
                                      maxWidth: '175px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontSize: '0.76rem',
                                      color: 'var(--text-muted)',
                                      marginTop: '0.15rem'
                                    }}
                                    title={crs.participants.join(', ')}
                                  >
                                    +{crs.participants.join(', ')}
                                  </div>
                                )}
                              </td>

                              <td style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                                {crs.staff || '-'}
                              </td>

                              <td>
                                <span
                                  className={`badge ${statusMeta.badgeClass}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    whiteSpace: 'nowrap',
                                    ...(statusMeta.customStyle || {})
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: statusMeta.dotColor
                                    }}
                                  />
                                  {statusMeta.label}
                                </span>
                              </td>

                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.42rem',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: '#10b981'
                                    }}
                                    onClick={() => setPreviewCruiseId(crs.id)}
                                    title="Inspect Voyage"
                                  >
                                    <Eye size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.42rem',
                                      background: 'rgba(0, 168, 255, 0.1)',
                                      color: 'var(--primary)'
                                    }}
                                    onClick={() => handleCopyVoyagePortal(crs)}
                                    title="Copy Cruise Voyage Pass Link"
                                  >
                                    <Share2 size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.42rem',
                                      background: isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.12)',
                                      color: 'var(--text-main)'
                                    }}
                                    onClick={() => handleDuplicateCabin(crs)}
                                    title="Duplicate Cabin on Same Sailing"
                                  >
                                    <Copy size={15} />
                                  </button>

                                  {editable && (
                                    <button
                                      type="button"
                                      className="btn"
                                      style={{
                                        padding: '0.42rem',
                                        background: 'rgba(0, 168, 255, 0.12)',
                                        color: 'var(--primary)'
                                      }}
                                      onClick={() => handleOpenModal(crs)}
                                      title="Edit Booking"
                                    >
                                      <Edit2 size={15} />
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="btn"
                                      style={{
                                        padding: '0.42rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: 'var(--danger)'
                                      }}
                                      onClick={() => handleDelete(crs)}
                                      title="Delete Booking"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {cruises.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.75rem 1.5rem', color: 'var(--text-muted)' }}>
                              No cruise bookings recorded yet. Click <strong>Add Cruise Booking</strong> or <strong>Import Excel / CSV</strong> to get started.
                            </td>
                          </tr>
                        )}

                        {cruises.length > 0 && paginatedData.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                              <div>No cruise voyages match your active filters.</div>
                              {hasActiveFilters && (
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={handleResetAllFilters}
                                  style={{
                                    marginTop: '0.75rem',
                                    background: subtleSurface,
                                    border: `1px solid ${chipBorder}`,
                                    color: 'var(--primary)',
                                    padding: '0.45rem 0.9rem',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Reset All Filters
                                </button>
                              )}
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

      {/* ADD / EDIT / DUPLICATE CABIN MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content fade-in"
            style={{
              maxWidth: '840px',
              background: 'var(--bg-card)',
              padding: 0,
              border: '1px solid var(--border)',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
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
                    color: 'var(--text-main)'
                  }}
                >
                  <Ship size={20} color="var(--primary)" />
                  {editingCruise
                    ? 'Edit Cruise Booking'
                    : isDuplicateMode
                    ? 'Duplicate Cabin on Same Sailing'
                    : 'Add Cruise Booking'}
                </h2>
                {isDuplicateMode && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Ship, sailing dates, route, and payment deadline pre-filled. Enter the new cabin&apos;s guests & reservation code.
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

            <form
              onSubmit={handleSubmit}
              style={{ padding: '1.4rem 1.5rem', overflowY: 'auto' }}
            >
              <div className="form-grid">
                {/* Row 1: Cruise Brand & Ship Name */}
                <div className="input-group">
                  <label>
                    Cruise Brand <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Ship size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Royal Caribbean, Resorts World Cruises"
                      value={formData.cruiseBrand}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cruiseBrand: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_CRUISE_BRANDS.slice(0, 5).map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, cruiseBrand: brand }))}
                        style={{
                          border: `1px solid ${formData.cruiseBrand === brand ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.cruiseBrand === brand ? chipBg : 'transparent',
                          color: formData.cruiseBrand === brand ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    Ship Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Anchor size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Genting Dream, Disney Adventure"
                      value={formData.shipName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shipName: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {shipSuggestions.slice(0, 4).map((ship) => (
                      <button
                        key={ship}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, shipName: ship }))}
                        style={{
                          border: `1px solid ${formData.shipName === ship ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.shipName === ship ? chipBg : 'transparent',
                          color: formData.shipName === ship ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {ship}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: Sailing Start & Sailing End with Night Presets */}
                <div className="input-group">
                  <label>
                    Sailing Start (Embarkation) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.sailingStart}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setFormData((prev) => {
                        let nextEnd = prev.sailingEnd;
                        if (nextStart && nextEnd && nextEnd < nextStart) {
                          nextEnd = addDaysToDateStr(nextStart, 3);
                        }
                        return { ...prev, sailingStart: nextStart, sailingEnd: nextEnd };
                      });
                    }}
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{ marginBottom: 0 }}>
                      Sailing End (Docking) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {formNights !== null && (
                      <span
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.55rem',
                          borderRadius: '999px',
                          background: chipBg,
                          border: `1px solid ${chipBorder}`,
                          color: 'var(--primary)'
                        }}
                      >
                        {formNights} {formNights === 1 ? 'Night' : 'Nights'}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    min={formData.sailingStart || undefined}
                    value={formData.sailingEnd}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sailingEnd: e.target.value }))}
                    style={{ ...fieldStyle, marginTop: '0.4rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick voyage:</span>
                    {VOYAGE_NIGHT_PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleApplyNightPreset(n)}
                        style={{
                          border: `1px solid ${formNights === n ? 'var(--primary)' : chipBorder}`,
                          background: formNights === n ? 'rgba(0, 168, 255, 0.16)' : chipBg,
                          color: 'var(--primary)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        +{n}N
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Voyage Route (Full Width) */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>
                    Voyage Route / Ports of Call <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Singapore - Penang - Phuket - Singapore"
                      value={formData.route}
                      onChange={(e) => setFormData((prev) => ({ ...prev, route: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Sparkles size={12} color="var(--primary)" /> Popular routes:
                    </span>
                    {POPULAR_ROUTES.slice(0, 3).map((rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, route: rt }))}
                        style={{
                          border: `1px solid ${formData.route === rt ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.route === rt ? chipBg : 'transparent',
                          color: formData.route === rt ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Cabin Category & Reservation Code */}
                <div className="input-group">
                  <label>Cabin Category / Deck / GSA</label>
                  <div style={{ position: 'relative' }}>
                    <Compass size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., 1x Balcony Stateroom · Deck 10 (#10234)"
                      value={formData.cruiseLine}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cruiseLine: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_CABIN_TYPES.slice(0, 4).map((cab) => (
                      <button
                        key={cab}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, cruiseLine: cab }))}
                        style={{
                          border: `1px solid ${formData.cruiseLine === cab ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.cruiseLine === cab ? chipBg : 'transparent',
                          color: formData.cruiseLine === cab ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {cab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Reservation Code / Booking Ref</label>
                  <div style={{ position: 'relative' }}>
                    <Ticket size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="Cruise line PNR / reservation #"
                      value={formData.reservationCode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, reservationCode: e.target.value }))
                      }
                      style={iconFieldStyle}
                    />
                  </div>
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Powers the public Cruise Voyage Pass portal (`/track/:code`).
                  </span>
                </div>

                {/* Row 5: Final Payment Deadline & Booking Status */}
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>Final Payment Deadline</label>
                    {formData.finalPaymentDate && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, finalPaymentDate: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formData.finalPaymentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, finalPaymentDate: e.target.value }))
                    }
                    style={{ ...fieldStyle, marginTop: '0.4rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>Before sailing:</span>
                    {PAYMENT_LEAD_PRESETS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleApplyPaymentLead(days)}
                        style={{
                          border: `1px solid ${chipBorder}`,
                          background: chipBg,
                          color: 'var(--primary)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.48rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        -{days}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Booking Status</label>
                  <select
                    value={formData.statusMode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, statusMode: e.target.value }))}
                    style={fieldStyle}
                  >
                    <option value="AUTO">Auto-Sync from Sailing Dates (Upcoming / At Sea / Completed)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Row 6: Lead Passenger (PIC) & Accompanying Passengers */}
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>
                      Lead Passenger (PIC) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.55rem',
                        borderRadius: '999px',
                        background: chipBg,
                        border: `1px solid ${chipBorder}`,
                        color: 'var(--primary)'
                      }}
                    >
                      Total Pax: {formTotalPax}
                    </span>
                  </div>
                  <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                    <User size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="Primary cabin guest / contact person"
                      value={formData.picName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, picName: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Accompanying Passengers</label>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <input
                      type="text"
                      placeholder="Type or paste comma-separated names..."
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyDown={handleParticipantKeyDown}
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={handleAddParticipantsFromInput}
                      style={{
                        background: subtleSurface,
                        border: `1px solid ${chipBorder}`,
                        color: 'var(--primary)',
                        padding: '0 0.85rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {formData.participants.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {formData.participants.map((p, idx) => (
                        <span
                          key={`${p}-${idx}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: chipBg,
                            border: `1px solid ${chipBorder}`,
                            padding: '0.22rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--text-main)'
                          }}
                        >
                          <span>{p}</span>
                          <button
                            type="button"
                            onClick={() => removeParticipant(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex'
                            }}
                            title="Remove passenger"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 7: Phone & Email */}
                <div className="input-group">
                  <label>Phone / WhatsApp Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="+62..."
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={iconAdornmentStyle} />
                    <input
                      type="email"
                      placeholder="guest@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                {/* Row 8: Consultant (PIC Staff) */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>
                      Consultant (Staff Handling) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {currentUserName && formData.staff !== currentUserName && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, staff: currentUserName }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Assign to me ({currentUserName})
                      </button>
                    )}
                  </div>
                  <select
                    required
                    value={formData.staff}
                    onChange={(e) => setFormData((prev) => ({ ...prev, staff: e.target.value }))}
                    style={{ ...fieldStyle, marginTop: '0.4rem' }}
                  >
                    <option value="">Select Staff</option>
                    {formData.staff &&
                      !activeStaff.some((u) => u.name === formData.staff) && (
                        <option value={formData.staff}>{formData.staff}</option>
                      )}
                    {activeStaff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.name}>
                        {staffMember.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.2rem',
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
                    : editingCruise
                    ? 'Save Changes'
                    : 'Create Cruise Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CRUISE INSPECTOR DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(previewCruise)}
        onClose={() => setPreviewCruiseId(null)}
        title={previewCruise?.shipName || previewCruise?.cruiseBrand || 'Cruise Voyage Details'}
        subtitle={
          previewCruise
            ? `${previewCruise.cruiseBrand || 'Cruise Line'} · Handled by ${previewCruise.staff || 'Unassigned'}`
            : ''
        }
        width="550px"
        footer={
          previewCruise ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = previewCruise;
                  setPreviewCruiseId(null);
                  handleDuplicateCabin(target);
                }}
                style={{
                  background: subtleSurface,
                  border: `1px solid ${chipBorder}`,
                  color: 'var(--primary)'
                }}
              >
                <Copy size={15} /> Duplicate Cabin
              </button>

              {canEditRecord(previewCruise.staff) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const target = previewCruise;
                    setPreviewCruiseId(null);
                    handleOpenModal(target);
                  }}
                >
                  <Edit2 size={15} /> Edit Booking
                </button>
              )}
            </>
          ) : null
        }
      >
        {previewCruise && (() => {
          const statusMeta = getStatusMeta(previewCruise.status, isLight);
          const nights = calculateVoyageNights(previewCruise.sailingStart, previewCruise.sailingEnd) ?? 0;
          const refCode = (previewCruise.reservationCode || previewCruise.bookingRef || '').trim();
          const portalPath = getVoyagePortalPath(previewCruise);
          const participants = Array.isArray(previewCruise.participants) ? previewCruise.participants : [];
          const totalPax =
            participants.length > 0
              ? 1 + participants.length
              : Math.max(1, Number(previewCruise.paxCount) || 1);
          const payDiff = getDayDiffFromToday(previewCruise.finalPaymentDate);
          const waLink = buildWhatsAppLink(previewCruise.phoneNumber);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Reservation Code & Status Card */}
              <div
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: subtleSurface,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Reservation Code / PNR
                  </div>
                  {refCode ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                        {refCode}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopyText(refCode, `Copied reservation code ${refCode}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                        title="Copy Reservation Code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.2rem' }}>
                      Pending Reservation Code
                    </div>
                  )}
                </div>

                <span
                  className={`badge ${statusMeta.badgeClass}`}
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.38rem 0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    ...(statusMeta.customStyle || {})
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: statusMeta.dotColor
                    }}
                  />
                  {statusMeta.label}
                </span>
              </div>

              {/* Sailing Timeline, Route & Cabin */}
              <div
                style={{
                  padding: '1.1rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Embarkation
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {formatDisplayDate(previewCruise.sailingStart, true)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      background: chipBg,
                      border: `1px solid ${chipBorder}`,
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  >
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Disembarkation
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {formatDisplayDate(previewCruise.sailingEnd, true)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '0.9rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    fontSize: '0.84rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="var(--primary)" /> Route:
                    </span>
                    <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>
                      {previewCruise.route || 'Not specified'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Compass size={15} color="var(--primary)" /> Cabin / Category:
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {previewCruise.cruiseLine || 'Standard / Not specified'}
                    </strong>
                  </div>

                  {previewCruise.finalPaymentDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CreditCard size={15} color="var(--primary)" /> Final Payment Deadline:
                      </span>
                      <strong
                        style={{
                          color:
                            !isCancelledCruise(previewCruise.status) &&
                            previewCruise.status !== 'Past Date' &&
                            payDiff !== null &&
                            payDiff <= 14
                              ? payDiff < 0
                                ? '#ef4444'
                                : '#f59e0b'
                              : 'var(--text-main)'
                        }}
                      >
                        {formatDisplayDate(previewCruise.finalPaymentDate, true)}
                        {!isCancelledCruise(previewCruise.status) &&
                        previewCruise.status !== 'Past Date' &&
                        payDiff !== null
                          ? payDiff < 0
                            ? ` (${Math.abs(payDiff)}d ago)`
                            : payDiff === 0
                            ? ' (Today)'
                            : ` (in ${payDiff}d)`
                          : ''}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Cruise Voyage Pass Portal Card */}
              {portalPath && (
                <div
                  style={{
                    padding: '1rem 1.1rem',
                    borderRadius: '0.8rem',
                    background: isLight ? '#eef7ff' : 'rgba(0, 168, 255, 0.08)',
                    border: `1px solid ${chipBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Cruise Voyage Pass Portal
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Share live ship itinerary & embarkation status with passengers.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleCopyVoyagePortal(previewCruise)}
                      style={{
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.78rem',
                        background: isLight ? '#ffffff' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)'
                      }}
                    >
                      <Share2 size={14} /> Copy Link
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate(portalPath)}
                      style={{
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.78rem',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none'
                      }}
                    >
                      <ExternalLink size={14} /> Open Portal
                    </button>
                  </div>
                </div>
              )}

              {/* Lead Contact & Quick Actions */}
              <div
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Lead Contact (PIC)
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {previewCruise.picName || 'Not specified'}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                  {previewCruise.phoneNumber ? (
                    <>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn"
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.76rem',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.28)',
                            color: '#10b981',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageCircle size={13} /> WhatsApp ({previewCruise.phoneNumber})
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleCopyText(previewCruise.phoneNumber, 'Copied phone number')}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.76rem',
                          background: subtleSurface,
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)'
                        }}
                      >
                        <Phone size={13} /> Copy Phone
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No phone number</span>
                  )}

                  {previewCruise.email && (
                    <a
                      href={`mailto:${previewCruise.email}`}
                      className="btn"
                      style={{
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.76rem',
                        background: chipBg,
                        border: `1px solid ${chipBorder}`,
                        color: 'var(--primary)',
                        textDecoration: 'none'
                      }}
                    >
                      <Mail size={13} /> {previewCruise.email}
                    </a>
                  )}
                </div>
              </div>

              {/* Full Passenger Manifest */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Cabin Passenger Manifest
                  </span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {totalPax} {totalPax === 1 ? 'Passenger' : 'Passengers'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '0.95rem',
                    borderRadius: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem'
                  }}
                >
                  {previewCruise.picName && (
                    <span
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '999px',
                        background: chipBg,
                        border: `1px solid ${chipBorder}`,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--primary)'
                      }}
                    >
                      1. {previewCruise.picName} (Lead)
                    </span>
                  )}
                  {participants.map((p, idx) => (
                    <span
                      key={`${p}-${idx}`}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '999px',
                        background: subtleSurface,
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                      }}
                    >
                      {idx + 2}. {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Record Footer Info */}
              <div
                style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.25rem'
                }}
              >
                <span>Consultant: <strong style={{ color: 'var(--text-main)' }}>{previewCruise.staff || 'Unassigned'}</strong></span>
                <span>ID: {previewCruise.id}</span>
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>
    </div>
  );
};

export default Cruise;
