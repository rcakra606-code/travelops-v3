import SlideOverDrawer from '../SlideOverDrawer';
import { formatIdr, formatCompactIdr, formatPercent } from '../../utils/formatters';

const getMarginColor = (pct) => {
  const num = Number(pct) || 0;
  if (num >= 10) return 'var(--success)';
  if (num >= 6) return 'var(--primary)';
  if (num >= 3) return 'var(--warning)';
  return 'var(--danger)';
};

const StaffInspectorDrawer = ({
  drawerState,
  onClose,
  activePeriodLabel,
  staffNameFilter,
  isStaffRole,
  inspectedConsultant,
  inspectedCategory,
  inspectedTour,
  onFocusConsultant
}) => {
  const title =
    drawerState.mode === 'consultant' && inspectedConsultant?.card
      ? `${inspectedConsultant.card.staffName} — 360° Appraisal`
      : drawerState.mode === 'category' && inspectedCategory
        ? `${inspectedCategory.category} Category Breakdown`
        : inspectedTour
          ? `Tour File ${inspectedTour.codeLabel}`
          : 'Performance Inspector';

  const subtitle =
    drawerState.mode === 'consultant' && inspectedConsultant?.card
      ? `${activePeriodLabel} · Tier: ${inspectedConsultant.card.tierLabel}`
      : drawerState.mode === 'category'
        ? `${activePeriodLabel} · ${staffNameFilter === 'All' ? 'All Staff' : staffNameFilter}`
        : inspectedTour
          ? `${inspectedTour.country || 'Destination'} · PIC: ${inspectedTour.staffAssigned}`
          : '';

  return (
    <SlideOverDrawer
      isOpen={drawerState.isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        drawerState.mode === 'consultant' && inspectedConsultant?.card && !isStaffRole ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onFocusConsultant(inspectedConsultant.card.staffName)}
          >
            Filter Seluruh Halaman ke {inspectedConsultant.card.staffName}
          </button>
        ) : null
      }
    >
      {/* MODE 1: 360° CONSULTANT DOSSIER */}
      {drawerState.mode === 'consultant' && inspectedConsultant?.card && (() => {
        const c = inspectedConsultant.card;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  Logged Profit
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.18rem' }}>
                  {formatIdr(c.prodProfit)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Margin: {formatPercent(c.prodMarginPct, 1)}
                </div>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  Sales Quota %
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.18rem' }}>
                  {c.targetSales > 0 ? formatPercent(c.salesQuotaPct, 1) : 'No Quota'}
                </div>
                <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatCompactIdr(c.actualSales)} / {formatCompactIdr(c.targetSales)}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.9rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
                Operational Workload ({c.totalOpsFiles} Total Files)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tours:</span>
                  <strong className="tabular-nums">{c.toursCount} ({c.toursPax} Pax)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cruises:</span>
                  <strong className="tabular-nums">{c.cruisesCount} ({c.cruisesPax} Pax)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hotels:</span>
                  <strong className="tabular-nums">{c.hotelsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Visa &amp; Docs:</span>
                  <strong className="tabular-nums">{c.docsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SIM / eSIM:</span>
                  <strong className="tabular-nums">{c.telecomsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Approved OT:</span>
                  <strong className="tabular-nums">{c.overtimeApprovedHrs} hrs</strong>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Top Product Categories by Profit
              </div>
              {inspectedConsultant.topCategories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {inspectedConsultant.topCategories.slice(0, 6).map((cat) => (
                    <div
                      key={cat.name}
                      style={{
                        padding: '0.58rem 0.78rem',
                        borderRadius: '7px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.82rem' }}>{cat.name}</strong>
                        <div className="tabular-nums" style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                          Sales: {formatCompactIdr(cat.sales)}
                        </div>
                      </div>
                      <strong className="tabular-nums" style={{ color: 'var(--success)', fontSize: '0.83rem' }}>
                        {formatIdr(cat.profit)}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Belum ada kategori produktivitas pada periode ini.
                </div>
              )}
            </div>

            {inspectedConsultant.recentOvertimes.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  Recent Overtime Claims
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                  {inspectedConsultant.recentOvertimes.map((ot) => (
                    <div
                      key={ot.id}
                      style={{
                        padding: '0.52rem 0.78rem',
                        borderRadius: '7px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem'
                      }}
                    >
                      <span>
                        <strong>{ot.eventName}</strong> ({ot.date})
                      </span>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: ot.status === 'Approved' ? 'var(--success)' : 'var(--warning)' }}>
                        {ot.hours}h · {ot.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODE 2: CATEGORY BREAKDOWN */}
      {drawerState.mode === 'category' && inspectedCategory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            Kontribusi Konsultan ({inspectedCategory.staffSplit.length})
          </div>
          {inspectedCategory.staffSplit.map((s) => (
            <div
              key={s.name}
              style={{
                padding: '0.68rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ fontSize: '0.84rem' }}>{s.name}</strong>
                <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {s.count} entri · Sales: {formatIdr(s.sales)}
                </div>
              </div>
              <strong className="tabular-nums" style={{ color: 'var(--success)' }}>
                {formatIdr(s.profit)}
              </strong>
            </div>
          ))}
        </div>
      )}

      {/* MODE 3: TOUR FILE SUMMARY */}
      {drawerState.mode === 'tour' && inspectedTour && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Selling Price</div>
              <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.18rem' }}>
                {formatIdr(inspectedTour.omsetNum)}
              </div>
            </div>
            <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Profit</div>
              <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.18rem' }}>
                {formatIdr(inspectedTour.profitNum)}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.9rem',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.52rem',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Consultant PIC</span>
              <strong>{inspectedTour.staffAssigned}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Destination</span>
              <strong>{inspectedTour.country || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Travel Dates</span>
              <strong className="tabular-nums">{inspectedTour.departureDate || '—'} → {inspectedTour.returnDate || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Passenger Count</span>
              <strong className="tabular-nums">{inspectedTour.paxNum} Pax</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Profit Margin</span>
              <strong className="tabular-nums" style={{ color: getMarginColor(inspectedTour.marginPct) }}>
                {formatPercent(inspectedTour.marginPct, 1)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <strong>{inspectedTour.status}</strong>
            </div>
          </div>
        </div>
      )}
    </SlideOverDrawer>
  );
};

export default StaffInspectorDrawer;
