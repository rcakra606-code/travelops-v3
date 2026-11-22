import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Layers, Users, CheckCircle2, Clock, AlertTriangle, Search, ArrowUpDown
} from 'lucide-react';
import BiKpiCard from './BiKpiCard';
import BiChartCard from './BiChartCard';
import BiTooltip from './BiTooltip';
import {
  BI_CHART_COLORS,
  formatIdr,
  formatCompactIdr,
  formatNumber,
  formatPercent
} from '../../utils/formatters';

const OperationalAnalyticsTab = ({ analytics, onNavigate }) => {
  const [workloadSearch, setWorkloadSearch] = useState('');
  const [workloadSort, setWorkloadSort] = useState('totalOps');

  const { operational, meta } = analytics;
  const k = operational.kpis;
  const compLabel = meta.previousWindowLabel ? `vs ${meta.previousWindowLabel}` : null;

  const filteredWorkload = useMemo(() => {
    const q = workloadSearch.trim().toLowerCase();
    const list = (operational.teamWorkload || []).filter((row) =>
      !q || row.staff.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      if (workloadSort === 'overtimeHours') return b.overtimeHours - a.overtimeHours;
      if (workloadSort === 'tourRevenue') return b.tourRevenue - a.tourRevenue;
      return b.totalOps - a.totalOps;
    });
  }, [operational.teamWorkload, workloadSearch, workloadSort]);

  const hasBookingTrend = (operational.monthlyBookingTrend || []).some((m) => m.totalBookings > 0);
  const totalDocsInPipeline = (operational.docPipelineBreakdown || []).reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem'
        }}
      >
        <BiKpiCard
          label="Total Booking Lintas Modul"
          value={formatNumber(k.totalBookings.value)}
          delta={k.totalBookings.delta}
          comparisonLabel={compLabel}
          subValue={k.totalBookings.breakdown}
          tone="primary"
          icon={<Layers size={16} />}
          drilldownLabel="Tour"
          onClick={() => onNavigate('/tours')}
        />
        <BiKpiCard
          label="Total Pax Aktif"
          value={`${formatNumber(k.totalPax.value)} pax`}
          delta={k.totalPax.delta}
          comparisonLabel={compLabel}
          subValue="Tour & Cruise non-batal pada periode ini"
          tone="neutral"
          icon={<Users size={16} />}
        />
        <BiKpiCard
          label="Tour Confirmation Rate"
          value={formatPercent(k.tourConfirmationRate.value, 1)}
          delta={k.tourConfirmationRate.delta}
          comparisonLabel={compLabel}
          subValue={`${k.tourConfirmationRate.confirmed} dari ${k.tourConfirmationRate.total} tour · Cancel: ${formatPercent(k.tourCancellationRate.value, 1)}`}
          tone={k.tourCancellationRate.value >= 15 ? 'warning' : 'success'}
          icon={<CheckCircle2 size={16} />}
          drilldownLabel="Database"
          onClick={() => onNavigate('/tours', { openTab: 'database' })}
        />
        <BiKpiCard
          label="Turnaround Visa & Dokumen"
          value={k.avgDocTurnaroundDays.value !== null ? `${formatNumber(k.avgDocTurnaroundDays.value, 1)} hari` : '—'}
          subValue={
            k.avgDocTurnaroundDays.slaRate !== null
              ? `SLA Tepat Waktu: ${formatPercent(k.avgDocTurnaroundDays.slaRate, 0)} · Overdue: ${k.avgDocTurnaroundDays.overdueCount}`
              : `Sampel selesai: ${k.avgDocTurnaroundDays.samples} · Overdue: ${k.avgDocTurnaroundDays.overdueCount}`
          }
          tone={k.avgDocTurnaroundDays.overdueCount > 0 ? 'warning' : 'primary'}
          icon={<Clock size={16} />}
          drilldownLabel="Dokumen"
          onClick={() => onNavigate('/documents')}
        />
        <BiKpiCard
          label="Total Jam Lembur Tim"
          value={`${formatNumber(k.overtimeHours.value, 1)} jam`}
          delta={k.overtimeHours.delta}
          comparisonLabel={compLabel}
          subValue={
            k.overtimeHours.pendingCount > 0
              ? `${k.overtimeHours.pendingCount} pengajuan menunggu persetujuan`
              : 'Seluruh log lembur sudah ditindaklanjuti'
          }
          invertPolarity
          tone={k.overtimeHours.pendingCount > 0 ? 'warning' : 'neutral'}
          icon={<AlertTriangle size={16} />}
          drilldownLabel="Lembur"
          onClick={() => onNavigate('/overtime')}
        />
      </div>

      {/* Primary Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Stacked Monthly Booking Trend */}
        <BiChartCard
          title="Tren Volume Booking Lintas Modul"
          subtitle="Jumlah transaksi bulanan per lini layanan (Tour, Visa/Dokumen, Hotel, Cruise, SIM/WiFi)"
          isEmpty={!hasBookingTrend}
          footer={<span>Satuan: jumlah booking/dokumen tercatat · Periode {operational.monthlyBookingTrend.length} bulan terakhir</span>}
        >
          <div style={{ width: '100%', height: '275px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operational.monthlyBookingTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="tours" name="Tour" stackId="ops" fill={BI_CHART_COLORS.primary} radius={[0, 0, 0, 0]} />
                <Bar dataKey="documents" name="Visa & Dokumen" stackId="ops" fill={BI_CHART_COLORS.emerald} />
                <Bar dataKey="hotels" name="Hotel" stackId="ops" fill={BI_CHART_COLORS.amber} />
                <Bar dataKey="cruises" name="Cruise" stackId="ops" fill={BI_CHART_COLORS.teal} />
                <Bar dataKey="telecoms" name="SIM/WiFi" stackId="ops" fill={BI_CHART_COLORS.slate} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        {/* Tour Status Distribution + Document Pipeline */}
        <BiChartCard
          title="Status Reservasi Tour & Pipeline Dokumen"
          subtitle={`Komposisi status pada ${meta.currentWindowLabel}`}
          isEmpty={operational.tourStatusBreakdown.length === 0 && totalDocsInPipeline === 0}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status Tour ({k.tourConfirmationRate.total} booking)
              </div>
              {operational.tourStatusBreakdown.length > 0 ? (
                <>
                  <div style={{ width: '100%', height: '165px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={operational.tourStatusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={2}
                        >
                          {operational.tourStatusBreakdown.map((entry) => (
                            <Cell key={entry.status} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<BiTooltip valueFormat="count" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.85rem', justifyContent: 'center', fontSize: '0.73rem' }}>
                    {operational.tourStatusBreakdown.map((s) => (
                      <div key={s.status} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} />
                        <span style={{ color: 'var(--text-muted)' }}>{s.status}:</span>
                        <strong className="tabular-nums" style={{ color: 'var(--text-main)' }}>{s.count}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', padding: '1rem 0' }}>
                  Tidak ada tour pada periode ini.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pipeline Visa & Dokumen ({totalDocsInPipeline})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {operational.docPipelineBreakdown.map((stage) => {
                  const pct = totalDocsInPipeline > 0 ? (stage.count / totalDocsInPipeline) * 100 : 0;
                  const barColor =
                    stage.status === 'Received'
                      ? BI_CHART_COLORS.emerald
                      : stage.status === 'Sent'
                        ? BI_CHART_COLORS.primary
                        : stage.status === 'Returned'
                          ? BI_CHART_COLORS.rose
                          : BI_CHART_COLORS.amber;
                  return (
                    <div key={stage.status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{stage.status}</span>
                        <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {stage.count} ({formatPercent(pct, 0)})
                        </span>
                      </div>
                      <div style={{ height: '7px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: barColor,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </BiChartCard>
      </div>

      {/* Tables Row: Supplier Performance & Team Workload */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Supplier & Vendor Performance */}
        <BiChartCard
          title="Performa Mitra Supplier & Vendor"
          subtitle="Agregasi volume transaksi dari Tour, Hotel, dan Visa/Dokumen pada periode terpilih"
          isEmpty={(operational.supplierPerformance || []).length === 0}
          emptyTitle="Belum ada data supplier pada periode ini"
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Supplier / Mitra</th>
                  <th>Layanan</th>
                  <th style={{ textAlign: 'right' }}>Booking</th>
                  <th style={{ textAlign: 'right' }}>Nilai Tercatat</th>
                </tr>
              </thead>
              <tbody>
                {operational.supplierPerformance.map((sup) => (
                  <tr key={sup.name}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sup.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{sup.modules}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatNumber(sup.bookings)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-main)' }}>
                      {sup.revenue > 0 ? formatCompactIdr(sup.revenue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BiChartCard>

        {/* Team Operational Workload */}
        <BiChartCard
          title="Beban Operasional Konsultan & Tim"
          subtitle={meta.scope === 'mine' ? 'Rekap beban kerja pribadi pada periode terpilih' : 'Distribusi penanganan booking & lembur lintas modul'}
          isEmpty={filteredWorkload.length === 0}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={workloadSearch}
                  onChange={(e) => setWorkloadSearch(e.target.value)}
                  placeholder="Cari konsultan..."
                  aria-label="Cari konsultan"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '0.28rem 0.55rem 0.28rem 1.7rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-main)',
                    width: '135px'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setWorkloadSort((prev) =>
                    prev === 'totalOps' ? 'tourRevenue' : prev === 'tourRevenue' ? 'overtimeHours' : 'totalOps'
                  )
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.28rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '0.28rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title="Ubah urutan tabel"
              >
                <ArrowUpDown size={12} aria-hidden="true" />
                {workloadSort === 'totalOps' ? 'Urut: Total' : workloadSort === 'tourRevenue' ? 'Urut: Omset' : 'Urut: Lembur'}
              </button>
            </div>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Konsultan</th>
                  <th style={{ textAlign: 'right' }}>Tour</th>
                  <th style={{ textAlign: 'right' }}>Doc</th>
                  <th style={{ textAlign: 'right' }}>Lainnya</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Lembur</th>
                  <th style={{ textAlign: 'right' }}>Omset Tour</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkload.map((row) => (
                  <tr key={row.staff}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.staff}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{row.tours}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{row.documents}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {row.hotels + row.cruises + row.telecoms}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700 }}>{row.totalOps}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: row.overtimeHours > 0 ? 'var(--warning)' : 'var(--text-subtle)' }}>
                      {row.overtimeHours > 0 ? `${formatNumber(row.overtimeHours, 1)}j` : '—'}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }} title={formatIdr(row.tourRevenue)}>
                      {row.tourRevenue > 0 ? formatCompactIdr(row.tourRevenue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BiChartCard>
      </div>
    </div>
  );
};

export default OperationalAnalyticsTab;
