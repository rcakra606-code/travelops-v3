import test from 'node:test';
import assert from 'node:assert/strict';
import Papa from 'papaparse';
import {
  parseFlexibleIdrAmount,
  parseFlexibleFeeEntry,
  parseCombinedFeeSummary,
  parsePicBookerCell,
  normalizeCorporatePhone,
  classifyCorporateEmails,
  buildHeuristicColumnMapping,
  buildCorporateAccountDraftsFromAi
} from './corporateAiParser.js';
import {
  normalizePicContacts,
  picContactsToLegacyFields,
  mergePicContacts,
  arePicContactsEqual
} from './corporatePicHelpers.js';
import { validateCorporateExcelPayload, buildCorporateExcelPrompt } from './corporateAiPrompt.js';

const REAL_CORPORATE_CSV_SAMPLE = ` ,Nama Corporate,PIC Bookers,Contact Email Address,"Contact Email Address
 Alternatif
",Credit Limit,Contact Address,Flight,,,,,,,,Hotel,,,,,,KAI,Airlines Corporate Account,Tier / Entry Pricing,Remarks
,,,,,,,Domestic,International,Reissued,,Refund,,Void,Revalidate,Domestic,International,Reschedule,,Refund,,Domestic,,,
,,,,,,,,,Domestic,International,Domestic,International,,,,,Domestic,International,Domestic,International,,,,
CBINDA,PT BINA ADI DAYA,IBU MEI MEI (089651346555),meimei2082@gmail.com,NaN,"Rp 50,000,000","Graha Penta Prima, Jl. Boulevard Barat Raya, Jakarta Utara 14240
","Rp 15,000/One Way ",0.03,"Rp 100,000","Rp 300,000","Rp 100,000","Rp 300,000",Free,Free,"Rp 50,000/R/N ","Rp 100,000/R/N ","Rp 50,000/R/N ","Rp 100,000/R/N ",TBA,TBA,"Rp 50,000/Tix ",,,
,,BU CHERRIE (0818800756),cherrie@binaadidaya.com,NaN,,,"Rp 30,000/Return ",,,,,,,,,,If able to reschedule,If able to reschedule,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,,
CHEXIN,PT HEXINDO ADIPERKASA TBK,IBU ERI (082110223923),eri@hexindo-tbk.co.id,prastikawati96@gmail.com,"Rp 700,000,000","Kawasan Industri Pulo Gadung, Jakarta Timur 13930",2% DARI TIKET + 11%PPn,2% DARI NETT + 11% PPn,100000,"Rp 200,000",100000,"Rp 200,000",Free,Free,"Rp 35,000/R/N + 11%","Rp 150,000/R/N + 10%","Rp 50,000/R/N + 11%","Rp 100,000/R/N + 11%",TBA,TBA,"Rp 35,000/Tix + 11%",GA,"FXP/R,U*HEXI // FQCGA-HEXI",
,,BAPAK FAZLUR (081908250999),fazlur@hexindo-tbk.co.id,rahmanfazlur.id@gmail.com,,,,,,,,,,,,,If able to reschedule,If able to reschedule,,,,QG,,
,,PAK MURSANI (082122396858),idn-ticketing@hexindo-tbk.co.id,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,,
CTOMAN,PT TOYOTA MOTOR MANUFACTURING INDONESIA TBK,SEKRETARIS TO BOD,,,"Rp 1,000,000,000","Jalan Laksda Yos Sudarso Sunter 1, Jakarta Utara 14350",2.5% DARI NETT + 11%PPn,2.5% DARI NETT + 10% PPn,50000,50000,50000,50000,Free,Free,"Rp 50,000/R/N + 11%","Rp 100,000/R/N + 10%","Rp 50,000/R/N + 11%","Rp 100,000/R/N + 11%",TBA,TBA,"Rp 50,000/Tix + 11%",GA,UFN,
,,APPROVAL BY PAK SAPTONO / PAK ABDUL ROHIM,SAPTONO@toyota.co.id,,,,,,,,,,,,,,If able to reschedule,If able to reschedule,,,,QG,,
,,PAK SAPTONO (081210321292) /  PAK ABDUL (081312341082),Abdul.rohim@toyota.co.id,ririh@toyota.co.id up to Ibu Ririh,,,,,,,,,,,,,,,,,,,,
,,,,,1,,,,,,,,,,,,,,,,,,,
"CASNAT
",PT Astra International Tbk. - Honda Sales Operation,octavianus dwi prijanto putro (chef executive),,,"Rp 500,000,000",Jalan gaya motor raya no 8 sunter II jakarta utara 14430 ,2.5% + 11%PPn (GA),2.5% + 11% PPn,"Rp 35,000","Rp 75,000","Rp 50,000","Rp 100,000","Rp 35,000 Dom","Rp 35,000 Dom","Rp 35,000/R/N + 11%","Rp 75,000/R/N + 11%","Rp 50,000/R/N + 11%","Rp 100,000/R/N + 11%",TBA,TBA,"Rp 35,000/Tix + 11%",GA,"FXP/R,U*AIAM",
,,andina rindani (Gs admin - 085717223124),andina.rindani@hso.astra.co.id,,,,"Rp 10,000 + 11%PPn (Non GA)",,,,,,"Rp 75,000 Int","Rp 75,000 Int",,,If able to reschedule,If able to reschedule,,,,,,
,,"Elisabeth Meliana siahaan GS controller - 0895326396925),",elisabeth.melianasiahaan@hso.astra.co.id,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,,
CSUNTAR,PT NUSANTARA WANA KARYA,Suhendrik : 08999984011,SUHENDRIK@GMAIL.COM,,Rp. 75.000.000,,0.02,0.03,Rp. 100.000,Rp. 390.000,Rp. 100.000,Rp. 390.000,DOM: Rp. 50.000,DOM: 100.000,Rp. 50.000/R/N + 11%,Rp. 100.000/R/N + 11%,Rp. 100.000/R/N + 11%,Rp. 390.000/R/N + 11%,Rp. 100.000,Rp. 390.000,Rp. 50.000,,,
,,Goey Rianthi : 08125093577,NUSANTARAWK@GMAIL.COM,,,,,,,,,,INTL: Rp. 100.000,INTL: Rp. 390.000,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,,
CBINDA,PT BINA ADI DAYA,IBU MEI MEI (089651346555),meimei2082@gmail.com,NaN,"Rp 50,000,000","Graha Penta Prima, Jl. Boulevard Barat Raya, Jakarta Utara 14240","Rp 15,000/One Way ",0.03,"Rp 100,000","Rp 300,000","Rp 100,000","Rp 300,000",Free,Free,"Rp 50,000/R/N ","Rp 100,000/R/N ","Rp 50,000/R/N ","Rp 100,000/R/N ",TBA,TBA,"Rp 50,000/Tix ",SQ,CORPSQ99,Billing tiap tgl 1
,,PAK RUDI (081277778888),rudi@binaadidaya.com,NaN,,,,,,,,,,,,,,,,,,,,`;

