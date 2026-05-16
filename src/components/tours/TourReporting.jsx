import React, { useMemo, useState } from 'react';
import { useTours } from '../../context/TourContext';
import { formatCurrency } from '../../utils/currency';
import { BarChart, UserCheck, CalendarDays, ChevronDown, ChevronRight, Activity } from 'lucide-react';

const TourReporting = () => {
  const { tours } = useTours();
  const [reportType, setReportType] = useState('monthly');
  const [expandedMonths, setExpandedMonths] = useState({});

  const [expandedStaff, setExpandedStaff] = useState({});

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleStaff = (staff) => {
    setExpandedStaff(prev => ({ ...prev, [staff]: !prev[staff] }));
  };

  const [expandedStatus, setExpandedStatus] = useState({});
  const toggleStatus = (status) => {
    setExpandedStatus(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const staffReport = useMemo(() => {
    const data = {};
    tours.forEach(t => {
      const staff = t.staffName || 'Unassigned';
      if (!data[staff]) {
        data[staff] = { count: 0, omset: 0, profit: 0, pax: 0, months: {} };
      }
      data[staff].count += 1;
      data[staff].pax += (t.paxCount || 0);
      data[staff].omset += (t.financials?.totalOmset || 0);
      data[staff].profit += (t.financials?.profit || 0);

      if (t.departureDate) {
        const date = new Date(t.departureDate);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!data[staff].months[monthYear]) {
          data[staff].months[monthYear] = { tours: 0, pax: 0, omset: 0, profit: 0 };
        }
        data[staff].months[monthYear].tours += 1;
        data[staff].months[monthYear].pax += (t.paxCount || 0);
        data[staff].months[monthYear].omset += (t.financials?.totalOmset || 0);
        data[staff].months[monthYear].profit += (t.financials?.profit || 0);
      }
    });
    return Object.entries(data).sort((a, b) => b[1].omset - a[1].omset);
  }, [tours]);

  const statusReport = useMemo(() => {
    const data = {};
    tours.forEach(t => {
      const status = t.status || 'Unknown';
      if (!data[status]) {
        data[status] = { count: 0, omset: 0, profit: 0, pax: 0, months: {} };
      }
      data[status].count += 1;
      data[status].pax += (t.paxCount || 0);
      data[status].omset += (t.financials?.totalOmset || 0);
      data[status].profit += (t.financials?.profit || 0);

      if (t.departureDate) {
        const date = new Date(t.departureDate);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!data[status].months[monthYear]) {
          data[status].months[monthYear] = { tours: 0, pax: 0, omset: 0, profit: 0 };
        }
        data[status].months[monthYear].tours += 1;
        data[status].months[monthYear].pax += (t.paxCount || 0);
        data[status].months[monthYear].omset += (t.financials?.totalOmset || 0);
        data[status].months[monthYear].profit += (t.financials?.profit || 0);
      }
    });
    return Object.entries(data).sort((a, b) => b[1].count - a[1].count);
  }, [tours]);

  const monthlyReport = useMemo(() => {
    const data = {};
    tours.forEach(t => {
      if (!t.departureDate) return;
      const date = new Date(t.departureDate);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!data[monthYear]) {
        data[monthYear] = { omset: 0, profit: 0, tours: 0, pax: 0, countries: {} };
      }
      data[monthYear].tours += 1;
      data[monthYear].pax += (t.paxCount || 0);
      data[monthYear].omset += (t.financials?.totalOmset || 0);
      data[monthYear].profit += (t.financials?.profit || 0);

      const country = t.country || 'Unknown';
      if (!data[monthYear].countries[country]) {
        data[monthYear].countries[country] = { tours: 0, pax: 0 };
      }
      data[monthYear].countries[country].tours += 1;
      data[monthYear].countries[country].pax += (t.paxCount || 0);
    });
    
    // Sort reverse chronologically
    return Object.entries(data).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [tours]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`card ${reportType === 'monthly' ? 'active-report' : ''}`}
          onClick={() => setReportType('monthly')}
          style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', border: reportType === 'monthly' ? '1px solid var(--primary)' : '1px solid var(--border)' }}
        >
          <CalendarDays color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Monthly Trend</h3>
        </button>

        <button 
          className={`card ${reportType === 'staff' ? 'active-report' : ''}`}
          onClick={() => setReportType('staff')}
          style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', border: reportType === 'staff' ? '1px solid var(--primary)' : '1px solid var(--border)' }}
        >
          <UserCheck color="var(--success)" />
          <h3 style={{ margin: 0 }}>By Staff Performance</h3>
        </button>

        <button 
          className={`card ${reportType === 'status' ? 'active-report' : ''}`}
          onClick={() => setReportType('status')}
          style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', border: reportType === 'status' ? '1px solid var(--primary)' : '1px solid var(--border)' }}
        >
          <Activity color="var(--danger)" />
          <h3 style={{ margin: 0 }}>By Status</h3>
        </button>
      </div>

      <div className="card">
        {reportType === 'monthly' && (
          <>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart size={20} /> Monthly Revenue Trend
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Month (Departure)</th>
                    <th>Total Tours</th>
                    <th>Total Pax</th>
                    <th>Total Omset</th>
                    <th>Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.length > 0 ? monthlyReport.map(([month, stats], idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        onClick={() => toggleMonth(month)} 
                        style={{ cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}
                      >
                        <td style={{ color: 'var(--primary)' }}>
                          {expandedMonths[month] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </td>
                        <td style={{ fontWeight: '600' }}>{month}</td>
                        <td style={{ fontWeight: '500' }}>{stats.tours}</td>
                        <td style={{ fontWeight: '500' }}>{stats.pax}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>Rp {formatCurrency(stats.omset)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: '600' }}>Rp {formatCurrency(stats.profit)}</td>
                      </tr>
                      {expandedMonths[month] && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem 1rem 1.5rem 3rem', borderLeft: '4px solid var(--primary)' }}>
                              <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination Breakdown</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {Object.entries(stats.countries).map(([country, cStats]) => (
                                  <div key={country} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{country}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Tours</span>
                                      <span style={{ fontWeight: '500' }}>{cStats.tours}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Passengers</span>
                                      <span style={{ fontWeight: '500' }}>{cStats.pax}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'staff' && (
          <>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart size={20} /> Staff Performance Report
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Staff Name</th>
                    <th>Bookings Handled</th>
                    <th>Total Pax</th>
                    <th>Total Omset</th>
                    <th>Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {staffReport.length > 0 ? staffReport.map(([staff, stats], idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        onClick={() => toggleStaff(staff)} 
                        style={{ cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}
                      >
                        <td style={{ color: 'var(--success)' }}>
                          {expandedStaff[staff] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </td>
                        <td style={{ fontWeight: '600' }}>{staff}</td>
                        <td style={{ fontWeight: '500' }}>{stats.count}</td>
                        <td style={{ fontWeight: '500' }}>{stats.pax}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>Rp {formatCurrency(stats.omset)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: '600' }}>Rp {formatCurrency(stats.profit)}</td>
                      </tr>
                      {expandedStaff[staff] && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem 1rem 1.5rem 3rem', borderLeft: '4px solid var(--success)' }}>
                              <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Breakdown</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {Object.entries(stats.months).sort((a,b) => new Date(b[0]) - new Date(a[0])).map(([month, mStats]) => (
                                  <div key={month} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{month}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Tours</span>
                                      <span style={{ fontWeight: '500' }}>{mStats.tours}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Passengers</span>
                                      <span style={{ fontWeight: '500' }}>{mStats.pax}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                                      <span style={{ color: 'var(--success)', fontWeight: '500' }}>Rp {formatCurrency(mStats.profit)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'status' && (
          <>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart size={20} /> Tour Status Report
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Status</th>
                    <th>Total Tours</th>
                    <th>Total Pax</th>
                    <th>Total Omset</th>
                    <th>Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {statusReport.length > 0 ? statusReport.map(([status, stats], idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        onClick={() => toggleStatus(status)} 
                        style={{ cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}
                      >
                        <td style={{ color: 'var(--danger)' }}>
                          {expandedStatus[status] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          <span className={`badge ${status === 'Confirm' ? 'badge-success' : status === 'Cancel' ? 'badge-danger' : status === 'Pending' ? 'badge-warning' : 'badge-primary'}`}>
                            {status}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500' }}>{stats.count}</td>
                        <td style={{ fontWeight: '500' }}>{stats.pax}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>Rp {formatCurrency(stats.omset)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: '600' }}>Rp {formatCurrency(stats.profit)}</td>
                      </tr>
                      {expandedStatus[status] && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem 1rem 1.5rem 3rem', borderLeft: '4px solid var(--danger)' }}>
                              <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Breakdown</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {Object.entries(stats.months).sort((a,b) => new Date(b[0]) - new Date(a[0])).map(([month, mStats]) => (
                                  <div key={month} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{month}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Tours</span>
                                      <span style={{ fontWeight: '500' }}>{mStats.tours}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Passengers</span>
                                      <span style={{ fontWeight: '500' }}>{mStats.pax}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                                      <span style={{ color: 'var(--success)', fontWeight: '500' }}>Rp {formatCurrency(mStats.profit)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TourReporting;
