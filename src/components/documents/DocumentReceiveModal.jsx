import { Inbox, X, AlertTriangle } from 'lucide-react';
import { getDocumentStyles } from './documentConstants';

const DocumentReceiveModal = ({
  receiveDoc,
  onClose,
  receiveData,
  setReceiveData,
  onSubmit,
  isLight
}) => {
  if (!receiveDoc) return null;

  const { subtleSurface, fieldStyle } = getDocumentStyles(isLight);

  return (
    <div className="modal-overlay fade-in">
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          background: 'var(--bg-card)',
          padding: 0,
          border: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
          }}
        >
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              fontSize: '1.1rem',
              color: 'var(--text-main)'
            }}
          >
            <Inbox size={20} color="#10b981" /> Confirm Delivery Outcome
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.4rem 1.5rem' }}>
          <div
            style={{
              background: subtleSurface,
              padding: '0.9rem 1rem',
              borderRadius: '0.7rem',
              border: '1px solid var(--border)',
              marginBottom: '1.2rem'
            }}
          >
            <strong style={{ display: 'block', color: 'var(--text-main)' }}>
              {receiveDoc.guestName}
            </strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Dispatched via {receiveDoc.shippingMethod || 'Courier'}
              {receiveDoc.shippingCourier ? ` (${receiveDoc.shippingCourier})` : ''}
            </span>
          </div>

          <div className="input-group">
            <label>
              Delivery Outcome <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              required
              value={receiveData.receivedStatus}
              onChange={(e) => setReceiveData({ receivedStatus: e.target.value })}
              style={fieldStyle}
            >
              <option value="Final">Delivered & Received by Client (Final)</option>
              <option value="Needs Return">Returned / Undelivered (Needs Re-send)</option>
            </select>
          </div>

          {receiveData.receivedStatus === 'Needs Return' && (
            <div
              style={{
                marginTop: '0.65rem',
                fontSize: '0.8rem',
                color: 'var(--danger)',
                display: 'flex',
                gap: '0.45rem',
                alignItems: 'center'
              }}
            >
              <AlertTriangle size={14} /> Status will change to &quot;Returned&quot; so it can be re-dispatched.
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.15rem',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)'
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Outcome
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentReceiveModal;

