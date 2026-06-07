import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useSales } from '../context/SalesContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { Edit2, Trash2, ChevronUp, ChevronDown, FileText, Plus, BarChart2, DollarSign, Target, TrendingUp, PieChart, Download, Printer, Award } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const formatPercent = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0.00%';
  return value.toFixed(2) + '%';
};

const SalesInput = () => {
  const { sales: salesData, addSale, updateSale, deleteSale } = useSales();
  const { users } = useUsers();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('database'); // 'dashboard', 'database'
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05');
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    period: '2026-05',
    staffName: '',
    targetSales: '',
    targetProfit: '',
    achievementSales: '',
    achievementProfit: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canAdd = isAdmin || isManager;

  const handleInputChange = (e) => {
    // If it's a number field, we might want to strip non-digits, but let's keep it simple for now
    const { name, value } = e.target;
    // Remove non-numeric characters for number fields if they are typed, but allow empty
    if (name !== 'staffName' && name !== 'period') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleClear = () => {
    setFormData({ period: selectedPeriod, staffName: '', targetSales: '', targetProfit: '', achievementSales: '', achievementProfit: '' });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.staffName) return;

    const salePayload = {
      staffName: formData.staffName,
      targetSales: Number(formData.targetSales) || 0,
      targetProfit: Number(formData.targetProfit) || 0,
      achievementSales: Number(formData.achievementSales) || 0,
      achievementProfit: Number(formData.achievementProfit) || 0,
      period: formData.period
    };

    if (editingId) {
      updateSale(editingId, salePayload);
    } else {
      addSale(salePayload);
    }
    handleClear();
  };

  const handleEdit = (sale) => {
    setFormData({
      period: sale.period,
      staffName: sale.staffName,
      targetSales: sale.targetSales.toString(),
      targetProfit: sale.targetProfit.toString(),
      achievementSales: sale.achievementSales.toString(),
      achievementProfit: sale.achievementProfit.toString()
    });
    setEditingId(sale.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteSale(id);
    }
  };

  const filteredSales = salesData.filter(sale => sale.period === selectedPeriod);

  // Calculations for totals
  const totals = filteredSales.reduce((acc, curr) => {
    acc.targetSales += curr.targetSales;
    acc.targetProfit += curr.targetProfit;
    acc.achievementSales += curr.achievementSales;
    acc.achievementProfit += curr.achievementProfit;
    return acc;
  }, { targetSales: 0, targetProfit: 0, achievementSales: 0, achievementProfit: 0 });

  const handleExportCSV = () => {
    const headers = ['NAMA TC', 'TARGET SALES', 'TARGET PROFIT', 'ACHIEVEMENT SALES', 'ACHIEVEMENT PROFIT', 'PERSENTASE SALES', 'PERSENTASE PROFIT', 'MARGIN'];
    
    const rows = filteredSales.map(sale => [
      `"${sale.staffName}"`,
      sale.targetSales,
      sale.targetProfit,
      sale.achievementSales,
      sale.achievementProfit,
      sale.targetSales > 0 ? ((sale.achievementSales / sale.targetSales) * 100).toFixed(2) + '%' : '0%',
      sale.targetProfit > 0 ? ((sale.achievementProfit / sale.targetProfit) * 100).toFixed(2) + '%' : '0%',
      sale.achievementSales > 0 ? ((sale.achievementProfit / sale.achievementSales) * 100).toFixed(2) + '%' : '0%'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sales_Report_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Chart Data Preparation
  const chartData = filteredSales.map(s => ({
    name: s.staffName.split(' ')[0], // just first name for chart fit
    Target: s.targetSales,
    Achievement: s.achievementSales
  }));

  const pieColors = ['#0ea5e9', '#22c55e', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieData = filteredSales.filter(s => s.achievementProfit > 0).map(s => ({
    name: s.staffName.split(' ')[0],
    value: s.achievementProfit
  }));

  // Leaderboards
  const topPerformer = [...filteredSales].sort((a, b) => {
    const aP = a.targetSales > 0 ? a.achievementSales / a.targetSales : 0;
    const bP = b.targetSales > 0 ? b.achievementSales / b.targetSales : 0;
    return bP - aP;
  })[0];

  const highestMargin = [...filteredSales].sort((a, b) => {
    const aM = a.achievementSales > 0 ? a.achievementProfit / a.achievementSales : 0;
    const bM = b.achievementSales > 0 ? b.achievementProfit / b.achievementSales : 0;
    return bM - aM;
  })[0];

  const getColorByRatio = (percent) => {
    if (percent >= 100) return { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' }; // Green
    if (percent >= 75) return { bg: 'rgba(234, 179, 8, 0.2)', text: '#fde047' }; // Yellow
    if (percent >= 50) return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' }; // Orange
    return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' }; // Red
  };

  const renderPercentageCell = (achievement, target, isTotal = false) => {
    const percent = target > 0 ? (achievement / target) * 100 : 0;
    const colors = getColorByRatio(percent);
    return (
      <td style={{ background: colors.bg, color: isTotal ? '#fbbf24' : colors.text, textAlign: 'right', padding: '1rem', fontWeight: isTotal ? 'bold' : 'normal' }}>
        {formatPercent(percent)}
      </td>
    );
  };

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 className="section-title" style={{ margin: 0 }}>Sales & Targets</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Period:</label>
              <input 
                type="month" 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }}
              />
            </div>
          </div>

          <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart2 size={16} /> Dashboard & Reports
            </button>
            <button 
              className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => setActiveTab('database')}
            >
              <FileText size={16} /> Input & Database
            </button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Download size={16} /> Export CSV
              </button>
              <button className="btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Printer size={16} /> Print Report
              </button>
            </div>
          </div>

            <div style={{ width: '100%' }}>

              {activeTab === 'dashboard' && (
              <div className="fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #0ea5e9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Target size={18} /> <span style={{ fontWeight: '500' }}>Total Target Sales</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Rp {formatCurrency(totals.targetSales)}</div>
                  </div>
                  
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #22c55e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <TrendingUp size={18} /> <span style={{ fontWeight: '500' }}>Achievement Sales</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22c55e' }}>Rp {formatCurrency(totals.achievementSales)}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {formatPercent(totals.targetSales > 0 ? (totals.achievementSales / totals.targetSales) * 100 : 0)} of target
                    </div>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #fbbf24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <DollarSign size={18} /> <span style={{ fontWeight: '500' }}>Total Target Profit</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Rp {formatCurrency(totals.targetProfit)}</div>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #f97316' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <PieChart size={18} /> <span style={{ fontWeight: '500' }}>Achievement Profit</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f97316' }}>Rp {formatCurrency(totals.achievementProfit)}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Margin: {formatPercent(totals.achievementSales > 0 ? (totals.achievementProfit / totals.achievementSales) * 100 : 0)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart2 size={18} color="var(--primary)" /> Target vs Achievement Sales
                    </h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                          <RechartsTooltip 
                            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
                            formatter={(value) => `Rp ${formatCurrency(value)}`} 
                          />
                          <Legend />
                          <Bar dataKey="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Achievement" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PieChart size={18} color="var(--warning)" /> Profit Contribution
                    </h3>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
                              formatter={(value) => `Rp ${formatCurrency(value)}`} 
                            />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>No profit data yet for this period.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05))', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308' }}>
                      <Award size={20} /> Top Sales Performer
                    </h3>
                    {topPerformer ? (
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{topPerformer.staffName}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          Achievement: <strong style={{ color: '#22c55e' }}>{formatPercent(topPerformer.targetSales > 0 ? (topPerformer.achievementSales / topPerformer.targetSales) * 100 : 0)}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>Sales: Rp {formatCurrency(topPerformer.achievementSales)}</div>
                      </div>
                    ) : <div style={{ color: 'var(--text-muted)' }}>No data available</div>}
                  </div>

                  <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                      <Award size={20} /> Highest Margin
                    </h3>
                    {highestMargin ? (
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{highestMargin.staffName}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          Margin: <strong style={{ color: '#10b981' }}>{formatPercent(highestMargin.achievementSales > 0 ? (highestMargin.achievementProfit / highestMargin.achievementSales) * 100 : 0)}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>Profit: Rp {formatCurrency(highestMargin.achievementProfit)}</div>
                      </div>
                    ) : <div style={{ color: 'var(--text-muted)' }}>No data available</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="fade-in">
                {/* Quick Sales Input Card */}
                {canAdd && (
                  <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFormOpen ? '1.5rem' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                          <FileText size={20} color="#f87171" /> Quick Sales Input
                        </h2>
                      </div>
                <button 
                  onClick={() => setIsFormOpen(!isFormOpen)} 
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                >
                  {isFormOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
                  {isFormOpen ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {isFormOpen && (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period (Month & Year)</label>
                      <input 
                        type="month" 
                        name="period" 
                        value={formData.period} 
                        onChange={handleInputChange} 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none' }} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff Name</label>
                      <select 
                        name="staffName" 
                        value={formData.staffName} 
                        onChange={handleInputChange} 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none' }} 
                        required 
                      >
                        <option value="">Select Staff...</option>
                        {users.filter(u => u.status === 'Active').map(u => (
                          <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Sales</label>
                      <input 
                        type="text" 
                        name="targetSales" 
                        value={formatCurrency(formData.targetSales) || formData.targetSales} 
                        onChange={(e) => setFormData({...formData, targetSales: e.target.value.replace(/[^0-9]/g, '')})} 
                        placeholder="0" 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Profit</label>
                      <input 
                        type="text" 
                        name="targetProfit" 
                        value={formatCurrency(formData.targetProfit) || formData.targetProfit} 
                        onChange={(e) => setFormData({...formData, targetProfit: e.target.value.replace(/[^0-9]/g, '')})} 
                        placeholder="0" 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Achievement Sales</label>
                      <input 
                        type="text" 
                        name="achievementSales" 
                        value={formatCurrency(formData.achievementSales) || formData.achievementSales} 
                        onChange={(e) => setFormData({...formData, achievementSales: e.target.value.replace(/[^0-9]/g, '')})} 
                        placeholder="0" 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Achievement Profit</label>
                      <input 
                        type="text" 
                        name="achievementProfit" 
                        value={formatCurrency(formData.achievementProfit) || formData.achievementProfit} 
                        onChange={(e) => setFormData({...formData, achievementProfit: e.target.value.replace(/[^0-9]/g, '')})} 
                        placeholder="0" 
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ flex: 2, padding: '0.65rem', background: '#22c55e', color: '#111827', fontWeight: 'bold', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
                        <Plus size={16} /> {editingId ? 'Save' : 'Add'}
                      </button>
                      <button type="button" onClick={handleClear} style={{ flex: 1, padding: '0.65rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', fontWeight: 'bold', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                        Clear
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
            )}

            {/* Data Table Card */}
            <div className="card" style={{ padding: 0, overflowX: 'auto', background: '#1e293b' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#334155' }}>
                  <tr>
                    <th style={{ color: '#fbbf24', textAlign: 'left', padding: '1rem', borderBottom: '1px solid #475569' }}>NAMA TC</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569' }}>TARGET SALES</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569' }}>TARGET PROFIT</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569' }}>JUMLAH SALES (BULANAN)</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569' }}>JUMLAH PROFIT (BULANAN)</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569', background: 'rgba(239, 68, 68, 0.1)' }}>PERSENTASE SALES</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569', background: 'rgba(239, 68, 68, 0.1)' }}>PERSENTASE PROFIT</th>
                    <th style={{ color: '#fbbf24', textAlign: 'right', padding: '1rem', borderBottom: '1px solid #475569', background: 'rgba(239, 68, 68, 0.1)' }}>MARGIN</th>
                    <th style={{ color: '#fbbf24', textAlign: 'center', padding: '1rem', borderBottom: '1px solid #475569' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{sale.staffName}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(sale.targetSales)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(sale.targetProfit)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(sale.achievementSales)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(sale.achievementProfit)}</td>
                      {renderPercentageCell(sale.achievementSales, sale.targetSales)}
                      {renderPercentageCell(sale.achievementProfit, sale.targetProfit)}
                      {(() => {
                        const marginPercent = sale.achievementSales > 0 ? (sale.achievementProfit / sale.achievementSales) * 100 : 0;
                        const colors = getColorByRatio(marginPercent);
                        return (
                          <td style={{ padding: '1rem', textAlign: 'right', background: colors.bg, color: colors.text }}>
                            {formatPercent(marginPercent)}
                          </td>
                        );
                      })()}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {canEditAny && (
                            <button onClick={() => handleEdit(sale)} style={{ background: '#fbbf24', color: '#111827', border: 'none', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(sale.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr style={{ background: '#1e293b', fontWeight: 'bold' }}>
                    <td style={{ padding: '1rem', color: '#fbbf24' }}>TOTAL</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(totals.targetSales)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(totals.targetProfit)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(totals.achievementSales)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(totals.achievementProfit)}</td>
                    {renderPercentageCell(totals.achievementSales, totals.targetSales, true)}
                    {renderPercentageCell(totals.achievementProfit, totals.targetProfit, true)}
                    {(() => {
                      const marginPercent = totals.achievementSales > 0 ? (totals.achievementProfit / totals.achievementSales) * 100 : 0;
                      const colors = getColorByRatio(marginPercent);
                      return (
                        <td style={{ padding: '1rem', textAlign: 'right', background: colors.bg, color: '#fbbf24' }}>
                          {formatPercent(marginPercent)}
                        </td>
                      );
                    })()}
                    <td style={{ padding: '1rem', textAlign: 'center' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInput;
