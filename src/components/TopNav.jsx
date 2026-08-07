import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tours } = useTours();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generate Intelligent Notifications
  const notifications = [];
  
  if (tours) {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    tours.forEach(tour => {
      if (tour.status === 'Confirm' || tour.status === 'Pending') {
        const depDate = new Date(tour.departureDate);
        depDate.setHours(0,0,0,0);
        
        const diffTime = depDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 7) {
          notifications.push({
            id: `tour-${tour.id}`,
            type: diffDays <= 3 ? 'urgent' : 'warning',
            message: `Tour ${tour.bookingCode || tour.tourCode} to ${tour.country} departs in ${diffDays} day(s).`,
            time: 'System Alert',
            path: '/tours'
          });
        }
      }
    });
  }

  // Sort by urgency
  notifications.sort((a, b) => a.type === 'urgent' ? -1 : 1);

  return (
    <div className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s', position: 'relative'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: '0', right: '0', background: 'var(--danger)', color: 'white',
                fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                border: '2px solid var(--bg-card)'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="card glass fade-in" style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '0.5rem',
              width: '320px', padding: '0', zIndex: 50, borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>Notifications</h4>
                <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {notifications.length} New
                </span>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    You're all caught up!
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => { setShowNotifications(false); navigate(notif.path); }}
                      style={{ 
                        padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start', transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {notif.type === 'urgent' ? <AlertCircle size={16} color="var(--danger)" /> : <Info size={16} color="var(--warning)" />}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{notif.message}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Profile */}
        <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.name || 'Admin'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'Administrator'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', marginLeft: '0.5rem' }} title="Logout">
          <LogOut size={18} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default TopNav;
