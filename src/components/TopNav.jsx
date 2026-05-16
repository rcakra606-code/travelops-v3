import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Search, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>

      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
        
        <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.name || 'Admin'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'Administrator'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', marginLeft: '0.5rem' }} title="Logout">
          <LogOut size={18} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default TopNav;
