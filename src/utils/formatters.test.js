import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIdr,
  formatCompactIdr,
  formatAxisCompact,
  formatNumber,
  formatPercent,
  computeDelta,
  formatMonthLabel,
  formatShortDate,
  escapeCsvCell
} from './formatters.js';

test('formatIdr formats positive, negative, signed, and empty values consistently', () => {
  assert.equal(formatIdr(50000000), 'Rp 50,000,000');
  assert.equal(formatIdr(-1250000), '-Rp 1,250,000');
  assert.equal(formatIdr(250000, { signed: true }), '+Rp 250,000');
  assert.equal(formatIdr(0), 'Rp 0');
  assert.equal(formatIdr(null), 'Rp 0');
  assert.equal(formatIdr('', { fallback: '-' }), '-');
});

test('formatCompactIdr scales billions, millions, thousands, and negatives cleanly', () => {
  assert.equal(formatCompactIdr(1_250_000_000), 'Rp 1.25B');
  assert.equal(formatCompactIdr(45_200_000), 'Rp 45.2M');
  assert.equal(formatCompactIdr(250_000_000), 'Rp 250M');
  assert.equal(formatCompactIdr(850_000), 'Rp 850K');
  assert.equal(formatCompactIdr(-15_500_000), '-Rp 15.5M');
  assert.equal(formatCompactIdr(0), 'Rp 0');
});

test('formatAxisCompact strips Rp prefix for compact axis labels', () => {
  assert.equal(formatAxisCompact(2_400_000_000), '2.4B');
  assert.equal(formatAxisCompact(12_500_000), '12.5M');
  assert.equal(formatAxisCompact(5000), '5K');
  assert.equal(formatAxisCompact(400), '400');
});

test('formatNumber and formatPercent handle decimals and missing inputs', () => {
  assert.equal(formatNumber(1240), '1,240');
  assert.equal(formatNumber(12.345, 1), '12.3');
  assert.equal(formatPercent(14.26, 1), '14.3%');
  assert.equal(formatPercent(null), '—');
});

test('computeDelta handles standard growth, declines, zero baselines, and percentage points', () => {
  assert.deepEqual(computeDelta(120, 100), { value: 20, label: '+20.0%', direction: 'up' });
  assert.deepEqual(computeDelta(75, 100), { value: -25, label: '-25.0%', direction: 'down' });
  assert.deepEqual(computeDelta(0, 0), { value: 0, label: '0.0%', direction: 'flat' });
  assert.deepEqual(computeDelta(50, 0), { value: null, label: 'Baru', direction: 'new' });
  assert.deepEqual(computeDelta(18.5, 15.0, { isPoints: true }), {
    value: 3.5,
    label: '+3.5 pp',
    direction: 'up'
  });
});

test('formatMonthLabel and formatShortDate produce clean Indonesian short labels', () => {
  assert.equal(formatMonthLabel('2026-08'), 'Agu 2026');
  assert.equal(formatMonthLabel('2026-12'), 'Des 2026');
  assert.equal(formatShortDate('2026-03-14'), '14 Mar 2026');
  assert.equal(formatShortDate(''), '-');
});

test('escapeCsvCell neutralizes spreadsheet formula injection and quotes commas', () => {
  assert.equal(escapeCsvCell('Tokyo, Japan'), '"Tokyo, Japan"');
  assert.equal(escapeCsvCell('=SUM(A1:A5)'), `"'=SUM(A1:A5)"`);
  assert.equal(escapeCsvCell('He said "OK"'), '"He said ""OK"""');
});
