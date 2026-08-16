import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info, Search, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';
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

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
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
            time: diffDays === 0 ? 'Today' : `In ${diffDays}d`,
            path: '/tours'
          });
        }
      }
    });
  }

  // Sort by urgency
  notifications.sort((a, b) => a.type === 'urgent' ? -1 : 1);

  return (
    <header className="top-nav">
      {/* Left: Hamburger & Quick Search Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '520px' }}>
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <Menu size={20} />
        </button>

        {/* Linear-style Quick Search Pill */}
        <button 
          onClick={openCommandPalette}
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '380px',
            padding: '0.45rem 0.85rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'left'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Search size={15} color="var(--primary)" />
            <span>Search tours, bookings, pages...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <kbd className="kbd-badge">Ctrl</kbd>
            <kbd className="kbd-badge">K</kbd>
          </div>
        </button>
      </div>
      
      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* System Status Pill (Desktop only) */}
        <div 
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.725rem',
            fontWeight: '600',
            color: '#34d399'
          }}
          title="All systems live and synchronized"
        >
          <span className="pulse-dot pulse-dot-green" />
          <span>Operational</span>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: '1px solid',
              borderColor: showNotifications ? 'var(--border-hover)' : 'transparent',
              color: showNotifications ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseOut={e => e.currentTarget.style.background = showNotifications ? 'rgba(255, 255, 255, 0.08)' : 'transparent'}
            title="System Alerts & Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.625rem',
                fontWeight: '700',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="card glass fade-in" style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '0.65rem',
              width: '340px',
              padding: '0',
              zIndex: 50,
              borderRadius: '12px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '700' }}>
                    Notifications
                  </h4>
                  {notifications.length > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {notifications.length} Active
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>All clear!</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-subtle)', fontSize: '0.75rem' }}>No pending alerts or tour departures.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => { setShowNotifications(false); navigate(notif.path); }}
                      style={{ 
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {notif.type === 'urgent' ? (
                          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={14} color="#f87171" />
                          </div>
                        ) : (
                          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info size={14} color="#fbbf24" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: '500' }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: '600' }}>
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title={theme === 'dark' ? 'Switch to Light Studio Mode' : 'Switch to Obsidian Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Profile Pill Trigger */}
        <div 
          className="user-profile" 
          onClick={() => navigate('/profile')} 
          style={{ 
            cursor: 'pointer',
            padding: '0.35rem 0.5rem',
            borderRadius: '8px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8125rem' }}>
            {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {user?.name || user?.email?.split('@')[0] || 'Admin'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
              {user?.role || 'Administrator'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          className="btn" 
          style={{ 
            padding: '0.45rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            gap: '0.4rem'
          }} 
          title="Sign Out"
        >
          <LogOut size={15} />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default TopNav;
