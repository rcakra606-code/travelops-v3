import {
  BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, TrendingUp, PieChart as PieChartIcon, Award, Layers } from 'lucide-react';
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

const getMarginBadgeStyle = (pct) => {
  const val = Number(pct) || 0;
  if (val >= 12) return { color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.28)' };
  if (val >= 7) return { color: 'var(--primary)', background: 'var(--primary-soft)', border: '1px solid var(--border-glow)' };
  if (val >= 4) return { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.28)' };
  return { color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.28)' };
};

const ProductivityOverviewTab = ({
  overviewMetrics,
  selectedStaffFilter,
  onSelectStaffFilter,
  onOpenCategoryDrawer,
  onSwitchTab
}) => {
  const avgProfitPerEntry =
    overviewMetrics.recordCount > 0
      ? overviewMetrics.totalProfit / overviewMetrics.recordCount
      : 0;
  const corpSharePct = overviewMetrics.totalProfit > 0 ? 100 - overviewMetrics.retailSharePct : 0;

  const formatMixedTooltip = (val, name, entry) => {
    if (String(name || '').includes('%') || entry?.dataKey === 'marginPct') {
      return formatPercent(val, 2);
    }
    return formatIdr(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* 5 Clickable KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <BiKpiCard
          label="Total Gross Sales"
          value={formatCompactIdr(overviewMetrics.totalSales)}
          subValue={`${formatIdr(overviewMetrics.totalSales)} · ${overviewMetrics.recordCount} entri`}
          tone="success"
          icon={<DollarSign size={15} />}
          drilldownLabel="Database"
          onClick={() => onSwitchTab('database')}
        />
        <BiKpiCard
          label="Total Gross Profit"
          value={formatCompactIdr(overviewMetrics.totalProfit)}
          subValue={`Rata-rata ${formatCompactIdr(avgProfitPerEntry)} profit / entri`}
          tone="primary"
          icon={<Layers size={15} />}
          drilldownLabel="P&L"
          onClick={() => onSwitchTab('report')}
        />
        <BiKpiCard
          label="Blended Profit Margin"
          value={formatPercent(overviewMetrics.overallMargin, 2)}
          subValue={overviewMetrics.overallMargin >= 10 ? 'Di atas benchmark 10.0%' : 'Target benchmark: 10.0%+'}
          tone={overviewMetrics.overallMargin >= 10 ? 'success' : overviewMetrics.overallMargin >= 6 ? 'primary' : 'warning'}
          icon={<TrendingUp size={15} />}
          drilldownLabel="Laporan"
          onClick={() => onSwitchTab('report')}
        />
        <BiKpiCard
          label="Retail vs Corporate Profit"
          value={`R ${overviewMetrics.retailSharePct.toFixed(0)}% · C ${corpSharePct.toFixed(0)}%`}
          subValue={`Retail ${formatCompactIdr(overviewMetrics.retailProfit)} · Corp ${formatCompactIdr(overviewMetrics.corpProfit)}`}
          tone="primary"
          icon={<PieChartIcon size={15} />}
          drilldownLabel="Bandingkan"
          onClick={() => onSwitchTab('comparison', 'type')}
        />
        <BiKpiCard
          label="Top Category & Cross-Sell"
          value={overviewMetrics.topCategory?.name || 'No Data'}
          subValue={`Hotel/Flight Cross-Sell: ${formatPercent(overviewMetrics.crossSellRate, 1)}${overviewMetrics.topCategory ? ` · Profit ${formatCompactIdr(overviewMetrics.topCategory.Profit)}` : ''}`}
          tone="neutral"
          icon={<Award size={15} />}
          drilldownLabel={overviewMetrics.topCategory ? 'Detail' : undefined}
          onClick={overviewMetrics.topCategory ? () => onOpenCategoryDrawer(overviewMetrics.topCategory.name) : undefined}
        />
      </div>

      {/* Row 1: Category Sales/Profit & Monthly Trajectory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <BiChartCard
          title="Sales & Profit per Kategori Produk"
          subtitle="Klik batang kategori untuk membuka rincian kontribusi konsultan & catatan transaksi"
          isEmpty={overviewMetrics.recordCount === 0}
        >
          <div style={{ height: '305px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overviewMetrics.categoryChartData}
                margin={{ top: 8, right: 10, left: 0, bottom: 20 }}
                onClick={(st) => {
                  if (st?.activeLabel) onOpenCategoryDrawer(st.activeLabel);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-22} textAnchor="end" height={46} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Sales" name="Gross Sales" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
                <Bar dataKey="Profit" name="Gross Profit" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        <BiChartCard
          title="Tren Bulanan & Blended Margin %"
          subtitle="Perkembangan Sales, Profit, dan Margin % hingga 12 bulan terakhir"
          isEmpty={overviewMetrics.monthlyTrendData.length === 0}
          emptyTitle="Belum ada tren bulanan pada filter aktif"
        >
          <div style={{ height: '305px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={overviewMetrics.monthlyTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} tick={{ fill: BI_CHART_COLORS.amber, fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<BiTooltip valueFormat={formatMixedTooltip} />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar yAxisId="left" dataKey="Sales" name="Sales" fill={BI_CHART_COLORS.primarySoft} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Profit" name="Profit" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="marginPct" name="Margin %" stroke={BI_CHART_COLORS.amber} strokeWidth={2.3} dot={{ r: 3.5, fill: BI_CHART_COLORS.amber }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>
      </div>

      {/* Row 2: Retail vs Corporate Profit Mix & Consultant Profit Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
        <BiChartCard
          title="Komposisi Profit: Retail vs Corporate"
          subtitle="Kontribusi laba segmen B2C Retail dibanding B2B Corporate"
          isEmpty={overviewMetrics.retailProfit <= 0 && overviewMetrics.corpProfit <= 0}
        >
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Retail Profit', value: Math.max(0, overviewMetrics.retailProfit) },
                    { name: 'Corporate Profit', value: Math.max(0, overviewMetrics.corpProfit) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill={BI_CHART_COLORS.emerald} />
                  <Cell fill={BI_CHART_COLORS.primary} />
                </Pie>
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.4rem' }}>
            <div style={{ padding: '0.65rem 0.8rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Retail</div>
              <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.12rem' }}>
                {formatCompactIdr(overviewMetrics.retailProfit)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                Sales: {formatCompactIdr(overviewMetrics.retailSales)}
              </div>
            </div>
            <div style={{ padding: '0.65rem 0.8rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Corporate</div>
              <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.12rem' }}>
                {formatCompactIdr(overviewMetrics.corpProfit)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                Sales: {formatCompactIdr(overviewMetrics.corpSales)}
              </div>
            </div>
          </div>
        </BiChartCard>

        <BiChartCard
          title="Consultant Profit Leaderboard"
          subtitle="Klik konsultan untuk memfilter seluruh dashboard berdasarkan output mereka"
          isEmpty={overviewMetrics.consultantLeaderboard.length === 0}
          emptyTitle="Belum ada data konsultan pada filter ini"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '335px', overflowY: 'auto', paddingRight: '0.2rem' }}>
            {overviewMetrics.consultantLeaderboard.map((c, idx) => {
              const maxProfit = overviewMetrics.consultantLeaderboard[0]?.Profit || 1;
              const pctBar = Math.min(100, Math.max(4, (c.Profit / maxProfit) * 100));
              const isSelected = selectedStaffFilter === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectStaffFilter(isSelected ? 'All' : c.name)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.68rem 0.85rem',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--primary-soft)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <span
                        className="tabular-nums"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: idx === 0 ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-card)',
                          color: idx === 0 ? 'var(--warning)' : 'var(--text-muted)',
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{c.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>({c.count})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                      <span
                        className="tabular-nums"
                        style={{ ...getMarginBadgeStyle(c.marginPct), padding: '0.1rem 0.44rem', borderRadius: '5px', fontSize: '0.69rem', fontWeight: 700 }}
                      >
                        {formatPercent(c.marginPct, 1)}
                      </span>
                      <strong className="tabular-nums" style={{ fontSize: '0.84rem', color: 'var(--primary)' }}>
                        {formatCompactIdr(c.Profit)}
                      </strong>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '5px', borderRadius: '4px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ width: `${pctBar}%`, height: '100%', background: BI_CHART_COLORS.primary, borderRadius: '4px' }} />
                  </div>
                  <div className="tabular-nums" style={{ marginTop: '0.28rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sales: {formatIdr(c.Sales)}</span>
                    <span>R: {formatCompactIdr(c.RetailProfit)} · C: {formatCompactIdr(c.CorporateProfit)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </BiChartCard>
      </div>
    </div>
  );
};

export default ProductivityOverviewTab;
