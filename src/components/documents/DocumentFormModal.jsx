import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Stamp,
  Globe,
  Users,
  Plus,
  Trash2,
  Phone,
  Building,
  DollarSign,
  Clipboard,
  Receipt,
  Ticket,
  Calendar,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  DOCUMENT_TYPES,
  POPULAR_VISA_DESTINATIONS,
  DESTINATION_VENUE_HINTS,
  POPULAR_VENUES,
  POPULAR_VENDORS,
  SLA_DAY_PRESETS,
  PROCESS_SLA_DAYS,
  toDateInputStr,
  addDaysToDateStr,
  getDocumentStyles
} from './documentConstants';
import {
  createEmptyApplicant,
  normalizeDocumentApplicants,
  applicantsToGuestName,
  isApplicantEmpty
} from '../../utils/documentApplicantHelpers';
import { useFormDraft } from '../../hooks/useFormDraft';
import ConfirmModal from '../ConfirmModal';

const DocumentFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  editingDoc,
  isDuplicateMode,
  isSubmitting,
  onSubmit,
  activeStaff = [],
  currentUserName = '',
  aiDraftMeta = null,
  aiQueueInfo = null,
  onOpenAiImport = null,
  isLight
}) => {
  const isNewDoc = !editingDoc && !isDuplicateMode && !aiDraftMeta;
  const { hasSavedDraft, draftSavedAt, restoreDraft, clearDraft } = useFormDraft(
    'new_document',
    formData,
    setFormData,
    isOpen && isNewDoc
  );

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const applicantRows = useMemo(() => {
    if (Array.isArray(formData?.applicants) && formData.applicants.length > 0) {
      return formData.applicants;
    }
    const normalized = normalizeDocumentApplicants(formData?.applicants, formData?.guestName || '');
    return normalized.length > 0 ? normalized : [createEmptyApplicant()];
  }, [formData]);

  const filledApplicantCount = useMemo(
    () => applicantRows.filter((a) => String(a?.fullName || '').trim().length > 0).length,
    [applicantRows]
  );

  const setApplicantRows = (nextRows) => {
    const safeRows = nextRows.length > 0 ? nextRows : [createEmptyApplicant()];
    const syncedGuestName = applicantsToGuestName(safeRows);
    setFormData((prev) => ({
      ...prev,
      applicants: safeRows,
      guestName: syncedGuestName
    }));
  };

  const handleApplicantChange = (rowIdx, field, value) => {
    const nextRows = applicantRows.map((row, idx) =>
      idx === rowIdx ? { ...row, [field]: value } : row
    );
    setApplicantRows(nextRows);
  };

  const handleApplicantNamePaste = (rowIdx, e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (!pasted.includes('\n')) return;
    const lines = pasted
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\d+\s*[.)-]?\s*/, '').trim())
      .filter(Boolean);
    if (lines.length <= 1) return;
    e.preventDefault();
    const before = applicantRows.slice(0, rowIdx);
    const after = applicantRows.slice(rowIdx + 1);
    const inserted = lines.map((name, i) => ({
      ...(i === 0 ? applicantRows[rowIdx] : createEmptyApplicant()),
      fullName: name
    }));
    setApplicantRows([...before, ...inserted, ...after]);
  };

  const handleAddApplicantRow = () => {
    setApplicantRows([...applicantRows, createEmptyApplicant()]);
  };

  const handleRemoveApplicantRow = (rowIdx) => {
    if (applicantRows.length <= 1) {
      setApplicantRows([createEmptyApplicant()]);
      return;
    }
    setApplicantRows(applicantRows.filter((_, idx) => idx !== rowIdx));
  };

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    const hasAnyApplicant = applicantRows.some((a) => !isApplicantEmpty(a));
    if (editingDoc) {
      const origApps = JSON.stringify(
        normalizeDocumentApplicants(editingDoc.applicants, editingDoc.guestName)
      );
      const curApps = JSON.stringify(normalizeDocumentApplicants(applicantRows));
      return (
        curApps !== origApps ||
        formData.guestName !== (editingDoc.guestName || '') ||
        formData.country !== (editingDoc.country || '') ||
        formData.price !== (editingDoc.price ? String(editingDoc.price) : '') ||
        formData.notes !== (editingDoc.notes || '') ||
        formData.phoneNumber !== (editingDoc.phoneNumber || '')
      );
    }
    return Boolean(
      hasAnyApplicant ||
      formData.guestName?.trim() ||
      formData.country?.trim() ||
      formData.phoneNumber?.trim() ||
      formData.price?.trim() ||
      formData.notes?.trim() ||
      formData.bookingCode?.trim()
    );
  }, [isOpen, editingDoc, formData, applicantRows]);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showConfirmClose) {
        e.stopPropagation();
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmClose, handleRequestClose]);

  const handleFormSubmit = (e) => {
    clearDraft();
    onSubmit(e);
  };

  if (!isOpen) return null;

  const {
    subtleSurface,
    chipBg,
    chipBorder,
    fieldStyle,
    iconFieldStyle,
    iconAdornmentStyle
  } = getDocumentStyles(isLight);

  const handleSelectCountryChip = (countryName) => {
    setFormData((prev) => {
      const hintVenue = DESTINATION_VENUE_HINTS[countryName] || '';
      return {
        ...prev,
        country: countryName,
        appointmentLocation: prev.appointmentLocation || hintVenue
      };
    });
  };

  const handleApplySlaDays = (days) => {
    const baseDate = formData.receiveDate || toDateInputStr(new Date());
    setFormData((prev) => ({
      ...prev,
      receiveDate: baseDate,
      estimatedDone: addDaysToDateStr(baseDate, days)
    }));
  };

  return (
    <div className="modal-overlay" onClick={handleRequestClose}>
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          background: 'var(--bg-card)',
          padding: 0,
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
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
          <div>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                fontSize: '1.15rem',
                color: 'var(--text-main)'
              }}
            >
              <Stamp size={20} color="var(--primary)" />
              {editingDoc
                ? 'Edit Visa / Document Record'
                : aiDraftMeta
                ? 'AI Draft — Verifikasi & Lengkapi Dokumen'
                : isDuplicateMode
                ? 'Duplicate for Family / Group Applicant'
                : 'Add Visa / Document Record'}
              {aiQueueInfo && aiQueueInfo.total > 1 && (
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  Pemohon {aiQueueInfo.current} / {aiQueueInfo.total}
                </span>
              )}
            </h2>
            {isDuplicateMode && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                Destination, booking/tour code, SLA dates, and appointment slot pre-filled. Enter the next family/group member&apos;s name.
              </p>
            )}
            {aiDraftMeta && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                Sumber AI: {aiDraftMeta.fileName} — Mohon periksa anomali &amp; lengkapi Tour Code / Invoice / Jadwal Biometrik sebelum menyimpan.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!editingDoc && !aiDraftMeta && onOpenAiImport && (
              <button
                type="button"
                onClick={onOpenAiImport}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.36rem 0.72rem',
                  background: 'var(--primary-soft)',
                  borderColor: 'var(--border-glow)',
                  color: 'var(--primary)'
                }}
              >
                <Sparkles size={13} /> Isi Otomatis dari PDF Lark
              </button>
            )}
            <button
              type="button"
              onClick={handleRequestClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* AI Draft Verification & Live Completion Checklist Banner */}
        {aiDraftMeta && (
          <div
            style={{
              margin: '0.9rem 1.5rem 0',
              padding: '0.85rem 1rem',
              borderRadius: '11px',
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem'
            }}
          >
            {Array.isArray(aiDraftMeta.warnings) && aiDraftMeta.warnings.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.77rem',
                    fontWeight: 700,
                    color: isLight ? '#b45309' : '#fbbf24',
                    marginBottom: '0.28rem'
                  }}
                >
                  <AlertTriangle size={14} /> Catatan &amp; Anomali AI ({aiDraftMeta.warnings.length})
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.1rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.42,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.18rem'
                  }}
                >
                  {aiDraftMeta.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live Completion Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
                Checklist Draft:
              </span>
              {[
                { label: `Aplikan (${filledApplicantCount})`, done: filledApplicantCount > 0 },
                { label: 'Negara', done: Boolean(formData.country?.trim()) },
                { label: 'PIC Staff', done: Boolean(formData.staff?.trim()) },
                { label: 'Booking / Approval', done: Boolean(formData.bookingCode?.trim()) },
                { label: 'Tour Code', done: Boolean(formData.tourCode?.trim()), optional: true },
                { label: 'Invoice No.', done: Boolean(formData.invoiceNumber?.trim()), optional: true },
                { label: 'Appointment', done: Boolean(formData.appointmentDate), optional: true }
              ].map((item) => (
                <span
                  key={item.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.69rem',
                    fontWeight: 600,
                    background: item.done
                      ? isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.16)'
                      : item.optional
                      ? isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'
                      : isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.18)',
                    color: item.done
                      ? isLight ? '#15803d' : '#34d399'
                      : item.optional
                      ? 'var(--text-muted)'
                      : isLight ? '#b91c1c' : '#fca5a5',
                    border: `1px solid ${
                      item.done
                        ? 'rgba(16, 185, 129, 0.35)'
                        : item.optional
                        ? 'var(--border)'
                        : 'rgba(239, 68, 68, 0.35)'
                    }`
                  }}
                >
                  {item.done && <CheckCircle2 size={11} />}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Draft Recovery Alert */}
        {hasSavedDraft && (
          <div
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: isLight ? '#0369a1' : '#38bdf8' }}>
              <Sparkles size={16} />
              <span>
                <strong>Draft Tersimpan Ditemukan</strong>
                {draftSavedAt ? ` (disimpan pk ${draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}.
                Pulihkan data pengisian sebelumnya?
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={restoreDraft}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '0.785rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Pulihkan
              </button>
              <button
                type="button"
                onClick={clearDraft}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.785rem',
                  cursor: 'pointer'
                }}
              >
                Abaikan
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleFormSubmit}
          style={{ padding: '1.4rem 1.5rem', overflowY: 'auto' }}
        >
          <div className="form-grid">
            {/* Row 1: Document Type & Country */}
            <div className="input-group">
              <label>
                Document Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Stamp size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  required
                  placeholder="e.g., Tourist Visa, Passport Renewal"
                  value={formData.docType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, docType: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {DOCUMENT_TYPES.slice(0, 5).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, docType: dt }))}
                    style={{
                      border: `1px solid ${formData.docType === dt ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.docType === dt ? chipBg : 'transparent',
                      color: formData.docType === dt ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.12rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Destination Country / Embassy</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., Japan, Schengen, South Korea"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {POPULAR_VISA_DESTINATIONS.slice(0, 6).map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => handleSelectCountryChip(dest)}
                    style={{
                      border: `1px solid ${formData.country === dest ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.country === dest ? chipBg : 'transparent',
                      color: formData.country === dest ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.12rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Multi-Applicant Table (1x Input untuk Banyak Nama) */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: subtleSurface,
                border: `1.5px solid ${chipBorder}`,
                borderRadius: '0.75rem',
                padding: '1rem 1.1rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Daftar Aplikan / Pemohon <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: '0.7rem', padding: '0.12rem 0.55rem' }}
                  >
                    {filledApplicantCount || applicantRows.length} Orang
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddApplicantRow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.78rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Tambah Aplikan
                </button>
              </div>

              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  background: 'var(--bg-card)'
                }}
              >
                <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: '0.71rem'
                      }}
                    >
                      <th style={{ padding: '0.5rem 0.5rem', width: '34px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Nama Aplikan (Sesuai Paspor)</th>
                      <th style={{ padding: '0.5rem 0.45rem', width: '132px' }}>No. Paspor</th>
                      <th style={{ padding: '0.5rem 0.45rem', width: '132px' }}>Exp. Paspor</th>
                      <th style={{ padding: '0.5rem 0.45rem', width: '96px' }}>Kategori</th>
                      <th style={{ padding: '0.5rem 0.45rem', width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicantRows.map((app, idx) => (
                      <tr
                        key={`doc-applicant-${idx}`}
                        style={{
                          borderBottom: idx < applicantRows.length - 1 ? '1px solid var(--border)' : 'none'
                        }}
                      >
                        <td
                          style={{
                            padding: '0.42rem 0.45rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontWeight: 700
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.4rem 0.35rem' }}>
                          <input
                            type="text"
                            required={idx === 0}
                            placeholder={idx === 0 ? 'Nama pemohon utama (bisa paste banyak baris)' : `Nama pemohon ${idx + 1}...`}
                            value={app.fullName || ''}
                            onChange={(e) => handleApplicantChange(idx, 'fullName', e.target.value)}
                            onPaste={(e) => handleApplicantNamePaste(idx, e)}
                            style={{ ...fieldStyle, padding: '0.45rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem 0.35rem' }}>
                          <input
                            type="text"
                            placeholder="Opsional"
                            className="font-mono"
                            value={app.passportNumber || ''}
                            onChange={(e) =>
                              handleApplicantChange(idx, 'passportNumber', e.target.value.toUpperCase())
                            }
                            style={{ ...fieldStyle, padding: '0.45rem 0.55rem', fontSize: '0.78rem', textTransform: 'uppercase' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem 0.35rem' }}>
                          <input
                            type="date"
                            value={app.passportExpiredDate || ''}
                            onChange={(e) =>
                              handleApplicantChange(idx, 'passportExpiredDate', e.target.value)
                            }
                            style={{ ...fieldStyle, padding: '0.42rem 0.45rem', fontSize: '0.76rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem 0.35rem' }}>
                          <select
                            value={app.category || 'Adult'}
                            onChange={(e) => handleApplicantChange(idx, 'category', e.target.value)}
                            style={{ ...fieldStyle, padding: '0.45rem 0.4rem', fontSize: '0.76rem' }}
                          >
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveApplicantRow(idx)}
                            title={applicantRows.length <= 1 ? 'Kosongkan baris' : 'Hapus aplikan ini'}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: '1px solid rgba(239, 68, 68, 0.28)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                Cukup 1× input untuk banyak nama keluarga/grup. Tips: Anda juga bisa langsung <strong>paste daftar nama multi-baris</strong> ke kolom nama!
              </p>
            </div>

            <div className="input-group">
              <label>Applicant / Booker Phone / WhatsApp</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="+62..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            {/* Row 3: Process Speed, Receive Date & Estimated Done */}
            <div className="input-group">
              <label>
                Process Speed <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.processType}
                onChange={(e) => {
                  const nextSpeed = e.target.value;
                  const suggestedDays = PROCESS_SLA_DAYS[nextSpeed];
                  setFormData((prev) => ({
                    ...prev,
                    processType: nextSpeed,
                    estimatedDone:
                      !editingDoc && prev.receiveDate && suggestedDays
                        ? addDaysToDateStr(prev.receiveDate, suggestedDays)
                        : prev.estimatedDone
                  }));
                }}
                style={fieldStyle}
              >
                <option value="Normal">Normal (Standard SLA)</option>
                <option value="Express">Express (Priority)</option>
                <option value="Urgent">Urgent (Same / Next-Day Rush)</option>
              </select>
            </div>

            <div className="input-group">
              <label>
                Receive Date (Intake) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={formData.receiveDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, receiveDate: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div className="input-group">
              <label>Estimated Completion Date</label>
              <input
                type="date"
                min={formData.receiveDate || undefined}
                value={formData.estimatedDone}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDone: e.target.value }))}
                style={fieldStyle}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>SLA:</span>
                {SLA_DAY_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleApplySlaDays(d)}
                    style={{
                      border: `1px solid ${chipBorder}`,
                      background: chipBg,
                      color: 'var(--primary)',
                      borderRadius: '999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Dispatch / Send Date (Optional)</label>
              <input
                type="date"
                value={formData.sendDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, sendDate: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            {/* Row 4: Vendor / Visa Center & Service Fee */}
            <div className="input-group">
              <label>Vendor / Visa Center / Agent</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., VFS Global, JVAC, Partner Agent"
                  value={formData.supplier}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {POPULAR_VENDORS.slice(0, 5).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, supplier: v }))}
                    style={{
                      border: `1px solid ${formData.supplier === v ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.supplier === v ? chipBg : 'transparent',
                      color: formData.supplier === v ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.1rem 0.48rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Service / Visa Fee (IDR)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={iconAdornmentStyle} />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            {/* Row 5: Booking Code, Tour Code & Invoice Number */}
            <div className="input-group">
              <label>Booking Code</label>
              <div style={{ position: 'relative' }}>
                <Clipboard size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., BKG-2026-01"
                  value={formData.bookingCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bookingCode: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Invoice Number</label>
              <div style={{ position: 'relative' }}>
                <Receipt size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., INV-001"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                  }
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Linked Tour Code</label>
              <div style={{ position: 'relative' }}>
                <Ticket size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="Optional group tour code"
                  value={formData.tourCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>
                  Consultant (PIC Staff) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {currentUserName &&
                  activeStaff.some((u) => u.name === currentUserName) &&
                  formData.staff !== currentUserName && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, staff: currentUserName }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Assign to me
                  </button>
                )}
              </div>
              <select
                required
                value={formData.staff}
                onChange={(e) => setFormData((prev) => ({ ...prev, staff: e.target.value }))}
                style={{ ...fieldStyle, marginTop: '0.4rem' }}
              >
                <option value="">Select Staff</option>
                {formData.staff &&
                  !activeStaff.some((u) => u.name === formData.staff) && (
                    <option value={formData.staff}>{formData.staff}</option>
                  )}
                {activeStaff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.name}>
                    {staffMember.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 6: Biometric / Embassy Appointment Card */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: subtleSurface,
                border: `1.5px solid ${chipBorder}`,
                borderRadius: '0.75rem',
                padding: '1.15rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={17} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Visa Appointment Schedule (Biometrics / Embassy Interview)
                  </h3>
                </div>
                {formData.appointmentDate && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        appointmentDate: '',
                        appointmentTime: ''
                      }))
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.73rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear appointment
                  </button>
                )}
              </div>

              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="input-group">
                  <label>Appointment Date</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <label>Appointment Time</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentTime: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Appointment Venue / Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      list="visa-venue-suggestions"
                      placeholder="e.g., VFS Global Kuningan City Mall Lt. 2, Jakarta"
                      value={formData.appointmentLocation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          appointmentLocation: e.target.value
                        }))
                      }
                      style={iconFieldStyle}
                    />
                  </div>
                  <datalist id="visa-venue-suggestions">
                    {POPULAR_VENUES.map((venue) => (
                      <option key={venue} value={venue} />
                    ))}
                  </datalist>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Sparkles size={11} color="var(--primary)" /> Quick venues:
                    </span>
                    {POPULAR_VENUES.slice(0, 4).map((venue) => (
                      <button
                        key={venue}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, appointmentLocation: venue }))
                        }
                        style={{
                          border: `1px solid ${
                            formData.appointmentLocation === venue
                              ? 'var(--primary)'
                              : 'var(--border)'
                          }`,
                          background:
                            formData.appointmentLocation === venue ? chipBg : 'transparent',
                          color:
                            formData.appointmentLocation === venue
                              ? 'var(--primary)'
                              : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.5rem',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {venue.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 7: Notes */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>Document Checklist & Operational Notes</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {(formData.notes || '').length} / 500
                </span>
              </div>
              <textarea
                rows="3"
                maxLength="500"
                placeholder="Missing bank statement, old passport attached, special courier instructions, etc."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                style={{ ...fieldStyle, marginTop: '0.4rem', resize: 'vertical' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.2rem',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={handleRequestClose}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingDoc
                ? 'Save Changes'
                : aiDraftMeta
                ? `Konfirmasi & Simpan Draft${filledApplicantCount > 1 ? ` (${filledApplicantCount} Aplikan)` : ''}`
                : filledApplicantCount > 1
                ? `Create Document (${filledApplicantCount} Aplikan)`
                : 'Create Document Record'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirmClose}
        title="Tutup Formulir Dokumen?"
        message="Ada data formulir yang belum disimpan. Yakin ingin menutup jendela ini? (Draft lokal Anda tetap tersimpan di sesi browser)."
        confirmText="Tutup Formulir"
        cancelText="Lanjut Mengisi"
        confirmVariant="warning"
        onConfirm={() => {
          setShowConfirmClose(false);
          onClose();
        }}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
};

export default DocumentFormModal;

