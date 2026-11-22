import { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Building,
  DollarSign,
  Check,
  RefreshCw,
  ShieldAlert,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  readCorporateSpreadsheetFile,
  buildCorporateAccountDraftsFromAi,
  buildHeuristicColumnMapping,
  downloadCorporateAccountTemplate
} from '../../utils/corporateAiParser';
import {
  createEmptyPicContact,
  normalizePicContacts,
  picContactsToLegacyFields,
  getAccountPicSearchText
} from '../../utils/corporatePicHelpers';
import {
  CORPORATE_FEE_KEYS,
  CORPORATE_FEE_LABELS,
  formatCommaNumber,
  parseCommaNumber,
  formatFeeEntryDisplay,
  parseFeeEntry,
  sanitizePercentInput,
  serializeFeeProfile
} from '../../utils/corporateFeeHelpers';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const PROCESSING_STEPS = [
  'Membaca worksheet & struktur kolom Excel / CSV...',
  'AI Gemini memetakan kode akun, perusahaan, PIC, credit limit & fee...',
  'Menormalisasi angka IDR / %, kontak & mendeteksi akun duplikat...'
];

const CorporateAiImportModal = ({
  isOpen,
  onClose,
  existingAccounts = [],
  onConfirmImport,
  neonBlue = '#00d4ff'
}) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'parsing' | 'preview' | 'saving' | 'error'
  const [stepIdx, setStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Parsed workbook & sheet state
  const [workbookData, setWorkbookData] = useState(null); // { fileName, sheets: [{ sheetName, totalRows, rows }] }
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);

  // Preview drafts & selection state
  const [drafts, setDrafts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedRowKey, setExpandedRowKey] = useState(null);

  const resetModal = () => {
    setStatus('idle');
    setStepIdx(0);
    setErrorMsg('');
    setWorkbookData(null);
    setActiveSheetIdx(0);
    setUsedFallback(false);
    setDrafts([]);
    setMeta(null);
    setSelectedKeys(new Set());
    setUpdateDuplicates(true);
    setSearchFilter('');
    setExpandedRowKey(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (status === 'saving') return;
    resetModal();
    onClose();
  };

  const analyzeSheet = async (wb, sheetIndex) => {
    const sheet = wb?.sheets?.[sheetIndex];
    if (!sheet || !sheet.rows?.length) {
      setErrorMsg('Sheet yang dipilih kosong atau tidak memiliki data.');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setStepIdx(0);
    setErrorMsg('');
    setUsedFallback(false);
    setExpandedRowKey(null);

    const progressTimer = setInterval(() => {
      setStepIdx((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1300);

    try {
      const previewRows = sheet.rows.slice(0, 40);
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      let aiResult = null;
      let fallbackUsed = false;

      try {
        const response = await fetch('/api/corporate/parse-accounts-excel', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            fileName: wb.fileName,
            sheetName: sheet.sheetName,
            totalRows: sheet.totalRows,
            previewRows
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.success && payload.data) {
          aiResult = payload.data;
        } else {
          throw new Error(payload.error || 'AI tidak merespons');
        }
      } catch (aiErr) {
        console.warn('[Corporate AI Excel] Falling back to local heuristic parser:', aiErr.message);
        aiResult = buildHeuristicColumnMapping(sheet.rows);
        fallbackUsed = true;
      }

      const built = buildCorporateAccountDraftsFromAi({
        aiResult,
        allRows: sheet.rows,
        existingAccounts,
        fileName: wb.fileName,
        sheetName: sheet.sheetName
      });

      if (built.drafts.length === 0) {
        throw new Error(
          `Tidak ditemukan baris akun corporate valid pada sheet "${sheet.sheetName}". Coba pilih sheet lain atau pastikan kolom Nama Perusahaan / Kode Akun terisi.`
        );
      }

      setUsedFallback(fallbackUsed);
      setDrafts(built.drafts);
      setMeta(built.meta);
      setSelectedKeys(
        new Set(
          built.drafts
            .filter((d) => d._status === 'new' || d._status === 'duplicate')
            .map((d) => d._rowKey)
        )
      );
      setStatus('preview');
    } catch (err) {
      console.error('Corporate AI Excel parse error:', err);
      setErrorMsg(err?.message || 'Gagal menganalisis file Excel dengan AI.');
      setStatus('error');
    } finally {
      clearInterval(progressTimer);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    const isExcelOrCsv = /\.(xlsx|csv)$/i.test(file.name || '');
    if (!isExcelOrCsv) {
      toast.error('Format file harus Excel (.xlsx) atau CSV (.csv).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Ukuran file terlalu besar (maksimal 15 MB).');
      return;
    }

    setStatus('parsing');
    setStepIdx(0);
    setErrorMsg('');

    try {
      const wb = await readCorporateSpreadsheetFile(file);
      setWorkbookData(wb);
      setActiveSheetIdx(0);
      await analyzeSheet(wb, 0);
    } catch (err) {
      console.error('Spreadsheet read error:', err);
      setErrorMsg(err?.message || 'Gagal membaca file Excel. Pastikan format file .xlsx / .csv valid.');
      setStatus('error');
    }
  };

  const handleSheetChange = async (newIdx) => {
    setActiveSheetIdx(newIdx);
    if (workbookData) {
      await analyzeSheet(workbookData, newIdx);
    }
  };

  const updateDraftField = (rowKey, field, value) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d._rowKey !== rowKey) return d;
        const next = { ...d, [field]: value };
        if (field === 'companyName') {
          next.corporateName = value;
          if (value.trim() && next._status === 'needs_review') {
            next._status = next._existingId ? 'duplicate' : 'new';
          }
        }
        return next;
      })
    );
  };

  const updateDraftPicContacts = (rowKey, updater) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d._rowKey !== rowKey) return d;
        const currentPics = Array.isArray(d.picContacts) && d.picContacts.length > 0
          ? d.picContacts
          : normalizePicContacts(d.picContacts, d);
        const nextPics = typeof updater === 'function' ? updater(currentPics) : updater;
        const legacy = picContactsToLegacyFields(nextPics);
        return {
          ...d,
          picContacts: nextPics,
          ...legacy
        };
      })
    );
  };

  const updateDraftFee = (rowKey, sectionKey, feeKey, nextEntry) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d._rowKey !== rowKey) return d;
        const updatedSection = serializeFeeProfile({
          ...(d[sectionKey] || {}),
          [feeKey]: nextEntry
        });
        const hasAny = CORPORATE_FEE_KEYS.some((k) => (updatedSection[k]?.value || 0) > 0);
        return {
          ...d,
          [sectionKey]: updatedSection,
          [sectionKey === 'flightFee' ? '_hasFlightFees' : '_hasHotelFees']: hasAny
        };
      })
    );
  };

  const filteredDrafts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter(
      (d) =>
        d.accountCode.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        getAccountPicSearchText(d).includes(q)
    );
  }, [drafts, searchFilter]);

  const liveCounts = useMemo(() => {
    let selectedNew = 0;
    let selectedUpdate = 0;
    let selectedSkipped = 0;
    let invalidSelected = 0;

    for (const d of drafts) {
      if (!selectedKeys.has(d._rowKey)) continue;
      if (d._status === 'identical') {
        selectedSkipped += 1;
        continue;
      }
      if (!d.companyName.trim() || !d.accountCode.trim()) {
        invalidSelected += 1;
        continue;
      }
      if (d._existingId) {
        if (updateDuplicates) selectedUpdate += 1;
        else selectedSkipped += 1;
      } else {
        selectedNew += 1;
      }
    }

    return {
      total: drafts.length,
      newTotal: drafts.filter((d) => d._status === 'new').length,
      dupTotal: drafts.filter((d) => d._status === 'duplicate').length,
      identicalTotal: drafts.filter((d) => d._status === 'identical').length,
      reviewTotal: drafts.filter((d) => d._status === 'needs_review').length,
      selectedNew,
      selectedUpdate,
      selectedSkipped,
      invalidSelected,
      effectiveSaveCount: selectedNew + selectedUpdate
    };
  }, [drafts, selectedKeys, updateDuplicates]);

  const toggleSelectRow = (rowKey) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allFilteredSelected =
      filteredDrafts.length > 0 && filteredDrafts.every((d) => selectedKeys.has(d._rowKey));
    if (allFilteredSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        filteredDrafts.forEach((d) => next.delete(d._rowKey));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        filteredDrafts.forEach((d) => next.add(d._rowKey));
        return next;
      });
    }
  };

  const handleConfirmSave = async () => {
    const chosen = drafts.filter((d) => selectedKeys.has(d._rowKey) && d._status !== 'identical');
    if (chosen.length === 0) {
      toast.warning('Pilih minimal 1 akun corporate baru atau yang memiliki detail pembaruan untuk disimpan.');
      return;
    }

    const invalid = chosen.filter((d) => !d.companyName.trim() || !d.accountCode.trim());
    if (invalid.length > 0) {
      toast.error(`${invalid.length} baris terpilih belum memiliki Account Code atau Nama Perusahaan.`);
      return;
    }

    if (liveCounts.effectiveSaveCount === 0) {
      toast.warning('Tidak ada akun baru untuk disimpan (duplikat sedang dilewati).');
      return;
    }

    setStatus('saving');
    try {
      const res = await onConfirmImport(chosen, { updateDuplicates });
      if (res?.success) {
        const parts = [];
        if (res.insertedCount > 0) parts.push(`${res.insertedCount} akun baru ditambahkan`);
        if (res.updatedCount > 0) parts.push(`${res.updatedCount} akun diperbarui`);
        if (res.skippedCount > 0) parts.push(`${res.skippedCount} duplikat dilewati`);
        toast.success(`AI Import selesai: ${parts.join(', ')}.`);
        handleClose();
      } else {
        throw new Error(res?.error || 'Gagal menyimpan data ke database.');
      }
    } catch (err) {
      console.error('Corporate AI save error:', err);
      toast.error(err?.message || 'Gagal menyimpan akun corporate ke database.');
      setStatus('preview');
    }
  };

  if (!isOpen) return null;

  const inputCellStyle = {
    width: '100%',
    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    borderRadius: '6px',
    padding: '0.35rem 0.5rem',
    fontSize: '0.78rem',
    outline: 'none'
  };

  return (
    <div
      className="modal-overlay fade-in"
      style={{ zIndex: 1120, padding: '1rem' }}
      onClick={handleClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: status === 'preview' || status === 'saving' ? '1180px' : '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: isLight
              ? 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(16,185,129,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(16,185,129,0.06) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${neonBlue}, #10b981)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 6px 18px ${neonBlue}35`
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  AI Auto-Input Akun Corporate (Excel / CSV)
                </h2>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: `${neonBlue}18`,
                    color: neonBlue,
                    border: `1px solid ${neonBlue}35`
                  }}
                >
                  GEMINI SMART MAPPER
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Upload file Excel (.xlsx) atau CSV dalam format bebas — AI otomatis membaca kolom, credit limit, kontak PIC, dan service fee Flight &amp; Hotel.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={handleClose}
            disabled={status === 'saving'}
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.35rem 1.5rem' }}>
          {/* STEP 1: IDLE / UPLOAD */}
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer?.files?.[0];
                  if (droppedFile) handleFileSelected(droppedFile);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? neonBlue : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging
                    ? `${neonBlue}10`
                    : isLight
                      ? '#f8fafc'
                      : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 1rem auto',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileSpreadsheet size={30} />
                </div>
                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Tarik &amp; lepaskan file Excel corporate di sini
                </h3>
                <p style={{ margin: '0 0 1.1rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Mendukung <strong>.xlsx</strong> (multi-sheet, multi-header, formula) dan <strong>.csv</strong> hingga 15 MB
                </p>
                <span
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: neonBlue,
                    borderColor: neonBlue,
                    color: '#ffffff',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: '600'
                  }}
                >
                  <UploadCloud size={16} /> Pilih File Excel / CSV
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />
              </div>

              {/* Capability Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                {[
                  {
                    icon: <Sparkles size={15} color={neonBlue} />,
                    title: 'Header 1–3 Baris & Multi-Row',
                    desc: 'Otomatis membaca header bertingkat (Flight/Hotel/KAI), sel merge, dan baris lanjutan PIC per CustCode.'
                  },
                  {
                    icon: <DollarSign size={15} color="#10b981" />,
                    title: 'Auto-Parse Limit, PIC & Fee',
                    desc: 'Mengerti "+11% PPn", desimal "0.03" -> 3%, "Rp 15,000/One Way", hingga nomor HP di dalam nama PIC.'
                  },
                  {
                    icon: <RefreshCw size={15} color="#f59e0b" />,
                    title: 'Gabung Duplikasi CustCode',
                    desc: 'Duplikasi CustCode otomatis digabung jadi 1 akun & detail yang 100% sama dibuang otomatis.'
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      {item.icon}
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{item.title}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Optional Starter Template Download */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Belum punya file Excel? Unduh template standar TravelOps dengan contoh lengkap.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={downloadCorporateAccountTemplate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.78rem',
                    padding: '0.42rem 0.85rem',
                    borderRadius: '8px'
                  }}
                >
                  <Download size={14} /> Download Template (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING */}
          {status === 'parsing' && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  margin: '0 auto 1.25rem auto',
                  borderRadius: '50%',
                  background: `${neonBlue}16`,
                  border: `1px solid ${neonBlue}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: neonBlue
                }}
              >
                <Loader2 size={30} className="spin" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                AI Sedang Menganalisis File Excel Anda...
              </h3>
              <p style={{ margin: '0 0 1.4rem 0', fontSize: '0.84rem', color: neonBlue, fontWeight: '600' }}>
                {PROCESSING_STEPS[stepIdx]}
              </p>
              <div style={{ maxWidth: '380px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left' }}>
                {PROCESSING_STEPS.map((label, idx) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.77rem',
                      color: idx <= stepIdx ? 'var(--text-main)' : 'var(--text-subtle)'
                    }}
                  >
                    {idx < stepIdx ? (
                      <CheckCircle2 size={14} color="#10b981" />
                    ) : idx === stepIdx ? (
                      <Loader2 size={14} color={neonBlue} className="spin" />
                    ) : (
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border)' }} />
                    )}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: ERROR */}
          {status === 'error' && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 1rem auto',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldAlert size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.02rem', color: 'var(--text-main)' }}>
                Gagal Memproses Spreadsheet
              </h3>
              <p style={{ margin: '0 auto 1.4rem auto', maxWidth: '480px', fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {errorMsg}
              </p>

              {/* Allow switching sheet directly if workbook has multiple sheets */}
              {workbookData?.sheets?.length > 1 && (
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {workbookData.sheets.map((s, idx) => (
                    <button
                      key={s.sheetName}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleSheetChange(idx)}
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.75rem',
                        borderColor: idx === activeSheetIdx ? neonBlue : 'var(--border)'
                      }}
                    >
                      Coba Sheet: {s.sheetName} ({s.totalRows} baris)
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={resetModal}
                style={{
                  background: neonBlue,
                  borderColor: neonBlue,
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.2rem',
                  borderRadius: '10px'
                }}
              >
                <RotateCcw size={15} /> Upload File Lain
              </button>
            </div>
          )}

          {/* STEP 4: PREVIEW & INLINE EDIT */}
          {(status === 'preview' || status === 'saving') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Sheet Switcher (if multiple worksheets) */}
              {workbookData?.sheets?.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Worksheet Excel:
                  </span>
                  {workbookData.sheets.map((s, idx) => {
                    const active = idx === activeSheetIdx;
                    return (
                      <button
                        key={s.sheetName}
                        type="button"
                        disabled={status === 'saving'}
                        onClick={() => handleSheetChange(idx)}
                        style={{
                          padding: '0.28rem 0.7rem',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: active ? '700' : '500',
                          cursor: 'pointer',
                          border: `1px solid ${active ? neonBlue : 'var(--border)'}`,
                          background: active ? `${neonBlue}18` : 'var(--bg-surface)',
                          color: active ? neonBlue : 'var(--text-muted)'
                        }}
                      >
                        {s.sheetName} ({s.totalRows})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* AI Detection Summary Banner */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: usedFallback
                    ? 'rgba(245, 158, 11, 0.1)'
                    : isLight
                      ? '#ecfeff'
                      : 'rgba(0, 212, 255, 0.08)',
                  border: `1px solid ${usedFallback ? 'rgba(245, 158, 11, 0.35)' : `${neonBlue}30`}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flex: 1 }}>
                  <Sparkles size={16} color={usedFallback ? '#f59e0b' : neonBlue} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {workbookData?.fileName} • Sheet &ldquo;{meta?.sheetName}&rdquo;
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        ({meta?.layoutType === 'form_extraction' ? 'Mode Form Profil' : `Mode Pemetaan Tabel • ${meta?.mappedColumnsCount || 0} kolom`})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.18rem' }}>
                      {meta?.detectionSummary}
                      {(meta?.counts?.identicalDetailsDropped > 0 || meta?.counts?.intraFileMergedCount > 0) && (
                        <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: '600' }}>
                          • Duplikasi CustCode digabung otomatis ({meta.counts.identicalDetailsDropped} detail 100% sama dibuang)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Summary Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.65rem' }}>
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>CUSTCODE UNIK</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{liveCounts.total}</div>
                </div>
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '700' }}>AKUN BARU</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>{liveCounts.newTotal}</div>
                </div>
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '700' }}>GABUNG CUSTCODE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f59e0b' }}>{liveCounts.dupTotal}</div>
                </div>
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>IDENTIK 100% (SKIP)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-muted)' }}>{liveCounts.identicalTotal}</div>
                </div>
                {liveCounts.reviewTotal > 0 && (
                  <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.28)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '700' }}>PERLU CEK</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>{liveCounts.reviewTotal}</div>
                  </div>
                )}
              </div>

              {/* Filter & Duplicate Handling Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '340px' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Filter preview (CustCode, perusahaan, PIC)..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      ...inputCellStyle,
                      paddingLeft: '2rem',
                      paddingTop: '0.45rem',
                      paddingBottom: '0.45rem'
                    }}
                  />
                </div>

                {liveCounts.dupTotal > 0 && (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.79rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={updateDuplicates}
                      onChange={(e) => setUpdateDuplicates(e.target.checked)}
                      style={{ accentColor: neonBlue, width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>
                      <strong>Gabungkan ke CustCode sama</strong> (buang detail 100% sama)
                    </span>
                  </label>
                )}
              </div>

              {/* Editable Preview Table */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'auto',
                  maxHeight: '44vh',
                  background: 'var(--bg-surface)'
                }}
              >
                <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.6rem', width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredDrafts.length > 0 && filteredDrafts.every((d) => selectedKeys.has(d._rowKey))}
                          onChange={toggleSelectAll}
                          style={{ accentColor: neonBlue, cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '0.65rem 0.5rem', width: '86px' }}>STATUS</th>
                      <th style={{ padding: '0.65rem 0.5rem', width: '135px' }}>ACCOUNT CODE</th>
                      <th style={{ padding: '0.65rem 0.5rem', minWidth: '200px' }}>COMPANY NAME</th>
                      <th style={{ padding: '0.65rem 0.5rem', width: '145px' }}>CREDIT LIMIT (IDR)</th>
                      <th style={{ padding: '0.65rem 0.5rem', width: '105px' }}>ACTIVE</th>
                      <th style={{ padding: '0.65rem 0.5rem', minWidth: '190px' }}>PIC &amp; KONTAK</th>
                      <th style={{ padding: '0.65rem 0.5rem', width: '115px', textAlign: 'center' }}>FEE / DETAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrafts.map((row) => {
                      const isSelected = selectedKeys.has(row._rowKey);
                      const isExpanded = expandedRowKey === row._rowKey;
                      const badge =
                        row._status === 'needs_review'
                          ? { label: 'Cek', bg: 'rgba(239,68,68,0.14)', color: '#ef4444' }
                          : row._status === 'identical'
                            ? { label: 'Identik', bg: 'rgba(148,163,184,0.18)', color: 'var(--text-muted)' }
                            : row._status === 'duplicate'
                              ? { label: updateDuplicates ? 'Gabung' : 'Skip', bg: 'rgba(245,158,11,0.14)', color: '#f59e0b' }
                              : { label: 'Baru', bg: 'rgba(16,185,129,0.14)', color: '#10b981' };

                      return (
                        <tr
                          key={row._rowKey}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: isSelected
                              ? isLight
                                ? 'rgba(2, 132, 199, 0.03)'
                                : 'rgba(0, 212, 255, 0.03)'
                              : 'transparent',
                            opacity: isSelected ? 1 : 0.55
                          }}
                        >
                          <td colSpan={8} style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '0.5rem 0.6rem', width: '38px', textAlign: 'center', verticalAlign: 'top' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectRow(row._rowKey)}
                                      style={{ accentColor: neonBlue, marginTop: '6px', cursor: 'pointer' }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.5rem', width: '86px', verticalAlign: 'top' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        marginTop: '3px',
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        fontSize: '0.68rem',
                                        fontWeight: '700',
                                        background: badge.bg,
                                        color: badge.color
                                      }}
                                    >
                                      {badge.label}
                                    </span>
                                    <div style={{ fontSize: '0.66rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
                                      Baris #{row._sourceRow}
                                      {row._sourceRowsCount > 1 ? ` (+${row._sourceRowsCount - 1})` : ''}
                                    </div>
                                    {row._identicalDetailsDropped > 0 && (
                                      <div style={{ fontSize: '0.62rem', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>
                                        -{row._identicalDetailsDropped} duplikat
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.5rem', width: '135px', verticalAlign: 'top' }}>
                                    <input
                                      type="text"
                                      value={row.accountCode}
                                      onChange={(e) => updateDraftField(row._rowKey, 'accountCode', e.target.value)}
                                      placeholder="CORP-001"
                                      className="font-mono"
                                      style={{
                                        ...inputCellStyle,
                                        fontWeight: '700',
                                        borderColor: !row.accountCode.trim() ? '#ef4444' : 'var(--border)'
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.5rem', minWidth: '200px', verticalAlign: 'top' }}>
                                    <input
                                      type="text"
                                      value={row.companyName}
                                      onChange={(e) => updateDraftField(row._rowKey, 'companyName', e.target.value)}
                                      placeholder="Nama Perusahaan *"
                                      style={{
                                        ...inputCellStyle,
                                        fontWeight: '600',
                                        borderColor: !row.companyName.trim() ? '#ef4444' : 'var(--border)'
                                      }}
                                    />
                                    {row._warnings?.length > 0 && (
                                      <div style={{ marginTop: '3px', fontSize: '0.68rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertTriangle size={11} />
                                        <span>{row._warnings[0]}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.5rem', width: '145px', verticalAlign: 'top' }}>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className="font-mono"
                                      value={formatCommaNumber(row.creditLimit)}
                                      onChange={(e) =>
                                        updateDraftField(row._rowKey, 'creditLimit', parseCommaNumber(e.target.value))
                                      }
                                      placeholder="0"
                                      style={inputCellStyle}
                                    />
                                  </td>
                                  <td style={{ padding: '0.5rem', width: '105px', verticalAlign: 'top' }}>
                                    <select
                                      value={row.status}
                                      onChange={(e) => updateDraftField(row._rowKey, 'status', e.target.value)}
                                      style={inputCellStyle}
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Inactive">Inactive</option>
                                    </select>
                                  </td>
                                  <td style={{ padding: '0.5rem', minWidth: '205px', verticalAlign: 'top' }}>
                                    {(() => {
                                      const pics = Array.isArray(row.picContacts) && row.picContacts.length > 0
                                        ? row.picContacts
                                        : normalizePicContacts(row.picContacts, row);
                                      if (pics.length <= 1) {
                                        const firstPic = pics[0] || createEmptyPicContact();
                                        return (
                                          <>
                                            <input
                                              type="text"
                                              value={firstPic.name}
                                              onChange={(e) =>
                                                updateDraftPicContacts(row._rowKey, [{ ...firstPic, name: e.target.value }])
                                              }
                                              placeholder="Nama PIC"
                                              style={{ ...inputCellStyle, marginBottom: '4px' }}
                                            />
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                              <input
                                                type="text"
                                                value={firstPic.phone}
                                                onChange={(e) =>
                                                  updateDraftPicContacts(row._rowKey, [{ ...firstPic, phone: e.target.value }])
                                                }
                                                placeholder="No. HP / WA"
                                                style={{ ...inputCellStyle, fontSize: '0.72rem' }}
                                              />
                                              <input
                                                type="text"
                                                inputMode="email"
                                                value={firstPic.officeEmail}
                                                onChange={(e) =>
                                                  updateDraftPicContacts(row._rowKey, [{ ...firstPic, officeEmail: e.target.value }])
                                                }
                                                placeholder="Email kantor"
                                                style={{ ...inputCellStyle, fontSize: '0.72rem' }}
                                              />
                                            </div>
                                          </>
                                        );
                                      }
                                      return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                            <span
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.69rem',
                                                fontWeight: '700',
                                                padding: '2px 7px',
                                                borderRadius: '999px',
                                                background: 'rgba(16, 185, 129, 0.14)',
                                                color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.28)'
                                              }}
                                            >
                                              <Users size={11} /> {pics.length} PIC
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setExpandedRowKey(isExpanded ? null : row._rowKey)}
                                              style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: neonBlue,
                                                fontSize: '0.69rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                padding: 0
                                              }}
                                            >
                                              {isExpanded ? 'Tutup Tabel PIC' : 'Edit Tabel PIC'}
                                            </button>
                                          </div>
                                          <div style={{ fontSize: '0.73rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
                                            {pics.slice(0, 2).map((p, pIdx) => (
                                              <div key={`${row._rowKey}-p-${pIdx}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '215px' }}>
                                                <strong>{pIdx + 1}.</strong> {p.name || p.officeEmail || '-'}
                                                {p.phone ? ` (${p.phone})` : ''}
                                              </div>
                                            ))}
                                            {pics.length > 2 && (
                                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                +{pics.length - 2} PIC lainnya
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td style={{ padding: '0.5rem', width: '115px', textAlign: 'center', verticalAlign: 'top' }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRowKey(isExpanded ? null : row._rowKey)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '0.32rem 0.6rem',
                                        borderRadius: '7px',
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        border: '1px solid var(--border)',
                                        background: isExpanded ? `${neonBlue}18` : 'var(--bg-card)',
                                        color: isExpanded ? neonBlue : 'var(--text-main)'
                                      }}
                                    >
                                      <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>
                                    {(row._hasFlightFees || row._hasHotelFees) && (
                                      <div style={{ marginTop: '4px', fontSize: '0.66rem', color: '#10b981', fontWeight: '600' }}>
                                        {[row._hasFlightFees && 'Flight', row._hasHotelFees && 'Hotel']
                                          .filter(Boolean)
                                          .join(' + ')} Fee
                                      </div>
                                    )}
                                  </td>
                                </tr>

                                {/* Expanded Detail Editor (Multi-PIC Table, Address, Airlines, Remarks & Service Fees) */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={8} style={{ padding: '0.75rem 1rem 1rem 2.75rem', background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.55)', borderTop: '1px dashed var(--border)' }}>
                                      {/* Inline Multi-PIC Table */}
                                      {(() => {
                                        const editablePics =
                                          Array.isArray(row.picContacts) && row.picContacts.length > 0
                                            ? row.picContacts
                                            : [createEmptyPicContact()];
                                        return (
                                          <div style={{ marginBottom: '0.9rem', padding: '0.65rem 0.75rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                              <div style={{ fontSize: '0.73rem', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Users size={13} /> Daftar PIC / Booker ({editablePics.length} Orang)
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateDraftPicContacts(row._rowKey, [...editablePics, createEmptyPicContact()])
                                                }
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '3px',
                                                  padding: '0.22rem 0.55rem',
                                                  borderRadius: '6px',
                                                  border: '1px solid rgba(16, 185, 129, 0.38)',
                                                  background: 'rgba(16, 185, 129, 0.12)',
                                                  color: '#10b981',
                                                  fontSize: '0.69rem',
                                                  fontWeight: '700',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <Plus size={11} /> Tambah PIC
                                              </button>
                                            </div>
                                            <div style={{ overflowX: 'auto' }}>
                                              <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                                                <thead>
                                                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                                    <th style={{ padding: '0.3rem 0.35rem', width: '26px', textAlign: 'center' }}>#</th>
                                                    <th style={{ padding: '0.3rem 0.35rem' }}>Nama PIC</th>
                                                    <th style={{ padding: '0.3rem 0.35rem', width: '140px' }}>No. HP / WA</th>
                                                    <th style={{ padding: '0.3rem 0.35rem' }}>Email Kantor</th>
                                                    <th style={{ padding: '0.3rem 0.35rem' }}>Email Pribadi / Alt</th>
                                                    <th style={{ padding: '0.3rem 0.35rem', width: '34px', textAlign: 'center' }}></th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {editablePics.map((p, pIdx) => (
                                                    <tr key={`${row._rowKey}-pic-edit-${pIdx}`} style={{ borderBottom: pIdx < editablePics.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                      <td style={{ padding: '0.3rem 0.35rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
                                                        {pIdx + 1}
                                                      </td>
                                                      <td style={{ padding: '0.3rem 0.25rem' }}>
                                                        <input
                                                          type="text"
                                                          value={p.name || ''}
                                                          onChange={(e) =>
                                                            updateDraftPicContacts(
                                                              row._rowKey,
                                                              editablePics.map((item, idx) =>
                                                                idx === pIdx ? { ...item, name: e.target.value } : item
                                                              )
                                                            )
                                                          }
                                                          placeholder="Nama PIC..."
                                                          style={{ ...inputCellStyle, fontSize: '0.72rem', padding: '0.28rem 0.45rem' }}
                                                        />
                                                      </td>
                                                      <td style={{ padding: '0.3rem 0.25rem' }}>
                                                        <input
                                                          type="text"
                                                          value={p.phone || ''}
                                                          onChange={(e) =>
                                                            updateDraftPicContacts(
                                                              row._rowKey,
                                                              editablePics.map((item, idx) =>
                                                                idx === pIdx ? { ...item, phone: e.target.value } : item
                                                              )
                                                            )
                                                          }
                                                          placeholder="0812..."
                                                          style={{ ...inputCellStyle, fontSize: '0.72rem', padding: '0.28rem 0.45rem' }}
                                                        />
                                                      </td>
                                                      <td style={{ padding: '0.3rem 0.25rem' }}>
                                                        <input
                                                          type="text"
                                                          inputMode="email"
                                                          value={p.officeEmail || ''}
                                                          onChange={(e) =>
                                                            updateDraftPicContacts(
                                                              row._rowKey,
                                                              editablePics.map((item, idx) =>
                                                                idx === pIdx ? { ...item, officeEmail: e.target.value } : item
                                                              )
                                                            )
                                                          }
                                                          placeholder="pic@corporate.com"
                                                          style={{ ...inputCellStyle, fontSize: '0.72rem', padding: '0.28rem 0.45rem' }}
                                                        />
                                                      </td>
                                                      <td style={{ padding: '0.3rem 0.25rem' }}>
                                                        <input
                                                          type="text"
                                                          inputMode="email"
                                                          value={p.personalEmail || ''}
                                                          onChange={(e) =>
                                                            updateDraftPicContacts(
                                                              row._rowKey,
                                                              editablePics.map((item, idx) =>
                                                                idx === pIdx ? { ...item, personalEmail: e.target.value } : item
                                                              )
                                                            )
                                                          }
                                                          placeholder="alt@gmail.com"
                                                          style={{ ...inputCellStyle, fontSize: '0.72rem', padding: '0.28rem 0.45rem' }}
                                                        />
                                                      </td>
                                                      <td style={{ padding: '0.3rem 0.25rem', textAlign: 'center' }}>
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            updateDraftPicContacts(
                                                              row._rowKey,
                                                              editablePics.length <= 1
                                                                ? [createEmptyPicContact()]
                                                                : editablePics.filter((_, idx) => idx !== pIdx)
                                                            )
                                                          }
                                                          title="Hapus PIC"
                                                          style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '5px',
                                                            border: '1px solid rgba(239, 68, 68, 0.28)',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                          }}
                                                        >
                                                          <Trash2 size={11} />
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginBottom: '0.85rem' }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            <Building size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            Office Address
                                          </label>
                                          <input
                                            type="text"
                                            value={row.address}
                                            onChange={(e) => updateDraftField(row._rowKey, 'address', e.target.value)}
                                            placeholder="Alamat kantor..."
                                            style={inputCellStyle}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            Airlines Code
                                          </label>
                                          <input
                                            type="text"
                                            value={row.airlinesCode}
                                            onChange={(e) => updateDraftField(row._rowKey, 'airlinesCode', e.target.value)}
                                            placeholder="GA: ..., SQ: ..."
                                            style={inputCellStyle}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            Detail / SOP Link
                                          </label>
                                          <input
                                            type="text"
                                            value={row.detailLink}
                                            onChange={(e) => updateDraftField(row._rowKey, 'detailLink', e.target.value)}
                                            placeholder="https://..."
                                            style={inputCellStyle}
                                          />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            Remarks / TOP / Notes
                                          </label>
                                          <input
                                            type="text"
                                            value={row.remarks}
                                            onChange={(e) => updateDraftField(row._rowKey, 'remarks', e.target.value)}
                                            placeholder="Catatan tambahan..."
                                            style={inputCellStyle}
                                          />
                                        </div>
                                      </div>

                                      {/* Service Fees Preview & Quick Edit */}
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
                                        {[
                                          { key: 'flightFee', label: 'Flight Service Fees', accent: neonBlue },
                                          { key: 'hotelFee', label: 'Hotel Service Fees', accent: '#10b981' }
                                        ].map((sec) => (
                                          <div
                                            key={sec.key}
                                            style={{
                                              padding: '0.65rem 0.75rem',
                                              borderRadius: '9px',
                                              background: 'var(--bg-card)',
                                              border: '1px solid var(--border)'
                                            }}
                                          >
                                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: sec.accent, marginBottom: '0.5rem' }}>
                                              {sec.label}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                                              {CORPORATE_FEE_KEYS.map((feeKey) => {
                                                const entry = parseFeeEntry(row[sec.key]?.[feeKey]);
                                                return (
                                                  <div key={feeKey}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                                                        {CORPORATE_FEE_LABELS[feeKey]}
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          updateDraftFee(
                                                            row._rowKey,
                                                            sec.key,
                                                            feeKey,
                                                            entry.type === 'percent'
                                                              ? { type: 'nominal', value: 0 }
                                                              : { type: 'percent', value: 0, rawInput: '' }
                                                          )
                                                        }
                                                        style={{
                                                          border: 'none',
                                                          background: 'transparent',
                                                          color: sec.accent,
                                                          fontSize: '0.64rem',
                                                          fontWeight: '700',
                                                          cursor: 'pointer',
                                                          padding: 0
                                                        }}
                                                        title="Klik untuk ganti satuan Rp / %"
                                                      >
                                                        {entry.type === 'percent' ? '%' : 'Rp'}
                                                      </button>
                                                    </div>
                                                    <input
                                                      type="text"
                                                      className="font-mono"
                                                      value={
                                                        entry.type === 'percent'
                                                          ? entry.rawInput ?? String(entry.value || '')
                                                          : formatCommaNumber(entry.value)
                                                      }
                                                      onChange={(e) => {
                                                        if (entry.type === 'percent') {
                                                          const s = sanitizePercentInput(e.target.value);
                                                          updateDraftFee(row._rowKey, sec.key, feeKey, {
                                                            type: 'percent',
                                                            value: parseFloat(s) || 0,
                                                            rawInput: s
                                                          });
                                                        } else {
                                                          updateDraftFee(row._rowKey, sec.key, feeKey, {
                                                            type: 'nominal',
                                                            value: parseCommaNumber(e.target.value)
                                                          });
                                                        }
                                                      }}
                                                      placeholder={formatFeeEntryDisplay({ type: entry.type, value: 0 })}
                                                      style={{ ...inputCellStyle, fontSize: '0.71rem', padding: '0.28rem 0.4rem' }}
                                                    />
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'preview' || status === 'saving') && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'var(--bg-surface)'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetModal}
              disabled={status === 'saving'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', borderRadius: '9px' }}
            >
              <RotateCcw size={14} /> Upload File Lain
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {liveCounts.selectedNew} baru
                {liveCounts.selectedUpdate > 0 ? ` • ${liveCounts.selectedUpdate} update` : ''}
                {liveCounts.selectedSkipped > 0 ? ` • ${liveCounts.selectedSkipped} dilewati` : ''}
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={status === 'saving'}
                style={{ fontSize: '0.82rem', borderRadius: '9px' }}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSave}
                disabled={status === 'saving' || liveCounts.effectiveSaveCount === 0}
                style={{
                  background: `linear-gradient(135deg, ${neonBlue}, #10b981)`,
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  padding: '0.58rem 1.25rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  opacity: status === 'saving' || liveCounts.effectiveSaveCount === 0 ? 0.6 : 1
                }}
              >
                {status === 'saving' ? (
                  <>
                    <Loader2 size={15} className="spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Simpan {liveCounts.effectiveSaveCount} Akun ke Database
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateAiImportModal;
