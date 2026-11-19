import { useState, useEffect, useMemo } from 'react';
import {
  FileDown,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  Users,
  MapPin,
  CreditCard,
  Lock,
  Info,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Sparkles,
  FileText,
  Edit3
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import TourRegistrationPreview from '../components/tours/TourRegistrationPreview';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  DEFAULT_NOTE_PRESETS,
  ROOMING_PRESETS,
  terbilangIndonesia,
  formatIdrAmount,
  parseAmountNumber,
  formatDepartureDateRange,
  getMinimumDepositTier,
  getActiveParticipants,
  buildSummaryBoxText,
  buildRegistrationFilename,
  buildRegistrationWhatsAppText,
  buildRegistrationEmailDraft,
  normalizePhoneForWa,
  generateTourRegistrationPdf,
  printTourRegistrationPdf
} from '../utils/tourRegistrationPdf';

const STORAGE_KEY = 'travelops_tour_reg_form_v1';
const BRANCH_STORAGE_KEY = 'travelops_tour_reg_branch';

const getTodayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getSavedBranch = () => {
  try {
    return localStorage.getItem(BRANCH_STORAGE_KEY) || 'Kelapa Gading';
  } catch {
    return 'Kelapa Gading';
  }
};

const createInitialForm = (defaultStaffName = '') => ({
  participants: [{ title: 'MR', fullName: '', note: '' }],
  leadPhone: '',
  leadEmail: '',
  roomingNote: '',
  tourCode: '',
  tourName: '',
  departureDate: '',
  returnDate: '',
  receivedBy: defaultStaffName,
  branchName: getSavedBranch(),
  formDate: getTodayIso(),
  showSignerName: false,
  tourPricePerPax: '',
  tourPriceCustomText: '',
  paymentMode: 'regular', // 'regular' | 'voucher'
  depositPerPax: '',
  depositNote: '',
  depositCustomText: '',
  voucherAmountPerPax: '',
  voucherLabel: 'Voucher PMK',
  voucherPaxCount: 1,
  cashDepositAmount: '',
  selectedNoteIds: DEFAULT_NOTE_PRESETS.filter((p) => p.defaultChecked).map((p) => p.id),
  customNotes: '',
  useCustomSummaryBox: false,
  customSummaryBoxText: ''
});

const formatNumericInput = (val) => {
  const num = parseAmountNumber(val);
  return num > 0 ? formatIdrAmount(num) : '';
};

