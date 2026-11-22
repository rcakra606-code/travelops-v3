import { BI_CHART_COLORS, formatMonthLabel } from './formatters.js';

export const normName = (val) => String(val || '').trim().toLowerCase();

export const isSameStaff = (a, b) => {
  if (!a || !b) return false;
  return normName(a) === normName(b);
};

export const isCancelledTour = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'cancel' || s === 'cancelled' || s === 'canceled';
};

export const getYearMonth = (rawDate) => {
  if (!rawDate) return '';
  const trimmed = String(rawDate).trim();
  const ym = trimmed.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(ym) ? ym : '';
};

export const shiftYearMonth = (ym, delta) => {
  const [yStr, mStr] = String(ym || '').split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = (Number(mStr) || 1) - 1;
  const d = new Date(y, m + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const resolveHorizonRange = ({
  horizonMode = 'all',
  selectedMonth = '',
  selectedQuarter = 1,
  selectedYear = new Date().getFullYear(),
  customStartMonth = '',
  customEndMonth = ''
}) => {
  if (horizonMode === 'all') {
    return { start: null, end: null, label: 'All Time' };
  }
  if (horizonMode === 'month') {
    return {
      start: selectedMonth,
      end: selectedMonth,
      label: formatMonthLabel(selectedMonth)
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
    label: `${formatMonthLabel(s)} – ${formatMonthLabel(e)}`
  };
};

export const matchesHorizonRange = (rawDate, periodRange) => {
  if (!periodRange || !periodRange.start || !periodRange.end) return true;
  const ym = getYearMonth(rawDate);
  if (!ym) return false;
  return ym >= periodRange.start && ym <= periodRange.end;
};

/**
 * Canonical staff roster combining active non-admin users + staff names in records
 * while excluding inactivated and admin accounts.
 */
export const buildStaffRoster = ({
  users = [],
  sales = [],
  productivityData = [],
  tours = [],
  cruises = [],
  hotels = [],
  documents = [],
  telecoms = [],
  overtimes = [],
  currentUser = null
}) => {
  const map = new Map();
  const inactiveNames = new Set(
    (users || [])
      .filter((u) => u.status === 'Inactive' && u.name)
      .map((u) => normName(u.name))
  );
  const adminNames = new Set(
    (users || [])
      .filter((u) => (u.role || '').toLowerCase() === 'admin' && u.name)
      .map((u) => normName(u.name))
  );

  (users || [])
    .filter((u) => u.status === 'Active' && u.name && (u.role || '').toLowerCase() !== 'admin')
    .forEach((u) => {
      map.set(normName(u.name), u.name.trim());
    });

  const register = (raw) => {
    const clean = String(raw || '').trim();
    if (!clean || clean.toLowerCase() === 'unassigned') return;
    const normalized = normName(clean);
    if (inactiveNames.has(normalized) || adminNames.has(normalized)) return;
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
  if (currentUser?.name && (currentUser.role || '').toLowerCase() !== 'admin') {
    register(currentUser.name);
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
};

/**
 * 1. Team Leaderboard & 360° Consultant Scorecards
 */
export const computeConsultantScorecards = ({
  staffRoster = [],
  sales = [],
  productivityData = [],
  tours = [],
  cruises = [],
  hotels = [],
  documents = [],
  telecoms = [],
  overtimes = [],
  periodRange,
  staffNameFilter = 'All'
}) => {
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
    if (!matchesHorizonRange(s.period, periodRange)) return;
    const c = ensureCard(s.staffName);
    if (!c) return;
    c.targetSales += Number(s.targetSales) || 0;
    c.targetProfit += Number(s.targetProfit) || 0;
    c.actualSales += Number(s.achievementSales) || 0;
    c.actualProfit += Number(s.achievementProfit) || 0;
  });

  (productivityData || []).forEach((p) => {
    if (!matchesHorizonRange(p.date, periodRange)) return;
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
    if (!matchesHorizonRange(tDate, periodRange)) return;
    if (isCancelledTour(t.status)) return;
    const tStaff = t.staffName || t.internals?.staffName || t.pic || '';
    const c = ensureCard(tStaff);
    if (!c) return;
    c.toursCount += 1;
    c.toursPax += Number(t.paxCount) || 0;
    c.toursOmset += Number(t.totalOmset ?? t.financials?.totalOmset ?? t.financials?.totalSellingPrice) || 0;
    c.toursProfit += Number(t.financials?.profit) || 0;
  });

  (cruises || []).forEach((cr) => {
    if (!matchesHorizonRange(cr.sailingStart, periodRange)) return;
    if (isCancelledTour(cr.status)) return;
    const c = ensureCard(cr.staff);
    if (!c) return;
    c.cruisesCount += 1;
    c.cruisesPax += Number(cr.paxCount) || 0;
  });

  (hotels || []).forEach((h) => {
    if (!matchesHorizonRange(h.checkIn, periodRange)) return;
    if (isCancelledTour(h.status)) return;
    const c = ensureCard(h.staff);
    if (!c) return;
    c.hotelsCount += 1;
  });

  (documents || []).forEach((d) => {
    if (!matchesHorizonRange(d.receiveDate, periodRange)) return;
    const c = ensureCard(d.staff);
    if (!c) return;
    c.docsCount += 1;
    c.docsRevenue += Number(d.price) || 0;
  });

  (telecoms || []).forEach((tel) => {
    if (!matchesHorizonRange(tel.tanggalMulai, periodRange)) return;
    const c = ensureCard(tel.staff);
    if (!c) return;
    c.telecomsCount += 1;
  });

  (overtimes || []).forEach((o) => {
    if (!matchesHorizonRange(o.date, periodRange)) return;
    const c = ensureCard(o.staff);
    if (!c) return;
    const hrs = Number(o.hours) || 0;
    if (o.status === 'Approved') c.overtimeApprovedHrs += hrs;
    else if (o.status === 'Pending') c.overtimePendingHrs += hrs;
  });

  return Array.from(cardsMap.values())
    .filter((c) => staffNameFilter === 'All' || isSameStaff(c.staffName, staffNameFilter))
    .map((c) => {
      const salesQuotaPct =
        c.targetSales > 0 ? Number(((c.actualSales / c.targetSales) * 100).toFixed(1)) : 0;
      const profitQuotaPct =
        c.targetProfit > 0 ? Number(((c.actualProfit / c.targetProfit) * 100).toFixed(1)) : 0;
      const prodMarginPct =
        c.prodSales > 0 ? Number(((c.prodProfit / c.prodSales) * 100).toFixed(2)) : 0;
      const crossSellPct =
        c.flightSales > 0 ? Number(((c.hotelSales / c.flightSales) * 100).toFixed(1)) : 0;
      const totalOpsFiles =
        c.toursCount + c.cruisesCount + c.hotelsCount + c.docsCount + c.telecomsCount;
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
      if (b.effectiveProfit !== a.effectiveProfit) return b.effectiveProfit - a.effectiveProfit;
      if (b.salesQuotaPct !== a.salesQuotaPct) return b.salesQuotaPct - a.salesQuotaPct;
      return b.totalOpsFiles - a.totalOpsFiles;
    });
};

/**
 * 2. Target vs Achievement Analytics
 */
export const computeSalesQuotaAnalytics = ({
  sales = [],
  periodRange,
  staffNameFilter = 'All'
}) => {
  const filtered = (sales || []).filter(
    (s) =>
      (staffNameFilter === 'All' || isSameStaff(s.staffName, staffNameFilter)) &&
      matchesHorizonRange(s.period, periodRange)
  );

  let targetSales = 0;
  let targetProfit = 0;
  let achievementSales = 0;
  let achievementProfit = 0;
  const chartMap = {};
  const groupByStaff = staffNameFilter === 'All';

  filtered.forEach((s) => {
    const ts = Number(s.targetSales) || 0;
    const tp = Number(s.targetProfit) || 0;
    const as = Number(s.achievementSales) || 0;
    const ap = Number(s.achievementProfit) || 0;
    targetSales += ts;
    targetProfit += tp;
    achievementSales += as;
    achievementProfit += ap;

    const rawKey = groupByStaff ? s.staffName || 'Unknown' : s.period || 'Unknown';
    const key = groupByStaff ? normName(rawKey) : rawKey;
    if (!chartMap[key]) {
      chartMap[key] = {
        sortKey: rawKey,
        name: groupByStaff ? rawKey : formatMonthLabel(rawKey),
        targetSales: 0,
        achievementSales: 0,
        targetProfit: 0,
        achievementProfit: 0
      };
    }
    chartMap[key].targetSales += ts;
    chartMap[key].achievementSales += as;
    chartMap[key].targetProfit += tp;
    chartMap[key].achievementProfit += ap;
  });

  const salesRate = targetSales > 0 ? Number(((achievementSales / targetSales) * 100).toFixed(1)) : 0;
  const profitRate = targetProfit > 0 ? Number(((achievementProfit / targetProfit) * 100).toFixed(1)) : 0;

  const chartData = Object.values(chartMap).sort((a, b) =>
    groupByStaff ? b.achievementSales - a.achievementSales : a.sortKey.localeCompare(b.sortKey)
  );

  return {
    metrics: {
      targetSales,
      targetProfit,
      achievementSales,
      achievementProfit,
      salesRate,
      profitRate,
      salesVariance: achievementSales - targetSales,
      profitVariance: achievementProfit - targetProfit
    },
    chartData
  };
};

/**
 * 3. Productivity & Cross-Sell Breakdown
 */
export const computeStaffProductivityBreakdown = ({
  productivityData = [],
  categories = [],
  periodRange,
  staffNameFilter = 'All'
}) => {
  const filtered = (productivityData || []).filter(
    (p) =>
      (staffNameFilter === 'All' || isSameStaff(p.staff, staffNameFilter)) &&
      matchesHorizonRange(p.date, periodRange)
  );

  const map = {};
  categories.forEach((c) => {
    map[c] = {
      name: c,
      retailSales: 0,
      retailProfit: 0,
      corpSales: 0,
      corpProfit: 0,
      entries: 0
    };
  });

  filtered.forEach((p) => {
    const cat = map[p.category] ? p.category : 'Other';
    if (!map[cat]) {
      map[cat] = { name: cat, retailSales: 0, retailProfit: 0, corpSales: 0, corpProfit: 0, entries: 0 };
    }
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

  const grandSales = Object.values(map).reduce((sum, r) => sum + r.retailSales + r.corpSales, 0);
  const grandProfit = Object.values(map).reduce((sum, r) => sum + r.retailProfit + r.corpProfit, 0);

  const rows = Object.values(map)
    .filter((m) => m.retailSales > 0 || m.corpSales > 0 || m.retailProfit > 0 || m.corpProfit > 0)
    .map((m) => {
      const totalSales = m.retailSales + m.corpSales;
      const totalProfit = m.retailProfit + m.corpProfit;
      return {
        ...m,
        totalSales,
        totalProfit,
        retailMargin: m.retailSales > 0 ? Number(((m.retailProfit / m.retailSales) * 100).toFixed(1)) : 0,
        corpMargin: m.corpSales > 0 ? Number(((m.corpProfit / m.corpSales) * 100).toFixed(1)) : 0,
        totalMargin: totalSales > 0 ? Number(((totalProfit / totalSales) * 100).toFixed(1)) : 0,
        salesSharePct: grandSales > 0 ? Number(((totalSales / grandSales) * 100).toFixed(1)) : 0
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const flight = map.Flight || { retailSales: 0, corpSales: 0 };
  const hotel = map.Hotel || { retailSales: 0, corpSales: 0 };
  const totalFlight = flight.retailSales + flight.corpSales;
  const totalHotel = hotel.retailSales + hotel.corpSales;

  return {
    filteredRecords: filtered,
    rows,
    grandSales,
    grandProfit,
    grandMargin: grandSales > 0 ? Number(((grandProfit / grandSales) * 100).toFixed(2)) : 0,
    retailCrossSell: flight.retailSales > 0 ? Number(((hotel.retailSales / flight.retailSales) * 100).toFixed(1)) : 0,
    corpCrossSell: flight.corpSales > 0 ? Number(((hotel.corpSales / flight.corpSales) * 100).toFixed(1)) : 0,
    blendedCrossSell: totalFlight > 0 ? Number(((totalHotel / totalFlight) * 100).toFixed(1)) : 0
  };
};

/**
 * 4. 360° Operations Workload (Tours, Cruises, Hotels, Docs, Telecom, Overtime)
 */
export const computeStaffOperationsAnalytics = ({
  tours = [],
  cruises = [],
  hotels = [],
  documents = [],
  telecoms = [],
  overtimes = [],
  periodRange,
  staffNameFilter = 'All'
}) => {
  const matchStaff = (s) => staffNameFilter === 'All' || isSameStaff(s, staffNameFilter);

  const staffTours = (tours || []).filter((t) => {
    const tStaff = t.staffName || t.internals?.staffName || t.pic || '';
    const tDate = t.departureDate || t.internals?.bookingDate || '';
    return matchStaff(tStaff) && matchesHorizonRange(tDate, periodRange);
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
    const omset = Number(t.totalOmset ?? t.financials?.totalOmset ?? t.financials?.totalSellingPrice) || 0;
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

  const statusData = [
    { name: 'Confirmed', value: statusCounts.Confirm, color: BI_CHART_COLORS.emerald },
    { name: 'Completed (Past)', value: statusCounts['Past Date'], color: BI_CHART_COLORS.primary },
    { name: 'Pending', value: statusCounts.Pending, color: BI_CHART_COLORS.amber },
    { name: 'Cancelled', value: statusCounts.Cancel, color: BI_CHART_COLORS.rose }
  ].filter((s) => s.value > 0);

  const topDestinations = Object.values(destMap)
    .sort((a, b) => b.pax - a.pax)
    .slice(0, 6);

  const staffCruises = (cruises || []).filter(
    (c) => matchStaff(c.staff) && matchesHorizonRange(c.sailingStart, periodRange) && !isCancelledTour(c.status)
  );
  const cruisePax = staffCruises.reduce((s, c) => s + (Number(c.paxCount) || 0), 0);

  const staffHotels = (hotels || []).filter(
    (h) => matchStaff(h.staff) && matchesHorizonRange(h.checkIn, periodRange) && !isCancelledTour(h.status)
  );

  const staffDocs = (documents || []).filter(
    (d) => matchStaff(d.staff) && matchesHorizonRange(d.receiveDate, periodRange)
  );
  const docsFeeVolume = staffDocs.reduce((s, d) => s + (Number(d.price) || 0), 0);
  const expressDocsCount = staffDocs.filter(
    (d) => String(d.processType || '').toLowerCase() !== 'normal'
  ).length;

  const staffTelecoms = (telecoms || []).filter(
    (t) => matchStaff(t.staff) && matchesHorizonRange(t.tanggalMulai, periodRange)
  );
  const esimCount = staffTelecoms.filter((t) =>
    String(t.typeProduct || '').toLowerCase().includes('esim')
  ).length;

  const staffOvertimes = (overtimes || []).filter(
    (o) => matchStaff(o.staff) && matchesHorizonRange(o.date, periodRange)
  );
  let approvedOtHours = 0;
  let pendingOtHours = 0;
  staffOvertimes.forEach((o) => {
    const hrs = Number(o.hours) || 0;
    if (o.status === 'Approved') approvedOtHours += hrs;
    else if (o.status === 'Pending') pendingOtHours += hrs;
  });

  return {
    totalTourRecords: staffTours.length,
    activeTourCount,
    cancelledTourCount,
    tourCancelRate: staffTours.length > 0 ? Number(((cancelledTourCount / staffTours.length) * 100).toFixed(1)) : 0,
    activeTourPax,
    activeTourOmset,
    activeTourProfit,
    tourMargin: activeTourOmset > 0 ? Number(((activeTourProfit / activeTourOmset) * 100).toFixed(1)) : 0,
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
    totalOpsHandled: activeTourCount + staffCruises.length + staffHotels.length + staffDocs.length + staffTelecoms.length
  };
};
