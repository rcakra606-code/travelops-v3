import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search,
  MapPin, Ship, Building, FileText, Phone, Clock, User, Download, Printer,
  X, ExternalLink, Layers, Plus, ArrowLeft, Share2, Plane
} from 'lucide-react';

const CATEGORY_CONFIG = {
  tour: {
    label: 'Tours',
    moduleName: 'Tours & Trips',
    color: '#0095ff',
    lightText: '#005bb5',
    darkBg: 'rgba(0, 149, 255, 0.16)',
    lightBg: '#e0f2fe',
    icon: MapPin
  },
  cruise: {
    label: 'Cruises',
    moduleName: 'Cruise Voyages',
    color: '#06b6d4',
    lightText: '#0e7490',
    darkBg: 'rgba(6, 182, 212, 0.16)',
    lightBg: '#cffafe',
    icon: Ship
  },
  hotel: {
    label: 'Hotels',
    moduleName: 'Hotel Stays',
    color: '#f59e0b',
    lightText: '#b45309',
    darkBg: 'rgba(245, 158, 11, 0.16)',
    lightBg: '#fef3c7',
    icon: Building
  },
  document: {
    label: 'Visas & Docs',
    moduleName: 'Visas & Documents',
    color: '#8b5cf6',
    lightText: '#6d28d9',
    darkBg: 'rgba(139, 92, 246, 0.16)',
    lightBg: '#ede9fe',
    icon: FileText
  },
  telecom: {
    label: 'SIM & WiFi',
    moduleName: 'Travel SIM & eSIM',
    color: '#10b981',
    lightText: '#047857',
    darkBg: 'rgba(16, 185, 129, 0.16)',
    lightBg: '#d1fae5',
    icon: Phone
  },
  overtime: {
    label: 'Overtime',
    moduleName: 'Overtime Logs',
    color: '#f43f5e',
    lightText: '#be123c',
    darkBg: 'rgba(244, 63, 94, 0.16)',
    lightBg: '#ffe4e6',
    icon: Clock
  }
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const normalizeDateStr = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const parsed = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return clean;
};

const formatHumanDate = (dateKey, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const clean = normalizeDateStr(dateKey);
  if (!clean) return dateKey || '-';
  return new Date(`${clean}T00:00:00`).toLocaleDateString('en-US', options);
};

