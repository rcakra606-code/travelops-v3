import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHorizonRange,
  buildStaffRoster,
  computeConsultantScorecards,
  computeSalesQuotaAnalytics,
  computeStaffProductivityBreakdown,
  computeStaffOperationsAnalytics
} from './staffPerformanceEngine.js';

test('resolveHorizonRange computes month, quarter, year, and swapped custom ranges accurately', () => {
  assert.equal(resolveHorizonRange({ horizonMode: 'all' }).label, 'All Time');
  assert.deepEqual(
    resolveHorizonRange({ horizonMode: 'quarter', selectedQuarter: 2, selectedYear: 2026 }),
    { start: '2026-04', end: '2026-06', label: 'Q2 2026' }
  );
  const custom = resolveHorizonRange({
    horizonMode: 'custom',
    customStartMonth: '2026-06',
    customEndMonth: '2026-02'
  });
  assert.equal(custom.start, '2026-02');
  assert.equal(custom.end, '2026-06');
});

test('buildStaffRoster excludes Admin and Inactive users cleanly', () => {
  const roster = buildStaffRoster({
    users: [
      { name: 'Admin Boss', role: 'Admin', status: 'Active' },
      { name: 'Ex Staff', role: 'Staff', status: 'Inactive' },
      { name: 'Sari', role: 'Staff', status: 'Active' }
    ],
    tours: [
      { staffName: 'Ex Staff' },
      { staffName: 'Budi' },
      { staffName: 'Unassigned' }
    ]
  });

  assert.deepEqual(roster, ['Budi', 'Sari']);
});

test('computeConsultantScorecards and sub-engines aggregate quota, cross-sell, and 360 ops cleanly', () => {
  const periodRange = resolveHorizonRange({ horizonMode: 'month', selectedMonth: '2026-03' });
  const sample = {
    staffRoster: ['Budi', 'Sari'],
    sales: [
      { staffName: 'Sari', period: '2026-03', targetSales: 100_000_000, achievementSales: 110_000_000, targetProfit: 10_000_000, achievementProfit: 12_000_000 }
    ],
    productivityData: [
      { staff: 'Sari', date: '2026-03', category: 'Flight', type: 'Retail', salesAmount: 100_000_000, profitAmount: 8_000_000 },
      { staff: 'Sari', date: '2026-03', category: 'Hotel', type: 'Retail', salesAmount: 50_000_000, profitAmount: 7_000_000 }
    ],
    tours: [
      { id: 'T1', staffName: 'Sari', departureDate: '2026-03-10', country: 'Japan', status: 'Confirm', paxCount: 4, totalOmset: 80_000_000, financials: { profit: 8_000_000 } },
      { id: 'T2', staffName: 'Sari', departureDate: '2026-03-12', country: 'Japan', status: 'Cancel', paxCount: 2, totalOmset: 40_000_000, financials: { profit: 4_000_000 } }
    ],
    documents: [{ staff: 'Sari', receiveDate: '2026-03-05', price: 2_000_000, processType: 'Express' }],
    overtimes: [{ staff: 'Sari', date: '2026-03-11', hours: 3, status: 'Approved' }],
    periodRange,
    staffNameFilter: 'All'
  };

  const scorecards = computeConsultantScorecards(sample);
  assert.equal(scorecards[0].staffName, 'Sari');
  assert.equal(scorecards[0].tierLabel, 'Top Performer');
  assert.equal(scorecards[0].salesQuotaPct, 110);
  assert.equal(scorecards[0].crossSellPct, 50); // 50M Hotel / 100M Flight
  assert.equal(scorecards[0].totalOpsFiles, 2); // 1 active tour + 1 doc (excludes cancelled)

  const quota = computeSalesQuotaAnalytics(sample);
  assert.equal(quota.metrics.salesRate, 110);
  assert.equal(quota.metrics.salesVariance, 10_000_000);

  const prod = computeStaffProductivityBreakdown({
    ...sample,
    categories: ['Flight', 'Hotel', 'Other']
  });
  assert.equal(prod.grandSales, 150_000_000);
  assert.equal(prod.retailCrossSell, 50);

  const ops = computeStaffOperationsAnalytics(sample);
  assert.equal(ops.activeTourCount, 1);
  assert.equal(ops.cancelledTourCount, 1);
  assert.equal(ops.tourCancelRate, 50);
  assert.equal(ops.expressDocsCount, 1);
  assert.equal(ops.approvedOtHours, 3);
});
