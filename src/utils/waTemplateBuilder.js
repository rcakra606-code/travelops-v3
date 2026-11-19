import { formatCurrency } from './currency.js';

/**
 * Normalizes an Indonesian / international phone string into WhatsApp wa.me numeric format.
 */
export const sanitizeWhatsAppPhone = (rawPhone) => {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  return digits.length >= 8 ? digits : '';
};

/**
 * Builds a wa.me URL for opening WhatsApp Web/App directly.
 */
export const buildWhatsAppUrl = (message, rawPhone = '') => {
  const cleanPhone = sanitizeWhatsAppPhone(rawPhone);
  const encoded = encodeURIComponent(message || '');
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
};

const formatDateId = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getPublicTrackerUrl = (code) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return code ? `${origin}/track?code=${encodeURIComponent(code)}` : `${origin}/track`;
};

const getTourLeadName = (tour) => {
  if (Array.isArray(tour?.paxInfo) && tour.paxInfo.length > 0) {
    const first = tour.paxInfo.find((p) => p?.name && String(p.name).trim());
    if (first) return `${first.title ? `${first.title} ` : ''}${first.name}`.trim();
  }
  return tour?.leadPax || 'Bapak/Ibu';
};

/**
 * Returns an array of ready-to-send WhatsApp templates for a given module & record.
 */
