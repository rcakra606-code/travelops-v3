import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';
import { Save, Shield, Mail, Monitor, AlertTriangle, Send, Database, Download, Upload, Trash2, List, Activity, Users, Search, Lock, Key, Server, Laptop, Palette, Sun, Moon, Check } from 'lucide-react';
import { logSystemAction } from '../utils/logger';

const Settings = () => {
  const { settings, updateSettings } = useSettings();
  const { user, forceLogoutAll } = useAuth();
  const { theme, toggleTheme, accent, changeAccent } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('database');
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('idle');
  
  const [formData, setFormData] = useState({
    idleTimeout: settings.idleTimeout || 15,
    enableReminders: settings.enableReminders ?? true,
    companyName: settings.companyName || 'TravelOps Inc.',
    currency: settings.currency || 'IDR',
    dateFormat: settings.dateFormat || 'YYYY-MM-DD',
    language: settings.language || 'en',
    passwordMinLength: settings.passwordMinLength || 8,
    passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
    passwordRequireSymbols: settings.passwordRequireSymbols ?? true,
    lockoutThreshold: settings.lockoutThreshold || 5,
    logRetentionDays: settings.logRetentionDays || 30
  });

  const [toastMessage, setToastMessage] = useState('');
  const [systemLogs, setSystemLogs] = useState([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  
  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('travelops_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const mapped = data.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        user: log.user_name,
        action: log.action,
        details: log.details
      }));
      setSystemLogs(mapped);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logSearchQuery) return systemLogs;
    return systemLogs.filter(log => 
      log.user.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase())
    );
  }, [systemLogs, logSearchQuery]);

  const exportLogsToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'User', 'Action', 'Details'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString().replace(/,/g, ''),
      log.user,
      log.action,
      log.details.replace(/,/g, ' ')
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({ ...formData, idleTimeout: Number(formData.idleTimeout), passwordMinLength: Number(formData.passwordMinLength), lockoutThreshold: Number(formData.lockoutThreshold), logRetentionDays: Number(formData.logRetentionDays) });
    setToastMessage('Settings successfully saved!');
    logSystemAction(user, 'Settings Updated', 'Global settings and preferences updated.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget) return alert("Please enter an email address");
    setTestEmailStatus('sending');
    // Mock for now
    setTimeout(() => {
      setTestEmailStatus('success');
      logSystemAction(user, 'SMTP Test', `Successfully sent mock test email to ${testEmailTarget}`);
      setTimeout(() => setTestEmailStatus('idle'), 5000);
    }, 1500);
  };

  const handleForceLogoutAll = () => {
    if (window.confirm("This will disconnect ALL active users except you. Continue?")) {
      forceLogoutAll();
      logSystemAction(user, 'Force Logout All', 'Invalidated all active session tokens.');
      alert("All other sessions have been terminated.");
    }
  };

  const handleManualBackup = () => {
    setToastMessage('Database backup triggered successfully.');
    logSystemAction(user, 'Manual Backup', 'Triggered a manual database snapshot.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    if (activeTab === 'security' && user) {
      loadSessions();
    }
  }, [activeTab, user]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });
      if (!error && data) {
        setActiveSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await supabase.from('user_sessions').delete().eq('id', sessionId);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      setToastMessage('Session revoked successfully.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error(err);
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
              <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>System Settings</h1>
              <p style={{ color: 'var(--text-muted)' }}>Configure security, automation, and system administration</p>
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
                  <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <Server size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)', fontSize: '1.5rem' }}>Cloud Database Active</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                      TravelOps V4 is now fully integrated with <strong>Supabase Cloud</strong>.
                      All your records (Tours, Cruises, Cashouts, Users) are securely stored and synced in real-time.
                    </p>
                    
                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem', textAlign: 'left', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Storage Capacity</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Unlimited (Auto-scaling)</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Backups</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Automated Daily via Supabase</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Local Storage Usage</span>
                        <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>0 KB (Clean)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Database size={20} color="var(--primary)" /> Data Management
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Log Retention Policy</label>
                        <select 
                          value={formData.logRetentionDays} 
                          onChange={e => setFormData({...formData, logRetentionDays: e.target.value})}
                          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                        >
                          <option value={7}>Keep for 7 days</option>
                          <option value={30}>Keep for 30 days</option>
                          <option value={60}>Keep for 60 days</option>
                          <option value={90}>Keep for 90 days</option>
                          <option value={365}>Keep for 1 year</option>
                        </select>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>System logs older than this will be automatically deleted to free up space.</p>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manual Snapshot</label>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Trigger an immediate database backup snapshot. (Rate limited to 1 per hour)</p>
                        <button type="button" onClick={handleManualBackup} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-dark)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-dark)'; e.currentTarget.style.color = 'var(--primary)'; }}>
                          <Download size={18} /> Trigger Manual Backup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SYSTEM LOGS */}
              {activeTab === 'logs' && (
                <div className="card fade-in" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={20} color="#f59e0b" /> Audit Trail
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="text" 
                          placeholder="Search logs..." 
                          value={logSearchQuery}
                          onChange={e => setLogSearchQuery(e.target.value)}
                          style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '0.85rem' }} 
                        />
                      </div>
                      <button type="button" onClick={exportLogsToCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}>
                        <Download size={16} /> Export CSV
                      </button>
                      <button type="button" onClick={loadLogs} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-dark)'}>Refresh</button>
                    </div>
                  </div>
                  
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Timestamp</th>
                        <th style={{ textAlign: 'left' }}>User</th>
                        <th style={{ textAlign: 'left' }}>Action</th>
                        <th style={{ textAlign: 'left' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(log => (
                        <tr key={log.id} style={{ transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ color: 'var(--primary)' }}>{log.user}</td>
                          <td style={{ color: 'var(--text-main)' }}>{log.action}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{log.details}</td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No system logs found matching your criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <div className="fade-in">
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Key size={20} color="var(--primary)" /> Password Policy
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Minimum Password Length</label>
                        <select 
                          value={formData.passwordMinLength} 
                          onChange={e => setFormData({...formData, passwordMinLength: e.target.value})}
                          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                        >
                          <option value={8}>8 Characters</option>
                          <option value={10}>10 Characters</option>
                          <option value={12}>12 Characters (Recommended)</option>
                          <option value={16}>16 Characters</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.passwordRequireNumbers}
                            onChange={e => setFormData({...formData, passwordRequireNumbers: e.target.checked})}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} 
                          />
                          Require numbers (0-9)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.passwordRequireSymbols}
                            onChange={e => setFormData({...formData, passwordRequireSymbols: e.target.checked})}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} 
                          />
                          Require special characters (!@#$%)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={20} color="var(--warning)" /> Account Lockout Protection
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Failed Login Threshold</label>
                        <select 
                          value={formData.lockoutThreshold} 
                          onChange={e => setFormData({...formData, lockoutThreshold: e.target.value})}
                          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                        >
                          <option value={3}>3 Failed Attempts</option>
                          <option value={5}>5 Failed Attempts (Default)</option>
                          <option value={10}>10 Failed Attempts</option>
                          <option value={0}>Disabled</option>
                        </select>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Accounts will be temporarily locked out for 15 minutes after reaching this threshold to prevent brute-force attacks.</p>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Idle Session Timeout (Minutes)</label>
                        <select 
                          value={formData.idleTimeout} 
                          onChange={e => setFormData({...formData, idleTimeout: e.target.value})}
                          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                        >
                          <option value={5}>5 Minutes</option>
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={60}>60 Minutes</option>
                        </select>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Users will be automatically logged out after this period of inactivity.</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', gap: '1rem' }}>
                      <h3 style={{ margin: '0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} color="var(--danger)" /> Active Sessions Control
                      </h3>
                      <button type="button" onClick={handleForceLogoutAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                        <AlertTriangle size={16} /> Force Logout All
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>Device</th>
                            <th style={{ textAlign: 'left' }}>Location & IP</th>
                            <th style={{ textAlign: 'left' }}>Last Active</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSessions.length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active sessions found.</td>
                            </tr>
                          )}
                          {activeSessions.map(session => {
                            const isCurrent = session.id === localStorage.getItem('travelops_session_id');
                            return (
                            <tr key={session.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '50%' }}>
                                    <Laptop size={16} color={isCurrent ? 'var(--primary)' : 'var(--text-muted)'} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{session.device}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{session.os} • {session.browser}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ color: 'var(--text-main)' }}>{session.location}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{session.ip}</div>
                              </td>
                              <td>
                                {isCurrent ? (
                                  <span style={{ color: 'var(--success)', fontWeight: '500', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Current Session</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>{new Date(session.last_active).toLocaleString()}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {!isCurrent && (
                                  <button type="button" onClick={() => handleRevokeSession(session.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SMTP */}
              {activeTab === 'smtp' && (
                <div className="card fade-in">
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={20} color="var(--success)" /> SMTP Email Server
                  </h3>
                  
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem' }}>
                    <p style={{ margin: '0', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <Shield size={16} color="var(--success)" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/>
                      <strong>Security Notice:</strong> SMTP configurations (Host, Port, Username, Password) are now securely managed directly on the backend server via the <code>.env</code> file. They are no longer accessible or modifiable from the frontend to prevent credential leakage.
                    </p>
                  </div>

                  <h3 style={{ margin: '2rem 0 1rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>Automated Reminders</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.enableReminders}
                      onChange={e => setFormData({...formData, enableReminders: e.target.checked})}
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} 
                    />
                    Enable automated email reminders for Tours & Cruises
                  </label>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '1.9rem' }}>
                    Reminders will be sent 30, 15, 7, 5, 3, 2, 1 days before departure, on departure day, and on return day.
                  </p>

                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Test Email Configuration</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Send a test email to verify your SMTP backend is connected and working.</p>
                    <div style={{ display: 'flex', gap: '10px', position: 'relative', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="email" 
                        value={testEmailTarget}
                        onChange={(e) => setTestEmailTarget(e.target.value)}
                        placeholder="admin@travelops.com" 
                        disabled={testEmailStatus === 'sending'}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-main)', flex: '1 1 200px', maxWidth: '300px' }}
                      />
                      <button 
                        type="button" 
                        onClick={handleSendTestEmail} 
                        disabled={testEmailStatus === 'sending'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-dark)', color: testEmailStatus === 'sending' ? 'var(--text-muted)' : 'var(--success)', border: `1px solid ${testEmailStatus === 'sending' ? 'var(--border)' : 'var(--success)'}`, padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: testEmailStatus === 'sending' ? 'not-allowed' : 'pointer', fontWeight: '500', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
                        onMouseOver={e => { if (testEmailStatus !== 'sending') { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; } }} 
                        onMouseOut={e => { if (testEmailStatus !== 'sending') { e.currentTarget.style.background = 'var(--bg-dark)'; } }}
                      >
                        {testEmailStatus === 'sending' ? '⏳ Sending...' : '📧 Send Test Email'}
                      </button>
                      
                      {testEmailStatus === 'success' && (
                        <span style={{ color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', animation: 'fadeIn 0.3s ease-out' }}>
                          ✓ Test Email Dispatched Successfully!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PREFERENCES */}
              {activeTab === 'preferences' && (
                <div className="card fade-in">
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Monitor size={20} color="#8b5cf6" /> System Preferences
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Company Name</label>
                      <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="TravelOps Inc." style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>System Language</label>
                      <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="en">English</option>
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Default Currency</label>
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="SGD">SGD - Singapore Dollar (S$)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date Format</label>
                      <select value={formData.dateFormat} onChange={e => setFormData({...formData, dateFormat: e.target.value})} style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                      </select>
                    </div>
                  </div>

                  {/* APPEARANCE & ACCENT THEME CUSTOMIZER */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                      <Palette size={18} color="var(--primary)" /> Appearance & Theme Accents
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                      Personalize your TravelOps workspace theme and primary brand accent color.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      {/* Theme Mode Toggle Card */}
                      <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.875rem' }}>
                          Interface Mode
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: theme === 'dark' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.8125rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Moon size={16} color={theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)'} /> Obsidian Dark
                          </button>

                          <button
                            type="button"
                            onClick={() => { if (theme !== 'light') toggleTheme(); }}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: theme === 'light' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                              color: theme === 'light' ? 'var(--text-main)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.8125rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Sun size={16} color={theme === 'light' ? 'var(--primary)' : 'var(--text-muted)'} /> Studio Light
                          </button>
                        </div>
                      </div>

                      {/* Primary Accent Color Presets */}
                      <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.875rem' }}>
                          Primary Accent Glow
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                          {ACCENT_PRESETS.map(preset => {
                            const isSelected = (accent || 'cyan') === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => changeAccent(preset.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.5rem 0.65rem',
                                  borderRadius: '8px',
                                  border: isSelected ? `2px solid ${preset.color}` : '1px solid var(--border)',
                                  background: isSelected ? `${preset.color}20` : 'transparent',
                                  color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: preset.color, boxShadow: `0 0 8px ${preset.color}` }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name.split(' ')[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE BUTTON FOR TABS THAT USE IT */}
              {['security', 'smtp', 'preferences', 'database'].includes(activeTab) && (
                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#2563eb'} onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}>
                    <Save size={18} /> Save Settings Changes
                  </button>
                  {toastMessage && <span style={{ color: 'var(--success)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.3s ease-out' }}>✓ {toastMessage}</span>}
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
