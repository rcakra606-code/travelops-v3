import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import {
  LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info, Search,
  ChevronDown, CheckCircle2, Plus, Clock, ChevronRight,
  Plane, Building, FileText, User, Globe, ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tours } = useTours();
  const navigate = useNavigate();
  const location = useLocation();

  const isLight = theme === 'light';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showClocks, setShowClocks] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const quickCreateRef = useRef(null);
  const clocksRef = useRef(null);
  const userMenuRef = useRef(null);

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
      } catch {
        // Fallback if timezone unsupported
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target)) setShowQuickCreate(false);
      if (clocksRef.current && !clocksRef.current.contains(event.target)) setShowClocks(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
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

  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return [{ section: 'Workspace', page: 'Home Overview' }];
    if (p === '/calendar') return [{ section: 'Workspace', page: 'Trip Calendar' }];
    if (p === '/tours') return [{ section: 'Guest Services', page: 'Tours & Trips' }];
    if (p === '/knowledge') return [{ section: 'Resources', page: 'Travel Guides & Tips' }];
    if (p === '/hotel') return [{ section: 'Guest Services', page: 'Hotel Stays' }];
    if (p === '/cruise') return [{ section: 'Guest Services', page: 'Cruise Voyages' }];
    if (p === '/documents') return [{ section: 'Guest Services', page: 'Visas & Documents' }];
    if (p === '/telecom') return [{ section: 'Guest Services', page: 'Travel SIM & eSIM' }];
    if (p === '/sales') return [{ section: 'Insights', page: 'Sales & Goals' }];
    if (p === '/productivity') return [{ section: 'Insights', page: 'Daily Tasks' }];
    if (p === '/corporate') return [{ section: 'Insights', page: 'Corporate Clients' }];
    if (p === '/overtime') return [{ section: 'Team', page: 'Team Overtime' }];
    if (p === '/staff-performance') return [{ section: 'Insights', page: 'Team Highlights' }];
    if (p === '/users') return [{ section: 'Admin', page: 'Team & Access' }];
    if (p === '/settings') return [{ section: 'Admin', page: 'Workspace Settings' }];
    if (p === '/profile') return [{ section: 'Account', page: 'My Profile' }];
    return [{ section: 'TravelOps', page: p.replace('/', '') }];
  };

  const breadcrumbs = getBreadcrumbs();

  const notifications = [];
  if (tours) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tours.forEach((tour) => {
      if (tour.status === 'Confirm' || tour.status === 'Pending') {
        const depDate = new Date(tour.departureDate);
        depDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((depDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          notifications.push({
            id: `tour-${tour.id}`,
            type: diffDays <= 3 ? 'urgent' : 'warning',
            message:
              diffDays === 0
                ? `Trip ${tour.bookingCode || tour.tourCode} to ${tour.country} departs today!`
                : `Trip ${tour.bookingCode || tour.tourCode} to ${tour.country} departs in ${diffDays} day${diffDays > 1 ? 's' : ''}.`,
            time: diffDays === 0 ? 'Departing today' : `In ${diffDays} day${diffDays > 1 ? 's' : ''}`,
            path: '/tours'
          });
        }
      }
    });
  }
  notifications.sort((a) => (a.type === 'urgent' ? -1 : 1));

  const pillSurface = isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.06)';
  const hoverBg = isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)';

  return (
    <header
      className="top-nav"
      style={{
        height: '64px',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 'var(--z-header)'
      }}
    >
      {/* Left: Hamburger + Breadcrumbs + Quick Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
        <button
          type="button"
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Menu size={20} />
        </button>

        {/* Friendly Breadcrumbs */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
          {breadcrumbs.map((b, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--text-subtle)', fontWeight: '500' }}>{b.section}</span>
              <ChevronRight size={13} color="var(--text-subtle)" />
              <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{b.page}</span>
            </div>
          ))}
        </div>

        {/* Quick Search Pill (Ctrl+K) */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '250px',
            padding: '0.42rem 0.8rem',
            background: pillSurface,
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginLeft: '0.5rem',
            transition: 'border-color 0.15s, background 0.15s'
          }}
          title="Quick find anything (Ctrl+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Search size={14} color="var(--primary)" />
            <span>Quick search...</span>
          </div>
          <kbd className="kbd-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.38rem' }}>
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Center: World Clocks Dropdown */}
      <div className="desktop-only" style={{ position: 'relative', margin: '0 0.5rem' }} ref={clocksRef}>
        <button
          type="button"
          onClick={() => setShowClocks(!showClocks)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.38rem 0.7rem',
            borderRadius: '10px',
            background: showClocks ? hoverBg : pillSurface,
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '0.76rem',
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="World Travel Clocks"
        >
          <Globe size={13} color="var(--primary)" />
          <span style={{ color: 'var(--text-subtle)' }}>JKT</span>
          <strong style={{ color: 'var(--text-main)', fontWeight: '700' }}>{clocks.jkt}</strong>
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
              width: '230px',
              padding: '0.6rem',
              borderRadius: '12px',
              zIndex: 60
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: 'var(--text-subtle)',
                padding: '0.2rem 0.5rem 0.45rem',
                borderBottom: '1px solid var(--border)',
                letterSpacing: '0.05em'
              }}
            >
              World Travel Clocks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.45rem' }}>
              {[
                { label: '🇮🇩 Jakarta (WIB)', time: clocks.jkt },
                { label: '🇯🇵 Tokyo (JST)', time: clocks.tyo },
                { label: '🇬🇧 London (GMT)', time: clocks.lon }
              ].map((tz) => (
                <div
                  key={tz.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.42rem 0.55rem',
                    borderRadius: '8px',
                    background: pillSurface
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tz.label}</span>
                  <strong className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {tz.time}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Create + Notifications + Theme Toggle + User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Global "+ New" Button */}
        <div style={{ position: 'relative' }} ref={quickCreateRef}>
          <button
            type="button"
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="btn btn-primary"
            style={{
              padding: '0.42rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              gap: '0.35rem'
            }}
            title="Quickly create a booking or request"
          >
            <Plus size={15} />
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
                width: '225px',
                padding: '0.4rem',
                borderRadius: '12px',
                zIndex: 60
              }}
            >
              {[
                { label: 'New Tour Booking', icon: <Plane size={15} color="#0095ff" />, path: '/tours' },
                { label: 'Hotel Stay', icon: <Building size={15} color="#f59e0b" />, path: '/hotel' },
                { label: 'Visa & Document', icon: <FileText size={15} color="#8b5cf6" />, path: '/documents' },
                { label: 'Log Team Overtime', icon: <Clock size={15} color="#10b981" />, path: '/overtime' }
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    navigate(action.path, { state: { openNew: true } });
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.58rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    fontWeight: '500',
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = hoverBg;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? hoverBg : 'transparent',
              border: '1px solid transparent',
              color: showNotifications ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              transition: 'all 0.15s',
              position: 'relative'
            }}
            title="Upcoming trip reminders"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'var(--danger)',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: '700',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="card glass fade-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '325px',
                padding: 0,
                zIndex: 60,
                borderRadius: '14px'
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '700' }}>
                    Trip Reminders
                  </h4>
                  {notifications.length > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                      {notifications.length} Upcoming
                    </span>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '0.65rem',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--success)',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                      All caught up!
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      No urgent departures in the next 7 days.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(notif.path);
                      }}
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = hoverBg;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {notif.type === 'urgent' ? (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '7px',
                              background: 'rgba(244, 63, 94, 0.14)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <AlertCircle size={14} color="var(--danger)" />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '7px',
                              background: 'rgba(0, 168, 255, 0.14)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Info size={14} color="var(--primary)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: '500' }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '600' }}>
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
          type="button"
          onClick={toggleTheme}
          style={{
            background: pillSurface,
            border: '1px solid var(--border)',
            color: 'var(--primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            transition: 'all 0.15s'
          }}
          title={theme === 'dark' ? 'Switch to Neon Sky Light Mode' : 'Switch to Obsidian Neon Dark Mode'}
          aria-label="Toggle color mode"
        >
          {theme === 'dark' ? <Sun size={17} color="#38bdf8" /> : <Moon size={17} color="var(--primary)" />}
        </button>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: showUserMenu ? hoverBg : 'transparent',
              border: 'none',
              padding: '0.28rem 0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.78rem', flexShrink: 0, position: 'relative' }}>
              {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'T'}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '1.5px solid var(--bg-card)'
                }}
              />
            </div>
            <span
              className="desktop-only"
              style={{
                fontSize: '0.84rem',
                fontWeight: '600',
                color: 'var(--text-main)',
                maxWidth: '120px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.name || user?.email?.split('@')[0] || 'Team Member'}
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
                width: '235px',
                padding: '0.45rem',
                borderRadius: '12px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.name || user?.email || 'Team Member'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.08rem 0.42rem' }}>
                    {user?.role || 'Consultant'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-subtle)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user?.email}
                  </span>
                </div>
              </div>

              <div style={{ padding: '0.35rem 0' }}>
                <div
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = hoverBg;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <User size={15} color="var(--primary)" />
                  <span>My Profile</span>
                </div>

                <Link
                  to="/track"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = hoverBg;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <ExternalLink size={15} color="var(--primary)" />
                    <span>Guest Status Tracker</span>
                  </div>
                </Link>

                <div
                  onClick={() => {
                    setShowUserMenu(false);
                    openCommandPalette();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = hoverBg;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Search size={15} color="var(--primary)" />
                    <span>Quick Search</span>
                  </div>
                  <kbd className="kbd-badge" style={{ fontSize: '0.625rem', padding: '0.06rem 0.32rem' }}>
                    Ctrl K
                  </kbd>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                <div
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    color: 'var(--danger)',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
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
