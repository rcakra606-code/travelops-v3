import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, Users, Map, Settings, Plane, X, UserCog, 
  FileText, Ship, Building, Clock, TrendingUp, Briefcase, Wallet, 
  ChevronDown, ChevronRight, Package, BarChart2, UserCheck
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
    if (['/tours', '/hotel', '/cruise', '/documents', '/telecom'].includes(currentPath)) {
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
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  ];

  const operationsItems = [
    { name: 'Tours', path: '/tours', icon: <Map size={20} /> },
    { name: 'Hotel', path: '/hotel', icon: <Building size={20} /> },
    { name: 'Cruise', path: '/cruise', icon: <Ship size={20} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
    { name: 'Telecom', path: '/telecom', icon: <UserCog size={20} /> },
  ];

  const analyticsItems = [
    { name: 'Sales & Targets', path: '/sales', icon: <Calendar size={20} /> },
    { name: 'Productivity', path: '/productivity', icon: <TrendingUp size={20} /> },
    { name: 'Corporate', path: '/corporate', icon: <Briefcase size={20} /> },
    { name: 'Overtime', path: '/overtime', icon: <Clock size={20} /> },
    { name: 'Staff Performance', path: '/staff-performance', icon: <UserCheck size={20} /> },
  ];

  const bottomItems = [
    { name: 'Cashout', path: '/cashout', icon: <Wallet size={20} /> },
    ...(user?.role === 'Admin' || user?.email === 'admin@travelops.com' ? [
      { name: 'User Management', path: '/users', icon: <UserCog size={20} /> },
      { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ] : [])
  ];

  const NavItemRender = ({ item, isSubItem = false }) => (
    <NavLink
      to={item.path}
      onClick={closeMobile}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      style={isSubItem ? { paddingLeft: '3rem', fontSize: '0.85rem' } : {}}
    >
      {item.icon}
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Plane size={28} className="brand-icon" />
          <span>TravelOps</span>
        </div>
        {window.innerWidth <= 768 && (
          <button onClick={closeMobile} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        )}
      </div>
      
      <nav style={{ marginTop: '1rem', overflowY: 'auto', flex: 1, paddingBottom: '2rem' }}>
        {topItems.map(item => <NavItemRender key={item.name} item={item} />)}

        {/* OPERATIONS GROUP */}
        <div style={{ marginTop: '0.5rem' }}>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('operations')}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', justifyContent: 'space-between' }}
            title="Operations"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Package size={20} color="#94a3b8" />
              <span>Operations</span>
            </div>
            {isOpen && (openGroups.operations ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>
          
          {isOpen && openGroups.operations && (
            <div className="sub-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              {operationsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        {/* ANALYTICS GROUP */}
        <div style={{ marginTop: '0.5rem' }}>
          <button 
            className="nav-item" 
            onClick={() => toggleGroup('analytics')}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', justifyContent: 'space-between' }}
            title="Analytics"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <BarChart2 size={20} color="#94a3b8" />
              <span>Analytics</span>
            </div>
            {isOpen && (openGroups.analytics ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>
          
          {isOpen && openGroups.analytics && (
            <div className="sub-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              {analyticsItems.map(item => <NavItemRender key={item.name} item={item} isSubItem={true} />)}
            </div>
          )}
        </div>

        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          {bottomItems.map(item => <NavItemRender key={item.name} item={item} />)}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
