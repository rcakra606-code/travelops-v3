import { computeDelta, formatMonthLabel, formatShortDate } from './formatters.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateSafe = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  }
  const str = String(raw).trim();
  if (!str) return null;

  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const d = new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM -> treat as 1st day of that month
  const ym = str.match(/^(\d{4})-(\d{2})$/);
  if (ym) {
    const d = new Date(parseInt(ym[1], 10), parseInt(ym[2], 10) - 1, 1);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const toYmKey = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const toIsoDate = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const isCancelled = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'cancel' || s === 'cancelled' || s === 'canceled';
};

const resolveTourScheme = (t) => {
  const raw = String(t?.tourType || t?.category || t?.internals?.tourType || 'Series').trim().toLowerCase();
  if (raw.includes('incentive')) return 'Incentive';
  if (raw.includes('consort')) return 'Consortium';
  return 'Series';
};

const resolveTourFinancials = (t) => {
  const fin = t?.financials || {};
  const omset = Number(fin.totalSellingPrice ?? fin.totalOmset ?? t?.totalSellingPrice ?? t?.totalOmset ?? 0) || 0;
  const nett = Number(fin.totalNettPrice ?? fin.cost ?? t?.totalNettPrice ?? 0) || 0;
  const profit = fin.profit !== undefined && fin.profit !== null
    ? (Number(fin.profit) || 0)
    : Math.max(0, omset - nett);
  const deposit = Number(fin.depositAmount ?? t?.depositAmount ?? 0) || 0;
  const sisa = fin.sisaPelunasan !== undefined && fin.sisaPelunasan !== null
    ? Math.max(0, Number(fin.sisaPelunasan) || 0)
    : Math.max(0, omset - deposit);
  return { omset, nett, profit, deposit, sisa };
};

const resolveTourDate = (t) => {
  return parseDateSafe(t?.departureDate || t?.returnDate || t?.createdAt);
};

const resolveDocDate = (d) => {
  return parseDateSafe(d?.receiveDate || d?.appointmentDate || d?.estimatedDone || d?.sendDate);
};

const normalizeStaffName = (name) => String(name || '').trim().toLowerCase();

/**
 * Resolve current and previous comparison date boundaries based on period preset.
 */
export const resolvePeriodWindows = (periodPreset = 'this_quarter', referenceDate = new Date()) => {
  const ref = parseDateSafe(referenceDate) || new Date();
  const y = ref.getFullYear();
  const m = ref.getMonth();

  if (periodPreset === 'this_month') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    const prevStart = new Date(y, m - 1, 1);
    const prevEnd = new Date(y, m, 0);
    return {
      preset: periodPreset,
      current: { start, end, label: formatMonthLabel(toYmKey(start)) },
      previous: { start: prevStart, end: prevEnd, label: formatMonthLabel(toYmKey(prevStart)) }
    };
  }

  if (periodPreset === 'this_quarter') {
    const q = Math.floor(m / 3);
    const start = new Date(y, q * 3, 1);
    const end = new Date(y, q * 3 + 3, 0);
    const prevStart = new Date(y, (q - 1) * 3, 1);
    const prevEnd = new Date(y, q * 3, 0);
    const prevQ = ((q - 1) + 4) % 4;
    const prevYear = q === 0 ? y - 1 : y;
    return {
      preset: periodPreset,
      current: { start, end, label: `Q${q + 1} ${y}` },
      previous: { start: prevStart, end: prevEnd, label: `Q${prevQ + 1} ${prevYear}` }
    };
  }

  if (periodPreset === 'last_90d') {
    const end = new Date(y, m, ref.getDate());
    const start = new Date(end.getTime() - 89 * MS_PER_DAY);
    const prevEnd = new Date(start.getTime() - MS_PER_DAY);
    const prevStart = new Date(prevEnd.getTime() - 89 * MS_PER_DAY);
    return {
      preset: periodPreset,
      current: {
        start,
        end,
        label: `${formatShortDate(toIsoDate(start))} – ${formatShortDate(toIsoDate(end))}`
      },
      previous: {
        start: prevStart,
        end: prevEnd,
        label: `${formatShortDate(toIsoDate(prevStart))} – ${formatShortDate(toIsoDate(prevEnd))}`
      }
    };
  }

  if (periodPreset === 'this_year') {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    const prevStart = new Date(y - 1, 0, 1);
    const prevEnd = new Date(y - 1, 11, 31);
    return {
      preset: periodPreset,
      current: { start, end, label: `Tahun ${y}` },
      previous: { start: prevStart, end: prevEnd, label: `Tahun ${y - 1}` }
    };
  }

  // all_time
  return {
    preset: 'all_time',
    current: { start: null, end: null, label: 'Seluruh Periode Tercatat' },
    previous: null
  };
};

const isInWindow = (dateObj, win) => {
  if (!win) return false;
  if (!win.start && !win.end) return true; // all_time
  if (!dateObj) return false;
  if (win.start && dateObj < win.start) return false;
  if (win.end && dateObj > win.end) return false;
  return true;
};

const calcPct = (numerator, denominator) => {
  if (!denominator || denominator <= 0) return 0;
  return (numerator / denominator) * 100;
};