test('parseFlexibleIdrAmount handles Indonesian shorthand, Rp prefixes, and comma/dot grouping', () => {
  assert.equal(parseFlexibleIdrAmount('Rp 50.000.000'), 50_000_000);
  assert.equal(parseFlexibleIdrAmount('250,000,000.00'), 250_000_000);
  assert.equal(parseFlexibleIdrAmount('50 Juta'), 50_000_000);
  assert.equal(parseFlexibleIdrAmount('1.5 Miliar'), 1_500_000_000);
  assert.equal(parseFlexibleIdrAmount('750rb'), 750_000);
  assert.equal(parseFlexibleIdrAmount('Unlimited'), 0);
});

test('parseFlexibleFeeEntry strips +11% PPn suffixes and converts 0.03 decimals to 3%', () => {
  assert.deepEqual(parseFlexibleFeeEntry('Rp 15,000/One Way + 11%PPn'), { type: 'nominal', value: 15_000 });
  assert.deepEqual(parseFlexibleFeeEntry('Rp 50,000/R/N + 11%'), { type: 'nominal', value: 50_000 });
  assert.deepEqual(parseFlexibleFeeEntry('IDR 15,000 / PAX / TRANSACTION + 11% Ppn'), { type: 'nominal', value: 15_000 });
  assert.deepEqual(parseFlexibleFeeEntry('3% + 10% PPn'), { type: 'percent', value: 3 });
  assert.deepEqual(parseFlexibleFeeEntry('2.5% DARI NETT + 11%PPn'), { type: 'percent', value: 2.5 });
  assert.deepEqual(parseFlexibleFeeEntry('0.03'), { type: 'percent', value: 3 });
  assert.deepEqual(parseFlexibleFeeEntry(0.04), { type: 'percent', value: 4 });
  assert.deepEqual(parseFlexibleFeeEntry('DOM: Rp. 50.000'), { type: 'nominal', value: 50_000 });
  assert.deepEqual(parseFlexibleFeeEntry('Free'), { type: 'nominal', value: 0 });
  assert.deepEqual(parseFlexibleFeeEntry('TBA'), { type: 'nominal', value: 0 });
  assert.deepEqual(parseFlexibleFeeEntry('4'), { type: 'nominal', value: 0 }); // stray single-digit typo artifact

  const combined = parseCombinedFeeSummary('Dom Rp 50.000, Intl 3%, Reissue 75rb, Void 25rb');
  assert.deepEqual(combined.domestic, { type: 'nominal', value: 50_000 });
  assert.deepEqual(combined.international, { type: 'percent', value: 3 });
});

