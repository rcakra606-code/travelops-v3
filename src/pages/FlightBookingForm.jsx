import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plane,
  Sparkles,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Users,
  DollarSign,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Printer,
  FileDown,
  RotateCcw,
  Loader2,
  Luggage,
  ClipboardPaste,
  Info
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import FlightBookingPreview from '../components/flights/FlightBookingPreview';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { normalizePhoneForWa } from '../utils/tourRegistrationPdf';
import {
  CURRENCY_OPTIONS,
  DEFAULT_PASSPORT_CLAUSE,
  createEmptyPassenger,
  createEmptySegment,
  computeEnrichedSegments,
  summarizeAirlinesFromSegments,
  parseGdsTextFallback,
  parseAmountNumber,
  formatNumberWithCommas,
  formatDateShortId,
  buildBaggageText,
  buildChangePolicyText,
  buildRefundPolicyText,
  buildTimeLimitText,
  buildFlightConfirmationWhatsAppText,
  buildFlightConfirmationEmailDraft,
  getActivePassengers,
  generateFlightBookingPdf,
  printFlightBookingPdf
} from '../utils/flightBookingHelpers';

const STORAGE_KEY = 'travelops_flight_booking_form_v1';
const BRANCH_STORAGE_KEY = 'travelops_tour_reg_branch';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const SAMPLE_GDS_DEMO = `1.1SANTOSO/BUDI MR  2.1SANTOSO/ANI MRS
1  BR 238 S 25NOV 3*CGKTPE 1440 2100
2  BR 028 S 25NOV 3*TPESFO 2330 1840
3  BR 017 W 08DEC 2*SFOTPE 2350 0600 +2
4  BR 237 W 10DEC 4*TPECGK 0900 1325`;

const getSavedBranch = () => {
  try {
    return localStorage.getItem(BRANCH_STORAGE_KEY) || 'Kelapa Gading';
  } catch {
    return 'Kelapa Gading';
  }
};

const createInitialForm = (defaultStaffName = '') => ({
  agentBookingCode: '',
  airlinesBookingCode: '',
  airlinesLabel: '',
  customerPhone: '',
  customerEmail: '',
  branchName: getSavedBranch(),
  staffName: defaultStaffName,
  passengers: [createEmptyPassenger()],
  segments: [createEmptySegment()],
  priceAdult: '',
  priceChild: '',
  priceInfant: '',
  timeLimitDate: '',
  timeLimitTime: '15:00',
  timeLimitTz: 'WIB',
  baggageConcept: 'weight', // 'weight' | 'piece'
  baggageWeightKg: '30',
  baggagePieces: '2',
  baggageWeightPerPiece: '23',
  isNonChangeable: false,
  changePenaltyCurrency: 'IDR',
  changePenaltyAmount: '',
  isNonRefundable: false,
  refundPenaltyCurrency: 'IDR',
  refundPenaltyAmount: '',
  extraNotes: ''
});

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });

