import { Truck, X } from 'lucide-react';
import { POPULAR_COURIERS, getDocumentStyles } from './documentConstants';

const DocumentShippingModal = ({
  shippingDoc,
  onClose,
  shippingData,
  setShippingData,
  onSubmit,
  isLight
}) => {
  if (!shippingDoc) return null;

  const { subtleSurface, chipBg, fieldStyle } = getDocumentStyles(isLight);

  return (
    <div className="modal-overlay fade-in">
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
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
            <Truck size={20} color="#f59e0b" /> Dispatch Document
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
              {shippingDoc.guestName}
            </strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {shippingDoc.docType} · {shippingDoc.country || 'International'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>
                Dispatch Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={shippingData.sendDate}
                onChange={(e) =>
                  setShippingData((prev) => ({ ...prev, sendDate: e.target.value }))
                }
                style={fieldStyle}
              />
            </div>

            <div className="input-group">
              <label>
                Delivery Method <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={shippingData.shippingMethod}
                onChange={(e) =>
                  setShippingData((prev) => ({ ...prev, shippingMethod: e.target.value }))
                }
                style={fieldStyle}
              >
                <option value="Messenger">Internal Messenger</option>
                <option value="Courier">Courier / Expedition (JNE, DHL, GoSend, etc.)</option>
                <option value="Self Pickup">Client Self-Pickup at Office</option>
              </select>
            </div>

            {shippingData.shippingMethod === 'Courier' && (
              <>
                <div className="input-group">
                  <label>
                    Courier Service <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., JNE YES, DHL Express, GoSend"
                    value={shippingData.shippingCourier}
                    onChange={(e) =>
                      setShippingData((prev) => ({
                        ...prev,
                        shippingCourier: e.target.value
                      }))
                    }
                    style={fieldStyle}
                  />
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {POPULAR_COURIERS.map((cName) => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() =>
                          setShippingData((prev) => ({ ...prev, shippingCourier: cName }))
                        }
                        style={{
                          border: `1px solid ${
                            shippingData.shippingCourier === cName
                              ? 'var(--primary)'
                              : 'var(--border)'
                          }`,
                          background:
                            shippingData.shippingCourier === cName ? chipBg : 'transparent',
                          color:
                            shippingData.shippingCourier === cName
                              ? 'var(--primary)'
                              : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {cName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    Tracking Number / AWB (Resi) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter courier tracking airwaybill..."
                    value={shippingData.shippingResi}
                    onChange={(e) =>
                      setShippingData((prev) => ({ ...prev, shippingResi: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label>Delivery Notes / Recipient</label>
              <textarea
                rows="2"
                placeholder="e.g., Handed to front-desk reception / Mr. Andi"
                value={shippingData.shippingNotes}
                onChange={(e) =>
                  setShippingData((prev) => ({ ...prev, shippingNotes: e.target.value }))
                }
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </div>
          </div>

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
              Confirm Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentShippingModal;

