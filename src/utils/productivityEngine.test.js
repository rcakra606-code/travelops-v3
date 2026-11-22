import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDigitsInput,
  enrichProductivityRecords,
  computeProductivityOverview,
  computeComparisonPresetDates,
  computeProductivityComparison,
  computeManagementPnlReport
} from './productivityEngine.js';

const CATEGORIES = ['Flight', 'Hotel', 'Tour', 'Other'];

const SAMPLE_RECORDS = enrichProductivityRecords([
  { id: 'P1', date: '2026-03', staff: 'Sari', category: 'Flight', type: 'Retail', salesAmount: 100_000_000, profitAmount: 8_000_000 },
  { id: 'P2', date: '2026-03', staff: 'Sari', category: 'Hotel', type: 'Retail', salesAmount: 50_000_000, profitAmount: 7_000_000 },
  { id: 'P3', date: '2026-03', staff: 'Budi', category: 'Tour', type: 'Corporate', salesAmount: 150_000_000, profitAmount: 15_000_000 },
  { id: 'P4', date: '2025-03', staff: 'Budi', category: 'Tour', type: 'Corporate', salesAmount: 100_000_000, profitAmount: 10_000_000 }
]);

test('parseDigitsInput extracts clean numeric values from formatted strings', () => {
  assert.equal(parseDigitsInput('50,000,000'), 50_000_000);
  assert.equal(parseDigitsInput('Rp 12.500.000'), 12_500_000);
  assert.equal(parseDigitsInput(''), 0);
});

test('computeProductivityOverview calculates margins, retail share, cross-sell, and leaderboard', () => {
  const mar2026 = SAMPLE_RECORDS.filter((r) => r.yearMonth === '2026-03');
  const overview = computeProductivityOverview(mar2026, CATEGORIES);

  assert.equal(overview.totalSales, 300_000_000);
  assert.equal(overview.totalProfit, 30_000_000);
  assert.equal(overview.overallMargin, 10);
  assert.equal(overview.retailSharePct, 50); // 15M Retail / 30M Total
  assert.equal(overview.crossSellRate, 50); // 50M Hotel / 100M Flight
  assert.equal(overview.consultantLeaderboard.length, 2);
});

test('computeComparisonPresetDates and computeProductivityComparison calculate YoY growth cleanly', () => {
  const yoy = computeComparisonPresetDates('YoY', '2026-03', 2026);
  assert.deepEqual(yoy, {
    p1Start: '2026-03',
    p1End: '2026-03',
    p2Start: '2025-03',
    p2End: '2025-03'
  });

  const comp = computeProductivityComparison({
    staffScopedRecords: SAMPLE_RECORDS,
    categories: CATEGORIES,
    compP1Start: yoy.p1Start,
    compP1End: yoy.p1End,
    compP2Start: yoy.p2Start,
    compP2End: yoy.p2End,
    selectedTypeFilter: 'All'
  });

  assert.equal(comp.p1SalesTotal, 300_000_000);
  assert.equal(comp.p2SalesTotal, 100_000_000);
  assert.equal(comp.salesGrowthPct, 200);
  assert.equal(comp.profitGrowthPct, 200);
  assert.equal(comp.p1CrossSell, 50);
});

test('computeManagementPnlReport produces sorted segment breakdown with GRAND TOTAL row', () => {
  const mar2026 = SAMPLE_RECORDS.filter((r) => r.yearMonth === '2026-03');
  const rows = computeManagementPnlReport(mar2026, CATEGORIES, ['Retail', 'Corporate']);

  assert.equal(rows.length, 4); // 3 category/segment rows + GRAND TOTAL
  assert.equal(rows[0].category, 'Tour');
  assert.equal(rows[rows.length - 1].category, 'GRAND TOTAL');
  assert.equal(rows[rows.length - 1].isTotal, true);
  assert.equal(rows[rows.length - 1].sales, 300_000_000);
});
