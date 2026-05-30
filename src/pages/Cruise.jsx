import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useCruises } from '../context/CruiseContext';
import { useUsers } from '../context/UserContext';
import { 
  Plus, Edit2, Trash2, X, Ship, Anchor, Map as MapIcon, User, Phone, Mail, Ticket,
  BarChart2, FileText, Users, Calendar, ShipWheel, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const Cruise = () => {
  const { cruises, addCruise, updateCruise, deleteCruise } = useCruises();
  const { users } = useUsers();
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCruise, setEditingCruise] = useState(null);
  const [previewCruise, setPreviewCruise] = useState(null);
  const [participantInput, setParticipantInput] = useState('');
  
  const initialFormData = {
    cruiseBrand: '',
    shipName: '',
    sailingStart: '',
    sailingEnd: '',
    route: '',
    picName: '',
    participants: [],
    phoneNumber: '',
    email: '',
    reservationCode: '',
    staff: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handleOpenModal = (cruise = null) => {
    if (cruise) {
      setEditingCruise(cruise);
      setFormData(cruise);
    } else {
      setEditingCruise(null);
      setFormData(initialFormData);
    }
    setParticipantInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCruise(null);
  };

  const handleOpenPreview = (cruise) => setPreviewCruise(cruise);
  const handleClosePreview = () => setPreviewCruise(null);

  const handleParticipantKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (participantInput.trim()) {
        setFormData({
          ...formData,
          participants: [...formData.participants, participantInput.trim()]
        });
        setParticipantInput('');
      }
    }
  };

  const removeParticipant = (idxToRemove) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCruise) {
      updateCruise(editingCruise.id, formData);
    } else {
      addCruise(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this cruise booking?')) {
      deleteCruise(id);
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

  // Dashboard Metrics
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcomingSailings = cruises.filter(c => {
    if (!c.sailingStart) return false;
    const sDate = new Date(c.sailingStart);
    sDate.setHours(0,0,0,0);
    return sDate >= today;
  });

  const totalParticipants = cruises.reduce((sum, c) => sum + 1 + (c.participants?.length || 0), 0);

  const brandMap = {};
  cruises.forEach(c => {
    const b = c.cruiseBrand || 'Unknown';
    brandMap[b] = (brandMap[b] || 0) + 1;
  });
  const pieColors = ['#0ea5e9', '#eab308', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#64748b', '#ec4899'];
  const brandData = Object.keys(brandMap).map((k, i) => ({
    name: k,
    value: brandMap[k],
    color: pieColors[i % pieColors.length]
  })).sort((a,b) => b.value - a.value);

  const staffMap = {};
  cruises.forEach(c => {
    const s = c.staff || 'Unknown';
    if (!staffMap[s]) staffMap[s] = { name: s.split(' ')[0], Bookings: 0 };
    staffMap[s].Bookings++;
  });
  const staffData = Object.values(staffMap).sort((a, b) => b.Bookings - a.Bookings);

  const getStatusBadge = (status) => {
    if (['Upcoming', 'Confirm', 'Confirmed'].includes(status)) return 'badge-success';
    if (['Pending', 'Active'].includes(status)) return 'badge-warning';
    if (['Past Date', 'Cancel', 'Cancelled'].includes(status)) return 'badge-danger';
    return 'badge-primary';
  };

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
              <h1 className="section-title" style={{ marginBottom: 0 }}>Cruise Management</h1>
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={20} /> Add Cruise Booking
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
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Bookings</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={32} /> {cruises.length}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Sailings</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShipWheel size={32} /> {upcomingSailings.length}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Passengers</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={32} /> {totalParticipants}
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <BarChart2 size={18} /> Bookings by Staff
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
                            <Bar dataKey="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <Ship size={18} /> Cruise Brands Distribution
                    </h3>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {brandData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={brandData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {brandData.map((entry, index) => (
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
              <div className="card fade-in" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>BRAND & SHIP</th>
                      <th>SAILING DATES</th>
                      <th>ROUTE</th>
                      <th>PIC</th>
                      <th>PAX</th>
                      <th>STAFF</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cruises.map(crs => (
                      <tr key={crs.id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{crs.cruiseBrand}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{crs.shipName}</div>
                        </td>
                        <td>
                          <div>{crs.sailingStart}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {crs.sailingEnd}</div>
                        </td>
                        <td>{crs.route}</td>
                        <td>{crs.picName}</td>
                        <td>
                          <span className="badge badge-primary">{1 + (crs.participants?.length || 0)}</span>
                        </td>
                        <td>{crs.staff}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(crs.status)}`}>
                            {crs.status || 'Upcoming'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn" 
                              style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                              onClick={() => handleOpenPreview(crs)}
                              title="Preview Data"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="btn" 
                              style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}
                              onClick={() => handleOpenModal(crs)}
                              title="Edit Booking"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn" 
                              style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                              onClick={() => handleDelete(crs.id)}
                              title="Delete Booking"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cruises.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No cruise records found. Click "Add Cruise Booking" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '800px', background: '#111827', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #1f2937' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#eab308' }}>
                <Plus size={24} color="#eab308" /> {editingCruise ? 'Edit Cruise Booking' : 'Add New Cruise Booking'}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                
                {/* Row 1 */}
                <div className="input-group">
                  <label>Cruise Brand<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Ship size={16} style={{...iconStyle, color: '#ef4444'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g., Royal Caribbean"
                      value={formData.cruiseBrand} 
                      onChange={e => setFormData({...formData, cruiseBrand: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Ship Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Anchor size={16} style={{...iconStyle, color: '#0ea5e9'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g., Symphony of the Seas"
                      value={formData.shipName} 
                      onChange={e => setFormData({...formData, shipName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="input-group">
                  <label>Sailing Start<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.sailingStart} 
                    onChange={e => setFormData({...formData, sailingStart: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                <div className="input-group">
                  <label>Sailing End<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.sailingEnd} 
                    onChange={e => setFormData({...formData, sailingEnd: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                {/* Row 3 - Full Width Route */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Route<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <MapIcon size={16} style={{...iconStyle, color: '#3b82f6'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g., Singapore - Penang - Langkawi"
                      value={formData.route} 
                      onChange={e => setFormData({...formData, route: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="input-group">
                  <label>PIC Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{...iconStyle, color: '#8b5cf6'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="Person in charge"
                      value={formData.picName} 
                      onChange={e => setFormData({...formData, picName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Participants</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Type name and press Enter"
                      value={participantInput}
                      onChange={e => setParticipantInput(e.target.value)}
                      onKeyDown={handleParticipantKeyDown}
                      style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem', width: '100%', outline: 'none', color: '#f8fafc' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    Add participant names one by one
                  </div>
                  {/* Participants Tags */}
                  {formData.participants.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {formData.participants.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#334155', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>
                          <span>{p}</span>
                          <button type="button" onClick={() => removeParticipant(idx)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 5 */}
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
                  <label>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{...iconStyle, color: '#a78bfa'}} />
                    <input 
                      type="email" 
                      placeholder="contact@example.com"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 6 */}
                <div className="input-group">
                  <label>Reservation Code</label>
                  <div style={{ position: 'relative' }}>
                    <Ticket size={16} style={{...iconStyle, color: '#eab308'}} />
                    <input 
                      type="text" 
                      placeholder="Booking reference"
                      value={formData.reservationCode} 
                      onChange={e => setFormData({...formData, reservationCode: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Staff Handling<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={e => setFormData({...formData, staff: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', textTransform: 'uppercase', color: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none' }}
                  >
                    <option value="">Select Staff</option>
                    {activeStaff.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
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

      {/* PREVIEW MODAL */}
      {previewCruise && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '600px', background: '#1e293b', padding: 0, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #334155', background: '#0f172a' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>
                <Eye size={20} color="#10b981" /> Booking Preview
              </h2>
              <button type="button" onClick={handleClosePreview} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.5rem' }}>{previewCruise.cruiseBrand}</h3>
                  <div style={{ color: '#0ea5e9', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Anchor size={16} /> {previewCruise.shipName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getStatusBadge(previewCruise.status)}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    {previewCruise.status || 'Upcoming'}
                  </span>
                  <div style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Ref: <strong style={{ color: '#eab308' }}>{previewCruise.reservationCode || previewCruise.bookingRef || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Sailing Start</span>
                    <strong style={{ color: '#f8fafc' }}>{previewCruise.sailingStart}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Sailing End</span>
                    <strong style={{ color: '#f8fafc' }}>{previewCruise.sailingEnd}</strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Route</span>
                    <strong style={{ color: '#f8fafc' }}>{previewCruise.route}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact Person</h4>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.5rem' }}>{previewCruise.picName}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <Phone size={14} color="#ec4899" /> {previewCruise.phoneNumber || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      <Mail size={14} color="#a78bfa" /> {previewCruise.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Passengers ({1 + (previewCruise.participants?.length || 0)})</h4>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', maxHeight: '120px', overflowY: 'auto' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      <li style={{ color: '#eab308', fontWeight: '500' }}>{previewCruise.picName} (Lead)</li>
                      {previewCruise.participants && previewCruise.participants.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Handled by: <strong style={{ color: '#f8fafc' }}>{previewCruise.staff}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cruise;
