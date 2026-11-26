import { useState, useMemo, useRef } from 'react';
import {
  X, Bot, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Globe, ExternalLink,
  CheckCheck, StopCircle, Ship, PlusCircle, MinusCircle, Wrench, Clock
} from 'lucide-react';
import { getCruiseFreshnessStatus } from '../../utils/cruiseAiFreshnessAgent';

const formatShortVal = (val) => {
  if (Array.isArray(val)) return val.join(', ');
  if (val === null || val === undefined || val === '') return '—';
  return String(val);
};

const CruiseAiFreshnessModal = ({
  isOpen,
  guides = [],
  canEdit = false,
  auditResults = [],
  lastScanAt = null,
  onRunAuditBrand,
  onApplyAudit,
  onMarkVerified,
  onApplyAllUpdates,
  onClearResults,
  onClose
}) => {
  const [scope, setScope] = useState('all'); // 'all' | 'stale' | 'single'
  const [singleBrandId, setSingleBrandId] = useState(guides[0]?.id || '');
  const [autoApplyMode, setAutoApplyMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentBrand: '' });
  const [applyingId, setApplyingId] = useState(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'updates' | 'verified'
  const cancelRef = useRef(false);

  const staleGuides = useMemo(
    () => guides.filter((g) => getCruiseFreshnessStatus(g.lastVerifiedAt, g.auditStatus).needsCheck),
    [guides]
  );

  const targetGuides = useMemo(() => {
    if (scope === 'stale') return staleGuides;
    if (scope === 'single') {
      const found = guides.find((g) => g.id === singleBrandId);
      return found ? [found] : [];
    }
    return guides;
  }, [scope, staleGuides, guides, singleBrandId]);

  const metrics = useMemo(() => {
    let verified = 0;
    let updates = 0;
    let critical = 0;
    let grounded = 0;
    auditResults.forEach((r) => {
      if (r.webGrounded) grounded += 1;
      if (r.status === 'critical_alert') critical += 1;
      else if (r.totalChanges > 0 || r.status === 'update_available') updates += 1;
      else verified += 1;
    });
    return { total: auditResults.length, verified, updates, critical, grounded };
  }, [auditResults]);

  const filteredResults = useMemo(() => {
    return auditResults.filter((r) => {
      if (filterMode === 'updates') return r.totalChanges > 0 || r.status !== 'verified';
      if (filterMode === 'verified') return r.totalChanges === 0 && r.status === 'verified';
      return true;
    });
  }, [auditResults, filterMode]);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    if (targetGuides.length === 0) return;
    cancelRef.current = false;
    setIsScanning(true);
    setProgress({ current: 0, total: targetGuides.length, currentBrand: '' });

    try {
      for (let i = 0; i < targetGuides.length; i += 1) {
        if (cancelRef.current) break;
        const g = targetGuides[i];
        setProgress({ current: i + 1, total: targetGuides.length, currentBrand: g.brandName });
        await onRunAuditBrand(g, { autoApply: canEdit && autoApplyMode });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    cancelRef.current = true;
  };

  const handleApplyOne = async (result) => {
    try {
      setApplyingId(result.guideId);
      await onApplyAudit(result);
    } finally {
      setApplyingId(null);
    }
  };

  const handleMarkOneVerified = async (result) => {
    try {
      setApplyingId(result.guideId);
      await onMarkVerified(result);
    } finally {
      setApplyingId(null);
    }
  };

  const handleApplyAll = async () => {
    try {
      setApplyingAll(true);
      await onApplyAllUpdates();
    } finally {
      setApplyingAll(false);
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const actionableCount = auditResults.filter((r) => r.totalChanges > 0).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 1120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => !isScanning && onClose()}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '940px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(124,58,237,0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>
                Cruise AI Freshness Agent (Live Web Verification)
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                Memverifikasi tarif Gratuity, kebijakan Halal, aturan penumpang, serta kapal baru/pensiun di seluruh brand via Gemini + Google Search.
                {lastScanAt && (
                  <span> · Scan terakhir: {new Date(lastScanAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isScanning}
            onClick={onClose}
            aria-label="Tutup"
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: isScanning ? 'not-allowed' : 'pointer', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          {/* Scan Controls */}
          <div style={{ padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--text-subtle)', marginRight: '0.2rem' }}>CAKUPAN AUDIT:</span>
              {[
                ['all', `Semua Brand (${guides.length})`],
                ['stale', `Perlu Cek / Usang (${staleGuides.length})`],
                ['single', 'Pilih 1 Brand']
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  disabled={isScanning}
                  onClick={() => setScope(id)}
                  style={{
                    padding: '0.32rem 0.7rem',
                    borderRadius: 999,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    border: `1px solid ${scope === id ? 'var(--primary)' : 'var(--border)'}`,
                    background: scope === id ? 'var(--primary)' : 'var(--bg-card)',
                    color: scope === id ? '#fff' : 'var(--text-main)'
                  }}
                >
                  {label}
                </button>
              ))}

              {scope === 'single' && (
                <select
                  disabled={isScanning}
                  value={singleBrandId}
                  onChange={(e) => setSingleBrandId(e.target.value)}
                  style={{
                    padding: '0.34rem 0.65rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem'
                  }}
                >
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.brandName}</option>
                  ))}
                </select>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                {isScanning ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleStopScan}
                    style={{ color: '#ef4444', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <StopCircle size={14} /> Hentikan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={targetGuides.length === 0}
                    onClick={handleStartScan}
                    style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}
                  >
                    <RefreshCw size={14} /> Jalankan AI Agent ({targetGuides.length})
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              {canEdit ? (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    disabled={isScanning}
                    checked={autoApplyMode}
                    onChange={(e) => setAutoApplyMode(e.target.checked)}
                  />
                  Auto-simpan pembaruan terverifikasi langsung ke Supabase (tanpa review manual per item)
                </label>
              ) : (
                <span>Mode Konsultan: Anda dapat menjalankan pemeriksaan AI; penerapan ke database dilakukan oleh Admin/Manager.</span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> Cron otomatis tersedia di <code>/api/cron/cruise-guide-refresh</code>
              </span>
            </div>
          </div>

          {/* Live Progress Bar */}
          {isScanning && (
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 10, border: '1px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <span>🌐 AI Agent sedang memeriksa di web: {progress.currentBrand}…</span>
                <span>{progress.current}/{progress.total} ({pct}%)</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #7c3aed)', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* KPI Summary Strip */}
          {auditResults.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
                {[
                  ['Diperiksa', metrics.total, 'var(--primary)'],
                  ['Terverifikasi', metrics.verified, '#10b981'],
                  ['Ada Update', metrics.updates, '#f59e0b'],
                  ['Alert Kritis', metrics.critical, '#ef4444'],
                  ['Live Web Search', metrics.grounded, '#7c3aed']
                ].map(([lbl, val, col]) => (
                  <div key={lbl} style={{ padding: '0.6rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: col }}>{val}</div>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    ['all', `Semua (${auditResults.length})`],
                    ['updates', `Perlu Update (${metrics.updates + metrics.critical})`],
                    ['verified', `Sudah Akurat (${metrics.verified})`]
                  ].map(([f, lbl]) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilterMode(f)}
                      style={{
                        padding: '0.26rem 0.65rem',
                        borderRadius: 999,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${filterMode === f ? 'var(--primary)' : 'var(--border)'}`,
                        background: filterMode === f ? 'rgba(14,165,233,0.16)' : 'var(--bg-surface)',
                        color: filterMode === f ? 'var(--primary)' : 'var(--text-subtle)'
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {!isScanning && (
                  <button
                    type="button"
                    onClick={onClearResults}
                    style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: '0.74rem', cursor: 'pointer' }}
                  >
                    Bersihkan Hasil
                  </button>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {auditResults.length === 0 && !isScanning && (
            <div style={{ padding: '2.2rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.84rem' }}>
              <Bot size={34} color="var(--primary)" style={{ marginBottom: '0.55rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Siap Memverifikasi Informasi & Armada Kapal Pesiar
              </div>
              <div>
                Klik <strong>Jalankan AI Agent</strong> untuk mengecek perubahan terbaru tarif gratuity, kebijakan Halal, aturan penumpang, serta kapal baru atau pensiun secara real-time.
              </div>
            </div>
          )}

          {/* Audit Result Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {filteredResults.map((r) => {
              const hasChanges = r.totalChanges > 0;
              const isCritical = r.status === 'critical_alert';
              const tone = isCritical ? '#ef4444' : hasChanges ? '#f59e0b' : '#10b981';
              const fc = r.fleetChanges || {};

              return (
                <div
                  key={`${r.guideId}-${r.shipName || 'brand'}`}
                  style={{
                    border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)`,
                    borderLeft: `4px solid ${tone}`,
                    borderRadius: 11,
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {isCritical ? (
                      <ShieldAlert size={16} color={tone} />
                    ) : hasChanges ? (
                      <AlertTriangle size={16} color={tone} />
                    ) : (
                      <CheckCircle2 size={16} color={tone} />
                    )}
                    <strong style={{ fontSize: '0.9rem' }}>
                      {r.brandName}{r.shipName ? ` — ${r.shipName}` : ''}
                    </strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.14rem 0.5rem', borderRadius: 999, background: `${tone}20`, color: tone }}>
                      {isCritical ? 'ALERT KRITIS' : hasChanges ? `${r.totalChanges} REKOMENDASI UPDATE` : 'TERVERIFIKASI'}
                    </span>
                    {r.webGrounded && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.14rem 0.5rem', borderRadius: 999, background: 'rgba(124,58,237,0.14)', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Globe size={10} /> Live Web Grounded
                      </span>
                    )}
                    {r.applied && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.14rem 0.5rem', borderRadius: 999, background: 'rgba(16,185,129,0.16)', color: '#10b981' }}>
                        ✓ Sudah Diterapkan ke DB
                      </span>
                    )}

                    {canEdit && !r.applied && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                        {hasChanges ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={applyingId === r.guideId}
                            onClick={() => handleApplyOne(r)}
                            style={{ padding: '0.28rem 0.68rem', fontSize: '0.73rem' }}
                          >
                            {applyingId === r.guideId ? 'Menyimpan…' : 'Terapkan Update ke DB'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={applyingId === r.guideId}
                            onClick={() => handleMarkOneVerified(r)}
                            style={{ padding: '0.28rem 0.65rem', fontSize: '0.73rem' }}
                          >
                            {applyingId === r.guideId ? 'Menyimpan…' : 'Simpan Cap Verifikasi'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>{r.summary}</p>

                  {/* Field Changes Diff */}
                  {(r.fieldChanges || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.55rem 0.7rem', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.71rem', fontWeight: 800, color: 'var(--text-subtle)' }}>PERUBAHAN KEBIJAKAN / TARIF:</div>
                      {r.fieldChanges.map((ch, idx) => (
                        <div key={idx} style={{ fontSize: '0.77rem', lineHeight: 1.45 }}>
                          • <strong>{ch.label}:</strong>{' '}
                          <s style={{ color: 'var(--text-muted)' }}>{formatShortVal(ch.oldValue)}</s> →{' '}
                          <strong style={{ color: '#10b981' }}>{formatShortVal(ch.newValue)}</strong>
                          {ch.reason && <span style={{ color: 'var(--text-subtle)' }}> — {ch.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fleet Changes Diff */}
                  {((fc.newShips || []).length > 0 ||
                    (fc.retiredOrTransferredShips || []).length > 0 ||
                    (fc.updatedShips || []).length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.55rem 0.7rem', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.71rem', fontWeight: 800, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Ship size={12} /> PERUBAHAN ARMADA KAPAL:
                      </div>
                      {(fc.newShips || []).map((ns, idx) => (
                        <div key={`new-${idx}`} style={{ fontSize: '0.77rem', color: '#10b981' }}>
                          <PlusCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          <strong>Kapal Baru: {ns.name}</strong> ({[ns.shipClass, ns.tonnage, ns.yearBuilt].filter(Boolean).join(' · ')}) — {ns.reason || ns.highlight}
                        </div>
                      ))}
                      {(fc.retiredOrTransferredShips || []).map((rs, idx) => (
                        <div key={`ret-${idx}`} style={{ fontSize: '0.77rem', color: '#ef4444' }}>
                          <MinusCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          <strong>Keluar / Pensiun: {rs.name}</strong> — {rs.reason}
                        </div>
                      ))}
                      {(fc.updatedShips || []).map((us, idx) => (
                        <div key={`upd-${idx}`} style={{ fontSize: '0.77rem', color: '#0284c7' }}>
                          <Wrench size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          <strong>Update Kapal: {us.name}</strong> — {us.changesSummary}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live Web Citations */}
                  {(r.sources || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', fontSize: '0.71rem' }}>
                      <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Sumber Web:</span>
                      {r.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.12rem 0.45rem',
                            borderRadius: 6,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--primary)',
                            textDecoration: 'none'
                          }}
                        >
                          {src.title} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap'
          }}
        >
          <button type="button" className="btn btn-secondary" disabled={isScanning} onClick={onClose}>
            Tutup
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isScanning || applyingAll || actionableCount === 0}
              onClick={handleApplyAll}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.81rem' }}
            >
              <CheckCheck size={15} />
              {applyingAll ? 'Menerapkan Semua…' : `Terapkan Semua Update (${actionableCount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CruiseAiFreshnessModal;
