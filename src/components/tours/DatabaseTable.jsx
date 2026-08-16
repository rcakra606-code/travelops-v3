import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTours } from '../../context/TourContext';
import { formatCurrency } from '../../utils/currency';
import { Eye, Edit2, Trash2, ArrowUpDown, X, CheckSquare, Layers, Shield, Calendar, User, DollarSign, Tag, Plane } from 'lucide-react';
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

  // Clear selections when page changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirm':
      case 'Confirmed':
        return (
          <span className="badge badge-success">
            <span className="pulse-dot pulse-dot-green" /> Confirm
          </span>
        );
      case 'Pending':
        return (
          <span className="badge badge-warning">
            <span className="pulse-dot pulse-dot-amber" /> Pending
          </span>
        );
      case 'Cancel':
      case 'Cancelled':
        return (
          <span className="badge badge-danger">
            Cancel
          </span>
        );
      case 'Past Date':
        return (
          <span className="badge badge-primary">
            Past Date
          </span>
        );
      default:
        return (
          <span className="badge badge-primary">
            {status}
          </span>
        );
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Bulk Actions Menu */}
        <div>
          {selectedIds.size > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.85rem', 
              background: 'rgba(13, 19, 34, 0.95)', 
              border: '1px solid var(--border-glow)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px var(--primary-glow)',
              padding: '0.45rem 1rem', 
              borderRadius: '8px', 
              color: 'var(--text-main)', 
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              backdropFilter: 'blur(12px)'
            }}>
              <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--primary)' }}>
                {selectedIds.size} Selected
              </span>
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
              <button onClick={() => handleBulkStatusChange('Confirm')} className="btn" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Mark Confirm</button>
              <button onClick={() => handleBulkStatusChange('Pending')} className="btn" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Mark Pending</button>
              <button onClick={() => handleBulkStatusChange('Cancel')} className="btn" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Mark Cancel</button>
              
              {canDelete && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
                  <button onClick={handleBulkDelete} className="btn btn-danger" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <ExportMenu data={flatTours} columns={exportColumns} filename="Tours_Data" />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1050px' }}>
          <thead>
            <tr>
              <th style={{ width: '44px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('tourCode')}>
                    Tour Code <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.tourCode || ''} onChange={(e) => handleFilterChange('tourCode', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('bookingCode')}>
                    Booking Code <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.bookingCode || ''} onChange={(e) => handleFilterChange('bookingCode', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('country')}>
                    Destination <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.country || ''} onChange={(e) => handleFilterChange('country', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('departureDate')}>
                    Departure Date <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <div style={{ height: '24px' }}></div>
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('totalOmset')}>
                    Omset <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <div style={{ height: '24px' }}></div>
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                    Status <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.status || ''} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('staffName')}>
                    PIC Staff <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <input type="text" placeholder="Filter..." value={filters.staffName || ''} onChange={(e) => handleFilterChange('staffName', e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} />
                </div>
              </th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((tour) => (
              <tr 
                key={tour.id} 
                style={{ 
                  background: selectedIds.has(tour.id) ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                }}
              >
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(tour.id)}
                    onChange={() => handleSelectRow(tour.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </td>
                <td className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                  {tour.tourCode || '-'}
                </td>
                <td className="font-mono" style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                  {tour.bookingCode || '-'}
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{tour.country}</span>
                </td>
                <td className="font-mono" style={{ color: '#fbbf24', fontWeight: '500', fontSize: '0.8125rem' }}>
                  {tour.departureDate}
                </td>
                <td className="font-mono" style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                  Rp {formatCurrency(tour.totalOmset)}
                </td>
                <td>
                  {getStatusBadge(tour.status)}
                </td>
                <td>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{tour.staffName || '-'}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setViewingTour(tour)} 
                      style={{ 
                        background: 'rgba(6, 182, 212, 0.1)', 
                        color: 'var(--primary)', 
                        border: '1px solid rgba(6, 182, 212, 0.2)', 
                        padding: '0.4rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }} 
                      title="Inspect Details"
                    >
                      <Eye size={15} />
                    </button>
                    {canEditRecord(tour.staffName) && (
                      <button 
                        onClick={() => onEdit(tour)} 
                        style={{ 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          color: '#fbbf24', 
                          border: '1px solid rgba(245, 158, 11, 0.2)', 
                          padding: '0.4rem', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }} 
                        title="Edit Record"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => { if(window.confirm('Are you sure you want to delete this tour?')) deleteTour(tour.id) }} 
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: '#f87171', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          padding: '0.4rem', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }} 
                        title="Delete Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '0.75rem' }}>
                    <Plane size={24} style={{ opacity: 0.5 }} />
                  </div>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>No matching tour records found</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>Try adjusting your search filters above.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {/* View Details Slide-Over / Modal */}
      {viewingTour && createPortal(
        <div className="modal-overlay" onClick={() => setViewingTour(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setViewingTour(null)} 
              style={{ 
                position: 'absolute', 
                top: '1.25rem', 
                right: '1.25rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px',
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary)' }}>
                <Plane size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Tour Overview: {viewingTour.bookingCode || viewingTour.tourCode}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Record ID: {viewingTour.id}</span>
              </div>
            </div>
            
            {/* Core Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem', background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tour Code</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '700', color: 'var(--primary)' }}>{viewingTour.tourCode || '-'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Code</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '700', color: 'var(--text-main)' }}>{viewingTour.bookingCode || '-'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: 'var(--text-main)' }}>{viewingTour.country || '-'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Travel Window</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#fbbf24' }}>{viewingTour.departureDate} ➔ {viewingTour.returnDate}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pax Manifest</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: 'var(--text-main)' }}>{viewingTour.paxCount} Travelers</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</span>
                <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(viewingTour.status)}</div>
              </div>
            </div>

            {/* Financials Breakdown */}
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <DollarSign size={18} color="#10b981" /> Financial Breakdown
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Gross Sales</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '700', color: 'var(--text-main)' }}>Rp {formatCurrency(viewingTour.financials?.totalSales)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discount</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: '#fbbf24' }}>- Rp {formatCurrency(viewingTour.financials?.discount)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Net Omset</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '800', color: '#34d399', fontSize: '1.1rem' }}>Rp {formatCurrency(viewingTour.financials?.totalOmset)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Invoice ID</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: 'var(--text-main)' }}>{viewingTour.financials?.invoiceNumber || '<Unassigned>'}</p>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {canEditRecord(viewingTour.staffName) && (
                <button 
                  onClick={() => { const t = viewingTour; setViewingTour(null); onEdit(t); }} 
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                >
                  <Edit2 size={15} /> Edit Record
                </button>
              )}
              <button 
                onClick={() => setViewingTour(null)} 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default DatabaseTable;
