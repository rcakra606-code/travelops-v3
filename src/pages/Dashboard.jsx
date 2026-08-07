import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { DollarSign, Users, Map, TrendingUp, Ship, FileText, Phone, Building, AlertCircle, Clock, CheckCircle2, Settings2, GripVertical, Eye, EyeOff, X, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useHotels } from '../context/HotelContext';
import { useAuth } from '../context/AuthContext';
import { useCashouts } from '../context/CashoutContext';

const DEFAULT_WIDGETS = [
  { id: 'welcome', name: 'Welcome Banner', visible: true, size: '12' },
  { id: 'stats', name: 'Key Statistics Cards', visible: true, size: '12' },
  { id: 'chart', name: 'Expected Omset Chart', visible: true, size: '12' },
  { id: 'upcoming', name: 'Upcoming Activities Table', visible: true, size: '8' },
  { id: 'alerts', name: 'Action Required Alerts', visible: true, size: '4' }
];

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
    setTimeout(() => setIsLoading(false), 1000);
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('travelops_welcome_shown');
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
      sessionStorage.setItem('travelops_welcome_shown', 'true');
      setTimeout(() => setShowWelcome(false), 4000);
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
  const { cashoutRequests } = useCashouts();

  const tourStats = getStats();
  
  const activeCruises = cruises.filter(c => {
    if (!c.sailingStart) return false;
    const sDate = new Date(c.sailingStart);
    sDate.setHours(0,0,0,0);
    return sDate >= new Date(new Date().setHours(0,0,0,0));
  }).length;
  
  const activeHotels = hotels.filter(h => h.status === 'Active' || h.status === 'Upcoming').length;

  const activeDocs = documents.filter(d => !d.sendDate).length;
  const activeTelecoms = telecoms.filter(t => !t.tanggalSelesai).length;

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

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

    tours.forEach(t => {
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
    { title: 'Total Tour Omset', value: formatCurrency(tourStats.totalOmset), icon: <DollarSign size={24} />, isUp: true, color: '#10b981' },
    { title: 'Active Bookings (Tour/Cruise/Hotel)', value: (tourStats.activeBookings + activeCruises + activeHotels).toString(), icon: <Map size={24} />, isUp: true, color: '#06b6d4' },
    { title: 'Docs in Process', value: activeDocs.toString(), icon: <FileText size={24} />, isUp: true, color: '#f59e0b' },
    { title: 'Active Telecoms', value: activeTelecoms.toString(), icon: <Phone size={24} />, isUp: true, color: '#8b5cf6' },
  ];

  const today = new Date();
  today.setHours(0,0,0,0);

  const allActivities = [
    ...tours.map(t => ({
      id: t.id,
      type: 'Tour',
      customer: t.paxInfo && t.paxInfo.length > 0 ? `${t.paxInfo[0].firstName} ${t.paxInfo[0].lastName}` : 'Unknown',
      destination: t.country || '-',
      date: t.departureDate || '-',
      targetDate: new Date(t.departureDate || 0),
      status: t.status || 'Pending',
    })),
    ...cruises.map(c => ({
      id: c.id,
      type: 'Cruise',
      customer: c.picName || '-',
      destination: c.route || '-',
      date: c.sailingStart || '-',
      targetDate: new Date(c.sailingStart || 0),
      status: c.sailingStart && new Date(c.sailingStart) >= today ? 'Upcoming' : 'Past',
    })),
    ...documents.map(d => ({
      id: d.id,
      type: 'Document',
      customer: d.guestName || '-',
      destination: d.country || '-',
      date: d.estimatedDone || d.receiveDate || '-',
      targetDate: new Date(d.estimatedDone || d.receiveDate || 0),
      status: d.sendDate ? 'Completed' : 'Processing',
    })),
    ...telecoms.map(t => ({
      id: t.id,
      type: 'Telecom',
      customer: t.nama || '-',
      destination: t.region || '-',
      date: t.tanggalMulai || '-',
      targetDate: new Date(t.tanggalMulai || 0),
      status: t.tanggalSelesai ? 'Completed' : 'Active',
    })),
    ...hotels.map(h => ({
      id: h.id,
      type: 'Hotel',
      customer: h.guestList ? h.guestList.split(',')[0] : '-',
      destination: `${h.hotelName} (${h.region})`,
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

  tours.forEach(t => {
    if (t.departureDate && t.status !== 'Cancel') {
      const depDate = new Date(t.departureDate);
      if (depDate >= today && depDate <= next7Days) {
        if (!t.financials?.invoiceNumber || t.financials.invoiceNumber.trim() === '') {
          alerts.push({
            id: t.id,
            title: `Tour ${t.id} departure soon but not invoiced!`,
            type: 'warning',
            date: t.departureDate
          });
        }
      }
    }
  });

  if (cashoutRequests) {
    cashoutRequests.forEach(c => {
      if (c.status === 'Pending') {
        alerts.push({
          id: c.id,
          title: `Pending Cashout: Rp ${formatCurrency(c.totalAmount || 0)}`,
          type: 'danger',
          date: c.requestDate
        });
      }
    });
  }

  documents.forEach(d => {
    if (!d.sendDate) {
      const estDone = new Date(d.estimatedDone || d.receiveDate || 0);
      estDone.setHours(0,0,0,0);
      if (estDone <= today) {
        alerts.push({
          id: d.id,
          title: `Document ${d.id} (${d.guestName}) is due!`,
          type: 'danger',
          date: d.estimatedDone || d.receiveDate
        });
      }
    }
  });

  alerts.sort((a, b) => new Date(a.date) - new Date(b.date));

  const getStatusBadge = (status) => {
    if (['Confirmed', 'Confirm', 'Completed'].includes(status)) return 'badge-success';
    if (['Pending', 'Processing', 'Upcoming', 'Active'].includes(status)) return 'badge-warning';
    if (['Cancelled', 'Cancel', 'Past', 'Past Date'].includes(status)) return 'badge-danger';
    return 'badge-primary';
  };

  // Render logic for specific widgets
  const renderWidget = (widget) => {
    if (!widget.visible) return null;

    if (widget.id === 'welcome') {
      return (
        <div key="welcome" className="card bento-col-12" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '2.5rem', color: 'white',
          boxShadow: '0 10px 30px -5px rgba(6, 182, 212, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h1 className="gradient-text" style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '800' }}>
            Welcome back, {user?.name || 'TravelOps User'}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            Here's what's happening in your operations today.
          </p>
        </div>
      );
    }

    if (widget.id === 'stats') {
      return (
        <React.Fragment key="stats">
          {stats.map((stat, idx) => (
            <div key={`stat-${idx}`} className="card stat-card bento-col-3" style={{ borderBottom: `4px solid ${stat.color}` }}>
              <div className="stat-header">
                <div>
                  <div className="stat-title">{stat.title}</div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}20`, boxShadow: `0 0 15px ${stat.color}40` }}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </React.Fragment>
      );
    }

    if (widget.id === 'chart') {
      return (
        <div key="chart" className="card bento-col-12" style={{ height: '350px', paddingBottom: '3rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '600', color: 'var(--text-main)' }}>Expected Omset (Next 30 Days Departures)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                formatter={(value) => [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (widget.id === 'upcoming') {
      return (
        <div key="upcoming" className={`card bento-col-${widget.size}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: '600' }}>Upcoming Departure</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Tour', 'Cruise', 'Hotel', 'Document', 'Telecom'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  style={{
                    padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                    border: activityFilter === filter ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: activityFilter === filter ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: activityFilter === filter ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Nearest Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{activity.type}</td>
                      <td>{activity.customer}</td>
                      <td style={{ color: '#fbbf24', fontWeight: '500' }}>{activity.date}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(activity.status)}`}>{activity.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No upcoming activities found.
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
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            <AlertCircle size={20} style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }} /> Action Required
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.5rem' }}>
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} style={{ 
                  padding: '1rem', borderRadius: '8px', 
                  background: alert.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  borderLeft: `4px solid ${alert.type === 'danger' ? '#ef4444' : '#f59e0b'}`
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.25rem' }}>{alert.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {alert.date}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '1rem' }}><CheckCircle2 size={40} color="#10b981" style={{ opacity: 0.5 }} /></div>
                All clear! No pending actions required.
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
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setIsCustomizing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                  color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <Settings2 size={16} /> Customize Dashboard
              </button>
            </div>

            <div className="bento-grid">
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
        position: 'fixed', bottom: showWelcome ? '20px' : '-100px', right: '20px',
        background: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center',
        gap: '0.75rem', transition: 'bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 9999
      }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%' }}>👋</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>Login Successful</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Welcome to TravelOps Workspace!</p>
        </div>
      </div>

      {/* Customizer Modal */}
      {isCustomizing && createPortal(
        <div className="modal-overlay" onClick={() => setIsCustomizing(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings2 size={20} /> Customize Dashboard
              </h2>
              <button onClick={() => setIsCustomizing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Rearrange widgets using the arrows, or toggle their visibility using the eye icon.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {widgets.map((w, i) => (
                <div key={w.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '1rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', 
                  borderRadius: '8px', opacity: w.visible ? 1 : 0.5 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <button onClick={() => moveWidget(i, 'up')} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? 'transparent' : 'var(--text-muted)' }}><ArrowUp size={16}/></button>
                      <button onClick={() => moveWidget(i, 'down')} disabled={i === widgets.length - 1} style={{ background: 'none', border: 'none', cursor: i === widgets.length - 1 ? 'not-allowed' : 'pointer', color: i === widgets.length - 1 ? 'transparent' : 'var(--text-muted)' }}><ArrowDown size={16}/></button>
                    </div>
                    <span style={{ fontWeight: '500' }}>{w.name}</span>
                  </div>
                  <button onClick={() => toggleWidgetVisibility(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: w.visible ? 'var(--success)' : 'var(--text-muted)' }}>
                    {w.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsCustomizing(false)} className="btn btn-primary">Done</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Dashboard;
