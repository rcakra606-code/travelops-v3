import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Map, Settings, X, Phone,
  FileText, Ship, Building, Clock, TrendingUp, Briefcase,
  ChevronDown, ChevronRight, Package, BarChart2, UserCheck, Compass, ExternalLink
} from 'lucide-react';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() => ({
    operations: true,
    analytics: ['/sales', '/corporate', '/productivity', '/overtime', '/staff-performance'].includes(location.pathname)
  }));

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const overviewItems = [
    { name: 'Home Overview', path: '/', icon: <LayoutDashboard size={17} /> },
    { name: 'Trip Calendar', path: '/calendar', icon: <Calendar size={17} /> }
  ];

  const operationsItems = [
    { name: 'Tours & Trips', path: '/tours', icon: <Map size={16} /> },
    { name: 'Hotel Stays', path: '/hotel', icon: <Building size={16} /> },
    { name: 'Cruise Voyages', path: '/cruise', icon: <Ship size={16} /> },
    { name: 'Visas & Documents', path: '/documents', icon: <FileText size={16} /> },
    { name: 'Travel SIM & eSIM', path: '/telecom', icon: <Phone size={16} /> }
  ];

  const analyticsItems = [
    { name: 'Sales & Goals', path: '/sales', icon: <TrendingUp size={16} /> },
    { name: 'Corporate Clients', path: '/corporate', icon: <Briefcase size={16} /> },
    { name: 'Daily Tasks', path: '/productivity', icon: <BarChart2 size={16} /> },
    { name: 'Team Overtime', path: '/overtime', icon: <Clock size={16} /> },
    { name: 'Team Highlights', path: '/staff-performance', icon: <UserCheck size={16} /> }
  ];

  const intelItems = [
    { name: 'Travel Guides & Tips', path: '/knowledge', icon: <Compass size={17} /> }
  ];

  const isAdmin = user?.role === 'Admin' || user?.email === 'admin@travelops.com';

  const adminItems = [
    { name: 'Team & Access', path: '/users', icon: <Users size={17} /> },
    { name: 'Workspace Settings', path: '/settings', icon: <Settings size={17} /> }
  ];

  const NavItemRender = ({ item, isSubItem = false }) => (
    <NavLink
      to={item.path}
      onClick={closeMobile}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      style={isSubItem ? { paddingLeft: '2.25rem', fontSize: '0.835rem' } : { fontSize: '0.865rem' }}
    >
      {item.icon}
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '1.15rem', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00b4ff 0%, #0066ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 168, 255, 0.35)',
              flexShrink: 0
            }}
          >
            <Compass size={20} strokeWidth={2.3} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                TravelOps
              </span>
              <span
                className="badge badge-primary"
                style={{ fontSize: '0.625rem', padding: '0.08rem 0.42rem' }}
              >
                PRO
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Travel Concierge Suite
            </p>
          </div>
        </div>

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
          aria-label="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav style={{ marginTop: '0.5rem', overflowY: 'auto', flex: 1, padding: '0 0.4rem 1rem' }}>
        {/* OVERVIEW SECTION */}
        <div style={{ marginBottom: '0.7rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Workspace
          </div>
          {overviewItems.map((item) => (
            <NavItemRender key={item.name} item={item} />
          ))}
        </div>

        {/* OPERATIONS SECTION */}
        <div style={{ marginBottom: '0.7rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Guest Services
          </div>
          <button
            type="button"
            className="nav-item"
            onClick={() => toggleGroup('operations')}
            style={{
              width: '100%',
              margin: '0.1rem 0',
              border: 'none',
              background: openGroups.operations ? 'var(--sage-subtle)' : 'transparent',
              cursor: 'pointer',
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={17} color="var(--primary)" />
              <span style={{ fontWeight: '600', fontSize: '0.865rem', color: 'var(--text-main)' }}>Bookings &amp; Trips</span>
            </div>
            {openGroups.operations ? (
              <ChevronDown size={14} color="var(--text-subtle)" />
            ) : (
              <ChevronRight size={14} color="var(--text-subtle)" />
            )}
          </button>

          {openGroups.operations && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.15rem' }}>
              {operationsItems.map((item) => (
                <NavItemRender key={item.name} item={item} isSubItem />
              ))}
            </div>
          )}
        </div>

        {/* ANALYTICS SECTION */}
        <div style={{ marginBottom: '0.7rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Insights &amp; Team
          </div>
          <button
            type="button"
            className="nav-item"
            onClick={() => toggleGroup('analytics')}
            style={{
              width: '100%',
              margin: '0.1rem 0',
              border: 'none',
              background: openGroups.analytics ? 'var(--sage-subtle)' : 'transparent',
              cursor: 'pointer',
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart2 size={17} color="var(--primary)" />
              <span style={{ fontWeight: '600', fontSize: '0.865rem', color: 'var(--text-main)' }}>Reports &amp; Team</span>
            </div>
            {openGroups.analytics ? (
              <ChevronDown size={14} color="var(--text-subtle)" />
            ) : (
              <ChevronRight size={14} color="var(--text-subtle)" />
            )}
          </button>

          {openGroups.analytics && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.15rem' }}>
              {analyticsItems.map((item) => (
                <NavItemRender key={item.name} item={item} isSubItem />
              ))}
            </div>
          )}
        </div>

        {/* KNOWLEDGE SECTION */}
        <div style={{ marginBottom: '0.7rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
            Resources
          </div>
          {intelItems.map((item) => (
            <NavItemRender key={item.name} item={item} />
          ))}
        </div>

        {/* ADMINISTRATION (Shown cleanly only to Admins — no intimidating red padlocks) */}
        {isAdmin && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.25rem' }}>
              Admin
            </div>
            {adminItems.map((item) => (
              <NavItemRender key={item.name} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Friendly Footer + Guest Tracker Shortcut */}
      <div
        style={{
          padding: '0.8rem 0.9rem',
          margin: '0.6rem',
          borderRadius: '14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.75rem'
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
          <span>Guest Status Tracker</span>
          <ExternalLink size={13} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="pulse-dot pulse-dot-green" />
            <span>All systems online</span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.7rem' }}>v3.4</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
