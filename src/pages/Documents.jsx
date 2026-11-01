import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import CsvImportUtility from '../components/CsvImportUtility';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import { useDocuments } from '../context/DocumentContext';
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
  Globe,
  Clipboard,
  Receipt,
  Phone,
  Ticket,
  BarChart2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Inbox,
  MapPin,
  ArrowUpDown,
  Eye,
  Share2,
  Calendar,
  Search,
  UploadCloud,
  Copy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Building,
  DollarSign,
  MessageCircle,
  Stamp
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

const DOCUMENT_TYPES = [
  'Tourist Visa',
  'Business Visa',
  'E-Visa / Waiver',
  'Passport Renewal',
  'New Passport',
  'KITAS / Stay Permit',
  'Legalization'
];

const POPULAR_VISA_DESTINATIONS = [
  'Schengen',
  'Japan',
  'South Korea',
  'United Kingdom',
  'United States',
  'Australia',
  'China',
  'Taiwan',
  'Canada',
  'Indonesia'
];

const DESTINATION_VENUE_HINTS = {
  Schengen: 'VFS Global Kuningan City Mall Lt. 2, Jakarta',
  Japan: 'JVAC (Japan Visa Application Centre) Lotte Shopping Avenue Lt. 4, Jakarta',
  'South Korea': 'KVAC (Korea Visa Application Center) Lotte Shopping Avenue Lt. 5, Jakarta',
  'United Kingdom': 'VFS Global Kuningan City Mall Lt. 2, Jakarta',
  Canada: 'VFS Global Kuningan City Mall Lt. 2, Jakarta',
  Australia: 'VFS Global Kuningan City Mall Lt. 2, Jakarta (Biometrics)',
  China: 'CVASC (Chinese Visa Application Service Center), Mega Kuningan, Jakarta',
  'United States': 'U.S. Embassy Jakarta, Jl. Medan Merdeka Selatan',
  Taiwan: 'TETO Artha Graha Building, SCBD Jakarta',
  Indonesia: 'Kantor Imigrasi Jakarta Selatan'
};

const POPULAR_VENUES = [
  'VFS Global Kuningan City Mall Lt. 2, Jakarta',
  'TLScontact Menara Anugrah Lt. 2, Mega Kuningan, Jakarta',
  'JVAC Lotte Shopping Avenue Lt. 4, Jakarta',
  'KVAC Lotte Shopping Avenue Lt. 5, Jakarta',
  'CVASC Mega Kuningan, Jakarta',
  'U.S. Embassy Jakarta, Jl. Medan Merdeka Selatan',
  'VFS Global Mall Bali Galeria, Bali',
  'Kantor Imigrasi Jakarta Selatan'
];

const POPULAR_VENDORS = [
  'VFS Global',
  'JVAC',
  'KVAC',
  'TLScontact',
  'CVASC',
  'Direct Embassy',
  'Immigration Office'
];

const POPULAR_COURIERS = [
  'JNE YES',
  'JNE Reguler',
  'J&T Express',
  'SiCepat',
  'TIKI ONS',
  'GoSend / GrabExpress',
  'DHL Express'
];

const SLA_DAY_PRESETS = [2, 3, 5, 7, 10, 14];
const PROCESS_SLA_DAYS = { Urgent: 3, Express: 5, Normal: 10 };

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['#00a8ff', '#38bdf8', '#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

const IMPORT_TEMPLATE_HEADERS = [
  'Guest Name',
  'Document Type',
  'Country',
  'Process Type',
  'Receive Date',
  'Estimated Done',
  'Appointment Date',
  'Appointment Time',
  'Appointment Location',
  'Booking Code',
  'Tour Code',
  'Invoice Number',
  'Vendor / Visa Center',
  'Service Fee',
  'Phone Number',
  'Staff',
  'Shipping Status',
  'Send Date',
  'Shipping Method',
  'Courier',
  'Tracking Resi',
  'Notes'
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
    includeYear ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' }
  );
};

const getDayDiffFromToday = (dateStr) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
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

const getLogisticsStatusMeta = (status, isLight) => {
  if (status === 'Received') {
    return {
      label: 'Delivered',
      badgeClass: 'badge-success',
      customStyle: null,
      dotColor: '#10b981'
    };
  }
  if (status === 'Sent') {
    return {
      label: 'On Delivery',
      badgeClass: 'badge-warning',
      customStyle: null,
      dotColor: '#f59e0b'
    };
  }
  if (status === 'Returned') {
    return {
      label: 'Returned',
      badgeClass: 'badge-danger',
      customStyle: null,
      dotColor: '#ef4444'
    };
  }
  return {
    label: 'Processing',
    badgeClass: 'badge-primary',
    customStyle: isLight
      ? {
          background: 'rgba(0, 168, 255, 0.12)',
          color: '#0284c7',
          border: '1px solid rgba(2, 132, 199, 0.25)'
        }
      : null,
    dotColor: '#00a8ff'
  };
};

const getProcessBadgeClass = (processType) => {
  if (processType === 'Urgent') return 'badge-danger';
  if (processType === 'Express') return 'badge-warning';
  return 'badge-primary';
};

const getDocProgressStage = (doc) => {
  if (doc.shippingStatus === 'Received' || doc.receivedStatus === 'Final') return 4;
  if (doc.shippingStatus === 'Sent' || Boolean(doc.sendDate) || Boolean(doc.shippingResi)) return 3;
  if (doc.estimatedDone) {
    const diff = getDayDiffFromToday(doc.estimatedDone);
    if (diff !== null && diff <= 0) return 2;
  }
  if (doc.appointmentDate) {
    const apptDiff = getDayDiffFromToday(doc.appointmentDate);
    if (apptDiff !== null && apptDiff < 0) return 2;
    return 1;
  }
  if (doc.receiveDate) return 2;
  return 0;
};

