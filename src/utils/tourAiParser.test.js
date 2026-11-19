import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCountryName,
  normalizePaxTitle,
  matchStaffName,
  buildDraftFromAiResult
} from './tourAiParser.js';
import {
  validateRegistrationFilePayload,
  buildTourRegistrationPrompt
} from './tourRegistrationPrompt.js';

describe('Tour Registration AI Parser & Draft Builder', () => {
  it('validates PDF and image payloads via MIME & magic bytes', () => {
    const validPdf = validateRegistrationFilePayload('data:application/pdf;base64,JVBERi0xLjQK', 'application/pdf');
    assert.equal(validPdf.valid, true);
    assert.equal(validPdf.mimeType, 'application/pdf');

    const validJpg = validateRegistrationFilePayload('data:image/jpeg;base64,/9j/4AAQSkZJRg==', 'image/jpeg');
    assert.equal(validJpg.valid, true);

    const fakePdf = validateRegistrationFilePayload('data:application/pdf;base64,SGVsbG8gd29ybGQ=', 'application/pdf');
    assert.equal(fakePdf.valid, false);

    const unsupported = validateRegistrationFilePayload('data:text/plain;base64,SGVsbG8=', 'text/plain');
    assert.equal(unsupported.valid, false);
  });

  it('normalizes Indonesian destination names and passenger titles accurately', () => {
    assert.equal(normalizeCountryName('Korea'), 'South Korea');
    assert.equal(normalizeCountryName('', '7D5N VD Korea Incheon Winter with DMZ Ski'), 'South Korea');
    assert.equal(normalizeCountryName('Jepang'), 'Japan');
    assert.equal(normalizeCountryName('Swiss'), 'Switzerland');

    assert.equal(normalizePaxTitle('MR.'), 'Mr');
    assert.equal(normalizePaxTitle('MRS'), 'Mrs');
    assert.equal(normalizePaxTitle('MISS'), 'Miss');
    assert.equal(normalizePaxTitle('MSTR.'), 'Mstr');
  });

  it('fuzzy-matches consultant nickname from registration form to active staff directory', () => {
    const staff = [
      { name: 'Emilia Yuninda' },
      { name: 'Tjong Ma Valentine' },
      { name: 'Avriela Jasmine Unaisah' }
    ];
    assert.equal(matchStaffName('Emil dari cabang : Kelapa Gading', staff), 'Emilia Yuninda');
    assert.equal(matchStaffName('Avriela', staff), 'Avriela Jasmine Unaisah');
    assert.equal(matchStaffName('Unknown Person', staff, 'Fallback Staff'), 'Fallback Staff');
  });

  it('builds a mathematically synced TourWizard draft matching the Dwidayatour PDF scenario', () => {
    const mockGeminiOutput = {
      tourType: 'Series',
      tourCode: 'VDASKOSKIDMZ',
      tourTitle: '7D5N VD Korea Incheon Winter with DMZ Ski Experience',
      bookingCode: '',
      country: 'Korea',
      category: 'Leisure',
      departureDate: '2027-01-04',
      returnDate: '2027-01-10',
      paxCount: 3,
      staffName: 'Emil dari cabang Kelapa Gading',
      roomingNote: 'TRIPLE ROOM',
      paxInfo: [
        { title: 'MR', firstName: 'EDY', lastName: 'NURKISWOYO', phone: '+628121055607', basicPrice: 18977000 },
        { title: 'MRS', firstName: 'EMERALDA', lastName: 'ZULKARNAEN KASIM', basicPrice: 18977000 },
        { title: 'MISS', firstName: 'KAIANDRA', lastName: 'ALULLA SHIDQIA', basicPrice: 18977000 }
      ],
      financials: {
        basicTourPrice: 56931000,
        depositAmount: 43800000,
        paymentSummary: '2 Pax Voucher PMK Rp 16.900.000/pax + Deposit Rp 10.000.000'
      },
      importantNotes: ['Pelunasan 21 hari sebelum keberangkatan', 'Harga belum termasuk visa & tipping'],
      warnings: ['Paragraf atas tertulis 2 Peserta, namun tabel berisi 3 nama & TRIPLE ROOM'],
      confidence: 'high'
    };

    const draft = buildDraftFromAiResult(mockGeminiOutput, {
      activeStaff: [{ name: 'Emilia Yuninda' }],
      defaultStaffName: '',
      fileName: 'Formulir_Pendaftaran_Korea.pdf'
    });

    assert.equal(draft.tourCode, 'VDASKOSKIDMZ');
    assert.equal(draft.country, 'South Korea');
    assert.equal(draft.departureDate, '2027-01-04');
    assert.equal(draft.returnDate, '2027-01-10');
    assert.equal(draft.paxCount, 3);
    assert.equal(draft.staffName, 'Emilia Yuninda');
    assert.equal(draft.paxInfo[0].title, 'Mr');
    assert.equal(draft.paxInfo[0].phone, '+628121055607');
    assert.equal(draft.paxInfo[2].title, 'Miss');
    assert.equal(draft.financials.totalSellingPrice, 56931000);
    assert.equal(draft.financials.depositAmount, 43800000);
    assert.equal(draft.financials.sisaPelunasan, 13131000);
    assert.equal(draft._aiMeta.warnings.length, 1);
    assert.equal(draft.bookingCode, '');

    const prompt = buildTourRegistrationPrompt(['Emilia Yuninda']);
    assert.ok(prompt.includes('Emilia Yuninda'));
  });
});
