import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { useSales } from '../context/SalesContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useDocuments } from '../context/DocumentContext';
import { supabase } from '../supabaseClient';
import { 
  User, Mail, Shield, Key, CheckCircle2, AlertTriangle, 
  Eye, EyeOff, Smartphone, Monitor, Laptop, Globe, Clock, 
  Palette, Copy, Check, Activity, LogOut, RefreshCw, 
  Briefcase, Calendar, ArrowUpRight, Trash2, X
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  { id: 'cyan', name: 'Sky Cyan', gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#0ea5e9' },
  { id: 'emerald', name: 'Emerald', gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' },
  { id: 'sunset', name: 'Sunset Rose', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#f59e0b' },
  { id: 'violet', name: 'Royal Violet', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#8b5cf6' },
  { id: 'indigo', name: 'Neon Indigo', gradient: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#00d4ff' }
];

const Profile = () => {
  const { user, setUser } = useAuth();
  const { updateUser } = useUsers();
  const { toast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  // Domain contexts for operational telemetry
  const { tours = [] } = useTours() || {};
  const { sales = [] } = useSales() || {};
  const { overtimes = [] } = useOvertimes() || {};
  const { documents = [] } = useDocuments() || {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'security' | 'sessions' | 'activity'

  // Avatar Gradient preference
  const [selectedGradient, setSelectedGradient] = useState(() => {
    return localStorage.getItem('travelops_avatar_gradient') || AVATAR_GRADIENTS[0].gradient;
  });

  // Copied UUID feedback state
  const [copiedUuid, setCopiedUuid] = useState(false);

  // Form State (Controlled with fallback to authenticated user state)
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  const effectiveName = nameInput !== '' ? nameInput : (user?.name || '');
  const effectiveEmail = emailInput !== '' ? emailInput : (user?.email || '');

  // Security Form State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Active Sessions State
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const currentSessionId = useMemo(() => localStorage.getItem('travelops_session_id') || '', []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  // Copy User ID to clipboard
  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUuid(true);
      toast.success('User UUID copied to clipboard');
      setTimeout(() => setCopiedUuid(false), 2000);
    }
  };

  // Change avatar gradient
  const handleSelectGradient = (gradient) => {
    setSelectedGradient(gradient);
    localStorage.setItem('travelops_avatar_gradient', gradient);
    toast.success('Avatar theme updated!');
  };

  // Save personal details
  const handlePersonalSave = async (e) => {
    e.preventDefault();
    if (!effectiveName.trim()) {
      toast.error('Full Name cannot be empty.');
      return;
    }
    if (!effectiveEmail.trim()) {
      toast.error('Email Address cannot be empty.');
      return;
    }

    try {
      setIsSavingPersonal(true);
      if (user?.id) {
        const res = await updateUser(user.id, {
          name: effectiveName.trim(),
          email: effectiveEmail.trim()
        });

        if (res?.success) {
          if (setUser) {
            setUser(prev => ({ ...prev, name: effectiveName.trim(), email: effectiveEmail.trim() }));
          }
          toast.success('Profile identity updated successfully!');
        } else {
          toast.error(res?.error || 'Failed to update profile.');
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Error updating profile details.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Password Security Form Handlers
  const handleSecurityChange = (e) => {
    setSecurityData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordChecks = useMemo(() => ({
    length: securityData.newPassword.length >= 8,
    capitalSmall: /[a-z]/.test(securityData.newPassword) && /[A-Z]/.test(securityData.newPassword),
    number: /[0-9]/.test(securityData.newPassword),
    symbol: /[^a-zA-Z0-9]/.test(securityData.newPassword)
  }), [securityData.newPassword]);

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (!securityData.newPassword) {
      toast.warning('Please enter a new password.');
      return;
    }
    if (!passwordChecks.length) {
      toast.warning('Password must be at least 8 characters long.');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match. Please double-check.');
      return;
    }

    try {
      setIsSavingSecurity(true);
      // 1. Direct Supabase Client update for active session
      const { error: authError } = await supabase.auth.updateUser({
        password: securityData.newPassword
      });
      if (authError) throw authError;

      // 2. Clear mustChangePassword flag via UserContext
      if (user?.id) {
        await updateUser(user.id, {
          password: securityData.newPassword,
          mustChangePassword: false
        });
        if (setUser) {
          setUser(prev => ({ ...prev, mustChangePassword: false }));
        }
      }

      toast.success('Password updated successfully! Next logins will use this password.');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // Load Active Sessions effect
  useEffect(() => {
    let cancelled = false;
    if (activeTab === 'sessions' && user?.id) {
      const fetchSessions = async () => {
        try {
          const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('last_active', { ascending: false });

          if (!cancelled && !error && data) {
            setActiveSessions(data);
          }
        } catch (err) {
          console.warn('Could not load user sessions:', err.message);
        }
      };
      fetchSessions();
    }
    return () => { cancelled = true; };
  }, [activeTab, user]);

  // Manual session reload button handler
  const handleReloadSessions = async () => {
    if (!user?.id) return;
    try {
      setIsLoadingSessions(true);
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
      toast.success('Session telemetry refreshed.');
    } catch (err) {
      toast.error('Failed to reload sessions: ' + err.message);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Revoke an individual session
  const handleRevokeSession = async (sessionId) => {
    try {
      const { error } = await supabase.from('user_sessions').delete().eq('id', sessionId);
      if (error) throw error;
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session disconnected successfully.');
    } catch (err) {
      toast.error('Failed to revoke session: ' + err.message);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm("Disconnect all other logged-in sessions? Only this browser will remain signed in.")) {
      return;
    }
    try {
      let query = supabase.from('user_sessions').delete().eq('user_id', user.id);
      if (currentSessionId) {
        query = query.neq('id', currentSessionId);
      }
      const { error } = await query;
      if (error) throw error;

      if (currentSessionId) {
        setActiveSessions(prev => prev.filter(s => s.id === currentSessionId));
      } else {
        setActiveSessions([]);
      }
      toast.success('All other devices have been signed out.');
    } catch (err) {
      toast.error('Failed to disconnect sessions: ' + err.message);
    }
  };

  // --- Operational Activity Telemetry ---
  const myToursCount = useMemo(() => {
    if (!user?.name) return 0;
    const name = user.name.toLowerCase().trim();
    return tours.filter(t => 
      (t.staffName && t.staffName.toLowerCase().trim() === name) ||
      (t.internals?.staffName && t.internals.staffName.toLowerCase().trim() === name) ||
      (t.pic && t.pic.toLowerCase().trim() === name)
    ).length;
  }, [tours, user]);

  const mySalesCount = useMemo(() => {
    if (!user?.name) return 0;
    const name = user.name.toLowerCase().trim();
    return sales.filter(s => s.staffName && s.staffName.toLowerCase().trim() === name).length;
  }, [sales, user]);

  const myOvertimeCount = useMemo(() => {
    if (!user?.name) return 0;
    const name = user.name.toLowerCase().trim();
    return overtimes.filter(o => o.staff && o.staff.toLowerCase().trim() === name).length;
  }, [overtimes, user]);

  const myDocumentsCount = useMemo(() => {
    if (!user?.name) return 0;
    const name = user.name.toLowerCase().trim();
    return documents.filter(d => d.staff && d.staff.toLowerCase().trim() === name).length;
  }, [documents, user]);

  const totalContributions = myToursCount + mySalesCount + myOvertimeCount + myDocumentsCount;

  // Initials generator
  const initials = useMemo(() => {
    if (!effectiveName) return 'OP';
    const parts = effectiveName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [effectiveName]);

  // Role style helper
  const roleBadgeColor = useMemo(() => {
    if (user?.role === 'Admin') return '#ef4444';
    if (user?.role === 'Manager') return neonBlue;
    return '#10b981';
  }, [user, neonBlue]);

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile} />
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>

            {/* HERO PROFILE IDENTITY CARD */}
            <div className="card" style={{ 
              marginBottom: '1.5rem', 
              borderRadius: '20px', 
              padding: '2rem', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--bg-card)'
            }}>
              {/* Ambient Glow */}
              <div style={{ 
                position: 'absolute', 
                top: '-40px', 
                right: '-40px', 
                background: `${roleBadgeColor}18`, 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                filter: 'blur(45px)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* Dynamic Glowing Avatar */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      width: '88px', 
                      height: '88px', 
                      borderRadius: '50%', 
                      background: selectedGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.25rem',
                      fontWeight: '800',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      border: '3px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      {initials}
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        {effectiveName || 'TravelOps Operator'}
                      </h1>
                      <span className="badge" style={{ 
                        background: `${roleBadgeColor}18`, 
                        color: roleBadgeColor, 
                        border: `1px solid ${roleBadgeColor}36`,
                        fontSize: '0.785rem',
                        fontWeight: '700'
                      }}>
                        {user?.role || 'Staff'}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.785rem' }}>
                        <span className="pulse-dot pulse-dot-green" /> {user?.status || 'Active'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} color="var(--text-muted)" /> {effectiveEmail || 'operator@travelops.com'}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="var(--text-muted)" /> Last Sign In: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Active Now'}
                      </span>
                    </div>

                    {/* Operator UUID Quick Copy */}
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                        ID: {user?.id ? `${user.id.slice(0, 16)}...` : 'System ID'}
                      </span>
                      <button 
                        type="button" 
                        onClick={handleCopyId}
                        title="Copy UUID"
                        style={{ background: 'none', border: 'none', color: neonBlue, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: '4px' }}
                      >
                        {copiedUuid ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Password Change Flag Banner */}
                {user?.mustChangePassword && (
                  <div style={{ 
                    background: 'rgba(245, 158, 11, 0.12)', 
                    border: '1px solid rgba(245, 158, 11, 0.35)', 
                    padding: '0.85rem 1.25rem', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    maxWidth: '360px'
                  }}>
                    <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      <strong>Action Required:</strong> A temporary password is in effect. Please update your password in the Security tab.
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 4 KPI SCORECARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              
              {/* Role Authority */}
              <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={16} color={roleBadgeColor} /> Assigned Authority
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: roleBadgeColor }}>
                  {user?.role || 'Staff'} Level
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {user?.role === 'Admin' ? 'Full governance & master system controls' : user?.role === 'Manager' ? 'Operational approvals & team supervision' : 'Frontline booking & operational handling'}
                </div>
              </div>

              {/* Security Health */}
              <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={16} color={user?.mustChangePassword ? '#f59e0b' : '#10b981'} /> Security Status
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: user?.mustChangePassword ? '#f59e0b' : '#10b981' }}>
                  {user?.mustChangePassword ? 'Pending Update' : 'Compliant'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {user?.mustChangePassword ? 'Temporary password must be replaced' : 'Authentication credentials safe & active'}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Smartphone size={16} color={neonBlue} /> Connected Devices
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {activeSessions.length || 1} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Active Session{activeSessions.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Current browser verified & active
                </div>
              </div>

              {/* Operational Footprint */}
              <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} color="#38bdf8" /> Operational Footprint
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8' }}>
                  {totalContributions} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Entries</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Tours, sales, documents & overtime records
                </div>
              </div>

            </div>

            {/* TAB SUB-NAV BAR */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
              
              <button 
                type="button" 
                onClick={() => setActiveTab('identity')}
                style={{ 
                  background: activeTab === 'identity' ? neonBlue : 'transparent',
                  color: activeTab === 'identity' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={15} /> Identity & Profile
              </button>

              <button 
                type="button" 
                onClick={() => setActiveTab('security')}
                style={{ 
                  background: activeTab === 'security' ? neonBlue : 'transparent',
                  color: activeTab === 'security' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Key size={15} /> Security & Password
                {user?.mustChangePassword && (
                  <span style={{ background: '#f59e0b', color: '#000000', width: '8px', height: '8px', borderRadius: '50%' }} />
                )}
              </button>

              <button 
                type="button" 
                onClick={() => setActiveTab('sessions')}
                style={{ 
                  background: activeTab === 'sessions' ? neonBlue : 'transparent',
                  color: activeTab === 'sessions' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={15} /> Connected Devices ({activeSessions.length || 1})
              </button>

              <button 
                type="button" 
                onClick={() => setActiveTab('activity')}
                style={{ 
                  background: activeTab === 'activity' ? neonBlue : 'transparent',
                  color: activeTab === 'activity' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Activity size={15} /> Work & Telemetry ({totalContributions})
              </button>

            </div>

            {/* TAB CONTENT 1: IDENTITY & PROFILE */}
            {activeTab === 'identity' && (
              <div className="card fade-in" style={{ borderRadius: '18px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '2.5rem' }}>
                  
                  {/* Left Column: Avatar & Gradient Studio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRight: '1px solid var(--border)', paddingRight: '2rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        Avatar Studio
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        Personalize your avatar gradient theme across all system modules.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        background: selectedGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        fontWeight: '800',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>Current Theme</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto-synced locally</div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
                        <Palette size={14} style={{ display: 'inline', marginRight: '4px' }} /> Preset Themes
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {AVATAR_GRADIENTS.map(th => (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => handleSelectGradient(th.gradient)}
                            title={th.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: th.gradient,
                              border: selectedGradient === th.gradient ? '2px solid #ffffff' : '1px solid transparent',
                              boxShadow: selectedGradient === th.gradient ? `0 0 10px ${th.color}` : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {selectedGradient === th.gradient && <Check size={14} color="#ffffff" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.35rem' }}>Role Scope</div>
                      <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        Your role determines module access, approval workflows, and data visibility rules across TravelOps.
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Profile Form */}
                  <div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: '700' }}>
                      Operator Identity Information
                    </h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Update your canonical display name and contact email for operations notifications.
                    </p>

                    <form onSubmit={handlePersonalSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Operator UUID (Read-only) */}
                      <div className="input-group">
                        <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Operator ID (System Identifier)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            value={user?.id || ''} 
                            disabled
                            style={{ 
                              width: '100%', 
                              background: 'var(--bg-surface)', 
                              border: '1px solid var(--border)', 
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                              borderRadius: '10px'
                            }} 
                          />
                          <button
                            type="button"
                            onClick={handleCopyId}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: neonBlue, cursor: 'pointer' }}
                            title="Copy UUID"
                          >
                            {copiedUuid ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="input-group">
                        <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Full Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          value={effectiveName} 
                          onChange={e => setNameInput(e.target.value)}
                          required
                          placeholder="e.g. Raden Cakra"
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
                        />
                      </div>

                      {/* Email Address */}
                      <div className="input-group">
                        <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Email Address (Authentication & Alert Routing) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="email" 
                          value={effectiveEmail} 
                          onChange={e => setEmailInput(e.target.value)}
                          required
                          placeholder="operator@travelops.com"
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
                        />
                        <div style={{ color: '#10b981', fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <CheckCircle2 size={13} /> Active Supabase authentication identity
                        </div>
                      </div>

                      {/* Role & System Level */}
                      <div className="input-group">
                        <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Assigned Security Role
                        </label>
                        <input 
                          type="text" 
                          value={`${user?.role || 'Staff'} (Governed by System Administrator)`} 
                          disabled
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-surface)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={isSavingPersonal}
                          style={{ 
                            background: neonBlue, 
                            borderColor: neonBlue, 
                            color: '#ffffff', 
                            padding: '0.65rem 1.75rem',
                            borderRadius: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {isSavingPersonal ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}
                          Save Identity Changes
                        </button>
                      </div>

                    </form>
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT 2: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <div className="card fade-in" style={{ borderRadius: '18px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                  
                  <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '14px', 
                      background: `${neonBlue}18`, 
                      color: neonBlue, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto'
                    }}>
                      <Key size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.35rem', color: 'var(--text-main)', fontWeight: '800' }}>
                      Update Security Password
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Manage your personal authentication credentials. Changing your password updates your Supabase authentication profile.
                    </p>
                  </div>

                  <form onSubmit={handleSecuritySave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Current Password (Optional Verification) */}
                    <div className="input-group">
                      <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Current Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          name="currentPassword"
                          value={securityData.currentPassword}
                          onChange={handleSecurityChange}
                          placeholder="Enter your current password"
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)',
                            padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
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

                    {/* New Password */}
                    <div className="input-group">
                      <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        New Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          name="newPassword"
                          value={securityData.newPassword}
                          onChange={handleSecurityChange}
                          required
                          placeholder="Minimum 8 characters"
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)',
                            padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Live Password Rules Indicator */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.65rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <span style={{ color: passwordChecks.length ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.785rem' }}>
                          {passwordChecks.length ? <CheckCircle2 size={13} /> : <X size={13} />} At least 8 characters
                        </span>
                        <span style={{ color: passwordChecks.capitalSmall ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.785rem' }}>
                          {passwordChecks.capitalSmall ? <CheckCircle2 size={13} /> : <X size={13} />} Upper & lower case
                        </span>
                        <span style={{ color: passwordChecks.number ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.785rem' }}>
                          {passwordChecks.number ? <CheckCircle2 size={13} /> : <X size={13} />} Number (0-9)
                        </span>
                        <span style={{ color: passwordChecks.symbol ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.785rem' }}>
                          {passwordChecks.symbol ? <CheckCircle2 size={13} /> : <X size={13} />} Special character (!@#)
                        </span>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="input-group">
                      <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          name="confirmPassword"
                          value={securityData.confirmPassword}
                          onChange={handleSecurityChange}
                          required
                          placeholder="Re-type new password"
                          style={{ 
                            width: '100%', 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)',
                            padding: '0.65rem 4rem 0.65rem 0.85rem',
                            borderRadius: '10px'
                          }} 
                        />
                        <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {securityData.confirmPassword && (
                            securityData.newPassword === securityData.confirmPassword ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : (
                              <X size={16} color="#ef4444" />
                            )
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSavingSecurity}
                        style={{ 
                          background: neonBlue, 
                          borderColor: neonBlue, 
                          color: '#ffffff', 
                          padding: '0.65rem 1.75rem',
                          borderRadius: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isSavingSecurity ? <RefreshCw size={15} className="spin" /> : <Key size={15} />}
                        Update Security Credentials
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: CONNECTED DEVICES & SESSIONS */}
            {activeTab === 'sessions' && (
              <div className="card fade-in" style={{ borderRadius: '18px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '700' }}>
                      Active Browser Sessions
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Review active login sessions and authorized client devices.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={handleReloadSessions} 
                      className="btn"
                      disabled={isLoadingSessions}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <RefreshCw size={14} className={isLoadingSessions ? 'spin' : ''} /> Refresh
                    </button>
                    
                    {activeSessions.length > 1 && (
                      <button 
                        type="button" 
                        onClick={handleRevokeAllOtherSessions} 
                        className="btn"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem', fontWeight: '600' }}
                      >
                        <LogOut size={14} /> Disconnect Other Devices
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeSessions.map((session) => {
                    const isCurrent = session.id === currentSessionId;
                    return (
                      <div 
                        key={session.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '1.25rem', 
                          borderRadius: '12px', 
                          background: isCurrent ? `${neonBlue}0e` : 'var(--bg-surface)', 
                          border: `1px solid ${isCurrent ? `${neonBlue}38` : 'var(--border)'}`,
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '10px', 
                            background: isCurrent ? `${neonBlue}20` : 'rgba(255, 255, 255, 0.05)', 
                            color: isCurrent ? neonBlue : 'var(--text-muted)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            {session.device?.toLowerCase().includes('mobile') ? (
                              <Smartphone size={20} />
                            ) : session.device?.toLowerCase().includes('mac') || session.device?.toLowerCase().includes('laptop') ? (
                              <Laptop size={20} />
                            ) : (
                              <Monitor size={20} />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                {session.device || 'Workstation Desktop'}
                              </span>
                              {isCurrent ? (
                                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                  <span className="pulse-dot pulse-dot-green" /> This Device (Active Now)
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                  Connected
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                              <span>{session.os || 'Unknown OS'}</span>
                              <span>•</span>
                              <span>{session.browser || 'Web Browser'}</span>
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Globe size={11} /> {session.ip || '127.0.0.1'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                            <div>Last Active</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              {session.last_active ? new Date(session.last_active).toLocaleString() : 'Just now'}
                            </div>
                          </div>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(session.id)}
                              className="action-btn delete"
                              title="Revoke and Disconnect Session"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {activeSessions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No remote sessions detected. Current session active.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: WORK & OPERATIONAL TELEMETRY */}
            {activeTab === 'activity' && (
              <div className="card fade-in" style={{ borderRadius: '18px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '700' }}>
                    Personal Operational Contributions
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Real-time tally of operational bookings, claims, and documents assigned to or logged by you.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* Tours Card */}
                  <div 
                    onClick={() => navigate('/tours')}
                    style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '14px', 
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = neonBlue}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${neonBlue}18`, color: neonBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={18} />
                      </div>
                      <ArrowUpRight size={16} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {myToursCount}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                      Assigned Tours
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Field operations & departures
                    </div>
                  </div>

                  {/* Sales Card */}
                  <div 
                    onClick={() => navigate('/sales-input')}
                    style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '14px', 
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={18} />
                      </div>
                      <ArrowUpRight size={16} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {mySalesCount}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                      Sales Transactions
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Logged sales & client bookings
                    </div>
                  </div>

                  {/* Overtime Card */}
                  <div 
                    onClick={() => navigate('/overtime')}
                    style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '14px', 
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={18} />
                      </div>
                      <ArrowUpRight size={16} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {myOvertimeCount}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                      Overtime Submissions
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      After-hours operational shifts
                    </div>
                  </div>

                  {/* Documents Card */}
                  <div 
                    onClick={() => navigate('/documents')}
                    style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '14px', 
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={18} />
                      </div>
                      <ArrowUpRight size={16} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {myDocumentsCount}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                      Travel Documents
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Visas & passport consignments
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
