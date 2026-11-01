import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  Eye, EyeOff, Globe, ArrowUpRight, AlertCircle, Plane, Users, DollarSign, TrendingUp
} from 'lucide-react';
import { useTours } from '../../context/TourContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/currency';

const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json';

const SummaryChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '0.55rem 0.9rem',
          borderRadius: '10px',
          color: 'var(--text-main)',
          boxShadow: 'var(--shadow-card-hover)',
          fontSize: '0.8rem'
        }}
      >
        <p style={{ margin: 0, fontWeight: '700' }}>{label || payload[0].name}</p>
        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--primary)', fontWeight: '600' }}>
          {`${payload[0].name}: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const TourSummary = ({ onDrillToBookings }) => {
  const { tours } = useTours();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedYear, setSelectedYear] = useState('all');
  const [showFinancials, setShowFinancials] = useState(true);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Resilient GeoJSON fetch so offline / firewall environments render a clean fallback
  const [geoState, setGeoState] = useState({ loading: true, data: null, failed: false });

  useEffect(() => {
    const controller = new AbortController();
    fetch(GEO_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Map fetch failed');
        return res.json();
      })
      .then((json) => {
        setGeoState({ loading: false, data: json, failed: false });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setGeoState({ loading: false, data: null, failed: true });
        }
      });
    return () => controller.abort();
  }, []);

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

  // Period-filtered tours
  const periodTours = useMemo(() => {
    if (selectedYear === 'all') return tours;
    return tours.filter(
      (t) => t.departureDate && String(t.departureDate).startsWith(selectedYear)
    );
  }, [tours, selectedYear]);

  // Non-cancelled tours
  const validTours = useMemo(
    () => periodTours.filter((t) => t.status !== 'Cancel' && t.status !== 'Cancelled'),
    [periodTours]
  );

  // Operational & Financial Metrics
  const metrics = useMemo(() => {
    const totalTours = validTours.length;
    let totalParticipants = 0;
    let totalOmset = 0;
    let totalProfit = 0;
    let totalDue = 0;
    let invoicedCount = 0;
    let unclaimedMdrCount = 0;
    let followUpCount = 0;

    validTours.forEach((t) => {
      const fin = t.financials || {};
      const pax = Number(t.paxCount) || 0;
      const omset = Number(
        fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : fin.totalOmset || 0
      );
      const profit = Number(fin.profit || 0);
      const dep = Number(fin.depositAmount || 0);
      const sisa = Math.max(0, omset - dep);
      const hasInv = Boolean(fin.invoiceNumber && String(fin.invoiceNumber).trim() !== '');
      const hasMdr = Boolean(t.claimMdr || t.internals?.claimMdr);

      totalParticipants += pax;
      totalOmset += omset;
      totalProfit += profit;
      totalDue += sisa;
      if (hasInv) invoicedCount += 1;
      if (!hasMdr) unclaimedMdrCount += 1;
      if (!hasInv || sisa > 0 || !hasMdr) followUpCount += 1;
    });

    const avgPax = totalTours > 0 ? Math.round(totalParticipants / totalTours) : 0;
    const invoiceRate = totalTours > 0 ? Math.round((invoicedCount / totalTours) * 100) : 0;
    const marginPct = totalOmset > 0 ? ((totalProfit / totalOmset) * 100).toFixed(1) : '0.0';

    return {
      totalTours,
      totalParticipants,
      avgPax,
      totalOmset,
      totalProfit,
      totalDue,
      invoicedCount,
      uninvoicedCount: totalTours - invoicedCount,
      invoiceRate,
      unclaimedMdrCount,
      followUpCount,
      marginPct
    };
  }, [validTours]);

  // Chart 1: Participants per month
  const paxByMonth = useMemo(() => {
    const map = {};
    validTours.forEach((t) => {
      if (t.departureDate) {
        const clean = String(t.departureDate).trim().slice(0, 10);
        const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(clean) ? `${clean}T00:00:00` : clean);
        if (!Number.isNaN(d.getTime())) {
          const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!map[sortKey]) map[sortKey] = { name: label, sortKey, Participants: 0 };
          map[sortKey].Participants += Number(t.paxCount) || 0;
        }
      }
    });
    return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [validTours]);

  // Chart 2: Tours per Staff
  const toursByStaff = useMemo(() => {
    const map = {};
    validTours.forEach((t) => {
      const staff = t.staffName || 'Unassigned';
      map[staff] = (map[staff] || 0) + 1;
    });
    return Object.keys(map)
      .map((name) => ({ name, Tours: map[name] }))
      .sort((a, b) => b.Tours - a.Tours);
  }, [validTours]);

  // Chart 3: Tour Status
  const statusData = useMemo(() => {
    const statusColors = {
      Confirm: '#10b981',
      Pending: '#f59e0b',
      Cancel: '#ef4444',
      'Past Date': '#00a8ff'
    };
    const map = {};
    periodTours.forEach((t) => {
      const st = t.status || 'Pending';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.keys(map).map((name) => ({
      name: name === 'Past Date' ? 'Completed' : name,
      value: map[name],
      color: statusColors[name] || '#38bdf8'
    }));
  }, [periodTours]);

  // Chart 4: Invoice Breakdown
  const invoiceData = [
    { name: 'Invoiced', value: metrics.invoicedCount, color: '#10b981' },
    { name: 'Uninvoiced', value: metrics.uninvoicedCount, color: '#f43f5e' }
  ];

  // Destination Breakdown
  const { regionMap, regionList } = useMemo(() => {
    const rMap = {};
    const countMap = {};
    validTours.forEach((t) => {
      const region = t.country || 'Unknown';
      rMap[region] = (rMap[region] || 0) + (Number(t.paxCount) || 0);
      countMap[region] = (countMap[region] || 0) + 1;
    });
    const list = Object.keys(rMap)
      .map((name) => ({ name, value: rMap[name], bookings: countMap[name] }))
      .sort((a, b) => b.value - a.value);
    return { regionMap: rMap, regionList: list };
  }, [validTours]);

  const topDepartureMonths = useMemo(
    () => [...paxByMonth].sort((a, b) => b.Participants - a.Participants).slice(0, 6),
    [paxByMonth]
  );

  const maskMoney = (amount) =>
    showFinancials ? `Rp ${formatCurrency(amount)}` : 'Rp •••••••••';

  const emeraldColor = isLight ? '#047857' : '#34d399';
  const amberColor = isLight ? '#b45309' : '#fbbf24';

  return (
    <div className="fade-in">
      {/* Period Selector & Privacy Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            Departure Year:
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {metrics.followUpCount > 0 && onDrillToBookings && (
            <button
              type="button"
              onClick={() => onDrillToBookings('followup', '')}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                color: amberColor,
                borderColor: 'rgba(245, 158, 11, 0.35)',
                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)'
              }}
            >
              <AlertCircle size={14} /> {metrics.followUpCount} Bookings Need Follow-Up
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFinancials((prev) => !prev)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
            title="Show or hide financial figures"
          >
            {showFinancials ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showFinancials ? 'Hide Figures' : 'Show Figures'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
          gap: '1.15rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* KPI 1: Total Bookings & Pax */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tours &amp; Travelers
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
              <Plane size={11} /> Avg {metrics.avgPax} pax
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.45rem' }}>
            {metrics.totalTours}{' '}
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              bookings
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={13} color="var(--primary)" />
            <strong>{metrics.totalParticipants}</strong> total travelers (excl. cancelled)
          </div>
        </div>

        {/* KPI 2: Total Selling Price (Omset) */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Tour Omset
            </span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.6rem' }}
          >
            {maskMoney(metrics.totalOmset)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Guest balance due:{' '}
            <strong className="font-mono" style={{ color: metrics.totalDue > 0 ? amberColor : emeraldColor }}>
              {maskMoney(metrics.totalDue)}
            </strong>
          </div>
        </div>

        {/* KPI 3: Net Profit & Margin */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Net Tour Profit
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
              <TrendingUp size={11} /> {metrics.marginPct}%
            </span>
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '1.5rem', fontWeight: '800', color: emeraldColor, marginTop: '0.6rem' }}
          >
            {maskMoney(metrics.totalProfit)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Operational profit across {metrics.totalTours} bookings
          </div>
        </div>

        {/* KPI 4: Settlement & Admin Health */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Invoicing &amp; MDR
            </span>
            <span
              className={`badge ${metrics.invoiceRate >= 80 ? 'badge-success' : 'badge-warning'}`}
              style={{ fontSize: '0.68rem' }}
            >
              {metrics.invoiceRate}% invoiced
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.45rem' }}>
            {metrics.invoicedCount}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              /{metrics.totalTours}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {metrics.uninvoicedCount} uninvoiced · {metrics.unclaimedMdrCount} unclaimed MDR
          </div>
        </div>
      </div>

      {/* Interactive World Destination Map (With Mobile Responsive Layout & Offline Fallback) */}
      <div className="card tour-map-layout" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        {/* Left Destination Sidebar */}
        <div
          className="tour-map-sidebar"
          style={{
            background: isLight ? '#f8fbff' : 'var(--bg-surface)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: '800',
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '0.75rem'
            }}
          >
            <Globe size={15} /> Destinations ({regionList.length})
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            {metrics.totalParticipants}{' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              travelers
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {regionList.length > 0 ? (
              regionList.map((region) => (
                <button
                  key={region.name}
                  type="button"
                  onClick={() => onDrillToBookings && onDrillToBookings('all', region.name)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '9px',
                    padding: '0.5rem 0.7rem',
                    cursor: onDrillToBookings ? 'pointer' : 'default',
                    textAlign: 'left'
                  }}
                  title={onDrillToBookings ? `Filter bookings in ${region.name}` : region.name}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {region.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                      {region.bookings} booking{region.bookings === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    {region.value} pax {onDrillToBookings && <ArrowUpRight size={12} />}
                  </span>
                </button>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No destination data for this period.
              </div>
            )}
          </div>
        </div>

        {/* Map Area (or Resilient Ranked Visual Fallback if CDN unreachable) */}
        <div
          className="tour-map-canvas"
          style={{ background: isLight ? '#ffffff' : 'var(--bg-card)' }}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        >
          {geoState.loading ? (
            <div
              style={{
                height: '100%',
                minHeight: '340px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              Loading destination world map...
            </div>
          ) : geoState.failed || !geoState.data ? (
            <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Destination Market Share Breakdown
              </div>
              <p style={{ margin: '0 0 1.15rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ranked traveler distribution across active destinations.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {regionList.slice(0, 8).map((r) => {
                  const pct =
                    metrics.totalParticipants > 0
                      ? Math.round((r.value / metrics.totalParticipants) * 100)
                      : 0;
                  return (
                    <div key={r.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{r.name}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                          {r.value} pax ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: isLight ? '#e0f2fe' : 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.max(4, pct)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00b4ff, #0077ff)',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 118 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Geographies geography={geoState.data}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const geoName = geo.properties.name || '';
                    const matchedRegion = Object.keys(regionMap).find(
                      (k) =>
                        geoName.toLowerCase().includes(k.toLowerCase()) ||
                        k.toLowerCase().includes(geoName.toLowerCase())
                    );
                    const paxValue = matchedRegion ? regionMap[matchedRegion] : 0;
                    const hasData = paxValue > 0;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={
                          hasData
                            ? '#0095ff'
                            : isLight
                              ? '#eef6ff'
                              : '#111c33'
                        }
                        stroke={isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.16)'}
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: hasData ? '#00c6ff' : isLight ? '#dbeafe' : '#1b2b4b',
                            outline: 'none',
                            cursor: hasData ? 'pointer' : 'default'
                          },
                          pressed: { outline: 'none' }
                        }}
                        onClick={() => {
                          if (hasData && matchedRegion && onDrillToBookings) {
                            onDrillToBookings('all', matchedRegion);
                          }
                        }}
                        onMouseEnter={() => {
                          setTooltipContent(
                            hasData ? `${matchedRegion}: ${paxValue} pax` : geoName
                          );
                        }}
                        onMouseLeave={() => setTooltipContent('')}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          )}

          {tooltipContent &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: tooltipPos.y - 38,
                  left: tooltipPos.x + 12,
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  padding: '0.42rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  pointerEvents: 'none',
                  zIndex: 999999,
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  boxShadow: 'var(--shadow-card-hover)'
                }}
              >
                {tooltipContent}
              </div>,
              document.body
            )}
        </div>
      </div>

      {/* Row 2: Participants per Month */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: '800',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '1rem'
          }}
        >
          Travelers Departing per Month
        </div>
        <div style={{ height: '280px', width: '100%' }}>
          {paxByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paxByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={<SummaryChartTooltip />}
                  cursor={{ fill: isLight ? 'rgba(0, 149, 255, 0.06)' : 'rgba(56, 189, 248, 0.08)' }}
                />
                <Bar dataKey="Participants" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={38} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No monthly departure data for this period.
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Tours Per Consultant & Booking Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div className="card">
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: '800',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '1rem'
            }}
          >
            Bookings per Consultant
          </div>
          <div style={{ height: '250px', width: '100%' }}>
            {toursByStaff.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={toursByStaff}
                  margin={{ top: 5, right: 25, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <RechartsTooltip
                    content={<SummaryChartTooltip />}
                    cursor={{ fill: isLight ? 'rgba(0, 149, 255, 0.06)' : 'rgba(56, 189, 248, 0.08)' }}
                  />
                  <Bar dataKey="Tours" fill="#00b4ff" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No consultant data available.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: '800',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '1rem'
            }}
          >
            Booking Lifecycle Status
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<SummaryChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {statusData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}
              >
                <span style={{ width: '9px', height: '9px', background: s.color, borderRadius: '50%' }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Invoice Coverage & Peak Departure Months */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}
      >
        <div className="card">
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: '800',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '1rem'
            }}
          >
            Invoice Coverage
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {invoiceData.map((entry, index) => (
                    <Cell key={`inv-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<SummaryChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
            {invoiceData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}
              >
                <span style={{ width: '9px', height: '9px', background: s.color, borderRadius: '50%' }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: '800',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '1rem'
            }}
          >
            Peak Departure Months
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', paddingTop: '0.35rem' }}>
            {topDepartureMonths.length > 0 ? (
              topDepartureMonths.map((month) => {
                const maxParticipants = topDepartureMonths[0].Participants || 1;
                const widthPct = (month.Participants / maxParticipants) * 100;
                return (
                  <div key={month.name} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '72px', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {month.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: isLight ? '#e0f2fe' : 'var(--border)',
                        height: '8px',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #00b4ff, #0077ff)',
                          borderRadius: '9999px'
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: '54px',
                        textAlign: 'right',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        color: 'var(--primary)'
                      }}
                    >
                      {month.Participants} pax
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No departure data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourSummary;
