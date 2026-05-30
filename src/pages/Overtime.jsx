import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useOvertimes } from '../context/OvertimeContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, X, Clock, Calendar, FileText, 
  BarChart2, CheckCircle, AlertCircle, User, ArrowUpDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useDataTable } from '../hooks/useDataTable';
import Pagination from '../components/Pagination';

const Overtime = () => {
  const { overtimes, addOvertime, updateOvertime, deleteOvertime } = useOvertimes();
  const { users } = useUsers();
  const { user } = useAuth();
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOT, setEditingOT] = useState(null);
  
  const initialFormData = {
    staff: '',
    eventName: '',
    date: '',
    hours: '',
    status: 'Pending',
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handleOpenModal = (ot = null) => {
    if (ot) {
      setEditingOT(ot);
      setFormData(ot);
    } else {
      setEditingOT(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOT(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOT) {
      updateOvertime(editingOT.id, formData);
    } else {
      addOvertime(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this overtime record?')) {
      deleteOvertime(id);
    }
  };

  const inputStyle = {
    paddingLeft: '2.5rem',
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

  const getStatusBadge = (status) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Pending') return 'badge-warning';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-primary';
  };

  // Dashboard Metrics
  const pendingCount = overtimes.filter(o => o.status === 'Pending').length;
  const approvedHours = overtimes.filter(o => o.status === 'Approved').reduce((sum, o) => sum + parseFloat(o.hours || 0), 0);

  // Setup DataTable hook
  const {
    filters,
    handleSort,
    handleFilterChange,
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    itemsPerPage
  } = useDataTable(overtimes, { key: 'date', direction: 'desc' }, 10);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  const statusMap = {};
  overtimes.forEach(o => {
    const s = o.status || 'Pending';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const pieColors = { 'Pending': '#f59e0b', 'Approved': '#10b981', 'Rejected': '#ef4444' };
  const statusData = Object.keys(statusMap).map(k => ({
    name: k,
    value: statusMap[k],
    color: pieColors[k] || '#64748b'
  }));

  const staffMap = {};
  overtimes.forEach(o => {
    if (o.status !== 'Rejected') {
      const s = o.staff || 'Unknown';
      if (!staffMap[s]) staffMap[s] = { name: s.split(' ')[0], Hours: 0 };
      staffMap[s].Hours += parseFloat(o.hours || 0);
    }
  });
  const staffData = Object.values(staffMap).sort((a, b) => b.Hours - a.Hours);

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      <div 
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} 
        onClick={closeMobile}
      ></div>

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="section-title" style={{ marginBottom: 0 }}>Overtime Reporting</h1>
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={20} /> Add Overtime
              </button>
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
                <FileText size={16} /> Database
              </button>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="fade-in">
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Requests</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={32} /> {pendingCount}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Hours</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={32} /> {approvedHours}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={32} /> {overtimes.length}
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <BarChart2 size={18} /> Overtime Hours by Staff (Pending + Approved)
                    </h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      {staffData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={staffData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Bar dataKey="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <CheckCircle size={18} /> Requests by Status
                    </h3>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>No records yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card fade-in" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowX: 'auto', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                  <table className="data-table">
                    <thead style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                      <tr>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('staff')}>
                              STAFF <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.staff || ''} onChange={(e) => handleFilterChange('staff', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('eventName')}>
                              EVENT NAME <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.eventName || ''} onChange={(e) => handleFilterChange('eventName', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                              DATE <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('hours')}>
                              HOURS <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                              STATUS <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.status || ''} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              REMARKS
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              ACTIONS
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map(ot => (
                      <tr key={ot.id}>
                        <td style={{ fontWeight: '500' }}>{ot.staff}</td>
                        <td>{ot.eventName}</td>
                        <td>{ot.date}</td>
                        <td style={{ fontWeight: '600', color: '#3b82f6' }}>{ot.hours} hrs</td>
                        <td>
                          <span className={`badge ${getStatusBadge(ot.status)}`}>
                            {ot.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ot.remarks}>
                            {ot.remarks || '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {canEditRecord(ot.staff) && (
                              <button 
                                className="btn" 
                                style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}
                                onClick={() => handleOpenModal(ot)}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                className="btn" 
                                style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                                onClick={() => handleDelete(ot.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {overtimes.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No overtime records found. Click "Add Overtime" to create one.
                        </td>
                      </tr>
                    )}
                    {overtimes.length > 0 && paginatedData.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No matching records found.
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '600px', background: '#111827', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #1f2937' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#eab308' }}>
                <Plus size={24} color="#eab308" /> {editingOT ? 'Edit Overtime' : 'Add Overtime'}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                
                {/* Row 1 */}
                <div className="input-group">
                  <label>Staff<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={e => setFormData({...formData, staff: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #eab308', textTransform: 'uppercase', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none' }}
                  >
                    <option value="">Select Staff</option>
                    {activeStaff.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Event Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{...iconStyle, color: '#a78bfa'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g., Weekend tour support"
                      value={formData.eventName} 
                      onChange={e => setFormData({...formData, eventName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="input-group">
                  <label>Date<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                <div className="input-group">
                  <label>Hours<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    required 
                    placeholder="e.g., 4.5"
                    value={formData.hours} 
                    onChange={e => setFormData({...formData, hours: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', outline: 'none', color: '#f8fafc' }}
                  />
                </div>

                {/* Row 3 - Full Width Status */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Status<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Row 4 - Full Width Remarks */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Remarks</label>
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      placeholder="Additional notes"
                      value={formData.remarks}
                      onChange={e => {
                        if (e.target.value.length <= 500) {
                          setFormData({...formData, remarks: e.target.value});
                        }
                      }}
                      style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1rem', width: '100%', outline: 'none', color: '#f8fafc', minHeight: '100px', resize: 'vertical', paddingBottom: '2rem' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      {formData.remarks.length} / 500
                    </div>
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1f2937' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none', fontWeight: 'bold' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overtime;
