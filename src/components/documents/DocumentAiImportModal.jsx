import { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User,
  Globe,
  Calendar,
  DollarSign,
  Building,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  ClipboardCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { buildDocumentDraftsFromAiResult } from '../../utils/documentAiParser';
import { formatIdr } from './documentConstants';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 12 * 1024 * 1024;

const PROCESSING_STEPS = [
  'Membaca dokumen PDF / foto Request Visa & Dokumen...',
  'Mengekstrak data pemohon, paspor, biaya & halaman Approval...',
  'Menghitung SLA hari kerja, tag Schengen & deteksi anomali...'
];

const DocumentAiImportModal = ({ isOpen, onClose, activeStaff = [], onApplyDrafts }) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'parsing' | 'preview' | 'error'
  const [stepIdx, setStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedResult, setParsedResult] = useState(null); // { drafts, meta }
  const [selectedApplicantIndices, setSelectedApplicantIndices] = useState([]);

  if (!isOpen) return null;

  const resetModal = () => {
    setSelectedFile(null);
    setStatus('idle');
    setStepIdx(0);
    setErrorMsg('');
    setParsedResult(null);
    setSelectedApplicantIndices([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat Anda.'));
      reader.readAsDataURL(file);
    });

  const handleProcessFile = async (file) => {
    if (!file) return;

    const mime = (file.type || '').toLowerCase();
    const isValidExt = /\.(pdf|jpe?g|png|webp)$/i.test(file.name || '');
    if (!ACCEPTED_TYPES.includes(mime) && !isValidExt) {
      toast.error('Format file harus PDF, JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Ukuran file terlalu besar (maksimal 12 MB).');
      return;
    }

    setSelectedFile(file);
    setStatus('parsing');
    setStepIdx(0);
    setErrorMsg('');
    setParsedResult(null);

    const progressTimer = setInterval(() => {
      setStepIdx((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const staffNames = (activeStaff || []).map((s) => s.name).filter(Boolean);

      const response = await fetch('/api/documents/parse-request-form', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileBase64: dataUrl,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          staffList: staffNames
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Gagal mengekstrak data dari dokumen.');
      }

      const built = buildDocumentDraftsFromAiResult(
        payload.data,
        activeStaff,
        payload.fileName || file.name
      );

      setParsedResult(built);
      setSelectedApplicantIndices(built.drafts.map((_, idx) => idx));
      setStatus('preview');
    } catch (err) {
      console.error('Document AI parse error:', err);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses dokumen dengan AI.');
      setStatus('error');
    } finally {
      clearInterval(progressTimer);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleProcessFile(file);
  };

  const toggleApplicantSelection = (idx) => {
    setSelectedApplicantIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const handleApplyToDraftForm = () => {
    if (!parsedResult) return;
    const chosenDrafts = parsedResult.drafts.filter((_, idx) =>
      selectedApplicantIndices.includes(idx)
    );
    if (chosenDrafts.length === 0) {
      toast.warning('Pilih minimal 1 pemohon untuk dibuka sebagai draft.');
      return;
    }

    onApplyDrafts({
      drafts: chosenDrafts,
      meta: parsedResult.meta
    });
    resetModal();
    onClose();
  };

  const cardSurface = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const meta = parsedResult?.meta;
  const firstDraft = parsedResult?.drafts?.[0];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '94vw',
          maxHeight: '92vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.15rem 1.45rem',
            borderBottom: '1px solid var(--border)',
            background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Sparkles size={19} color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                AI Auto-Fill Dokumen &amp; Visa
              </h2>
              <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                Draft Mode · Cek Sebelum Simpan
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Upload PDF Request VISA/DOCUMENT (Lark) atau foto formulir — AI ekstrak otomatis menjadi draft siap verifikasi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.3rem 1.45rem', overflowY: 'auto', flex: 1 }}>
          {/* IDLE: UPLOAD DROPZONE */}
          {status === 'idle' && (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                  background: isDragging ? 'var(--primary-soft)' : cardSurface,
                  borderRadius: '14px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    margin: '0 auto 0.9rem',
                    borderRadius: '14px',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UploadCloud size={26} />
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Tarik &amp; lepaskan file PDF / Foto di sini, atau klik untuk memilih
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mendukung PDF Lark <strong>Request VISA/DOCUMENT</strong>, scan paspor/visa, atau foto formulir (PDF, JPG, PNG, WEBP · maks. 12 MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Capability hints */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '0.7rem',
                  marginTop: '1rem'
                }}
              >
                {[
                  {
                    title: 'Otomatis Pisah Booker & Pemohon',
                    desc: 'Nama visa diambil dari Applicant Details, nomor kontak booker otomatis diformat +62.'
                  },
                  {
                    title: 'Tag Schengen + Hint VFS & SLA',
                    desc: 'Negara Schengen otomatis bertag (Schengen) + hitung estimasi selesai berbasis hari kerja.'
                  },
                  {
                    title: 'Cek Anomali Sebelum Simpan',
                    desc: 'Deteksi SLA mepet keberangkatan, masa berlaku paspor < 7 bulan, & status Approval Lark.'
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      background: cardSurface,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PARSING: 3-STAGE LOADER */}
          {status === 'parsing' && (
            <div style={{ padding: '2.4rem 1rem', textAlign: 'center' }}>
              <Loader2
                size={38}
                color="var(--primary)"
                style={{ margin: '0 auto 1rem', animation: 'spin 0.9s linear infinite' }}
              />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                AI sedang menganalisa dokumen...
              </div>
              {selectedFile && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.45rem',
                    padding: '0.28rem 0.7rem',
                    borderRadius: '999px',
                    background: cardSurface,
                    border: '1px solid var(--border)',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <FileText size={13} color="var(--primary)" />
                  {selectedFile.name}
                </div>
              )}

              <div
                style={{
                  maxWidth: '460px',
                  margin: '1.35rem auto 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  textAlign: 'left'
                }}
              >
                {PROCESSING_STEPS.map((label, idx) => {
                  const done = idx < stepIdx;
                  const active = idx === stepIdx;
                  return (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        fontSize: '0.8rem',
                        color: done || active ? 'var(--text-main)' : 'var(--text-subtle)',
                        fontWeight: active ? 600 : 400
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={15} color="#10b981" />
                      ) : active ? (
                        <Loader2 size={15} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <span
                          style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            border: '1.5px solid var(--border)',
                            display: 'inline-block'
                          }}
                        />
                      )}
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.85rem'
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Gagal Membaca Dokumen
              </div>
              <p style={{ margin: '0.4rem auto 1.2rem', maxWidth: '460px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {errorMsg}
              </p>
              <button type="button" className="btn btn-primary" onClick={resetModal}>
                <RotateCcw size={15} /> Coba Upload Ulang
              </button>
            </div>
          )}

          {/* PREVIEW STATE */}
          {status === 'preview' && parsedResult && firstDraft && meta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Top Extraction Banner */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Ekstraksi Berhasil · {parsedResult.drafts.length} Pemohon Ditemukan
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      File: {meta.fileName}
                      {meta.approvalNo ? ` · No. Approval: ${meta.approvalNo}` : ''}
                      {meta.requestNo ? ` · Req: ${meta.requestNo}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    Akurasi: {meta.confidence.toUpperCase()}
                  </span>
                  {meta.approvalRecord?.managerStatus && (
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      Manager: {meta.approvalRecord.managerStatus}
                    </span>
                  )}
                  {meta.approvalRecord?.checkerStatus && (
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      Checker: {meta.approvalRecord.checkerStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Extracted Summary Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
                  gap: '0.65rem'
                }}
              >
                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Globe size={12} /> Jenis Dokumen &amp; Negara
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {firstDraft.docType}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {firstDraft.country || '-'}
                  </div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} /> Intake &amp; Estimasi SLA
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {firstDraft.receiveDate} → {firstDraft.estimatedDone}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {firstDraft.processType}
                    {meta.estimatedDaysRaw ? ` (${meta.estimatedDaysRaw})` : ''}
                  </div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <DollarSign size={12} /> Service / Visa Fee (Publish)
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {firstDraft.price ? formatIdr(firstDraft.price) : '-'} / pax
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {meta.nettFarePerApplicant > 0 ? `Nett: ${formatIdr(meta.nettFarePerApplicant)} (masuk Notes)` : 'Nett tidak tertera'}
                  </div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <User size={12} /> Consultant (Requester)
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {meta.matchedStaff || meta.rawRequester || 'Belum terdeteksi'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: meta.matchedStaff ? '#10b981' : '#f59e0b' }}>
                    {meta.matchedStaff ? 'Cocok dengan staff aktif' : 'Pilih manual di draft form'}
                  </div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Building size={12} /> Saran Vendor &amp; Booking Code
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {firstDraft.supplier || '-'}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {firstDraft.bookingCode || 'No. Approval kosong'}
                  </div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: cardSurface, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} /> Rencana Travel &amp; Kontak
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {meta.departureDate ? `${meta.departureDate}${meta.arrivalDate ? ` s/d ${meta.arrivalDate}` : ''}` : '-'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    WA: {firstDraft.phoneNumber || '-'}
                  </div>
                </div>
              </div>

              {/* Applicants List */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '0.6rem 0.9rem',
                    background: cardSurface,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar Pemohon Visa / Dokumen ({parsedResult.drafts.length})
                  </span>
                  {parsedResult.drafts.length > 1 && (
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                      Centang pemohon yang ingin dibuka dalam antrean draft
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {parsedResult.drafts.map((d, idx) => {
                    const checked = selectedApplicantIndices.includes(idx);
                    const app = d._applicantMeta || {};
                    return (
                      <label
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.65rem 0.9rem',
                          borderBottom: idx < parsedResult.drafts.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: parsedResult.drafts.length > 1 ? 'pointer' : 'default'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {parsedResult.drafts.length > 1 && (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleApplicantSelection(idx)}
                            />
                          )}
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {idx + 1}. {d.guestName || '(Nama belum terbaca)'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Paspor: <strong className="font-mono">{app.passportNumber || '-'}</strong>
                              {app.passportExpiredDate ? ` · Exp: ${app.passportExpiredDate}` : ''}
                              {app.dateOfBirth ? ` · DOB: ${app.dateOfBirth}` : ''}
                              {app.category ? ` · ${app.category}` : ''}
                            </div>
                          </div>
                        </div>

                        {app.note && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                            {app.note}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warnings & Anomalies */}
              {meta.warnings.length > 0 && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isLight ? '#b45309' : '#fbbf24',
                      marginBottom: '0.45rem'
                    }}
                  >
                    <AlertTriangle size={15} /> Perlu Perhatian &amp; Pengecekan ({meta.warnings.length})
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                      fontSize: '0.77rem',
                      color: 'var(--text-main)',
                      lineHeight: 1.45
                    }}
                  >
                    {meta.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Internal Fields Checklist */}
              {meta.missingFields.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: '11px',
                    background: cardSurface,
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <ClipboardCheck size={14} color="var(--primary)" /> Lengkapi di Draft Form (belum tertera di PDF Lark):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {meta.missingFields.map((field) => (
                      <span
                        key={field}
                        className="badge badge-neutral"
                        style={{ fontSize: '0.71rem' }}
                      >
                        • {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.95rem 1.45rem',
            borderTop: '1px solid var(--border)',
            background: isLight ? '#f8fafc' : 'var(--bg-surface)',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {status === 'preview'
              ? 'Data hanya dimuat sebagai Draft — belum masuk database sebelum Anda simpan.'
              : 'File dianalisis sementara via Gemini AI dan tidak disimpan sebagai file permanen.'}
          </span>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            {status === 'preview' && (
              <button type="button" className="btn btn-secondary" onClick={resetModal}>
                <RotateCcw size={14} /> Upload File Lain
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Batal
            </button>
            {status === 'preview' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyToDraftForm}
                disabled={selectedApplicantIndices.length === 0}
                style={{ fontWeight: 700 }}
              >
                {selectedApplicantIndices.length > 1
                  ? `Buka Antrean Draft (${selectedApplicantIndices.length} Pemohon)`
                  : 'Buka sebagai Draft di Form Dokumen'}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAiImportModal;
