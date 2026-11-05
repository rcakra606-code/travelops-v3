import { 
  User, Shield, Lock, Unlock, Key, 
  ShieldAlert, X, CheckCircle2, Clock, UserCheck, UserX
} from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';

// 1. CONFIRM DELETE MODAL
export const UserConfirmDeleteModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '440px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.12)', 
            color: '#ef4444', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: '600' }}>
              Delete User Account?
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete <strong>{user.name}</strong> ({user.email})? Authentication access and assigned permissions will be revoked immediately.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-main)',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn" 
            onClick={onConfirm}
            style={{ 
              background: '#ef4444', 
              color: '#ffffff', 
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. USER FORM MODAL (Add / Edit)
export const UserFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  isEditing,
  neonBlue = '#00d4ff'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '640px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${neonBlue}18`, color: neonBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit User Profile' : 'Add New User'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure credentials, role-based access, and account authorization.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {/* Full Name */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Budi Santoso" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            {/* Email Address */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="email" 
                required 
                placeholder="budi@travelops.com" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            {/* Role */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Security Role <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                <option value="Staff">Staff (Operations & Tour Handlers)</option>
                <option value="Manager">Manager (Supervisory & Approvals)</option>
                <option value="Admin">Admin (Full System Governance)</option>
              </select>
            </div>

            {/* Status */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Sign-in & Staff Status <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                <option value="Active">Active (Allowed to sign in & listed in staff dropdowns)</option>
                <option value="Inactive">Inactive (Sign-in disabled & hidden from staff lists, data preserved)</option>
              </select>
            </div>

            {/* Password (Required on create, optional on edit) */}
            {!isEditing && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Initial Password <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="password" 
                  required 
                  placeholder="Set temporary password (min 6 characters)" 
                  value={formData.password || ''} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
                />
              </div>
            )}

            {/* Enforce Password Change */}
            <div className="input-group" style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={Boolean(formData.mustChangePassword)} 
                  onChange={e => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: neonBlue, cursor: 'pointer' }}
                />
                Require password change on next sign in
              </label>
            </div>

          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
              {isEditing ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. RESET PASSWORD MODAL
export const ResetPasswordModal = ({
  isOpen,
  onClose,
  user,
  newPassword,
  setNewPassword,
  handleReset,
  neonBlue = '#00d4ff'
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                Reset User Password
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Issue a new password for {user.name}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleReset} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.825rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>Target Account:</div>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{user.name} ({user.email})</div>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>New Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="password" 
                required 
                placeholder="Enter new password (min 6 characters)" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Account will automatically unlock and enforce change on next login.</span>
            </div>

          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
              Apply New Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. 360° USER DOSSIER DRAWER
export const UserDossierDrawer = ({
  user,
  onClose,
  onEdit,
  onResetPassword,
  onToggleLock,
  onToggleStatus,
  onDelete,
  neonBlue = '#00d4ff'
}) => {
  if (!user) return null;

  const getRoleColor = (role) => {
    if (role === 'Admin') return '#ef4444';
    if (role === 'Manager') return neonBlue;
    return '#10b981';
  };

  const roleColor = getRoleColor(user.role);

  return (
    <SlideOverDrawer
      isOpen={Boolean(user)}
      onClose={onClose}
      title={user.name || 'User Profile'}
      subtitle={`Email: ${user.email} • Role: ${user.role}`}
      width="540px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px' }}
          >
            Close
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onEdit && (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => { onClose(); onEdit(user); }}
                style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px' }}
              >
                Edit User
              </button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        
        {/* Profile Card */}
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border)',
          borderRadius: '14px', 
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: `${roleColor}18`, width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }} />
          
          <div style={{ 
            width: '54px', 
            height: '54px', 
            borderRadius: '50%', 
            background: `${roleColor}22`, 
            color: roleColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.35rem',
            fontWeight: '800',
            flexShrink: 0
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{user.name}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                {user.role}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', background: user.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: user.status === 'Active' ? '#10b981' : '#f59e0b', border: `1px solid ${user.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` }}>
                {user.status}
              </span>
              {user.isLocked && (
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Lock size={11} /> Locked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Management Actions */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600' }}>
            Account Controls & Actions
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button 
              type="button" 
              onClick={() => onToggleLock(user)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px', 
                padding: '0.6rem', 
                borderRadius: '8px', 
                background: user.isLocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)', 
                color: user.isLocked ? '#10b981' : '#ef4444', 
                border: `1px solid ${user.isLocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {user.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
              {user.isLocked ? 'Unlock Account' : 'Lock Account'}
            </button>

            <button 
              type="button" 
              onClick={() => { onClose(); onResetPassword(user); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px', 
                padding: '0.6rem', 
                borderRadius: '8px', 
                background: 'rgba(245, 158, 11, 0.12)', 
                color: '#f59e0b', 
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Key size={15} /> Reset Password
            </button>

            {/* Inactivate / Activate Sign-in & Staff Visibility */}
            {onToggleStatus && (
              <button 
                type="button" 
                onClick={() => onToggleStatus(user)}
                style={{ 
                  gridColumn: '1 / -1',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '0.65rem', 
                  borderRadius: '8px', 
                  background: user.status === 'Active' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.15)', 
                  color: user.status === 'Active' ? '#ef4444' : '#10b981', 
                  border: `1px solid ${user.status === 'Active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {user.status === 'Active' ? <UserX size={15} /> : <UserCheck size={15} />}
                {user.status === 'Active' ? 'Inactivate Sign-In (Hide from Staff Lists)' : 'Activate Sign-In (Show in Staff Lists)'}
              </button>
            )}
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            💡 <strong>Staff Visibility & Data Preservation:</strong> {user.status === 'Active' 
              ? 'Account is active. Staff member appears in operational dropdowns (Tours, Hotels, Cruises, Overtime, Productivity) and can sign in.'
              : 'Sign-in is disabled. User is hidden from all staff lists and dropdowns across modules, but all past tours, sales, and transaction records remain 100% preserved.'}
          </div>
        </div>

        {/* Security & Access Telemetry */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: neonBlue, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} /> Security & Session Telemetry
          </h4>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{user.id}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Login:</span>
              <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="var(--text-muted)"/>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password Reset Flag:</span>
              <span style={{ color: user.mustChangePassword ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                {user.mustChangePassword ? 'Pending Change on Sign In' : 'Satisfied'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Lockout:</span>
              <span style={{ color: user.isLocked ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                {user.isLocked ? 'Locked (Sign-in Suspended)' : 'Unlocked / Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {onDelete && (
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>
              Danger Zone
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Permanently remove this user and terminate session tokens.
            </p>
            <button 
              type="button" 
              onClick={() => { onClose(); onDelete(user); }}
              style={{ 
                background: '#ef4444', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '0.55rem 1rem', 
                fontSize: '0.825rem', 
                fontWeight: '600',
                cursor: 'pointer' 
              }}
            >
              Delete This User
            </button>
          </div>
        )}

      </div>
    </SlideOverDrawer>
  );
};
