import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { useDocuments } from '../context/DocumentContext';
import { useHotels } from '../context/HotelContext';
import { useCruises } from '../context/CruiseContext';
import { useTelecoms } from '../context/TelecomContext';
import { formatCurrency } from '../utils/currency';
import {
  LogOut, Menu, Moon, Sun, Bell, AlertCircle, Info, Search,
  ChevronDown, CheckCircle2, Plus, Clock, ChevronRight,
  Plane, Building, FileText, User, Globe, ExternalLink, Keyboard,
  Anchor, Phone, DollarSign, Stamp, Check, ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tours } = useTours();
  const { documents } = useDocuments();
  const { hotels } = useHotels();
  const { cruises } = useCruises();
  const { telecoms } = useTelecoms();
  const navigate = useNavigate();
  const location = useLocation();

  const isLight = theme === 'light';

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifScope, setNotifScope] = useState(() => (user?.role === 'Staff' ? 'mine' : 'all'));
  const [notifCategory, setNotifCategory] = useState('all'); // 'all' | 'finance' | 'visa' | 'schedule'
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('travelops_dismissed_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
    const handleOpenQuickCreate = () => {
      setShowQuickCreate((prev) => !prev);
      setShowNotifications(false);
      setShowClocks(false);
      setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('open-quick-create', handleOpenQuickCreate);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('open-quick-create', handleOpenQuickCreate);
    };
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const dismissNotification = (id, e) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const next = [...new Set([...prev, id])];
      try {
        sessionStorage.setItem('travelops_dismissed_notifs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return [{ section: 'Workspace', page: 'Beranda Operasional' }];
    if (p === '/calendar') return [{ section: 'Workspace', page: 'Kalender Perjalanan' }];
    if (p === '/tours') return [{ section: 'Layanan Tamu', page: 'Tour & Perjalanan' }];
    if (p === '/tour-registration-form') return [{ section: 'Layanan Tamu', page: 'Form Pendaftaran Tour' }];
    if (p === '/knowledge') return [{ section: 'Referensi', page: 'Panduan & Knowledge Base' }];
    if (p === '/hotel') return [{ section: 'Layanan Tamu', page: 'Reservasi Hotel' }];
    if (p === '/cruise') return [{ section: 'Layanan Tamu', page: 'Pelayaran Cruise' }];
    if (p === '/documents') return [{ section: 'Layanan Tamu', page: 'Visa & Dokumen' }];
    if (p === '/telecom') return [{ section: 'Layanan Tamu', page: 'SIM, eSIM & WiFi' }];
    if (p === '/sales') return [{ section: 'Laporan & Tim', page: 'Penjualan & Target' }];
    if (p === '/executive-bi') return [{ section: 'Workspace', page: 'Executive BI Analytics' }];
    if (p === '/productivity') return [{ section: 'Laporan & Tim', page: 'Produktivitas & P&L' }];
    if (p === '/corporate') return [{ section: 'Laporan & Tim', page: 'Klien Korporasi' }];
    if (p === '/overtime') return [{ section: 'Tim', page: 'Log Lembur Tim' }];
    if (p === '/staff-performance') return [{ section: 'Laporan & Tim', page: 'Performa Konsultan' }];
    if (p === '/users') return [{ section: 'Admin', page: 'Tim & Hak Akses' }];
    if (p === '/settings') return [{ section: 'Admin', page: 'Pengaturan Sistem' }];
    if (p === '/profile') return [{ section: 'Akun', page: 'Profil Saya' }];
    return [{ section: 'TravelOps', page: p.replace('/', '') }];
  };

  const breadcrumbs = getBreadcrumbs();

  const userName = user?.name || '';

  // Multi-module operational notification aggregation
  const allNotifications = useMemo(() => {
    const list = [];
    const currentName = userName.trim().toLowerCase();

    const matchesScope = (staffField) => {
      if (notifScope === 'all') return true;
      if (!currentName) return true;
      return (staffField || '').trim().toLowerCase() === currentName;
    };

    // 1. Tours: Departure H-7 & Balance Due H-14
    (tours || []).forEach((tour) => {
      if (tour.status === 'Cancel' || tour.status === 'Cancelled' || tour.status === 'Past Date') return;
      if (!matchesScope(tour.staffName)) return;

      const diff = daysUntil(tour.departureDate);
      const code = tour.bookingCode || tour.tourCode || 'Tour';
      const fin = tour.financials || {};
      const sisa = Number(fin.sisaPelunasan ?? Math.max(0, Number(fin.totalSellingPrice ?? fin.totalOmset ?? 0) - Number(fin.depositAmount || 0)));

      if (diff !== null && diff >= 0 && diff <= 7) {
        list.push({
          id: `tour-dep-${tour.id}`,
          category: 'schedule',
          type: diff <= 2 ? 'urgent' : 'warning',
          module: 'Tour',
          message:
            diff === 0
              ? `Tour ${code} (${tour.country}) berangkat HARI INI!`
              : `Tour ${code} (${tour.country}) berangkat dalam ${diff} hari.`,
          time: diff === 0 ? 'Hari ini' : `H-${diff}`,
          path: '/tours',
          navState: { openTab: 'database', openId: tour.id, search: code }
        });
      }

      if (sisa > 0 && diff !== null && diff >= 0 && diff <= 14) {
        list.push({
          id: `tour-bal-${tour.id}`,
          category: 'finance',
          type: diff <= 7 ? 'urgent' : 'warning',
          module: 'Pelunasan',
          message: `${code} (${tour.country}) belum lunas ${formatCurrency(sisa)} (berangkat H-${diff}).`,
          time: `Sisa ${formatCurrency(sisa)}`,
          path: '/tours',
          navState: { openTab: 'database', openId: tour.id, search: code }
        });
      }
    });

    // 2. Documents: Visa Appointment H-7
    (documents || []).forEach((doc) => {
      if (doc.shippingStatus === 'Received' || doc.shippingStatus === 'Cancelled') return;
      if (!matchesScope(doc.staff)) return;

      const appDiff = daysUntil(doc.appointmentDate);
      if (appDiff !== null && appDiff >= 0 && appDiff <= 7) {
        list.push({
          id: `doc-app-${doc.id}`,
          category: 'visa',
          type: appDiff <= 2 ? 'urgent' : 'warning',
          module: 'Visa',
          message:
            appDiff === 0
              ? `Jadwal Visa ${doc.guestName} (${doc.country || doc.docType}) HARI INI!`
              : `Jadwal Visa ${doc.guestName} (${doc.country || doc.docType}) dalam ${appDiff} hari.`,
          time: appDiff === 0 ? 'Hari ini' : `H-${appDiff}`,
          path: '/documents',
          navState: { openId: doc.id, search: doc.guestName || '' }
        });
      }
    });

    // 3. Hotels: Check-In H-3
    (hotels || []).forEach((h) => {
      if (h.status === 'Cancelled' || h.status === 'Cancel') return;
      if (!matchesScope(h.staff || h.staffName)) return;

      const diff = daysUntil(h.checkIn);
      if (diff !== null && diff >= 0 && diff <= 3) {
        list.push({
          id: `hotel-ci-${h.id}`,
          category: 'schedule',
          type: diff <= 1 ? 'urgent' : 'warning',
          module: 'Hotel',
          message: `Check-in ${h.hotelName} (${h.guestName || h.bookingCode || 'Tamu'}) ${diff === 0 ? 'HARI INI' : `H-${diff}`}.`,
          time: diff === 0 ? 'Hari ini' : `H-${diff}`,
          path: '/hotel',
          navState: { openId: h.id, search: h.bookingCode || h.hotelName || '' }
        });
      }
    });

    // 4. Cruises: Sailing H-7
    (cruises || []).forEach((c) => {
      if (c.status === 'Cancelled' || c.status === 'Cancel') return;
      if (!matchesScope(c.staff || c.staffName)) return;

      const diff = daysUntil(c.sailingStart);
      if (diff !== null && diff >= 0 && diff <= 7) {
        list.push({
          id: `cruise-sail-${c.id}`,
          category: 'schedule',
          type: diff <= 2 ? 'urgent' : 'warning',
          module: 'Cruise',
          message: `Cruise ${c.shipName || c.cruiseBrand} (${c.guestName || c.bookingRef || 'Tamu'}) berlayar ${diff === 0 ? 'HARI INI' : `H-${diff}`}.`,
          time: diff === 0 ? 'Hari ini' : `H-${diff}`,
          path: '/cruise',
          navState: { openId: c.id, search: c.bookingRef || c.shipName || '' }
        });
      }
    });

    // 5. Telecom: Start/Pickup H-2
    (telecoms || []).forEach((tc) => {
      if (tc.status === 'Cancelled' || tc.status === 'Returned' || tc.status === 'Completed') return;
      if (!matchesScope(tc.staff || tc.picStaff)) return;

      const diff = daysUntil(tc.tanggalMulai);
      if (diff !== null && diff >= 0 && diff <= 2) {
        list.push({
          id: `telecom-start-${tc.id}`,
          category: 'schedule',
          type: diff === 0 ? 'urgent' : 'warning',
          module: 'SIM/WiFi',
          message: `${tc.jenisProduk || 'SIM/WiFi'} untuk ${tc.namaTamu || 'Tamu'} (${tc.negara || '-'}) aktif ${diff === 0 ? 'HARI INI' : `H-${diff}`}.`,
          time: diff === 0 ? 'Hari ini' : `H-${diff}`,
          path: '/telecom',
          navState: { openId: tc.id, search: tc.namaTamu || '' }
        });
      }
    });

    return list
      .filter((n) => !dismissedIds.includes(n.id))
      .sort((a, b) => (a.type === 'urgent' ? -1 : 1) - (b.type === 'urgent' ? -1 : 1));
  }, [tours, documents, hotels, cruises, telecoms, notifScope, userName, dismissedIds]);

  const markAllRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setDismissedIds((prev) => {
      const next = [...new Set([...prev, ...allIds])];
      try {
        sessionStorage.setItem('travelops_dismissed_notifs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const visibleNotifications = useMemo(() => {
    if (notifCategory === 'all') return allNotifications;
    return allNotifications.filter((n) => n.category === notifCategory);
  }, [allNotifications, notifCategory]);

  const pillSurface = isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.06)';
  const hoverBg = isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)';

  return (
    <header
      className="top-nav"
      style={{
        height: '64px',
        padding: '0 2rem',
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
            width: '270px',
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
          title="Cari nama tamu, booking, visa, atau menu (Ctrl+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Search size={14} color="var(--primary)" />
            <span>Cari tamu, booking, visa...</span>
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
          aria-expanded={showClocks}
          aria-haspopup="true"
          aria-label="Jam Zona Waktu Perjalanan"
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
          title="Jam Zona Waktu Perjalanan"
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
              Zona Waktu Dunia
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.45rem' }}>
              {[
                { code: 'WIB', city: 'Jakarta', time: clocks.jkt },
                { code: 'JST', city: 'Tokyo', time: clocks.tyo },
                { code: 'GMT', city: 'London', time: clocks.lon }
              ].map((tz) => (
                <div
                  key={tz.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.42rem 0.55rem',
                    borderRadius: '6px',
                    background: pillSurface
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)' }}>{tz.code}</span>
                    {tz.city}
                  </span>
                  <strong className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {tz.time}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Create + Keyboard + Notifications + Theme Toggle + User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Global "+ Baru" Button (Alt+N) — Restrained secondary chrome so page CTAs lead */}
        <div style={{ position: 'relative' }} ref={quickCreateRef}>
          <button
            type="button"
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            aria-expanded={showQuickCreate}
            aria-haspopup="menu"
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.78rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.79rem',
              gap: '0.32rem'
            }}
            title="Buat transaksi baru (Alt+N)"
          >
            <Plus size={14} color="var(--primary)" />
            <span className="desktop-only">Baru</span>
            <ChevronDown size={12} color="var(--text-subtle)" />
          </button>

          {showQuickCreate && (
            <div
              className="card fade-in"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.45rem',
                width: '240px',
                padding: '0.4rem',
                borderRadius: 'var(--radius-lg)',
                zIndex: 60
              }}
            >
              <div
                style={{
                  padding: '0.25rem 0.65rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '0.3rem'
                }}
              >
                <span>Input Cepat</span>
                <kbd className="kbd-badge" style={{ fontSize: '0.62rem' }}>Alt N</kbd>
              </div>
              {[
                { label: 'Booking Tour Baru', icon: <Plane size={14} />, path: '/tours' },
                { label: 'Form Pendaftaran Tour (PDF)', icon: <ClipboardList size={14} />, path: '/tour-registration-form' },
                { label: 'Visa & Dokumen', icon: <FileText size={14} />, path: '/documents' },
                { label: 'Reservasi Hotel', icon: <Building size={14} />, path: '/hotel' },
                { label: 'Pelayaran Cruise', icon: <Anchor size={14} />, path: '/cruise' },
                { label: 'Order SIM / eSIM / WiFi', icon: <Phone size={14} />, path: '/telecom' },
                { label: 'Ajukan Lembur Tim', icon: <Clock size={14} />, path: '/overtime' }
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    navigate(action.path, { state: { openNew: true, _ts: Date.now() } });
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.68rem',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.81rem',
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
                  <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))}
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            transition: 'all 0.15s'
          }}
          title="Pintasan Keyboard (Tekan ?)"
          aria-label="Pintasan Keyboard"
          onMouseOver={(e) => {
            e.currentTarget.style.background = hoverBg;
            e.currentTarget.style.color = 'var(--primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Keyboard size={18} />
        </button>

        {/* Multi-Module Actionable Notification Center */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-expanded={showNotifications}
            aria-haspopup="true"
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
            title="Pusat Notifikasi Operasional"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {allNotifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--danger)',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: '800',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px'
                }}
              >
                {allNotifications.length > 99 ? '99+' : allNotifications.length}
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
                width: '375px',
                maxWidth: '92vw',
                padding: 0,
                zIndex: 60,
                borderRadius: '14px',
                overflow: 'hidden'
              }}
            >
              {/* Header + Scope Toggle */}
              <div
                style={{
                  padding: '0.85rem 1rem 0.65rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: '700' }}>
                      Pengingat Operasional
                    </h4>
                    {allNotifications.length > 0 && (
                      <span className="badge badge-primary" style={{ fontSize: '0.66rem', padding: '0.1rem 0.45rem' }}>
                        {allNotifications.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '2px',
                        borderRadius: '8px',
                        background: pillSurface,
                        border: '1px solid var(--border)'
                      }}
                    >
                      {[
                        { id: 'mine', label: 'Milik Saya' },
                        { id: 'all', label: 'Semua' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setNotifScope(s.id)}
                          style={{
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.18rem 0.48rem',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: notifScope === s.id ? 'var(--primary)' : 'transparent',
                            color: notifScope === s.id ? '#ffffff' : 'var(--text-muted)'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'finance', label: 'Keuangan' },
                      { id: 'visa', label: 'Visa' },
                      { id: 'schedule', label: 'Jadwal' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNotifCategory(cat.id)}
                        style={{
                          padding: '0.18rem 0.52rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: `1px solid ${notifCategory === cat.id ? 'var(--primary)' : 'var(--border)'}`,
                          background: notifCategory === cat.id ? 'rgba(0, 168, 255, 0.14)' : 'transparent',
                          color: notifCategory === cat.id ? 'var(--primary)' : 'var(--text-muted)'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {allNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      title="Tandai semua sudah dibaca untuk sesi ini"
                    >
                      <Check size={12} /> Bersihkan
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {visibleNotifications.length === 0 ? (
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
                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '0.86rem' }}>
                      Semua aman terkendali!
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      Tidak ada pengingat mendesak pada filter ini.
                    </p>
                  </div>
                ) : (
                  visibleNotifications.slice(0, 25).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(notif.path, {
                          state: { ...(notif.navState || {}), _ts: Date.now() }
                        });
                      }}
                      style={{
                        padding: '0.75rem 1rem',
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
                        {notif.category === 'finance' ? (
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.16)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <DollarSign size={14} color="#f59e0b" />
                          </div>
                        ) : notif.category === 'visa' ? (
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              background: 'rgba(139, 92, 246, 0.16)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Stamp size={14} color="#8b5cf6" />
                          </div>
                        ) : notif.type === 'urgent' ? (
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              background: 'rgba(244, 63, 94, 0.15)',
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
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              background: 'rgba(0, 168, 255, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Info size={14} color="var(--primary)" />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.79rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: '500' }}>
                          {notif.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: '700',
                              padding: '0.08rem 0.4rem',
                              borderRadius: '6px',
                              background: pillSurface,
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            {notif.module}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: notif.type === 'urgent' ? 'var(--danger)' : 'var(--primary)', fontWeight: '700' }}>
                            {notif.time}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => dismissNotification(notif.id, e)}
                        title="Tandai dibaca"
                        aria-label="Tandai notifikasi dibaca"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          cursor: 'pointer',
                          padding: '3px',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      >
                        <Check size={13} />
                      </button>
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
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
          aria-label="Ubah mode warna"
        >
          {theme === 'dark' ? <Sun size={17} color="#38bdf8" /> : <Moon size={17} color="var(--primary)" />}
        </button>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-label="Menu akun pengguna"
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
              {user?.name || user?.email?.split('@')[0] || 'Staf'}
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
                  {user?.name || user?.email || 'Staf'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.08rem 0.42rem' }}>
                    {user?.role || 'Konsultan'}
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

              <div style={{ padding: '0.35rem 0' }} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
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
                  <span>Profil Saya</span>
                </button>

                <Link
                  to="/track"
                  role="menuitem"
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
                    <span>Portal Status Tamu</span>
                  </div>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    openCommandPalette();
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
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
                    <span>Pencarian Cepat</span>
                  </div>
                  <kbd className="kbd-badge" style={{ fontSize: '0.625rem', padding: '0.06rem 0.32rem' }}>
                    Ctrl K
                  </kbd>
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
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
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
