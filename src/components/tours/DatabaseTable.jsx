import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTours } from '../../context/TourContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Eye, Edit2, Trash2, ArrowUpDown, X, CheckSquare, Layers, 
  Shield, Calendar, User, DollarSign, Tag, Plane, Share2,
  CheckCircle2, AlertCircle, FileText, Edit3, FileSpreadsheet
} from 'lucide-react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../Pagination';
import { useAuth } from '../../context/AuthContext';
import ExportMenu from '../ExportMenu';
import TourSettlementModal from './TourSettlementModal';

const DatabaseTable = ({ onEdit, customData }) => {
  const { tours, deleteTour, updateTour } = useTours();
  const { user } = useAuth();
  const [viewingTour, setViewingTour] = useState(null);
  const [settlementTour, setSettlementTour] = useState(null);
  
  // Quick invoice update state
  const [editingInvoiceTour, setEditingInvoiceTour] = useState(null);
  const [quickInvoiceValue, setQuickInvoiceValue] = useState('');
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [togglingMdrId, setTogglingMdrId] = useState(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const dataToUse = customData || tours.filter(t => t.status !== 'Past Date');

  // Flatten nested properties (financials, depositNumber, omset, invoice details) so useDataTable can sort/filter it
  const flatTours = useMemo(() => {
    return dataToUse.map(t => {
      const fin = t.financials || {};
      const basicTourPrice = Number(fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0));
      const discountSupplier = Number(fin.discountSupplier !== undefined ? fin.discountSupplier : (fin.discount || 0));
      const discountBranch = Number(fin.discountBranch || 0);
      const profit = Number(fin.profit || 0);
      const totalSellingPrice = Number(fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (fin.totalOmset !== undefined ? fin.totalOmset : (basicTourPrice - discountSupplier - discountBranch)));
      const totalNettPrice = Number(fin.totalNettPrice !== undefined ? fin.totalNettPrice : (fin.cost !== undefined ? fin.cost : (basicTourPrice - discountSupplier - profit)));
      const depositNumber = fin.depositNumber ? String(fin.depositNumber).trim() : (t.depositNumber || '');
      const depositAmount = Number(fin.depositAmount || 0);
      const sisaPelunasan = Math.max(0, totalSellingPrice - depositAmount);
      const invNum = fin.invoiceNumber ? String(fin.invoiceNumber).trim() : (t.invoiceNumber || '');
      const hasInvoice = invNum !== '';
      const claimMdr = Boolean(t.claimMdr !== undefined ? t.claimMdr : (t.claim_mdr || t.internals?.claimMdr));
      const claimMdrAt = t.claimMdrAt || t.claim_mdr_at || t.internals?.claimMdrAt || null;
      const claimMdrBy = t.claimMdrBy || t.claim_mdr_by || t.internals?.claimMdrBy || '';
      const claimMdrStatus = claimMdr ? 'Sudah Claim' : 'Belum Claim';

      return {
        ...t,
        basicTourPrice,
        discountSupplier,
        discountBranch,
        profit,
        totalSellingPrice,
        totalNettPrice,
        totalOmset: totalSellingPrice,
        depositNumber,
        depositAmount,
        sisaPelunasan,
        invoiceNumber: invNum,
        invoiceStatus: hasInvoice ? 'Sudah Di-Invoice' : 'Belum Di-Invoice',
        invoiceStatusShort: hasInvoice ? 'Sudah' : 'Belum',
        claimMdr,
        claimMdrAt,
        claimMdrBy,
        claimMdrStatus
      };
    });
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

  const handleOpenQuickInvoice = (tour) => {
    setEditingInvoiceTour(tour);
    setQuickInvoiceValue(tour.financials?.invoiceNumber || tour.invoiceNumber || '');
  };

  const handleSaveQuickInvoice = async () => {
    if (!editingInvoiceTour) return;
    setIsSavingInvoice(true);
    try {
      const currentFinancials = editingInvoiceTour.financials || {};
      const newInvoiceNumber = quickInvoiceValue.trim();

      await updateTour(editingInvoiceTour.id, {
        financials: {
          ...currentFinancials,
          invoiceNumber: newInvoiceNumber
        },
        updatedBy: user?.name || 'System'
      });

      // Synchronize inspector modal if viewing the same tour
      if (viewingTour && viewingTour.id === editingInvoiceTour.id) {
        setViewingTour(prev => ({
          ...prev,
          financials: {
            ...(prev.financials || {}),
            invoiceNumber: newInvoiceNumber
          }
        }));
      }

      setEditingInvoiceTour(null);
    } catch (err) {
      alert('Gagal memperbarui nomor invoice: ' + err.message);
    } finally {
      setIsSavingInvoice(false);
    }
  };

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

  const getInvoiceStatusBadge = (tour) => {
    const invNum = tour.financials?.invoiceNumber || tour.invoiceNumber;
    const hasInvoice = Boolean(invNum && String(invNum).trim() !== '');

    if (hasInvoice) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
          <span 
            className="badge badge-success"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px'
            }}
          >
            <CheckCircle2 size={12} /> Sudah Di-Invoice
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span 
              className="font-mono" 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--primary, #06b6d4)', 
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={`Nomor Invoice: ${invNum}`}
            >
              <FileText size={11} style={{ opacity: 0.8 }} /> {invNum}
            </span>
            {canEditRecord(tour.staffName) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenQuickInvoice(tour);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7
                }}
                title="Edit Nomor Invoice"
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <Edit3 size={11} />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
        <span 
          className="badge badge-danger"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontSize: '0.75rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <AlertCircle size={12} /> Belum Di-Invoice
        </span>
        {canEditRecord(tour.staffName) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenQuickInvoice(tour);
            }}
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px dashed rgba(6, 182, 212, 0.4)',
              borderRadius: '4px',
              color: 'var(--primary, #06b6d4)',
              fontSize: '0.675rem',
              padding: '0.15rem 0.45rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '500'
            }}
            title="Klik untuk input nomor invoice"
          >
            <FileText size={10} /> + Input Invoice
          </button>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
            Belum Terinput
          </span>
        )}
      </div>
    );
  };

  const formatClaimMdrDateTime = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return String(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(isoStr);
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  // Role staff & manager can check when unchecked, but CANNOT uncheck once checked (Admin only)
  const canToggleClaimMdr = (tour) => {
    if (!tour) return false;
    if (!canEditRecord(tour.staffName)) return false;
    if (tour.claimMdr && !isAdmin) return false;
    return true;
  };

  const handleToggleClaimMdr = async (tour, e) => {
    if (e) e.stopPropagation();

    // Guard: Role Staff & Manager cannot uncheck MDR checklist!
    if (tour.claimMdr && !isAdmin) {
      alert('⛔ Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
      return;
    }

    if (!canEditRecord(tour.staffName)) {
      alert('Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah data tour ini.');
      return;
    }

    const nextClaimMdr = !tour.claimMdr;
    const nowIso = new Date().toISOString();
    setTogglingMdrId(tour.id);

    try {
      await updateTour(tour.id, {
        claimMdr: nextClaimMdr,
        claimMdrAt: nextClaimMdr ? nowIso : null,
        claimMdrBy: nextClaimMdr ? (user?.name || 'Staff') : null,
        updatedBy: user?.name || 'Staff',
        userRole: user?.role
      });

      if (viewingTour && viewingTour.id === tour.id) {
        setViewingTour(prev => ({
          ...prev,
          claimMdr: nextClaimMdr,
          claimMdrAt: nextClaimMdr ? nowIso : null,
          claimMdrBy: nextClaimMdr ? (user?.name || 'Staff') : null
        }));
      }
    } catch (err) {
      alert('Gagal memperbarui status Form Claim MDR: ' + err.message);
    } finally {
      setTogglingMdrId(null);
    }
  };

  const exportColumns = [
    { header: 'Tour Code', key: 'tourCode', format: null },
    { header: 'Booking Code', key: 'bookingCode', format: null },
    { header: 'Nomor DP', key: 'depositNumber', format: null },
    { header: 'Nominal DP', key: 'depositAmount', format: 'currency' },
    { header: 'Destination', key: 'country', format: null },
    { header: 'Departure Date', key: 'departureDate', format: null },
    { header: 'PIC Staff', key: 'staffName', format: null },
    { header: 'Status Booking', key: 'status', format: null },
    { header: 'Status Form Claim MDR', key: 'claimMdrStatus', format: null },
    { header: 'Tanggal & Jam Claim MDR', key: 'claimMdrAt', format: null },
    { header: 'PIC Claim MDR', key: 'claimMdrBy', format: null },
    { header: 'Harga Dasar Tour', key: 'basicTourPrice', format: 'currency' },
    { header: 'Discount Supplier', key: 'discountSupplier', format: 'currency' },
    { header: 'Discount Branch', key: 'discountBranch', format: 'currency' },
    { header: 'Nominal Profit', key: 'profit', format: 'currency' },
    { header: 'Total Selling Price (Omset)', key: 'totalSellingPrice', format: 'currency' },
    { header: 'Sisa Pelunasan Tamu', key: 'sisaPelunasan', format: 'currency' },
    { header: 'Total Nett Price (Cost)', key: 'totalNettPrice', format: 'currency' },
    { header: 'Status Invoice', key: 'invoiceStatus', format: null },
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
              background: 'var(--glass-bg)', 
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card-hover)',
              padding: '0.45rem 1rem', 
              borderRadius: '12px', 
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
          <table className="data-table" style={{ minWidth: '1320px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('invoiceStatus')}>
                    Status Invoice <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <select 
                    value={filters.invoiceStatus || ''} 
                    onChange={(e) => handleFilterChange('invoiceStatus', e.target.value)} 
                    style={{ 
                      padding: '0.25rem 0.4rem', 
                      fontSize: '0.75rem', 
                      background: 'var(--bg-surface, #1e293b)', 
                      color: 'var(--text-main, #f8fafc)', 
                      border: '1px solid var(--border, #334155)', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      height: '24px'
                    }}
                  >
                    <option value="">Semua</option>
                    <option value="Sudah">Sudah Di-Invoice</option>
                    <option value="Belum">Belum Di-Invoice</option>
                  </select>
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('claimMdr')}>
                    Form Claim MDR <ArrowUpDown size={12} style={{ marginLeft: '0.4rem', opacity: 0.7 }} />
                  </div>
                  <select 
                    value={filters.claimMdrStatus || ''} 
                    onChange={(e) => handleFilterChange('claimMdrStatus', e.target.value)} 
                    style={{ 
                      padding: '0.25rem 0.4rem', 
                      fontSize: '0.75rem', 
                      background: 'var(--bg-surface, #1e293b)', 
                      color: 'var(--text-main, #f8fafc)', 
                      border: '1px solid var(--border, #334155)', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      height: '24px'
                    }}
                  >
                    <option value="">Semua</option>
                    <option value="Sudah Claim">Sudah Claim</option>
                    <option value="Belum Claim">Belum Claim</option>
                  </select>
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
                  <div>{tour.bookingCode || '-'}</div>
                  {tour.depositNumber ? (
                    <div style={{ fontSize: '0.675rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <span style={{ fontWeight: '700' }}>DP:</span> {tour.depositNumber}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.675rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <span style={{ fontWeight: '700' }}>DP:</span> -
                    </div>
                  )}
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
                  {getInvoiceStatusBadge(tour)}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tour.claimMdr && !isAdmin) {
                          alert('⛔ Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
                        }
                      }} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.45rem', 
                        cursor: canToggleClaimMdr(tour) ? 'pointer' : 'not-allowed',
                        margin: 0,
                        userSelect: 'none'
                      }}
                      title={
                        tour.claimMdr 
                          ? (isAdmin 
                              ? `Claim MDR divalidasi pada ${formatClaimMdrDateTime(tour.claimMdrAt)}${tour.claimMdrBy ? ' oleh ' + tour.claimMdrBy : ''}. Klik untuk un-check (Admin only).` 
                              : `Claim MDR divalidasi pada ${formatClaimMdrDateTime(tour.claimMdrAt)}${tour.claimMdrBy ? ' oleh ' + tour.claimMdrBy : ''}. Terkunci (Role Staff & Manager tidak dapat un-check).`)
                          : (canEditRecord(tour.staffName) ? 'Klik untuk checklist Form Claim MDR (auto generate tanggal & jam)' : 'Hanya PIC Staff / Manager / Admin yang dapat checklist')
                      }
                    >
                      <input 
                        type="checkbox" 
                        checked={Boolean(tour.claimMdr)}
                        disabled={!canToggleClaimMdr(tour) || togglingMdrId === tour.id}
                        onChange={(e) => handleToggleClaimMdr(tour, e)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: canToggleClaimMdr(tour) ? 'pointer' : 'not-allowed',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: tour.claimMdr ? '#34d399' : 'var(--text-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {tour.claimMdr ? (
                          <>
                            Claimed
                            {!isAdmin && (
                              <span title="Terkunci: Role Staff & Manager tidak dapat membatalkan (un-check)" style={{ fontSize: '0.72rem', cursor: 'help' }}>
                                🔒
                              </span>
                            )}
                          </>
                        ) : 'Belum'}
                      </span>
                    </label>
                    {tour.claimMdr && tour.claimMdrAt && (
                      <div style={{ 
                        fontSize: '0.675rem', 
                        color: '#10b981', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '3px',
                        whiteSpace: 'nowrap'
                      }}>
                        <span>🕒 {formatClaimMdrDateTime(tour.claimMdrAt)}</span>
                      </div>
                    )}
                  </div>
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
                    <button 
                      onClick={() => setSettlementTour(tour)} 
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.12)', 
                        color: '#34d399', 
                        border: '1px solid rgba(16, 185, 129, 0.28)', 
                        padding: '0.4rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }} 
                      title="Auto Export Bukti Pelunasan Tour (Excel / Print)"
                    >
                      <FileSpreadsheet size={15} />
                    </button>
                    <button 
                      onClick={() => {
                        const code = tour.bookingCode || tour.tourCode || tour.id;
                        const url = `${window.location.origin}/track/${encodeURIComponent(code)}`;
                        navigator.clipboard.writeText(url);
                        alert(`Link tracking itinerary tamu disalin:\n${url}`);
                      }} 
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: '#60a5fa', 
                        border: '1px solid rgba(59, 130, 246, 0.2)', 
                        padding: '0.4rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }} 
                      title="Copy Public Tracking Link"
                    >
                      <Share2 size={15} />
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
                <td colSpan="11" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
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

            {/* Form Claim MDR Card in Inspector */}
            <div style={{ 
              background: viewingTour.claimMdr ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-dark)', 
              border: `1px solid ${viewingTour.claimMdr ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label 
                  onClick={(e) => {
                    if (viewingTour.claimMdr && !isAdmin) {
                      e.preventDefault();
                      alert('⛔ Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem', 
                    cursor: canToggleClaimMdr(viewingTour) ? 'pointer' : 'not-allowed', 
                    margin: 0 
                  }}
                  title={viewingTour.claimMdr && !isAdmin ? 'Terkunci: Role Staff & Manager tidak dapat membatalkan (un-check)' : ''}
                >
                  <input 
                    type="checkbox"
                    checked={Boolean(viewingTour.claimMdr)}
                    disabled={!canToggleClaimMdr(viewingTour) || togglingMdrId === viewingTour.id}
                    onChange={(e) => handleToggleClaimMdr(viewingTour, e)}
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      cursor: canToggleClaimMdr(viewingTour) ? 'pointer' : 'not-allowed', 
                      accentColor: '#10b981' 
                    }}
                  />
                  <span style={{ fontWeight: '700', fontSize: '0.925rem', color: viewingTour.claimMdr ? '#34d399' : 'var(--text-main)' }}>
                    Form Claim MDR
                  </span>
                </label>
                {viewingTour.claimMdr ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    ✓ Sudah Terchecklist {!isAdmin && <span title="Terkunci: Role Staff & Manager tidak dapat membatalkan">🔒</span>}
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Belum Dichecklist</span>
                )}
              </div>

              {viewingTour.claimMdr && viewingTour.claimMdrAt && (
                <div style={{ fontSize: '0.78rem', color: '#34d399', textAlign: 'right' }}>
                  <div>Waktu Checklist: <strong className="font-mono">{formatClaimMdrDateTime(viewingTour.claimMdrAt)}</strong></div>
                  {viewingTour.claimMdrBy && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PIC: {viewingTour.claimMdrBy}</div>
                  )}
                  {!isAdmin && (
                    <div style={{ color: '#fbbf24', fontSize: '0.68rem', marginTop: '2px', fontWeight: '600' }}>
                      🔒 Terkunci: Hanya Admin yang dapat membatalkan checklist ini
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Financials Breakdown */}
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <DollarSign size={18} color="#10b981" /> Rincian Perhitungan Biaya Tour
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Harga Dasar Tour (Basic)</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '700', color: 'var(--text-main)' }}>
                  Rp {formatCurrency(viewingTour.financials?.basicTourPrice !== undefined ? viewingTour.financials.basicTourPrice : viewingTour.financials?.totalSales)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discount Supplier</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: '#fbbf24' }}>
                  - Rp {formatCurrency(viewingTour.financials?.discountSupplier || 0)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discount Branch</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: '#fbbf24' }}>
                  - Rp {formatCurrency(viewingTour.financials?.discountBranch || 0)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Nominal Profit</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '700', color: 'var(--success)' }}>
                  Rp {formatCurrency(viewingTour.financials?.profit || 0)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--primary)', fontWeight: '600' }}>Total Selling Price (Omset)</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '800', color: 'var(--primary)', fontSize: '1.05rem' }}>
                  Rp {formatCurrency(viewingTour.financials?.totalSellingPrice !== undefined ? viewingTour.financials.totalSellingPrice : viewingTour.financials?.totalOmset)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: '600' }}>Total Nett Price (Cost)</span>
                <p className="font-mono" style={{ margin: '0.2rem 0 0 0', fontWeight: '800', color: '#34d399', fontSize: '1.05rem' }}>
                  Rp {formatCurrency(viewingTour.financials?.totalNettPrice !== undefined ? viewingTour.financials.totalNettPrice : viewingTour.financials?.cost)}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem', marginTop: '0.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Nomor &amp; Nominal DP</span>
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {viewingTour.financials?.depositNumber && viewingTour.financials.depositNumber.trim() !== '' ? (
                      <>
                        <span className="badge badge-success" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                          ✓ {viewingTour.financials.depositNumber}
                        </span>
                        <span className="font-mono" style={{ fontWeight: '700', color: '#10b981', fontSize: '0.9rem' }}>
                          Rp {formatCurrency(viewingTour.financials?.depositAmount || 0)}
                        </span>
                      </>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        ⚠️ Belum Terinput (Wajib)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Sisa Pelunasan: <strong style={{ color: '#38bdf8' }}>Rp {formatCurrency(Math.max(0, (viewingTour.financials?.totalSellingPrice !== undefined ? viewingTour.financials.totalSellingPrice : (viewingTour.financials?.totalOmset || 0)) - (viewingTour.financials?.depositAmount || 0)))}</strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Status &amp; No. Invoice</span>
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {viewingTour.financials?.invoiceNumber && viewingTour.financials.invoiceNumber.trim() !== '' ? (
                      <>
                        <span className="badge badge-success" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                          ✓ Sudah Di-Invoice
                        </span>
                        <span className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>
                          {viewingTour.financials.invoiceNumber}
                        </span>
                      </>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        ⚠️ Belum Di-Invoice
                      </span>
                    )}
                    {canEditRecord(viewingTour.staffName) && (
                      <button
                        onClick={() => handleOpenQuickInvoice(viewingTour)}
                        style={{
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '4px',
                          color: 'var(--primary)',
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Edit3 size={11} /> Update No. Invoice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                onClick={() => setSettlementTour(viewingTour)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.85rem',
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  borderColor: '#0284c7'
                }}
              >
                <FileSpreadsheet size={16} /> Auto Export Bukti Pelunasan
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
          </div>
        </div>,
        document.body
      )}

      {/* Quick Edit Invoice Modal */}
      {editingInvoiceTour && createPortal(
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.75)', 
          backdropFilter: 'blur(5px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10000, 
          padding: '1rem' 
        }}>
          <div className="card fade-in" style={{ 
            width: '100%', 
            maxWidth: '430px', 
            background: 'var(--bg-surface, #1e293b)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '1.5rem', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" /> Input / Edit Nomor Invoice
              </h3>
              <button 
                onClick={() => setEditingInvoiceTour(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-dark)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tour Terkait:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="font-mono" style={{ color: 'var(--primary)' }}>{editingInvoiceTour.tourCode || editingInvoiceTour.bookingCode}</span>
                <span>•</span>
                <span>{editingInvoiceTour.country}</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveQuickInvoice(); }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nomor Invoice
                </label>
                <input 
                  type="text" 
                  value={quickInvoiceValue} 
                  onChange={(e) => setQuickInvoiceValue(e.target.value)} 
                  placeholder="Contoh: INV-2026-001"
                  autoFocus
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 0.85rem', 
                    fontSize: '0.9rem', 
                    background: 'var(--bg-dark)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '6px', 
                    color: 'var(--text-main)',
                    fontFamily: 'monospace'
                  }}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', marginTop: '0.4rem', display: 'block' }}>
                  * Kosongkan input dan simpan jika ingin mengubah status kembali menjadi <strong>Belum Di-Invoice</strong>.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button 
                  type="button"
                  onClick={() => setEditingInvoiceTour(null)} 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                  disabled={isSavingInvoice}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1.25rem' }}
                  disabled={isSavingInvoice}
                >
                  {isSavingInvoice ? 'Menyimpan...' : 'Simpan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Tour Settlement Modal for Auto Export */}
      {settlementTour && (
        <TourSettlementModal 
          tour={settlementTour} 
          onClose={() => setSettlementTour(null)} 
        />
      )}

    </div>
  );
};

export default DatabaseTable;