const FlightBookingForm = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const defaultStaffName =
    user && (user.role || '').toLowerCase() !== 'admin' ? user.name || '' : '';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [previewMode, setPreviewMode] = useState('whatsapp'); // 'whatsapp' | 'document' | 'both'
  const [copiedWa, setCopiedWa] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // AI Parser Module state (Screenshot / PDF / Pure Text)
  const [rawTextInput, setRawTextInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, mimeType, size, dataUrl, isImage }
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiStatusBanner, setAiStatusBanner] = useState(null); // { tone, text }
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...createInitialForm(defaultStaffName),
            ...parsed,
            passengers:
              Array.isArray(parsed.passengers) && parsed.passengers.length > 0
                ? parsed.passengers
                : [createEmptyPassenger()],
            segments:
              Array.isArray(parsed.segments) && parsed.segments.length > 0
                ? parsed.segments
                : [createEmptySegment()]
          };
        }
      }
    } catch {
      // ignore corrupted draft
    }
    return createInitialForm(defaultStaffName);
  });

  // Auto-save form draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore quota errors
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [form]);

  // Body class for clean Ctrl+P print isolation
  useEffect(() => {
    document.body.classList.add('flight-booking-print-mode');
    return () => document.body.classList.remove('flight-booking-print-mode');
  }, []);

  const handleAttachFile = useCallback(
    async (file) => {
      if (!file) return;
      const mime = (file.type || '').toLowerCase();
      const isSupported =
        mime === 'application/pdf' ||
        mime === 'image/png' ||
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        mime === 'image/webp' ||
        /\.(pdf|png|jpe?g|webp)$/i.test(file.name || '');

      if (!isSupported) {
        toast.error('Format file harus PDF atau Gambar screenshot (PNG, JPG, WEBP).');
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error('Ukuran file maksimal 10 MB.');
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        const resolvedMime =
          mime || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
        setAttachedFile({
          name: file.name || `Screenshot_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
          mimeType: resolvedMime,
          size: file.size,
          dataUrl,
          isImage: resolvedMime.startsWith('image/')
        });
        toast.success(`Lampiran "${file.name || 'Screenshot'}" siap di-parse AI.`);
      } catch (err) {
        toast.error(err?.message || 'Gagal membaca file.');
      }
    },
    [toast]
  );

  // Global Ctrl+V clipboard screenshot paste support!
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type === 'application/pdf')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleAttachFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAttachFile]);

  const enrichedSegments = useMemo(() => computeEnrichedSegments(form.segments), [form.segments]);
  const autoAirlinesSummary = useMemo(
    () => summarizeAirlinesFromSegments(enrichedSegments),
    [enrichedSegments]
  );
  const activePax = useMemo(() => getActivePassengers(form.passengers), [form.passengers]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePassenger = (idx, field, value) => {
    setForm((prev) => {
      const next = [...prev.passengers];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, passengers: next };
    });
  };

  const addPassenger = () => {
    setForm((prev) => ({
      ...prev,
      passengers: [...prev.passengers, createEmptyPassenger()]
    }));
  };

  const removePassenger = (idx) => {
    setForm((prev) => {
      if (prev.passengers.length <= 1) {
        return { ...prev, passengers: [createEmptyPassenger()] };
      }
      return { ...prev, passengers: prev.passengers.filter((_, i) => i !== idx) };
    });
  };

  const updateSegment = (idx, field, value) => {
    setForm((prev) => {
      const next = [...prev.segments];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, segments: next };
    });
  };

  const addSegment = () => {
    setForm((prev) => {
      const lastSeg = prev.segments[prev.segments.length - 1];
      const nextSeg = createEmptySegment();
      if (lastSeg?.airlineCode) nextSeg.airlineCode = lastSeg.airlineCode;
      if (lastSeg?.destinationCode) nextSeg.originCode = lastSeg.destinationCode;
      if (lastSeg?.departureDate) nextSeg.departureDate = lastSeg.departureDate;
      return { ...prev, segments: [...prev.segments, nextSeg] };
    });
  };

  const removeSegment = (idx) => {
    setForm((prev) => {
      if (prev.segments.length <= 1) {
        return { ...prev, segments: [createEmptySegment()] };
      }
      return { ...prev, segments: prev.segments.filter((_, i) => i !== idx) };
    });
  };

  const applyParsedResultToForm = (parsed, sourceLabel) => {
    const nextPax =
      Array.isArray(parsed?.passengers) && parsed.passengers.length > 0
        ? parsed.passengers.map((p) => ({
            title: String(p?.title || 'MR').trim().toUpperCase(),
            fullName: String(p?.fullName || '').trim().toUpperCase(),
            paxType: ['ADT', 'CHD', 'INF'].includes(String(p?.paxType || '').toUpperCase())
              ? String(p.paxType).toUpperCase()
              : 'ADT'
          }))
        : null;

    const nextSegs =
      Array.isArray(parsed?.segments) && parsed.segments.length > 0
        ? parsed.segments.map((s) => ({
            ...createEmptySegment(),
            airlineCode: String(s?.airlineCode || '').trim().toUpperCase(),
            airlineName: String(s?.airlineName || '').trim(),
            flightNumber: String(s?.flightNumber || '').trim().toUpperCase(),
            bookingClass: String(s?.bookingClass || '').trim().toUpperCase(),
            departureDate: String(s?.departureDate || '').trim(),
            originCode: String(s?.originCode || '').trim().toUpperCase(),
            originCity: String(s?.originCity || '').trim(),
            destinationCode: String(s?.destinationCode || '').trim().toUpperCase(),
            destinationCity: String(s?.destinationCity || '').trim(),
            departureTime: String(s?.departureTime || '').trim(),
            arrivalTime: String(s?.arrivalTime || '').trim(),
            arrivalDayOffset: Number.isFinite(Number(s?.arrivalDayOffset))
              ? parseInt(s.arrivalDayOffset, 10)
              : 0,
            terminalOrigin: String(s?.terminalOrigin || '').trim(),
            terminalDestination: String(s?.terminalDestination || '').trim()
          }))
        : null;

    if (!nextPax && !nextSegs) {
      toast.warning('AI tidak menemukan nama penumpang atau segmen penerbangan yang valid.');
      return;
    }

    const enrichedPreview = nextSegs ? computeEnrichedSegments(nextSegs) : [];
    const autoAirlines = nextSegs ? summarizeAirlinesFromSegments(enrichedPreview) : '';

    // Detect baggage hint if present (e.g. "2PC" -> piece, "30K" -> weight)
    const bagNote = String(parsed?.baggageNote || '').trim();
    const pieceMatch = bagNote.match(/(\d+)\s*(?:pc|pcs|piece)/i);
    const kgMatch = bagNote.match(/(\d+)\s*(?:kg|k\b)/i);

    setForm((prev) => ({
      ...prev,
      agentBookingCode: prev.agentBookingCode || String(parsed?.agentBookingCode || '').trim().toUpperCase(),
      airlinesBookingCode:
        prev.airlinesBookingCode || String(parsed?.airlinesBookingCode || '').trim().toUpperCase(),
      airlinesLabel: autoAirlines || prev.airlinesLabel,
      passengers: nextPax || prev.passengers,
      segments: nextSegs || prev.segments,
      ...(pieceMatch
        ? {
            baggageConcept: 'piece',
            baggagePieces: pieceMatch[1],
            baggageWeightPerPiece: kgMatch ? kgMatch[1] : prev.baggageWeightPerPiece || '23'
          }
        : kgMatch
          ? {
              baggageConcept: 'weight',
              baggageWeightKg: kgMatch[1]
            }
          : {})
    }));

    const paxMsg = nextPax ? `${nextPax.length} penumpang` : '0 penumpang (isi manual)';
    const segMsg = nextSegs ? `${nextSegs.length} segmen` : '0 segmen';
    const summaryText =
      parsed?.summary ||
      `${sourceLabel}: berhasil mengekstrak ${paxMsg} dan ${segMsg}${autoAirlines ? ` (${autoAirlines})` : ''}.`;

    setAiStatusBanner({ tone: 'success', text: summaryText });
    toast.success(`AI Auto-Parse selesai: ${paxMsg} & ${segMsg}!`);
  };

  const handleParseWithAi = async () => {
    const hasText = rawTextInput.trim().length > 0;
    const hasFile = Boolean(attachedFile?.dataUrl);
    if (!hasText && !hasFile) {
      toast.warning('Tempel teks reservasi GDS, paste screenshot (Ctrl+V), atau unggah file PDF/Gambar terlebih dahulu.');
      return;
    }

    setIsParsingAi(true);
    setAiStatusBanner(null);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/flights/parse-reservation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          textInput: hasText ? rawTextInput.trim() : undefined,
          fileBase64: hasFile ? attachedFile.dataUrl : undefined,
          mimeType: hasFile ? attachedFile.mimeType : undefined,
          fileName: hasFile ? attachedFile.name : undefined
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success && payload.data) {
        applyParsedResultToForm(payload.data, 'Gemini AI');
        return;
      }

      throw new Error(payload.error || 'AI tidak merespons');
    } catch (err) {
      console.warn('[Flight AI Parse] Falling back to local GDS parser:', err?.message);
      if (hasText) {
        const localParsed = parseGdsTextFallback(rawTextInput);
        if (localParsed.segments.length > 0 || localParsed.passengers.length > 0) {
          applyParsedResultToForm(localParsed, 'Parser GDS Lokal (Fallback)');
          setAiStatusBanner({
            tone: 'warning',
            text: `Mode fallback lokal aktif (${err?.message || 'AI sibuk'}): ${localParsed.summary}`
          });
          return;
        }
      }
      setAiStatusBanner({
        tone: 'error',
        text: err?.message || 'Gagal memproses data reservasi dengan AI.'
      });
      toast.error(err?.message || 'Gagal memproses data reservasi dengan AI.');
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleCopyWhatsApp = async () => {
    const text = buildFlightConfirmationWhatsAppText(form);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWa(true);
      toast.success('Format pemesanan tiket disalin! Siap tempel ke WhatsApp / Chat.');
      setTimeout(() => setCopiedWa(false), 2200);
    } catch {
      toast.error('Tidak dapat mengakses clipboard browser.');
    }
  };

  const handleOpenWhatsApp = () => {
    const text = buildFlightConfirmationWhatsAppText(form);
    const phone = normalizePhoneForWa(form.customerPhone);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmail = () => {
    const { mailtoUrl } = buildFlightConfirmationEmailDraft(form);
    window.location.href = mailtoUrl;
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { fileName } = await generateFlightBookingPdf(form);
      toast.success(`PDF berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error('Flight PDF export failed:', err);
      toast.error(`Gagal membuat PDF: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    setIsPrinting(true);
    try {
      await printFlightBookingPdf(form);
    } catch (err) {
      console.error('Flight PDF print failed:', err);
      toast.error(`Gagal menyiapkan cetakan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleResetForm = () => {
    const confirmed = window.confirm('Reset seluruh isian form pemesanan tiket untuk customer baru?');
    if (!confirmed) return;
    setForm(createInitialForm(form.staffName || defaultStaffName));
    setRawTextInput('');
    setAttachedFile(null);
    setAiStatusBanner(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.info('Form pemesanan tiket dikosongkan.');
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
    paddingBottom: '0.6rem',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.3rem'
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    borderRadius: '8px',
    padding: '0.5rem 0.68rem',
    fontSize: '0.82rem',
    outline: 'none'
  };

  return (
    <div className="app-container">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body.flight-booking-print-mode * { visibility: hidden !important; }
          .sidebar, .top-nav, .overlay, .no-print-area, .toast-floating-container { display: none !important; }
          .flight-booking-print-root, .flight-booking-print-root * { visibility: visible !important; }
          .flight-booking-print-root { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; }
          .flight-booking-sheet { box-shadow: none !important; max-width: none !important; width: 210mm !important; }
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
            {/* PAGE HEADER */}
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
                  <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plane size={22} color={neonBlue} /> Form Pemesanan Tiket Pesawat (AI Parser)
                  </h1>
                  <span
                    className="badge badge-info"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', fontSize: '0.72rem' }}
                  >
                    <Sparkles size={12} /> Screenshot · PDF · Teks GDS
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Tempel screenshot (<kbd>Ctrl+V</kbd>), unggah PDF, atau paste teks PNR — AI otomatis mengisi penumpang, detail bandara, durasi transit, peringatan dinihari H-1, dan tanggal tiba (+1/+2).
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetForm}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                >
                  <RotateCcw size={15} /> Reset
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyWhatsApp}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
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
                >
                  <MessageCircle size={15} /> Kirim WA
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleOpenEmail}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                >
                  <Mail size={15} /> Email
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrintPdf}
                  disabled={isPrinting}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
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
                  {isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* SPLIT-SCREEN WORKSPACE */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '1.25rem',
                alignItems: 'start'
              }}
            >
              {/* LEFT PANE: AI PARSER + FORM BUILDER */}
              <div className="no-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* MODULE 0: AI MULTIMODAL PARSER (SCREENSHOT / PDF / PURE TEXT) */}
                <section
                  style={{
                    ...sectionCardStyle,
                    background: isLight
                      ? 'linear-gradient(135deg, rgba(2,132,199,0.05) 0%, rgba(16,185,129,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(16,185,129,0.06) 100%)',
                    borderColor: `${neonBlue}45`
                  }}
                >
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={17} color={neonBlue} />
                      <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        AI Auto-Parse Reservasi (Screenshot / PDF / Teks)
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setRawTextInput(SAMPLE_GDS_DEMO)}
                      style={{ fontSize: '0.72rem', padding: '0.26rem 0.65rem' }}
                    >
                      <ClipboardPaste size={12} /> Isi Contoh GDS
                    </button>
                  </div>

                  {/* Dropzone + Ctrl+V Screenshot / PDF Upload */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer?.files?.[0];
                      if (f) handleAttachFile(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? neonBlue : 'var(--border)'}`,
                      borderRadius: '11px',
                      padding: attachedFile ? '0.75rem 0.9rem' : '1.05rem 1rem',
                      background: isDragging
                        ? `${neonBlue}12`
                        : isLight
                          ? '#ffffff'
                          : 'rgba(15, 23, 42, 0.5)',
                      cursor: 'pointer',
                      marginBottom: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {attachedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                          {attachedFile.isImage ? (
                            <img
                              src={attachedFile.dataUrl}
                              alt="Screenshot reservasi"
                              style={{ width: '54px', height: '42px', objectFit: 'cover', borderRadius: '7px', border: '1px solid var(--border)' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '9px',
                                background: 'rgba(239, 68, 68, 0.14)',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <FileText size={20} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {attachedFile.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                              {attachedFile.isImage ? 'Screenshot / Gambar siap di-parse' : 'File PDF siap di-parse'} ({Math.max(1, Math.round(attachedFile.size / 1024))} KB)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="Hapus lampiran"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: neonBlue }}>
                          <UploadCloud size={20} />
                          <ImageIcon size={17} />
                          <FileText size={17} />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: 'var(--text-main)' }}>Tempel Screenshot (Ctrl+V)</strong> atau klik / tarik file <strong>PDF / PNG / JPG</strong> ke sini
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAttachFile(f);
                      }}
                    />
                  </div>

                  {/* Pure Text Reservation Paste Box */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Atau Paste Teks Reservasi Murni (Galileo / Amadeus / Sabre / Itinerary)</label>
                    <textarea
                      rows={4}
                      value={rawTextInput}
                      onChange={(e) => setRawTextInput(e.target.value)}
                      placeholder={`Contoh:\n1.1SANTOSO/BUDI MR\n1  BR 238 S 25NOV 3*CGKTPE 1440 2100\n2  BR 028 S 25NOV 3*TPESFO 2330 1840`}
                      className="font-mono"
                      style={{
                        ...inputStyle,
                        fontSize: '0.76rem',
                        lineHeight: 1.45,
                        resize: 'vertical',
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={12} /> Bisa gunakan teks saja, gambar/PDF saja, atau keduanya bersamaan.
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleParseWithAi}
                      disabled={isParsingAi}
                      style={{
                        background: `linear-gradient(135deg, ${neonBlue}, #10b981)`,
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        padding: '0.55rem 1.15rem',
                        borderRadius: '9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      {isParsingAi ? (
                        <>
                          <Loader2 size={15} className="spin" /> Memproses AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} /> Parse Reservasi dengan AI
                        </>
                      )}
                    </button>
                  </div>

                  {aiStatusBanner && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '9px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        background:
                          aiStatusBanner.tone === 'error'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : aiStatusBanner.tone === 'warning'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(16, 185, 129, 0.12)',
                        color:
                          aiStatusBanner.tone === 'error'
                            ? '#ef4444'
                            : aiStatusBanner.tone === 'warning'
                              ? '#f59e0b'
                              : '#10b981',
                        border: `1px solid ${
                          aiStatusBanner.tone === 'error'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : aiStatusBanner.tone === 'warning'
                              ? 'rgba(245, 158, 11, 0.3)'
                              : 'rgba(16, 185, 129, 0.3)'
                        }`
                      }}
                    >
                      {aiStatusBanner.text}
                    </div>
                  )}
                </section>

                {/* SECTION 1: KODE BOOKING (MANUAL INPUT) */}
                <section style={sectionCardStyle}>
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color={neonBlue} />
                      <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        1. Kode Booking &amp; Kontak Customer
                      </h2>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Input Manual</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Agent Booking Code</label>
                      <input
                        type="text"
                        className="font-mono"
                        value={form.agentBookingCode}
                        onChange={(e) => updateField('agentBookingCode', e.target.value.toUpperCase())}
                        placeholder="e.g. AGT88X"
                        style={{ ...inputStyle, fontWeight: 700, textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Airlines Booking Code</label>
                      <input
                        type="text"
                        className="font-mono"
                        value={form.airlinesBookingCode}
                        onChange={(e) => updateField('airlinesBookingCode', e.target.value.toUpperCase())}
                        placeholder="e.g. BR99KQ"
                        style={{ ...inputStyle, fontWeight: 700, textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>No. WhatsApp Customer (Opsional)</label>
                      <input
                        type="text"
                        value={form.customerPhone}
                        onChange={(e) => updateField('customerPhone', e.target.value)}
                        placeholder="0812... (untuk shortcut Kirim WA)"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Customer (Opsional)</label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => updateField('customerEmail', e.target.value)}
                        placeholder="customer@email.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2: PASSENGER NAME (AUTO AI + DYNAMIC ROWS) */}
                <section style={sectionCardStyle}>
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} color="#10b981" />
                      <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        2. Passenger Name (Sesuai Paspor)
                      </h2>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      Total: {activePax.length} Penumpang
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {form.passengers.map((pax, idx) => (
                      <div
                        key={`pax-${idx}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '78px 1fr 112px 34px',
                          gap: '0.45rem',
                          alignItems: 'center'
                        }}
                      >
                        <select
                          value={pax.title}
                          onChange={(e) => updatePassenger(idx, 'title', e.target.value)}
                          style={{ ...inputStyle, padding: '0.46rem 0.45rem' }}
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
                          onChange={(e) => updatePassenger(idx, 'fullName', e.target.value.toUpperCase())}
                          placeholder={`Nama Penumpang ${idx + 1} (sesuai paspor)`}
                          style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 600 }}
                        />

                        <select
                          value={pax.paxType || 'ADT'}
                          onChange={(e) => updatePassenger(idx, 'paxType', e.target.value)}
                          style={{ ...inputStyle, padding: '0.46rem 0.45rem' }}
                        >
                          <option value="ADT">Dewasa</option>
                          <option value="CHD">Anak</option>
                          <option value="INF">Bayi</option>
                        </select>

                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => removePassenger(idx)}
                          title="Hapus penumpang"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addPassenger}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                  >
                    <Plus size={14} /> Tambah Penumpang
                  </button>
                </section>

                {/* SECTION 3: FLIGHT DETAIL (AUTO AI + TRANSIT + H-1 DINIHARI + ARRIVAL +1/+2) */}
                <section style={sectionCardStyle}>
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Plane size={16} color={neonBlue} />
                      <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        3. Flight Detail ({enrichedSegments.length} Segmen)
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addSegment}
                      style={{ fontSize: '0.75rem', padding: '0.32rem 0.72rem' }}
                    >
                      <Plus size={13} /> Tambah Segmen
                    </button>
                  </div>

                  {/* Auto-detected Airlines Display */}
                  <div style={{ marginBottom: '0.9rem' }}>
                    <label style={labelStyle}>
                      Airlines (Auto dari 2 kode maskapai, dapat disesuaikan)
                    </label>
                    <input
                      type="text"
                      value={form.airlinesLabel || autoAirlinesSummary}
                      onChange={(e) => updateField('airlinesLabel', e.target.value)}
                      placeholder="Otomatis terisi dari kode maskapai (misal: EVA Air (BR))"
                      style={{ ...inputStyle, fontWeight: 700 }}
                    />
                  </div>

                  {/* Flight Segment Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {form.segments.map((seg, idx) => {
                      const info = enrichedSegments[idx] || {};
                      return (
                        <div key={`seg-wrap-${idx}`}>
                          <div
                            style={{
                              padding: '0.85rem',
                              borderRadius: '11px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: `${neonBlue}1a`,
                                    color: neonBlue,
                                    fontSize: '0.72rem',
                                    fontWeight: 800
                                  }}
                                >
                                  Segmen #{idx + 1}
                                </span>
                                {info.airlineName && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {info.airlineName}
                                  </span>
                                )}
                                {info.originCode && info.destinationCode && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    • {info.originDetail} → {info.destinationDetail}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="icon-action-btn danger"
                                onClick={() => removeSegment(idx)}
                                title="Hapus segmen"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Row 1: Airline Code, Flight No, Class, Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: '78px 92px 66px 1fr', gap: '0.45rem', marginBottom: '0.5rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Kode (2)</label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  className="font-mono"
                                  value={seg.airlineCode}
                                  onChange={(e) => {
                                    const code = e.target.value.toUpperCase();
                                    updateSegment(idx, 'airlineCode', code);
                                    updateField('airlinesLabel', '');
                                  }}
                                  placeholder="BR"
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem', fontWeight: 700, textTransform: 'uppercase' }}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>No. Flight</label>
                                <input
                                  type="text"
                                  className="font-mono"
                                  value={seg.flightNumber}
                                  onChange={(e) => updateSegment(idx, 'flightNumber', e.target.value.toUpperCase())}
                                  placeholder="238"
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem', fontWeight: 700 }}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Class</label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  className="font-mono"
                                  value={seg.bookingClass}
                                  onChange={(e) => updateSegment(idx, 'bookingClass', e.target.value.toUpperCase())}
                                  placeholder="S"
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem', textTransform: 'uppercase' }}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Tanggal Berangkat</label>
                                <input
                                  type="date"
                                  value={seg.departureDate}
                                  onChange={(e) => updateSegment(idx, 'departureDate', e.target.value)}
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem' }}
                                />
                              </div>
                            </div>

                            {/* Row 2: Origin, Destination, Dep Time, Arr Time, Day Offset (+1/+2) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 86px 86px 104px', gap: '0.45rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Dari (Kode IATA)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  className="font-mono"
                                  value={seg.originCode}
                                  onChange={(e) => updateSegment(idx, 'originCode', e.target.value.toUpperCase())}
                                  placeholder="CGK"
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem', fontWeight: 700, textTransform: 'uppercase' }}
                                />
                                {info.originCode && (
                                  <div style={{ fontSize: '0.67rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                                    {info.originDetail}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Tujuan (Kode IATA)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  className="font-mono"
                                  value={seg.destinationCode}
                                  onChange={(e) => updateSegment(idx, 'destinationCode', e.target.value.toUpperCase())}
                                  placeholder="TPE"
                                  style={{ ...inputStyle, padding: '0.42rem 0.5rem', fontWeight: 700, textTransform: 'uppercase' }}
                                />
                                {info.destinationCode && (
                                  <div style={{ fontSize: '0.67rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                                    {info.destinationDetail}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Jam Brkt</label>
                                <input
                                  type="text"
                                  className="font-mono"
                                  value={seg.departureTime}
                                  onChange={(e) => updateSegment(idx, 'departureTime', e.target.value)}
                                  placeholder="14:40"
                                  style={{ ...inputStyle, padding: '0.42rem 0.45rem', fontWeight: 700 }}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Jam Tiba</label>
                                <input
                                  type="text"
                                  className="font-mono"
                                  value={seg.arrivalTime}
                                  onChange={(e) => updateSegment(idx, 'arrivalTime', e.target.value)}
                                  placeholder="21:00"
                                  style={{ ...inputStyle, padding: '0.42rem 0.45rem', fontWeight: 700 }}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.68rem' }}>Tiba (+Hari)</label>
                                <select
                                  value={Number(seg.arrivalDayOffset) || 0}
                                  onChange={(e) => updateSegment(idx, 'arrivalDayOffset', parseInt(e.target.value, 10) || 0)}
                                  style={{ ...inputStyle, padding: '0.42rem 0.4rem' }}
                                >
                                  <option value={0}>Hari sama</option>
                                  <option value={1}>+1 Hari</option>
                                  <option value={2}>+2 Hari</option>
                                  <option value={-1}>-1 Hari</option>
                                </select>
                                {info.arrivalDayOffset !== 0 && info.arrivalDate && (
                                  <div style={{ fontSize: '0.66rem', color: '#f59e0b', marginTop: '2px', fontWeight: 700 }}>
                                    Tiba {formatDateShortId(info.arrivalDate)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Auto Dinihari H-1 Airport Alert Banner + Manual Override Toggle */}
                            {(info.showDinihariNotice || info.isAutoDinihari) && (
                              <div
                                style={{
                                  marginTop: '0.6rem',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '8px',
                                  background: info.showDinihariNotice ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card)',
                                  border: `1px solid ${info.showDinihariNotice ? 'rgba(245, 158, 11, 0.35)' : 'var(--border)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: info.showDinihariNotice ? '#f59e0b' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <AlertTriangle size={13} />
                                  {info.showDinihariNotice
                                    ? info.dinihariNoticeText
                                    : 'Peringatan Dinihari H-1 disembunyikan'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateSegment(idx, 'forceDinihariNotice', !info.showDinihariNotice)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: neonBlue,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {info.showDinihariNotice ? 'Sembunyikan' : 'Tampilkan'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Auto Transit Duration Connector Indicator */}
                          {info.transitAfterLabel && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.45rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 12px',
                                  borderRadius: '999px',
                                  background: `${neonBlue}16`,
                                  border: `1px solid ${neonBlue}38`,
                                  color: neonBlue,
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}
                              >
                                <Clock size={12} />
                                Transit di {info.transitAirportDetail} selama {info.transitAfterLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 4: HARGA (MANUAL INPUT) */}
                <section style={sectionCardStyle}>
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={16} color="#10b981" />
                      <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        4. Harga Tiket (Manual Input)
                      </h2>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kosongkan kategori yang tidak diperlukan</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { key: 'priceAdult', label: 'Dewasa (IDR / Pax)' },
                      { key: 'priceChild', label: 'Anak (IDR / Pax)' },
                      { key: 'priceInfant', label: 'Bayi (IDR / Pax)' }
                    ].map((tier) => (
                      <div key={tier.key}>
                        <label style={labelStyle}>{tier.label}</label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '0.65rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)'
                            }}
                          >
                            IDR
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="font-mono"
                            value={formatNumberWithCommas(form[tier.key])}
                            onChange={(e) => updateField(tier.key, String(parseAmountNumber(e.target.value) || ''))}
                            placeholder="0"
                            style={{ ...inputStyle, paddingLeft: '2.4rem', fontWeight: 700 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION 5: KETENTUAN (TIME LIMIT, BAGGAGE WEIGHT/PIECE, CHANGE & REFUND CHECKLISTS) */}
                <section style={sectionCardStyle}>
                  <div style={sectionTitleStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={16} color="#f59e0b" />
                      <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        5. Ketentuan &amp; Syarat Tiket
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* 5a. Batas Pembayaran / Batas Issued */}
                    <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                        Batas Pembayaran / Batas Issued
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 85px', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={form.timeLimitDate}
                          onChange={(e) => updateField('timeLimitDate', e.target.value)}
                          style={inputStyle}
                        />
                        <input
                          type="time"
                          value={form.timeLimitTime}
                          onChange={(e) => updateField('timeLimitTime', e.target.value)}
                          style={inputStyle}
                        />
                        <select
                          value={form.timeLimitTz}
                          onChange={(e) => updateField('timeLimitTz', e.target.value)}
                          style={inputStyle}
                        >
                          <option value="WIB">WIB</option>
                          <option value="WITA">WITA</option>
                          <option value="WIT">WIT</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: neonBlue, fontWeight: 600 }}>
                        Preview: {buildTimeLimitText(form)}
                      </div>
                    </div>

                    {/* 5b. Bagasi (Weight Concept vs Piece Concept) */}
                    <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <label style={{ ...labelStyle, color: 'var(--text-main)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Luggage size={14} color={neonBlue} /> Ketentuan Bagasi
                        </label>
                        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                          <button
                            type="button"
                            onClick={() => updateField('baggageConcept', 'weight')}
                            style={{
                              border: 'none',
                              padding: '0.28rem 0.7rem',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: form.baggageConcept === 'weight' ? neonBlue : 'transparent',
                              color: form.baggageConcept === 'weight' ? '#ffffff' : 'var(--text-muted)'
                            }}
                          >
                            Konsep Berat (Kg)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField('baggageConcept', 'piece')}
                            style={{
                              border: 'none',
                              padding: '0.28rem 0.7rem',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: form.baggageConcept === 'piece' ? neonBlue : 'transparent',
                              color: form.baggageConcept === 'piece' ? '#ffffff' : 'var(--text-muted)'
                            }}
                          >
                            Konsep Pieces (Pcs)
                          </button>
                        </div>
                      </div>

                      {form.baggageConcept === 'weight' ? (
                        <div>
                          <label style={labelStyle}>Total Berat Bagasi (Kg)</label>
                          <div style={{ position: 'relative', maxWidth: '200px' }}>
                            <input
                              type="number"
                              min="0"
                              value={form.baggageWeightKg}
                              onChange={(e) => updateField('baggageWeightKg', e.target.value)}
                              placeholder="30"
                              style={{ ...inputStyle, paddingRight: '2.5rem', fontWeight: 700 }}
                            />
                            <span style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              Kg
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                          <div>
                            <label style={labelStyle}>Jumlah Piece (Pcs)</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                min="1"
                                value={form.baggagePieces}
                                onChange={(e) => updateField('baggagePieces', e.target.value)}
                                placeholder="2"
                                style={{ ...inputStyle, paddingRight: '2.8rem', fontWeight: 700 }}
                              />
                              <span style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                pcs
                              </span>
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>Berat per Piece (Kg)</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                min="1"
                                value={form.baggageWeightPerPiece}
                                onChange={(e) => updateField('baggageWeightPerPiece', e.target.value)}
                                placeholder="23"
                                style={{ ...inputStyle, paddingRight: '2.5rem', fontWeight: 700 }}
                              />
                              <span style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                Kg
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: '#10b981', fontWeight: 600 }}>
                        Preview: {buildBaggageText(form)}
                      </div>
                    </div>

                    {/* 5c. Perubahan Jadwal / Changeable vs Nonchangeable */}
                    <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.55rem' }}>
                        <label style={{ ...labelStyle, color: 'var(--text-main)', margin: 0 }}>
                          Ketentuan Perubahan Jadwal (Reissue / Change)
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 700, color: form.isNonChangeable ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(form.isNonChangeable)}
                            onChange={(e) => updateField('isNonChangeable', e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: '#ef4444', cursor: 'pointer' }}
                          />
                          Tidak dapat diubah (Ticket nonchangeable)
                        </label>
                      </div>

                      {!form.isNonChangeable && (
                        <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '0.5rem' }}>
                          <select
                            value={form.changePenaltyCurrency}
                            onChange={(e) => updateField('changePenaltyCurrency', e.target.value)}
                            style={{ ...inputStyle, fontWeight: 700 }}
                          >
                            {CURRENCY_OPTIONS.map((cur) => (
                              <option key={`chg-${cur}`} value={cur}>
                                {cur}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="font-mono"
                            value={formatNumberWithCommas(form.changePenaltyAmount)}
                            onChange={(e) => updateField('changePenaltyAmount', String(parseAmountNumber(e.target.value) || ''))}
                            placeholder="Nominal penalty ubah jadwal..."
                            style={{ ...inputStyle, fontWeight: 700 }}
                          />
                        </div>
                      )}
                      <div style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: form.isNonChangeable ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                        Preview: {buildChangePolicyText(form)}
                      </div>
                    </div>

                    {/* 5d. Refundable vs Nonrefundable */}
                    <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.55rem' }}>
                        <label style={{ ...labelStyle, color: 'var(--text-main)', margin: 0 }}>
                          Ketentuan Refund / Pembatalan
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 700, color: form.isNonRefundable ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(form.isNonRefundable)}
                            onChange={(e) => updateField('isNonRefundable', e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: '#ef4444', cursor: 'pointer' }}
                          />
                          Tidak dapat direfund (Ticket nonrefundable)
                        </label>
                      </div>

                      {!form.isNonRefundable && (
                        <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '0.5rem' }}>
                          <select
                            value={form.refundPenaltyCurrency}
                            onChange={(e) => updateField('refundPenaltyCurrency', e.target.value)}
                            style={{ ...inputStyle, fontWeight: 700 }}
                          >
                            {CURRENCY_OPTIONS.map((cur) => (
                              <option key={`ref-${cur}`} value={cur}>
                                {cur}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="font-mono"
                            value={formatNumberWithCommas(form.refundPenaltyAmount)}
                            onChange={(e) => updateField('refundPenaltyAmount', String(parseAmountNumber(e.target.value) || ''))}
                            placeholder="Nominal penalty refund..."
                            style={{ ...inputStyle, fontWeight: 700 }}
                          />
                        </div>
                      )}
                      <div style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: form.isNonRefundable ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                        Preview: {buildRefundPolicyText(form)}
                      </div>
                    </div>

                    {/* 5e. Standard Passport & Immigration Clause (Locked/Auto) + Extra Notes */}
                    <div style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      <strong style={{ color: '#10b981' }}>Ketentuan Paspor / Visa (Otomatis Tercantum):</strong>{' '}
                      {DEFAULT_PASSPORT_CLAUSE}
                    </div>

                    <div>
                      <label style={labelStyle}>Catatan Tambahan (Opsional)</label>
                      <textarea
                        rows={2}
                        value={form.extraNotes}
                        onChange={(e) => updateField('extraNotes', e.target.value)}
                        placeholder="Catatan tambahan seperti kursi, permintaan makanan (meal request), atau info transfer..."
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT PANE: STICKY LIVE PREVIEW (WHATSAPP TEXT / OFFICIAL A4 DOCUMENT) */}
              <div
                style={{
                  position: 'sticky',
                  top: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="no-print-area"
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    background: 'var(--bg-surface)'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Live Preview Output
                  </span>
                  <div style={{ display: 'inline-flex', gap: '0.3rem', background: 'var(--bg-card)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {[
                      { id: 'whatsapp', label: 'Teks WA' },
                      { id: 'document', label: 'Dokumen A4' },
                      { id: 'both', label: 'Keduanya' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPreviewMode(tab.id)}
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: previewMode === tab.id ? neonBlue : 'transparent',
                          color: previewMode === tab.id ? '#ffffff' : 'var(--text-muted)'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '1rem', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                  <FlightBookingPreview form={form} viewMode={previewMode} isLight={isLight} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingForm;
