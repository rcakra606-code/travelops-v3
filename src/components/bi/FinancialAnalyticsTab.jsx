import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertCircle, XCircle, Building2
} from 'lucide-react';
import BiKpiCard from './BiKpiCard';
import BiChartCard from './BiChartCard';
import BiTooltip from './BiTooltip';
import BiDataNotice from './BiDataNotice';
import {
  BI_CHART_COLORS,
  formatIdr,
  formatCompactIdr,
  formatAxisCompact,
  formatNumber,
  formatPercent
} from '../../utils/formatters';

const FinancialAnalyticsTab = ({ analytics, onNavigate }) => {
  const { financial, meta } = analytics;
  const k = financial.kpis;
  const compLabel = meta.previousWindowLabel ? `vs ${meta.previousWindowLabel}` : null;

  const hasMonthlyFinance = (financial.monthlyFinancialTrend || []).some(
    (m) => m.totalRevenue > 0 || m.grossProfit > 0
  );
  const hasReceivables = (financial.receivablesAging || []).some((b) => b.amount > 0);
  const hasProdPnl = (financial.productivityPnlByCategory || []).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Financial KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
          gap: '0.85rem'
        }}
      >
        <BiKpiCard
          label="Revenue Operasional"
          value={formatCompactIdr(k.operationalRevenue.value)}
          delta={k.operationalRevenue.delta}
          comparisonLabel={compLabel}
          subValue={`Tour ${formatCompactIdr(k.operationalRevenue.tourOmset)}${meta.includeCorporate ? ` · B2B ${formatCompactIdr(k.operationalRevenue.corpRevenue)}` : ''} · Doc ${formatCompactIdr(k.operationalRevenue.docRevenue)}`}
          tone="primary"
          icon={<DollarSign size={16} />}
        />

        <BiKpiCard
          label="Gross Profit & Margin"
          value={formatCompactIdr(k.grossProfit.value)}
          delta={k.grossProfit.delta}
          comparisonLabel={compLabel}
          subValue={`Gross Margin: ${formatPercent(k.grossProfit.marginPct, 1)}${k.grossProfit.marginDelta ? ` (${k.grossProfit.marginDelta.label})` : ''} · Tour + B2B`}
          tone="success"
          icon={<TrendingUp size={16} />}
        />

        <BiKpiCard
          label="Piutang Tour (AR Aktif)"
          value={formatCompactIdr(k.outstandingReceivables.value)}
          subValue={`${k.outstandingReceivables.unpaidCount} booking belum lunas · Mendesak <= H-7: ${formatCompactIdr(k.outstandingReceivables.urgentAmount)} (${k.outstandingReceivables.urgentCount})`}
          tone={k.outstandingReceivables.urgentAmount > 0 ? 'danger' : k.outstandingReceivables.value > 0 ? 'warning' : 'success'}
          icon={<AlertCircle size={16} />}
          drilldownLabel="Tagih"
          onClick={() => onNavigate('/tours', { openTab: 'database' })}
        />

        <BiKpiCard
          label="Nilai Pembatalan Tour"
          value={formatCompactIdr(k.cancelledBookingValue.value)}
          delta={k.cancelledBookingValue.delta}
          comparisonLabel={compLabel}
          invertPolarity
          subValue={`${k.cancelledBookingValue.cancelledCount} booking berstatus Cancel (indikator eksposur refund)`}
          tone={k.cancelledBookingValue.value > 0 ? 'warning' : 'neutral'}
          icon={<XCircle size={16} />}
        />

        {meta.includeCorporate && (
          <BiKpiCard
            label="Utilisasi Credit Limit B2B"
            value={formatPercent(k.corporateCredit.utilizationPct, 1)}
            subValue={`Plafon Aktif ${formatCompactIdr(k.corporateCredit.totalLimit)} · ${k.corporateCredit.overLimitCount} akun >= 80%`}
            tone={k.corporateCredit.overLimitCount > 0 ? 'danger' : 'neutral'}
            icon={<Building2 size={16} />}
            drilldownLabel="Corporate"
            onClick={() => onNavigate('/corporate')}
          />
        )}
      </div>

      {/* Primary Financial Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Monthly Revenue vs Gross Profit Composed Chart */}
        <BiChartCard
          title="Tren Revenue vs Gross Profit Bulanan"
          subtitle="Komposisi pendapatan operasional (IDR) dan garis gross profit tercatat"
          isEmpty={!hasMonthlyFinance}
          footer={
            <>
              <span>Ledger: Tour Aktif + Corporate B2B + Fee Dokumen (tanpa duplikasi Productivity P&amp;L)</span>
              <span>Satuan: IDR</span>
            </>
          }
        >
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financial.monthlyFinancialTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatAxisCompact}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="tourRevenue" name="Omset Tour" stackId="rev" fill={BI_CHART_COLORS.primary} />
                {meta.includeCorporate && (
                  <Bar dataKey="corporateRevenue" name="Corporate B2B" stackId="rev" fill={BI_CHART_COLORS.teal} />
                )}
                <Bar dataKey="documentRevenue" name="Fee Dokumen" stackId="rev" fill={BI_CHART_COLORS.amber} radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross Profit"
                  stroke={BI_CHART_COLORS.emerald}
                  strokeWidth={2.4}
                  dot={{ r: 3, fill: BI_CHART_COLORS.emerald }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        {/* Accounts Receivable Aging */}
        <BiChartCard
          title="Aging Piutang Pelunasan Tour (Snapshot Aktif)"
          subtitle="Sisa pelunasan seluruh tour non-batal berdasarkan kedekatan tanggal keberangkatan"
          isEmpty={!hasReceivables}
          emptyTitle="Tidak ada piutang tour tertunggak"
          emptyDescription="Seluruh booking tour aktif dalam cakupan ini telah lunas."
          action={
            <button
              type="button"
              onClick={() => onNavigate('/tours', { openTab: 'database' })}
              className="btn btn-secondary"
              style={{ fontSize: '0.73rem', padding: '0.32rem 0.65rem', borderRadius: '6px' }}
            >
              Kelola Pelunasan
            </button>
          }
        >
          <div style={{ width: '100%', height: '205px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financial.receivablesAging} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatAxisCompact}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="bucket"
                  width={138}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BiTooltip valueFormat="currency" />} />
                <Bar dataKey="amount" name="Sisa Pelunasan" radius={[0, 4, 4, 0]}>
                  {financial.receivablesAging.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '0.5rem',
              marginTop: '0.4rem'
            }}
          >
            {financial.receivablesAging.map((b) => (
              <div
                key={b.key}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: '7px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${b.color}`
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{b.bucket}</div>
                <div className="tabular-nums" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {formatCompactIdr(b.amount)}
                </div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>{b.count} booking</div>
              </div>
            ))}
          </div>
        </BiChartCard>
      </div>

      {/* Second Row: Revenue by Stream + Productivity P&L Ledger + Corporate Credit Risk */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Productivity P&L Ledger (Separate Audited View) */}
        <BiChartCard
          title="Laporan P&L Produktivitas per Kategori"
          subtitle={`Ledger input Produktivitas & P&L (${meta.currentWindowLabel}) — disajikan terpisah untuk mencegah double-counting`}
          badge={
            <span className="bi-micro-badge">
              Total P&amp;L: {formatCompactIdr(k.productivityLedger.sales)} ({formatPercent(k.productivityLedger.marginPct, 1)} margin)
            </span>
          }
          action={
            <button
              type="button"
              onClick={() => onNavigate('/productivity')}
              className="btn btn-secondary"
              style={{ fontSize: '0.73rem', padding: '0.32rem 0.65rem', borderRadius: '6px' }}
            >
              Buka P&amp;L
            </button>
          }
          isEmpty={!hasProdPnl}
          emptyTitle="Belum ada entri P&L Produktivitas pada periode ini"
        >
          {financial.channelSplit.length > 0 && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {financial.channelSplit.map((ch) => (
                <div
                  key={ch.channel}
                  style={{
                    flex: '1 1 140px',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Channel {ch.channel}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {formatCompactIdr(ch.sales)}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                    Profit {formatCompactIdr(ch.profit)} · Margin {formatPercent(ch.marginPct, 1)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Kategori Produk</th>
                  <th style={{ textAlign: 'right' }}>Entri</th>
                  <th style={{ textAlign: 'right' }}>Sales (IDR)</th>
                  <th style={{ textAlign: 'right' }}>Profit (IDR)</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {financial.productivityPnlByCategory.map((cat) => (
                  <tr key={cat.category}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.category}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatNumber(cat.entries)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }} title={formatIdr(cat.sales)}>
                      {formatCompactIdr(cat.sales)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }} title={formatIdr(cat.profit)}>
                      {formatCompactIdr(cat.profit)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatPercent(cat.marginPct, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BiChartCard>

        {/* Corporate Credit Limit Monitoring */}
        {meta.includeCorporate ? (
          <BiChartCard
            title="Monitoring Plafon Kredit Klien Korporasi (B2B)"
            subtitle={`Utilisasi billing periode ${meta.currentWindowLabel} terhadap Credit Limit per akun`}
            isEmpty={(financial.corporateCreditRisk || []).length === 0}
            emptyTitle="Belum ada akun korporasi tercatat"
            action={
              <button
                type="button"
                onClick={() => onNavigate('/corporate')}
                className="btn btn-secondary"
                style={{ fontSize: '0.73rem', padding: '0.32rem 0.65rem', borderRadius: '6px' }}
              >
                Detail B2B
              </button>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="bi-table">
                <thead>
                  <tr>
                    <th>Perusahaan</th>
                    <th style={{ textAlign: 'right' }}>Plafon Kredit</th>
                    <th style={{ textAlign: 'right' }}>Sales Periode</th>
                    <th style={{ textAlign: 'right' }}>Utilisasi</th>
                    <th>Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {financial.corporateCreditRisk.map((acc) => {
                    const riskTone =
                      acc.riskLevel === 'exceeded'
                        ? { label: 'Over Limit', color: 'var(--danger)', bg: 'rgba(244, 63, 94, 0.12)' }
                        : acc.riskLevel === 'warning'
                          ? { label: 'Waspada', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)' }
                          : { label: 'Aman', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.12)' };
                    return (
                      <tr key={acc.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{acc.companyName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{acc.accountCode}</div>
                        </td>
                        <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {acc.creditLimit > 0 ? formatCompactIdr(acc.creditLimit) : '—'}
                        </td>
                        <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCompactIdr(acc.periodSales)}
                        </td>
                        <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: riskTone.color }}>
                          {acc.creditLimit > 0 ? formatPercent(acc.utilizationPct, 1) : '—'}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.12rem 0.48rem',
                              borderRadius: '5px',
                              fontSize: '0.69rem',
                              fontWeight: 700,
                              color: riskTone.color,
                              background: riskTone.bg
                            }}
                          >
                            {riskTone.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BiChartCard>
        ) : (
          <BiChartCard
            title="Komposisi Pendapatan Portofolio Saya"
            subtitle={`Distribusi pendapatan dari transaksi yang Anda tangani (${meta.currentWindowLabel})`}
            isEmpty={(financial.revenueByStream || []).length === 0}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {financial.revenueByStream.map((stream) => (
                <div
                  key={stream.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${stream.color}`
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>{stream.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      {formatIdr(stream.revenue)}
                    </div>
                    {stream.profit !== null && (
                      <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                        Profit: {formatIdr(stream.profit)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </BiChartCard>
        )}
      </div>

      {/* Explicit Data Coverage / Transparency Notice */}
      <BiDataNotice tone="limitation" title="Batasan Data Finansial">
        {meta.unavailableMetrics.join(' ')}
      </BiDataNotice>
    </div>
  );
};

export default FinancialAnalyticsTab;
