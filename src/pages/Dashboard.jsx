import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { DollarSign, Users, Map, TrendingUp, Ship, FileText, Phone, Building } from 'lucide-react';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useHotels } from '../context/HotelContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showWelcome, setShowWelcome] = useState(false);

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
    { title: 'Active Bookings (Tour/Cruise/Hotel)', value: (tourStats.activeBookings + activeCruises + activeHotels).toString(), icon: <Map size={24} />, isUp: true, color: '#3b82f6' },
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
  const upcomingActivities = allActivities.filter(a => a.targetDate >= today && a.status !== 'Completed' && a.status !== 'Cancel' && a.status !== 'Cancelled');
  
  // Sort ascending by targetDate (nearest first)
  upcomingActivities.sort((a, b) => a.targetDate - b.targetDate);
  const recentActivities = upcomingActivities.slice(0, 8);

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
            
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              color: 'white',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
            }}>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
                Welcome back, {user?.name || 'TravelOps User'}! 👋
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
                Here's what's happening in your operations today.
              </p>
            </div>

          <div className="dashboard-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="card stat-card" style={{ borderBottom: `4px solid ${stat.color}` }}>
                <div className="stat-header">
                  <div>
                    <div className="stat-title">{stat.title}</div>
                    <div className="stat-value">{stat.value}</div>
                  </div>
                  <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}20` }}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Upcoming Events & Departures</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>ID</th>
                    <th>Customer / PIC</th>
                    <th>Destination / Route</th>
                    <th>Nearest Date</th>
                    <th>Value / Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{activity.type}</td>
                        <td style={{ fontWeight: '500', color: 'var(--primary)' }}>{activity.id}</td>
                        <td>{activity.customer}</td>
                        <td>{activity.destination}</td>
                        <td style={{ color: '#fbbf24', fontWeight: '500' }}>{activity.date}</td>
                        <td style={{ fontWeight: '600' }}>
                          {activity.amount !== '-' ? (
                            typeof activity.amount === 'number' ? formatCurrency(activity.amount) : activity.amount
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(activity.status)}`}>
                            {activity.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No upcoming activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
