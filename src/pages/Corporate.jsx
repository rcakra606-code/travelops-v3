import React, { useState, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useCorporate } from '../context/CorporateContext';
import { useUsers } from '../context/UserContext';
import { 
  Building, Briefcase, Plus, Edit2, Trash2, X, BarChart2, PieChart as PieChartIcon, 
  FileText, Database, TrendingUp, DollarSign, Activity, Calendar, Download, Upload, Users,
  Mail, Phone, ExternalLink, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const CATEGORIES = ['Flight', 'Hotel', 'Other', 'All Sales'];

const Corporate = () => {
  const { 
    corporateAccounts, addAccount, updateAccount, deleteAccount, bulkImportAccounts,
    corporateSales, addSales, updateSales, deleteSales, bulkImportSales 
  } = useCorporate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');
  
  // Matrix Table State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [matrixCategory, setMatrixCategory] = useState('All');

  // Comparison Tab State
  const [compLevel, setCompLevel] = useState('Month');
  const [compPeriodA, setCompPeriodA] = useState(`${new Date().getFullYear()}-01`);
  const [compPeriodB, setCompPeriodB] = useState(`${new Date().getFullYear()}-02`);
  const [compAccount, setCompAccount] = useState('All');
  const [compCategory, setCompCategory] = useState('All');

  // Modals State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [editingSales, setEditingSales] = useState(null);
  
  const fileInputSalesRef = useRef(null);

  // Initial Data
  const initialAccountData = {
    accountCode: '', corporateName: '', address: '', creditLimit: '', status: 'Active',
    picName: '', picPhone: '', picOfficeEmail: '', picPersonalEmail: '', remarks: '',
    flightFee: { domestic: 0, international: 0, reissued: 0, refund: 0, void: 0, revalidate: 0 },
    hotelFee: { domestic: 0, international: 0, reissued: 0, refund: 0, void: 0, revalidate: 0 },
    airlinesCode: '', detailLink: ''
  };

  const initialSalesData = {
    date: '', accountCode: '', category: 'Flight', salesAmount: '', profitAmount: '', remarks: ''
  };

  const [accountFormData, setAccountFormData] = useState(initialAccountData);
  const [salesFormData, setSalesFormData] = useState(initialSalesData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  // Filtering Sales
  const filteredSales = useMemo(() => {
    let data = corporateSales;
    if (selectedAccountFilter !== 'All') {
      data = data.filter(r => r.accountCode === selectedAccountFilter);
    }
    return data;
  }, [corporateSales, selectedAccountFilter]);

  // Dashboard Logic
  const totalSales = filteredSales.reduce((sum, r) => sum + r.salesAmount, 0);
  const totalProfit = filteredSales.reduce((sum, r) => sum + r.profitAmount, 0);
  const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0;
  const activeAccountsCount = corporateAccounts.filter(a => a.status === 'Active').length;

  // Chart: Sales by Category
  const catMap = {};
  CATEGORIES.forEach(c => catMap[c] = { name: c, Sales: 0, Profit: 0 });
  filteredSales.forEach(r => {
    if (catMap[r.category]) {
      catMap[r.category].Sales += r.salesAmount;
      catMap[r.category].Profit += r.profitAmount;
    }
  });
  const catBarData = Object.values(catMap).sort((a, b) => b.Sales - a.Sales);

  // Chart: Top 5 Accounts by Sales
  const accMap = {};
  filteredSales.forEach(r => {
    if (!accMap[r.accountCode]) accMap[r.accountCode] = { name: r.accountCode, Sales: 0, Profit: 0 };
    accMap[r.accountCode].Sales += r.salesAmount;
    accMap[r.accountCode].Profit += r.profitAmount;
  });
  const topAccountsData = Object.values(accMap).sort((a, b) => b.Sales - a.Sales).slice(0, 5);

  // Chart: Trend over time
  const trendMap = {};
  filteredSales.forEach(r => {
    if (!trendMap[r.date]) trendMap[r.date] = { date: r.date, Sales: 0, Profit: 0 };
    trendMap[r.date].Sales += r.salesAmount;
    trendMap[r.date].Profit += r.profitAmount;
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  // Comparison Table Data
  const comparisonData = useMemo(() => {
    const accData = {};
    corporateAccounts.forEach(acc => {
      if (selectedAccountFilter === 'All' || selectedAccountFilter === acc.accountCode) {
        accData[acc.accountCode] = {
          corporateName: acc.corporateName,
          months: {},
          ytdSales: 0,
          ytdProfit: 0,
          prevYtdSales: 0
        };
        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, '0');
          accData[acc.accountCode].months[m] = { sales: 0, profit: 0 };
        }
      }
    });

    corporateSales.forEach(sale => {
      if (!accData[sale.accountCode]) return;
      if (matrixCategory !== 'All' && sale.category !== matrixCategory) return;
      const [y, m] = sale.date.split('-');
      if (y === selectedYear) {
        accData[sale.accountCode].months[m].sales += sale.salesAmount;
        accData[sale.accountCode].months[m].profit += sale.profitAmount;
        accData[sale.accountCode].ytdSales += sale.salesAmount;
        accData[sale.accountCode].ytdProfit += sale.profitAmount;
      } else if (y === (parseInt(selectedYear) - 1).toString()) {
        accData[sale.accountCode].prevYtdSales += sale.salesAmount;
      }
    });

    return Object.values(accData);
  }, [corporateSales, corporateAccounts, selectedAccountFilter, selectedYear, matrixCategory]);

  // Product Mix Stacked Bar Data
  const productMixData = useMemo(() => {
    const mixMap = {};
    for (let i = 1; i <= 12; i++) {
      const m = i.toString().padStart(2, '0');
      mixMap[m] = { name: m, Flight: 0, Hotel: 0, Other: 0, 'All Sales': 0 };
    }
    filteredSales.forEach(r => {
      const [y, m] = r.date.split('-');
      if (y === selectedYear) {
        if (mixMap[m][r.category] !== undefined) mixMap[m][r.category] += r.salesAmount;
      }
    });
    return Object.values(mixMap);
  }, [filteredSales, selectedYear]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // --- PERIOD COMPARISON LOGIC ---
  const isInPeriod = (saleDate, periodStr, level) => {
    if (!saleDate || !periodStr) return false;
    const [sYear, sMonth] = saleDate.split('-');
    const m = parseInt(sMonth, 10);
    if (level === 'Month') return saleDate === periodStr;
    if (level === 'Year') return sYear === periodStr;
    if (level === 'Quarter') {
      const [pYear, pQ] = periodStr.split('-');
      if (sYear !== pYear) return false;
      if (pQ === 'Q1') return m >= 1 && m <= 3;
      if (pQ === 'Q2') return m >= 4 && m <= 6;
      if (pQ === 'Q3') return m >= 7 && m <= 9;
      if (pQ === 'Q4') return m >= 10 && m <= 12;
    }
    if (level === 'Semester') {
      const [pYear, pS] = periodStr.split('-');
      if (sYear !== pYear) return false;
      if (pS === 'S1') return m >= 1 && m <= 6;
      if (pS === 'S2') return m >= 7 && m <= 12;
    }
    return false;
  };

  const compData = useMemo(() => {
    const dataA = { sales: 0, profit: 0, accounts: {} };
    const dataB = { sales: 0, profit: 0, accounts: {} };
    
    corporateSales.forEach(s => {
      if (compAccount !== 'All' && s.accountCode !== compAccount) return;
      if (compCategory !== 'All' && s.category !== compCategory) return;
      
      const isA = isInPeriod(s.date, compPeriodA, compLevel);
      const isB = isInPeriod(s.date, compPeriodB, compLevel);
      
      if (isA || isB) {
        const target = isA ? dataA : dataB;
        target.sales += s.salesAmount;
        target.profit += s.profitAmount;
        if (!target.accounts[s.accountCode]) target.accounts[s.accountCode] = { sales: 0, profit: 0 };
        target.accounts[s.accountCode].sales += s.salesAmount;
        target.accounts[s.accountCode].profit += s.profitAmount;
      }
    });
    
    return { dataA, dataB };
  }, [corporateSales, compLevel, compPeriodA, compPeriodB, compAccount, compCategory]);

  const compGrowthSales = compData.dataB.sales > 0 ? ((compData.dataA.sales - compData.dataB.sales) / compData.dataB.sales * 100) : (compData.dataA.sales > 0 ? 100 : 0);
  const compGrowthProfit = compData.dataB.profit > 0 ? ((compData.dataA.profit - compData.dataB.profit) / compData.dataB.profit * 100) : (compData.dataA.profit > 0 ? 100 : 0);

  // Handlers for Account
  const handleOpenAccountModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc);
      setAccountFormData(acc);
    } else {
      setEditingAccount(null);
      setAccountFormData(initialAccountData);
    }
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccount(editingAccount.id, accountFormData);
    } else {
      addAccount(accountFormData);
    }
    setIsAccountModalOpen(false);
  };

  // Handlers for Sales
  const handleOpenSalesModal = (sale = null) => {
    if (sale) {
      setEditingSales(sale);
      setSalesFormData(sale);
    } else {
      setEditingSales(null);
      setSalesFormData(initialSalesData);
    }
    setIsSalesModalOpen(true);
  };

  const handleSalesSubmit = (e) => {
    e.preventDefault();
    if (editingSales) {
      updateSales(editingSales.id, salesFormData);
    } else {
      addSales(salesFormData);
    }
    setIsSalesModalOpen(false);
  };

  // Export Sales
  const handleExportSales = () => {
    const headers = ['id', 'date', 'accountCode', 'category', 'salesAmount', 'profitAmount', 'remarks'];
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };
    const csvRows = [headers.join(',')];
    filteredSales.forEach(row => {
      csvRows.push(headers.map(h => escapeCsv(row[h])).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Corporate_Sales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Sales
  const handleImportSales = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const str = event.target.result;
        const result = [];
        let row = [], inQuotes = false, currentVal = '';
        for (let i = 0; i < str.length; i++) {
          let char = str[i], nextChar = str[i+1];
          if (char === '"' && inQuotes && nextChar === '"') { currentVal += '"'; i++; }
          else if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { row.push(currentVal); currentVal = ''; }
          else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            if (currentVal !== '' || row.length > 0) { row.push(currentVal); result.push(row); }
            row = []; currentVal = '';
          } else currentVal += char;
        }
        if (currentVal !== '' || row.length > 0) { row.push(currentVal); result.push(row); }
        
        if (result.length < 2) return alert("Empty CSV");
        const headers = result[0];
        const importedData = [];
        for (let i = 1; i < result.length; i++) {
          if (result[i].length === 1 && result[i][0].trim() === '') continue;
          const obj = {};
          headers.forEach((h, idx) => obj[h.trim()] = result[i][idx] || '');
          if (obj.date && obj.accountCode && obj.category) importedData.push(obj);
        }
        if (importedData.length > 0) {
          bulkImportSales(importedData);
          alert(`Imported ${importedData.length} records!`);
        } else {
          alert('No valid records found.');
        }
      } catch (err) { alert('Failed to parse CSV'); }
      if (fileInputSalesRef.current) fileInputSalesRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="section-title" style={{ marginBottom: 0 }}>Corporate Dashboard</h1>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Account:</span>
                  <select 
                    value={selectedAccountFilter} onChange={e => setSelectedAccountFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <option value="All" style={{ background: '#1e293b', color: '#f8fafc' }}>All Accounts</option>
                    {corporateAccounts.map(a => <option key={a.id} value={a.accountCode} style={{ background: '#1e293b', color: '#f8fafc' }}>{a.accountCode} - {a.corporateName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <Activity size={18} /> Dashboard
              </button>
              <button className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
                <BarChart2 size={18} /> Period Comparison
              </button>
              <button className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
                <Building size={18} /> Corporate Accounts
              </button>
              <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
                <TrendingUp size={18} /> Corporate Sales
              </button>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'rgba(59, 130, 246, 0.15)', width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={16} color="#3b82f6"/> Total Corporate Sales</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.025em' }}>{formatCurrency(totalSales)}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'rgba(16, 185, 129, 0.15)', width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={16} color="#10b981"/> Total Corporate Profit</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.025em' }}>{formatCurrency(totalProfit)}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'rgba(139, 92, 246, 0.15)', width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} color="#8b5cf6"/> Overall Margin</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.025em' }}>{overallMargin}%</div>
                  </div>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'rgba(245, 158, 11, 0.15)', width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} color="#f59e0b"/> Active Accounts</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.025em' }}>{activeAccountsCount}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Sales & Profit Trend</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000000}M`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                          <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Sales by Category</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={catBarData.filter(d => d.Sales > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="Sales"
                          >
                            {catBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Top 5 Accounts by Sales</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <BarChart data={topAccountsData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000000}M`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                          <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Product Mix by Month</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <BarChart data={productMixData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000000}M`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar dataKey="Flight" stackId="a" fill="#3b82f6" barSize={30} />
                          <Bar dataKey="Hotel" stackId="a" fill="#10b981" />
                          <Bar dataKey="Other" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="All Sales" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflowX: 'auto', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Sales & Profit Comparison by Month</h3>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                      {[...Array(5)].map((_, i) => {
                        const year = (new Date().getFullYear() - 2 + i).toString();
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#cbd5e1', minWidth: '1400px' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                        <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'left', color: '#f59e0b', width: '200px' }}>Corporate</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <th key={m} colSpan="2" style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b', borderLeft: '1px solid #334155' }}>{m}</th>
                        ))}
                        <th colSpan="2" style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b', borderLeft: '1px solid #334155' }}>YTD Total</th>
                        <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b', borderLeft: '1px solid #334155' }}>Growth %</th>
                      </tr>
                      <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <React.Fragment key={i}>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: '#f59e0b', borderLeft: '1px solid #334155', width: '60px' }}>Sales</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: '#f59e0b', width: '60px' }}>Profit</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, idx) => {
                        const growth = row.prevYtdSales > 0 ? ((row.ytdSales - row.prevYtdSales) / row.prevYtdSales * 100) : (row.ytdSales > 0 ? 100 : 0);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.4)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '500', color: '#f8fafc' }}>{row.corporateName}</td>
                            {Array.from({ length: 12 }).map((_, i) => {
                              const m = (i + 1).toString().padStart(2, '0');
                              return (
                                <React.Fragment key={m}>
                                  <td style={{ padding: '0.75rem', textAlign: 'right', borderLeft: '1px solid #334155' }}>{row.months[m].sales === 0 ? 'Rp 0' : formatCurrency(row.months[m].sales)}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{row.months[m].profit === 0 ? 'Rp 0' : formatCurrency(row.months[m].profit)}</td>
                                </React.Fragment>
                              );
                            })}
                            <td style={{ padding: '0.75rem', textAlign: 'right', borderLeft: '1px solid #334155', fontWeight: '600', color: '#f8fafc' }}>{row.ytdSales === 0 ? 'Rp 0' : formatCurrency(row.ytdSales)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#f8fafc' }}>{row.ytdProfit === 0 ? 'Rp 0' : formatCurrency(row.ytdProfit)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', borderLeft: '1px solid #334155', color: growth > 0 ? '#10b981' : (growth < 0 ? '#ef4444' : '#94a3b8') }}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: PERIOD COMPARISON */}
            {activeTab === 'comparison' && (
              <div className="fade-in">
                {/* Controls */}
                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Comparison Settings</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Level</label>
                      <select value={compLevel} onChange={e => setCompLevel(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="Month">Month vs Month</option>
                        <option value="Quarter">Quarter vs Quarter</option>
                        <option value="Semester">Semester vs Semester</option>
                        <option value="Year">Year vs Year</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 'bold' }}>Period A (Actual)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'Q1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'Q1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'S1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'S1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>Period B (Baseline)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'Q1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'Q1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'S1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'S1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Account</label>
                      <select value={compAccount} onChange={e => setCompAccount(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="All">All Accounts</option>
                        {corporateAccounts.map(a => <option key={a.id} value={a.accountCode}>{a.accountCode} - {a.corporateName}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</label>
                      <select value={compCategory} onChange={e => setCompCategory(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>Total Sales Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc' }}>{formatCurrency(compData.dataA.sales)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#94a3b8' }}>{formatCurrency(compData.dataB.sales)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Variance / Growth:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: compGrowthSales > 0 ? '#10b981' : (compGrowthSales < 0 ? '#ef4444' : '#94a3b8'), background: compGrowthSales > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                        {compGrowthSales > 0 ? '+' : ''}{compGrowthSales.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>Total Profit Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc' }}>{formatCurrency(compData.dataA.profit)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#94a3b8' }}>{formatCurrency(compData.dataB.profit)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Variance / Growth:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: compGrowthProfit > 0 ? '#10b981' : (compGrowthProfit < 0 ? '#ef4444' : '#94a3b8'), background: compGrowthProfit > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                        {compGrowthProfit > 0 ? '+' : ''}{compGrowthProfit.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                  {/* Side-by-side Chart */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1rem' }}>Sales: {compPeriodA} vs {compPeriodB}</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <BarChart data={[{ name: 'Sales Comparison', PeriodA: compData.dataA.sales, PeriodB: compData.dataB.sales }]} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" tickFormatter={(val) => `Rp${val/1000000}M`} tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="PeriodA" name={`Period A (${compPeriodA})`} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                          <Bar dataKey="PeriodB" name={`Period B (${compPeriodB})`} fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Account Breakdown Table */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1rem' }}>Account Breakdown (Sales)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Account Code</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#3b82f6' }}>Period A</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#10b981' }}>Period B</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#94a3b8' }}>Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys({...compData.dataA.accounts, ...compData.dataB.accounts}).map(accCode => {
                          const valA = compData.dataA.accounts[accCode]?.sales || 0;
                          const valB = compData.dataB.accounts[accCode]?.sales || 0;
                          const varPct = valB > 0 ? ((valA - valB) / valB * 100) : (valA > 0 ? 100 : 0);
                          return (
                            <tr key={accCode} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '0.75rem', color: '#f8fafc', fontWeight: '500' }}>{accCode}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(valA)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(valB)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: varPct > 0 ? '#10b981' : (varPct < 0 ? '#ef4444' : '#94a3b8') }}>
                                {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {Object.keys({...compData.dataA.accounts, ...compData.dataB.accounts}).length === 0 && (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No data for selected periods.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PERIOD COMPARISON */}
            {activeTab === 'comparison' && (
              <div className="fade-in">
                {/* Controls */}
                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Comparison Settings</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Level</label>
                      <select value={compLevel} onChange={e => setCompLevel(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="Month">Month vs Month</option>
                        <option value="Quarter">Quarter vs Quarter</option>
                        <option value="Semester">Semester vs Semester</option>
                        <option value="Year">Year vs Year</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 'bold' }}>Period A (Actual)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'Q1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'Q1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'S1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'S1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>Period B (Baseline)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'Q1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'Q1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'S1'}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'S1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Account</label>
                      <select value={compAccount} onChange={e => setCompAccount(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="All">All Accounts</option>
                        {corporateAccounts.map(a => <option key={a.id} value={a.accountCode}>{a.accountCode} - {a.corporateName}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Category</label>
                      <select value={compCategory} onChange={e => setCompCategory(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>Total Sales Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc' }}>{formatCurrency(compData.dataA.sales)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#94a3b8' }}>{formatCurrency(compData.dataB.sales)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Variance / Growth:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: compGrowthSales > 0 ? '#10b981' : (compGrowthSales < 0 ? '#ef4444' : '#94a3b8'), background: compGrowthSales > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                        {compGrowthSales > 0 ? '+' : ''}{compGrowthSales.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>Total Profit Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc' }}>{formatCurrency(compData.dataA.profit)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#94a3b8' }}>{formatCurrency(compData.dataB.profit)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Variance / Growth:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: compGrowthProfit > 0 ? '#10b981' : (compGrowthProfit < 0 ? '#ef4444' : '#94a3b8'), background: compGrowthProfit > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                        {compGrowthProfit > 0 ? '+' : ''}{compGrowthProfit.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                  {/* Side-by-side Chart */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1rem' }}>Sales: {compPeriodA} vs {compPeriodB}</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <BarChart data={[{ name: 'Sales Comparison', PeriodA: compData.dataA.sales, PeriodB: compData.dataB.sales }]} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" tickFormatter={(val) => `Rp${val/1000000}M`} tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="PeriodA" name={`Period A (${compPeriodA})`} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                          <Bar dataKey="PeriodB" name={`Period B (${compPeriodB})`} fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Account Breakdown Table */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1rem' }}>Account Breakdown (Sales)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Account Code</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#3b82f6' }}>Period A</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#10b981' }}>Period B</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: '#94a3b8' }}>Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys({...compData.dataA.accounts, ...compData.dataB.accounts}).map(accCode => {
                          const valA = compData.dataA.accounts[accCode]?.sales || 0;
                          const valB = compData.dataB.accounts[accCode]?.sales || 0;
                          const varPct = valB > 0 ? ((valA - valB) / valB * 100) : (valA > 0 ? 100 : 0);
                          return (
                            <tr key={accCode} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '0.75rem', color: '#f8fafc', fontWeight: '500' }}>{accCode}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(valA)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(valB)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: varPct > 0 ? '#10b981' : (varPct < 0 ? '#ef4444' : '#94a3b8') }}>
                                {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {Object.keys({...compData.dataA.accounts, ...compData.dataB.accounts}).length === 0 && (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No data for selected periods.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACCOUNTS */}
            {activeTab === 'accounts' && (
              <div className="card fade-in" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Corporate Accounts Database</h3>
                  <button className="btn btn-primary" onClick={() => handleOpenAccountModal()}>
                    <Plus size={16} /> New Account
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>CODE</th>
                      <th>CORPORATE NAME</th>
                      <th>PIC DETAILS</th>
                      <th>CREDIT LIMIT</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corporateAccounts.map(acc => (
                      <tr key={acc.id}>
                        <td style={{ fontWeight: '500', color: '#3b82f6' }}>{acc.accountCode}</td>
                        <td>{acc.corporateName}</td>
                        <td>
                          <div>{acc.picName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Phone size={10} style={{marginRight:'4px'}}/>{acc.picPhone}</div>
                        </td>
                        <td>{formatCurrency(acc.creditLimit)}</td>
                        <td>
                          <span className={`badge ${acc.status === 'Active' ? 'badge-primary' : 'badge-danger'}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn view" onClick={() => setViewingAccount(acc)} title="View Detail" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Eye size={16} /></button>
                            <button className="action-btn edit" onClick={() => handleOpenAccountModal(acc)} title="Edit"><Edit2 size={16} /></button>
                            <button className="action-btn delete" onClick={() => window.confirm('Delete account?') && deleteAccount(acc.id)} title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {corporateAccounts.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No accounts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: SALES */}
            {activeTab === 'sales' && (
              <div className="card fade-in" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Corporate Sales Database</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6' }} onClick={handleExportSales}>
                      <Download size={16} /> Export CSV
                    </button>
                    <button className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }} onClick={() => fileInputSalesRef.current?.click()}>
                      <Upload size={16} /> Import CSV
                    </button>
                    <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputSalesRef} onChange={handleImportSales} />
                    <button className="btn btn-primary" onClick={() => handleOpenSalesModal()}>
                      <Plus size={16} /> Add Sales
                    </button>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PERIOD</th>
                      <th>ACCOUNT</th>
                      <th>CATEGORY</th>
                      <th>SALES</th>
                      <th>PROFIT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.date}</td>
                        <td style={{ fontWeight: '500' }}>{rec.accountCode}</td>
                        <td>{rec.category}</td>
                        <td style={{ color: '#10b981', fontWeight: '500' }}>{formatCurrency(rec.salesAmount)}</td>
                        <td style={{ color: '#f59e0b', fontWeight: '500' }}>{formatCurrency(rec.profitAmount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn edit" onClick={() => handleOpenSalesModal(rec)}><Edit2 size={16} /></button>
                            <button className="action-btn delete" onClick={() => window.confirm('Delete?') && deleteSales(rec.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSales.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No sales data found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ACCOUNT MODAL */}
      {isAccountModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editingAccount ? 'Edit Corporate Account' : 'New Corporate Account'}</h2>
              <button className="close-btn" onClick={() => setIsAccountModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAccountSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
                {/* General Info */}
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>General Information</h4>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                      <label>Account Code<span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" required value={accountFormData.accountCode} onChange={e => setAccountFormData({...accountFormData, accountCode: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Corporate Name<span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" required value={accountFormData.corporateName} onChange={e => setAccountFormData({...accountFormData, corporateName: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Status</label>
                      <select value={accountFormData.status} onChange={e => setAccountFormData({...accountFormData, status: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Credit Limit (IDR)</label>
                      <input type="number" value={accountFormData.creditLimit} onChange={e => setAccountFormData({...accountFormData, creditLimit: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Address</label>
                      <input type="text" value={accountFormData.address} onChange={e => setAccountFormData({...accountFormData, address: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                  </div>
                </div>

                {/* PIC Info */}
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>PIC / Booker Details</h4>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                      <label>PIC Name</label>
                      <input type="text" value={accountFormData.picName} onChange={e => setAccountFormData({...accountFormData, picName: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input type="text" value={accountFormData.picPhone} onChange={e => setAccountFormData({...accountFormData, picPhone: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Office Email</label>
                      <input type="email" value={accountFormData.picOfficeEmail} onChange={e => setAccountFormData({...accountFormData, picOfficeEmail: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Personal Email</label>
                      <input type="email" value={accountFormData.picPersonalEmail} onChange={e => setAccountFormData({...accountFormData, picPersonalEmail: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                  </div>
                </div>

                {/* Service Fees */}
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b' }}>Service Fees (IDR)</h4>
                  
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>Flight Fees</h5>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
                    {['domestic', 'international', 'reissued', 'refund', 'void', 'revalidate'].map(fee => (
                      <div className="input-group" key={`flight-${fee}`}>
                        <label style={{ fontSize: '0.75rem' }}>{fee.charAt(0).toUpperCase() + fee.slice(1)}</label>
                        <input type="number" value={accountFormData.flightFee[fee]} onChange={e => setAccountFormData({...accountFormData, flightFee: {...accountFormData.flightFee, [fee]: e.target.value}})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                      </div>
                    ))}
                  </div>

                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>Hotel Fees</h5>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {['domestic', 'international', 'reissued', 'refund', 'void', 'revalidate'].map(fee => (
                      <div className="input-group" key={`hotel-${fee}`}>
                        <label style={{ fontSize: '0.75rem' }}>{fee.charAt(0).toUpperCase() + fee.slice(1)}</label>
                        <input type="number" value={accountFormData.hotelFee[fee]} onChange={e => setAccountFormData({...accountFormData, hotelFee: {...accountFormData.hotelFee, [fee]: e.target.value}})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Others */}
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#8b5cf6' }}>Additional Details</h4>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                      <label>Airlines Corporate Account Code</label>
                      <input type="text" placeholder="e.g. GA-12345" value={accountFormData.airlinesCode} onChange={e => setAccountFormData({...accountFormData, airlinesCode: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group">
                      <label>Detail Link (Drive / CRM)</label>
                      <input type="text" placeholder="https://" value={accountFormData.detailLink} onChange={e => setAccountFormData({...accountFormData, detailLink: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                    </div>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Remarks</label>
                      <textarea value={accountFormData.remarks} onChange={e => setAccountFormData({...accountFormData, remarks: e.target.value})} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', minHeight: '60px' }} />
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsAccountModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAccount ? 'Save Changes' : 'Add Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALES MODAL */}
      {isSalesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingSales ? 'Edit Sales Record' : 'Add Sales Record'}</h2>
              <button className="close-btn" onClick={() => setIsSalesModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSalesSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Period (Month/Year)<span style={{color: '#ef4444'}}>*</span></label>
                  <input type="month" required value={salesFormData.date} onChange={e => setSalesFormData({...salesFormData, date: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                </div>
                <div className="input-group">
                  <label>Account<span style={{color: '#ef4444'}}>*</span></label>
                  <select required value={salesFormData.accountCode} onChange={e => setSalesFormData({...salesFormData, accountCode: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <option value="" disabled>Select Account</option>
                    {corporateAccounts.map(a => <option key={a.id} value={a.accountCode}>{a.accountCode} - {a.corporateName}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Category<span style={{color: '#ef4444'}}>*</span></label>
                  <select required value={salesFormData.category} onChange={e => setSalesFormData({...salesFormData, category: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Sales Amount (IDR)<span style={{color: '#ef4444'}}>*</span></label>
                  <input type="number" required value={salesFormData.salesAmount} onChange={e => setSalesFormData({...salesFormData, salesAmount: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                </div>
                <div className="input-group">
                  <label>Profit Amount (IDR)<span style={{color: '#ef4444'}}>*</span></label>
                  <input type="number" required value={salesFormData.profitAmount} onChange={e => setSalesFormData({...salesFormData, profitAmount: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem' }} />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Remarks</label>
                  <textarea value={salesFormData.remarks} onChange={e => setSalesFormData({...salesFormData, remarks: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', minHeight: '60px' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsSalesModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSales ? 'Save Changes' : 'Add Sales'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ACCOUNT MODAL */}
      {viewingAccount && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', padding: '0' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderRadius: '8px 8px 0 0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>{viewingAccount.corporateName}</h2>
                  <span className={`badge ${viewingAccount.status === 'Active' ? 'badge-primary' : 'badge-danger'}`}>{viewingAccount.status}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={14} /> {viewingAccount.accountCode}
                </div>
              </div>
              <button className="close-btn" onClick={() => setViewingAccount(null)}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h4 style={{ color: '#3b82f6', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Corporate Profile</h4>
                  <div style={{ display: 'grid', gap: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Address:</span> <span>{viewingAccount.address || '-'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Credit Limit:</span> <span style={{ color: '#10b981', fontWeight: '600' }}>{formatCurrency(viewingAccount.creditLimit || 0)}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Airlines Code:</span> <span>{viewingAccount.airlinesCode || '-'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Detail Link:</span> 
                      {viewingAccount.detailLink ? <a href={viewingAccount.detailLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>Open Link <ExternalLink size={12}/></a> : '-'}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ color: '#10b981', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>PIC / Booker Info</h4>
                  <div style={{ display: 'grid', gap: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Name:</span> <span style={{ fontWeight: '500', color: '#f8fafc' }}>{viewingAccount.picName || '-'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Phone:</span> <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {viewingAccount.picPhone || '-'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Office Email:</span> <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14}/> {viewingAccount.picOfficeEmail || '-'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><span style={{ color: '#94a3b8' }}>Personal Email:</span> <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14}/> {viewingAccount.picPersonalEmail || '-'}</span></div>
                  </div>
                </div>
              </div>

              <h4 style={{ color: '#f59e0b', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Service Fees Profile (IDR)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th colSpan="2" style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px' }}>Flight Fees</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(viewingAccount.flightFee || {}).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', textTransform: 'capitalize' }}>{k}</td>
                        <td style={{ padding: '0.5rem', color: '#f8fafc', fontWeight: '500', textAlign: 'right' }}>{formatCurrency(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th colSpan="2" style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px' }}>Hotel Fees</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(viewingAccount.hotelFee || {}).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', textTransform: 'capitalize' }}>{k}</td>
                        <td style={{ padding: '0.5rem', color: '#f8fafc', fontWeight: '500', textAlign: 'right' }}>{formatCurrency(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {viewingAccount.remarks && (
                <div>
                  <h4 style={{ color: '#8b5cf6', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Remarks</h4>
                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    "{viewingAccount.remarks}"
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'flex-end', borderRadius: '0 0 8px 8px' }}>
               <button className="btn btn-primary" onClick={() => { setViewingAccount(null); handleOpenAccountModal(viewingAccount); }}>
                 <Edit2 size={16} /> Edit Account
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Corporate;
