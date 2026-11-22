import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAirlineName,
  formatAirportDetail
} from './flightReferenceData.js';
import {
  validateFlightReservationPayload,
  buildFlightReservationPrompt
} from './flightReservationPrompt.js';
import {
  parseGdsTextFallback,
  computeEnrichedSegments,
  summarizeAirlinesFromSegments,
  buildBaggageText,
  buildChangePolicyText,
  buildRefundPolicyText,
  buildTimeLimitText,
  buildFlightConfirmationWhatsAppText
} from './flightBookingHelpers.js';

const SAMPLE_EVA_AIR_GDS = `
1.1SANTOSO/BUDI MR  2.1SANTOSO/ANI MRS
1  BR 238 S 25NOV 3*CGKTPE 1440 2100
2  BR 028 S 25NOV 3*TPESFO 2330 1840
3  BR 017 W 08DEC 2*SFOTPE 2350 0600 +2
4  BR 237 W 10DEC 4*TPECGK 0900 1325
`;

test('IATA reference directory resolves airlines and full airport city details cleanly', () => {
  assert.equal(resolveAirlineName('BR'), 'EVA Air');
  assert.equal(resolveAirlineName('SQ'), 'Singapore Airlines');
  assert.equal(resolveAirlineName('GA'), 'Garuda Indonesia');
  assert.equal(formatAirportDetail('CGK'), 'Jakarta (CGK)');
  assert.equal(formatAirportDetail('TPE'), 'Taipei (TPE)');
  assert.equal(formatAirportDetail('SFO'), 'San Francisco (SFO)');
  assert.equal(formatAirportDetail('XYZ', 'Custom City'), 'Custom City (XYZ)');
});

test('GDS fallback parser + enrichment computes exact +2 arrival date and transit durations on user EVA Air itinerary', () => {
  const refDate = new Date(Date.UTC(2026, 9, 1)); // 01 Oct 2026
  const parsed = parseGdsTextFallback(SAMPLE_EVA_AIR_GDS, refDate);

  assert.equal(parsed.passengers.length, 2);
  assert.equal(parsed.passengers[0].title, 'MR');
  assert.equal(parsed.passengers[0].fullName, 'BUDI SANTOSO');
  assert.equal(parsed.passengers[1].title, 'MRS');
  assert.equal(parsed.passengers[1].fullName, 'ANI SANTOSO');
  assert.equal(parsed.segments.length, 4);

  const enriched = computeEnrichedSegments(parsed.segments);
  assert.equal(summarizeAirlinesFromSegments(enriched), 'EVA Air (BR)');

  // Seg 1: CGK -> TPE 14:40 - 21:00, transit 2 jam 30 menit to Seg 2 (23:30)
  assert.equal(enriched[0].originDetail, 'Jakarta (CGK)');
  assert.equal(enriched[0].destinationDetail, 'Taipei (TPE)');
  assert.equal(enriched[0].departureDate, '2026-11-25');
  assert.equal(enriched[0].transitAfterMinutes, 150);
  assert.equal(enriched[0].transitAfterLabel, '2 jam 30 menit');
  assert.equal(enriched[0].showDinihariNotice, false);

  // Seg 2: TPE -> SFO 23:30 - 18:40 (stay 13 days in SFO -> NOT a transit!)
  assert.equal(enriched[1].originDetail, 'Taipei (TPE)');
  assert.equal(enriched[1].destinationDetail, 'San Francisco (SFO)');
  assert.equal(enriched[1].transitAfterMinutes, null);
  assert.equal(enriched[1].transitAfterLabel, '');

  // Seg 3: SFO -> TPE 23:50 - 06:00 +2 (08DEC + 2 days = 10DEC), transit 3 jam to Seg 4 (10DEC 09:00)
  assert.equal(enriched[2].departureDate, '2026-12-08');
  assert.equal(enriched[2].arrivalDayOffset, 2);
  assert.equal(enriched[2].arrivalDate, '2026-12-10');
  assert.equal(enriched[2].transitAfterMinutes, 180);
  assert.equal(enriched[2].transitAfterLabel, '3 jam');

  // Seg 4: TPE -> CGK 09:00 - 13:25
  assert.equal(enriched[3].departureDate, '2026-12-10');
  assert.equal(enriched[3].destinationDetail, 'Jakarta (CGK)');
});

