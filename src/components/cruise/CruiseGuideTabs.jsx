import { useState, useMemo } from 'react';
import {
  Copy, Check, FileDown, CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  Info, Calculator, BedDouble, Compass, CalendarDays, MessageSquare, Search, Sparkles
} from 'lucide-react';
import {
  CABIN_CATEGORIES,
  CABIN_GLOSSARY,
  COMPLIANCE_RULES,
  CRUISE_REGIONS,
  DECK_STRATEGY_TIPS,
  DEFAULT_FX_RATES,
  EXCLUDED_ITEMS,
  INCLUDED_ITEMS,
  PRE_SAILING_TIMELINE,
  SALES_OBJECTION_PLAYBOOK
} from '../../utils/cruiseSalesGuideData';
import {
  buildCabinGuideWhatsAppBriefing,
  buildComparisonWhatsAppBriefing,
  buildExtrasEstimateWhatsAppBriefing,
  buildPreSailingChecklistWhatsApp,
  calculateCruiseExtras,
  formatBudgetTier,
  formatGratuityBadge,
  formatIdr
} from '../../utils/cruiseSalesGuideHelpers';
import {
  generateCruiseComparisonPdf,
  generatePreSailingChecklistPdf
} from '../../utils/cruiseSalesGuidePdf';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const renderRichInline = (text) => {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={idx} style={{ color: 'var(--text-main)' }}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
};