test('parsePicBookerCell extracts names and Indonesian phones from all real-world formats', () => {
  assert.deepEqual(parsePicBookerCell('IBU MEI MEI (089651346555)'), {
    names: ['IBU MEI MEI'],
    phones: ['089651346555'],
    entries: [{ name: 'IBU MEI MEI', phone: '089651346555' }]
  });
  assert.deepEqual(parsePicBookerCell('PAK SAPTONO (081210321292) / PAK ABDUL (081312341082)'), {
    names: ['PAK SAPTONO', 'PAK ABDUL'],
    phones: ['081210321292', '081312341082'],
    entries: [
      { name: 'PAK SAPTONO', phone: '081210321292' },
      { name: 'PAK ABDUL', phone: '081312341082' }
    ]
  });
  assert.deepEqual(parsePicBookerCell('LILIS NURJANNAH : +62 878-8704-3214'), {
    names: ['LILIS NURJANNAH'],
    phones: ['087887043214'],
    entries: [{ name: 'LILIS NURJANNAH', phone: '087887043214' }]
  });
  assert.deepEqual(parsePicBookerCell('Steven Censuk (62 81372469298)'), {
    names: ['Steven Censuk'],
    phones: ['081372469298'],
    entries: [{ name: 'Steven Censuk', phone: '081372469298' }]
  });
  assert.equal(normalizeCorporatePhone('81234567890'), '081234567890');
  const emails = classifyCorporateEmails('', 'NaN', 'budi@pertamina.com / budi.personal@gmail.com');
  assert.equal(emails.picOfficeEmail, 'budi@pertamina.com');
  assert.equal(emails.picPersonalEmail, 'budi.personal@gmail.com');
});