const aggregatePeriodMetrics = ({
  tours,
  documents,
  hotels,
  cruises,
  telecoms,
  corporateSales,
  productivityData,
  overtimes,
  sales,
  win,
  includeCorporate
}) => {
  const periodTours = tours.filter((t) => isInWindow(resolveTourDate(t), win));
  const periodDocs = documents.filter((d) => isInWindow(resolveDocDate(d), win));
  const periodHotels = hotels.filter((h) => isInWindow(parseDateSafe(h.checkIn || h.checkOut), win));
  const periodCruises = cruises.filter((c) => isInWindow(parseDateSafe(c.sailingStart || c.sailingEnd), win));
  const periodTelecoms = telecoms.filter((tc) => isInWindow(parseDateSafe(tc.tanggalMulai || tc.tanggalSelesai), win));
  const periodCorpSales = includeCorporate
    ? corporateSales.filter((cs) => isInWindow(parseDateSafe(cs.date), win))
    : [];
  const periodProductivity = productivityData.filter((p) => isInWindow(parseDateSafe(p.date), win));
  const periodOvertimes = overtimes.filter((o) => isInWindow(parseDateSafe(o.date), win));
  const periodSalesTargets = sales.filter((s) => isInWindow(parseDateSafe(s.period), win));

  // Tours metrics
  let activeToursCount = 0;
  let confirmedToursCount = 0;
  let pendingToursCount = 0;
  let cancelledToursCount = 0;
  let activeTourPax = 0;
  let tourOmset = 0;
  let tourNett = 0;
  let tourProfit = 0;
  let cancelledTourValue = 0;

  periodTours.forEach((t) => {
    const fin = resolveTourFinancials(t);
    const pax = Math.max(0, Number(t.paxCount || (Array.isArray(t.paxInfo) ? t.paxInfo.length : 1)) || 0);
    if (isCancelled(t.status)) {
      cancelledToursCount += 1;
      cancelledTourValue += fin.omset;
    } else {
      activeToursCount += 1;
      activeTourPax += pax;
      tourOmset += fin.omset;
      tourNett += fin.nett;
      tourProfit += fin.profit;
      if (t.status === 'Confirm' || t.status === 'Past Date') {
        confirmedToursCount += 1;
      } else {
        pendingToursCount += 1;
      }
    }
  });

  // Documents metrics (turnaround & SLA)
  let docRevenue = 0;
  let docCompletedWithDates = 0;
  let docTotalTurnaroundDays = 0;
  let docSlaMeasured = 0;
  let docSlaOnTime = 0;

  periodDocs.forEach((d) => {
    docRevenue += Number(d.price) || 0;
    const rec = parseDateSafe(d.receiveDate);
    const send = parseDateSafe(d.sendDate);
    const est = parseDateSafe(d.estimatedDone);

    if (rec && send && send >= rec) {
      docCompletedWithDates += 1;
      docTotalTurnaroundDays += Math.round((send - rec) / MS_PER_DAY);
    }
    if (est && send) {
      docSlaMeasured += 1;
      if (send <= est) docSlaOnTime += 1;
    }
  });

  // Corporate B2B Sales
  let corpRevenue = 0;
  let corpProfit = 0;
  periodCorpSales.forEach((cs) => {
    corpRevenue += Number(cs.salesAmount) || 0;
    corpProfit += Number(cs.profitAmount) || 0;
  });

  // Productivity P&L Ledger (tracked separately to avoid double-counting!)
  let prodSales = 0;
  let prodProfit = 0;
  periodProductivity.forEach((p) => {
    prodSales += Number(p.salesAmount) || 0;
    prodProfit += Number(p.profitAmount) || 0;
  });

  // Cruises pax
  let cruisePax = 0;
  periodCruises.forEach((c) => {
    if (!isCancelled(c.status)) {
      cruisePax += Math.max(0, Number(c.paxCount) || 1);
    }
  });

  // Overtime hours
  let overtimeHours = 0;
  let pendingOvertimeCount = 0;
  periodOvertimes.forEach((o) => {
    overtimeHours += Number(o.hours) || 0;
    if (String(o.status || '').toLowerCase() === 'pending') {
      pendingOvertimeCount += 1;
    }
  });

  // Sales Quota Attainment
  let targetSales = 0;
  let achievementSales = 0;
  let targetProfit = 0;
  let achievementProfit = 0;
  periodSalesTargets.forEach((s) => {
    targetSales += Number(s.targetSales) || 0;
    achievementSales += Number(s.achievementSales) || 0;
    targetProfit += Number(s.targetProfit) || 0;
    achievementProfit += Number(s.achievementProfit) || 0;
  });

  const totalBookings =
    periodTours.length +
    periodDocs.length +
    periodHotels.length +
    periodCruises.length +
    periodTelecoms.length;

  const operationalRevenue = tourOmset + corpRevenue + docRevenue;
  const grossProfitKnown = tourProfit + corpProfit;
  const marginDenominator = tourOmset + corpRevenue; // Exclude docRevenue where nett cost isn't tracked
  const grossMarginPct = calcPct(grossProfitKnown, marginDenominator);

  return {
    periodTours,
    periodDocs,
    periodHotels,
    periodCruises,
    periodTelecoms,
    periodCorpSales,
    periodProductivity,
    periodOvertimes,
    periodSalesTargets,
    totalBookings,
    totalPax: activeTourPax + cruisePax,
    activeToursCount,
    confirmedToursCount,
    pendingToursCount,
    cancelledToursCount,
    tourConfirmationRate: calcPct(confirmedToursCount, periodTours.length),
    tourCancellationRate: calcPct(cancelledToursCount, periodTours.length),
    avgDocTurnaroundDays: docCompletedWithDates > 0 ? docTotalTurnaroundDays / docCompletedWithDates : null,
    docTurnaroundSamples: docCompletedWithDates,
    docSlaComplianceRate: docSlaMeasured > 0 ? calcPct(docSlaOnTime, docSlaMeasured) : null,
    docSlaSamples: docSlaMeasured,
    tourOmset,
    tourNett,
    tourProfit,
    docRevenue,
    corpRevenue,
    corpProfit,
    operationalRevenue,
    grossProfitKnown,
    grossMarginPct,
    cancelledTourValue,
    avgTourOrderValue: activeToursCount > 0 ? tourOmset / activeToursCount : 0,
    revenuePerPax: activeTourPax > 0 ? tourOmset / activeTourPax : 0,
    prodSales,
    prodProfit,
    prodMarginPct: calcPct(prodProfit, prodSales),
    overtimeHours,
    pendingOvertimeCount,
    targetSales,
    achievementSales,
    targetProfit,
    achievementProfit,
    quotaAttainmentPct: targetSales > 0 ? calcPct(achievementSales, targetSales) : null
  };
};

