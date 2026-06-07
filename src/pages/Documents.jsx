import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useDocuments } from '../context/DocumentContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, X, User, Globe, Clipboard, 
  Receipt, Phone, Ticket, BarChart2, FileText, AlertCircle, Clock, CheckCircle, AlertTriangle,
  Truck, Inbox, MapPin, Box, ArrowUpDown, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useDataTable } from '../hooks/useDataTable';
import Pagination from '../components/Pagination';

const Documents = () => {
  const { documents, addDocument, updateDocument, deleteDocument } = useDocuments();
  const { users } = useUsers();
  const { user } = useAuth();
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  
  const [formData, setFormData] = useState({
    receiveDate: '',
    sendDate: '',
    guestName: '',
    country: '',
    processType: 'Normal',
    bookingCode: '',
    invoiceNumber: '',
    phoneNumber: '',
    estimatedDone: '',
    staff: '',
    tourCode: '',
    notes: ''
  });

  // Shipping & Receiving States
  const [shippingDoc, setShippingDoc] = useState(null);
  const [shippingData, setShippingData] = useState({
    sendDate: new Date().toISOString().split('T')[0],
    shippingMethod: 'Messenger',
    shippingCourier: '',
    shippingResi: '',
    shippingNotes: ''
  });

  const [receiveDoc, setReceiveDoc] = useState(null);
  const [receiveData, setReceiveData] = useState({
    receivedStatus: 'Final'
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData(doc);
    } else {
      setEditingDoc(null);
      setFormData({
        receiveDate: '',
        sendDate: '',
        guestName: '',
        country: '',
        processType: 'Normal',
        bookingCode: '',
        invoiceNumber: '',
        phoneNumber: '',
        estimatedDone: '',
        staff: '',
        tourCode: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  const handleOpenPreview = (doc) => setPreviewDoc(doc);
  const handleClosePreview = () => setPreviewDoc(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDoc) {
      updateDocument(editingDoc.id, formData);
    } else {
      addDocument(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document record?')) {
      deleteDocument(id);
    }
  };

  const handleOpenShipping = (doc) => {
    setShippingDoc(doc);
    setShippingData({
      sendDate: new Date().toISOString().split('T')[0],
      shippingMethod: doc.shippingMethod || 'Messenger',
      shippingCourier: doc.shippingCourier || '',
      shippingResi: doc.shippingResi || '',
      shippingNotes: doc.shippingNotes || ''
    });
  };

  const handleCloseShipping = () => {
    setShippingDoc(null);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    updateDocument(shippingDoc.id, {
      ...shippingData,
      shippingStatus: 'Sent'
    });
    handleCloseShipping();
  };

  const handleOpenReceive = (doc) => {
    setReceiveDoc(doc);
    setReceiveData({
      receivedStatus: 'Final'
    });
  };

  const handleCloseReceive = () => {
    setReceiveDoc(null);
  };

  const handleReceiveSubmit = (e) => {
    e.preventDefault();
    updateDocument(receiveDoc.id, {
      receivedStatus: receiveData.receivedStatus,
      shippingStatus: receiveData.receivedStatus === 'Final' ? 'Received' : 'Returned'
    });
    handleCloseReceive();
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

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  // Dashboard Calculations
  const activeDocs = documents.filter(d => d.shippingStatus !== 'Received');
  const completedDocs = documents.filter(d => d.shippingStatus === 'Received');
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const overdueDocs = documents.filter(d => {
    if (d.shippingStatus === 'Received' || !d.estimatedDone) return false;
    const estDate = new Date(d.estimatedDone);
    estDate.setHours(0,0,0,0);
    return estDate < today;
  });

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
  } = useDataTable(documents, { key: 'receiveDate', direction: 'desc' }, 10);

  let totalProcessingTime = 0;
  let docsWithProcessingTime = 0;
  completedDocs.forEach(d => {
    if (d.receiveDate && d.sendDate) {
      const start = new Date(d.receiveDate);
      const end = new Date(d.sendDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalProcessingTime += diffDays;
      docsWithProcessingTime++;
    }
  });
  const avgProcessingTime = docsWithProcessingTime > 0 ? Math.round(totalProcessingTime / docsWithProcessingTime) : 0;

  // Urgency Distribution
  const urgencyMap = { 'Normal': 0, 'Express': 0, 'Urgent': 0 };
  activeDocs.forEach(d => {
    if (urgencyMap[d.processType] !== undefined) {
      urgencyMap[d.processType]++;
    }
  });
  const urgencyData = [
    { name: 'Normal', value: urgencyMap['Normal'], color: '#3b82f6' },
    { name: 'Express', value: urgencyMap['Express'], color: '#f59e0b' },
    { name: 'Urgent', value: urgencyMap['Urgent'], color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Workload by Staff
  const staffMap = {};
  documents.forEach(d => {
    const staff = d.staff || 'Unknown';
    if (!staffMap[staff]) staffMap[staff] = { name: staff.split(' ')[0], Active: 0, Completed: 0 };
    if (!d.sendDate) staffMap[staff].Active++;
    else staffMap[staff].Completed++;
  });
  const workloadData = Object.values(staffMap).sort((a, b) => (b.Active + b.Completed) - (a.Active + a.Completed));

  // Top Countries
  const countryMap = {};
  documents.forEach(d => {
    const c = d.country || 'Unknown';
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const pieColors = ['#0ea5e9', '#eab308', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#64748b', '#ec4899'];
  const countryData = Object.keys(countryMap).map((k, i) => ({
    name: k,
    value: countryMap[k],
    color: pieColors[i % pieColors.length]
  })).sort((a,b) => b.value - a.value).slice(0, 5);

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      
      {/* Mobile Overlay */}
      <div 
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} 
        onClick={closeMobile}
      ></div>

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Documents Management</h1>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={20} /> Add Document
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
              <FileText size={16} /> Input & Database
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <div className="fade-in">
              {/* Top Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Active Processing
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={32} /> {activeDocs.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting for send date</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase' }}>
                    Overdue Documents
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={32} /> {overdueDocs.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Past estimated done date</div>
                </div>

                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Total Completed
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={32} /> {completedDocs.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully processed</div>
                </div>

                <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Avg Processing Time
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem' }}>
                    {avgProcessingTime} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From receive to send</div>
                </div>
              </div>

              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    <BarChart2 size={18} /> Workload by Staff
                  </h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    {workloadData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                          <Legend />
                          <Bar dataKey="Active" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    <AlertCircle size={18} /> Active Documents Urgency
                  </h3>
                  <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {urgencyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={urgencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {urgencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>No active documents.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Required Table */}
              {overdueDocs.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                    <AlertTriangle size={20} /> Action Required: Overdue Documents
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ background: 'transparent' }}>
                      <thead>
                        <tr>
                          <th style={{ color: '#ef4444' }}>GUEST NAME</th>
                          <th style={{ color: '#ef4444' }}>COUNTRY</th>
                          <th style={{ color: '#ef4444' }}>PROCESS</th>
                          <th style={{ color: '#ef4444' }}>EST. DONE</th>
                          <th style={{ color: '#ef4444' }}>STAFF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueDocs.map(doc => (
                          <tr key={doc.id}>
                            <td><strong>{doc.guestName}</strong></td>
                            <td>{doc.country}</td>
                            <td>
                              <span className={`badge ${doc.processType === 'Urgent' ? 'badge-danger' : doc.processType === 'Express' ? 'badge-warning' : 'badge-primary'}`}>
                                {doc.processType}
                              </span>
                            </td>
                            <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{doc.estimatedDone}</td>
                            <td>{doc.staff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
              <div className="card fade-in" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowX: 'auto', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                  <table className="data-table">
                    <thead style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                      <tr>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('receiveDate')}>
                              TGL TERIMA <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('guestName')}>
                              NAMA TAMU <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.guestName || ''} onChange={(e) => handleFilterChange('guestName', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('country')}>
                              NEGARA <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.country || ''} onChange={(e) => handleFilterChange('country', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('shippingStatus')}>
                              STATUS LOGISTIK <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <input type="text" placeholder="Filter..." value={filters.shippingStatus || ''} onChange={(e) => handleFilterChange('shippingStatus', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                          </div>
                        </th>
                        <th>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('estimatedDone')}>
                              EST. SELESAI <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
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
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              ACTIONS
                            </div>
                            <div style={{ height: '24px' }}></div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.receiveDate}</td>
                          <td>{doc.guestName}</td>
                          <td>{doc.country || '-'}</td>
                          <td>
                            <span className={`badge ${doc.shippingStatus === 'Received' ? 'badge-primary' : doc.shippingStatus === 'Sent' ? 'badge-warning' : doc.shippingStatus === 'Returned' ? 'badge-danger' : 'badge-primary'}`} style={{background: doc.shippingStatus === 'Received' ? 'rgba(16, 185, 129, 0.1)' : undefined, color: doc.shippingStatus === 'Received' ? '#10b981' : undefined}}>
                              {doc.shippingStatus || 'Processing'}
                            </span>
                          </td>
                          <td>{doc.estimatedDone || '-'}</td>
                          <td>{doc.staff}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn" 
                                style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                onClick={() => handleOpenPreview(doc)}
                                title="Preview Data"
                              >
                                <Eye size={16} />
                              </button>
                              {canEditRecord(doc.staff) && (
                                <>
                                  {doc.shippingStatus !== 'Sent' && doc.shippingStatus !== 'Received' && (
                                    <button 
                                      className="btn" 
                                      style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}
                                      onClick={() => handleOpenShipping(doc)}
                                      title="Kirim Dokumen"
                                    >
                                      <Truck size={16} />
                                    </button>
                                  )}
                                  {doc.shippingStatus === 'Sent' && (
                                    <button 
                                      className="btn" 
                                      style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                      onClick={() => handleOpenReceive(doc)}
                                      title="Terima Dokumen"
                                    >
                                      <Inbox size={16} />
                                    </button>
                                  )}
                                  <button 
                                    className="btn" 
                                    style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}
                                    onClick={() => handleOpenModal(doc)}
                                    title="Edit Dokumen"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </>
                              )}
                              {canDelete && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                                  onClick={() => handleDelete(doc.id)}
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {documents.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No document records found. Click "Add Document" to create one.
                          </td>
                        </tr>
                      )}
                      {documents.length > 0 && paginatedData.length === 0 && (
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
          <div className="modal-content fade-in" style={{ maxWidth: '800px', background: '#1e293b', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
                <Plus size={24} color="#eab308" /> {editingDoc ? 'Edit Document' : 'Add Document'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Receive Date<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.receiveDate} 
                    onChange={e => setFormData({...formData, receiveDate: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                  {!formData.receiveDate && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>⚠️ This field is required</div>}
                </div>
                
                <div className="input-group">
                  <label>Send Date</label>
                  <input 
                    type="date" 
                    value={formData.sendDate} 
                    onChange={e => setFormData({...formData, sendDate: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                <div className="input-group">
                  <label>Guest Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{...iconStyle, color: '#8b5cf6'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="Nama Tamu"
                      value={formData.guestName} 
                      onChange={e => setFormData({...formData, guestName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Passport/Visa Country</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={16} style={{...iconStyle, color: '#3b82f6'}} />
                    <input 
                      type="text" 
                      placeholder="Country name"
                      value={formData.country} 
                      onChange={e => setFormData({...formData, country: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Process Type<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.processType} 
                    onChange={e => setFormData({...formData, processType: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Express">Express</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Booking Code</label>
                  <div style={{ position: 'relative' }}>
                    <Clipboard size={16} style={{...iconStyle, color: '#f97316'}} />
                    <input 
                      type="text" 
                      placeholder="BKG-001"
                      value={formData.bookingCode} 
                      onChange={e => setFormData({...formData, bookingCode: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Invoice Number</label>
                  <div style={{ position: 'relative' }}>
                    <Receipt size={16} style={{...iconStyle, color: '#94a3b8'}} />
                    <input 
                      type="text" 
                      placeholder="INV-001"
                      value={formData.invoiceNumber} 
                      onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{...iconStyle, color: '#ec4899'}} />
                    <input 
                      type="text" 
                      placeholder="+62..."
                      value={formData.phoneNumber} 
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Estimated Done</label>
                  <input 
                    type="date" 
                    value={formData.estimatedDone} 
                    onChange={e => setFormData({...formData, estimatedDone: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                <div className="input-group">
                  <label>Staff<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={e => setFormData({...formData, staff: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', textTransform: 'uppercase' }}
                  >
                    <option value="">Select Staff</option>
                    {activeStaff.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Tour Code</label>
                  <div style={{ position: 'relative' }}>
                    <Ticket size={16} style={{...iconStyle, color: '#eab308'}} />
                    <input 
                      type="text" 
                      placeholder="TRV-001"
                      value={formData.tourCode} 
                      onChange={e => setFormData({...formData, tourCode: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '0.5rem' }}>
                <label>Notes</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    rows="4"
                    maxLength="500"
                    value={formData.notes || ''} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', width: '100%', resize: 'vertical' }}
                  ></textarea>
                  <div style={{ position: 'absolute', bottom: '0.5rem', right: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {(formData.notes || '').length} / 500
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none', fontWeight: 'bold' }}>
                  {editingDoc ? 'Update Document' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIPPING MODAL */}
      {shippingDoc && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '500px', background: '#1e293b', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
                <Truck size={24} color="#f59e0b" /> Kirim Dokumen
              </h2>
              <button onClick={handleCloseShipping} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleShippingSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.25rem' }}>{shippingDoc.guestName}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{shippingDoc.country || shippingDoc.processType}</span>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-group">
                  <label>Tanggal Kirim<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={shippingData.sendDate} 
                    onChange={e => setShippingData({...shippingData, sendDate: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                <div className="input-group">
                  <label>Metode Pengiriman<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={shippingData.shippingMethod} 
                    onChange={e => setShippingData({...shippingData, shippingMethod: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  >
                    <option value="Messenger">Messenger (Kurir Internal)</option>
                    <option value="Ekspedisi">Ekspedisi (JNE/Tiki/dll)</option>
                  </select>
                </div>

                {shippingData.shippingMethod === 'Ekspedisi' && (
                  <>
                    <div className="input-group">
                      <label>Jasa Ekspedisi<span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Contoh: JNE / TIKI / SiCepat"
                        value={shippingData.shippingCourier} 
                        onChange={e => setShippingData({...shippingData, shippingCourier: e.target.value})}
                        style={{ background: '#0f172a', border: '1px solid #334155' }}
                      />
                    </div>
                    <div className="input-group">
                      <label>Nomor Resi<span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Masukkan no resi..."
                        value={shippingData.shippingResi} 
                        onChange={e => setShippingData({...shippingData, shippingResi: e.target.value})}
                        style={{ background: '#0f172a', border: '1px solid #334155' }}
                      />
                    </div>
                  </>
                )}

                <div className="input-group">
                  <label>Catatan Pengiriman</label>
                  <textarea 
                    rows="3"
                    placeholder="Contoh: Dititipkan ke satpam"
                    value={shippingData.shippingNotes} 
                    onChange={e => setShippingData({...shippingData, shippingNotes: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', width: '100%', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                <button type="button" className="btn" onClick={handleCloseShipping} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold' }}>
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE MODAL */}
      {receiveDoc && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '400px', background: '#1e293b', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
                <Inbox size={24} color="#10b981" /> Terima Dokumen
              </h2>
              <button onClick={handleCloseReceive} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleReceiveSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.25rem' }}>{receiveDoc.guestName}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Dikirim via: {receiveDoc.shippingMethod} {receiveDoc.shippingCourier ? `(${receiveDoc.shippingCourier})` : ''}</span>
              </div>

              <div className="input-group">
                <label>Status Penerimaan<span style={{color: '#ef4444'}}>*</span></label>
                <select 
                  required 
                  value={receiveData.receivedStatus} 
                  onChange={e => setReceiveData({...receiveData, receivedStatus: e.target.value})}
                  style={{ background: '#0f172a', border: '1px solid #334155' }}
                >
                  <option value="Final">Diterima (Final)</option>
                  <option value="Needs Return">Dikembalikan / Perlu Dikirim Ulang</option>
                </select>
              </div>
              {receiveData.receivedStatus === 'Needs Return' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={14} /> Dokumen akan berstatus "Returned" dan perlu dikirim ulang.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                <button type="button" className="btn" onClick={handleCloseReceive} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc' }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold' }}>
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '600px', background: '#1e293b', padding: 0, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>
                <Eye size={20} color="#10b981" /> Document Details Preview
              </h2>
              <button type="button" onClick={handleClosePreview} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.5rem' }}>{previewDoc.guestName}</h3>
                  <div style={{ color: '#0ea5e9', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={16} /> {previewDoc.country || '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${previewDoc.shippingStatus === 'Received' ? 'badge-primary' : previewDoc.shippingStatus === 'Sent' ? 'badge-warning' : previewDoc.shippingStatus === 'Returned' ? 'badge-danger' : 'badge-primary'}`} style={{background: previewDoc.shippingStatus === 'Received' ? 'rgba(16, 185, 129, 0.1)' : undefined, color: previewDoc.shippingStatus === 'Received' ? '#10b981' : undefined, fontSize: '1rem', padding: '0.5rem 1rem'}}>
                    {previewDoc.shippingStatus || 'Processing'}
                  </span>
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Process Type</span>
                    <strong style={{ color: '#f8fafc' }}>{previewDoc.processType}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Receive Date</span>
                    <strong style={{ color: '#f8fafc' }}>{previewDoc.receiveDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Send Date</span>
                    <strong style={{ color: '#f8fafc' }}>{previewDoc.sendDate || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Estimated Done</span>
                    <strong style={{ color: '#f8fafc' }}>{previewDoc.estimatedDone || '-'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Booking Info</h4>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Booking Code: <span style={{ color: '#f59e0b' }}>{previewDoc.bookingCode || '-'}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Invoice Number: <span style={{ color: '#94a3b8' }}>{previewDoc.invoiceNumber || '-'}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      Tour Code: <span style={{ color: '#eab308' }}>{previewDoc.tourCode || '-'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Shipping Details</h4>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Method:</span>
                      <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{previewDoc.shippingMethod || '-'}</span>
                    </div>
                    {previewDoc.shippingCourier && (
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Courier:</span>
                        <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{previewDoc.shippingCourier} (Resi: {previewDoc.shippingResi})</span>
                      </div>
                    )}
                    {previewDoc.shippingNotes && (
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Notes:</span>
                        <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{previewDoc.shippingNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Handled by: <strong style={{ color: '#f8fafc' }}>{previewDoc.staff}</strong></span>
                {previewDoc.phoneNumber && (
                  <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={14} color="#ec4899" /> {previewDoc.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