test('real Dwidayatour 3-row header CSV merges multi-row CustCodes and drops 100% identical duplicate details', () => {
  const parsed = Papa.parse(REAL_CORPORATE_CSV_SAMPLE, { header: false, skipEmptyLines: false });
  const rows = parsed.data;
  const mapping = buildHeuristicColumnMapping(rows);

  assert.deepEqual(mapping.headerRowIndices, [0, 1, 2]);
  assert.equal(mapping.dataStartRowIndex, 3);
  assert.equal(mapping.columnMapping['0'], 'accountCode');
  assert.equal(mapping.columnMapping['1'], 'companyName');
  assert.equal(mapping.columnMapping['2'], 'picContactCombined');
  assert.equal(mapping.columnMapping['7'], 'flightFee.domestic');
  assert.equal(mapping.columnMapping['8'], 'flightFee.international');
  assert.equal(mapping.columnMapping['22'], 'airlinesCode');
  assert.equal(mapping.columnMapping['23'], 'airlinesTier');

  const { drafts, meta } = buildCorporateAccountDraftsFromAi({
    aiResult: mapping,
    allRows: rows,
    existingAccounts: [],
    fileName: 'Corporate_Master.csv',
    sheetName: 'CSV'
  });

  // 5 unique CustCodes (CBINDA appeared twice -> merged into 1! Stray row ",1," ignored!)
  assert.equal(drafts.length, 5);
  assert.equal(meta.counts.intraFileMergedCount, 1);
  assert.ok(meta.counts.identicalDetailsDropped >= 4);

  // CBINDA: merged 2 blocks -> IBU MEI MEI kept ONCE (not duplicated!), BU CHERRIE & PAK RUDI kept, SQ (CORPSQ99) added!
  const cbinda = drafts.find((d) => d.accountCode === 'CBINDA');
  assert.ok(cbinda);
  assert.equal(cbinda.companyName, 'PT BINA ADI DAYA');
  assert.equal(cbinda.creditLimit, 50_000_000);
  assert.deepEqual(cbinda.flightFee.domestic, { type: 'nominal', value: 15_000 });
  assert.deepEqual(cbinda.flightFee.international, { type: 'percent', value: 3 });
  assert.deepEqual(cbinda.hotelFee.domestic, { type: 'nominal', value: 50_000 });
  assert.equal(cbinda.picName.match(/IBU MEI MEI/gi)?.length, 1); // 100% duplicate dropped!
  assert.match(cbinda.picName, /BU CHERRIE/);
  assert.match(cbinda.picName, /PAK RUDI/);
  assert.equal(cbinda.picContacts.length, 3);
  assert.deepEqual(cbinda.picContacts[0], {
    name: 'IBU MEI MEI',
    phone: '089651346555',
    officeEmail: 'meimei2082@gmail.com',
    personalEmail: ''
  });
  assert.deepEqual(cbinda.picContacts[1], {
    name: 'BU CHERRIE',
    phone: '0818800756',
    officeEmail: 'cherrie@binaadidaya.com',
    personalEmail: ''
  });
  assert.deepEqual(cbinda.picContacts[2], {
    name: 'PAK RUDI',
    phone: '081277778888',
    officeEmail: 'rudi@binaadidaya.com',
    personalEmail: ''
  });
  assert.equal(cbinda.picPhone.match(/089651346555/g)?.length, 1);
  assert.match(cbinda.picPhone, /0818800756/);
  assert.match(cbinda.picPhone, /081277778888/);
  assert.match(cbinda.airlinesCode, /SQ \(CORPSQ99\)/);
  assert.match(cbinda.remarks, /Billing tiap tgl 1/);
  assert.ok(!cbinda.picPersonalEmail.includes('nan'));

  // CHEXIN: 3 continuation PIC rows + GA (FXP/R,U*HEXI // FQCGA-HEXI), QG + 2% flight fees + Rp 35,000 hotel dom
  const chexin = drafts.find((d) => d.accountCode === 'CHEXIN');
  assert.ok(chexin);
  assert.equal(chexin.creditLimit, 700_000_000);
  assert.deepEqual(chexin.flightFee.domestic, { type: 'percent', value: 2 });
  assert.deepEqual(chexin.flightFee.international, { type: 'percent', value: 2 });
  assert.deepEqual(chexin.hotelFee.domestic, { type: 'nominal', value: 35_000 });
  assert.equal(chexin.airlinesCode, 'GA (FXP/R,U*HEXI // FQCGA-HEXI) | QG');
  assert.match(chexin.picName, /IBU ERI/);
  assert.match(chexin.picName, /BAPAK FAZLUR/);
  assert.match(chexin.picName, /PAK MURSANI/);
  assert.equal(chexin.picContacts.length, 3);
  assert.equal(chexin.picContacts[1].personalEmail, 'rahmanfazlur.id@gmail.com');

  // CASNAT: trimmed trailing newline from "CASNAT\n" + preserves Non GA & Int void/revalidate remarks
  const casnat = drafts.find((d) => d.accountCode === 'CASNAT');
  assert.ok(casnat);
  assert.equal(casnat.creditLimit, 500_000_000);
  assert.deepEqual(casnat.flightFee.domestic, { type: 'percent', value: 2.5 });
  assert.match(casnat.remarks, /Non GA/i);
  assert.match(casnat.remarks, /Flight Void: Rp 75,000 Int/);
  assert.match(casnat.remarks, /Flight Revalidate: Rp 75,000 Int/);

  // CSUNTAR: decimal 0.02 -> 2%, 0.03 -> 3%, DOM: Rp. 50.000 -> 50000
  const csuntar = drafts.find((d) => d.accountCode === 'CSUNTAR');
  assert.ok(csuntar);
  assert.equal(csuntar.creditLimit, 75_000_000);
  assert.deepEqual(csuntar.flightFee.domestic, { type: 'percent', value: 2 });
  assert.deepEqual(csuntar.flightFee.international, { type: 'percent', value: 3 });
  assert.deepEqual(csuntar.flightFee.void, { type: 'nominal', value: 50_000 });
});

