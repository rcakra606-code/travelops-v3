import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFinancials, isTourPast, parseLocalDateToEndOfDay } from './tourUtils.js';
import { computeFinancialsFromPax } from './tourHelpers.js';
import { formatCurrency, parseCurrency } from './currency.js';

describe('Tour Financial & Operational Calculations', () => {
  it('should correctly normalize financials and compute sisa pelunasan', () => {
    const rawFin = {
      basicTourPrice: 25000000,
      discountSupplier: 1000000,
      discountBranch: 500000,
      profit: 3000000,
      depositNumber: 'DP-2026-001',
      depositAmount: 5000000
    };

    const fin = normalizeFinancials(rawFin);

    // Selling price = 25M - 1M - 0.5M = 23.5M
    assert.equal(fin.totalSellingPrice, 23500000);
    assert.equal(fin.totalOmset, 23500000);

    // Nett price = Selling price - profit = 23.5M - 3M = 20.5M
    assert.equal(fin.totalNettPrice, 20500000);
    assert.equal(fin.profit, 3000000);

    // Total discount = 1M + 0.5M = 1.5M
    assert.equal(fin.discount, 1500000);

    // Sisa Pelunasan = 23.5M - 5M = 18.5M
    assert.equal(fin.sisaPelunasan, 18500000);
    assert.equal(fin.depositNumber, 'DP-2026-001');
  });

  it('should correctly calculate Consortium tour financials with airport tax, tipping, misc, ppn and nominal profit', () => {
    const consortiumFin = {
      basicTourPrice: 20000000,
      airportTax: 2500000,
      tipping: 800000,
      miscCharge: 200000,
      ppn: 220000,
      discountSupplier: 500000,
      discountBranch: 0,
      profit: 2000000,
      depositAmount: 10000000,
      depositNumber: 'DP-CS-001'
    };

    const fin = normalizeFinancials(consortiumFin, 'Consortium');

    // Selling Price = 20M + 2.5M + 0.8M + 0.2M + 0.22M - 0.5M = 23,220,000
    assert.equal(fin.totalSellingPrice, 23220000);
    assert.equal(fin.totalOmset, 23220000);

    // Nett Price = 23,220,000 - 2,000,000 = 21,220,000
    assert.equal(fin.totalNettPrice, 21220000);
    assert.equal(fin.profit, 2000000);

    // Sisa Pelunasan = 23,220,000 - 10,000,000 = 13,220,000
    assert.equal(fin.sisaPelunasan, 13220000);
  });

  it('should compute financials from individual pax list for Consortium with nominal profit', () => {
    const paxList = [
      {
        basicPrice: 15000000,
        airportTax: 2000000,
        tipping: 600000,
        miscCharge: 150000,
        ppn: 165000,
        discountSupplier: 300000,
        discountBranch: 0,
        profit: 1500000
      },
      {
        basicPrice: 15000000,
        airportTax: 2000000,
        tipping: 600000,
        miscCharge: 150000,
        ppn: 165000,
        discountSupplier: 300000,
        discountBranch: 0,
        profit: 1500000
      }
    ];

    const currentFinancials = { depositAmount: 12000000, depositNumber: 'DP-PAX-01' };
    const fin = computeFinancialsFromPax(paxList, currentFinancials, 'Consortium');

    // Basic = 30M, Tax = 4M, Tipping = 1.2M, Misc = 0.3M, PPN = 0.33M, Disc = 0.6M, Profit = 3M
    assert.equal(fin.basicTourPrice, 30000000);
    assert.equal(fin.airportTax, 4000000);
    assert.equal(fin.tipping, 1200000);
    assert.equal(fin.miscCharge, 300000);
    assert.equal(fin.ppn, 330000);
    assert.equal(fin.profit, 3000000); // Nominal profit explicitly tracked

    // Total Selling = 30M + 4M + 1.2M + 0.3M + 0.33M - 0.6M = 35,230,000
    assert.equal(fin.totalSellingPrice, 35230000);
    // Total Nett = 35,230,000 - 3,000,000 = 32,230,000
    assert.equal(fin.totalNettPrice, 32230000);
    // Sisa = 35,230,000 - 12,000,000 = 23,230,000
    assert.equal(fin.sisaPelunasan, 23230000);
  });

  it('should handle zero and empty values safely without throwing', () => {
    const fin = normalizeFinancials({});
    assert.equal(fin.basicTourPrice, 0);
    assert.equal(fin.totalSellingPrice, 0);
    assert.equal(fin.sisaPelunasan, 0);
    assert.equal(fin.depositNumber, '');
  });

  it('should determine whether a tour is completed or ongoing (isTourPast)', () => {
    // Past dates
    assert.equal(isTourPast('2020-01-01', '2020-01-10'), true);

    // Future dates
    assert.equal(isTourPast('2099-01-01', '2099-01-10'), false);

    // Empty dates should not be marked as past
    assert.equal(isTourPast(null, null), false);
  });

  it('should parse local date to end of day correctly', () => {
    const d = parseLocalDateToEndOfDay('2026-05-15');
    assert.ok(d instanceof Date);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 4); // May = index 4
    assert.equal(d.getDate(), 15);
    assert.equal(d.getHours(), 23);
    assert.equal(d.getMinutes(), 59);
  });
});

describe('Currency Formatting & Parsing', () => {
  it('should format numbers with comma grouping', () => {
    assert.equal(formatCurrency(1500000), '1,500,000');
    assert.equal(formatCurrency(0), '0');
    assert.equal(formatCurrency('0'), '0');
    assert.equal(formatCurrency(null), '');
  });

  it('should parse formatted strings back to numbers', () => {
    assert.equal(parseCurrency('1,500,000'), 1500000);
    assert.equal(parseCurrency('0'), 0);
    assert.equal(parseCurrency(''), 0);
    assert.equal(parseCurrency(null), 0);
  });
});
