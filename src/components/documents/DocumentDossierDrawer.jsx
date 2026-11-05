import SlideOverDrawer from '../SlideOverDrawer';
import {
  Copy,
  Edit2,
  Truck,
  Inbox,
  CheckCircle2,
  Calendar,
  MessageCircle,
  MapPin,
  Share2,
  ExternalLink
} from 'lucide-react';
import {
  formatDisplayDate,
  formatIdr,
  getLogisticsStatusMeta,
  getDocProgressStage,
  getProcessBadgeClass,
  getTrackingCode,
  getGuestPortalPath,
  getDocumentStyles
} from './documentConstants';

const DocumentDossierDrawer = ({
  isOpen,
  onClose,
  previewDoc,
  canEdit = false,
  onDuplicateApplicant,
  onOpenModal,
  onOpenShipping,
  onOpenReceive,
  onSendAppointmentWhatsApp,
  onSendDeliveryWhatsApp,
  onCopyText,
  onCopyGuestPortal,
  onNavigate,
  isLight
}) => {
  const { subtleSurface, chipBorder } = getDocumentStyles(isLight);

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={previewDoc?.guestName || 'Document Details'}
      subtitle={
        previewDoc
          ? `${previewDoc.docType || 'Visa / Passport'} · ${previewDoc.country || 'International'} · Handled by ${previewDoc.staff || 'Unassigned'}`
          : ''
      }
      width="560px"
      footer={
        previewDoc ? (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                onDuplicateApplicant(previewDoc);
              }}
              style={{
                background: subtleSurface,
                border: `1px solid ${chipBorder}`,
                color: 'var(--primary)'
              }}
            >
              <Copy size={15} /> Duplicate Family / Group
            </button>

            {canEdit && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onOpenModal(previewDoc);
                }}
              >
                <Edit2 size={15} /> Edit Document
              </button>
            )}
          </>
        ) : null
      }
    >
      {previewDoc && (() => {
        const statusMeta = getLogisticsStatusMeta(previewDoc.shippingStatus, isLight);
        const stageIdx = getDocProgressStage(previewDoc);
        const portalPath = getGuestPortalPath(previewDoc);
        const steps = [
          { label: 'Intake', sub: previewDoc.receiveDate ? formatDisplayDate(previewDoc.receiveDate, false) : 'Logged' },
          { label: 'Biometrics', sub: previewDoc.appointmentDate ? formatDisplayDate(previewDoc.appointmentDate, false) : 'Reviewed' },
          { label: 'Embassy', sub: previewDoc.estimatedDone ? `Est. ${formatDisplayDate(previewDoc.estimatedDone, false)}` : 'In process' },
          { label: 'Dispatched', sub: previewDoc.shippingCourier || previewDoc.shippingMethod || 'Courier' },
          { label: 'Delivered', sub: previewDoc.shippingStatus === 'Received' ? 'Complete' : 'Final' }
        ];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Top Status & Quick Logistics Action Banner */}
            <div
              style={{
                padding: '0.95rem 1.1rem',
                borderRadius: '0.8rem',
                background: subtleSurface,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  className={`badge ${statusMeta.badgeClass}`}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    ...(statusMeta.customStyle || {})
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: statusMeta.dotColor
                    }}
                  />
                  {statusMeta.label}
                </span>

                <span
                  className={`badge ${getProcessBadgeClass(previewDoc.processType)}`}
                  style={{ fontSize: '0.76rem', padding: '0.32rem 0.7rem' }}
                >
                  {previewDoc.processType || 'Normal'} Speed
                </span>
              </div>

              {canEdit && (
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {previewDoc.shippingStatus !== 'Sent' &&
                    previewDoc.shippingStatus !== 'Received' && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onOpenShipping(previewDoc)}
                        style={{
                          padding: '0.38rem 0.75rem',
                          fontSize: '0.76rem',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          color: '#f59e0b'
                        }}
                      >
                        <Truck size={14} /> Dispatch Now
                      </button>
                    )}

                  {previewDoc.shippingStatus === 'Sent' && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onOpenReceive(previewDoc)}
                      style={{
                        padding: '0.38rem 0.75rem',
                        fontSize: '0.76rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10b981'
                      }}
                    >
                      <Inbox size={14} /> Confirm Delivery
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5-Stage Visual Progress Stepper */}
            <div
              style={{
                padding: '1rem 1.05rem',
                borderRadius: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.35rem',
                  textAlign: 'center'
                }}
              >
                {steps.map((step, idx) => {
                  const done = idx < stageIdx || (stageIdx === 4 && idx === 4);
                  const current = idx === stageIdx && stageIdx < 4;
                  return (
                    <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background:
                            done || current
                              ? 'linear-gradient(135deg, #00a8ff, #0284c7)'
                              : isLight
                              ? '#e2e8f0'
                              : 'rgba(148, 163, 184, 0.14)',
                          color: done || current ? '#ffffff' : 'var(--text-muted)',
                          boxShadow: current ? '0 0 12px rgba(0, 168, 255, 0.4)' : 'none'
                        }}
                      >
                        {done ? <CheckCircle2 size={15} /> : idx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: current || done ? 700 : 600,
                          color: current ? 'var(--primary)' : 'var(--text-main)',
                          marginTop: '0.35rem'
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                        {step.sub}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Biometric / Embassy Appointment Card */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: '0.8rem',
                background: previewDoc.appointmentDate
                  ? isLight
                    ? '#fffbeb'
                    : 'rgba(245, 158, 11, 0.08)'
                  : 'var(--bg-surface)',
                border: `1px solid ${
                  previewDoc.appointmentDate
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'var(--border)'
                }`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} color="#f59e0b" /> Biometric / Embassy Appointment
                </span>
                {previewDoc.appointmentDate && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onSendAppointmentWhatsApp(previewDoc)}
                    style={{
                      padding: '0.32rem 0.7rem',
                      fontSize: '0.74rem',
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981'
                    }}
                  >
                    <MessageCircle size={13} /> Send WA Reminder
                  </button>
                )}
              </div>

              {previewDoc.appointmentDate ? (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                  <div style={{ fontWeight: 700 }}>
                    {formatDisplayDate(previewDoc.appointmentDate, true)}
                    {previewDoc.appointmentTime ? ` · ${previewDoc.appointmentTime}` : ''}
                  </div>
                  {previewDoc.appointmentLocation && (
                    <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <MapPin size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{previewDoc.appointmentLocation}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No appointment scheduled for this document.
                </div>
              )}
            </div>

            {/* Delivery & Courier Card */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={15} color="var(--primary)" /> Courier & Delivery Details
                </span>
                {(previewDoc.sendDate || previewDoc.shippingResi) && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onSendDeliveryWhatsApp(previewDoc)}
                    style={{
                      padding: '0.32rem 0.7rem',
                      fontSize: '0.74rem',
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981'
                    }}
                  >
                    <MessageCircle size={13} /> Send Delivery WA
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Dispatch Date</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {previewDoc.sendDate ? formatDisplayDate(previewDoc.sendDate, true) : 'Pending dispatch'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Method / Courier</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {[previewDoc.shippingMethod, previewDoc.shippingCourier].filter(Boolean).join(' · ') || '-'}
                  </strong>
                </div>
                {previewDoc.shippingResi && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Tracking AWB (Resi)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>{previewDoc.shippingResi}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText(
                            previewDoc.shippingResi,
                            `Copied AWB ${previewDoc.shippingResi}`
                          )
                        }
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}
                {previewDoc.shippingNotes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Delivery Note</span>
                    <span style={{ color: 'var(--text-main)' }}>{previewDoc.shippingNotes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Client Tracking Portal Card */}
            {portalPath && (
              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '0.8rem',
                  background: isLight ? '#eef7ff' : 'rgba(0, 168, 255, 0.08)',
                  border: `1px solid ${chipBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Client Visa & Document Pass
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.12rem' }}>
                    Code: <strong style={{ color: 'var(--primary)' }}>{getTrackingCode(previewDoc)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onCopyGuestPortal(previewDoc)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.76rem',
                      background: isLight ? '#ffffff' : 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--primary)'
                    }}
                  >
                    <Share2 size={13} /> Copy Link
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => onNavigate(portalPath)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.76rem',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none'
                    }}
                  >
                    <ExternalLink size={13} /> Open Portal
                  </button>
                </div>
              </div>
            )}

            {/* References, Vendor, Fee & Notes */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: '0.8rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.7rem',
                fontSize: '0.82rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Booking / Tour Code</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {[previewDoc.bookingCode, previewDoc.tourCode].filter(Boolean).join(' / ') || '-'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Invoice / Service Fee</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {previewDoc.invoiceNumber || '-'}
                  {previewDoc.price > 0 ? ` · ${formatIdr(previewDoc.price)}` : ''}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Vendor / Visa Center</span>
                <strong style={{ color: 'var(--text-main)' }}>{previewDoc.supplier || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Applicant Phone</span>
                <strong style={{ color: 'var(--text-main)' }}>{previewDoc.phoneNumber || '-'}</strong>
              </div>
              {previewDoc.notes && (
                <div style={{ gridColumn: '1 / -1', paddingTop: '0.45rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginBottom: '0.15rem' }}>
                    Notes
                  </span>
                  <span style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{previewDoc.notes}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </SlideOverDrawer>
  );
};

export default DocumentDossierDrawer;