test('early morning (00:xx / dinihari) departure auto-triggers H-1 Di airport warning', () => {
  const enriched = computeEnrichedSegments([
    {
      airlineCode: 'GA',
      flightNumber: '874',
      bookingClass: 'Y',
      departureDate: '2026-11-26',
      originCode: 'CGK',
      destinationCode: 'HND',
      departureTime: '00:35',
      arrivalTime: '09:55',
      arrivalDayOffset: 0
    }
  ]);

  assert.equal(enriched[0].isAutoDinihari, true);
  assert.equal(enriched[0].showDinihariNotice, true);
  assert.equal(enriched[0].airportCheckinDate, '2026-11-25');
  assert.match(enriched[0].dinihariNoticeText, /Di airport tgl 25 Nov 2026/i);
});

test('baggage weight vs piece concept, change/refund nonchangeable/nonrefundable toggles, and WhatsApp output', () => {
  assert.equal(buildBaggageText({ baggageConcept: 'weight', baggageWeightKg: '30' }), 'Bagasi 30 Kg');
  assert.equal(
    buildBaggageText({ baggageConcept: 'piece', baggagePieces: '2', baggageWeightPerPiece: '23' }),
    'Bagasi 2 pcs (23 Kg masing-masing)'
  );

  assert.equal(buildChangePolicyText({ isNonChangeable: true }), 'Ticket nonchangeable');
  assert.equal(
    buildChangePolicyText({ isNonChangeable: false, changePenaltyCurrency: 'USD', changePenaltyAmount: '150' }),
    'Tiket masih dapat diubah dengan penalty USD 150 diluar selisih harga & pajak yang berlaku'
  );

  assert.equal(buildRefundPolicyText({ isNonRefundable: true }), 'Ticket nonrefundable');
  assert.equal(
    buildRefundPolicyText({ isNonRefundable: false, refundPenaltyCurrency: 'IDR', refundPenaltyAmount: '1500000' }),
    'Ticket masih bisa direfund dengan penalty IDR 1,500,000 diluar pajak yang tidak kembali dan ketentuan yang berlaku'
  );

  assert.equal(
    buildTimeLimitText({ timeLimitDate: '2026-11-20', timeLimitTime: '15:00', timeLimitTz: 'WIB' }),
    'Batas pembayaran / Batas issued sebelum tanggal 20NOV26 Jam 15:00 WIB'
  );

  const parsed = parseGdsTextFallback(SAMPLE_EVA_AIR_GDS, new Date(Date.UTC(2026, 9, 1)));
  const waText = buildFlightConfirmationWhatsAppText({
    agentBookingCode: 'AGT88X',
    airlinesBookingCode: 'BR99KQ',
    passengers: parsed.passengers,
    segments: parsed.segments,
    priceAdult: '18500000',
    baggageConcept: 'piece',
    baggagePieces: '2',
    baggageWeightPerPiece: '23',
    timeLimitDate: '2026-11-20',
    timeLimitTime: '15:00',
    isNonChangeable: false,
    changePenaltyCurrency: 'USD',
    changePenaltyAmount: '150',
    isNonRefundable: true
  });

  assert.match(waText, /AGT88X/);
  assert.match(waText, /BR99KQ/);
  assert.match(waText, /EVA Air \(BR\)/);
  assert.match(waText, /Jakarta \(CGK\) -> Taipei \(TPE\)/);
  assert.match(waText, /2 jam 30 menit/);
  assert.match(waText, /\+2, Tgl 10 Des 2026/);
  assert.match(waText, /3 jam/);
  assert.match(waText, /IDR 18,500,000 \/Pax/);
  assert.match(waText, /Bagasi 2 pcs \(23 Kg masing-masing\)/);
  assert.match(waText, /Ticket nonrefundable/);
  assert.match(waText, /passport \/ visa yang berlaku/);
});

test('flight reservation payload validator accepts text, image, or PDF and rejects empty payloads', () => {
  assert.equal(validateFlightReservationPayload({}).valid, false);
  assert.equal(validateFlightReservationPayload({ textInput: SAMPLE_EVA_AIR_GDS }).valid, true);
  assert.equal(
    validateFlightReservationPayload({
      fileBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    }).valid,
    true
  );
  const prompt = buildFlightReservationPrompt({ textInput: SAMPLE_EVA_AIR_GDS, currentYear: 2026 });
  assert.match(prompt, /arrivalDayOffset/);
  assert.match(prompt, /BR 238/);
});
