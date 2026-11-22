import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Briefcase, Target, Compass
} from 'lucide-react';
import BiKpiCard from './BiKpiCard';
import BiChartCard from './BiChartCard';
import BiTooltip from './BiTooltip';
import {
  BI_CHART_COLORS,
  formatIdr,
  formatCompactIdr,
  formatAxisCompact,
  formatNumber,
  formatPercent
} from '../../utils/formatters';

const BusinessAnalyticsTab = ({ analytics, onNavigate }) => {
  const { business, meta } = analytics;
  const k = business.kpis;
  const compLabel = meta.previousWindowLabel ? `vs ${meta.previousWindowLabel}` : null;

  const hasSchemeData = (business.tourSchemePerformance || []).some((s) => s.bookings > 0 || s.omset > 0);
  const hasSeasonality = (business.seasonalTrend || []).some((s) => s.departures > 0 || s.pax > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Commercial KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem'
        }}
      >
        <BiKpiCard
          label="Pertumbuhan Revenue"
          value={k.revenueGrowth ? k.revenueGrowth.label : 'All Time'}
          delta={k.profitGrowth}
          comparisonLabel={k.profitGrowth ? `Profit ${compLabel}` : 'Pilih periode spesifik untuk tren'}
          subValue={compLabel ? `Perbandingan ${meta.currentWindowLabel} ${compLabel}` : 'Menampilkan akumulasi seluruh data'}
          tone="primary"
          icon={<TrendingUp size={16} />}
        />

        <BiKpiCard
          label="Avg. Tour Order Value"
          value={formatCompactIdr(k.avgTourOrderValue.value)}
          delta={k.avgTourOrderValue.delta}
          comparisonLabel={compLabel}
          subValue={`Rata-rata per pax: ${formatCompactIdr(k.avgTourOrderValue.revenuePerPax)}`}
          tone="neutral"
          icon={<Compass size={16} />}
          drilldownLabel="Tour"
          onClick={() => onNavigate('/tours')}
        />

        <BiKpiCard
          label="Pencapaian Target Sales"
          value={k.quotaAttainment.value !== null ? formatPercent(k.quotaAttainment.value, 1) : '—'}
          subValue={
            k.quotaAttainment.totalConsultants > 0
              ? `${k.quotaAttainment.tiers.achieved} Achieved · ${k.quotaAttainment.tiers.onTrack} On Track · ${k.quotaAttainment.tiers.needsCoaching} <70%`
              : 'Belum ada target sales pada periode ini'
          }
          tone={
            k.quotaAttainment.value === null
              ? 'neutral'
              : k.quotaAttainment.value >= 100
                ? 'success'
                : k.quotaAttainment.value >= 75
                  ? 'primary'
                  : 'warning'
          }
          icon={<Target size={16} />}
          drilldownLabel="Target"
          onClick={() => onNavigate('/sales')}
        />

        {meta.includeCorporate && (
          <BiKpiCard
            label="Aktivasi & Retensi B2B"
            value={formatPercent(k.corporateRetention.activeBillingRatePct, 1)}
            subValue={`${k.corporateRetention.billingAccounts}/${k.corporateRetention.activeAccounts} aktif bertransaksi · Repeat: ${k.corporateRetention.repeatAccounts} · Dormant: ${k.corporateRetention.dormantAccounts}`}
            tone={k.corporateRetention.dormantAccounts > k.corporateRetention.billingAccounts ? 'warning' : 'success'}
            icon={<Briefcase size={16} />}
            drilldownLabel="B2B"
            onClick={() => onNavigate('/corporate')}
          />
        )}
      </div>

      {/* Row 1: Tour Scheme Profitability & Calendar Seasonality */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Tour Scheme Comparison */}
        <BiChartCard
          title="Profitabilitas Skema Tour (Series vs Incentive vs Consortium)"
          subtitle={`Perbandingan Omset, Profit, dan Margin pada ${meta.currentWindowLabel}`}
          isEmpty={!hasSchemeData}
        >
          <div style={{ width: '100%', height: '215px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={business.tourSchemePerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="scheme"
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="omset" name="Omset (IDR)" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit (IDR)" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Skema</th>
                  <th style={{ textAlign: 'right' }}>Booking</th>
                  <th style={{ textAlign: 'right' }}>Pax</th>
                  <th style={{ textAlign: 'right' }}>Avg. Order</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th style={{ textAlign: 'right' }}>Cancel</th>
                </tr>
              </thead>
              <tbody>
                {business.tourSchemePerformance.map((s) => (
                  <tr key={s.scheme}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.scheme}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{s.bookings}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{s.pax}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{formatCompactIdr(s.avgOrderValue)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>
                      {formatPercent(s.marginPct, 1)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: s.cancelRatePct >= 15 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {formatPercent(s.cancelRatePct, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BiChartCard>

        {/* Historical Seasonal Trend */}
        <BiChartCard
          title="Pola Musiman Keberangkatan Tour (Jan – Des)"
          subtitle="Distribusi historis keberangkatan & jumlah pax aktif per bulan kalender untuk perencanaan kapasitas"
          isEmpty={!hasSeasonality}
          footer={<span>Basis: seluruh tour aktif (non-batal) yang tercatat untuk mengidentifikasi peak &amp; low season</span>}
        >
          <div style={{ width: '100%', height: '275px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={business.seasonalTrend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="biSeasonPaxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BiTooltip valueFormat="count" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey="pax"
                  name="Total Pax"
                  stroke={BI_CHART_COLORS.primary}
                  strokeWidth={2.2}
                  fill="url(#biSeasonPaxGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="departures"
                  name="Jumlah Keberangkatan"
                  stroke={BI_CHART_COLORS.emerald}
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>
      </div>

      {/* Row 2: Destination Profitability Matrix & Quota Attainment / Top B2B Concentration */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Destination Profitability Table */}
        <BiChartCard
          title="Matriks Profitabilitas Destinasi"
          subtitle={`Peringkat negara berdasarkan Omset Tour, Gross Margin, dan tingkat pembatalan (${meta.currentWindowLabel})`}
          isEmpty={(business.destinationProfitability || []).length === 0}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Destinasi</th>
                  <th style={{ textAlign: 'right' }}>Tour</th>
                  <th style={{ textAlign: 'right' }}>Pax</th>
                  <th style={{ textAlign: 'right' }}>Omset</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th style={{ textAlign: 'right' }}>Cancel</th>
                </tr>
              </thead>
              <tbody>
                {business.destinationProfitability.map((d) => (
                  <tr key={d.country}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.country}</div>
                      {d.docCount > 0 && (
                        <div style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>
                          +{d.docCount} pengajuan visa/doc
                        </div>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{formatNumber(d.bookings)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{formatNumber(d.pax)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }} title={formatIdr(d.omset)}>
                      {d.omset > 0 ? formatCompactIdr(d.omset) : '—'}
                    </td>
                    <td
                      className="tabular-nums"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: d.marginPct >= 10 ? 'var(--success)' : d.marginPct > 0 ? 'var(--text-main)' : 'var(--text-subtle)'
                      }}
                    >
                      {d.omset > 0 ? formatPercent(d.marginPct, 1) : '—'}
                    </td>
                    <td
                      className="tabular-nums"
                      style={{
                        textAlign: 'right',
                        color: d.cancelRatePct >= 15 ? 'var(--danger)' : 'var(--text-muted)'
                      }}
                    >
                      {d.bookings + d.cancelled > 0 ? formatPercent(d.cancelRatePct, 0) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BiChartCard>

        {/* Sales Quota Leaderboard + Top Corporate Concentration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BiChartCard
            title="Pencapaian Kuota Sales Konsultan"
            subtitle={`Realisasi vs Target pada ${meta.currentWindowLabel}`}
            isEmpty={(business.quotaLeaderboard || []).length === 0}
            emptyTitle="Belum ada target sales pada periode ini"
            action={
              <button
                type="button"
                onClick={() => onNavigate('/sales')}
                className="btn btn-secondary"
                style={{ fontSize: '0.73rem', padding: '0.32rem 0.65rem', borderRadius: '6px' }}
              >
                Kelola Target
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
              {business.quotaLeaderboard.slice(0, 7).map((q) => {
                const barWidth = Math.min(100, Math.max(0, q.attainmentPct));
                const barColor =
                  q.tier === 'achieved'
                    ? BI_CHART_COLORS.emerald
                    : q.tier === 'on_track'
                      ? BI_CHART_COLORS.primary
                      : BI_CHART_COLORS.amber;
                return (
                  <div key={q.staffName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.77rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{q.staffName}</span>
                      <span className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {formatCompactIdr(q.achievementSales)} / {formatCompactIdr(q.targetSales)}{' '}
                        <strong style={{ color: barColor }}>({formatPercent(q.attainmentPct, 1)})</strong>
                      </span>
                    </div>
                    <div style={{ height: '7px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          borderRadius: '4px',
                          background: barColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </BiChartCard>

          {meta.includeCorporate && (business.topCorporateAccounts || []).length > 0 && (
            <BiChartCard
              title="Konsentrasi Klien Korporasi Teratas"
              subtitle={`Top-3 akun menyumbang ${formatPercent(k.corporateRetention.top3SharePct, 1)} dari total omset B2B periode ini`}
            >
              <div style={{ overflowX: 'auto' }}>
                <table className="bi-table">
                  <thead>
                    <tr>
                      <th>Klien B2B</th>
                      <th style={{ textAlign: 'right' }}>Trx</th>
                      <th style={{ textAlign: 'right' }}>Sales</th>
                      <th style={{ textAlign: 'right' }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {business.topCorporateAccounts.slice(0, 5).map((acc) => (
                      <tr key={acc.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{acc.companyName}</td>
                        <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{acc.txCount}</td>
                        <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCompactIdr(acc.periodSales)}
                        </td>
                        <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>
                          {formatPercent(acc.marginPct, 1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BiChartCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalyticsTab;
