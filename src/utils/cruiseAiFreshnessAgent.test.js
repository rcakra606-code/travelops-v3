import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_CRUISE_GUIDES } from './cruiseSalesGuideData.js';
import {
  validateCruiseAuditPayload,
  buildCruiseBrandAuditPrompt,
  buildSingleShipAuditPrompt,
  extractGroundingSources,
  normalizeCruiseAuditResult,
  applyCruiseAuditToGuide,
  getCruiseFreshnessStatus
} from './cruiseAiFreshnessAgent.js';

test('validateCruiseAuditPayload validates brand and single-ship payloads safely', () => {
  const disney = SEED_CRUISE_GUIDES[0];
  assert.equal(validateCruiseAuditPayload({ mode: 'brand', guide: disney }).valid, true);
  assert.equal(validateCruiseAuditPayload({ mode: 'ship', guide: disney }).valid, false);
  assert.equal(
    validateCruiseAuditPayload({ mode: 'ship', guide: disney, ship: disney.featuredShips[0] }).valid,
    true
  );
  assert.equal(validateCruiseAuditPayload({}).valid, false);
});

test('audit prompt builders include current date, brand facts, and active fleet snapshot', () => {
  const disney = SEED_CRUISE_GUIDES[0];
  const brandPrompt = buildCruiseBrandAuditPrompt(disney, { todayIso: '2026-11-26' });
  assert.ok(brandPrompt.includes('2026-11-26'));
  assert.ok(brandPrompt.includes('Disney Cruise Line'));
  assert.ok(brandPrompt.includes('Disney Adventure'));

  const shipPrompt = buildSingleShipAuditPrompt(disney, disney.featuredShips[0], {
    todayIso: '2026-11-26'
  });
  assert.ok(shipPrompt.includes('Disney Adventure'));
  assert.ok(shipPrompt.includes('208.000 GT'));
});

test('extractGroundingSources deduplicates valid https grounding chunks', () => {
  const mockRes = {
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { title: 'Disney Official', uri: 'https://disneycruise.disney.go.com/faq' } },
            { web: { title: 'Duplicate', uri: 'https://disneycruise.disney.go.com/faq' } },
            { web: { title: 'Invalid', uri: 'javascript:alert(1)' } },
            { web: { title: 'CruiseMapper', uri: 'https://www.cruisemapper.com/ships' } }
          ]
        }
      }
    ]
  };
  const sources = extractGroundingSources(mockRes);
  assert.equal(sources.length, 2);
  assert.equal(sources[0].title, 'Disney Official');
  assert.equal(sources[1].url, 'https://www.cruisemapper.com/ships');
});

test('normalizeCruiseAuditResult and applyCruiseAuditToGuide merge field & fleet diffs cleanly without duplicates', () => {
  const disney = SEED_CRUISE_GUIDES[0];
  const rawAi = {
    status: 'update_available',
    summary: 'Tarif gratuity naik & 1 kapal baru ditambahkan.',
    fieldChanges: [
      {
        field: 'gratuityStandard',
        label: 'Tarif Gratuity Standar',
        oldValue: 16,
        newValue: 17.5,
        reason: 'Penyesuaian resmi Disney Cruise Line',
        severity: 'warning'
      },
      {
        field: 'id', // disallowed field must be ignored!
        label: 'Attempted ID tamper',
        oldValue: 'disney-cruise-line',
        newValue: 'hacked',
        reason: 'ignored'
      }
    ],
    fleetChanges: {
      newShips: [
        {
          name: 'Disney Horizon',
          shipClass: 'Wish Class',
          tonnage: '144.000 GT',
          capacity: '4.000 tamu',
          decks: 15,
          yearBuilt: '2027',
          deployment: 'Tokyo (Jepang)',
          bestFor: 'Keluarga Jepang & Asia',
          highlight: 'Kapal Disney khusus berbasis di Tokyo.'
        },
        {
          name: 'Disney Adventure', // already exists, should NOT duplicate
          shipClass: 'Global Class'
        }
      ],
      retiredOrTransferredShips: [{ name: 'Disney Magic', reason: 'Pensiun simulasi test' }],
      updatedShips: [
        {
          name: 'Disney Wish',
          changesSummary: 'Update refurbishment 2026',
          patch: { yearBuilt: '2022 (Refurb 2026)' }
        }
      ]
    },
    verificationNotes: 'Terverifikasi via website resmi'
  };

  const normalized = normalizeCruiseAuditResult(rawAi, {
    mode: 'brand',
    guide: disney,
    webGrounded: true,
    sources: [{ title: 'Disney Official', url: 'https://disneycruise.disney.go.com' }]
  });

  // Only allowlisted field change kept
  assert.equal(normalized.fieldChanges.length, 1);
  assert.equal(normalized.fieldChanges[0].field, 'gratuityStandard');
  assert.equal(normalized.status, 'update_available');

  const merged = applyCruiseAuditToGuide(disney, normalized, { updatedBy: 'AI Test' });
  assert.equal(merged.id, 'disney-cruise-line');
  assert.equal(merged.gratuityStandard, 17.5);
  assert.equal(merged.auditStatus, 'verified');
  assert.equal(merged.updatedBy, 'AI Test');

  // 8 original - 1 retired (Magic) + 1 new unique (Horizon; Adventure ignored as dup) = 8 ships
  assert.equal(merged.featuredShips.length, 8);
  assert.equal(merged.featuredShips[0].name, 'Disney Horizon');
  assert.equal(merged.featuredShips.some((s) => s.name === 'Disney Magic'), false);
  const wish = merged.featuredShips.find((s) => s.name === 'Disney Wish');
  assert.equal(wish.yearBuilt, '2022 (Refurb 2026)');
});

test('getCruiseFreshnessStatus reports fresh, stale, and alert states accurately', () => {
  const nowIso = new Date().toISOString();
  const oldIso = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(getCruiseFreshnessStatus(nowIso, 'verified').needsCheck, false);
  assert.equal(getCruiseFreshnessStatus(oldIso, 'verified').needsCheck, true);
  assert.equal(getCruiseFreshnessStatus(nowIso, 'update_available').label, 'Ada Update AI');
  assert.equal(getCruiseFreshnessStatus(nowIso, 'critical_alert').label, 'Alert Kritis AI');
});