const TourRegistrationForm = () => {
  const { user } = useAuth();
  const { staffUsers } = useUsers();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const defaultStaffName =
    user && (user.role || '').toLowerCase() !== 'admin' ? user.name || '' : '';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [previewMode, setPreviewMode] = useState('both'); // 'page1' | 'page2' | 'both'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [showAdvancedText, setShowAdvancedText] = useState(false);

  // Mark body while on registration form so keyboard Ctrl+P isolates ONLY the 2 A4 sheets
  useEffect(() => {
    document.body.classList.add('tour-reg-print-mode');
    return () => {
      document.body.classList.remove('tour-reg-print-mode');
    };
  }, []);

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...createInitialForm(defaultStaffName),
            ...parsed,
            participants:
              Array.isArray(parsed.participants) && parsed.participants.length > 0
                ? parsed.participants
                : [{ title: 'MR', fullName: '', note: '' }]
          };
        }
      }
    } catch {
      // ignore invalid stored draft
    }
    return createInitialForm(defaultStaffName);
  });

  // Auto-save form draft locally (never touches database)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        if (form.branchName && form.branchName.trim()) {
          localStorage.setItem(BRANCH_STORAGE_KEY, form.branchName.trim());
        }
      } catch {
        // ignore quota error
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [form]);

  const activePax = useMemo(() => getActiveParticipants(form.participants), [form.participants]);
  const paxCount = activePax.length;
  const terbilang = useMemo(() => terbilangIndonesia(paxCount), [paxCount]);
  const minDepositTier = useMemo(
    () => getMinimumDepositTier(form.tourPricePerPax),
    [form.tourPricePerPax]
  );
  const autoSummaryText = useMemo(() => buildSummaryBoxText(form), [form]);
  const outputFilename = useMemo(() => buildRegistrationFilename(form), [form]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateParticipant = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.participants];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, participants: next };
    });
  };

  const addParticipant = () => {
    setForm((prev) => ({
      ...prev,
      participants: [...prev.participants, { title: 'MR', fullName: '', note: '' }]
    }));
  };

  const removeParticipant = (index) => {
    setForm((prev) => {
      if (prev.participants.length <= 1) {
        return { ...prev, participants: [{ title: 'MR', fullName: '', note: '' }] };
      }
      return {
        ...prev,
        participants: prev.participants.filter((_, i) => i !== index)
      };
    });
  };

  const toggleNotePreset = (id) => {
    setForm((prev) => {
      const current = Array.isArray(prev.selectedNoteIds) ? prev.selectedNoteIds : [];
      const exists = current.includes(id);
      return {
        ...prev,
        selectedNoteIds: exists ? current.filter((x) => x !== id) : [...current, id]
      };
    });
  };

  const handleToggleManualSummary = (enabled) => {
    setForm((prev) => ({
      ...prev,
      useCustomSummaryBox: enabled,
      customSummaryBoxText: enabled && !prev.customSummaryBoxText ? buildSummaryBoxText(prev) : prev.customSummaryBoxText
    }));
  };

  const handleApplyMinDeposit = () => {
    if (!minDepositTier) return;
    if (form.paymentMode === 'voucher') {
      updateField('cashDepositAmount', String(minDepositTier.amount));
    } else {
      updateField('depositPerPax', String(minDepositTier.amount));
    }
    toast.info(`Nominal minimum deposit IDR ${formatIdrAmount(minDepositTier.amount)} diterapkan.`);
  };

  const validateBeforeExport = () => {
    if (activePax.length === 0) {
      toast.warning('Mohon isi minimal 1 nama peserta sesuai paspor terlebih dahulu.');
      return false;
    }
    if (!String(form.tourCode || '').trim() && !String(form.tourName || '').trim()) {
      toast.warning('Mohon isi Kode Tour atau Nama Paket Tour terlebih dahulu.');
      return false;
    }
    return true;
  };

  const handleDownloadPdf = async () => {
    if (!validateBeforeExport()) return;
    setIsGeneratingPdf(true);
    try {
      const { fileName } = await generateTourRegistrationPdf(form);
      toast.success(`PDF berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error(`Gagal membuat PDF: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {
    if (!validateBeforeExport()) return;
    setIsPrinting(true);
    try {
      const result = await printTourRegistrationPdf(form);
      if (result?.method === 'tab') {
        toast.info('PDF siap cetak dibuka di tab baru.');
      }
    } catch (err) {
      console.error('Direct PDF print failed:', err);
      toast.error(`Gagal menyiapkan cetakan PDF: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyWhatsAppText = async () => {
    const text = buildRegistrationWhatsAppText(form);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWa(true);
      toast.success('Pesan pengantar WhatsApp disalin! Tinggal tempel & lampirkan PDF.');
      setTimeout(() => setCopiedWa(false), 2200);
    } catch {
      toast.error('Tidak dapat mengakses clipboard browser.');
    }
  };

  const handleOpenWhatsApp = () => {
    const text = buildRegistrationWhatsAppText(form);
    const phone = normalizePhoneForWa(form.leadPhone);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmail = () => {
    const { mailtoUrl } = buildRegistrationEmailDraft(form);
    window.location.href = mailtoUrl;
  };

  const handleResetForm = () => {
    const confirmed = window.confirm(
      'Reset seluruh isian formulir pendaftaran? Data di database tour tidak akan terpengaruh.'
    );
    if (!confirmed) return;
    const fresh = createInitialForm(form.receivedBy || defaultStaffName);
    fresh.branchName = form.branchName || getSavedBranch();
    setForm(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.info('Formulir dikosongkan dan siap untuk customer berikutnya.');
  };

  const sectionCardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '1.15rem 1.25rem'
  };

  const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.9rem',
    paddingBottom: '0.65rem',
    borderBottom: '1px solid var(--border)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.32rem'
  };

  return (
    <div className="app-container">
      {/* Screen preview page toggle + strict Ctrl+P print isolation (hides all web UI & overlays) */}
      <style>{`
        .tour-reg-screen-hidden {
          display: none !important;
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.tour-reg-print-mode * {
            visibility: hidden !important;
          }
          .sidebar,
          .top-nav,
          .overlay,
          .no-print,
          .no-print-area,
          .toast-floating-container {
            display: none !important;
          }
          .app-container, .main-content, .content-area, .page-container {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 210mm !important;
            background: #ffffff !important;
          }
          .tour-reg-workspace-grid {
            display: block !important;
          }
          .tour-reg-preview-pane {
            position: static !important;
            border: none !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .tour-reg-preview-scroll {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .tour-reg-print-root,
          .tour-reg-print-root * {
            visibility: visible !important;
          }
          .tour-reg-print-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            gap: 0 !important;
            background: #ffffff !important;
          }
          .tour-reg-screen-hidden {
            display: flex !important;
          }
          .tour-reg-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: none !important;
            width: 210mm !important;
            min-height: 296mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            background: #ffffff !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .tour-reg-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={() => {
          if (window.innerWidth <= 768) setIsSidebarOpen(false);
        }}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        closeMobile={() => {
          if (window.innerWidth <= 768) setIsSidebarOpen(false);
        }}
      />

      <div className="main-content">
        <TopNav toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <div className="content-area">
          <div className="page-container" style={{ maxWidth: '1760px', margin: '0 auto' }}>
          {/* Page Header */}
          <div
            className="no-print-area"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Formulir Pendaftaran Tour
                </h1>
                <span
                  className="badge badge-info"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', fontSize: '0.72rem' }}
                  title="Modul ini khusus untuk membuat & mengirim PDF formulir ke customer tanpa menyimpan ke database Tour."
                >
                  <Info size={12} /> Form Generator Saja · Non-Database
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Buat PDF Formulir Pendaftaran resmi Dwidayatour (2 halaman A4 lengkap dengan Syarat &amp; Ketentuan baku)
                siap kirim ke customer via WhatsApp atau cetak.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetForm}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                title="Kosongkan formulir untuk tamu baru"
              >
                <RotateCcw size={15} /> Reset
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyWhatsAppText}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                title="Salin pesan pengantar WhatsApp"
              >
                {copiedWa ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                {copiedWa ? 'Tersalin' : 'Salin Teks WA'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenWhatsApp}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.85rem',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: isLight ? '#047857' : '#34d399'
                }}
                title="Buka chat WhatsApp customer dengan pesan pengantar otomatis"
              >
                <MessageCircle size={15} /> Kirim WA
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenEmail}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                title="Buka draft email ke alamat email customer"
              >
                <Mail size={15} /> Email
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrint}
                disabled={isPrinting}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                title="Cetak langsung dokumen PDF 2 halaman A4 (tanpa tampilan web)"
              >
                <Printer size={15} /> {isPrinting ? 'Menyiapkan...' : 'Cetak'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                style={{ fontSize: '0.82rem', padding: '0.52rem 1.05rem', fontWeight: 700 }}
              >
                <FileDown size={16} />
                {isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF (2 Hal.)'}
              </button>
            </div>
          </div>

          {/* Split-Screen Grid: Left Form Builder | Right Live A4 Preview */}
          <div
            className="tour-reg-workspace-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start'
            }}
          >
            {/* LEFT PANE: FORM BUILDER */}
            <div className="no-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* SECTION 1: PESERTA & KAMAR */}
              <section style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={17} color="var(--primary)" />
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      1. Daftar Peserta &amp; Pengaturan Kamar
                    </h2>
                  </div>
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: '0.73rem', fontWeight: 700 }}
                    title="Dihitung otomatis dari nama peserta yang terisi agar tidak terjadi selisih jumlah pax"
                  >
                    Total: {paxCount} ( {terbilang} ) Peserta
                  </span>
                </div>

                {/* Participant Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.8rem' }}>
                  {form.participants.map((pax, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '82px 1.35fr 1fr 34px',
                        gap: '0.45rem',
                        alignItems: 'center'
                      }}
                    >
                      <select
                        value={pax.title}
                        onChange={(e) => updateParticipant(idx, 'title', e.target.value)}
                        aria-label={`Title peserta ${idx + 1}`}
                        style={{ padding: '0.48rem 0.5rem', fontSize: '0.82rem' }}
                      >
                        <option value="MR">MR</option>
                        <option value="MRS">MRS</option>
                        <option value="MS">MS</option>
                        <option value="MSTR">MSTR</option>
                        <option value="MISS">MISS</option>
                      </select>

                      <input
                        type="text"
                        value={pax.fullName}
                        onChange={(e) => updateParticipant(idx, 'fullName', e.target.value.toUpperCase())}
                        placeholder={`Nama Peserta ${idx + 1} sesuai paspor`}
                        style={{
                          padding: '0.48rem 0.65rem',
                          fontSize: '0.82rem',
                          textTransform: 'uppercase'
                        }}
                      />

                      <input
                        type="text"
                        value={pax.note}
                        onChange={(e) => updateParticipant(idx, 'note', e.target.value)}
                        placeholder={idx === 0 ? 'Ket. tambahan (opsional)' : 'Ket. pax (opsional)'}
                        style={{ padding: '0.48rem 0.65rem', fontSize: '0.8rem' }}
                      />

                      <button
                        type="button"
                        className="icon-action-btn danger"
                        onClick={() => removeParticipant(idx)}
                        title="Hapus baris peserta"
                        aria-label={`Hapus peserta ${idx + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addParticipant}
                  style={{ fontSize: '0.78rem', padding: '0.42rem 0.8rem', marginBottom: '0.95rem' }}
                >
                  <Plus size={14} /> Tambah Peserta
                </button>

                {/* Lead Contact (Phone & Email) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>No. Telepon / WhatsApp Lead Pax</label>
                    <input
                      type="text"
                      value={form.leadPhone}
                      onChange={(e) => updateField('leadPhone', e.target.value)}
                      placeholder="+62812xxxxxxxx"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Tampil di kolom Keterangan baris ke-1 (NOTELP).
                    </span>
                  </div>

                  <div>
                    <label style={labelStyle}>Email Lead Pax</label>
                    <input
                      type="email"
                      value={form.leadEmail}
                      onChange={(e) => updateField('leadEmail', e.target.value)}
                      placeholder="customer@email.com"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Tampil di kolom Keterangan (EMAIL) &amp; tombol Kirim Email.
                    </span>
                  </div>
                </div>

                {/* Rooming */}
                <div>
                  <label style={labelStyle}>Pengaturan Kamar (Rooming)</label>
                  <input
                    type="text"
                    value={form.roomingNote}
                    onChange={(e) => updateField('roomingNote', e.target.value.toUpperCase())}
                    placeholder="Contoh: TRIPLE ROOM"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.7rem',
                      fontSize: '0.83rem',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                {/* Rooming Quick Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
                  {ROOMING_PRESETS.map((preset) => {
                    const active = form.roomingNote.trim().toUpperCase() === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateField('roomingNote', active ? '' : preset)}
                        style={{
                          padding: '0.22rem 0.58rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'var(--primary-soft)' : 'transparent',
                          color: active ? 'var(--primary)' : 'var(--text-muted)'
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2: DETAIL PAKET & STAFF */}
              <section style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={17} color="var(--primary)" />
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      2. Detail Paket Tour &amp; Staff Penerima
                    </h2>
                  </div>
                  {(form.departureDate || form.returnDate) && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.71rem' }}>
                      {formatDepartureDateRange(form.departureDate, form.returnDate)}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Tour Code</label>
                    <input
                      type="text"
                      value={form.tourCode}
                      onChange={(e) => updateField('tourCode', e.target.value.toUpperCase())}
                      placeholder="VDASKOSKIDMZ"
                      className="font-mono"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nama Paket Tour</label>
                    <input
                      type="text"
                      value={form.tourName}
                      onChange={(e) => updateField('tourName', e.target.value)}
                      placeholder="7D5N VD Korea Incheon Winter with DMZ Ski Experience"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Tanggal Berangkat</label>
                    <input
                      type="date"
                      value={form.departureDate}
                      onChange={(e) => updateField('departureDate', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tanggal Pulang</label>
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => updateField('returnDate', e.target.value)}
                      min={form.departureDate || undefined}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.9fr', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <div>
                    <label style={labelStyle}>Reservasi Diterima Oleh</label>
                    <input
                      type="text"
                      list="tour-reg-staff-list"
                      value={form.receivedBy}
                      onChange={(e) => updateField('receivedBy', e.target.value)}
                      placeholder="Nama staff / panggilan"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                    <datalist id="tour-reg-staff-list">
                      {(staffUsers || []).map((s) => (
                        <option key={s.id || s.name} value={s.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={labelStyle}>Cabang / Agent</label>
                    <input
                      type="text"
                      value={form.branchName}
                      onChange={(e) => updateField('branchName', e.target.value)}
                      placeholder="Kelapa Gading"
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Tanggal Formulir</label>
                    <input
                      type="date"
                      value={form.formDate}
                      onChange={(e) => updateField('formDate', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.showSignerName)}
                    onChange={(e) => updateField('showSignerName', e.target.checked)}
                  />
                  Tampilkan nama peserta utama di bawah garis tanda tangan
                </label>
              </section>

              {/* SECTION 3: HARGA, UANG MUKA & KOTAK RINGKASAN */}
              <section style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={17} color="var(--primary)" />
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      3. Harga Tour, Uang Muka &amp; Catatan
                    </h2>
                  </div>

                  {/* Mode Switcher: Regular vs Voucher PMK */}
                  <div className="tabs-container" style={{ marginBottom: 0, padding: '2px' }}>
                    <button
                      type="button"
                      className={`tab-btn ${form.paymentMode === 'regular' ? 'active' : ''}`}
                      onClick={() => updateField('paymentMode', 'regular')}
                      style={{ padding: '0.26rem 0.65rem', fontSize: '0.73rem' }}
                    >
                      Reguler
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${form.paymentMode === 'voucher' ? 'active' : ''}`}
                      onClick={() => updateField('paymentMode', 'voucher')}
                      style={{ padding: '0.26rem 0.65rem', fontSize: '0.73rem' }}
                    >
                      Voucher PMK / Subsidi
                    </button>
                  </div>
                </div>

                {/* Tour Price + S&K Min Deposit Hint */}
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={labelStyle}>Harga Tour per Pax (IDR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumericInput(form.tourPricePerPax)}
                    onChange={(e) => updateField('tourPricePerPax', String(parseAmountNumber(e.target.value) || ''))}
                    placeholder="Contoh: 18,977,000"
                    className="font-mono"
                    style={{ width: '100%', padding: '0.52rem 0.75rem', fontSize: '0.86rem' }}
                  />

                  {minDepositTier && (
                    <div
                      style={{
                        marginTop: '0.45rem',
                        padding: '0.45rem 0.7rem',
                        borderRadius: '9px',
                        background: isLight ? '#eff6ff' : 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        fontSize: '0.74rem'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)' }}>
                        <Sparkles size={13} color="var(--primary)" />
                        <span>
                          Acuan S&amp;K Hal. 2: <strong>{minDepositTier.label}</strong>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyMinDeposit}
                        style={{
                          background: 'var(--primary)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Terapkan
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Mode Fields */}
                {form.paymentMode === 'regular' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <label style={labelStyle}>Jumlah Uang Muka / DP per Pax (IDR)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumericInput(form.depositPerPax)}
                        onChange={(e) => updateField('depositPerPax', String(parseAmountNumber(e.target.value) || ''))}
                        placeholder="Contoh: 10,000,000"
                        className="font-mono"
                        style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Keterangan DP (Opsional)</label>
                      <input
                        type="text"
                        value={form.depositNote}
                        onChange={(e) => updateField('depositNote', e.target.value)}
                        placeholder="Contoh: Transfer BCA / Kartu Kredit"
                        style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.83rem' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '0.85rem',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Nilai Voucher per Pax (IDR)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumericInput(form.voucherAmountPerPax)}
                        onChange={(e) =>
                          updateField('voucherAmountPerPax', String(parseAmountNumber(e.target.value) || ''))
                        }
                        placeholder="Contoh: 16,900,000"
                        className="font-mono"
                        style={{ width: '100%', padding: '0.48rem 0.7rem', fontSize: '0.83rem' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Label Voucher</label>
                      <input
                        type="text"
                        value={form.voucherLabel}
                        onChange={(e) => updateField('voucherLabel', e.target.value)}
                        placeholder="Voucher PMK"
                        style={{ width: '100%', padding: '0.48rem 0.7rem', fontSize: '0.83rem' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Jumlah Pax Menggunakan Voucher</label>
                      <input
                        type="number"
                        min={0}
                        max={Math.max(1, paxCount)}
                        value={form.voucherPaxCount}
                        onChange={(e) => updateField('voucherPaxCount', Math.max(0, Number(e.target.value) || 0))}
                        style={{ width: '100%', padding: '0.48rem 0.7rem', fontSize: '0.83rem' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Deposit Tunai Tambahan (IDR)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumericInput(form.cashDepositAmount)}
                        onChange={(e) =>
                          updateField('cashDepositAmount', String(parseAmountNumber(e.target.value) || ''))
                        }
                        placeholder="Contoh: 10,000,000"
                        className="font-mono"
                        style={{ width: '100%', padding: '0.48rem 0.7rem', fontSize: '0.83rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Optional Custom Header Text Override */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedText((v) => !v)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {showAdvancedText
                      ? 'Sembunyikan teks kustom baris Harga / DP'
                      : '+ Teks kustom baris Harga / DP (jika harga beda dewasa & anak)'}
                  </button>

                  {showAdvancedText && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.55rem' }}>
                      <div>
                        <label style={labelStyle}>Override Teks "Harga tur"</label>
                        <input
                          type="text"
                          value={form.tourPriceCustomText}
                          onChange={(e) => updateField('tourPriceCustomText', e.target.value)}
                          placeholder="Kosongkan untuk otomatis"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Override Teks "Uang Muka"</label>
                        <input
                          type="text"
                          value={form.depositCustomText}
                          onChange={(e) => updateField('depositCustomText', e.target.value)}
                          placeholder="Kosongkan untuk otomatis"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* NOTE Presets */}
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={labelStyle}>Catatan Standar (NOTE di kotak kiri bawah)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {DEFAULT_NOTE_PRESETS.map((preset) => {
                      const checked = (form.selectedNoteIds || []).includes(preset.id);
                      return (
                        <label
                          key={preset.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.78rem',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleNotePreset(preset.id)}
                          />
                          <span>{preset.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={labelStyle}>Catatan Tambahan Bebas (1 baris = 1 poin)</label>
                  <textarea
                    rows={2}
                    value={form.customNotes}
                    onChange={(e) => updateField('customNotes', e.target.value)}
                    placeholder="Contoh: REQUEST MEAL NO PORK / WHEELCHAIR ASSISTANCE"
                    style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.8rem', resize: 'vertical' }}
                  />
                </div>

                {/* Manual Override Toggle for Bottom-Left Summary Box */}
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.75rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.45rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Edit3 size={13} color="var(--primary)" /> Isi Kotak Ringkasan Harga &amp; Note
                    </span>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form.useCustomSummaryBox)}
                        onChange={(e) => handleToggleManualSummary(e.target.checked)}
                      />
                      Edit Manual
                    </label>
                  </div>

                  {form.useCustomSummaryBox ? (
                    <textarea
                      rows={7}
                      value={form.customSummaryBoxText}
                      onChange={(e) => updateField('customSummaryBoxText', e.target.value)}
                      className="font-mono"
                      style={{ width: '100%', padding: '0.55rem 0.7rem', fontSize: '0.76rem', lineHeight: 1.45 }}
                    />
                  ) : (
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '9px',
                        background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.025)',
                        border: '1px dashed var(--border)',
                        fontSize: '0.74rem',
                        lineHeight: 1.45,
                        color: 'var(--text-muted)',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                    >
                      {autoSummaryText || 'Otomatis terisi saat Harga Tour / DP / Note dilengkapi...'}
                    </pre>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT PANE: LIVE A4 DOCUMENT PREVIEW */}
            <div
              className="tour-reg-preview-pane"
              style={{
                position: 'sticky',
                top: '0.5rem',
                background: isLight ? '#e2e8f0' : '#0f172a',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              {/* Preview Toolbar */}
              <div
                className="no-print-area"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '11px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <FileText size={15} color="var(--primary)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Live Preview A4
                  </span>
                  <span
                    className="badge badge-neutral"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.68rem' }}
                    title="Syarat & Ketentuan halaman 2 terkunci mengikuti dokumen resmi Dwidayatour."
                  >
                    <Lock size={10} /> S&amp;K Hal. 2 Baku
                  </span>
                </div>

                <div className="tabs-container" style={{ marginBottom: 0, padding: '2px' }}>
                  {[
                    { id: 'page1', label: 'Hal. 1 (Data)' },
                    { id: 'page2', label: 'Hal. 2 (S&K)' },
                    { id: 'both', label: '2 Halaman' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tab-btn ${previewMode === tab.id ? 'active' : ''}`}
                      onClick={() => setPreviewMode(tab.id)}
                      style={{ padding: '0.24rem 0.58rem', fontSize: '0.72rem' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filename Preview Bar */}
              <div
                className="no-print-area"
                style={{
                  fontSize: '0.71rem',
                  color: 'var(--text-muted)',
                  padding: '0 0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Nama file: <strong className="font-mono" style={{ color: 'var(--text-main)' }}>{outputFilename}</strong>
                </span>
              </div>

              {/* Scrollable A4 Canvas */}
              <div
                className="tour-reg-preview-scroll"
                style={{
                  maxHeight: 'calc(100vh - 210px)',
                  overflowY: 'auto',
                  padding: '4px 2px 10px'
                }}
              >
                <TourRegistrationPreview form={form} viewMode={previewMode} />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourRegistrationForm;
