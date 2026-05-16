import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useHotels } from '../context/HotelContext';
import { useUsers } from '../context/UserContext';
import { 
  Plus, Edit2, Trash2, X, Building, Tag, Users as UsersIcon, Map as MapIcon, 
  BarChart2, FileText, Calendar, CheckSquare, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const Hotel = () => {
  const { hotels, addHotel, updateHotel, deleteHotel } = useHotels();
  const { users } = useUsers();
  const activeStaff = users.filter(u => u.status === 'Active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  
  const initialFormData = {
    checkIn: '',
    checkOut: '',
    hotelName: '',
    region: 'Afghanistan',
    confirmationNumber: '',
    guestList: '',
    supplierCode: '',
    supplierName: '',
    staff: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const handleOpenModal = (hotel = null) => {
    if (hotel) {
      setEditingHotel(hotel);
      setFormData(hotel);
    } else {
      setEditingHotel(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHotel(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHotel) {
      updateHotel(editingHotel.id, formData);
    } else {
      addHotel(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this hotel booking?')) {
      deleteHotel(id);
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
    if (['Active', 'Confirmed'].includes(status)) return 'badge-success';
    if (['Upcoming'].includes(status)) return 'badge-warning';
    if (['Past Date', 'Cancel', 'Cancelled'].includes(status)) return 'badge-danger';
    return 'badge-primary';
  };

  // Dashboard Metrics
  const activeStays = hotels.filter(h => h.status === 'Active');
  const upcomingStays = hotels.filter(h => h.status === 'Upcoming');

  const totalGuests = hotels.reduce((sum, h) => {
    if (!h.guestList) return sum;
    const count = h.guestList.split(',').filter(g => g.trim() !== '').length;
    return sum + count;
  }, 0);

  const regionMap = {};
  hotels.forEach(h => {
    const r = h.region || 'Unknown';
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  const pieColors = ['#0ea5e9', '#eab308', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#64748b', '#ec4899'];
  const regionData = Object.keys(regionMap).map((k, i) => ({
    name: k,
    value: regionMap[k],
    color: pieColors[i % pieColors.length]
  })).sort((a,b) => b.value - a.value);

  const staffMap = {};
  hotels.forEach(h => {
    const s = h.staff || 'Unknown';
    if (!staffMap[s]) staffMap[s] = { name: s.split(' ')[0], Bookings: 0 };
    staffMap[s].Bookings++;
  });
  const staffData = Object.values(staffMap).sort((a, b) => b.Bookings - a.Bookings);

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
              <h1 className="section-title" style={{ marginBottom: 0 }}>Hotel Bookings</h1>
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={20} /> Add Hotel Booking
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
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Stays (Checked-In)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckSquare size={32} /> {activeStays.length}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Check-Ins</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={32} /> {upcomingStays.length}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Guests Managed</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UsersIcon size={32} /> {totalGuests}
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
                            <Bar dataKey="Bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <MapIcon size={18} /> Most Popular Regions
                    </h3>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {regionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={regionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {regionData.map((entry, index) => (
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
                      <th>HOTEL NAME</th>
                      <th>CHECK IN/OUT</th>
                      <th>REGION</th>
                      <th>GUESTS</th>
                      <th>SUPPLIER</th>
                      <th>STAFF</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.map(htl => (
                      <tr key={htl.id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{htl.hotelName}</div>
                          {htl.confirmationNumber && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ref: {htl.confirmationNumber}</div>
                          )}
                        </td>
                        <td>
                          <div>{htl.checkIn}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {htl.checkOut}</div>
                        </td>
                        <td>{htl.region}</td>
                        <td>
                          <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={htl.guestList}>
                            {htl.guestList || '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{htl.supplierName || '-'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{htl.supplierCode}</div>
                        </td>
                        <td>{htl.staff}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(htl.status)}`}>
                            {htl.status || 'Upcoming'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn" 
                              style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}
                              onClick={() => handleOpenModal(htl)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn" 
                              style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                              onClick={() => handleDelete(htl.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {hotels.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No hotel records found. Click "Add Hotel Booking" to create one.
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
                <Plus size={24} color="#eab308" /> {editingHotel ? 'Edit Hotel Booking' : 'Add Hotel Booking'}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-grid">
                
                {/* Row 1 */}
                <div className="input-group">
                  <label>Check-In<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.checkIn} 
                    onChange={e => setFormData({...formData, checkIn: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                  {!formData.checkIn && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>⚠️ This field is required</div>}
                </div>

                <div className="input-group">
                  <label>Check-Out<span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.checkOut} 
                    onChange={e => setFormData({...formData, checkOut: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155' }}
                  />
                </div>

                {/* Row 2 */}
                <div className="input-group">
                  <label>Hotel Name<span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{...iconStyle, color: '#f59e0b'}} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g., Grand Hyatt Jakarta"
                      value={formData.hotelName} 
                      onChange={e => setFormData({...formData, hotelName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Region<span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    required 
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #10b981', color: '#f8fafc', padding: '0.75rem 1rem' }}
                  >
                    <option value="Afghanistan">Afghanistan</option>
                    <option value="Albania">Albania</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Japan">Japan</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>

                {/* Row 3 - Full Width Confirmation */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Confirmation Number</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={{...iconStyle, color: '#ef4444'}} />
                    <input 
                      type="text" 
                      placeholder="Booking confirmation number"
                      value={formData.confirmationNumber} 
                      onChange={e => setFormData({...formData, confirmationNumber: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 4 - Full Width Textarea */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Guest List</label>
                  <textarea 
                    placeholder="List of guests (comma separated)"
                    value={formData.guestList}
                    onChange={e => setFormData({...formData, guestList: e.target.value})}
                    style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1rem', width: '100%', outline: 'none', color: '#f8fafc', minHeight: '100px', resize: 'vertical' }}
                  />
                </div>

                {/* Row 5 */}
                <div className="input-group">
                  <label>Supplier Code</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{...iconStyle, color: '#8b5cf6'}} />
                    <input 
                      type="text" 
                      placeholder="Hotel supplier code"
                      value={formData.supplierCode} 
                      onChange={e => setFormData({...formData, supplierCode: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Supplier Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{...iconStyle, color: '#8b5cf6'}} />
                    <input 
                      type="text" 
                      placeholder="Hotel supplier name"
                      value={formData.supplierName} 
                      onChange={e => setFormData({...formData, supplierName: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 6 */}
                <div className="input-group">
                  <label>Staff<span style={{color: '#ef4444'}}>*</span></label>
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
    </div>
  );
};

export default Hotel;
