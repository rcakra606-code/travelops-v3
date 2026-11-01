import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import {
  DollarSign, Map, FileText, Phone, Plane, Building, Ship, Compass,
  AlertCircle, Clock, CheckCircle2, Settings2, Eye, EyeOff,
  ArrowUp, ArrowDown, RotateCcw, Plus, ChevronRight, Sparkles,
  Search, X, Share2, Calendar, User, ExternalLink, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useHotels } from '../context/HotelContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const DEFAULT_WIDGETS = [
  { id: 'welcome', name: 'Welcome Hero Banner', visible: true, size: '12' },
  { id: 'quick_actions', name: 'Quick Actions Launcher', visible: true, size: '12' },
  { id: 'stats', name: 'Key Summary Cards', visible: true, size: '12' },
  { id: 'chart', name: 'Revenue Forecast Chart', visible: true, size: '12' },
  { id: 'upcoming', name: 'Upcoming Trips & Services', visible: true, size: '8' },
  { id: 'alerts', name: 'Needs Attention Today', visible: true, size: '4' }
];

const parseLocalDay = (dateStr) => {
  if (!dateStr || dateStr === '-') return null;
  const str = String(dateStr).trim();
  const parsed = new Date(str.includes('T') ? str : `${str}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const formatFriendlyDate = (dateStr) => {
  const parsed = parseLocalDay(dateStr);
  if (!parsed) return dateStr && dateStr !== '-' ? dateStr : 'To be scheduled';
  return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDayDiffFromToday = (dateStr, todayRef) => {
  const target = parseLocalDay(dateStr);
  if (!target) return null;
  const base = todayRef || new Date();
  const baseClean = new Date(base);
  baseClean.setHours(0, 0, 0, 0);
  return Math.round((target - baseClean) / (1000 * 60 * 60 * 24));
};

const getRelativeDayLabel = (dateStr, todayRef) => {
  const diff = getDayDiffFromToday(dateStr, todayRef);
  if (diff === null) return null;
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 14) return `In ${diff}d`;
  return null;
};

const getUrgencyBadgeInfo = (diffDays) => {
  if (diffDays === null) return { label: 'Check', isUrgent: false };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d Overdue`, isUrgent: true };
  if (diffDays === 0) return { label: 'Due Today', isUrgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', isUrgent: true };
  return { label: `In ${diffDays}d`, isUrgent: diffDays <= 2 };
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Real Data-Driven 7-Bar Micro Chart for KPI Cards
const MiniBarChart = ({ values = [], color = '#00a8ff', masked = false }) => {
  const safeValues = values.length > 0 ? values : [0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...safeValues, 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        height: '28px',
        paddingBottom: '1px'
      }}
      aria-hidden="true"
    >
      {safeValues.map((v, i) => {
        const ratio = masked ? 0.35 + ((i % 3) * 0.15) : v / maxVal;
        const barHeight = v === 0 && !masked ? 4 : Math.max(6, Math.round(ratio * 26));
        return (
          <span
            key={i}
            style={{
              width: '6px',
              height: `${barHeight}px`,
              borderRadius: '3px',
              background: color,
              opacity: v === 0 && !masked ? 0.22 : 0.45 + Math.min(0.55, ratio * 0.55),
              transition: 'height 0.25s ease, opacity 0.25s ease'
            }}
          />
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLight = theme === 'light';
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activityFilter, setActivityFilter] = useState('All');
  const [activitySearch, setActivitySearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'mine'
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [chartHorizon, setChartHorizon] = useState(30);
  const [hideRevenue, setHideRevenue] = useState(() => {
    return localStorage.getItem('travelops_hide_revenue') === 'true';
  });

  const [widgets, setWidgets] = useState(() => {
    try {
      const savedV2 = localStorage.getItem('travelops_dashboard_widgets_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_WIDGETS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    return DEFAULT_WIDGETS;
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  const firstName = (user?.name || user?.email?.split('@')[0] || 'Friend').split(' ')[0];

  const { tours, getStats, loading: toursLoading } = useTours();
  const { cruises, loading: cruisesLoading } = useCruises();
  const { documents, loading: docsLoading } = useDocuments();
  const { telecoms, loading: telecomsLoading } = useTelecoms();
  const { hotels, loading: hotelsLoading } = useHotels();

  // Only show cold-load skeleton when initial fetch is still in flight and no records are in memory yet
  const isInitialLoading =
    toursLoading &&
    cruisesLoading &&
    docsLoading &&
    telecomsLoading &&
    hotelsLoading &&
    (tours || []).length === 0;

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('travelops_welcome_shown');
    if (!hasSeenWelcome && user) {
      sessionStorage.setItem('travelops_welcome_shown', 'true');
      toast.success(`${getGreeting()}, ${firstName}! Have a wonderful and smooth day ahead.`);
    }
  }, [user, firstName, toast]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const toggleHideRevenue = () => {
    setHideRevenue((prev) => {
      const next = !prev;
      localStorage.setItem('travelops_hide_revenue', String(next));
      return next;
    });
  };

  const saveWidgets = (newWidgets) => {
    setWidgets([...newWidgets]);
    localStorage.setItem('travelops_dashboard_widgets_v2', JSON.stringify(newWidgets));
  };

  const moveWidget = (index, direction) => {
    const newWidgets = [...widgets];
    if (direction === 'up' && index > 0) {
      [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
    } else if (direction === 'down' && index < newWidgets.length - 1) {
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    }
    saveWidgets(newWidgets);
  };

  const toggleWidgetVisibility = (index) => {
    const newWidgets = [...widgets];
    newWidgets[index].visible = !newWidgets[index].visible;
    saveWidgets(newWidgets);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tourStats = getStats();

  // Compute confirmed travelers accurately from tours
  const confirmedTravelers = useMemo(() => {
    return (tours || []).reduce((sum, t) => {
      if (t.status === 'Confirm' || t.status === 'Confirmed') {
        const count = Number(t.paxCount || t.paxInfo?.length || 1);
        return sum + (Number.isFinite(count) ? count : 1);
      }
      return sum;
    }, 0);
  }, [tours]);

  const activeCruises = useMemo(() => {
    return (cruises || []).filter((c) => {
      const sDate = parseLocalDay(c.sailingStart);
      return sDate && sDate >= today && c.status !== 'Cancel' && c.status !== 'Cancelled';
    }).length;
  }, [cruises, today]);

  const activeHotels = useMemo(() => {
    return (hotels || []).filter((h) => h.status === 'Active' || h.status === 'Upcoming' || h.status === 'Pending').length;
  }, [hotels]);

  const activeDocs = useMemo(() => {
    return (documents || []).filter((d) => !d.sendDate).length;
  }, [documents]);

  const activeTelecoms = useMemo(() => {
    return (telecoms || []).filter((t) => !t.tanggalPengembalian && (!t.tanggalSelesai || parseLocalDay(t.tanggalSelesai) >= today)).length;
  }, [telecoms, today]);

  const totalActiveTrips = tourStats.activeBookings + activeCruises + activeHotels;

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

  // Real data buckets for KPI micro-bars
  const kpiMiniBars = useMemo(() => {
    // 1. Revenue across 6 upcoming 15-day windows
    const revBuckets = [0, 0, 0, 0, 0, 0];
    // 2. Trip counts across 6 upcoming 7-day windows
    const tripBuckets = [0, 0, 0, 0, 0, 0];

    (tours || []).forEach((t) => {
      if (t.status === 'Cancel' || t.status === 'Cancelled') return;
      const diff = getDayDiffFromToday(t.departureDate, today);
      if (diff !== null && diff >= 0) {
        const revIdx = Math.min(5, Math.floor(diff / 15));
        revBuckets[revIdx] += t.financials?.totalOmset || 0;
        if (diff < 42) {
          tripBuckets[Math.floor(diff / 7)] += 1;
        }
      }
    });

    (cruises || []).forEach((c) => {
      const diff = getDayDiffFromToday(c.sailingStart, today);
      if (diff !== null && diff >= 0 && diff < 42) {
        tripBuckets[Math.floor(diff / 7)] += 1;
      }
    });

    (hotels || []).forEach((h) => {
      const diff = getDayDiffFromToday(h.checkIn, today);
      if (diff !== null && diff >= 0 && diff < 42) {
        tripBuckets[Math.floor(diff / 7)] += 1;
      }
    });

    // 3. Document stage breakdown (New, Appointment, Processing, Ready, Shipped, Delivered)
    const docBuckets = [0, 0, 0, 0, 0, 0];
    (documents || []).forEach((d) => {
      if (d.shippingStatus === 'Received' || d.receivedStatus === 'Final') docBuckets[5] += 1;
      else if (d.sendDate || d.shippingStatus === 'Sent') docBuckets[4] += 1;
      else {
        const diff = getDayDiffFromToday(d.estimatedDone, today);
        if (diff !== null && diff <= 0) docBuckets[3] += 1;
        else if (d.appointmentDate) docBuckets[1] += 1;
        else docBuckets[2] += 1;
      }
    });

    // 4. Telecom buckets across 6 upcoming/recent windows
    const telBuckets = [0, 0, 0, 0, 0, 0];
    (telecoms || []).forEach((t) => {
      const diff = getDayDiffFromToday(t.tanggalMulai, today);
      if (diff !== null && diff >= -14 && diff < 28) {
        const idx = Math.min(5, Math.max(0, Math.floor((diff + 14) / 7)));
        telBuckets[idx] += 1;
      }
    });

    return { revBuckets, tripBuckets, docBuckets, telBuckets };
  }, [tours, cruises, hotels, documents, telecoms, today]);

  // Forecast Chart Data + Period Summary (groups 90d by week for clean X-axis!)
  const { chartData, forecastSummary } = useMemo(() => {
    let periodRevenue = 0;
    let periodDepartures = 0;
    let periodTravelers = 0;

    if (chartHorizon === 90) {
      // 13 weekly buckets
      const buckets = Array.from({ length: 13 }, (_, idx) => {
        const start = new Date(today);
        start.setDate(start.getDate() + idx * 7);
        const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { name: label, sales: 0, trips: 0 };
      });

      (tours || []).forEach((t) => {
        if (t.departureDate && t.status !== 'Cancel' && t.status !== 'Cancelled') {
          const diff = getDayDiffFromToday(t.departureDate, today);
          if (diff !== null && diff >= 0 && diff < 90) {
            const bIdx = Math.min(12, Math.floor(diff / 7));
            const omset = t.financials?.totalOmset || 0;
            buckets[bIdx].sales += omset;
            buckets[bIdx].trips += 1;
            periodRevenue += omset;
            periodDepartures += 1;
            periodTravelers += Number(t.paxCount || t.paxInfo?.length || 1);
          }
        }
      });

      return {
        chartData: buckets,
        forecastSummary: { totalRevenue: periodRevenue, departures: periodDepartures, travelers: periodTravelers }
      };
    }

    const dataMap = {};
    const orderedKeys = [];
    for (let i = 0; i < chartHorizon; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      orderedKeys.push(dateStr);
      dataMap[dateStr] = 0;
    }

    (tours || []).forEach((t) => {
      if (t.departureDate && t.status !== 'Cancel' && t.status !== 'Cancelled') {
        const diff = getDayDiffFromToday(t.departureDate, today);
        if (diff !== null && diff >= 0 && diff < chartHorizon) {
          const dep = parseLocalDay(t.departureDate);
          const dateStr = dep.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const omset = t.financials?.totalOmset || 0;
          if (dataMap[dateStr] !== undefined) {
            dataMap[dateStr] += omset;
          }
          periodRevenue += omset;
          periodDepartures += 1;
          periodTravelers += Number(t.paxCount || t.paxInfo?.length || 1);
        }
      }
    });

    return {
      chartData: orderedKeys.map((key) => ({ name: key, sales: dataMap[key] })),
      forecastSummary: { totalRevenue: periodRevenue, departures: periodDepartures, travelers: periodTravelers }
    };
  }, [tours, chartHorizon, today]);

  const quickActions = [
    {
      label: 'New Tour Booking',
      desc: 'Group or private trip',
      icon: <Plane size={17} />,
      color: '#0095ff',
      onClick: () => navigate('/tours', { state: { openNew: true } })
    },
    {
      label: 'Visa & Document',
      desc: 'Log passport or visa',
      icon: <FileText size={17} />,
      color: '#6366f1',
      onClick: () => navigate('/documents', { state: { openNew: true } })
    },
    {
      label: 'Hotel Stay',
      desc: 'Add room reservation',
      icon: <Building size={17} />,
      color: '#f59e0b',
      onClick: () => navigate('/hotel', { state: { openNew: true } })
    },
    {
      label: 'Cruise Voyage',
      desc: 'Cabin & sailing dates',
      icon: <Ship size={17} />,
      color: '#06b6d4',
      onClick: () => navigate('/cruise', { state: { openNew: true } })
    },
    {
      label: 'Travel SIM / WiFi',
      desc: 'Roaming & eSIM rental',
      icon: <Phone size={17} />,
      color: '#10b981',
      onClick: () => navigate('/telecom', { state: { openNew: true } })
    },
    {
      label: 'Guest Tracker',
      desc: 'Check live client link',
      icon: <Compass size={17} />,
      color: '#38bdf8',
      onClick: () => navigate('/track')
    }
  ];

  const stats = [
    {
      id: 'revenue',
      title: 'Total Tour Revenue',
      value: hideRevenue ? 'Rp •••••••••' : formatCurrency(tourStats.totalOmset),
      icon: <DollarSign size={20} />,
      isPositive: true,
      trendIcon: <TrendingUp size={13} />,
      trendText: `${tourStats.statusCounts?.Confirm || 0} confirmed bookings`,
      color: '#00a8ff',
      glowColor: '#38bdf8',
      bars: kpiMiniBars.revBuckets,
      masked: hideRevenue,
      canTogglePrivacy: true,
      path: '/tours'
    },
    {
      id: 'trips',
      title: 'Active Trips & Stays',
      value: totalActiveTrips.toString(),
      icon: <Map size={20} />,
      isPositive: true,
      trendIcon: <Calendar size={13} />,
      trendText: `${tourStats.activeBookings} Tours · ${activeCruises} Cruises · ${activeHotels} Hotels`,
      color: '#3b82f6',
      glowColor: '#60a5fa',
      bars: kpiMiniBars.tripBuckets,
      path: '/calendar'
    },
    {
      id: 'docs',
      title: 'Visas & Documents',
      value: activeDocs.toString(),
      icon: <FileText size={20} />,
      isPositive: activeDocs === 0,
      trendIcon: activeDocs === 0 ? <CheckCircle2 size={13} /> : <Clock size={13} />,
      trendText: activeDocs > 0 ? `${activeDocs} currently in progress` : 'All delivered',
      color: '#6366f1',
      glowColor: '#818cf8',
      bars: kpiMiniBars.docBuckets,
      path: '/documents'
    },
    {
      id: 'telecom',
      title: 'Travel SIM & Roaming',
      value: activeTelecoms.toString(),
      icon: <Phone size={20} />,
      isPositive: true,
      trendIcon: <CheckCircle2 size={13} />,
      trendText: activeTelecoms > 0 ? `${activeTelecoms} connected travelers` : 'All devices returned',
      color: '#10b981',
      glowColor: '#34d399',
      bars: kpiMiniBars.telBuckets,
      path: '/telecom'
    }
  ];

  // Unified Upcoming Activities with rich metadata for Quick Preview Drawer
  const allUpcomingBase = useMemo(() => {
    const items = [
      ...(tours || []).map((t) => ({
        id: t.id,
        type: 'Tour',
        moduleName: 'Tours & Trips',
        customer:
          t.paxInfo && t.paxInfo.length > 0 && (t.paxInfo[0].firstName || t.paxInfo[0].lastName)
            ? `${t.paxInfo[0].firstName || ''} ${t.paxInfo[0].lastName || ''}`.trim()
            : t.bookingCode || t.tourCode || 'Tour Group',
        destination: t.country || '-',
        date: t.departureDate || '-',
        endDate: t.returnDate || null,
        targetDate: parseLocalDay(t.departureDate),
        status: t.status || 'Pending',
        staff: t.staffName || 'Unassigned',
        trackingCode: t.bookingCode || t.tourCode || '',
        detailNote: `${t.paxCount || t.paxInfo?.length || 1} traveler(s) · ${t.category || 'Leisure'}`,
        path: '/tours'
      })),
      ...(cruises || []).map((c) => {
        const sDate = parseLocalDay(c.sailingStart);
        return {
          id: c.id,
          type: 'Cruise',
          moduleName: 'Cruise Voyages',
          customer: c.picName || 'Cruise Guest',
          destination: c.route || c.shipName || '-',
          date: c.sailingStart || '-',
          endDate: c.sailingEnd || null,
          targetDate: sDate,
          status: c.status || (sDate && sDate >= today ? 'Upcoming' : 'Past'),
          staff: c.staff || 'Unassigned',
          trackingCode: c.bookingRef || c.reservationCode || '',
          detailNote: [c.cruiseBrand, c.shipName, c.paxCount ? `${c.paxCount} pax` : null].filter(Boolean).join(' · '),
          path: '/cruise'
        };
      }),
      ...(documents || []).map((d) => ({
        id: d.id,
        type: 'Document',
        moduleName: 'Visas & Documents',
        customer: d.guestName || '-',
        destination: d.country || '-',
        date: d.estimatedDone || d.receiveDate || '-',
        endDate: null,
        targetDate: parseLocalDay(d.estimatedDone || d.receiveDate),
        status: d.sendDate ? 'Completed' : 'Processing',
        staff: d.staff || 'Unassigned',
        trackingCode: d.bookingCode || d.invoiceNumber || d.shippingResi || d.id || '',
        detailNote: [d.docType || 'Visa / Passport', d.processType ? `${d.processType} Process` : null].filter(Boolean).join(' · '),
        path: '/documents'
      })),
      ...(telecoms || []).map((t) => ({
        id: t.id,
        type: 'Telecom',
        moduleName: 'Travel SIM & eSIM',
        customer: t.nama || '-',
        destination: t.region || '-',
        date: t.tanggalMulai || '-',
        endDate: t.tanggalSelesai || null,
        targetDate: parseLocalDay(t.tanggalMulai),
        status: t.tanggalPengembalian ? 'Completed' : 'Active',
        staff: t.staff || 'Unassigned',
        trackingCode: '',
        detailNote: [t.typeProduct || 'Travel SIM / WiFi', t.noTelephone].filter(Boolean).join(' · '),
        path: '/telecom'
      })),
      ...(hotels || []).map((h) => ({
        id: h.id,
        type: 'Hotel',
        moduleName: 'Hotel Stays',
        customer: h.guestList ? h.guestList.split(',')[0].trim() : h.hotelName || '-',
        destination: `${h.hotelName || '-'}${h.region ? ` (${h.region})` : ''}`,
        date: h.checkIn || '-',
        endDate: h.checkOut || null,
        targetDate: parseLocalDay(h.checkIn),
        status: h.status || 'Upcoming',
        staff: h.staff || 'Unassigned',
        trackingCode: h.confirmationNumber || '',
        detailNote: [h.roomType, h.supplierName].filter(Boolean).join(' · ') || 'Hotel reservation',
        path: '/hotel'
      }))
    ];

    return items
      .filter(
        (a) =>
          a.targetDate &&
          a.targetDate >= today &&
          !['Completed', 'Cancel', 'Cancelled', 'Past', 'Past Date'].includes(a.status)
      )
      .sort((a, b) => a.targetDate - b.targetDate);
  }, [tours, cruises, documents, telecoms, hotels, today]);

  // Apply Scope ('all' vs 'mine') and Search Query before computing category pill counts
  const scopedAndSearchedActivities = useMemo(() => {
    const myName = (user?.name || '').trim().toLowerCase();
    const q = activitySearch.trim().toLowerCase();

    return allUpcomingBase.filter((item) => {
      if (scopeFilter === 'mine' && myName) {
        if ((item.staff || '').trim().toLowerCase() !== myName) return false;
      }
      if (q) {
        const hay = `${item.customer} ${item.destination} ${item.trackingCode} ${item.staff} ${item.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUpcomingBase, scopeFilter, activitySearch, user?.name]);

  const categoryCounts = useMemo(() => {
    const counts = {
      All: scopedAndSearchedActivities.length,
      Tour: 0,
      Cruise: 0,
      Hotel: 0,
      Document: 0,
      Telecom: 0
    };
    scopedAndSearchedActivities.forEach((item) => {
      if (counts[item.type] !== undefined) counts[item.type] += 1;
    });
    return counts;
  }, [scopedAndSearchedActivities]);

  const filteredUpcomingActivities = useMemo(() => {
    if (activityFilter === 'All') return scopedAndSearchedActivities;
    return scopedAndSearchedActivities.filter((a) => a.type === activityFilter);
  }, [scopedAndSearchedActivities, activityFilter]);

  const recentActivities = filteredUpcomingActivities.slice(0, 8);

  // Comprehensive Multi-Module "Needs Attention Today" Alerts
  const alerts = useMemo(() => {
    const list = [];

    // 1. Tours departing in <= 7 days without an invoice number
    (tours || []).forEach((t) => {
      if (t.departureDate && t.status !== 'Cancel' && t.status !== 'Cancelled') {
        const diff = getDayDiffFromToday(t.departureDate, today);
        if (diff !== null && diff >= 0 && diff <= 7) {
          if (!t.financials?.invoiceNumber || t.financials.invoiceNumber.trim() === '') {
            list.push({
              id: `tour-inv-${t.id}`,
              module: 'Tour',
              title: `Trip ${t.bookingCode || t.tourCode || t.id} (${t.country || 'Tour'}) departs soon and needs an invoice`,
              type: diff <= 2 ? 'danger' : 'warning',
              date: t.departureDate,
              diffDays: diff,
              actionPath: '/tours',
              actionState: { openTab: 'database' }
            });
          }
        }
      }
    });

    // 2. Documents / Visas overdue, due today, or due within 2 days
    (documents || []).forEach((d) => {
      if (!d.sendDate) {
        const targetStr = d.estimatedDone || d.receiveDate;
        const diff = getDayDiffFromToday(targetStr, today);
        if (diff !== null && diff <= 2) {
          list.push({
            id: `doc-due-${d.id}`,
            module: 'Visa / Doc',
            title:
              diff <= 0
                ? `${d.guestName || 'Guest'}'s ${d.docType || 'document'} (${d.country || 'Visa'}) is ready for release check`
                : `${d.guestName || 'Guest'}'s ${d.docType || 'document'} (${d.country || 'Visa'}) is due for completion soon`,
            type: diff <= 0 ? 'danger' : 'warning',
            date: targetStr,
            diffDays: diff,
            actionPath: '/documents'
          });
        }
      }
    });

    // 3. Cruises with Final Payment deadline within 7 days (or overdue)
    (cruises || []).forEach((c) => {
      if (c.finalPaymentDate && !['Cancel', 'Cancelled', 'Past', 'Past Date'].includes(c.status)) {
        const sailingDiff = getDayDiffFromToday(c.sailingStart, today);
        if (sailingDiff === null || sailingDiff >= 0) {
          const payDiff = getDayDiffFromToday(c.finalPaymentDate, today);
          if (payDiff !== null && payDiff >= -7 && payDiff <= 7) {
            list.push({
              id: `cruise-pay-${c.id}`,
              module: 'Cruise',
              title: `Final payment check for ${c.picName || 'Guest'} (${c.shipName || c.cruiseBrand || 'Cruise'})`,
              type: payDiff <= 1 ? 'danger' : 'warning',
              date: c.finalPaymentDate,
              diffDays: payDiff,
              actionPath: '/cruise'
            });
          }
        }
      }
    });

    // 4. Hotels checking in today/tomorrow that are still Pending or missing confirmation #
    (hotels || []).forEach((h) => {
      if (!['Cancel', 'Cancelled', 'Past Date'].includes(h.status)) {
        const diff = getDayDiffFromToday(h.checkIn, today);
        if (diff !== null && diff >= 0 && diff <= 2 && (h.status === 'Pending' || !h.confirmationNumber)) {
          const guest = h.guestList ? h.guestList.split(',')[0].trim() : 'Guest';
          list.push({
            id: `hotel-chk-${h.id}`,
            module: 'Hotel',
            title: `${guest} checks in at ${h.hotelName || 'Hotel'} soon — confirm voucher number`,
            type: diff <= 1 ? 'danger' : 'warning',
            date: h.checkIn,
            diffDays: diff,
            actionPath: '/hotel'
          });
        }
      }
    });

    // 5. Travel SIM / WiFi rentals ending today or overdue without return date
    (telecoms || []).forEach((t) => {
      if (t.tanggalSelesai && !t.tanggalPengembalian) {
        const diff = getDayDiffFromToday(t.tanggalSelesai, today);
        if (diff !== null && diff <= 1) {
          list.push({
            id: `tel-ret-${t.id}`,
            module: 'SIM / WiFi',
            title: `${t.nama || 'Traveler'}'s ${t.typeProduct || 'SIM / WiFi'} rental ends — check return & deposit`,
            type: diff < 0 ? 'danger' : 'warning',
            date: t.tanggalSelesai,
            diffDays: diff,
            actionPath: '/telecom'
          });
        }
      }
    });

    return list.sort((a, b) => (a.diffDays ?? 99) - (b.diffDays ?? 99));
  }, [tours, documents, cruises, hotels, telecoms, today]);

  const getStatusBadge = (status) => {
    if (['Confirmed', 'Confirm', 'Completed'].includes(status)) {
      return (
        <span className="badge badge-success">
          <span className="pulse-dot pulse-dot-green" />
          {status === 'Confirm' ? 'Confirmed' : status}
        </span>
      );
    }
    if (['Pending', 'Processing', 'Upcoming', 'Active'].includes(status)) {
      return (
        <span className="badge badge-warning">
          <span className="pulse-dot pulse-dot-amber" />
          {status}
        </span>
      );
    }
    if (['Cancelled', 'Cancel', 'Past', 'Past Date'].includes(status)) {
      return <span className="badge badge-danger">{status === 'Cancel' ? 'Cancelled' : status}</span>;
    }
    return (
      <span className="badge badge-primary">
        <span className="pulse-dot pulse-dot-cyan" />
        {status}
      </span>
    );
  };

  const handleCopyGuestLink = (code) => {
    if (!code) return;
    const url = `${window.location.origin}/track/${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Guest tracking link copied (${code})!`);
  };

  const chartColor = isLight ? '#0095ff' : '#38bdf8';

  const renderWidget = (widget) => {
    if (!widget.visible) return null;

    if (widget.id === 'welcome') {
      return (
        <div key="welcome" className="bento-col-12 reveal surface dashboard-welcome-hero">
          {/* Luminous Neon Orb Accents */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-40px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.75rem' }}>
              <Sparkles size={14} color="#7dd3fc" />
              <p
                style={{
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#bae6fd'
                }}
              >
                {getGreeting()}, {firstName}
              </p>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '2.05rem',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: '1.25',
                letterSpacing: '-0.02em'
              }}
            >
              Every journey, thoughtfully organized.
            </h1>
            <p
              style={{
                margin: '0.85rem 0 0 0',
                fontSize: '0.95rem',
                color: 'rgba(240, 249, 255, 0.92)',
                lineHeight: '1.6',
                maxWidth: '620px'
              }}
            >
              You currently have <strong style={{ color: '#ffffff' }}>{totalActiveTrips} active trips</strong>,{' '}
              <strong style={{ color: '#ffffff' }}>{activeDocs} documents in progress</strong>, and{' '}
              <strong style={{ color: '#ffffff' }}>{confirmedTravelers} confirmed travelers</strong> on schedule.
            </p>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/tours', { state: { openNew: true } })}
              className="btn"
              style={{
                fontSize: '0.85rem',
                padding: '0.68rem 1.25rem',
                borderRadius: '11px',
                background: '#ffffff',
                color: '#0066cc',
                fontWeight: '700',
                border: 'none',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)'
              }}
            >
              <Plus size={16} /> New Tour Booking
            </button>

            <button
              type="button"
              onClick={() => navigate('/calendar')}
              className="btn"
              style={{
                fontSize: '0.85rem',
                padding: '0.68rem 1.15rem',
                borderRadius: '11px',
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                fontWeight: '600'
              }}
            >
              <Calendar size={15} /> Trip Calendar
            </button>

            <button
              type="button"
              onClick={() => setIsCustomizing(true)}
              className="btn"
              style={{
                fontSize: '0.85rem',
                padding: '0.68rem 1.05rem',
                borderRadius: '11px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                fontWeight: '600'
              }}
              title="Customize dashboard sections"
            >
              <Settings2 size={15} /> Customize
            </button>
          </div>
        </div>
      );
    }

    if (widget.id === 'quick_actions') {
      return (
        <div
          key="quick_actions"
          className="bento-col-12"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={qa.onClick}
              className="bento-card-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                background: isLight ? '#ffffff' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${qa.color}16`,
                  color: qa.color,
                  border: `1px solid ${qa.color}33`,
                  flexShrink: 0
                }}
              >
                {qa.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {qa.label}
                </div>
                <div
                  style={{
                    fontSize: '0.73rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {qa.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (widget.id === 'stats') {
      return (
        <React.Fragment key="stats">
          {stats.map((stat) => (
            <div
              key={stat.id}
              onClick={() => navigate(stat.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(stat.path);
              }}
              className="stat-card bento-card-glass bento-col-3"
              style={{ '--stat-glow-color': stat.glowColor, cursor: 'pointer' }}
              title={`Open ${stat.title}`}
            >
              <div className="stat-header">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div className="stat-title" style={{ marginBottom: 0 }}>
                      {stat.title}
                    </div>
                    {stat.canTogglePrivacy && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHideRevenue();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '6px'
                        }}
                        title={hideRevenue ? 'Show revenue figures' : 'Hide revenue figures for screen privacy'}
                        aria-label={hideRevenue ? 'Show revenue figures' : 'Hide revenue figures'}
                      >
                        {hideRevenue ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                  <div
                    className="stat-value font-mono"
                    style={{
                      fontSize: stat.value.length > 14 ? '1.22rem' : '1.55rem',
                      marginTop: '0.3rem'
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div
                  className="stat-icon"
                  style={{
                    color: stat.color,
                    background: `${stat.color}16`,
                    borderColor: `${stat.color}35`,
                    flexShrink: 0
                  }}
                >
                  {stat.icon}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: '0.5rem',
                  marginTop: 'auto',
                  paddingTop: '0.5rem'
                }}
              >
                <div className={`stat-trend ${stat.isPositive ? 'trend-up' : 'trend-down'}`} style={{ marginTop: 0 }}>
                  {stat.trendIcon}
                  <span>{stat.trendText}</span>
                </div>
                <MiniBarChart values={stat.bars} color={stat.color} masked={Boolean(stat.masked)} />
              </div>
            </div>
          ))}
        </React.Fragment>
      );
    }

    if (widget.id === 'chart') {
      const hasScheduledRevenue = forecastSummary.totalRevenue > 0;

      return (
        <div
          key="chart"
          className="card bento-card-glass bento-col-12"
          style={{ minHeight: hasScheduledRevenue && !hideRevenue ? '390px' : 'auto' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.85rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1.08rem', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                  Revenue Forecast
                </h3>
                <span className="badge badge-primary font-mono" style={{ fontSize: '0.72rem' }}>
                  Next {chartHorizon} Days {chartHorizon === 90 ? '(Weekly)' : ''}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Expected booking value from confirmed departures over the next {chartHorizon} days
              </p>

              {/* Headline Period Summary Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid var(--border)',
                    color: 'var(--primary)'
                  }}
                >
                  Forecast: {hideRevenue ? 'Rp •••••••••' : formatCurrency(forecastSummary.totalRevenue)}
                </span>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {forecastSummary.departures} Departure{forecastSummary.departures === 1 ? '' : 's'}
                </span>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {forecastSummary.travelers} Traveler{forecastSummary.travelers === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Privacy Toggle + Time Horizon Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={toggleHideRevenue}
                className="btn btn-secondary"
                style={{ padding: '0.38rem 0.7rem', fontSize: '0.76rem', borderRadius: '9px' }}
                title={hideRevenue ? 'Show revenue chart' : 'Mask revenue chart'}
              >
                {hideRevenue ? <Eye size={14} color="var(--primary)" /> : <EyeOff size={14} />}
                <span>{hideRevenue ? 'Show Revenue' : 'Hide Figures'}</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                  padding: '0.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}
              >
                {[
                  { label: '7 Days', value: 7 },
                  { label: '30 Days', value: 30 },
                  { label: '90 Days', value: 90 }
                ].map((h) => {
                  const active = chartHorizon === h.value;
                  return (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setChartHorizon(h.value)}
                      style={{
                        padding: '0.32rem 0.75rem',
                        borderRadius: '7px',
                        fontSize: '0.775rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: 'none',
                        background: active ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)' : 'transparent',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        boxShadow: active ? '0 2px 10px rgba(0, 168, 255, 0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {hideRevenue ? (
            <div
              style={{
                padding: '2.25rem 1.5rem',
                textAlign: 'center',
                borderRadius: '14px',
                background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                border: '1px dashed var(--border)'
              }}
            >
              <EyeOff size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                Revenue chart is hidden for screen privacy
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '0.9rem' }}>
                Safe to share your screen with guests. Click below whenever you want to view figures again.
              </div>
              <button
                type="button"
                onClick={toggleHideRevenue}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
              >
                <Eye size={14} /> Show Revenue Forecast
              </button>
            </div>
          ) : !hasScheduledRevenue ? (
            <div
              style={{
                padding: '2.25rem 1.5rem',
                textAlign: 'center',
                borderRadius: '14px',
                background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                border: '1px dashed var(--border)'
              }}
            >
              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.94rem' }}>
                No confirmed tour departures in the next {chartHorizon} days
              </div>
              <div style={{ fontSize: '0.81rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '0.95rem' }}>
                {chartHorizon < 90
                  ? 'Try expanding the forecast window to 90 Days, or add a new upcoming tour booking.'
                  : 'Add an upcoming tour departure to visualize your expected revenue curve here.'}
              </div>
              <div style={{ display: 'inline-flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {chartHorizon < 90 && (
                  <button
                    type="button"
                    onClick={() => setChartHorizon(90)}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    View 90-Day Forecast
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/tours', { state: { openNew: true } })}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                >
                  <Plus size={14} /> New Tour Booking
                </button>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalesNeonBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2eeff' : 'rgba(56, 189, 248, 0.08)'} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-subtle)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    minTickGap={16}
                  />
                  <YAxis
                    stroke="var(--text-subtle)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(8, 14, 28, 0.95)',
                      borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.35)',
                      borderRadius: '12px',
                      boxShadow: isLight ? '0 12px 28px rgba(0, 149, 255, 0.14)' : '0 15px 30px rgba(0, 0, 0, 0.7)',
                      color: isLight ? '#0b1528' : '#f0f7ff',
                      fontSize: '0.825rem'
                    }}
                    itemStyle={{ color: chartColor, fontWeight: '700' }}
                    labelFormatter={(label) => (chartHorizon === 90 ? `Week of ${label}` : label)}
                    formatter={(value) => [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, 'Expected Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={chartColor}
                    strokeWidth={2.6}
                    fillOpacity={1}
                    fill="url(#colorSalesNeonBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }

    if (widget.id === 'upcoming') {
      return (
        <div key="upcoming" className={`card bento-card-glass bento-col-${widget.size}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.9rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1.08rem', color: 'var(--text-main)' }}>
                Upcoming Trips &amp; Services
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click any row for a quick preview &amp; guest tracking link
              </p>
            </div>

            {/* All Team vs My Guests Scope Toggle */}
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                padding: '0.22rem',
                borderRadius: '9px',
                border: '1px solid var(--border)'
              }}
            >
              {[
                { id: 'all', label: 'All Team' },
                { id: 'mine', label: 'My Guests' }
              ].map((s) => {
                const active = scopeFilter === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScopeFilter(s.id)}
                    style={{
                      padding: '0.28rem 0.68rem',
                      borderRadius: '7px',
                      fontSize: '0.76rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
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
          </div>

          {/* Search Bar + Segmented Category Filter Pills with Live Counts */}
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
            <div style={{ position: 'relative', flex: '1 1 210px', maxWidth: '300px' }}>
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search guest, destination, code..."
                style={{
                  padding: '0.45rem 2rem 0.45rem 2.15rem',
                  fontSize: '0.8rem',
                  borderRadius: '9px'
                }}
              />
              {activitySearch && (
                <button
                  type="button"
                  onClick={() => setActivitySearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                flexWrap: 'wrap',
                background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                padding: '0.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}
            >
              {['All', 'Tour', 'Cruise', 'Hotel', 'Document', 'Telecom'].map((filter) => {
                const active = activityFilter === filter;
                const count = categoryCounts[filter] ?? 0;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActivityFilter(filter)}
                    style={{
                      padding: '0.28rem 0.62rem',
                      borderRadius: '7px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                      background: active ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: active ? '0 2px 10px rgba(0, 168, 255, 0.28)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{filter}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0 0.35rem',
                        borderRadius: '9999px',
                        background: active ? 'rgba(255, 255, 255, 0.22)' : isLight ? '#dbeafe' : 'rgba(56, 189, 248, 0.12)',
                        color: active ? '#ffffff' : 'var(--primary)',
                        fontWeight: '700'
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Guest / Group</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const relLabel = getRelativeDayLabel(activity.date, today);
                    return (
                      <tr
                        key={`${activity.type}-${activity.id}`}
                        onClick={() => setSelectedActivity(activity)}
                        style={{ cursor: 'pointer' }}
                        title="Click for quick preview & tracking link"
                      >
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
                            {activity.type}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{activity.customer}</div>
                          {activity.trackingCode && (
                            <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '1px' }}>
                              {activity.trackingCode}
                            </div>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{activity.destination}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.84rem' }}>
                              {formatFriendlyDate(activity.date)}
                            </span>
                            {relLabel && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                                  color: 'var(--primary)'
                                }}
                              >
                                {relLabel}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(activity.status)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                      <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                          {activitySearch || scopeFilter === 'mine' || activityFilter !== 'All'
                            ? 'No matching upcoming items found'
                            : 'No upcoming items scheduled yet'}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          {activitySearch || scopeFilter === 'mine' || activityFilter !== 'All'
                            ? 'Try clearing your active filters or add a new booking below.'
                            : 'Ready to plan the next adventure? Create a new booking anytime.'}
                        </div>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {(activitySearch || scopeFilter === 'mine' || activityFilter !== 'All') && (
                            <button
                              type="button"
                              onClick={() => {
                                setActivityFilter('All');
                                setScopeFilter('all');
                                setActivitySearch('');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                            >
                              Reset Filters
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate('/tours', { state: { openNew: true } })}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                          >
                            <Plus size={14} /> Add Booking
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUpcomingActivities.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.85rem',
                paddingTop: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <span>
                Showing <strong style={{ color: 'var(--text-main)' }}>{recentActivities.length}</strong> of{' '}
                <strong style={{ color: 'var(--text-main)' }}>{filteredUpcomingActivities.length}</strong> upcoming item
                {filteredUpcomingActivities.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => navigate('/calendar')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                View Full Trip Calendar <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (widget.id === 'alerts') {
      return (
        <div key="alerts" className={`card bento-card-glass bento-col-${widget.size}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontWeight: '700',
                  fontSize: '1.08rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--text-main)'
                }}
              >
                <AlertCircle size={18} color="var(--primary)" /> Needs Attention Today
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Invoices, visas, cruise payments, check-ins &amp; returns
              </p>
            </div>
            {alerts.length > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                {alerts.length} Item{alerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              overflowY: 'auto',
              maxHeight: '420px',
              paddingRight: '0.25rem'
            }}
          >
            {alerts.length > 0 ? (
              alerts.map((item) => {
                const urgency = getUrgencyBadgeInfo(item.diffDays);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.actionPath, item.actionState ? { state: item.actionState } : undefined)}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      background:
                        item.type === 'danger'
                          ? isLight ? '#fff1f2' : 'rgba(244, 63, 94, 0.09)'
                          : isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.09)',
                      border: '1px solid',
                      borderColor:
                        item.type === 'danger'
                          ? isLight ? '#fecdd3' : 'rgba(244, 63, 94, 0.25)'
                          : isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.25)',
                      borderLeft: `4px solid ${item.type === 'danger' ? 'var(--danger)' : 'var(--warning)'}`,
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {item.module}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.48rem',
                          borderRadius: '9999px',
                          background: urgency.isUrgent
                            ? isLight ? '#ffe4e6' : 'rgba(244, 63, 94, 0.2)'
                            : isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                          color: urgency.isUrgent
                            ? isLight ? '#be123c' : '#fda4af'
                            : isLight ? '#b45309' : '#fcd34d'
                        }}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.45rem', lineHeight: '1.45' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} />
                        <span>{formatFriendlyDate(item.date)}</span>
                      </div>
                      <span style={{ color: 'var(--primary)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        Resolve <ChevronRight size={13} />
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '0.8rem',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--success)',
                    marginBottom: '0.75rem'
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  You&apos;re All Caught Up!
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Invoices, visas, cruise payments, check-ins, and SIM returns all look up to date.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeSidebarOnMobile}></div>
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            <div className="bento-grid" style={{ marginTop: '0.25rem' }}>
              {isInitialLoading ? (
                <>
                  <SkeletonLoader type="hero" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="chart" />
                </>
              ) : (
                widgets.map((widget) => renderWidget(widget))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Preview Drawer for Upcoming Trips & Services */}
      <SlideOverDrawer
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity ? selectedActivity.customer : 'Booking Preview'}
        subtitle={selectedActivity ? `${selectedActivity.moduleName} · Quick Summary` : ''}
        width="460px"
        footer={
          selectedActivity && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.65rem', flexWrap: 'wrap' }}>
              {selectedActivity.trackingCode ? (
                <button
                  type="button"
                  onClick={() => handleCopyGuestLink(selectedActivity.trackingCode)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <Share2 size={14} color="var(--primary)" /> Copy Guest Link
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  const targetPath = selectedActivity.path;
                  setSelectedActivity(null);
                  navigate(targetPath);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem' }}
              >
                Open in {selectedActivity.moduleName} <ExternalLink size={14} />
              </button>
            </div>
          )
        }
      >
        {selectedActivity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{selectedActivity.type}</span>
              {getStatusBadge(selectedActivity.status)}
            </div>

            <div
              style={{
                padding: '1.1rem',
                borderRadius: '14px',
                background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.05)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                  Destination / Property
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {selectedActivity.destination}
                </div>
                {selectedActivity.detailNote && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {selectedActivity.detailNote}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                    Scheduled Date
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {formatFriendlyDate(selectedActivity.date)}
                  </div>
                </div>

                {selectedActivity.endDate && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                      Return / Check-Out
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatFriendlyDate(selectedActivity.endDate)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                    Assigned Consultant
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={13} color="var(--primary)" />
                    <span>{selectedActivity.staff}</span>
                  </div>
                </div>

                {selectedActivity.trackingCode && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                      Reference Code
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--primary)', marginTop: '0.15rem' }}>
                      {selectedActivity.trackingCode}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedActivity.trackingCode && (
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
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Live Guest Status Portal
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Preview what your guest sees at `/track/{selectedActivity.trackingCode}`
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = selectedActivity.trackingCode;
                    setSelectedActivity(null);
                    navigate(`/track/${encodeURIComponent(code)}`);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.76rem', flexShrink: 0 }}
                >
                  Preview <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* Slide-Over Drawer for Layout Customization */}
      <SlideOverDrawer
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        title="Personalize Dashboard"
        subtitle="Choose and arrange the sections most helpful for your daily flow"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                saveWidgets(DEFAULT_WIDGETS);
                toast.info('Dashboard view restored to default layout');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              <RotateCcw size={14} /> Reset Default
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomizing(false);
                toast.success('Your dashboard layout has been saved!');
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}
            >
              Save View
            </button>
          </div>
        }
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Move sections up or down, or hide any cards you don&apos;t need right now.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {widgets.map((w, i) => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '11px',
                opacity: w.visible ? 1 : 0.5,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => moveWidget(i, 'up')}
                    disabled={i === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: i === 0 ? 'not-allowed' : 'pointer',
                      color: i === 0 ? 'transparent' : 'var(--text-muted)',
                      padding: 0
                    }}
                    aria-label="Move module up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(i, 'down')}
                    disabled={i === widgets.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: i === widgets.length - 1 ? 'not-allowed' : 'pointer',
                      color: i === widgets.length - 1 ? 'transparent' : 'var(--text-muted)',
                      padding: 0
                    }}
                    aria-label="Move module down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>{w.name}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleWidgetVisibility(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: w.visible ? 'var(--primary)' : 'var(--text-muted)'
                }}
                title={w.visible ? 'Hide section' : 'Show section'}
              >
                {w.visible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          ))}
        </div>
      </SlideOverDrawer>
    </div>
  );
};

export default Dashboard;
