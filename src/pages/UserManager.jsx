import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import { useUsers } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  UserFormModal,
  ResetPasswordModal,
  UserDossierDrawer,
  UserConfirmDeleteModal
} from '../components/users/UserModals';
import { 
  Edit2, Trash2, Plus, Lock, Unlock, Key, 
  Users, Shield, Activity, Search, Eye, AlertTriangle, CheckCircle2,
  UserCheck, UserX
} from 'lucide-react';

const PAGE_SIZE = 15;

const UserManager = () => {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const { toast } = useToast();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // Modals & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete Confirm State
  const [userToDelete, setUserToDelete] = useState(null);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const initialFormData = {
    name: '',
    email: '',
    role: 'Staff',
    status: 'Active',
    password: '',
    mustChangePassword: true
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  // --- Telemetry KPIs ---
  const totalUsers = users.length;
  const activeCount = useMemo(() => users.filter(u => u.status === 'Active').length, [users]);
  const privilegedCount = useMemo(() => users.filter(u => u.role === 'Admin' || u.role === 'Manager').length, [users]);
  const attentionCount = useMemo(() => users.filter(u => u.isLocked || u.mustChangePassword).length, [users]);

  // --- Filtering & Pagination ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q);

      const matchRole = roleFilter === 'All' || u.role === roleFilter;

      let matchStatus = true;
      if (statusFilter === 'Active') matchStatus = u.status === 'Active' && !u.isLocked;
      else if (statusFilter === 'Inactive') matchStatus = u.status === 'Inactive';
      else if (statusFilter === 'Locked') matchStatus = Boolean(u.isLocked);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;

  // Counts for role pills
  const roleCounts = useMemo(() => {
    const counts = { All: users.length, Admin: 0, Manager: 0, Staff: 0 };
    users.forEach(u => {
      if (counts[u.role] !== undefined) counts[u.role] += 1;
    });
    return counts;
  }, [users]);

  // Handlers for User Form Modal
  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'Staff',
        status: user.status || 'Active',
        password: '',
        mustChangePassword: Boolean(user.mustChangePassword)
      });
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning('Full name and email address are required.');
      return;
    }

    if (editingUser) {
      const res = await updateUser(editingUser.id, formData);
      if (res?.success) {
        toast.success(`User "${formData.name}" profile updated.`);
        if (viewingUser && viewingUser.id === editingUser.id) {
          setViewingUser({ ...viewingUser, ...formData });
        }
        handleCloseModal();
      } else {
        toast.error(res?.error || 'Failed to update user.');
      }
    } else {
      if (!formData.password || formData.password.length < 6) {
        toast.warning('Initial password must be at least 6 characters.');
        return;
      }
      const res = await addUser(formData);
      if (res?.success) {
        toast.success(`User "${formData.name}" created successfully.`);
        handleCloseModal();
      } else {
        toast.error(res?.error || 'Failed to create user account.');
      }
    }
  };

  // Lock / Unlock Toggle
  const handleToggleLock = async (user) => {
    const newLockedState = !user.isLocked;
    const res = await updateUser(user.id, { isLocked: newLockedState });
    if (res?.success) {
      toast.success(newLockedState ? `Account locked for ${user.name}.` : `Account unlocked for ${user.name}.`);
      if (viewingUser && viewingUser.id === user.id) {
        setViewingUser({ ...viewingUser, isLocked: newLockedState });
      }
    } else {
      toast.error(res?.error || 'Failed to update account lock status.');
    }
  };

  // Sign-In Inactivate / Activate Toggle (Hides from staff lists without deleting data)
  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const res = await updateUser(user.id, { status: newStatus });
    if (res?.success) {
      if (newStatus === 'Inactive') {
        toast.info(`Inactivated sign-in for "${user.name}". User is hidden from staff lists, but all historical data remains intact.`);
      } else {
        toast.success(`Activated sign-in for "${user.name}". User restored to staff lists.`);
      }
      if (viewingUser && viewingUser.id === user.id) {
        setViewingUser({ ...viewingUser, status: newStatus });
      }
    } else {
      toast.error(res?.error || 'Failed to update sign-in status.');
    }
  };

  // Password Reset Handlers
  const handleOpenResetModal = (user) => {
    setResetTargetUser(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetTargetUser(null);
    setNewPassword('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    const res = await updateUser(resetTargetUser.id, {
      password: newPassword,
      mustChangePassword: true,
      isLocked: false
    });

    if (res?.success) {
      toast.success(`Password reset for ${resetTargetUser.name}. Account unlocked.`);
      handleCloseResetModal();
      if (viewingUser && viewingUser.id === resetTargetUser.id) {
        setViewingUser({ ...viewingUser, isLocked: false, mustChangePassword: true });
      }
    } else {
      toast.error(res?.error || 'Failed to reset password.');
    }
  };

  // Delete Handlers
  const handlePromptDelete = (user) => {
    setUserToDelete(user);
  };

  const handleExecuteDelete = async () => {
    const user = userToDelete;
    setUserToDelete(null);
    if (!user) return;

    const res = await deleteUser(user.id);
    if (res?.success) {
      toast.success(`User "${user.name}" permanently deleted.`);
      if (viewingUser && viewingUser.id === user.id) {
        setViewingUser(null);
      }
    } else {
      toast.error(res?.error || 'Failed to delete user.');
    }
  };

  // Export Columns Config
  const exportColumns = [
    { header: 'ID', key: 'id' },
    { header: 'Full Name', key: 'name' },
    { header: 'Email Address', key: 'email' },
    { header: 'Role', key: 'role' },
    { header: 'Status', key: 'status' },
    { header: 'Locked', key: 'isLocked' },
    { header: 'Last Login', key: 'lastLogin' }
  ];

  const getRoleBadgeClass = (role) => {
    if (role === 'Admin') return 'badge-danger';
    if (role === 'Manager') return 'badge-primary';
    return 'badge-success';
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">

            {/* HEADER BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="section-title" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={26} color={neonBlue} /> User & Access Governance
                </h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage team access tiers, credentials, account locking, and authentication logs.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <ExportMenu 
                  data={filteredUsers.map(u => ({ ...u, isLocked: u.isLocked ? 'Yes' : 'No' }))} 
                  columns={exportColumns} 
                  filename="User_Directory_Travelops" 
                />

                <button 
                  className="btn btn-primary" 
                  onClick={() => handleOpenModal()} 
                  style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', padding: '0.55rem 1.25rem', fontWeight: '600' }}
                >
                  <Plus size={16} /> Add New User
                </button>
              </div>
            </div>

            {/* 4 TELEMETRY SCORECARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              
              {/* Total Users */}
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-24px', right: '-24px', background: `${neonBlue}20`, width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(25px)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color={neonBlue} /> Total Registered Users
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                  {totalUsers} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>accounts</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  System-wide personnel with login credentials
                </div>
              </div>

              {/* Active Accounts */}
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-24px', right: '-24px', background: 'rgba(16, 185, 129, 0.18)', width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(25px)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} color="#10b981" /> Active Operators
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', letterSpacing: '-0.025em' }}>
                  {activeCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0}%)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Authorized to access operational modules
                </div>
              </div>

              {/* Privileged Access */}
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-24px', right: '-24px', background: 'rgba(245, 158, 11, 0.18)', width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(25px)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={16} color="#f59e0b" /> Privileged Roles
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                  {privilegedCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>admins/mgrs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Hold approval or system administration rights
                </div>
              </div>

              {/* Attention Required */}
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-24px', right: '-24px', background: attentionCount > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)', width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(25px)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {attentionCount > 0 ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#10b981" />} Security Status
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: attentionCount > 0 ? '#ef4444' : '#10b981', letterSpacing: '-0.025em' }}>
                  {attentionCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>flagged</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: attentionCount > 0 ? '#ef4444' : '#10b981', marginTop: '0.4rem' }}>
                  {attentionCount > 0 ? 'Accounts locked or require password update' : 'All user credentials healthy'}
                </div>
              </div>

            </div>

            {/* USER DIRECTORY CARD */}
            <div className="card fade-in" style={{ borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
              
              {/* Toolbar: Search & Role / Status Filter Pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                  
                  {/* Search Input */}
                  <div style={{ position: 'relative', minWidth: '260px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      placeholder="Search users by name or email..." 
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.55rem 0.85rem 0.55rem 2.25rem', borderRadius: '10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Role Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {['All', 'Admin', 'Manager', 'Staff'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRoleFilter(r); setCurrentPage(1); }}
                        style={{
                          background: roleFilter === r ? neonBlue : 'transparent',
                          color: roleFilter === r ? '#ffffff' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.785rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {r}
                        <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>({roleCounts[r] || 0})</span>
                      </button>
                    ))}
                  </div>

                  {/* Status Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {['All', 'Active', 'Inactive', 'Locked'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                        style={{
                          background: statusFilter === st ? neonBlue : 'transparent',
                          color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.785rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* DATA TABLE */}
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>USER / OPERATOR</th>
                      <th>EMAIL ADDRESS</th>
                      <th>ROLE</th>
                      <th>STATUS & SECURITY</th>
                      <th>LAST LOGIN</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(userItem => {
                      const initial = userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U';
                      return (
                        <tr key={userItem.id} style={{ cursor: 'pointer' }} onClick={() => setViewingUser(userItem)}>
                          
                          {/* Name & Avatar */}
                          <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                background: `${neonBlue}18`, 
                                color: neonBlue, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: '700'
                              }}>
                                {initial}
                              </div>
                              <div>
                                <div>{userItem.name}</div>
                                {userItem.mustChangePassword && (
                                  <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'normal' }}>
                                    • Password change pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {userItem.email}
                          </td>

                          {/* Role */}
                          <td>
                            <span className={`badge ${getRoleBadgeClass(userItem.role)}`} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                              {userItem.role}
                            </span>
                          </td>

                          {/* Status & Lock */}
                          <td>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              <span className={`badge ${userItem.status === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                                {userItem.status}
                              </span>
                              {userItem.isLocked && (
                                <span className="badge badge-danger" style={{ borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Lock size={11} /> Locked
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Login */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                            {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleString() : 'Never'}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              
                              {/* Quick Lock / Unlock */}
                              <button 
                                type="button"
                                className={`action-btn ${userItem.isLocked ? 'unlock' : 'lock'}`}
                                onClick={() => handleToggleLock(userItem)}
                                title={userItem.isLocked ? "Unlock User" : "Lock User"}
                                style={{ 
                                  background: userItem.isLocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)', 
                                  color: userItem.isLocked ? '#10b981' : '#ef4444',
                                  border: `1px solid ${userItem.isLocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                }}
                              >
                                {userItem.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>

                              {/* Quick Inactivate / Activate Sign-In (Hide/Show in staff lists without deleting data) */}
                              <button 
                                type="button"
                                className={`action-btn ${userItem.status === 'Active' ? 'deactivate' : 'activate'}`}
                                onClick={() => handleToggleStatus(userItem)}
                                title={userItem.status === 'Active' ? "Inactivate Sign-in (Hide from staff lists without deleting data)" : "Activate Sign-in (Restore to staff lists)"}
                                style={{ 
                                  background: userItem.status === 'Active' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                                  color: userItem.status === 'Active' ? '#f59e0b' : '#10b981', 
                                  border: `1px solid ${userItem.status === 'Active' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` 
                                }}
                              >
                                {userItem.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>

                              {/* Reset Password */}
                              <button 
                                type="button"
                                className="action-btn key"
                                onClick={() => handleOpenResetModal(userItem)}
                                title="Reset Password"
                                style={{ 
                                  background: 'rgba(245, 158, 11, 0.15)', 
                                  color: '#f59e0b', 
                                  border: '1px solid rgba(245, 158, 11, 0.3)' 
                                }}
                              >
                                <Key size={14} />
                              </button>

                              {/* View 360° Dossier */}
                              <button 
                                type="button"
                                className="action-btn view"
                                onClick={() => setViewingUser(userItem)}
                                title="View User Dossier"
                                style={{ 
                                  background: `${neonBlue}18`, 
                                  color: neonBlue, 
                                  border: `1px solid ${neonBlue}33` 
                                }}
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit Profile */}
                              <button 
                                type="button"
                                className="action-btn edit"
                                onClick={() => handleOpenModal(userItem)}
                                title="Edit User Profile"
                                style={{ 
                                  background: 'rgba(56, 189, 248, 0.15)', 
                                  color: '#38bdf8', 
                                  border: '1px solid rgba(56, 189, 248, 0.3)' 
                                }}
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Delete */}
                              <button 
                                type="button"
                                className="action-btn delete"
                                onClick={() => handlePromptDelete(userItem)}
                                title="Delete User"
                                style={{ 
                                  background: 'rgba(239, 68, 68, 0.15)', 
                                  color: '#ef4444', 
                                  border: '1px solid rgba(239, 68, 68, 0.3)' 
                                }}
                              >
                                <Trash2 size={15} />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No user accounts matching search criteria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredUsers.length}
                itemsPerPage={PAGE_SIZE}
              />

            </div>

          </div>
        </div>
      </div>

      {/* 360° USER DOSSIER DRAWER */}
      <UserDossierDrawer 
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        onEdit={(u) => handleOpenModal(u)}
        onResetPassword={(u) => handleOpenResetModal(u)}
        onToggleLock={handleToggleLock}
        onToggleStatus={handleToggleStatus}
        onDelete={(u) => handlePromptDelete(u)}
        neonBlue={neonBlue}
      />

      {/* USER FORM MODAL (Add / Edit) */}
      <UserFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditing={Boolean(editingUser)}
        neonBlue={neonBlue}
      />

      {/* RESET PASSWORD MODAL */}
      <ResetPasswordModal 
        isOpen={isResetModalOpen}
        onClose={handleCloseResetModal}
        user={resetTargetUser}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        handleReset={handleResetPassword}
        neonBlue={neonBlue}
      />

      {/* CONFIRM DELETE MODAL */}
      <UserConfirmDeleteModal 
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleExecuteDelete}
        user={userToDelete}
      />

    </div>
  );
};

export default UserManager;
