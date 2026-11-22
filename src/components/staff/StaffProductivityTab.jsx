import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportMenu from '../ExportMenu';
import BiKpiCard from '../bi/BiKpiCard';
import BiChartCard from '../bi/BiChartCard';
import BiTooltip from '../bi/BiTooltip';
import {
  BI_CHART_COLORS,
  formatIdr,
  formatAxisCompact,
  formatPercent
} from '../../utils/formatters';

const PROD_EXPORT_COLUMNS = [
  { header: 'Product Category', key: 'name' },
  { header: 'Retail Sales', key: 'retailSales', format: 'currency' },
  { header: 'Corporate Sales', key: 'corpSales', format: 'currency' },
  { header: 'Total Sales', key: 'totalSales', format: 'currency' },
  { header: 'Retail Profit', key: 'retailProfit', format: 'currency' },
  { header: 'Corporate Profit', key: 'corpProfit', format: 'currency' },
  { header: 'Total Profit', key: 'totalProfit', format: 'currency' },
  { header: 'Margin %', key: 'totalMargin', format: 'percent' },
  { header: 'Sales Share %', key: 'salesSharePct', format: 'percent' }
];

const getMarginColor = (pct) => {
  const num = Number(pct) || 0;
  if (num >= 10) return 'var(--success)';
  if (num >= 6) return 'var(--primary)';
  if (num >= 3) return 'var(--warning)';
  return 'var(--danger)';
};

const StaffProductivityTab = ({
  productivityAnalytics,
  prodChartMetric,
  onMetricChange,
  onInspectCategory
}) => {
  const { rows } = productivityAnalytics;
  const tRS = rows.reduce((s, r) => s + r.retailSales, 0);
  const tCS = rows.reduce((s, r) => s + r.corpSales, 0);
  const tRP = rows.reduce((s, r) => s + r.retailProfit, 0);
  const tCP = rows.reduce((s, r) => s + r.corpProfit, 0);
  const gRM = tRS > 0 ? (tRP / tRS) * 100 : 0;
  const gCM = tCS > 0 ? (tCP / tCS) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Cross-Sell KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <BiKpiCard
          label="Retail Cross-Sell (Hotel / Flight)"
          value={formatPercent(productivityAnalytics.retailCrossSell, 1)}
          subValue="Rasio penjualan Hotel terhadap Flight segmen B2C"
          tone="success"
        />
        <BiKpiCard
          label="Corporate Cross-Sell (Hotel / Flight)"
          value={formatPercent(productivityAnalytics.corpCrossSell, 1)}
          subValue="Rasio penjualan Hotel terhadap Flight segmen B2B"
          tone="primary"
        />
        <BiKpiCard
          label="Blended Overall Cross-Sell"
          value={formatPercent(productivityAnalytics.blendedCrossSell, 1)}
          subValue="Rasio gabungan Retail + Corporate"
          tone="warning"
        />
      </div>

      {/* Chart + Table */}
      <BiChartCard
        title="Product Category P&L (Retail vs Corporate)"
        subtitle="Klik batang grafik atau baris tabel untuk melihat kontribusi per konsultan."
        isEmpty={rows.length === 0}
        emptyTitle="Belum ada data produktivitas pada filter ini"
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              role="group"
              aria-label="Metrik grafik kategori"
              style={{
                display: 'inline-flex',
                background: 'var(--bg-surface)',
                padding: '2px',
                borderRadius: '7px',
                border: '1px solid var(--border)'
              }}
            >
              {[
                { id: 'sales', label: 'Gross Sales' },
                { id: 'profit', label: 'Gross Profit' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={prodChartMetric === m.id}
                  onClick={() => onMetricChange(m.id)}
                  style={{
                    border: 'none',
                    borderRadius: '5px',
                    padding: '0.28rem 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: prodChartMetric === m.id ? 700 : 500,
                    cursor: 'pointer',
                    background: prodChartMetric === m.id ? 'var(--bg-card)' : 'transparent',
                    color: prodChartMetric === m.id ? 'var(--text-main)' : 'var(--text-muted)'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <ExportMenu
              data={rows}
              columns={PROD_EXPORT_COLUMNS}
              filename="Staff_Productivity_Breakdown"
            />
          </div>
        }
      >
        <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 8, right: 12, left: 0, bottom: 6 }}
              onClick={(st) => {
                if (st?.activeLabel) onInspectCategory(st.activeLabel);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<BiTooltip valueFormat="currency" />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar
                dataKey={prodChartMetric === 'sales' ? 'retailSales' : 'retailProfit'}
                name={prodChartMetric === 'sales' ? 'Retail Sales' : 'Retail Profit'}
                fill={BI_CHART_COLORS.emerald}
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
              />
              <Bar
                dataKey={prodChartMetric === 'sales' ? 'corpSales' : 'corpProfit'}
                name={prodChartMetric === 'sales' ? 'Corporate Sales' : 'Corporate Profit'}
                fill={BI_CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="bi-table" style={{ minWidth: '920px' }}>
            <thead>
              <tr>
                <th>Kategori Produk</th>
                <th style={{ textAlign: 'right' }}>Retail Sales</th>
                <th style={{ textAlign: 'right' }}>Corp Sales</th>
                <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>Total Sales</th>
                <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>Retail Profit</th>
                <th style={{ textAlign: 'right' }}>Corp Profit</th>
                <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>Total Profit</th>
                <th style={{ textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} onClick={() => onInspectCategory(row.name)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)' }}>{formatIdr(row.retailSales)}</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatIdr(row.corpSales)}</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800, borderLeft: '1px solid var(--border)' }}>
                    {formatIdr(row.totalSales)}
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>{formatIdr(row.retailProfit)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(row.retailMargin) }}>{formatPercent(row.retailMargin, 1)}</div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatIdr(row.corpProfit)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(row.corpMargin) }}>{formatPercent(row.corpMargin, 1)}</div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 800, borderLeft: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--success)' }}>{formatIdr(row.totalProfit)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(row.totalMargin) }}>{formatPercent(row.totalMargin, 1)}</div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatPercent(row.salesSharePct, 1)}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr style={{ background: 'var(--primary-soft)', fontWeight: 800 }}>
                  <td style={{ color: 'var(--primary)' }}>GRAND TOTAL</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)' }}>{formatIdr(tRS)}</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatIdr(tCS)}</td>
                  <td className="tabular-nums" style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                    {formatIdr(productivityAnalytics.grandSales)}
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--success)' }}>{formatIdr(tRP)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(gRM) }}>{formatPercent(gRM, 1)}</div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--primary)' }}>{formatIdr(tCP)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(gCM) }}>{formatPercent(gCM, 1)}</div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--success)' }}>{formatIdr(productivityAnalytics.grandProfit)}</div>
                    <div style={{ fontSize: '0.69rem', color: getMarginColor(productivityAnalytics.grandMargin) }}>
                      {formatPercent(productivityAnalytics.grandMargin, 1)}
                    </div>
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right' }}>100%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BiChartCard>
    </div>
  );
};

export default StaffProductivityTab;
