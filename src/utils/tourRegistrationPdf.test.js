import test from 'node:test';
import assert from 'node:assert/strict';
import {
  terbilangIndonesia,
  formatIndonesianDate,
  formatDepartureDateRange,
  getMinimumDepositTier,
  buildSummaryBoxText,
  getTourDisplayName,
  buildRegistrationFilename,
  buildRegistrationWhatsAppText,
  buildLeadContactNote,
  buildRegistrationEmailDraft,
  sanitizeForPdfText,
  normalizePhoneForWa,
  TERMS_AND_CONDITIONS
} from './tourRegistrationPdf.js';

test('terbilangIndonesia converts participant counts into Title Case Indonesian words', () => {
  assert.equal(terbilangIndonesia(0), 'Nol');
  assert.equal(terbilangIndonesia(1), 'Satu');
  assert.equal(terbilangIndonesia(2), 'Dua');
  assert.equal(terbilangIndonesia(3), 'Tiga');
  assert.equal(terbilangIndonesia(11), 'Sebelas');
  assert.equal(terbilangIndonesia(15), 'Lima Belas');
  assert.equal(terbilangIndonesia(24), 'Dua Puluh Empat');
  assert.equal(terbilangIndonesia(105), 'Seratus Lima');
});

test('formatIndonesianDate & formatDepartureDateRange handle same-year and cross-year dates', () => {
  assert.equal(formatIndonesianDate('2026-11-12', true), '12 NOVEMBER 2026');
  assert.equal(
    formatDepartureDateRange('2027-01-04', '2027-01-10'),
    '04 Januari - 10 Januari 2027'
  );
  assert.equal(
    formatDepartureDateRange('2026-12-28', '2027-01-03'),
    '28 Desember 2026 - 03 Januari 2027'
  );
});

test('getMinimumDepositTier follows exact official Dwidayatour Page 2 S&K tiers', () => {
  assert.equal(getMinimumDepositTier(12000000).amount, 7000000);
  assert.equal(getMinimumDepositTier(18977000).amount, 10000000);
  assert.equal(getMinimumDepositTier(35000000).amount, 15000000);
  assert.equal(getMinimumDepositTier(52000000).amount, 20000000);
});

test('buildSummaryBoxText matches Dwidayatour Korea Voucher PMK + Deposit scenario', () => {
  const form = {
    tourCode: 'VDASKOSKIDMZ',
    tourName: '7D5N VD Korea Incheon Winter with DMZ Ski Experience',
    departureDate: '2027-01-04',
    returnDate: '2027-01-10',
    tourPricePerPax: 18977000,
    paymentMode: 'voucher',
    voucherAmountPerPax: 16900000,
    voucherLabel: 'Voucher PMK',
    voucherPaxCount: 2,
    cashDepositAmount: 10000000,
    participants: [
      { title: 'MR', fullName: 'EDY NURKISWOYO', note: '' },
      { title: 'MRS', fullName: 'EMERALDA ZULKARNAEN KASIM', note: '' },
      { title: 'MISS', fullName: 'KAIANDRA ALULLA SHIDQIA', note: '' }
    ],
    selectedNoteIds: ['pelunasan_21', 'exclude_visa_tipping'],
    customNotes: ''
  };

  const summary = buildSummaryBoxText(form);
  assert.match(summary, /HARGA TOUR : IDR 18,977,000 \/ PAX/);
  assert.match(summary, /DP : IDR 16,900,000 \/ PAX \(Voucher PMK\)/);
  assert.match(summary, /SELISIH HARGA : IDR 2,077,000 X 2 PAX/);
  assert.match(summary, /HARGA TANPA VOUCHER : IDR 18,977,000/);
  assert.match(summary, /DEPOSIT : IDR 10,000,000/);
  assert.match(summary, /PELUNASAN 21 HARI SEBELUM KEBERANGKATAN TOUR/);
  assert.match(summary, /HARGA BELUM TERMASUK VISA DAN TIPPING SELAMA TOUR/);

  assert.equal(
    buildRegistrationFilename(form),
    'FORMULIR_PENDAFTARAN_TOUR_MR_EDY_NURKISWOYO_VDASKOSKIDMZ.pdf'
  );
  assert.equal(
    getTourDisplayName(form),
    'VDASKOSKIDMZ - 7D5N VD Korea Incheon Winter with DMZ Ski Experience'
  );
});

test('buildSummaryBoxText computes regular mode totals and WhatsApp cover message accurately', () => {
  const form = {
    tourCode: 'EHJPNSAKURA',
    tourName: '7D5N Japan Golden Route',
    departureDate: '2027-04-01',
    returnDate: '2027-04-07',
    tourPricePerPax: 25000000,
    paymentMode: 'regular',
    depositPerPax: 10000000,
    roomingNote: 'TWIN ROOM',
    receivedBy: 'Emilia Yuninda',
    branchName: 'Kelapa Gading',
    leadPhone: '0812-1055-607',
    participants: [
      { title: 'MR', fullName: 'BUDI SANTOSO', note: '' },
      { title: 'MRS', fullName: 'SITI AMINAH', note: '' }
    ],
    selectedNoteIds: ['pelunasan_21']
  };

  const summary = buildSummaryBoxText(form);
  assert.match(summary, /TOTAL DP \(2 PAX\) : IDR 20,000,000/);
  assert.match(summary, /TOTAL HARGA TOUR : IDR 50,000,000/);
  assert.match(summary, /SISA PELUNASAN : IDR 30,000,000/);

  assert.equal(normalizePhoneForWa(form.leadPhone), '628121055607');

  const wa = buildRegistrationWhatsAppText(form);
  assert.match(wa, /Halo MR BUDI SANTOSO/);
  assert.match(wa, /2 \(Dua\) Peserta/);
  assert.match(wa, /Emilia Yuninda — Dwidayatour Kelapa Gading/);
  assert.equal(TERMS_AND_CONDITIONS.rightColumn.length, 7);

  assert.equal(
    buildLeadContactNote('+628121055607', 'budi@example.com', 'VEGETARIAN'),
    'NOTELP: +628121055607\nEMAIL: budi@example.com\nVEGETARIAN'
  );

  const mail = buildRegistrationEmailDraft({ ...form, leadEmail: 'budi@example.com' });
  assert.equal(mail.to, 'budi@example.com');
  assert.match(mail.subject, /EHJPNSAKURA/);
  assert.match(mail.mailtoUrl, /^mailto:budi%40example\.com\?subject=/);

  assert.equal(
    sanitizeForPdfText('• “Korea” – Winter ≥45 hari ✈️'),
    '- "Korea" - Winter >=45 hari '
  );
});
