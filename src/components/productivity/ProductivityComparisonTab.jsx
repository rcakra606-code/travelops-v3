import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar } from 'lucide-react';
import BiKpiCard from '../bi/BiKpiCard';
import BiChartCard from '../bi/BiChartCard';
import BiTooltip from '../bi/BiTooltip';
import {
  BI_CHART_COLORS,
  formatCompactIdr,
  formatAxisCompact,
  formatPercent,
  computeDelta
} from '../../utils/formatters';

const ProductivityComparisonTab = ({
  comparisonMode,
  onComparisonModeChange,
  compPreset,
  onApplyPreset,
  compP1Start,
  compP1End,
  compP2Start,
  compP2End,
  onP1StartChange,
  onP1EndChange,
  onP2StartChange,
  onP2EndChange,
  comparisonAnalytics
}) => {
  const salesDelta = computeDelta(comparisonAnalytics.p1SalesTotal, comparisonAnalytics.p2SalesTotal);
  const profitDelta = computeDelta(comparisonAnalytics.p1ProfitTotal, comparisonAnalytics.p2ProfitTotal);
  const marginDelta = computeDelta(comparisonAnalytics.p1Margin, comparisonAnalytics.p2Margin, { isPoints: true });

  const activeData =
    comparisonMode === 'type' ? comparisonAnalytics.compTypeData : comparisonAnalytics.compPeriodData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Mode Toggle + Quick Presets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div
          role="group"
          aria-label="Mode perbandingan"
          style={{
            display: 'inline-flex',
            background: 'var(--bg-surface)',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}
        >
          {[
            { id: 'period', label: 'Period vs Period (YoY / QoQ / MoM)' },
            { id: 'type', label: 'Retail vs Corporate Breakdown' }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={comparisonMode === m.id}
              onClick={() => onComparisonModeChange(m.id)}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '0.38rem 0.78rem',
                fontSize: '0.78rem',
                fontWeight: comparisonMode === m.id ? 700 : 500,
                cursor: 'pointer',
                background: comparisonMode === m.id ? 'var(--bg-card)' : 'transparent',
                color: comparisonMode === m.id ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: comparisonMode === m.id ? '0 1px 2px rgba(0,0,0,0.12)' : 'none'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {comparisonMode === 'period' && (
          <div
            role="group"
            aria-label="Preset perbandingan cepat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'var(--bg-card)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', padding: '0 0.45rem', fontWeight: 700 }}>
              Preset:
            </span>
            {['MoM', 'QoQ', 'YoY', 'YTD'].map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={compPreset === preset}
                onClick={() => onApplyPreset(preset)}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.28rem 0.62rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: compPreset === preset ? 'var(--primary)' : 'transparent',
                  color: compPreset === preset ? '#ffffff' : 'var(--text-main)'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Pickers */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '0.8rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--primary)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.32rem' }}>
            <Calendar size={14} aria-hidden="true" />
            {comparisonMode === 'period' ? 'Period 1 (Current):' : 'Window:'}
          </strong>
          <input
            type="month"
            aria-label="Period 1 mulai"
            value={compP1Start}
            onChange={(e) => onP1StartChange(e.target.value)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.34rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}
          />
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.76rem' }}>s/d</span>
          <input
            type="month"
            aria-label="Period 1 selesai"
            value={compP1End}
            onChange={(e) => onP1EndChange(e.target.value)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.34rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}
          />
        </div>

        {comparisonMode === 'period' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--warning)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.32rem' }}>
              <Calendar size={14} aria-hidden="true" /> Period 2 (Baseline):
            </strong>
            <input
              type="month"
              aria-label="Period 2 mulai"
              value={compP2Start}
              onChange={(e) => onP2StartChange(e.target.value)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.34rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}
            />
            <span style={{ color: 'var(--text-subtle)', fontSize: '0.76rem' }}>s/d</span>
            <input
              type="month"
              aria-label="Period 2 selesai"
              value={compP2End}
              onChange={(e) => onP2EndChange(e.target.value)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.34rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}
            />
          </div>
        )}
      </div>

      {/* 4 Variance KPI Cards */}
      {comparisonMode === 'period' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '0.85rem' }}>
          <BiKpiCard
            label="Sales Variance (P1 - P2)"
            value={formatCompactIdr(comparisonAnalytics.p1SalesTotal - comparisonAnalytics.p2SalesTotal)}
            delta={salesDelta}
            comparisonLabel="vs P2"
            subValue={`P1 ${formatCompactIdr(comparisonAnalytics.p1SalesTotal)} vs P2 ${formatCompactIdr(comparisonAnalytics.p2SalesTotal)}`}
            tone="primary"
          />
          <BiKpiCard
            label="Profit Variance (P1 - P2)"
            value={formatCompactIdr(comparisonAnalytics.p1ProfitTotal - comparisonAnalytics.p2ProfitTotal)}
            delta={profitDelta}
            comparisonLabel="vs P2"
            subValue={`P1 ${formatCompactIdr(comparisonAnalytics.p1ProfitTotal)} vs P2 ${formatCompactIdr(comparisonAnalytics.p2ProfitTotal)}`}
            tone="success"
          />
          <BiKpiCard
            label="Margin Yield Shift"
            value={`${comparisonAnalytics.marginShiftPts >= 0 ? '+' : ''}${comparisonAnalytics.marginShiftPts.toFixed(2)} pp`}
            delta={marginDelta}
            comparisonLabel="vs P2"
            subValue={`P1 ${formatPercent(comparisonAnalytics.p1Margin, 2)} vs P2 ${formatPercent(comparisonAnalytics.p2Margin, 2)}`}
            tone={comparisonAnalytics.marginShiftPts >= 0 ? 'success' : 'danger'}
          />
          <BiKpiCard
            label="P1 Hotel/Flight Cross-Sell"
            value={formatPercent(comparisonAnalytics.p1CrossSell, 1)}
            subValue={`Entri: ${comparisonAnalytics.p1Count} (P1) vs ${comparisonAnalytics.p2Count} (P2)`}
            tone="neutral"
          />
        </div>
      )}

      {/* Comparison Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <BiChartCard
          title={comparisonMode === 'type' ? 'Retail vs Corporate Gross Sales' : 'Period 1 vs Period 2 Gross Sales'}
          subtitle="Perbandingan nilai penjualan bruto per kategori produk (IDR)"
        >
          <div style={{ height: '330px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData} margin={{ top: 8, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-22} textAnchor="end" height={46} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                {comparisonMode === 'type' ? (
                  <>
                    <Bar dataKey="RetailSales" name="Retail Sales" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="CorporateSales" name="Corporate Sales" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="P1Sales" name="Period 1 Sales" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="P2Sales" name="Period 2 Sales" fill={BI_CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        <BiChartCard
          title={comparisonMode === 'type' ? 'Retail vs Corporate Gross Profit' : 'Period 1 vs Period 2 Gross Profit'}
          subtitle="Perbandingan laba kotor per kategori produk (IDR)"
        >
          <div style={{ height: '330px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData} margin={{ top: 8, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-22} textAnchor="end" height={46} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisCompact} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                {comparisonMode === 'type' ? (
                  <>
                    <Bar dataKey="RetailProfit" name="Retail Profit" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="CorporateProfit" name="Corporate Profit" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="P1Profit" name="Period 1 Profit" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="P2Profit" name="Period 2 Profit" fill={BI_CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>
      </div>
    </div>
  );
};

export default ProductivityComparisonTab;
