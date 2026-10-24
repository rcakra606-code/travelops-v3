import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { 
  LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info, Search, 
  ChevronDown, CheckCircle2, Plus, Clock, ChevronRight,
  Plane, Building, FileText, User, Globe, Shield, ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tours } = useTours();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showClocks, setShowClocks] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const quickCreateRef = useRef(null);
  const clocksRef = useRef(null);
  const userMenuRef = useRef(null);

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
      if (clocksRef.current && !clocksRef.current.contains(event.target)) {
        setShowClocks(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  // Breadcrumb Resolver
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return [{ section: 'Overview', page: 'Dashboard' }];
    if (p === '/calendar') return [{ section: 'Operations', page: 'Master Calendar' }];
    if (p === '/tours') return [{ section: 'Operations', page: 'Tours Manager' }];
    if (p === '/knowledge') return [{ section: 'Intelligence', page: 'Destination Intel' }];
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
    <header className="top-nav" style={{ height: '64px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 'var(--z-header)' }}>
      
      {/* Left: Hamburger + Breadcrumbs + Search Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
        <button 
          className="hamburger-btn" 
          onClick={toggleSidebar} 
          aria-label="Toggle Sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Menu size={19} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
          {breadcrumbs.map((b, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--text-subtle)', fontWeight: '500' }}>{b.section}</span>
              <ChevronRight size={13} color="var(--text-subtle)" />
              <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{b.page}</span>
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
            width: '240px',
            padding: '0.38rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.775rem',
            cursor: 'pointer',
            marginLeft: '0.5rem',
            transition: 'border-color 0.15s, background 0.15s'
          }}
          title="Search or jump to... (Ctrl+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Search size={13} color="var(--primary)" />
            <span>Search or jump to...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <kbd className="kbd-badge" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>Ctrl K</kbd>
          </div>
        </button>
      </div>

      {/* Center: Consolidated World Clocks Dropdown */}
      <div className="desktop-only" style={{ position: 'relative', margin: '0 0.5rem' }} ref={clocksRef}>
        <button
          onClick={() => setShowClocks(!showClocks)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '8px',
            background: showClocks ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="International Operational Timezones"
        >
          <Globe size={13} color="var(--primary)" />
          <span style={{ color: 'var(--text-subtle)' }}>JKT</span>
          <strong style={{ color: 'var(--text-main)', fontWeight: '600' }}>{clocks.jkt}</strong>
          <ChevronDown size={12} color="var(--text-subtle)" />
        </button>

        {showClocks && (
          <div 
            className="card glass fade-in"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '0.5rem',
              width: '220px',
              padding: '0.5rem',
              borderRadius: '10px',
              zIndex: 60,
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ fontSize: '0.675rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)', padding: '0.2rem 0.5rem 0.4rem', borderBottom: '1px solid var(--border)', letterSpacing: '0.05em' }}>
              Operational Timezones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🇮🇩 Jakarta (WIB)</span>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.775rem', color: 'var(--text-main)' }}>{clocks.jkt}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🇯🇵 Tokyo (JST)</span>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.775rem', color: 'var(--text-main)' }}>{clocks.tyo}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🇬🇧 London (GMT)</span>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.775rem', color: 'var(--text-main)' }}>{clocks.lon}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Right: Quick Create + Notifications + Theme Toggle + User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        
        {/* Global "+ New" Hub */}
        <div style={{ position: 'relative' }} ref={quickCreateRef}>
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.38rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--primary)',
              fontSize: '0.775rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Create new booking or request"
          >
            <Plus size={14} />
            <span className="desktop-only">New</span>
            <ChevronDown size={12} />
          </button>

          {showQuickCreate && (
            <div 
              className="card glass fade-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '220px',
                padding: '0.35rem',
                borderRadius: '10px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--border)',
                zIndex: 60
              }}
            >
              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/tours'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.75rem', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plane size={15} color="#3b82f6" />
                <span>Tour Booking</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/hotel'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.75rem', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Building size={15} color="#f59e0b" />
                <span>Hotel Reservation</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/documents'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.75rem', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={15} color="#a855f7" />
                <span>Visa & Document</span>
              </div>

              <div 
                onClick={() => { setShowQuickCreate(false); navigate('/overtime'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.75rem', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Clock size={15} color="#f43f5e" />
                <span>Log Overtime</span>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              color: showNotifications ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              transition: 'all 0.15s',
              position: 'relative'
            }}
            title="System Alerts & Notifications"
          >
            <Bell size={17} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: '700',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
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
              marginTop: '0.5rem',
              width: '320px',
              padding: '0',
              zIndex: 60,
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: '700' }}>
                    Notifications
                  </h4>
                  {notifications.length > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                      {notifications.length} Active
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.65rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>All clear</p>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-subtle)', fontSize: '0.75rem' }}>No pending alerts or tour departures.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => { setShowNotifications(false); navigate(notif.path); }}
                      style={{ 
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {notif.type === 'urgent' ? (
                          <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={13} color="#f87171" />
                          </div>
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info size={13} color="#fbbf24" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.775rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: '500' }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)', fontWeight: '600' }}>
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

        {/* Theme Toggle Icon */}
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
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            transition: 'all 0.15s'
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} color="#e5ba64" /> : <Moon size={17} color="var(--primary, #476b52)" />}
        </button>

        {/* Consolidated User Profile Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: showUserMenu ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.75rem', flexShrink: 0, position: 'relative' }}>
              {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              <span style={{
                position: 'absolute', bottom: '-1px', right: '-1px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#10b981', border: '1.5px solid var(--bg-dark)'
              }} />
            </div>
            <span className="desktop-only" style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email?.split('@')[0] || 'Operator'}
            </span>
            <ChevronDown size={12} color="var(--text-subtle)" className="desktop-only" />
          </button>

          {showUserMenu && (
            <div 
              className="card glass fade-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '230px',
                padding: '0.4rem',
                borderRadius: '10px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65)',
                border: '1px solid var(--border)',
                zIndex: 60
              }}
            >
              {/* User Identity Header */}
              <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || user?.email || 'User'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: '700',
                    padding: '0.08rem 0.35rem',
                    borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--primary)',
                    textTransform: 'uppercase'
                  }}>
                    {user?.role || 'Operator'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div style={{ padding: '0.3rem 0' }}>
                <div 
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.5rem 0.75rem', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={15} color="var(--text-muted)" />
                  <span>My Profile</span>
                </div>

                <div 
                  onClick={() => { setShowUserMenu(false); openCommandPalette(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-main)',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Search size={15} color="var(--text-muted)" />
                    <span>Search Palette</span>
                  </div>
                  <kbd className="kbd-badge" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>Ctrl K</kbd>
                </div>
              </div>

              {/* Sign Out Row */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                <div 
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.5rem 0.75rem', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '0.8125rem', color: '#f87171',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNav;
