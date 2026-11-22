import { Printer } from 'lucide-react';
import ExportMenu from '../ExportMenu';
import BiChartCard from '../bi/BiChartCard';
import { BI_CHART_COLORS, formatIdr, formatPercent } from '../../utils/formatters';

const REPORT_EXPORT_COLUMNS = [
  { header: 'Product Category', key: 'category' },
  { header: 'Segment', key: 'type' },
  { header: 'Entries', key: 'count' },
  { header: 'Total Sales', key: 'sales', format: 'currency' },
  { header: 'Total Profit', key: 'profit', format: 'currency' },
  { header: 'Profit Margin', key: 'margin', format: 'percent' },
  { header: 'Revenue Share', key: 'revenueShare', format: 'percent' }
];

const getMarginBadgeStyle = (pct) => {
  const val = Number(pct) || 0;
  if (val >= 12) return { color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.28)' };
  if (val >= 7) return { color: 'var(--primary)', background: 'var(--primary-soft)', border: '1px solid var(--border-glow)' };
  if (val >= 4) return { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.28)' };
  return { color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.28)' };
};

const getSegmentBadgeStyle = (type) => {
  if (type === 'Corporate') {
    return { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--border-glow)' };
  }
  return { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.28)' };
};

const ProductivityReportTab = ({ reportRows, activePeriodLabel, onOpenCategoryDrawer }) => {
  return (
    <BiChartCard
      title={`Productivity P&L Statement — ${activePeriodLabel}`}
      subtitle="Klik baris kategori untuk melihat rincian kontribusi konsultan dan entri transaksi."
      isEmpty={reportRows.length === 0}
      emptyTitle="Belum ada catatan produktivitas pada periode dan filter ini"
      action={
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary no-print"
            onClick={() => window.print()}
            style={{ fontSize: '0.76rem', padding: '0.38rem 0.72rem', borderRadius: '7px' }}
          >
            <Printer size={14} aria-hidden="true" /> Print
          </button>
          <ExportMenu
            data={reportRows}
            columns={REPORT_EXPORT_COLUMNS}
            filename={`Productivity_PnL_${activePeriodLabel.replace(/\s+/g, '_')}`}
          />
        </div>
      }
    >
      <div style={{ overflowX: 'auto' }}>
        <table className="bi-table" style={{ minWidth: '860px' }}>
          <thead>
            <tr>
              <th>Kategori Produk</th>
              <th>Segmen</th>
              <th style={{ textAlign: 'center' }}>Entri</th>
              <th style={{ textAlign: 'right' }}>Total Sales</th>
              <th style={{ textAlign: 'right' }}>Total Profit</th>
              <th style={{ textAlign: 'right' }}>Margin (%)</th>
              <th style={{ textAlign: 'right' }}>Sales Share</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row, idx) => (
              <tr
                key={`${row.category}-${row.type}-${idx}`}
                onClick={() => !row.isTotal && onOpenCategoryDrawer(row.category, row.type)}
                style={{
                  cursor: row.isTotal ? 'default' : 'pointer',
                  background: row.isTotal ? 'var(--primary-soft)' : undefined,
                  fontWeight: row.isTotal ? 800 : 500
                }}
              >
                <td style={{ color: row.isTotal ? 'var(--primary)' : 'var(--text-main)', fontWeight: row.isTotal ? 800 : 600 }}>
                  {row.category}
                </td>
                <td>
                  {row.isTotal ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.type}</span>
                  ) : (
                    <span
                      style={{
                        ...getSegmentBadgeStyle(row.type),
                        padding: '0.12rem 0.48rem',
                        borderRadius: '5px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                    >
                      {row.type}
                    </span>
                  )}
                </td>
                <td className="tabular-nums" style={{ textAlign: 'center' }}>{row.count}</td>
                <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>
                  {formatIdr(row.sales)}
                </td>
                <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>
                  {formatIdr(row.profit)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span
                    className="tabular-nums"
                    style={{
                      ...getMarginBadgeStyle(row.margin),
                      padding: '0.12rem 0.48rem',
                      borderRadius: '5px',
                      fontSize: '0.71rem',
                      fontWeight: 700
                    }}
                  >
                    {formatPercent(row.margin, 2)}
                  </span>
                </td>
                <td style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end' }}>
                    <div style={{ width: '48px', height: '6px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, row.revenueShare)}%`, height: '100%', background: BI_CHART_COLORS.primary }} />
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {formatPercent(row.revenueShare, 1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BiChartCard>
  );
};

export default ProductivityReportTab;