const DocChartTooltip = ({ active, payload, label, isLight }) => {
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

const Documents = () => {
  const {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    bulkUpdateDocumentStatus,
    bulkDeleteDocuments,
    bulkImportDocuments
  } = useDocuments();
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
  const [tableScope, setTableScope] = useState('all'); // 'all' | 'processing' | 'appointments' | 'urgent_sla' | 'sent' | 'returned' | 'completed' | 'mine'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal & Drawer states
  const [isModalOpen, setIsModalOpen] = useState(() => Boolean(location.state?.openNew));
  const [editingDoc, setEditingDoc] = useState(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);

  const buildEmptyForm = (prefillEstDate = '') => {
    const todayStr = toDateInputStr(new Date());
    return {
      docType: 'Tourist Visa',
      guestName: '',
      country: '',
      processType: 'Normal',
      receiveDate: todayStr,
      estimatedDone: prefillEstDate || addDaysToDateStr(todayStr, 10),
      sendDate: '',
      bookingCode: '',
      tourCode: '',
      invoiceNumber: '',
      supplier: '',
      price: '',
      phoneNumber: '',
      staff: defaultStaffName,
      appointmentDate: '',
      appointmentTime: '',
      appointmentLocation: '',
      notes: ''
    };
  };

  const [formData, setFormData] = useState(() =>
    buildEmptyForm(location.state?.prefillDate || '')
  );

  // Dispatch (Shipping) & Confirm Receipt Modal States
  const [shippingDoc, setShippingDoc] = useState(null);
  const [shippingData, setShippingData] = useState({
    sendDate: toDateInputStr(new Date()),
    shippingMethod: 'Messenger',
    shippingCourier: '',
    shippingResi: '',
    shippingNotes: ''
  });

  const [receiveDoc, setReceiveDoc] = useState(null);
  const [receiveData, setReceiveData] = useState({
    receivedStatus: 'Final'
  });

  const previewDoc = useMemo(
    () => documents.find((d) => d.id === previewDocId) || null,
    [documents, previewDocId]
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleOpenModal = (doc = null) => {
    setIsDuplicateMode(false);
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        docType: doc.docType || 'Tourist Visa',
        guestName: doc.guestName || '',
        country: doc.country || '',
        processType: doc.processType || 'Normal',
        receiveDate: doc.receiveDate || '',
        estimatedDone: doc.estimatedDone || '',
        sendDate: doc.sendDate || '',
        bookingCode: doc.bookingCode || '',
        tourCode: doc.tourCode || '',
        invoiceNumber: doc.invoiceNumber || '',
        supplier: doc.supplier || '',
        price: doc.price ? String(doc.price) : '',
        phoneNumber: doc.phoneNumber || '',
        staff: doc.staff || defaultStaffName,
        appointmentDate: doc.appointmentDate || '',
        appointmentTime: doc.appointmentTime || '',
        appointmentLocation: doc.appointmentLocation || '',
        notes: doc.notes || ''
      });
    } else {
      setEditingDoc(null);
      setFormData(buildEmptyForm(''));
    }
    setIsModalOpen(true);
  };

  const handleDuplicateApplicant = (doc) => {
    if (!doc) return;
    setEditingDoc(null);
    setIsDuplicateMode(true);
    setFormData({
      docType: doc.docType || 'Tourist Visa',
      guestName: '',
      country: doc.country || '',
      processType: doc.processType || 'Normal',
      receiveDate: doc.receiveDate || toDateInputStr(new Date()),
      estimatedDone: doc.estimatedDone || '',
      sendDate: '',
      bookingCode: doc.bookingCode || '',
      tourCode: doc.tourCode || '',
      invoiceNumber: doc.invoiceNumber || '',
      supplier: doc.supplier || '',
      price: doc.price ? String(doc.price) : '',
      phoneNumber: doc.phoneNumber || '',
      staff: defaultStaffName || doc.staff || '',
      appointmentDate: doc.appointmentDate || '',
      appointmentTime: doc.appointmentTime || '',
      appointmentLocation: doc.appointmentLocation || '',
      notes: doc.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setIsDuplicateMode(false);
  };

  const handleSelectCountryChip = (countryName) => {
    setFormData((prev) => {
      const hintVenue = DESTINATION_VENUE_HINTS[countryName] || '';
      return {
        ...prev,
        country: countryName,
        appointmentLocation: prev.appointmentLocation || hintVenue
      };
    });
  };

  const handleApplySlaDays = (days) => {
    const baseDate = formData.receiveDate || toDateInputStr(new Date());
    setFormData((prev) => ({
      ...prev,
      receiveDate: baseDate,
      estimatedDone: addDaysToDateStr(baseDate, days)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.guestName.trim()) {
      toast.warning('Please enter the Guest / Applicant Name.');
      return;
    }
    if (!formData.receiveDate) {
      toast.warning('Please select a Receive Date.');
      return;
    }
    if (
      formData.receiveDate &&
      formData.estimatedDone &&
      formData.estimatedDone < formData.receiveDate
    ) {
      toast.error('Estimated Done date cannot be earlier than Receive Date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        docType: (formData.docType || 'Tourist Visa').trim(),
        guestName: formData.guestName.trim(),
        country: formData.country.trim(),
        price: Number(formData.price) || 0,
        staff: formData.staff || defaultStaffName
      };

      if (editingDoc) {
        await updateDocument(editingDoc.id, payload);
        toast.success(`Updated document for ${payload.guestName}.`);
      } else {
        await addDocument(payload);
        toast.success(`Added ${payload.docType} record for ${payload.guestName}.`);
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err?.message || 'Failed to save document record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Delete ${doc.docType || 'document'} record for "${doc.guestName}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteDocument(doc.id);
      if (previewDocId === doc.id) setPreviewDocId(null);
      setSelectedIds((prev) => prev.filter((item) => item !== doc.id));
      toast.success(`Deleted document for "${doc.guestName}".`);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete document.');
    }
  };

  const handleOpenShipping = (doc) => {
    setShippingDoc(doc);
    setShippingData({
      sendDate: doc.sendDate || toDateInputStr(new Date()),
      shippingMethod: doc.shippingMethod === 'Ekspedisi' ? 'Courier' : doc.shippingMethod || 'Messenger',
      shippingCourier: doc.shippingCourier || '',
      shippingResi: doc.shippingResi || '',
      shippingNotes: doc.shippingNotes || ''
    });
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (!shippingDoc) return;
    try {
      await updateDocument(shippingDoc.id, {
        sendDate: shippingData.sendDate,
        shippingMethod: shippingData.shippingMethod,
        shippingCourier:
          shippingData.shippingMethod === 'Courier' ? shippingData.shippingCourier.trim() : '',
        shippingResi:
          shippingData.shippingMethod === 'Courier' ? shippingData.shippingResi.trim() : '',
        shippingNotes: shippingData.shippingNotes.trim(),
        shippingStatus: 'Sent'
      });
      toast.success(`Dispatched document for ${shippingDoc.guestName}.`);
      setShippingDoc(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update dispatch status.');
    }
  };

  const handleOpenReceive = (doc) => {
    setReceiveDoc(doc);
    setReceiveData({
      receivedStatus: 'Final'
    });
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveDoc) return;
    try {
      const nextStatus = receiveData.receivedStatus === 'Final' ? 'Received' : 'Returned';
      await updateDocument(receiveDoc.id, {
        receivedStatus: receiveData.receivedStatus,
        shippingStatus: nextStatus
      });
      toast.success(
        nextStatus === 'Received'
          ? `Confirmed final delivery for ${receiveDoc.guestName}.`
          : `Marked ${receiveDoc.guestName}'s document as Returned for re-send.`
      );
      setReceiveDoc(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to confirm receipt.');
    }
  };

  const handleBulkStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateDocumentStatus(selectedIds, targetStatus);
      const label =
        targetStatus === 'Received'
          ? 'Delivered'
          : targetStatus === 'Sent'
          ? 'On Delivery'
          : 'Processing';
      toast.success(`Updated ${selectedIds.length} document(s) to ${label}.`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk status update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected document record(s)?`)) {
      return;
    }
    try {
      await bulkDeleteDocuments(selectedIds);
      if (previewDocId && selectedIds.includes(previewDocId)) {
        setPreviewDocId(null);
      }
      toast.success(`Deleted ${selectedIds.length} document record(s).`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.message || 'Bulk delete failed.');
    }
  };

  const handleCsvImport = async (rows) => {
    try {
      const count = await bulkImportDocuments(rows, defaultStaffName);
      toast.success(`Imported ${count} document record(s) successfully!`);
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

  const getTrackingCode = (doc) =>
    (doc?.bookingCode || doc?.invoiceNumber || doc?.shippingResi || doc?.id || '').trim();

  const getGuestPortalPath = (doc) => {
    const code = getTrackingCode(doc);
    return code ? `/track/${encodeURIComponent(code)}` : '';
  };

  const handleCopyGuestPortal = (doc) => {
    const path = getGuestPortalPath(doc);
    if (!path) return;
    const url = `${window.location.origin}${path}`;
    handleCopyText(url, `Tracking link copied for ${doc.guestName || 'applicant'}`);
  };

  const handleSendAppointmentWhatsApp = (doc) => {
    const guest = doc.guestName || 'Valued Guest';
    const dateFormatted = formatDisplayDate(doc.appointmentDate, true);
    const timeFormatted = doc.appointmentTime ? `${doc.appointmentTime} WIB` : 'As scheduled';
    const venue = doc.appointmentLocation || 'Embassy / Visa Application Center';
    const docLabel = [doc.docType || 'Visa', doc.country].filter(Boolean).join(' - ');
    const portalPath = getGuestPortalPath(doc);
    const portalUrl = portalPath ? `\n\nTrack live progress: ${window.location.origin}${portalPath}` : '';

    const message = `Hello ${guest},\n\nHere is your Visa / Biometric Appointment schedule for *${docLabel}*:\n- Date: ${dateFormatted}\n- Time: ${timeFormatted}\n- Venue: ${venue}\n\nPlease arrive 15-20 minutes early with your original passport, required supporting documents, and appointment confirmation.${portalUrl}\n\nBest regards,\nTravelOps Team`;

    const digits = normalizeWhatsAppDigits(doc.phoneNumber);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendDeliveryWhatsApp = (doc) => {
    const guest = doc.guestName || 'Valued Guest';
    const docLabel = [doc.docType || 'Passport / Visa', doc.country].filter(Boolean).join(' - ');
    const method = doc.shippingMethod || 'Courier';
    const courierLine = doc.shippingCourier
      ? `\n- Courier: ${doc.shippingCourier}${doc.shippingResi ? `\n- Tracking AWB (Resi): ${doc.shippingResi}` : ''}`
      : '';
    const portalPath = getGuestPortalPath(doc);
    const portalUrl = portalPath ? `\n\nLive Status Pass: ${window.location.origin}${portalPath}` : '';

    const message = `Hello ${guest},\n\nYour *${docLabel}* document has been dispatched!\n- Dispatch Date: ${formatDisplayDate(doc.sendDate, true)}\n- Method: ${method}${courierLine}${portalUrl}\n\nThank you for choosing TravelOps!`;

    const digits = normalizeWhatsAppDigits(doc.phoneNumber);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Enrich documents with local-date SLA & appointment countdowns
  const enrichedDocuments = useMemo(() => {
    return documents.map((d) => {
      const normalizedDocType = (d.docType || '').trim() || 'Tourist Visa';
      const diffEst = getDayDiffFromToday(d.estimatedDone);
      const diffAppt = getDayDiffFromToday(d.appointmentDate);
      const isInProcess = d.shippingStatus === 'Processing' || d.shippingStatus === 'Returned';
      const isSent = d.shippingStatus === 'Sent';
      const isCompleted = d.shippingStatus === 'Received';
      const isOverdue = isInProcess && diffEst !== null && diffEst < 0;
      const isDueSoon = isInProcess && diffEst !== null && diffEst <= 2;
      const hasUpcomingAppt = !isCompleted && diffAppt !== null && diffAppt >= 0;
      const hasAppt7d = hasUpcomingAppt && diffAppt <= 7;
      const receiveYear =
        d.receiveDate && /^\d{4}/.test(d.receiveDate) ? d.receiveDate.substring(0, 4) : '';

      // Turnaround days (receiveDate -> sendDate)
      let turnaroundDays = null;
      const rDate = parseLocalDay(d.receiveDate);
      const sDate = parseLocalDay(d.sendDate);
      if (rDate && sDate && sDate >= rDate) {
        turnaroundDays = Math.round((sDate - rDate) / 86400000);
      }

      return {
        ...d,
        docType: normalizedDocType,
        diffEst,
        diffAppt,
        isInProcess,
        isSent,
        isCompleted,
        isOverdue,
        isDueSoon,
        hasUpcomingAppt,
        hasAppt7d,
        receiveYear,
        turnaroundDays
      };
    });
  }, [documents]);

  const availableYears = useMemo(() => {
    const set = new Set();
    enrichedDocuments.forEach((d) => {
      if (d.receiveYear) set.add(d.receiveYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [enrichedDocuments]);

  // Scope counts for All Documents pills
  const scopeCounts = useMemo(() => {
    let processing = 0;
    let appointments = 0;
    let urgentSla = 0;
    let sent = 0;
    let returned = 0;
    let completed = 0;
    let mine = 0;

    enrichedDocuments.forEach((d) => {
      if (d.shippingStatus === 'Processing') processing += 1;
      if (d.hasAppt7d) appointments += 1;
      if (d.isDueSoon) urgentSla += 1;
      if (d.shippingStatus === 'Sent') sent += 1;
      if (d.shippingStatus === 'Returned') returned += 1;
      if (d.shippingStatus === 'Received') completed += 1;
      if (currentUserName && d.staff === currentUserName) mine += 1;
    });

    return {
      all: enrichedDocuments.length,
      processing,
      appointments,
      urgent_sla: urgentSla,
      sent,
      returned,
      completed,
      mine
    };
  }, [enrichedDocuments, currentUserName]);

  const scopedDocuments = useMemo(() => {
    return enrichedDocuments.filter((d) => {
      if (tableScope === 'processing') return d.shippingStatus === 'Processing';
      if (tableScope === 'appointments') return d.hasAppt7d;
      if (tableScope === 'urgent_sla') return d.isDueSoon;
      if (tableScope === 'sent') return d.shippingStatus === 'Sent';
      if (tableScope === 'returned') return d.shippingStatus === 'Returned';
      if (tableScope === 'completed') return d.shippingStatus === 'Received';
      if (tableScope === 'mine') return Boolean(currentUserName) && d.staff === currentUserName;
      return true;
    });
  }, [enrichedDocuments, tableScope, currentUserName]);

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
  } = useDataTable(scopedDocuments, { key: 'receiveDate', direction: 'desc' }, 10);

  const exportableTableData = useMemo(() => {
    let list = [...scopedDocuments];
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      list = list.filter((item) =>
        [
          item.guestName,
          item.docType,
          item.country,
          item.processType,
          item.bookingCode,
          item.tourCode,
          item.invoiceNumber,
          item.supplier,
          item.shippingCourier,
          item.shippingResi,
          item.appointmentLocation,
          item.phoneNumber,
          item.notes,
          item.staff,
          item.shippingStatus
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
  }, [scopedDocuments, globalSearch, filters]);

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

  const drillIntoDocuments = ({ scope = 'all', search = '' }) => {
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
        ? enrichedDocuments
        : enrichedDocuments.filter((d) => d.receiveYear === selectedYear);

    const processingList = yearFiltered.filter((d) => d.isInProcess);
    const sentList = yearFiltered.filter((d) => d.isSent);
    const completedList = yearFiltered.filter((d) => d.isCompleted);
    const urgentSlaList = yearFiltered.filter((d) => d.isDueSoon);
    const overdueOnlyCount = yearFiltered.filter((d) => d.isOverdue).length;

    const withTurnaround = yearFiltered.filter((d) => d.turnaroundDays !== null);
    const avgTurnaround =
      withTurnaround.length > 0
        ? (
            withTurnaround.reduce((sum, d) => sum + d.turnaroundDays, 0) /
            withTurnaround.length
          ).toFixed(1)
        : '0.0';

    // Upcoming Appointments (live across all active docs)
    const upcomingAppointments = enrichedDocuments
      .filter((d) => d.hasUpcomingAppt)
      .sort((a, b) => {
        const cmpDate = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        if (cmpDate !== 0) return cmpDate;
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      });

    const apptTodayTomorrowCount = upcomingAppointments.filter(
      (d) => d.diffAppt !== null && d.diffAppt <= 1
    ).length;

    // SLA Watchlist: Overdue or Due in <= 2 days
    const slaWatchlist = enrichedDocuments
      .filter((d) => d.isDueSoon)
      .sort((a, b) => (a.estimatedDone || '').localeCompare(b.estimatedDone || ''))
      .slice(0, 6);

    // Monthly Intake vs Completed
    const monthlyBuckets = MONTH_LABELS.map((m) => ({
      month: m,
      Intake: 0,
      Delivered: 0
    }));
    yearFiltered.forEach((d) => {
      const rDate = parseLocalDay(d.receiveDate);
      if (rDate) {
        const idx = rDate.getMonth();
        monthlyBuckets[idx].Intake += 1;
        if (d.isCompleted || d.isSent) {
          monthlyBuckets[idx].Delivered += 1;
        }
      }
    });

    // Workload by Consultant (Active vs Completed, non-colliding names)
    const staffCounts = {};
    yearFiltered.forEach((d) => {
      const s = d.staff || 'Unassigned';
      if (!staffCounts[s]) {
        const parts = s.trim().split(/\s+/);
        const label = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        staffCounts[s] = { fullName: s, name: label, Active: 0, Delivered: 0 };
      }
      if (d.isCompleted) staffCounts[s].Delivered += 1;
      else staffCounts[s].Active += 1;
    });
    const workloadData = Object.values(staffCounts).sort(
      (a, b) => b.Active + b.Delivered - (a.Active + a.Delivered)
    );

    // Top Visa Destinations
    const countryCounts = {};
    yearFiltered.forEach((d) => {
      const c = d.country || 'Unspecified';
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });
    const countryData = Object.keys(countryCounts)
      .map((name, idx) => ({
        name,
        value: countryCounts[name],
        pct:
          yearFiltered.length > 0
            ? Math.round((countryCounts[name] / yearFiltered.length) * 100)
            : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Document Type & Urgency Breakdown
    const typeCounts = {};
    const speedCounts = { Normal: 0, Express: 0, Urgent: 0 };
    yearFiltered.forEach((d) => {
      const t = d.docType || 'Tourist Visa';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      if (speedCounts[d.processType] !== undefined) {
        speedCounts[d.processType] += 1;
      }
    });
    const docTypeData = Object.keys(typeCounts)
      .map((name) => ({ name, count: typeCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      processingCount: processingList.length,
      sentCount: sentList.length,
      completedCount: completedList.length,
      urgentSlaCount: urgentSlaList.length,
      overdueOnlyCount,
      avgTurnaround,
      upcomingAppointments,
      apptTodayTomorrowCount,
      slaWatchlist,
      monthlyBuckets,
      workloadData,
      countryData,
      docTypeData,
      speedCounts
    };
  }, [enrichedDocuments, selectedYear]);

  const exportColumns = [
    { header: 'Receive Date', key: 'receiveDate', format: null },
    { header: 'Guest Name', key: 'guestName', format: null },
    { header: 'Document Type', key: 'docType', format: null },
    { header: 'Country', key: 'country', format: null },
    { header: 'Process Type', key: 'processType', format: null },
    { header: 'Estimated Done', key: 'estimatedDone', format: null },
    { header: 'Appointment Date', key: 'appointmentDate', format: null },
    { header: 'Appointment Time', key: 'appointmentTime', format: null },
    { header: 'Appointment Location', key: 'appointmentLocation', format: null },
    { header: 'Booking Code', key: 'bookingCode', format: null },
    { header: 'Tour Code', key: 'tourCode', format: null },
    { header: 'Invoice Number', key: 'invoiceNumber', format: null },
    { header: 'Vendor / Visa Center', key: 'supplier', format: null },
    { header: 'Service Fee', key: 'price', format: null },
    { header: 'Phone Number', key: 'phoneNumber', format: null },
    { header: 'Staff', key: 'staff', format: null },
    { header: 'Shipping Status', key: 'shippingStatus', format: null },
    { header: 'Send Date', key: 'sendDate', format: null },
    { header: 'Shipping Method', key: 'shippingMethod', format: null },
    { header: 'Courier', key: 'shippingCourier', format: null },
    { header: 'Tracking Resi', key: 'shippingResi', format: null },
    { header: 'Notes', key: 'notes', format: null }
  ];

  // Page-level selection helpers
  const pageIds = paginatedData.map((d) => d.id);
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
                  Visa & Documents
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Track passport & visa applications, biometric appointments, SLA deadlines, courier airwaybills, and client tracking portals.
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
                  <Plus size={18} /> Add Visa / Document
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

            {/* Navigation Tabs + Year / Export Controls */}
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
                <BarChart2 size={16} /> Overview & Schedule
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <FileText size={16} /> All Documents
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
                  {documents.length}
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
                  data={activeTab === 'database' ? exportableTableData : enrichedDocuments}
                  columns={exportColumns}
                  filename={activeTab === 'database' ? 'Documents_Filtered' : 'Documents_All'}
                />
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="fade-in">
                {/* 5 Clickable Visa Operations KPIs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. In Processing */}
                  <div
                    className="card"
                    onClick={() => drillIntoDocuments({ scope: 'processing' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid var(--primary)'
                    }}
                    title="Click to view documents currently in processing"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        In Processing
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
                      {overviewMetrics.processingCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      At intake or embassy review
                    </div>
                  </div>

                  {/* 2. On Delivery (In Transit) */}
                  <div
                    className="card"
                    onClick={() => drillIntoDocuments({ scope: 'sent' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #f59e0b'
                    }}
                    title="Click to view dispatched documents awaiting final receipt"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        On Delivery
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Truck size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.sentCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Sent via courier / messenger
                    </div>
                  </div>

                  {/* 3. Upcoming Appointments */}
                  <div
                    className="card"
                    onClick={() => drillIntoDocuments({ scope: 'appointments' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #6366f1'
                    }}
                    title="Click to filter upcoming biometric & embassy appointments"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Visa Appointments
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
                        <Calendar size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.upcomingAppointments.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem' }}>
                      {overviewMetrics.apptTodayTomorrowCount > 0
                        ? `${overviewMetrics.apptTodayTomorrowCount} scheduled today / tomorrow`
                        : 'Biometrics & embassy interviews'}
                    </div>
                  </div>

                  {/* 4. Overdue & Due Soon (2d) */}
                  <div
                    className="card"
                    onClick={() => drillIntoDocuments({ scope: 'urgent_sla' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: `3px solid ${overviewMetrics.urgentSlaCount > 0 ? '#ef4444' : '#10b981'}`
                    }}
                    title="Click to inspect overdue or due-soon documents"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Overdue / Due (2d)
                      </span>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background:
                            overviewMetrics.urgentSlaCount > 0
                              ? 'rgba(239, 68, 68, 0.14)'
                              : 'rgba(16, 185, 129, 0.12)',
                          color: overviewMetrics.urgentSlaCount > 0 ? '#ef4444' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {overviewMetrics.urgentSlaCount > 0 ? (
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
                        color: overviewMetrics.urgentSlaCount > 0 ? '#ef4444' : 'var(--text-main)',
                        lineHeight: 1.1
                      }}
                    >
                      {overviewMetrics.urgentSlaCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {overviewMetrics.overdueOnlyCount > 0
                        ? `${overviewMetrics.overdueOnlyCount} past estimated done date`
                        : 'All active SLAs on track'}
                    </div>
                  </div>

                  {/* 5. Completed & Avg Turnaround */}
                  <div
                    className="card"
                    onClick={() => drillIntoDocuments({ scope: 'completed' })}
                    style={{
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      borderLeft: '3px solid #10b981'
                    }}
                    title="Click to view completed & delivered documents"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Delivered
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
                        <CheckCircle2 size={17} />
                      </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {overviewMetrics.completedCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Avg {overviewMetrics.avgTurnaround} days turnaround
                    </div>
                  </div>
                </div>

                {/* Operational Radars: Upcoming Visa Appointments & SLA Watchlist */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* Panel A: Upcoming Biometric & Embassy Appointments */}
                  <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.95rem'
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '0.98rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <Calendar size={17} color="var(--primary)" />
                          Upcoming Biometric & Embassy Appointments
                        </h3>
                        <p style={{ margin: '0.18rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Send 1-click WhatsApp reminders ahead of guest appointments.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => drillIntoDocuments({ scope: 'appointments' })}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.76rem',
                          background: subtleSurface,
                          border: `1px solid ${chipBorder}`,
                          color: 'var(--primary)'
                        }}
                      >
                        7-Day Queue ({scopeCounts.appointments})
                      </button>
                    </div>

                    {overviewMetrics.upcomingAppointments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {overviewMetrics.upcomingAppointments.slice(0, 5).map((doc) => {
                          const apptLabel =
                            doc.diffAppt === 0
                              ? 'Today'
                              : doc.diffAppt === 1
                              ? 'Tomorrow'
                              : `In ${doc.diffAppt}d`;
                          const isImminent = doc.diffAppt !== null && doc.diffAppt <= 1;

                          return (
                            <div
                              key={doc.id}
                              onClick={() => setPreviewDocId(doc.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                padding: '0.75rem 0.9rem',
                                borderRadius: '0.7rem',
                                background: subtleSurface,
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      padding: '0.16rem 0.52rem',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      background: isImminent
                                        ? 'rgba(245, 158, 11, 0.16)'
                                        : 'rgba(0, 168, 255, 0.14)',
                                      color: isImminent ? '#f59e0b' : 'var(--primary)'
                                    }}
                                  >
                                    {apptLabel}
                                  </span>
                                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                    {doc.guestName}
                                  </strong>
                                  <span style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    · {doc.country || doc.docType}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize: '0.76rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.2rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {formatDisplayDate(doc.appointmentDate, true)}
                                  {doc.appointmentTime ? ` at ${doc.appointmentTime}` : ''}
                                  {doc.appointmentLocation ? ` · ${doc.appointmentLocation}` : ''}
                                </div>
                              </div>

                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => handleSendAppointmentWhatsApp(doc)}
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    color: '#10b981',
                                    fontSize: '0.74rem'
                                  }}
                                  title="Send Appointment Reminder via WhatsApp"
                                >
                                  <MessageCircle size={13} /> WA
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => setPreviewDocId(doc.id)}
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)'
                                  }}
                                  title="Inspect Document"
                                >
                                  <Eye size={13} />
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
                          fontSize: '0.84rem'
                        }}
                      >
                        No upcoming biometric or embassy appointments scheduled.
                      </div>
                    )}
                  </div>

                  {/* Panel B: SLA Watchlist (Overdue & Due Within 2 Days) */}
                  <div className="card" style={{ padding: '1.25rem 1.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.95rem'
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '0.98rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <AlertTriangle
                            size={17}
                            color={overviewMetrics.slaWatchlist.length > 0 ? '#ef4444' : '#10b981'}
                          />
                          SLA Release Watchlist (Overdue & Due in 2d)
                        </h3>
                        <p style={{ margin: '0.18rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Documents approaching or past estimated completion that need dispatch.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => drillIntoDocuments({ scope: 'urgent_sla' })}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.76rem',
                          background: subtleSurface,
                          border: `1px solid ${chipBorder}`,
                          color: 'var(--primary)'
                        }}
                      >
                        View All ({scopeCounts.urgent_sla})
                      </button>
                    </div>

                    {overviewMetrics.slaWatchlist.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {overviewMetrics.slaWatchlist.map((doc) => {
                          const slaLabel =
                            doc.diffEst < 0
                              ? `${Math.abs(doc.diffEst)}d Overdue`
                              : doc.diffEst === 0
                              ? 'Due Today'
                              : doc.diffEst === 1
                              ? 'Tomorrow'
                              : `In ${doc.diffEst}d`;
                          const isLate = doc.diffEst <= 0;

                          return (
                            <div
                              key={doc.id}
                              onClick={() => setPreviewDocId(doc.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                padding: '0.75rem 0.9rem',
                                borderRadius: '0.7rem',
                                background: subtleSurface,
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      padding: '0.16rem 0.52rem',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      background: isLate
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(245, 158, 11, 0.16)',
                                      color: isLate ? '#ef4444' : '#f59e0b'
                                    }}
                                  >
                                    {slaLabel}
                                  </span>
                                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                    {doc.guestName}
                                  </strong>
                                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                    · {doc.docType} ({doc.country || '-'})
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                  Est. Done: {formatDisplayDate(doc.estimatedDone, true)} · {doc.processType} · PIC: {doc.staff || '-'}
                                </div>
                              </div>

                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {canEditRecord(doc.staff) && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => handleOpenShipping(doc)}
                                    style={{
                                      padding: '0.35rem 0.55rem',
                                      background: 'rgba(245, 158, 11, 0.14)',
                                      border: '1px solid rgba(245, 158, 11, 0.28)',
                                      color: '#f59e0b',
                                      fontSize: '0.74rem'
                                    }}
                                    title="Dispatch Document"
                                  >
                                    <Truck size={13} /> Dispatch
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => setPreviewDocId(doc.id)}
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    background: isLight ? '#ffffff' : 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)'
                                  }}
                                  title="Inspect Document"
                                >
                                  <Eye size={13} />
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
                          fontSize: '0.84rem'
                        }}
                      >
                        No overdue or imminent document releases right now.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Analytics Charts Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. Monthly Intake vs Delivered */}
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
                      Monthly Intake vs Dispatched ({selectedYear === 'All' ? 'All Years' : selectedYear})
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                      {documents.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.monthlyBuckets} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<DocChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Intake" fill="#00a8ff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No document intake recorded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Workload by Consultant */}
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
                      <User size={18} color="var(--primary)" />
                      Workload by Consultant (PIC)
                    </h3>
                    <div style={{ height: '260px', width: '100%' }}>
                      {overviewMetrics.workloadData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewMetrics.workloadData} margin={{ top: 5, right: 12, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip content={<DocChartTooltip isLight={isLight} />} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                            <Bar dataKey="Active" stackId="a" fill="#00a8ff" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Delivered" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No consultant workload data.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Top Visa Destinations */}
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
                      <Globe size={18} color="var(--primary)" />
                      Top Visa & Passport Destinations
                    </h3>
                    {overviewMetrics.countryData.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1rem', alignItems: 'center', minHeight: '235px' }}>
                        <div style={{ height: '180px', width: '160px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={overviewMetrics.countryData.slice(0, 7)}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={72}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {overviewMetrics.countryData.slice(0, 7).map((entry, idx) => (
                                  <Cell key={`country-cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<DocChartTooltip isLight={isLight} />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {overviewMetrics.countryData.slice(0, 6).map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() =>
                                drillIntoDocuments({
                                  scope: 'all',
                                  search: item.name === 'Unspecified' ? '' : item.name
                                })
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: subtleSurface,
                                border: '1px solid var(--border)',
                                borderRadius: '0.55rem',
                                padding: '0.4rem 0.7rem',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem'
                              }}
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
                      <div style={{ height: '235px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No destination records yet.
                      </div>
                    )}
                  </div>

                  {/* 4. Document Type & Speed Mix */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: 'var(--text-main)'
                        }}
                      >
                        <Stamp size={18} color="var(--primary)" />
                        Document Types & Speed Mix
                      </h3>

                      <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span
                          onClick={() => drillIntoDocuments({ scope: 'all', search: 'Normal' })}
                          style={{ cursor: 'pointer', padding: '0.15rem 0.5rem', borderRadius: '999px', background: chipBg, color: 'var(--primary)' }}
                        >
                          Normal: {overviewMetrics.speedCounts.Normal}
                        </span>
                        <span
                          onClick={() => drillIntoDocuments({ scope: 'all', search: 'Express' })}
                          style={{ cursor: 'pointer', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b' }}
                        >
                          Express: {overviewMetrics.speedCounts.Express}
                        </span>
                        <span
                          onClick={() => drillIntoDocuments({ scope: 'all', search: 'Urgent' })}
                          style={{ cursor: 'pointer', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444' }}
                        >
                          Urgent: {overviewMetrics.speedCounts.Urgent}
                        </span>
                      </div>
                    </div>

                    {overviewMetrics.docTypeData.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', minHeight: '215px' }}>
                        {overviewMetrics.docTypeData.map((dt) => {
                          const maxCount = Math.max(overviewMetrics.docTypeData[0]?.count || 1, 1);
                          const widthPct = Math.max(8, Math.round((dt.count / maxCount) * 100));
                          return (
                            <div
                              key={dt.name}
                              onClick={() => drillIntoDocuments({ scope: 'all', search: dt.name })}
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.26rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dt.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{dt.count} docs</span>
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
                      <div style={{ height: '215px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No document type data yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ALL DOCUMENTS TAB */
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
                      { id: 'all', label: 'All Documents', count: scopeCounts.all },
                      { id: 'processing', label: 'In Processing', count: scopeCounts.processing },
                      { id: 'appointments', label: 'Appointments (7d)', count: scopeCounts.appointments },
                      { id: 'urgent_sla', label: 'Overdue / Due (2d)', count: scopeCounts.urgent_sla },
                      { id: 'sent', label: 'On Delivery', count: scopeCounts.sent },
                      { id: 'returned', label: 'Returned', count: scopeCounts.returned },
                      { id: 'completed', label: 'Delivered', count: scopeCounts.completed },
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
                        placeholder="Search applicant, doc type, country, booking/tour code, invoice #, courier AWB (resi), venue, or staff..."
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
                        <span>{selectedIds.length} document(s) selected</span>
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
                          onClick={() => handleBulkStatus('Sent')}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.78rem',
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.28)'
                          }}
                        >
                          <Truck size={14} /> Mark Dispatched
                        </button>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkStatus('Received')}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.78rem',
                            background: 'rgba(16, 185, 129, 0.14)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.28)'
                          }}
                        >
                          <CheckCircle2 size={14} /> Mark Delivered
                        </button>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleBulkStatus('Processing')}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.78rem',
                            background: chipBg,
                            color: 'var(--primary)',
                            border: `1px solid ${chipBorder}`
                          }}
                        >
                          <Clock size={14} /> Reset Processing
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

                {/* Theme-Aware Documents Table */}
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
                              aria-label="Select all documents on page"
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('guestName')}
                            >
                              APPLICANT & REFS
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'guestName' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('country')}
                            >
                              DOCUMENT & COUNTRY
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'country' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('receiveDate')}
                            >
                              INTAKE & EST. DONE
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'receiveDate' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('appointmentDate')}
                            >
                              VISA APPOINTMENT
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'appointmentDate' ? 'var(--primary)' : 'currentColor'}
                              />
                            </div>
                          </th>
                          <th>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              onClick={() => handleSort('shippingStatus')}
                            >
                              LOGISTICS & AWB
                              <ArrowUpDown
                                size={13}
                                color={sortConfig.key === 'shippingStatus' ? 'var(--primary)' : 'currentColor'}
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
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedData.map((doc) => {
                          const statusMeta = getLogisticsStatusMeta(doc.shippingStatus, isLight);
                          const isSelected = selectedIds.includes(doc.id);
                          const editable = canEditRecord(doc.staff);
                          const refParts = [
                            doc.bookingCode ? `BKG: ${doc.bookingCode}` : null,
                            doc.tourCode ? `Tour: ${doc.tourCode}` : null,
                            doc.invoiceNumber ? `Inv: ${doc.invoiceNumber}` : null
                          ].filter(Boolean);

                          return (
                            <tr
                              key={doc.id}
                              onClick={() => setPreviewDocId(doc.id)}
                              style={{
                                cursor: 'pointer',
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
                                  onChange={() => toggleSelectOne(doc.id)}
                                  aria-label={`Select ${doc.guestName}`}
                                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                              </td>

                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {doc.guestName || '-'}
                                </div>
                                {refParts.length > 0 ? (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    {refParts.join(' · ')}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    ID: {doc.id}
                                  </div>
                                )}
                              </td>

                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)' }}>
                                    {doc.country || 'International'}
                                  </span>
                                  <span
                                    className={`badge ${getProcessBadgeClass(doc.processType)}`}
                                    style={{ fontSize: '0.68rem', padding: '0.08rem 0.45rem' }}
                                  >
                                    {doc.processType || 'Normal'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.77rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                                  {doc.docType}
                                  {doc.supplier ? (
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                                      {' '}· {doc.supplier}
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              <td>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                  In: {formatDisplayDate(doc.receiveDate, true)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.18rem' }}>
                                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                    Est: {formatDisplayDate(doc.estimatedDone, true)}
                                  </span>
                                  {doc.isDueSoon && (
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        padding: '0.06rem 0.42rem',
                                        borderRadius: '999px',
                                        background:
                                          doc.diffEst <= 0
                                            ? 'rgba(239, 68, 68, 0.15)'
                                            : 'rgba(245, 158, 11, 0.16)',
                                        color: doc.diffEst <= 0 ? '#ef4444' : '#f59e0b'
                                      }}
                                    >
                                      {doc.diffEst < 0
                                        ? `${Math.abs(doc.diffEst)}d late`
                                        : doc.diffEst === 0
                                        ? 'Due Today'
                                        : `In ${doc.diffEst}d`}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td>
                                {doc.appointmentDate ? (
                                  <div style={{ minWidth: '150px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                        {formatDisplayDate(doc.appointmentDate, true)}
                                      </span>
                                      {doc.appointmentTime && (
                                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)' }}>
                                          {doc.appointmentTime}
                                        </span>
                                      )}
                                    </div>
                                    {doc.appointmentLocation && (
                                      <div
                                        style={{
                                          fontSize: '0.73rem',
                                          color: 'var(--text-muted)',
                                          maxWidth: '175px',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          marginTop: '0.12rem'
                                        }}
                                        title={doc.appointmentLocation}
                                      >
                                        {doc.appointmentLocation}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                    Not required / TBD
                                  </span>
                                )}
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

                                {(doc.shippingCourier || doc.shippingResi || doc.shippingMethod) && (
                                  <div
                                    style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {doc.shippingCourier || doc.shippingMethod}
                                    {doc.shippingResi ? (
                                      <>
                                        {' · '}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyText(
                                              doc.shippingResi,
                                              `Copied AWB ${doc.shippingResi}`
                                            )
                                          }
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            color: 'var(--primary)',
                                            fontWeight: 700,
                                            fontSize: '0.74rem',
                                            cursor: 'pointer'
                                          }}
                                          title="Click to copy courier AWB / Resi"
                                        >
                                          {doc.shippingResi}
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
                                )}
                              </td>

                              <td style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                                {doc.staff || '-'}
                              </td>

                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.32rem' }}>
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.4rem',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: '#10b981'
                                    }}
                                    onClick={() => setPreviewDocId(doc.id)}
                                    title="Inspect Document"
                                  >
                                    <Eye size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.4rem',
                                      background: 'rgba(0, 168, 255, 0.1)',
                                      color: 'var(--primary)'
                                    }}
                                    onClick={() => handleCopyGuestPortal(doc)}
                                    title="Copy Client Status Tracking Link"
                                  >
                                    <Share2 size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.4rem',
                                      background: isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.12)',
                                      color: 'var(--text-main)'
                                    }}
                                    onClick={() => handleDuplicateApplicant(doc)}
                                    title="Duplicate for Family / Group Applicant"
                                  >
                                    <Copy size={15} />
                                  </button>

                                  {editable && (
                                    <>
                                      {doc.shippingStatus !== 'Sent' &&
                                        doc.shippingStatus !== 'Received' && (
                                          <button
                                            type="button"
                                            className="btn"
                                            style={{
                                              padding: '0.4rem',
                                              background: 'rgba(245, 158, 11, 0.12)',
                                              color: '#f59e0b'
                                            }}
                                            onClick={() => handleOpenShipping(doc)}
                                            title="Dispatch Document (Messenger / Courier)"
                                          >
                                            <Truck size={15} />
                                          </button>
                                        )}

                                      {doc.shippingStatus === 'Sent' && (
                                        <button
                                          type="button"
                                          className="btn"
                                          style={{
                                            padding: '0.4rem',
                                            background: 'rgba(16, 185, 129, 0.14)',
                                            color: '#10b981'
                                          }}
                                          onClick={() => handleOpenReceive(doc)}
                                          title="Confirm Delivery / Receipt"
                                        >
                                          <Inbox size={15} />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        className="btn"
                                        style={{
                                          padding: '0.4rem',
                                          background: 'rgba(0, 168, 255, 0.12)',
                                          color: 'var(--primary)'
                                        }}
                                        onClick={() => handleOpenModal(doc)}
                                        title="Edit Document"
                                      >
                                        <Edit2 size={15} />
                                      </button>
                                    </>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="btn"
                                      style={{
                                        padding: '0.4rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: 'var(--danger)'
                                      }}
                                      onClick={() => handleDelete(doc)}
                                      title="Delete Document"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {documents.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.75rem 1.5rem', color: 'var(--text-muted)' }}>
                              No visa or document records yet. Click <strong>Add Visa / Document</strong> or <strong>Import Excel / CSV</strong> to begin.
                            </td>
                          </tr>
                        )}

                        {documents.length > 0 && paginatedData.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                              <div>No documents match your active filters.</div>
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

      {/* ADD / EDIT / FAMILY DUPLICATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content fade-in"
            style={{
              maxWidth: '860px',
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
                  <Stamp size={20} color="var(--primary)" />
                  {editingDoc
                    ? 'Edit Visa / Document Record'
                    : isDuplicateMode
                    ? 'Duplicate for Family / Group Applicant'
                    : 'Add Visa / Document Record'}
                </h2>
                {isDuplicateMode && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Destination, booking/tour code, SLA dates, and appointment slot pre-filled. Enter the next family/group member&apos;s name.
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
                {/* Row 1: Document Type & Country */}
                <div className="input-group">
                  <label>
                    Document Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Stamp size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Tourist Visa, Passport Renewal"
                      value={formData.docType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, docType: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {DOCUMENT_TYPES.slice(0, 5).map((dt) => (
                      <button
                        key={dt}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, docType: dt }))}
                        style={{
                          border: `1px solid ${formData.docType === dt ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.docType === dt ? chipBg : 'transparent',
                          color: formData.docType === dt ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {dt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Destination Country / Embassy</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., Japan, Schengen, South Korea"
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_VISA_DESTINATIONS.slice(0, 6).map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => handleSelectCountryChip(dest)}
                        style={{
                          border: `1px solid ${formData.country === dest ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.country === dest ? chipBg : 'transparent',
                          color: formData.country === dest ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: Guest Name & Phone Number */}
                <div className="input-group">
                  <label>
                    Applicant / Guest Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      required
                      placeholder="Applicant name as on passport"
                      value={formData.guestName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guestName: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Applicant Phone / WhatsApp</label>
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

                {/* Row 3: Process Speed, Receive Date & Estimated Done */}
                <div className="input-group">
                  <label>
                    Process Speed <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.processType}
                    onChange={(e) => {
                      const nextSpeed = e.target.value;
                      const suggestedDays = PROCESS_SLA_DAYS[nextSpeed];
                      setFormData((prev) => ({
                        ...prev,
                        processType: nextSpeed,
                        estimatedDone:
                          !editingDoc && prev.receiveDate && suggestedDays
                            ? addDaysToDateStr(prev.receiveDate, suggestedDays)
                            : prev.estimatedDone
                      }));
                    }}
                    style={fieldStyle}
                  >
                    <option value="Normal">Normal (Standard SLA)</option>
                    <option value="Express">Express (Priority)</option>
                    <option value="Urgent">Urgent (Same / Next-Day Rush)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>
                    Receive Date (Intake) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.receiveDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, receiveDate: e.target.value }))}
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <label>Estimated Completion Date</label>
                  <input
                    type="date"
                    min={formData.receiveDate || undefined}
                    value={formData.estimatedDone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDone: e.target.value }))}
                    style={fieldStyle}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>SLA:</span>
                    {SLA_DAY_PRESETS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleApplySlaDays(d)}
                        style={{
                          border: `1px solid ${chipBorder}`,
                          background: chipBg,
                          color: 'var(--primary)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.45rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Dispatch / Send Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.sendDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sendDate: e.target.value }))}
                    style={fieldStyle}
                  />
                </div>

                {/* Row 4: Vendor / Visa Center & Service Fee */}
                <div className="input-group">
                  <label>Vendor / Visa Center / Agent</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., VFS Global, JVAC, Partner Agent"
                      value={formData.supplier}
                      onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_VENDORS.slice(0, 5).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, supplier: v }))}
                        style={{
                          border: `1px solid ${formData.supplier === v ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.supplier === v ? chipBg : 'transparent',
                          color: formData.supplier === v ? 'var(--primary)' : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.48rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Service / Visa Fee (IDR)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={iconAdornmentStyle} />
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                {/* Row 5: Booking Code, Tour Code & Invoice Number */}
                <div className="input-group">
                  <label>Booking Code</label>
                  <div style={{ position: 'relative' }}>
                    <Clipboard size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., BKG-2026-01"
                      value={formData.bookingCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bookingCode: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Invoice Number</label>
                  <div style={{ position: 'relative' }}>
                    <Receipt size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="e.g., INV-001"
                      value={formData.invoiceNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                      }
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Linked Tour Code</label>
                  <div style={{ position: 'relative' }}>
                    <Ticket size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      placeholder="Optional group tour code"
                      value={formData.tourCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))}
                      style={iconFieldStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
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
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Assign to me
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

                {/* Row 6: Biometric / Embassy Appointment Card */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: subtleSurface,
                    border: `1.5px solid ${chipBorder}`,
                    borderRadius: '0.75rem',
                    padding: '1.15rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={17} color="var(--primary)" />
                      <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Visa Appointment Schedule (Biometrics / Embassy Interview)
                      </h3>
                    </div>
                    {formData.appointmentDate && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            appointmentDate: '',
                            appointmentTime: ''
                          }))
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.73rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear appointment
                      </button>
                    )}
                  </div>

                  <div className="form-grid" style={{ marginBottom: 0 }}>
                    <div className="input-group">
                      <label>Appointment Date</label>
                      <input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))
                        }
                        style={fieldStyle}
                      />
                    </div>

                    <div className="input-group">
                      <label>Appointment Time</label>
                      <input
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, appointmentTime: e.target.value }))
                        }
                        style={fieldStyle}
                      />
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Appointment Venue / Location</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} style={iconAdornmentStyle} />
                        <input
                          type="text"
                          list="visa-venue-suggestions"
                          placeholder="e.g., VFS Global Kuningan City Mall Lt. 2, Jakarta"
                          value={formData.appointmentLocation}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              appointmentLocation: e.target.value
                            }))
                          }
                          style={iconFieldStyle}
                        />
                      </div>
                      <datalist id="visa-venue-suggestions">
                        {POPULAR_VENUES.map((venue) => (
                          <option key={venue} value={venue} />
                        ))}
                      </datalist>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Sparkles size={11} color="var(--primary)" /> Quick venues:
                        </span>
                        {POPULAR_VENUES.slice(0, 4).map((venue) => (
                          <button
                            key={venue}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, appointmentLocation: venue }))
                            }
                            style={{
                              border: `1px solid ${
                                formData.appointmentLocation === venue
                                  ? 'var(--primary)'
                                  : 'var(--border)'
                              }`,
                              background:
                                formData.appointmentLocation === venue ? chipBg : 'transparent',
                              color:
                                formData.appointmentLocation === venue
                                  ? 'var(--primary)'
                                  : 'var(--text-muted)',
                              borderRadius: '999px',
                              padding: '0.1rem 0.5rem',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {venue.split(',')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 7: Notes */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>Document Checklist & Operational Notes</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {(formData.notes || '').length} / 500
                    </span>
                  </div>
                  <textarea
                    rows="3"
                    maxLength="500"
                    placeholder="Missing bank statement, old passport attached, special courier instructions, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    style={{ ...fieldStyle, marginTop: '0.4rem', resize: 'vertical' }}
                  />
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
                    : editingDoc
                    ? 'Save Changes'
                    : 'Create Document Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH DOCUMENT MODAL */}
      {shippingDoc && (
        <div className="modal-overlay fade-in">
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
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
                background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
              }}
            >
              <h2
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: 0,
                  fontSize: '1.1rem',
                  color: 'var(--text-main)'
                }}
              >
                <Truck size={20} color="#f59e0b" /> Dispatch Document
              </h2>
              <button
                type="button"
                onClick={() => setShippingDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleShippingSubmit} style={{ padding: '1.4rem 1.5rem' }}>
              <div
                style={{
                  background: subtleSurface,
                  padding: '0.9rem 1rem',
                  borderRadius: '0.7rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1.2rem'
                }}
              >
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>
                  {shippingDoc.guestName}
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {shippingDoc.docType} · {shippingDoc.country || 'International'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>
                    Dispatch Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={shippingData.sendDate}
                    onChange={(e) =>
                      setShippingData((prev) => ({ ...prev, sendDate: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <label>
                    Delivery Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={shippingData.shippingMethod}
                    onChange={(e) =>
                      setShippingData((prev) => ({ ...prev, shippingMethod: e.target.value }))
                    }
                    style={fieldStyle}
                  >
                    <option value="Messenger">Internal Messenger</option>
                    <option value="Courier">Courier / Expedition (JNE, DHL, GoSend, etc.)</option>
                    <option value="Self Pickup">Client Self-Pickup at Office</option>
                  </select>
                </div>

                {shippingData.shippingMethod === 'Courier' && (
                  <>
                    <div className="input-group">
                      <label>
                        Courier Service <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., JNE YES, DHL Express, GoSend"
                        value={shippingData.shippingCourier}
                        onChange={(e) =>
                          setShippingData((prev) => ({
                            ...prev,
                            shippingCourier: e.target.value
                          }))
                        }
                        style={fieldStyle}
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {POPULAR_COURIERS.map((cName) => (
                          <button
                            key={cName}
                            type="button"
                            onClick={() =>
                              setShippingData((prev) => ({ ...prev, shippingCourier: cName }))
                            }
                            style={{
                              border: `1px solid ${
                                shippingData.shippingCourier === cName
                                  ? 'var(--primary)'
                                  : 'var(--border)'
                              }`,
                              background:
                                shippingData.shippingCourier === cName ? chipBg : 'transparent',
                              color:
                                shippingData.shippingCourier === cName
                                  ? 'var(--primary)'
                                  : 'var(--text-muted)',
                              borderRadius: '999px',
                              padding: '0.1rem 0.5rem',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {cName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="input-group">
                      <label>
                        Tracking Number / AWB (Resi) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter courier tracking airwaybill..."
                        value={shippingData.shippingResi}
                        onChange={(e) =>
                          setShippingData((prev) => ({ ...prev, shippingResi: e.target.value }))
                        }
                        style={fieldStyle}
                      />
                    </div>
                  </>
                )}

                <div className="input-group">
                  <label>Delivery Notes / Recipient</label>
                  <textarea
                    rows="2"
                    placeholder="e.g., Handed to front-desk reception / Mr. Andi"
                    value={shippingData.shippingNotes}
                    onChange={(e) =>
                      setShippingData((prev) => ({ ...prev, shippingNotes: e.target.value }))
                    }
                    style={{ ...fieldStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.15rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShippingDoc(null)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)'
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM RECEIPT MODAL */}
      {receiveDoc && (
        <div className="modal-overlay fade-in">
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
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
                background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
              }}
            >
              <h2
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: 0,
                  fontSize: '1.1rem',
                  color: 'var(--text-main)'
                }}
              >
                <Inbox size={20} color="#10b981" /> Confirm Delivery Outcome
              </h2>
              <button
                type="button"
                onClick={() => setReceiveDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} style={{ padding: '1.4rem 1.5rem' }}>
              <div
                style={{
                  background: subtleSurface,
                  padding: '0.9rem 1rem',
                  borderRadius: '0.7rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1.2rem'
                }}
              >
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>
                  {receiveDoc.guestName}
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Dispatched via {receiveDoc.shippingMethod || 'Courier'}
                  {receiveDoc.shippingCourier ? ` (${receiveDoc.shippingCourier})` : ''}
                </span>
              </div>

              <div className="input-group">
                <label>
                  Delivery Outcome <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={receiveData.receivedStatus}
                  onChange={(e) => setReceiveData({ receivedStatus: e.target.value })}
                  style={fieldStyle}
                >
                  <option value="Final">Delivered & Received by Client (Final)</option>
                  <option value="Needs Return">Returned / Undelivered (Needs Re-send)</option>
                </select>
              </div>

              {receiveData.receivedStatus === 'Needs Return' && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    display: 'flex',
                    gap: '0.45rem',
                    alignItems: 'center'
                  }}
                >
                  <AlertTriangle size={14} /> Status will change to &quot;Returned&quot; so it can be re-dispatched.
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.15rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => setReceiveDoc(null)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)'
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DOCUMENT INSPECTOR DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDocId(null)}
        title={previewDoc?.guestName || 'Document Details'}
        subtitle={
          previewDoc
            ? `${previewDoc.docType || 'Visa / Passport'} · ${previewDoc.country || 'International'} · Handled by ${previewDoc.staff || 'Unassigned'}`
            : ''
        }
        width="560px"
        footer={
          previewDoc ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = previewDoc;
                  setPreviewDocId(null);
                  handleDuplicateApplicant(target);
                }}
                style={{
                  background: subtleSurface,
                  border: `1px solid ${chipBorder}`,
                  color: 'var(--primary)'
                }}
              >
                <Copy size={15} /> Duplicate Family / Group
              </button>

              {canEditRecord(previewDoc.staff) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const target = previewDoc;
                    setPreviewDocId(null);
                    handleOpenModal(target);
                  }}
                >
                  <Edit2 size={15} /> Edit Document
                </button>
              )}
            </>
          ) : null
        }
      >
        {previewDoc && (() => {
          const statusMeta = getLogisticsStatusMeta(previewDoc.shippingStatus, isLight);
          const stageIdx = getDocProgressStage(previewDoc);
          const portalPath = getGuestPortalPath(previewDoc);
          const editable = canEditRecord(previewDoc.staff);
          const steps = [
            { label: 'Intake', sub: previewDoc.receiveDate ? formatDisplayDate(previewDoc.receiveDate, false) : 'Logged' },
            { label: 'Biometrics', sub: previewDoc.appointmentDate ? formatDisplayDate(previewDoc.appointmentDate, false) : 'Reviewed' },
            { label: 'Embassy', sub: previewDoc.estimatedDone ? `Est. ${formatDisplayDate(previewDoc.estimatedDone, false)}` : 'In process' },
            { label: 'Dispatched', sub: previewDoc.shippingCourier || previewDoc.shippingMethod || 'Courier' },
            { label: 'Delivered', sub: previewDoc.shippingStatus === 'Received' ? 'Complete' : 'Final' }
          ];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Top Status & Quick Logistics Action Banner */}
              <div
                style={{
                  padding: '0.95rem 1.1rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    className={`badge ${statusMeta.badgeClass}`}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.8rem',
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

                  <span
                    className={`badge ${getProcessBadgeClass(previewDoc.processType)}`}
                    style={{ fontSize: '0.76rem', padding: '0.32rem 0.7rem' }}
                  >
                    {previewDoc.processType || 'Normal'} Speed
                  </span>
                </div>

                {editable && (
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    {previewDoc.shippingStatus !== 'Sent' &&
                      previewDoc.shippingStatus !== 'Received' && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleOpenShipping(previewDoc)}
                          style={{
                            padding: '0.38rem 0.75rem',
                            fontSize: '0.76rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#f59e0b'
                          }}
                        >
                          <Truck size={14} /> Dispatch Now
                        </button>
                      )}

                    {previewDoc.shippingStatus === 'Sent' && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleOpenReceive(previewDoc)}
                        style={{
                          padding: '0.38rem 0.75rem',
                          fontSize: '0.76rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#10b981'
                        }}
                      >
                        <Inbox size={14} /> Confirm Delivery
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 5-Stage Visual Progress Stepper */}
              <div
                style={{
                  padding: '1rem 1.05rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.35rem',
                    textAlign: 'center'
                  }}
                >
                  {steps.map((step, idx) => {
                    const done = idx < stageIdx || (stageIdx === 4 && idx === 4);
                    const current = idx === stageIdx && stageIdx < 4;
                    return (
                      <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background:
                              done || current
                                ? 'linear-gradient(135deg, #00a8ff, #0284c7)'
                                : isLight
                                ? '#e2e8f0'
                                : 'rgba(148, 163, 184, 0.14)',
                            color: done || current ? '#ffffff' : 'var(--text-muted)',
                            boxShadow: current ? '0 0 12px rgba(0, 168, 255, 0.4)' : 'none'
                          }}
                        >
                          {done ? <CheckCircle2 size={15} /> : idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            fontWeight: current || done ? 700 : 600,
                            color: current ? 'var(--primary)' : 'var(--text-main)',
                            marginTop: '0.35rem'
                          }}
                        >
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                          {step.sub}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Biometric / Embassy Appointment Card */}
              <div
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: previewDoc.appointmentDate
                    ? isLight
                      ? '#fffbeb'
                      : 'rgba(245, 158, 11, 0.08)'
                    : 'var(--bg-surface)',
                  border: `1px solid ${
                    previewDoc.appointmentDate
                      ? 'rgba(245, 158, 11, 0.35)'
                      : 'var(--border)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} color="#f59e0b" /> Biometric / Embassy Appointment
                  </span>
                  {previewDoc.appointmentDate && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleSendAppointmentWhatsApp(previewDoc)}
                      style={{
                        padding: '0.32rem 0.7rem',
                        fontSize: '0.74rem',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981'
                      }}
                    >
                      <MessageCircle size={13} /> Send WA Reminder
                    </button>
                  )}
                </div>

                {previewDoc.appointmentDate ? (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    <div style={{ fontWeight: 700 }}>
                      {formatDisplayDate(previewDoc.appointmentDate, true)}
                      {previewDoc.appointmentTime ? ` · ${previewDoc.appointmentTime}` : ''}
                    </div>
                    {previewDoc.appointmentLocation && (
                      <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                        <MapPin size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{previewDoc.appointmentLocation}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No appointment scheduled for this document.
                  </div>
                )}
              </div>

              {/* Delivery & Courier Card */}
              <div
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Truck size={15} color="var(--primary)" /> Courier & Delivery Details
                  </span>
                  {(previewDoc.sendDate || previewDoc.shippingResi) && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleSendDeliveryWhatsApp(previewDoc)}
                      style={{
                        padding: '0.32rem 0.7rem',
                        fontSize: '0.74rem',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981'
                      }}
                    >
                      <MessageCircle size={13} /> Send Delivery WA
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Dispatch Date</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {previewDoc.sendDate ? formatDisplayDate(previewDoc.sendDate, true) : 'Pending dispatch'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Method / Courier</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {[previewDoc.shippingMethod, previewDoc.shippingCourier].filter(Boolean).join(' · ') || '-'}
                    </strong>
                  </div>
                  {previewDoc.shippingResi && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Tracking AWB (Resi)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ color: 'var(--primary)' }}>{previewDoc.shippingResi}</strong>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              previewDoc.shippingResi,
                              `Copied AWB ${previewDoc.shippingResi}`
                            )
                          }
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                  {previewDoc.shippingNotes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Delivery Note</span>
                      <span style={{ color: 'var(--text-main)' }}>{previewDoc.shippingNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Tracking Portal Card */}
              {portalPath && (
                <div
                  style={{
                    padding: '0.95rem 1.1rem',
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
                      Client Visa & Document Pass
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.12rem' }}>
                      Code: <strong style={{ color: 'var(--primary)' }}>{getTrackingCode(previewDoc)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleCopyGuestPortal(previewDoc)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.76rem',
                        background: isLight ? '#ffffff' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)'
                      }}
                    >
                      <Share2 size={13} /> Copy Link
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate(portalPath)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.76rem',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none'
                      }}
                    >
                      <ExternalLink size={13} /> Open Portal
                    </button>
                  </div>
                </div>
              )}

              {/* References, Vendor, Fee & Notes */}
              <div
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.7rem',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Booking / Tour Code</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {[previewDoc.bookingCode, previewDoc.tourCode].filter(Boolean).join(' / ') || '-'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Invoice / Service Fee</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {previewDoc.invoiceNumber || '-'}
                    {previewDoc.price > 0 ? ` · ${formatIdr(previewDoc.price)}` : ''}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Vendor / Visa Center</span>
                  <strong style={{ color: 'var(--text-main)' }}>{previewDoc.supplier || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Applicant Phone</span>
                  <strong style={{ color: 'var(--text-main)' }}>{previewDoc.phoneNumber || '-'}</strong>
                </div>
                {previewDoc.notes && (
                  <div style={{ gridColumn: '1 / -1', paddingTop: '0.45rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginBottom: '0.15rem' }}>
                      Notes
                    </span>
                    <span style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{previewDoc.notes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>
    </div>
  );
};

export default Documents;
