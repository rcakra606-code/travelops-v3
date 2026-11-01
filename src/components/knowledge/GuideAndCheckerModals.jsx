import { useMemo, useState } from 'react';
import { FileText, Copy, Check, Printer, Zap, RefreshCw, CheckCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ModalShell, Field, SelectInput, Badge } from './KnowledgeUI';
import { buildRouteBriefing, buildCountryGuide, printText, formatDate } from './knowledgeHelpers';

// ---------------------------------------------------------------------------
// Tour Leader Pocket Guide Builder (Route OR Country mode)
// ---------------------------------------------------------------------------
export const PocketGuideModal = ({ onClose, countries, cities, tourObjects, tourRoutes, initialMode = 'route', initialId = '', toast, neonBlue }) => {
  const [mode, setMode] = useState(initialMode);
  const [targetId, setTargetId] = useState(initialId);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    if (!targetId) return '';
    if (mode === 'route') {
      const r = tourRoutes.find((x) => x.id === targetId);
      return buildRouteBriefing(r, { countries, cities, tourObjects });
    }
    const c = countries.find((x) => x.id === targetId);
    return buildCountryGuide(c, { cities, tourObjects, tourRoutes });
  }, [mode, targetId, countries, cities, tourObjects, tourRoutes]);

  const options =
    mode === 'route'
      ? tourRoutes.map((r) => ({ value: r.id, label: `${r.title} (${r.duration_days}D${r.duration_nights}N)` }))
      : countries.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` }));

  const title =
    mode === 'route'
      ? tourRoutes.find((x) => x.id === targetId)?.title
      : countries.find((x) => x.id === targetId)?.name;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Formatted WhatsApp briefing copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Clipboard unavailable in this browser');
    }
  };

  const print = () => {
    if (!printText(`Field Packet — ${title || ''}`, text)) toast.warning('Allow pop-ups to print the field packet');
  };

  return (
    <ModalShell
      title="Tour Leader Pocket Guide Builder"
      subtitle="Compiles country logistics, city hospitals & apps, day-by-day timeline and attraction briefing points"
      icon={<FileText size={18} />}
      accent="#10b981"
      onClose={onClose}
      maxWidth="820px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-secondary" disabled={!text} onClick={print} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print Field Packet
          </button>
          <button type="button" className="btn btn-primary" disabled={!text} onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} Copy WhatsApp Briefing
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem' }}>
        {[['route', '🛣️ Master Tour Route'], ['country', '🌍 Destination Country']].map(([m, lbl]) => (
          <button key={m} type="button" className={`tab-btn ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setTargetId(''); }}>
            {lbl}
          </button>
        ))}
      </div>
      <Field label={mode === 'route' ? 'Select Route' : 'Select Country'}>
        <SelectInput value={targetId} onChange={setTargetId} options={options} placeholder="Choose…" />
      </Field>
      <pre
        style={{
          marginTop: '1rem',
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          color: 'var(--text-main)',
          background: 'var(--bg-surface)',
          border: `1px solid ${text ? neonBlue : 'var(--border)'}`,
          borderRadius: 10,
          padding: '1rem',
          minHeight: 220,
          maxHeight: '48vh',
          overflowY: 'auto'
        }}
      >
        {text || 'Select a route or country to compile the field briefing sheet.'}
      </pre>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Live Freshness Checker (scope selector, filters, per-item apply)
// ---------------------------------------------------------------------------
const SCOPES = [
  ['all', 'All'],
  ['route', 'Routes'],
  ['object', 'POIs'],
  ['city', 'Cities'],
  ['country', 'Countries']
];

const hasUpdate = (r) => r.status !== 'verified' || (r.changes && r.changes.length > 0);

