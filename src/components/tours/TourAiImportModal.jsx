import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, UploadCloud, FileText, Image as ImageIcon, X,
  AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, Users,
  Calendar, MapPin, DollarSign, UserCheck, ClipboardList
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { buildDraftFromAiResult } from '../../utils/tourAiParser';
import { formatCurrency } from '../../utils/currency';

const PROCESSING_STAGES = [
  'Membaca dokumen & struktur tabel peserta…',
  'Mengekstrak kode tour, destinasi, tanggal & PIC Staff…',
  'Menganalisis harga paket, deposit & mendeteksi anomali…'
];

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });

const TourAiImportModal = ({ isOpen, onClose, onApplyDraft }) => {
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState('');
  const [parsedDraft, setParsedDraft] = useState(null);

  const activeStaff = useMemo(
    () =>
      (users || []).filter(
        (u) => u.status === 'Active' && (u.role || '').toLowerCase() !== 'admin'
      ),
    [users]
  );

  const defaultStaffName = useMemo(() => {
    if ((user?.role || '').toLowerCase() === 'admin') return '';
    if (user?.name && activeStaff.some((u) => u.name === user.name)) return user.name;
    return '';
  }, [user, activeStaff]);

  useEffect(() => {
    if (!isParsing) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [isParsing]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isParsing) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isParsing, onClose]);

  if (!isOpen) return null;

  const resetModal = () => {
    setSelectedFile(null);
    setParsedDraft(null);
    setError('');
    setIsParsing(false);
    setStageIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePicked = (file) => {
    if (!file) return;
    const lowerName = (file.name || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();
    const isAllowedExt = /\.(pdf|jpe?g|png|webp)$/.test(lowerName);
    const isAllowedMime = ACCEPTED_TYPES.includes(mime);

    if (!isAllowedExt && !isAllowedMime) {
      setError('Format file belum didukung. Silakan unggah PDF, JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Ukuran file melebihi batas 12 MB.');
      return;
    }

    setError('');
    setParsedDraft(null);
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    setStageIndex(0);
    setError('');

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const response = await fetch('/api/tours/parse-registration-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fileBase64: dataUrl,
          mimeType: selectedFile.type || (selectedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileName: selectedFile.name,
          staffList: activeStaff.map((s) => s.name)
        })
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error || `Gagal membaca dokumen (HTTP ${response.status}).`);
      }

      const draft = buildDraftFromAiResult(json.data, {
        activeStaff,
        defaultStaffName,
        fileName: selectedFile.name
      });

      setParsedDraft(draft);
      toast.success('Formulir berhasil dibaca AI — silakan tinjau draft sebelum masuk form.');
    } catch (err) {
      setError(err?.message || 'Gagal menganalisis dokumen dengan AI.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmUseDraft = () => {
    if (!parsedDraft) return;
    onApplyDraft(parsedDraft);
    resetModal();
  };

  const aiMeta = parsedDraft?._aiMeta || {};
  const warnings = aiMeta.warnings || [];
  const importantNotes = aiMeta.importantNotes || [];
  const missingChecklist = [
    !parsedDraft?.bookingCode ? 'Kode Booking Internal (mis. DWW...)' : null,
    !parsedDraft?.financials?.depositNumber ? 'Nomor Bukti DP / PAA' : null,
    !Number(parsedDraft?.financials?.profit || 0) ? 'Nominal Profit / Nett Cost' : null,
    parsedDraft?.paxInfo?.every((p) => !p.email) ? 'Email Peserta (opsional)' : null
  ].filter(Boolean);

  return (
    <div
      className="modal-overlay fade-in"
      style={{ zIndex: 1100 }}
      onClick={() => {
        if (!isParsing) onClose();
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          maxHeight: '90vh',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px var(--primary-glow)',
                flexShrink: 0
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: '800', color: 'var(--text-main)' }}>
                AI Auto-Fill Formulir Tour
              </h2>
              <p style={{ margin: '0.18rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Upload Formulir Pendaftaran (PDF / Foto) → otomatis jadi <strong>Draft</strong> untuk Anda cek &amp; lengkapi.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="close-btn"
            disabled={isParsing}
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.4rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Upload / Dropzone */}
          {!parsedDraft && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file) handleFilePicked(file);
                }}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging || selectedFile ? 'var(--primary)' : 'var(--border-hover)'}`,
                  borderRadius: '14px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  cursor: isParsing ? 'wait' : 'pointer',
                  background: isDragging
                    ? 'var(--primary-soft)'
                    : selectedFile
                      ? isLight
                        ? '#f0f9ff'
                        : 'rgba(56, 189, 248, 0.06)'
                      : 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFilePicked(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    margin: '0 auto 0.9rem',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedFile ? (
                    selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText size={26} />
                    ) : (
                      <ImageIcon size={26} />
                    )
                  ) : (
                    <UploadCloud size={26} />
                  )}
                </div>

                {selectedFile ? (
                  <>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB · Klik untuk mengganti file
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      Tarik &amp; lepaskan Formulir Pendaftaran di sini, atau klik untuk memilih
                    </div>
                    <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Mendukung <strong>PDF</strong> maupun <strong>Foto / Scan (JPG, PNG, WEBP)</strong> hingga 12 MB
                    </div>
                  </>
                )}
              </div>

              {/* Human-in-the-loop safety notice */}
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5
                }}
              >
                <ClipboardList size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Aman &amp; Terkendali (Mode Draft):</strong> AI hanya mengisi
                  form sebagai <strong>draft sementara</strong> dan mendeteksi kejanggalan (seperti selisih jumlah pax atau voucher DP).
                  Data <strong>tidak langsung masuk database</strong> sebelum Anda tinjau dan simpan di Step 5.
                </div>
              </div>

              {/* Live Processing Progress */}
              {isParsing && (
                <div
                  className="fade-in"
                  style={{
                    marginTop: '1.1rem',
                    padding: '1rem 1.15rem',
                    borderRadius: '12px',
                    background: 'var(--primary-soft)',
                    border: '1px solid var(--border-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem'
                  }}
                >
                  <div
                    className="spin"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '2.5px solid var(--primary-glow)',
                      borderTopColor: 'var(--primary)',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      AI Agent sedang membaca formulir…
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                      {PROCESSING_STAGES[stageIndex]}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: '#fb7185',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem'
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Pre-Draft Extraction Preview */}
          {parsedDraft && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '11px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Ekstraksi Draft Selesai — Siap Ditinjau di Form Tour
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Sumber: {aiMeta.fileName} {aiMeta.tourTitle ? `· ${aiMeta.tourTitle}` : ''}
                    </div>
                  </div>
                </div>
                <span
                  className={`badge ${
                    aiMeta.confidence === 'high'
                      ? 'badge-success'
                      : aiMeta.confidence === 'low'
                        ? 'badge-danger'
                        : 'badge-warning'
                  }`}
                >
                  Akurasi: {aiMeta.confidence === 'high' ? 'Tinggi' : aiMeta.confidence === 'low' ? 'Perlu Cek Ketat' : 'Sedang'}
                </span>
              </div>

              {/* Warnings / Anomalies detected by AI */}
              {warnings.length > 0 && (
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '11px',
                    background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      color: isLight ? '#b45309' : '#fbbf24',
                      marginBottom: '0.45rem'
                    }}
                  >
                    <AlertTriangle size={15} /> Perlu Perhatian / Anomali Terdeteksi ({warnings.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem', lineHeight: 1.45 }}>
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Data Snapshot Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                <div style={{ padding: '0.8rem 0.95rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} color="var(--primary)" /> Tour &amp; Destinasi
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.3rem' }}>
                    {parsedDraft.tourCode || '(Belum terdeteksi)'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {parsedDraft.country || '-'} · {parsedDraft.tourType}
                  </div>
                </div>

                <div style={{ padding: '0.8rem 0.95rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={12} color="var(--primary)" /> Jadwal Perjalanan
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                    {parsedDraft.departureDate || '-'} → {parsedDraft.returnDate || '-'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {aiMeta.roomingNote ? `Room: ${aiMeta.roomingNote}` : parsedDraft.category}
                  </div>
                </div>

                <div style={{ padding: '0.8rem 0.95rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <UserCheck size={12} color="var(--primary)" /> PIC Staff
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                    {parsedDraft.staffName || '(Pilih manual)'}
                  </div>
                  {aiMeta.rawStaff && aiMeta.rawStaff !== parsedDraft.staffName && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Di PDF: &ldquo;{aiMeta.rawStaff}&rdquo;
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.8rem 0.95rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <DollarSign size={12} color="#10b981" /> Harga &amp; Deposit
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                    Rp {formatCurrency(parsedDraft.financials?.totalSellingPrice || 0)}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    DP: Rp {formatCurrency(parsedDraft.financials?.depositAmount || 0)}
                  </div>
                </div>
              </div>

              {/* Extracted Travelers List */}
              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={13} color="var(--primary)" /> Peserta Terdeteksi ({parsedDraft.paxCount} Pax)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {parsedDraft.paxInfo.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '7px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {idx + 1}. {p.title}. {`${p.firstName} ${p.lastName}`.trim() || '(Nama kosong)'}
                        {p.phone ? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · {p.phone}</span> : null}
                      </span>
                      {Number(p.basicPrice) > 0 && (
                        <span className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 700 }}>
                          Rp {formatCurrency(p.basicPrice)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Fields to Complete */}
              {missingChecklist.length > 0 && (
                <div style={{ padding: '0.8rem 1rem', borderRadius: '10px', background: 'var(--primary-soft)', border: '1px solid var(--border-glow)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                    Yang perlu Anda lengkapi di Form Tour:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {missingChecklist.map((item) => (
                      <span
                        key={item}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}
                      >
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Notes */}
              {importantNotes.length > 0 && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
                  <strong>Catatan di Dokumen:</strong> {importantNotes.join(' · ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          {parsedDraft ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={resetModal} style={{ fontSize: '0.82rem' }}>
                <RotateCcw size={14} /> Upload Ulang File Lain
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmUseDraft} style={{ fontSize: '0.84rem' }}>
                Buka sebagai Draft di Form Tour <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isParsing}
                onClick={onClose}
                style={{ fontSize: '0.82rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedFile || isParsing}
                onClick={handleAnalyze}
                style={{ fontSize: '0.84rem', opacity: !selectedFile || isParsing ? 0.6 : 1 }}
              >
                <Sparkles size={15} />
                {isParsing ? 'Menganalisis…' : 'Analisis dengan AI Agent'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourAiImportModal;