/**
 * Main Enterprise BI Aggregation Engine
 * Pure function with zero side effects — produces all 3 BI Domains + deterministic anomaly signals.
 */
export const computeExecutiveBiAnalytics = ({
  tours = [],
  documents = [],
  hotels = [],
  cruises = [],
  telecoms = [],
  corporateAccounts = [],
  corporateSales = [],
  sales = [],
  productivityData = [],
  overtimes = [],
  periodPreset = 'this_quarter',
  scope = 'all',
  staffName = '',
  referenceDate = new Date()
} = {}) => {
  const today = parseDateSafe(referenceDate) || new Date();
  const windows = resolvePeriodWindows(periodPreset, today);

  const normUser = normalizeStaffName(staffName);
  const isPersonalScope = scope === 'mine' && Boolean(normUser);
  const matchStaff = (val) => !isPersonalScope || normalizeStaffName(val) === normUser;

  // Apply RBAC / Scope filtering cleanly
  const scopedTours = (tours || []).filter((t) => matchStaff(t.staffName));
  const scopedDocs = (documents || []).filter((d) => matchStaff(d.staff));
  const scopedHotels = (hotels || []).filter((h) => matchStaff(h.staff || h.staffName));
  const scopedCruises = (cruises || []).filter((c) => matchStaff(c.staff || c.staffName));
  const scopedTelecoms = (telecoms || []).filter((tc) => matchStaff(tc.staff || tc.picStaff));
  const scopedProductivity = (productivityData || []).filter((p) => matchStaff(p.staff));
  const scopedOvertimes = (overtimes || []).filter((o) => matchStaff(o.staff));
  const scopedSales = (sales || []).filter((s) => matchStaff(s.staffName));

  // Corporate ledger lacks per-staff owner field in current DB schema
  const includeCorporate = !isPersonalScope;
  const scopedCorpAccounts = includeCorporate ? (corporateAccounts || []) : [];
  const scopedCorpSales = includeCorporate ? (corporateSales || []) : [];

  const curr = aggregatePeriodMetrics({
    tours: scopedTours,
    documents: scopedDocs,
    hotels: scopedHotels,
    cruises: scopedCruises,
    telecoms: scopedTelecoms,
    corporateSales: scopedCorpSales,
    productivityData: scopedProductivity,
    overtimes: scopedOvertimes,
    sales: scopedSales,
    win: windows.current,
    includeCorporate
  });

  const prev = windows.previous
    ? aggregatePeriodMetrics({
        tours: scopedTours,
        documents: scopedDocs,
        hotels: scopedHotels,
        cruises: scopedCruises,
        telecoms: scopedTelecoms,
        corporateSales: scopedCorpSales,
        productivityData: scopedProductivity,
        overtimes: scopedOvertimes,
        sales: scopedSales,
        win: windows.previous,
        includeCorporate
      })
    : null;

  const deltaOrNull = (cVal, pVal, opts) => (prev ? computeDelta(cVal, pVal, opts) : null);

  // --- MONTHLY TIME SERIES (Last 6 or 12 months anchored on current window end or today) ---
  const monthsToPlot = periodPreset === 'this_year' || periodPreset === 'all_time' ? 12 : 6;
  const anchorDate = windows.current.end && periodPreset === 'this_year'
    ? new Date(today.getFullYear(), 11, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const monthBuckets = [];
  const monthMap = {};
  for (let i = monthsToPlot - 1; i >= 0; i -= 1) {
    const dt = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
    const key = toYmKey(dt);
    const row = {
      ym: key,
      label: formatMonthLabel(key),
      tours: 0,
      documents: 0,
      hotels: 0,
      cruises: 0,
      telecoms: 0,
      totalBookings: 0,
      tourRevenue: 0,
      corporateRevenue: 0,
      documentRevenue: 0,
      totalRevenue: 0,
      grossProfit: 0,
      marginPct: 0
    };
    monthBuckets.push(row);
    monthMap[key] = row;
  }

  scopedTours.forEach((t) => {
    const dt = resolveTourDate(t);
    const key = toYmKey(dt);
    if (!monthMap[key]) return;
    monthMap[key].tours += 1;
    monthMap[key].totalBookings += 1;
    if (!isCancelled(t.status)) {
      const fin = resolveTourFinancials(t);
      monthMap[key].tourRevenue += fin.omset;
      monthMap[key].totalRevenue += fin.omset;
      monthMap[key].grossProfit += fin.profit;
    }
  });

  scopedDocs.forEach((d) => {
    const dt = resolveDocDate(d);
    const key = toYmKey(dt);
    if (!monthMap[key]) return;
    monthMap[key].documents += 1;
    monthMap[key].totalBookings += 1;
    const price = Number(d.price) || 0;
    monthMap[key].documentRevenue += price;
    monthMap[key].totalRevenue += price;
  });

  scopedHotels.forEach((h) => {
    const key = toYmKey(parseDateSafe(h.checkIn || h.checkOut));
    if (!monthMap[key]) return;
    monthMap[key].hotels += 1;
    monthMap[key].totalBookings += 1;
  });

  scopedCruises.forEach((c) => {
    const key = toYmKey(parseDateSafe(c.sailingStart || c.sailingEnd));
    if (!monthMap[key]) return;
    monthMap[key].cruises += 1;
    monthMap[key].totalBookings += 1;
  });

  scopedTelecoms.forEach((tc) => {
    const key = toYmKey(parseDateSafe(tc.tanggalMulai || tc.tanggalSelesai));
    if (!monthMap[key]) return;
    monthMap[key].telecoms += 1;
    monthMap[key].totalBookings += 1;
  });

  scopedCorpSales.forEach((cs) => {
    const key = toYmKey(parseDateSafe(cs.date));
    if (!monthMap[key]) return;
    const sAmt = Number(cs.salesAmount) || 0;
    const pAmt = Number(cs.profitAmount) || 0;
    monthMap[key].corporateRevenue += sAmt;
    monthMap[key].totalRevenue += sAmt;
    monthMap[key].grossProfit += pAmt;
  });

  monthBuckets.forEach((b) => {
    const denom = b.tourRevenue + b.corporateRevenue;
    b.marginPct = Number(calcPct(b.grossProfit, denom).toFixed(1));
  });

  // --- OPERATIONAL ANALYTICS DETAILS ---
  const tourStatusMap = { Confirm: 0, Pending: 0, 'Past Date': 0, Cancel: 0 };
  curr.periodTours.forEach((t) => {
    if (isCancelled(t.status)) tourStatusMap.Cancel += 1;
    else if (t.status === 'Confirm') tourStatusMap.Confirm += 1;
    else if (t.status === 'Past Date') tourStatusMap['Past Date'] += 1;
    else tourStatusMap.Pending += 1;
  });
  const tourStatusBreakdown = [
    { status: 'Confirmed', count: tourStatusMap.Confirm, color: '#10b981' },
    { status: 'Pending', count: tourStatusMap.Pending, color: '#f59e0b' },
    { status: 'Past Date', count: tourStatusMap['Past Date'], color: '#0284c7' },
    { status: 'Cancelled', count: tourStatusMap.Cancel, color: '#e11d48' }
  ].filter((item) => item.count > 0);

  const docStatusMap = { Processing: 0, Sent: 0, Returned: 0, Received: 0 };
  let docOverdueCount = 0;
  curr.periodDocs.forEach((d) => {
    const st = d.shippingStatus || 'Processing';
    if (docStatusMap[st] !== undefined) docStatusMap[st] += 1;
    else docStatusMap.Processing += 1;

    if (st === 'Processing' && d.estimatedDone) {
      const est = parseDateSafe(d.estimatedDone);
      if (est && est < today) docOverdueCount += 1;
    }
  });
  const docPipelineBreakdown = Object.entries(docStatusMap).map(([status, count]) => ({
    status,
    count
  }));

  // Supplier & Vendor Performance (Tours + Hotels + Documents)
  const supplierAgg = {};
  const addSupplierStat = (name, module, revenue = 0) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (!supplierAgg[key]) {
      supplierAgg[key] = { name: clean, bookings: 0, revenue: 0, modules: new Set() };
    }
    supplierAgg[key].bookings += 1;
    supplierAgg[key].revenue += revenue;
    supplierAgg[key].modules.add(module);
  };

  curr.periodTours.forEach((t) => {
    if (isCancelled(t.status)) return;
    const sup = t.supplier || t.internals?.supplier || '';
    addSupplierStat(sup, 'Tour', resolveTourFinancials(t).omset);
  });
  curr.periodDocs.forEach((d) => addSupplierStat(d.supplier, 'Visa/Doc', Number(d.price) || 0));
  curr.periodHotels.forEach((h) => {
    if (!isCancelled(h.status)) addSupplierStat(h.supplierName || h.supplierCode, 'Hotel', 0);
  });

  const supplierPerformance = Object.values(supplierAgg)
    .map((s) => ({
      name: s.name,
      bookings: s.bookings,
      revenue: s.revenue,
      modules: Array.from(s.modules).join(', ')
    }))
    .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
    .slice(0, 10);

  // Team Operational Workload
  const workloadMap = {};
  const ensureStaff = (name) => {
    const clean = String(name || '').trim() || 'Unassigned';
    const key = clean.toLowerCase();
    if (!workloadMap[key]) {
      workloadMap[key] = {
        staff: clean,
        tours: 0,
        documents: 0,
        hotels: 0,
        cruises: 0,
        telecoms: 0,
        totalOps: 0,
        overtimeHours: 0,
        tourRevenue: 0
      };
    }
    return workloadMap[key];
  };
  curr.periodTours.forEach((t) => {
    const row = ensureStaff(t.staffName);
    row.tours += 1;
    row.totalOps += 1;
    if (!isCancelled(t.status)) row.tourRevenue += resolveTourFinancials(t).omset;
  });
  curr.periodDocs.forEach((d) => {
    const row = ensureStaff(d.staff);
    row.documents += 1;
    row.totalOps += 1;
  });
  curr.periodHotels.forEach((h) => {
    const row = ensureStaff(h.staff);
    row.hotels += 1;
    row.totalOps += 1;
  });
  curr.periodCruises.forEach((c) => {
    const row = ensureStaff(c.staff);
    row.cruises += 1;
    row.totalOps += 1;
  });
  curr.periodTelecoms.forEach((tc) => {
    const row = ensureStaff(tc.staff);
    row.telecoms += 1;
    row.totalOps += 1;
  });
  curr.periodOvertimes.forEach((o) => {
    const row = ensureStaff(o.staff);
    row.overtimeHours += Number(o.hours) || 0;
  });

  const teamWorkload = Object.values(workloadMap)
    .sort((a, b) => b.totalOps - a.totalOps || b.tourRevenue - a.tourRevenue)
    .slice(0, 12);

  // --- FINANCIAL ANALYTICS DETAILS ---
  // Live Accounts Receivable Snapshot (Active/Non-cancelled tours with sisaPelunasan > 0 across all open records)
  const agingBuckets = [
    { bucket: 'Urgent (<= H-7 / Lewat)', key: 'urgent', count: 0, amount: 0, color: '#e11d48' },
    { bucket: 'H-8 s/d H-14', key: 'soon', count: 0, amount: 0, color: '#f59e0b' },
    { bucket: 'H-15 s/d H-30', key: 'mid', count: 0, amount: 0, color: '#0284c7' },
    { bucket: '> H-30 / Belum Jadwal', key: 'later', count: 0, amount: 0, color: '#64748b' }
  ];
  let totalOutstandingReceivables = 0;
  let unpaidToursCount = 0;
  let urgentReceivablesAmount = 0;
  let urgentReceivablesCount = 0;

  scopedTours.forEach((t) => {
    if (isCancelled(t.status)) return;
    const fin = resolveTourFinancials(t);
    if (fin.sisa <= 0) return;

    totalOutstandingReceivables += fin.sisa;
    unpaidToursCount += 1;

    const dep = parseDateSafe(t.departureDate);
    const diffDays = dep ? Math.round((dep - today) / MS_PER_DAY) : 999;

    if (diffDays <= 7) {
      agingBuckets[0].count += 1;
      agingBuckets[0].amount += fin.sisa;
      urgentReceivablesAmount += fin.sisa;
      urgentReceivablesCount += 1;
    } else if (diffDays <= 14) {
      agingBuckets[1].count += 1;
      agingBuckets[1].amount += fin.sisa;
    } else if (diffDays <= 30) {
      agingBuckets[2].count += 1;
      agingBuckets[2].amount += fin.sisa;
    } else {
      agingBuckets[3].count += 1;
      agingBuckets[3].amount += fin.sisa;
    }
  });

  // Revenue Breakdown by Stream
  const schemeTotals = {
    Series: { scheme: 'Series', bookings: 0, cancelled: 0, pax: 0, omset: 0, profit: 0 },
    Incentive: { scheme: 'Incentive', bookings: 0, cancelled: 0, pax: 0, omset: 0, profit: 0 },
    Consortium: { scheme: 'Consortium', bookings: 0, cancelled: 0, pax: 0, omset: 0, profit: 0 }
  };
  curr.periodTours.forEach((t) => {
    const scheme = resolveTourScheme(t);
    const bucket = schemeTotals[scheme];
    if (isCancelled(t.status)) {
      bucket.cancelled += 1;
    } else {
      const fin = resolveTourFinancials(t);
      bucket.bookings += 1;
      bucket.pax += Math.max(0, Number(t.paxCount) || 1);
      bucket.omset += fin.omset;
      bucket.profit += fin.profit;
    }
  });

  const tourSchemePerformance = Object.values(schemeTotals).map((s) => ({
    ...s,
    marginPct: Number(calcPct(s.profit, s.omset).toFixed(1)),
    avgOrderValue: s.bookings > 0 ? Math.round(s.omset / s.bookings) : 0,
    cancelRatePct: Number(calcPct(s.cancelled, s.bookings + s.cancelled).toFixed(1))
  }));

  const revenueByStream = [
    { name: 'Tour Series', revenue: schemeTotals.Series.omset, profit: schemeTotals.Series.profit, color: '#0284c7' },
    { name: 'Tour Incentive', revenue: schemeTotals.Incentive.omset, profit: schemeTotals.Incentive.profit, color: '#0d9488' },
    { name: 'Tour Consortium', revenue: schemeTotals.Consortium.omset, profit: schemeTotals.Consortium.profit, color: '#4f46e5' },
    ...(includeCorporate
      ? [{ name: 'Corporate B2B', revenue: curr.corpRevenue, profit: curr.corpProfit, color: '#10b981' }]
      : []),
    { name: 'Visa & Dokumen', revenue: curr.docRevenue, profit: null, color: '#f59e0b' }
  ].filter((s) => s.revenue > 0);

  // Corporate Credit Limit Utilization & Retention (Agency scope)
  const corpSalesByCode = {};
  curr.periodCorpSales.forEach((cs) => {
    const code = String(cs.accountCode || '').trim().toUpperCase();
    if (!code) return;
    if (!corpSalesByCode[code]) {
      corpSalesByCode[code] = { sales: 0, profit: 0, txCount: 0 };
    }
    corpSalesByCode[code].sales += Number(cs.salesAmount) || 0;
    corpSalesByCode[code].profit += Number(cs.profitAmount) || 0;
    corpSalesByCode[code].txCount += 1;
  });

  let totalCorporateCreditLimit = 0;
  let activeCorporateAccountsCount = 0;
  let activeBillingAccountsCount = 0;
  let repeatCorporateAccountsCount = 0;
  const corporateCreditRisk = [];

  scopedCorpAccounts.forEach((acc) => {
    const isActive = String(acc.status || 'Active').toLowerCase() === 'active';
    const limit = Number(acc.creditLimit) || 0;
    const code = String(acc.accountCode || '').trim().toUpperCase();
    const stat = corpSalesByCode[code] || { sales: 0, profit: 0, txCount: 0 };

    if (isActive) {
      activeCorporateAccountsCount += 1;
      totalCorporateCreditLimit += limit;
      if (stat.txCount > 0) activeBillingAccountsCount += 1;
      if (stat.txCount >= 2) repeatCorporateAccountsCount += 1;
    }

    const utilizationPct = limit > 0 ? calcPct(stat.sales, limit) : 0;
    corporateCreditRisk.push({
      id: acc.id,
      accountCode: acc.accountCode || '-',
      companyName: acc.companyName || acc.corporateName || 'Corporate Client',
      status: acc.status || 'Active',
      creditLimit: limit,
      periodSales: stat.sales,
      periodProfit: stat.profit,
      txCount: stat.txCount,
      marginPct: Number(calcPct(stat.profit, stat.sales).toFixed(1)),
      utilizationPct: Number(utilizationPct.toFixed(1)),
      riskLevel: utilizationPct >= 100 ? 'exceeded' : utilizationPct >= 80 ? 'warning' : 'healthy'
    });
  });

  const sortedCorpBySales = [...corporateCreditRisk]
    .filter((c) => c.periodSales > 0)
    .sort((a, b) => b.periodSales - a.periodSales);
  const top3CorpRevenue = sortedCorpBySales.slice(0, 3).reduce((sum, c) => sum + c.periodSales, 0);
  const top3CorpSharePct = calcPct(top3CorpRevenue, curr.corpRevenue);
  const overLimitAccountsCount = corporateCreditRisk.filter((c) => c.utilizationPct >= 80).length;
  const dormantCorporateCount = Math.max(0, activeCorporateAccountsCount - activeBillingAccountsCount);

  // Productivity P&L by Category + Retail vs Corporate
  const prodCatMap = {};
  let prodRetailSales = 0;
  let prodRetailProfit = 0;
  let prodCorpSales = 0;
  let prodCorpProfit = 0;

  curr.periodProductivity.forEach((p) => {
    const cat = p.category || 'Other';
    if (!prodCatMap[cat]) prodCatMap[cat] = { category: cat, sales: 0, profit: 0, entries: 0 };
    prodCatMap[cat].sales += Number(p.salesAmount) || 0;
    prodCatMap[cat].profit += Number(p.profitAmount) || 0;
    prodCatMap[cat].entries += 1;

    if (p.type === 'Corporate') {
      prodCorpSales += Number(p.salesAmount) || 0;
      prodCorpProfit += Number(p.profitAmount) || 0;
    } else {
      prodRetailSales += Number(p.salesAmount) || 0;
      prodRetailProfit += Number(p.profitAmount) || 0;
    }
  });

  const productivityPnlByCategory = Object.values(prodCatMap)
    .map((c) => ({ ...c, marginPct: Number(calcPct(c.profit, c.sales).toFixed(1)) }))
    .sort((a, b) => b.sales - a.sales);

  // --- BUSINESS ANALYTICS DETAILS ---
  // Destination Profitability Matrix
  const destMap = {};
  curr.periodTours.forEach((t) => {
    const country = String(t.country || 'Lainnya').trim() || 'Lainnya';
    if (!destMap[country]) {
      destMap[country] = { country, bookings: 0, cancelled: 0, pax: 0, omset: 0, profit: 0 };
    }
    if (isCancelled(t.status)) {
      destMap[country].cancelled += 1;
    } else {
      const fin = resolveTourFinancials(t);
      destMap[country].bookings += 1;
      destMap[country].pax += Math.max(0, Number(t.paxCount) || 1);
      destMap[country].omset += fin.omset;
      destMap[country].profit += fin.profit;
    }
  });
  curr.periodDocs.forEach((d) => {
    const country = String(d.country || '').trim();
    if (!country) return;
    if (!destMap[country]) {
      destMap[country] = { country, bookings: 0, cancelled: 0, pax: 0, omset: 0, profit: 0, docCount: 0 };
    }
    destMap[country].docCount = (destMap[country].docCount || 0) + 1;
  });

  const destinationProfitability = Object.values(destMap)
    .map((d) => ({
      ...d,
      docCount: d.docCount || 0,
      marginPct: Number(calcPct(d.profit, d.omset).toFixed(1)),
      avgRevPerPax: d.pax > 0 ? Math.round(d.omset / d.pax) : 0,
      cancelRatePct: Number(calcPct(d.cancelled, d.bookings + d.cancelled).toFixed(1))
    }))
    .sort((a, b) => b.omset - a.omset || b.bookings - a.bookings)
    .slice(0, 12);

  // Calendar Seasonality (Jan..Dec across all historical active tours)
  const SEASON_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const seasonalTrend = SEASON_LABELS.map((month, idx) => ({
    month,
    monthIndex: idx,
    departures: 0,
    pax: 0,
    omset: 0
  }));
  scopedTours.forEach((t) => {
    if (isCancelled(t.status)) return;
    const dt = resolveTourDate(t);
    if (!dt) return;
    const mIdx = dt.getMonth();
    seasonalTrend[mIdx].departures += 1;
    seasonalTrend[mIdx].pax += Math.max(0, Number(t.paxCount) || 1);
    seasonalTrend[mIdx].omset += resolveTourFinancials(t).omset;
  });

  // Sales Quota Attainment Distribution by Staff
  const staffQuotaMap = {};
  curr.periodSalesTargets.forEach((s) => {
    const name = s.staffName || 'Unassigned';
    const key = name.toLowerCase();
    if (!staffQuotaMap[key]) {
      staffQuotaMap[key] = { staffName: name, targetSales: 0, achievementSales: 0, targetProfit: 0, achievementProfit: 0 };
    }
    staffQuotaMap[key].targetSales += Number(s.targetSales) || 0;
    staffQuotaMap[key].achievementSales += Number(s.achievementSales) || 0;
    staffQuotaMap[key].targetProfit += Number(s.targetProfit) || 0;
    staffQuotaMap[key].achievementProfit += Number(s.achievementProfit) || 0;
  });

  const quotaLeaderboard = Object.values(staffQuotaMap)
    .map((q) => {
      const attainmentPct = q.targetSales > 0 ? calcPct(q.achievementSales, q.targetSales) : 0;
      const tier = attainmentPct >= 100 ? 'achieved' : attainmentPct >= 70 ? 'on_track' : 'needs_coaching';
      return {
        ...q,
        attainmentPct: Number(attainmentPct.toFixed(1)),
        tier
      };
    })
    .sort((a, b) => b.attainmentPct - a.attainmentPct);

  const quotaTierSummary = {
    achieved: quotaLeaderboard.filter((q) => q.tier === 'achieved').length,
    onTrack: quotaLeaderboard.filter((q) => q.tier === 'on_track').length,
    needsCoaching: quotaLeaderboard.filter((q) => q.tier === 'needs_coaching').length
  };

  // --- DETERMINISTIC ANOMALY / RISK SIGNALS ---
  const deterministicSignals = [];
  if (urgentReceivablesAmount > 0) {
    deterministicSignals.push({
      id: 'sig-urgent-ar',
      severity: 'critical',
      domain: 'Financial',
      title: 'Piutang Pelunasan Tour Mendesak (<= H-7)',
      detail: `${urgentReceivablesCount} booking aktif belum lunas dengan total sisa Rp ${Math.round(urgentReceivablesAmount).toLocaleString('en-US')}.`,
      targetRoute: '/tours'
    });
  }
  if (docOverdueCount > 0) {
    deterministicSignals.push({
      id: 'sig-doc-overdue',
      severity: 'warning',
      domain: 'Operational',
      title: 'Dokumen / Visa Melewati Estimasi Selesai',
      detail: `${docOverdueCount} berkas berstatus Processing telah melewati tanggal estimasi selesai.`,
      targetRoute: '/documents'
    });
  }
  if (curr.periodTours.length >= 3 && curr.tourCancellationRate >= 15) {
    deterministicSignals.push({
      id: 'sig-cancel-rate',
      severity: 'warning',
      domain: 'Operational',
      title: 'Tingkat Pembatalan Tour Tinggi',
      detail: `Cancellation rate periode ini ${curr.tourCancellationRate.toFixed(1)}% (${curr.cancelledToursCount} dari ${curr.periodTours.length} booking).`,
      targetRoute: '/tours'
    });
  }
  const exceededCorp = corporateCreditRisk.filter((c) => c.riskLevel === 'exceeded');
  if (exceededCorp.length > 0) {
    deterministicSignals.push({
      id: 'sig-corp-limit',
      severity: 'critical',
      domain: 'Financial',
      title: 'Akun Corporate Melebihi Credit Limit',
      detail: `${exceededCorp.length} akun korporasi melampaui 100% plafon kredit pada periode ini.`,
      targetRoute: '/corporate'
    });
  }
  if (prev && curr.grossMarginPct > 0 && prev.grossMarginPct > 0 && (curr.grossMarginPct - prev.grossMarginPct) <= -2.0) {
    deterministicSignals.push({
      id: 'sig-margin-drop',
      severity: 'warning',
      domain: 'Financial',
      title: 'Kompresi Gross Margin Terdeteksi',
      detail: `Gross margin turun ${(curr.grossMarginPct - prev.grossMarginPct).toFixed(1)} pp dibanding ${windows.previous.label}.`,
      targetRoute: '/productivity'
    });
  }
  if (quotaTierSummary.needsCoaching > 0) {
    deterministicSignals.push({
      id: 'sig-quota-gap',
      severity: 'info',
      domain: 'Business',
      title: 'Konsultan di Bawah 70% Target Sales',
      detail: `${quotaTierSummary.needsCoaching} dari ${quotaLeaderboard.length} konsultan tercatat berada di bawah 70% pencapaian target.`,
      targetRoute: '/sales'
    });
  }

  // Transparently document unavailable metrics (never fabricate!)
  const unavailableMetrics = [
    'Operating Expenses (gaji, sewa kantor, biaya pemasaran) belum tersimpan di database sehingga Net Profit aktual tidak dihitung.',
    'Vendor Accounts Payable (hutang ke supplier non-tour / airline BSP) dan mutasi Cash Flow bank belum memiliki tabel transaksi khusus.',
    'Customer Acquisition Cost (CAC) dan repeat-booking Customer Lifetime Value (CLV) ritel belum tersedia karena tamu ritel belum memiliki unified Customer ID.'
  ];
  if (isPersonalScope) {
    unavailableMetrics.push(
      'Data penjualan & credit limit Corporate B2B tidak memiliki kolom pemilik staf, sehingga dikecualikan pada tampilan Portofolio Saya.'
    );
  }

  return {
    meta: {
      periodPreset,
      currentWindowLabel: windows.current.label,
      previousWindowLabel: windows.previous?.label || null,
      scope: isPersonalScope ? 'mine' : 'all',
      includeCorporate,
      generatedAt: today.toISOString(),
      totalRecordsAnalyzed:
        curr.periodTours.length +
        curr.periodDocs.length +
        curr.periodHotels.length +
        curr.periodCruises.length +
        curr.periodTelecoms.length +
        curr.periodCorpSales.length +
        curr.periodProductivity.length,
      unavailableMetrics
    },
    operational: {
      kpis: {
        totalBookings: {
          value: curr.totalBookings,
          delta: deltaOrNull(curr.totalBookings, prev?.totalBookings),
          breakdown: `${curr.periodTours.length} Tour · ${curr.periodDocs.length} Doc · ${curr.periodHotels.length} Hotel · ${curr.periodCruises.length} Cruise · ${curr.periodTelecoms.length} SIM`
        },
        totalPax: {
          value: curr.totalPax,
          delta: deltaOrNull(curr.totalPax, prev?.totalPax)
        },
        tourConfirmationRate: {
          value: curr.tourConfirmationRate,
          delta: deltaOrNull(curr.tourConfirmationRate, prev?.tourConfirmationRate, { isPoints: true }),
          confirmed: curr.confirmedToursCount,
          total: curr.periodTours.length
        },
        tourCancellationRate: {
          value: curr.tourCancellationRate,
          delta: deltaOrNull(curr.tourCancellationRate, prev?.tourCancellationRate, { isPoints: true }),
          cancelled: curr.cancelledToursCount,
          total: curr.periodTours.length
        },
        avgDocTurnaroundDays: {
          value: curr.avgDocTurnaroundDays,
          samples: curr.docTurnaroundSamples,
          slaRate: curr.docSlaComplianceRate,
          slaSamples: curr.docSlaSamples,
          overdueCount: docOverdueCount
        },
        overtimeHours: {
          value: curr.overtimeHours,
          delta: deltaOrNull(curr.overtimeHours, prev?.overtimeHours),
          pendingCount: curr.pendingOvertimeCount
        }
      },
      monthlyBookingTrend: monthBuckets,
      tourStatusBreakdown,
      docPipelineBreakdown,
      supplierPerformance,
      teamWorkload
    },
    financial: {
      kpis: {
        operationalRevenue: {
          value: curr.operationalRevenue,
          delta: deltaOrNull(curr.operationalRevenue, prev?.operationalRevenue),
          tourOmset: curr.tourOmset,
          corpRevenue: curr.corpRevenue,
          docRevenue: curr.docRevenue
        },
        grossProfit: {
          value: curr.grossProfitKnown,
          delta: deltaOrNull(curr.grossProfitKnown, prev?.grossProfitKnown),
          marginPct: curr.grossMarginPct,
          marginDelta: deltaOrNull(curr.grossMarginPct, prev?.grossMarginPct, { isPoints: true })
        },
        outstandingReceivables: {
          value: totalOutstandingReceivables,
          unpaidCount: unpaidToursCount,
          urgentAmount: urgentReceivablesAmount,
          urgentCount: urgentReceivablesCount
        },
        cancelledBookingValue: {
          value: curr.cancelledTourValue,
          delta: deltaOrNull(curr.cancelledTourValue, prev?.cancelledTourValue),
          cancelledCount: curr.cancelledToursCount
        },
        productivityLedger: {
          sales: curr.prodSales,
          profit: curr.prodProfit,
          marginPct: curr.prodMarginPct,
          delta: deltaOrNull(curr.prodSales, prev?.prodSales)
        },
        corporateCredit: {
          totalLimit: totalCorporateCreditLimit,
          periodSales: curr.corpRevenue,
          utilizationPct: calcPct(curr.corpRevenue, totalCorporateCreditLimit),
          overLimitCount: overLimitAccountsCount
        }
      },
      monthlyFinancialTrend: monthBuckets,
      receivablesAging: agingBuckets,
      revenueByStream,
      corporateCreditRisk: corporateCreditRisk
        .sort((a, b) => b.utilizationPct - a.utilizationPct || b.periodSales - a.periodSales)
        .slice(0, 10),
      productivityPnlByCategory,
      channelSplit: [
        { channel: 'Retail', sales: prodRetailSales, profit: prodRetailProfit, marginPct: Number(calcPct(prodRetailProfit, prodRetailSales).toFixed(1)) },
        { channel: 'Corporate', sales: prodCorpSales, profit: prodCorpProfit, marginPct: Number(calcPct(prodCorpProfit, prodCorpSales).toFixed(1)) }
      ].filter((c) => c.sales > 0 || c.profit > 0)
    },
    business: {
      kpis: {
        revenueGrowth: deltaOrNull(curr.operationalRevenue, prev?.operationalRevenue),
        profitGrowth: deltaOrNull(curr.grossProfitKnown, prev?.grossProfitKnown),
        avgTourOrderValue: {
          value: curr.avgTourOrderValue,
          delta: deltaOrNull(curr.avgTourOrderValue, prev?.avgTourOrderValue),
          revenuePerPax: curr.revenuePerPax
        },
        quotaAttainment: {
          value: curr.quotaAttainmentPct,
          targetSales: curr.targetSales,
          achievementSales: curr.achievementSales,
          tiers: quotaTierSummary,
          totalConsultants: quotaLeaderboard.length
        },
        corporateRetention: {
          activeAccounts: activeCorporateAccountsCount,
          billingAccounts: activeBillingAccountsCount,
          activeBillingRatePct: calcPct(activeBillingAccountsCount, activeCorporateAccountsCount),
          repeatAccounts: repeatCorporateAccountsCount,
          dormantAccounts: dormantCorporateCount,
          top3SharePct: top3CorpSharePct
        }
      },
      tourSchemePerformance,
      destinationProfitability,
      seasonalTrend,
      quotaLeaderboard: quotaLeaderboard.slice(0, 12),
      topCorporateAccounts: sortedCorpBySales.slice(0, 8)
    },
    signals: deterministicSignals
  };
};
