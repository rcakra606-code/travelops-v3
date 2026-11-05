import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import SlideOverDrawer from '../components/SlideOverDrawer';
import ExportMenu from '../components/ExportMenu';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useSales } from '../context/SalesContext';
import {
  useProductivity,
  PRODUCTIVITY_CATEGORIES
} from '../context/ProductivityContext';
import { useOvertimes } from '../context/OvertimeContext';
import { useTheme } from '../context/ThemeContext';
import { useDataTable } from '../hooks/useDataTable';
import {
  UserCheck,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase,
  Activity,
  BarChart2,
  Award,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Search,
  X,
  Eye,
  Ship,
  FileText,
  Smartphone
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const normName = (val) => String(val || '').trim().toLowerCase();

const isSameStaff = (a, b) => {
  if (!a || !b) return false;
  return normName(a) === normName(b);
};

const isCancelledTour = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'cancel' || s === 'cancelled' || s === 'canceled';
};

const getYearMonth = (rawDate) => {
  if (!rawDate) return '';
  const trimmed = String(rawDate).trim();
  const ym = trimmed.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(ym) ? ym : '';
};

const formatPeriodLabel = (ym) => {
  if (!ym || ym.length < 7) return ym || '-';
  const [y, m] = ym.slice(0, 7).split('-');
  const idx = Number(m) - 1;
  return idx >= 0 && idx < 12 ? `${MONTH_SHORT[idx]} ${y}` : ym;
};