export const getWhatsAppTemplates = (moduleType, record, staffName = '') => {
  if (!record) return [];
  const picSignOff = staffName || record.staffName || record.staff || 'Tim TravelOps';

  if (moduleType === 'tour') {
    const guest = getTourLeadName(record);
    const code = record.bookingCode || record.tourCode || '-';
    const dest = record.country || 'Destinasi Tour';
    const dep = formatDateId(record.departureDate);
    const ret = formatDateId(record.returnDate);
    const fin = record.financials || {};
    const total = Number(fin.totalSellingPrice ?? fin.totalOmset ?? record.totalSellingPrice ?? 0);
    const dp = Number(fin.depositAmount ?? record.depositAmount ?? 0);
    const sisa = Math.max(0, total - dp);
    const trackerLink = getPublicTrackerUrl(record.bookingCode || record.tourCode);

    const templates = [];

    if (sisa > 0) {
      templates.push({
        id: 'tour-payment',
        label: 'Reminder Pelunasan (Balance Due)',
        badge: formatCurrency(sisa),
        message: [
          `Halo ${guest},`,
          ``,
          `Kami ingin mengingatkan rincian pelunasan paket tour Anda:`,
          `• Kode Booking: *${code}*`,
          `• Destinasi: *${dest}* (${record.paxCount || 1} Pax)`,
          `• Tanggal Perjalanan: *${dep} s/d ${ret}*`,
          `• Total Paket: ${formatCurrency(total)}`,
          `• Deposit Masuk: ${formatCurrency(dp)}`,
          `• *Sisa Pelunasan: ${formatCurrency(sisa)}*`,
          ``,
          `Mohon konfirmasi bukti transfer setelah melakukan pelunasan agar proses tiket & dokumen dapat kami selesaikan tepat waktu.`,
          ``,
          `Terima kasih,`,
          `*${picSignOff}*`
        ].join('\n')
      });
    }

    templates.push({
      id: 'tour-tracker',
      label: 'Kirim Link Guest Status Tracker',
      badge: 'Portal Tamu',
      message: [
        `Halo ${guest},`,
        ``,
        `Berikut tautan untuk memantau perkembangan status perjalanan *${dest}* (Kode: *${code}*) secara real-time:`,
        `${trackerLink}`,
        ``,
        `Jika ada pertanyaan terkait jadwal atau dokumen, silakan hubungi kami kapan saja.`,
        ``,
        `Salam hangat,`,
        `*${picSignOff}*`
      ].join('\n')
    });

    templates.push({
      id: 'tour-briefing',
      label: 'Briefing Persiapan Keberangkatan',
      badge: 'Pre-Departure',
      message: [
        `Halo ${guest},`,
        ``,
        `Menjelang keberangkatan tour *${dest}* pada *${dep}* (Kode: *${code}*), mohon pastikan kelengkapan berikut:`,
        `1. Paspor asli (masa berlaku min. 6 bulan dari tanggal kembali)`,
        `2. Visa / e-Visa & asuransi perjalanan (jika berlaku)`,
        `3. Obat-obatan pribadi & adaptor colokan sesuai negara tujuan`,
        `4. Hadir di meeting point bandara minimal 3 jam sebelum keberangkatan`,
        ``,
        `Selamat mempersiapkan perjalanan!`,
        `*${picSignOff}*`
      ].join('\n')
    });

    return templates;
  }

  if (moduleType === 'document') {
    const guest = record.guestName || 'Bapak/Ibu';
    const docType = record.docType || 'Visa / Paspor';
    const country = record.country || '';
    const appDate = formatDateId(record.appointmentDate);
    const appTime = record.appointmentTime || '';
    const venue = record.appointmentLocation || 'Pusat Aplikasi Visa / Kedutaan';
    const trackerCode = record.bookingCode || record.tourCode || record.invoiceNumber || '';
    const trackerLink = getPublicTrackerUrl(trackerCode);

    const templates = [];

    if (record.appointmentDate) {
      templates.push({
        id: 'doc-appointment',
        label: 'Reminder Jadwal Visa Appointment',
        badge: appDate,
        message: [
          `Halo ${guest},`,
          ``,
          `Mengingatkan jadwal pengajuan/biometrik *${docType} ${country}*:`,
          `• Tanggal: *${appDate}*${appTime ? ` pukul *${appTime}*` : ''}`,
          `• Lokasi: *${venue}*`,
          ``,
          `Mohon membawa paspor asli, pasfoto terbaru, serta dokumen pendukung asli sesuai checklist. Disarankan hadir 30 menit lebih awal.`,
          ``,
          `Terima kasih,`,
          `*${picSignOff}*`
        ].join('\n')
      });
    }

    templates.push({
      id: 'doc-missing',
      label: 'Follow-Up Kelengkapan Berkas',
      badge: 'Intake',
      message: [
        `Halo ${guest},`,
        ``,
        `Terkait pengurusan *${docType} ${country}*, mohon bantuan untuk segera melengkapi dokumen pendukung yang kurang agar proses pengajuan ke kedutaan dapat berjalan sesuai estimasi (*${formatDateId(record.estimatedDone)}*).`,
        ``,
        `Silakan kirimkan dokumen melalui WA ini atau serahkan langsung ke kantor kami.`,
        ``,
        `Terima kasih,`,
        `*${picSignOff}*`
      ].join('\n')
    });

    templates.push({
      id: 'doc-status',
      label: 'Update Status / Info Pengiriman AWB',
      badge: record.shippingStatus || 'Logistik',
      message: [
        `Halo ${guest},`,
        ``,
        `Berikut update terkini dokumen *${docType} ${country}* Anda:`,
        `• Status Logistik: *${record.shippingStatus || 'Dalam Proses'}*`,
        ...(record.shippingCourier ? [`• Kurir: *${record.shippingCourier}*`] : []),
        ...(record.awbNumber ? [`• No. Resi / AWB: *${record.awbNumber}*`] : []),
        ...(trackerCode ? [`• Pantau Status: ${trackerLink}`] : []),
        ``,
        `Terima kasih atas kepercayaan Anda,`,
        `*${picSignOff}*`
      ].join('\n')
    });

    return templates;
  }

  if (moduleType === 'hotel') {
    const guest = record.guestName || 'Bapak/Ibu';
    const hotel = record.hotelName || 'Hotel';
    const code = record.bookingCode || '-';
    const checkIn = formatDateId(record.checkIn);
    const checkOut = formatDateId(record.checkOut);
    const trackerLink = getPublicTrackerUrl(record.bookingCode);

    return [
      {
        id: 'hotel-confirm',
        label: 'Konfirmasi Reservasi & Voucher Hotel',
        badge: checkIn,
        message: [
          `Halo ${guest},`,
          ``,
          `Berikut detail konfirmasi reservasi hotel Anda:`,
          `• Hotel: *${hotel}*`,
          `• Kode Booking: *${code}*`,
          `• Check-In: *${checkIn}* | Check-Out: *${checkOut}*`,
          `• Tipe Kamar: ${record.roomType || '-'} (${record.roomCount || 1} Kamar)`,
          ...(record.mealPlan ? [`• Paket Makan: ${record.mealPlan}`] : []),
          ``,
          `Pantau status reservasi: ${trackerLink}`,
          ``,
          `Semoga menginap Anda menyenangkan!`,
          `*${picSignOff}*`
        ].join('\n')
      }
    ];
  }

  if (moduleType === 'cruise') {
    const guest = record.guestName || 'Bapak/Ibu';
    const ship = record.shipName || record.cruiseBrand || 'Kapal Pesiar';
    const ref = record.bookingRef || record.bookingCode || '-';
    const start = formatDateId(record.sailingStart);
    const end = formatDateId(record.sailingEnd);
    const trackerLink = getPublicTrackerUrl(ref);

    return [
      {
        id: 'cruise-confirm',
        label: 'Info Sailing & Embarkasi Cruise',
        badge: start,
        message: [
          `Halo ${guest},`,
          ``,
          `Berikut ringkasan jadwal pelayaran cruise Anda:`,
          `• Kapal / Operator: *${ship}*`,
          `• Booking Ref: *${ref}*`,
          `• Tanggal Pelayaran: *${start} s/d ${end}*`,
          ...(record.cabinType ? [`• Kabin: ${record.cabinType}${record.cabinNumber ? ` (#${record.cabinNumber})` : ''}`] : []),
          ...(record.route ? [`• Rute: ${record.route}`] : []),
          ``,
          `Mohon pastikan proses online check-in & paspor berlaku min. 6 bulan sudah siap sebelum embarkasi.`,
          `Link status: ${trackerLink}`,
          ``,
          `Salam hangat,`,
          `*${picSignOff}*`
        ].join('\n')
      }
    ];
  }

  if (moduleType === 'telecom') {
    const guest = record.namaTamu || record.guestName || 'Bapak/Ibu';
    const product = record.jenisProduk || record.productType || 'SIM / eSIM / WiFi';
    const country = record.negara || record.country || '-';
    const start = formatDateId(record.tanggalMulai);
    const end = formatDateId(record.tanggalSelesai);

    return [
      {
        id: 'telecom-info',
        label: 'Info Aktivasi / Pengambilan SIM & WiFi',
        badge: product,
        message: [
          `Halo ${guest},`,
          ``,
          `Berikut detail pesanan konektivitas perjalanan Anda:`,
          `• Produk: *${product}* (${country})`,
          `• Masa Aktif: *${start} s/d ${end}*`,
          ...(record.kodeBooking ? [`• Kode Ref: *${record.kodeBooking}*`] : []),
          ``,
          `Jika membutuhkan panduan instalasi eSIM atau jadwal pickup/pengiriman perangkat, silakan balas pesan ini ya.`,
          ``,
          `Terima kasih,`,
          `*${picSignOff}*`
        ].join('\n')
      }
    ];
  }

  return [];
};
