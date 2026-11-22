import { Copy, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';
import { formatIdr, formatCompactIdr, formatPercent } from '../../utils/formatters';

const ProductivityInspectorDrawer = ({
  drawerState,
  onCloseDrawer,
  activePeriodLabel,
  inspectedRecord,
  inspectedCategoryStats,
  canAdd,
  canDelete,
  canEditRecord,
  onDuplicateRecord,
  onRequestSingleDelete,
  onEditRecord,
  onOpenRecordDrawer,
  confirmState,
  onCloseConfirm,
  onConfirmDelete
}) => {
  const title =
    drawerState.mode === 'record' && inspectedRecord
      ? `${inspectedRecord.category} (${inspectedRecord.type})`
      : inspectedCategoryStats
        ? `${inspectedCategoryStats.category} P&L Breakdown`
        : 'Productivity Inspector';

  const subtitle =
    drawerState.mode === 'record' && inspectedRecord
      ? `${inspectedRecord.staff} · ${inspectedRecord.periodLabel} · ID: ${inspectedRecord.id}`
      : inspectedCategoryStats
        ? `${activePeriodLabel} · Segment: ${inspectedCategoryStats.segment}`
        : '';

  return (
    <>
      <SlideOverDrawer
        isOpen={drawerState.isOpen}
        onClose={onCloseDrawer}
        title={title}
        subtitle={subtitle}
        footer={
          drawerState.mode === 'record' && inspectedRecord ? (
            <>
              {canAdd && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onDuplicateRecord(inspectedRecord)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Copy size={14} aria-hidden="true" /> Duplikasi
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => onRequestSingleDelete(inspectedRecord)}
                  style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--danger)', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} aria-hidden="true" /> Hapus
                </button>
              )}
              {canEditRecord(inspectedRecord) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onCloseDrawer();
                    onEditRecord(inspectedRecord);
                  }}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Edit2 size={14} aria-hidden="true" /> Edit Data
                </button>
              )}
            </>
          ) : null
        }
      >
        {drawerState.mode === 'record' && inspectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Gross Sales</div>
                <div className="tabular-nums" style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.18rem' }}>
                  {formatIdr(inspectedRecord.salesAmount)}
                </div>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Profit</div>
                <div className="tabular-nums" style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.18rem' }}>
                  {formatIdr(inspectedRecord.profitAmount)}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.9rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Profit Margin</span>
                <strong className="tabular-nums">{formatPercent(inspectedRecord.marginPct, 2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimasi Supplier Cost</span>
                <strong className="tabular-nums">{formatIdr(Math.max(0, inspectedRecord.salesAmount - inspectedRecord.profitAmount))}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Konsultan</span>
                <strong>{inspectedRecord.staff}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Segmen</span>
                <strong>{inspectedRecord.type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Periode</span>
                <strong className="tabular-nums">{inspectedRecord.periodLabel} ({inspectedRecord.date})</strong>
              </div>
            </div>

            <div style={{ padding: '0.9rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Catatan &amp; Remarks
              </div>
              <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {inspectedRecord.remarks || 'Tidak ada catatan tambahan pada entri ini.'}
              </p>
            </div>
          </div>
        )}

        {drawerState.mode === 'category' && inspectedCategoryStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.55rem' }}>
              <div style={{ padding: '0.72rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-subtle)', fontWeight: 700 }}>SALES</div>
                <div className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.15rem' }}>
                  {formatCompactIdr(inspectedCategoryStats.sales)}
                </div>
              </div>
              <div style={{ padding: '0.72rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-subtle)', fontWeight: 700 }}>PROFIT</div>
                <div className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.15rem' }}>
                  {formatCompactIdr(inspectedCategoryStats.profit)}
                </div>
              </div>
              <div style={{ padding: '0.72rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-subtle)', fontWeight: 700 }}>MARGIN</div>
                <div className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.15rem' }}>
                  {formatPercent(inspectedCategoryStats.margin, 2)}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.45rem 0', fontSize: '0.76rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                Kontribusi Konsultan ({inspectedCategoryStats.staffRanking.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {inspectedCategoryStats.staffRanking.map((s) => (
                  <div
                    key={s.name}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '7px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.83rem' }}>{s.name}</strong>
                      <div className="tabular-nums" style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                        {s.count} entri · Sales: {formatCompactIdr(s.sales)}
                      </div>
                    </div>
                    <strong className="tabular-nums" style={{ color: 'var(--primary)', fontSize: '0.83rem' }}>
                      {formatIdr(s.profit)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.45rem 0', fontSize: '0.76rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                Entri Transaksi ({inspectedCategoryStats.records.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {inspectedCategoryStats.records.slice(0, 15).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpenRecordDrawer(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '7px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.81rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {r.staff} · <span style={{ color: 'var(--primary)' }}>{r.periodLabel}</span>
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                        {r.type} {r.remarks ? `· ${r.remarks}` : ''}
                      </div>
                    </div>
                    <div className="tabular-nums" style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCompactIdr(r.profitAmount)}</div>
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>{formatPercent(r.marginPct, 1)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Delete Confirmation AlertDialog */}
      {confirmState.isOpen && (
        <div className="modal-overlay" onClick={onCloseConfirm}>
          <div
            className="modal-content fade-in"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="prod-delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '430px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.35rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.7rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.14)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} aria-hidden="true" />
              </div>
              <h3 id="prod-delete-confirm-title" style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>
                Konfirmasi Penghapusan
              </h3>
            </div>
            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus permanen <strong style={{ color: 'var(--text-main)' }}>{confirmState.label}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onCloseConfirm}>
                Batal
              </button>
              <button
                type="button"
                className="btn"
                onClick={onConfirmDelete}
                style={{ background: 'var(--danger)', color: '#ffffff', border: 'none', fontWeight: 700 }}
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductivityInspectorDrawer;
