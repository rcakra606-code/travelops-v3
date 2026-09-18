import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Search, 
  MapPin, Ship, Building, FileText, Clock, User, Download, Printer, 
  Eye, X, ExternalLink, Sparkles, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_CONFIG = {
  tour: { label: 'Tours', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', icon: MapPin },
  cruise: { label: 'Cruises', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', icon: Ship },
  hotel: { label: 'Hotels', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', icon: Building },
  document: { label: 'Documents', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', icon: FileText },
  overtime: { label: 'Overtime', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e', icon: Clock }
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const OperationsCalendar = () => {
  const navigate = useNavigate();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { overtimes } = useOvertimes();
  const { users } = useUsers();
  const { user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  // Calendar View State: 'month' | 'week' | 'agenda'
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // Extract active staff for filter
  const staffList = useMemo(() => {
    const list = new Set();
    users?.forEach(u => u.name && list.add(u.name));
    tours?.forEach(t => t.staffName && list.add(t.staffName));
    cruises?.forEach(c => c.staff && list.add(c.staff));
    hotels?.forEach(h => h.staff && list.add(h.staff));
    documents?.forEach(d => d.staff && list.add(d.staff));
    overtimes?.forEach(o => o.staff && list.add(o.staff));
    return Array.from(list).sort();
  }, [users, tours, cruises, hotels, documents, overtimes]);

  // Consolidate events from all domains
  const allEvents = useMemo(() => {
    const events = [];

    // 1. Tours
    (tours || []).forEach(t => {
      const title = t.tourCode || t.bookingCode || `Tour #${t.id}`;
      if (t.departureDate) {
        events.push({
          id: `tour-dep-${t.id}`,
          originalId: t.id,
          category: 'tour',
          date: t.departureDate.substring(0, 10),
          title: `🛫 Dep: ${title} (${t.country || 'Tour'})`,
          subTitle: `${t.paxCount || 1} Pax • Status: ${t.status || 'Active'}`,
          staff: t.staffName || '',
          status: t.status,
          link: '/tours',
          trackingCode: t.bookingCode || t.tourCode || t.id,
          raw: t,
          details: {
            'Category': 'Tour Departure',
            'Tour Code': t.tourCode || '-',
            'Booking Code': t.bookingCode || '-',
            'Country / Dest': t.country || '-',
            'Departure Date': t.departureDate,
            'Return Date': t.returnDate || '-',
            'Pax Count': t.paxCount || 1,
            'Status': t.status || 'Active',
            'PIC / Staff': t.staffName || 'Unassigned'
          }
        });
      }
      if (t.returnDate) {
        events.push({
          id: `tour-ret-${t.id}`,
          originalId: t.id,
          category: 'tour',
          date: t.returnDate.substring(0, 10),
          title: `🛬 Return: ${title} (${t.country || 'Tour'})`,
          subTitle: `Return from ${t.country || 'Tour'}`,
          staff: t.staffName || '',
          status: t.status,
          link: '/tours',
          trackingCode: t.bookingCode || t.tourCode || t.id,
          raw: t,
          details: {
            'Category': 'Tour Return',
            'Tour Code': t.tourCode || '-',
            'Booking Code': t.bookingCode || '-',
            'Country / Dest': t.country || '-',
            'Departure Date': t.departureDate || '-',
            'Return Date': t.returnDate,
            'Pax Count': t.paxCount || 1,
            'Status': t.status || 'Active',
            'PIC / Staff': t.staffName || 'Unassigned'
          }
        });
      }
    });

    // 2. Cruises
    (cruises || []).forEach(c => {
      const ship = c.shipName || c.cruiseBrand || `Cruise #${c.id}`;
      if (c.sailingStart) {
        events.push({
          id: `cruise-start-${c.id}`,
          originalId: c.id,
          category: 'cruise',
          date: c.sailingStart.substring(0, 10),
          title: `⚓ Sailing: ${ship}`,
          subTitle: `Route: ${c.route || '-'} • PIC: ${c.picName || c.staff || '-'}`,
          staff: c.staff || '',
          status: c.status || 'Upcoming',
          link: '/cruise',
          trackingCode: c.bookingRef || c.id,
          raw: c,
          details: {
            'Category': 'Cruise Departure',
            'Ship Name': c.shipName || '-',
            'Cruise Brand': c.cruiseBrand || '-',
            'Booking Ref': c.bookingRef || '-',
            'Route': c.route || '-',
            'Sailing Start': c.sailingStart,
            'Sailing End': c.sailingEnd || '-',
            'Guest PIC': c.picName || '-',
            'Staff': c.staff || 'Unassigned'
          }
        });
      }
      if (c.sailingEnd) {
        events.push({
          id: `cruise-end-${c.id}`,
          originalId: c.id,
          category: 'cruise',
          date: c.sailingEnd.substring(0, 10),
          title: `⚓ Docking: ${ship}`,
          subTitle: `End of Sailing (${c.route || '-'})`,
          staff: c.staff || '',
          status: c.status || 'Upcoming',
          link: '/cruise',
          trackingCode: c.bookingRef || c.id,
          raw: c,
          details: {
            'Category': 'Cruise Arrival',
            'Ship Name': c.shipName || '-',
            'Cruise Brand': c.cruiseBrand || '-',
            'Booking Ref': c.bookingRef || '-',
            'Route': c.route || '-',
            'Sailing Start': c.sailingStart || '-',
            'Sailing End': c.sailingEnd,
            'Staff': c.staff || 'Unassigned'
          }
        });
      }
    });

    // 3. Hotels
    (hotels || []).forEach(h => {
      if (h.checkIn) {
        events.push({
          id: `hotel-in-${h.id}`,
          originalId: h.id,
          category: 'hotel',
          date: h.checkIn.substring(0, 10),
          title: `🏨 Check-in: ${h.hotelName}`,
          subTitle: `Region: ${h.region || '-'} • Room: ${h.roomType || '-'}`,
          staff: h.staff || '',
          status: h.status,
          link: '/hotel',
          trackingCode: h.confirmationNumber || h.id,
          raw: h,
          details: {
            'Category': 'Hotel Check-In',
            'Hotel Name': h.hotelName,
            'Region / Country': h.region || '-',
            'Check In': h.checkIn,
            'Check Out': h.checkOut || '-',
            'Room Type': h.roomType || '-',
            'Confirmation #': h.confirmationNumber || '-',
            'Supplier': h.supplierName || '-',
            'Staff': h.staff || 'Unassigned'
          }
        });
      }
      if (h.checkOut) {
        events.push({
          id: `hotel-out-${h.id}`,
          originalId: h.id,
          category: 'hotel',
          date: h.checkOut.substring(0, 10),
          title: `🏨 Check-out: ${h.hotelName}`,
          subTitle: `Departure from hotel`,
          staff: h.staff || '',
          status: h.status,
          link: '/hotel',
          trackingCode: h.confirmationNumber || h.id,
          raw: h,
          details: {
            'Category': 'Hotel Check-Out',
            'Hotel Name': h.hotelName,
            'Region / Country': h.region || '-',
            'Check In': h.checkIn || '-',
            'Check Out': h.checkOut,
            'Room Type': h.roomType || '-',
            'Staff': h.staff || 'Unassigned'
          }
        });
      }
    });

    // 4. Documents
    (documents || []).forEach(d => {
      if (d.estimatedDone) {
        events.push({
          id: `doc-est-${d.id}`,
          originalId: d.id,
          category: 'document',
          date: d.estimatedDone.substring(0, 10),
          title: `📄 Est. Done: ${d.docType || 'Visa'} - ${d.guestName}`,
          subTitle: `${d.country || ''} • Status: ${d.shippingStatus || 'Processing'}`,
          staff: d.staff || '',
          status: d.shippingStatus || 'Processing',
          link: '/documents',
          trackingCode: d.bookingCode || d.invoiceNumber || d.shippingResi || d.id,
          raw: d,
          details: {
            'Category': 'Document Deadline',
            'Doc Type': d.docType || 'Visa',
            'Guest Name': d.guestName,
            'Destination Country': d.country || '-',
            'Process Type': d.processType || 'Normal',
            'Received Date': d.receiveDate || '-',
            'Estimated Done': d.estimatedDone,
            'Booking / Invoice': d.bookingCode || d.invoiceNumber || '-',
            'Courier / Resi': d.shippingResi ? `${d.shippingCourier || 'Courier'} - ${d.shippingResi}` : 'Not dispatched yet',
            'Staff': d.staff || 'Unassigned'
          }
        });
      }
      if (d.sendDate) {
        events.push({
          id: `doc-send-${d.id}`,
          originalId: d.id,
          category: 'document',
          date: d.sendDate.substring(0, 10),
          title: `📦 Sent: ${d.docType || 'Doc'} to ${d.guestName}`,
          subTitle: `Resi: ${d.shippingResi || 'Hand delivery'}`,
          staff: d.staff || '',
          status: 'Dispatched',
          link: '/documents',
          trackingCode: d.bookingCode || d.invoiceNumber || d.shippingResi || d.id,
          raw: d,
          details: {
            'Category': 'Document Dispatched',
            'Doc Type': d.docType || 'Visa',
            'Guest Name': d.guestName,
            'Send Date': d.sendDate,
            'Courier Method': d.shippingMethod || '-',
            'Courier Name': d.shippingCourier || '-',
            'Resi / Tracking': d.shippingResi || '-',
            'Staff': d.staff || 'Unassigned'
          }
        });
      }
    });

    // 5. Overtime
    (overtimes || []).forEach(o => {
      if (o.date) {
        events.push({
          id: `ot-${o.id}`,
          originalId: o.id,
          category: 'overtime',
          date: o.date.substring(0, 10),
          title: `⏰ OT: ${o.staff} (${o.hours || 0}h)`,
          subTitle: o.eventName || 'Operational support',
          staff: o.staff || '',
          status: o.status || 'Pending',
          link: '/overtime',
          trackingCode: o.id,
          raw: o,
          details: {
            'Category': 'Staff Overtime',
            'Staff Name': o.staff,
            'Overtime Date': o.date,
            'Duration': `${o.hours || 0} Hours`,
            'Event / Task': o.eventName || '-',
            'Status': o.status || 'Pending',
            'Remarks': o.remarks || '-'
          }
        });
      }
    });

    return events;
  }, [tours, cruises, hotels, documents, overtimes]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }
      // Staff filter
      if (selectedStaff !== 'all' && e.staff !== selectedStaff) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(query);
        const matchesSub = e.subTitle?.toLowerCase().includes(query);
        const matchesStaff = e.staff?.toLowerCase().includes(query);
        const matchesCode = e.trackingCode?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub && !matchesStaff && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [allEvents, selectedCategory, selectedStaff, searchQuery]);

  // Date Calculations for Month Grid
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true
      });
    }

    // Next month padding to fill complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map events per date
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach(evt => {
      if (!map[evt.date]) {
        map[evt.date] = [];
      }
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (viewMode === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 7);
      setCurrentDate(newD);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (viewMode === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 7);
      setCurrentDate(newD);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Export to iCalendar (.ics)
  const handleExportICS = () => {
    if (filteredEvents.length === 0) {
      alert('No events to export in the current view.');
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TravelOps Operations Suite//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    filteredEvents.forEach(evt => {
      const cleanDate = evt.date.replace(/-/g, '');
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${evt.id}@travelops.app`);
      icsContent.push(`DTSTAMP:${cleanDate}T000000Z`);
      icsContent.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      icsContent.push(`SUMMARY:${evt.title.replace(/[^\x20-\x7E]/g, '')}`);
      icsContent.push(`DESCRIPTION:${(evt.subTitle || '').replace(/[^\x20-\x7E]/g, '')}`);
      icsContent.push(`CATEGORIES:${evt.category.toUpperCase()}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelOps_Schedule_${currentYear}_${currentMonth + 1}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if a date string is Today
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute counts for category badges
  const categoryCounts = useMemo(() => {
    const counts = { all: allEvents.length, tour: 0, cruise: 0, hotel: 0, document: 0, overtime: 0 };
    allEvents.forEach(e => {
      if (counts[e.category] !== undefined) counts[e.category]++;
    });
    return counts;
  }, [allEvents]);

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile} />
      
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container" style={{ maxWidth: '1600px' }}>
            
            {/* Header Title & Actions */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      Master Operations Calendar
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Unified multi-domain schedule: Tours, Cruises, Hotels, Visas, and Staff Overtime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleExportICS}
                  title="Export to iCal (.ics) for Google / Apple / Outlook Calendar"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.5rem 0.85rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Download size={15} color="var(--primary)" />
                  <span>Sync iCal (.ics)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  title="Print Calendar View"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.5rem 0.85rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Printer size={15} />
                  <span>Print View</span>
                </button>

                {/* View Switcher Pills */}
                <div style={{
                  display: 'flex', background: 'rgba(255, 255, 255, 0.04)',
                  padding: '3px', borderRadius: '8px', border: '1px solid var(--border)'
                }}>
                  {['month', 'week', 'agenda'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: viewMode === mode ? 'var(--primary)' : 'transparent',
                        color: viewMode === mode ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter & Controls Toolbar Card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {/* Month Navigator Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    onClick={handlePrev}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '0.45rem', color: 'var(--text-main)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Previous"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={handleToday}
                    style={{
                      background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '8px', padding: '0.45rem 0.85rem', color: 'var(--primary)',
                      fontSize: '0.8125rem', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    Today
                  </button>

                  <button
                    onClick={handleNext}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '0.45rem', color: 'var(--text-main)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Next"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', minWidth: '180px' }}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                </div>

                {/* Filter Inputs & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Search Box */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search title, pax, code..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                        borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border)', color: 'var(--text-main)',
                        fontSize: '0.8125rem', outline: 'none'
                      }}
                    />
                    {searchQuery && (
                      <X
                        size={14}
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
                      />
                    )}
                  </div>

                  {/* Staff Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={15} color="var(--text-muted)" />
                    <select
                      value={selectedStaff}
                      onChange={e => setSelectedStaff(e.target.value)}
                      style={{
                        padding: '0.45rem 0.75rem', borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border)',
                        color: 'var(--text-main)', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Staff (PIC)</option>
                      {staffList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Filter Pills with counts */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                  Filter Domain:
                </span>

                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.65rem', borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedCategory === 'all' ? 'var(--primary)' : 'var(--border)',
                    background: selectedCategory === 'all' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  <Layers size={13} />
                  <span>All Activities</span>
                  <span style={{
                    padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)'
                  }}>
                    {categoryCounts.all}
                  </span>
                </button>

                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.3rem 0.65rem', borderRadius: '20px',
                        border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                        background: isActive ? cfg.bg : 'transparent',
                        color: isActive ? cfg.color : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      <Icon size={13} color={cfg.color} />
                      <span>{cfg.label}</span>
                      <span style={{
                        padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)'
                      }}>
                        {categoryCounts[key] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN CALENDAR DISPLAY */}
            {viewMode === 'month' && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}>
                {/* Weekday Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <div
                      key={day}
                      style={{
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: idx === 0 || idx === 6 ? '#f87171' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Month Grid Cells */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '1px',
                  background: 'var(--border)'
                }}>
                  {calendarDays.map((cell, idx) => {
                    const dayEvents = eventsByDate[cell.dateStr] || [];
                    const isToday = cell.dateStr === todayStr;
                    const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                    return (
                      <div
                        key={cell.dateStr + idx}
                        style={{
                          background: isToday 
                            ? 'rgba(6, 182, 212, 0.04)' 
                            : cell.isCurrentMonth 
                              ? 'var(--bg-card)' 
                              : 'rgba(0, 0, 0, 0.2)',
                          minHeight: '130px',
                          padding: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          opacity: cell.isCurrentMonth ? 1 : 0.45,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Day Number Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.4rem'
                        }}>
                          <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: isToday ? '800' : '600',
                            width: '24px', height: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%',
                            background: isToday ? 'var(--primary)' : 'transparent',
                            color: isToday ? '#ffffff' : (isWeekend ? '#f87171' : 'var(--text-main)')
                          }}>
                            {cell.dayNumber}
                          </span>

                          {dayEvents.length > 0 && (
                            <span 
                              onClick={() => setSelectedDayEvents({ date: cell.dateStr, events: dayEvents })}
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                              title="Click to view all events this day"
                            >
                              {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Events list in cell */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflow: 'hidden' }}>
                          {dayEvents.slice(0, 3).map(evt => {
                            const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                            return (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: cfg.bg,
                                  borderLeft: `3px solid ${cfg.color}`,
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  color: 'var(--text-main)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  cursor: 'pointer',
                                  transition: 'transform 0.1s, background 0.1s'
                                }}
                                onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                                onMouseOut={e => e.currentTarget.style.filter = 'none'}
                                title={`${evt.title}\n${evt.subTitle || ''}`}
                              >
                                {evt.title}
                              </div>
                            );
                          })}

                          {dayEvents.length > 3 && (
                            <button
                              onClick={() => setSelectedDayEvents({ date: cell.dateStr, events: dayEvents })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '0.675rem',
                                fontWeight: '700',
                                textAlign: 'left',
                                padding: '2px 4px',
                                cursor: 'pointer'
                              }}
                            >
                              +{dayEvents.length - 3} more...
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AGENDA / LIST VIEW */}
            {viewMode === 'agenda' && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Chronological Agenda Feed ({filteredEvents.length} events)
                </h3>

                {filteredEvents.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No operations events match the current filter or month.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {Object.keys(eventsByDate).sort().map(dateKey => {
                      const events = eventsByDate[dateKey];
                      const dateObj = new Date(dateKey + 'T00:00:00');
                      const isPast = dateKey < todayStr;
                      const isToday = dateKey === todayStr;

                      return (
                        <div 
                          key={dateKey}
                          style={{
                            borderRadius: '8px',
                            border: `1px solid ${isToday ? 'rgba(6, 182, 212, 0.4)' : 'var(--border)'}`,
                            background: isToday ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Date Header */}
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: isToday ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span style={{
                                fontWeight: '800', fontSize: '0.9rem',
                                color: isToday ? 'var(--primary)' : 'var(--text-main)'
                              }}>
                                {dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {isToday && (
                                <span style={{
                                  background: 'var(--primary)', color: '#fff',
                                  fontSize: '0.65rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px'
                                }}>
                                  TODAY
                                </span>
                              )}
                              {isPast && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                  (Past Date)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {events.length} activity
                            </span>
                          </div>

                          {/* Events rows */}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {events.map(evt => {
                              const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                              const Icon = cfg.icon;

                              return (
                                <div
                                  key={evt.id}
                                  onClick={() => setSelectedEvent(evt)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{
                                      width: '32px', height: '32px', borderRadius: '8px',
                                      background: cfg.bg, color: cfg.color,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      border: `1px solid ${cfg.color}40`
                                    }}>
                                      <Icon size={16} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                        {evt.title}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {evt.subTitle}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {evt.staff && (
                                      <span style={{
                                        fontSize: '0.725rem', color: 'var(--text-muted)',
                                        background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px'
                                      }}>
                                        PIC: {evt.staff}
                                      </span>
                                    )}
                                    <span style={{
                                      fontSize: '0.725rem', fontWeight: '700',
                                      color: cfg.color, border: `1px solid ${cfg.color}50`,
                                      background: cfg.bg, padding: '2px 8px', borderRadius: '4px'
                                    }}>
                                      {cfg.label}
                                    </span>
                                    <Eye size={16} color="var(--text-muted)" />
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

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '1.25rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.75rem'
                }}>
                  {(() => {
                    // Compute 7 days of current week
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    
                    return Array.from({ length: 7 }).map((_, i) => {
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + i);
                      const dStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                      const isToday = dStr === todayStr;
                      const dayEvents = eventsByDate[dStr] || [];

                      return (
                        <div
                          key={dStr}
                          style={{
                            background: isToday ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isToday ? 'rgba(6, 182, 212, 0.4)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            minHeight: '380px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{
                            padding: '0.65rem',
                            textAlign: 'center',
                            background: isToday ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            borderBottom: '1px solid var(--border)'
                          }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              {DAYS_OF_WEEK[dayDate.getDay()]}
                            </div>
                            <div style={{
                              fontSize: '1.1rem', fontWeight: '800',
                              color: isToday ? 'var(--primary)' : 'var(--text-main)'
                            }}>
                              {dayDate.getDate()}
                            </div>
                          </div>

                          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                            {dayEvents.map(evt => {
                              const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                              return (
                                <div
                                  key={evt.id}
                                  onClick={() => setSelectedEvent(evt)}
                                  style={{
                                    padding: '0.45rem 0.55rem',
                                    borderRadius: '6px',
                                    background: cfg.bg,
                                    borderLeft: `3px solid ${cfg.color}`,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                                  onMouseOut={e => e.currentTarget.style.filter = 'none'}
                                >
                                  <div style={{ fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>
                                    {evt.title}
                                  </div>
                                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {evt.subTitle}
                                  </div>
                                </div>
                              );
                            })}
                            {dayEvents.length === 0 && (
                              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                                No tasks
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* EVENT DETAIL INSPECTOR MODAL */}
      {selectedEvent && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', width: '100%', maxWidth: '560px',
              overflow: 'hidden', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: '700',
                  background: CATEGORY_CONFIG[selectedEvent.category]?.bg,
                  color: CATEGORY_CONFIG[selectedEvent.category]?.color,
                  border: `1px solid ${CATEGORY_CONFIG[selectedEvent.category]?.color}40`
                }}>
                  {CATEGORY_CONFIG[selectedEvent.category]?.label}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Event Information
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {selectedEvent.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Scheduled Date: <strong>{selectedEvent.date}</strong>
                </div>
              </div>

              {/* Attributes Table */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                marginBottom: '1.25rem'
              }}>
                {Object.entries(selectedEvent.details || {}).map(([k, v], idx) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.8125rem',
                      borderBottom: idx < Object.keys(selectedEvent.details).length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{k}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', textAlign: 'right' }}>{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Public Tracking Link preview if available */}
              {selectedEvent.trackingCode && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)' }}>
                      CLIENT TRACKING CODE
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {selectedEvent.trackingCode}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/track/${selectedEvent.trackingCode}`);
                      alert(`Tracking link copied to clipboard!\n${window.location.origin}/track/${selectedEvent.trackingCode}`);
                    }}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '6px',
                      background: 'var(--primary)', color: '#fff', border: 'none',
                      fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              )}

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    padding: '0.55rem 1rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                {selectedEvent.link && (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      navigate(selectedEvent.link);
                    }}
                    style={{
                      padding: '0.55rem 1.15rem', borderRadius: '8px',
                      background: 'var(--primary)', border: 'none',
                      color: '#ffffff', fontSize: '0.8125rem', fontWeight: '700',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem'
                    }}
                  >
                    <span>Open Module Details</span>
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAY EVENTS OVERVIEW MODAL (When clicking on a day with many events) */}
      {selectedDayEvents && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
          }}
          onClick={() => setSelectedDayEvents(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', width: '100%', maxWidth: '580px',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Events on {new Date(selectedDayEvents.date + 'T00:00:00').toLocaleDateString('en-US', { dateStyle: 'full' })}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedDayEvents.events.length} activities scheduled
                </span>
              </div>
              <button 
                onClick={() => setSelectedDayEvents(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {selectedDayEvents.events.map(evt => {
                const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.tour;
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedDayEvents(null);
                      setSelectedEvent(evt);
                    }}
                    style={{
                      padding: '0.75rem', borderRadius: '8px',
                      background: cfg.bg, border: `1px solid ${cfg.color}40`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {evt.title}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700', color: cfg.color,
                        background: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '4px'
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {evt.subTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperationsCalendar;
