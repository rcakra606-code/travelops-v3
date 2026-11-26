import { useState, useMemo } from 'react';
import {
  Ship, Search, Copy, Check, FileDown, Eye, PlusCircle, RotateCcw, Anchor, Layers, Users, Calendar,
  Bot, RefreshCw, CheckCircle2, AlertTriangle, Globe
} from 'lucide-react';
import Pagination from '../Pagination';
import {
  SHIP_SIZE_LABELS,
  buildIndividualShipWhatsAppBriefing,
  filterFleetShips,
  flattenAllShips,
  formatGratuityBadge
} from '../../utils/cruiseSalesGuideHelpers';
import { generateIndividualShipPdf } from '../../utils/cruiseSalesGuidePdf';

const PAGE_SIZE = 24;

const halalBadgeTone = (status) => {
  if (status === 'Certified Halal Kitchen') return { bg: 'rgba(16,185,129,0.14)', color: '#10b981' };
  if (status === 'Pre-Order Halal') return { bg: 'rgba(14,165,233,0.14)', color: '#0284c7' };
  return { bg: 'rgba(245,158,11,0.14)', color: '#d97706' };
};

const FleetExplorerTab = ({
  guides,
  initialBrandId = 'all',
  canEdit = false,
  onOpenBrandDossier,
  onCreateBooking,
  onAuditShip,
  auditingShipKey = null,
  shipAuditMap = {},
  onApplyAudit,
  consultantName = '',
  toast
}) => {
  const [brandId, setBrandId] = useState(initialBrandId);
  const [sizeCategory, setSizeCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('brand');
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState(null);
  const [exportingKey, setExportingKey] = useState(null);

  const allShips = useMemo(() => flattenAllShips(guides), [guides]);

  const filtered = useMemo(
    () => filterFleetShips(allShips, { brandId, sizeCategory, query, sortBy }),
    [allShips, brandId, sizeCategory, query, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = brandId !== 'all' || sizeCategory !== 'all' || Boolean(query.trim()) || sortBy !== 'brand';

  const reset = () => {
    setBrandId('all');
    setSizeCategory('all');
    setQuery('');
    setSortBy('brand');
    setPage(1);
  };

  const handleCopyShip = async (entry) => {
    try {
      await navigator.clipboard.writeText(buildIndividualShipWhatsAppBriefing(entry.guide, entry.ship));
      setCopiedKey(entry.key);
      toast?.success(`Spesifikasi WA ${entry.ship.name} disalin!`);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      toast?.error('Gagal menyalin ke clipboard.');
    }
  };

  const handleDownloadPdf = async (entry) => {
    try {
      setExportingKey(entry.key);
      await generateIndividualShipPdf(entry.guide, entry.ship, consultantName);
      toast?.success(`PDF Spesifikasi ${entry.ship.name} berhasil diunduh!`);
    } catch (err) {
      toast?.error(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingKey(null);
    }
  };

  const selectStyle = {
    padding: '0.45rem 0.65rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.8rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Ship size={17} color="var(--primary)" /> Direktori Lengkap Armada Kapal Beroperasi ({allShips.length} Kapal)
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Cari spesifikasi setiap kapal per brand (class, tonase, kapasitas, deck, wilayah operasi & fasilitas ikonik) untuk dikirim langsung ke klien.
            </p>
          </div>
          {hasFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={reset}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>

        {/* Brand Quick Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => { setBrandId('all'); setPage(1); }}
            style={{
              padding: '0.25rem 0.62rem',
              borderRadius: 999,
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: `1px solid ${brandId === 'all' ? 'var(--primary)' : 'var(--border)'}`,
              background: brandId === 'all' ? 'var(--primary)' : 'var(--bg-surface)',
              color: brandId === 'all' ? '#fff' : 'var(--text-main)'
            }}
          >
            Semua Brand ({allShips.length})
          </button>
          {guides.map((g) => {
            const active = brandId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => { setBrandId(g.id); setPage(1); }}
                style={{
                  padding: '0.25rem 0.62rem',
                  borderRadius: 999,
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: `1px solid ${active ? g.accentColor || 'var(--primary)' : 'var(--border)'}`,
                  background: active ? g.accentColor || 'var(--primary)' : 'var(--bg-surface)',
                  color: active ? '#fff' : 'var(--text-main)'
                }}
              >
                {g.brandName.replace(' International', '').replace(' (NCL)', '')} ({(g.featuredShips || []).length})
              </button>
            );
          })}
        </div>

        {/* Search + Size + Sort */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Cari nama kapal, class, wilayah (Singapura, Jepang, Alaska, Galapagos), fasilitas..."
              style={{
                width: '100%',
                padding: '0.45rem 0.7rem 0.45rem 2rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            />
          </div>

          <select
            value={sizeCategory}
            onChange={(e) => { setSizeCategory(e.target.value); setPage(1); }}
            style={selectStyle}
          >
            <option value="all">Semua Ukuran Kapal</option>
            <option value="mega">{SHIP_SIZE_LABELS.mega}</option>
            <option value="large">{SHIP_SIZE_LABELS.large}</option>
            <option value="midsize">{SHIP_SIZE_LABELS.midsize}</option>
            <option value="boutique">{SHIP_SIZE_LABELS.boutique}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={selectStyle}
          >
            <option value="brand">Urut: Sesuai Brand & Class</option>
            <option value="newest">Urut: Tahun Terbaru</option>
            <option value="largest">Urut: Ukuran Terbesar (GT)</option>
            <option value="alpha">Urut: Nama Kapal A–Z</option>
          </select>

          <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 700, marginLeft: 'auto' }}>
            Menampilkan {filtered.length} dari {allShips.length} kapal
          </span>
        </div>
      </div>

      {/* Ship Cards Grid */}
      {pageItems.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <Ship size={28} style={{ marginBottom: '0.4rem' }} />
          <div>Tidak ditemukan kapal yang cocok dengan pencarian Anda.</div>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={reset}>
            Reset Filter Armada
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.05rem' }}>
          {pageItems.map((entry) => {
            const { ship, guide } = entry;
            const hTone = halalBadgeTone(guide.halalStatus);
            const isNew = entry.launchYear >= 2024;
            return (
              <div
                key={entry.key}
                className="card"
                style={{
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${guide.accentColor || 'var(--primary)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.62rem'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: guide.accentColor || 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {guide.brandName}
                      </span>
                      {isNew && (
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '0.06rem 0.4rem', borderRadius: 999, background: 'rgba(16,185,129,0.16)', color: '#10b981' }}>
                          NEW {entry.launchYear}
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0.18rem 0 0', fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ⚓ {ship.name}
                    </h4>
                  </div>
                  {ship.shipClass && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.16rem 0.48rem',
                        borderRadius: 6,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-subtle)',
                        flexShrink: 0
                      }}
                    >
                      {ship.shipClass}
                    </span>
                  )}
                </div>

                {/* Specs 4-pill strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem', fontSize: '0.73rem' }}>
                  <div style={{ padding: '0.32rem 0.5rem', borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Anchor size={11} color="var(--primary)" />
                    <span><strong>{ship.tonnage || '—'}</strong></span>
                  </div>
                  <div style={{ padding: '0.32rem 0.5rem', borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={11} color="var(--primary)" />
                    <span>{ship.capacity || '—'}</span>
                  </div>
                  <div style={{ padding: '0.32rem 0.5rem', borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Layers size={11} color="var(--primary)" />
                    <span>{ship.decks ? `${ship.decks} deck` : '—'}</span>
                  </div>
                  <div style={{ padding: '0.32rem 0.5rem', borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={11} color="var(--primary)" />
                    <span>{ship.yearBuilt || '—'}</span>
                  </div>
                </div>

                {/* Deployment & Best For */}
                <div style={{ fontSize: '0.77rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {ship.deployment && (
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>🌍 Wilayah:</strong>{' '}
                      <span style={{ color: 'var(--text-subtle)' }}>{ship.deployment}</span>
                    </div>
                  )}
                  {ship.bestFor && (
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>🎯 Cocok untuk:</strong>{' '}
                      <span style={{ color: 'var(--text-subtle)' }}>{ship.bestFor}</span>
                    </div>
                  )}
                </div>

                {/* Highlight */}
                {ship.highlight && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.48 }}>
                    {ship.highlight}
                  </p>
                )}

                {/* Inherited Brand Policies */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.1rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 999, background: hTone.bg, color: hTone.color }}>
                    🌙 {guide.halalStatus}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 999, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
                    💵 {formatGratuityBadge(guide)}
                  </span>
                </div>

                {/* Inline Single-Ship AI Audit Result */}
                {shipAuditMap[entry.key] && (() => {
                  const sa = shipAuditMap[entry.key];
                  const hasUpd = sa.totalChanges > 0;
                  return (
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: 8,
                        border: `1px solid ${hasUpd ? 'rgba(245,158,11,0.45)' : 'rgba(16,185,129,0.4)'}`,
                        background: hasUpd ? 'rgba(245,158,11,0.09)' : 'rgba(16,185,129,0.09)',
                        fontSize: '0.73rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.28rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, color: hasUpd ? '#d97706' : '#10b981' }}>
                        {hasUpd ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        <span>{hasUpd ? `${sa.totalChanges} Update Kapal` : 'Kapal Terverifikasi'}</span>
                        {sa.webGrounded && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.66rem', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <Globe size={10} /> Web
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{sa.summary}</div>
                      {canEdit && hasUpd && !sa.applied && onApplyAudit && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onApplyAudit(sa)}
                          style={{ alignSelf: 'flex-start', padding: '0.2rem 0.5rem', fontSize: '0.69rem', marginTop: '0.15rem' }}
                        >
                          Terapkan Update ke DB
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Actions */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.55rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '0.32rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCopyShip(entry)}
                    style={{ padding: '0.28rem 0.56rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {copiedKey === entry.key ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === entry.key ? 'Disalin' : 'Copy WA'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDownloadPdf(entry)}
                    disabled={exportingKey === entry.key}
                    style={{ padding: '0.28rem 0.56rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <FileDown size={12} /> PDF
                  </button>
                  {onAuditShip && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={auditingShipKey === entry.key}
                      onClick={() => onAuditShip(entry)}
                      title="Verifikasi data terbaru kapal ini via AI + Google Search"
                      style={{ padding: '0.28rem 0.52rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.24rem', color: '#7c3aed' }}
                    >
                      {auditingShipKey === entry.key ? <RefreshCw size={12} className="spin" /> : <Bot size={12} />}
                      {auditingShipKey === entry.key ? 'Cek…' : 'Cek AI'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onCreateBooking?.(guide, ship)}
                    style={{ padding: '0.28rem 0.56rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <PlusCircle size={12} /> Booking
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onOpenBrandDossier?.(guide.id)}
                    title="Lihat info lengkap brand"
                    style={{ marginLeft: 'auto', padding: '0.28rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.22rem' }}
                  >
                    <Eye size={12} /> Brand
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={(nextPage) => setPage(nextPage)}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
        />
      )}
    </div>
  );
};

export default FleetExplorerTab;
