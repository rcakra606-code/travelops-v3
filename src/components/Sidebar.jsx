import { useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTours } from '../context/TourContext';
import { useDocuments } from '../context/DocumentContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  LayoutDashboard, Calendar, Users, Map, Settings, X, Phone,
  FileText, Ship, Building, Clock, TrendingUp, Briefcase,
  ChevronDown, ChevronRight, BarChart2, UserCheck, Compass, ExternalLink,
  PanelLeftClose, PanelLeftOpen, WifiOff, ClipboardList, PieChart, Plane
} from 'lucide-react';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const { tours } = useTours();
  const { documents } = useDocuments();
  const { overtimes } = useOvertimes();
  const { isOnline } = useNetworkStatus();
  const location = useLocation();

  const [isMiniRail, setIsMiniRail] = useState(() => {
    try {
      return localStorage.getItem('travelops_sidebar_mini_rail') === 'true';
    } catch {
      return false;
    }
  });

  const [openGroups, setOpenGroups] = useState(() => ({
    operations: true,
    analytics: ['/sales', '/corporate', '/productivity', '/overtime', '/staff-performance'].includes(location.pathname)
  }));

  const toggleMiniRail = () => {
    setIsMiniRail((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('travelops_sidebar_mini_rail', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const isAdmin = user?.role === 'Admin' || user?.email === 'admin@travelops.com';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';

  // Live Operational Action Counter Badges
  const badges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const myName = (user?.name || '').trim().toLowerCase();

    // Tours needing follow-up (uninvoiced, balance due H-14, or Series MDR unclaimed)
    let tourUrgent = 0;
    (tours || []).forEach((t) => {
      if (t.status === 'Cancel' || t.status === 'Cancelled' || t.status === 'Past Date') return;
      if (isStaff && myName && (t.staffName || '').trim().toLowerCase() !== myName) return;

      const fin = t.financials || {};
      const omset = Number(fin.totalSellingPrice ?? fin.totalOmset ?? 0);
      const dep = Number(fin.depositAmount || 0);
      const sisa = Math.max(0, omset - dep);
      const hasInv = Boolean(fin.invoiceNumber && String(fin.invoiceNumber).trim() !== '');
      const depDate = t.departureDate ? new Date(t.departureDate) : null;
      const diff = depDate && !Number.isNaN(depDate.getTime())
        ? Math.ceil((depDate.setHours(0, 0, 0, 0) - today) / (1000 * 60 * 60 * 24))
        : 999;

      if ((sisa > 0 && diff <= 14) || (!hasInv && diff <= 21)) {
        tourUrgent += 1;
      }
    });

    // Documents / Visa urgent appointments (H-7)
    let docUrgent = 0;
    (documents || []).forEach((d) => {
      if (d.shippingStatus === 'Received' || d.shippingStatus === 'Cancelled') return;
      if (isStaff && myName && (d.staff || '').trim().toLowerCase() !== myName) return;
      if (d.appointmentDate) {
        const appDate = new Date(d.appointmentDate);
        if (!Number.isNaN(appDate.getTime())) {
          const diff = Math.ceil((appDate.setHours(0, 0, 0, 0) - today) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= 7) docUrgent += 1;
        }
      }
    });

    // Overtime pending approvals (shown for Admin/Manager)
    let overtimePending = 0;
    if (isAdmin || isManager) {
      overtimePending = (overtimes || []).filter(
        (o) => (o.status || '').toLowerCase() === 'pending'
      ).length;
    }

    return { tourUrgent, docUrgent, overtimePending };
  }, [tours, documents, overtimes, isStaff, isAdmin, isManager, user?.name]);

  const overviewItems = [
    { name: 'Beranda', path: '/', icon: <LayoutDashboard size={17} /> },
    { name: 'Executive BI', path: '/executive-bi', icon: <PieChart size={17} /> },
    { name: 'Kalender Trip', path: '/calendar', icon: <Calendar size={17} /> }
  ];

  const operationsItems = [
    {
      name: 'Tour & Perjalanan',
      path: '/tours',
      icon: <Map size={16} />,
      badge: badges.tourUrgent,
      badgeTone: 'urgent'
    },
    { name: 'Form Pendaftaran Tour', path: '/tour-registration-form', icon: <ClipboardList size={16} /> },
    { name: 'Form Pemesanan Tiket', path: '/flight-booking-form', icon: <Plane size={16} /> },
    { name: 'Reservasi Hotel', path: '/hotel', icon: <Building size={16} /> },
    { name: 'Pelayaran Cruise', path: '/cruise', icon: <Ship size={16} /> },
    {
      name: 'Visa & Dokumen',
      path: '/documents',
      icon: <FileText size={16} />,
      badge: badges.docUrgent,
      badgeTone: 'warning'
    },
    { name: 'SIM, eSIM & WiFi', path: '/telecom', icon: <Phone size={16} /> }
  ];

  const analyticsItems = [
    { name: 'Penjualan & Target', path: '/sales', icon: <TrendingUp size={16} /> },
    { name: 'Klien Korporasi', path: '/corporate', icon: <Briefcase size={16} /> },
    { name: 'Produktivitas & P&L', path: '/productivity', icon: <BarChart2 size={16} /> },
    {
      name: 'Log Lembur Tim',
      path: '/overtime',
      icon: <Clock size={16} />,
      badge: badges.overtimePending,
      badgeTone: 'warning'
    },
    { name: 'Performa Konsultan', path: '/staff-performance', icon: <UserCheck size={16} /> }
  ];

  const intelItems = [
    { name: 'Panduan & Tips', path: '/knowledge', icon: <Compass size={17} /> },
    { name: 'Panduan Cruise', path: '/cruise-guide', icon: <Ship size={17} /> }
  ];

  const adminItems = [
    { name: 'Tim & Hak Akses', path: '/users', icon: <Users size={17} /> },
    { name: 'Pengaturan Sistem', path: '/settings', icon: <Settings size={17} /> }
  ];

  const NavItemRender = ({ item, isSubItem = false }) => (
    <NavLink
      to={item.path}
      onClick={closeMobile}
      title={isMiniRail ? `${item.name}${item.badge > 0 ? ` (${item.badge})` : ''}` : undefined}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      style={
        isSubItem && !isMiniRail
          ? { paddingLeft: '2.15rem', fontSize: '0.83rem' }
          : { fontSize: '0.855rem' }
      }
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>
      <span className="sidebar-item-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.name}
      </span>
      {item.badge > 0 && (
        <span
          className={`sidebar-badge ${item.badgeTone === 'urgent' ? 'sidebar-badge-urgent' : 'sidebar-badge-warning'}`}
          title={`${item.badge} item perlu tindak lanjut`}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'} ${isMiniRail ? 'mini-rail' : ''}`}>
      {/* Brand Header (60px exact alignment with TopNav) */}
      <div className="sidebar-header" style={{ padding: '0 1.05rem', height: '60px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div
            onClick={isMiniRail ? toggleMiniRail : undefined}
            title={isMiniRail ? 'Perluas Sidebar' : 'TravelOps'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-deep)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              cursor: isMiniRail ? 'pointer' : 'default'
            }}
          >
            <Compass size={17} strokeWidth={2.2} />
          </div>
          <div className="sidebar-brand-text" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  letterSpacing: '-0.025em',
                  color: 'var(--text-main)'
                }}
              >
                TravelOps
              </span>
              <span
                className="bi-micro-badge font-mono"
                style={{ fontSize: '0.62rem', padding: '0.04rem 0.34rem', lineHeight: 1.3 }}
              >
                V4
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.69rem', color: 'var(--text-subtle)', fontWeight: '500', lineHeight: 1.2 }}>
              Operations Suite
            </p>
          </div>
        </div>

        {/* Desktop Mini-Rail Collapse Button */}
        {!isMiniRail && (
          <button
            type="button"
            className="desktop-only"
            onClick={toggleMiniRail}
            title="Mode Sidebar Ringkas (Ruang Tabel Lebih Luas)"
            aria-label="Ringkaskan Sidebar"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PanelLeftClose size={16} />
          </button>
        )}

        <button
          type="button"
          className="mobile-only"
          onClick={closeMobile}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Tutup Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Expand button when collapsed into Mini-Rail */}
      {isMiniRail && (
        <div className="desktop-only" style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0 0.2rem' }}>
          <button
            type="button"
            onClick={toggleMiniRail}
            title="Perluas Sidebar"
            aria-label="Perluas Sidebar"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--primary)',
              cursor: 'pointer',
              width: '36px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PanelLeftOpen size={15} />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav aria-label="Navigasi Utama" style={{ marginTop: '0.4rem', overflowY: 'auto', flex: 1, padding: '0 0.4rem 1rem' }}>
        {/* OVERVIEW SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Workspace
          </div>
          {overviewItems.map((item) => (
            <NavItemRender key={item.path} item={item} />
          ))}
        </div>

        {/* OPERATIONS SECTION (Single Collapsible Section Header — No Double Heading) */}
        <div style={{ marginBottom: '0.55rem' }}>
          <button
            type="button"
            className="sidebar-category-title sidebar-group-toggle"
            aria-expanded={openGroups.operations}
            onClick={() => toggleGroup('operations')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.42rem 0.75rem 0.3rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>Layanan Tamu</span>
            {openGroups.operations ? (
              <ChevronDown size={13} color="var(--text-subtle)" />
            ) : (
              <ChevronRight size={13} color="var(--text-subtle)" />
            )}
          </button>

          {(openGroups.operations || isMiniRail) && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
              {operationsItems.map((item) => (
                <NavItemRender key={item.path} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* ANALYTICS SECTION (Single Collapsible Section Header) */}
        <div style={{ marginBottom: '0.55rem' }}>
          <button
            type="button"
            className="sidebar-category-title sidebar-group-toggle"
            aria-expanded={openGroups.analytics}
            onClick={() => toggleGroup('analytics')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.42rem 0.75rem 0.3rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>Laporan &amp; Tim</span>
            {openGroups.analytics ? (
              <ChevronDown size={13} color="var(--text-subtle)" />
            ) : (
              <ChevronRight size={13} color="var(--text-subtle)" />
            )}
          </button>

          {(openGroups.analytics || isMiniRail) && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
              {analyticsItems.map((item) => (
                <NavItemRender key={item.path} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* KNOWLEDGE SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Referensi
          </div>
          {intelItems.map((item) => (
            <NavItemRender key={item.path} item={item} />
          ))}
        </div>

        {/* ADMINISTRATION */}
        {isAdmin && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
              Admin
            </div>
            {adminItems.map((item) => (
              <NavItemRender key={item.path} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer: Guest Tracker Shortcut + Real Network Status */}
      {isMiniRail ? (
        <div
          className="desktop-only"
          style={{
            padding: '0.65rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          <Link
            to="/track"
            target="_blank"
            rel="noopener noreferrer"
            title="Portal Status Tamu"
            style={{ color: 'var(--primary)', display: 'flex' }}
          >
            <ExternalLink size={16} />
          </Link>
          <span
            title={isOnline ? 'Online • Live Sync Aktif' : 'Offline — Tidak Ada Koneksi'}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isOnline ? '#10b981' : '#f43f5e',
              boxShadow: isOnline ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(244,63,94,0.6)'
            }}
          />
        </div>
      ) : (
        <div
          className="sidebar-footer-expanded"
          style={{
            padding: '0.68rem 0.82rem',
            margin: '0.55rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: `1px solid ${isOnline ? 'var(--border)' : 'rgba(244, 63, 94, 0.45)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.42rem',
            fontSize: '0.74rem'
          }}
        >
          <Link
            to="/track"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.78rem'
            }}
          >
            <span>Portal Status Tamu</span>
            <ExternalLink size={13} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isOnline ? 'var(--text-subtle)' : 'var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isOnline ? (
                <span className="pulse-dot pulse-dot-green" />
              ) : (
                <WifiOff size={12} color="var(--danger)" />
              )}
              <span style={{ fontWeight: isOnline ? 500 : 700 }}>
                {isOnline ? 'Online • Live Sync' : 'Offline — Cek Koneksi'}
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>V4.1</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
