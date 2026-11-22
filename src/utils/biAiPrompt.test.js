import test from 'node:test';
import assert from 'node:assert/strict';
import { computeExecutiveBiAnalytics } from './biAnalyticsEngine.js';
import {
  buildPiiFreeBiSnapshot,
  validateBiSnapshotPayload,
  buildBiAnalystPrompt,
  normalizeBiAiResponse
} from './biAiPrompt.js';

test('buildPiiFreeBiSnapshot excludes customer PII fields while preserving aggregated KPIs', () => {
  const analytics = computeExecutiveBiAnalytics({
    tours: [
      {
        id: 'T-99',
        country: 'Japan',
        category: 'Series',
        departureDate: '2026-03-20',
        status: 'Confirm',
        paxCount: 2,
        staffName: 'Sari',
        paxInfo: [
          {
            name: 'BUDI SANTOSO SECRET',
            phone: '081234567890',
            email: 'budi.secret@gmail.com',
            passportNo: 'X99887766'
          }
        ],
        financials: {
          totalSellingPrice: 80_000_000,
          totalNettPrice: 70_000_000,
          profit: 10_000_000,
          depositAmount: 20_000_000,
          sisaPelunasan: 60_000_000
        }
      }
    ],
    documents: [
      {
        id: 'D-99',
        guestName: 'ANI RAHMAWATI SECRET',
        phoneNumber: '081999888777',
        country: 'Japan',
        receiveDate: '2026-03-01',
        sendDate: '2026-03-05',
        price: 1_200_000,
        staff: 'Sari',
        shippingStatus: 'Received'
      }
    ],
    periodPreset: 'this_quarter',
    scope: 'all',
    referenceDate: new Date(2026, 2, 15)
  });

  const snapshot = buildPiiFreeBiSnapshot(analytics, { userRole: 'Manager' });
  const serialized = JSON.stringify(snapshot);

  assert.equal(validateBiSnapshotPayload(snapshot).valid, true);
  assert.equal(serialized.includes('BUDI SANTOSO'), false);
  assert.equal(serialized.includes('ANI RAHMAWATI'), false);
  assert.equal(serialized.includes('081234567890'), false);
  assert.equal(serialized.includes('budi.secret@gmail.com'), false);
  assert.equal(serialized.includes('X99887766'), false);
  assert.equal(snapshot.financialSummary.operationalRevenueIdr, 81_200_000);
  assert.equal(snapshot.financialSummary.outstandingReceivablesIdr, 60_000_000);
});

test('buildBiAnalystPrompt enforces strict governance rules and 7 mandatory fields', () => {
  const analytics = computeExecutiveBiAnalytics({
    periodPreset: 'this_month',
    referenceDate: new Date(2026, 2, 15)
  });
  const snapshot = buildPiiFreeBiSnapshot(analytics, { userRole: 'Admin' });
  const prompt = buildBiAnalystPrompt(snapshot);

  assert.ok(prompt.includes('NEVER fabricate'));
  assert.ok(prompt.includes('Distinguish correlation from causation'));
  assert.ok(prompt.includes('"supportingData"'));
  assert.ok(prompt.includes('"dataQualityNote"'));
});

test('normalizeBiAiResponse sanitizes invalid domains/routes and guarantees all 7 insight fields', () => {
  const normalized = normalizeBiAiResponse({
    executiveSummary: 'Omset stabil pada Q1.',
    dataCoverageNote: 'Operating expenses belum tersedia.',
    insights: [
      {
        title: 'Piutang Tour Mendesak',
        domain: 'Financial',
        severity: 'critical',
        metric: 'Piutang <= H-7: Rp 60,000,000',
        supportingData: '1 booking berangkat dalam 5 hari (Q1 2026)',
        whatChanged: 'Sisa pelunasan belum diterima menjelang batas H-7.',
        businessImpact: 'Risiko tertundanya pelunasan ke supplier.',
        recommendedAction: 'Kirim pengingat pelunasan ke tamu hari ini.',
        targetRoute: '/tours',
        confidence: 'high',
        dataQualityNote: 'Berdasarkan ledger tour aktif.'
      },
      {
        title: 'Unknown Route Test',
        domain: 'InvalidDomain',
        severity: 'weird',
        targetRoute: '/evil-route',
        confidence: 'super-high'
      }
    ]
  });

  assert.equal(normalized.insights.length, 2);
  assert.equal(normalized.insights[0].targetRoute, '/tours');
  assert.equal(normalized.insights[1].domain, 'Business');
  assert.equal(normalized.insights[1].severity, 'info');
  assert.equal(normalized.insights[1].confidence, 'medium');
  assert.equal(normalized.insights[1].targetRoute, null);
  assert.ok(normalized.insights[1].dataQualityNote.length > 0);
});
