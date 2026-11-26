import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_CRUISE_GUIDES } from './cruiseSalesGuideData.js';
import {
  normalizeCruiseGuide,
  toCruiseGuideDbPayload,
  recommendCruises,
  calculateCruiseExtras,
  flattenAllShips,
  filterFleetShips,
  getShipSizeCategory,
  buildIndividualShipWhatsAppBriefing,
  buildShipWhatsAppBriefing,
  buildComparisonWhatsAppBriefing,
  buildExtrasEstimateWhatsAppBriefing,
  buildPreSailingChecklistWhatsApp
} from './cruiseSalesGuideHelpers.js';

test('normalizeCruiseGuide and toCruiseGuideDbPayload round-trip full fleet specs cleanly', () => {
  const sample = SEED_CRUISE_GUIDES[0];
  const dbPayload = toCruiseGuideDbPayload(sample, 'Tester');
  assert.equal(dbPayload.id, 'disney-cruise-line');
  assert.equal(dbPayload.brand_name, 'Disney Cruise Line');
  assert.equal(dbPayload.gratuity_standard, 16);
  assert.equal(dbPayload.updated_by, 'Tester');

  const roundTripped = normalizeCruiseGuide(dbPayload);
  assert.equal(roundTripped.brandName, 'Disney Cruise Line');
  assert.equal(roundTripped.featuredShips.length, 8);
  assert.equal(roundTripped.featuredShips[0].shipClass, 'Global Class');
  assert.equal(roundTripped.featuredShips[0].decks, 20);
  assert.equal(roundTripped.halalStatus, 'Pre-Order Halal');
});

test('complete fleet catalog covers all 149 active operating ships across all 10 brands', () => {
  const allShips = flattenAllShips(SEED_CRUISE_GUIDES);
  assert.equal(SEED_CRUISE_GUIDES.length, 10);
  assert.equal(allShips.length, 149);

  // Verify every single ship has core operational metadata populated
  for (const entry of allShips) {
    assert.ok(entry.ship.name.length > 0);
    assert.ok(entry.ship.shipClass.length > 0, `Missing shipClass on ${entry.ship.name}`);
    assert.ok(entry.ship.tonnage.length > 0, `Missing tonnage on ${entry.ship.name}`);
    assert.ok(entry.ship.capacity.length > 0, `Missing capacity on ${entry.ship.name}`);
    assert.ok(entry.ship.deployment.length > 0, `Missing deployment on ${entry.ship.name}`);
    assert.ok(entry.ship.highlight.length > 0, `Missing highlight on ${entry.ship.name}`);
  }
});

test('filterFleetShips filters by brand, ship size bucket, and keyword accurately', () => {
  const allShips = flattenAllShips(SEED_CRUISE_GUIDES);

  const royalShips = filterFleetShips(allShips, { brandId: 'royal-caribbean' });
  assert.equal(royalShips.length, 30);

  const megaShips = filterFleetShips(allShips, { sizeCategory: 'mega', sortBy: 'largest' });
  assert.ok(megaShips.length >= 25);
  assert.equal(megaShips[0].ship.name, 'Legend of the Seas');
  assert.equal(getShipSizeCategory('208.000 GT'), 'mega');
  assert.equal(getShipSizeCategory('54.700 GT'), 'boutique');

  const galapagos = filterFleetShips(allShips, { query: 'Galapagos' });
  assert.equal(galapagos.length, 2);
});

test('recommendCruises prioritizes Certified Halal Kitchen for halal profile in Singapore', () => {
  const results = recommendCruises(SEED_CRUISE_GUIDES, {
    profile: 'halal',
    region: 'singapore-sea'
  });
  assert.ok(results.length >= 2);
  assert.equal(results[0].guide.id, 'stardream-cruises');
  assert.ok(results[0].matchReasons.some((r) => r.includes('Halal')));
});

test('calculateCruiseExtras computes SGD gratuity, USD add-ons, and IDR local costs accurately', () => {
  const stardream = SEED_CRUISE_GUIDES.find((g) => g.id === 'stardream-cruises');
  const est = calculateCruiseExtras({
    guide: stardream,
    nights: 3,
    pax: 2,
    cabinTier: 'standard',
    includeWifi: true,
    wifiPerDayUsd: 20,
    includeTransfer: true,
    transferPerPaxIdr: 400000,
    fxRates: { USD: 16000, SGD: 12000, EUR: 17000 }
  });

  assert.equal(est.gratuity.originalTotal, 162);
  assert.equal(est.gratuity.idr, 1944000);
  assert.equal(est.wifi.usdTotal, 120);
  assert.equal(est.wifi.idr, 1920000);
  assert.equal(est.transfer.idr, 800000);
  assert.equal(est.totalIdr, 4664000);
  assert.equal(est.perPaxIdr, 2332000);
});

test('calculateCruiseExtras treats Silversea Included currency as 0 gratuity & add-ons', () => {
  const silversea = SEED_CRUISE_GUIDES.find((g) => g.id === 'silversea-cruises');
  const est = calculateCruiseExtras({
    guide: silversea,
    nights: 7,
    pax: 2,
    cabinTier: 'suite',
    includeWifi: true,
    includeBeverage: true
  });
  assert.equal(est.isAllInclusive, true);
  assert.equal(est.gratuity.idr, 0);
  assert.equal(est.wifi.idr, 0);
  assert.equal(est.beverage.idr, 0);
  assert.equal(est.totalIdr, 0);
});

test('WhatsApp briefing formatters emit structured brand, individual ship, comparison & checklist messages', () => {
  const disney = SEED_CRUISE_GUIDES[0];
  const star = SEED_CRUISE_GUIDES[1];
  const shipMsg = buildShipWhatsAppBriefing(disney);
  assert.ok(shipMsg.includes('DISNEY CRUISE LINE'));
  assert.ok(shipMsg.includes('Disney Adventure'));

  const singleShipMsg = buildIndividualShipWhatsAppBriefing(disney, disney.featuredShips[0]);
  assert.ok(singleShipMsg.includes('SPESIFIKASI KAPAL — DISNEY ADVENTURE'));
  assert.ok(singleShipMsg.includes('208.000 GT'));
  assert.ok(singleShipMsg.includes('20 deck'));

  const cmpMsg = buildComparisonWhatsAppBriefing([disney, star]);
  assert.ok(cmpMsg.includes('Disney Cruise Line vs StarDream'));

  const est = calculateCruiseExtras({ guide: disney, nights: 4, pax: 2 });
  const estMsg = buildExtrasEstimateWhatsAppBriefing(est);
  assert.ok(estMsg.includes('USD 128'));

  const checklistMsg = buildPreSailingChecklistWhatsApp();
  assert.ok(checklistMsg.includes('Paspor'));
  assert.ok(checklistMsg.includes('24 minggu'));
});
