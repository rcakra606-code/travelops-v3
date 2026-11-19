import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeWhatsAppPhone,
  buildWhatsAppUrl,
  getWhatsAppTemplates
} from './waTemplateBuilder.js';

describe('WhatsApp Operational Template Builder', () => {
  it('normalizes Indonesian and international phone numbers safely', () => {
    assert.equal(sanitizeWhatsAppPhone('0812-3456-7890'), '6281234567890');
    assert.equal(sanitizeWhatsAppPhone('+62 811 2233 4455'), '6281122334455');
    assert.equal(sanitizeWhatsAppPhone('6281999888777'), '6281999888777');
    assert.equal(sanitizeWhatsAppPhone('123'), '');
    assert.equal(sanitizeWhatsAppPhone(''), '');
  });

  it('builds wa.me URLs with or without target phone', () => {
    const withPhone = buildWhatsAppUrl('Halo Tamu', '08123456789');
    assert.ok(withPhone.startsWith('https://wa.me/628123456789?text='));

    const withoutPhone = buildWhatsAppUrl('Halo Tamu', '');
    assert.ok(withoutPhone.startsWith('https://wa.me/?text='));
  });

  it('generates Tour payment reminder when balance due > 0 and omits it when fully paid', () => {
    const dueTour = {
      bookingCode: 'DWW50230',
      country: 'Switzerland',
      departureDate: '2027-03-09',
      returnDate: '2027-03-21',
      paxCount: 2,
      paxInfo: [{ title: 'Mr.', name: 'Budi Santoso' }],
      financials: {
        totalSellingPrice: 62000000,
        depositAmount: 20000000
      }
    };
    const dueTemplates = getWhatsAppTemplates('tour', dueTour, 'Emilia');
    assert.equal(dueTemplates.length, 3);
    assert.equal(dueTemplates[0].id, 'tour-payment');
    assert.ok(dueTemplates[0].message.includes('Mr. Budi Santoso'));
    assert.ok(dueTemplates[0].message.includes('DWW50230'));
    assert.ok(dueTemplates[0].message.includes('Emilia'));

    const paidTour = {
      ...dueTour,
      financials: { totalSellingPrice: 62000000, depositAmount: 62000000 }
    };
    const paidTemplates = getWhatsAppTemplates('tour', paidTour, 'Emilia');
    assert.equal(paidTemplates.length, 2);
    assert.ok(!paidTemplates.some((t) => t.id === 'tour-payment'));
  });

  it('generates Document, Hotel, Cruise, and Telecom operational templates cleanly', () => {
    const docTpls = getWhatsAppTemplates('document', {
      guestName: 'Ani Wijaya',
      docType: 'Schengen Visa',
      country: 'France',
      appointmentDate: '2027-02-15',
      shippingStatus: 'Sent',
      awbNumber: 'JNE998877'
    });
    assert.equal(docTpls.length, 3);
    assert.ok(docTpls[0].message.includes('Ani Wijaya'));
    assert.ok(docTpls[2].message.includes('JNE998877'));

    const hotelTpls = getWhatsAppTemplates('hotel', {
      guestName: 'Rudi',
      hotelName: 'Shinjuku Prince Hotel',
      bookingCode: 'HTL-991',
      checkIn: '2027-04-01',
      checkOut: '2027-04-05'
    });
    assert.equal(hotelTpls.length, 1);
    assert.ok(hotelTpls[0].message.includes('Shinjuku Prince Hotel'));

    const cruiseTpls = getWhatsAppTemplates('cruise', {
      guestName: 'Siti',
      shipName: 'Spectrum of the Seas',
      bookingRef: 'CRS-123'
    });
    assert.equal(cruiseTpls.length, 1);
    assert.ok(cruiseTpls[0].message.includes('Spectrum of the Seas'));

    const telecomTpls = getWhatsAppTemplates('telecom', {
      namaTamu: 'Hendra',
      jenisProduk: 'eSIM',
      negara: 'Japan'
    });
    assert.equal(telecomTpls.length, 1);
    assert.ok(telecomTpls[0].message.includes('Hendra'));
  });
});
