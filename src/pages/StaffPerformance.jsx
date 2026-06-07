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
import { UserCheck, TrendingUp, DollarSign, Target, Briefcase, Clock, CreditCard, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const staffNameFilter = isStaffRole ? user?.name : selectedStaff;

  const performanceMetrics = useMemo(() => {
    let t_omset = 0; let t_profit = 0; let t_count = 0; let t_pax = 0;
    let c_omset = 0; let c_profit = 0; let c_count = 0; let c_pax = 0;
    let h_omset = 0; let h_profit = 0; let h_count = 0;
    let d_omset = 0; let d_profit = 0; let d_count = 0;
    let p_omset = 0; let p_profit = 0; let p_count = 0;
    
    // Tours
    tours.forEach(t => {
      if (staffNameFilter === 'All' || t.staffName === staffNameFilter) {
        if (!period || (t.departureDate && t.departureDate.startsWith(period))) {
          t_count++;
          t_pax += (t.paxCount || 0);
          t_omset += (t.financials?.totalOmset || 0);
          t_profit += (t.financials?.profit || 0);
        }
      }
    });

    // Cruises
    cruises.forEach(c => {
      if (staffNameFilter === 'All' || c.staff === staffNameFilter) {
        if (!period || (c.departureDate && c.departureDate.startsWith(period))) {
          c_count++;
          c_pax += (c.paxCount || 0);
          c_omset += (c.financials?.totalOmset || 0);
          c_profit += (c.financials?.profit || 0);
        }
      }
    });

    // Hotels
    hotels.forEach(h => {
      if (staffNameFilter === 'All' || h.staff === staffNameFilter) {
        if (!period || (h.checkIn && h.checkIn.startsWith(period))) {
          h_count++;
          h_omset += (h.financials?.totalOmset || 0);
          h_profit += (h.financials?.profit || 0);
        }
      }
    });

    // Documents
    documents.forEach(d => {
      if (staffNameFilter === 'All' || d.staff === staffNameFilter) {
        if (!period || (d.submissionDate && d.submissionDate.startsWith(period))) {
          d_count++;
          d_omset += (d.financials?.sellingPrice || 0);
          d_profit += (d.financials?.profit || 0);
        }
      }
    });

    // Productivity
    productivityData.forEach(p => {
      if (staffNameFilter === 'All' || p.staff === staffNameFilter) {
        if (!period || (p.date && p.date.startsWith(period))) {
          p_count++;
          p_omset += (p.salesAmount || 0);
          p_profit += (p.profitAmount || 0);
        }
      }
    });

    // Overtime
    let o_hours = 0;
    overtimes.forEach(o => {
      if (staffNameFilter === 'All' || o.staff === staffNameFilter) {
        if (!period || (o.date && o.date.startsWith(period))) {
           o_hours += Number(o.hours) || 0;
        }
      }
    });

    // Cashouts
    let cash_amount = 0;
    if (cashoutRequests) {
      cashoutRequests.forEach(c => {
        if (staffNameFilter === 'All' || c.staffName === staffNameFilter) {
          if (!period || (c.requestDate && c.requestDate.startsWith(period))) { 
            cash_amount += (c.totalAmount || 0);
          }
        }
      });
    }

    return {
      tours: { count: t_count, pax: t_pax, omset: t_omset, profit: t_profit },
      cruises: { count: c_count, pax: c_pax, omset: c_omset, profit: c_profit },
      hotels: { count: h_count, omset: h_omset, profit: h_profit },
      documents: { count: d_count, omset: d_omset, profit: d_profit },
      productivity: { count: p_count, omset: p_omset, profit: p_profit },
      overtime: { hours: o_hours },
      cashout: { amount: cash_amount },
      totalOmset: t_omset + c_omset + h_omset + d_omset + p_omset,
      totalProfit: t_profit + c_profit + h_profit + d_profit + p_profit,
      totalCount: t_count + c_count + h_count + d_count + p_count,
    };

  }, [tours, cruises, hotels, documents, productivityData, overtimes, cashoutRequests, staffNameFilter, period]);

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

  const barData = [
    { name: 'Tours', Sales: performanceMetrics.tours.omset, Profit: performanceMetrics.tours.profit },
    { name: 'Cruises', Sales: performanceMetrics.cruises.omset, Profit: performanceMetrics.cruises.profit },
    { name: 'Hotels', Sales: performanceMetrics.hotels.omset, Profit: performanceMetrics.hotels.profit },
    { name: 'Documents', Sales: performanceMetrics.documents.omset, Profit: performanceMetrics.documents.profit },
    { name: 'Productivity', Sales: performanceMetrics.productivity.omset, Profit: performanceMetrics.productivity.profit }
  ];

  const overallMargin = performanceMetrics.totalOmset > 0 
    ? ((performanceMetrics.totalProfit / performanceMetrics.totalOmset) * 100).toFixed(2) 
    : 0;

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

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ borderBottom: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Global Revenue</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem' }}>
                  Rp {formatCurrency(performanceMetrics.totalOmset)}
                </div>
              </div>
              <div className="card" style={{ borderBottom: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Global Profit</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>
                  Rp {formatCurrency(performanceMetrics.totalProfit)}
                </div>
              </div>
              <div className="card" style={{ borderBottom: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Global Margin</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem' }}>
                  {overallMargin}%
                </div>
              </div>
              <div className="card" style={{ borderBottom: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Bookings/Actions</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '0.5rem' }}>
                  {performanceMetrics.totalCount}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Sales Target vs Achievement */}
              <div className="card" style={{ border: '1px solid #334155', background: 'rgba(30, 41, 59, 0.5)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                  <Target size={20} color="#f59e0b" /> Sales Target vs Achievement (Sales Module)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Target Sales</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Rp {formatCurrency(salesMetrics.targetSales)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Achievement Sales</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>Rp {formatCurrency(salesMetrics.achievementSales)}</div>
                    <div style={{ fontSize: '0.875rem', color: targetAchievementSales >= 100 ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>{targetAchievementSales}% Reached</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Target Profit</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Rp {formatCurrency(salesMetrics.targetProfit)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Achievement Profit</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>Rp {formatCurrency(salesMetrics.achievementProfit)}</div>
                    <div style={{ fontSize: '0.875rem', color: targetAchievementProfit >= 100 ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>{targetAchievementProfit}% Reached</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="card">
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                  <Activity size={20} color="#3b82f6" /> Sales & Profit Breakdown by Module
                </h3>
                <div style={{ height: '350px', width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={barData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Detailed Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                <Briefcase size={20} color="#8b5cf6" /> Detailed Module Performance
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MODULE</th>
                    <th style={{ textAlign: 'right' }}>ITEMS HANDLED</th>
                    <th style={{ textAlign: 'right' }}>PAX COUNT</th>
                    <th style={{ textAlign: 'right' }}>TOTAL SALES / OMSET</th>
                    <th style={{ textAlign: 'right' }}>TOTAL PROFIT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '500' }}>Tours</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.tours.count}</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.tours.pax}</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.tours.omset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.tours.profit)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>Cruises</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.cruises.count}</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.cruises.pax}</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.cruises.omset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.cruises.profit)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>Hotels</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.hotels.count}</td>
                    <td style={{ textAlign: 'right' }}>-</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.hotels.omset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.hotels.profit)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>Documents</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.documents.count}</td>
                    <td style={{ textAlign: 'right' }}>-</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.documents.omset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.documents.profit)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>Productivity (Other)</td>
                    <td style={{ textAlign: 'right' }}>{performanceMetrics.productivity.count}</td>
                    <td style={{ textAlign: 'right' }}>-</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.productivity.omset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.productivity.profit)}</td>
                  </tr>
                  <tr style={{ background: 'rgba(59, 130, 246, 0.05)', fontWeight: 'bold' }}>
                    <td style={{ color: '#eab308' }}>GRAND TOTAL</td>
                    <td style={{ textAlign: 'right', color: '#eab308' }}>{performanceMetrics.totalCount}</td>
                    <td style={{ textAlign: 'right', color: '#eab308' }}>{performanceMetrics.tours.pax + performanceMetrics.cruises.pax}</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>Rp {formatCurrency(performanceMetrics.totalOmset)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>Rp {formatCurrency(performanceMetrics.totalProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <CreditCard size={20} /> Total Cashout (Advances)
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  Rp {formatCurrency(performanceMetrics.cashout.amount)}
                </div>
              </div>
              <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                  <Clock size={20} /> Total Overtime Logged
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {performanceMetrics.overtime.hours.toFixed(1)} Hours
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformance;
