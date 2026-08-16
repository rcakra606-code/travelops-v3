import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useSales } from '../context/SalesContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { Edit2, Trash2, ChevronUp, ChevronDown, FileText, Plus, BarChart2, DollarSign, Target, TrendingUp, PieChart, Download, Printer, Award, Lock, Sparkles } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID').format(value || 0);
};

const formatPercent = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0.00%';
  return value.toFixed(2) + '%';
};

const getCurrentMonthString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const SalesInput = () => {
  const { sales: salesData, addSale, updateSale, deleteSale } = useSales();
  const { users } = useUsers();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('database');
  
  const initialMonth = getCurrentMonthString();
  const [selectedPeriod, setSelectedPeriod] = useState(initialMonth);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    period: initialMonth,
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
    const { name, value } = e.target;
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

  const filteredSales = (salesData || []).filter(sale => sale.period === selectedPeriod);

  // Calculations for totals
  const totals = filteredSales.reduce((acc, curr) => {
    acc.targetSales += (curr.targetSales || 0);
    acc.targetProfit += (curr.targetProfit || 0);
    acc.achievementSales += (curr.achievementSales || 0);
    acc.achievementProfit += (curr.achievementProfit || 0);
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
    name: s.staffName.split(' ')[0],
    Target: s.targetSales,
    Achievement: s.achievementSales
  }));

  const pieColors = ['#06b6d4', '#10b981', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];
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

  const getStatusBadgeForPercent = (percent) => {
    if (percent >= 100) {
      return (
        <span className="badge badge-success font-mono">
          <span className="pulse-dot pulse-dot-green" /> {formatPercent(percent)}
        </span>
      );
    }
    if (percent >= 70) {
      return (
        <span className="badge badge-warning font-mono">
          <span className="pulse-dot pulse-dot-amber" /> {formatPercent(percent)}
        </span>
      );
    }
    return (
      <span className="badge badge-danger font-mono">
        {formatPercent(percent)}
      </span>
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
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                  Sales & Targets Intelligence
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Monitor sales quotas, consultant achievements, and departmental profit margins.
                </p>
              </div>

              {/* Month Picker Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Period:</label>
                <input 
                  type="month" 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontWeight: '700', padding: 0, width: 'auto' }}
                />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button 
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                <FileText size={16} /> Input & Records
              </button>
              <button 
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart2 size={16} /> Analytics & Quota Charts
              </button>
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={handleExportCSV} style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', gap: '0.4rem' }}>
                  <Download size={15} /> Export CSV
                </button>
                <button className="btn btn-secondary" onClick={handlePrint} style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', gap: '0.4rem' }}>
                  <Printer size={15} /> Print Report
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>

              {/* TAB: DASHBOARD & REPORTS */}
              {activeTab === 'dashboard' && (
                <div className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="stat-card" style={{ '--stat-glow-color': '#06b6d4' }}>
                      <div className="stat-header">
                        <div>
                          <div className="stat-title">Target Sales</div>
                          <div className="stat-value font-mono">Rp {formatCurrency(totals.targetSales)}</div>
                        </div>
                        <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
                          <Target size={20} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="stat-card" style={{ '--stat-glow-color': '#10b981' }}>
                      <div className="stat-header">
                        <div>
                          <div className="stat-title">Achievement Sales</div>
                          <div className="stat-value font-mono" style={{ color: '#34d399' }}>Rp {formatCurrency(totals.achievementSales)}</div>
                        </div>
                        <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        {getStatusBadgeForPercent(totals.targetSales > 0 ? (totals.achievementSales / totals.targetSales) * 100 : 0)}
                      </div>
                    </div>

                    <div className="stat-card" style={{ '--stat-glow-color': '#fbbf24' }}>
                      <div className="stat-header">
                        <div>
                          <div className="stat-title">Target Profit</div>
                          <div className="stat-value font-mono">Rp {formatCurrency(totals.targetProfit)}</div>
                        </div>
                        <div className="stat-icon" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}>
                          <DollarSign size={20} />
                        </div>
                      </div>
                    </div>

                    <div className="stat-card" style={{ '--stat-glow-color': '#f97316' }}>
                      <div className="stat-header">
                        <div>
                          <div className="stat-title">Achievement Profit</div>
                          <div className="stat-value font-mono" style={{ color: '#fb923c' }}>Rp {formatCurrency(totals.achievementProfit)}</div>
                        </div>
                        <div className="stat-icon" style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.1)' }}>
                          <PieChart size={20} />
                        </div>
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
                        Overall Margin: <strong style={{ color: 'var(--text-main)' }}>{formatPercent(totals.achievementSales > 0 ? (totals.achievementProfit / totals.achievementSales) * 100 : 0)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="card">
                      <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                        <BarChart2 size={18} color="var(--primary)" /> Target vs. Actual Achievement (Sales)
                      </h3>
                      <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                            <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} />
                            <RechartsTooltip 
                              contentStyle={{ background: 'rgba(10, 15, 28, 0.95)', border: '1px solid var(--border)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.8125rem' }} 
                              formatter={(value) => `Rp ${formatCurrency(value)}`} 
                            />
                            <Legend wrapperStyle={{ fontSize: '0.8125rem', paddingTop: '10px' }} />
                            <Bar dataKey="Target" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Achievement" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="card">
                      <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                        <PieChart size={18} color="#fbbf24" /> Profit Contribution Share
                      </h3>
                      <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={105}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="rgba(0,0,0,0.5)" />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ background: 'rgba(10, 15, 28, 0.95)', border: '1px solid var(--border)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.8125rem' }} 
                                formatter={(value) => `Rp ${formatCurrency(value)}`} 
                              />
                              <Legend wrapperStyle={{ fontSize: '0.8125rem' }} />
                            </RePieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ color: 'var(--text-subtle)', fontSize: '0.875rem' }}>No profit records available for this period.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Leaderboards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, var(--bg-card) 100%)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                      <h3 style={{ margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.95rem', fontWeight: '700' }}>
                        <Award size={18} /> Top Sales Consultant
                      </h3>
                      {topPerformer ? (
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{topPerformer.staffName}</div>
                          <div style={{ marginTop: '0.4rem' }}>
                            {getStatusBadgeForPercent(topPerformer.targetSales > 0 ? (topPerformer.achievementSales / topPerformer.targetSales) * 100 : 0)}
                          </div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.4rem' }}>
                            Sales: <strong style={{ color: 'var(--text-main)' }}>Rp {formatCurrency(topPerformer.achievementSales)}</strong>
                          </div>
                        </div>
                      ) : <div style={{ color: 'var(--text-subtle)' }}>No data available</div>}
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <h3 style={{ margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.95rem', fontWeight: '700' }}>
                        <Award size={18} /> Highest Profit Margin
                      </h3>
                      {highestMargin ? (
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{highestMargin.staffName}</div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.8125rem' }}>
                            Margin: <strong style={{ color: '#34d399' }}>{formatPercent(highestMargin.achievementSales > 0 ? (highestMargin.achievementProfit / highestMargin.achievementSales) * 100 : 0)}</strong>
                          </div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
                            Profit: <strong style={{ color: 'var(--text-main)' }}>Rp {formatCurrency(highestMargin.achievementProfit)}</strong>
                          </div>
                        </div>
                      ) : <div style={{ color: 'var(--text-subtle)' }}>No data available</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DATABASE & RECORDS */}
              {activeTab === 'database' && (
                <div className="fade-in">
                  {/* Quick Sales Input Card */}
                  {canAdd && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFormOpen ? '1.25rem' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                            <Plus size={18} color="var(--primary)" /> {editingId ? 'Edit Sales Entry' : 'Quick Sales Quota Entry'}
                          </h2>
                        </div>
                        <button 
                          onClick={() => setIsFormOpen(!isFormOpen)} 
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                        >
                          {isFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                          {isFormOpen ? 'Collapse' : 'Expand Form'}
                        </button>
                      </div>

                      {isFormOpen && (
                        <form onSubmit={handleSubmit}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Period</label>
                              <input 
                                type="month" 
                                name="period" 
                                value={formData.period} 
                                onChange={handleInputChange} 
                                required 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Staff Consultant</label>
                              <select 
                                name="staffName" 
                                value={formData.staffName} 
                                onChange={handleInputChange} 
                                required 
                              >
                                <option value="">Select Staff...</option>
                                {users.filter(u => u.status === 'Active').map(u => (
                                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Target Sales (Rp)</label>
                              <input 
                                type="text" 
                                name="targetSales" 
                                value={formData.targetSales ? formatCurrency(formData.targetSales) : ''} 
                                onChange={(e) => setFormData({...formData, targetSales: e.target.value.replace(/[^0-9]/g, '')})} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Target Profit (Rp)</label>
                              <input 
                                type="text" 
                                name="targetProfit" 
                                value={formData.targetProfit ? formatCurrency(formData.targetProfit) : ''} 
                                onChange={(e) => setFormData({...formData, targetProfit: e.target.value.replace(/[^0-9]/g, '')})} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Achieved Sales (Rp)</label>
                              <input 
                                type="text" 
                                name="achievementSales" 
                                value={formData.achievementSales ? formatCurrency(formData.achievementSales) : ''} 
                                onChange={(e) => setFormData({...formData, achievementSales: e.target.value.replace(/[^0-9]/g, '')})} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Achieved Profit (Rp)</label>
                              <input 
                                type="text" 
                                name="achievementProfit" 
                                value={formData.achievementProfit ? formatCurrency(formData.achievementProfit) : ''} 
                                onChange={(e) => setFormData({...formData, achievementProfit: e.target.value.replace(/[^0-9]/g, '')})} 
                                placeholder="0" 
                              />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.65rem' }}>
                                <Plus size={15} /> {editingId ? 'Save Changes' : 'Add Entry'}
                              </button>
                              <button type="button" onClick={handleClear} className="btn btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                                Clear
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Data Table Card */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
                        <thead>
                          <tr>
                            <th>NAMA TC</th>
                            <th style={{ textAlign: 'right' }}>TARGET SALES</th>
                            <th style={{ textAlign: 'right' }}>TARGET PROFIT</th>
                            <th style={{ textAlign: 'right' }}>ACTUAL SALES</th>
                            <th style={{ textAlign: 'right' }}>ACTUAL PROFIT</th>
                            <th style={{ textAlign: 'center' }}>% SALES</th>
                            <th style={{ textAlign: 'center' }}>% PROFIT</th>
                            <th style={{ textAlign: 'center' }}>MARGIN</th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => {
                            const salesPct = sale.targetSales > 0 ? (sale.achievementSales / sale.targetSales) * 100 : 0;
                            const profitPct = sale.targetProfit > 0 ? (sale.achievementProfit / sale.targetProfit) * 100 : 0;
                            const marginPct = sale.achievementSales > 0 ? (sale.achievementProfit / sale.achievementSales) * 100 : 0;
                            return (
                              <tr key={sale.id}>
                                <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{sale.staffName}</td>
                                <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Rp {formatCurrency(sale.targetSales)}</td>
                                <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Rp {formatCurrency(sale.targetProfit)}</td>
                                <td className="font-mono" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>Rp {formatCurrency(sale.achievementSales)}</td>
                                <td className="font-mono" style={{ textAlign: 'right', fontWeight: '700', color: '#34d399' }}>Rp {formatCurrency(sale.achievementProfit)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {getStatusBadgeForPercent(salesPct)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {getStatusBadgeForPercent(profitPct)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="font-mono" style={{ fontWeight: '600', color: '#fbbf24', fontSize: '0.8125rem' }}>
                                    {formatPercent(marginPct)}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => canEditAny && handleEdit(sale)} 
                                      disabled={!canEditAny}
                                      style={{ 
                                        background: 'rgba(245, 158, 11, 0.1)', 
                                        color: '#fbbf24', 
                                        border: '1px solid rgba(245, 158, 11, 0.2)', 
                                        padding: '0.4rem', 
                                        borderRadius: '6px', 
                                        cursor: canEditAny ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }} 
                                      title={canEditAny ? "Edit Record" : "Requires Manager role"}
                                    >
                                      {canEditAny ? <Edit2 size={14} /> : <Lock size={14} />}
                                    </button>
                                    <button 
                                      onClick={() => canDelete && handleDelete(sale.id)} 
                                      disabled={!canDelete}
                                      style={{ 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        color: '#f87171', 
                                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                                        padding: '0.4rem', 
                                        borderRadius: '6px', 
                                        cursor: canDelete ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }} 
                                      title={canDelete ? "Delete Record" : "Requires Admin role"}
                                    >
                                      {canDelete ? <Trash2 size={14} /> : <Lock size={14} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Totals Row */}
                          <tr style={{ background: 'rgba(255, 255, 255, 0.03)', fontWeight: 'bold' }}>
                            <td style={{ color: 'var(--primary)', fontWeight: '800' }}>TOTAL QUOTA</td>
                            <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-main)' }}>Rp {formatCurrency(totals.targetSales)}</td>
                            <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-main)' }}>Rp {formatCurrency(totals.targetProfit)}</td>
                            <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-main)', fontWeight: '800' }}>Rp {formatCurrency(totals.achievementSales)}</td>
                            <td className="font-mono" style={{ textAlign: 'right', color: '#34d399', fontWeight: '800' }}>Rp {formatCurrency(totals.achievementProfit)}</td>
                            <td style={{ textAlign: 'center' }}>
                              {getStatusBadgeForPercent(totals.targetSales > 0 ? (totals.achievementSales / totals.targetSales) * 100 : 0)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {getStatusBadgeForPercent(totals.targetProfit > 0 ? (totals.achievementProfit / totals.targetProfit) * 100 : 0)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="font-mono" style={{ fontWeight: '800', color: '#fbbf24', fontSize: '0.875rem' }}>
                                {formatPercent(totals.achievementSales > 0 ? (totals.achievementProfit / totals.achievementSales) * 100 : 0)}
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
