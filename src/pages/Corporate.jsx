import { Fragment, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import BiPageHeader from '../components/bi/BiPageHeader';
import BiKpiCard from '../components/bi/BiKpiCard';
import BiChartCard from '../components/bi/BiChartCard';
import BiTooltip from '../components/bi/BiTooltip';
import { BI_CHART_COLORS, formatAxisCompact, formatCompactIdr } from '../utils/formatters';
import { useCorporate } from '../context/CorporateContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  AccountFormModal,
  SalesFormModal,
  AccountDossierDrawer,
  ConfirmDeleteModal
} from '../components/corporate/CorporateModals';
import {
  formatCorporateIdr,
  parseCommaNumber,
  normalizeFeeProfile,
  serializeFeeProfile
} from '../utils/corporateFeeHelpers';
import { 
  Building, Briefcase, Plus, Edit2, Trash2, BarChart2, 
  TrendingUp, DollarSign, Activity, Upload, Users,
  Phone, Eye, Search, Filter, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const CATEGORIES = ['Flight', 'Hotel', 'Other', 'All Sales'];
const PAGE_SIZE = 15;

const formatCurrencyIdr = (val) => formatCorporateIdr(val);

const Corporate = () => {
  const { 
    corporateAccounts, addAccount, updateAccount, deleteAccount,
    corporateSales, addSales, updateSales, deleteSales, bulkImportSales,
    loading: corpLoading
  } = useCorporate();
  
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  
  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState(() => (location.state?.openId ? 'accounts' : 'dashboard'));
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');
  
  // Matrix Table State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [matrixCategory, setMatrixCategory] = useState('All');

  // Comparison Tab State
  const [compLevel, setCompLevel] = useState('Month');
  const [compPeriodA, setCompPeriodA] = useState(`${new Date().getFullYear()}-01`);
  const [compPeriodB, setCompPeriodB] = useState(`${new Date().getFullYear()}-02`);
  const [compAccount, setCompAccount] = useState('All');
  const [compCategory, setCompCategory] = useState('All');

  // Accounts Tab Filters & Pagination
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('All');
  const [accountsPage, setAccountsPage] = useState(1);

  // Sales Tab Filters & Pagination
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState('All');
  const [salesPeriodFilter, setSalesPeriodFilter] = useState('All');
  const [salesPage, setSalesPage] = useState(1);

  // Modals & Drawer State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(() => {
    if (location.state?.openId && corporateAccounts?.length) {
      return corporateAccounts.find((a) => a.id === location.state.openId) || null;
    }
    return null;
  });
  const [editingSales, setEditingSales] = useState(null);

  // React to deep-link from Command Palette even when already mounted on /corporate
  const navTs = location.state?._ts || null;
  const [lastNavTs, setLastNavTs] = useState(navTs);
  if (navTs && navTs !== lastNavTs) {
    setLastNavTs(navTs);
    if (location.state?.openId) {
      setActiveTab('accounts');
      const found = (corporateAccounts || []).find((a) => a.id === location.state.openId);
      if (found) setViewingAccount(found);
    }
  }

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'account' | 'sales'
    id: null,
    title: '',
    message: ''
  });
  
  const fileInputSalesRef = useRef(null);

  // Initial Form Data
  const initialAccountData = {
    accountCode: '', corporateName: '', companyName: '', address: '', creditLimit: '', status: 'Active',
    picName: '', picPhone: '', picOfficeEmail: '', picPersonalEmail: '', remarks: '',
    flightFee: normalizeFeeProfile({}),
    hotelFee: normalizeFeeProfile({}),
    airlinesCode: '', detailLink: ''
  };

  const initialSalesData = {
    date: new Date().toISOString().slice(0, 7),
    accountCode: '',
    category: 'Flight',
    salesAmount: '',
    profitAmount: '',
    remarks: ''
  };

  const [accountFormData, setAccountFormData] = useState(initialAccountData);
  const [salesFormData, setSalesFormData] = useState(initialSalesData);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobile = () => window.innerWidth <= 768 && setIsSidebarOpen(false);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  
  const canDelete = isAdmin;
  const canEditAny = isAdmin || isManager;
  const canAdd = isAdmin || isManager;

  // Global Filtered Sales by Account selection
  const filteredSales = useMemo(() => {
    let data = corporateSales;
    if (selectedAccountFilter !== 'All') {
      data = data.filter(r => r.accountCode === selectedAccountFilter);
    }
    return data;
  }, [corporateSales, selectedAccountFilter]);

  // Overall KPI Telemetry
  const totalSales = useMemo(() => filteredSales.reduce((sum, r) => sum + r.salesAmount, 0), [filteredSales]);
  const totalProfit = useMemo(() => filteredSales.reduce((sum, r) => sum + r.profitAmount, 0), [filteredSales]);
  const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
  const activeAccountsCount = useMemo(() => corporateAccounts.filter(a => a.status === 'Active').length, [corporateAccounts]);

  // Map account sales totals for utilization telemetry
  const accountSalesMap = useMemo(() => {
    const map = {};
    corporateSales.forEach(s => {
      map[s.accountCode] = (map[s.accountCode] || 0) + (Number(s.salesAmount) || 0);
    });
    return map;
  }, [corporateSales]);

  // Count over-limit accounts
  const overLimitCount = useMemo(() => {
    return corporateAccounts.filter(a => {
      const spent = accountSalesMap[a.accountCode] || 0;
      return a.creditLimit > 0 && spent >= a.creditLimit;
    }).length;
  }, [corporateAccounts, accountSalesMap]);

  // Chart: Sales by Category
  const catBarData = useMemo(() => {
    const catMap = {};
    CATEGORIES.forEach(c => { catMap[c] = { name: c, Sales: 0, Profit: 0 }; });
    filteredSales.forEach(r => {
      if (catMap[r.category]) {
        catMap[r.category].Sales += r.salesAmount;
        catMap[r.category].Profit += r.profitAmount;
      }
    });
    return Object.values(catMap).sort((a, b) => b.Sales - a.Sales);
  }, [filteredSales]);

  // Chart: Top 5 Accounts by Sales
  const topAccountsData = useMemo(() => {
    const accMap = {};
    filteredSales.forEach(r => {
      if (!accMap[r.accountCode]) accMap[r.accountCode] = { name: r.accountCode, Sales: 0, Profit: 0 };
      accMap[r.accountCode].Sales += r.salesAmount;
      accMap[r.accountCode].Profit += r.profitAmount;
    });
    return Object.values(accMap).sort((a, b) => b.Sales - a.Sales).slice(0, 5);
  }, [filteredSales]);

  // Chart: Trend over time
  const trendData = useMemo(() => {
    const trendMap = {};
    filteredSales.forEach(r => {
      if (!trendMap[r.date]) trendMap[r.date] = { date: r.date, Sales: 0, Profit: 0 };
      trendMap[r.date].Sales += r.salesAmount;
      trendMap[r.date].Profit += r.profitAmount;
    });
    return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Comparison Table (12-Month Matrix)
  const comparisonData = useMemo(() => {
    const accData = {};
    corporateAccounts.forEach(acc => {
      if (selectedAccountFilter === 'All' || selectedAccountFilter === acc.accountCode) {
        accData[acc.accountCode] = {
          corporateName: acc.corporateName || acc.companyName,
          accountCode: acc.accountCode,
          months: {},
          ytdSales: 0,
          ytdProfit: 0,
          prevYtdSales: 0
        };
        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, '0');
          accData[acc.accountCode].months[m] = { sales: 0, profit: 0 };
        }
      }
    });

    corporateSales.forEach(sale => {
      if (!accData[sale.accountCode]) return;
      if (matrixCategory !== 'All' && sale.category !== matrixCategory) return;
      const [y, m] = (sale.date || '').split('-');
      if (y === selectedYear && accData[sale.accountCode].months[m]) {
        accData[sale.accountCode].months[m].sales += sale.salesAmount;
        accData[sale.accountCode].months[m].profit += sale.profitAmount;
        accData[sale.accountCode].ytdSales += sale.salesAmount;
        accData[sale.accountCode].ytdProfit += sale.profitAmount;
      } else if (y === (parseInt(selectedYear, 10) - 1).toString()) {
        accData[sale.accountCode].prevYtdSales += sale.salesAmount;
      }
    });

    return Object.values(accData);
  }, [corporateSales, corporateAccounts, selectedAccountFilter, selectedYear, matrixCategory]);

  // Product Mix Stacked Bar Data
  const productMixData = useMemo(() => {
    const mixMap = {};
    for (let i = 1; i <= 12; i++) {
      const m = i.toString().padStart(2, '0');
      mixMap[m] = { name: m, Flight: 0, Hotel: 0, Other: 0, 'All Sales': 0 };
    }
    filteredSales.forEach(r => {
      const [y, m] = (r.date || '').split('-');
      if (y === selectedYear && mixMap[m]) {
        if (mixMap[m][r.category] !== undefined) mixMap[m][r.category] += r.salesAmount;
      }
    });
    return Object.values(mixMap);
  }, [filteredSales, selectedYear]);

  // --- PERIOD COMPARISON LOGIC ---
  const isInPeriod = (saleDate, periodStr, level) => {
    if (!saleDate || !periodStr) return false;
    const [sYear, sMonth] = saleDate.split('-');
    const m = parseInt(sMonth, 10);
    if (level === 'Month') return saleDate === periodStr;
    if (level === 'Year') return sYear === periodStr;
    if (level === 'Quarter') {
      const [pYear, pQ] = periodStr.split('-');
      if (sYear !== pYear) return false;
      if (pQ === 'Q1') return m >= 1 && m <= 3;
      if (pQ === 'Q2') return m >= 4 && m <= 6;
      if (pQ === 'Q3') return m >= 7 && m <= 9;
      if (pQ === 'Q4') return m >= 10 && m <= 12;
    }
    if (level === 'Semester') {
      const [pYear, pS] = periodStr.split('-');
      if (sYear !== pYear) return false;
      if (pS === 'S1') return m >= 1 && m <= 6;
      if (pS === 'S2') return m >= 7 && m <= 12;
    }
    return false;
  };

  const compData = useMemo(() => {
    const dataA = { sales: 0, profit: 0, accounts: {} };
    const dataB = { sales: 0, profit: 0, accounts: {} };
    
    corporateSales.forEach(s => {
      if (compAccount !== 'All' && s.accountCode !== compAccount) return;
      if (compCategory !== 'All' && s.category !== compCategory) return;
      
      const isA = isInPeriod(s.date, compPeriodA, compLevel);
      const isB = isInPeriod(s.date, compPeriodB, compLevel);
      
      if (isA || isB) {
        const target = isA ? dataA : dataB;
        target.sales += s.salesAmount;
        target.profit += s.profitAmount;
        if (!target.accounts[s.accountCode]) target.accounts[s.accountCode] = { sales: 0, profit: 0 };
        target.accounts[s.accountCode].sales += s.salesAmount;
        target.accounts[s.accountCode].profit += s.profitAmount;
      }
    });
    
    return { dataA, dataB };
  }, [corporateSales, compLevel, compPeriodA, compPeriodB, compAccount, compCategory]);

  const compGrowthSales = compData.dataB.sales > 0 
    ? ((compData.dataA.sales - compData.dataB.sales) / compData.dataB.sales * 100) 
    : (compData.dataA.sales > 0 ? 100 : 0);
  const compGrowthProfit = compData.dataB.profit > 0 
    ? ((compData.dataA.profit - compData.dataB.profit) / compData.dataB.profit * 100) 
    : (compData.dataA.profit > 0 ? 100 : 0);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return corporateAccounts.filter(acc => {
      const q = accountsSearch.toLowerCase().trim();
      const name = (acc.corporateName || acc.companyName || '').toLowerCase();
      const code = (acc.accountCode || '').toLowerCase();
      const pic = (acc.picName || '').toLowerCase();
      const phone = (acc.picPhone || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || code.includes(q) || pic.includes(q) || phone.includes(q);
      const matchStatus = accountsStatusFilter === 'All' || acc.status === accountsStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [corporateAccounts, accountsSearch, accountsStatusFilter]);

  const paginatedAccounts = useMemo(() => {
    const start = (accountsPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, accountsPage]);

  const totalAccountPages = Math.ceil(filteredAccounts.length / PAGE_SIZE) || 1;

  // Filtered Sales in Sales Tab
  const filteredSalesTab = useMemo(() => {
    return corporateSales.filter(rec => {
      const q = salesSearch.toLowerCase().trim();
      const code = (rec.accountCode || '').toLowerCase();
      const remarks = (rec.remarks || '').toLowerCase();
      const matchSearch = !q || code.includes(q) || remarks.includes(q);
      const matchCat = salesCategoryFilter === 'All' || rec.category === salesCategoryFilter;
      const matchPeriod = salesPeriodFilter === 'All' || rec.date === salesPeriodFilter;
      const matchAccount = selectedAccountFilter === 'All' || rec.accountCode === selectedAccountFilter;
      return matchSearch && matchCat && matchPeriod && matchAccount;
    });
  }, [corporateSales, salesSearch, salesCategoryFilter, salesPeriodFilter, selectedAccountFilter]);

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * PAGE_SIZE;
    return filteredSalesTab.slice(start, start + PAGE_SIZE);
  }, [filteredSalesTab, salesPage]);

  const totalSalesPages = Math.ceil(filteredSalesTab.length / PAGE_SIZE) || 1;

  // Handlers for Account Modal
  const handleOpenAccountModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc);
      setAccountFormData({
        accountCode: acc.accountCode || '',
        corporateName: acc.corporateName || acc.companyName || '',
        companyName: acc.companyName || acc.corporateName || '',
        address: acc.address || '',
        creditLimit: acc.creditLimit || '',
        status: acc.status || 'Active',
        picName: acc.picName || '',
        picPhone: acc.picPhone || '',
        picOfficeEmail: acc.picOfficeEmail || '',
        picPersonalEmail: acc.picPersonalEmail || '',
        remarks: acc.remarks || '',
        flightFee: normalizeFeeProfile(acc.flightFee),
        hotelFee: normalizeFeeProfile(acc.hotelFee),
        airlinesCode: acc.airlinesCode || '',
        detailLink: acc.detailLink || ''
      });
    } else {
      setEditingAccount(null);
      setAccountFormData(initialAccountData);
    }
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountFormData.accountCode || (!accountFormData.corporateName && !accountFormData.companyName)) {
      toast.warning('Account code and company name are required.');
      return;
    }

    const sanitizedAccountPayload = {
      ...accountFormData,
      creditLimit: parseCommaNumber(accountFormData.creditLimit),
      flightFee: serializeFeeProfile(accountFormData.flightFee),
      hotelFee: serializeFeeProfile(accountFormData.hotelFee)
    };

    if (editingAccount) {
      const res = await updateAccount(editingAccount.id, sanitizedAccountPayload);
      if (res?.success) {
        toast.success(`Corporate account "${sanitizedAccountPayload.accountCode}" updated.`);
        setIsAccountModalOpen(false);
      } else {
        toast.error(res?.error || 'Failed to update account.');
      }
    } else {
      const res = await addAccount(sanitizedAccountPayload);
      if (res?.success) {
        toast.success(`Corporate account "${sanitizedAccountPayload.accountCode}" registered.`);
        setIsAccountModalOpen(false);
      } else {
        toast.error(res?.error || 'Failed to create account.');
      }
    }
  };

  // Handlers for Sales Modal
  const handleOpenSalesModal = (sale = null) => {
    if (sale) {
      setEditingSales(sale);
      setSalesFormData({
        date: sale.date || '',
        accountCode: sale.accountCode || '',
        category: sale.category || 'Flight',
        salesAmount: sale.salesAmount || '',
        profitAmount: sale.profitAmount || '',
        remarks: sale.remarks || ''
      });
    } else {
      setEditingSales(null);
      setSalesFormData({
        ...initialSalesData,
        accountCode: corporateAccounts[0]?.accountCode || ''
      });
    }
    setIsSalesModalOpen(true);
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    if (!salesFormData.date || !salesFormData.accountCode) {
      toast.warning('Period and corporate account are required.');
      return;
    }

    const sanitizedSalesPayload = {
      ...salesFormData,
      salesAmount: parseCommaNumber(salesFormData.salesAmount),
      profitAmount: parseCommaNumber(salesFormData.profitAmount)
    };

    if (editingSales) {
      const res = await updateSales(editingSales.id, sanitizedSalesPayload);
      if (res?.success) {
        toast.success('Sales record updated.');
        setIsSalesModalOpen(false);
      } else {
        toast.error(res?.error || 'Failed to update sales.');
      }
    } else {
      const res = await addSales(sanitizedSalesPayload);
      if (res?.success) {
        toast.success('Sales record created.');
        setIsSalesModalOpen(false);
      } else {
        toast.error(res?.error || 'Failed to add sales.');
      }
    }
  };

  // Safe Deletion Handlers
  const handlePromptDeleteAccount = (acc) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'account',
      id: acc.id,
      title: 'Delete Corporate Account?',
      message: `Are you sure you want to delete ${acc.accountCode} (${acc.corporateName || acc.companyName})? All fee configurations and associated account data will be permanently removed.`
    });
  };

  const handlePromptDeleteSales = (sale) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'sales',
      id: sale.id,
      title: 'Delete Sales Record?',
      message: `Delete record for ${sale.accountCode} (${sale.date}) with sales ${formatCurrencyIdr(sale.salesAmount)}?`
    });
  };

  const handleExecuteDelete = async () => {
    const { type, id } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' });

    if (type === 'account' && id) {
      const res = await deleteAccount(id);
      if (res?.success) {
        toast.success('Corporate account deleted.');
      } else {
        toast.error(res?.error || 'Failed to delete account.');
      }
    } else if (type === 'sales' && id) {
      const res = await deleteSales(id);
      if (res?.success) {
        toast.success('Sales record deleted.');
      } else {
        toast.error(res?.error || 'Failed to delete record.');
      }
    }
  };

  // CSV Import for Sales
  const handleImportSales = (e) => {
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
        const dateIdx = headers.findIndex(h => /date|period/i.test(h));
        const codeIdx = headers.findIndex(h => /account|code/i.test(h));
        const catIdx = headers.findIndex(h => /category/i.test(h));
        const salesIdx = headers.findIndex(h => /sales/i.test(h));
        const profitIdx = headers.findIndex(h => /profit/i.test(h));
        const remarksIdx = headers.findIndex(h => /remark|notes/i.test(h));

        if (dateIdx === -1 || codeIdx === -1) {
          toast.error('CSV must have "date" (or "period") and "accountCode" columns.');
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const date = cols[dateIdx] || '';
          const accountCode = cols[codeIdx] || '';
          if (!date || !accountCode) continue;

          parsed.push({
            date,
            accountCode,
            category: catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'Flight',
            salesAmount: salesIdx !== -1 ? Number(cols[salesIdx].replace(/[^0-9.-]/g, '')) || 0 : 0,
            profitAmount: profitIdx !== -1 ? Number(cols[profitIdx].replace(/[^0-9.-]/g, '')) || 0 : 0,
            remarks: remarksIdx !== -1 ? cols[remarksIdx] : ''
          });
        }

        if (parsed.length === 0) {
          toast.warning('No valid rows found to import.');
          return;
        }

        const res = await bulkImportSales(parsed);
        if (res?.success) {
          toast.success(`Successfully imported ${res.count || parsed.length} corporate sales records.`);
        } else {
          toast.error(res?.error || 'Import failed.');
        }
      } catch (err) {
        console.error('CSV import error:', err);
        toast.error('Failed to parse CSV file.');
      } finally {
        if (fileInputSalesRef.current) fileInputSalesRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Export Columns Config
  const accountExportColumns = [
    { header: 'Account Code', key: 'accountCode' },
    { header: 'Corporate Name', key: 'corporateName' },
    { header: 'Status', key: 'status' },
    { header: 'Credit Limit', key: 'creditLimit', format: 'currency' },
    { header: 'PIC Name', key: 'picName' },
    { header: 'PIC Phone', key: 'picPhone' },
    { header: 'Office Email', key: 'picOfficeEmail' },
    { header: 'Airlines Code', key: 'airlinesCode' },
    { header: 'Address', key: 'address' }
  ];

  const salesExportColumns = [
    { header: 'Period', key: 'date' },
    { header: 'Account Code', key: 'accountCode' },
    { header: 'Category', key: 'category' },
    { header: 'Sales Amount', key: 'salesAmount', format: 'currency' },
    { header: 'Profit Amount', key: 'profitAmount', format: 'currency' },
    { header: 'Remarks', key: 'remarks' }
  ];

  // Unique list of periods for filter dropdown
  const uniquePeriods = useMemo(() => {
    const set = new Set();
    corporateSales.forEach(s => s.date && set.add(s.date));
    return Array.from(set).sort().reverse();
  }, [corporateSales]);

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeMobile={closeMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">

            {/* HEADER BAR */}
            <BiPageHeader
              eyebrow="B2B CORPORATE ACCOUNTS & CREDIT TELEMETRY"
              title="Corporate Telemetry & Accounts"
              subtitle="Multi-horizon contract performance, credit limit telemetry, and transaction ledger."
              actions={
                <>
                  {/* Account Filter Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--bg-card)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Filter size={14} color="var(--primary)" aria-hidden="true" />
                    <label
                      htmlFor="corp-account-filter"
                      style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}
                    >
                      Account:
                    </label>
                    <select
                      id="corp-account-filter"
                      value={selectedAccountFilter}
                      onChange={e => setSelectedAccountFilter(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.82rem'
                      }}
                    >
                      <option value="All" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>All Corporate Accounts</option>
                      {corporateAccounts.map(a => (
                        <option key={a.id} value={a.accountCode} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          {a.accountCode} - {a.corporateName || a.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {canAdd && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenAccountModal()}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
                    >
                      <Plus size={15} /> New Account
                    </button>
                  )}
                </>
              }
            />

            {/* TAB SELECTOR */}
            <div
              role="tablist"
              aria-label="Corporate Telemetry Views"
              className="tabs-container"
              style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Activity size={16} aria-hidden="true" /> Executive Dashboard
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'comparison'}
                className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <BarChart2 size={16} aria-hidden="true" /> Period Comparison
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'accounts'}
                className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounts')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Building size={16} aria-hidden="true" /> Corporate Accounts ({corporateAccounts.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'sales'}
                className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                onClick={() => setActiveTab('sales')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <TrendingUp size={16} aria-hidden="true" /> Sales Database ({corporateSales.length})
              </button>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: EXECUTIVE DASHBOARD */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                {/* 4 KPI SCORECARDS (Unified Enterprise BI Kit) */}
                <div
                  className="bi-kpi-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
                    gap: '0.9rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  <BiKpiCard
                    label="Total Corporate Sales"
                    value={formatCompactIdr(totalSales)}
                    subValue={`${formatCurrencyIdr(totalSales)} · ${filteredSales.length} transaksi`}
                    tone="primary"
                    icon={<Briefcase size={16} />}
                    drilldownLabel="Lihat Ledger"
                    onClick={() => setActiveTab('sales')}
                  />

                  <BiKpiCard
                    label="Total Gross Profit"
                    value={formatCompactIdr(totalProfit)}
                    subValue={`${formatCurrencyIdr(totalProfit)} net margin realized`}
                    tone="success"
                    icon={<DollarSign size={16} />}
                    drilldownLabel="Bandingkan"
                    onClick={() => setActiveTab('comparison')}
                  />

                  <BiKpiCard
                    label="Blended Profit Margin"
                    value={`${overallMargin}%`}
                    subValue="Average yield across Flight, Hotel & Other"
                    tone="neutral"
                    icon={<Activity size={16} />}
                  />

                  <BiKpiCard
                    label="Active Contracts"
                    value={`${activeAccountsCount} / ${corporateAccounts.length}`}
                    subValue={
                      <span
                        style={{
                          color: overLimitCount > 0 ? 'var(--danger)' : 'var(--success)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        {overLimitCount > 0 ? <AlertCircle size={13} /> : <ShieldCheck size={13} />}
                        {overLimitCount > 0 ? `${overLimitCount} account(s) at or above limit` : 'All credit limits healthy'}
                      </span>
                    }
                    tone={overLimitCount > 0 ? 'danger' : 'success'}
                    icon={<Users size={16} />}
                    drilldownLabel="Lihat Akun"
                    onClick={() => setActiveTab('accounts')}
                  />
                </div>

                {/* CHARTS ROW 1: Trend & Category Mix */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
                  
                  {/* Sales & Profit Trend */}
                  <BiChartCard
                    title="Sales & Profit Trend"
                    subtitle="Monthly revenue and margin trajectory"
                    isEmpty={trendData.length === 0}
                    emptyTitle="Belum ada tren transaksi corporate"
                    emptyDescription="Tambahkan transaksi corporate pada tab Sales Database untuk melihat tren bulanan."
                  >
                    <div style={{ height: '285px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 8, right: 10, left: 4, bottom: 0 }}>
                          <defs>
                            <linearGradient id="corpSalesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.28} />
                              <stop offset="95%" stopColor={BI_CHART_COLORS.primary} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="corpProfitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={BI_CHART_COLORS.emerald} stopOpacity={0.26} />
                              <stop offset="95%" stopColor={BI_CHART_COLORS.emerald} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisCompact} />
                          <RechartsTooltip content={<BiTooltip valueFormat="currency" />} />
                          <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                          <Area type="monotone" dataKey="Sales" stroke={BI_CHART_COLORS.primary} strokeWidth={2.2} fillOpacity={1} fill="url(#corpSalesGrad)" />
                          <Area type="monotone" dataKey="Profit" stroke={BI_CHART_COLORS.emerald} strokeWidth={2.2} fillOpacity={1} fill="url(#corpProfitGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                  {/* Category Donut Mix */}
                  <BiChartCard
                    title="Sales by Category"
                    subtitle="Revenue distribution across segments"
                    isEmpty={catBarData.filter(d => d.Sales > 0).length === 0}
                    emptyTitle="Belum ada distribusi kategori"
                    emptyDescription="Belum ada penjualan corporate yang tercatat untuk filter ini."
                  >
                    <div style={{ height: '285px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={catBarData.filter(d => d.Sales > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={92}
                            paddingAngle={4}
                            dataKey="Sales"
                          >
                            {catBarData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={BI_CHART_COLORS.series[index % BI_CHART_COLORS.series.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<BiTooltip valueFormat="currency" />} />
                          <Legend verticalAlign="bottom" height={34} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                </div>

                {/* CHARTS ROW 2: Top Accounts & Product Mix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
                  
                  {/* Top 5 Accounts */}
                  <BiChartCard
                    title="Top 5 Accounts by Revenue"
                    subtitle="Highest billing corporate clients"
                    isEmpty={topAccountsData.length === 0}
                    emptyTitle="Belum ada data akun top"
                    emptyDescription="Tambahkan transaksi corporate untuk memeringkat akun."
                  >
                    <div style={{ height: '285px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topAccountsData} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisCompact} />
                          <RechartsTooltip content={<BiTooltip valueFormat="currency" />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
                          <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                          <Bar dataKey="Sales" fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar dataKey="Profit" fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                  {/* Product Mix Stacked Bar */}
                  <BiChartCard
                    title="Monthly Product Mix"
                    subtitle="Segmented contribution by calendar month"
                    badge={
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          background: 'var(--primary-soft)',
                          padding: '0.14rem 0.48rem',
                          borderRadius: '5px'
                        }}
                      >
                        Year {selectedYear}
                      </span>
                    }
                  >
                    <div style={{ height: '285px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productMixData} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisCompact} />
                          <RechartsTooltip content={<BiTooltip valueFormat="currency" />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
                          <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                          <Bar dataKey="Flight" stackId="mix" fill={BI_CHART_COLORS.primary} barSize={24} />
                          <Bar dataKey="Hotel" stackId="mix" fill={BI_CHART_COLORS.emerald} />
                          <Bar dataKey="Other" stackId="mix" fill={BI_CHART_COLORS.amber} />
                          <Bar dataKey="All Sales" stackId="mix" fill={BI_CHART_COLORS.slate} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                </div>

                {/* 12-MONTH MATRIX TABLE */}
                <div className="card" style={{ borderRadius: '14px', padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)', marginTop: '1.5rem' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '600' }}>
                        12-Month Sales & Profit Matrix
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Detailed month-by-month financial ledger for Year {selectedYear}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Year Selector */}
                      <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)} 
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                      >
                        {[...Array(5)].map((_, i) => {
                          const year = (new Date().getFullYear() - 2 + i).toString();
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>

                      {/* Category Filter */}
                      <select 
                        value={matrixCategory} 
                        onChange={e => setMatrixCategory(e.target.value)} 
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                      >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      {/* Matrix Export */}
                      <ExportMenu 
                        data={comparisonData.map(r => {
                          const growth = r.prevYtdSales > 0 ? ((r.ytdSales - r.prevYtdSales) / r.prevYtdSales * 100).toFixed(1) : (r.ytdSales > 0 ? '100.0' : '0.0');
                          return {
                            corporateName: r.corporateName,
                            accountCode: r.accountCode,
                            ytdSales: r.ytdSales,
                            ytdProfit: r.ytdProfit,
                            growth: `${growth}%`
                          };
                        })} 
                        columns={[
                          { header: 'Account Code', key: 'accountCode' },
                          { header: 'Corporate Name', key: 'corporateName' },
                          { header: 'YTD Total Sales', key: 'ytdSales', format: 'currency' },
                          { header: 'YTD Gross Profit', key: 'ytdProfit', format: 'currency' },
                          { header: 'YoY Growth', key: 'growth' }
                        ]} 
                        filename={`Corporate_Matrix_${selectedYear}`} 
                      />
                    </div>
                  </div>

                  <div className="table-sticky-wrapper">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: 'var(--text-main)', minWidth: '1380px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        <th rowSpan="2" style={{ padding: '0.75rem', textAlign: 'left', color: neonBlue, width: '220px', fontWeight: '600' }}>Corporate Account</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <th key={m} colSpan="2" style={{ padding: '0.65rem', textAlign: 'center', color: 'var(--text-main)', borderLeft: '1px solid var(--border)', fontWeight: '600' }}>{m}</th>
                        ))}
                        <th colSpan="2" style={{ padding: '0.65rem', textAlign: 'center', color: '#10b981', borderLeft: '1px solid var(--border)', fontWeight: '700' }}>YTD Total</th>
                        <th rowSpan="2" style={{ padding: '0.65rem', textAlign: 'center', color: '#f59e0b', borderLeft: '1px solid var(--border)', fontWeight: '600' }}>Growth %</th>
                      </tr>
                      <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <Fragment key={i}>
                            <th style={{ padding: '0.45rem', textAlign: 'right', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', width: '60px', fontSize: '0.7rem' }}>Sales</th>
                            <th style={{ padding: '0.45rem', textAlign: 'right', color: 'var(--text-muted)', width: '60px', fontSize: '0.7rem' }}>Profit</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, idx) => {
                        const growth = row.prevYtdSales > 0 ? ((row.ytdSales - row.prevYtdSales) / row.prevYtdSales * 100) : (row.ytdSales > 0 ? 100 : 0);
                        return (
                          <tr key={row.accountCode || idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(120, 135, 126, 0.03)' }}>
                            <td style={{ padding: '0.7rem', fontWeight: '600', color: 'var(--text-main)' }}>
                              <div>{row.corporateName}</div>
                              <span style={{ fontSize: '0.7rem', color: neonBlue, fontWeight: 'normal' }}>{row.accountCode}</span>
                            </td>
                            {Array.from({ length: 12 }).map((_, i) => {
                              const m = (i + 1).toString().padStart(2, '0');
                              return (
                                <Fragment key={m}>
                                  <td style={{ padding: '0.65rem', textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                                    {row.months[m].sales === 0 ? '-' : formatCurrencyIdr(row.months[m].sales)}
                                  </td>
                                  <td style={{ padding: '0.65rem', textAlign: 'right', color: row.months[m].profit > 0 ? '#10b981' : 'var(--text-muted)' }}>
                                    {row.months[m].profit === 0 ? '-' : formatCurrencyIdr(row.months[m].profit)}
                                  </td>
                                </Fragment>
                              );
                            })}
                            <td style={{ padding: '0.65rem', textAlign: 'right', borderLeft: '1px solid var(--border)', fontWeight: '700', color: neonBlue }}>
                              {formatCurrencyIdr(row.ytdSales)}
                            </td>
                            <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                              {formatCurrencyIdr(row.ytdProfit)}
                            </td>
                            <td style={{ padding: '0.65rem', textAlign: 'center', borderLeft: '1px solid var(--border)', fontWeight: '600', color: growth > 0 ? '#10b981' : (growth < 0 ? '#ef4444' : 'var(--text-muted)') }}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      {comparisonData.length === 0 && (
                        <tr><td colSpan="28" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No accounts available for matrix comparison.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: PERIOD COMPARISON */}
            {/* ========================================================= */}
            {activeTab === 'comparison' && (
              <div className="fade-in">
                {/* Controls */}
                <div className="card" style={{ borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '600' }}>
                    Comparison Settings & Horizon
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>Horizon Level</label>
                      <select value={compLevel} onChange={e => setCompLevel(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }}>
                        <option value="Month">Month vs Month</option>
                        <option value="Quarter">Quarter vs Quarter</option>
                        <option value="Semester">Semester vs Semester</option>
                        <option value="Year">Year vs Year</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: neonBlue, fontSize: '0.825rem', fontWeight: 'bold' }}>Period A (Actual)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'Q1'}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'Q1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodA.split('-')[0]} onChange={e => setCompPeriodA(`${e.target.value}-${compPeriodA.split('-')[1] || 'S1'}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodA.split('-')[1] || 'S1'} onChange={e => setCompPeriodA(`${compPeriodA.split('-')[0]}-${e.target.value}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodA} onChange={e => setCompPeriodA(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }}>
                          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: '#10b981', fontSize: '0.825rem', fontWeight: 'bold' }}>Period B (Baseline)</label>
                      {compLevel === 'Month' && <input type="month" value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }} />}
                      {compLevel === 'Quarter' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'Q1'}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'Q1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Semester' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select value={compPeriodB.split('-')[0] || new Date().getFullYear()} onChange={e => setCompPeriodB(`${e.target.value}-${compPeriodB.split('-')[1] || 'S1'}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={compPeriodB.split('-')[1] || 'S1'} onChange={e => setCompPeriodB(`${compPeriodB.split('-')[0] || new Date().getFullYear()}-${e.target.value}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px', flex: 1 }}>
                            {['S1', 'S2'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {compLevel === 'Year' && (
                        <select value={compPeriodB} onChange={e => setCompPeriodB(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }}>
                          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>Filter Account</label>
                      <select value={compAccount} onChange={e => setCompAccount(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }}>
                        <option value="All">All Corporate Accounts</option>
                        {corporateAccounts.map(a => <option key={a.id} value={a.accountCode}>{a.accountCode} - {a.corporateName || a.companyName}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>Filter Category</label>
                      <select value={compCategory} onChange={e => setCompCategory(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: '8px' }}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Variance Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  {/* Sales Variance */}
                  <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '1rem' }}>Total Sales Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: neonBlue, marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrencyIdr(compData.dataA.sales)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>{formatCurrencyIdr(compData.dataB.sales)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Variance / Growth:</span>
                      <span style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 'bold', 
                        color: compGrowthSales > 0 ? '#10b981' : (compGrowthSales < 0 ? '#ef4444' : 'var(--text-muted)'), 
                        background: compGrowthSales > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {compGrowthSales > 0 ? <ArrowUpRight size={16}/> : (compGrowthSales < 0 ? <ArrowDownRight size={16}/> : null)}
                        {compGrowthSales > 0 ? '+' : ''}{compGrowthSales.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Profit Variance */}
                  <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '1rem' }}>Total Profit Comparison</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: neonBlue, marginBottom: '4px' }}>Period A ({compPeriodA})</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrencyIdr(compData.dataA.profit)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '4px' }}>Period B ({compPeriodB})</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>{formatCurrencyIdr(compData.dataB.profit)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Variance / Growth:</span>
                      <span style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 'bold', 
                        color: compGrowthProfit > 0 ? '#10b981' : (compGrowthProfit < 0 ? '#ef4444' : 'var(--text-muted)'), 
                        background: compGrowthProfit > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {compGrowthProfit > 0 ? <ArrowUpRight size={16}/> : (compGrowthProfit < 0 ? <ArrowDownRight size={16}/> : null)}
                        {compGrowthProfit > 0 ? '+' : ''}{compGrowthProfit.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                </div>

                {/* Side-by-side Chart & Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.1rem' }}>
                  
                  <BiChartCard
                    title={`Sales: ${compPeriodA} vs ${compPeriodB}`}
                    subtitle="Perbandingan total penjualan antar dua horizon periode"
                  >
                    <div style={{ height: '285px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Sales Horizon', PeriodA: compData.dataA.sales, PeriodB: compData.dataB.sales }]} margin={{ top: 16, right: 10, left: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={formatAxisCompact} tickLine={false} axisLine={false} width={60} />
                          <RechartsTooltip content={<BiTooltip valueFormat="currency" />} />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '0.78rem' }} />
                          <Bar dataKey="PeriodA" name={`Period A (${compPeriodA})`} fill={BI_CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={52} />
                          <Bar dataKey="PeriodB" name={`Period B (${compPeriodB})`} fill={BI_CHART_COLORS.emerald} radius={[4, 4, 0, 0]} barSize={52} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </BiChartCard>

                  {/* Account Breakdown Table */}
                  <div className="card" style={{ borderRadius: '10px', padding: '1.1rem 1.2rem', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 0.85rem 0', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700' }}>Account Revenue Breakdown</h3>
                    <table className="bi-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '0.65rem 0.7rem', color: 'var(--text-muted)' }}>Account Code</th>
                          <th style={{ textAlign: 'right', padding: '0.65rem 0.7rem', color: 'var(--primary)' }}>Period A</th>
                          <th style={{ textAlign: 'right', padding: '0.65rem 0.7rem', color: 'var(--success)' }}>Period B</th>
                          <th style={{ textAlign: 'right', padding: '0.65rem 0.7rem', color: 'var(--text-muted)' }}>Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys({ ...compData.dataA.accounts, ...compData.dataB.accounts }).map(accCode => {
                          const valA = compData.dataA.accounts[accCode]?.sales || 0;
                          const valB = compData.dataB.accounts[accCode]?.sales || 0;
                          const varPct = valB > 0 ? ((valA - valB) / valB * 100) : (valA > 0 ? 100 : 0);
                          return (
                            <tr key={accCode} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.65rem 0.7rem', color: 'var(--text-main)', fontWeight: '600' }}>{accCode}</td>
                              <td className="tabular-nums" style={{ padding: '0.65rem 0.7rem', textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrencyIdr(valA)}</td>
                              <td className="tabular-nums" style={{ padding: '0.65rem 0.7rem', textAlign: 'right', color: 'var(--text-main)' }}>{formatCurrencyIdr(valB)}</td>
                              <td className="tabular-nums" style={{ padding: '0.65rem 0.7rem', textAlign: 'right', fontWeight: 'bold', color: varPct > 0 ? 'var(--success)' : (varPct < 0 ? 'var(--danger)' : 'var(--text-muted)') }}>
                                {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {Object.keys({ ...compData.dataA.accounts, ...compData.dataB.accounts }).length === 0 && (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No data found for selected periods.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: CORPORATE ACCOUNTS DATABASE */}
            {/* ========================================================= */}
            {activeTab === 'accounts' && (
              <div className="card fade-in" style={{ borderRadius: '14px', padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)' }}>
                {/* Search & Filter Toolbar */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '260px' }}>
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        placeholder="Search by code, company, or PIC..." 
                        value={accountsSearch}
                        onChange={e => { setAccountsSearch(e.target.value); setAccountsPage(1); }}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.55rem 0.85rem 0.55rem 2.25rem', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {['All', 'Active', 'Inactive'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => { setAccountsStatusFilter(st); setAccountsPage(1); }}
                          style={{
                            background: accountsStatusFilter === st ? neonBlue : 'transparent',
                            color: accountsStatusFilter === st ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.785rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Export */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ExportMenu 
                      data={filteredAccounts} 
                      columns={accountExportColumns} 
                      filename="Corporate_Accounts_Travelops" 
                    />
                    {canAdd && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleOpenAccountModal()}
                        style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', padding: '0.55rem 1.15rem' }}
                      >
                        <Plus size={16} /> Add Account
                      </button>
                    )}
                  </div>
                </div>

                {/* Accounts Data Table */}
                {corpLoading && corporateAccounts.length === 0 ? (
                  <SkeletonLoader type="table" />
                ) : (
                <div className="table-sticky-wrapper">
                  <table className="data-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ACCOUNT CODE</th>
                        <th>COMPANY / CORPORATE NAME</th>
                        <th>PIC DETAILS</th>
                        <th>CREDIT LIMIT & UTILIZATION</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAccounts.map(acc => {
                        const spent = accountSalesMap[acc.accountCode] || 0;
                        const limit = acc.creditLimit || 0;
                        const ratio = limit > 0 ? (spent / limit) * 100 : 0;
                        const isExceeded = ratio >= 100;
                        const isWarning = ratio >= 80 && ratio < 100;

                        return (
                          <tr key={acc.id} style={{ cursor: 'pointer' }} onClick={() => setViewingAccount(acc)}>
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
                                {acc.accountCode}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              <div>{acc.corporateName || acc.companyName}</div>
                              {acc.airlinesCode && (
                                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                  Airlines: {acc.airlinesCode}
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: '500' }}>{acc.picName || '-'}</div>
                              {acc.picPhone && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Phone size={11}/> {acc.picPhone}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatCurrencyIdr(limit)}</span>
                                <span style={{ 
                                  fontSize: '0.725rem', 
                                  fontWeight: '700', 
                                  color: isExceeded ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981') 
                                }}>
                                  {ratio.toFixed(0)}%
                                </span>
                              </div>
                              <div style={{ width: '130px', height: '6px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(ratio, 100)}%`, 
                                    height: '100%', 
                                    background: isExceeded ? '#ef4444' : (isWarning ? '#f59e0b' : neonBlue) 
                                  }} 
                                />
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${acc.status === 'Active' ? 'badge-primary' : 'badge-danger'}`} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                                {acc.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button 
                                  type="button"
                                  className="action-btn view" 
                                  onClick={() => setViewingAccount(acc)} 
                                  title="360° Account Dossier" 
                                  style={{ background: `${neonBlue}18`, color: neonBlue, border: `1px solid ${neonBlue}33` }}
                                >
                                  <Eye size={15} />
                                </button>
                                {canEditAny && (
                                  <button 
                                    type="button"
                                    className="action-btn edit" 
                                    onClick={() => handleOpenAccountModal(acc)} 
                                    title="Edit Account"
                                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button 
                                    type="button"
                                    className="action-btn delete" 
                                    onClick={() => handlePromptDeleteAccount(acc)} 
                                    title="Delete Account"
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
                      {filteredAccounts.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0 }}>
                            <EmptyState
                              icon={<Building size={22} />}
                              title="Tidak ada akun korporasi ditemukan"
                              description="Coba kata kunci lain atau tambahkan akun corporate baru."
                              actionLabel={accountsSearch || accountsStatusFilter !== 'All' ? 'Reset Filter' : ''}
                              onAction={() => {
                                setAccountsSearch('');
                                setAccountsStatusFilter('All');
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

                {/* Pagination */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                  <Pagination 
                    currentPage={accountsPage}
                    totalPages={totalAccountPages}
                    onPageChange={setAccountsPage}
                    totalItems={filteredAccounts.length}
                    itemsPerPage={PAGE_SIZE}
                  />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: CORPORATE SALES DATABASE */}
            {/* ========================================================= */}
            {activeTab === 'sales' && (
              <div className="card fade-in" style={{ borderRadius: '14px', padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)' }}>
                {/* Search & Actions Toolbar */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        placeholder="Search code or remarks..." 
                        value={salesSearch}
                        onChange={e => { setSalesSearch(e.target.value); setSalesPage(1); }}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.55rem 0.85rem 0.55rem 2.25rem', borderRadius: '10px', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {['All', ...CATEGORIES].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setSalesCategoryFilter(cat); setSalesPage(1); }}
                          style={{
                            background: salesCategoryFilter === cat ? neonBlue : 'transparent',
                            color: salesCategoryFilter === cat ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.785rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Period Selector Dropdown */}
                    <select 
                      value={salesPeriodFilter}
                      onChange={e => { setSalesPeriodFilter(e.target.value); setSalesPage(1); }}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <option value="All">All Periods</option>
                      {uniquePeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Actions: Export, Import, Add */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ExportMenu 
                      data={filteredSalesTab} 
                      columns={salesExportColumns} 
                      filename="Corporate_Sales_Travelops" 
                    />

                    {canAdd && (
                      <>
                        <button 
                          className="btn" 
                          onClick={() => fileInputSalesRef.current?.click()}
                          style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px', padding: '0.55rem 1rem' }}
                        >
                          <Upload size={15} /> Import CSV
                        </button>
                        <input 
                          type="file" 
                          accept=".csv" 
                          style={{ display: 'none' }} 
                          ref={fileInputSalesRef} 
                          onChange={handleImportSales} 
                        />
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleOpenSalesModal()}
                          style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', padding: '0.55rem 1.15rem' }}
                        >
                          <Plus size={16} /> Add Sales
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sales Data Table */}
                <div className="table-sticky-wrapper">
                  <table className="data-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>PERIOD</th>
                        <th>ACCOUNT</th>
                        <th>CATEGORY</th>
                        <th>SALES AMOUNT</th>
                        <th>PROFIT AMOUNT</th>
                        <th>MARGIN %</th>
                        <th>REMARKS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.map(rec => {
                        const margin = rec.salesAmount > 0 ? ((rec.profitAmount / rec.salesAmount) * 100).toFixed(1) : 0;
                        return (
                          <tr key={rec.id}>
                            <td style={{ fontWeight: '500' }}>{rec.date}</td>
                            <td>
                              <span style={{ fontWeight: '600', color: neonBlue }}>{rec.accountCode}</span>
                            </td>
                            <td>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '3px 8px', 
                                borderRadius: '6px', 
                                background: 'var(--bg-surface)', 
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)'
                              }}>
                                {rec.category}
                              </span>
                            </td>
                            <td style={{ color: '#10b981', fontWeight: '600' }}>{formatCurrencyIdr(rec.salesAmount)}</td>
                            <td style={{ color: '#f59e0b', fontWeight: '600' }}>{formatCurrencyIdr(rec.profitAmount)}</td>
                            <td>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: margin > 10 ? '#10b981' : 'var(--text-muted)' }}>
                                {margin}%
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rec.remarks || '-'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                {canEditAny && (
                                  <button 
                                    type="button"
                                    className="action-btn edit" 
                                    onClick={() => handleOpenSalesModal(rec)} 
                                    title="Edit Record"
                                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button 
                                    type="button"
                                    className="action-btn delete" 
                                    onClick={() => handlePromptDeleteSales(rec)} 
                                    title="Delete Record"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSalesTab.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No sales records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                  <Pagination 
                    currentPage={salesPage}
                    totalPages={totalSalesPages}
                    onPageChange={setSalesPage}
                    totalItems={filteredSalesTab.length}
                    itemsPerPage={PAGE_SIZE}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 360° ACCOUNT DOSSIER SLIDE-OVER DRAWER */}
      <AccountDossierDrawer 
        account={viewingAccount}
        sales={corporateSales}
        onClose={() => setViewingAccount(null)}
        onEdit={canEditAny ? (acc) => handleOpenAccountModal(acc) : null}
        neonBlue={neonBlue}
        formatCurrency={formatCurrencyIdr}
      />

      {/* ACCOUNT MODAL */}
      <AccountFormModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountFormData={accountFormData}
        setAccountFormData={setAccountFormData}
        handleSubmit={handleAccountSubmit}
        isEditing={Boolean(editingAccount)}
        neonBlue={neonBlue}
      />

      {/* SALES MODAL */}
      <SalesFormModal 
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        salesFormData={salesFormData}
        setSalesFormData={setSalesFormData}
        handleSubmit={handleSalesSubmit}
        isEditing={Boolean(editingSales)}
        accounts={corporateAccounts}
        categories={CATEGORIES}
        neonBlue={neonBlue}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' })}
        onConfirm={handleExecuteDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />

    </div>
  );
};

export default Corporate;
