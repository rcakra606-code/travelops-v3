import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';
import { Save, Shield, Mail, Monitor, AlertTriangle, Send, Database, Download, Upload, Trash2, List, Activity, Users } from 'lucide-react';
import { logSystemAction } from '../utils/logger';

const Settings = () => {
  const { settings, updateSettings } = useSettings();
  const { user, forceLogoutAll } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('database');
  
  const [formData, setFormData] = useState({
    idleTimeout: settings.idleTimeout || 15,
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || '',
    smtpUser: settings.smtpUser || '',
    smtpPassword: settings.smtpPassword || '',
    enableReminders: settings.enableReminders ?? true,
    companyName: settings.companyName || 'TravelOps Inc.',
    currency: settings.currency || 'IDR',
    dateFormat: settings.dateFormat || 'YYYY-MM-DD',
    language: settings.language || 'en'
  });

  const [toastMessage, setToastMessage] = useState('');
  
  // Database & Logs State
  const [storageUsage, setStorageUsage] = useState({ bytes: 0, mb: '0.00', percent: 0 });
  const [systemLogs, setSystemLogs] = useState([]);
  const [wipeConfirm, setWipeConfirm] = useState('');
  
  useEffect(() => {
    calculateStorage();
    loadLogs();
  }, [activeTab]);

  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const calculateStorage = () => {
    let total = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    const maxStorage = 5 * 1024 * 1024; // 5MB standard limit
    setStorageUsage({
      bytes: total,
      mb: (total / (1024 * 1024)).toFixed(2),
      percent: Math.min(100, Math.round((total / maxStorage) * 100))
    });
  };

  const loadLogs = () => {
    const raw = localStorage.getItem('travelops_logs');
    setSystemLogs(raw ? JSON.parse(raw) : []);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({ ...formData, idleTimeout: Number(formData.idleTimeout) });
    setToastMessage('Settings successfully saved!');
    logSystemAction(user, 'Settings Updated', 'Global settings and preferences updated.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleTestEmail = () => {
    logSystemAction(user, 'SMTP Test', `Sent test email using host ${formData.smtpHost}`);
    alert(`Test email simulated successfully via ${formData.smtpHost}! Please check your console for details.`);
  };

  const handleExportDB = () => {
    const db = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('travelops_')) {
        db[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelOps_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    logSystemAction(user, 'Database Backup', 'Exported system database to JSON.');
  };

  const handleImportDB = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.confirm("WARNING! Importing a database will overwrite ALL existing data. Are you absolutely sure?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const db = JSON.parse(event.target.result);
        for (const key in db) {
          if (key.startsWith('travelops_')) {
            localStorage.setItem(key, db[key]);
          }
        }
        logSystemAction(user, 'Database Restore', 'Imported system database from JSON.');
        alert('Database imported successfully. The application will now reload.');
        window.location.reload();
      } catch (err) {
        alert('Failed to parse the backup file. Make sure it is a valid TravelOps backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    if (wipeConfirm !== 'CONFIRM') {
      alert("You must type CONFIRM in the text box below to proceed with the reset.");
      return;
    }
    
    // Wipe everything except users (to prevent lockout) and logs
    const keepUsers = localStorage.getItem('travelops_users');
    const keepLogs = localStorage.getItem('travelops_logs');
    const keepUser = localStorage.getItem('travelops_user');
    
    // Gather keys to delete
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('travelops_')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(k => localStorage.removeItem(k));
    
    // Restore essentials
    if (keepUsers) localStorage.setItem('travelops_users', keepUsers);
    if (keepLogs) localStorage.setItem('travelops_logs', keepLogs);
    if (keepUser) localStorage.setItem('travelops_user', keepUser);
    
    logSystemAction(user, 'Factory Reset', 'Wiped all operational data. Users and logs retained.');
    alert('Factory reset complete. The application will reload.');
    window.location.reload();
  };

  const handleForceLogoutAll = () => {
    if (window.confirm("This will disconnect ALL active users except you. Continue?")) {
      forceLogoutAll();
      logSystemAction(user, 'Force Logout All', 'Invalidated all active session tokens.');
      alert("All other sessions have been terminated.");
    }
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem' }}>System Settings</h1>
              <p style={{ color: '#94a3b8' }}>Configure security, automation, and system administration</p>
            </div>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
                <Database size={18} /> Database & System
              </button>
              <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                <List size={18} /> System Logs
              </button>
              <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                <Shield size={18} /> Security
              </button>
              <button className={`tab-btn ${activeTab === 'smtp' ? 'active' : ''}`} onClick={() => setActiveTab('smtp')}>
                <Mail size={18} /> SMTP & Automations
              </button>
              <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
                <Monitor size={18} /> Preferences
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* TAB: DATABASE & SYSTEM */}
              {activeTab === 'database' && (
                <div className="fade-in">
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={20} color="#3b82f6" /> Storage Health
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                      <span>Browser LocalStorage Usage</span>
                      <span>{storageUsage.mb} MB / ~5.00 MB ({storageUsage.percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${storageUsage.percent}%`, background: storageUsage.percent > 80 ? '#ef4444' : storageUsage.percent > 60 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease' }}></div>
                    </div>
                    {storageUsage.percent > 80 && (
                      <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.75rem' }}>Warning: Storage is nearly full. Please perform a backup and clean up old records.</p>
                    )}
                  </div>

                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Database size={20} color="#8b5cf6" /> Database Operations
                    </h3>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                      <button type="button" onClick={handleExportDB} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                        <Download size={18} /> Backup Database (JSON)
                      </button>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b98120', color: '#10b981', border: '1px solid #10b981', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                        <Upload size={18} /> Restore Database
                        <input type="file" accept=".json" onChange={handleImportDB} style={{ display: 'none' }} />
                      </label>
                    </div>

                    <div style={{ background: '#ef444415', border: '1px solid #ef444450', borderRadius: '8px', padding: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> Danger Zone</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>Factory reset will permanently wipe all tours, cruises, cashouts, and settings. User accounts and system logs will be retained.</p>
                      
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input 
                          type="text" 
                          placeholder="Type CONFIRM" 
                          value={wipeConfirm} 
                          onChange={(e) => setWipeConfirm(e.target.value)}
                          style={{ background: '#0f172a', border: '1px solid #ef4444', color: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '6px', outline: 'none' }} 
                        />
                        <button type="button" onClick={handleFactoryReset} disabled={wipeConfirm !== 'CONFIRM'} style={{ background: wipeConfirm === 'CONFIRM' ? '#ef4444' : '#334155', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', cursor: wipeConfirm === 'CONFIRM' ? 'pointer' : 'not-allowed', fontWeight: '500' }}>
                          <Trash2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Wipe Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SYSTEM LOGS */}
              {activeTab === 'logs' && (
                <div className="card fade-in" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={20} color="#f59e0b" /> Audit Trail
                    </h3>
                    <button type="button" onClick={loadLogs} style={{ background: '#334155', border: 'none', color: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Refresh</button>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '500' }}>Timestamp</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '500' }}>User</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '500' }}>Action</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '500' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#3b82f6' }}>{log.user}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#f8fafc' }}>{log.action}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{log.details}</td>
                        </tr>
                      ))}
                      {systemLogs.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No system logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <div className="card fade-in" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} color="#3b82f6" /> Auto-Logout Configuration
                  </h3>
                  
                  <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Idle Timeout (Minutes)</label>
                    <select 
                      value={formData.idleTimeout} 
                      onChange={e => setFormData({...formData, idleTimeout: e.target.value})}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>

                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="#ef4444" /> Active Sessions Control
                  </h3>
                  <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.4' }}>
                      In case of an emergency, you can invalidate all active sessions. This will immediately force all other users currently logged into TravelOps to be logged out. Your current session will remain active.
                    </p>
                    <button type="button" onClick={handleForceLogoutAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                      <AlertTriangle size={16} /> Force Logout All Users
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: SMTP */}
              {activeTab === 'smtp' && (
                <div className="card fade-in" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={20} color="#10b981" /> SMTP Email Server
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>SMTP Host</label>
                      <input type="text" value={formData.smtpHost} onChange={e => setFormData({...formData, smtpHost: e.target.value})} placeholder="smtp.gmail.com" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>SMTP Port</label>
                      <input type="text" value={formData.smtpPort} onChange={e => setFormData({...formData, smtpPort: e.target.value})} placeholder="587" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>SMTP Username / Email</label>
                      <input type="email" value={formData.smtpUser} onChange={e => setFormData({...formData, smtpUser: e.target.value})} placeholder="admin@travelops.com" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>SMTP Password / App Password</label>
                      <input type="password" value={formData.smtpPassword} onChange={e => setFormData({...formData, smtpPassword: e.target.value})} placeholder="••••••••" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                  </div>

                  <h3 style={{ margin: '2rem 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Automated Reminders</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#cbd5e1' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.enableReminders}
                      onChange={e => setFormData({...formData, enableReminders: e.target.checked})}
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: '#3b82f6' }} 
                    />
                    Enable automated email reminders for Tours & Cruises
                  </label>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '1.7rem' }}>
                    Reminders will be sent 30, 15, 7, 5, 3, 2, 1 days before departure, on departure day, and on return day.
                  </p>

                  <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>SMTP Testing Module</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>Click the button below to verify your SMTP connection by sending a simulated test email.</p>
                    <button type="button" onClick={handleTestEmail} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: '#10b981', border: '1px solid #10b981', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                      <Send size={16} /> Send Test Email
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: PREFERENCES */}
              {activeTab === 'preferences' && (
                <div className="card fade-in" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Monitor size={20} color="#8b5cf6" /> System Preferences
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Company Name</label>
                      <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="TravelOps Inc." style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>System Language</label>
                      <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="en">English</option>
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Default Currency</label>
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="SGD">SGD - Singapore Dollar (S$)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Date Format</label>
                      <select value={formData.dateFormat} onChange={e => setFormData({...formData, dateFormat: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE BUTTON FOR TABS THAT USE IT */}
              {['security', 'smtp', 'preferences'].includes(activeTab) && (
                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    <Save size={18} /> Save Settings
                  </button>
                  {toastMessage && <span style={{ color: '#10b981', fontWeight: '500' }}>{toastMessage}</span>}
                </div>
              )}
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
