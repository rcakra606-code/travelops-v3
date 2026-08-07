import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const ForcePasswordChange = () => {
  const { user, setUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = async (e) => {
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

    try {
      // 1. Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Update must_change_password flag in database
      const { error: updateError } = await supabase
        .from('travelops_users')
        .update({ 
          must_change_password: false 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to update password in database.');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999999, background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(10px)' }}>
      <div className="modal-content fade-in card glass" style={{ maxWidth: '420px', textAlign: 'center', background: 'rgba(20, 20, 20, 0.95)', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}>
        <div style={{ marginBottom: '1.5rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(30, 30, 30, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(30, 30, 30, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '8px' }}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
              Save New Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordChange;
