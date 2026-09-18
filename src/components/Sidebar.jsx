import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, Users, Map, Settings, Plane, X, UserCog, 
  FileText, Ship, Building, Clock, TrendingUp, Briefcase, Wallet, 
  ChevronDown, ChevronRight, Package, BarChart2, UserCheck, Lock, Sparkles, Shield, Compass
} from 'lucide-react';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({
    operations: false,
    analytics: false
  });

  // Automatically open group if a child is active
  useEffect(() => {
    const currentPath = location.pathname;
    if (['/calendar', '/tours', '/knowledge', '/hotel', '/cruise', '/documents', '/telecom'].includes(currentPath)) {
      setOpenGroups(prev => ({ ...prev, operations: true }));
    }
    if (['/sales', '/productivity', '/corporate', '/overtime', '/staff-performance'].includes(currentPath)) {
      setOpenGroups(prev => ({ ...prev, analytics: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const topItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
  ];

  const operationsItems = [
    { name: 'Master Calendar', path: '/calendar', icon: <Calendar size={18} /> },
    { name: 'Tours', path: '/tours', icon: <Map size={18} /> },
    { name: 'Destination Intel', path: '/knowledge', icon: <Compass size={18} /> },
    { name: 'Hotels', path: '/hotel', icon: <Building size={18} /> },
    { name: 'Cruises', path: '/cruise', icon: <Ship size={18} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={18} /> },
    { name: 'Telecom & SIM', path: '/telecom', icon: <UserCog size={18} /> },
  ];

  const analyticsItems = [
    { name: 'Sales & Targets', path: '/sales', icon: <Calendar size={18} /> },
    { name: 'Productivity', path: '/productivity', icon: <TrendingUp size={18} /> },
    { name: 'Corporate Accounts', path: '/corporate', icon: <Briefcase size={18} /> },
    { name: 'Overtime Logs', path: '/overtime', icon: <Clock size={18} /> },
    { name: 'Staff Performance', path: '/staff-performance', icon: <UserCheck size={18} /> },
  ];

  const isAdmin = user?.role === 'Admin' || user?.email === 'admin@travelops.com';

  const bottomItems = [
    { name: 'User Management', path: '/users', icon: <Users size={18} />, locked: !isAdmin },
    { name: 'System Settings', path: '/settings', icon: <Settings size={18} />, locked: !isAdmin },
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
            fontSize: isSubItem ? '0.8125rem' : '0.875rem',
            paddingLeft: isSubItem ? '2.5rem' : '1rem'
          }}
          title="Requires Administrator privileges"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {item.icon}
            <span>{item.name}</span>
          </div>
          <Lock size={13} color="#f87171" />
        </div>
      );
    }
    
    return (
      <NavLink
        to={item.path}
        onClick={closeMobile}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        style={isSubItem ? { paddingLeft: '2.5rem', fontSize: '0.8125rem' } : {}}
      >
        {item.icon}
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Plane size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                TravelOps
              </span>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: '700',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                letterSpacing: '0.04em'
              }}>
                v3.0 PRO
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: '500' }}>
              Operations Suite
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
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Navigation Links */}
      <nav style={{ marginTop: '0.75rem', overflowY: 'auto', flex: 1, paddingBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          {topItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>

        {/* OPERATIONS GROUP */}
        <div style={{ marginTop: '0.75rem' }}>
          <div className="sidebar-category-title">Operations</div>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('operations')}
            style={{ 
              width: 'calc(100% - 1.3rem)', 
              border: 'none', 
              background: openGroups.operations ? 'rgba(255, 255, 255, 0.03)' : 'transparent', 
              cursor: 'pointer', 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Package size={18} color="var(--primary)" />
              <span style={{ fontWeight: '600' }}>Operations Core</span>
            </div>
            {isOpen && (openGroups.operations ? <ChevronDown size={15} color="var(--text-subtle)" /> : <ChevronRight size={15} color="var(--text-subtle)" />)}
          </button>
          
          {isOpen && openGroups.operations && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem' }}>
              {operationsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        {/* ANALYTICS GROUP */}
        <div style={{ marginTop: '0.75rem' }}>
          <div className="sidebar-category-title">Intelligence</div>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('analytics')}
            style={{ 
              width: 'calc(100% - 1.3rem)', 
              border: 'none', 
              background: openGroups.analytics ? 'rgba(255, 255, 255, 0.03)' : 'transparent', 
              cursor: 'pointer', 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <BarChart2 size={18} color="var(--accent-indigo)" />
              <span style={{ fontWeight: '600' }}>Analytics & Reports</span>
            </div>
            {isOpen && (openGroups.analytics ? <ChevronDown size={15} color="var(--text-subtle)" /> : <ChevronRight size={15} color="var(--text-subtle)" />)}
          </button>
          
          {isOpen && openGroups.analytics && (
            <div className="sub-menu fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem' }}>
              {analyticsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        {/* SYSTEM MANAGEMENT */}
        <div style={{ marginTop: '0.75rem' }}>
          <div className="sidebar-category-title">Management</div>
          {bottomItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>
      </nav>

      {/* User Status Card at Bottom */}
      <div style={{
        padding: '0.75rem 0.85rem',
        margin: '0.5rem',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.8125rem', fontWeight: '700' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
            </div>
            <span 
              className="pulse-dot pulse-dot-green" 
              style={{ position: 'absolute', bottom: '-1px', right: '-1px', border: '1.5px solid var(--bg-surface)' }}
              title="Online"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <p 
              title={user?.name || user?.email || 'Staff Member'}
              style={{ 
                margin: 0, 
                fontSize: '0.8125rem', 
                fontWeight: '700', 
                color: 'var(--text-main)', 
                whiteSpace: 'nowrap', 
                textOverflow: 'ellipsis', 
                overflow: 'hidden',
                lineHeight: '1.3'
              }}
            >
              {user?.name || user?.email?.split('@')[0] || 'Staff Member'}
            </p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: '500', lineHeight: '1.2' }}>
              {user?.role || 'Operator'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div style={{ flexShrink: 0 }}>
            <Shield size={15} color="var(--primary)" title="Administrator" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
