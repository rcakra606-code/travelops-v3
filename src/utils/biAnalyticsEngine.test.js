import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePeriodWindows, computeExecutiveBiAnalytics } from './biAnalyticsEngine.js';

const REF_DATE = new Date(2026, 2, 15); // 15 Mar 2026 (Q1 2026)

const SAMPLE_DATA = {
  tours: [
    // Current Q1 2026
    {
      id: 'T-1',
      country: 'Japan',
      category: 'Series',
      departureDate: '2026-03-20', // 5 days from REF_DATE -> Urgent AR
      status: 'Confirm',
      paxCount: 4,
      staffName: 'Sari',
      supplier: 'JTB Japan',
      financials: {
        totalSellingPrice: 120_000_000,
        totalNettPrice: 108_000_000,
        profit: 12_000_000,
        depositAmount: 40_000_000,
        sisaPelunasan: 80_000_000
      }
    },
    {
      id: 'T-2',
      country: 'Switzerland',
      category: 'Incentive',
      departureDate: '2026-02-10',
      status: 'Past Date',
      paxCount: 10,
      staffName: 'Budi',
      supplier: 'EuroDMC',
      financials: {
        totalSellingPrice: 300_000_000,
        totalNettPrice: 255_000_000,
        profit: 45_000_000,
        depositAmount: 300_000_000,
        sisaPelunasan: 0
      }
    },
    {
      id: 'T-3',
      country: 'Japan',
      category: 'Series',
      departureDate: '2026-01-25',
      status: 'Cancel',
      paxCount: 2,
      staffName: 'Sari',
      financials: {
        totalSellingPrice: 50_000_000,
        totalNettPrice: 45_000_000,
        profit: 5_000_000,
        depositAmount: 10_000_000,
        sisaPelunasan: 40_000_000
      }
    },
    // Previous Q4 2025
    {
      id: 'T-4',
      country: 'Korea',
      category: 'Consortium',
      departureDate: '2025-11-15',
      status: 'Past Date',
      paxCount: 6,
      staffName: 'Sari',
      financials: {
        totalSellingPrice: 150_000_000,
        totalNettPrice: 135_000_000,
        profit: 15_000_000,
        depositAmount: 150_000_000,
        sisaPelunasan: 0
      }
    }
  ],
  documents: [
    {
      id: 'D-1',
      docType: 'Tourist Visa',
      country: 'Japan',
      receiveDate: '2026-03-01',
      estimatedDone: '2026-03-10',
      sendDate: '2026-03-07', // 6 days turnaround, on-time SLA
      price: 1_500_000,
      supplier: 'VFS Global',
      staff: 'Sari',
      shippingStatus: 'Received'
    },
    {
      id: 'D-2',
      docType: 'Schengen Visa',
      country: 'Switzerland',
      receiveDate: '2026-03-02',
      estimatedDone: '2026-03-12', // Overdue as of Mar 15!
      sendDate: '',
      price: 2_500_000,
      supplier: 'TLScontact',
      staff: 'Budi',
      shippingStatus: 'Processing'
    }
  ],
  hotels: [
    { id: 'H-1', hotelName: 'Park Hyatt Tokyo', checkIn: '2026-03-20', status: 'Upcoming', supplierName: 'MG Bedbank', staff: 'Sari' }
  ],
  cruises: [
    { id: 'C-1', cruiseBrand: 'Royal Caribbean', sailingStart: '2026-03-25', paxCount: 3, status: 'Upcoming', staff: 'Budi' }
  ],
  telecoms: [
    { id: 'TEL-1', typeProduct: 'eSIM', tanggalMulai: '2026-03-20', staff: 'Sari' }
  ],
  corporateAccounts: [
    { id: 'CA-1', accountCode: 'CORP-A', companyName: 'PT Alpha', creditLimit: 100_000_000, status: 'Active' },
    { id: 'CA-2', accountCode: 'CORP-B', companyName: 'PT Beta', creditLimit: 200_000_000, status: 'Active' }
  ],
  corporateSales: [
    { id: 'CS-1', date: '2026-01', accountCode: 'CORP-A', category: 'Flight', salesAmount: 70_000_000, profitAmount: 7_000_000 },
    { id: 'CS-2', date: '2026-02', accountCode: 'CORP-A', category: 'Hotel', salesAmount: 45_000_000, profitAmount: 5_000_000 },
    // Previous quarter
    { id: 'CS-3', date: '2025-11', accountCode: 'CORP-B', category: 'Flight', salesAmount: 50_000_000, profitAmount: 4_000_000 }
  ],
  sales: [
    { id: 'S-1', staffName: 'Sari', period: '2026-03', targetSales: 200_000_000, achievementSales: 210_000_000, targetProfit: 20_000_000, achievementProfit: 22_000_000 },
    { id: 'S-2', staffName: 'Budi', period: '2026-03', targetSales: 200_000_000, achievementSales: 100_000_000, targetProfit: 20_000_000, achievementProfit: 10_000_000 }
  ],
  productivityData: [
    { id: 'P-1', date: '2026-03', staff: 'Sari', category: 'Flight', type: 'Retail', salesAmount: 80_000_000, profitAmount: 6_000_000 },
    { id: 'P-2', date: '2026-03', staff: 'Budi', category: 'Tour', type: 'Corporate', salesAmount: 120_000_000, profitAmount: 18_000_000 }
  ],
  overtimes: [
    { id: 'OT-1', staff: 'Sari', date: '2026-03-10', hours: 4.5, status: 'Pending' }
  ]
};

