import React, { useMemo, useState } from 'react';
import { useTours } from '../../context/TourContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json";

const TourSummary = () => {
  const { tours } = useTours();
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculations
  const activeTours = tours.filter(t => t.status !== 'Cancel');
  const totalTours = activeTours.length;
  const totalParticipants = activeTours.reduce((sum, t) => sum + (Number(t.paxCount) || 0), 0);
  const avgPax = totalTours > 0 ? Math.round(totalParticipants / totalTours) : 0;
  
  const invoicedCount = activeTours.filter(t => t.financials?.invoiceNumber && t.financials.invoiceNumber.trim() !== '').length;
  const invoiceRate = totalTours > 0 ? Math.round((invoicedCount / totalTours) * 100) : 0;

  // Chart 1: Participants per month
  const paxByMonthMap = {};
  activeTours.forEach(t => {
    if (t.departureDate) {
      const date = new Date(t.departureDate);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., 'Mar 2026'
      paxByMonthMap[monthStr] = (paxByMonthMap[monthStr] || 0) + (Number(t.paxCount) || 0);
    }
  });

  const paxByMonth = Object.keys(paxByMonthMap).map(key => ({
    name: key,
    Participants: paxByMonthMap[key]
  })).sort((a, b) => new Date(a.name) - new Date(b.name));

  // Chart 2: Tours per Staff
  const toursByStaffMap = {};
  activeTours.forEach(t => {
    const staff = t.staffName || 'Unknown';
    toursByStaffMap[staff] = (toursByStaffMap[staff] || 0) + 1;
  });
  const toursByStaff = Object.keys(toursByStaffMap).map(key => ({
    name: key,
    Tours: toursByStaffMap[key]
  })).sort((a, b) => a.Tours - b.Tours);

  // Chart 3: Tour Status
  const statusColors = { 'Confirm': '#eab308', 'Pending': '#3b82f6', 'Cancel': '#ef4444', 'Past Date': '#10b981' };
  const statusMap = {};
  tours.forEach(t => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
  });
  const statusData = Object.keys(statusMap).map(key => ({
    name: key,
    value: statusMap[key],
    color: statusColors[key] || '#8884d8'
  }));

  // Chart 4: Invoice Breakdown
  const invoiceData = [
    { name: 'Invoiced', value: invoicedCount, color: '#10b981' },
    { name: 'Not Invoiced', value: totalTours - invoicedCount, color: '#ef4444' }
  ];

  // Chart 5: Participants by Region
  const regionMap = {};
  activeTours.forEach(t => {
    const region = t.country || 'Unknown';
    regionMap[region] = (regionMap[region] || 0) + (Number(t.paxCount) || 0);
  });
  const regionList = Object.keys(regionMap).map(key => ({
    name: key,
    value: regionMap[key]
  })).sort((a, b) => b.value - a.value);

  // Chart 6: Top Departure Months (same data as Chart 1, sorted by value)
  const topDepartureMonths = [...paxByMonth].sort((a, b) => b.Participants - a.Participants).slice(0, 6);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label || payload[0].name}</p>
          <p style={{ margin: 0, color: payload[0].fill }}>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in">
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            TOTAL TOURS
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem' }}>{totalTours} total</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem' }}>{totalTours}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recorded tours (excl. cancelled)</div>
        </div>

        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            TOTAL PARTICIPANTS
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem' }}>{totalParticipants} pax</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem' }}>{totalParticipants}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across recorded tours</div>
        </div>

        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            AVG PAX / TOUR
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem' }}>{avgPax}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average participants</div>
        </div>

        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            INVOICE RATE
            <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem' }}>{invoiceRate}%</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem' }}>{invoiceRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invoiced vs total</div>
        </div>
      </div>

      {/* Map Section */}
      <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', padding: 0, overflow: 'hidden', display: 'flex', marginBottom: '1.5rem', height: '450px' }}>
        {/* Left Sidebar */}
        <div style={{ width: '250px', background: 'rgba(15, 23, 42, 0.6)', borderRight: '1px solid #334155', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}></span> REGIONS
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {totalParticipants} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>- All participants</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {regionList.map((region) => (
              <div key={region.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{region.name}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#eab308' }}>{region.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Area */}
        <div 
          style={{ flex: 1, position: 'relative', background: '#0f172a' }}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        >
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }} style={{ width: "100%", height: "100%" }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name || "";
                  
                  // Try to find a match in regionMap (case-insensitive and partial match to be safe)
                  const matchedRegion = Object.keys(regionMap).find(
                    k => geoName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(geoName.toLowerCase())
                  );
                  
                  const paxValue = matchedRegion ? regionMap[matchedRegion] : 0;
                  const hasData = paxValue > 0;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={hasData ? "#eab308" : "#1e293b"}
                      stroke="#334155"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: hasData ? "#fde047" : "#3b82f6", outline: "none", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => {
                        if (hasData) {
                          setTooltipContent(`${matchedRegion}: ${paxValue} pax`);
                        } else {
                          setTooltipContent(geoName);
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          
          {/* Custom Map Tooltip */}
          {tooltipContent && (
            <div style={{
              position: 'fixed',
              top: tooltipPos.y - 40,
              left: tooltipPos.x + 10,
              background: '#1e293b',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              border: '1px solid #334155',
              pointerEvents: 'none',
              zIndex: 1000,
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
              {tooltipContent}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Participants per month */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>PARTICIPANTS PER MONTH</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paxByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="Participants" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Tours Per Staff & Tour Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>TOURS PER STAFF</div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={toursByStaff} margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="Tours" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>TOUR STATUS</div>
          <div style={{ height: '250px', width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '-1rem' }}>
              {statusData.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '2px' }}></div>
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Invoice Breakdown, Region, Top Months */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Invoice Breakdown */}
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>INVOICE BREAKDOWN</div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={invoiceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {invoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {invoiceData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '2px' }}></div>
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top Departure Months */}
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>TOP DEPARTURE MONTHS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            {topDepartureMonths.length > 0 ? topDepartureMonths.map((month) => {
              const maxParticipants = topDepartureMonths[0].Participants;
              const widthPct = (month.Participants / maxParticipants) * 100;
              return (
                <div key={month.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', fontSize: '0.75rem', fontWeight: 'bold' }}>{month.name}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${widthPct}%`, height: '100%', background: '#eab308', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ width: '30px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold', color: '#eab308' }}>{month.Participants}</div>
                </div>
              );
            }) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No departure data available.</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TourSummary;
