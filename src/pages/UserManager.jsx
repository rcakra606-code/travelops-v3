import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useUsers } from '../context/UserContext';
import { Edit2, Trash2, Plus, X, Lock, Unlock, Key, User, Mail, Shield, Activity } from 'lucide-react';

const UserManager = () => {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    status: 'Active',
    password: ''
  });
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ userId: null, newPassword: '' });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleToggleLock = (user) => {
    updateUser(user.id, { isLocked: !user.isLocked });
  };

  const handleOpenResetModal = (user) => {
    setResetPasswordData({ userId: user.id, newPassword: '' });
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetPasswordData({ userId: null, newPassword: '' });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    updateUser(resetPasswordData.userId, { 
      password: resetPasswordData.newPassword, 
      mustChangePassword: true, 
      isLocked: false 
    });
    handleCloseResetModal();
    alert("Password reset successfully. Account unlocked and user will be forced to change password on next login.");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'Staff', status: 'Active', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser({ ...formData, mustChangePassword: true });
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
    }
  };

  const inputStyle = {
    paddingLeft: '2.5rem',
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    borderRadius: '0.5rem',
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    outline: 'none'
  };

  const iconStyle = {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none'
  };

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 className="section-title" style={{ margin: 0 }}>User Management</h1>
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New User
            </button>
          </div>

          <div className="card" style={{ padding: '0' }}>
            <div style={{ overflowX: 'auto', borderRadius: '1rem' }}>
              <table className="data-table">
                <thead style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}>
                      <td style={{ fontWeight: '500' }}>{user.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'Admin' ? 'badge-danger' : user.role === 'Manager' ? 'badge-primary' : 'badge-success'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                            {user.status}
                          </span>
                          {user.isLocked && (
                            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Lock size={12} /> Locked
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {formatDate(user.lastLogin)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn" onClick={() => handleToggleLock(user)} style={{ padding: '0.5rem', background: user.isLocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.isLocked ? 'var(--success)' : 'var(--danger)' }} title={user.isLocked ? "Unlock User" : "Lock User"}>
                            {user.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          <button className="btn" onClick={() => handleOpenResetModal(user)} style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }} title="Reset Password">
                            <Key size={16} />
                          </button>
                          <button className="btn" onClick={() => handleOpenModal(user)} style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn" onClick={() => handleDelete(user.id)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '800px', background: '#1e293b', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#eab308' }}>
                <User size={24} color="#eab308" /> {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Full Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{...iconStyle, color: '#8b5cf6'}} />
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      placeholder="John Doe" 
                      style={inputStyle}
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Email Address<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{...iconStyle, color: '#3b82f6'}} />
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      placeholder="john@example.com" 
                      style={inputStyle}
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Role<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} style={{...iconStyle, color: '#eab308'}} />
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Status<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Activity size={16} style={{...iconStyle, color: '#10b981'}} />
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {!editingUser && (
                  <div className="input-group">
                    <label>Password<span style={{color: '#ef4444'}}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{...iconStyle, color: '#ef4444'}} />
                      <input 
                        type="password" 
                        name="password" 
                        value={formData.password || ''} 
                        onChange={handleChange} 
                        required 
                        placeholder="Enter temporary password" 
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none', fontWeight: 'bold' }}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '500px', background: '#1e293b', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#eab308' }}>
                <Key size={24} color="#eab308" /> Reset Password
              </h2>
              <button onClick={handleCloseResetModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>New Password<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{...iconStyle, color: '#ef4444'}} />
                    <input 
                      type="password" 
                      value={resetPasswordData.newPassword} 
                      onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})} 
                      required 
                      placeholder="Enter new password" 
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                <button type="button" className="btn" onClick={handleCloseResetModal} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none', fontWeight: 'bold' }}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
