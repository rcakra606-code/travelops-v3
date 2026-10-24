import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, Users, Map, Settings, Plane, X, UserCog, 
  FileText, Ship, Building, Clock, TrendingUp, Briefcase, 
  ChevronDown, ChevronRight, Package, BarChart2, UserCheck, Lock, Compass, Shield
} from 'lucide-react';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({
    operations: true,
    analytics: true
  });

  // Automatically expand group if a child route is active
  useEffect(() => {
    const p = location.pathname;
    if (['/tours', '/hotel', '/cruise', '/documents', '/telecom'].includes(p)) {
      setOpenGroups(prev => ({ ...prev, operations: true }));
    }
    if (['/sales', '/corporate', '/productivity', '/overtime', '/staff-performance'].includes(p)) {
      setOpenGroups(prev => ({ ...prev, analytics: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const overviewItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={17} /> },
    { name: 'Master Calendar', path: '/calendar', icon: <Calendar size={17} /> },
  ];

  const operationsItems = [
    { name: 'Tours & Groups', path: '/tours', icon: <Map size={16} /> },
    { name: 'Hotels', path: '/hotel', icon: <Building size={16} /> },
    { name: 'Cruises', path: '/cruise', icon: <Ship size={16} /> },
    { name: 'Documents & Visas', path: '/documents', icon: <FileText size={16} /> },
    { name: 'Telecom & SIM', path: '/telecom', icon: <UserCog size={16} /> },
  ];

  const analyticsItems = [
    { name: 'Sales & Targets', path: '/sales', icon: <TrendingUp size={16} /> },
    { name: 'Corporate Accounts', path: '/corporate', icon: <Briefcase size={16} /> },
    { name: 'Productivity', path: '/productivity', icon: <BarChart2 size={16} /> },
    { name: 'Staff Overtime', path: '/overtime', icon: <Clock size={16} /> },
    { name: 'Staff Performance', path: '/staff-performance', icon: <UserCheck size={16} /> },
  ];

  const intelItems = [
    { name: 'Destination Intel', path: '/knowledge', icon: <Compass size={17} /> },
  ];

  const isAdmin = user?.role === 'Admin' || user?.email === 'admin@travelops.com';

  const adminItems = [
    { name: 'User Management', path: '/users', icon: <Users size={17} />, locked: !isAdmin },
    { name: 'System Settings', path: '/settings', icon: <Settings size={17} />, locked: !isAdmin },
  ];

  const NavItemRender = ({ item, isSubItem = false }) => {
    if (item.locked) {
      return (
        <div 
          className="nav-item" 
          style={{ 
            opacity: 0.45, 
            cursor: 'not-allowed', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: isSubItem ? '0.8125rem' : '0.85rem',
            paddingLeft: isSubItem ? '2.25rem' : '0.85rem'
          }}
          title="Requires Administrator privileges"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {item.icon}
            <span>{item.name}</span>
          </div>
          <Lock size={12} color="#f87171" />
        </div>
      );
    }
    
    return (
      <NavLink
        to={item.path}
        onClick={closeMobile}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        style={isSubItem ? { paddingLeft: '2.25rem', fontSize: '0.8125rem' } : { fontSize: '0.85rem' }}
      >
        {item.icon}
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '1.15rem 1.15rem', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'var(--sage-light, #e6efe7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary, #476b52)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(71, 107, 82, 0.08)',
            flexShrink: 0
          }}>
            <Compass size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontWeight: '700', fontSize: '1.025rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                TravelOps
              </span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: '700',
                padding: '0.08rem 0.35rem',
                borderRadius: '9999px',
                background: 'var(--sage-subtle, #edf2eb)',
                color: 'var(--primary, #476b52)',
                letterSpacing: '0.04em'
              }}>
                PRO
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.675rem', color: 'var(--text-subtle)', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              OPERASIONAL
            </p>
          </div>
        </div>

        {window.innerWidth <= 768 && (
          <button 
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
        )}
      </div>
      
      {/* Navigation Sections */}
      <nav style={{ marginTop: '0.5rem', overflowY: 'auto', flex: 1, padding: '0 0.4rem 1rem' }}>
        
        {/* OVERVIEW SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.2rem' }}>Overview</div>
          {overviewItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>

        {/* OPERATIONS SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.2rem' }}>Operations</div>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('operations')}
            style={{ 
              width: '100%', 
              margin: '0.1rem 0',
              border: 'none', 
              background: openGroups.operations ? 'rgba(255, 255, 255, 0.02)' : 'transparent', 
              cursor: 'pointer', 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={17} color="var(--primary)" />
              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Operations Hub</span>
            </div>
            {openGroups.operations ? <ChevronDown size={14} color="var(--text-subtle)" /> : <ChevronRight size={14} color="var(--text-subtle)" />}
          </button>
          
          {openGroups.operations && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.1rem' }}>
              {operationsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        {/* ANALYTICS SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.2rem' }}>Intelligence</div>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('analytics')}
            style={{ 
              width: '100%', 
              margin: '0.1rem 0',
              border: 'none', 
              background: openGroups.analytics ? 'rgba(255, 255, 255, 0.02)' : 'transparent', 
              cursor: 'pointer', 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart2 size={17} color="var(--accent-indigo)" />
              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Analytics & Reports</span>
            </div>
            {openGroups.analytics ? <ChevronDown size={14} color="var(--text-subtle)" /> : <ChevronRight size={14} color="var(--text-subtle)" />}
          </button>
          
          {openGroups.analytics && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.1rem' }}>
              {analyticsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        {/* KNOWLEDGE SECTION */}
        <div style={{ marginBottom: '0.65rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.2rem' }}>Knowledge</div>
          {intelItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>

        {/* ADMINISTRATION */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div className="sidebar-category-title" style={{ padding: '0.4rem 0.75rem 0.2rem' }}>System</div>
          {adminItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>
      </nav>

      {/* Clean Footer Status */}
      <div style={{
        padding: '0.75rem 0.85rem',
        margin: '0.5rem',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        fontSize: '0.725rem',
        color: 'var(--text-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span 
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success, #5d8465)', display: 'inline-block' }}
            />
            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Sistem Operasional</span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.675rem' }}>v3.4</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.68rem', lineHeight: '1.4', color: 'var(--text-subtle)' }}>
          Ruang kerja yang lebih tenang untuk perjalanan yang lebih lancar.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