test('resolvePeriodWindows builds accurate quarter and month comparison ranges', () => {
  const qWin = resolvePeriodWindows('this_quarter', REF_DATE);
  assert.equal(qWin.current.label, 'Q1 2026');
  assert.equal(qWin.previous.label, 'Q4 2025');

  const mWin = resolvePeriodWindows('this_month', REF_DATE);
  assert.equal(mWin.current.label, 'Mar 2026');
  assert.equal(mWin.previous.label, 'Feb 2026');

  const allWin = resolvePeriodWindows('all_time', REF_DATE);
  assert.equal(allWin.previous, null);
});

test('computeExecutiveBiAnalytics aggregates Operational, Financial, and Business metrics accurately without double-counting', () => {
  const result = computeExecutiveBiAnalytics({
    ...SAMPLE_DATA,
    periodPreset: 'this_quarter',
    scope: 'all',
    referenceDate: REF_DATE
  });

  // Operational checks
  assert.equal(result.operational.kpis.totalBookings.value, 8); // 3 tours + 2 docs + 1 hotel + 1 cruise + 1 telecom
  assert.equal(result.operational.kpis.totalPax.value, 17); // 4 + 10 active tour pax + 3 cruise pax (excludes 2 cancelled)
  assert.equal(result.operational.kpis.tourConfirmationRate.confirmed, 2);
  assert.equal(result.operational.kpis.tourCancellationRate.cancelled, 1);
  assert.equal(result.operational.kpis.avgDocTurnaroundDays.value, 6);
  assert.equal(result.operational.kpis.avgDocTurnaroundDays.slaRate, 100);
  assert.equal(result.operational.kpis.avgDocTurnaroundDays.overdueCount, 1);
  assert.equal(result.operational.kpis.overtimeHours.value, 4.5);

  // Financial checks (Tour active 420M + Corporate 115M + Docs 4M = 539M; Productivity NOT double-counted!)
  assert.equal(result.financial.kpis.operationalRevenue.value, 539_000_000);
  assert.equal(result.financial.kpis.grossProfit.value, 69_000_000); // Tour 57M + Corp 12M
  assert.equal(result.financial.kpis.outstandingReceivables.value, 80_000_000); // Excludes cancelled T-3!
  assert.equal(result.financial.kpis.outstandingReceivables.urgentAmount, 80_000_000);
  assert.equal(result.financial.kpis.cancelledBookingValue.value, 50_000_000);
  assert.equal(result.financial.kpis.corporateCredit.overLimitCount, 1); // CORP-A = 115M / 100M = 115%
  assert.equal(result.financial.kpis.productivityLedger.sales, 200_000_000);

  // Business checks
  assert.equal(result.business.kpis.avgTourOrderValue.value, 210_000_000);
  assert.equal(result.business.kpis.corporateRetention.activeAccounts, 2);
  assert.equal(result.business.kpis.corporateRetention.billingAccounts, 1);
  assert.equal(result.business.kpis.corporateRetention.repeatAccounts, 1);
  assert.equal(result.business.kpis.corporateRetention.dormantAccounts, 1);
  assert.equal(result.business.kpis.quotaAttainment.tiers.achieved, 1);
  assert.equal(result.business.kpis.quotaAttainment.tiers.needsCoaching, 1);

  // Deterministic anomaly signals
  const signalIds = result.signals.map((s) => s.id);
  assert.ok(signalIds.includes('sig-urgent-ar'));
  assert.ok(signalIds.includes('sig-doc-overdue'));
  assert.ok(signalIds.includes('sig-cancel-rate'));
  assert.ok(signalIds.includes('sig-corp-limit'));
});

test('computeExecutiveBiAnalytics enforces RBAC personal scope and excludes agency-wide corporate data', () => {
  const staffResult = computeExecutiveBiAnalytics({
    ...SAMPLE_DATA,
    periodPreset: 'this_quarter',
    scope: 'mine',
    staffName: 'Sari',
    referenceDate: REF_DATE
  });

  assert.equal(staffResult.meta.scope, 'mine');
  assert.equal(staffResult.meta.includeCorporate, false);
  // Sari has T-1 (120M active), T-3 (50M cancel), D-1 (1.5M), H-1, TEL-1 -> 5 bookings
  assert.equal(staffResult.operational.kpis.totalBookings.value, 5);
  assert.equal(staffResult.financial.kpis.operationalRevenue.value, 121_500_000); // 120M tour + 1.5M doc, NO corporate
  assert.equal(staffResult.business.kpis.quotaAttainment.totalConsultants, 1);
  assert.ok(
    staffResult.meta.unavailableMetrics.some((note) => note.toLowerCase().includes('portofolio saya'))
  );
});
