import { Fragment, useMemo, useState } from 'react';
import {
  BarChart, UserCheck, CalendarDays, ChevronDown, ChevronRight,
  Activity, FileText, Clock, ArrowUpRight
} from 'lucide-react';
import { useTours } from '../../context/TourContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import ExportMenu from '../ExportMenu';

const calcMarginPct = (profit, omset) =>
  omset > 0 ? Number(((profit / omset) * 100).toFixed(1)) : 0;

const parseMonthLabel = (dateStr) => {
  if (!dateStr) return null;
  const clean = String(dateStr).trim().slice(0, 10);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(clean) ? `${clean}T00:00:00` : clean);
  if (Number.isNaN(d.getTime())) return null;
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    sortKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  };
};

const TourReporting = ({ onDrillToBookings }) => {
  const { tours } = useTours();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedYear, setSelectedYear] = useState('all');
  const [reportType, setReportType] = useState('monthly');
  const [expandedKeys, setExpandedKeys] = useState({});

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Available departure years
  const yearOptions = useMemo(() => {
    const yrs = new Set();
    tours.forEach((t) => {
      if (t.departureDate && /^\d{4}/.test(t.departureDate)) {
        yrs.add(t.departureDate.slice(0, 4));
      }
    });
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [tours]);

  const yearFilteredTours = useMemo(() => {
    if (selectedYear === 'all') return tours;
    return tours.filter(
      (t) => t.departureDate && String(t.departureDate).startsWith(selectedYear)
    );
  }, [tours, selectedYear]);

  const activeTours = useMemo(
    () => yearFilteredTours.filter((t) => t.status !== 'Past Date'),
    [yearFilteredTours]
  );
  const pastTours = useMemo(
    () => yearFilteredTours.filter((t) => t.status === 'Past Date'),
    [yearFilteredTours]
  );

  // Helper to build monthly aggregation from a list of tours
  const buildMonthlyRows = (sourceList) => {
    const map = {};
    sourceList.forEach((t) => {
      const mInfo = parseMonthLabel(t.departureDate);
      if (!mInfo) return;
      const omset = Number(t.financials?.totalSellingPrice ?? t.financials?.totalOmset ?? 0);
      const profit = Number(t.financials?.profit || 0);
      const pax = Number(t.paxCount || 0);

      if (!map[mInfo.sortKey]) {
        map[mInfo.sortKey] = {
          groupKey: mInfo.label,
          sortKey: mInfo.sortKey,
          tours: 0,
          pax: 0,
          omset: 0,
          profit: 0,
          countries: {}
        };
      }
      const bucket = map[mInfo.sortKey];
      bucket.tours += 1;
      bucket.pax += pax;
      bucket.omset += omset;
      bucket.profit += profit;

      const country = t.country || 'Unknown';
      if (!bucket.countries[country]) {
        bucket.countries[country] = { tours: 0, pax: 0, omset: 0, profit: 0 };
      }
      bucket.countries[country].tours += 1;
      bucket.countries[country].pax += pax;
      bucket.countries[country].omset += omset;
      bucket.countries[country].profit += profit;
    });

    return Object.values(map)
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .map((row) => ({
        ...row,
        marginPct: calcMarginPct(row.profit, row.omset)
      }));
  };

  const monthlyReport = useMemo(() => buildMonthlyRows(activeTours), [activeTours]);
  const pastDateReport = useMemo(() => buildMonthlyRows(pastTours), [pastTours]);

  const staffReport = useMemo(() => {
    const map = {};
    activeTours.forEach((t) => {
      const staff = t.staffName || 'Unassigned';
      const omset = Number(t.financials?.totalSellingPrice ?? t.financials?.totalOmset ?? 0);
      const profit = Number(t.financials?.profit || 0);
      const pax = Number(t.paxCount || 0);

      if (!map[staff]) {
        map[staff] = { groupKey: staff, tours: 0, pax: 0, omset: 0, profit: 0, months: {} };
      }
      map[staff].tours += 1;
      map[staff].pax += pax;
      map[staff].omset += omset;
      map[staff].profit += profit;

      const mInfo = parseMonthLabel(t.departureDate);
      if (mInfo) {
        if (!map[staff].months[mInfo.sortKey]) {
          map[staff].months[mInfo.sortKey] = {
            label: mInfo.label,
            sortKey: mInfo.sortKey,
            tours: 0,
            pax: 0,
            omset: 0,
            profit: 0
          };
        }
        map[staff].months[mInfo.sortKey].tours += 1;
        map[staff].months[mInfo.sortKey].pax += pax;
        map[staff].months[mInfo.sortKey].omset += omset;
        map[staff].months[mInfo.sortKey].profit += profit;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.omset - a.omset)
      .map((row) => ({ ...row, marginPct: calcMarginPct(row.profit, row.omset) }));
  }, [activeTours]);

  const statusReport = useMemo(() => {
    const map = {};
    activeTours.forEach((t) => {
      const status = t.status || 'Pending';
      const omset = Number(t.financials?.totalSellingPrice ?? t.financials?.totalOmset ?? 0);
      const profit = Number(t.financials?.profit || 0);
      const pax = Number(t.paxCount || 0);

      if (!map[status]) {
        map[status] = { groupKey: status, tours: 0, pax: 0, omset: 0, profit: 0, months: {} };
      }
      map[status].tours += 1;
      map[status].pax += pax;
      map[status].omset += omset;
      map[status].profit += profit;

      const mInfo = parseMonthLabel(t.departureDate);
      if (mInfo) {
        if (!map[status].months[mInfo.sortKey]) {
          map[status].months[mInfo.sortKey] = {
            label: mInfo.label,
            sortKey: mInfo.sortKey,
            tours: 0,
            pax: 0,
            omset: 0,
            profit: 0
          };
        }
        map[status].months[mInfo.sortKey].tours += 1;
        map[status].months[mInfo.sortKey].pax += pax;
        map[status].months[mInfo.sortKey].omset += omset;
        map[status].months[mInfo.sortKey].profit += profit;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.tours - a.tours)
      .map((row) => ({ ...row, marginPct: calcMarginPct(row.profit, row.omset) }));
  }, [activeTours]);

  const invoicingReport = useMemo(() => {
    const map = {
      Invoiced: { groupKey: 'Invoiced', tours: 0, pax: 0, omset: 0, profit: 0, months: {} },
      'Not Invoiced': { groupKey: 'Not Invoiced', tours: 0, pax: 0, omset: 0, profit: 0, months: {} }
    };

    activeTours.forEach((t) => {
      const isInv = Boolean(t.financials?.invoiceNumber && t.financials.invoiceNumber.trim() !== '');
      const key = isInv ? 'Invoiced' : 'Not Invoiced';
      const omset = Number(t.financials?.totalSellingPrice ?? t.financials?.totalOmset ?? 0);
      const profit = Number(t.financials?.profit || 0);
      const pax = Number(t.paxCount || 0);

      map[key].tours += 1;
      map[key].pax += pax;
      map[key].omset += omset;
      map[key].profit += profit;

      const mInfo = parseMonthLabel(t.departureDate);
      if (mInfo) {
        if (!map[key].months[mInfo.sortKey]) {
          map[key].months[mInfo.sortKey] = {
            label: mInfo.label,
            sortKey: mInfo.sortKey,
            tours: 0,
            pax: 0,
            omset: 0,
            profit: 0
          };
        }
        map[key].months[mInfo.sortKey].tours += 1;
        map[key].months[mInfo.sortKey].pax += pax;
        map[key].months[mInfo.sortKey].omset += omset;
        map[key].months[mInfo.sortKey].profit += profit;
      }
    });

    return Object.values(map).map((row) => ({
      ...row,
      marginPct: calcMarginPct(row.profit, row.omset)
    }));
  }, [activeTours]);

  const REPORT_TABS = [
    {
      id: 'monthly',
      label: 'Monthly Trend',
      title: 'Monthly Revenue Trend (Active Tours)',
      groupHeader: 'Departure Month',
      icon: CalendarDays,
      color: 'var(--primary)',
      rows: monthlyReport,
      breakdownType: 'countries'
    },
    {
      id: 'staff',
      label: 'By Consultant',
      title: 'Consultant Performance Report (Active Tours)',
      groupHeader: 'PIC Consultant',
      icon: UserCheck,
      color: '#10b981',
      rows: staffReport,
      breakdownType: 'months'
    },
    {
      id: 'status',
      label: 'By Status',
      title: 'Booking Status Report (Active Tours)',
      groupHeader: 'Booking Status',
      icon: Activity,
      color: '#8b5cf6',
      rows: statusReport,
      breakdownType: 'months'
    },
    {
      id: 'invoicing',
      label: 'By Invoicing',
      title: 'Invoicing Coverage Report (Active Tours)',
      groupHeader: 'Invoice Status',
      icon: FileText,
      color: '#f59e0b',
      rows: invoicingReport,
      breakdownType: 'months'
    },
    {
      id: 'past_date',
      label: 'Completed Trips',
      title: 'Completed (Past Date) Tours Report',
      groupHeader: 'Departure Month',
      icon: Clock,
      color: '#0284c7',
      rows: pastDateReport,
      breakdownType: 'countries'
    }
  ];

  const activeConfig = REPORT_TABS.find((r) => r.id === reportType) || REPORT_TABS[0];
  const currentRows = activeConfig.rows;

  const grandTotals = useMemo(() => {
    const totals = currentRows.reduce(
      (acc, r) => ({
        tours: acc.tours + r.tours,
        pax: acc.pax + r.pax,
        omset: acc.omset + r.omset,
        profit: acc.profit + r.profit
      }),
      { tours: 0, pax: 0, omset: 0, profit: 0 }
    );
    return {
      ...totals,
      marginPct: calcMarginPct(totals.profit, totals.omset)
    };
  }, [currentRows]);

  const exportColumns = [
    { header: activeConfig.groupHeader, key: 'groupKey', format: null },
    { header: 'Total Tours', key: 'tours', format: null },
    { header: 'Total Pax', key: 'pax', format: null },
    { header: 'Total Omset (IDR)', key: 'omset', format: 'currency' },
    { header: 'Total Profit (IDR)', key: 'profit', format: 'currency' },
    { header: 'Profit Margin', key: 'marginPct', format: 'percent' }
  ];

  const emeraldColor = isLight ? '#047857' : '#34d399';
  const accordionBg = isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.04)';

  return (
    <div className="fade-in">
      {/* Year Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.15rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
            Filter Year:
          </span>
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            style={{
              padding: '0.32rem 0.78rem',
              borderRadius: '9999px',
              border: `1px solid ${selectedYear === 'all' ? 'transparent' : 'var(--border)'}`,
              background:
                selectedYear === 'all'
                  ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)'
                  : isLight ? '#ffffff' : 'var(--bg-card)',
              color: selectedYear === 'all' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            All Years
          </button>
          {yearOptions.map((yr) => {
            const active = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '0.32rem 0.78rem',
                  borderRadius: '9999px',
                  border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                  background: active
                    ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)'
                    : isLight ? '#ffffff' : 'var(--bg-card)',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Mode Selector Cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {REPORT_TABS.map((rt) => {
          const Icon = rt.icon;
          const active = reportType === rt.id;
          return (
            <button
              key={rt.id}
              type="button"
              onClick={() => setReportType(rt.id)}
              className="card"
              style={{
                flex: '1 1 170px',
                padding: '0.95rem 1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                textAlign: 'left',
                border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                background: active
                  ? isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.1)'
                  : undefined,
                boxShadow: active ? '0 4px 16px rgba(0, 168, 255, 0.16)' : undefined
              }}
            >
              <Icon size={20} color={active ? 'var(--primary)' : rt.color} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {rt.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {rt.rows.length} group{rt.rows.length === 1 ? '' : 's'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Report Table Card */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}
        >
          <h3
            style={{
              margin: 0,
              color: 'var(--text-main)',
              fontSize: '1.05rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart size={20} color="var(--primary)" /> {activeConfig.title}
          </h3>

          <ExportMenu
            data={currentRows}
            columns={exportColumns}
            filename={`Tour_Report_${reportType}_${selectedYear}`}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>{activeConfig.groupHeader}</th>
                <th>Total Tours</th>
                <th>Total Pax</th>
                <th>Total Omset</th>
                <th>Total Profit</th>
                <th>Margin %</th>
                {onDrillToBookings && <th style={{ textAlign: 'right' }}>Bookings</th>}
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                <>
                  {currentRows.map((row) => {
                    const rowId = `${reportType}:${row.groupKey}`;
                    const isExpanded = Boolean(expandedKeys[rowId]);

                    return (
                      <Fragment key={rowId}>
                        <tr
                          className="tour-report-row"
                          onClick={() => toggleExpand(rowId)}
                        >
                          <td style={{ color: 'var(--primary)' }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </td>
                          <td style={{ fontWeight: '700' }}>
                            {reportType === 'status' ? (
                              <span
                                className={`badge ${
                                  row.groupKey === 'Confirm'
                                    ? 'badge-success'
                                    : row.groupKey === 'Cancel'
                                      ? 'badge-danger'
                                      : 'badge-warning'
                                }`}
                              >
                                {row.groupKey}
                              </span>
                            ) : reportType === 'invoicing' ? (
                              <span
                                className={`badge ${
                                  row.groupKey === 'Invoiced' ? 'badge-success' : 'badge-danger'
                                }`}
                              >
                                {row.groupKey}
                              </span>
                            ) : (
                              row.groupKey
                            )}
                          </td>
                          <td style={{ fontWeight: '600' }}>{row.tours}</td>
                          <td style={{ fontWeight: '600' }}>{row.pax}</td>
                          <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                            Rp {formatCurrency(row.omset)}
                          </td>
                          <td className="font-mono" style={{ color: emeraldColor, fontWeight: '700' }}>
                            Rp {formatCurrency(row.profit)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                row.marginPct >= 10
                                  ? 'badge-success'
                                  : row.marginPct >= 5
                                    ? 'badge-primary'
                                    : 'badge-warning'
                              }`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {row.marginPct}%
                            </span>
                          </td>
                          {onDrillToBookings && (
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (reportType === 'past_date') {
                                    onDrillToBookings('past', '');
                                  } else if (reportType === 'invoicing' && row.groupKey === 'Not Invoiced') {
                                    onDrillToBookings('followup', '');
                                  } else if (reportType === 'staff') {
                                    onDrillToBookings(
                                      'active',
                                      row.groupKey === 'Unassigned' ? '' : row.groupKey
                                    );
                                  } else if (reportType === 'status') {
                                    onDrillToBookings('active', row.groupKey);
                                  } else {
                                    onDrillToBookings('active', '');
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '0.24rem 0.6rem', fontSize: '0.72rem' }}
                              >
                                View <ArrowUpRight size={12} />
                              </button>
                            </td>
                          )}
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={onDrillToBookings ? 8 : 7}
                              style={{ padding: 0, borderBottom: '1px solid var(--border)' }}
                            >
                              <div
                                style={{
                                  background: accordionBg,
                                  padding: '1.15rem 1.25rem 1.25rem 2.75rem',
                                  borderLeft: '4px solid var(--primary)'
                                }}
                              >
                                <div
                                  style={{
                                    marginBottom: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}
                                >
                                  {activeConfig.breakdownType === 'countries'
                                    ? 'Destination Breakdown'
                                    : 'Monthly Breakdown'}
                                </div>

                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
                                    gap: '0.85rem'
                                  }}
                                >
                                  {activeConfig.breakdownType === 'countries'
                                    ? Object.entries(row.countries || {}).map(([country, cStats]) => (
                                        <div
                                          key={country}
                                          style={{
                                            background: isLight ? '#ffffff' : 'var(--bg-card)',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)'
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                              {country}
                                            </span>
                                            {onDrillToBookings && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  onDrillToBookings(
                                                    reportType === 'past_date' ? 'past' : 'active',
                                                    country
                                                  )
                                                }
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: 'var(--primary)',
                                                  fontSize: '0.72rem',
                                                  fontWeight: '700',
                                                  cursor: 'pointer',
                                                  padding: 0
                                                }}
                                              >
                                                Filter →
                                              </button>
                                            )}
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Tours / Pax</span>
                                            <span style={{ fontWeight: '600' }}>
                                              {cStats.tours} tours · {cStats.pax} pax
                                            </span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                                            <span className="font-mono" style={{ color: emeraldColor, fontWeight: '700' }}>
                                              Rp {formatCurrency(cStats.profit)}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    : Object.values(row.months || {})
                                        .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
                                        .map((mStats) => (
                                          <div
                                            key={mStats.sortKey}
                                            style={{
                                              background: isLight ? '#ffffff' : 'var(--bg-card)',
                                              padding: '0.85rem 1rem',
                                              borderRadius: '10px',
                                              border: '1px solid var(--border)'
                                            }}
                                          >
                                            <div style={{ fontWeight: '700', marginBottom: '0.45rem', color: 'var(--text-main)' }}>
                                              {mStats.label}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                              <span style={{ color: 'var(--text-muted)' }}>Tours / Pax</span>
                                              <span style={{ fontWeight: '600' }}>
                                                {mStats.tours} tours · {mStats.pax} pax
                                              </span>
                                            </div>
                                            <div
                                              style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.8rem',
                                                marginTop: '0.35rem',
                                                borderTop: '1px solid var(--border)',
                                                paddingTop: '0.35rem'
                                              }}
                                            >
                                              <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                                              <span className="font-mono" style={{ color: emeraldColor, fontWeight: '700' }}>
                                                Rp {formatCurrency(mStats.profit)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {/* Grand Total Footer Row */}
                  <tr
                    style={{
                      background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.08)',
                      fontWeight: '800'
                    }}
                  >
                    <td></td>
                    <td style={{ color: 'var(--primary)', fontWeight: '800' }}>GRAND TOTAL</td>
                    <td>{grandTotals.tours}</td>
                    <td>{grandTotals.pax}</td>
                    <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '800' }}>
                      Rp {formatCurrency(grandTotals.omset)}
                    </td>
                    <td className="font-mono" style={{ color: emeraldColor, fontWeight: '800' }}>
                      Rp {formatCurrency(grandTotals.profit)}
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.73rem' }}>
                        {grandTotals.marginPct}%
                      </span>
                    </td>
                    {onDrillToBookings && <td></td>}
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={onDrillToBookings ? 8 : 7}
                    style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}
                  >
                    No tour records found for this report and year filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TourReporting;
