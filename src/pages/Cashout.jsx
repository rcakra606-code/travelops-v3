import React, { useState, useContext, useMemo } from 'react';
import { CashoutContext } from '../context/CashoutContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { Activity, CreditCard, Search, Plus, Filter, FileText, CheckCircle, XCircle, Clock, Wallet, Edit2, Check, X } from 'lucide-react';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';

const COLORS = {
  Pending: '#f59e0b',
  Approved: '#3b82f6',
  Completed: '#10b981',
  Rejected: '#ef4444'
};

const Cashout = () => {
  const { cashoutRequests: cashouts, addCashoutRequest: addCashout, updateCashoutRequest: updateCashout, deleteCashoutRequest: deleteCashout } = useContext(CashoutContext);
  const updateStatus = (id, newStatus) => updateCashout(id, { status: newStatus });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    requestDate: new Date().toISOString().split('T')[0],
    staffName: '',
    amount: '',
    custCode: '',
    purpose: '',
    ticketId: '',
    completionDate: '',
    status: 'Pending'
  });

  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Derived Data
  const filteredCashouts = useMemo(() => {
    return cashouts.filter(c => {
      const matchSearch = c.staffName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.custCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  }, [cashouts, searchTerm, statusFilter]);

  const kpis = useMemo(() => {
    let totalCompleted = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    cashouts.forEach(c => {
      if (c.status === 'Completed') totalCompleted += c.amount;
      if (c.status === 'Pending' || c.status === 'Approved') {
        pendingCount++;
        pendingAmount += c.amount;
      }
    });

    return { totalCompleted, pendingCount, pendingAmount };
  }, [cashouts]);

  const pieData = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, Completed: 0, Rejected: 0 };
    cashouts.forEach(c => counts[c.status]++);
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [cashouts]);

  const trendData = useMemo(() => {
    const map = {};
    cashouts.forEach(c => {
      const [y, m] = c.requestDate.split('-');
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { name: key, Amount: 0 };
      map[key].Amount += c.amount;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [cashouts]);

  const openModal = (cashout = null) => {
    if (cashout) {
      setFormData({ ...cashout });
    } else {
      setFormData({
        id: '',
        requestDate: new Date().toISOString().split('T')[0],
        staffName: '',
        amount: '',
        custCode: '',
        purpose: '',
        ticketId: '',
        completionDate: '',
        status: 'Pending'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, amount: Number(formData.amount) };
    if (data.id) {
      updateCashout(data.id, data);
    } else {
      addCashout(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem' }}>Cashout Management</h1>
                <p style={{ color: '#94a3b8' }}>Manage advance, reimbursement, and petty cash requests</p>
              </div>
              <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                <Plus size={18} /> New Request
              </button>
            </div>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <Activity size={18} /> Dashboard
              </button>
              <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                <FileText size={18} /> Cashout Requests
              </button>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="kpi-card" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '12px', color: '#3b82f6' }}>
                      <CreditCard size={28} />
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Cashout (Completed)</div>
                      <div style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(kpis.totalCompleted)}</div>
                    </div>
                  </div>
                  <div className="kpi-card" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '12px', color: '#f59e0b' }}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pending & Approved Requests</div>
                      <div style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 'bold' }}>{kpis.pendingCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Tickets</span></div>
                    </div>
                  </div>
                  <div className="kpi-card" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: '#ef4444' }}>
                      <Wallet size={28} />
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Amount in Pipeline</div>
                      <div style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(kpis.pendingAmount)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Status Chart */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Request Status</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Trend Chart */}
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Cashout Requested Trend</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000000}M`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                          <Bar dataKey="Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REQUESTS */}
            {activeTab === 'requests' && (
              <div className="card fade-in" style={{ overflowX: 'auto', background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #334155', width: '300px' }}>
                    <Search size={18} color="#64748b" />
                    <input type="text" placeholder="Search staff, ticket, code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: '#f8fafc', marginLeft: '0.5rem', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} color="#64748b" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                      <option value="All">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Req Date</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Staff</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Cust Code</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Ticket ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Purpose</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>Amount</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>Comp Date</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCashouts.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '1rem', color: '#f8fafc' }}>{c.requestDate}</td>
                        <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: '500' }}>{c.staffName}</td>
                        <td style={{ padding: '1rem', color: '#3b82f6' }}>{c.custCode}</td>
                        <td style={{ padding: '1rem', color: '#94a3b8' }}>{c.ticketId}</td>
                        <td style={{ padding: '1rem', color: '#cbd5e1', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.purpose}>{c.purpose}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#f8fafc', fontWeight: '600' }}>{formatCurrency(c.amount)}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', color: COLORS[c.status], backgroundColor: `${COLORS[c.status]}20` }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{c.completionDate || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => openModal(c)} title="Edit" style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Edit2 size={14} />
                            </button>
                            {c.status === 'Pending' && (
                              <>
                                <button onClick={() => updateStatus(c.id, 'Approved')} title="Approve" style={{ background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Check size={14} />
                                </button>
                                <button onClick={() => updateStatus(c.id, 'Rejected')} title="Reject" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            {c.status === 'Approved' && (
                              <button onClick={() => updateStatus(c.id, 'Completed')} title="Complete" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b981', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCashouts.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No cashout requests found.</td>
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>{formData.id ? 'Edit Cashout Request' : 'New Cashout Request'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Request Date</label>
                  <input type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Staff Name</label>
                  <input type="text" value={formData.staffName} onChange={e => setFormData({...formData, staffName: e.target.value})} required placeholder="John Doe" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Cust Code (Corporate)</label>
                  <input type="text" value={formData.custCode} onChange={e => setFormData({...formData, custCode: e.target.value})} placeholder="CORP-ABC" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Ticket ID (Jira/Lark)</label>
                  <input type="text" value={formData.ticketId} onChange={e => setFormData({...formData, ticketId: e.target.value})} placeholder="TRV-123" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Amount (IDR)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="1500000" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Purpose</label>
                <textarea value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} required rows="3" placeholder="Explain what the cashout is for..." style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px', resize: 'vertical' }}></textarea>
              </div>

              {formData.id && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Completion Date</label>
                    <input type="date" value={formData.completionDate} onChange={e => setFormData({...formData, completionDate: e.target.value})} disabled={formData.status !== 'Completed'} style={{ width: '100%', background: formData.status !== 'Completed' ? 'rgba(30, 41, 59, 0.5)' : '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{formData.id ? 'Save Changes' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashout;
