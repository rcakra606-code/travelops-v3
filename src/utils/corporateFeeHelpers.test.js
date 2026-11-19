import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCommaNumber,
  formatCommaNumber,
  formatCorporateIdr,
  sanitizePercentInput,
  parseFeeEntry,
  normalizeFeeProfile,
  serializeFeeProfile,
  formatFeeEntryDisplay
} from './corporateFeeHelpers.js';

describe('Corporate Financial & Service Fee Helpers', () => {
  it('formats and parses 3-digit comma financial numbers accurately', () => {
    assert.equal(formatCommaNumber(50000000), '50,000,000');
    assert.equal(formatCommaNumber('1250000'), '1,250,000');
    assert.equal(formatCommaNumber(0), '');
    assert.equal(formatCommaNumber(0, { allowZero: true }), '0');
    assert.equal(parseCommaNumber('50,000,000'), 50000000);
    assert.equal(formatCorporateIdr(62977000), 'Rp 62,977,000');
  });

  it('sanitizes decimal percentage inputs safely (0-100, max 2 decimals)', () => {
    assert.equal(sanitizePercentInput('2.5'), '2.5');
    assert.equal(sanitizePercentInput('2,75'), '2.75');
    assert.equal(sanitizePercentInput('3.1234'), '3.12');
    assert.equal(sanitizePercentInput('150'), '100');
    assert.equal(sanitizePercentInput('abc5.5%'), '5.5');
  });

  it('stays 100% backward-compatible with legacy numeric fees and structured percent fees', () => {
    // Legacy numeric value from existing DB records
    assert.deepEqual(parseFeeEntry(50000), { type: 'nominal', value: 50000 });
    assert.equal(formatFeeEntryDisplay(50000), 'Rp 50,000');

    // Structured percentage fee
    const pct = parseFeeEntry({ type: 'percent', value: 2.5 });
    assert.equal(pct.type, 'percent');
    assert.equal(pct.value, 2.5);
    assert.equal(formatFeeEntryDisplay(pct), '2.5%');

    // Mixed profile normalization & serialization
    const normalized = normalizeFeeProfile({
      domestic: 50000,
      international: { type: 'percent', value: 3.5 },
      refund: '1.5%'
    });
    assert.equal(normalized.domestic.type, 'nominal');
    assert.equal(normalized.domestic.value, 50000);
    assert.equal(normalized.international.type, 'percent');
    assert.equal(normalized.international.value, 3.5);
    assert.equal(normalized.refund.type, 'percent');
    assert.equal(normalized.refund.value, 1.5);
    assert.equal(normalized.void.value, 0);

    const serialized = serializeFeeProfile(normalized);
    assert.deepEqual(serialized.domestic, { type: 'nominal', value: 50000 });
    assert.deepEqual(serialized.international, { type: 'percent', value: 3.5 });
    assert.deepEqual(serialized.refund, { type: 'percent', value: 1.5 });
  });
});
