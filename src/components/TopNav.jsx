import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { 
  LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info, Search, 
  Shield, ChevronDown, CheckCircle2, Plus, Clock, ChevronRight,
  Plane, Building, FileText, UserCheck, Sparkles, MapPin
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tours } = useTours();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const notifRef = useRef(null);
  const quickCreateRef = useRef(null);

  // International Clocks State
  const [clocks, setClocks] = useState({
    jkt: '--:--',
    tyo: '--:--',
    lon: '--:--'
  });

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setClocks({
          jkt: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }),
          tyo: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }),
          lon: now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        // Fallback if timezone not supported
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target)) {
        setShowQuickCreate(false);
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

  // Breadcrumb Resolver
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return [{ section: 'Dashboard', page: 'Overview' }];
    if (p === '/calendar') return [{ section: 'Operations', page: 'Master Calendar' }];
    if (p === '/tours') return [{ section: 'Operations', page: 'Tours Manager' }];
    if (p === '/knowledge') return [{ section: 'Operations', page: 'Destination Intel' }];
    if (p === '/hotel') return [{ section: 'Operations', page: 'Hotels' }];
    if (p === '/cruise') return [{ section: 'Operations', page: 'Cruises' }];
    if (p === '/documents') return [{ section: 'Operations', page: 'Documents & Visas' }];
    if (p === '/telecom') return [{ section: 'Operations', page: 'Telecom & SIM' }];
    if (p === '/sales') return [{ section: 'Analytics', page: 'Sales & Targets' }];
    if (p === '/productivity') return [{ section: 'Analytics', page: 'Productivity' }];
    if (p === '/corporate') return [{ section: 'Analytics', page: 'Corporate Accounts' }];
    if (p === '/overtime') return [{ section: 'Operations', page: 'Staff Overtime' }];
    if (p === '/staff-performance') return [{ section: 'Analytics', page: 'Staff Performance' }];
    if (p === '/users') return [{ section: 'Administration', page: 'User Management' }];
    if (p === '/settings') return [{ section: 'Administration', page: 'System Settings' }];
    if (p === '/profile') return [{ section: 'Account', page: 'User Profile' }];
    return [{ section: 'TravelOps', page: p.replace('/', '') }];
  };

  const breadcrumbs = getBreadcrumbs();

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
  notifications.sort((a, b) => a.type === 'urgent' ? -1 : 1);

  return (
    <header className="top-nav" style={{ height: '70px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 'var(--z-header)' }}>
      
      {/* Left: Hamburger + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <Menu size={20} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem' }}>
          {breadcrumbs.map((b, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: 'var(--text-subtle)', fontWeight: '500' }}>{b.section}</span>
              <ChevronRight size={13} color="var(--text-subtle)" />
              <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{b.page}</span>
            </div>
          ))}
        </div>

        {/* Quick Search Pill (Ctrl+K) */}
        <button 
          onClick={openCommandPalette}
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            maxWidth: '300px',
            padding: '0.4rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.775rem',
            cursor: 'pointer',
            marginLeft: '0.75rem'
          }}
          title="Search anything (Ctrl+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={14} color="var(--primary)" />
            <span>Search...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <kbd className="kbd-badge" style={{ fontSize: '0.65rem' }}>Ctrl</kbd>
            <kbd className="kbd-badge" style={{ fontSize: '0.65rem' }}>K</kbd>
          </div>
        </button>
      </div>

      {/* Center: Live Travel Clocks (Desktop only) */}
      <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 1rem' }}>
        <div className="tz-clock-badge" title="Jakarta Time (WIB)">
          <span>🇮🇩 JKT</span>
          <strong>{clocks.jkt}</strong>
        </div>
        <div className="tz-clock-badge" title="Tokyo Time (JST)">
          <span>🇯🇵 TYO</span>
          <strong>{clocks.tyo}</strong>
        </div>
        <div className="tz-clock-badge" title="London Time (BST/GMT)">
          <span>🇬🇧 LON</span>
          <strong>{clocks.lon}</strong>
        </div>
      </div>
      
      {/* Right: Quick Create Hub + Notifications + Theme + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        
        {/* Global "+ Quick Create" Hub */}
        <div style={{ position: 'relative' }} ref={quickCreateRef}>
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.42rem 0.8rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Create new booking or request"
          >
            <Plus size={15} />
            <span className="desktop-only">Quick Create</span>
            <ChevronDown size={13} />
          </button>

          {showQuickCreate && (
            <div 
              className="card glass fade-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '230px',
                padding: '0.4rem',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                zIndex: 60
              }}
            >
              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/tours'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plane size={16} color="#3b82f6" />
                <span>New Tour Booking</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/hotel'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Building size={16} color="#f59e0b" />
                <span>New Hotel Reservation</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/documents'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={16} color="#a855f7" />
                <span>New Visa / Document</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/overtime'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Clock size={16} color="#f43f5e" />
                <span>Log Staff Overtime</span>
              </div>
            </div>
          )}
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
              zIndex: 60,
              borderRadius: '12px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
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
          title={theme === 'dark' ? 'Switch to Light Studio Mode' : 'Switch to Obsidian Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.2rem' }} />

        {/* Profile Pill Trigger */}
        <div 
          className="user-profile" 
          onClick={() => navigate('/profile')} 
          style={{ 
            cursor: 'pointer',
            padding: '0.35rem 0.55rem',
            borderRadius: '8px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8125rem', flexShrink: 0, position: 'relative' }}>
            {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            <span style={{
              position: 'absolute', bottom: '-1px', right: '-1px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#10b981', border: '2px solid var(--bg-dark)'
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '160px' }}>
            <span 
              title={user?.name || user?.email || 'Admin'}
              style={{ 
                fontSize: '0.8125rem', 
                fontWeight: '700', 
                color: 'var(--text-main)', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}
            >
              {user?.name || user?.email?.split('@')[0] || 'Admin'}
            </span>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
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