const shiftYearMonth = (ym, delta) => {
  const [yStr, mStr] = String(ym || '').split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = (Number(mStr) || 1) - 1;
  const d = new Date(y, m + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatNumberId = (val) =>
  new Intl.NumberFormat('id-ID').format(Math.round(Number(val) || 0));

const formatIdr = (val) => {
  const num = Math.round(Number(val) || 0);
  if (num < 0) return `-Rp ${formatNumberId(Math.abs(num))}`;
  return `Rp ${formatNumberId(num)}`;
};

const formatCompactIdr = (val) => {
  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1000000000) return `${sign}Rp ${(abs / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `${sign}Rp ${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}Rp ${(abs / 1000).toFixed(0)}K`;
  return `${sign}Rp ${Math.round(abs)}`;
};

const PerformanceChartTooltip = ({ active, payload, label, isLight, valueType = 'currency' }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(10, 17, 34, 0.96)',
        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.28)' : 'rgba(0, 212, 255, 0.3)'}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 0.95rem',
        boxShadow: isLight
          ? '0 10px 25px rgba(2, 132, 199, 0.14)'
          : '0 12px 28px rgba(0, 0, 0, 0.55)',
        minWidth: '185px'
      }}
    >
      {label && (
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '0.45rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.35rem'
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {payload.map((entry, idx) => {
          const rawVal = Number(entry.value) || 0;
          let formatted;
          if (valueType === 'count') {
            formatted = `${formatNumberId(rawVal)}`;
          } else if (String(entry.name || '').includes('%')) {
            formatted = `${rawVal.toFixed(1)}%`;
          } else {
            formatted = formatIdr(rawVal);
          }
          return (
            <div
              key={`${entry.dataKey || entry.name}-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
                fontSize: '0.78rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: entry.color || entry.payload?.color || 'var(--primary)',
                    display: 'inline-block'
                  }}
                />
                {entry.name}
              </span>
              <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>
                {formatted}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StaffPerformance = () => {
  const { user } = useAuth();
  const { users } = useUsers();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { telecoms } = useTelecoms();
  const { sales } = useSales();
  const { productivityData } = useProductivity();
  const { overtimes } = useOvertimes();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';
  const skyAccent = isLight ? '#0ea5e9' : '#38bdf8';
  const emeraldColor = '#10b981';
  const amberColor = '#f59e0b';
  const slateMuted = isLight ? '#64748b' : '#94a3b8';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const isStaffRole = user?.role === 'Staff';

  // Build canonical staff roster combining active users + any staff names appearing in records (excluding inactivated staff)
  const staffRoster = useMemo(() => {
    const map = new Map();
    const inactiveNames = new Set(
      (users || [])
        .filter((u) => u.status === 'Inactive' && u.name)
        .map((u) => normName(u.name))
    );

    (users || [])
      .filter((u) => u.status === 'Active' && u.name)
      .forEach((u) => {
        map.set(normName(u.name), u.name.trim());
      });

    const register = (raw) => {
      const clean = String(raw || '').trim();
      if (!clean || clean.toLowerCase() === 'unassigned') return;
      const normalized = normName(clean);
      if (inactiveNames.has(normalized)) return;
      if (!map.has(normalized)) {
        map.set(normalized, clean);
      }
    };

    (sales || []).forEach((s) => register(s.staffName));
    (productivityData || []).forEach((p) => register(p.staff));
    (tours || []).forEach((t) => register(t.staffName || t.internals?.staffName || t.pic));
    (cruises || []).forEach((c) => register(c.staff));
    (hotels || []).forEach((h) => register(h.staff));
    (documents || []).forEach((d) => register(d.staff));
    (telecoms || []).forEach((t) => register(t.staff));
    (overtimes || []).forEach((o) => register(o.staff));
    if (user?.name) register(user.name);

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [users, sales, productivityData, tours, cruises, hotels, documents, telecoms, overtimes, user]);

  // Multi-Horizon Period Filter State
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentYearNum = today.getFullYear();
  const currentQuarterNum = Math.floor(today.getMonth() / 3) + 1;

  const [horizonMode, setHorizonMode] = useState('all'); // 'all' | 'month' | 'quarter' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNum);
  const [customStartMonth, setCustomStartMonth] = useState(`${currentYearNum}-01`);
  const [customEndMonth, setCustomEndMonth] = useState(currentMonthStr);

  const [selectedStaff, setSelectedStaff] = useState(isStaffRole ? user?.name || 'All' : 'All');
  const [activeTab, setActiveTab] = useState('scorecard');
  const [prodChartMetric, setProdChartMetric] = useState('sales'); // 'sales' | 'profit'
  const [toursPerPage, setToursPerPage] = useState(10);

  // SlideOverDrawer Inspector State ('consultant' | 'category' | 'tour')
  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    mode: 'consultant',
    staffName: null,
    categoryName: null,
    tourId: null
  });

  const staffNameFilter = isStaffRole ? user?.name || '' : selectedStaff;

  const availableYears = useMemo(() => {
    const yrs = new Set([currentYearNum - 1, currentYearNum, currentYearNum + 1]);
    const collectYear = (raw) => {
      const ym = getYearMonth(raw);
      if (ym) {
        const y = Number(ym.slice(0, 4));
        if (y > 2000) yrs.add(y);
      }
    };
    (sales || []).forEach((s) => collectYear(s.period));
    (productivityData || []).forEach((p) => collectYear(p.date));
    (tours || []).forEach((t) => collectYear(t.departureDate));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [sales, productivityData, tours, currentYearNum]);

  const activePeriodRange = useMemo(() => {
    if (horizonMode === 'all') {
      return { start: null, end: null, label: 'All Time' };
    }
    if (horizonMode === 'month') {
      return {
        start: selectedMonth,
        end: selectedMonth,
        label: formatPeriodLabel(selectedMonth)
      };
    }
    if (horizonMode === 'quarter') {
      const startM = (selectedQuarter - 1) * 3 + 1;
      const endM = startM + 2;
      const s = `${selectedYear}-${String(startM).padStart(2, '0')}`;
      const e = `${selectedYear}-${String(endM).padStart(2, '0')}`;
      return { start: s, end: e, label: `Q${selectedQuarter} ${selectedYear}` };
    }
    if (horizonMode === 'year') {
      return {
        start: `${selectedYear}-01`,
        end: `${selectedYear}-12`,
        label: `FY ${selectedYear}`
      };
    }
    const s = customStartMonth <= customEndMonth ? customStartMonth : customEndMonth;
    const e = customStartMonth <= customEndMonth ? customEndMonth : customStartMonth;
    return {
      start: s,
      end: e,
      label: `${formatPeriodLabel(s)} – ${formatPeriodLabel(e)}`
    };
  }, [
    horizonMode,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    customStartMonth,
    customEndMonth
  ]);

  const matchesActivePeriod = useMemo(() => {
    return (rawDate) => {
      if (!activePeriodRange.start || !activePeriodRange.end) return true;
      const ym = getYearMonth(rawDate);
      if (!ym) return false;
      return ym >= activePeriodRange.start && ym <= activePeriodRange.end;
    };
  }, [activePeriodRange]);

  const matchesSelectedStaff = useMemo(() => {
    return (recordStaff) => {
      if (staffNameFilter === 'All') return true;
      return isSameStaff(recordStaff, staffNameFilter);
    };
  }, [staffNameFilter]);

  const hasActiveFilters =
    horizonMode !== 'all' || (!isStaffRole && selectedStaff !== 'All');

  const handleResetFilters = () => {
    setHorizonMode('all');
    if (!isStaffRole) setSelectedStaff('All');
  };

  // =========================================================
  // 1. TEAM LEADERBOARD & 360° CONSULTANT SCORECARDS
  // =========================================================
  const consultantScorecards = useMemo(() => {
    const cardsMap = new Map();

    const ensureCard = (rawName) => {
      const clean = String(rawName || '').trim();
      if (!clean) return null;
      const key = normName(clean);
      if (!cardsMap.has(key)) {
        cardsMap.set(key, {
          staffName: clean,
          targetSales: 0,
          targetProfit: 0,
          actualSales: 0,
          actualProfit: 0,
          prodSales: 0,
          prodProfit: 0,
          prodEntries: 0,
          flightSales: 0,
          hotelSales: 0,
          toursCount: 0,
          toursPax: 0,
          toursOmset: 0,
          toursProfit: 0,
          cruisesCount: 0,
          cruisesPax: 0,
          hotelsCount: 0,
          docsCount: 0,
          docsRevenue: 0,
          telecomsCount: 0,
          overtimeApprovedHrs: 0,
          overtimePendingHrs: 0
        });
      }
      return cardsMap.get(key);
    };

    staffRoster.forEach((name) => ensureCard(name));

    (sales || []).forEach((s) => {
      if (!matchesActivePeriod(s.period)) return;
      const c = ensureCard(s.staffName);
      if (!c) return;
      c.targetSales += Number(s.targetSales) || 0;
      c.targetProfit += Number(s.targetProfit) || 0;
      c.actualSales += Number(s.achievementSales) || 0;
      c.actualProfit += Number(s.achievementProfit) || 0;
    });

    (productivityData || []).forEach((p) => {
      if (!matchesActivePeriod(p.date)) return;
      const c = ensureCard(p.staff);
      if (!c) return;
      const sVal = Number(p.salesAmount) || 0;
      const pVal = Number(p.profitAmount) || 0;
      c.prodSales += sVal;
      c.prodProfit += pVal;
      c.prodEntries += 1;
      if (p.category === 'Flight') c.flightSales += sVal;
      if (p.category === 'Hotel') c.hotelSales += sVal;
    });

    (tours || []).forEach((t) => {
      const tDate = t.departureDate || t.internals?.bookingDate || '';
      if (!matchesActivePeriod(tDate)) return;
      if (isCancelledTour(t.status)) return;
      const tStaff = t.staffName || t.internals?.staffName || t.pic || '';
      const c = ensureCard(tStaff);
      if (!c) return;
      c.toursCount += 1;
      c.toursPax += Number(t.paxCount) || 0;
      c.toursOmset += Number(t.totalOmset ?? t.financials?.totalOmset) || 0;
      c.toursProfit += Number(t.financials?.profit) || 0;
    });

    (cruises || []).forEach((cr) => {
      if (!matchesActivePeriod(cr.sailingStart)) return;
      if (isCancelledTour(cr.status)) return;
      const c = ensureCard(cr.staff);
      if (!c) return;
      c.cruisesCount += 1;
      c.cruisesPax += Number(cr.paxCount) || 0;
    });

    (hotels || []).forEach((h) => {
      if (!matchesActivePeriod(h.checkIn)) return;
      if (isCancelledTour(h.status)) return;
      const c = ensureCard(h.staff);
      if (!c) return;
      c.hotelsCount += 1;
    });

    (documents || []).forEach((d) => {
      if (!matchesActivePeriod(d.receiveDate)) return;
      const c = ensureCard(d.staff);
      if (!c) return;
      c.docsCount += 1;
      c.docsRevenue += Number(d.price) || 0;
    });

    (telecoms || []).forEach((tel) => {
      if (!matchesActivePeriod(tel.tanggalMulai)) return;
      const c = ensureCard(tel.staff);
      if (!c) return;
      c.telecomsCount += 1;
    });

    (overtimes || []).forEach((o) => {
      if (!matchesActivePeriod(o.date)) return;
      const c = ensureCard(o.staff);
      if (!c) return;
      const hrs = Number(o.hours) || 0;
      if (o.status === 'Approved') {
        c.overtimeApprovedHrs += hrs;
      } else if (o.status === 'Pending') {
        c.overtimePendingHrs += hrs;
      }
    });

    const list = Array.from(cardsMap.values())
      .filter((c) => {
        if (staffNameFilter !== 'All' && !isSameStaff(c.staffName, staffNameFilter)) {
          return false;
        }
        return true;
      })
      .map((c) => {
        const salesQuotaPct =
          c.targetSales > 0
            ? Number(((c.actualSales / c.targetSales) * 100).toFixed(1))
            : 0;
        const profitQuotaPct =
          c.targetProfit > 0
            ? Number(((c.actualProfit / c.targetProfit) * 100).toFixed(1))
            : 0;
        const prodMarginPct =
          c.prodSales > 0 ? Number(((c.prodProfit / c.prodSales) * 100).toFixed(2)) : 0;
        const crossSellPct =
          c.flightSales > 0
            ? Number(((c.hotelSales / c.flightSales) * 100).toFixed(1))
            : 0;
        const totalOpsFiles =
          c.toursCount + c.cruisesCount + c.hotelsCount + c.docsCount + c.telecomsCount;

        // Effective profit ranking metric (prefers logged productivity profit, falls back to quota actual profit or tour profit)
        const effectiveProfit = Math.max(c.prodProfit, c.actualProfit, c.toursProfit);

        let tierLabel;
        if (c.targetSales > 0) {
          if (salesQuotaPct >= 100) tierLabel = 'Top Performer';
          else if (salesQuotaPct >= 75) tierLabel = 'On Track';
          else tierLabel = 'Developing';
        } else if (effectiveProfit > 0 || totalOpsFiles > 0) {
          tierLabel = 'Active Ops';
        } else {
          tierLabel = 'No Activity';
        }

        return {
          ...c,
          salesQuotaPct,
          profitQuotaPct,
          prodMarginPct,
          crossSellPct,
          totalOpsFiles,
          effectiveProfit,
          tierLabel
        };
      })
      .sort((a, b) => {
        if (b.effectiveProfit !== a.effectiveProfit) {
          return b.effectiveProfit - a.effectiveProfit;
        }
        if (b.salesQuotaPct !== a.salesQuotaPct) {
          return b.salesQuotaPct - a.salesQuotaPct;
        }
        return b.totalOpsFiles - a.totalOpsFiles;
      });

    return list;
  }, [
    staffRoster,
    sales,
    productivityData,
    tours,
    cruises,
    hotels,
    documents,
    telecoms,
    overtimes,
    matchesActivePeriod,
    staffNameFilter
  ]);

  // =========================================================
  // 2. TARGET VS ACHIEVEMENT ANALYTICS
  // =========================================================
  const filteredSalesRecords = useMemo(() => {
    return (sales || []).filter(
      (s) => matchesSelectedStaff(s.staffName) && matchesActivePeriod(s.period)
    );
  }, [sales, matchesSelectedStaff, matchesActivePeriod]);

  const salesMetrics = useMemo(() => {
    let targetSales = 0;
    let targetProfit = 0;
    let achievementSales = 0;
    let achievementProfit = 0;

    filteredSalesRecords.forEach((s) => {
      targetSales += Number(s.targetSales) || 0;
      targetProfit += Number(s.targetProfit) || 0;
      achievementSales += Number(s.achievementSales) || 0;
      achievementProfit += Number(s.achievementProfit) || 0;
    });

    const salesRate =
      targetSales > 0 ? Number(((achievementSales / targetSales) * 100).toFixed(1)) : 0;
    const profitRate =
      targetProfit > 0 ? Number(((achievementProfit / targetProfit) * 100).toFixed(1)) : 0;

    return {
      targetSales,
      targetProfit,
      achievementSales,
      achievementProfit,
      salesRate,
      profitRate,
      salesVariance: achievementSales - targetSales,
      profitVariance: achievementProfit - targetProfit
    };
  }, [filteredSalesRecords]);

  const salesChartData = useMemo(() => {
    const map = {};
    const groupByStaff = staffNameFilter === 'All';

    filteredSalesRecords.forEach((s) => {
      const rawKey = groupByStaff ? s.staffName || 'Unknown' : s.period || 'Unknown';
      const key = groupByStaff ? normName(rawKey) : rawKey;
      if (!map[key]) {
        map[key] = {
          sortKey: rawKey,
          name: groupByStaff ? rawKey : formatPeriodLabel(rawKey),
          targetSales: 0,
          achievementSales: 0,
          targetProfit: 0,
          achievementProfit: 0
        };
      }
      map[key].targetSales += Number(s.targetSales) || 0;
      map[key].achievementSales += Number(s.achievementSales) || 0;
      map[key].targetProfit += Number(s.targetProfit) || 0;
      map[key].achievementProfit += Number(s.achievementProfit) || 0;
    });

    return Object.values(map).sort((a, b) =>
      groupByStaff
        ? b.achievementSales - a.achievementSales
        : a.sortKey.localeCompare(b.sortKey)
    );
  }, [filteredSalesRecords, staffNameFilter]);

  // =========================================================
  // 3. PRODUCTIVITY & CROSS-SELL BREAKDOWN
  // =========================================================
  const filteredProductivityRecords = useMemo(() => {
    return (productivityData || []).filter(
      (p) => matchesSelectedStaff(p.staff) && matchesActivePeriod(p.date)
    );
  }, [productivityData, matchesSelectedStaff, matchesActivePeriod]);

  const productivityAnalytics = useMemo(() => {
    const map = {};
    PRODUCTIVITY_CATEGORIES.forEach((c) => {
      map[c] = {
        name: c,
        retailSales: 0,
        retailProfit: 0,
        corpSales: 0,
        corpProfit: 0,
        entries: 0
      };
    });

    filteredProductivityRecords.forEach((p) => {
      const cat = map[p.category] ? p.category : 'Other';
      const sVal = Number(p.salesAmount) || 0;
      const pVal = Number(p.profitAmount) || 0;
      map[cat].entries += 1;
      if (p.type === 'Corporate') {
        map[cat].corpSales += sVal;
        map[cat].corpProfit += pVal;
      } else {
        map[cat].retailSales += sVal;
        map[cat].retailProfit += pVal;
      }
    });

    const grandSales = Object.values(map).reduce(
      (sum, r) => sum + r.retailSales + r.corpSales,
      0
    );
    const grandProfit = Object.values(map).reduce(
      (sum, r) => sum + r.retailProfit + r.corpProfit,
      0
    );

    const rows = Object.values(map)
      .filter(
        (m) =>
          m.retailSales > 0 ||
          m.corpSales > 0 ||
          m.retailProfit > 0 ||
          m.corpProfit > 0
      )
      .map((m) => {
        const totalSales = m.retailSales + m.corpSales;
        const totalProfit = m.retailProfit + m.corpProfit;
        const retailMargin =
          m.retailSales > 0
            ? Number(((m.retailProfit / m.retailSales) * 100).toFixed(1))
            : 0;
        const corpMargin =
          m.corpSales > 0
            ? Number(((m.corpProfit / m.corpSales) * 100).toFixed(1))
            : 0;
        const totalMargin =
          totalSales > 0 ? Number(((totalProfit / totalSales) * 100).toFixed(1)) : 0;
        const salesSharePct =
          grandSales > 0 ? Number(((totalSales / grandSales) * 100).toFixed(1)) : 0;
        return {
          ...m,
          totalSales,
          totalProfit,
          retailMargin,
          corpMargin,
          totalMargin,
          salesSharePct
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    const flight = map.Flight || { retailSales: 0, corpSales: 0 };
    const hotel = map.Hotel || { retailSales: 0, corpSales: 0 };
    const totalFlight = flight.retailSales + flight.corpSales;
    const totalHotel = hotel.retailSales + hotel.corpSales;

    const retailCrossSell =
      flight.retailSales > 0
        ? Number(((hotel.retailSales / flight.retailSales) * 100).toFixed(1))
        : 0;
    const corpCrossSell =
      flight.corpSales > 0
        ? Number(((hotel.corpSales / flight.corpSales) * 100).toFixed(1))
        : 0;
    const blendedCrossSell =
      totalFlight > 0 ? Number(((totalHotel / totalFlight) * 100).toFixed(1)) : 0;

    return {
      rows,
      grandSales,
      grandProfit,
      grandMargin:
        grandSales > 0 ? Number(((grandProfit / grandSales) * 100).toFixed(2)) : 0,
      retailCrossSell,
      corpCrossSell,
      blendedCrossSell
    };
  }, [filteredProductivityRecords]);

  // =========================================================
  // 4. 360° OPERATIONS WORKLOAD (TOURS, CRUISES, HOTELS, DOCS, SIM, OVERTIME)
  // =========================================================
  const operationsAnalytics = useMemo(() => {
    // Tours (using t.staffName || t.internals?.staffName || t.pic)
    const staffTours = (tours || []).filter((t) => {
      const tStaff = t.staffName || t.internals?.staffName || t.pic || '';
      const tDate = t.departureDate || t.internals?.bookingDate || '';
      return matchesSelectedStaff(tStaff) && matchesActivePeriod(tDate);
    });

    let activeTourCount = 0;
    let cancelledTourCount = 0;
    let activeTourPax = 0;
    let activeTourOmset = 0;
    let activeTourProfit = 0;
    const statusCounts = { Confirm: 0, Pending: 0, 'Past Date': 0, Cancel: 0 };
    const destMap = {};

    const normalizedTourRows = staffTours.map((t) => {
      const cancelled = isCancelledTour(t.status);
      const pax = Number(t.paxCount) || 0;
      const omset = Number(t.totalOmset ?? t.financials?.totalOmset) || 0;
      const profit = Number(t.financials?.profit) || 0;
      const marginPct = omset > 0 ? Number(((profit / omset) * 100).toFixed(1)) : 0;
      const staffAssigned = t.staffName || t.internals?.staffName || t.pic || 'Unassigned';

      if (cancelled) {
        cancelledTourCount += 1;
        statusCounts.Cancel += 1;
      } else {
        activeTourCount += 1;
        activeTourPax += pax;
        activeTourOmset += omset;
        activeTourProfit += profit;

        if (t.status === 'Confirm') statusCounts.Confirm += 1;
        else if (t.status === 'Past Date') statusCounts['Past Date'] += 1;
        else statusCounts.Pending += 1;

        const cty = t.country || 'Unknown';
        if (!destMap[cty]) destMap[cty] = { name: cty, count: 0, pax: 0, omset: 0 };
        destMap[cty].count += 1;
        destMap[cty].pax += pax;
        destMap[cty].omset += omset;
      }

      return {
        ...t,
        staffAssigned,
        codeLabel: t.tourCode || t.bookingCode || t.id,
        paxNum: pax,
        omsetNum: omset,
        profitNum: profit,
        marginPct
      };
    });

    const tourMargin =
      activeTourOmset > 0
        ? Number(((activeTourProfit / activeTourOmset) * 100).toFixed(1))
        : 0;
    const tourCancelRate =
      staffTours.length > 0
        ? Number(((cancelledTourCount / staffTours.length) * 100).toFixed(1))
        : 0;

    const statusData = [
      { name: 'Confirmed', value: statusCounts.Confirm, color: emeraldColor },
      { name: 'Completed (Past)', value: statusCounts['Past Date'], color: neonBlue },
      { name: 'Pending', value: statusCounts.Pending, color: amberColor },
      { name: 'Cancelled', value: statusCounts.Cancel, color: '#ef4444' }
    ].filter((s) => s.value > 0);

    const topDestinations = Object.values(destMap)
      .sort((a, b) => b.pax - a.pax)
      .slice(0, 6);

    // Cruises
    const staffCruises = (cruises || []).filter(
      (c) =>
        matchesSelectedStaff(c.staff) &&
        matchesActivePeriod(c.sailingStart) &&
        !isCancelledTour(c.status)
    );
    const cruisePax = staffCruises.reduce((s, c) => s + (Number(c.paxCount) || 0), 0);

    // Hotels
    const staffHotels = (hotels || []).filter(
      (h) =>
        matchesSelectedStaff(h.staff) &&
        matchesActivePeriod(h.checkIn) &&
        !isCancelledTour(h.status)
    );

    // Visa & Documents
    const staffDocs = (documents || []).filter(
      (d) => matchesSelectedStaff(d.staff) && matchesActivePeriod(d.receiveDate)
    );
    const docsFeeVolume = staffDocs.reduce((s, d) => s + (Number(d.price) || 0), 0);
    const expressDocsCount = staffDocs.filter(
      (d) => String(d.processType || '').toLowerCase() !== 'normal'
    ).length;

    // Travel SIM & eSIM
    const staffTelecoms = (telecoms || []).filter(
      (t) => matchesSelectedStaff(t.staff) && matchesActivePeriod(t.tanggalMulai)
    );
    const esimCount = staffTelecoms.filter((t) =>
      String(t.typeProduct || '').toLowerCase().includes('esim')
    ).length;

    // Overtimes
    const staffOvertimes = (overtimes || []).filter(
      (o) => matchesSelectedStaff(o.staff) && matchesActivePeriod(o.date)
    );
    let approvedOtHours = 0;
    let pendingOtHours = 0;
    staffOvertimes.forEach((o) => {
      const hrs = Number(o.hours) || 0;
      if (o.status === 'Approved') approvedOtHours += hrs;
      else if (o.status === 'Pending') pendingOtHours += hrs;
    });

    const totalOpsHandled =
      activeTourCount +
      staffCruises.length +
      staffHotels.length +
      staffDocs.length +
      staffTelecoms.length;

    return {
      totalTourRecords: staffTours.length,
      activeTourCount,
      cancelledTourCount,
      tourCancelRate,
      activeTourPax,
      activeTourOmset,
      activeTourProfit,
      tourMargin,
      statusData,
      topDestinations,
      normalizedTourRows,
      cruiseCount: staffCruises.length,
      cruisePax,
      hotelCount: staffHotels.length,
      docCount: staffDocs.length,
      docsFeeVolume,
      expressDocsCount,
      telecomCount: staffTelecoms.length,
      esimCount,
      overtimeRecords: staffOvertimes,
      approvedOtHours,
      pendingOtHours,
      totalOpsHandled
    };
  }, [
    tours,
    cruises,
    hotels,
    documents,
    telecoms,
    overtimes,
    matchesSelectedStaff,
    matchesActivePeriod,
    emeraldColor,
    neonBlue,
    amberColor
  ]);

  // Paginated & Searchable Tours Table via useDataTable
  const {
    sortConfig: tourSort,
    currentPage: tourPage,
    globalSearch: tourSearch,
    handleSort: handleTourSort,
    handleGlobalSearch: handleTourSearch,
    setCurrentPage: setTourPage,
    totalPages: tourTotalPages,
    paginatedData: paginatedTours,
    totalItems: totalFilteredTours
  } = useDataTable(
    operationsAnalytics.normalizedTourRows,
    { key: 'departureDate', direction: 'desc' },
    toursPerPage
  );

  // =========================================================
  // SLIDE-OVER DRAWER INSPECTOR DATA
  // =========================================================
  const inspectedConsultant = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'consultant' || !drawerState.staffName) {
      return null;
    }
    const card =
      consultantScorecards.find((c) => isSameStaff(c.staffName, drawerState.staffName)) ||
      null;
    const recentCategories = {};
    (productivityData || [])
      .filter((p) => isSameStaff(p.staff, drawerState.staffName) && matchesActivePeriod(p.date))
      .forEach((p) => {
        const k = p.category || 'Other';
        if (!recentCategories[k]) recentCategories[k] = { name: k, sales: 0, profit: 0 };
        recentCategories[k].sales += Number(p.salesAmount) || 0;
        recentCategories[k].profit += Number(p.profitAmount) || 0;
      });

    const recentOvertimes = (overtimes || [])
      .filter((o) => isSameStaff(o.staff, drawerState.staffName) && matchesActivePeriod(o.date))
      .slice(0, 6);

    return {
      card,
      topCategories: Object.values(recentCategories).sort((a, b) => b.profit - a.profit),
      recentOvertimes
    };
  }, [drawerState, consultantScorecards, productivityData, overtimes, matchesActivePeriod]);

  const inspectedCategory = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'category' || !drawerState.categoryName) {
      return null;
    }
    const entries = filteredProductivityRecords.filter(
      (p) => p.category === drawerState.categoryName
    );
    const byStaff = {};
    entries.forEach((p) => {
      const k = p.staff || 'Unassigned';
      if (!byStaff[k]) byStaff[k] = { name: k, sales: 0, profit: 0, count: 0 };
      byStaff[k].sales += Number(p.salesAmount) || 0;
      byStaff[k].profit += Number(p.profitAmount) || 0;
      byStaff[k].count += 1;
    });
    return {
      category: drawerState.categoryName,
      entries,
      staffSplit: Object.values(byStaff).sort((a, b) => b.profit - a.profit)
    };
  }, [drawerState, filteredProductivityRecords]);

  const inspectedTour = useMemo(() => {
    if (!drawerState.isOpen || drawerState.mode !== 'tour' || !drawerState.tourId) {
      return null;
    }
    return (
      operationsAnalytics.normalizedTourRows.find((t) => t.id === drawerState.tourId) || null
    );
  }, [drawerState, operationsAnalytics.normalizedTourRows]);

  // Badge style helpers
  const getTierBadgeStyle = (tier) => {
    if (tier === 'Top Performer') {
      return {
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.14)',
        border: '1px solid rgba(16, 185, 129, 0.32)'
      };
    }
    if (tier === 'On Track') {
      return {
        color: neonBlue,
        background: isLight ? 'rgba(2, 132, 199, 0.11)' : 'rgba(0, 212, 255, 0.15)',
        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.28)' : 'rgba(0, 212, 255, 0.3)'}`
      };
    }
    if (tier === 'Developing') {
      return {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.14)',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      };
    }
    return {
      color: 'var(--text-muted)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)'
    };
  };

  const getMarginColor = (pct) => {
    const num = Number(pct) || 0;
    if (num >= 10) return emeraldColor;
    if (num >= 6) return neonBlue;
    if (num >= 3) return amberColor;
    return '#ef4444';
  };

  const renderTourSortIcon = (key) => {
    if (tourSort.key !== key) return <ChevronDown size={13} style={{ opacity: 0.35 }} />;
    return tourSort.direction === 'asc' ? (
      <ChevronUp size={13} color={neonBlue} />
    ) : (
      <ChevronDown size={13} color={neonBlue} />
    );
  };

  // Export Column Schemas
  const scorecardExportColumns = [
    { header: 'Consultant', key: 'staffName' },
    { header: 'Tier', key: 'tierLabel' },
    { header: 'Target Sales', key: 'targetSales', format: 'currency' },
    { header: 'Actual Sales', key: 'actualSales', format: 'currency' },
    { header: 'Sales Quota %', key: 'salesQuotaPct', format: 'percent' },
    { header: 'Productivity Sales', key: 'prodSales', format: 'currency' },
    { header: 'Productivity Profit', key: 'prodProfit', format: 'currency' },
    { header: 'Margin %', key: 'prodMarginPct', format: 'percent' },
    { header: 'Cross-Sell %', key: 'crossSellPct', format: 'percent' },
    { header: 'Ops Files Handled', key: 'totalOpsFiles' },
    { header: 'Approved OT (Hrs)', key: 'overtimeApprovedHrs' }
  ];

  const prodExportColumns = [
    { header: 'Product Category', key: 'name' },
    { header: 'Retail Sales', key: 'retailSales', format: 'currency' },
    { header: 'Corporate Sales', key: 'corpSales', format: 'currency' },
    { header: 'Total Sales', key: 'totalSales', format: 'currency' },
    { header: 'Retail Profit', key: 'retailProfit', format: 'currency' },
    { header: 'Corporate Profit', key: 'corpProfit', format: 'currency' },
    { header: 'Total Profit', key: 'totalProfit', format: 'currency' },
    { header: 'Margin %', key: 'totalMargin', format: 'percent' },
    { header: 'Sales Share %', key: 'salesSharePct', format: 'percent' }
  ];

  const tourExportColumns = [
    { header: 'Tour / Booking Code', key: 'codeLabel' },
    { header: 'Consultant', key: 'staffAssigned' },
    { header: 'Destination', key: 'country' },
    { header: 'Departure', key: 'departureDate' },
    { header: 'Pax', key: 'paxNum' },
    { header: 'Status', key: 'status' },
    { header: 'Selling Price', key: 'omsetNum', format: 'currency' },
    { header: 'Net Profit', key: 'profitNum', format: 'currency' },
    { header: 'Margin %', key: 'marginPct', format: 'percent' }
  ];

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />
      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={closeMobile}
      />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            {/* EXECUTIVE HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.25rem 0.72rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: isLight
                      ? 'rgba(2, 132, 199, 0.1)'
                      : 'rgba(0, 212, 255, 0.12)',
                    color: neonBlue,
                    border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.22)' : 'rgba(0, 212, 255, 0.25)'}`,
                    marginBottom: '0.5rem'
                  }}
                >
                  <Sparkles size={13} /> 360° Consultant Appraisal &amp; Workload Intelligence
                </div>
                <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  Staff Performance Overview
                </h1>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Evaluating{' '}
                  <strong style={{ color: 'var(--text-main)' }}>
                    {staffNameFilter === 'All' ? 'All Active Consultants' : staffNameFilter}
                  </strong>{' '}
                  for <strong style={{ color: neonBlue }}>{activePeriodRange.label}</strong> across Quota, Productivity P&amp;L, Operations &amp; Overtime.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => window.print()}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.58rem 0.95rem',
                    fontSize: '0.84rem'
                  }}
                >
                  <Printer size={16} /> Print Appraisal
                </button>
                <ExportMenu
                  data={consultantScorecards}
                  columns={scorecardExportColumns}
                  filename={`Staff_Appraisal_${activePeriodRange.label.replace(/\s+/g, '_')}`}
                />
              </div>
            </div>

            {/* MULTI-HORIZON REVIEW FILTER BAR */}
            <div
              className="card"
              style={{
                padding: '0.95rem 1.15rem',
                marginBottom: '1.3rem',
                background: isLight
                  ? 'linear-gradient(135deg, #ffffff 0%, #f4faff 100%)'
                  : 'linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(9, 15, 30, 0.95) 100%)',
                border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.18)' : 'rgba(0, 212, 255, 0.18)'}`
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}
              >
                {/* Period Horizon Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'var(--bg-surface)',
                      padding: '0.22rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border)',
                      gap: '0.2rem'
                    }}
                  >
                    {[
                      { id: 'all', label: 'All Time' },
                      { id: 'month', label: 'Monthly' },
                      { id: 'quarter', label: 'Quarterly' },
                      { id: 'year', label: 'Full Year' },
                      { id: 'custom', label: 'Custom' }
                    ].map((mode) => {
                      const active = horizonMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setHorizonMode(mode.id)}
                          style={{
                            border: 'none',
                            borderRadius: '0.45rem',
                            padding: '0.36rem 0.7rem',
                            fontSize: '0.78rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            background: active ? 'var(--primary)' : 'transparent',
                            color: active ? 'var(--primary-fg, #fff)' : 'var(--text-muted)'
                          }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  {horizonMode === 'month' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'var(--bg-surface)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '0.6rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex'
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(currentMonthStr)}
                        style={{
                          background:
                            selectedMonth === currentMonthStr
                              ? 'rgba(0, 168, 255, 0.15)'
                              : 'transparent',
                          border: 'none',
                          borderRadius: '0.35rem',
                          color: neonBlue,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.22rem 0.45rem',
                          cursor: 'pointer'
                        }}
                      >
                        Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex'
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {horizonMode === 'quarter' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          background: 'var(--bg-surface)',
                          borderRadius: '0.55rem',
                          border: '1px solid var(--border)',
                          padding: '0.18rem'
                        }}
                      >
                        {[1, 2, 3, 4].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setSelectedQuarter(q)}
                            style={{
                              border: 'none',
                              borderRadius: '0.4rem',
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background:
                                selectedQuarter === q ? 'var(--primary)' : 'transparent',
                              color:
                                selectedQuarter === q
                                  ? 'var(--primary-fg, #fff)'
                                  : 'var(--text-muted)'
                            }}
                          >
                            Q{q}
                          </button>
                        ))}
                      </div>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.38rem 0.65rem',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {horizonMode === 'year' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        borderRadius: '0.55rem',
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          FY {yr}
                        </option>
                      ))}
                    </select>
                  )}

                  {horizonMode === 'custom' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="month"
                        value={customStartMonth}
                        onChange={(e) => e.target.value && setCustomStartMonth(e.target.value)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.36rem 0.55rem',
                          fontSize: '0.8rem'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="month"
                        value={customEndMonth}
                        onChange={(e) => e.target.value && setCustomEndMonth(e.target.value)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.36rem 0.55rem',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Consultant Selector + Reset */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--bg-surface)',
                      padding: '0.42rem 0.85rem',
                      borderRadius: '0.6rem',
                      border: `1px solid ${staffNameFilter !== 'All' ? neonBlue : 'var(--border)'}`
                    }}
                  >
                    <UserCheck size={16} color={neonBlue} />
                    {isStaffRole ? (
                      <strong style={{ fontSize: '0.83rem', color: 'var(--text-main)' }}>
                        {user?.name}
                      </strong>
                    ) : (
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.83rem',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option
                          value="All"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}
                        >
                          All Staff Overview ({staffRoster.length})
                        </option>
                        {staffRoster.map((name) => (
                          <option
                            key={name}
                            value={name}
                            style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}
                          >
                            {name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        borderRadius: '0.55rem',
                        padding: '0.42rem 0.7rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TOP-LEVEL 5-CARD EXECUTIVE KPI STRIP */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                marginBottom: '1.35rem'
              }}
            >
              {/* KPI 1: Quota Attainment */}
              <div
                className="card"
                onClick={() => setActiveTab('target_sales')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${neonBlue}`
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Sales Quota Attainment
                </div>
                <div
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color:
                      salesMetrics.targetSales === 0
                        ? 'var(--text-muted)'
                        : salesMetrics.salesRate >= 100
                          ? emeraldColor
                          : salesMetrics.salesRate >= 75
                            ? neonBlue
                            : amberColor,
                    marginTop: '0.35rem'
                  }}
                >
                  {salesMetrics.targetSales > 0 ? `${salesMetrics.salesRate}%` : 'No Quota'}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '999px',
                    background: 'var(--bg-surface)',
                    overflow: 'hidden',
                    marginTop: '0.45rem'
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, salesMetrics.salesRate)}%`,
                      height: '100%',
                      background: salesMetrics.salesRate >= 100 ? emeraldColor : neonBlue
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {formatCompactIdr(salesMetrics.achievementSales)} /{' '}
                  {formatCompactIdr(salesMetrics.targetSales)}
                </div>
              </div>

              {/* KPI 2: Productivity Net Profit & Margin */}
              <div
                className="card"
                onClick={() => setActiveTab('productivity')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${emeraldColor}`
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Productivity Net Profit
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: emeraldColor, marginTop: '0.35rem' }}>
                  {formatCompactIdr(productivityAnalytics.grandProfit)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sales: {formatCompactIdr(productivityAnalytics.grandSales)}</span>
                  <strong style={{ color: getMarginColor(productivityAnalytics.grandMargin) }}>
                    {productivityAnalytics.grandMargin}% margin
                  </strong>
                </div>
              </div>

              {/* KPI 3: 360° Operational Files Handled */}
              <div
                className="card"
                onClick={() => setActiveTab('operations')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${skyAccent}`
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  360° Operational Files
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                  {operationsAnalytics.totalOpsHandled}{' '}
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    bookings
                  </span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {operationsAnalytics.activeTourCount} Tours • {operationsAnalytics.cruiseCount}{' '}
                  Cruise • {operationsAnalytics.hotelCount} Hotel • {operationsAnalytics.docCount}{' '}
                  Docs • {operationsAnalytics.telecomCount} SIM
                </div>
              </div>

              {/* KPI 4: Cross-Sell Attachment Rate */}
              <div
                className="card"
                onClick={() => setActiveTab('productivity')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${amberColor}`
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Hotel / Flight Cross-Sell
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: neonBlue, marginTop: '0.35rem' }}>
                  {productivityAnalytics.blendedCrossSell}%
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Retail: {productivityAnalytics.retailCrossSell}%</span>
                  <span>Corp: {productivityAnalytics.corpCrossSell}%</span>
                </div>
              </div>

              {/* KPI 5: Overtime Hours */}
              <div
                className="card"
                onClick={() => setActiveTab('operations')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem 1.2rem',
                  borderTop: `3px solid ${slateMuted}`
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Approved Overtime
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  {operationsAnalytics.approvedOtHours}
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    hrs
                  </span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {operationsAnalytics.pendingOtHours > 0 ? (
                    <span style={{ color: amberColor, fontWeight: 600 }}>
                      +{operationsAnalytics.pendingOtHours} hrs pending review
                    </span>
                  ) : (
                    <span>All logged overtime reviewed</span>
                  )}
                </div>
              </div>
            </div>

            {/* MODULE TABS */}
            <div
              className="tabs-container"
              style={{
                marginBottom: '1.35rem',
                display: 'flex',
                gap: '0.45rem',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap'
              }}
            >
              {[
                {
                  id: 'scorecard',
                  label: isStaffRole
                    ? 'My 360° Scorecard'
                    : `Team Leaderboard (${consultantScorecards.length})`,
                  icon: Award
                },
                { id: 'productivity', label: 'Productivity & Cross-Sell', icon: BarChart2 },
                {
                  id: 'operations',
                  label: `Tours, Operations & Overtime (${operationsAnalytics.totalOpsHandled})`,
                  icon: Briefcase
                },
                { id: 'target_sales', label: 'Target vs Achievement', icon: Target }
              ].map((t) => {
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <IconComp size={16} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* ========================================================= */}
            {/* TAB 1: TEAM LEADERBOARD & 360° CONSULTANT SCORECARDS      */}
            {/* ========================================================= */}
            {activeTab === 'scorecard' && (
              <div className="fade-in">
                {/* Top Performers Spotlight Cards (When All Staff selected) */}
                {staffNameFilter === 'All' && consultantScorecards.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {consultantScorecards.slice(0, 3).map((c, idx) => (
                      <div
                        key={c.staffName}
                        className="card"
                        onClick={() =>
                          setDrawerState({
                            isOpen: true,
                            mode: 'consultant',
                            staffName: c.staffName,
                            categoryName: null,
                            tourId: null
                          })
                        }
                        style={{
                          cursor: 'pointer',
                          padding: '1.15rem 1.25rem',
                          border: `1px solid ${idx === 0 ? neonBlue : 'var(--border)'}`,
                          background:
                            idx === 0
                              ? isLight
                                ? 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)'
                                : 'linear-gradient(135deg, rgba(0, 212, 255, 0.09) 0%, rgba(13, 22, 41, 0.95) 100%)'
                              : undefined
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                background:
                                  idx === 0
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(0, 168, 255, 0.14)',
                                color: idx === 0 ? amberColor : neonBlue
                              }}
                            >
                              #{idx + 1}
                            </span>
                            <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>
                              {c.staffName}
                            </strong>
                          </div>
                          <span
                            style={{
                              ...getTierBadgeStyle(c.tierLabel),
                              padding: '0.18rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            {c.tierLabel}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              NET PROFIT
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: emeraldColor }}>
                              {formatCompactIdr(c.effectiveProfit)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              QUOTA / OPS
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: neonBlue }}>
                              {c.targetSales > 0 ? `${c.salesQuotaPct}%` : '—'} •{' '}
                              <span style={{ color: 'var(--text-main)' }}>
                                {c.totalOpsFiles} files
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Full Consultant Scorecard Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.02rem', color: 'var(--text-main)' }}>
                        360° Consultant Performance Matrix
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                        Click any consultant row to open their full 360° performance appraisal dossier.
                      </p>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>RANK</th>
                          <th>CONSULTANT</th>
                          <th>TIER</th>
                          <th style={{ textAlign: 'right' }}>SALES QUOTA %</th>
                          <th style={{ textAlign: 'right' }}>PROD. SALES</th>
                          <th style={{ textAlign: 'right' }}>PROD. PROFIT</th>
                          <th style={{ textAlign: 'right' }}>MARGIN</th>
                          <th style={{ textAlign: 'center' }}>OPS HANDLED</th>
                          <th style={{ textAlign: 'right' }}>CROSS-SELL</th>
                          <th style={{ textAlign: 'right' }}>OT (HRS)</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultantScorecards.map((c, idx) => (
                          <tr
                            key={c.staffName}
                            onClick={() =>
                              setDrawerState({
                                isOpen: true,
                                mode: 'consultant',
                                staffName: c.staffName,
                                categoryName: null,
                                tourId: null
                              })
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            <td style={{ fontWeight: 800, color: idx === 0 ? amberColor : 'var(--text-muted)' }}>
                              #{idx + 1}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {c.staffName}
                            </td>
                            <td>
                              <span
                                style={{
                                  ...getTierBadgeStyle(c.tierLabel),
                                  padding: '0.18rem 0.58rem',
                                  borderRadius: '999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {c.tierLabel}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {c.targetSales > 0 ? (
                                <div>
                                  <strong
                                    style={{
                                      color:
                                        c.salesQuotaPct >= 100
                                          ? emeraldColor
                                          : c.salesQuotaPct >= 75
                                            ? neonBlue
                                            : amberColor
                                    }}
                                  >
                                    {c.salesQuotaPct}%
                                  </strong>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {formatCompactIdr(c.actualSales)}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                color: 'var(--text-main)'
                              }}
                            >
                              {formatCompactIdr(c.prodSales)}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: emeraldColor
                              }}
                            >
                              {formatCompactIdr(c.prodProfit)}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              <span style={{ color: getMarginColor(c.prodMarginPct), fontWeight: 700 }}>
                                {c.prodMarginPct}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                title={`Tours: ${c.toursCount} | Cruises: ${c.cruisesCount} | Hotels: ${c.hotelsCount} | Docs: ${c.docsCount} | SIM: ${c.telecomsCount}`}
                                style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '999px',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {c.totalOpsFiles}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', color: neonBlue, fontWeight: 600 }}>
                              {c.crossSellPct}%
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              {c.overtimeApprovedHrs}h
                            </td>
                            <td
                              style={{ textAlign: 'right' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn"
                                  title="Inspect 360° Dossier"
                                  onClick={() =>
                                    setDrawerState({
                                      isOpen: true,
                                      mode: 'consultant',
                                      staffName: c.staffName,
                                      categoryName: null,
                                      tourId: null
                                    })
                                  }
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.74rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Eye size={13} /> Dossier
                                </button>
                                {!isStaffRole && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() =>
                                      setSelectedStaff(
                                        isSameStaff(selectedStaff, c.staffName)
                                          ? 'All'
                                          : c.staffName
                                      )
                                    }
                                    style={{
                                      padding: '0.35rem 0.55rem',
                                      background: isSameStaff(selectedStaff, c.staffName)
                                        ? 'var(--primary)'
                                        : isLight
                                          ? 'rgba(2, 132, 199, 0.1)'
                                          : 'rgba(0, 212, 255, 0.14)',
                                      color: isSameStaff(selectedStaff, c.staffName)
                                        ? 'var(--primary-fg, #fff)'
                                        : neonBlue,
                                      fontSize: '0.74rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    {isSameStaff(selectedStaff, c.staffName) ? 'Focused' : 'Focus'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: PRODUCTIVITY & CROSS-SELL BREAKDOWN                */}
            {/* ========================================================= */}
            {activeTab === 'productivity' && (
              <div className="fade-in">
                <div className="card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: 'var(--text-main)'
                        }}
                      >
                        <BarChart2 size={20} color={neonBlue} /> Product Category P&amp;L (Retail vs Corporate)
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Click any category row to inspect individual consultant contributions.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          background: 'var(--bg-surface)',
                          padding: '0.2rem',
                          borderRadius: '0.55rem',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {[
                          { id: 'sales', label: 'Chart: Gross Sales' },
                          { id: 'profit', label: 'Chart: Net Profit' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setProdChartMetric(m.id)}
                            style={{
                              border: 'none',
                              borderRadius: '0.4rem',
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.76rem',
                              fontWeight: prodChartMetric === m.id ? 700 : 500,
                              cursor: 'pointer',
                              background:
                                prodChartMetric === m.id ? 'var(--primary)' : 'transparent',
                              color:
                                prodChartMetric === m.id
                                  ? 'var(--primary-fg, #fff)'
                                  : 'var(--text-muted)'
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      <ExportMenu
                        data={productivityAnalytics.rows}
                        columns={prodExportColumns}
                        filename="Staff_Productivity_Breakdown"
                      />
                    </div>
                  </div>

                  {/* Cross-Sell Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div
                      style={{
                        background: isLight
                          ? 'rgba(16, 185, 129, 0.06)'
                          : 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderLeft: `4px solid ${emeraldColor}`,
                        padding: '0.95rem 1.1rem',
                        borderRadius: '0.6rem'
                      }}
                    >
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Retail Cross-Sell (Hotel vs Flight)
                      </div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: emeraldColor, marginTop: '0.2rem' }}>
                        {productivityAnalytics.retailCrossSell}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        B2C Hotel-to-Flight Sales Attachment
                      </div>
                    </div>

                    <div
                      style={{
                        background: isLight
                          ? 'rgba(2, 132, 199, 0.06)'
                          : 'rgba(0, 212, 255, 0.08)',
                        border: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(0, 212, 255, 0.25)'}`,
                        borderLeft: `4px solid ${neonBlue}`,
                        padding: '0.95rem 1.1rem',
                        borderRadius: '0.6rem'
                      }}
                    >
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Corporate Cross-Sell (Hotel vs Flight)
                      </div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: neonBlue, marginTop: '0.2rem' }}>
                        {productivityAnalytics.corpCrossSell}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        B2B Hotel-to-Flight Sales Attachment
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${amberColor}`,
                        padding: '0.95rem 1.1rem',
                        borderRadius: '0.6rem'
                      }}
                    >
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Blended Overall Cross-Sell
                      </div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: amberColor, marginTop: '0.2rem' }}>
                        {productivityAnalytics.blendedCrossSell}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Combined Retail + Corporate Ratio
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div style={{ height: '340px', width: '100%', marginBottom: '1.5rem' }}>
                    {productivityAnalytics.rows.length > 0 ? (
                      <ResponsiveContainer>
                        <BarChart
                          data={productivityAnalytics.rows}
                          margin={{ top: 8, right: 12, left: 12, bottom: 10 }}
                          onClick={(st) => {
                            if (st?.activeLabel) {
                              setDrawerState({
                                isOpen: true,
                                mode: 'category',
                                staffName: null,
                                categoryName: st.activeLabel,
                                tourId: null
                              });
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                          />
                          <RechartsTooltip
                            content={<PerformanceChartTooltip isLight={isLight} />}
                          />
                          <Legend />
                          <Bar
                            dataKey={prodChartMetric === 'sales' ? 'retailSales' : 'retailProfit'}
                            name={prodChartMetric === 'sales' ? 'Retail Sales' : 'Retail Profit'}
                            fill={emeraldColor}
                            radius={[4, 4, 0, 0]}
                            style={{ cursor: 'pointer' }}
                          />
                          <Bar
                            dataKey={prodChartMetric === 'sales' ? 'corpSales' : 'corpProfit'}
                            name={
                              prodChartMetric === 'sales'
                                ? 'Corporate Sales'
                                : 'Corporate Profit'
                            }
                            fill={neonBlue}
                            radius={[4, 4, 0, 0]}
                            style={{ cursor: 'pointer' }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)'
                        }}
                      >
                        No productivity records match the selected period and consultant.
                      </div>
                    )}
                  </div>

                  {/* Standardized IDR Productivity Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>PRODUCT CATEGORY</th>
                          <th style={{ textAlign: 'right' }}>RETAIL SALES</th>
                          <th style={{ textAlign: 'right' }}>CORP SALES</th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                            TOTAL SALES
                          </th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                            RETAIL PROFIT
                          </th>
                          <th style={{ textAlign: 'right' }}>CORP PROFIT</th>
                          <th style={{ textAlign: 'right', borderLeft: '1px solid var(--border)' }}>
                            TOTAL PROFIT
                          </th>
                          <th style={{ textAlign: 'right' }}>SHARE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productivityAnalytics.rows.map((row) => (
                          <tr
                            key={row.name}
                            onClick={() =>
                              setDrawerState({
                                isOpen: true,
                                mode: 'category',
                                staffName: null,
                                categoryName: row.name,
                                tourId: null
                              })
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.name}</td>
                            <td style={{ textAlign: 'right', color: emeraldColor, fontFamily: 'monospace' }}>
                              {formatIdr(row.retailSales)}
                            </td>
                            <td style={{ textAlign: 'right', color: neonBlue, fontFamily: 'monospace' }}>
                              {formatIdr(row.corpSales)}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                borderLeft: '1px solid var(--border)'
                              }}
                            >
                              {formatIdr(row.totalSales)}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                borderLeft: '1px solid var(--border)'
                              }}
                            >
                              <div style={{ color: emeraldColor, fontWeight: 600 }}>
                                {formatIdr(row.retailProfit)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: getMarginColor(row.retailMargin) }}>
                                {row.retailMargin}% margin
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                              <div style={{ color: neonBlue, fontWeight: 600 }}>
                                {formatIdr(row.corpProfit)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: getMarginColor(row.corpMargin) }}>
                                {row.corpMargin}% margin
                              </div>
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                borderLeft: '1px solid var(--border)'
                              }}
                            >
                              <div style={{ color: emeraldColor }}>{formatIdr(row.totalProfit)}</div>
                              <div style={{ fontSize: '0.7rem', color: getMarginColor(row.totalMargin) }}>
                                {row.totalMargin}% margin
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {row.salesSharePct}%
                            </td>
                          </tr>
                        ))}

                        {productivityAnalytics.rows.length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No productivity data found for this period/consultant.
                            </td>
                          </tr>
                        )}

                        {productivityAnalytics.rows.length > 0 && (() => {
                          const tRS = productivityAnalytics.rows.reduce((s, r) => s + r.retailSales, 0);
                          const tCS = productivityAnalytics.rows.reduce((s, r) => s + r.corpSales, 0);
                          const tRP = productivityAnalytics.rows.reduce((s, r) => s + r.retailProfit, 0);
                          const tCP = productivityAnalytics.rows.reduce((s, r) => s + r.corpProfit, 0);
                          const gRM = tRS > 0 ? ((tRP / tRS) * 100).toFixed(1) : '0.0';
                          const gCM = tCS > 0 ? ((tCP / tCS) * 100).toFixed(1) : '0.0';
                          return (
                            <tr
                              style={{
                                background: isLight
                                  ? 'rgba(2, 132, 199, 0.07)'
                                  : 'rgba(0, 212, 255, 0.08)',
                                fontWeight: 800
                              }}
                            >
                              <td style={{ color: neonBlue }}>GRAND TOTAL</td>
                              <td style={{ textAlign: 'right', color: emeraldColor, fontFamily: 'monospace' }}>
                                {formatIdr(tRS)}
                              </td>
                              <td style={{ textAlign: 'right', color: neonBlue, fontFamily: 'monospace' }}>
                                {formatIdr(tCS)}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', borderLeft: '1px solid var(--border)' }}>
                                {formatIdr(productivityAnalytics.grandSales)}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', borderLeft: '1px solid var(--border)' }}>
                                <div style={{ color: emeraldColor }}>{formatIdr(tRP)}</div>
                                <div style={{ fontSize: '0.7rem', color: getMarginColor(gRM) }}>
                                  {gRM}% margin
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                <div style={{ color: neonBlue }}>{formatIdr(tCP)}</div>
                                <div style={{ fontSize: '0.7rem', color: getMarginColor(gCM) }}>
                                  {gCM}% margin
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', borderLeft: '1px solid var(--border)' }}>
                                <div style={{ color: emeraldColor }}>
                                  {formatIdr(productivityAnalytics.grandProfit)}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: getMarginColor(productivityAnalytics.grandMargin) }}>
                                  {productivityAnalytics.grandMargin}% margin
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>100%</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: TOURS, MULTI-MODULE OPERATIONS & OVERTIME          */}
            {/* ========================================================= */}
            {activeTab === 'operations' && (
              <div className="fade-in">
                {/* 6-MODULE OPERATIONAL WORKLOAD STRIP */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
                    gap: '0.9rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  <div className="card" style={{ padding: '1rem 1.1rem', borderTop: `3px solid ${emeraldColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Active Tours
                      </span>
                      <Briefcase size={16} color={emeraldColor} />
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '0.3rem' }}>
                      {operationsAnalytics.activeTourCount}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {operationsAnalytics.activeTourPax} Pax • {operationsAnalytics.cancelledTourCount} Cancelled ({operationsAnalytics.tourCancelRate}%)
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem 1.1rem', borderTop: `3px solid ${neonBlue}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Tour Net Profit
                      </span>
                      <DollarSign size={16} color={neonBlue} />
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: neonBlue, marginTop: '0.3rem' }}>
                      {formatCompactIdr(operationsAnalytics.activeTourProfit)}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Omset: {formatCompactIdr(operationsAnalytics.activeTourOmset)} ({operationsAnalytics.tourMargin}%)
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem 1.1rem', borderTop: `3px solid ${skyAccent}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Cruises &amp; Hotels
                      </span>
                      <Ship size={16} color={skyAccent} />
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                      {operationsAnalytics.cruiseCount} Cruise • {operationsAnalytics.hotelCount} Hotel
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {operationsAnalytics.cruisePax} Sailing Pax Handled
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem 1.1rem', borderTop: `3px solid ${amberColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Visa &amp; Documents
                      </span>
                      <FileText size={16} color={amberColor} />
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '0.3rem' }}>
                      {operationsAnalytics.docCount}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Fees: {formatCompactIdr(operationsAnalytics.docsFeeVolume)} ({operationsAnalytics.expressDocsCount} Express)
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem 1.1rem', borderTop: `3px solid ${neonBlue}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SIM &amp; Overtime
                      </span>
                      <Smartphone size={16} color={neonBlue} />
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                      {operationsAnalytics.telecomCount} SIM • {operationsAnalytics.approvedOtHours}h OT
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {operationsAnalytics.esimCount} eSIM • {operationsAnalytics.pendingOtHours}h Pending OT
                    </div>
                  </div>
                </div>

                {/* TOUR STATUS & TOP DESTINATIONS CHARTS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      Tour Booking Status Breakdown
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      {operationsAnalytics.statusData.length > 0 ? (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={operationsAnalytics.statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={62}
                              outerRadius={98}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {operationsAnalytics.statusData.map((entry, idx) => (
                                <Cell key={`st-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              content={
                                <PerformanceChartTooltip isLight={isLight} valueType="count" />
                              }
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          No tour bookings found for this filter.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      Top Destinations Handled (Active Pax)
                    </h3>
                    <div style={{ height: '280px', width: '100%' }}>
                      {operationsAnalytics.topDestinations.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart
                            data={operationsAnalytics.topDestinations}
                            layout="vertical"
                            margin={{ top: 5, right: 25, left: 30, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal vertical={false} />
                            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={85} />
                            <RechartsTooltip
                              content={
                                <PerformanceChartTooltip isLight={isLight} valueType="count" />
                              }
                            />
                            <Bar dataKey="pax" name="Active Passengers" fill={neonBlue} radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          No destination data available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SEARCHABLE & PAGINATED TOURS HANDLED LEDGER */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>
                        Tours Handled Ledger ({totalFilteredTours})
                      </h3>
                      <p style={{ margin: '0.18rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Cancelled tours are flagged and excluded from active revenue KPIs.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', minWidth: '230px' }}>
                        <Search
                          size={15}
                          style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search tour code, country, staff..."
                          value={tourSearch}
                          onChange={(e) => handleTourSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.48rem 1.8rem 0.48rem 2.15rem',
                            borderRadius: '0.55rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                        {tourSearch && (
                          <button
                            type="button"
                            onClick={() => handleTourSearch('')}
                            style={{
                              position: 'absolute',
                              right: '0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <select
                        value={toursPerPage}
                        onChange={(e) => {
                          setToursPerPage(Number(e.target.value));
                          setTourPage(1);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          borderRadius: '0.5rem',
                          padding: '0.45rem 0.6rem',
                          fontSize: '0.78rem'
                        }}
                      >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                      </select>

                      <ExportMenu
                        data={operationsAnalytics.normalizedTourRows}
                        columns={tourExportColumns}
                        filename="Staff_Tours_Ledger"
                      />
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleTourSort('codeLabel')} style={{ cursor: 'pointer' }}>
                            CODE {renderTourSortIcon('codeLabel')}
                          </th>
                          <th onClick={() => handleTourSort('staffAssigned')} style={{ cursor: 'pointer' }}>
                            CONSULTANT {renderTourSortIcon('staffAssigned')}
                          </th>
                          <th onClick={() => handleTourSort('country')} style={{ cursor: 'pointer' }}>
                            DESTINATION {renderTourSortIcon('country')}
                          </th>
                          <th onClick={() => handleTourSort('departureDate')} style={{ cursor: 'pointer' }}>
                            DEPARTURE {renderTourSortIcon('departureDate')}
                          </th>
                          <th onClick={() => handleTourSort('paxNum')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                            PAX {renderTourSortIcon('paxNum')}
                          </th>
                          <th>STATUS</th>
                          <th onClick={() => handleTourSort('omsetNum')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                            SELLING PRICE {renderTourSortIcon('omsetNum')}
                          </th>
                          <th onClick={() => handleTourSort('profitNum')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                            PROFIT {renderTourSortIcon('profitNum')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTours.map((t) => {
                          const cancelled = isCancelledTour(t.status);
                          return (
                            <tr
                              key={t.id}
                              onClick={() =>
                                setDrawerState({
                                  isOpen: true,
                                  mode: 'tour',
                                  staffName: null,
                                  categoryName: null,
                                  tourId: t.id
                                })
                              }
                              style={{
                                cursor: 'pointer',
                                opacity: cancelled ? 0.6 : 1
                              }}
                            >
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: neonBlue }}>
                                {t.codeLabel}
                              </td>
                              <td style={{ fontWeight: 600 }}>{t.staffAssigned}</td>
                              <td>{t.country || '—'}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {t.departureDate || '—'}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                                {t.paxNum}
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '0.16rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: cancelled
                                      ? 'rgba(239, 68, 68, 0.14)'
                                      : t.status === 'Confirm'
                                        ? 'rgba(16, 185, 129, 0.14)'
                                        : t.status === 'Past Date'
                                          ? 'rgba(0, 168, 255, 0.14)'
                                          : 'rgba(245, 158, 11, 0.14)',
                                    color: cancelled
                                      ? '#ef4444'
                                      : t.status === 'Confirm'
                                        ? emeraldColor
                                        : t.status === 'Past Date'
                                          ? neonBlue
                                          : amberColor
                                  }}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                {formatIdr(t.omsetNum)}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: emeraldColor }}>
                                {formatIdr(t.profitNum)}
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedTours.length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2.25rem', color: 'var(--text-muted)' }}>
                              No tour bookings match your active filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={tourPage}
                    totalPages={tourTotalPages}
                    onPageChange={setTourPage}
                    totalItems={totalFilteredTours}
                    itemsPerPage={toursPerPage}
                  />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: TARGET VS ACHIEVEMENT QUOTA                        */}
            {/* ========================================================= */}
            {activeTab === 'target_sales' && (
              <div className="fade-in">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  <div className="card" style={{ padding: '1.1rem 1.2rem', borderTop: `3px solid ${slateMuted}` }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Assigned Sales Quota
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                      {formatCompactIdr(salesMetrics.targetSales)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      {formatIdr(salesMetrics.targetSales)}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.1rem 1.2rem', borderTop: `3px solid ${neonBlue}` }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Actual Sales Achieved
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: neonBlue, marginTop: '0.35rem' }}>
                      {formatCompactIdr(salesMetrics.achievementSales)}
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            salesMetrics.salesRate >= 100
                              ? emeraldColor
                              : salesMetrics.salesRate >= 75
                                ? neonBlue
                                : amberColor
                        }}
                      >
                        {salesMetrics.salesRate}% attained
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {salesMetrics.salesVariance >= 0 ? '+' : ''}
                        {formatCompactIdr(salesMetrics.salesVariance)}
                      </span>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.1rem 1.2rem', borderTop: `3px solid ${slateMuted}` }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Assigned Profit Quota
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                      {formatCompactIdr(salesMetrics.targetProfit)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      {formatIdr(salesMetrics.targetProfit)}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.1rem 1.2rem', borderTop: `3px solid ${emeraldColor}` }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Actual Profit Achieved
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: emeraldColor, marginTop: '0.35rem' }}>
                      {formatCompactIdr(salesMetrics.achievementProfit)}
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            salesMetrics.profitRate >= 100
                              ? emeraldColor
                              : salesMetrics.profitRate >= 75
                                ? neonBlue
                                : amberColor
                        }}
                      >
                        {salesMetrics.profitRate}% attained
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {salesMetrics.profitVariance >= 0 ? '+' : ''}
                        {formatCompactIdr(salesMetrics.profitVariance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Activity size={18} color={neonBlue} /> Sales: Quota vs Actual{' '}
                      {staffNameFilter === 'All' ? '(by Consultant)' : '(by Month)'}
                    </h3>
                    <div style={{ height: '340px', width: '100%' }}>
                      {salesChartData.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart data={salesChartData} margin={{ top: 8, right: 10, left: 10, bottom: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={11}
                              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                            />
                            <RechartsTooltip
                              content={<PerformanceChartTooltip isLight={isLight} />}
                            />
                            <Legend />
                            <Bar dataKey="targetSales" name="Target Sales" fill={slateMuted} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="achievementSales" name="Actual Sales" fill={neonBlue} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          No quota records found for this filter.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <TrendingUp size={18} color={emeraldColor} /> Net Profit: Quota vs Actual{' '}
                      {staffNameFilter === 'All' ? '(by Consultant)' : '(by Month)'}
                    </h3>
                    <div style={{ height: '340px', width: '100%' }}>
                      {salesChartData.length > 0 ? (
                        <ResponsiveContainer>
                          <BarChart data={salesChartData} margin={{ top: 8, right: 10, left: 10, bottom: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={11}
                              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                            />
                            <RechartsTooltip
                              content={<PerformanceChartTooltip isLight={isLight} />}
                            />
                            <Legend />
                            <Bar dataKey="targetProfit" name="Target Profit" fill={slateMuted} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="achievementProfit" name="Actual Profit" fill={emeraldColor} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          No quota records found for this filter.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER (360° CONSULTANT / CATEGORY / TOUR)     */}
      {/* ========================================================= */}
      <SlideOverDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        title={
          drawerState.mode === 'consultant' && inspectedConsultant?.card
            ? `${inspectedConsultant.card.staffName} — 360° Appraisal`
            : drawerState.mode === 'category' && inspectedCategory
              ? `${inspectedCategory.category} Category Breakdown`
              : inspectedTour
                ? `Tour File ${inspectedTour.codeLabel}`
                : 'Performance Inspector'
        }
        subtitle={
          drawerState.mode === 'consultant' && inspectedConsultant?.card
            ? `${activePeriodRange.label} • Tier: ${inspectedConsultant.card.tierLabel}`
            : drawerState.mode === 'category'
              ? `${activePeriodRange.label} • ${staffNameFilter === 'All' ? 'All Staff' : staffNameFilter}`
              : inspectedTour
                ? `${inspectedTour.country || 'Destination'} • PIC: ${inspectedTour.staffAssigned}`
                : ''
        }
        footer={
          drawerState.mode === 'consultant' &&
          inspectedConsultant?.card &&
          !isStaffRole ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedStaff(inspectedConsultant.card.staffName);
                setDrawerState((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              Filter Entire Page to {inspectedConsultant.card.staffName}
            </button>
          ) : null
        }
      >
        {/* MODE 1: 360° CONSULTANT DOSSIER */}
        {drawerState.mode === 'consultant' && inspectedConsultant?.card && (() => {
          const c = inspectedConsultant.card;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: '0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOGGED NET PROFIT</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: emeraldColor, marginTop: '0.2rem' }}>
                    {formatIdr(c.prodProfit)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Margin: {c.prodMarginPct}%
                  </div>
                </div>
                <div style={{ padding: '0.85rem', borderRadius: '0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SALES QUOTA %</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: neonBlue, marginTop: '0.2rem' }}>
                    {c.targetSales > 0 ? `${c.salesQuotaPct}%` : 'No Quota'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    {formatCompactIdr(c.actualSales)} / {formatCompactIdr(c.targetSales)}
                  </div>
                </div>
              </div>

              {/* Multi-Module Operations Grid */}
              <div
                style={{
                  padding: '0.95rem',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Operational Workload ({c.totalOpsFiles} Total Files)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tours Handled:</span>
                    <strong>{c.toursCount} ({c.toursPax} Pax)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cruise Voyages:</span>
                    <strong>{c.cruisesCount} ({c.cruisesPax} Pax)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Hotel Stays:</span>
                    <strong>{c.hotelsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Visa &amp; Docs:</span>
                    <strong>{c.docsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SIM / eSIM:</span>
                    <strong>{c.telecomsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Approved OT:</span>
                    <strong>{c.overtimeApprovedHrs} hrs</strong>
                  </div>
                </div>
              </div>

              {/* Top Categories */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Top Product Categories by Profit
                </div>
                {inspectedConsultant.topCategories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {inspectedConsultant.topCategories.slice(0, 6).map((cat) => (
                      <div
                        key={cat.name}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '0.6rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.84rem' }}>{cat.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Sales: {formatCompactIdr(cat.sales)}
                          </div>
                        </div>
                        <strong style={{ color: emeraldColor, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {formatIdr(cat.profit)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    No productivity categories logged in this window.
                  </div>
                )}
              </div>

              {/* Overtime Events */}
              {inspectedConsultant.recentOvertimes.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Recent Overtime Claims
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {inspectedConsultant.recentOvertimes.map((ot) => (
                      <div
                        key={ot.id}
                        style={{
                          padding: '0.55rem 0.8rem',
                          borderRadius: '0.55rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span>
                          <strong>{ot.eventName}</strong> ({ot.date})
                        </span>
                        <span style={{ fontWeight: 700, color: ot.status === 'Approved' ? emeraldColor : amberColor }}>
                          {ot.hours}h • {ot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* MODE 2: CATEGORY BREAKDOWN */}
        {drawerState.mode === 'category' && inspectedCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Consultant Contribution ({inspectedCategory.staffSplit.length})
            </div>
            {inspectedCategory.staffSplit.map((s) => (
              <div
                key={s.name}
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '0.65rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.86rem' }}>{s.name}</strong>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    {s.count} entries • Sales: {formatIdr(s.sales)}
                  </div>
                </div>
                <strong style={{ color: emeraldColor, fontFamily: 'monospace' }}>
                  {formatIdr(s.profit)}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* MODE 3: TOUR FILE SUMMARY */}
        {drawerState.mode === 'tour' && inspectedTour && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SELLING PRICE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: neonBlue, marginTop: '0.2rem' }}>
                  {formatIdr(inspectedTour.omsetNum)}
                </div>
              </div>
              <div style={{ padding: '0.85rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NET PROFIT</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: emeraldColor, marginTop: '0.2rem' }}>
                  {formatIdr(inspectedTour.profitNum)}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '0.95rem',
                borderRadius: '0.7rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                fontSize: '0.83rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consultant PIC</span>
                <strong>{inspectedTour.staffAssigned}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Destination</span>
                <strong>{inspectedTour.country || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Travel Dates</span>
                <strong>
                  {inspectedTour.departureDate || '—'} → {inspectedTour.returnDate || '—'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passenger Count</span>
                <strong>{inspectedTour.paxNum} Pax</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Profit Margin</span>
                <strong style={{ color: getMarginColor(inspectedTour.marginPct) }}>
                  {inspectedTour.marginPct}%
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <strong>{inspectedTour.status}</strong>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default StaffPerformance;
