export const DOCUMENT_TYPES = [
  'Tourist Visa',
  'Business Visa',
  'E-Visa / Waiver',
  'Passport Renewal',
  'New Passport',
  'KITAS / Stay Permit',
  'Legalization'
];

export const POPULAR_VISA_DESTINATIONS = [
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

export const DESTINATION_VENUE_HINTS = {
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

export const POPULAR_VENUES = [
  'VFS Global Kuningan City Mall Lt. 2, Jakarta',
  'TLScontact Menara Anugrah Lt. 2, Mega Kuningan, Jakarta',
  'JVAC Lotte Shopping Avenue Lt. 4, Jakarta',
  'KVAC Lotte Shopping Avenue Lt. 5, Jakarta',
  'CVASC Mega Kuningan, Jakarta',
  'U.S. Embassy Jakarta, Jl. Medan Merdeka Selatan',
  'VFS Global Mall Bali Galeria, Bali',
  'Kantor Imigrasi Jakarta Selatan'
];

export const POPULAR_VENDORS = [
  'VFS Global',
  'JVAC',
  'KVAC',
  'TLScontact',
  'CVASC',
  'Direct Embassy',
  'Immigration Office'
];

export const POPULAR_COURIERS = [
  'JNE YES',
  'JNE Reguler',
  'J&T Express',
  'SiCepat',
  'TIKI ONS',
  'GoSend / GrabExpress',
  'DHL Express'
];

export const SLA_DAY_PRESETS = [2, 3, 5, 7, 10, 14];
export const PROCESS_SLA_DAYS = { Urgent: 3, Express: 5, Normal: 10 };

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const CHART_COLORS = ['#00a8ff', '#38bdf8', '#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

export const IMPORT_TEMPLATE_HEADERS = [
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

export const parseLocalDay = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const parsed = new Date(`${clean}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDateInputStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDaysToDateStr = (dateStr, days) => {
  const base = parseLocalDay(dateStr) || new Date();
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toDateInputStr(next);
};

export const formatDisplayDate = (dateStr, includeYear = true) => {
  const d = parseLocalDay(dateStr);
  if (!d) return dateStr || '-';
  return d.toLocaleDateString(
    'en-GB',
    includeYear ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' }
  );
};

export const getDayDiffFromToday = (dateStr) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

export const formatIdr = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);

export const normalizeWhatsAppDigits = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }
  return digits;
};

export const getLogisticsStatusMeta = (status, isLight) => {
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

export const getProcessBadgeClass = (processType) => {
  if (processType === 'Urgent') return 'badge-danger';
  if (processType === 'Express') return 'badge-warning';
  return 'badge-primary';
};

export const getDocProgressStage = (doc) => {
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

export const getTrackingCode = (doc) =>
  (doc?.bookingCode || doc?.invoiceNumber || doc?.shippingResi || doc?.id || '').trim();

export const getGuestPortalPath = (doc) => {
  const code = getTrackingCode(doc);
  return code ? `/track/${encodeURIComponent(code)}` : '';
};

export const getDocumentStyles = (isLight) => {
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

  return {
    subtleSurface,
    chipBg,
    chipBorder,
    fieldStyle,
    iconFieldStyle,
    iconAdornmentStyle
  };
};

