import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import BiKpiCard from '../bi/BiKpiCard';
import BiChartCard from '../bi/BiChartCard';
import BiTooltip from '../bi/BiTooltip';
import {
  BI_CHART_COLORS,
  formatIdr,
  formatCompactIdr,
  formatAxisCompact,
  formatPercent
} from '../../utils/formatters';

const StaffQuotaTab = ({ salesMetrics, salesChartData, staffNameFilter }) => {
  const dimensionLabel = staffNameFilter === 'All' ? 'per Konsultan' : 'per Bulan';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <BiKpiCard
          label="Assigned Sales Quota"
          value={formatCompactIdr(salesMetrics.targetSales)}
          subValue={formatIdr(salesMetrics.targetSales)}
          tone="neutral"
        />
        <BiKpiCard
          label="Actual Sales Achieved"
          value={formatCompactIdr(salesMetrics.achievementSales)}
          subValue={`${formatPercent(salesMetrics.salesRate, 1)} tercapai · Selisih ${salesMetrics.salesVariance >= 0 ? '+' : ''}${formatCompactIdr(salesMetrics.salesVariance)}`}
          tone={salesMetrics.salesRate >= 100 ? 'success' : salesMetrics.salesRate >= 75 ? 'primary' : 'warning'}
        />
        <BiKpiCard
          label="Assigned Profit Quota"
          value={formatCompactIdr(salesMetrics.targetProfit)}
          subValue={formatIdr(salesMetrics.targetProfit)}
          tone="neutral"
        />
        <BiKpiCard
          label="Actual Profit Achieved"
          value={formatCompactIdr(salesMetrics.achievementProfit)}
          subValue={`${formatPercent(salesMetrics.profitRate, 1)} tercapai · Selisih ${salesMetrics.profitVariance >= 0 ? '+' : ''}${formatCompactIdr(salesMetrics.profitVariance)}`}
          tone={salesMetrics.profitRate >= 100 ? 'success' : salesMetrics.profitRate >= 75 ? 'primary' : 'warning'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <BiChartCard
          title={`Sales: Quota vs Actual (${dimensionLabel})`}
          subtitle="Perbandingan target penjualan dengan realisasi aktual (IDR)"
          isEmpty={salesChartData.length === 0}
          emptyTitle="Belum ada target sales pada filter ini"
        >
          <div style={{ height: '310px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="targetSales" name="Target Sales" fill={BI_CHART_COLORS.slate} radius={[4, 4, 0, 0]} />
                <Bar dataKey="achievementSales" name="Actual Sales" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        <BiChartCard
          title={`Profit: Quota vs Actual (${dimensionLabel})`}
          subtitle="Perbandingan target profit dengan realisasi aktual (IDR)"
          isEmpty={salesChartData.length === 0}
          emptyTitle="Belum ada target profit pada filter ini"
        >
          <div style={{ height: '310px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="targetProfit" name="Target Profit" fill={BI_CHART_COLORS.slate} radius={[4, 4, 0, 0]} />
                <Bar dataKey="achievementProfit" name="Actual Profit" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>
      </div>
    </div>
  );
};

export default StaffQuotaTab;