// ---------------- TAB 2: SIDE-BY-SIDE COMPARISON ----------------
export const ComparisonTab = ({ guides, compareIds, setCompareIds, consultantName, toast }) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedGuides = useMemo(
    () => compareIds.map((id) => guides.find((g) => g.id === id)).filter(Boolean),
    [compareIds, guides]
  );

  const setSlot = (slotIdx, id) => {
    const next = [...compareIds];
    next[slotIdx] = id;
    setCompareIds(next.filter((v, i) => v || i < 2));
  };

  const applyPreset = (ids) => {
    const valid = ids.filter((id) => guides.some((g) => g.id === id));
    if (valid.length >= 2) setCompareIds(valid);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildComparisonWhatsAppBriefing(selectedGuides));
      setCopied(true);
      toast?.success('Ringkasan perbandingan disalin untuk WhatsApp!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      await generateCruiseComparisonPdf(selectedGuides, consultantName);
      toast?.success('PDF Perbandingan Kapal berhasil diunduh!');
    } catch (err) {
      toast?.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const rows = [
    { label: 'Segmen & Budget', render: (g) => `${g.segment} (${formatBudgetTier(g.budgetTier)})` },
    { label: 'Kapal Unggulan', render: (g) => (g.featuredShips || []).map((s) => s.name).join(', ') || '—' },
    { label: 'Homeport Utama', render: (g) => (g.homeports || []).join(', ') || '—' },
    { label: 'Durasi Populer', render: (g) => (g.typicalDurations || []).join(' / ') || '—' },
    {
      label: 'Status Halal / Dietary',
      render: (g) => (
        <div>
          <strong style={{ color: g.halalStatus === 'Certified Halal Kitchen' ? '#10b981' : 'var(--primary)' }}>
            {g.halalStatus}
          </strong>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>{g.halalNotes}</div>
        </div>
      )
    },
    {
      label: 'Estimasi Gratuity / Tipping',
      render: (g) => (
        <div>
          <strong>{formatGratuityBadge(g)}</strong>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>{g.gratuityNotes}</div>
        </div>
      )
    },
    { label: 'Layanan VIP / Suite Club', render: (g) => g.vipClubName || '—' },
    {
      label: 'Usia Bayi, Hamil & Pemesan',
      render: (g) => `Bayi min. ${g.minInfantMonths} bln · Hamil maks. ${g.pregnancyMaxWeeks} mgg · Pemesan min. ${g.minBookingAge} thn`
    },
    {
      label: 'Keunggulan Utama',
      render: (g) => (
        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.79rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {(g.highlights || []).slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )
    },
    {
      label: 'Tips Sales Internal',
      render: (g) => (
        <div style={{ fontSize: '0.78rem', color: '#d97706' }}>{g.salesTips?.[0] || '—'}</div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem' }}>Pilih 2–3 Brand untuk Dibandingkan</h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Gunakan preset cepat atau pilih langsung sesuai pertanyaan klien Anda.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={handleCopy} disabled={selectedGuides.length < 2} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Disalin!' : 'Copy WA Perbandingan'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handlePdf} disabled={selectedGuides.length < 2 || exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <FileDown size={14} /> {exporting ? 'Membuat PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', alignSelf: 'center', fontWeight: 700 }}>Preset Cepat:</span>
          {[
            { label: '🇸🇬 Big 3 Singapura', ids: ['disney-cruise-line', 'stardream-cruises', 'royal-caribbean'] },
            { label: '🇯🇵 Spesialis Jepang', ids: ['princess-cruises', 'msc-cruises', 'royal-caribbean'] },
            { label: '✨ Premium & Luxury', ids: ['celebrity-cruises', 'holland-america-line', 'silversea-cruises'] }
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.ids)}
              style={{
                padding: '0.28rem 0.65rem',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
          {[0, 1, 2].map((slot) => (
            <div key={slot}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>
                Pilihan {slot + 1} {slot === 2 ? '(Opsional)' : '*'}
              </label>
              <select
                value={compareIds[slot] || ''}
                onChange={(e) => setSlot(slot, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.48rem 0.65rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem'
                }}
              >
                {slot === 2 && <option value="">— Tanpa Pilihan ke-3 —</option>}
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>{g.brandName}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {selectedGuides.length >= 2 && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', width: '190px', color: 'var(--text-subtle)' }}>Aspek Perbandingan</th>
                {selectedGuides.map((g) => (
                  <th
                    key={g.id}
                    style={{
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      borderTop: `3px solid ${g.accentColor || 'var(--primary)'}`
                    }}
                  >
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>{g.brandName}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-subtle)' }}>{g.segment}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-subtle)', verticalAlign: 'top', background: 'var(--bg-surface)' }}>
                    {row.label}
                  </td>
                  {selectedGuides.map((g) => (
                    <td key={g.id} style={{ padding: '0.75rem 1rem', verticalAlign: 'top', lineHeight: 1.5 }}>
                      {row.render(g)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------- TAB 3: CABIN & DECK GUIDE ----------------
export const CabinDeckTab = ({ toast }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCabinGuideWhatsAppBriefing());
      setCopied(true);
      toast?.success('Panduan Tipe Kabin disalin untuk WhatsApp!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>4 Kategori Utama Kabin Kapal Pesiar</h3>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Panduan cepat menjelaskan perbedaan kamar & melakukan upsell ke Balcony atau Suite.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Disalin!' : 'Copy Panduan Kabin ke WA'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
        {CABIN_CATEGORIES.map((cabin) => (
          <div key={cabin.id} className="card" style={{ padding: '1rem', borderTop: `3px solid ${cabin.accent}`, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BedDouble size={15} color={cabin.accent} /> {cabin.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>{cabin.subtitle}</div>
              </div>
              <span style={{ padding: '0.18rem 0.5rem', borderRadius: 6, background: `${cabin.accent}20`, color: cabin.accent, fontWeight: 800, fontSize: '0.74rem' }}>
                {cabin.priceLevel}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
              <strong>Luas Rata-rata:</strong> {cabin.sizeRange}
            </div>
            <div style={{ fontSize: '0.8rem', padding: '0.5rem 0.65rem', borderRadius: 8, background: 'var(--bg-surface)' }}>
              <strong>Ideal untuk:</strong> {cabin.idealFor}
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#10b981', marginBottom: '0.2rem' }}>Kelebihan:</div>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {cabin.pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem' }}>Perlu Diperhatikan:</div>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-subtle)' }}>
                {cabin.cons.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '0.55rem', borderTop: '1px dashed var(--border)', fontSize: '0.77rem', color: 'var(--primary)' }}>
              💡 <strong>Tips Sales:</strong> {cabin.salesTip}
            </div>
          </div>
        ))}
      </div>

      {/* Deck Strategy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' }}>
        {DECK_STRATEGY_TIPS.map((block) => (
          <div key={block.title} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${block.tone}` }}>
            <h4 style={{ margin: '0 0 0.55rem', fontSize: '0.9rem', color: block.tone }}>{block.title}</h4>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.81rem', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-subtle)' }}>
              {block.points.map((pt, i) => <li key={i}>{renderRichInline(pt)}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Glossary */}
      <div className="card" style={{ padding: '1rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Compass size={16} color="var(--primary)" /> Glosarium Istilah Penting Kapal Pesiar
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {CABIN_GLOSSARY.map((item) => (
            <div key={item.term} style={{ padding: '0.7rem 0.85rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{item.term}</div>
              <div style={{ fontSize: '0.79rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>{renderRichInline(item.meaning)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- TAB 4: PRICING BREAKDOWN + EXTRAS CALCULATOR ----------------
export const PricingCalculatorTab = ({ guides, toast }) => {
  const [brandId, setBrandId] = useState(guides[0]?.id || 'disney-cruise-line');
  const [nights, setNights] = useState(3);
  const [pax, setPax] = useState(2);
  const [cabinTier, setCabinTier] = useState('standard');
  const [includeWifi, setIncludeWifi] = useState(false);
  const [wifiPerDayUsd, setWifiPerDayUsd] = useState(22);
  const [includeBeverage, setIncludeBeverage] = useState(false);
  const [beveragePerDayUsd, setBeveragePerDayUsd] = useState(55);
  const [includeTransfer, setIncludeTransfer] = useState(true);
  const [transferPerPaxIdr, setTransferPerPaxIdr] = useState(450000);
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [insurancePerPaxIdr, setInsurancePerPaxIdr] = useState(350000);
  const [fxRates, setFxRates] = useState(DEFAULT_FX_RATES);
  const [copied, setCopied] = useState(false);

  const selectedGuide = useMemo(() => guides.find((g) => g.id === brandId) || guides[0], [guides, brandId]);

  const estimate = useMemo(
    () =>
      calculateCruiseExtras({
        guide: selectedGuide,
        nights,
        pax,
        cabinTier,
        includeWifi,
        wifiPerDayUsd,
        includeBeverage,
        beveragePerDayUsd,
        includeTransfer,
        transferPerPaxIdr,
        includeInsurance,
        insurancePerPaxIdr,
        fxRates
      }),
    [
      selectedGuide, nights, pax, cabinTier, includeWifi, wifiPerDayUsd,
      includeBeverage, beveragePerDayUsd, includeTransfer, transferPerPaxIdr,
      includeInsurance, insurancePerPaxIdr, fxRates
    ]
  );

  const handleCopyEstimate = async () => {
    try {
      await navigator.clipboard.writeText(buildExtrasEstimateWhatsAppBriefing(estimate));
      setCopied(true);
      toast?.success('Estimasi biaya tambahan disalin untuk WhatsApp!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.82rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Included vs Excluded */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.9rem' }}>
        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #10b981' }}>
          <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={17} /> Umumnya SUDAH Termasuk Harga Cruise
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {INCLUDED_ITEMS.map((item) => (
              <div key={item.title} style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'rgba(16,185,129,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.83rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.77rem', color: 'var(--text-subtle)' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.95rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <XCircle size={17} /> BELUM Termasuk / Biaya Tambahan Opsional
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {EXCLUDED_ITEMS.map((item) => (
              <div key={item.title} style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'rgba(245,158,11,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.83rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.77rem', color: 'var(--text-subtle)' }}>{renderRichInline(item.detail)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Gratuity & Extras Calculator */}
      <div className="card" style={{ padding: '1.15rem', borderTop: '3px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.9rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calculator size={17} color="var(--primary)" /> Mini Kalkulator Estimasi Gratuity & Biaya Tambahan
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Bantu klien memperkirakan total pengeluaran di luar tiket kapal sejak awal agar transparan.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleCopyEstimate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Disalin!' : 'Copy Estimasi ke WA'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Brand Kapal</label>
                <select style={inputStyle} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.brandName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Kategori Kabin</label>
                <select style={inputStyle} value={cabinTier} onChange={(e) => setCabinTier(e.target.value)}>
                  <option value="standard">Standar (Int/OV/Bal)</option>
                  <option value="suite">Suite / VIP Club</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Jumlah Malam</label>
                <input type="number" min={1} max={60} style={inputStyle} value={nights} onChange={(e) => setNights(Number(e.target.value) || 1)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Jumlah Peserta (Pax)</label>
                <input type="number" min={1} max={50} style={inputStyle} value={pax} onChange={(e) => setPax(Number(e.target.value) || 1)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['USD', 'SGD', 'EUR'].map((cur) => (
                <div key={cur}>
                  <label style={{ display: 'block', fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Kurs 1 {cur} (IDR)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={fxRates[cur]}
                    onChange={(e) => setFxRates((prev) => ({ ...prev, [cur]: Number(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>

            {/* Optional Add-ons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.7rem', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-subtle)' }}>Tambahan Opsional</div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span><input type="checkbox" checked={includeWifi} onChange={(e) => setIncludeWifi(e.target.checked)} /> Paket WiFi Laut (USD/hari)</span>
                <input type="number" style={{ ...inputStyle, width: '84px', padding: '0.25rem 0.45rem' }} value={wifiPerDayUsd} onChange={(e) => setWifiPerDayUsd(Number(e.target.value) || 0)} disabled={!includeWifi} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span><input type="checkbox" checked={includeBeverage} onChange={(e) => setIncludeBeverage(e.target.checked)} /> Beverage Package (USD/hari)</span>
                <input type="number" style={{ ...inputStyle, width: '84px', padding: '0.25rem 0.45rem' }} value={beveragePerDayUsd} onChange={(e) => setBeveragePerDayUsd(Number(e.target.value) || 0)} disabled={!includeBeverage} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span><input type="checkbox" checked={includeTransfer} onChange={(e) => setIncludeTransfer(e.target.checked)} /> Transfer Bandara–Port (IDR/pax)</span>
                <input type="number" style={{ ...inputStyle, width: '110px', padding: '0.25rem 0.45rem' }} value={transferPerPaxIdr} onChange={(e) => setTransferPerPaxIdr(Number(e.target.value) || 0)} disabled={!includeTransfer} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span><input type="checkbox" checked={includeInsurance} onChange={(e) => setIncludeInsurance(e.target.checked)} /> Asuransi Perjalanan (IDR/pax)</span>
                <input type="number" style={{ ...inputStyle, width: '110px', padding: '0.25rem 0.45rem' }} value={insurancePerPaxIdr} onChange={(e) => setInsurancePerPaxIdr(Number(e.target.value) || 0)} disabled={!includeInsurance} />
              </label>
            </div>
          </div>

          {/* Result Panel */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rincian Estimasi — {estimate.brandName}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
                {estimate.nights} Malam · {estimate.pax} Pax · Kabin {cabinTier === 'suite' ? 'Suite / VIP' : 'Standar'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--border)' }}>
                  <span>
                    Gratuity / Tipping{' '}
                    {!estimate.isAllInclusive && (
                      <small style={{ color: 'var(--text-subtle)' }}>
                        ({estimate.gratuity.currency} {estimate.gratuity.ratePerNight} × {estimate.nights}m × {estimate.pax}p = {estimate.gratuity.currency} {estimate.gratuity.originalTotal})
                      </small>
                    )}
                  </span>
                  <strong>{estimate.isAllInclusive ? 'Termasuk (Rp 0)' : formatIdr(estimate.gratuity.idr)}</strong>
                </div>
                {estimate.wifi.included && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--border)' }}>
                    <span>Est. WiFi ({estimate.isAllInclusive ? 'Termasuk' : `USD ${estimate.wifi.usdTotal}`})</span>
                    <strong>{formatIdr(estimate.wifi.idr)}</strong>
                  </div>
                )}
                {estimate.beverage.included && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--border)' }}>
                    <span>Est. Paket Minuman ({estimate.isAllInclusive ? 'Termasuk' : `USD ${estimate.beverage.usdTotal}`})</span>
                    <strong>{formatIdr(estimate.beverage.idr)}</strong>
                  </div>
                )}
                {estimate.transfer.included && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--border)' }}>
                    <span>Est. Transfer Bandara–Pelabuhan</span>
                    <strong>{formatIdr(estimate.transfer.idr)}</strong>
                  </div>
                )}
                {estimate.insurance.included && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--border)' }}>
                    <span>Est. Asuransi Perjalanan</span>
                    <strong>{formatIdr(estimate.insurance.idr)}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: 10, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Perkiraan Total Tambahan ({estimate.pax} Pax)</span>
                <span style={{ fontSize: '1.22rem', fontWeight: 900, color: 'var(--primary)' }}>{formatIdr(estimate.totalIdr)}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: '0.2rem', textAlign: 'right' }}>
                ≈ <strong>{formatIdr(estimate.perPaxIdr)}</strong> / orang
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- TAB 5: COMPLIANCE & PRE-SAILING TIMELINE ----------------
export const ComplianceTab = ({ consultantName, toast }) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const severityMeta = (sev) => {
    if (sev === 'critical') return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: <ShieldAlert size={16} color="#ef4444" />, label: 'WAJIB / KRUSIAL' };
    if (sev === 'warning') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <AlertTriangle size={16} color="#f59e0b" />, label: 'PERHATIAN' };
    return { color: '#0284c7', bg: 'rgba(2,132,199,0.08)', icon: <Info size={16} color="#0284c7" />, label: 'INFO KHUSUS' };
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPreSailingChecklistWhatsApp());
      setCopied(true);
      toast?.success('Checklist Aturan Wajib disalin untuk WhatsApp!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      await generatePreSailingChecklistPdf(consultantName);
      toast?.success('PDF Checklist Persiapan Berlayar diunduh!');
    } catch (err) {
      toast?.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Aturan Wajib Penumpang & Pencegahan Denied Boarding</h3>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Wajib diverifikasi sebelum menerima deposit & disampaikan ke tamu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Disalin!' : 'Copy Checklist WA'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlePdf} disabled={exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <FileDown size={14} /> {exporting ? 'Membuat PDF…' : 'Download PDF Checklist'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
        {COMPLIANCE_RULES.map((rule) => {
          const meta = severityMeta(rule.severity);
          return (
            <div key={rule.id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${meta.color}`, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {meta.icon}
                  <strong style={{ fontSize: '0.88rem' }}>{rule.title}</strong>
                </div>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.14rem 0.45rem', borderRadius: 999, background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.81rem', lineHeight: 1.55, color: 'var(--text-subtle)' }}>
                {renderRichInline(rule.summary)}
              </p>
              <div style={{ marginTop: 'auto', padding: '0.45rem 0.65rem', borderRadius: 8, background: meta.bg, fontSize: '0.76rem', color: 'var(--text-main)' }}>
                <strong>SOP Konsultan:</strong> {rule.salesNote}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pre-Sailing Timeline */}
      <div className="card" style={{ padding: '1.1rem' }}>
        <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CalendarDays size={16} color="var(--primary)" /> Timeline Persiapan Tamu (Booking s/d Naik Kapal)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          {PRE_SAILING_TIMELINE.map((t) => (
            <div key={t.step} style={{ padding: '0.85rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  {t.step}
                </span>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--primary)' }}>{t.timing}</span>
              </div>
              <strong style={{ fontSize: '0.85rem' }}>{t.title}</strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>{renderRichInline(t.detail)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- TAB 6: SEASONALITY & ROUTES ----------------
export const SeasonalityTab = ({ onSelectRegion }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
    <div>
      <h3 style={{ margin: 0, fontSize: '1rem' }}>Kalender Musim & Rute Populer Pelayaran</h3>
      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        Panduan waktu terbaik berjualan per wilayah (hijau = musim aktif, kuning/oranye = peak demand).
      </p>
    </div>

    {CRUISE_REGIONS.map((region) => (
      <div key={region.id} className="card" style={{ padding: '1.05rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.96rem' }}>🌍 {region.label}</h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.15rem' }}>
              Musim Terbaik: {region.bestMonths} · Durasi: {region.durations}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSelectRegion?.(region.id)}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.7rem' }}
          >
            Lihat Kapal di Wilayah Ini →
          </button>
        </div>

        {/* 12-Month Heat Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(36px, 1fr))', gap: '0.25rem', overflowX: 'auto' }}>
          {MONTHS.map((m, idx) => {
            const monthNum = idx + 1;
            const isPeak = region.peakMonths.includes(monthNum);
            const isActive = region.activeMonths.includes(monthNum);
            return (
              <div
                key={m}
                title={isPeak ? `${m}: Peak Season` : isActive ? `${m}: Musim Aktif` : `${m}: Off-Season / Reposisi`}
                style={{
                  textAlign: 'center',
                  padding: '0.32rem 0.15rem',
                  borderRadius: 6,
                  fontSize: '0.71rem',
                  fontWeight: 700,
                  background: isPeak
                    ? 'rgba(245, 158, 11, 0.24)'
                    : isActive
                      ? 'rgba(16, 185, 129, 0.16)'
                      : 'var(--bg-surface)',
                  color: isPeak ? '#d97706' : isActive ? '#10b981' : 'var(--text-muted)',
                  border: `1px solid ${isPeak ? 'rgba(245,158,11,0.45)' : isActive ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', fontSize: '0.8rem' }}>
          <div><strong>Homeport:</strong> <span style={{ color: 'var(--text-subtle)' }}>{region.homeports}</span></div>
          <div><strong>Pelabuhan Populer:</strong> <span style={{ color: 'var(--text-subtle)' }}>{region.popularPorts}</span></div>
          <div><strong>Brand Utama:</strong> <span style={{ color: 'var(--text-subtle)' }}>{region.popularBrands.join(', ')}</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem', fontSize: '0.78rem' }}>
          <div style={{ padding: '0.55rem 0.7rem', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <strong>🛂 Catatan Visa:</strong> {renderRichInline(region.visaAlert)}
          </div>
          <div style={{ padding: '0.55rem 0.7rem', borderRadius: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)' }}>
            <strong>✨ Sudut Jualan (Hook):</strong> {region.sellingHook}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ---------------- TAB 7: SALES PLAYBOOK & FAQ ----------------
export const PlaybookTab = ({ toast }) => {
  const [cat, setCat] = useState('Semua');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const categories = useMemo(
    () => ['Semua', ...new Set(SALES_OBJECTION_PLAYBOOK.map((x) => x.category))],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SALES_OBJECTION_PLAYBOOK.filter((item) => {
      if (cat !== 'Semua' && item.category !== cat) return false;
      if (!q) return true;
      return `${item.objection} ${item.shortAnswer} ${item.keyPoints.join(' ')} ${item.waScript}`.toLowerCase().includes(q);
    });
  }, [cat, search]);

  const copyScript = async (item) => {
    try {
      await navigator.clipboard.writeText(item.waScript);
      setCopiedId(item.id);
      toast?.success('Script balasan WhatsApp berhasil disalin!');
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
      <div className="card" style={{ padding: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              style={{
                padding: '0.32rem 0.7rem',
                borderRadius: 999,
                border: `1px solid ${cat === c ? 'var(--primary)' : 'var(--border)'}`,
                background: cat === c ? 'rgba(14,165,233,0.15)' : 'var(--bg-surface)',
                color: cat === c ? 'var(--primary)' : 'var(--text-subtle)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', minWidth: '220px', flex: '0 1 280px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari keberatan / FAQ klien..."
            style={{
              width: '100%',
              padding: '0.42rem 0.65rem 0.42rem 2rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '0.8rem'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.9rem' }}>
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.16rem 0.55rem', borderRadius: 999, background: 'rgba(14,165,233,0.14)', color: 'var(--primary)' }}>
                {item.category}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => copyScript(item)}
                style={{ padding: '0.28rem 0.65rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                {copiedId === item.id ? 'Disalin!' : 'Copy Balasan WA'}
              </button>
            </div>

            <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main)' }}>{item.objection}</h4>
            <p style={{ margin: 0, fontSize: '0.81rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>{item.shortAnswer}</p>

            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
              {item.keyPoints.map((pt, i) => <li key={i}>{renderRichInline(pt)}</li>)}
            </ul>

            <details style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageSquare size={13} /> Lihat Template Balasan WhatsApp Siap Kirim
              </summary>
              <pre
                style={{
                  margin: '0.55rem 0 0',
                  padding: '0.65rem',
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '0.77rem',
                  lineHeight: 1.5,
                  color: 'var(--text-main)'
                }}
              >
                {item.waScript}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <Sparkles size={24} style={{ marginBottom: '0.4rem' }} />
          <div>Tidak ada FAQ yang cocok dengan pencarian Anda.</div>
        </div>
      )}
    </div>
  );
};
