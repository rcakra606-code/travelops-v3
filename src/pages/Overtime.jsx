import { useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import FloatingBulkBar from '../components/FloatingBulkBar';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import BiPageHeader from '../components/bi/BiPageHeader';
import BiKpiCard from '../components/bi/BiKpiCard';
import BiChartCard from '../components/bi/BiChartCard';
import BiTooltip from '../components/bi/BiTooltip';
import { BI_CHART_COLORS } from '../utils/formatters';
import { useOvertimes } from '../context/OvertimeContext';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  OvertimeFormModal,
  OvertimeDossierDrawer,
  OvertimeConfirmDeleteModal
} from '../components/overtime/OvertimeModals';
import { 
  Plus, Edit2, Trash2, Clock, 
  BarChart2, CheckCircle2, XCircle, AlertCircle, 
  Search, Users, Eye, Upload, Filter, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const PAGE_SIZE = 15;

const Overtime = () => {
  const { 
    overtimes, 
    loading: overtimesLoading,
    addOvertime, 
    updateOvertime, 
    quickUpdateStatus, 
    deleteOvertime, 
    bulkImportOvertimes 
  } = useOvertimes();

  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const location = useLocation();
  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#38bdf8';

  const activeStaff = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u.status === 'Active' &&
        (u.role || '').toLowerCase() !== 'admin'
    );
  }, [users]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(() => Boolean(location.state?.openNew));
  const [editingOT, setEditingOT] = useState(null);
  const [viewingOT, setViewingOT] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // React to Quick Create navigation even when already mounted on /overtime
  const navTs = location.state?._ts || null;
  const [lastNavTs, setLastNavTs] = useState(navTs);
  if (navTs && navTs !== lastNavTs) {
    setLastNavTs(navTs);
    if (location.state?.openNew) {
      setEditingOT(null);
      setIsModalOpen(true);
    }
  }

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: '',
    message: ''
  });

  // Table Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [staffFilter, setStaffFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);

  const initialFormData = {
    staff: '',
    eventName: '',
    date: location.state?.prefillDate || new Date().toISOString().split('T')[0],
    hours: '',
    status: 'Pending',
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaff = user?.role === 'Staff';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canManage = isAdmin || isManager;
  const canEditRecord = (recordStaff) => canEditAny || (isStaff && recordStaff === user?.name);

  // --- KPI Telemetry ---
  const totalHours = useMemo(() => {
    return overtimes.reduce((sum, o) => sum + (Number(o.hours) || 0), 0);
  }, [overtimes]);

  const approvedHours = useMemo(() => {
    return overtimes
      .filter(o => o.status === 'Approved')
      .reduce((sum, o) => sum + (Number(o.hours) || 0), 0);
  }, [overtimes]);

  const pendingCount = useMemo(() => {
    return overtimes.filter(o => o.status === 'Pending').length;
  }, [overtimes]);

  const uniqueClaimants = useMemo(() => {
    const set = new Set();
    overtimes.forEach(o => o.staff && set.add(o.staff));
    return set.size;
  }, [overtimes]);

  // Unique list of periods (YYYY-MM)
  const uniquePeriods = useMemo(() => {
    const set = new Set();
    overtimes.forEach(o => {
      if (o.date) set.add(o.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [overtimes]);

  // --- Chart Data ---
  // Status Distribution
  const statusChartData = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, Rejected: 0 };
    overtimes.forEach(o => {
      const s = o.status || 'Pending';
      if (counts[s] !== undefined) counts[s] += 1;
      else counts.Pending += 1;
    });

    return [
      { name: 'Approved', value: counts.Approved, color: '#10b981' },
      { name: 'Pending', value: counts.Pending, color: '#f59e0b' },
      { name: 'Rejected', value: counts.Rejected, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [overtimes]);

  // Hours by Staff
  const staffChartData = useMemo(() => {
    const map = {};
    overtimes.forEach(o => {
      if (o.status !== 'Rejected') {
        const s = o.staff || 'Unknown';
        if (!map[s]) map[s] = { name: s.split(' ')[0], FullName: s, Hours: 0 };
        map[s].Hours += Number(o.hours) || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.Hours - a.Hours).slice(0, 8);
  }, [overtimes]);

  // Monthly Hours Trend
  const monthlyTrendData = useMemo(() => {
    const map = {};
    overtimes.forEach(o => {
      if (!o.date) return;
      const m = o.date.slice(0, 7);
      if (!map[m]) map[m] = { period: m, TotalHours: 0, ApprovedHours: 0 };
      const hrs = Number(o.hours) || 0;
      map[m].TotalHours += hrs;
      if (o.status === 'Approved') map[m].ApprovedHours += hrs;
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
  }, [overtimes]);

  // --- Filtering & Pagination ---
  const filteredOvertimes = useMemo(() => {
    return overtimes.filter(o => {
      const q = searchTerm.toLowerCase().trim();
      const staffName = (o.staff || '').toLowerCase();
      const event = (o.eventName || '').toLowerCase();
      const remarks = (o.remarks || '').toLowerCase();
      const matchSearch = !q || staffName.includes(q) || event.includes(q) || remarks.includes(q);
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchStaff = staffFilter === 'All' || o.staff === staffFilter;
      const matchPeriod = periodFilter === 'All' || (o.date && o.date.startsWith(periodFilter));
      return matchSearch && matchStatus && matchStaff && matchPeriod;
    });
  }, [overtimes, searchTerm, statusFilter, staffFilter, periodFilter]);

  const paginatedOvertimes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOvertimes.slice(start, start + PAGE_SIZE);
  }, [filteredOvertimes, currentPage]);

  const totalPages = Math.ceil(filteredOvertimes.length / PAGE_SIZE) || 1;

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts = { All: overtimes.length, Pending: 0, Approved: 0, Rejected: 0 };
    overtimes.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return counts;
  }, [overtimes]);

  // Handlers for Overtime Modal
  const handleOpenModal = (ot = null) => {
    if (ot) {
      setEditingOT(ot);
      setFormData({
        staff: ot.staff || '',
        eventName: ot.eventName || '',
        date: ot.date || '',
        hours: ot.hours || '',
        status: ot.status || 'Pending',
        remarks: ot.remarks || ''
      });
    } else {
      setEditingOT(null);
      setFormData({
        ...initialFormData,
        staff: user?.name && isStaff ? user.name : (activeStaff[0]?.name || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOT(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staff || !formData.eventName || !formData.date || !formData.hours) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    if (editingOT) {
      const res = await updateOvertime(editingOT.id, formData);
      if (res?.success) {
        toast.success('Overtime record updated.');
        handleCloseModal();
      } else {
        toast.error(res?.error || 'Failed to update overtime.');
      }
    } else {
      const res = await addOvertime(formData);
      if (res?.success) {
        toast.success(`Overtime claim of ${formData.hours} hrs submitted for ${formData.staff}.`);
        handleCloseModal();
      } else {
        toast.error(res?.error || 'Failed to add overtime record.');
      }
    }
  };

  // Quick 1-Click Status Approval with Undo
  const handleQuickStatus = async (id, newStatus) => {
    const existing = overtimes.find((o) => o.id === id);
    const prevStatus = existing?.status || 'Pending';
    const res = await quickUpdateStatus(id, newStatus);
    if (res?.success) {
      toast.success(`Klaim lembur ditandai ${newStatus}.`, {
        duration: 6000,
        actionLabel: 'Undo',
        onAction: async () => {
          const revertRes = await quickUpdateStatus(id, prevStatus);
          if (revertRes?.success) {
            toast.info(`Status klaim dikembalikan ke ${prevStatus}.`);
            if (viewingOT && viewingOT.id === id) {
              setViewingOT((prev) => (prev ? { ...prev, status: prevStatus } : null));
            }
          }
        }
      });
      if (viewingOT && viewingOT.id === id) {
        setViewingOT((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      toast.error(res?.error || 'Failed to update claim status.');
    }
  };

  // Bulk Approve / Reject for Managers & Admins
  const handleBulkStatus = async (targetStatus) => {
    if (!canManage || selectedIds.length === 0) return;
    const ids = [...selectedIds];
    let okCount = 0;
    for (const id of ids) {
      const res = await quickUpdateStatus(id, targetStatus);
      if (res?.success) okCount += 1;
    }
    setSelectedIds([]);
    if (okCount > 0) {
      toast.success(`${okCount} klaim lembur berhasil diubah ke ${targetStatus}.`);
    }
  };

  // Safe Deletion Handlers
  const handlePromptDelete = (ot) => {
    setDeleteConfirm({
      isOpen: true,
      id: ot.id,
      title: 'Delete Overtime Record?',
      message: `Delete ${ot.hours} hrs claim by ${ot.staff} for "${ot.eventName}" on ${ot.date}?`
    });
  };

  const handleExecuteDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null, title: '', message: '' });
    if (!id) return;

    const res = await deleteOvertime(id);
    if (res?.success) {
      toast.success('Overtime record deleted.');
      if (viewingOT && viewingOT.id === id) setViewingOT(null);
    } else {
      toast.error(res?.error || 'Failed to delete record.');
    }
  };

  // CSV Bulk Import
  const handleImportCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.warning('Please select a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          toast.warning('CSV file is empty or missing data rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const staffIdx = headers.findIndex(h => /staff|name|user/i.test(h));
        const eventIdx = headers.findIndex(h => /event|task|activity/i.test(h));
        const dateIdx = headers.findIndex(h => /date/i.test(h));
        const hoursIdx = headers.findIndex(h => /hour/i.test(h));
        const statusIdx = headers.findIndex(h => /status/i.test(h));
        const remarksIdx = headers.findIndex(h => /remark|note/i.test(h));

        if (staffIdx === -1 || dateIdx === -1 || hoursIdx === -1) {
          toast.error('CSV must have "staff", "date", and "hours" columns.');
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const staff = cols[staffIdx] || '';
          const date = cols[dateIdx] || '';
          const hours = Number(cols[hoursIdx]?.replace(/[^0-9.-]/g, '')) || 0;
          if (!staff || !date || hours <= 0) continue;

          parsed.push({
            staff,
            eventName: eventIdx !== -1 && cols[eventIdx] ? cols[eventIdx] : 'Overtime Duty',
            date,
            hours,
            status: statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Pending',
            remarks: remarksIdx !== -1 ? cols[remarksIdx] : ''
          });
        }

        if (parsed.length === 0) {
          toast.warning('No valid overtime rows found to import.');
          return;
        }

        const res = await bulkImportOvertimes(parsed);
        if (res?.success) {
          toast.success(`Successfully imported ${res.count || parsed.length} overtime records.`);
        } else {
          toast.error(res?.error || 'Import failed.');
        }
      } catch (err) {
        console.error('CSV import error:', err);
        toast.error('Failed to parse CSV file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Export Columns Config
  const exportColumns = [
    { header: 'ID', key: 'id' },
    { header: 'Staff Member', key: 'staff' },
    { header: 'Event Name', key: 'eventName' },
    { header: 'Date', key: 'date' },
    { header: 'Hours', key: 'hours' },
    { header: 'Status', key: 'status' },
    { header: 'Remarks', key: 'remarks' }
  ];

  const getStatusBadgeClass = (status) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Pending') return 'badge-warning';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-primary';
  };

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">

            {/* HEADER BAR */}
            <BiPageHeader
              eyebrow="WORKFORCE & APPROVAL LEDGER"
              title="Overtime Reporting & Telemetry"
              subtitle="Operational extra-hours claims, multi-level approvals, and workforce resource tracking."
              actions={
                <>
                  <ExportMenu
                    data={filteredOvertimes}
                    columns={exportColumns}
                    filename="Overtime_Records_Travelops"
                  />

                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                      >
                        <Upload size={15} /> Import CSV
                      </button>
                      <input
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleImportCsv}
                      />
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenModal()}
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
                  >
                    <Plus size={15} /> Log Overtime
                  </button>
                </>
              }
            />

            {/* TABS SELECTOR */}
            <div
              role="tablist"
              aria-label="Overtime Views"
              className="tabs-container"
              style={{ marginBottom: '1.25rem' }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart2 size={15} aria-hidden="true" /> Executive Dashboard
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'database'}
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                <Clock size={15} aria-hidden="true" /> Overtime Registry ({overtimes.length})
              </button>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: EXECUTIVE DASHBOARD                                */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                {/* 4 KPI SCORECARDS (Unified Enterprise BI Kit — Zero Glow Orbs) */}
                <div
                  className="bi-kpi-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.9rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <BiKpiCard
                    label="Total Hours Claimed"
                    value={`${totalHours} hrs`}
                    subValue="Cumulative operational overtime across all events"
                    tone="primary"
                    icon={<Clock size={16} />}
                    drilldownLabel="Lihat Semua"
                    onClick={() => {
                      setStatusFilter('All');
                      setActiveTab('database');
                    }}
                  />

                  <BiKpiCard
                    label="Approved Hours"
                    value={`${approvedHours} hrs`}
                    subValue="Verified and authorized for payroll compensation"
                    tone="success"
                    icon={<CheckCircle2 size={16} />}
                    drilldownLabel="Approved"
                    onClick={() => {
                      setStatusFilter('Approved');
                      setActiveTab('database');
                    }}
                  />

                  <BiKpiCard
                    label="Pending Review"
                    value={`${pendingCount} claims`}
                    subValue={pendingCount > 0 ? 'Requires manager authorization' : 'All claims reviewed'}
                    tone={pendingCount > 0 ? 'warning' : 'success'}
                    icon={<AlertCircle size={16} />}
                    drilldownLabel="Review Pending"
                    onClick={() => {
                      setStatusFilter('Pending');
                      setActiveTab('database');
                    }}
                  />

                  <BiKpiCard
                    label="Active Claimants"
                    value={`${uniqueClaimants} staff`}
                    subValue="Team members logging overtime assistance"
                    tone="neutral"
                    icon={<Users size={16} />}
                  />
                </div>

                {/* CHARTS ROW: Monthly Trend & Status Distribution */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
                  <BiChartCard
                    title="Overtime Hours Trend"
                    subtitle="Monthly overtime hours claimed vs authorized"
                    isEmpty={monthlyTrendData.length === 0}
                    emptyTitle="Belum ada data tren lembur"
                    emptyDescription="Rekam klaim lembur untuk memantau tren bulanan."
                  >
                    <div style={{ height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrendData} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                          <defs>
                            <linearGradient id="otTotalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.28} />
                              <stop offset="95%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="otApprovedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={BI_CHART_COLORS.emerald} stopOpacity={0.26} />
                              <stop offset="95%" stopColor={BI_CHART_COLORS.emerald} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip content={<BiTooltip valueFormat={(v) => `${v} jam`} />} />
                          <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                          <Area type="monotone" dataKey="TotalHours" name="Total Claimed (Hrs)" stroke={BI_CHART_COLORS.primary} strokeWidth={2.2} fillOpacity={1} fill="url(#otTotalGrad)" />
                          <Area type="monotone" dataKey="ApprovedHours" name="Approved (Hrs)" stroke={BI_CHART_COLORS.emerald} strokeWidth={2.2} fillOpacity={1} fill="url(#otApprovedGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                  <BiChartCard
                    title="Status Breakdown"
                    subtitle="Approval proportions across claims"
                    isEmpty={statusChartData.length === 0}
                    emptyTitle="Belum ada klaim lembur"
                    emptyDescription="Belum ada data status lembur yang tercatat."
                  >
                    <div style={{ height: '280px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<BiTooltip valueFormat={(v) => `${v} klaim`} />} />
                          <Legend verticalAlign="bottom" height={34} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>
                </div>

                {/* CHARTS ROW 2: Hours by Staff */}
                <BiChartCard
                  title="Overtime Hours by Staff Member"
                  subtitle="Top claimants (Pending + Approved hours)"
                  isEmpty={staffChartData.length === 0}
                  emptyTitle="Belum ada klaim per staf"
                  emptyDescription="Grafik distribusi jam lembur per staf akan tampil setelah klaim tercatat."
                >
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={staffChartData} margin={{ top: 8, right: 10, left: -12, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          content={
                            <BiTooltip
                              valueFormat={(val) => `${val} hours`}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.FullName || label}
                            />
                          }
                          cursor={{ fill: 'var(--border)', opacity: 0.3 }}
                        />
                        <Bar dataKey="Hours" name="Jam Lembur" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </BiChartCard>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: OVERTIME REGISTRY & LEDGER                         */}
            {/* ========================================================= */}
            {activeTab === 'database' && (
              <div className="card fade-in" style={{ borderRadius: '14px', padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)' }}>
                
                {/* TOOLBAR: Search & Multi-Horizon Filters */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        placeholder="Search by staff, event, or remarks..." 
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.55rem 0.85rem 0.55rem 2.25rem', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                          style={{
                            background: statusFilter === st ? neonBlue : 'transparent',
                            color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.785rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {st}
                          <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>({statusCounts[st] || 0})</span>
                        </button>
                      ))}
                    </div>

                    {/* Staff Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <Users size={14} color="var(--text-muted)" />
                      <select 
                        value={staffFilter}
                        onChange={e => { setStaffFilter(e.target.value); setCurrentPage(1); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: '500' }}
                      >
                        <option value="All" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>All Staff</option>
                        {activeStaff.map(s => (
                          <option key={s.id || s.name} value={s.name} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Period Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <Filter size={14} color="var(--text-muted)" />
                      <select 
                        value={periodFilter}
                        onChange={e => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.825rem', fontWeight: '500' }}
                      >
                        <option value="All" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>All Months</option>
                        {uniquePeriods.map(p => (
                          <option key={p} value={p} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* OVERTIME DATA TABLE */}
                {overtimesLoading && overtimes.length === 0 ? (
                  <SkeletonLoader type="table" />
                ) : (
                <div className="table-sticky-wrapper">
                  <table className="data-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {canManage && (
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={
                                paginatedOvertimes.length > 0 &&
                                paginatedOvertimes.every((o) => selectedIds.includes(o.id))
                              }
                              onChange={() => {
                                const pageIds = paginatedOvertimes.map((o) => o.id);
                                const allChecked = pageIds.every((id) => selectedIds.includes(id));
                                setSelectedIds(
                                  allChecked
                                    ? selectedIds.filter((id) => !pageIds.includes(id))
                                    : Array.from(new Set([...selectedIds, ...pageIds]))
                                );
                              }}
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                              aria-label="Pilih semua klaim pada halaman ini"
                            />
                          </th>
                        )}
                        <th className="sticky-col-left">STAFF MEMBER</th>
                        <th>EVENT / ASSIGNMENT</th>
                        <th>DATE</th>
                        <th>HOURS</th>
                        <th>STATUS</th>
                        <th>REMARKS</th>
                        <th className="sticky-col-right" style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOvertimes.map(ot => {
                        const isSelected = selectedIds.includes(ot.id);
                        return (
                          <tr
                            key={ot.id}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(0, 168, 255, 0.08)' : undefined
                            }}
                            onClick={() => setViewingOT(ot)}
                          >
                            {canManage && (
                              <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelectedIds((prev) =>
                                      prev.includes(ot.id)
                                        ? prev.filter((item) => item !== ot.id)
                                        : [...prev, ot.id]
                                    )
                                  }
                                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                              </td>
                            )}
                            <td className="sticky-col-left" style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  borderRadius: '50%', 
                                  background: `${neonBlue}18`, 
                                  color: neonBlue, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: '700'
                                }}>
                                  {ot.staff ? ot.staff.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span>{ot.staff}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: '500' }}>{ot.eventName}</td>
                            <td>{ot.date}</td>
                            <td>
                              <span style={{ 
                                fontWeight: '700', 
                                color: neonBlue, 
                                background: `${neonBlue}15`, 
                                padding: '3px 8px', 
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                border: `1px solid ${neonBlue}25`
                              }}>
                                {ot.hours} hrs
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(ot.status)}`} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                                {ot.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ot.remarks}>
                              {ot.remarks || '-'}
                            </td>
                            <td className="sticky-col-right" style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                                
                                {/* Quick Manager 1-Click Approve / Reject */}
                                {canManage && ot.status === 'Pending' && (
                                  <>
                                    <button 
                                      className="action-btn"
                                      onClick={() => handleQuickStatus(ot.id, 'Approved')}
                                      title="Approve Claim"
                                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      className="action-btn"
                                      onClick={() => handleQuickStatus(ot.id, 'Rejected')}
                                      title="Reject Claim"
                                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}

                                {/* Dossier View */}
                                <button 
                                  type="button"
                                  className="action-btn view" 
                                  onClick={() => setViewingOT(ot)} 
                                  title="View Claim Dossier" 
                                  style={{ background: `${neonBlue}18`, color: neonBlue, border: `1px solid ${neonBlue}33` }}
                                >
                                  <Eye size={15} />
                                </button>

                                {/* Edit */}
                                {canEditRecord(ot.staff) && (
                                  <button 
                                    type="button"
                                    className="action-btn edit" 
                                    onClick={() => handleOpenModal(ot)} 
                                    title="Edit Claim"
                                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                )}

                                {/* Delete */}
                                {canDelete && (
                                  <button 
                                    type="button"
                                    className="action-btn delete" 
                                    onClick={() => handlePromptDelete(ot)} 
                                    title="Delete Claim"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOvertimes.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 8 : 7} style={{ padding: 0 }}>
                            <EmptyState
                              icon={<Clock size={22} />}
                              title="Belum ada klaim lembur pada filter ini"
                              description="Ubah filter periode/status atau ajukan catatan lembur baru."
                              actionLabel={searchTerm || statusFilter !== 'All' || staffFilter !== 'All' || periodFilter !== 'All' ? 'Reset Filter' : ''}
                              onAction={() => {
                                setSearchTerm('');
                                setStatusFilter('All');
                                setStaffFilter('All');
                                setPeriodFilter('All');
                              }}
                              compact
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                )}

                {canManage && (
                  <FloatingBulkBar
                    count={selectedIds.length}
                    itemLabel="klaim lembur"
                    onClear={() => setSelectedIds([])}
                  >
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleBulkStatus('Approved')}
                      style={{
                        padding: '0.35rem 0.72rem',
                        fontSize: '0.78rem',
                        background: 'rgba(16, 185, 129, 0.16)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        fontWeight: 700
                      }}
                    >
                      <Check size={14} /> Approve Terpilih
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleBulkStatus('Rejected')}
                      style={{
                        padding: '0.35rem 0.72rem',
                        fontSize: '0.78rem',
                        background: 'rgba(239, 68, 68, 0.16)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        fontWeight: 700
                      }}
                    >
                      <XCircle size={14} /> Reject Terpilih
                    </button>
                  </FloatingBulkBar>
                )}

                {/* Pagination */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredOvertimes.length}
                    itemsPerPage={PAGE_SIZE}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 360° OVERTIME DOSSIER DRAWER */}
      <OvertimeDossierDrawer 
        record={viewingOT}
        onClose={() => setViewingOT(null)}
        onEdit={canEditRecord(viewingOT?.staff) ? (ot) => handleOpenModal(ot) : null}
        onQuickStatus={handleQuickStatus}
        canManage={canManage}
        neonBlue={neonBlue}
      />

      {/* OVERTIME FORM MODAL */}
      <OvertimeFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditing={Boolean(editingOT)}
        activeStaff={activeStaff}
        neonBlue={neonBlue}
      />

      {/* CONFIRM DELETE MODAL */}
      <OvertimeConfirmDeleteModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '', message: '' })}
        onConfirm={handleExecuteDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />

    </div>
  );
};

export default Overtime;
