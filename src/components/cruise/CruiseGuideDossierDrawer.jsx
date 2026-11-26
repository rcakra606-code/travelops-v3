import { useState, useMemo } from 'react';
import {
  Ship, Anchor, CheckCircle2, Sparkles, ShieldAlert, Copy, Check, FileDown,
  Edit3, Trash2, ExternalLink, Lightbulb, Utensils, DollarSign, Shirt, Users, PlusCircle, Search,
  Bot, RefreshCw, Globe, AlertTriangle
} from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';
import { getCruiseFreshnessStatus } from '../../utils/cruiseAiFreshnessAgent';
import {
  buildIndividualShipWhatsAppBriefing,
  buildShipWhatsAppBriefing,
  formatBudgetTier,
  formatGratuityBadge,
  getProfileLabel,
  getRegionLabel
} from '../../utils/cruiseSalesGuideHelpers';
import {
  generateIndividualShipPdf,
  generateShipInfoPdf
} from '../../utils/cruiseSalesGuidePdf';

const halalTone = (status) => {
  if (status === 'Certified Halal Kitchen') return { bg: 'rgba(16,185,129,0.14)', color: '#10b981', border: 'rgba(16,185,129,0.35)' };
  if (status === 'Pre-Order Halal') return { bg: 'rgba(14,165,233,0.14)', color: '#0284c7', border: 'rgba(14,165,233,0.35)' };
  return { bg: 'rgba(245,158,11,0.14)', color: '#d97706', border: 'rgba(245,158,11,0.35)' };
};

const SectionBox = ({ icon, title, accent = 'var(--primary)', children }) => (
  <div
    style={{
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      marginBottom: '0.85rem',
      background: 'var(--bg-surface)'
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.78rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: accent,
        marginBottom: '0.55rem'
      }}
    >
      {icon}
      <span>{title}</span>
    </div>
    <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{children}</div>
  </div>
);

