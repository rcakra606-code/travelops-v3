import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { 
  DollarSign, Users, Map, TrendingUp, Ship, FileText, Phone, Building, 
  AlertCircle, Clock, CheckCircle2, Settings2, GripVertical, Eye, EyeOff, 
  X, ArrowUp, ArrowDown, Sparkles, Compass, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useHotels } from '../context/HotelContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_WIDGETS = [
  { id: 'welcome', name: 'Executive Overview Banner', visible: true, size: '12' },
  { id: 'stats', name: 'Core Operations KPI Cards', visible: true, size: '12' },
  { id: 'chart', name: 'Expected Omset Projection Chart', visible: true, size: '12' },
  { id: 'upcoming', name: 'Upcoming Activities Table', visible: true, size: '8' },
  { id: 'alerts', name: 'Action Required & Urgencies', visible: true, size: '4' }
];

// Mini SVG Sparkline Component for KPI Cards
const MiniSparkline = ({ color = '#06b6d4', isUp = true }) => {
  const points = isUp 
    ? "0,22 15,18 30,19 45,12 60,15 75,8 90,4"
    : "0,6 15,10 30,8 45,16 60,14 75,20 90,24";
  
  return (
    <svg width="70" height="28" viewBox="0 0 90 28" fill="none" style={{ overflow: 'visible', opacity: 0.85 }}>
      <path 
        d={`M${points}`} 
        fill="none" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Customization State
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('travelops_dashboard_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('travelops_welcome_shown');
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
      sessionStorage.setItem('travelops_welcome_shown', 'true');
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const saveWidgets = (newWidgets) => {
    setWidgets([...newWidgets]);
    localStorage.setItem('travelops_dashboard_widgets', JSON.stringify(newWidgets));
  };

  const moveWidget = (index, direction) => {
    const newWidgets = [...widgets];
    if (direction === 'up' && index > 0) {
      const temp = newWidgets[index];
      newWidgets[index] = newWidgets[index - 1];
      newWidgets[index - 1] = temp;
    } else if (direction === 'down' && index < newWidgets.length - 1) {
      const temp = newWidgets[index];
      newWidgets[index] = newWidgets[index + 1];
      newWidgets[index + 1] = temp;
    }
    saveWidgets(newWidgets);
  };

  const toggleWidgetVisibility = (index) => {
    const newWidgets = [...widgets];
    newWidgets[index].visible = !newWidgets[index].visible;
    saveWidgets(newWidgets);
  };

  const { tours, getStats } = useTours();
  const { cruises } = useCruises();
  const { documents } = useDocuments();
  const { telecoms } = useTelecoms();
  const { hotels } = useHotels();

  const tourStats = getStats();
  
  const activeCruises = (cruises || []).filter(c => {
    if (!c.sailingStart) return false;
    const sDate = new Date(c.sailingStart);
    sDate.setHours(0,0,0,0);
    return sDate >= new Date(new Date().setHours(0,0,0,0));
  }).length;
  
  const activeHotels = (hotels || []).filter(h => h.status === 'Active' || h.status === 'Upcoming').length;
  const activeDocs = (documents || []).filter(d => !d.sendDate).length;
  const activeTelecoms = (telecoms || []).filter(t => !t.tanggalSelesai).length;

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dataMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[dateStr] = 0;
    }

    (tours || []).forEach(t => {
      if (t.departureDate && t.status !== 'Cancel' && t.status !== 'Cancelled') {
        const dep = new Date(t.departureDate);
        dep.setHours(0,0,0,0);
        
        const diffTime = dep - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 30) {
          const dateStr = dep.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dataMap[dateStr] !== undefined) {
            dataMap[dateStr] += (t.financials?.totalOmset || 0);
          }
        }
      }
    });

    const formattedData = Object.keys(dataMap).map(key => ({
      name: key,
      sales: dataMap[key]
    }));
    
    setChartData(formattedData);
  }, [tours]);

  const stats = [
    { 
      title: 'Total Tour Omset', 
      value: formatCurrency(tourStats.totalOmset), 
      icon: <DollarSign size={20} />, 
      isUp: true, 
      trendText: '+18.4% vs last month',
      color: '#10b981',
      glowColor: '#10b981'
    },
    { 
      title: 'Active Bookings', 
      value: (tourStats.activeBookings + activeCruises + activeHotels).toString(), 
      subtitle: `${tourStats.activeBookings} Tours · ${activeCruises} Cruises · ${activeHotels} Hotels`,
      icon: <Map size={20} />, 
      isUp: true, 
      trendText: 'Across all operations',
      color: '#06b6d4',
      glowColor: '#06b6d4'
    },
    { 
      title: 'Documents in Process', 
      value: activeDocs.toString(), 
      subtitle: 'Passports, Visas & Permits',
      icon: <FileText size={20} />, 
      isUp: false, 
      trendText: `${activeDocs} awaiting release`,
      color: '#f59e0b',
      glowColor: '#f59e0b'
    },
    { 
      title: 'Active Telecom & SIMs', 
      value: activeTelecoms.toString(), 
      subtitle: 'Overseas Roaming & eSIMs',
      icon: <Phone size={20} />, 
      isUp: true, 
      trendText: 'Live cellular connections',
      color: '#a855f7',
      glowColor: '#a855f7'
    },
  ];

  const today = new Date();
  today.setHours(0,0,0,0);

  const allActivities = [
    ...(tours || []).map(t => ({
      id: t.id,
      type: 'Tour',
      customer: t.paxInfo && t.paxInfo.length > 0 ? `${t.paxInfo[0].firstName} ${t.paxInfo[0].lastName}` : (t.bookingCode || 'Tour Booking'),
      destination: t.country || '-',
      date: t.departureDate || '-',
      targetDate: new Date(t.departureDate || 0),
      status: t.status || 'Pending',
    })),
    ...(cruises || []).map(c => ({
      id: c.id,
      type: 'Cruise',
      customer: c.picName || 'Cruise Guest',
      destination: c.route || '-',
      date: c.sailingStart || '-',
      targetDate: new Date(c.sailingStart || 0),
      status: c.sailingStart && new Date(c.sailingStart) >= today ? 'Upcoming' : 'Past',
    })),
    ...(documents || []).map(d => ({
      id: d.id,
      type: 'Document',
      customer: d.guestName || '-',
      destination: d.country || '-',
      date: d.estimatedDone || d.receiveDate || '-',
      targetDate: new Date(d.estimatedDone || d.receiveDate || 0),
      status: d.sendDate ? 'Completed' : 'Processing',
    })),
    ...(telecoms || []).map(t => ({
      id: t.id,
      type: 'Telecom',
      customer: t.nama || '-',
      destination: t.region || '-',
      date: t.tanggalMulai || '-',
      targetDate: new Date(t.tanggalMulai || 0),
      status: t.tanggalSelesai ? 'Completed' : 'Active',
    })),
    ...(hotels || []).map(h => ({
      id: h.id,
      type: 'Hotel',
      customer: h.guestList ? h.guestList.split(',')[0] : (h.hotelName || '-'),
      destination: `${h.hotelName || '-'} (${h.region || '-'})`,
      date: h.checkIn || '-',
      targetDate: new Date(h.checkIn || 0),
      status: h.status || 'Upcoming',
    }))
  ];

  let upcomingActivities = allActivities.filter(a => a.targetDate >= today && a.status !== 'Completed' && a.status !== 'Cancel' && a.status !== 'Cancelled');
  
  if (activityFilter !== 'All') {
    upcomingActivities = upcomingActivities.filter(a => a.type === activityFilter);
  }
  
  upcomingActivities.sort((a, b) => a.targetDate - b.targetDate);
  const recentActivities = upcomingActivities.slice(0, 8);

  const alerts = [];
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  (tours || []).forEach(t => {
    if (t.departureDate && t.status !== 'Cancel') {
      const depDate = new Date(t.departureDate);
      if (depDate >= today && depDate <= next7Days) {
        if (!t.financials?.invoiceNumber || t.financials.invoiceNumber.trim() === '') {
          alerts.push({
            id: t.id,
            title: `Tour ${t.bookingCode || t.id} departure imminent but uninvoiced`,
            type: 'warning',
            date: t.departureDate,
            actionPath: '/tours'
          });
        }
      }
    }
  });

  (documents || []).forEach(d => {
    if (!d.sendDate) {
      const estDone = new Date(d.estimatedDone || d.receiveDate || 0);
      estDone.setHours(0,0,0,0);
      if (estDone <= today) {
        alerts.push({
          id: d.id,
          title: `Document ${d.guestName || d.id} estimated delivery due!`,
          type: 'danger',
          date: d.estimatedDone || d.receiveDate,
          actionPath: '/documents'
        });
      }
    }
  });

  alerts.sort((a, b) => new Date(a.date) - new Date(b.date));

  const getStatusBadge = (status) => {
    if (['Confirmed', 'Confirm', 'Completed'].includes(status)) {
      return (
        <span className="badge badge-success">
          <span className="pulse-dot pulse-dot-green" />
          {status}
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
      return (
        <span className="badge badge-danger">
          {status}
        </span>
      );
    }
    return (
      <span className="badge badge-primary">
        <span className="pulse-dot pulse-dot-cyan" />
        {status}
      </span>
    );
  };

  // Render logic for specific widgets
  const renderWidget = (widget) => {
    if (!widget.visible) return null;

    if (widget.id === 'welcome') {
      return (
        <div key="welcome" className="card bento-col-12" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(13, 19, 34, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '2rem 2.25rem',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', marginBottom: '0.75rem' }}>
              <Sparkles size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Operational Intelligence
              </span>
            </div>
            <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              Welcome back, <span className="gradient-text">{user?.name || user?.email?.split('@')[0] || 'Operator'}</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Real-time monitoring for your active tours, hotel blocks, cruises, and documents.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => setIsCustomizing(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.95rem' }}
            >
              <Settings2 size={15} /> Customize
            </button>
          </div>
        </div>
      );
    }

    if (widget.id === 'stats') {
      return (
        <React.Fragment key="stats">
          {stats.map((stat, idx) => (
            <div 
              key={`stat-${idx}`} 
              className="stat-card bento-col-3" 
              style={{ '--stat-glow-color': stat.glowColor }}
            >
              <div className="stat-header">
                <div>
                  <div className="stat-title">{stat.title}</div>
                  <div className="stat-value font-mono" style={{ fontSize: stat.value.length > 14 ? '1.25rem' : '1.5rem' }}>
                    {stat.value}
                  </div>
                </div>
                <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}15`, borderColor: `${stat.color}30` }}>
                  {stat.icon}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <div className={`stat-trend ${stat.isUp ? 'trend-up' : 'trend-down'}`}>
                  {stat.isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  <span>{stat.trendText}</span>
                </div>
                <MiniSparkline color={stat.color} isUp={stat.isUp} />
              </div>
            </div>
          ))}
        </React.Fragment>
      );
    }

    if (widget.id === 'chart') {
      return (
        <div key="chart" className="card bento-col-12" style={{ height: '370px', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                Expected Omset Projection
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Aggregated revenue pipeline based on confirmed departures over the next 30 days
              </p>
            </div>
            <span className="badge badge-primary font-mono">30-Day Outlook</span>
          </div>

          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSalesLinear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-subtle)" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 11 }}
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
                  backgroundColor: 'rgba(10, 15, 28, 0.92)', 
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '10px', 
                  boxShadow: '0 15px 30px rgba(0,0,0,0.7)',
                  color: '#f8fafc',
                  fontSize: '0.8125rem'
                }}
                itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                formatter={(value) => [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, 'Projected Omset']}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#06b6d4" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorSalesLinear)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (widget.id === 'upcoming') {
      return (
        <div key="upcoming" className={`card bento-col-${widget.size}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
                Upcoming Departures & Schedules
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Chronological list of next operations across all departments
              </p>
            </div>
            
            {/* Segmented Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {['All', 'Tour', 'Cruise', 'Hotel', 'Document', 'Telecom'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  style={{
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    border: 'none',
                    background: activityFilter === filter ? 'var(--primary)' : 'transparent',
                    color: activityFilter === filter ? '#04101e' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Customer / Account</th>
                  <th>Destination / Route</th>
                  <th>Target Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr key={`${activity.type}-${activity.id}`}>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          color: activity.type === 'Tour' ? '#38bdf8' : activity.type === 'Cruise' ? '#818cf8' : activity.type === 'Hotel' ? '#34d399' : '#fbbf24',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}>
                          {activity.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{activity.customer}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{activity.destination}</td>
                      <td className="font-mono" style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.8125rem' }}>
                        {activity.date}
                      </td>
                      <td>
                        {getStatusBadge(activity.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No upcoming activities found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (widget.id === 'alerts') {
      return (
        <div key="alerts" className={`card bento-col-${widget.size}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f87171' }}>
              <AlertCircle size={18} /> Action Required
            </h3>
            {alerts.length > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.675rem' }}>
                {alerts.length} Pending
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '380px', paddingRight: '0.25rem' }}>
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    background: alert.type === 'danger' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid',
                    borderColor: alert.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    borderLeft: `4px solid ${alert.type === 'danger' ? '#ef4444' : '#f59e0b'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem', lineHeight: '1.4' }}>
                    {alert.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      <span className="font-mono">{alert.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={24} />
                </div>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem' }}>All Caught Up!</p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>No immediate risks or uninvoiced departures.</p>
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
            <div className="bento-grid" style={{ marginTop: '0.5rem' }}>
              {isLoading ? (
                <>
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="stat" />
                  <SkeletonLoader type="chart" />
                </>
              ) : (
                widgets.map(widget => renderWidget(widget))
              )}
            </div> 
          </div>
        </div>
      </div>
      
      {/* WELCOME TOAST */}
      <div style={{
        position: 'fixed', 
        bottom: showWelcome ? '24px' : '-120px', 
        right: '24px',
        background: 'rgba(13, 19, 34, 0.95)', 
        color: 'white', 
        padding: '0.85rem 1.25rem', 
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.2)', 
        display: 'flex', 
        alignItems: 'center',
        gap: '0.75rem', 
        transition: 'bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)', 
        zIndex: 9999,
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.4rem', borderRadius: '8px' }}>
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700' }}>Session Initialized</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected to TravelOps Secure Workspace</p>
        </div>
      </div>

      {/* Customizer Modal */}
      {isCustomizing && createPortal(
        <div className="modal-overlay" onClick={() => setIsCustomizing(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Settings2 size={18} color="var(--primary)" /> Customize Dashboard Layout
              </h2>
              <button onClick={() => setIsCustomizing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Reorder dashboard modules with the arrows or toggle visibility on and off. Changes persist across sessions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {widgets.map((w, i) => (
                <div key={w.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  opacity: w.visible ? 1 : 0.45 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <button onClick={() => moveWidget(i, 'up')} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? 'transparent' : 'var(--text-muted)', padding: 0 }}><ArrowUp size={14}/></button>
                      <button onClick={() => moveWidget(i, 'down')} disabled={i === widgets.length - 1} style={{ background: 'none', border: 'none', cursor: i === widgets.length - 1 ? 'not-allowed' : 'pointer', color: i === widgets.length - 1 ? 'transparent' : 'var(--text-muted)', padding: 0 }}><ArrowDown size={14}/></button>
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>{w.name}</span>
                  </div>
                  <button 
                    onClick={() => toggleWidgetVisibility(i)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: w.visible ? 'var(--primary)' : 'var(--text-muted)' }}
                    title={w.visible ? "Hide widget" : "Show widget"}
                  >
                    {w.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsCustomizing(false)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Save Layout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Dashboard;
