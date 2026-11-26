import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentFilePayload } from './documentAiPrompt.js';
import {
  formatDocumentCountry,
  inferVendorAndVenue,
  normalizeDocumentType,
  normalizeProcessType,
  normalizeIndonesianPhone,
  addBusinessDays,
  buildDocumentDraftsFromAiResult
} from './documentAiParser.js';
import {
  normalizeDocumentApplicants,
  applicantsToGuestName,
  getApplicantDisplaySummary
} from './documentApplicantHelpers.js';

describe('Document AI Request Parser (Lark VISA/DOCUMENT)', () => {
  it('validates PDF magic bytes cleanly', () => {
    const ok = validateDocumentFilePayload('data:application/pdf;base64,JVBERi0xLjQK', 'application/pdf');
    assert.equal(ok.valid, true);
    const bad = validateDocumentFilePayload('data:application/pdf;base64,AAAA', 'application/pdf');
    assert.equal(bad.valid, false);
  });

  it('formats Schengen countries with (Schengen) tag and infers VFS/TLS vendor & venue', () => {
    assert.equal(formatDocumentCountry('Finland'), 'Finland (Schengen)');
    assert.equal(formatDocumentCountry('Finlandia'), 'Finland (Schengen)');
    assert.equal(formatDocumentCountry('France'), 'France (Schengen)');
    assert.equal(formatDocumentCountry('Jepang'), 'Japan');

    const finlandHint = inferVendorAndVenue('Finland (Schengen)');
    assert.equal(finlandHint.supplier, 'VFS Global');
    assert.match(finlandHint.appointmentLocation, /VFS Global/);

    const franceHint = inferVendorAndVenue('France (Schengen)');
    assert.equal(franceHint.supplier, 'TLScontact');
  });

  it('normalizes doc types, process speeds, Indonesian phones, and working-day SLA dates', () => {
    assert.equal(normalizeDocumentType('VISA', 'Tourist', 'Single Join Tour'), 'Tourist Visa');
    assert.equal(normalizeDocumentType('VISA', 'Business', 'Multiple'), 'Business Visa');
    assert.equal(normalizeDocumentType('PASSPORT', 'Renewal', ''), 'Passport Renewal');
    assert.equal(normalizeProcessType('REGULAR'), 'Normal');
    assert.equal(normalizeProcessType('EXPRESS'), 'Express');
    assert.equal(normalizeIndonesianPhone('82297027282'), '+6282297027282');
    assert.equal(normalizeIndonesianPhone('0812-3456-7890'), '+6281234567890');

    // 2026-11-19 (Thu) + 21 working days (Mon-Fri) = 2026-12-18 (Fri)
    assert.equal(addBusinessDays('2026-11-19', 21), '2026-12-18');
  });

  it('maps the exact Lark Finland VISA PDF scenario accurately with Publish Fare, Approval No, Schengen & SLA warning', () => {
    const staffList = [
      { id: '1', name: 'Enrico Dastin', role: 'Staff', status: 'Active' },
      { id: '2', name: 'Emilia Yuninda', role: 'Staff', status: 'Active' }
    ];

    const aiResponse = {
      requestNo: '202611190105',
      approvalNo: 'DOC-DGW-20261119-09924',
      applicationDate: '2026-11-19',
      requesterName: 'Enrico Dastin',
      department: 'Dwidaya World Wide/BRANCH - KELAPA GADING',
      approvalStatus: 'Processing',
      typeDocument: 'VISA',
      visaCategory: 'GROUP',
      visaCountry: 'Finland',
      purpose: 'Tourist',
      visaType: 'Single Join Tour',
      processSpeed: 'REGULAR',
      estimatedDaysRaw: '15 - 21 Hari Kerja',
      estimatedMinDays: 15,
      estimatedMaxDays: 21,
      nettFarePerApplicant: 2900000,
      publishFarePerApplicant: 3100000,
      totalApplicants: 1,
      totalNettFare: 2900000,
      totalPublishFare: 3100000,
      picDocuments: ['Vinka Lois', 'Ananda Annisa', 'Rizky Fadillah', 'Atikah Abdullah'],
      departureDate: '2026-12-19',
      arrivalDate: '2026-12-30',
      durationDays: 12,
      booker: {
        title: 'Mr.',
        fullName: 'Willy Angelius',
        phone: '82297027282',
        email: 'agusmanasye88@gmail.com'
      },
      applicants: [
        {
          title: 'Mr.',
          fullName: 'Agus Manasye',
          category: 'Adult',
          passportNumber: 'X1449170',
          passportExpiredDate: '2033-11-03',
          dateOfBirth: '1969-08-16',
          note: 'Visa Finland Join Tour'
        }
      ],
      approvalRecord: {
        managerName: 'Raden Cakra',
        managerStatus: 'Approved',
        checkerNames: ['Vinka Lois', 'Ananda Annisa', 'Rizky Fadillah', 'Atikah Abdullah'],
        checkerStatus: 'Under Review'
      },
      confidence: 'high',
      warnings: []
    };

    const { drafts, meta } = buildDocumentDraftsFromAiResult(
      aiResponse,
      staffList,
      'Request_VISA_Finland_Agus.pdf'
    );

    assert.equal(drafts.length, 1);
    const d = drafts[0];

    assert.equal(d.docType, 'Tourist Visa');
    assert.equal(d.country, 'Finland (Schengen)');
    assert.equal(d.guestName, 'Mr. Agus Manasye');
    assert.equal(d.phoneNumber, '+6282297027282');
    assert.equal(d.processType, 'Normal');
    assert.equal(d.receiveDate, '2026-11-19');
    assert.equal(d.estimatedDone, '2026-12-18');
    assert.equal(d.bookingCode, 'DOC-DGW-20261119-09924');
    assert.equal(d.price, '3100000');
    assert.equal(d.supplier, 'VFS Global');
    assert.equal(d.staff, 'Enrico Dastin');
    assert.ok(d.notes.length <= 500);
    assert.match(d.notes, /X1449170/);
    assert.match(d.notes, /2\.900\.000/);
    assert.match(d.notes, /Willy Angelius/);

    // Must trigger SLA tight-deadline warning (1 day between 2026-12-18 and 2026-12-19)
    assert.ok(meta.warnings.some((w) => w.includes('Risiko SLA Mepet')));
    // Must flag Booker != Applicant
    assert.ok(meta.warnings.some((w) => w.includes('Willy Angelius')));
    // Must flag Document Checker still Under Review
    assert.ok(meta.warnings.some((w) => w.includes('Under Review')));
  });

  it('combines multi-applicant Lark PDFs into 1 unified multi-applicant record and flags expiring passports (< 7 months)', () => {
    const { draft, drafts, meta } = buildDocumentDraftsFromAiResult(
      {
        approvalNo: 'DOC-DGW-20261120-00111',
        applicationDate: '2026-11-20',
        visaCountry: 'Japan',
        typeDocument: 'VISA',
        purpose: 'Tourist',
        processSpeed: 'REGULAR',
        publishFarePerApplicant: 950000,
        departureDate: '2027-01-10',
        arrivalDate: '2027-01-18',
        applicants: [
          { title: 'Mr.', fullName: 'Budi Santoso', passportNumber: 'C111', passportExpiredDate: '2027-05-01' },
          { title: 'Mrs.', fullName: 'Siti Aminah', passportNumber: 'C222', passportExpiredDate: '2031-05-01' }
        ]
      },
      []
    );

    // Must produce 1 single combined document record with 2 applicants!
    assert.equal(drafts.length, 1);
    assert.equal(draft.applicants.length, 2);
    assert.equal(draft.applicants[0].fullName, 'Mr. Budi Santoso');
    assert.equal(draft.applicants[0].passportNumber, 'C111');
    assert.equal(draft.applicants[1].fullName, 'Mrs. Siti Aminah');
    assert.equal(draft.applicants[1].passportNumber, 'C222');
    assert.equal(draft.guestName, 'Mr. Budi Santoso, Mrs. Siti Aminah');
    assert.equal(draft.price, '1900000');
    assert.equal(draft.supplier, 'JVAC');
    assert.ok(meta.warnings.some((w) => w.includes('Masa berlaku paspor')));
  });

  it('normalizes legacy comma-separated guestName into structured applicants cleanly', () => {
    const apps = normalizeDocumentApplicants([], 'Mr. Andi Wijaya, Mrs. Ratna Sari, Mstr. Kevin');
    assert.equal(apps.length, 3);
    assert.equal(applicantsToGuestName(apps), 'Mr. Andi Wijaya, Mrs. Ratna Sari, Mstr. Kevin');
    const summary = getApplicantDisplaySummary({ applicants: apps });
    assert.equal(summary.count, 3);
    assert.equal(summary.primaryName, 'Mr. Andi Wijaya');
    assert.equal(summary.extraCount, 2);
  });
});
