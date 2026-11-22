import { formatMonthLabel } from './formatters.js';
import { shiftYearMonth } from './staffPerformanceEngine.js';

export const parseDigitsInput = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return 0;
  const digits = String(raw).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

export const getRecordMonth = (dateStr) => {
  if (!dateStr) return '';
  return String(dateStr).trim().slice(0, 7);
};

export const enrichProductivityRecords = (records = []) => {
  return (records || []).map((r) => {
    const sales = Number(r.salesAmount) || 0;
    const profit = Number(r.profitAmount) || 0;
    const marginPct = sales > 0 ? Number(((profit / sales) * 100).toFixed(2)) : 0;
    const ym = getRecordMonth(r.date);
    return {
      ...r,
      salesAmount: sales,
      profitAmount: profit,
      marginPct,
      yearMonth: ym,
      periodLabel: formatMonthLabel(ym)
    };
  });
};

export const computeProductivityOverview = (filteredData = [], categories = []) => {
  let totalSales = 0;
  let totalProfit = 0;
  let retailSales = 0;
  let retailProfit = 0;
  let corpSales = 0;
  let corpProfit = 0;
  let flightSales = 0;
  let hotelSales = 0;

  const catMap = {};
  categories.forEach((c) => {
    catMap[c] = { name: c, Sales: 0, Profit: 0, count: 0, marginPct: 0 };
  });

  const monthMap = {};
  const staffMap = {};

  filteredData.forEach((r) => {
    totalSales += r.salesAmount;
    totalProfit += r.profitAmount;

    if (r.type === 'Corporate') {
      corpSales += r.salesAmount;
      corpProfit += r.profitAmount;
    } else {
      retailSales += r.salesAmount;
      retailProfit += r.profitAmount;
    }

    if (r.category === 'Flight') flightSales += r.salesAmount;
    if (r.category === 'Hotel') hotelSales += r.salesAmount;

    const catKey = catMap[r.category] ? r.category : 'Other';
    if (!catMap[catKey]) {
      catMap[catKey] = { name: catKey, Sales: 0, Profit: 0, count: 0, marginPct: 0 };
    }
    catMap[catKey].Sales += r.salesAmount;
    catMap[catKey].Profit += r.profitAmount;
    catMap[catKey].count += 1;

    if (r.yearMonth) {
      if (!monthMap[r.yearMonth]) {
        monthMap[r.yearMonth] = {
          ym: r.yearMonth,
          label: formatMonthLabel(r.yearMonth),
          Sales: 0,
          Profit: 0,
          count: 0
        };
      }
      monthMap[r.yearMonth].Sales += r.salesAmount;
      monthMap[r.yearMonth].Profit += r.profitAmount;
      monthMap[r.yearMonth].count += 1;
    }

    const staffKey = r.staff || 'Unassigned';
    if (!staffMap[staffKey]) {
      staffMap[staffKey] = {
        name: staffKey,
        Sales: 0,
        Profit: 0,
        count: 0,
        RetailProfit: 0,
        CorporateProfit: 0
      };
    }
    staffMap[staffKey].Sales += r.salesAmount;
    staffMap[staffKey].Profit += r.profitAmount;
    staffMap[staffKey].count += 1;
    if (r.type === 'Corporate') {
      staffMap[staffKey].CorporateProfit += r.profitAmount;
    } else {
      staffMap[staffKey].RetailProfit += r.profitAmount;
    }
  });

  const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const crossSellRate = flightSales > 0 ? (hotelSales / flightSales) * 100 : 0;
  const retailSharePct = totalProfit > 0 ? (retailProfit / totalProfit) * 100 : 0;

  const categoryChartData = Object.values(catMap)
    .map((c) => ({
      ...c,
      marginPct: c.Sales > 0 ? Number(((c.Profit / c.Sales) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.Sales - a.Sales);

  const topCategory = categoryChartData.find((c) => c.Profit > 0 || c.Sales > 0) || null;

  const monthlyTrendData = Object.values(monthMap)
    .sort((a, b) => a.ym.localeCompare(b.ym))
    .slice(-12)
    .map((m) => ({
      ...m,
      marginPct: m.Sales > 0 ? Number(((m.Profit / m.Sales) * 100).toFixed(2)) : 0
    }));

  const consultantLeaderboard = Object.values(staffMap)
    .map((s) => ({
      ...s,
      marginPct: s.Sales > 0 ? Number(((s.Profit / s.Sales) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.Profit - a.Profit);

  return {
    totalSales,
    totalProfit,
    overallMargin,
    retailSales,
    retailProfit,
    corpSales,
    corpProfit,
    retailSharePct,
    crossSellRate,
    topCategory,
    categoryChartData,
    monthlyTrendData,
    consultantLeaderboard,
    recordCount: filteredData.length
  };
};

export const computeComparisonPresetDates = (preset, baseYm, fallbackYear = new Date().getFullYear()) => {
  if (preset === 'MoM') {
    const prev = shiftYearMonth(baseYm, -1);
    return { p1Start: baseYm, p1End: baseYm, p2Start: prev, p2End: prev };
  }
  if (preset === 'QoQ') {
    return {
      p1Start: shiftYearMonth(baseYm, -2),
      p1End: baseYm,
      p2Start: shiftYearMonth(baseYm, -5),
      p2End: shiftYearMonth(baseYm, -3)
    };
  }
  if (preset === 'YoY') {
    const prevYr = shiftYearMonth(baseYm, -12);
    return { p1Start: baseYm, p1End: baseYm, p2Start: prevYr, p2End: prevYr };
  }
  if (preset === 'YTD') {
    const yr = Number(baseYm.slice(0, 4)) || fallbackYear;
    const mPart = baseYm.slice(5, 7) || '01';
    return {
      p1Start: `${yr}-01`,
      p1End: `${yr}-${mPart}`,
      p2Start: `${yr - 1}-01`,
      p2End: `${yr - 1}-${mPart}`
    };
  }
  return { p1Start: baseYm, p1End: baseYm, p2Start: baseYm, p2End: baseYm };
};

export const computeProductivityComparison = ({
  staffScopedRecords = [],
  categories = [],
  compP1Start,
  compP1End,
  compP2Start,
  compP2End,
  selectedTypeFilter = 'All'
}) => {
  const p1S = compP1Start <= compP1End ? compP1Start : compP1End;
  const p1E = compP1Start <= compP1End ? compP1End : compP1Start;
  const p2S = compP2Start <= compP2End ? compP2Start : compP2End;
  const p2E = compP2Start <= compP2End ? compP2End : compP2Start;

  const dataP1 = staffScopedRecords.filter(
    (r) =>
      r.yearMonth >= p1S &&
      r.yearMonth <= p1E &&
      (selectedTypeFilter === 'All' || r.type === selectedTypeFilter)
  );
  const dataP2 = staffScopedRecords.filter(
    (r) =>
      r.yearMonth >= p2S &&
      r.yearMonth <= p2E &&
      (selectedTypeFilter === 'All' || r.type === selectedTypeFilter)
  );

  const typeMap = {};
  const periodMap = {};
  categories.forEach((c) => {
    typeMap[c] = { name: c, RetailSales: 0, CorporateSales: 0, RetailProfit: 0, CorporateProfit: 0 };
    periodMap[c] = { name: c, P1Sales: 0, P2Sales: 0, P1Profit: 0, P2Profit: 0 };
  });

  const dataP1AllSegments = staffScopedRecords.filter(
    (r) => r.yearMonth >= p1S && r.yearMonth <= p1E
  );
  dataP1AllSegments.forEach((r) => {
    const key = typeMap[r.category] ? r.category : 'Other';
    if (!typeMap[key]) {
      typeMap[key] = { name: key, RetailSales: 0, CorporateSales: 0, RetailProfit: 0, CorporateProfit: 0 };
    }
    if (r.type === 'Corporate') {
      typeMap[key].CorporateSales += r.salesAmount;
      typeMap[key].CorporateProfit += r.profitAmount;
    } else {
      typeMap[key].RetailSales += r.salesAmount;
      typeMap[key].RetailProfit += r.profitAmount;
    }
  });

  let p1SalesTotal = 0;
  let p1ProfitTotal = 0;
  let p2SalesTotal = 0;
  let p2ProfitTotal = 0;
  let p1Flight = 0;
  let p1Hotel = 0;

  dataP1.forEach((r) => {
    const key = periodMap[r.category] ? r.category : 'Other';
    if (!periodMap[key]) {
      periodMap[key] = { name: key, P1Sales: 0, P2Sales: 0, P1Profit: 0, P2Profit: 0 };
    }
    periodMap[key].P1Sales += r.salesAmount;
    periodMap[key].P1Profit += r.profitAmount;
    p1SalesTotal += r.salesAmount;
    p1ProfitTotal += r.profitAmount;
    if (r.category === 'Flight') p1Flight += r.salesAmount;
    if (r.category === 'Hotel') p1Hotel += r.salesAmount;
  });

  dataP2.forEach((r) => {
    const key = periodMap[r.category] ? r.category : 'Other';
    if (!periodMap[key]) {
      periodMap[key] = { name: key, P1Sales: 0, P2Sales: 0, P1Profit: 0, P2Profit: 0 };
    }
    periodMap[key].P2Sales += r.salesAmount;
    periodMap[key].P2Profit += r.profitAmount;
    p2SalesTotal += r.salesAmount;
    p2ProfitTotal += r.profitAmount;
  });

  const p1Margin = p1SalesTotal > 0 ? (p1ProfitTotal / p1SalesTotal) * 100 : 0;
  const p2Margin = p2SalesTotal > 0 ? (p2ProfitTotal / p2SalesTotal) * 100 : 0;

  return {
    compTypeData: Object.values(typeMap),
    compPeriodData: Object.values(periodMap),
    p1SalesTotal,
    p1ProfitTotal,
    p2SalesTotal,
    p2ProfitTotal,
    p1Margin,
    p2Margin,
    salesGrowthPct: p2SalesTotal > 0 ? ((p1SalesTotal - p2SalesTotal) / p2SalesTotal) * 100 : null,
    profitGrowthPct: p2ProfitTotal > 0 ? ((p1ProfitTotal - p2ProfitTotal) / p2ProfitTotal) * 100 : null,
    marginShiftPts: p1Margin - p2Margin,
    p1CrossSell: p1Flight > 0 ? (p1Hotel / p1Flight) * 100 : 0,
    p1Count: dataP1.length,
    p2Count: dataP2.length
  };
};

export const computeManagementPnlReport = (filteredData = [], categories = [], types = ['Retail', 'Corporate']) => {
  const rows = [];
  const grandSales = filteredData.reduce((s, r) => s + r.salesAmount, 0);
  const grandProfit = filteredData.reduce((s, r) => s + r.profitAmount, 0);

  categories.forEach((cat) => {
    types.forEach((type) => {
      const subset = filteredData.filter((r) => r.category === cat && r.type === type);
      if (subset.length === 0) return;
      const sales = subset.reduce((s, r) => s + r.salesAmount, 0);
      const profit = subset.reduce((s, r) => s + r.profitAmount, 0);
      if (sales === 0 && profit === 0) return;

      rows.push({
        category: cat,
        type,
        count: subset.length,
        sales,
        profit,
        margin: sales > 0 ? Number(((profit / sales) * 100).toFixed(2)) : 0,
        revenueShare: grandSales > 0 ? Number(((sales / grandSales) * 100).toFixed(1)) : 0,
        isTotal: false
      });
    });
  });

  rows.sort((a, b) => b.sales - a.sales);

  if (rows.length > 0) {
    rows.push({
      category: 'GRAND TOTAL',
      type: 'All Segments',
      count: filteredData.length,
      sales: grandSales,
      profit: grandProfit,
      margin: grandSales > 0 ? Number(((grandProfit / grandSales) * 100).toFixed(2)) : 0,
      revenueShare: 100,
      isTotal: true
    });
  }

  return rows;
};
