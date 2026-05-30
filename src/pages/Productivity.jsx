import React, { useState, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useProductivity } from '../context/ProductivityContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, X, BarChart2, PieChart as PieChartIcon, 
  FileText, Database, TrendingUp, DollarSign, Activity, Calendar, Download, Upload
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const CATEGORIES = [
  'Flight', 'Hotel', 'Tour', 'Package', 'Cruise', 
  'Admission', 'Passport', 'Visa', 'Insurance', 'Train', 'Other'
];
const TYPES = ['Retail', 'Corporate'];

const Productivity = () => {
  const { productivityData, addRecord, updateRecord, deleteRecord, bulkImport } = useProductivity();
  const { users } = useUsers();
  const { user } = useAuth();
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  
  const filteredData = useMemo(() => {
    if (selectedStaffFilter === 'All') return productivityData;
    return productivityData.filter(r => r.staff === selectedStaffFilter);
  }, [productivityData, selectedStaffFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const fileInputRef = useRef(null);
  
  const initialFormData = {
    date: '',
    staff: '',
    category: 'Flight',
    type: 'Retail',
    salesAmount: '',
    profitAmount: '',
    remarks: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  // Report & Comparison State
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const lastYearMonth = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [reportStart, setReportStart] = useState(currentMonth);
  const [reportEnd, setReportEnd] = useState(currentMonth);

  // Advanced Comparison State
  const [comparisonMode, setComparisonMode] = useState('type'); // 'type' or 'period'
  const [compP1Start, setCompP1Start] = useState(currentMonth);
  const [compP1End, setCompP1End] = useState(currentMonth);
  const [compP2Start, setCompP2Start] = useState(lastYearMonth);
  const [compP2End, setCompP2End] = useState(lastYearMonth);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canAdd = isAdmin || isManager;

  const handleOpenModal = (rec = null) => {
    if (rec) {
      setEditingRec(rec);
      setFormData(rec);
    } else {
      setEditingRec(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRec(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRec) {
      updateRecord(editingRec.id, formData);
    } else {
      addRecord(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(id);
    }
  };

  const handleExport = () => {
    const headers = ['id', 'date', 'staff', 'category', 'type', 'salesAmount', 'profitAmount', 'remarks'];
    
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [];
    csvRows.push(headers.join(','));

    filteredData.forEach(row => {
      const values = headers.map(header => escapeCsv(row[header]));
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Productivity_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (str) => {
    const result = [];
    let row = [];
    let inQuotes = false;
    let currentVal = '';
    
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      let nextChar = str[i+1];
      
      if (char === '"' && inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal);
        currentVal = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        if (currentVal !== '' || row.length > 0) {
          row.push(currentVal);
          result.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal !== '' || row.length > 0) {
      row.push(currentVal);
      result.push(row);
    }
    return result;
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        
        if (parsed.length < 2) {
          alert("CSV file is empty or missing data.");
          return;
        }

        const headers = parsed[0];
        const importedData = [];

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          // Skip completely empty rows
          if (row.length === 1 && row[0].trim() === '') continue;
          
          const obj = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = row[index] !== undefined ? row[index] : '';
          });
          
          // Basic validation to ensure it's a valid row
          if (obj.date && obj.category) {
             importedData.push(obj);
          }
        }

        if (importedData.length > 0) {
          bulkImport(importedData);
          alert(`Successfully imported ${importedData.length} records!`);
        } else {
          alert('No valid records found. Ensure CSV format matches the export format.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const inputStyle = {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    borderRadius: '0.5rem',
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    outline: 'none'
  };

  const iconStyle = {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none'
  };

  // ==========================================
  // LOGIC: OVERVIEW DASHBOARD
  // ==========================================
  const totalSales = filteredData.reduce((sum, r) => sum + r.salesAmount, 0);
  const totalProfit = filteredData.reduce((sum, r) => sum + r.profitAmount, 0);
  const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0;

  // Pie chart Retail vs Corporate
  const typeMap = { Retail: 0, Corporate: 0 };
  filteredData.forEach(r => { if (typeMap[r.type] !== undefined) typeMap[r.type] += r.profitAmount; });
  const typePieData = [
    { name: 'Retail Profit', value: typeMap.Retail, color: '#3b82f6' },
    { name: 'Corporate Profit', value: typeMap.Corporate, color: '#8b5cf6' }
  ];

  // Bar chart Categories Sales & Profit
  const catMap = {};
  CATEGORIES.forEach(c => catMap[c] = { name: c, Sales: 0, Profit: 0 });
  filteredData.forEach(r => {
    if (catMap[r.category]) {
      catMap[r.category].Sales += r.salesAmount;
      catMap[r.category].Profit += r.profitAmount;
    }
  });
  const catBarData = Object.values(catMap).sort((a, b) => b.Sales - a.Sales);

  // ==========================================
  // LOGIC: COMPARISON DASHBOARD
  // ==========================================
  const compTypeData = useMemo(() => {
    const data = filteredData.filter(r => r.date >= compP1Start && r.date <= compP1End);
    const map = {};
    CATEGORIES.forEach(c => {
      map[c] = { name: c, RetailSales: 0, CorporateSales: 0, RetailProfit: 0, CorporateProfit: 0 };
    });
    data.forEach(r => {
      if (map[r.category]) {
        if (r.type === 'Retail') {
          map[r.category].RetailSales += r.salesAmount;
          map[r.category].RetailProfit += r.profitAmount;
        } else {
          map[r.category].CorporateSales += r.salesAmount;
          map[r.category].CorporateProfit += r.profitAmount;
        }
      }
    });
    return Object.values(map);
  }, [filteredData, compP1Start, compP1End]);

  const compPeriodData = useMemo(() => {
    const dataP1 = filteredData.filter(r => r.date >= compP1Start && r.date <= compP1End);
    const dataP2 = filteredData.filter(r => r.date >= compP2Start && r.date <= compP2End);
    
    const map = {};
    CATEGORIES.forEach(c => {
      map[c] = { name: c, P1Sales: 0, P2Sales: 0, P1Profit: 0, P2Profit: 0 };
    });
    
    dataP1.forEach(r => {
      if (map[r.category]) {
        map[r.category].P1Sales += r.salesAmount;
        map[r.category].P1Profit += r.profitAmount;
      }
    });
    
    dataP2.forEach(r => {
      if (map[r.category]) {
        map[r.category].P2Sales += r.salesAmount;
        map[r.category].P2Profit += r.profitAmount;
      }
    });
    return Object.values(map);
  }, [filteredData, compP1Start, compP1End, compP2Start, compP2End]);

  // ==========================================
  // LOGIC: MANAGEMENT REPORT
  // ==========================================
  const reportRows = useMemo(() => {
    const data = filteredData.filter(r => r.date >= reportStart && r.date <= reportEnd);
    const rows = [];
    CATEGORIES.forEach(cat => {
      TYPES.forEach(type => {
        const filtered = data.filter(r => r.category === cat && r.type === type);
        const sales = filtered.reduce((s, r) => s + r.salesAmount, 0);
        const profit = filtered.reduce((s, r) => s + r.profitAmount, 0);
        const margin = sales > 0 ? ((profit / sales) * 100).toFixed(2) : '0.00';
        
        if (sales > 0 || profit > 0) {
          rows.push({ category: cat, type, sales, profit, margin });
        }
      });
    });
    // Add Total Row
    const tSales = rows.reduce((s, r) => s + r.sales, 0);
    const tProfit = rows.reduce((s, r) => s + r.profit, 0);
    const tMargin = tSales > 0 ? ((tProfit / tSales) * 100).toFixed(2) : '0.00';
    if (rows.length > 0) {
      rows.push({ category: 'TOTAL', type: '-', sales: tSales, profit: tProfit, margin: tMargin, isTotal: true });
    }
    return rows;
  }, [filteredData, reportStart, reportEnd]);

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="section-title" style={{ marginBottom: 0 }}>Productivity Dashboard</h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Staff:</span>
                  <select 
                    value={selectedStaffFilter} 
                    onChange={e => setSelectedStaffFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <option value="All" style={{ background: '#1e293b', color: '#f8fafc' }}>All Staff</option>
                    {activeStaff.map(user => <option key={user.id} value={user.name} style={{ background: '#1e293b', color: '#f8fafc' }}>{user.name}</option>)}
                  </select>
                </div>
                {canAdd && (
                  <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Add Record
                  </button>
                )}
              </div>
            </div>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <Activity size={16} /> Overview
              </button>
              <button className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
                <BarChart2 size={16} /> Comparison
              </button>
              <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
                <FileText size={16} /> Management Report
              </button>
              <button className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
                <Database size={16} /> Database
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderBottom: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Total Sales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {formatCurrency(totalSales)}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderBottom: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Total Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {formatCurrency(totalProfit)}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderBottom: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Profit Margin</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={32} /> {overallMargin}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart2 size={18}/> Sales & Profit by Category
                    </h3>
                    <div style={{ height: '350px', width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart data={catBarData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${val/1000000}M`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PieChartIcon size={18}/> Retail vs Corporate (Profit)
                    </h3>
                    <div style={{ height: '350px', width: '100%' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={typePieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                            {typePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COMPARISON */}
            {activeTab === 'comparison' && (
              <div className="fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <button className={`btn ${comparisonMode === 'type' ? 'btn-primary' : ''}`} onClick={() => setComparisonMode('type')} style={{ border: comparisonMode !== 'type' ? '1px solid #334155' : 'none', background: comparisonMode !== 'type' ? 'transparent' : '', color: comparisonMode === 'type' ? '#000' : '#f8fafc' }}>
                    Retail vs Corporate
                  </button>
                  <button className={`btn ${comparisonMode === 'period' ? 'btn-primary' : ''}`} onClick={() => setComparisonMode('period')} style={{ border: comparisonMode !== 'period' ? '1px solid #334155' : 'none', background: comparisonMode !== 'period' ? 'transparent' : '', color: comparisonMode === 'period' ? '#000' : '#f8fafc' }}>
                    Period vs Period (YoY / QoQ)
                  </button>
                </div>

                <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: '600', color: comparisonMode === 'period' ? '#3b82f6' : '#fff' }}><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> {comparisonMode === 'period' ? 'Period 1:' : 'Filter Period:'}</div>
                      <input type="month" value={compP1Start} onChange={e => setCompP1Start(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                      <span>to</span>
                      <input type="month" value={compP1End} onChange={e => setCompP1End(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                    </div>
                    
                    {comparisonMode === 'period' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
                        <div style={{ fontWeight: '600', color: '#8b5cf6' }}><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Period 2:</div>
                        <input type="month" value={compP2Start} onChange={e => setCompP2Start(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                        <span>to</span>
                        <input type="month" value={compP2End} onChange={e => setCompP2End(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
                    {comparisonMode === 'type' ? 'Retail vs Corporate Sales Comparison' : 'Period 1 vs Period 2 Sales'}
                  </h3>
                  <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={comparisonMode === 'type' ? compTypeData : compPeriodData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${val/1000000}M`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        {comparisonMode === 'type' ? (
                          <>
                            <Bar dataKey="RetailSales" name="Retail Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="CorporateSales" name="Corporate Sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <>
                            <Bar dataKey="P1Sales" name="Period 1 Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="P2Sales" name="Period 2 Sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
                    {comparisonMode === 'type' ? 'Retail vs Corporate Profit Comparison' : 'Period 1 vs Period 2 Profit'}
                  </h3>
                  <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={comparisonMode === 'type' ? compTypeData : compPeriodData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `Rp ${val/1000000}M`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        {comparisonMode === 'type' ? (
                          <>
                            <Bar dataKey="RetailProfit" name="Retail Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="CorporateProfit" name="Corporate Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <>
                            <Bar dataKey="P1Profit" name="Period 1 Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="P2Profit" name="Period 2 Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANAGEMENT REPORT */}
            {activeTab === 'report' && (
              <div className="fade-in">
                <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '600' }}><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Report Period:</div>
                    <input type="month" value={reportStart} onChange={e => setReportStart(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                    <span>to</span>
                    <input type="month" value={reportEnd} onChange={e => setReportEnd(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }} />
                  </div>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Productivity P&L Report</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>TYPE</th>
                        <th style={{ textAlign: 'right' }}>TOTAL SALES</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PROFIT</th>
                        <th style={{ textAlign: 'right' }}>PROFIT MARGIN (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row, idx) => (
                        <tr key={idx} style={row.isTotal ? { background: '#1e293b', fontWeight: 'bold' } : {}}>
                          <td style={{ color: row.isTotal ? '#eab308' : 'var(--text-main)' }}>{row.category}</td>
                          <td>
                            {row.type !== '-' && (
                              <span className={`badge ${row.type === 'Retail' ? 'badge-primary' : 'badge-warning'}`}>
                                {row.type}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(row.sales)}</td>
                          <td style={{ textAlign: 'right', color: '#3b82f6' }}>{formatCurrency(row.profit)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ color: row.margin >= 10 ? '#10b981' : row.margin >= 5 ? '#f59e0b' : '#ef4444' }}>
                              {row.margin}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportRows.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No productivity data found for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: DATABASE */}
            {activeTab === 'database' && (
              <div className="card fade-in" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Productivity Database</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6' }} onClick={handleExport}>
                      <Download size={16} /> Export CSV
                    </button>
                    {canAdd && (
                      <>
                        <button className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }} onClick={() => fileInputRef.current?.click()}>
                          <Upload size={16} /> Import CSV
                        </button>
                        <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImport} />
                      </>
                    )}
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>STAFF</th>
                      <th>CATEGORY</th>
                      <th>TYPE</th>
                      <th>SALES</th>
                      <th>PROFIT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.date}</td>
                        <td style={{ fontWeight: '500' }}>{rec.staff}</td>
                        <td>{rec.category}</td>
                        <td>
                          <span className={`badge ${rec.type === 'Retail' ? 'badge-primary' : 'badge-warning'}`}>
                            {rec.type}
                          </span>
                        </td>
                        <td style={{ color: '#10b981', fontWeight: '500' }}>{formatCurrency(rec.salesAmount)}</td>
                        <td style={{ color: '#3b82f6', fontWeight: '500' }}>{formatCurrency(rec.profitAmount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {canEditAny && (
                              <button className="btn" style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }} onClick={() => handleOpenModal(rec)}>
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }} onClick={() => handleDelete(rec.id)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No database records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '800px', background: '#111827', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #1f2937' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#eab308' }}>
                <Plus size={24} color="#eab308" /> {editingRec ? 'Edit Record' : 'Add Productivity Record'}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                
                <div className="input-group">
                  <label>Period (Month/Year)<span style={{color: '#ef4444'}}>*</span></label>
                  <input type="month" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155' }} />
                </div>

                <div className="input-group">
                  <label>Staff<span style={{color: '#ef4444'}}>*</span></label>
                  <select required value={formData.staff} onChange={e => setFormData({...formData, staff: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', textTransform: 'uppercase', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                    <option value="">Select Staff</option>
                    {activeStaff.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Product Category<span style={{color: '#ef4444'}}>*</span></label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: '#0f172a', border: '1px solid #10b981', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Sales Type<span style={{color: '#ef4444'}}>*</span></label>
                  <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ background: '#0f172a', border: '1px solid #3b82f6', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Sales Amount (IDR)<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{...iconStyle, color: '#10b981'}} />
                    <input type="number" required placeholder="0" value={formData.salesAmount} onChange={e => setFormData({...formData, salesAmount: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Profit Amount (IDR)<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{...iconStyle, color: '#3b82f6'}} />
                    <input type="number" required placeholder="0" value={formData.profitAmount} onChange={e => setFormData({...formData, profitAmount: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Remarks</label>
                  <textarea placeholder="Additional notes" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1rem', width: '100%', color: '#f8fafc', minHeight: '80px', resize: 'vertical' }} />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1f2937' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none', fontWeight: 'bold' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productivity;