const getRelativeLabel = (dateKey, todayKey) => {
  const clean = normalizeDateStr(dateKey);
  if (!clean) return null;
  const target = new Date(`${clean}T00:00:00`);
  const base = new Date(`${todayKey}T00:00:00`);
  const diff = Math.round((target - base) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)}d ago`;
  return null;
};

const OperationsCalendar = () => {
  const navigate = useNavigate();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { telecoms } = useTelecoms();
  const { overtimes } = useOvertimes();
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const isLight = theme === 'light';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Calendar View State: 'month' | 'week' | 'agenda'
  const [viewMode, setViewMode] = useState('month');
  const [agendaScope, setAgendaScope] = useState('upcoming'); // 'upcoming' | 'month'
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [scheduleScope, setScheduleScope] = useState('all'); // 'all' | 'mine'
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Unified Seamless Slide-Over Drawer State
  const [drawerDate, setDrawerDate] = useState(null);
  const [drawerEvent, setDrawerEvent] = useState(null);
  const [cameFromDayDrawer, setCameFromDayDrawer] = useState(false);

  const todayStr = useMemo(() => toDateKey(new Date()), []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Year options for instant jump picker
  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const years = new Set([baseYear - 1, baseYear, baseYear + 1, baseYear + 2, currentYear]);
    return Array.from(years).sort((a, b) => a - b);
  }, [currentYear]);

  // Extract active staff for filter (excluding inactivated personnel)
  const staffList = useMemo(() => {
    const inactiveNames = new Set(
      (users || [])
        .filter((u) => u.status === 'Inactive' && u.name)
        .map((u) => u.name.toLowerCase().trim())
    );
    const list = new Set();
    const addIfActive = (name) => {
      if (!name) return;
      const clean = name.trim();
      if (!inactiveNames.has(clean.toLowerCase())) {
        list.add(clean);
      }
    };

    users?.filter(u => u.status === 'Active').forEach((u) => addIfActive(u.name));
    tours?.forEach((t) => addIfActive(t.staffName));
    cruises?.forEach((c) => addIfActive(c.staff));
    hotels?.forEach((h) => addIfActive(h.staff));
    documents?.forEach((d) => addIfActive(d.staff));
    telecoms?.forEach((t) => addIfActive(t.staff));
    overtimes?.forEach((o) => addIfActive(o.staff));
    return Array.from(list).sort();
  }, [users, tours, cruises, hotels, documents, telecoms, overtimes]);

  // Consolidate events from all 6 operational domains
  const allEvents = useMemo(() => {
    const events = [];

    // 1. Tours
    (tours || []).forEach((t) => {
      const code = t.bookingCode || t.tourCode || `Tour #${t.id}`;
      const guestLead =
        t.paxInfo && t.paxInfo.length > 0 && (t.paxInfo[0].firstName || t.paxInfo[0].lastName)
          ? `${t.paxInfo[0].firstName || ''} ${t.paxInfo[0].lastName || ''}`.trim()
          : code;
      const isCancelled = ['Cancel', 'Cancelled'].includes(t.status);
      const depDate = normalizeDateStr(t.departureDate);
      const retDate = normalizeDateStr(t.returnDate);

      if (depDate) {
        events.push({
          id: `tour-dep-${t.id}`,
          category: 'tour',
          tag: 'Dep',
          date: depDate,
          title: `${t.country || 'Tour'} · ${guestLead}`,
          subTitle: `${t.paxCount || 1} traveler(s) · ${code} · ${t.status || 'Active'}`,
          staff: t.staffName || '',
          status: t.status || 'Active',
          isCancelled,
          link: '/tours',
          hasGuestTracker: true,
          trackingCode: t.bookingCode || t.tourCode || '',
          details: {
            'Activity Type': 'Tour Departure',
            'Lead Guest / Group': guestLead,
            'Destination': t.country || '-',
            'Booking / Tour Code': [t.bookingCode, t.tourCode].filter(Boolean).join(' / ') || '-',
            'Departure Date': formatHumanDate(depDate),
            'Return Date': retDate ? formatHumanDate(retDate) : '-',
            'Travelers': `${t.paxCount || 1} Pax`,
            'Status': t.status || 'Active',
            'Consultant (PIC)': t.staffName || 'Unassigned'
          }
        });
      }

      if (retDate) {
        events.push({
          id: `tour-ret-${t.id}`,
          category: 'tour',
          tag: 'Return',
          date: retDate,
          title: `Return: ${t.country || 'Tour'} · ${guestLead}`,
          subTitle: `Welcome home · ${code}`,
          staff: t.staffName || '',
          status: t.status || 'Active',
          isCancelled,
          link: '/tours',
          hasGuestTracker: true,
          trackingCode: t.bookingCode || t.tourCode || '',
          details: {
            'Activity Type': 'Tour Return',
            'Lead Guest / Group': guestLead,
            'Destination': t.country || '-',
            'Booking / Tour Code': [t.bookingCode, t.tourCode].filter(Boolean).join(' / ') || '-',
            'Departure Date': depDate ? formatHumanDate(depDate) : '-',
            'Return Date': formatHumanDate(retDate),
            'Travelers': `${t.paxCount || 1} Pax`,
            'Status': t.status || 'Active',
            'Consultant (PIC)': t.staffName || 'Unassigned'
          }
        });
      }
    });

    // 2. Cruises (Sailing, Docking & Final Payment Deadline)
    (cruises || []).forEach((c) => {
      const ship = c.shipName || c.cruiseBrand || 'Cruise';
      const guest = c.picName || 'Cruise Guest';
      const isCancelled = ['Cancel', 'Cancelled'].includes(c.status);
      const startStr = normalizeDateStr(c.sailingStart);
      const endStr = normalizeDateStr(c.sailingEnd);
      const payStr = normalizeDateStr(c.finalPaymentDate);

      if (startStr) {
        events.push({
          id: `cruise-start-${c.id}`,
          category: 'cruise',
          tag: 'Sail',
          date: startStr,
          title: `${ship} · ${guest}`,
          subTitle: `${c.route || 'Cruise Voyage'}${c.paxCount ? ` · ${c.paxCount} pax` : ''}`,
          staff: c.staff || '',
          status: c.status || 'Upcoming',
          isCancelled,
          link: '/cruise',
          hasGuestTracker: true,
          trackingCode: c.bookingRef || c.reservationCode || '',
          details: {
            'Activity Type': 'Cruise Embarkation',
            'Guest Name': guest,
            'Ship / Cruise Line': [c.shipName, c.cruiseBrand].filter(Boolean).join(' · ') || '-',
            'Booking Ref': c.bookingRef || '-',
            'Route': c.route || '-',
            'Sailing Dates': `${formatHumanDate(startStr)}${endStr ? ` → ${formatHumanDate(endStr)}` : ''}`,
            'Consultant (PIC)': c.staff || 'Unassigned'
          }
        });
      }

      if (endStr) {
        events.push({
          id: `cruise-end-${c.id}`,
          category: 'cruise',
          tag: 'Dock',
          date: endStr,
          title: `Docking: ${ship} · ${guest}`,
          subTitle: `Disembarkation (${c.route || 'Voyage complete'})`,
          staff: c.staff || '',
          status: c.status || 'Upcoming',
          isCancelled,
          link: '/cruise',
          hasGuestTracker: true,
          trackingCode: c.bookingRef || c.reservationCode || '',
          details: {
            'Activity Type': 'Cruise Disembarkation',
            'Guest Name': guest,
            'Ship / Cruise Line': [c.shipName, c.cruiseBrand].filter(Boolean).join(' · ') || '-',
            'Booking Ref': c.bookingRef || '-',
            'Docking Date': formatHumanDate(endStr),
            'Consultant (PIC)': c.staff || 'Unassigned'
          }
        });
      }

      if (payStr && !isCancelled) {
        events.push({
          id: `cruise-pay-${c.id}`,
          category: 'cruise',
          tag: 'Pay Due',
          date: payStr,
          title: `Payment Due: ${guest} (${ship})`,
          subTitle: `Cruise final payment deadline`,
          staff: c.staff || '',
          status: c.status || 'Upcoming',
          isCancelled: false,
          link: '/cruise',
          hasGuestTracker: true,
          trackingCode: c.bookingRef || c.reservationCode || '',
          details: {
            'Activity Type': 'Cruise Final Payment Deadline',
            'Guest Name': guest,
            'Ship / Cruise Line': [c.shipName, c.cruiseBrand].filter(Boolean).join(' · ') || '-',
            'Payment Deadline': formatHumanDate(payStr),
            'Sailing Date': startStr ? formatHumanDate(startStr) : '-',
            'Consultant (PIC)': c.staff || 'Unassigned'
          }
        });
      }
    });

    // 3. Hotels
    (hotels || []).forEach((h) => {
      const guest = h.guestList ? h.guestList.split(',')[0].trim() : 'Hotel Guest';
      const isCancelled = ['Cancel', 'Cancelled'].includes(h.status);
      const inStr = normalizeDateStr(h.checkIn);
      const outStr = normalizeDateStr(h.checkOut);

      if (inStr) {
        events.push({
          id: `hotel-in-${h.id}`,
          category: 'hotel',
          tag: 'In',
          date: inStr,
          title: `${h.hotelName || 'Hotel'} · ${guest}`,
          subTitle: `${h.region || 'Stay'}${h.roomType ? ` · ${h.roomType}` : ''}`,
          staff: h.staff || '',
          status: h.status || 'Upcoming',
          isCancelled,
          link: '/hotel',
          hasGuestTracker: Boolean(h.confirmationNumber),
          trackingCode: h.confirmationNumber || '',
          details: {
            'Activity Type': 'Hotel Check-In',
            'Guest Name': h.guestList || guest,
            'Hotel Property': h.hotelName || '-',
            'Country / Region': h.region || '-',
            'Check-In': formatHumanDate(inStr),
            'Check-Out': outStr ? formatHumanDate(outStr) : '-',
            'Room Type': h.roomType || '-',
            'Confirmation #': h.confirmationNumber || 'Pending confirmation',
            'Consultant (PIC)': h.staff || 'Unassigned'
          }
        });
      }

      if (outStr) {
        events.push({
          id: `hotel-out-${h.id}`,
          category: 'hotel',
          tag: 'Out',
          date: outStr,
          title: `Check-out: ${h.hotelName || 'Hotel'} · ${guest}`,
          subTitle: `Hotel departure${h.region ? ` (${h.region})` : ''}`,
          staff: h.staff || '',
          status: h.status || 'Upcoming',
          isCancelled,
          link: '/hotel',
          hasGuestTracker: Boolean(h.confirmationNumber),
          trackingCode: h.confirmationNumber || '',
          details: {
            'Activity Type': 'Hotel Check-Out',
            'Guest Name': h.guestList || guest,
            'Hotel Property': h.hotelName || '-',
            'Check-In': inStr ? formatHumanDate(inStr) : '-',
            'Check-Out': formatHumanDate(outStr),
            'Consultant (PIC)': h.staff || 'Unassigned'
          }
        });
      }
    });

    // 4. Documents & Visas (Embassy Appointments, Est. Completion & Dispatched)
    (documents || []).forEach((d) => {
      const apptStr = normalizeDateStr(d.appointmentDate);
      const estStr = normalizeDateStr(d.estimatedDone);
      const sendStr = normalizeDateStr(d.sendDate);
      const trackCode = d.bookingCode || d.invoiceNumber || d.shippingResi || d.id || '';

      if (apptStr) {
        events.push({
          id: `doc-appt-${d.id}`,
          category: 'document',
          tag: d.appointmentTime ? d.appointmentTime.substring(0, 5) : 'Appt',
          date: apptStr,
          title: `Visa Appt: ${d.guestName || 'Guest'} (${d.country || 'Embassy'})`,
          subTitle: [d.appointmentTime, d.appointmentLocation || 'Embassy / VFS Appointment'].filter(Boolean).join(' · '),
          staff: d.staff || '',
          status: 'Appointment',
          isCancelled: false,
          link: '/documents',
          hasGuestTracker: true,
          trackingCode: trackCode,
          details: {
            'Activity Type': 'Embassy / Biometric Appointment',
            'Guest Name': d.guestName || '-',
            'Destination': d.country || '-',
            'Appointment Date': formatHumanDate(apptStr),
            'Appointment Time': d.appointmentTime || 'Scheduled',
            'Location': d.appointmentLocation || 'Embassy / Visa Center',
            'Consultant (PIC)': d.staff || 'Unassigned'
          }
        });
      }

      if (estStr) {
        events.push({
          id: `doc-est-${d.id}`,
          category: 'document',
          tag: 'Due',
          date: estStr,
          title: `${d.docType || 'Visa'}: ${d.guestName || 'Guest'} (${d.country || '-'})`,
          subTitle: `Target completion · ${d.shippingStatus || (d.sendDate ? 'Dispatched' : 'In Progress')}`,
          staff: d.staff || '',
          status: d.sendDate ? 'Completed' : d.shippingStatus || 'Processing',
          isCancelled: false,
          link: '/documents',
          hasGuestTracker: true,
          trackingCode: trackCode,
          details: {
            'Activity Type': 'Visa / Document Target Completion',
            'Document Type': d.docType || 'Visa',
            'Guest Name': d.guestName || '-',
            'Destination': d.country || '-',
            'Process Tier': d.processType || 'Normal',
            'Target Completion': formatHumanDate(estStr),
            'Courier / Resi': d.shippingResi ? `${d.shippingCourier || 'Courier'} · ${d.shippingResi}` : 'Not dispatched yet',
            'Consultant (PIC)': d.staff || 'Unassigned'
          }
        });
      }

      if (sendStr) {
        events.push({
          id: `doc-send-${d.id}`,
          category: 'document',
          tag: 'Sent',
          date: sendStr,
          title: `Dispatched: ${d.docType || 'Visa'} → ${d.guestName || 'Guest'}`,
          subTitle: d.shippingResi ? `Resi: ${d.shippingResi}` : d.shippingMethod || 'Delivered',
          staff: d.staff || '',
          status: 'Dispatched',
          isCancelled: false,
          link: '/documents',
          hasGuestTracker: true,
          trackingCode: trackCode,
          details: {
            'Activity Type': 'Document Dispatched to Guest',
            'Guest Name': d.guestName || '-',
            'Dispatch Date': formatHumanDate(sendStr),
            'Delivery Method': [d.shippingMethod, d.shippingCourier].filter(Boolean).join(' · ') || '-',
            'Tracking / Resi': d.shippingResi || '-',
            'Consultant (PIC)': d.staff || 'Unassigned'
          }
        });
      }
    });

    // 5. Travel SIM & Pocket WiFi (TelecomContext)
    (telecoms || []).forEach((t) => {
      const startStr = normalizeDateStr(t.tanggalMulai);
      const endStr = normalizeDateStr(t.tanggalSelesai);
      const prod = t.typeProduct || 'Travel SIM / WiFi';

      if (startStr) {
        events.push({
          id: `tel-start-${t.id}`,
          category: 'telecom',
          tag: 'SIM',
          date: startStr,
          title: `${prod}: ${t.nama || 'Traveler'} (${t.region || '-'})`,
          subTitle: `Active roaming start${t.noTelephone ? ` · ${t.noTelephone}` : ''}`,
          staff: t.staff || '',
          status: t.tanggalPengembalian ? 'Completed' : 'Active',
          isCancelled: false,
          link: '/telecom',
          hasGuestTracker: false,
          trackingCode: '',
          details: {
            'Activity Type': 'Travel SIM / WiFi Activation',
            'Traveler Name': t.nama || '-',
            'Product': prod,
            'Destination Region': t.region || '-',
            'Start Date': formatHumanDate(startStr),
            'End Date': endStr ? formatHumanDate(endStr) : '-',
            'Phone': t.noTelephone || '-',
            'Consultant (PIC)': t.staff || 'Unassigned'
          }
        });
      }

      if (endStr) {
        events.push({
          id: `tel-end-${t.id}`,
          category: 'telecom',
          tag: 'Return',
          date: endStr,
          title: `Return ${prod}: ${t.nama || 'Traveler'}`,
          subTitle: t.tanggalPengembalian ? 'Returned' : 'Check device return & deposit refund',
          staff: t.staff || '',
          status: t.tanggalPengembalian ? 'Completed' : 'Return Due',
          isCancelled: false,
          link: '/telecom',
          hasGuestTracker: false,
          trackingCode: '',
          details: {
            'Activity Type': 'SIM / WiFi Rental End & Deposit Check',
            'Traveler Name': t.nama || '-',
            'Product': prod,
            'Rental End Date': formatHumanDate(endStr),
            'Return Status': t.tanggalPengembalian ? `Returned (${formatHumanDate(t.tanggalPengembalian)})` : 'Pending return check',
            'Deposit Status': t.depositStatus || '-',
            'Consultant (PIC)': t.staff || 'Unassigned'
          }
        });
      }
    });

    // 6. Staff Overtime
    (overtimes || []).forEach((o) => {
      const otStr = normalizeDateStr(o.date);
      if (otStr) {
        events.push({
          id: `ot-${o.id}`,
          category: 'overtime',
          tag: `${o.hours || 0}h`,
          date: otStr,
          title: `${o.staff || 'Staff'} · ${o.eventName || 'Overtime'}`,
          subTitle: `${o.hours || 0} hour(s) · ${o.status || 'Pending'}`,
          staff: o.staff || '',
          status: o.status || 'Pending',
          isCancelled: false,
          link: '/overtime',
          hasGuestTracker: false,
          trackingCode: '',
          details: {
            'Activity Type': 'Team Overtime Log',
            'Team Member': o.staff || '-',
            'Date': formatHumanDate(otStr),
            'Duration': `${o.hours || 0} Hours`,
            'Assignment / Event': o.eventName || '-',
            'Approval Status': o.status || 'Pending',
            'Notes': o.remarks || '-'
          }
        });
      }
    });

    return events;
  }, [tours, cruises, hotels, documents, telecoms, overtimes]);

  // Compute Week Days (Sunday -> Saturday) for Week View
  const weekDays = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        date: d,
        dateStr: toDateKey(d),
        dayName: DAYS_OF_WEEK[d.getDay()],
        dayNumber: d.getDate(),
        monthShort: MONTH_NAMES[d.getMonth()].slice(0, 3)
      };
    });
  }, [currentDate]);

  // Real Date-Arithmetic Month Grid (fixes Jan 2026-00-xx and Dec 2026-13-xx bugs!)
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = firstOfMonth.getDay();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, idx) => {
      const cellDate = new Date(currentYear, currentMonth, 1 - startOffset + idx);
      return {
        dayNumber: cellDate.getDate(),
        monthShort: MONTH_NAMES[cellDate.getMonth()].slice(0, 3),
        dateStr: toDateKey(cellDate),
        isCurrentMonth: cellDate.getMonth() === currentMonth && cellDate.getFullYear() === currentYear
      };
    });
  }, [currentYear, currentMonth]);

  // Events filtered by Staff Scope ('all' | 'mine' | dropdown) and Search Query (before category filter)
  const staffAndSearchFiltered = useMemo(() => {
    const myName = (user?.name || '').trim().toLowerCase();
    const q = searchQuery.trim().toLowerCase();

    return allEvents.filter((e) => {
      if (scheduleScope === 'mine' && myName) {
        if ((e.staff || '').trim().toLowerCase() !== myName) return false;
      } else if (selectedStaff !== 'all' && e.staff !== selectedStaff) {
        return false;
      }

      if (q) {
        const hay = `${e.title} ${e.subTitle} ${e.staff} ${e.trackingCode} ${e.tag}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEvents, scheduleScope, selectedStaff, searchQuery, user?.name]);

  // Active Period Window Filter (so counts & Agenda reflect what the user is actually looking at!)
  const isDateInActivePeriod = useCallback(
    (dateStr) => {
      if (viewMode === 'week') {
        return dateStr >= weekDays[0].dateStr && dateStr <= weekDays[6].dateStr;
      }
      if (viewMode === 'agenda' && agendaScope === 'upcoming') {
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + 90);
        return dateStr >= todayStr && dateStr <= toDateKey(horizon);
      }
      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      return dateStr.startsWith(monthPrefix);
    },
    [viewMode, agendaScope, weekDays, todayStr, currentYear, currentMonth]
  );

  // Period-Aware Category Counts
  const categoryCounts = useMemo(() => {
    const counts = { all: 0, tour: 0, cruise: 0, hotel: 0, document: 0, telecom: 0, overtime: 0 };
    staffAndSearchFiltered.forEach((e) => {
      if (isDateInActivePeriod(e.date)) {
        counts.all += 1;
        if (counts[e.category] !== undefined) counts[e.category] += 1;
      }
    });
    return counts;
  }, [staffAndSearchFiltered, isDateInActivePeriod]);

  // Final filtered events (including selected category)
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return staffAndSearchFiltered;
    return staffAndSearchFiltered.filter((e) => e.category === selectedCategory);
  }, [staffAndSearchFiltered, selectedCategory]);

  // Map events per date for O(1) cell lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  // Agenda dates scoped cleanly to Upcoming (90d) or Selected Month
  const agendaDateKeys = useMemo(() => {
    return Object.keys(eventsByDate)
      .filter((dateKey) => isDateInActivePeriod(dateKey))
      .sort();
  }, [eventsByDate, isDateInActivePeriod]);

  // Period Snapshot Highlights
  const periodSnapshot = useMemo(() => {
    let tripsAndStays = 0;
    let visasAndAppts = 0;
    let todayCount = (eventsByDate[todayStr] || []).length;

    filteredEvents.forEach((e) => {
      if (!isDateInActivePeriod(e.date) || e.isCancelled) return;
      if (['tour', 'cruise', 'hotel'].includes(e.category)) tripsAndStays += 1;
      if (e.category === 'document') visasAndAppts += 1;
    });

    return { tripsAndStays, visasAndAppts, todayCount };
  }, [filteredEvents, isDateInActivePeriod, eventsByDate, todayStr]);

  // Smooth Navigation Handlers across ALL 3 views
  const handlePrev = useCallback(() => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    } else {
      if (viewMode === 'agenda' && agendaScope === 'upcoming') {
        setAgendaScope('month');
      }
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  }, [viewMode, agendaScope]);

  const handleNext = useCallback(() => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else {
      if (viewMode === 'agenda' && agendaScope === 'upcoming') {
        setAgendaScope('month');
      }
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  }, [viewMode, agendaScope]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Keyboard shortcuts for fast, seamless calendar browsing
  useEffect(() => {
    const onKeyDown = (e) => {
      if (drawerDate || drawerEvent) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      } else if (e.key === 'm' || e.key === 'M') {
        setViewMode('month');
      } else if (e.key === 'w' || e.key === 'W') {
        setViewMode('week');
      } else if (e.key === 'a' || e.key === 'A') {
        setViewMode('agenda');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerDate, drawerEvent, handlePrev, handleNext, handleToday]);

  // Export active period events to iCalendar (.ics)
  const handleExportICS = () => {
    const exportList = filteredEvents.filter((e) => isDateInActivePeriod(e.date));
    if (exportList.length === 0) {
      toast.info('No trips or events in the current view to export yet.');
      return;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TravelOps Friendly Workspace//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    exportList.forEach((evt) => {
      const cleanDate = evt.date.replace(/-/g, '');
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${evt.id}@travelops.app`);
      icsContent.push(`DTSTAMP:${cleanDate}T000000Z`);
      icsContent.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      icsContent.push(`SUMMARY:[${evt.tag}] ${evt.title.replace(/[^\x20-\x7E]/g, ' ')}`);
      icsContent.push(`DESCRIPTION:${(evt.subTitle || '').replace(/[^\x20-\x7E]/g, ' ')}`);
      icsContent.push(`CATEGORIES:${evt.category.toUpperCase()}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelOps_Calendar_${currentYear}_${String(currentMonth + 1).padStart(2, '0')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportList.length} calendar event(s) to iCal (.ics)!`);
  };

  const openDayDrawer = (dateStr) => {
    setDrawerDate(dateStr);
    setDrawerEvent(null);
    setCameFromDayDrawer(false);
  };

  const openEventDrawer = (evt, fromDay = false) => {
    setDrawerEvent(evt);
    setCameFromDayDrawer(fromDay);
    if (!fromDay) {
      setDrawerDate(null);
    }
  };

  const closeDrawer = () => {
    setDrawerEvent(null);
    setDrawerDate(null);
    setCameFromDayDrawer(false);
  };

  const quickCreateForDate = (path, dateStr) => {
    closeDrawer();
    navigate(path, { state: { openNew: true, prefillDate: dateStr } });
  };

  // Dynamic Period Title
  const periodTitle = useMemo(() => {
    if (viewMode === 'week') {
      const first = weekDays[0].date;
      const last = weekDays[6].date;
      const sameMonth = first.getMonth() === last.getMonth();
      const sameYear = first.getFullYear() === last.getFullYear();
      if (sameMonth) {
        return `${MONTH_NAMES[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
      }
      if (sameYear) {
        return `${MONTH_NAMES[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${MONTH_NAMES[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${MONTH_NAMES[first.getMonth()].slice(0, 3)} ${first.getDate()}, ${first.getFullYear()} – ${MONTH_NAMES[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
    }
    if (viewMode === 'agenda' && agendaScope === 'upcoming') {
      return 'Next 90 Days (Upcoming)';
    }
    return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  }, [viewMode, agendaScope, weekDays, currentMonth, currentYear]);

  const activeDayDrawerEvents = drawerDate ? eventsByDate[drawerDate] || [] : [];

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile} />

      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container" style={{ maxWidth: '1600px' }}>
            {/* Header Title, Period Snapshot & View Controls */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.15rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.14)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: isLight ? '0 4px 12px rgba(0, 149, 255, 0.12)' : '0 0 18px rgba(56, 189, 248, 0.18)',
                    flexShrink: 0
                  }}
                >
                  <CalendarIcon size={21} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      Trip Calendar
                    </h1>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      {periodSnapshot.tripsAndStays} Trips &amp; Stays
                    </span>
                    {periodSnapshot.visasAndAppts > 0 && (
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                        {periodSnapshot.visasAndAppts} Visas &amp; Appts
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Click any date to inspect schedules or create a booking · Use <kbd className="kbd-badge">←</kbd> <kbd className="kbd-badge">→</kbd> or <kbd className="kbd-badge">T</kbd> to navigate
                  </p>
                </div>
              </div>

              {/* Action Buttons & View Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportICS}
                  className="btn btn-secondary"
                  style={{ padding: '0.48rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
                  title="Export active view to Google / Apple / Outlook Calendar (.ics)"
                >
                  <Download size={15} color="var(--primary)" />
                  <span>Sync iCal</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ padding: '0.48rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
                  title="Print current schedule"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>

                {/* Month / Week / Agenda Segmented Control */}
                <div
                  style={{
                    display: 'flex',
                    background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                    padding: '0.24rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    gap: '0.2rem'
                  }}
                >
                  {[
                    { id: 'month', label: 'Month' },
                    { id: 'week', label: 'Week' },
                    { id: 'agenda', label: 'Agenda' }
                  ].map((m) => {
                    const active = viewMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setViewMode(m.id)}
                        style={{
                          padding: '0.36rem 0.82rem',
                          borderRadius: '7px',
                          border: 'none',
                          background: active ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)' : 'transparent',
                          color: active ? '#ffffff' : 'var(--text-muted)',
                          boxShadow: active ? '0 2px 10px rgba(0, 168, 255, 0.28)' : 'none',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.16s ease'
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter & Navigator Toolbar Card */}
            <div className="card bento-card-glass" style={{ padding: '1rem 1.15rem', marginBottom: '1.15rem' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                {/* Period Navigator + Quick Month/Year Jump */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn btn-secondary"
                    style={{ padding: '0.42rem', borderRadius: '9px' }}
                    title="Previous period (←)"
                    aria-label="Previous period"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToday}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.42rem 0.85rem',
                      borderRadius: '9px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'var(--primary)',
                      background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)',
                      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.3)'
                    }}
                    title="Jump to Today (T)"
                  >
                    Today{periodSnapshot.todayCount > 0 ? ` (${periodSnapshot.todayCount})` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-secondary"
                    style={{ padding: '0.42rem', borderRadius: '9px' }}
                    title="Next period (→)"
                    aria-label="Next period"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <h2 style={{ margin: '0 0.35rem', fontSize: '1.18rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {periodTitle}
                  </h2>

                  {/* Quick Month & Year Jump Selects */}
                  {(viewMode === 'month' || (viewMode === 'agenda' && agendaScope === 'month')) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <select
                        value={currentMonth}
                        onChange={(e) => setCurrentDate(new Date(currentYear, Number(e.target.value), 1))}
                        aria-label="Jump to month"
                        style={{
                          width: 'auto',
                          padding: '0.36rem 0.6rem',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={m} value={idx}>
                            {m.slice(0, 3)}
                          </option>
                        ))}
                      </select>

                      <select
                        value={currentYear}
                        onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentMonth, 1))}
                        aria-label="Jump to year"
                        style={{
                          width: 'auto',
                          padding: '0.36rem 0.6rem',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {yearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Agenda Scope Switcher (Upcoming 90d vs Selected Month) */}
                  {viewMode === 'agenda' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                        padding: '0.2rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        gap: '0.2rem'
                      }}
                    >
                      {[
                        { id: 'upcoming', label: 'Upcoming (90d)' },
                        { id: 'month', label: 'Selected Month' }
                      ].map((sc) => {
                        const active = agendaScope === sc.id;
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => setAgendaScope(sc.id)}
                            style={{
                              padding: '0.28rem 0.65rem',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              background: active ? 'var(--primary)' : 'transparent',
                              color: active ? '#ffffff' : 'var(--text-muted)'
                            }}
                          >
                            {sc.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Search + All Team / My Schedule + Staff Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative', width: '225px' }}>
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search guest, destination, code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.44rem 2rem 0.44rem 2.15rem',
                        borderRadius: '9px',
                        fontSize: '0.8rem'
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          padding: '2px'
                        }}
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* 1-Click All Team / My Schedule Toggle */}
                  <div
                    style={{
                      display: 'flex',
                      background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                      padding: '0.2rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border)',
                      gap: '0.2rem'
                    }}
                  >
                    {[
                      { id: 'all', label: 'All Team' },
                      { id: 'mine', label: 'My Schedule' }
                    ].map((s) => {
                      const active = scheduleScope === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setScheduleScope(s.id);
                            if (s.id === 'mine') setSelectedStaff('all');
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '7px',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: active ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)' : 'transparent',
                            color: active ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Specific Staff PIC Select */}
                  {scheduleScope === 'all' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="var(--text-muted)" />
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        style={{
                          width: 'auto',
                          padding: '0.42rem 0.7rem',
                          borderRadius: '9px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">Any Consultant</option>
                        {staffList.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Period-Aware Category Filter Pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap',
                  marginTop: '0.85rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.32rem 0.72rem',
                    borderRadius: '9999px',
                    border: `1px solid ${selectedCategory === 'all' ? 'transparent' : 'var(--border)'}`,
                    background:
                      selectedCategory === 'all'
                        ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)'
                        : isLight ? '#f8fbff' : 'transparent',
                    color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: selectedCategory === 'all' ? '0 2px 10px rgba(0, 168, 255, 0.28)' : 'none',
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={13} />
                  <span>All</span>
                  <span
                    style={{
                      padding: '0 0.38rem',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      background: selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.24)' : isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)',
                      color: selectedCategory === 'all' ? '#ffffff' : 'var(--primary)'
                    }}
                  >
                    {categoryCounts.all}
                  </span>
                </button>

                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = selectedCategory === key;
                  const pillText = isLight ? cfg.lightText : cfg.color;
                  const pillBg = isLight ? cfg.lightBg : cfg.darkBg;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCategory(key)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.38rem',
                        padding: '0.32rem 0.72rem',
                        borderRadius: '9999px',
                        border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                        background: isActive ? pillBg : isLight ? '#ffffff' : 'transparent',
                        color: isActive ? pillText : 'var(--text-muted)',
                        fontSize: '0.76rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={13} color={cfg.color} />
                      <span>{cfg.label}</span>
                      <span
                        style={{
                          padding: '0 0.38rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          background: isActive ? `${cfg.color}24` : isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? pillText : 'var(--text-muted)'
                        }}
                      >
                        {categoryCounts[key] || 0}
                      </span>
                    </button>
                  );
                })}

                {(selectedCategory !== 'all' || scheduleScope !== 'all' || selectedStaff !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setScheduleScope('all');
                      setSelectedStaff('all');
                      setSearchQuery('');
                    }}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* ================= MONTH VIEW ================= */}
            {viewMode === 'month' && (
              <div className="card bento-card-glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="calendar-month-scroll">
                  <div className="calendar-month-inner">
                    {/* Weekday Headers */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.04)',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <div
                          key={day}
                          style={{
                            padding: '0.72rem 0.5rem',
                            textAlign: 'center',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            color: idx === 0 || idx === 6 ? (isLight ? '#e11d48' : '#fb7185') : 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em'
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Month Grid Cells */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: '1px',
                        background: 'var(--border)'
                      }}
                    >
                      {calendarDays.map((cell, idx) => {
                        const dayEvents = eventsByDate[cell.dateStr] || [];
                        const isToday = cell.dateStr === todayStr;
                        const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                        let cellBg = isLight ? '#ffffff' : 'rgba(10, 16, 32, 0.94)';
                        if (!cell.isCurrentMonth) {
                          cellBg = isLight ? '#f6faff' : 'rgba(5, 8, 17, 0.72)';
                        } else if (isToday) {
                          cellBg = isLight ? '#eef8ff' : 'rgba(0, 168, 255, 0.09)';
                        }

                        return (
                          <div
                            key={cell.dateStr}
                            onClick={() => openDayDrawer(cell.dateStr)}
                            className="calendar-day-cell"
                            style={{
                              background: cellBg,
                              minHeight: '132px',
                              padding: '0.52rem',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              boxShadow: isToday ? 'inset 0 0 0 1.5px var(--primary)' : 'none'
                            }}
                          >
                            {/* Day Number + Hover Quick Add Button */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.42rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: isToday ? '800' : '600',
                                    minWidth: '25px',
                                    height: '25px',
                                    padding: '0 5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '9999px',
                                    background: isToday ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)' : 'transparent',
                                    boxShadow: isToday ? '0 2px 10px rgba(0, 168, 255, 0.38)' : 'none',
                                    color: isToday
                                      ? '#ffffff'
                                      : !cell.isCurrentMonth
                                        ? 'var(--text-subtle)'
                                        : isWeekend
                                          ? isLight ? '#e11d48' : '#fb7185'
                                          : 'var(--text-main)'
                                  }}
                                >
                                  {cell.dayNumber === 1 && !cell.isCurrentMonth
                                    ? `${cell.monthShort} 1`
                                    : cell.dayNumber}
                                </span>
                                {isToday && (
                                  <span style={{ fontSize: '0.66rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                                    Today
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                className="calendar-day-add-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDayDrawer(cell.dateStr);
                                }}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  background: isLight ? '#ffffff' : 'rgba(56, 189, 248, 0.12)',
                                  color: 'var(--primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title={`Inspect or add booking on ${formatHumanDate(cell.dateStr)}`}
                                aria-label={`Inspect or add booking on ${cell.dateStr}`}
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            {/* Events in Cell */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                              {dayEvents.slice(0, 3).map((evt) => {
                                const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                                return (
                                  <div
                                    key={evt.id}
                                    className="calendar-event-chip"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEventDrawer(evt, false);
                                    }}
                                    style={{
                                      padding: '3px 6px',
                                      borderRadius: '6px',
                                      background: isLight ? cfg.lightBg : cfg.darkBg,
                                      borderLeft: `3px solid ${cfg.color}`,
                                      fontSize: '0.72rem',
                                      fontWeight: '600',
                                      color: isLight ? '#0b1528' : 'var(--text-main)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      cursor: 'pointer',
                                      opacity: evt.isCancelled ? 0.52 : cell.isCurrentMonth ? 1 : 0.72,
                                      textDecoration: evt.isCancelled ? 'line-through' : 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={`${evt.tag}: ${evt.title}\n${evt.subTitle || ''}`}
                                  >
                                    <span
                                      style={{
                                        fontSize: '0.63rem',
                                        fontWeight: '800',
                                        color: isLight ? cfg.lightText : cfg.color,
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                      }}
                                    >
                                      {evt.tag}
                                    </span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</span>
                                  </div>
                                );
                              })}

                              {dayEvents.length > 3 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDayDrawer(cell.dateStr);
                                  }}
                                  style={{
                                    background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)',
                                    border: 'none',
                                    borderRadius: '5px',
                                    color: 'var(--primary)',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    textAlign: 'left',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    width: 'fit-content'
                                  }}
                                >
                                  +{dayEvents.length - 3} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= WEEK VIEW ================= */}
            {viewMode === 'week' && (
              <div className="card bento-card-glass" style={{ padding: '1.15rem' }}>
                <div className="calendar-week-grid">
                  {weekDays.map((wd) => {
                    const isToday = wd.dateStr === todayStr;
                    const dayEvents = eventsByDate[wd.dateStr] || [];

                    return (
                      <div
                        key={wd.dateStr}
                        style={{
                          background: isToday
                            ? isLight ? '#f0f8ff' : 'rgba(0, 168, 255, 0.07)'
                            : isLight ? '#fbfdff' : 'rgba(255, 255, 255, 0.02)',
                          border: `1.5px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '12px',
                          minHeight: '340px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          onClick={() => openDayDrawer(wd.dateStr)}
                          style={{
                            padding: '0.7rem 0.65rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isToday
                              ? isLight ? '#e0f2fe' : 'rgba(0, 168, 255, 0.16)'
                              : isLight ? '#f4f9ff' : 'rgba(255, 255, 255, 0.03)',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer'
                          }}
                          title="Click to inspect or add on this day"
                        >
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              {wd.dayName} · {wd.monthShort}
                            </div>
                            <div style={{ fontSize: '1.12rem', fontWeight: '800', color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                              {wd.dayNumber}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDayDrawer(wd.dateStr);
                            }}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '7px',
                              border: '1px solid var(--border)',
                              background: isLight ? '#ffffff' : 'rgba(56, 189, 248, 0.1)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title={`Add booking on ${formatHumanDate(wd.dateStr)}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div style={{ padding: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                          {dayEvents.map((evt) => {
                            const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                            return (
                              <div
                                key={evt.id}
                                className="calendar-event-chip"
                                onClick={() => openEventDrawer(evt, false)}
                                style={{
                                  padding: '0.5rem 0.6rem',
                                  borderRadius: '8px',
                                  background: isLight ? cfg.lightBg : cfg.darkBg,
                                  borderLeft: `3px solid ${cfg.color}`,
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  opacity: evt.isCancelled ? 0.55 : 1
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isLight ? cfg.lightText : cfg.color, textTransform: 'uppercase' }}>
                                    {evt.tag}
                                  </span>
                                  {evt.staff && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {evt.staff.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '700',
                                    color: isLight ? '#0b1528' : 'var(--text-main)',
                                    lineHeight: '1.3',
                                    textDecoration: evt.isCancelled ? 'line-through' : 'none'
                                  }}
                                >
                                  {evt.title}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {evt.subTitle}
                                </div>
                              </div>
                            );
                          })}

                          {dayEvents.length === 0 && (
                            <div
                              onClick={() => openDayDrawer(wd.dateStr)}
                              style={{
                                margin: 'auto 0',
                                padding: '1rem 0.5rem',
                                textAlign: 'center',
                                color: 'var(--text-subtle)',
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              Free day · Click to add
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= AGENDA VIEW ================= */}
            {viewMode === 'agenda' && (
              <div className="card bento-card-glass" style={{ padding: '1.35rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1.1rem'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {agendaScope === 'upcoming'
                        ? 'Upcoming Schedule (Next 90 Days)'
                        : `${MONTH_NAMES[currentMonth]} ${currentYear} Schedule`}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {agendaDateKeys.reduce((acc, k) => acc + (eventsByDate[k]?.length || 0), 0)} scheduled item(s) across{' '}
                      {agendaDateKeys.length} day(s)
                    </p>
                  </div>
                </div>

                {agendaDateKeys.length === 0 ? (
                  <div
                    style={{
                      padding: '2.75rem 1.5rem',
                      textAlign: 'center',
                      borderRadius: '14px',
                      background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                      border: '1px dashed var(--border)'
                    }}
                  >
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.96rem', marginBottom: '0.3rem' }}>
                      No scheduled items in this view
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {agendaScope === 'upcoming'
                        ? 'Try switching to Selected Month to browse earlier dates, or add a new booking.'
                        : 'No bookings or deadlines match this month and filter selection.'}
                    </div>
                    <div style={{ display: 'inline-flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {agendaScope === 'upcoming' && (
                        <button
                          type="button"
                          onClick={() => setAgendaScope('month')}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          Browse Selected Month
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDayDrawer(todayStr)}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                      >
                        <Plus size={14} /> Add Booking for Today
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {agendaDateKeys.map((dateKey) => {
                      const events = eventsByDate[dateKey] || [];
                      const isToday = dateKey === todayStr;
                      const rel = getRelativeLabel(dateKey, todayStr);

                      return (
                        <div
                          key={dateKey}
                          style={{
                            borderRadius: '12px',
                            border: `1px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`,
                            background: isToday
                              ? isLight ? '#f0f8ff' : 'rgba(0, 168, 255, 0.06)'
                              : isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Date Header */}
                          <div
                            onClick={() => openDayDrawer(dateKey)}
                            style={{
                              padding: '0.6rem 1rem',
                              background: isToday
                                ? isLight ? '#e0f2fe' : 'rgba(0, 168, 255, 0.14)'
                                : isLight ? '#f4f9ff' : 'rgba(255, 255, 255, 0.04)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                                {formatHumanDate(dateKey, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {rel && (
                                <span
                                  style={{
                                    background: isToday ? 'var(--primary)' : isLight ? '#dbeafe' : 'rgba(56, 189, 248, 0.15)',
                                    color: isToday ? '#ffffff' : 'var(--primary)',
                                    fontSize: '0.68rem',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '9999px'
                                  }}
                                >
                                  {rel}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {events.length} item{events.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {/* Event Rows */}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {events.map((evt, idx) => {
                              const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                              const Icon = cfg.icon;

                              return (
                                <div
                                  key={evt.id}
                                  onClick={() => openEventDrawer(evt, false)}
                                  style={{
                                    padding: '0.8rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    borderBottom: idx < events.length - 1 ? '1px solid var(--border)' : 'none',
                                    opacity: evt.isCancelled ? 0.55 : 1,
                                    transition: 'background 0.15s ease'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.05)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                                    <div
                                      style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '10px',
                                        background: isLight ? cfg.lightBg : cfg.darkBg,
                                        color: isLight ? cfg.lightText : cfg.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${cfg.color}38`,
                                        flexShrink: 0
                                      }}
                                    >
                                      <Icon size={16} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontWeight: '700',
                                          fontSize: '0.88rem',
                                          color: 'var(--text-main)',
                                          textDecoration: evt.isCancelled ? 'line-through' : 'none'
                                        }}
                                      >
                                        <span style={{ color: isLight ? cfg.lightText : cfg.color, marginRight: '0.4rem', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                                          [{evt.tag}]
                                        </span>
                                        {evt.title}
                                      </div>
                                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {evt.subTitle}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                    {evt.staff && (
                                      <span
                                        className="desktop-only"
                                        style={{
                                          fontSize: '0.73rem',
                                          color: 'var(--text-muted)',
                                          background: isLight ? '#f4f9ff' : 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid var(--border)',
                                          padding: '2px 8px',
                                          borderRadius: '6px'
                                        }}
                                      >
                                        {evt.staff}
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        color: isLight ? cfg.lightText : cfg.color,
                                        background: isLight ? cfg.lightBg : cfg.darkBg,
                                        border: `1px solid ${cfg.color}38`,
                                        padding: '2px 8px',
                                        borderRadius: '6px'
                                      }}
                                    >
                                      {cfg.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= UNIFIED SEAMLESS SLIDE-OVER DRAWER ================= */}
      <SlideOverDrawer
        isOpen={Boolean(drawerDate || drawerEvent)}
        onClose={closeDrawer}
        width="480px"
        title={
          drawerEvent
            ? drawerEvent.title
            : drawerDate
              ? formatHumanDate(drawerDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : 'Schedule Details'
        }
        subtitle={
          drawerEvent
            ? `${CATEGORY_CONFIG[drawerEvent.category]?.moduleName || 'Activity'} · ${formatHumanDate(drawerEvent.date)}`
            : drawerDate
              ? `${activeDayDrawerEvents.length} scheduled item${activeDayDrawerEvents.length === 1 ? '' : 's'}${getRelativeLabel(drawerDate, todayStr) ? ` · ${getRelativeLabel(drawerDate, todayStr)}` : ''}`
              : ''
        }
        footer={
          drawerEvent ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.65rem', flexWrap: 'wrap' }}>
              {drawerEvent.hasGuestTracker && drawerEvent.trackingCode ? (
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/track/${encodeURIComponent(drawerEvent.trackingCode)}`;
                    navigator.clipboard.writeText(url);
                    toast.success(`Guest tracking link copied (${drawerEvent.trackingCode})!`);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <Share2 size={14} color="var(--primary)" /> Copy Guest Link
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Close
                </button>
              )}

              {drawerEvent.link && (
                <button
                  type="button"
                  onClick={() => {
                    const target = drawerEvent.link;
                    closeDrawer();
                    navigate(target);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Open in {CATEGORY_CONFIG[drawerEvent.category]?.moduleName || 'Module'} <ExternalLink size={14} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Done
              </button>
            </div>
          )
        }
      >
        {/* MODE A: SINGLE EVENT INSPECTOR */}
        {drawerEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
            {cameFromDayDrawer && drawerDate && (
              <button
                type="button"
                onClick={() => {
                  setDrawerEvent(null);
                  setCameFromDayDrawer(false);
                }}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  padding: '0.38rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} /> Back to {formatHumanDate(drawerDate, { month: 'short', day: 'numeric' })} ({activeDayDrawerEvents.length} items)
              </button>
            )}

            {/* Category & Status Header Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(() => {
                const cfg = CATEGORY_CONFIG[drawerEvent.category] || CATEGORY_CONFIG.tour;
                return (
                  <span
                    style={{
                      padding: '0.28rem 0.72rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: isLight ? cfg.lightBg : cfg.darkBg,
                      color: isLight ? cfg.lightText : cfg.color,
                      border: `1px solid ${cfg.color}40`
                    }}
                  >
                    {cfg.label} · {drawerEvent.tag}
                  </span>
                );
              })()}

              {getRelativeLabel(drawerEvent.date, todayStr) && (
                <span className="badge badge-primary" style={{ fontSize: '0.73rem' }}>
                  {getRelativeLabel(drawerEvent.date, todayStr)}
                </span>
              )}
            </div>

            {/* Clean Attributes Card */}
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                overflow: 'hidden'
              }}
            >
              {Object.entries(drawerEvent.details || {}).map(([k, v], idx, arr) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '0.72rem 1rem',
                    fontSize: '0.825rem',
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: '500', flexShrink: 0 }}>{k}</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600', textAlign: 'right', wordBreak: 'break-word' }}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>

            {/* Guest Tracking Portal Card (ONLY for client-facing bookings, never for internal Overtime/SIM) */}
            {drawerEvent.hasGuestTracker && drawerEvent.trackingCode && (
              <div
                style={{
                  padding: '0.95rem 1.05rem',
                  borderRadius: '12px',
                  background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.08)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Guest Status Portal
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.1rem' }}>
                    {drawerEvent.trackingCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = drawerEvent.trackingCode;
                    closeDrawer();
                    navigate(`/track/${encodeURIComponent(code)}`);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.78rem', fontSize: '0.76rem', flexShrink: 0 }}
                >
                  Preview Portal
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: DAY SCHEDULE + QUICK ADD FOR THIS DATE */}
        {!drawerEvent && drawerDate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Create Section Pre-Filled with This Date */}
            <div>
              <div
                style={{
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-subtle)',
                  marginBottom: '0.6rem'
                }}
              >
                Quick Add on {formatHumanDate(drawerDate, { day: 'numeric', month: 'short' })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: '+ Tour Booking', icon: <Plane size={14} />, color: '#0095ff', path: '/tours' },
                  { label: '+ Visa / Document', icon: <FileText size={14} />, color: '#8b5cf6', path: '/documents' },
                  { label: '+ Hotel Stay', icon: <Building size={14} />, color: '#f59e0b', path: '/hotel' },
                  { label: '+ Cruise Voyage', icon: <Ship size={14} />, color: '#06b6d4', path: '/cruise' },
                  { label: '+ Travel SIM / WiFi', icon: <Phone size={14} />, color: '#10b981', path: '/telecom' },
                  { label: '+ Log Overtime', icon: <Clock size={14} />, color: '#f43f5e', path: '/overtime' }
                ].map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => quickCreateForDate(qa.path, drawerDate)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = qa.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <span style={{ color: qa.color, display: 'inline-flex' }}>{qa.icon}</span>
                    <span>{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Events List */}
            <div>
              <div
                style={{
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-subtle)',
                  marginBottom: '0.6rem'
                }}
              >
                Scheduled Items ({activeDayDrawerEvents.length})
              </div>

              {activeDayDrawerEvents.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '1px dashed var(--border)',
                    background: isLight ? '#fbfdff' : 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem'
                  }}
                >
                  Nothing scheduled on this date yet. Choose a quick action above to add a booking!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {activeDayDrawerEvents.map((evt) => {
                    const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => openEventDrawer(evt, true)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.8rem 0.9rem',
                          borderRadius: '11px',
                          background: isLight ? cfg.lightBg : cfg.darkBg,
                          border: `1px solid ${cfg.color}38`,
                          borderLeft: `4px solid ${cfg.color}`,
                          cursor: 'pointer',
                          opacity: evt.isCancelled ? 0.58 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isLight ? cfg.lightText : cfg.color, textTransform: 'uppercase' }}>
                            {cfg.label} · {evt.tag}
                          </span>
                          {evt.staff && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {evt.staff}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '0.86rem',
                            color: isLight ? '#0b1528' : 'var(--text-main)',
                            textDecoration: evt.isCancelled ? 'line-through' : 'none'
                          }}
                        >
                          {evt.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.18rem' }}>
                          {evt.subTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default OperationsCalendar;
