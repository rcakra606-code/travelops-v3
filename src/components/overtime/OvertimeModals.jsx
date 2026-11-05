import { 
  Clock, User, FileText, CheckCircle2, 
  XCircle, Edit2, ShieldAlert, X
} from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';

// 1. CONFIRM DELETE MODAL
export const OvertimeConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
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
              {title || 'Delete Overtime Record'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {message || 'Are you sure you want to delete this overtime record? This action cannot be undone.'}
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. OVERTIME FORM MODAL
export const OvertimeFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  isEditing,
  activeStaff = [],
  neonBlue = '#00d4ff'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '620px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${neonBlue}18`, color: neonBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Overtime Record' : 'Log Overtime Claim'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record extra operational hours and event support.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {/* Staff Selector */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Staff Member <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                required 
                value={formData.staff} 
                onChange={e => setFormData({ ...formData, staff: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                <option value="" disabled>Select Staff</option>
                {activeStaff.map(s => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name} {s.department ? `(${s.department})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Name */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Event / Assignment Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Airport Transfer Night Ops" 
                value={formData.eventName} 
                onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            {/* Date */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Date of Activity <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="date" 
                required 
                value={formData.date} 
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            {/* Hours */}
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Overtime Hours <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                required 
                placeholder="e.g. 4.0" 
                value={formData.hours} 
                onChange={e => setFormData({ ...formData, hours: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              />
            </div>

            {/* Status */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Approval Status <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                required 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Remarks / Operational Justification</label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  placeholder="Details of client request, flight delay, or manager approval notes..."
                  value={formData.remarks || ''}
                  onChange={e => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, remarks: e.target.value });
                    }
                  }}
                  style={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border)', 
                    color: 'var(--text-main)', 
                    padding: '0.65rem 0.85rem 1.8rem 0.85rem', 
                    borderRadius: '8px', 
                    width: '100%', 
                    minHeight: '85px', 
                    resize: 'vertical' 
                  }}
                />
                <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {(formData.remarks || '').length} / 500
                </div>
              </div>
            </div>

          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
              {isEditing ? 'Save Changes' : 'Record Overtime'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. 360° OVERTIME DOSSIER DRAWER
export const OvertimeDossierDrawer = ({
  record,
  onClose,
  onEdit,
  onQuickStatus,
  canManage,
  neonBlue = '#00d4ff'
}) => {
  if (!record) return null;

  const getStatusColor = (status) => {
    if (status === 'Approved') return '#10b981';
    if (status === 'Pending') return '#f59e0b';
    if (status === 'Rejected') return '#ef4444';
    return neonBlue;
  };

  const statusColor = getStatusColor(record.status);

  return (
    <SlideOverDrawer
      isOpen={Boolean(record)}
      onClose={onClose}
      title={record.eventName || 'Overtime Log'}
      subtitle={`Staff: ${record.staff} • Date: ${record.date}`}
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
          {onEdit && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => { onClose(); onEdit(record); }}
              style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Edit2 size={16} /> Edit Overtime
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        
        {/* Highlight Card */}
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: `1px solid ${statusColor}40`,
          borderRadius: '14px', 
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: `${statusColor}18`, width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Logged Overtime Duration
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {record.hours} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>hours</span>
              </div>
            </div>
            <span style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: '700',
              background: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}35`
            }}>
              {record.status}
            </span>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Record ID: <strong style={{ color: 'var(--text-main)' }}>{record.id}</strong></span>
            <span>Date: <strong style={{ color: 'var(--text-main)' }}>{record.date}</strong></span>
          </div>
        </div>

        {/* Manager 1-Click Action Bar */}
        {canManage && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600' }}>
              Manager Quick Actions
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => onQuickStatus(record.id, 'Approved')}
                disabled={record.status === 'Approved'}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '0.65rem 1rem', 
                  borderRadius: '8px', 
                  background: record.status === 'Approved' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.15)', 
                  color: record.status === 'Approved' ? 'var(--text-muted)' : '#10b981', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  fontWeight: '600', 
                  cursor: record.status === 'Approved' ? 'not-allowed' : 'pointer' 
                }}
              >
                <CheckCircle2 size={16} /> Approve Claim
              </button>
              <button 
                type="button"
                onClick={() => onQuickStatus(record.id, 'Rejected')}
                disabled={record.status === 'Rejected'}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '0.65rem 1rem', 
                  borderRadius: '8px', 
                  background: record.status === 'Rejected' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.15)', 
                  color: record.status === 'Rejected' ? 'var(--text-muted)' : '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  fontWeight: '600', 
                  cursor: record.status === 'Rejected' ? 'not-allowed' : 'pointer' 
                }}
              >
                <XCircle size={16} /> Reject Claim
              </button>
            </div>
          </div>
        )}

        {/* Staff & Event Details */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: neonBlue, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={16} /> Staff & Assignment Details
          </h4>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Staff Member:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{record.staff}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Event Title:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{record.eventName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date:</span>
              <span style={{ color: 'var(--text-main)' }}>{record.date}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hours:</span>
              <span style={{ color: neonBlue, fontWeight: '700' }}>{record.hours} hrs</span>
            </div>
          </div>
        </div>

        {/* Remarks Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Remarks & Notes
          </h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: '1.6', fontStyle: record.remarks ? 'normal' : 'italic' }}>
            {record.remarks || 'No remarks provided for this overtime claim.'}
          </div>
        </div>

      </div>
    </SlideOverDrawer>
  );
};
