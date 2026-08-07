import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { DollarSign, Users, Map, TrendingUp, Ship, FileText, Phone, Building, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useHotels } from '../context/HotelContext';
import { useAuth } from '../context/AuthContext';
import { useCashouts } from '../context/CashoutContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');

  useEffect(() => {
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
      amount: t.financials?.totalOmset || 0,
      timestamp: parseInt(t.id.split('-')[1]) || 0
    })),
    ...cruises.map(c => ({
      id: c.id,
      type: 'Cruise',
      customer: c.picName || '-',
      destination: c.route || '-',
      date: c.sailingStart || '-',
      targetDate: new Date(c.sailingStart || 0),
      status: c.sailingStart && new Date(c.sailingStart) >= today ? 'Upcoming' : 'Past',
      amount: '-',
      timestamp: parseInt(c.id.split('-')[1]) || 0
    })),
    ...documents.map(d => ({
      id: d.id,
      type: 'Document',
      customer: d.guestName || '-',
      destination: d.country || '-',
      date: d.estimatedDone || d.receiveDate || '-',
      targetDate: new Date(d.estimatedDone || d.receiveDate || 0),
      status: d.sendDate ? 'Completed' : 'Processing',
      amount: '-',
      timestamp: parseInt(d.id.split('-')[1]) || 0
    })),
    ...telecoms.map(t => ({
      id: t.id,
      type: 'Telecom',
      customer: t.nama || '-',
      destination: t.region || '-',
      date: t.tanggalMulai || '-',
      targetDate: new Date(t.tanggalMulai || 0),
      status: t.tanggalSelesai ? 'Completed' : 'Active',
      amount: t.jumlahDeposit || 0,
      timestamp: parseInt(t.id.split('-')[1]) || 0
    })),
    ...hotels.map(h => ({
      id: h.id,
      type: 'Hotel',
      customer: h.guestList ? h.guestList.split(',')[0] : '-',
      destination: `${h.hotelName} (${h.region})`,
      date: h.checkIn || '-',
      targetDate: new Date(h.checkIn || 0),
      status: h.status || 'Upcoming',
      amount: '-',
      timestamp: parseInt(h.id.split('-')[1]) || 0
    }))
  ];

  // Filter for upcoming (targetDate >= today)
  let upcomingActivities = allActivities.filter(a => a.targetDate >= today && a.status !== 'Completed' && a.status !== 'Cancel' && a.status !== 'Cancelled');
  
  if (activityFilter !== 'All') {
    upcomingActivities = upcomingActivities.filter(a => a.type === activityFilter);
  }
  
  // Sort ascending by targetDate (nearest first)
  upcomingActivities.sort((a, b) => a.targetDate - b.targetDate);
  const recentActivities = upcomingActivities.slice(0, 8);

  // --- ALERTS WIDGET LOGIC ---
  const alerts = [];
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  // 1. Tours without invoice (Departure <= 7 days)
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

  // 2. Pending Cashouts
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

  // 3. Documents due today or overdue
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

  // Sort alerts by date (nearest first)
  alerts.sort((a, b) => new Date(a.date) - new Date(b.date));

  const getStatusBadge = (status) => {
    if (['Confirmed', 'Confirm', 'Completed'].includes(status)) return 'badge-success';
    if (['Pending', 'Processing', 'Upcoming', 'Active'].includes(status)) return 'badge-warning';
    if (['Cancelled', 'Cancel', 'Past', 'Past Date'].includes(status)) return 'badge-danger';
    return 'badge-primary';
  };

  return (
    <div className="app-container fade-in">
      <div 
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} 
        onClick={closeSidebarOnMobile}
      ></div>
      
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div className="bento-grid">
            
              <div className="card bento-col-12" style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '2.5rem',
                color: 'white',
                boxShadow: '0 10px 30px -5px rgba(6, 182, 212, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
              }}>
                <h1 className="gradient-text" style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '800' }}>
                  Welcome back, {user?.name || 'TravelOps User'}!
                </h1>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                  Here's what's happening in your operations today.
                </p>
              </div>

            {stats.map((stat, idx) => (
              <div key={idx} className="card stat-card bento-col-3" style={{ borderBottom: `4px solid ${stat.color}` }}>
                <div className="stat-header">
                  <div>
                    <div className="stat-title">{stat.title}</div>
                    <div className="stat-value">{stat.value}</div>
                  </div>
                  <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}20`, boxShadow: `0 0 15px ${stat.color}40` }}>{stat.icon}</div>
                </div>
              </div>
            ))}

            {/* LEFT COLUMN: UPCOMING EVENTS */}
            <div className="card bento-col-8" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: '600' }}>Upcoming Departure</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['All', 'Tour', 'Cruise', 'Hotel', 'Document', 'Telecom'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
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
                            <span className={`badge ${getStatusBadge(activity.status)}`}>
                              {activity.status}
                            </span>
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

            {/* RIGHT COLUMN: ACTION REQUIRED ALERTS */}
            <div className="card bento-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <AlertCircle size={20} style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }} /> Action Required
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.5rem' }}>
                {alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <div key={idx} style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      background: alert.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      borderLeft: `4px solid ${alert.type === 'danger' ? '#ef4444' : '#f59e0b'}`
                    }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.25rem' }}>
                        {alert.title}
                      </div>
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

            </div> {/* End Bento Grid */}
          </div>
        </div>
      </div>
      
      {/* WELCOME TOAST */}
      <div style={{
        position: 'fixed',
        bottom: showWelcome ? '20px' : '-100px',
        right: '20px',
        background: '#10b981',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 9999
      }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%' }}>
          👋
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>Login Successful</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Welcome to TravelOps Workspace!</p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
