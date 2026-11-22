import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Edit2, Trash2, ArrowUpDown, X, Search, Copy, RotateCcw,
  Calendar, User, DollarSign, Plane, Share2, Lock, Clock, Users,
  CheckCircle2, AlertCircle, FileText, Edit3, FileSpreadsheet, ExternalLink,
  Building2, Filter
} from 'lucide-react';
import { useTours } from '../../context/TourContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import {
  getTripDurationInfo,
  formatShortDate,
  getLeadPaxLabel,
  buildPaxSearchBlob
} from '../../utils/tourHelpers';
import { useDataTable } from '../../hooks/useDataTable';
import { useVirtualTable } from '../../hooks/useVirtualTable';
import Pagination from '../Pagination';
import ExportMenu from '../ExportMenu';
import SlideOverDrawer from '../SlideOverDrawer';
import FloatingBulkBar from '../FloatingBulkBar';
import SkeletonLoader from '../SkeletonLoader';
import WhatsAppQuickMenu from '../WhatsAppQuickMenu';
import TourSettlementModal from './TourSettlementModal';

const DatabaseTable = ({
  onEdit,
  onDuplicate,
  customData,
  initialScope = 'active',
  initialSearch = '',
  initialOpenId = null,
  tourTypeFilter = 'All'
}) => {
  const navigate = useNavigate();
  const { tours, loading: toursLoading, deleteTour, updateTour } = useTours();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const filterStorageKey = `travelops_tour_filters_${tourTypeFilter}`;
  const [scope, setScope] = useState(() => {
    if (initialOpenId) return 'all';
    if (initialScope && initialScope !== 'active') return initialScope;
    try {
      const saved = JSON.parse(sessionStorage.getItem(filterStorageKey) || 'null');
      return saved?.scope || initialScope;
    } catch {
      return initialScope;
    }
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (initialSearch) return initialSearch;
    try {
      const saved = JSON.parse(sessionStorage.getItem(filterStorageKey) || 'null');
      return saved?.searchQuery || '';
    } catch {
      return '';
    }
  });
  const [quickChips, setQuickChips] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(filterStorageKey) || 'null');
      return saved?.quickChips || {
        onlyMine: false,
        onlyBalanceDue: false,
        onlyUninvoiced: false,
        onlyUnclaimedMdr: false,
        onlyDepartingSoon: false
      };
    } catch {
      return {
        onlyMine: false,
        onlyBalanceDue: false,
        onlyUninvoiced: false,
        onlyUnclaimedMdr: false,
        onlyDepartingSoon: false
      };
    }
  });

  useEffect(() => {
    if (customData) return;
    try {
      sessionStorage.setItem(
        filterStorageKey,
        JSON.stringify({ scope, searchQuery, quickChips })
      );
    } catch {
      // ignore
    }
  }, [filterStorageKey, scope, searchQuery, quickChips, customData]);

  const toggleQuickChip = (key) => {
    setQuickChips((prev) => ({ ...prev, [key]: !prev[key] }));
    setCurrentPage(1);
  };

  const [tableDensity, setTableDensity] = useState(() => {
    try {
      return localStorage.getItem('travelops_tour_table_density') || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const handleDensityChange = (newDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('travelops_tour_table_density', newDensity);
    } catch {
      // ignore
    }
  };

  // Drawer & Modal states (store ID so live context updates reflect automatically)
  const [viewingTourId, setViewingTourId] = useState(() => initialOpenId || null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'passengers' | 'history'
  const [settlementTour, setSettlementTour] = useState(null);

  // Quick invoice update state
  const [editingInvoiceTour, setEditingInvoiceTour] = useState(null);
  const [quickInvoiceValue, setQuickInvoiceValue] = useState('');
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [togglingMdrId, setTogglingMdrId] = useState(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';

  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canEditRecord = (recordStaff) =>
    canEditAny || (isStaff && recordStaff === user?.name);

  const sourceRecords = customData || tours;

  // Flatten all tour records once so scope counts, global search, and live drawer stay in sync
  const allFlatTours = useMemo(() => {
    let raw = sourceRecords;
    if (tourTypeFilter && tourTypeFilter !== 'All') {
      raw = raw.filter((t) => {
        const type =
          t.tourType ||
          (t.category === 'Consortium'
            ? 'Consortium'
            : t.category === 'Corporate / Incentive'
              ? 'Incentive'
              : 'Series');
        return type === tourTypeFilter;
      });
    }

    return raw.map((t) => {
      const tourType =
        t.tourType ||
        (t.category === 'Consortium'
          ? 'Consortium'
          : t.category === 'Corporate / Incentive'
            ? 'Incentive'
            : 'Series');
      const supplier = t.supplier || '';
      const fin = t.financials || {};
      const airportTax = Number(fin.airportTax || 0);
      const tipping = Number(fin.tipping || 0);
      const miscCharge = Number(fin.miscCharge || 0);
      const ppn = Number(fin.ppn || 0);
      const basicTourPrice = Number(
        fin.basicTourPrice !== undefined ? fin.basicTourPrice : fin.totalSales || 0
      );
      const discountSupplier = Number(
        fin.discountSupplier !== undefined ? fin.discountSupplier : fin.discount || 0
      );
      const discountBranch = Number(fin.discountBranch || 0);
      const profit = Number(fin.profit || 0);
      const isConsortium = tourType === 'Consortium';
      const totalAddons = isConsortium ? airportTax + tipping + miscCharge + ppn : 0;
      const totalSellingPrice = Number(
        fin.totalSellingPrice !== undefined
          ? fin.totalSellingPrice
          : fin.totalOmset !== undefined
            ? fin.totalOmset
            : basicTourPrice + totalAddons - discountSupplier - discountBranch
      );
      const totalNettPrice = Number(
        fin.totalNettPrice !== undefined
          ? fin.totalNettPrice
          : fin.cost !== undefined
            ? fin.cost
            : totalSellingPrice - profit
      );
      const depositNumber = fin.depositNumber
        ? String(fin.depositNumber).trim()
        : t.depositNumber || '';
      const depositAmount = Number(fin.depositAmount || 0);
      const sisaPelunasan = Math.max(0, totalSellingPrice - depositAmount);
      const invNum = fin.invoiceNumber
        ? String(fin.invoiceNumber).trim()
        : t.invoiceNumber || '';
      const hasInvoice = invNum !== '';
      const claimMdr = Boolean(
        tourType === 'Series' &&
          (t.claimMdr !== undefined
            ? t.claimMdr
            : t.claim_mdr || t.internals?.claimMdr)
      );
      const claimMdrAt = t.claimMdrAt || t.claim_mdr_at || t.internals?.claimMdrAt || null;
      const claimMdrBy = t.claimMdrBy || t.claim_mdr_by || t.internals?.claimMdrBy || '';
      const claimMdrStatus = claimMdr ? 'Sudah Claim' : 'Belum Claim';
      const isCancelled = t.status === 'Cancel' || t.status === 'Cancelled';
      const isPast = t.status === 'Past Date';
      const needsFollowUp =
        !isCancelled && (!hasInvoice || sisaPelunasan > 0 || (tourType === 'Series' && !claimMdr));

      const leadPaxName = getLeadPaxLabel(t.paxInfo);
      const paxSearchBlob = buildPaxSearchBlob(t.paxInfo);

      return {
        ...t,
        tourType,
        supplier,
        airportTax,
        tipping,
        miscCharge,
        ppn,
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
        hasInvoice,
        invoiceStatus: hasInvoice ? 'Sudah Di-Invoice' : 'Belum Di-Invoice',
        invoiceStatusShort: hasInvoice ? 'Sudah' : 'Belum',
        claimMdr,
        claimMdrAt,
        claimMdrBy,
        claimMdrStatus,
        isCancelled,
        isPast,
        needsFollowUp,
        leadPaxName,
        paxSearchBlob
      };
    });
  }, [sourceRecords, tourTypeFilter]);

  const currentUserName = user?.name || '';

  // Scope counts
  const scopeCounts = useMemo(() => {
    const counts = {
      active: 0,
      followup: 0,
      mine: 0,
      past: 0,
      cancelled: 0,
      all: allFlatTours.length
    };
    allFlatTours.forEach((t) => {
      if (!t.isPast && !t.isCancelled) counts.active += 1;
      if (t.needsFollowUp) counts.followup += 1;
      if (currentUserName && t.staffName === currentUserName) counts.mine += 1;
      if (t.isPast) counts.past += 1;
      if (t.isCancelled) counts.cancelled += 1;
    });
    return counts;
  }, [allFlatTours, currentUserName]);

  // Apply Scope + Quick Filter Chips + Unified Search
  const scopedAndSearchedTours = useMemo(() => {
    let list = allFlatTours;

    if (!customData) {
      if (scope === 'active') {
        list = list.filter((t) => !t.isPast && !t.isCancelled);
      } else if (scope === 'followup') {
        list = list.filter((t) => t.needsFollowUp);
      } else if (scope === 'mine') {
        list = list.filter((t) => Boolean(currentUserName) && t.staffName === currentUserName);
      } else if (scope === 'past') {
        list = list.filter((t) => t.isPast);
      } else if (scope === 'cancelled') {
        list = list.filter((t) => t.isCancelled);
      }
    }

    if (quickChips.onlyMine && currentUserName) {
      list = list.filter((t) => t.staffName === currentUserName);
    }
    if (quickChips.onlyBalanceDue) {
      list = list.filter((t) => !t.isCancelled && Number(t.sisaPelunasan || 0) > 0);
    }
    if (quickChips.onlyUninvoiced) {
      list = list.filter((t) => !t.isCancelled && t.invoiceStatus !== 'Sudah');
    }
    if (quickChips.onlyUnclaimedMdr) {
      list = list.filter((t) => !t.isCancelled && t.tourType === 'Series' && !t.claimMdr);
    }
    if (quickChips.onlyDepartingSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      list = list.filter((t) => {
        if (t.isCancelled || !t.departureDate) return false;
        const dep = new Date(t.departureDate);
        if (Number.isNaN(dep.getTime())) return false;
        dep.setHours(0, 0, 0, 0);
        const diff = Math.ceil((dep - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 14;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [
          t.tourCode,
          t.bookingCode,
          t.supplier,
          t.tourType,
          t.depositNumber,
          t.invoiceNumber,
          t.country,
          t.category,
          t.staffName,
          t.status,
          t.leadPaxName,
          t.paxSearchBlob
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }

    return list;
  }, [allFlatTours, customData, scope, quickChips, searchQuery, currentUserName]);

  const [pageSize, setPageSize] = useState(10);
  const effectivePageSize =
    pageSize === 'all' ? Math.max(scopedAndSearchedTours.length, 10) : Number(pageSize) || 10;

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
  } = useDataTable(scopedAndSearchedTours, { key: 'departureDate', direction: 'desc' }, effectivePageSize);

  const {
    scrollRef: tableScrollRef,
    isVirtualized,
    virtualItems,
    paddingTop,
    paddingBottom
  } = useVirtualTable({
    count: paginatedData.length,
    estimateSize: tableDensity === 'compact' ? 54 : 68,
    overscan: 8,
    threshold: 40
  });

  const visibleTableRows = isVirtualized
    ? virtualItems.map((vi) => paginatedData[vi.index]).filter(Boolean)
    : paginatedData;

  const viewingTour = useMemo(
    () => allFlatTours.find((t) => t.id === viewingTourId) || null,
    [allFlatTours, viewingTourId]
  );

  const hasQuickChipsActive = Object.values(quickChips).some(Boolean);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    hasQuickChipsActive ||
    Object.values(filters).some((v) => Boolean(v && String(v).trim()));

  const handleResetFilters = () => {
    setSearchQuery('');
    setQuickChips({
      onlyMine: false,
      onlyBalanceDue: false,
      onlyUninvoiced: false,
      onlyUnclaimedMdr: false,
      onlyDepartingSoon: false
    });
    Object.keys(filters).forEach((k) => handleFilterChange(k, ''));
    setSelectedIds(new Set());
  };

  const handleScopeSwitch = (nextScope) => {
    setScope(nextScope);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const openInspector = (tour, defaultTab = 'overview') => {
    setViewingTourId(tour.id);
    setDrawerTab(defaultTab);
  };

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

      setEditingInvoiceTour(null);
      toast.success(
        newInvoiceNumber ? `Invoice #${newInvoiceNumber} saved!` : 'Invoice number cleared.'
      );
    } catch (err) {
      toast.error('Could not update invoice number: ' + err.message);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const canToggleClaimMdr = (tour) => {
    if (!tour) return false;
    if (!canEditRecord(tour.staffName)) return false;
    if (tour.claimMdr && !isAdmin) return false;
    return true;
  };

  const handleToggleClaimMdr = async (tour, e) => {
    if (e) e.stopPropagation();

    if (tour.claimMdr && !isAdmin) {
      toast.warning(
        'Locked: Role Staff & Manager cannot uncheck a verified Form Claim MDR. Contact an Admin.'
      );
      return;
    }

    if (!canEditRecord(tour.staffName)) {
      toast.error('Permission denied: You cannot modify this tour record.');
      return;
    }

    const prevClaimMdr = Boolean(tour.claimMdr);
    const prevClaimMdrAt = tour.claimMdrAt || null;
    const prevClaimMdrBy = tour.claimMdrBy || null;
    const nextClaimMdr = !prevClaimMdr;
    const nowIso = new Date().toISOString();
    setTogglingMdrId(tour.id);

    try {
      await updateTour(tour.id, {
        claimMdr: nextClaimMdr,
        claimMdrAt: nextClaimMdr ? nowIso : null,
        claimMdrBy: nextClaimMdr ? user?.name || 'Staff' : null,
        updatedBy: user?.name || 'Staff',
        userRole: user?.role
      });
      if (isAdmin) {
        toast.success(
          nextClaimMdr ? 'Form Claim MDR diverifikasi!' : 'Status Claim MDR dibatalkan.',
          {
            duration: 6000,
            actionLabel: 'Undo',
            onAction: async () => {
              await updateTour(tour.id, {
                claimMdr: prevClaimMdr,
                claimMdrAt: prevClaimMdrAt,
                claimMdrBy: prevClaimMdrBy,
                updatedBy: user?.name || 'Admin',
                userRole: user?.role
              });
              toast.info('Perubahan Claim MDR dikembalikan.');
            }
          }
        );
      } else {
        toast.success(
          nextClaimMdr ? 'Form Claim MDR verified & timestamped!' : 'Form Claim MDR unchecked.'
        );
      }
    } catch (err) {
      toast.error('Unable to update Form Claim MDR: ' + err.message);
    } finally {
      setTogglingMdrId(null);
    }
  };

  const handleCopyGuestLink = (tour) => {
    const code = tour.bookingCode || tour.tourCode || tour.id;
    const url = `${window.location.origin}/track/${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Guest tracking link copied (${code})!`);
  };

  const formatClaimMdrDateTime = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return String(isoStr);
      return (
        d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
        ' ' +
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    } catch {
      return String(isoStr);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirm':
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" /> Confirm
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" /> Pending
          </span>
        );
      case 'Cancel':
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cancel
          </span>
        );
      case 'Past Date':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-border">
            {status}
          </span>
        );
    }
  };

  const getInvoiceStatusBadge = (tour) => {
    const invNum = tour.invoiceNumber;
    const hasInv = Boolean(invNum && String(invNum).trim() !== '');

    if (hasInv) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', alignItems: 'flex-start' }}>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
          >
            <CheckCircle2 size={11} /> Invoiced
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '0.74rem',
                color: 'var(--primary)',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title={`Nomor Invoice: ${invNum}`}
            >
              <FileText size={11} /> {invNum}
            </span>
            {canEditRecord(tour.staffName) && (
              <button
                type="button"
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
                  alignItems: 'center'
                }}
                title="Edit Invoice Number"
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
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
        >
          <AlertCircle size={11} /> Uninvoiced
        </span>
        {canEditRecord(tour.staffName) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenQuickInvoice(tour);
            }}
            style={{
              background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.1)',
              border: `1px dashed ${isLight ? '#7dd3fc' : 'rgba(0, 168, 255, 0.4)'}`,
              borderRadius: '5px',
              color: 'var(--primary)',
              fontSize: '0.68rem',
              padding: '0.15rem 0.45rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '600'
            }}
            title="Click to enter invoice number"
          >
            <FileText size={10} /> + Input Invoice
          </button>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
            Not issued
          </span>
        )}
      </div>
    );
  };

  const exportColumns = [
    { header: 'Tour Code', key: 'tourCode', format: null },
    { header: 'Jenis Tour', key: 'tourType', format: null },
    { header: 'Supplier Mitra', key: 'supplier', format: null },
    { header: 'Booking Code', key: 'bookingCode', format: null },
    { header: 'Lead Traveler', key: 'leadPaxName', format: null },
    { header: 'Pax Count', key: 'paxCount', format: null },
    { header: 'Nomor DP', key: 'depositNumber', format: null },
    { header: 'Nominal DP', key: 'depositAmount', format: 'currency' },
    { header: 'Destination', key: 'country', format: null },
    { header: 'Category', key: 'category', format: null },
    { header: 'Departure Date', key: 'departureDate', format: null },
    { header: 'Return Date', key: 'returnDate', format: null },
    { header: 'PIC Staff', key: 'staffName', format: null },
    { header: 'Status Booking', key: 'status', format: null },
    { header: 'Harga Dasar Tour', key: 'basicTourPrice', format: 'currency' },
    { header: 'Airport Tax & Fuel', key: 'airportTax', format: 'currency' },
    { header: 'Tipping Guide & Driver', key: 'tipping', format: 'currency' },
    { header: 'Misc Charge', key: 'miscCharge', format: 'currency' },
    { header: 'PPN', key: 'ppn', format: 'currency' },
    { header: 'Discount Supplier', key: 'discountSupplier', format: 'currency' },
    { header: 'Discount Branch', key: 'discountBranch', format: 'currency' },
    { header: 'Nominal Profit', key: 'profit', format: 'currency' },
    { header: 'Total Selling Price (Omset)', key: 'totalSellingPrice', format: 'currency' },
    { header: 'Sisa Pelunasan Tamu', key: 'sisaPelunasan', format: 'currency' },
    { header: 'Total Nett Price (Cost)', key: 'totalNettPrice', format: 'currency' },
    { header: 'Status Form Claim MDR', key: 'claimMdrStatus', format: null },
    { header: 'Tanggal & Jam Claim MDR', key: 'claimMdrAt', format: null },
    { header: 'PIC Claim MDR', key: 'claimMdrBy', format: null },
    { header: 'Status Invoice', key: 'invoiceStatus', format: null },
    { header: 'Nomor Invoice', key: 'invoiceNumber', format: null }
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map((t) => t.id)));
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
    if (window.confirm(`Change status of ${selectedIds.size} selected tour(s) to ${newStatus}?`)) {
      const count = selectedIds.size;
      for (const id of selectedIds) {
        await updateTour(id, { status: newStatus, updatedBy: user?.name || 'System' });
      }
      setSelectedIds(new Set());
      toast.success(`Updated ${count} tour(s) to ${newStatus}.`);
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Permanently delete ${selectedIds.size} selected tour booking(s)? This cannot be undone.`
      )
    ) {
      const count = selectedIds.size;
      for (const id of selectedIds) {
        await deleteTour(id);
      }
      setSelectedIds(new Set());
      toast.success(`Deleted ${count} tour booking(s).`);
    }
  };

  const emeraldText = isLight ? '#047857' : '#34d399';
  const amberText = isLight ? '#b45309' : '#fbbf24';

  const SCOPE_TABS = [
    { id: 'active', label: 'Active & Upcoming', count: scopeCounts.active },
    { id: 'followup', label: 'Needs Follow-Up', count: scopeCounts.followup, warn: true },
    { id: 'mine', label: 'My Bookings', count: scopeCounts.mine },
    { id: 'past', label: 'Completed (Past Date)', count: scopeCounts.past },
    { id: 'cancelled', label: 'Cancelled', count: scopeCounts.cancelled },
    { id: 'all', label: 'All Records', count: scopeCounts.all }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Lifecycle Scope Pills */}
      {!customData && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap'
          }}
        >
          {SCOPE_TABS.map((tab) => {
            const isActive = scope === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleScopeSwitch(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                  border: `1px solid ${
                    isActive
                      ? 'transparent'
                      : tab.warn && tab.count > 0
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'var(--border)'
                  }`,
                  background: isActive
                    ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)'
                    : isLight
                      ? '#ffffff'
                      : 'var(--bg-card)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 3px 12px rgba(0, 168, 255, 0.28)' : 'none'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '0.05rem 0.44rem',
                    borderRadius: '9999px',
                    fontSize: '0.69rem',
                    fontWeight: '800',
                    background: isActive
                      ? 'rgba(255, 255, 255, 0.24)'
                      : tab.warn && tab.count > 0
                        ? 'rgba(245, 158, 11, 0.16)'
                        : isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.12)',
                    color: isActive
                      ? '#ffffff'
                      : tab.warn && tab.count > 0
                        ? amberText
                        : 'var(--primary)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search, Bulk Actions & Export Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '42px',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Unified Instant Search (Including Passenger Names!) */}
          <div style={{ position: 'relative', minWidth: '270px', maxWidth: '380px', flex: '1 1 280px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.8rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setSelectedIds(new Set());
              }}
              placeholder="Search traveler name, tour/booking code, DP, invoice, country..."
              style={{
                width: '100%',
                padding: '0.5rem 2.1rem 0.5rem 2.25rem',
                borderRadius: '10px',
                fontSize: '0.8125rem'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '0.55rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: '2px'
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}

          {/* Bulk Actions Pill */}
          {selectedIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: isLight ? '#eff8ff' : 'var(--glass-bg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                padding: '0.38rem 0.85rem',
                borderRadius: '11px',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--primary)' }}>
                {selectedIds.size} Selected
              </span>
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Confirm')}
                className="btn"
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.74rem',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: emeraldText,
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                Mark Confirm
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Pending')}
                className="btn"
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.74rem',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: amberText,
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                Mark Pending
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Cancel')}
                className="btn"
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.74rem',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                Mark Cancel
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="btn btn-danger"
                  style={{ padding: '0.22rem 0.6rem', fontSize: '0.74rem', gap: '0.25rem' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Table Density Switcher */}
          <div
            className="inline-flex items-center rounded-lg border border-border p-0.5 bg-slate-50 dark:bg-white/5 text-xs"
            title="Kerapatan Tampilan Tabel"
          >
            <button
              type="button"
              onClick={() => handleDensityChange('comfortable')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border-none cursor-pointer ${
                tableDensity === 'comfortable'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Lega
            </button>
            <button
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border-none cursor-pointer ${
                tableDensity === 'compact'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Ringkas
            </button>
          </div>

          <ExportMenu
            data={scopedAndSearchedTours}
            columns={exportColumns}
            filename={`Tours_${scope.toUpperCase()}`}
          />
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {(searchQuery || (scope !== 'active' && !customData) || (tourTypeFilter && tourTypeFilter !== 'All')) && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-text-muted text-[11px] font-semibold">Filter Aktif:</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              Kata Kunci: "{searchQuery}"
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:opacity-75 cursor-pointer p-0 bg-transparent border-none text-current inline-flex items-center"
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {scope !== 'active' && !customData && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-text-main border border-border font-medium">
              Scope: {SCOPE_TABS.find((s) => s.id === scope)?.label || scope}
              <button
                type="button"
                onClick={() => handleScopeSwitch('active')}
                className="hover:opacity-75 cursor-pointer p-0 bg-transparent border-none text-current inline-flex items-center"
                title="Kembali ke Active"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {tourTypeFilter && tourTypeFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
              Modul: {tourTypeFilter} Tours
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              handleScopeSwitch('active');
            }}
            className="text-xs text-text-muted hover:text-danger cursor-pointer ml-1 underline bg-transparent border-none p-0"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Quick Operational Filter Chips (Saved per session) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexWrap: 'wrap',
          paddingTop: '0.15rem'
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.73rem',
            fontWeight: '700',
            color: 'var(--text-subtle)',
            marginRight: '0.2rem'
          }}
        >
          <Filter size={12} /> Filter Cepat:
        </span>

        {currentUserName && (
          <button
            type="button"
            className={`quick-filter-chip ${quickChips.onlyMine ? 'active' : ''}`}
            onClick={() => toggleQuickChip('onlyMine')}
          >
            Milik Saya
          </button>
        )}

        <button
          type="button"
          className={`quick-filter-chip ${quickChips.onlyBalanceDue ? 'active' : ''}`}
          onClick={() => toggleQuickChip('onlyBalanceDue')}
        >
          Belum Lunas
        </button>

        <button
          type="button"
          className={`quick-filter-chip ${quickChips.onlyUninvoiced ? 'active' : ''}`}
          onClick={() => toggleQuickChip('onlyUninvoiced')}
        >
          Belum Invoice
        </button>

        {(tourTypeFilter === 'All' || tourTypeFilter === 'Series') && (
          <button
            type="button"
            className={`quick-filter-chip ${quickChips.onlyUnclaimedMdr ? 'active' : ''}`}
            onClick={() => toggleQuickChip('onlyUnclaimedMdr')}
          >
            MDR Unclaimed
          </button>
        )}

        <button
          type="button"
          className={`quick-filter-chip ${quickChips.onlyDepartingSoon ? 'active' : ''}`}
          onClick={() => toggleQuickChip('onlyDepartingSoon')}
        >
          Berangkat H-14
        </button>

        {hasQuickChipsActive && (
          <button
            type="button"
            onClick={() =>
              setQuickChips({
                onlyMine: false,
                onlyBalanceDue: false,
                onlyUninvoiced: false,
                onlyUnclaimedMdr: false,
                onlyDepartingSoon: false
              })
            }
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              fontSize: '0.73rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '0.25rem'
            }}
          >
            Hapus Chip
          </button>
        )}
      </div>

      {/* Main Bookings Table */}
      {toursLoading && allFlatTours.length === 0 ? (
        <SkeletonLoader type="table" />
      ) : (
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
          width: '100%'
        }}
      >
        {/* Desktop Table View */}
        <div
          ref={tableScrollRef}
          className="table-sticky-wrapper desktop-table-view"
          style={isVirtualized ? { maxHeight: '72vh', overflowY: 'auto' } : undefined}
        >
          <table
            className={`data-table ${tableDensity === 'compact' ? 'table-compact' : 'table-comfortable'}`}
            style={{ width: '100%', minWidth: '1280px' }}
          >
            <thead>
              <tr>
                <th style={{ width: '42px', minWidth: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 && selectedIds.size === paginatedData.length
                    }
                    onChange={handleSelectAll}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary)'
                    }}
                  />
                </th>

                <th className="sticky-col-left" style={{ width: '135px', minWidth: '135px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('tourCode')}
                    >
                      Tour Code <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.tourCode || ''}
                      onChange={(e) => handleFilterChange('tourCode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.24rem 0.45rem',
                        fontSize: '0.73rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </th>

                <th style={{ width: '150px', minWidth: '150px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('bookingCode')}
                    >
                      Booking &amp; DP <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.bookingCode || ''}
                      onChange={(e) => handleFilterChange('bookingCode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.24rem 0.45rem',
                        fontSize: '0.73rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </th>

                <th style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('country')}
                    >
                      Destination &amp; Travelers <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.country || ''}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.24rem 0.45rem',
                        fontSize: '0.73rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </th>

                <th style={{ width: '140px', minWidth: '140px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('departureDate')}
                    >
                      Travel Dates <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <div style={{ height: '25px' }} />
                  </div>
                </th>

                <th style={{ width: '150px', minWidth: '150px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('totalOmset')}
                    >
                      Omset &amp; Balance <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <div style={{ height: '25px' }} />
                  </div>
                </th>

                <th style={{ width: '110px', minWidth: '110px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('status')}
                    >
                      Status <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.73rem',
                        height: '26px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    >
                      <option value="">All</option>
                      <option value="Confirm">Confirm</option>
                      <option value="Pending">Pending</option>
                      <option value="Past Date">Completed</option>
                      <option value="Cancel">Cancel</option>
                    </select>
                  </div>
                </th>

                <th style={{ width: '120px', minWidth: '120px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('invoiceStatus')}
                    >
                      Invoice <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <select
                      value={filters.invoiceStatus || ''}
                      onChange={(e) => handleFilterChange('invoiceStatus', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.73rem',
                        height: '26px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    >
                      <option value="">All</option>
                      <option value="Sudah">Invoiced</option>
                      <option value="Belum">Uninvoiced</option>
                    </select>
                  </div>
                </th>

                <th style={{ width: '120px', minWidth: '120px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('claimMdr')}
                    >
                      {tourTypeFilter === 'Incentive' || tourTypeFilter === 'Consortium'
                        ? 'Supplier Mitra'
                        : 'Claim MDR'}
                      <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <select
                      value={filters.claimMdrStatus || ''}
                      onChange={(e) => handleFilterChange('claimMdrStatus', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.73rem',
                        height: '26px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    >
                      <option value="">All</option>
                      <option value="Sudah Claim">Claimed</option>
                      <option value="Belum Claim">Unclaimed</option>
                    </select>
                  </div>
                </th>

                <th style={{ width: '155px', minWidth: '155px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('staffName')}
                    >
                      PIC Staff <ArrowUpDown size={12} style={{ marginLeft: '0.35rem', opacity: 0.7 }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.staffName || ''}
                      onChange={(e) => handleFilterChange('staffName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.24rem 0.45rem',
                        fontSize: '0.73rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </th>

                <th className="sticky-col-right" style={{ width: '110px', minWidth: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                <>
                {isVirtualized && paddingTop > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan="11" style={{ height: `${paddingTop}px`, padding: 0, border: 'none' }} />
                  </tr>
                )}
                {visibleTableRows.map((tour) => {
                  const dur = getTripDurationInfo(tour.departureDate, tour.returnDate);
                  return (
                    <tr
                      key={tour.id}
                      onClick={() => openInspector(tour, 'overview')}
                      style={{
                        cursor: 'pointer',
                        background: selectedIds.has(tour.id)
                          ? isLight
                            ? 'rgba(0, 168, 255, 0.08)'
                            : 'rgba(0, 168, 255, 0.1)'
                          : undefined
                      }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(tour.id)}
                          onChange={() => handleSelectRow(tour.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                            accentColor: 'var(--primary)'
                          }}
                        />
                      </td>

                      {/* Tour Code (Frozen Left) */}
                      <td className="sticky-col-left">
                        <div className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                          {tour.tourCode || '-'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.64rem',
                              fontWeight: '700',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background:
                                tour.tourType === 'Consortium'
                                  ? 'rgba(245, 158, 11, 0.14)'
                                  : tour.tourType === 'Incentive'
                                    ? 'rgba(139, 92, 246, 0.14)'
                                    : 'rgba(2, 132, 199, 0.14)',
                              color:
                                tour.tourType === 'Consortium'
                                  ? '#f59e0b'
                                  : tour.tourType === 'Incentive'
                                    ? '#8b5cf6'
                                    : '#0284c7'
                            }}
                          >
                            {tour.tourType || 'Series'}
                          </span>
                          {tour.supplier && (
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                              · {tour.supplier}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Booking Code & DP */}
                      <td className="font-mono">
                        <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                          {tour.bookingCode || '-'}
                        </div>
                        {tour.depositNumber ? (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: emeraldText,
                              fontWeight: '600',
                              marginTop: '2px'
                            }}
                          >
                            DP: {tour.depositNumber}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--danger)',
                              fontWeight: '600',
                              marginTop: '2px'
                            }}
                          >
                            DP: Missing
                          </div>
                        )}
                      </td>

                      {/* Destination & Travelers */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {tour.country || '-'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Users size={11} color="var(--primary)" />
                          <span>{tour.paxCount || 1} Pax</span>
                          {tour.leadPaxName && (
                            <span style={{ color: 'var(--text-subtle)' }}>
                              · {tour.leadPaxName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Travel Dates */}
                      <td>
                        <div
                          className="font-mono"
                          style={{
                            color: isLight ? '#0369a1' : '#38bdf8',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}
                        >
                          {formatShortDate(tour.departureDate)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                          {tour.returnDate ? `→ ${formatShortDate(tour.returnDate)}` : ''}
                          {dur?.valid ? ` (${dur.label})` : ''}
                        </div>
                      </td>

                      {/* Omset & Balance */}
                      <td className="font-mono">
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          Rp {formatCurrency(tour.totalOmset)}
                        </div>
                        <div style={{ fontSize: '0.69rem', marginTop: '2px' }}>
                          {tour.totalOmset > 0 && tour.sisaPelunasan <= 0 ? (
                            <span style={{ color: emeraldText, fontWeight: '800' }}>LUNAS</span>
                          ) : tour.sisaPelunasan > 0 ? (
                            <span style={{ color: amberText, fontWeight: '600' }}>
                              Due: Rp {formatCurrency(tour.sisaPelunasan)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)' }}>-</span>
                          )}
                        </div>
                      </td>

                      {/* Booking Status */}
                      <td>{getStatusBadge(tour.status)}</td>

                      {/* Invoice Status */}
                      <td onClick={(e) => e.stopPropagation()}>{getInvoiceStatusBadge(tour)}</td>

                      {/* Claim MDR or Supplier */}
                      <td onClick={(e) => e.stopPropagation()}>
                        {tour.tourType === 'Incentive' || tour.tourType === 'Consortium' ? (
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                              {tour.supplier || '-'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Mitra Operator
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label
                              onClick={(e) => {
                                e.stopPropagation();
                                if (tour.claimMdr && !isAdmin) {
                                  toast.warning(
                                    'Locked: Only an Admin can uncheck a verified Form Claim MDR.'
                                  );
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
                                  ? `Verified ${formatClaimMdrDateTime(tour.claimMdrAt)}${tour.claimMdrBy ? ' by ' + tour.claimMdrBy : ''}`
                                  : 'Click to verify Form Claim MDR'
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
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  color: tour.claimMdr ? emeraldText : 'var(--text-subtle)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {tour.claimMdr ? (
                                  <>
                                    Claimed
                                    {!isAdmin && <Lock size={11} />}
                                  </>
                                ) : (
                                  'Unclaimed'
                                )}
                              </span>
                            </label>
                            {tour.claimMdr && tour.claimMdrAt && (
                              <div
                                style={{
                                  fontSize: '0.66rem',
                                  color: emeraldText,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {formatClaimMdrDateTime(tour.claimMdrAt)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* PIC Staff */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {tour.staffName || '-'}
                        </span>
                      </td>

                      {/* Row Actions (Frozen Right) */}
                      <td className="sticky-col-right" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.32rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="icon-action-btn view"
                            onClick={() => openInspector(tour, 'overview')}
                            title="Inspect Details, Travelers & History"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => setSettlementTour(tour)}
                            style={{
                              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
                              color: emeraldText,
                              borderColor: 'rgba(16, 185, 129, 0.28)'
                            }}
                            title="Bukti Pelunasan Tour (Excel / Print)"
                          >
                            <FileSpreadsheet size={14} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => handleCopyGuestLink(tour)}
                            style={{
                              background: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.1)',
                              color: isLight ? '#0284c7' : '#38bdf8',
                              borderColor: 'rgba(56, 189, 248, 0.25)'
                            }}
                            title="Copy Guest Status Portal Link"
                          >
                            <Share2 size={14} />
                          </button>

                          {onDuplicate && (
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => onDuplicate(tour)}
                              style={{
                                background: isLight ? '#f5f3ff' : 'rgba(139, 92, 246, 0.12)',
                                color: isLight ? '#6d28d9' : '#a78bfa',
                                borderColor: 'rgba(139, 92, 246, 0.25)'
                              }}
                              title="Duplicate as New Booking Template"
                            >
                              <Copy size={14} />
                            </button>
                          )}

                          {canEditRecord(tour.staffName) && (
                            <button
                              type="button"
                              className="icon-action-btn edit"
                              onClick={() => onEdit(tour)}
                              title="Edit Booking"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="icon-action-btn delete"
                              onClick={async () => {
                                if (window.confirm('Delete this tour booking permanently?')) {
                                  await deleteTour(tour.id);
                                  toast.success('Tour booking deleted.');
                                }
                              }}
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {isVirtualized && paddingBottom > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan="11" style={{ height: `${paddingBottom}px`, padding: 0, border: 'none' }} />
                  </tr>
                )}
                </>
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '0.8rem',
                        borderRadius: '50%',
                        background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.08)',
                        color: 'var(--primary)',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <Plane size={24} />
                    </div>
                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>
                      No tour bookings match this view
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
                      {scope !== 'all'
                        ? 'Try switching scope tabs above (e.g. Completed or All Records) or clearing filters.'
                        : 'Try clearing your search filters or add a new tour booking.'}
                    </p>
                    {(hasActiveFilters || scope !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          handleResetFilters();
                          setScope('all');
                        }}
                        className="btn btn-secondary"
                        style={{ marginTop: '0.85rem', fontSize: '0.8rem' }}
                      >
                        Show All Records
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Operational Card View (<= 768px) */}
        <div className="mobile-card-list">
          {paginatedData.length > 0 ? (
            paginatedData.map((tour) => (
              <div
                key={`mob-${tour.id}`}
                onClick={() => openInspector(tour, 'overview')}
                style={{
                  padding: '0.95rem',
                  borderRadius: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <div className="font-mono" style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--primary)' }}>
                      {tour.bookingCode || tour.tourCode || '-'}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {tour.country || 'Destinasi'} · {tour.paxCount || 1} Pax
                    </div>
                  </div>
                  {getStatusBadge(tour.status)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>📅 {formatShortDate(tour.departureDate)}</span>
                  <span>👤 {tour.staffName || '-'}</span>
                  {tour.leadPaxName && <span>🧳 {tour.leadPaxName}</span>}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.55rem',
                    borderTop: '1px solid var(--border)',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Omset / Sisa</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {formatCurrency(tour.totalSellingPrice)}
                      {Number(tour.sisaPelunasan || 0) > 0 && (
                        <span style={{ color: '#f59e0b', marginLeft: '0.35rem', fontSize: '0.76rem' }}>
                          (Sisa {formatCurrency(tour.sisaPelunasan)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <WhatsAppQuickMenu moduleType="tour" record={tour} compact label="WA" />
                    <button
                      type="button"
                      onClick={() => openInspector(tour, 'overview')}
                      className="btn btn-secondary"
                      style={{ padding: '0.32rem 0.6rem', fontSize: '0.74rem' }}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tidak ada booking tour pada filter ini.
            </div>
          )}
        </div>
      </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Baris per halaman:</span>
          {[10, 25, 50, 'all'].map((opt) => {
            const active = pageSize === opt;
            return (
              <button
                key={String(opt)}
                type="button"
                onClick={() => {
                  setPageSize(opt);
                  setCurrentPage(1);
                  setSelectedIds(new Set());
                }}
                style={{
                  padding: '0.24rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: active ? '700' : '500',
                  cursor: 'pointer',
                  border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: active ? 'rgba(0, 168, 255, 0.14)' : 'var(--bg-card)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                {opt === 'all' ? 'All (Virtual)' : opt}
              </button>
            );
          })}
          {isVirtualized && (
            <span
              style={{
                marginLeft: '0.35rem',
                fontSize: '0.72rem',
                color: '#10b981',
                fontWeight: '600'
              }}
            >
              ⚡ Virtualized ({paginatedData.length} rows)
            </span>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedIds(new Set());
          }}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Floating Bulk Action Bar */}
      <FloatingBulkBar
        count={selectedIds.size}
        itemLabel="tour"
        onClear={() => setSelectedIds(new Set())}
      >
        <button
          type="button"
          onClick={() => handleBulkStatusChange('Confirm')}
          className="btn"
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.78rem',
            background: 'rgba(16, 185, 129, 0.16)',
            color: emeraldText,
            border: '1px solid rgba(16, 185, 129, 0.35)',
            fontWeight: 700
          }}
        >
          Mark Confirm
        </button>
        <button
          type="button"
          onClick={() => handleBulkStatusChange('Pending')}
          className="btn"
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.78rem',
            background: 'rgba(245, 158, 11, 0.16)',
            color: amberText,
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontWeight: 700
          }}
        >
          Mark Pending
        </button>
        <button
          type="button"
          onClick={() => handleBulkStatusChange('Cancel')}
          className="btn"
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.78rem',
            background: 'rgba(239, 68, 68, 0.16)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontWeight: 700
          }}
        >
          Mark Cancel
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={handleBulkDelete}
            className="btn btn-danger"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem', fontWeight: 700 }}
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </FloatingBulkBar>

      {/* SEAMLESS SLIDE-OVER INSPECTOR DRAWER */}
      <SlideOverDrawer
        isOpen={Boolean(viewingTour)}
        onClose={() => setViewingTourId(null)}
        width="580px"
        title={
          viewingTour
            ? `${viewingTour.country || 'Tour'} · ${viewingTour.bookingCode || viewingTour.tourCode || viewingTour.id}`
            : 'Tour Details'
        }
        subtitle={
          viewingTour
            ? `${viewingTour.tourCode ? `Tour Code: ${viewingTour.tourCode} · ` : ''}${viewingTour.paxCount || 1} Pax · PIC: ${viewingTour.staffName || 'Unassigned'}`
            : ''
        }
        footer={
          viewingTour && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.55rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <WhatsAppQuickMenu moduleType="tour" record={viewingTour} align="left" label="Template WA" />
                <button
                  type="button"
                  onClick={() => setSettlementTour(viewingTour)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', color: emeraldText, borderColor: 'rgba(16, 185, 129, 0.35)' }}
                >
                  <FileSpreadsheet size={14} /> Pelunasan
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingTour;
                      setViewingTourId(null);
                      onDuplicate(target);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                )}
                {canEditRecord(viewingTour.staffName) && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingTour;
                      setViewingTourId(null);
                      onEdit(target);
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Edit2 size={14} /> Edit Booking
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {viewingTour && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Segmented Drawer Tabs */}
            <div
              style={{
                display: 'flex',
                background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.06)',
                padding: '0.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                gap: '0.25rem'
              }}
            >
              {[
                { id: 'overview', label: 'Overview & Financials' },
                {
                  id: 'passengers',
                  label: `Travelers (${Array.isArray(viewingTour.paxInfo) ? viewingTour.paxInfo.length : 0})`
                },
                {
                  id: 'history',
                  label: `Activity (${Array.isArray(viewingTour.history) ? viewingTour.history.length : 0})`
                }
              ].map((tb) => {
                const active = drawerTab === tb.id;
                return (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setDrawerTab(tb.id)}
                    style={{
                      flex: 1,
                      padding: '0.42rem 0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: active
                        ? 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)'
                        : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tb.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & FINANCIALS */}
            {drawerTab === 'overview' && (
              <>
                {/* Core Trip Summary Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.85rem',
                    padding: '1rem 1.1rem',
                    borderRadius: '12px',
                    background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Tour Code
                    </span>
                    <div className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)', marginTop: '0.15rem' }}>
                      {viewingTour.tourCode || '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Booking Code
                    </span>
                    <div className="font-mono" style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {viewingTour.bookingCode || '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Jenis Tour
                    </span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          viewingTour.tourType === 'Consortium'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : viewingTour.tourType === 'Incentive'
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                              : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {viewingTour.tourType || 'Series'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Status
                    </span>
                    <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(viewingTour.status)}</div>
                  </div>
                  {viewingTour.supplier && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Supplier / Wholesaler Partner
                      </span>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem', fontSize: '0.86rem' }}>
                        <Building2 size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem', color: 'var(--primary)' }} />
                        {viewingTour.supplier}
                      </div>
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Travel Window
                    </span>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem', fontSize: '0.86rem' }}>
                      <Calendar size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem', color: 'var(--primary)' }} />
                      {formatShortDate(viewingTour.departureDate)} → {formatShortDate(viewingTour.returnDate)}
                      {(() => {
                        const d = getTripDurationInfo(viewingTour.departureDate, viewingTour.returnDate);
                        return d?.valid ? (
                          <span style={{ color: 'var(--primary)', marginLeft: '0.45rem', fontWeight: '700' }}>
                            ({d.label})
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Form Claim MDR Card (Only for Series) vs Supplier Card (Incentive & Consortium) */}
                {viewingTour.tourType === 'Series' ? (
                  <div
                    style={{
                      background: viewingTour.claimMdr
                        ? isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.08)'
                        : isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${viewingTour.claimMdr ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <label
                        onClick={(e) => {
                          if (viewingTour.claimMdr && !isAdmin) {
                            e.preventDefault();
                            toast.warning('Locked: Only an Admin can uncheck a verified Form Claim MDR.');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          cursor: canToggleClaimMdr(viewingTour) ? 'pointer' : 'not-allowed',
                          margin: 0
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(viewingTour.claimMdr)}
                          disabled={!canToggleClaimMdr(viewingTour) || togglingMdrId === viewingTour.id}
                          onChange={(e) => handleToggleClaimMdr(viewingTour, e)}
                          style={{
                            width: '17px',
                            height: '17px',
                            cursor: canToggleClaimMdr(viewingTour) ? 'pointer' : 'not-allowed',
                            accentColor: '#10b981'
                          }}
                        />
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: viewingTour.claimMdr ? emeraldText : 'var(--text-main)' }}>
                          Form Claim MDR
                        </span>
                      </label>
                      {viewingTour.claimMdr ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                          Verified {!isAdmin && <Lock size={10} />}
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                          Unclaimed
                        </span>
                      )}
                    </div>

                    {viewingTour.claimMdr && viewingTour.claimMdrAt && (
                      <div style={{ fontSize: '0.74rem', color: emeraldText }}>
                        <span className="font-mono">{formatClaimMdrDateTime(viewingTour.claimMdrAt)}</span>
                        {viewingTour.claimMdrBy ? ` · ${viewingTour.claimMdrBy}` : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '0.85rem 1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Building2
                        size={18}
                        style={{
                          color: viewingTour.tourType === 'Consortium' ? '#10b981' : '#8b5cf6'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Mitra Supplier
                        </span>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {viewingTour.supplier || 'Direct / Tanpa Wholesaler'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        viewingTour.tourType === 'Consortium'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      } text-xs font-bold`}
                    >
                      MDR Nonaktif
                    </span>
                  </div>
                )}

                {/* Financials Breakdown */}
                <div>
                  <h4
                    style={{
                      margin: '0 0 0.65rem 0',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <DollarSign size={16} color="#10b981" /> Financial &amp; Settlement Breakdown
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.85rem',
                      padding: '1rem 1.1rem',
                      borderRadius: '12px',
                      background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Harga Dasar Tour</span>
                      <div className="font-mono" style={{ fontWeight: '700', marginTop: '0.15rem' }}>
                        Rp {formatCurrency(viewingTour.basicTourPrice)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nominal Profit</span>
                      <div className="font-mono" style={{ fontWeight: '700', color: emeraldText, marginTop: '0.15rem' }}>
                        Rp {formatCurrency(viewingTour.profit)}{' '}
                        {viewingTour.totalSellingPrice > 0 && (
                          <span style={{ fontSize: '0.7rem' }}>
                            ({((viewingTour.profit / viewingTour.totalSellingPrice) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Discount Supplier</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: amberText, marginTop: '0.15rem' }}>
                        - Rp {formatCurrency(viewingTour.discountSupplier)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Discount Branch</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: amberText, marginTop: '0.15rem' }}>
                        - Rp {formatCurrency(viewingTour.discountBranch)}
                      </div>
                    </div>

                    {viewingTour.tourType === 'Consortium' && (
                      <>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Airport Tax &amp; Fuel</span>
                          <div className="font-mono" style={{ fontWeight: '600', marginTop: '0.15rem' }}>
                            Rp {formatCurrency(viewingTour.airportTax)}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tipping Guide &amp; Driver</span>
                          <div className="font-mono" style={{ fontWeight: '600', marginTop: '0.15rem' }}>
                            Rp {formatCurrency(viewingTour.tipping)}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PPN (1.1%)</span>
                          <div className="font-mono" style={{ fontWeight: '600', marginTop: '0.15rem' }}>
                            Rp {formatCurrency(viewingTour.ppn)}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Misc Charge</span>
                          <div className="font-mono" style={{ fontWeight: '600', marginTop: '0.15rem' }}>
                            Rp {formatCurrency(viewingTour.miscCharge)}
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700' }}>
                        Total Selling (Omset)
                      </span>
                      <div className="font-mono" style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.05rem', marginTop: '0.15rem' }}>
                        Rp {formatCurrency(viewingTour.totalSellingPrice)}
                      </div>
                    </div>

                    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: emeraldText, fontWeight: '700' }}>
                        Total Nett (Cost)
                      </span>
                      <div className="font-mono" style={{ fontWeight: '800', color: emeraldText, fontSize: '1.05rem', marginTop: '0.15rem' }}>
                        Rp {formatCurrency(viewingTour.totalNettPrice)}
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', paddingTop: '0.65rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deposit &amp; Sisa Pelunasan</span>
                        <div style={{ marginTop: '0.2rem', fontSize: '0.82rem' }}>
                          <strong className="font-mono" style={{ color: viewingTour.depositNumber ? emeraldText : 'var(--danger)' }}>
                            {viewingTour.depositNumber || 'No DP #'}
                          </strong>
                          {' · '}
                          <span className="font-mono">Rp {formatCurrency(viewingTour.depositAmount)}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', marginTop: '0.2rem' }}>
                          Balance:{' '}
                          <strong className="font-mono" style={{ color: viewingTour.sisaPelunasan <= 0 && viewingTour.totalSellingPrice > 0 ? emeraldText : 'var(--primary)' }}>
                            Rp {formatCurrency(viewingTour.sisaPelunasan)}
                            {viewingTour.sisaPelunasan <= 0 && viewingTour.totalSellingPrice > 0 ? ' (LUNAS)' : ''}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invoice Number</span>
                        <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {viewingTour.hasInvoice ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              {viewingTour.invoiceNumber}
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                              Uninvoiced
                            </span>
                          )}
                          {canEditRecord(viewingTour.staffName) && (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickInvoice(viewingTour)}
                              className="btn btn-secondary"
                              style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem' }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest Status Portal Card */}
                {(() => {
                  const trackCode = viewingTour.bookingCode || viewingTour.tourCode || viewingTour.id;
                  return (
                    <div
                      style={{
                        padding: '0.9rem 1.05rem',
                        borderRadius: '12px',
                        background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.08)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          Guest Status Portal
                        </div>
                        <div className="font-mono" style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {trackCode}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyGuestLink(viewingTour)}
                          className="btn btn-secondary"
                          style={{ padding: '0.38rem 0.72rem', fontSize: '0.75rem' }}
                        >
                          <Share2 size={13} color="var(--primary)" /> Copy Link
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingTourId(null);
                            navigate(`/track/${encodeURIComponent(trackCode)}`);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.38rem 0.72rem', fontSize: '0.75rem' }}
                        >
                          Preview <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* TAB 2: PASSENGER MANIFEST */}
            {drawerTab === 'passengers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.isArray(viewingTour.paxInfo) && viewingTour.paxInfo.length > 0 ? (
                  viewingTour.paxInfo.map((pax, idx) => {
                    const pBasic =
                      Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
                    const pDiscSupp = Number(pax.discountSupplier) || 0;
                    const pDiscBranch = Number(pax.discountBranch) || 0;
                    const pSelling = pBasic - pDiscSupp - pDiscBranch;
                    const fullName = `${pax.firstName || ''} ${pax.lastName || ''}`.trim();

                    return (
                      <div
                        key={pax.id || idx}
                        style={{
                          padding: '0.9rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                              {fullName ? `${pax.title}. ${fullName}` : `Passenger ${idx + 1}`}
                            </span>
                            {idx === 0 && (
                              <span className="badge badge-primary" style={{ fontSize: '0.66rem' }}>
                                Lead
                              </span>
                            )}
                          </div>
                          {pBasic > 0 && (
                            <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                              Rp {formatCurrency(pSelling)}
                            </span>
                          )}
                        </div>

                        {(pax.email || pax.phone) && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            {[pax.email, pax.phone].filter(Boolean).join(' · ')}
                          </div>
                        )}

                        {pax.notes && (
                          <div
                            style={{
                              marginTop: '0.45rem',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '7px',
                              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)'
                            }}
                          >
                            Note: {pax.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: '2.2rem 1rem',
                      textAlign: 'center',
                      borderRadius: '12px',
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <User size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>
                      No individual traveler names recorded yet
                    </p>
                    <p style={{ margin: '0.25rem 0 0.85rem 0', fontSize: '0.78rem' }}>
                      This booking specifies {viewingTour.paxCount || 1} passenger(s).
                    </p>
                    {canEditRecord(viewingTour.staffName) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingTour;
                          setViewingTourId(null);
                          onEdit(target);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <Edit2 size={13} /> Add Traveler Names
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIVITY HISTORY */}
            {drawerTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {Array.isArray(viewingTour.history) && viewingTour.history.length > 0 ? (
                  viewingTour.history.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.8rem 0.95rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        borderLeft: '3px solid var(--primary)',
                        background: isLight ? '#f8fbff' : 'rgba(56, 189, 248, 0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {item.action || 'Activity'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} /> {formatClaimMdrDateTime(item.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {item.details}
                      </div>
                      {item.user && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600', marginTop: '0.2rem' }}>
                          By {item.user}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      borderRadius: '12px',
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem'
                    }}
                  >
                    No activity logs recorded for this booking yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* Quick Edit Invoice Modal */}
      {editingInvoiceTour &&
        createPortal(
          <div
            onClick={() => setEditingInvoiceTour(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: isLight ? 'rgba(11, 21, 40, 0.42)' : 'rgba(3, 7, 18, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '1rem'
            }}
          >
            <div
              className="card fade-in"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '430px',
                background: isLight ? '#ffffff' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.4rem',
                boxShadow: 'var(--shadow-card-hover)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.1rem'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileText size={18} color="var(--primary)" /> Input / Edit Invoice Number
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingInvoiceTour(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  background: isLight ? '#f4f9ff' : 'var(--bg-dark)',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  marginBottom: '1.15rem'
                }}
              >
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Selected Booking:
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  <span className="font-mono" style={{ color: 'var(--primary)' }}>
                    {editingInvoiceTour.tourCode || editingInvoiceTour.bookingCode}
                  </span>{' '}
                  · {editingInvoiceTour.country}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveQuickInvoice();
                }}
              >
                <div style={{ marginBottom: '1.2rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      color: 'var(--text-muted)',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    Nomor Invoice
                  </label>
                  <input
                    type="text"
                    value={quickInvoiceValue}
                    onChange={(e) => setQuickInvoiceValue(e.target.value)}
                    placeholder="e.g. INV-2026-001"
                    autoFocus
                    className="font-mono"
                  />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-subtle)',
                      marginTop: '0.4rem',
                      display: 'block'
                    }}
                  >
                    Leave blank and save to revert status back to <strong>Uninvoiced</strong>.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingInvoiceTour(null)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                    disabled={isSavingInvoice}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 1.2rem' }}
                    disabled={isSavingInvoice}
                  >
                    {isSavingInvoice ? 'Saving...' : 'Save Invoice'}
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
