import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTours } from '../../context/TourContext';
import { formatCurrency } from '../../utils/currency';
import { Eye, Edit2, Trash2, ArrowUpDown, X, CheckSquare, Layers } from 'lucide-react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../Pagination';
import { useAuth } from '../../context/AuthContext';
import ExportMenu from '../ExportMenu';

const DatabaseTable = ({ onEdit, customData }) => {
  const { tours, deleteTour, updateTour } = useTours();
  const { user } = useAuth();
  const [viewingTour, setViewingTour] = useState(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const dataToUse = customData || tours.filter(t => t.status !== 'Past Date');

  // Flatten nested properties (like totalOmset) so useDataTable can sort it
  const flatTours = useMemo(() => {
    return dataToUse.map(t => ({
      ...t,
      totalOmset: t.financials?.totalOmset || 0,
      invoiceNumber: t.financials?.invoiceNumber || ''
    }));
  }, [dataToUse]);

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
  } = useDataTable(flatTours, { key: 'departureDate', direction: 'desc' }, 10);

  // Clear selections when page changes to prevent confusing state
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirm': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Cancel': return 'badge-danger';
      case 'Past Date': return 'badge-primary';
      default: return 'badge-primary';
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  const exportColumns = [
    { header: 'Tour Code', key: 'tourCode', format: null },
    { header: 'Booking Code', key: 'bookingCode', format: null },
    { header: 'Destination', key: 'country', format: null },
    { header: 'Departure Date', key: 'departureDate', format: null },
    { header: 'PIC Staff', key: 'pic', format: null },
    { header: 'Status', key: 'status', format: null },
    { header: 'Total Omset', key: 'totalOmset', format: 'currency' },
    { header: 'Invoice Number', key: 'invoiceNumber', format: null },
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (window.confirm(`Change status of ${selectedIds.size} selected tours to ${newStatus}?`)) {
      for (let id of selectedIds) {
        await updateTour(id, { status: newStatus, updatedBy: user?.name || 'System' });
      }
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${selectedIds.size} selected tours? This cannot be undone.`)) {
      for (let id of selectedIds) {
        await deleteTour(id);
      }
      setSelectedIds(new Set());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
        {/* Bulk Actions Menu (Shows when items selected) */}
        <div>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white', animation: 'fadeIn 0.2s' }}>
              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{selectedIds.size} Selected</span>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.3)' }}></div>
              <button onClick={() => handleBulkStatusChange('Confirm')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>Mark Confirm</button>
              <button onClick={() => handleBulkStatusChange('Pending')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>Mark Pending</button>
              <button onClick={() => handleBulkStatusChange('Cancel')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>Mark Cancel</button>
              
              {canDelete && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.3)' }}></div>
                  <button onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
                    <Trash2 size={14} /> Delete Selected
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <ExportMenu data={flatTours} columns={exportColumns} filename="Tours_Data" />
      </div>

      <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <table className="data-table" style={{ minWidth: '1050px' }}>
          <thead style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('tourCode')}>
                    Tour Code <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.tourCode || ''} onChange={(e) => handleFilterChange('tourCode', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('bookingCode')}>
                    Booking Code <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.bookingCode || ''} onChange={(e) => handleFilterChange('bookingCode', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('country')}>
                    Destination <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.country || ''} onChange={(e) => handleFilterChange('country', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('departureDate')}>
                    Dep Date <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <div style={{ height: '24px' }}></div>
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('totalOmset')}>
                    Omset <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <div style={{ height: '24px' }}></div>
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                    Status <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.status || ''} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('staffName')}>
                    Staff <ArrowUpDown size={14} style={{ marginLeft: '0.5rem' }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.staffName || ''} onChange={(e) => handleFilterChange('staffName', e.target.value)} style={{ padding: '0.25rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '0.25rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((tour) => (
              <tr key={tour.id} style={{ 
                transition: 'background 0.2s', 
                background: selectedIds.has(tour.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                ':hover': { background: selectedIds.has(tour.id) ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)' } 
              }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(tour.id)}
                    onChange={() => handleSelectRow(tour.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </td>
                <td style={{ fontWeight: '500', color: 'var(--primary)' }}>{tour.tourCode}</td>
                <td>{tour.bookingCode}</td>
                <td>{tour.country}</td>
                <td>{tour.departureDate}</td>
                <td style={{ fontWeight: '600' }}>Rp {formatCurrency(tour.totalOmset)}</td>
                <td>
                  <span className={`badge ${getStatusBadge(tour.status)}`}>
                    {tour.status}
                  </span>
                </td>
                <td>{tour.staffName || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setViewingTour(tour)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="View">
                      <Eye size={16} />
                    </button>
                    {canEditRecord(tour.staffName) && (
                      <button onClick={() => onEdit(tour)} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => { if(window.confirm('Are you sure you want to delete this tour?')) deleteTour(tour.id) }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No records found in database.
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

      {/* View Modal */}
      {viewingTour && createPortal(
        <div className="modal-overlay" onClick={() => setViewingTour(null)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingTour(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Tour Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div><strong>Tour Code:</strong> <br/>{viewingTour.tourCode || '-'}</div>
              <div><strong>Booking Code:</strong> <br/>{viewingTour.bookingCode || '-'}</div>
              <div><strong>Country:</strong> <br/>{viewingTour.country || '-'}</div>
              <div><strong>Dates:</strong> <br/>{viewingTour.departureDate} - {viewingTour.returnDate}</div>
              <div><strong>Pax Count:</strong> <br/>{viewingTour.paxCount} Pax</div>
              <div><strong>Staff:</strong> <br/>{viewingTour.staffName || '-'}</div>
              <div><strong>Status:</strong> <br/><span className={`badge ${getStatusBadge(viewingTour.status)}`}>{viewingTour.status}</span></div>
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Financials</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div><strong>Total Sales:</strong> <br/>Rp {formatCurrency(viewingTour.financials?.totalSales)}</div>
              <div><strong>Discount:</strong> <br/><span style={{ color: 'var(--warning)' }}>- Rp {formatCurrency(viewingTour.financials?.discount)}</span></div>
              <div><strong>Total Omset:</strong> <br/><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rp {formatCurrency(viewingTour.financials?.totalOmset)}</span></div>
              <div><strong>Cost:</strong> <br/><span style={{ color: 'var(--danger)' }}>Rp {formatCurrency(viewingTour.financials?.cost)}</span></div>
              <div><strong>Profit:</strong> <br/><span style={{ color: 'var(--success)' }}>Rp {formatCurrency(viewingTour.financials?.profit)}</span></div>
              <div><strong>Deposit #:</strong> <br/>{viewingTour.financials?.depositNumber || '-'}</div>
              <div><strong>Invoice #:</strong> <br/>{viewingTour.financials?.invoiceNumber || '-'}</div>
              <div><strong>Discount Link:</strong> <br/>{viewingTour.financials?.discountLink ? <a href={viewingTour.financials.discountLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a> : '-'}</div>
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Passengers</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingTour.paxInfo?.map(pax => (
                    <tr key={pax.id}>
                      <td>{pax.title} {pax.firstName} {pax.lastName}</td>
                      <td>{pax.email}</td>
                      <td>{pax.phone}</td>
                      <td>{pax.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginBottom: '1rem', marginTop: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Version History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {viewingTour.history && viewingTour.history.length > 0 ? (
                viewingTour.history.map((log, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{log.action}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{log.details}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>By: <span style={{ color: 'var(--text-main)' }}>{log.user}</span></div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', textAlign: 'center' }}>No history available for this record.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
};

export default DatabaseTable;
