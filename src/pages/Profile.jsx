import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { Palette, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { useUsers } from '../context/UserContext';

const Profile = () => {
  const { user } = useAuth();
  const { updateUser } = useUsers();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // Profile form state
  const [personalData, setPersonalData] = useState({
    username: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Administrator'
  });

  // Security form state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handlePersonalChange = (e) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handlePersonalSave = (e) => {
    e.preventDefault();
    if (user?.id) {
      updateUser(user.id, { name: personalData.name, email: personalData.email });
      alert("Personal information updated!");
    }
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (user?.id) {
      updateUser(user.id, { password: securityData.newPassword });
      alert("Password updated!");
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const passwordChecks = {
    length: securityData.newPassword.length >= 8,
    capitalSmall: /[a-z]/.test(securityData.newPassword) && /[A-Z]/.test(securityData.newPassword),
    number: /[0-9]/.test(securityData.newPassword),
    symbol: /[^a-zA-Z0-9]/.test(securityData.newPassword)
  };

  const renderCheck = (isValid, text) => (
    <span style={{ 
      color: isValid ? 'var(--success)' : 'var(--text-muted)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.25rem',
      fontSize: '0.8rem'
    }}>
      {isValid ? <CheckCircle2 size={12} /> : <X size={12} />} {text}
    </span>
  );

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>

            {/* Avatar Section */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Avatar</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your profile picture</p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)'
                }}>
                  {personalData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RC'}
                </div>
                <button style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '-10px',
                  background: 'var(--surface-light)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)'
                }}>
                  <Palette size={14} />
                </button>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Personal Information</h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Change your identity information</p>
                  <button className="btn-primary" onClick={handlePersonalSave} style={{ padding: '0.5rem 2rem', fontWeight: 'bold', color: '#1e293b', background: '#eab308' }}>
                    Save
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={personalData.username} 
                      onChange={handlePersonalChange}
                      disabled
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={personalData.name} 
                      onChange={handlePersonalChange}
                      style={{ width: '100%' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={personalData.email} 
                      onChange={handlePersonalChange}
                      style={{ width: '100%', marginBottom: '0.5rem' }} 
                    />
                    <div style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={14} /> Email Provided
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Account Type</label>
                    <input 
                      type="text" 
                      value={personalData.role} 
                      disabled
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Security</h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your password</p>
                  <button className="btn-primary" onClick={handleSecuritySave} style={{ padding: '0.5rem 2rem', fontWeight: 'bold', color: '#1e293b', background: '#eab308' }}>
                    Save
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        name="currentPassword"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        placeholder="Enter current password"
                        style={{ width: '100%', paddingRight: '2.5rem' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>New Password</label>
                    <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        placeholder="Minimum 8 characters"
                        style={{ width: '100%', paddingRight: '2.5rem' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {renderCheck(passwordChecks.length, "8 Characters")}
                      {renderCheck(passwordChecks.capitalSmall, "Capital & Small")}
                      {renderCheck(passwordChecks.number, "Numbers")}
                      {renderCheck(passwordChecks.symbol, "Symbols")}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        placeholder="Re-type new password"
                        style={{ width: '100%', paddingRight: '4rem' }} 
                      />
                      <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {securityData.confirmPassword && securityData.newPassword === securityData.confirmPassword && (
                          <CheckCircle2 size={16} color="var(--success)" />
                        )}
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
