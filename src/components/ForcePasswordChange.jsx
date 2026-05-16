import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ForcePasswordChange = () => {
  const { user, forceLogoutAll } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const savedUsers = localStorage.getItem('travelops_users');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, password: newPassword, mustChangePassword: false };
        }
        return u;
      });
      localStorage.setItem('travelops_users', JSON.stringify(updatedUsers));
      
      // Update current active user in localStorage
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('travelops_user', JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999999, background: '#0f172a' }}>
      <div className="modal-content fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem', background: '#3b82f620', color: '#3b82f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        
        <h2 style={{ marginBottom: '0.5rem', color: '#f8fafc' }}>Update Your Password</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Your account was recently created or reset by an administrator. For security reasons, you must choose a new password before continuing.
        </p>

        {success ? (
          <div style={{ padding: '1rem', background: '#10b98120', color: '#10b981', borderRadius: '8px', fontWeight: '500' }}>
            Password updated successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', background: '#ef444420', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
              Save New Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordChange;