export const FreshnessCheckerModal = ({
  onClose, isAuditing, auditProgress, auditResults, lastAuditDate, counts,
  onRunScan, onApplyOne, onApplyAll, isApplyingAll, neonBlue
}) => {
  const [scope, setScope] = useState('all');
  const [checkerFilter, setCheckerFilter] = useState('all');
  const [checkerTypeFilter, setCheckerTypeFilter] = useState('all');
  const [applyingId, setApplyingId] = useState(null);

  const metrics = useMemo(() => {
    const total = auditResults.length;
    const critical = auditResults.filter((r) => r.status === 'critical_alert').length;
    const updates = auditResults.filter((r) => hasUpdate(r) && r.status !== 'critical_alert').length;
    return { total, critical, updates, verified: total - critical - updates };
  }, [auditResults]);

  const filtered = auditResults.filter((r) => {
    const matchType = checkerTypeFilter === 'all' || r.type === checkerTypeFilter;
    const matchStatus = checkerFilter === 'all' ? true : checkerFilter === 'updates_only' ? hasUpdate(r) : !hasUpdate(r);
    return matchType && matchStatus;
  });

  const scopeCount = scope === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[scope] || 0;
  const pct = auditProgress.total ? Math.round((auditProgress.current / auditProgress.total) * 100) : 0;

  const applyOne = async (r) => {
    setApplyingId(`${r.type}-${r.id}`);
    try {
      await onApplyOne(r);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <ModalShell
      title="Live Data Freshness Checker"
      subtitle={`AI audit of visa rules, opening hours, ticketing & emergency data · Last scan: ${lastAuditDate ? formatDate(lastAuditDate) : 'never'}`}
      icon={<Zap size={18} />}
      accent="#eab308"
      onClose={onClose}
      maxWidth="900px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isApplyingAll || isAuditing || metrics.updates + metrics.critical === 0}
            onClick={onApplyAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCheck size={14} /> {isApplyingAll ? 'Applying…' : `Auto-Update All (${metrics.updates + metrics.critical})`}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>SCAN SCOPE:</span>
        {SCOPES.map(([s, lbl]) => (
          <button key={s} type="button" disabled={isAuditing} className={`tab-btn ${scope === s ? 'active' : ''}`} onClick={() => setScope(s)} style={{ fontSize: '0.78rem' }}>
            {lbl} ({s === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[s] || 0})
          </button>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          disabled={isAuditing || scopeCount === 0}
          onClick={() => onRunScan(scope)}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={isAuditing ? 'spin' : ''} /> {isAuditing ? 'Scanning…' : `Run Scan (${scopeCount})`}
        </button>
      </div>

      {isAuditing && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 4 }}>
            <span>Auditing {auditProgress.type ? `${auditProgress.type}: ` : ''}{auditProgress.currentItem}</span>
            <span>{auditProgress.current}/{auditProgress.total} · {pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: neonBlue, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {auditResults.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '0.9rem' }}>
            {[['Scanned', metrics.total, neonBlue], ['Verified', metrics.verified, '#10b981'], ['Updates', metrics.updates, '#f59e0b'], ['Critical', metrics.critical, '#ef4444']].map(([l, v, c]) => (
              <div key={l} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {[['all', 'All'], ['updates_only', 'Updates Only'], ['verified_only', 'Verified']].map(([f, l]) => (
              <button key={f} type="button" className={`tab-btn ${checkerFilter === f ? 'active' : ''}`} onClick={() => setCheckerFilter(f)} style={{ fontSize: '0.75rem' }}>{l}</button>
            ))}
            <span style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />
            {SCOPES.map(([t, l]) => (
              <button key={t} type="button" className={`tab-btn ${checkerTypeFilter === t ? 'active' : ''}`} onClick={() => setCheckerTypeFilter(t)} style={{ fontSize: '0.75rem' }}>{l}</button>
            ))}
          </div>
        </>
      )}

      {auditResults.length === 0 && !isAuditing && (
        <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem', padding: '2rem 0' }}>
          Choose a scope and run a scan to audit stored destination data against current travel rules.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {filtered.map((r) => {
          const upd = hasUpdate(r);
          const color = r.status === 'critical_alert' ? '#ef4444' : upd ? '#f59e0b' : '#10b981';
          const key = `${r.type}-${r.id}`;
          return (
            <div key={key} style={{ border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`, borderRadius: 10, padding: '0.7rem 0.85rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {upd ? <AlertTriangle size={15} color={color} /> : <CheckCircle2 size={15} color={color} />}
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.name}</strong>
                <Badge color="#6366f1">{r.type}</Badge>
                <Badge color={color}>{String(r.status).replace('_', ' ')}</Badge>
                {upd && r.changes?.length > 0 && (
                  <button type="button" className="btn btn-primary" disabled={applyingId === key} onClick={() => applyOne(r)} style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.3rem 0.7rem' }}>
                    {applyingId === key ? 'Applying…' : 'Apply Update'}
                  </button>
                )}
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{r.summary}</p>
              {(r.changes || []).map((ch, i) => (
                <div key={i} style={{ fontSize: '0.74rem', marginTop: '0.3rem', color: 'var(--text-main)' }}>
                  • <strong>{ch.label || ch.field}:</strong> <s style={{ color: 'var(--text-muted)' }}>{String(ch.oldValue ?? '—')}</s> → <span style={{ color: '#10b981' }}>{String(ch.newValue ?? '')}</span>
                  {ch.reason && <span style={{ color: 'var(--text-subtle)' }}> — {ch.reason}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
};

