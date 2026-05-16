import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useUsers } from '../context/UserContext';
import { Edit2, Trash2, Plus, X, Lock, Unlock, Key } from 'lucide-react';

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
    updateUser(resetPasswordData.userId, { password: resetPasswordData.newPassword, mustChangePassword: true });
    handleCloseResetModal();
    alert("Password reset successfully. User will be forced to change password on next login.");
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
            <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                          <button onClick={() => handleToggleLock(user)} style={{ background: user.isLocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.isLocked ? 'var(--success)' : 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title={user.isLocked ? "Unlock User" : "Lock User"}>
                            {user.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          <button onClick={() => handleOpenResetModal(user)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Reset Password">
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(user)} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Delete">
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content fade-in" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {!editingUser && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Password</label>
                    <input type="password" name="password" value={formData.password || ''} onChange={handleChange} required placeholder="Enter temporary password" />
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="modal-overlay" onClick={handleCloseResetModal}>
          <div className="modal-content fade-in" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseResetModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Reset Password</h2>
            
            <form onSubmit={handleResetPassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>New Password</label>
                  <input type="password" value={resetPasswordData.newPassword} onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})} required placeholder="Enter new password" />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={handleCloseResetModal} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
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
