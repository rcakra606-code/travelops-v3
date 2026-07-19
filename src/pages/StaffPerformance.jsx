import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useSales } from '../context/SalesContext';
import { useProductivity } from '../context/ProductivityContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useCashouts } from '../context/CashoutContext';
import { formatCurrency } from '../utils/currency';
import { UserCheck, TrendingUp, DollarSign, Target, Briefcase, Clock, CreditCard, Activity, Calendar, Database, BarChart as BarChartIcon, Users, MapPin, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatabaseTable from '../components/tours/DatabaseTable';

const StaffPerformance = () => {
  const { user } = useAuth();
  const { users } = useUsers();
  
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { sales } = useSales();
  const { productivityData } = useProductivity();
  const { overtimes } = useOvertimes();
  const { cashoutRequests } = useCashouts();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const isStaffRole = user?.role === 'Staff';
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [selectedStaff, setSelectedStaff] = useState(isStaffRole ? user?.name : 'All');
  const [period, setPeriod] = useState(''); // YYYY-MM
  const [activeTab, setActiveTab] = useState('productivity');

  const staffNameFilter = isStaffRole ? user?.name : selectedStaff;


  // Target vs Achievement Sales
  const salesMetrics = useMemo(() => {
    let tSales = 0; let tProfit = 0; let aSales = 0; let aProfit = 0;
    sales.forEach(s => {
      if (staffNameFilter === 'All' || s.staffName === staffNameFilter) {
        if (!period || s.period === period) {
          tSales += (s.targetSales || 0);
          tProfit += (s.targetProfit || 0);
          aSales += (s.achievementSales || 0);
          aProfit += (s.achievementProfit || 0);
        }
      }
    });
    return { targetSales: tSales, targetProfit: tProfit, achievementSales: aSales, achievementProfit: aProfit };
  }, [sales, staffNameFilter, period]);

  const filteredSalesData = useMemo(() => {
    return sales.filter(s => {
      const matchStaff = staffNameFilter === 'All' || s.staffName === staffNameFilter;
      const matchPeriod = !period || s.period === period;
      return matchStaff && matchPeriod;
    });
  }, [sales, staffNameFilter, period]);

  const salesChartData = useMemo(() => {
    const map = {};
    const key = staffNameFilter === 'All' ? 'staffName' : 'period';
    
    filteredSalesData.forEach(s => {
      const k = s[key] || 'Unknown';
      if (!map[k]) {
        map[k] = { name: k, targetSales: 0, achievementSales: 0, targetProfit: 0, achievementProfit: 0 };
      }
      map[k].targetSales += (s.targetSales || 0);
      map[k].achievementSales += (s.achievementSales || 0);
      map[k].targetProfit += (s.targetProfit || 0);
      map[k].achievementProfit += (s.achievementProfit || 0);
    });
    
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredSalesData, staffNameFilter]);

  const productivityBreakdown = useMemo(() => {
    const CATEGORIES = [
      'Flight', 'Hotel', 'Tour', 'Package', 'Cruise', 
      'Admission', 'Passport', 'Visa', 'Insurance', 'Train', 'Other'
    ];
    const map = {};
    CATEGORIES.forEach(c => {
      map[c] = { name: c, retailSales: 0, retailProfit: 0, corpSales: 0, corpProfit: 0 };
    });

    productivityData.forEach(p => {
      if (staffNameFilter === 'All' || p.staff === staffNameFilter) {
        if (!period || (p.date && p.date.startsWith(period))) {
          const cat = p.category || 'Other';
          const type = p.type || 'Retail';
          
          if (!map[cat]) {
            map[cat] = { name: cat, retailSales: 0, retailProfit: 0, corpSales: 0, corpProfit: 0 };
          }
          
          if (type === 'Retail') {
            map[cat].retailSales += (p.salesAmount || 0);
            map[cat].retailProfit += (p.profitAmount || 0);
          } else {
            map[cat].corpSales += (p.salesAmount || 0);
            map[cat].corpProfit += (p.profitAmount || 0);
          }
        }
      }
    });

    return Object.values(map).filter(m => m.retailSales > 0 || m.corpSales > 0 || m.retailProfit > 0 || m.corpProfit > 0).sort((a, b) => (b.retailSales + b.corpSales) - (a.retailSales + a.corpSales));
  }, [productivityData, staffNameFilter, period]);

  const crossSellMetrics = useMemo(() => {
    const flight = productivityBreakdown.find(p => p.name === 'Flight') || { retailSales: 0, corpSales: 0 };
    const hotel = productivityBreakdown.find(p => p.name === 'Hotel') || { retailSales: 0, corpSales: 0 };

    const retailRate = flight.retailSales > 0 ? ((hotel.retailSales / flight.retailSales) * 100).toFixed(1) : 0;
    const corpRate = flight.corpSales > 0 ? ((hotel.corpSales / flight.corpSales) * 100).toFixed(1) : 0;

    return { retailRate, corpRate };
  }, [productivityBreakdown]);

  const filteredToursData = useMemo(() => {
    return tours.filter(t => {
      const matchStaff = staffNameFilter === 'All' || t.pic === staffNameFilter;
      const matchPeriod = !period || (t.departureDate && t.departureDate.startsWith(period));
      return matchStaff && matchPeriod;
    });
  }, [tours, staffNameFilter, period]);

  const tourAnalytics = useMemo(() => {
    let totalPax = 0;
    let totalOmset = 0;
    let totalProfit = 0;
    let statusCounts = { Confirm: 0, Pending: 0, Cancel: 0, 'Past Date': 0 };
    let destinations = {};

    filteredToursData.forEach(t => {
      totalPax += (t.paxCount || 0);
      totalOmset += (t.financials?.totalOmset || 0);
      totalProfit += (t.financials?.profit || 0);
      
      const st = t.status || 'Pending';
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      
      const cty = t.country || 'Unknown';
      if (!destinations[cty]) destinations[cty] = { name: cty, count: 0, pax: 0 };
      destinations[cty].count++;
      destinations[cty].pax += (t.paxCount || 0);
    });

    const margin = totalOmset > 0 ? ((totalProfit / totalOmset) * 100).toFixed(1) : 0;
    const destArray = Object.values(destinations).sort((a, b) => b.pax - a.pax).slice(0, 5); // Top 5

    const statusData = [
      { name: 'Confirm', value: statusCounts.Confirm, color: '#10b981' },
      { name: 'Pending', value: statusCounts.Pending, color: '#f59e0b' },
      { name: 'Cancel', value: statusCounts.Cancel, color: '#ef4444' },
      { name: 'Past Date', value: statusCounts['Past Date'], color: '#3b82f6' }
    ].filter(s => s.value > 0);

    return { totalTours: filteredToursData.length, totalPax, totalOmset, totalProfit, margin, statusData, topDestinations: destArray };
  }, [filteredToursData]);
  const targetAchievementSales = salesMetrics.targetSales > 0 
    ? ((salesMetrics.achievementSales / salesMetrics.targetSales) * 100).toFixed(2) 
    : 0;
    
  const targetAchievementProfit = salesMetrics.targetProfit > 0 
    ? ((salesMetrics.achievementProfit / salesMetrics.targetProfit) * 100).toFixed(2) 
    : 0;

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="section-title" style={{ marginBottom: 0 }}>Staff Performance Overview</h1>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <Calendar size={18} color="var(--text-muted)" />
                  <input 
                    type="month" 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', padding: 0 }}
                  />
                  {period && (
                    <button onClick={() => setPeriod('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>Clear</button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <UserCheck size={18} color="var(--primary)" />
                  {isStaffRole ? (
                     <span style={{ fontWeight: '500' }}>{user?.name}</span>
                  ) : (
                    <select 
                      value={selectedStaff} 
                      onChange={e => setSelectedStaff(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', cursor: 'pointer', fontWeight: '500', padding: 0 }}
                    >
                      <option value="All" style={{ background: '#1e293b' }}>All Staff Overview</option>
                      {activeStaff.map(u => <option key={u.id} value={u.name} style={{ background: '#1e293b' }}>{u.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <button 
                className={`tab-btn ${activeTab === 'productivity' ? 'active' : ''}`}
                onClick={() => setActiveTab('productivity')}
              >
                <BarChartIcon size={16} /> Productivity Breakdown
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tours_data' ? 'active' : ''}`}
                onClick={() => setActiveTab('tours_data')}
              >
                <Database size={16} /> Tours Data
              </button>
              <button 
                className={`tab-btn ${activeTab === 'target_sales' ? 'active' : ''}`}
                onClick={() => setActiveTab('target_sales')}
              >
                <Target size={16} /> Target & Sales
              </button>
            </div>

            {activeTab === 'productivity' && (
              <div className="fade-in">
                <div className="card">
                  <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                    <BarChartIcon size={20} color="#8b5cf6" /> Productivity Data Breakdown (Retail vs Corporate)
                  </h3>

                  {/* Cross Selling Rates */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderLeft: '4px solid #3b82f6', padding: '1rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Retail Cross-Sell (Hotel vs Flight)</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.25rem' }}>{crossSellMetrics.retailRate}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Based on Sales Volume</div>
                    </div>
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderLeft: '4px solid #8b5cf6', padding: '1rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Corporate Cross-Sell (Hotel vs Flight)</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '0.25rem' }}>{crossSellMetrics.corpRate}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Based on Sales Volume</div>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div style={{ height: '350px', width: '100%', marginBottom: '2rem' }}>
                    <ResponsiveContainer>
                      <BarChart data={productivityBreakdown} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="retailSales" name="Retail Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="corpSales" name="Corporate Sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>PRODUCT CATEGORY</th>
                          <th style={{ textAlign: 'right' }}>RETAIL SALES</th>
                          <th style={{ textAlign: 'right' }}>CORP SALES</th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid #334155' }}>TOTAL SALES</th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid #334155' }}>RETAIL PROFIT</th>
                          <th style={{ textAlign: 'right' }}>CORP PROFIT</th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid #334155' }}>TOTAL PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productivityBreakdown.map((row, idx) => {
                          const totalSales = row.retailSales + row.corpSales;
                          const totalProfit = row.retailProfit + row.corpProfit;
                          
                          const retailMargin = row.retailSales > 0 ? ((row.retailProfit / row.retailSales) * 100).toFixed(1) : 0;
                          const corpMargin = row.corpSales > 0 ? ((row.corpProfit / row.corpSales) * 100).toFixed(1) : 0;
                          const totalMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: '500' }}>{row.name}</td>
                              <td style={{ textAlign: 'right', color: '#3b82f6' }}>{formatCurrency(row.retailSales)}</td>
                              <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{formatCurrency(row.corpSales)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', borderLeft: '1px solid #334155' }}>Rp {formatCurrency(totalSales)}</td>
                              <td style={{ textAlign: 'right', color: '#10b981', borderLeft: '1px solid #334155' }}>
                                <div>{formatCurrency(row.retailProfit)}</div>
                                <div style={{ fontSize: '0.7rem', color: retailMargin >= 10 ? '#10b981' : retailMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{retailMargin}% margin</div>
                              </td>
                              <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                                <div>{formatCurrency(row.corpProfit)}</div>
                                <div style={{ fontSize: '0.7rem', color: corpMargin >= 10 ? '#10b981' : corpMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{corpMargin}% margin</div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', borderLeft: '1px solid #334155' }}>
                                <div>Rp {formatCurrency(totalProfit)}</div>
                                <div style={{ fontSize: '0.7rem', color: totalMargin >= 10 ? '#10b981' : totalMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{totalMargin}% margin</div>
                              </td>
                            </tr>
                          );
                        })}
                        {productivityBreakdown.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No productivity data found for this period/staff.</td>
                          </tr>
                        )}
                        {productivityBreakdown.length > 0 && (() => {
                          const tRS = productivityBreakdown.reduce((s, r) => s + r.retailSales, 0);
                          const tCS = productivityBreakdown.reduce((s, r) => s + r.corpSales, 0);
                          const tTS = tRS + tCS;
                          const tRP = productivityBreakdown.reduce((s, r) => s + r.retailProfit, 0);
                          const tCP = productivityBreakdown.reduce((s, r) => s + r.corpProfit, 0);
                          const tTP = tRP + tCP;

                          const gRetailMargin = tRS > 0 ? ((tRP / tRS) * 100).toFixed(1) : 0;
                          const gCorpMargin = tCS > 0 ? ((tCP / tCS) * 100).toFixed(1) : 0;
                          const gTotalMargin = tTS > 0 ? ((tTP / tTS) * 100).toFixed(1) : 0;

                          return (
                            <tr style={{ background: 'rgba(59, 130, 246, 0.05)', fontWeight: 'bold' }}>
                              <td style={{ color: '#eab308' }}>GRAND TOTAL</td>
                              <td style={{ textAlign: 'right', color: '#3b82f6' }}>{formatCurrency(tRS)}</td>
                              <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{formatCurrency(tCS)}</td>
                              <td style={{ textAlign: 'right', borderLeft: '1px solid #334155' }}>Rp {formatCurrency(tTS)}</td>
                              <td style={{ textAlign: 'right', color: '#10b981', borderLeft: '1px solid #334155' }}>
                                <div>{formatCurrency(tRP)}</div>
                                <div style={{ fontSize: '0.7rem', color: gRetailMargin >= 10 ? '#10b981' : gRetailMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{gRetailMargin}% margin</div>
                              </td>
                              <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                                <div>{formatCurrency(tCP)}</div>
                                <div style={{ fontSize: '0.7rem', color: gCorpMargin >= 10 ? '#10b981' : gCorpMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{gCorpMargin}% margin</div>
                              </td>
                              <td style={{ textAlign: 'right', color: '#10b981', borderLeft: '1px solid #334155' }}>
                                <div>Rp {formatCurrency(tTP)}</div>
                                <div style={{ fontSize: '0.7rem', color: gTotalMargin >= 10 ? '#10b981' : gTotalMargin >= 5 ? '#f59e0b' : '#ef4444' }}>{gTotalMargin}% margin</div>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'tours_data' && (
              <div className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Database size={24} color="#10b981" />
                  <h2 style={{ margin: 0, color: '#f8fafc' }}>Tour Performance Analytics</h2>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="card" style={{ borderBottom: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Tours Handled</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={28}/> {tourAnalytics.totalTours}</div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Passengers (Pax)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={28}/> {tourAnalytics.totalPax}</div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Tour Sales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={24}/> Rp {formatCurrency(tourAnalytics.totalOmset)}</div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Tour Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={24}/> Rp {formatCurrency(tourAnalytics.totalProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>
                      Margin: <span style={{ color: tourAnalytics.margin >= 10 ? '#10b981' : tourAnalytics.margin >= 5 ? '#f59e0b' : '#ef4444' }}>{tourAnalytics.margin}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {/* Status Pie Chart */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>Tour Status Breakdown</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      {tourAnalytics.statusData.length > 0 ? (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={tourAnalytics.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {tourAnalytics.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>

                  {/* Top Destinations Bar Chart */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>Top 5 Destinations (by Pax)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      {tourAnalytics.topDestinations.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart data={tourAnalytics.topDestinations} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} />
                            <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="pax" name="Passengers" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'target_sales' && (
              <div className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Target size={24} color="#f43f5e" />
                  <h2 style={{ margin: 0, color: '#f8fafc' }}>Target vs Achievement Analytics</h2>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="card" style={{ borderBottom: '4px solid #64748b' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Target Sales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#64748b', marginTop: '0.5rem' }}>Rp {formatCurrency(salesMetrics.targetSales)}</div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Achievement Sales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem' }}>Rp {formatCurrency(salesMetrics.achievementSales)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>
                      Achievement Rate: <span style={{ color: targetAchievementSales >= 100 ? '#10b981' : targetAchievementSales >= 70 ? '#f59e0b' : '#ef4444' }}>{targetAchievementSales}%</span>
                    </div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #64748b' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Target Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#64748b', marginTop: '0.5rem' }}>Rp {formatCurrency(salesMetrics.targetProfit)}</div>
                  </div>
                  <div className="card" style={{ borderBottom: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Achievement Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>Rp {formatCurrency(salesMetrics.achievementProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>
                      Achievement Rate: <span style={{ color: targetAchievementProfit >= 100 ? '#10b981' : targetAchievementProfit >= 70 ? '#f59e0b' : '#ef4444' }}>{targetAchievementProfit}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {/* Sales Comparison Chart */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} /> Sales: Target vs Achievement {staffNameFilter === 'All' ? '(by Staff)' : '(by Period)'}
                    </h3>
                    <div style={{ height: '350px', width: '100%' }}>
                      {salesChartData.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart data={salesChartData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="targetSales" name="Target Sales" fill="#64748b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="achievementSales" name="Achievement Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>

                  {/* Profit Comparison Chart */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={18} /> Profit: Target vs Achievement {staffNameFilter === 'All' ? '(by Staff)' : '(by Period)'}
                    </h3>
                    <div style={{ height: '350px', width: '100%' }}>
                      {salesChartData.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart data={salesChartData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="targetProfit" name="Target Profit" fill="#64748b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="achievementProfit" name="Achievement Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformance;
