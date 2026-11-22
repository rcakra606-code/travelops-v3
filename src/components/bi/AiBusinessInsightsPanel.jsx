import { useState, useCallback, useMemo } from 'react';
import {
  Sparkles, RefreshCw, ShieldCheck, AlertTriangle, TrendingUp,
  Info, ArrowUpRight, ChevronDown, ChevronUp, CheckCircle2, Database, Copy, Check
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { buildPiiFreeBiSnapshot, normalizeBiAiResponse } from '../../utils/biAiPrompt';
import BiDataNotice from './BiDataNotice';
import { BiEmptyState, BiErrorState } from './BiStates';

const SEVERITY_META = {
  critical: {
    label: 'Kritis',
    color: 'var(--danger)',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: AlertTriangle
  },
  warning: {
    label: 'Perhatian',
    color: 'var(--warning)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: AlertTriangle
  },
  opportunity: {
    label: 'Peluang',
    color: 'var(--success)',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: TrendingUp
  },
  info: {
    label: 'Observasi',
    color: 'var(--primary)',
    bg: 'var(--primary-soft)',
    border: 'var(--border)',
    icon: Info
  }
};

const CONFIDENCE_LABEL = {
  high: { text: 'Keyakinan Tinggi', color: 'var(--success)' },
  medium: { text: 'Keyakinan Sedang', color: 'var(--warning)' },
  low: { text: 'Keyakinan Terbatas', color: 'var(--text-muted)' }
};

const ROUTE_LABELS = {
  '/tours': 'Buka Tour & Perjalanan',
  '/documents': 'Buka Visa & Dokumen',
  '/corporate': 'Buka Klien Korporasi',
  '/sales': 'Buka Penjualan & Target',
  '/productivity': 'Buka Produktivitas & P&L',
  '/hotel': 'Buka Reservasi Hotel',
  '/cruise': 'Buka Pelayaran Cruise',
  '/telecom': 'Buka SIM & WiFi',
  '/overtime': 'Buka Log Lembur',
  '/staff-performance': 'Buka Performa Konsultan'
};

/**
 * Real-Data AI Business Intelligence Analyst Panel
 * - Sends strictly PII-free aggregated snapshot to POST /api/bi/generate-insights
 * - Caches results per (periodPreset, scope, totalRecordsAnalyzed)
 * - Displays all 7 mandatory analytical elements per insight
 */
const AiBusinessInsightsPanel = ({ analytics, userRole = 'Staff', onNavigate }) => {
  const [analysisCache, setAnalysisCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [domainFilter, setDomainFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const cacheKey = `${analytics.meta.periodPreset}_${analytics.meta.scope}_${analytics.meta.totalRecordsAnalyzed}`;

  // Display cached insight if it matches current filter slice, otherwise prompt user to generate
  const activeAnalysis = analysisCache[cacheKey] || null;

  const generateInsights = useCallback(async ({ forceRefresh = false } = {}) => {
    if (!forceRefresh && analysisCache[cacheKey]) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const snapshot = buildPiiFreeBiSnapshot(analytics, { userRole });
      if (!snapshot) {
        throw new Error('Data analitik belum siap untuk dianalisis.');
      }

      const headers = { 'Content-Type': 'application/json' };
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          headers.Authorization = `Bearer ${data.session.access_token}`;
        }
      } catch {
        // Proceed; server enforces auth in production
      }

      const res = await fetch('/api/bi/generate-insights', {
        method: 'POST',
        headers,
        body: JSON.stringify({ snapshot })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.error || `Gagal menghasilkan analisis AI (HTTP ${res.status}).`);
      }

      const normalized = normalizeBiAiResponse(body.data);
      const stamped = {
        ...normalized,
        generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setAnalysisCache((prev) => ({ ...prev, [cacheKey]: stamped }));
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menghubungi AI BI Analyst.');
    } finally {
      setLoading(false);
    }
  }, [analytics, analysisCache, cacheKey, userRole]);

  const filteredInsights = useMemo(() => {
    const list = activeAnalysis?.insights || [];
    return list.filter((i) => {
      if (domainFilter !== 'All' && i.domain !== domainFilter) return false;
      if (severityFilter !== 'All' && i.severity !== severityFilter) return false;
      return true;
    });
  }, [activeAnalysis, domainFilter, severityFilter]);

  const handleCopyExecutiveBrief = useCallback(() => {
    if (!activeAnalysis) return;
    const scopeLabel = analytics.meta.scope === 'mine' ? 'Portofolio Saya' : 'Seluruh Cabang';
    const lines = [
      `*RINGKASAN EXECUTIVE BI — TRAVELOPS*`,
      `Periode: ${analytics.meta.currentWindowLabel}${analytics.meta.previousWindowLabel ? ` (vs ${analytics.meta.previousWindowLabel})` : ''}`,
      `Cakupan: ${scopeLabel}`,
      ``,
      `*Ringkasan Eksekutif:*`,
      activeAnalysis.executiveSummary,
      ``,
      `*Temuan & Rekomendasi Utama:*`,
      ...activeAnalysis.insights.map(
        (ins, i) =>
          `${i + 1}. *[${ins.domain} · ${(SEVERITY_META[ins.severity]?.label || ins.severity).toUpperCase()}] ${ins.title}*\n   • Metrik: ${ins.metric}\n   • Dampak: ${ins.businessImpact}\n   • Aksi: ${ins.recommendedAction}`
      ),
      ``,
      `_Catatan Data: ${activeAnalysis.dataCoverageNote}_`
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2200);
    }).catch(() => {});
  }, [activeAnalysis, analytics.meta]);

  const toggleEvidence = (id) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasData = analytics.meta.totalRecordsAnalyzed > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Deterministic Real-Time Anomaly Strip (Instant, Zero AI Latency) */}
      <section
        aria-label="Sinyal Anomali Deterministik"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1rem 1.15rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Deteksi Sinyal Otomatis (Berbasis Aturan Data Real-Time)
            </h3>
            <p style={{ margin: '0.18rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Dihitung langsung dari database tanpa delay AI — mencakup piutang mendesak, SLA dokumen, credit limit B2B, dan kompresi margin.
            </p>
          </div>
          <span className="bi-micro-badge">
            {analytics.signals.length} sinyal terdeteksi
          </span>
        </div>

        {analytics.signals.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--success)', padding: '0.35rem 0' }}>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Tidak ada anomali kritis yang terdeteksi oleh aturan ambang batas pada periode ini.</span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '0.7rem'
            }}
          >
            {analytics.signals.map((sig) => {
              const metaStyle = SEVERITY_META[sig.severity] || SEVERITY_META.info;
              const IconComp = metaStyle.icon;
              return (
                <div
                  key={sig.id}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: `1px solid ${metaStyle.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: metaStyle.color,
                          background: metaStyle.bg,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '5px'
                        }}
                      >
                        <IconComp size={11} aria-hidden="true" />
                        {sig.domain} · {metaStyle.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {sig.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                      {sig.detail}
                    </div>
                  </div>
                  {sig.targetRoute && (
                    <button
                      type="button"
                      onClick={() => onNavigate(sig.targetRoute)}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {ROUTE_LABELS[sig.targetRoute] || 'Tinjau Modul'}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Business Intelligence Analyst Workspace */}
      <section
        aria-label="AI Business Intelligence Analyst"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1.1rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                AI Business Intelligence Analyst
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.14rem 0.5rem',
                  borderRadius: '5px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--success)'
                }}
              >
                <ShieldCheck size={12} aria-hidden="true" />
                PII-Free · Hanya Metrik Agregat
              </span>
              <span className="bi-micro-badge">
                Cakupan: {analytics.meta.scope === 'mine' ? 'Portofolio Saya' : 'Seluruh Cabang'}
              </span>
            </div>
            <p style={{ margin: '0.28rem 0 0 0', fontSize: '0.77rem', color: 'var(--text-muted)', maxWidth: '720px', lineHeight: 1.45 }}>
              Menyusun analisis terstruktur atas performa operasional, finansial, dan komersial periode{' '}
              <strong style={{ color: 'var(--text-main)' }}>{analytics.meta.currentWindowLabel}</strong>
              {analytics.meta.previousWindowLabel ? ` dibanding ${analytics.meta.previousWindowLabel}` : ''}. Setiap temuan wajib menyertakan metrik, data pembanding, dampak bisnis, rekomendasi, dan kualifikasi data.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || !hasData}
            onClick={() => generateInsights({ forceRefresh: Boolean(activeAnalysis) })}
            className="btn btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '8px',
              opacity: loading || !hasData ? 0.65 : 1
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                Menganalisis Data...
              </>
            ) : activeAnalysis ? (
              <>
                <RefreshCw size={14} aria-hidden="true" />
                Perbarui Analisis AI
              </>
            ) : (
              <>
                <Sparkles size={14} aria-hidden="true" />
                Jalankan Analisis AI BI
              </>
            )}
          </button>
        </div>

        {/* Empty / Loading / Error / Results States */}
        {!hasData && (
          <BiEmptyState
            title="Belum ada transaksi untuk dianalisis pada periode ini"
            description="Pilih rentang waktu yang lebih luas (misalnya Tahun Ini atau Semua Data) sebelum menjalankan AI BI Analyst."
            compact
          />
        )}

        {error && (
          <BiErrorState
            title="Analisis AI BI tidak dapat diselesaikan"
            message={error}
            onRetry={() => generateInsights({ forceRefresh: true })}
          />
        )}

        {loading && (
          <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="shimmer-skeleton" style={{ height: '74px', borderRadius: '8px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
              <div className="shimmer-skeleton" style={{ height: '210px', borderRadius: '8px' }} />
              <div className="shimmer-skeleton" style={{ height: '210px', borderRadius: '8px' }} />
            </div>
          </div>
        )}

        {!loading && hasData && !activeAnalysis && !error && (
          <div
            style={{
              padding: '1.5rem 1.25rem',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-hover)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Siap menganalisis {analytics.meta.totalRecordsAnalyzed} catatan periode {analytics.meta.currentWindowLabel}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Klik <strong>Jalankan Analisis AI BI</strong> untuk mendapatkan rekomendasi strategis berbasis data riil (tanpa mengirim nama tamu, email, nomor HP, atau nomor paspor).
              </div>
            </div>
          </div>
        )}

        {!loading && activeAnalysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {/* Executive Summary Box */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  Ringkasan Eksekutif AI
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                    Dihasilkan pukul {activeAnalysis.generatedAt}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyExecutiveBrief}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.71rem',
                      padding: '0.22rem 0.55rem',
                      borderRadius: '6px',
                      color: copiedBrief ? 'var(--success)' : 'var(--text-main)'
                    }}
                  >
                    {copiedBrief ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                    {copiedBrief ? 'Tersalin!' : 'Salin Ringkasan (WA)'}
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--text-main)' }}>
                {activeAnalysis.executiveSummary}
              </p>
            </div>

            {/* Domain & Severity Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.55rem' }}>
              <div role="group" aria-label="Filter domain insight" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {['All', 'Operational', 'Financial', 'Business'].map((dom) => {
                  const count =
                    dom === 'All'
                      ? activeAnalysis.insights.length
                      : activeAnalysis.insights.filter((i) => i.domain === dom).length;
                  const active = domainFilter === dom;
                  return (
                    <button
                      key={dom}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDomainFilter(dom)}
                      style={{
                        padding: '0.28rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--primary-soft)' : 'var(--bg-surface)',
                        color: active ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      {dom === 'All' ? 'Semua Domain' : dom} ({count})
                    </button>
                  );
                })}
              </div>

              <div role="group" aria-label="Filter tingkat prioritas insight" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'All', label: 'Semua Prioritas' },
                  { id: 'critical', label: 'Kritis' },
                  { id: 'warning', label: 'Perhatian' },
                  { id: 'opportunity', label: 'Peluang' }
                ].map((sev) => {
                  const active = severityFilter === sev.id;
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSeverityFilter(sev.id)}
                      style={{
                        padding: '0.24rem 0.56rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--bg-card)' : 'transparent',
                        color: active ? 'var(--text-main)' : 'var(--text-muted)'
                      }}
                    >
                      {sev.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7-Element Structured Insight Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '0.9rem'
              }}
            >
              {filteredInsights.map((ins) => {
                const sev = SEVERITY_META[ins.severity] || SEVERITY_META.info;
                const conf = CONFIDENCE_LABEL[ins.confidence] || CONFIDENCE_LABEL.medium;
                const isExpanded = Boolean(expandedEvidence[ins.id]);
                const SevIcon = sev.icon;

                return (
                  <article
                    key={ins.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderTop: `2px solid ${sev.color}`,
                      borderRadius: '9px',
                      padding: '0.95rem 1.05rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.7rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {/* Badges + 1. Title */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '5px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: sev.color,
                              background: sev.bg
                            }}
                          >
                            <SevIcon size={11} aria-hidden="true" />
                            {sev.label}
                          </span>
                          <span className="bi-micro-badge">{ins.domain}</span>
                        </div>
                        <span style={{ fontSize: '0.69rem', fontWeight: 600, color: conf.color }}>
                          {conf.text}
                        </span>
                      </div>

                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                        {ins.title}
                      </h4>

                      {/* 2. Relevant Business Metric */}
                      <div
                        className="tabular-nums"
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-main)'
                        }}
                      >
                        {ins.metric}
                      </div>

                      {/* 4. What Changed & 5. Business Impact */}
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Perubahan: </strong>
                          {ins.whatChanged}
                        </div>
                        <div style={{ marginTop: '0.35rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>Dampak Bisnis: </strong>
                          {ins.businessImpact}
                        </div>
                      </div>

                      {/* 6. Recommended Action */}
                      <div
                        style={{
                          padding: '0.55rem 0.7rem',
                          borderRadius: '6px',
                          background: 'var(--primary-soft)',
                          border: '1px solid var(--border)',
                          fontSize: '0.77rem',
                          lineHeight: 1.45,
                          color: 'var(--text-main)'
                        }}
                      >
                        <strong style={{ color: 'var(--primary)' }}>Rekomendasi Aksi: </strong>
                        {ins.recommendedAction}
                      </div>
                    </div>

                    {/* 3. Supporting Data & 7. Data Quality Qualification + Drilldown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleEvidence(ins.id)}
                          aria-expanded={isExpanded}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.28rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <Database size={12} aria-hidden="true" />
                          <span>Data Pendukung &amp; Kualifikasi</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {ins.targetRoute && (
                          <button
                            type="button"
                            onClick={() => onNavigate(ins.targetRoute)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              cursor: 'pointer'
                            }}
                          >
                            {ROUTE_LABELS[ins.targetRoute] || 'Lihat Modul'}
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.73rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.45,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem'
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-main)' }}>Data &amp; Pembanding: </strong>
                            {ins.supportingData}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-main)' }}>Kualifikasi Kualitas Data: </strong>
                            {ins.dataQualityNote}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Data Coverage Notice */}
            <BiDataNotice tone="limitation" title="Cakupan & Batasan Analisis AI">
              {activeAnalysis.dataCoverageNote}
            </BiDataNotice>
          </div>
        )}
      </section>
    </div>
  );
};

export default AiBusinessInsightsPanel;