const CruiseGuideDossierDrawer = ({
  guide,
  onClose,
  canEdit,
  onEdit,
  onDelete,
  onCreateBooking,
  onAuditBrand,
  auditingBrandId = null,
  singleAuditResult = null,
  onApplyAudit,
  onMarkVerified,
  bookingCount = 0,
  consultantName = '',
  toast
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedShipName, setCopiedShipName] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingShip, setExportingShip] = useState(null);
  const [applyingAudit, setApplyingAudit] = useState(false);
  const [shipSearch, setShipSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  const ships = useMemo(() => guide?.featuredShips || [], [guide]);

  const shipClasses = useMemo(
    () => ['All', ...new Set(ships.map((s) => s.shipClass).filter(Boolean))],
    [ships]
  );

  const filteredShips = useMemo(() => {
    const q = shipSearch.trim().toLowerCase();
    return ships.filter((s) => {
      if (selectedClass !== 'All' && s.shipClass !== selectedClass) return false;
      if (!q) return true;
      return `${s.name} ${s.shipClass || ''} ${s.deployment || ''} ${s.bestFor || ''} ${s.highlight || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [ships, shipSearch, selectedClass]);

  if (!guide) return <SlideOverDrawer isOpen={false} onClose={onClose} title="" />;

  const hStyle = halalTone(guide.halalStatus);
  const fresh = getCruiseFreshnessStatus(guide.lastVerifiedAt, guide.auditStatus);
  const isAuditingThis = auditingBrandId === guide.id;
  const activeAudit =
    singleAuditResult && singleAuditResult.guideId === guide.id && !singleAuditResult.shipName
      ? singleAuditResult
      : null;

  const handleApplyInline = async () => {
    if (!activeAudit || !onApplyAudit) return;
    try {
      setApplyingAudit(true);
      await onApplyAudit(activeAudit);
    } finally {
      setApplyingAudit(false);
    }
  };

  const handleMarkInlineVerified = async () => {
    if (!activeAudit || !onMarkVerified) return;
    try {
      setApplyingAudit(true);
      await onMarkVerified(activeAudit);
    } finally {
      setApplyingAudit(false);
    }
  };

  const handleCopyWa = async () => {
    try {
      await navigator.clipboard.writeText(buildShipWhatsAppBriefing(guide));
      setCopied(true);
      toast?.success(`Ringkasan WhatsApp ${guide.brandName} disalin!`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const handleCopySingleShipWa = async (ship) => {
    try {
      await navigator.clipboard.writeText(buildIndividualShipWhatsAppBriefing(guide, ship));
      setCopiedShipName(ship.name);
      toast?.success(`Spesifikasi WA ${ship.name} disalin!`);
      setTimeout(() => setCopiedShipName(null), 1600);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExportingPdf(true);
      await generateShipInfoPdf(guide, consultantName);
      toast?.success(`PDF Info ${guide.brandName} berhasil diunduh!`);
    } catch (err) {
      toast?.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadSingleShipPdf = async (ship) => {
    try {
      setExportingShip(ship.name);
      await generateIndividualShipPdf(guide, ship, consultantName);
      toast?.success(`PDF Spesifikasi ${ship.name} diunduh!`);
    } catch (err) {
      toast?.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingShip(null);
    }
  };

  const footer = (
    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', width: '100%' }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleCopyWa}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Disalin!' : 'Copy WA Brand'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleDownloadPdf}
        disabled={exportingPdf}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
      >
        <FileDown size={14} />
        {exportingPdf ? 'Membuat PDF…' : 'PDF Brand & Armada'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onCreateBooking?.(guide, ships[0])}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
      >
        <PlusCircle size={14} /> Buat Booking
      </button>
      {canEdit && (
        <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEdit?.(guide)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onDelete?.(guide)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#ef4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <SlideOverDrawer
      isOpen
      onClose={onClose}
      width="680px"
      title={guide.brandName}
      subtitle={`${guide.segment} · ${ships.length} Kapal Beroperasi · Kelas Budget ${formatBudgetTier(guide.budgetTier)}${guide.vipClubName ? ` · VIP: ${guide.vipClubName}` : ''}`}
      footer={footer}
    >
      {/* AI Freshness & Live Audit Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.65rem 0.85rem',
          borderRadius: 10,
          border: `1px solid color-mix(in srgb, ${fresh.tone} 40%, transparent)`,
          background: `color-mix(in srgb, ${fresh.tone} 10%, transparent)`,
          marginBottom: '0.85rem'
        }}
      >
        <span style={{ fontSize: '0.71rem', fontWeight: 800, padding: '0.14rem 0.5rem', borderRadius: 999, background: `${fresh.tone}22`, color: fresh.tone }}>
          {fresh.label}
        </span>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-subtle)' }}>
          {guide.lastVerifiedAt
            ? `Dicek: ${new Date(guide.lastVerifiedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`
            : 'Belum pernah diaudit AI'}
        </span>
        {onAuditBrand && (
          <button
            type="button"
            disabled={isAuditingThis}
            onClick={() => onAuditBrand(guide)}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.32rem',
              padding: '0.28rem 0.65rem',
              borderRadius: 8,
              border: '1px solid var(--primary)',
              background: 'var(--bg-card)',
              color: 'var(--primary)',
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: isAuditingThis ? 'wait' : 'pointer'
            }}
          >
            {isAuditingThis ? <RefreshCw size={12} className="spin" /> : <Bot size={13} />}
            {isAuditingThis ? 'Memeriksa di Web…' : 'Cek Update AI'}
          </button>
        )}
        {guide.verificationNotes && (
          <div style={{ flexBasis: '100%', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            {guide.verificationNotes}
          </div>
        )}
      </div>

      {/* Inline AI Audit Result Panel */}
      {activeAudit && (
        <div
          style={{
            border: `1px solid ${activeAudit.totalChanges > 0 ? 'rgba(245,158,11,0.45)' : 'rgba(16,185,129,0.45)'}`,
            borderRadius: 11,
            padding: '0.8rem 0.95rem',
            marginBottom: '0.9rem',
            background: activeAudit.totalChanges > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {activeAudit.totalChanges > 0 ? (
              <AlertTriangle size={15} color="#f59e0b" />
            ) : (
              <CheckCircle2 size={15} color="#10b981" />
            )}
            <strong style={{ fontSize: '0.82rem' }}>
              Hasil Cruise AI Agent: {activeAudit.totalChanges > 0 ? `${activeAudit.totalChanges} Update Terdeteksi` : 'Data Terverifikasi Akurat'}
            </strong>
            {activeAudit.webGrounded && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Globe size={10} /> Live Web
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{activeAudit.summary}</div>
          {(activeAudit.fieldChanges || []).map((ch, idx) => (
            <div key={idx} style={{ fontSize: '0.75rem' }}>
              • <strong>{ch.label}:</strong> <s style={{ color: 'var(--text-muted)' }}>{String(ch.oldValue ?? '—')}</s> → <strong style={{ color: '#10b981' }}>{Array.isArray(ch.newValue) ? ch.newValue.join(', ') : String(ch.newValue)}</strong>
            </div>
          ))}
          {(activeAudit.fleetChanges?.newShips || []).map((ns, idx) => (
            <div key={`ns-${idx}`} style={{ fontSize: '0.75rem', color: '#10b981' }}>
              + <strong>Kapal Baru:</strong> {ns.name} ({ns.yearBuilt || ns.shipClass})
            </div>
          ))}
          {(activeAudit.fleetChanges?.retiredOrTransferredShips || []).map((rs, idx) => (
            <div key={`rs-${idx}`} style={{ fontSize: '0.75rem', color: '#ef4444' }}>
              - <strong>Keluar / Pensiun:</strong> {rs.name} — {rs.reason}
            </div>
          ))}
          {(activeAudit.fleetChanges?.updatedShips || []).map((us, idx) => (
            <div key={`us-${idx}`} style={{ fontSize: '0.75rem', color: '#0284c7' }}>
              ↻ <strong>Update Kapal {us.name}:</strong> {us.changesSummary}
            </div>
          ))}
          {(activeAudit.sources || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.7rem' }}>
              {activeAudit.sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  🔗 {src.title}
                </a>
              ))}
            </div>
          )}
          {canEdit && !activeAudit.applied && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
              {activeAudit.totalChanges > 0 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={applyingAudit}
                  onClick={handleApplyInline}
                  style={{ fontSize: '0.74rem', padding: '0.3rem 0.7rem' }}
                >
                  {applyingAudit ? 'Menyimpan…' : 'Terapkan Update ke Database'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={applyingAudit}
                  onClick={handleMarkInlineVerified}
                  style={{ fontSize: '0.74rem', padding: '0.3rem 0.7rem' }}
                >
                  {applyingAudit ? 'Menyimpan…' : 'Simpan Cap Terverifikasi'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tagline & Quick Badges */}
      {guide.tagline && (
        <p
          style={{
            margin: '0 0 0.85rem',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'var(--text-main)',
            borderLeft: `3px solid ${guide.accentColor || 'var(--primary)'}`,
            paddingLeft: '0.75rem'
          }}
        >
          {guide.tagline}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.95rem' }}>
        <span
          style={{
            padding: '0.24rem 0.6rem',
            borderRadius: 999,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: hStyle.bg,
            color: hStyle.color,
            border: `1px solid ${hStyle.border}`
          }}
        >
          🌙 {guide.halalStatus}
        </span>
        <span
          style={{
            padding: '0.24rem 0.6rem',
            borderRadius: 999,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: 'rgba(14,165,233,0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(14,165,233,0.3)'
          }}
        >
          💵 {formatGratuityBadge(guide)}
        </span>
        <span
          style={{
            padding: '0.24rem 0.6rem',
            borderRadius: 999,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)'
          }}
        >
          🚢 {ships.length} Kapal Aktif
        </span>
        {bookingCount > 0 && (
          <span
            style={{
              padding: '0.24rem 0.6rem',
              borderRadius: 999,
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(16,185,129,0.14)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.35)'
            }}
          >
            📈 {bookingCount} booking di TravelOps
          </span>
        )}
        {guide.websiteUrl && (
          <a
            href={guide.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--primary)',
              textDecoration: 'none'
            }}
          >
            Website Resmi <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Complete Operating Fleet Explorer inside Drawer */}
      {ships.length > 0 && (
        <SectionBox icon={<Ship size={14} />} title={`Semua Kapal Beroperasi (${filteredShips.length}/${ships.length} Kapal)`} accent={guide.accentColor}>
          {/* Search + Class Filter */}
          {ships.length > 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.65rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  value={shipSearch}
                  onChange={(e) => setShipSearch(e.target.value)}
                  placeholder="Cari nama kapal, wilayah (Singapura, Jepang, Alaska...), atau fasilitas..."
                  style={{
                    width: '100%',
                    padding: '0.38rem 0.6rem 0.38rem 1.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>
              {shipClasses.length > 2 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {shipClasses.map((cls) => {
                    const active = selectedClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setSelectedClass(cls)}
                        style={{
                          padding: '0.18rem 0.52rem',
                          borderRadius: 999,
                          fontSize: '0.69rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1px solid ${active ? guide.accentColor || 'var(--primary)' : 'var(--border)'}`,
                          background: active ? guide.accentColor || 'var(--primary)' : 'var(--bg-card)',
                          color: active ? '#fff' : 'var(--text-subtle)'
                        }}
                      >
                        {cls === 'All' ? `Semua Class (${ships.length})` : cls}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.2rem' }}>
            {filteredShips.map((ship, idx) => (
              <div
                key={`${ship.name}-${idx}`}
                style={{
                  padding: '0.68rem 0.78rem',
                  borderRadius: '9px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.32rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>⚓ {ship.name}</strong>
                    {ship.shipClass && (
                      <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '0.1rem 0.42rem', borderRadius: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
                        {ship.shipClass}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {[ship.tonnage, ship.capacity, ship.decks ? `${ship.decks} deck` : '', ship.yearBuilt].filter(Boolean).join(' · ')}
                  </span>
                </div>

                {(ship.deployment || ship.bestFor) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                    {ship.deployment && <span><strong>🌍 Wilayah:</strong> {ship.deployment}</span>}
                    {ship.bestFor && <span><strong>🎯 Cocok:</strong> {ship.bestFor}</span>}
                  </div>
                )}

                {ship.highlight && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.48 }}>{ship.highlight}</p>
                )}

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleCopySingleShipWa(ship)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {copiedShipName === ship.name ? <Check size={11} /> : <Copy size={11} />}
                    {copiedShipName === ship.name ? 'Disalin' : 'Copy WA Kapal'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDownloadSingleShipPdf(ship)}
                    disabled={exportingShip === ship.name}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <FileDown size={11} /> {exportingShip === ship.name ? 'PDF…' : 'PDF Kapal'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onCreateBooking?.(guide, ship)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
                  >
                    <PlusCircle size={11} /> Booking Kapal Ini
                  </button>
                </div>
              </div>
            ))}
            {filteredShips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                Tidak ada kapal yang cocok dengan pencarian &quot;{shipSearch}&quot;.
              </div>
            )}
          </div>
        </SectionBox>
      )}

      {/* Homeports, Regions & Target Profiles */}
      <SectionBox icon={<Anchor size={14} />} title="Homeport, Wilayah & Profil Klien Ideal" accent="#0284c7">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: '0.2rem' }}>Homeport Utama</div>
            <div>{(guide.homeports || []).join(' · ') || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: '0.2rem' }}>Durasi Populer</div>
            <div>{(guide.typicalDurations || []).join(' / ') || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
          {(guide.regions || []).map((r) => (
            <span key={r} style={{ fontSize: '0.71rem', padding: '0.16rem 0.5rem', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              🌍 {getRegionLabel(r)}
            </span>
          ))}
          {(guide.targetProfiles || []).map((p) => (
            <span key={p} style={{ fontSize: '0.71rem', padding: '0.16rem 0.5rem', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 600 }}>
              <Users size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {getProfileLabel(p)}
            </span>
          ))}
        </div>
      </SectionBox>

      {/* Halal & Dietary */}
      <SectionBox icon={<Utensils size={14} />} title={`Status Halal & Dietary — ${guide.halalStatus}`} accent={hStyle.color}>
        <p style={{ margin: 0 }}>{guide.halalNotes || 'Hubungi kapal untuk konfirmasi kebutuhan diet khusus.'}</p>
      </SectionBox>

      {/* Gratuity & Policy */}
      <SectionBox icon={<DollarSign size={14} />} title="Gratuity / Tipping & Ketentuan Penumpang" accent="#d97706">
        <p style={{ margin: '0 0 0.55rem' }}>{guide.gratuityNotes || formatGratuityBadge(guide)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Min. Usia Bayi</div>
            <strong style={{ fontSize: '0.84rem' }}>{guide.minInfantMonths} bulan</strong>
          </div>
          <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Maks. Ibu Hamil</div>
            <strong style={{ fontSize: '0.84rem' }}>{guide.pregnancyMaxWeeks} minggu</strong>
          </div>
          <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Min. Pemesan Utama</div>
            <strong style={{ fontSize: '0.84rem' }}>{guide.minBookingAge} tahun</strong>
          </div>
        </div>
        {guide.dressCode && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            <Shirt size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><strong>Dress Code:</strong> {guide.dressCode}</span>
          </div>
        )}
      </SectionBox>

      {/* Highlights & Inclusions */}
      <SectionBox icon={<Sparkles size={14} />} title="Keunggulan Utama (Selling Points)" accent="#10b981">
        <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {(guide.highlights || []).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </SectionBox>

      <SectionBox icon={<CheckCircle2 size={14} />} title="Umumnya Sudah Termasuk di Harga Dasar" accent="#0d9488">
        <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {(guide.inclusions || []).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </SectionBox>

      {/* Internal Sales Tips */}
      {(guide.salesTips || []).length > 0 && (
        <div
          style={{
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            background: 'rgba(245, 158, 11, 0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#d97706',
              marginBottom: '0.5rem'
            }}
          >
            <Lightbulb size={14} />
            <span>Catatan Internal Tim Sales (Tidak Tercetak di PDF Klien)</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
            {guide.salesTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
          <div style={{ marginTop: '0.55rem', fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={12} /> Terakhir diperbarui oleh: {guide.updatedBy || 'System Seed'}
          </div>
        </div>
      )}
    </SlideOverDrawer>
  );
};

export default CruiseGuideDossierDrawer;
