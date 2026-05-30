import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert } from 'lucide-react';

const ForceChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      // 1. Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Update must_change_password to false in travelops_users
      const { error: dbError } = await supabase
        .from('travelops_users')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Success! Force reload to re-evaluate AuthContext state
      alert('Password changed successfully! Please log in again with your new password.');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>
      <div className="login-box glass" style={{ maxWidth: '450px' }}>
        <div className="login-logo" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
          <ShieldAlert size={32} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: '1.5rem' }}>Action Required</h1>
        <p style={{ color: '#eab308', marginBottom: '2rem' }}>
          Your password has been reset by an administrator. You must choose a new password before continuing.
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password" 
                style={{ paddingLeft: '2.75rem', width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem' }}
                required 
              />
            </div>
          </div>
          
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Re-enter new password" 
                style={{ paddingLeft: '2.75rem', width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem' }}
                required 
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#eab308', color: '#000', fontWeight: 'bold' }} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;
