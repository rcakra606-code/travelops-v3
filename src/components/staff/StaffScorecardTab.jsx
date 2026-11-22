import { Eye } from 'lucide-react';
import BiChartCard from '../bi/BiChartCard';
import { BI_CHART_COLORS, formatCompactIdr, formatPercent } from '../../utils/formatters';
import { isSameStaff } from '../../utils/staffPerformanceEngine';

const getTierBadgeStyle = (tier) => {
  if (tier === 'Top Performer') {
    return {
      color: 'var(--success)',
      background: 'rgba(16, 185, 129, 0.12)',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    };
  }
  if (tier === 'On Track') {
    return {
      color: 'var(--primary)',
      background: 'var(--primary-soft)',
      border: '1px solid var(--border-glow)'
    };
  }
  if (tier === 'Developing') {
    return {
      color: 'var(--warning)',
      background: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    };
  }
  return {
    color: 'var(--text-muted)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)'
  };
};

const getMarginColor = (pct) => {
  const num = Number(pct) || 0;
  if (num >= 10) return 'var(--success)';
  if (num >= 6) return 'var(--primary)';
  if (num >= 3) return 'var(--warning)';
  return 'var(--danger)';
};

const StaffScorecardTab = ({
  consultantScorecards,
  staffNameFilter,
  selectedStaff,
  isStaffRole,
  onSelectStaff,
  onInspectConsultant
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Top 3 Performers Spotlight (All Staff view) */}
      {staffNameFilter === 'All' && consultantScorecards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {consultantScorecards.slice(0, 3).map((c, idx) => (
            <button
              key={c.staffName}
              type="button"
              className="bi-kpi-card bi-kpi-card-interactive"
              onClick={() => onInspectConsultant(c.staffName)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'var(--bg-card)',
                border: `1px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}`,
                borderTop: `2px solid ${idx === 0 ? BI_CHART_COLORS.amber : BI_CHART_COLORS.primary}`,
                borderRadius: '10px',
                padding: '0.95rem 1.05rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span
                    className="tabular-nums"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      background: idx === 0 ? 'rgba(245, 158, 11, 0.16)' : 'var(--primary-soft)',
                      color: idx === 0 ? 'var(--warning)' : 'var(--primary)',
                      flexShrink: 0
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.staffName}
                  </strong>
                </div>
                <span
                  style={{
                    ...getTierBadgeStyle(c.tierLabel),
                    padding: '0.14rem 0.5rem',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.tierLabel}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Effective Profit
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.12rem' }}>
                    {formatCompactIdr(c.effectiveProfit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Quota · Ops
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.12rem' }}>
                    {c.targetSales > 0 ? formatPercent(c.salesQuotaPct, 1) : '—'}{' '}
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>· {c.totalOpsFiles} files</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full 360° Consultant Performance Matrix */}
      <BiChartCard
        title="360° Consultant Performance Matrix"
        subtitle="Klik baris konsultan atau tombol Dossier untuk membuka evaluasi lengkap lintas modul."
        isEmpty={consultantScorecards.length === 0}
        emptyTitle="Belum ada data konsultan pada filter ini"
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="bi-table" style={{ minWidth: '940px' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Konsultan</th>
                <th>Tier</th>
                <th style={{ textAlign: 'right' }}>Sales Quota</th>
                <th style={{ textAlign: 'right' }}>Prod. Sales</th>
                <th style={{ textAlign: 'right' }}>Prod. Profit</th>
                <th style={{ textAlign: 'right' }}>Margin</th>
                <th style={{ textAlign: 'center' }}>Ops Files</th>
                <th style={{ textAlign: 'right' }}>Cross-Sell</th>
                <th style={{ textAlign: 'right' }}>OT (Jam)</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {consultantScorecards.map((c, idx) => {
                const isFocused = isSameStaff(selectedStaff, c.staffName);
                return (
                  <tr
                    key={c.staffName}
                    onClick={() => onInspectConsultant(c.staffName)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="tabular-nums" style={{ fontWeight: 800, color: idx === 0 ? 'var(--warning)' : 'var(--text-subtle)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.staffName}</td>
                    <td>
                      <span
                        style={{
                          ...getTierBadgeStyle(c.tierLabel),
                          padding: '0.14rem 0.5rem',
                          borderRadius: '5px',
                          fontSize: '0.69rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {c.tierLabel}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>
                      {c.targetSales > 0 ? (
                        <div>
                          <strong
                            style={{
                              color:
                                c.salesQuotaPct >= 100
                                  ? 'var(--success)'
                                  : c.salesQuotaPct >= 75
                                    ? 'var(--primary)'
                                    : 'var(--warning)'
                            }}
                          >
                            {formatPercent(c.salesQuotaPct, 1)}
                          </strong>
                          <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>
                            {formatCompactIdr(c.actualSales)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>
                      {formatCompactIdr(c.prodSales)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatCompactIdr(c.prodProfit)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: getMarginColor(c.prodMarginPct) }}>
                      {formatPercent(c.prodMarginPct, 1)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="bi-micro-badge tabular-nums"
                        title={`Tours: ${c.toursCount} | Cruises: ${c.cruisesCount} | Hotels: ${c.hotelsCount} | Docs: ${c.docsCount} | SIM: ${c.telecomsCount}`}
                      >
                        {c.totalOpsFiles}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                      {formatPercent(c.crossSellPct, 1)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>
                      {c.overtimeApprovedHrs}h
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => onInspectConsultant(c.staffName)}
                          aria-label={`Lihat Dossier 360 ${c.staffName}`}
                          style={{
                            padding: '0.28rem 0.52rem',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye size={12} aria-hidden="true" /> Dossier
                        </button>
                        {!isStaffRole && (
                          <button
                            type="button"
                            onClick={() => onSelectStaff(isFocused ? 'All' : c.staffName)}
                            aria-pressed={isFocused}
                            style={{
                              padding: '0.28rem 0.52rem',
                              borderRadius: '6px',
                              border: `1px solid ${isFocused ? 'var(--primary)' : 'var(--border)'}`,
                              background: isFocused ? 'var(--primary)' : 'var(--primary-soft)',
                              color: isFocused ? '#ffffff' : 'var(--primary)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isFocused ? 'Focused' : 'Focus'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BiChartCard>
    </div>
  );
};

export default StaffScorecardTab;