test('DB duplicate check marks 100% identical CustCode as identical and merges only unique details otherwise', () => {
  const rows = [
    ['', 'Nama Corporate', 'PIC Bookers', 'Contact Email Address', 'Credit Limit'],
    ['CBINDA', 'PT BINA ADI DAYA', 'IBU MEI MEI (089651346555)', 'meimei2082@gmail.com', 'Rp 50,000,000'],
    ['CHEXIN', 'PT HEXINDO ADIPERKASA TBK', 'IBU ERI (082110223923)', 'eri@hexindo-tbk.co.id', 'Rp 700,000,000'],
    ['', '', 'PAK BARU (081200001111)', 'baru@hexindo-tbk.co.id', '']
  ];

  const mapping = buildHeuristicColumnMapping(rows);
  const existingAccounts = [
    {
      id: 'CORP-1',
      accountCode: 'CBINDA',
      companyName: 'PT BINA ADI DAYA',
      picName: 'IBU MEI MEI',
      picPhone: '089651346555',
      picOfficeEmail: 'meimei2082@gmail.com',
      picPersonalEmail: '',
      creditLimit: 50_000_000,
      status: 'Active',
      address: '',
      airlinesCode: '',
      detailLink: '',
      remarks: '',
      flightFee: {},
      hotelFee: {}
    },
    {
      id: 'CORP-2',
      accountCode: 'CHEXIN',
      companyName: 'PT HEXINDO ADIPERKASA TBK',
      picName: 'IBU ERI',
      picPhone: '082110223923',
      picOfficeEmail: 'eri@hexindo-tbk.co.id',
      picPersonalEmail: '',
      creditLimit: 700_000_000,
      status: 'Active',
      address: '',
      airlinesCode: '',
      detailLink: '',
      remarks: '',
      flightFee: {},
      hotelFee: {}
    }
  ];

  const { drafts, meta } = buildCorporateAccountDraftsFromAi({
    aiResult: mapping,
    allRows: rows,
    existingAccounts
  });

  const cbinda = drafts.find((d) => d.accountCode === 'CBINDA');
  assert.equal(cbinda._status, 'identical'); // 100% same as DB -> auto-discarded/skipped!
  assert.equal(meta.counts.identicalCount, 1);

  const chexin = drafts.find((d) => d.accountCode === 'CHEXIN');
  assert.equal(chexin._status, 'duplicate'); // Merged into same CustCode with ONLY new PIC/email!
  assert.equal(chexin._existingId, 'CORP-2');
  assert.equal(chexin.picName, 'IBU ERI, PAK BARU'); // IBU ERI NOT duplicated!
  assert.equal(chexin.picPhone, '082110223923, 081200001111');
  assert.equal(chexin.picOfficeEmail, 'eri@hexindo-tbk.co.id, baru@hexindo-tbk.co.id');
  assert.ok(chexin._identicalDetailsDropped >= 4);
});

test('validateCorporateExcelPayload & buildCorporateExcelPrompt validate real preview grids', () => {
  const rows = [
    ['', 'Nama Corporate', 'PIC Bookers', 'Credit Limit'],
    ['CBINDA', 'PT BINA ADI DAYA', 'IBU MEI MEI (089651346555)', 'Rp 50,000,000']
  ];
  assert.equal(validateCorporateExcelPayload({ previewRows: rows, sheetName: 'Master', totalRows: 2 }).valid, true);
  const prompt = buildCorporateExcelPrompt({ previewRows: rows, sheetName: 'Master', totalRows: 2 });
  assert.match(prompt, /picContactCombined/);
  assert.match(prompt, /flightFee\.reissuedIntl/);
});

test('corporatePicHelpers manages multi-PIC tables, deduplicates identical contacts, and syncs legacy fields', () => {
  const fromLegacy = normalizePicContacts([], {
    picName: 'IBU ERI, BAPAK FAZLUR',
    picPhone: '082110223923, 081908250999',
    picOfficeEmail: 'eri@hexindo-tbk.co.id, fazlur@hexindo-tbk.co.id',
    picPersonalEmail: 'prastikawati96@gmail.com'
  });
  assert.equal(fromLegacy.length, 2);
  assert.equal(fromLegacy[0].name, 'IBU ERI');
  assert.equal(fromLegacy[1].phone, '081908250999');

  const merged = mergePicContacts(fromLegacy, [
    // Exact duplicate -> dropped
    { name: 'IBU ERI', phone: '082110223923', officeEmail: 'eri@hexindo-tbk.co.id', personalEmail: 'prastikawati96@gmail.com' },
    // Same person with newly added personal email -> merged into existing person
    { name: 'BAPAK FAZLUR', phone: '081908250999', officeEmail: 'fazlur@hexindo-tbk.co.id', personalEmail: 'rahmanfazlur.id@gmail.com' },
    // Brand new 3rd person
    { name: 'PAK MURSANI', phone: '082122396858', officeEmail: 'idn-ticketing@hexindo-tbk.co.id', personalEmail: '' }
  ]);
  assert.equal(merged.merged.length, 3);
  assert.equal(merged.merged[1].personalEmail, 'rahmanfazlur.id@gmail.com');
  assert.equal(merged.droppedDuplicates >= 3, true);
  assert.equal(arePicContactsEqual(merged.merged, [...merged.merged]), true);

  const legacy = picContactsToLegacyFields(merged.merged);
  assert.equal(legacy.picName, 'IBU ERI, BAPAK FAZLUR, PAK MURSANI');
  assert.equal(legacy.picPhone, '082110223923, 081908250999, 082122396858');
});
