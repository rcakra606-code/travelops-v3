import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTours } from '../../context/TourContext';
import { formatCurrency } from '../../utils/currency';
import { Eye, Edit2, Trash2, ArrowUpDown, X } from 'lucide-react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../Pagination';

const DatabaseTable = ({ onEdit }) => {
  const { tours, deleteTour } = useTours();
  const [viewingTour, setViewingTour] = useState(null);

  // Flatten nested properties (like totalOmset) so useDataTable can sort it
  const flatTours = useMemo(() => {
    return tours.map(t => ({
      ...t,
      totalOmset: t.financials?.totalOmset || 0
    }));
  }, [tours]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirm': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Cancel': return 'badge-danger';
      case 'Past Date': return 'badge-primary';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflowX: 'auto', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
        <table className="data-table" style={{ minWidth: '1000px' }}>
          <thead style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
            <tr>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((tour) => (
              <tr key={tour.id} style={{ transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}>
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
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setViewingTour(tour)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onEdit(tour)} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this tour?')) deleteTour(tour.id) }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatabaseTable;
