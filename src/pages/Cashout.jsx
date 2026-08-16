import React, { useState, useContext, useMemo } from 'react';
import { CashoutContext } from '../context/CashoutContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { Activity, CreditCard, Search, Plus, Filter, FileText, CheckCircle, XCircle, Clock, Wallet, Edit2, Check, X, ArrowUpDown, Lock, Trash2, DollarSign, Sparkles } from 'lucide-react';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';
import { useDataTable } from '../hooks/useDataTable';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  Pending: '#fbbf24',
  Approved: '#38bdf8',
  Completed: '#34d399',
  Rejected: '#f87171'
};

const Cashout = () => {
  const { cashoutRequests: cashouts, addCashoutRequest: addCashout, updateCashoutRequest: updateCashout, deleteCashoutRequest: deleteCashout } = useContext(CashoutContext);
  const { user } = useAuth();
  const updateStatus = (id, newStatus) => updateCashout(id, { status: newStatus });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const closeMobile = () => setIsSidebarOpen(false);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  
  // Setup DataTable hook
  const {
    filters,
    handleSort,
    handleFilterChange,
    globalSearch,
    setGlobalSearch,
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    itemsPerPage
  } = useDataTable(cashouts || [], { key: 'requestDate', direction: 'desc' }, 10);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  const kpis = useMemo(() => {
    let totalCompleted = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    (cashouts || []).forEach(c => {
      if (c.status === 'Completed') totalCompleted += (c.amount || 0);
      if (c.status === 'Pending' || c.status === 'Approved') {
        pendingCount++;
        pendingAmount += (c.amount || 0);
      }
    });

    return { totalCompleted, pendingCount, pendingAmount };
  }, [cashouts]);

  const pieData = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, Completed: 0, Rejected: 0 };
    (cashouts || []).forEach(c => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [cashouts]);

  const trendData = useMemo(() => {
    const map = {};
    (cashouts || []).forEach(c => {
      if (c.requestDate) {
        const [y, m] = c.requestDate.split('-');
        const key = `${y}-${m}`;
        if (!map[key]) map[key] = { name: key, Amount: 0 };
        map[key].Amount += (c.amount || 0);
      }
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
        staffName: user?.name || '',
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.purpose) {
      alert('Please enter amount and purpose');
      return;
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount) || 0
    };

    if (formData.id) {
      updateCashout(formData.id, payload);
    } else {
      addCashout(payload);
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="badge badge-success font-mono">
            <span className="pulse-dot pulse-dot-green" /> Completed
          </span>
        );
      case 'Approved':
        return (
          <span className="badge badge-primary font-mono">
            <span className="pulse-dot pulse-dot-cyan" /> Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="badge badge-warning font-mono">
            <span className="pulse-dot pulse-dot-amber" /> Pending
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge badge-danger font-mono">
            Rejected
          </span>
        );
      default:
        return (
          <span className="badge badge-primary font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="app-container fade-in">
      <div className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeMobile}></div>
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="content-area">
          <div className="page-container">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                  Cashout & Financial Approvals
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Manage operational cash advances, supplier reimbursements, and approval queues.
                </p>
              </div>

              <button 
                onClick={() => openModal()} 
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.15rem' }}
              >
                <Plus size={16} /> Request Cashout
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <button 
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Activity size={16} /> Overview & Analytics
              </button>
              <button 
                className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <FileText size={16} /> Approval Queue ({kpis.pendingCount})
              </button>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="stat-card" style={{ '--stat-glow-color': '#10b981' }}>
                    <div className="stat-header">
                      <div>
                        <div className="stat-title">Total Disbursed (Completed)</div>
                        <div className="stat-value font-mono" style={{ color: '#34d399' }}>{formatCurrency(kpis.totalCompleted)}</div>
                      </div>
                      <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <CheckCircle size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ '--stat-glow-color': '#fbbf24' }}>
                    <div className="stat-header">
                      <div>
                        <div className="stat-title">Pending Approvals</div>
                        <div className="stat-value font-mono" style={{ color: '#fbbf24' }}>{kpis.pendingCount} Requests</div>
                      </div>
                      <div className="stat-icon" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}>
                        <Clock size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ '--stat-glow-color': '#06b6d4' }}>
                    <div className="stat-header">
                      <div>
                        <div className="stat-title">Pending Amount Value</div>
                        <div className="stat-value font-mono" style={{ color: '#38bdf8' }}>{formatCurrency(kpis.pendingAmount)}</div>
                      </div>
                      <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
                        <Wallet size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Request Status Breakdown
                    </h3>
                    <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4}>
                              {pieData.map(entry => (
                                <Cell key={entry.name} fill={COLORS[entry.name] || 'var(--primary)'} stroke="rgba(0,0,0,0.5)" />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ background: 'rgba(10, 15, 28, 0.95)', border: '1px solid var(--border)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.8125rem' }} 
                            />
                            <Legend wrapperStyle={{ fontSize: '0.8125rem' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ color: 'var(--text-subtle)', fontSize: '0.875rem' }}>No cashout records available.</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Monthly Cashout Volume Trend
                    </h3>
                    <div style={{ height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                          <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} />
                          <RechartsTooltip 
                            formatter={(value) => formatCurrency(value)} 
                            contentStyle={{ background: 'rgba(10, 15, 28, 0.95)', border: '1px solid var(--border)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.8125rem' }} 
                          />
                          <Bar dataKey="Amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REQUESTS QUEUE */}
            {activeTab === 'requests' && (
              <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '320px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search requester, cust code, purpose..." 
                      value={globalSearch} 
                      onChange={(e) => setGlobalSearch(e.target.value)} 
                      style={{ paddingLeft: '2.25rem' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--text-muted)" />
                    <select 
                      value={filters.status || ''} 
                      onChange={(e) => handleFilterChange('status', e.target.value)} 
                      style={{ width: 'auto', minWidth: '130px' }}
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ minWidth: '950px' }}>
                    <thead>
                      <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('requestDate')}>
                          Req Date <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('staffName')}>
                          Requester <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('custCode')}>
                          Cust Code <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ticketId')}>
                          Ticket ID <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th>Purpose</th>
                        <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                          Amount <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('completionDate')}>
                          Completed <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                        </th>
                        <th style={{ textAlign: 'center' }}>Quick Approvals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map(c => (
                        <tr key={c.id}>
                          <td className="font-mono" style={{ fontSize: '0.8125rem', color: '#fbbf24' }}>{c.requestDate}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.staffName}</td>
                          <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '600' }}>{c.custCode || '-'}</td>
                          <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{c.ticketId || '-'}</td>
                          <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }} title={c.purpose}>
                            {c.purpose}
                          </td>
                          <td className="font-mono" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                            {formatCurrency(c.amount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {getStatusBadge(c.status)}
                          </td>
                          <td className="font-mono" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            {c.completionDate || '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                              {canEditRecord(c.staffName) && (
                                <button 
                                  onClick={() => openModal(c)} 
                                  title="Edit Record" 
                                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              
                              {c.status === 'Pending' && (
                                <>
                                  <button 
                                    onClick={() => canEditAny && updateStatus(c.id, 'Approved')} 
                                    disabled={!canEditAny}
                                    title={canEditAny ? "Approve Request" : "Requires Manager role"} 
                                    style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: canEditAny ? 'pointer' : 'not-allowed', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Check size={13} /> Approve
                                  </button>
                                  <button 
                                    onClick={() => canEditAny && updateStatus(c.id, 'Rejected')} 
                                    disabled={!canEditAny}
                                    title={canEditAny ? "Reject Request" : "Requires Manager role"} 
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: canEditAny ? 'pointer' : 'not-allowed', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </>
                              )}

                              {c.status === 'Approved' && (
                                <button 
                                  onClick={() => canEditAny && updateStatus(c.id, 'Completed')} 
                                  disabled={!canEditAny}
                                  title={canEditAny ? "Mark Disbursed" : "Requires Manager role"} 
                                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: canEditAny ? 'pointer' : 'not-allowed', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <CheckCircle size={13} /> Disburse
                                </button>
                              )}

                              {canDelete && (
                                <button 
                                  onClick={() => { if(window.confirm('Delete this cashout request?')) deleteCashout(c.id); }} 
                                  title="Delete Record" 
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No matching cashout requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Wallet size={18} color="var(--primary)" /> {formData.id ? 'Edit Cashout Request' : 'New Cashout Advance Request'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Request Date</label>
                  <input type="date" value={formData.requestDate || ''} onChange={e => setFormData({...formData, requestDate: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Requester Staff</label>
                  <input type="text" value={formData.staffName || ''} onChange={e => setFormData({...formData, staffName: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Amount (IDR)</label>
                  <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Customer / Booking Code</label>
                  <input type="text" value={formData.custCode || ''} onChange={e => setFormData({...formData, custCode: e.target.value})} placeholder="e.g. TC-8890" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Purpose / Expense Breakdown</label>
                <textarea rows="3" value={formData.purpose || ''} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="Describe operational reason..." required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cashout;
