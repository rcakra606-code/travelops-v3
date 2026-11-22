import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Briefcase, DollarSign, Ship, FileText, Smartphone, Search, X, ChevronUp, ChevronDown
} from 'lucide-react';
import ExportMenu from '../ExportMenu';
import Pagination from '../Pagination';
import BiKpiCard from '../bi/BiKpiCard';
import BiChartCard from '../bi/BiChartCard';
import BiTooltip from '../bi/BiTooltip';
import { BI_CHART_COLORS, formatIdr, formatCompactIdr, formatPercent } from '../../utils/formatters';
import { isCancelledTour } from '../../utils/staffPerformanceEngine';

const TOUR_EXPORT_COLUMNS = [
  { header: 'Tour / Booking Code', key: 'codeLabel' },
  { header: 'Consultant', key: 'staffAssigned' },
  { header: 'Destination', key: 'country' },
  { header: 'Departure', key: 'departureDate' },
  { header: 'Pax', key: 'paxNum' },
  { header: 'Status', key: 'status' },
  { header: 'Selling Price', key: 'omsetNum', format: 'currency' },
  { header: 'Profit', key: 'profitNum', format: 'currency' },
  { header: 'Margin %', key: 'marginPct', format: 'percent' }
];

const StaffOperationsTab = ({
  operationsAnalytics,
  tourTable,
  toursPerPage,
  onToursPerPageChange,
  onInspectTour
}) => {
  const {
    sortConfig: tourSort,
    currentPage: tourPage,
    globalSearch: tourSearch,
    handleSort: handleTourSort,
    handleGlobalSearch: handleTourSearch,
    setCurrentPage: setTourPage,
    totalPages: tourTotalPages,
    paginatedData: paginatedTours,
    totalItems: totalFilteredTours
  } = tourTable;

  const renderSortIcon = (key) => {
    if (tourSort.key !== key) return <ChevronDown size={12} style={{ opacity: 0.35, verticalAlign: 'middle' }} aria-hidden="true" />;
    return tourSort.direction === 'asc'
      ? <ChevronUp size={12} color="var(--primary)" style={{ verticalAlign: 'middle' }} aria-hidden="true" />
      : <ChevronDown size={12} color="var(--primary)" style={{ verticalAlign: 'middle' }} aria-hidden="true" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* 5-Module Operational KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.85rem' }}>
        <BiKpiCard
          label="Active Tours"
          value={operationsAnalytics.activeTourCount}
          subValue={`${operationsAnalytics.activeTourPax} Pax · ${operationsAnalytics.cancelledTourCount} Cancel (${formatPercent(operationsAnalytics.tourCancelRate, 1)})`}
          tone="success"
          icon={<Briefcase size={15} />}
        />
        <BiKpiCard
          label="Tour Gross Profit"
          value={formatCompactIdr(operationsAnalytics.activeTourProfit)}
          subValue={`Omset: ${formatCompactIdr(operationsAnalytics.activeTourOmset)} (${formatPercent(operationsAnalytics.tourMargin, 1)})`}
          tone="primary"
          icon={<DollarSign size={15} />}
        />
        <BiKpiCard
          label="Cruises & Hotels"
          value={`${operationsAnalytics.cruiseCount} Cr · ${operationsAnalytics.hotelCount} Htl`}
          subValue={`${operationsAnalytics.cruisePax} Sailing Pax ditangani`}
          tone="neutral"
          icon={<Ship size={15} />}
        />
        <BiKpiCard
          label="Visa & Documents"
          value={operationsAnalytics.docCount}
          subValue={`Fee: ${formatCompactIdr(operationsAnalytics.docsFeeVolume)} (${operationsAnalytics.expressDocsCount} Express)`}
          tone="warning"
          icon={<FileText size={15} />}
        />
        <BiKpiCard
          label="SIM & Overtime"
          value={`${operationsAnalytics.telecomCount} SIM · ${operationsAnalytics.approvedOtHours}h`}
          subValue={`${operationsAnalytics.esimCount} eSIM · ${operationsAnalytics.pendingOtHours}h Pending OT`}
          tone="neutral"
          icon={<Smartphone size={15} />}
        />
      </div>

      {/* Tour Status & Top Destinations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        <BiChartCard
          title="Tour Booking Status Breakdown"
          subtitle="Proporsi status booking tour pada periode terpilih"
          isEmpty={operationsAnalytics.statusData.length === 0}
          emptyTitle="Tidak ada booking tour pada filter ini"
        >
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operationsAnalytics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {operationsAnalytics.statusData.map((entry, idx) => (
                    <Cell key={`st-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<BiTooltip valueFormat="count" />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>

        <BiChartCard
          title="Top Destinations Handled (Active Pax)"
          subtitle="Destinasi dengan jumlah peserta tour aktif terbanyak"
          isEmpty={operationsAnalytics.topDestinations.length === 0}
          emptyTitle="Belum ada data destinasi pada filter ini"
        >
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={operationsAnalytics.topDestinations}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 16, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={85} axisLine={false} tickLine={false} />
                <Tooltip content={<BiTooltip valueFormat="count" />} />
                <Bar dataKey="pax" name="Active Pax" fill={BI_CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BiChartCard>
      </div>

      {/* Searchable & Paginated Tours Handled Ledger */}
      <BiChartCard
        title={`Tours Handled Ledger (${totalFilteredTours})`}
        subtitle="Tour berstatus Cancel ditandai terpisah dan dikecualikan dari KPI revenue aktif."
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '205px' }}>
              <Search
                size={14}
                aria-hidden="true"
                style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
              <input
                type="text"
                aria-label="Cari kode tour, negara, atau konsultan"
                placeholder="Cari kode, negara, staf..."
                value={tourSearch}
                onChange={(e) => handleTourSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.36rem 1.7rem 0.36rem 1.85rem',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.77rem'
                }}
              />
              {tourSearch && (
                <button
                  type="button"
                  aria-label="Hapus pencarian tour"
                  onClick={() => handleTourSearch('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              aria-label="Baris per halaman"
              value={toursPerPage}
              onChange={(e) => {
                onToursPerPageChange(Number(e.target.value));
                setTourPage(1);
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '7px',
                padding: '0.35rem 0.55rem',
                fontSize: '0.76rem'
              }}
            >
              <option value={10}>10 / hal</option>
              <option value={25}>25 / hal</option>
            </select>

            <ExportMenu
              data={operationsAnalytics.normalizedTourRows}
              columns={TOUR_EXPORT_COLUMNS}
              filename="Staff_Tours_Ledger"
            />
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="bi-table" style={{ minWidth: '880px' }}>
            <thead>
              <tr>
                <th onClick={() => handleTourSort('codeLabel')} style={{ cursor: 'pointer' }}>Code {renderSortIcon('codeLabel')}</th>
                <th onClick={() => handleTourSort('staffAssigned')} style={{ cursor: 'pointer' }}>Konsultan {renderSortIcon('staffAssigned')}</th>
                <th onClick={() => handleTourSort('country')} style={{ cursor: 'pointer' }}>Destinasi {renderSortIcon('country')}</th>
                <th onClick={() => handleTourSort('departureDate')} style={{ cursor: 'pointer' }}>Keberangkatan {renderSortIcon('departureDate')}</th>
                <th onClick={() => handleTourSort('paxNum')} style={{ cursor: 'pointer', textAlign: 'center' }}>Pax {renderSortIcon('paxNum')}</th>
                <th>Status</th>
                <th onClick={() => handleTourSort('omsetNum')} style={{ cursor: 'pointer', textAlign: 'right' }}>Selling Price {renderSortIcon('omsetNum')}</th>
                <th onClick={() => handleTourSort('profitNum')} style={{ cursor: 'pointer', textAlign: 'right' }}>Profit {renderSortIcon('profitNum')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTours.map((t) => {
                const cancelled = isCancelledTour(t.status);
                const statusColor = cancelled
                  ? 'var(--danger)'
                  : t.status === 'Confirm'
                    ? 'var(--success)'
                    : t.status === 'Past Date'
                      ? 'var(--primary)'
                      : 'var(--warning)';
                const statusBg = cancelled
                  ? 'rgba(244, 63, 94, 0.12)'
                  : t.status === 'Confirm'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : t.status === 'Past Date'
                      ? 'var(--primary-soft)'
                      : 'rgba(245, 158, 11, 0.12)';
                return (
                  <tr
                    key={t.id}
                    onClick={() => onInspectTour(t.id)}
                    style={{ cursor: 'pointer', opacity: cancelled ? 0.62 : 1 }}
                  >
                    <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.codeLabel}</td>
                    <td style={{ fontWeight: 600 }}>{t.staffAssigned}</td>
                    <td>{t.country || '—'}</td>
                    <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{t.departureDate || '—'}</td>
                    <td className="tabular-nums" style={{ textAlign: 'center' }}>{t.paxNum}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.12rem 0.48rem',
                          borderRadius: '5px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: statusBg,
                          color: statusColor
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right' }}>{formatIdr(t.omsetNum)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatIdr(t.profitNum)}
                    </td>
                  </tr>
                );
              })}
              {paginatedTours.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Tidak ada booking tour yang cocok dengan filter aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={tourPage}
          totalPages={tourTotalPages}
          onPageChange={setTourPage}
          totalItems={totalFilteredTours}
          itemsPerPage={toursPerPage}
        />
      </BiChartCard>
    </div>
  );
};

export default StaffOperationsTab;
