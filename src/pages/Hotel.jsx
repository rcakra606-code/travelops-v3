import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import { useHotels } from '../context/HotelContext';
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
  Building,
  Tag,
  Users as UsersIcon,
  MapPin,
  BarChart2,
  FileText,
  CheckSquare,
  Clock,
  Eye,
  ArrowUpDown,
  Search,
  UploadCloud,
  BedDouble,
  Moon,
  Copy,
  Share2,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  XCircle
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

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const POPULAR_DESTINATIONS = [
  'Indonesia',
  'Japan',
  'Singapore',
  'Thailand',
  'Malaysia',
  'South Korea',
  'Australia',
  'Switzerland'
];

const POPULAR_ROOM_TYPES = [
  '1x Standard Twin',
  '1x Deluxe Double',
  '1x Deluxe Twin',
  '1x Family Room',
  '2x Connecting Rooms'
];

const POPULAR_SUPPLIERS = [
  'Hotelbeds',
  'MG Bedbank',
  'Agoda',
  'WebBeds',
  'Expedia TAAP',
  'Direct Hotel'
];

const NIGHT_PRESETS = [1, 2, 3, 5, 7];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHART_COLORS = ['#00a8ff', '#38bdf8', '#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

const IMPORT_TEMPLATE_HEADERS = [
  'Hotel Name',
  'Confirmation Number',
  'Room Type',
  'Check In',
  'Check Out',
  'Region',
  'Guest List',
  'Supplier Name',
  'Supplier Code',
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

const calculateStayNights = (checkIn, checkOut) => {
  const inDate = parseLocalDay(checkIn);
  const outDate = parseLocalDay(checkOut);
  if (!inDate || !outDate) return null;
  const diff = Math.round((outDate - inDate) / 86400000);
  return diff >= 0 ? diff : null;
};

const parseRoomMultiplier = (roomType) => {
  if (!roomType) return 1;
  const match = String(roomType).trim().match(/^(\d+)\s*x\b/i);
  if (!match) return 1;
  const count = parseInt(match[1], 10);
  return Number.isFinite(count) && count > 0 ? count : 1;
};

const parseGuestNames = (guestList) => {
  if (!guestList) return [];
  return String(guestList)
    .split(/[\n,]+/)
    .map((g) => g.trim())
    .filter(Boolean);
};

const formatDisplayDate = (dateStr, includeYear = true) => {
  const d = parseLocalDay(dateStr);
  if (!d) return dateStr || '-';
  return d.toLocaleDateString(
    'en-GB',
    includeYear ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' }
  );
};

const isCancelledHotel = (status) => status === 'Cancel' || status === 'Cancelled';

const getDayDiffFromToday = (dateStr) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const getStatusMeta = (status, isLight) => {
  if (status === 'Active') {
    return {
      label: 'In-House',
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
  if (isCancelledHotel(status)) {
    return {
      label: 'Cancelled',
      badgeClass: 'badge-danger',
      customStyle: null,
      dotColor: '#ef4444'
    };
  }
  // 'Past Date' -> Checked-Out (neutral slate pill instead of alarming red)
  return {
    label: 'Checked-Out',
    badgeClass: '',
    customStyle: {
      background: isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.14)',
      color: isLight ? '#475569' : '#94a3b8',
      border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)'}`
    },
    dotColor: '#64748b'
  };
};

const HotelChartTooltip = ({ active, payload, label, isLight }) => {
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

const Hotel = () => {
  const {
    hotels,
    addHotel,
    updateHotel,
    deleteHotel,
    bulkUpdateHotelStatus,
    bulkDeleteHotels,
    bulkImportHotels
  } = useHotels();
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

  const canEditRecord = (recordStaff) => {
    if (isAdmin || isManager) return true;
    if (isStaff && recordStaff === currentUserName) return true;
    return false;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState(() =>
    location.state?.openTab === 'database' ? 'database' : 'dashboard'
  );
  const [showImport, setShowImport] = useState(false);
  const [selectedYear, setSelectedYear] = useState('All');

  // Table scope & bulk selection
  const [tableScope, setTableScope] = useState('all'); // 'all' | 'active' | 'soon' | 'missing_conf' | 'mine' | 'past' | 'cancelled'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal & Drawer state
  const [isModalOpen, setIsModalOpen] = useState(() => Boolean(location.state?.openNew));
  const [editingHotel, setEditingHotel] = useState(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewHotelId, setPreviewHotelId] = useState(null);

  const [countrySearch, setCountrySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const buildEmptyForm = (prefillDate = '') => ({
    checkIn: prefillDate || '',
    checkOut: prefillDate ? addDaysToDateStr(prefillDate, 1) : '',
    hotelName: '',
    roomType: '',
    region: '',
    confirmationNumber: '',
    guestList: '',
    supplierCode: '',
    supplierName: '',
    staff: defaultStaffName,
    statusMode: 'AUTO'
  });

  const [formData, setFormData] = useState(() =>
    buildEmptyForm(location.state?.prefillDate || '')
  );

  const previewHotel = useMemo(
    () => hotels.find((h) => h.id === previewHotelId) || null,
    [hotels, previewHotelId]
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenModal = (hotel = null) => {
    setIsDuplicateMode(false);
    if (hotel) {
      setEditingHotel(hotel);
      setFormData({
        checkIn: hotel.checkIn || '',
        checkOut: hotel.checkOut || '',
        hotelName: hotel.hotelName || '',
        roomType: hotel.roomType || '',
        region: hotel.region || '',
        confirmationNumber: hotel.confirmationNumber || '',
        guestList: hotel.guestList || '',
        supplierCode: hotel.supplierCode || '',
        supplierName: hotel.supplierName || '',
        staff: hotel.staff || defaultStaffName,
        statusMode: isCancelledHotel(hotel.status) ? 'Cancelled' : 'AUTO'
      });
      setCountrySearch(hotel.region || '');
    } else {
      setEditingHotel(null);
      const fresh = buildEmptyForm('');
      setFormData(fresh);
      setCountrySearch('');
    }
    setIsModalOpen(true);
  };

  const handleDuplicateStay = (hotel) => {
    if (!hotel) return;
    const nextCheckIn = hotel.checkOut || hotel.checkIn || '';
    const prevNights = calculateStayNights(hotel.checkIn, hotel.checkOut);
    const nextCheckOut = nextCheckIn
      ? addDaysToDateStr(nextCheckIn, prevNights && prevNights > 0 ? prevNights : 2)
      : '';

    setEditingHotel(null);
    setIsDuplicateMode(true);
    setFormData({
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      hotelName: '',
      roomType: hotel.roomType || '',
      region: hotel.region || '',
      confirmationNumber: '',
      guestList: hotel.guestList || '',
      supplierCode: hotel.supplierCode || '',
      supplierName: hotel.supplierName || '',
      staff: defaultStaffName || hotel.staff || '',
      statusMode: 'AUTO'
    });
    setCountrySearch(hotel.region || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHotel(null);
    setIsDuplicateMode(false);
    setShowDropdown(false);
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

  const getGuestPortalPath = (hotel) => {
    const code = (hotel?.confirmationNumber || '').trim() || hotel?.id || '';
    return code ? `/track/${encodeURIComponent(code)}` : '';
  };

  const handleCopyGuestPortal = (hotel) => {
    const path = getGuestPortalPath(hotel);
    if (!path) return;
    const url = `${window.location.origin}${path}`;
    handleCopyText(url, `Guest portal link copied for ${hotel.hotelName || 'stay'}`);
  };

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch]
  );

  const handleCountrySelect = (country) => {
    setCountrySearch(country);
    setFormData((prev) => ({ ...prev, region: country }));
    setShowDropdown(false);
  };

  const handleApplyNightPreset = (nights) => {
    const baseCheckIn = formData.checkIn || toDateInputStr(new Date());
    const nextCheckOut = addDaysToDateStr(baseCheckIn, nights);
    setFormData((prev) => ({
      ...prev,
      checkIn: baseCheckIn,
      checkOut: nextCheckOut
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hotelName.trim()) {
      toast.warning('Please enter the Hotel Name.');
      return;
    }
    if (!formData.region.trim()) {
      toast.warning('Please select or enter a Destination / Country.');
      return;
    }
    if (!formData.checkIn || !formData.checkOut) {
      toast.warning('Please provide both Check-In and Check-Out dates.');
      return;
    }
    const nights = calculateStayNights(formData.checkIn, formData.checkOut);
    if (nights === null) {
      toast.error('Check-Out date must be on or after the Check-In date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        hotelName: formData.hotelName.trim(),
        roomType: formData.roomType.trim(),
        region: formData.region.trim(),
        confirmationNumber: formData.confirmationNumber.trim(),
        guestList: formData.guestList.trim(),
        supplierCode: formData.supplierCode.trim(),
        supplierName: formData.supplierName.trim(),
        staff: formData.staff || defaultStaffName,
        status: formData.statusMode === 'Cancelled' ? 'Cancelled' : 'AUTO'
      };

      if (editingHotel) {
        await updateHotel(editingHotel.id, payload);
        toast.success(`Updated booking at ${payload.hotelName}.`);
      } else {
        await addHotel(payload);
        toast.success(`Added hotel stay at ${payload.hotelName}.`);
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err?.message || 'Failed to save hotel booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hotel) => {
    if (!window.confirm(`Delete hotel booking "${hotel.hotelName}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteHotel(hotel.id);
      if (previewHotelId === hotel.id) setPreviewHotelId(null);
      setSelectedIds((prev) => prev.filter((item) => item !== hotel.id));
      toast.success(`Deleted "${hotel.hotelName}".`);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete hotel booking.');
    }
  };

  const handleBulkStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateHotelStatus(selectedIds, targetStatus);
      toast.success(
        targetStatus === 'Cancelled'
          ? `Marked ${selectedIds.length} stay(s) as Cancelled.`
          : `Synced status for ${selectedIds.length} stay(s) from stay dates.`
      );
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk status update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected hotel booking(s)?`)) {
      return;
    }
    try {
      await bulkDeleteHotels(selectedIds);
      if (previewHotelId && selectedIds.includes(previewHotelId)) {
        setPreviewHotelId(null);
      }
      toast.success(`Deleted ${selectedIds.length} hotel booking(s).`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk delete failed.');
    }
  };

  const handleCsvImport = async (rows) => {
    try {
      const count = await bulkImportHotels(rows, defaultStaffName);
      toast.success(`Imported ${count} hotel booking(s) successfully!`);
      setShowImport(false);
      setActiveTab('database');
    } catch (err) {
      toast.error(err?.message || 'Failed to import spreadsheet.');
    }
  };

  // Enrich hotels with computed nights, guestCount, and countdown for fast sorting/display
  const enrichedHotels = useMemo(() => {
    return hotels.map((h) => {
      const nights = calculateStayNights(h.checkIn, h.checkOut) ?? 0;
      const roomMultiplier = parseRoomMultiplier(h.roomType);
      const roomNights = Math.max(nights, 1) * roomMultiplier;
      const guests = parseGuestNames(h.guestList);
      const diffCheckIn = getDayDiffFromToday(h.checkIn);
      const diffCheckOut = getDayDiffFromToday(h.checkOut);
      const checkInYear = h.checkIn && /^\d{4}/.test(h.checkIn) ? h.checkIn.substring(0, 4) : '';
      const hasConfirmation = Boolean((h.confirmationNumber || '').trim());

      return {
        ...h,
        nights,
        roomNights: nights > 0 ? roomNights : 0,
        guests,
        guestCount: guests.length,
        diffCheckIn,
        diffCheckOut,
        checkInYear,
        hasConfirmation
      };
    });
  }, [hotels]);

  // Available check-in years for Overview filter
  const availableYears = useMemo(() => {
    const set = new Set();
    enrichedHotels.forEach((h) => {
      if (h.checkInYear) set.add(h.checkInYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [enrichedHotels]);

  // Scope counts for All Stays pills
  const scopeCounts = useMemo(() => {
    let active = 0;
    let soon = 0;
    let missingConf = 0;
    let mine = 0;
    let past = 0;
    let cancelled = 0;

    enrichedHotels.forEach((h) => {
      const isCanc = isCancelledHotel(h.status);
      if (isCanc) {
        cancelled += 1;
      } else {
        if (h.status === 'Active' || h.status === 'Upcoming') active += 1;
        if (h.status === 'Active' || (h.diffCheckIn !== null && h.diffCheckIn >= 0 && h.diffCheckIn <= 7)) {
          soon += 1;
        }
        if (!h.hasConfirmation && h.status !== 'Past Date') {
          missingConf += 1;
        }
        if (h.status === 'Past Date') {
          past += 1;
        }
      }
      if (currentUserName && h.staff === currentUserName) {
        mine += 1;
      }
    });

    return {
      all: enrichedHotels.length,
      active,
      soon,
      missing_conf: missingConf,
      mine,
      past,
      cancelled
    };
  }, [enrichedHotels, currentUserName]);

  // Filter dataset by active scope pill before feeding useDataTable
  const scopedHotels = useMemo(() => {
    return enrichedHotels.filter((h) => {
      const isCanc = isCancelledHotel(h.status);
      if (tableScope === 'active') return !isCanc && (h.status === 'Active' || h.status === 'Upcoming');
      if (tableScope === 'soon') {
        return !isCanc && (h.status === 'Active' || (h.diffCheckIn !== null && h.diffCheckIn >= 0 && h.diffCheckIn <= 7));
      }
      if (tableScope === 'missing_conf') return !isCanc && h.status !== 'Past Date' && !h.hasConfirmation;
      if (tableScope === 'mine') return Boolean(currentUserName) && h.staff === currentUserName;
      if (tableScope === 'past') return !isCanc && h.status === 'Past Date';
      if (tableScope === 'cancelled') return isCanc;
      return true;
    });
  }, [enrichedHotels, tableScope, currentUserName]);

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
  } = useDataTable(scopedHotels, { key: 'checkIn', direction: 'desc' }, 10);

  // Compute full filtered list (unpaginated) so ExportMenu exports the active filtered table
  const exportableTableData = useMemo(() => {
    let list = [...scopedHotels];
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      list = list.filter((item) =>
        [
          item.hotelName,
          item.confirmationNumber,
          item.roomType,
          item.region,
          item.guestList,
          item.supplierName,
          item.supplierCode,
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
  }, [scopedHotels, globalSearch, filters]);

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

  const drillIntoStays = ({ scope = 'all', search = '' }) => {
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
        ? enrichedHotels
        : enrichedHotels.filter((h) => h.checkInYear === selectedYear);

    const nonCancelled = yearFiltered.filter((h) => !isCancelledHotel(h.status));
    const inHouseList = nonCancelled.filter((h) => h.status === 'Active');
    const upcomingList = nonCancelled.filter((h) => h.status === 'Upcoming');
    const checkingIn7d = upcomingList.filter(
      (h) => h.diffCheckIn !== null && h.diffCheckIn >= 0 && h.diffCheckIn <= 7
    );
    const missingConfList = nonCancelled.filter(
      (h) => h.status !== 'Past Date' && !h.hasConfirmation
    );

    const totalRoomNights = nonCancelled.reduce((sum, h) => sum + h.roomNights, 0);
    const totalStayNights = nonCancelled.reduce((sum, h) => sum + h.nights, 0);
    const avgNights =
      nonCancelled.length > 0 ? (totalStayNights / nonCancelled.length).toFixed(1) : '0.0';
    const totalGuests = nonCancelled.reduce((sum, h) => sum + h.guestCount, 0);

    // Upcoming Arrivals & In-House Radar (sorted chronologically by check-in)
    const radarStays = enrichedHotels
      .filter(
        (h) =>
          !isCancelledHotel(h.status) &&
          (h.status === 'Active' || (h.diffCheckIn !== null && h.diffCheckIn >= 0 && h.diffCheckIn <= 7))
      )
      .sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || ''))
      .slice(0, 6);

    // Monthly Stays & Room-Nights Trend
    const monthlyBuckets = MONTH_LABELS.map((m) => ({
      month: m,
      Stays: 0,
      'Room-Nights': 0
    }));
    nonCancelled.forEach((h) => {
      const d = parseLocalDay(h.checkIn);
      if (d) {
        const idx = d.getMonth();
        monthlyBuckets[idx].Stays += 1;
        monthlyBuckets[idx]['Room-Nights'] += h.roomNights;
      }
    });

    // Top Destinations
    const regionCounts = {};
    nonCancelled.forEach((h) => {
      const r = h.region || 'Unknown';
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const regionData = Object.keys(regionCounts)
      .map((name, idx) => ({
        name,
        value: regionCounts[name],
        pct: nonCancelled.length > 0 ? Math.round((regionCounts[name] / nonCancelled.length) * 100) : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Bookings by Consultant (using full distinct names, shortened cleanly without colliding)
    const staffCounts = {};
    nonCancelled.forEach((h) => {
      const s = h.staff || 'Unassigned';
      if (!staffCounts[s]) {
        const parts = s.trim().split(/\s+/);
        const label =
          parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        staffCounts[s] = { fullName: s, name: label, Stays: 0, 'Room-Nights': 0 };
      }
      staffCounts[s].Stays += 1;
      staffCounts[s]['Room-Nights'] += h.roomNights;
    });
    const staffData = Object.values(staffCounts).sort((a, b) => b.Stays - a.Stays);

    // Top Suppliers / Bedbanks
    const supplierCounts = {};
    nonCancelled.forEach((h) => {
      const sup = (h.supplierName || '').trim() || 'Direct / Unspecified';
      if (!supplierCounts[sup]) {
        supplierCounts[sup] = { name: sup, stays: 0, roomNights: 0 };
      }
      supplierCounts[sup].stays += 1;
      supplierCounts[sup].roomNights += h.roomNights;
    });
    const supplierData = Object.values(supplierCounts)
      .sort((a, b) => b.stays - a.stays)
      .slice(0, 6);

    return {
      totalBookings: yearFiltered.length,
      nonCancelledCount: nonCancelled.length,
      inHouseCount: inHouseList.length,
      upcomingCount: upcomingList.length,
      checkingIn7dCount: checkingIn7d.length,
      missingConfCount: missingConfList.length,
      totalRoomNights,
      avgNights,
      totalGuests,
      radarStays,
      monthlyBuckets,
      regionData,
      staffData,
      supplierData
    };
  }, [enrichedHotels, selectedYear]);

  const exportColumns = [
    { header: 'Hotel Name', key: 'hotelName', format: null },
    { header: 'Confirmation Number', key: 'confirmationNumber', format: null },
    { header: 'Room Type', key: 'roomType', format: null },
    { header: 'Check In', key: 'checkIn', format: null },
    { header: 'Check Out', key: 'checkOut', format: null },
    { header: 'Nights', key: 'nights', format: null },
    { header: 'Region', key: 'region', format: null },
    { header: 'Guest List', key: 'guestList', format: null },
    { header: 'Supplier Name', key: 'supplierName', format: null },
    { header: 'Supplier Code', key: 'supplierCode', format: null },
    { header: 'Staff', key: 'staff', format: null },
    { header: 'Status', key: 'status', format: null }
  ];

  // Page-level select-all helpers
  const pageIds = paginatedData.map((h) => h.id);
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

  const formNights = calculateStayNights(formData.checkIn, formData.checkOut);
  const formDetectedGuests = parseGuestNames(formData.guestList);

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
                  Hotel Bookings
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Track property stays, room configurations, bedbank suppliers, confirmation numbers, and live guest portals.
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
                  <Plus size={18} /> Add Hotel Booking
                </button>
              </div>
            </div>

            {/* Collapsible Spreadsheet Import Utility */}
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
                <BarChart2 size={16} /> Overview & Arrivals
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <FileText size={16} /> All Stays
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
                  {hotels.length}
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
                  data={activeTab === 'database' ? exportableTableData : enrichedHotels}
                  columns={exportColumns}
                  filename={activeTab === 'database' ? 'Hotel_Stays_Filtered' : 'Hotel_Stays_All'}
                />
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="fade-in">
                {/* 5 Hospitality KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. In-House Today */}
                  <div
                    className="card"
                    onClick={() => drillIntoStays({ scope: 'active' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #10b981'
                    }}
                    title="Click to view In-House & Upcoming stays"
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
                        In-House Today
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
                        <CheckSquare size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.inHouseCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Checked-in guests currently staying
                    </div>
                  </div>

                  {/* 2. Upcoming Check-Ins */}
                  <div
                    className="card"
                    onClick={() => drillIntoStays({ scope: 'soon' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid var(--primary)'
                    }}
                    title="Click to filter stays checking in within 7 days"
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
                        Upcoming Check-Ins
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
                        <Clock size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.upcomingCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem' }}>
                      {overviewMetrics.checkingIn7dCount} arriving in next 7 days
                    </div>
                  </div>

                  {/* 3. Total Room-Nights */}
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
                        Total Room-Nights
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
                      {overviewMetrics.totalRoomNights}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Avg {overviewMetrics.avgNights} nights per booking
                    </div>
                  </div>

                  {/* 4. Guests Managed */}
                  <div
                    className="card"
                    style={{
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #6366f1'
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
                        Guests Managed
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: 'rgba(99, 102, 241, 0.13)',
                          color: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <UsersIcon size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.totalGuests}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Across {overviewMetrics.nonCancelledCount} confirmed stays
                    </div>
                  </div>

                  {/* 5. Missing Confirmation # */}
                  <div
                    className="card"
                    onClick={() => drillIntoStays({ scope: 'missing_conf' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: `3px solid ${overviewMetrics.missingConfCount > 0 ? '#f59e0b' : '#10b981'}`
                    }}
                    title="Click to follow up stays missing a hotel confirmation number"
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
                        Missing Conf #
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background:
                            overviewMetrics.missingConfCount > 0
                              ? 'rgba(245, 158, 11, 0.14)'
                              : 'rgba(16, 185, 129, 0.12)',
                          color: overviewMetrics.missingConfCount > 0 ? '#f59e0b' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {overviewMetrics.missingConfCount > 0 ? (
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
                        color: overviewMetrics.missingConfCount > 0 ? '#f59e0b' : 'var(--text-main)',
                        lineHeight: 1.1
                      }}
                    >
                      {overviewMetrics.missingConfCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {overviewMetrics.missingConfCount > 0
                        ? 'Click to input hotel refs ->'
                        : 'All active stays confirmed'}
                    </div>
                  </div>
                </div>

                {/* Actionable Upcoming Arrivals & In-House Radar (Next 7 Days) */}
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
                        Upcoming Check-Ins & In-House Radar (Next 7 Days)
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Verify hotel confirmation numbers, room types, and share guest tracker links ahead of arrival.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => drillIntoStays({ scope: 'soon' })}
                      style={{
                        padding: '0.42rem 0.85rem',
                        fontSize: '0.8rem',
                        background: subtleSurface,
                        border: `1px solid ${chipBorder}`,
                        color: 'var(--primary)'
                      }}
                    >
                      Open 7-Day Queue ({scopeCounts.soon})
                    </button>
                  </div>

                  {overviewMetrics.radarStays.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {overviewMetrics.radarStays.map((stay) => {
                        const isInHouse = stay.status === 'Active';
                        const arrivalLabel = isInHouse
                          ? 'In-House'
                          : stay.diffCheckIn === 0
                          ? 'Check-In Today'
                          : stay.diffCheckIn === 1
                          ? 'Tomorrow'
                          : `In ${stay.diffCheckIn}d`;

                        return (
                          <div
                            key={stay.id}
                            onClick={() => setPreviewHotelId(stay.id)}
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
                              cursor: 'pointer',
                              transition: 'border-color 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '240px', flex: 1 }}>
                              <span
                                style={{
                                  padding: '0.28rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  background: isInHouse
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : stay.diffCheckIn !== null && stay.diffCheckIn <= 1
                                    ? 'rgba(245, 158, 11, 0.16)'
                                    : 'rgba(0, 168, 255, 0.14)',
                                  color: isInHouse
                                    ? '#10b981'
                                    : stay.diffCheckIn !== null && stay.diffCheckIn <= 1
                                    ? '#f59e0b'
                                    : 'var(--primary)'
                                }}
                              >
                                {arrivalLabel}
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
                                  <span>{stay.hotelName}</span>
                                  {stay.region && (
                                    <span style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>
                                      · {stay.region}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {formatDisplayDate(stay.checkIn, false)} → {formatDisplayDate(stay.checkOut, true)}
                                  {stay.nights > 0 ? ` (${stay.nights}N)` : ''}
                                  {stay.roomType ? ` · ${stay.roomType}` : ''}
                                  {stay.guests.length > 0
                                    ? ` · ${stay.guests[0]}${stay.guests.length > 1 ? ` +${stay.guests.length - 1}` : ''}`
                                    : ''}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {stay.hasConfirmation ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(stay.confirmationNumber, `Copied Ref ${stay.confirmationNumber}`)
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
                                  title="Click to copy confirmation #"
                                >
                                  <Tag size={12} color="var(--primary)" /> {stay.confirmationNumber}
                                </button>
                              ) : canEditRecord(stay.staff) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(stay)}
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
                                  + Input Conf #
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                  Pending Conf #
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn"
                                onClick={() => handleCopyGuestPortal(stay)}
                                style={{
                                  padding: '0.36rem 0.6rem',
                                  background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--primary)'
                                }}
                                title="Copy Guest Status Portal Link"
                              >
                                <Share2 size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn"
                                onClick={() => setPreviewHotelId(stay.id)}
                                style={{
                                  padding: '0.36rem 0.6rem',
                                  background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-main)'
                                }}
                                title="Inspect Stay"
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
                      No hotel check-ins or in-house stays scheduled within the next 7 days.
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
                  {/* 1. Monthly Stays & Room-Nights Trend */}
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
                      Monthly Stays & Room-Nights ({selectedYear === 'All' ? 'All Years' : selectedYear})
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.nonCancelledCount > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.monthlyBuckets} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<HotelChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Stays" fill="#00a8ff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Room-Nights" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No stay activity for this period.
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
                      <UsersIcon size={18} color="var(--primary)" />
                      Bookings by Consultant (PIC)
                    </h3>
                    <div style={{ height: '270px', width: '100%' }}>
                      {overviewMetrics.staffData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.staffData} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<HotelChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Stays" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Room-Nights" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No consultant data available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Top Destinations (Clickable Drill-Down) */}
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
                      <MapPin size={18} color="var(--primary)" />
                      Top Hotel Destinations
                    </h3>
                    {overviewMetrics.regionData.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1rem', alignItems: 'center', minHeight: '240px' }}>
                        <div style={{ height: '180px', width: '160px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={overviewMetrics.regionData.slice(0, 7)}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={72}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {overviewMetrics.regionData.slice(0, 7).map((entry, idx) => (
                                  <Cell key={`region-cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<HotelChartTooltip isLight={isLight} />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {overviewMetrics.regionData.slice(0, 6).map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => drillIntoStays({ scope: 'all', search: item.name })}
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
                              title={`Filter stays in ${item.name}`}
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
                        No destination records yet.
                      </div>
                    )}
                  </div>

                  {/* 4. Top Suppliers / Bedbanks */}
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
                      <Building size={18} color="var(--primary)" />
                      Top Suppliers & Bedbanks
                    </h3>
                    {overviewMetrics.supplierData.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center', minHeight: '240px' }}>
                        {overviewMetrics.supplierData.map((sup) => {
                          const maxStays = Math.max(overviewMetrics.supplierData[0]?.stays || 1, 1);
                          const widthPct = Math.max(8, Math.round((sup.stays / maxStays) * 100));
                          return (
                            <div
                              key={sup.name}
                              onClick={() =>
                                drillIntoStays({
                                  scope: 'all',
                                  search: sup.name === 'Direct / Unspecified' ? '' : sup.name
                                })
                              }
                              style={{ cursor: 'pointer' }}
                              title={`Filter stays booked via ${sup.name}`}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.82rem',
                                  marginBottom: '0.28rem'
                                }}
                              >
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sup.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {sup.stays} {sup.stays === 1 ? 'stay' : 'stays'} · {sup.roomNights} RN
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
                        No supplier records yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ALL STAYS TAB */
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
                      { id: 'all', label: 'All Stays', count: scopeCounts.all },
                      { id: 'active', label: 'In-House & Upcoming', count: scopeCounts.active },
                      { id: 'soon', label: 'Checking In Soon (7d)', count: scopeCounts.soon },
                      { id: 'missing_conf', label: 'Missing Conf #', count: scopeCounts.missing_conf },
                      { id: 'mine', label: 'My Bookings', count: scopeCounts.mine },
                      { id: 'past', label: 'Checked-Out', count: scopeCounts.past },
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
                        placeholder="Search hotel name, confirmation #, guest name, room type, country, supplier, or staff..."
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
                        <span>{selectedIds.length} stay(s) selected</span>
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

                {/* Theme-Aware Stays Table */}
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
                              aria-label="Select all stays on page"
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('hotelName')}
                            >
                              HOTEL & CONF #
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'hotelName' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('checkIn')}
                            >
                              STAY & NIGHTS
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'checkIn' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('roomType')}
                            >
                              ROOM TYPE
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'roomType' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('region')}
                            >
                              DESTINATION
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'region' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('guestList')}
                            >
                              GUESTS
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'guestList' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('supplierName')}
                            >
                              SUPPLIER
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'supplierName' ? 'var(--primary)' : 'currentColor'}
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
                        {paginatedData.map((h) => {
                          const statusMeta = getStatusMeta(h.status, isLight);
                          const isSelected = selectedIds.includes(h.id);
                          const isCancelled = isCancelledHotel(h.status);
                          const editable = canEditRecord(h.staff);

                          let countdownTag = null;
                          if (!isCancelled && h.status === 'Upcoming' && h.diffCheckIn !== null && h.diffCheckIn >= 0 && h.diffCheckIn <= 7) {
                            countdownTag =
                              h.diffCheckIn === 0
                                ? 'Today'
                                : h.diffCheckIn === 1
                                ? 'Tomorrow'
                                : `In ${h.diffCheckIn}d`;
                          }

                          return (
                            <tr
                              key={h.id}
                              onClick={() => setPreviewHotelId(h.id)}
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
                                  onChange={() => toggleSelectOne(h.id)}
                                  aria-label={`Select ${h.hotelName}`}
                                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                              </td>

                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {h.hotelName || '-'}
                                </div>
                                <div
                                  style={{ marginTop: '0.2rem' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {h.hasConfirmation ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyText(
                                          h.confirmationNumber,
                                          `Copied confirmation # ${h.confirmationNumber}`
                                        )
                                      }
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: 'var(--primary)',
                                        fontSize: '0.77rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                      title="Click to copy confirmation #"
                                    >
                                      Ref: {h.confirmationNumber} <Copy size={11} />
                                    </button>
                                  ) : !isCancelled && h.status !== 'Past Date' && editable ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenModal(h)}
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
                                      + Add Conf #
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      No Conf #
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                  {formatDisplayDate(h.checkIn, false)} → {formatDisplayDate(h.checkOut, true)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.22rem' }}>
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
                                    {h.nights} {h.nights === 1 ? 'Night' : 'Nights'}
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
                              </td>

                              <td>
                                {h.roomType ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: 'var(--text-main)'
                                    }}
                                  >
                                    <BedDouble size={14} color="var(--primary)" /> {h.roomType}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                                )}
                              </td>

                              <td>
                                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                                  {h.region || '-'}
                                </span>
                              </td>

                              <td>
                                {h.guestCount > 0 ? (
                                  <div>
                                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)' }}>
                                      {h.guestCount} {h.guestCount === 1 ? 'Guest' : 'Guests'}
                                    </div>
                                    <div
                                      style={{
                                        maxWidth: '160px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)'
                                      }}
                                      title={h.guests.join(', ')}
                                    >
                                      {h.guests.join(', ')}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                                )}
                              </td>

                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                                  {h.supplierName || '-'}
                                </div>
                                {h.supplierCode && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {h.supplierCode}
                                  </div>
                                )}
                              </td>

                              <td style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                                {h.staff || '-'}
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
                                    onClick={() => setPreviewHotelId(h.id)}
                                    title="Inspect Booking"
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
                                    onClick={() => handleCopyGuestPortal(h)}
                                    title="Copy Guest Status Portal Link"
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
                                    onClick={() => handleDuplicateStay(h)}
                                    title="Duplicate for Next Stay (check-in starts on previous check-out)"
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
                                      onClick={() => handleOpenModal(h)}
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
                                      onClick={() => handleDelete(h)}
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

                        {hotels.length === 0 && (
                          <tr>
                            <td colSpan="10" style={{ textAlign: 'center', padding: '2.75rem 1.5rem', color: 'var(--text-muted)' }}>
                              No hotel bookings recorded yet. Click <strong>Add Hotel Booking</strong> or <strong>Import Excel / CSV</strong> to get started.
                            </td>
                          </tr>
                        )}

                        {hotels.length > 0 && paginatedData.length === 0 && (
                          <tr>
                            <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                              <div>No hotel stays match your active filters.</div>
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

      {/* ADD / EDIT / DUPLICATE HOTEL BOOKING MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content fade-in"
            style={{
              maxWidth: '820px',
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
                  <Building size={20} color="var(--primary)" />
                  {editingHotel
                    ? 'Edit Hotel Booking'
                    : isDuplicateMode
                    ? 'Duplicate for Next Stay'
                    : 'Add Hotel Booking'}
                </h2>
                {isDuplicateMode && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Check-in pre-filled from previous check-out. Enter the next property & confirmation number.
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
                {/* Row 1: Check-In & Check-Out with Quick Night Chips */}
                <div className="input-group">
                  <label>
                    Check-In Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) => {
                      const nextIn = e.target.value;
                      setFormData((prev) => {
                        let nextOut = prev.checkOut;
                        if (nextIn && nextOut && nextOut < nextIn) {
                          nextOut = addDaysToDateStr(nextIn, 1);
                        }
                        return { ...prev, checkIn: nextIn, checkOut: nextOut };
                      });
                    }}
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{ marginBottom: 0 }}>
                      Check-Out Date <span style={{ color: '#ef4444' }}>*</span>
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
                    min={formData.checkIn || undefined}
                    value={formData.checkOut}
                    onChange={(e) => setFormData((prev) => ({ ...prev, checkOut: e.target.value }))}
                    style={{ ...fieldStyle, marginTop: '0.4rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick stay:</span>
                    {NIGHT_PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleApplyNightPreset(n)}
                        style={{
                          border: `1px solid ${ formNights === n ? 'var(--primary)' : chipBorder }`,
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

                {/* Row 2: Hotel Name & Room Type */}
                <div className="input-group">
                  <label>
                    Hotel Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Park Hyatt Tokyo"
                      value={formData.hotelName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hotelName: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Room Type & Room Count</label>
                  <div style={{ position: 'relative' }}>
                    <BedDouble size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., 1x Deluxe Twin, 2x Family Suite"
                      value={formData.roomType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roomType: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_ROOM_TYPES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, roomType: preset }))}
                        style={{
                          border: `1px solid ${formData.roomType === preset ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.roomType === preset ? chipBg : 'transparent',
                          color: formData.roomType === preset ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Destination / Region (Full Width with Quick-Pick Chips) */}
                <div
                  className="input-group"
                  ref={dropdownRef}
                  style={{ position: 'relative', gridColumn: '1 / -1' }}
                >
                  <label>
                    Destination / Country <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      value={countrySearch}
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setFormData((prev) => ({ ...prev, region: e.target.value }));
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search or select destination country..."
                      style={iconFieldStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Sparkles size={12} color="var(--primary)" /> Popular:
                    </span>
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => handleCountrySelect(dest)}
                        style={{
                          border: `1px solid ${formData.region === dest ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.region === dest ? chipBg : 'transparent',
                          color: formData.region === dest ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.14rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>

                  {showDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4.4rem',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.6rem',
                        maxHeight: '190px',
                        overflowY: 'auto',
                        zIndex: 20,
                        boxShadow: isLight
                          ? '0 10px 25px rgba(15, 23, 42, 0.12)'
                          : '0 10px 28px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country}
                            style={{
                              padding: '0.6rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem'
                            }}
                            onClick={() => handleCountrySelect(country)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-surface)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {country}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                          No preset match — custom destination &quot;{countrySearch}&quot; will be used.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 4: Confirmation Number & Booking Status */}
                <div className="input-group">
                  <label>Confirmation Number</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="Hotel / bedbank confirmation #"
                      value={formData.confirmationNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, confirmationNumber: e.target.value }))
                      }
                      style={iconFieldStyle}
                    />
                  </div>
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Used as tracking code on the public Guest Status Portal.
                  </span>
                </div>

                <div className="input-group">
                  <label>Booking Status</label>
                  <select
                    value={formData.statusMode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, statusMode: e.target.value }))}
                    style={fieldStyle}
                  >
                    <option value="AUTO">Auto-Sync from Stay Dates (Upcoming / In-House / Checked-Out)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Row 5: Guest List */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>Guest List</label>
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {formDetectedGuests.length} {formDetectedGuests.length === 1 ? 'Guest' : 'Guests'} detected
                    </span>
                  </div>
                  <textarea
                    placeholder="Enter guest full names separated by commas or new lines (e.g., Mr. Budi Santoso, Mrs. Sinta Santoso)"
                    value={formData.guestList}
                    onChange={(e) => setFormData((prev) => ({ ...prev, guestList: e.target.value }))}
                    style={{
                      ...fieldStyle,
                      marginTop: '0.4rem',
                      minHeight: '88px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Row 6: Supplier Name & Supplier Code */}
                <div className="input-group">
                  <label>Supplier / Bedbank Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., Hotelbeds, Agoda, Direct Hotel"
                      value={formData.supplierName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, supplierName: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_SUPPLIERS.map((sup) => (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, supplierName: sup }))}
                        style={{
                          border: `1px solid ${formData.supplierName === sup ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.supplierName === sup ? chipBg : 'transparent',
                          color: formData.supplierName === sup ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {sup}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Supplier Reference / Code</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="Optional vendor voucher / dossier code"
                      value={formData.supplierCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, supplierCode: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                {/* Row 7: PIC Staff */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>
                      Consultant (PIC Staff) <span style={{ color: '#ef4444' }}>*</span>
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
                    : editingHotel
                    ? 'Save Changes'
                    : 'Create Hotel Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER HOTEL INSPECTOR DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(previewHotel)}
        onClose={() => setPreviewHotelId(null)}
        title={previewHotel?.hotelName || 'Hotel Stay Details'}
        subtitle={
          previewHotel
            ? `${previewHotel.region || 'Destination'} · Handled by ${previewHotel.staff || 'Unassigned'}`
            : ''
        }
        width="540px"
        footer={
          previewHotel ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = previewHotel;
                  setPreviewHotelId(null);
                  handleDuplicateStay(target);
                }}
                style={{
                  background: subtleSurface,
                  border: `1px solid ${chipBorder}`,
                  color: 'var(--primary)'
                }}
              >
                <Copy size={15} /> Duplicate Next Stay
              </button>

              {canEditRecord(previewHotel.staff) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const target = previewHotel;
                    setPreviewHotelId(null);
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
        {previewHotel && (() => {
          const statusMeta = getStatusMeta(previewHotel.status, isLight);
          const nights = calculateStayNights(previewHotel.checkIn, previewHotel.checkOut) ?? 0;
          const guests = parseGuestNames(previewHotel.guestList);
          const portalPath = getGuestPortalPath(previewHotel);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Status & Confirmation Header Card */}
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
                    Confirmation Number
                  </div>
                  {previewHotel.confirmationNumber ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                        {previewHotel.confirmationNumber}
                      </strong>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            previewHotel.confirmationNumber,
                            `Copied confirmation # ${previewHotel.confirmationNumber}`
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                        title="Copy Confirmation #"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.2rem' }}>
                      Pending Confirmation #
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

              {/* Stay Dates & Room Type */}
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
                      Check-In
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {formatDisplayDate(previewHotel.checkIn, true)}
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
                      Check-Out
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {formatDisplayDate(previewHotel.checkOut, true)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '0.9rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.84rem'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BedDouble size={15} color="var(--primary)" /> Room Configuration:
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {previewHotel.roomType || 'Standard / Not specified'}
                  </strong>
                </div>
              </div>

              {/* Guest Status Portal Card */}
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
                      Guest Status Portal
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Share live hotel voucher & check-in status with the traveler.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleCopyGuestPortal(previewHotel)}
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

              {/* Guest List */}
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
                    Guest List
                  </span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {guests.length} {guests.length === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <div
                  style={{
                    padding: '0.95rem',
                    borderRadius: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {guests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {guests.map((guestName, idx) => (
                        <span
                          key={`${guestName}-${idx}`}
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
                          {idx + 1}. {guestName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No guest names listed on this booking.
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier & Booking Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Supplier / Bedbank
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {previewHotel.supplierName || 'Not specified'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Code: <strong style={{ color: 'var(--primary)' }}>{previewHotel.supplierCode || '-'}</strong>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Booking Metadata
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {previewHotel.staff || 'Unassigned'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    ID: {previewHotel.id}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>
    </div>
  );
};

export default Hotel;
