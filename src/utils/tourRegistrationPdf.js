/**
 * Dwidayatour Official 2-Page Tour Registration Form — Helpers, Legal S&K, & PDF Generator
 * Pure document generator (stateless, does NOT write to database).
 */

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const TERBILANG_UNITS = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas'
];

export const DEFAULT_NOTE_PRESETS = [
  {
    id: 'pelunasan_21',
    label: 'Pelunasan 21 hari sebelum keberangkatan',
    text: 'PELUNASAN 21 HARI SEBELUM KEBERANGKATAN TOUR',
    defaultChecked: true
  },
  {
    id: 'exclude_visa_tipping',
    label: 'Harga belum termasuk Visa & Tipping',
    text: 'HARGA BELUM TERMASUK VISA DAN TIPPING SELAMA TOUR',
    defaultChecked: true
  },
  {
    id: 'price_subject_change',
    label: 'Harga & jadwal dapat berubah sebelum issued',
    text: 'HARGA DAN JADWAL DAPAT BERUBAH SEWAKTU-WAKTU SEBELUM ISSUED',
    defaultChecked: false
  },
  {
    id: 'exclude_passport',
    label: 'Belum termasuk pembuatan paspor & pengeluaran pribadi',
    text: 'HARGA BELUM TERMASUK BIAYA PASPOR DAN PENGELUARAN PRIBADI',
    defaultChecked: false
  }
];

export const ROOMING_PRESETS = [
  'TWIN / DOUBLE ROOM',
  'TRIPLE ROOM',
  'SINGLE ROOM',
  '1 TWIN + 1 TRIPLE ROOM',
  '2 TWIN ROOM'
];

/**
 * Standard Official Dwidayatour Terms & Conditions (Page 2 — Locked / Verbatim)
 */
export const TERMS_AND_CONDITIONS = {
  title: 'SYARAT DAN KETENTUAN',
  depositTable: [
    ['Harga Tour < Rp. 14.999.999,-', 'Rp. 7.000.000,-/orang'],
    ['Harga Tour Rp. 15.000.000,- - Rp. 29.999.999,-', 'Rp. 10.000.000,-/orang'],
    ['Harga Tour Rp. 30.000.000,- - Rp. 44.999.999,-', 'Rp. 15.000.000,-/orang'],
    ['Harga Tour >Rp. 45.000.000,-', 'Rp 20.000.000,-/ orang']
  ],
  depositFootnote:
    '**Deposit tidak dapat dikembalikan ( non refundable ), kecuali pembatalan dari Dwidayatour',
  cancellationTable: [
    ['>= 45 hari', 'Sejumlah DP', '≥45 hari'],
    ['44-15 hari', '50%', '44-15 hari'],
    ['14-8 hari', '75%', '14-8 hari'],
    ['<= 7 hari', '100%', '≤ 7 hari']
  ],
  cancellationFootnotes: [
    '* terhitung dari sebelum tanggal keberangkatan',
    '** terhitung dari total biaya tour'
  ],
  leftColumn: {
    clause1Title: 'Pemesanan dan Pelunasan Biaya',
    clause1aIntro:
      'Setiap pemesanan harus disertai dengan Formulir Pendaftaran yang telah ditandatangani dan pembayaran uang muka (deposit) yang mengikat jenis tour pilihan, sekurang-kurangnya sejumlah:',
    clause1aAfterTable:
      'Pemesanan yang tidak disertai dengan Formulir Pendaftaran yang telah ditandatangani dan pembayaran uang muka sebagaimana disebutkan di atas, maka sewaktu-waktu pemesanannya dapat dibatalkan dan kuotanya dapat digantikan oleh peserta lain dengan pemberitahuan tertulis sebelumnya. Pelunasan sisa pembayaran harus dilakukan paling lambat 21 (dua puluh satu) hari sebelum tanggal keberangkatan ("Pelunasan"), walaupun visa perjalanan masih dalam proses atau permintaan deviasi belum terpenuhi.',
    clause1b:
      'Dwidayatour akan melakukan pemberitahuan secara tertulis kepada peserta sebanyak 3 (tiga) kali, untuk melakukan Pelunasan. Apabila peserta tidak memberikan konfirmasi terkait Pelunasan dalam 1x24 jam setelah adanya pemberitahuan ketiga dari Dwidayatour, maka peserta dianggap membatalkan tour sesuai angka 2 Syarat dan Ketentuan.',
    clause1c:
      'Pembayaran yang sah hanya melalui transfer ke rekening atas nama PT Dwidaya World Wide ("Dwidayatour") dengan mencantumkan kode booking pada keterangan pembayaran dan menyerahkan bukti pembayarannya kepada staff di kantor cabang Dwidayatour. Kami tidak bertanggungjawab atas segala risiko yang timbul atas pembayaran yang tidak ditujukan ke rekening resmi Dwidayatour.',
    clause2Title: 'Pembatalan dan Biaya Pembatalan',
    clause2a:
      'Dalam hal ketentuan angka 1 huruf b terjadi atau peserta menyampaikan pembatalan keikutsertaan secara tertulis, maka Dwidayatour akan memproses pembatalan sesuai Angka 2 Syarat dan Ketentuan.',
    clause2b:
      'Dwidayatour akan memberikan pemberitahuan tertulis kepada peserta apabila ada biaya Pembatalan yang akan dikenakan kepada peserta, sesuai ketentuan maskapai, hotel, dan penyedia jasa terkait yang bekerjasama dengan Dwidayatour.',
    clause2bTableIntro: 'Ketentuan perhitungan biaya Pembatalan adalah sebagai berikut:',
    clause2c:
      'Peserta sepakat bahwa biaya pengurusan visa termasuk salah satu komponen dalam biaya Pembatalan yang tidak dapat dikembalikan, sesuai ketentuan Kedutaan terkait.',
    clause2d:
      'Dwidayatour tidak bertanggungjawab atas kebijakan atau keputusan yang dikeluarkan oleh pihak Kedutaan berkaitan dengan permohonan dokumen Visa. Pembatalan tour yang diakibatkan karena visa yang ditolak atau terlambat disetujui, mengacu pada ketentuan 2.b.',
    clause2e:
      'Apabila terjadi proses pembatalan/cancellation dan/atau pengembalian uang/refund terhadap pembayaran uang muka tour dengan fasilitas kartu kredit, maka pengembalian dana akan dilakukan ke kartu kredit yang digunakan untuk membayar dengan dikurangi biaya administrasi yang berlaku.'
  },
  rightColumn: [
    {
      num: '3.',
      title: 'Deviasi/Perubahan jadwal',
      items: [
        {
          label: 'a.',
          text: 'Biaya Deviasi/perubahan Jadwal atas perjalanan yang telah disepakati sebelumnya, akan sepenuhnya menjadi tanggung jawab peserta. Dwidayatour akan memberikan informasi atas biaya Deviasi terlebih dahulu kepada peserta secara tertulis.'
        },
        {
          label: 'b.',
          text: 'Konfirmasi Deviasi akan dilakukan berdasarkan ketersediaan tiket dari pihak maskapai. Jika deviasi sudah dikonfirmasi oleh peserta maka jadwal awal tidak berlaku lagi. Jika deviasi tidak dikonfirmasi dari pihak maskapai maka akan kembali ke jadwal awal.'
        }
      ]
    },
    {
      num: '4.',
      title: 'Force Majeure',
      paragraph:
        'Dalam hal terjadi Force Majeure, yaitu kejadian di luar kendali Dwidayatour, termasuk namun tidak terbatas pada kejadian-kejadian seperti bencana alam, perang, huru-hara, pemogokan, pandemi, epidemi, sabotase, kebakaran, dan kebijakan pemerintah setempat yang berkaitan dengan keberlangsungan tour, maka hal tersebut bukan merupakan tanggung jawab Dwidayatour, namun, Dwidayatour akan mengupayakan untuk mendapatkan alternatif pengganti terbaik.'
    },
    {
      num: '5.',
      title: 'Pembatasan Tanggung Jawab',
      items: [
        {
          label: 'a.',
          text: 'Dwidayatour tidak bertanggung jawab atas kehilangan barang-barang pribadi yang dibawa peserta, kehilangan bagasi, kelebihan bagasi, penahanan oleh pihak bandara maupun hotel, karantina, atau hal-hal lain yang terkait dengan tanggung jawab pribadi sepanjang perjalanan. Namun Dwidayatour akan berusaha membantu mengurangi dan mengantisipasi kejadian-kejadian tersebut dengan memberikan pemberitahuan kepada peserta.'
        },
        {
          label: 'b.',
          text: 'Dwidayatour dapat merubah maskapai penerbangan, jadwal penerbangan, jadwal perjalanan maupun susunan acara, untuk disesuaikan dengan kondisi, dengan pemberitahuan tertulis untuk dapat disepakati oleh peserta.'
        }
      ]
    },
    {
      num: '6.',
      title: 'Komponen di Luar Biaya Tour',
      items: [
        {
          label: 'a.',
          text: 'Biaya pembuatan paspor, visa, pajak bandara, bea masuk barang yang dikenakan oleh pabean.'
        },
        {
          label: 'b.',
          text: 'Biaya Single Supplement bagi peserta yang tidur sekamar sendiri.'
        },
        {
          label: 'c.',
          text: 'Tips untuk Tour Leader, Local Guide dan pengemudi (kecuali paket tertentu).'
        },
        {
          label: 'd.',
          text: 'Biaya kelebihan berat bagasi.'
        },
        {
          label: 'e.',
          text: 'Pengeluaran pribadi seperti laundry, pay-tv, minibar, telepon, dan lain-lain.'
        }
      ]
    },
    {
      num: '7.',
      title: 'Paspor dan Visa',
      items: [
        {
          label: 'a.',
          text: 'Peserta wajib melakukan pembayaran biaya pengurusan visa (jika ada) bersamaan dengan pembayaran uang muka.'
        },
        {
          label: 'b.',
          text: 'Paspor peserta yang diserahkan kepada Dwidayatour, adalah paspor dengan masa berlaku sekurang-kurangnya 7 (tujuh) bulan atau lebih (sesuai dengan peraturan negara yang dikunjungi), terhitung sampai dengan peserta tiba kembali ke negara asal.'
        },
        {
          label: 'c.',
          text: 'Peserta wajib menyerahkan paspor, dokumen persyaratan serta biaya pengurusan visa sesuai dengan jadwal yang telah ditentukan oleh Dwidayatour pada saat melakukan pembayaran Deposit.'
        },
        {
          label: 'd.',
          text: 'Proses pengurusan dan perolehan persetujuan visa sepenuhnya tergantung kepada ketentuan dan keputusan dari kedutaan/konsulat negara yang bersangkutan. Waktu, ketentuan dan syarat-syarat yang diminta oleh kedutaan/konsulat dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu.'
        }
      ]
    },
    {
      num: '8.',
      title: 'Wanita hamil dan peserta tur yang membutuhkan perhatian khusus',
      items: [
        {
          label: 'a.',
          text: 'Wanita dengan usia kehamilan lebih dari 6 (enam) bulan tidak diperkenankan untuk ikut sebagai peserta perjalanan. Hal ini dilakukan demi keselamatan dan sesuai dengan peraturan maskapai penerbangan yang berlaku.'
        },
        {
          label: 'b.',
          text: 'Demi kelancaran perjalanan keseluruhan grup, peserta tur yang memerlukan perhatian khusus wajib didampingi oleh minimal 2 (dua) orang dewasa yang sehat jasmani dan rohani selama perjalanan.'
        }
      ]
    },
    {
      num: '9.',
      title: 'Lain-lain',
      items: [
        {
          label: 'a.',
          text: 'Biaya tur diperhitungkan dengan ketentuan 1 (satu) kamar untuk 2 (dua) orang. Apabila peserta menempati 1 (satu) kamar sendiri atas permintaannya sendiri atau karena tidak mendapat teman sekamar, maka atas persetujuan, peserta akan menempati single room dan dikenakan biaya tambahan Single Supplement.'
        },
        {
          label: 'b.',
          text: 'Untuk peserta dewasa yang menempati 1 (satu) kamar yang diisi oleh 3 (tiga) orang, maka tempat tidur tambahan yang disediakan pihak hotel bisa saja berbeda jenis, ukuran dan kenyamanan dibandingkan dengan tempat tidur standar yang tersedia. Beberapa hotel tertentu tidak menyediakan tempat tidur tambahan.'
        }
      ]
    }
  ]
};

/**
 * Convert non-negative integer into Title Case Indonesian words (terbilang).
 */
export const terbilangIndonesia = (value) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 'Nol';
  if (n === 0) return 'Nol';

  const convert = (num) => {
    if (num < 12) return TERBILANG_UNITS[num];
    if (num < 20) return `${TERBILANG_UNITS[num - 10]} Belas`;
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const rem = num % 10;
      return rem > 0 ? `${TERBILANG_UNITS[tens]} Puluh ${convert(rem)}` : `${TERBILANG_UNITS[tens]} Puluh`;
    }
    if (num < 200) {
      const rem = num - 100;
      return rem > 0 ? `Seratus ${convert(rem)}` : 'Seratus';
    }
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const rem = num % 100;
      return rem > 0 ? `${TERBILANG_UNITS[hundreds]} Ratus ${convert(rem)}` : `${TERBILANG_UNITS[hundreds]} Ratus`;
    }
    return String(num);
  };

  return convert(n).trim();
};

/**
 * Format numeric amount with comma thousands separator (matching Dwidayatour PDF: 18,977,000)
 */
export const formatIdrAmount = (amount) => {
  const num = Number(String(amount ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return '0';
  return Math.round(num).toLocaleString('en-US');
};

export const parseAmountNumber = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val ?? '').replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Parse ISO YYYY-MM-DD safely without UTC off-by-one shift
 */
const parseLocalIsoDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIdx < 0 || monthIdx > 11 || day < 1 || day > 31) return null;
  return { year, monthIdx, day };
};

export const formatIndonesianDate = (isoDate, uppercase = false) => {
  const parsed = parseLocalIsoDate(isoDate);
  if (!parsed) return '';
  const dd = String(parsed.day).padStart(2, '0');
  const month = INDONESIAN_MONTHS[parsed.monthIdx];
  const formatted = `${dd} ${month} ${parsed.year}`;
  return uppercase ? formatted.toUpperCase() : formatted;
};

export const formatDepartureDateRange = (departureDate, returnDate) => {
  const dep = parseLocalIsoDate(departureDate);
  const ret = parseLocalIsoDate(returnDate);
  if (!dep && !ret) return '-';
  if (dep && !ret) {
    return `${String(dep.day).padStart(2, '0')} ${INDONESIAN_MONTHS[dep.monthIdx]} ${dep.year}`;
  }
  if (!dep && ret) {
    return `${String(ret.day).padStart(2, '0')} ${INDONESIAN_MONTHS[ret.monthIdx]} ${ret.year}`;
  }

  const depDay = String(dep.day).padStart(2, '0');
  const retDay = String(ret.day).padStart(2, '0');
  const depMonth = INDONESIAN_MONTHS[dep.monthIdx];
  const retMonth = INDONESIAN_MONTHS[ret.monthIdx];

  if (dep.year === ret.year) {
    return `${depDay} ${depMonth} - ${retDay} ${retMonth} ${ret.year}`;
  }
  return `${depDay} ${depMonth} ${dep.year} - ${retDay} ${retMonth} ${ret.year}`;
};

/**
 * Official S&K Page 2 Deposit Tier Calculator
 */
export const getMinimumDepositTier = (tourPricePerPax) => {
  const price = parseAmountNumber(tourPricePerPax);
  if (price <= 0) return null;
  if (price < 15000000) {
    return { amount: 7000000, label: 'Harga < Rp 15 jt → Min. DP Rp 7.000.000 / pax' };
  }
  if (price < 30000000) {
    return { amount: 10000000, label: 'Harga Rp 15–29,99 jt → Min. DP Rp 10.000.000 / pax' };
  }
  if (price < 45000000) {
    return { amount: 15000000, label: 'Harga Rp 30–44,99 jt → Min. DP Rp 15.000.000 / pax' };
  }
  return { amount: 20000000, label: 'Harga > Rp 45 jt → Min. DP Rp 20.000.000 / pax' };
};

/**
 * Return active participants that have a non-empty name
 */
export const getActiveParticipants = (participants = []) => {
  return (Array.isArray(participants) ? participants : [])
    .filter((p) => String(p?.fullName || '').trim() !== '')
    .map((p) => ({
      title: String(p.title || 'MR').trim().toUpperCase(),
      fullName: String(p.fullName || '').trim().toUpperCase(),
      note: String(p.note || '').trim()
    }));
};

export const getTourDisplayName = (form = {}) => {
  const code = String(form.tourCode || '').trim().toUpperCase();
  const name = String(form.tourName || '').trim();
  if (code && name) {
    // Avoid duplicating code if user already pasted code at start of tourName
    if (name.toUpperCase().startsWith(code)) {
      const rest = name.slice(code.length).replace(/^[\s\-–—/|]+/, '').trim();
      return rest ? `${code} - ${rest}` : code;
    }
    return `${code} - ${name}`;
  }
  return code || name || '-';
};

export const getTourPriceDisplay = (form = {}) => {
  if (String(form.tourPriceCustomText || '').trim()) {
    return String(form.tourPriceCustomText).trim();
  }
  const price = parseAmountNumber(form.tourPricePerPax);
  if (price <= 0) return '-';
  return `IDR ${formatIdrAmount(price)} / PAX`;
};

export const getDepositDisplay = (form = {}) => {
  if (String(form.depositCustomText || '').trim()) {
    return String(form.depositCustomText).trim();
  }
  if (form.paymentMode === 'voucher') {
    const voucherVal = parseAmountNumber(form.voucherAmountPerPax);
    const label = String(form.voucherLabel || 'Voucher PMK').trim();
    if (voucherVal > 0) {
      return `IDR ${formatIdrAmount(voucherVal)} / PAX${label ? ` (${label})` : ''}`;
    }
  }
  const dpVal = parseAmountNumber(form.depositPerPax);
  const dpNote = String(form.depositNote || '').trim();
  if (dpVal <= 0) return '-';
  return `IDR ${formatIdrAmount(dpVal)} / PAX${dpNote ? ` (${dpNote})` : ''}`;
};

/**
 * Compose the left-bottom summary & NOTE box text automatically (can also be overridden manually)
 */
export const buildSummaryBoxText = (form = {}) => {
  const activePax = getActiveParticipants(form.participants);
  const paxCount = Math.max(activePax.length, 1);
  const tourPrice = parseAmountNumber(form.tourPricePerPax);
  const lines = [];

  if (tourPrice > 0) {
    lines.push(`HARGA TOUR : IDR ${formatIdrAmount(tourPrice)} / PAX`);
  }

  if (form.paymentMode === 'voucher') {
    const voucherVal = parseAmountNumber(form.voucherAmountPerPax);
    const voucherLabel = String(form.voucherLabel || 'Voucher PMK').trim();
    const voucherPax = Math.max(0, Math.min(paxCount, Number(form.voucherPaxCount) || 0));
    const cashDeposit = parseAmountNumber(form.cashDepositAmount);

    if (voucherVal > 0) {
      lines.push(
        `DP : IDR ${formatIdrAmount(voucherVal)} / PAX${voucherLabel ? ` (${voucherLabel})` : ''}`
      );
    }

    if (tourPrice > 0 && voucherVal > 0 && voucherPax > 0) {
      const diff = Math.max(0, tourPrice - voucherVal);
      if (diff > 0) {
        lines.push(`SELISIH HARGA : IDR ${formatIdrAmount(diff)} X ${voucherPax} PAX`);
      }
    }

    const nonVoucherPax = Math.max(0, paxCount - voucherPax);
    if (tourPrice > 0 && nonVoucherPax > 0) {
      lines.push(
        nonVoucherPax === 1
          ? `HARGA TANPA VOUCHER : IDR ${formatIdrAmount(tourPrice)}`
          : `HARGA TANPA VOUCHER : IDR ${formatIdrAmount(tourPrice)} X ${nonVoucherPax} PAX`
      );
    }

    if (cashDeposit > 0) {
      lines.push(`DEPOSIT : IDR ${formatIdrAmount(cashDeposit)}`);
    }
  } else {
    const dpPerPax = parseAmountNumber(form.depositPerPax);
    const dpNote = String(form.depositNote || '').trim();

    if (dpPerPax > 0) {
      lines.push(
        `DP : IDR ${formatIdrAmount(dpPerPax)} / PAX${dpNote ? ` (${dpNote})` : ''}`
      );
      if (activePax.length > 0) {
        lines.push(`TOTAL DP (${activePax.length} PAX) : IDR ${formatIdrAmount(dpPerPax * activePax.length)}`);
      }
    }

    if (tourPrice > 0 && activePax.length > 0) {
      const totalTour = tourPrice * activePax.length;
      const totalDp = dpPerPax * activePax.length;
      lines.push(`TOTAL HARGA TOUR : IDR ${formatIdrAmount(totalTour)}`);
      if (totalDp > 0 && totalTour >= totalDp) {
        lines.push(`SISA PELUNASAN : IDR ${formatIdrAmount(totalTour - totalDp)}`);
      }
    }
  }

  // Notes section
  const selectedIds = Array.isArray(form.selectedNoteIds) ? form.selectedNoteIds : [];
  const presetLines = DEFAULT_NOTE_PRESETS.filter((p) => selectedIds.includes(p.id)).map((p) => p.text);
  const customLines = String(form.customNotes || '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean);

  const allNotes = [...presetLines, ...customLines];
  if (allNotes.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('NOTE');
    allNotes.forEach((n) => lines.push(`- ${n}`));
  }

  return lines.join('\n');
};

/**
 * Standard filename: FORMULIR_PENDAFTARAN_TOUR_MR_EDY_NURKISWOYO_VDASKOSKIDMZ.pdf
 */
export const buildRegistrationFilename = (form = {}) => {
  const activePax = getActiveParticipants(form.participants);
  const lead = activePax[0];
  const sanitize = (str) =>
    String(str || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const parts = ['FORMULIR_PENDAFTARAN_TOUR'];
  if (lead) {
    const leadSlug = sanitize(`${lead.title}_${lead.fullName}`);
    if (leadSlug) parts.push(leadSlug);
  }
  const tourCodeSlug = sanitize(form.tourCode || String(form.tourName || '').split(/\s+/)[0]);
  if (tourCodeSlug) parts.push(tourCodeSlug);

  return `${parts.join('_')}.pdf`;
};

/**
 * Normalize Indonesian phone number for wa.me link
 */
export const normalizePhoneForWa = (phone) => {
  let digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`;
  }
  return digits;
};

/**
 * Build polite Indonesian WhatsApp cover message to accompany the PDF registration form
 */
export const buildRegistrationWhatsAppText = (form = {}) => {
  const activePax = getActiveParticipants(form.participants);
  const lead = activePax[0];
  const greetingName = lead ? `${lead.title} ${lead.fullName}` : 'Bapak/Ibu';
  const tourTitle = getTourDisplayName(form);
  const dates = formatDepartureDateRange(form.departureDate, form.returnDate);
  const paxCount = activePax.length;
  const staff = String(form.receivedBy || 'Tim Konsultan').trim();
  const branch = String(form.branchName || 'Dwidayatour').trim();

  const lines = [
    `Halo ${greetingName},`,
    '',
    `Berikut kami kirimkan *Formulir Pendaftaran Tour Dwidayatour* untuk reservasi perjalanan Anda:`,
    `• Paket Tour: ${tourTitle}`,
    `• Tanggal Keberangkatan: ${dates}`,
    `• Jumlah Peserta: ${paxCount} (${terbilangIndonesia(paxCount)}) Peserta`,
    `• Harga Tour: ${getTourPriceDisplay(form)}`,
    `• Uang Muka (DP): ${getDepositDisplay(form)}`
  ];

  if (String(form.roomingNote || '').trim()) {
    lines.push(`• Pengaturan Kamar: ${String(form.roomingNote).trim().toUpperCase()}`);
  }

  lines.push(
    '',
    'Mohon berkenan untuk:',
    '1. Memeriksa kembali kesesuaian *nama seluruh peserta sesuai paspor*.',
    '2. Membaca Syarat & Ketentuan pada halaman 2.',
    '3. Menandatangani formulir pada halaman 1 dan mengirimkan kembali kepada kami beserta bukti transfer deposit.',
    '',
    `Terima kasih banyak.`,
    `Salam hangat,`,
    `${staff} — Dwidayatour ${branch}`
  );

  return lines.join('\n');
};

/**
 * Combine Row 1 lead contact (NOTELP & EMAIL) with optional passenger note
 */
export const buildLeadContactNote = (leadPhone, leadEmail, paxNote = '') => {
  const lines = [];
  const phone = String(leadPhone || '').trim();
  const email = String(leadEmail || '').trim();
  const note = String(paxNote || '').trim();

  if (phone) lines.push(`NOTELP: ${phone}`);
  if (email) lines.push(`EMAIL: ${email}`);
  if (note) lines.push(note);
  return lines.join('\n');
};

/**
 * Build polite Indonesian Email draft (subject, body, mailto URL) for sending the PDF form
 */
export const buildRegistrationEmailDraft = (form = {}) => {
  const activePax = getActiveParticipants(form.participants);
  const lead = activePax[0];
  const greetingName = lead ? `${lead.title} ${lead.fullName}` : 'Bapak/Ibu';
  const tourTitle = getTourDisplayName(form);
  const dates = formatDepartureDateRange(form.departureDate, form.returnDate);
  const paxCount = activePax.length;
  const staff = String(form.receivedBy || 'Tim Konsultan').trim();
  const branch = String(form.branchName || 'Dwidayatour').trim();
  const to = String(form.leadEmail || '').trim();

  const subjectParts = ['Formulir Pendaftaran Tour Dwidayatour'];
  if (String(form.tourCode || '').trim()) subjectParts.push(String(form.tourCode).trim().toUpperCase());
  if (lead) subjectParts.push(`${lead.title} ${lead.fullName}`);
  const subject = subjectParts.join(' - ');

  const bodyLines = [
    `Yth. ${greetingName},`,
    '',
    'Berikut kami lampirkan Formulir Pendaftaran Tour Dwidayatour untuk reservasi perjalanan Anda:',
    `- Paket Tour: ${tourTitle}`,
    `- Tanggal Keberangkatan: ${dates}`,
    `- Jumlah Peserta: ${paxCount} (${terbilangIndonesia(paxCount)}) Peserta`,
    `- Harga Tour: ${getTourPriceDisplay(form)}`,
    `- Uang Muka (DP): ${getDepositDisplay(form)}`
  ];

  if (String(form.roomingNote || '').trim()) {
    bodyLines.push(`- Pengaturan Kamar: ${String(form.roomingNote).trim().toUpperCase()}`);
  }

  bodyLines.push(
    '',
    'Mohon berkenan untuk memeriksa kembali kesesuaian nama seluruh peserta sesuai paspor, membaca Syarat & Ketentuan pada halaman 2, lalu menandatangani halaman 1 dan mengirimkan kembali formulir ini beserta bukti transfer deposit.',
    '',
    'Terima kasih atas kepercayaan Anda kepada Dwidayatour.',
    '',
    'Salam hangat,',
    `${staff}`,
    `Dwidayatour - ${branch}`
  );

  const body = bodyLines.join('\n');
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { to, subject, body, mailtoUrl };
};

/**
 * Load logo image as PNG data URL for jsPDF embedding
 */
const loadLogoDataUrl = async (url = '/dwidayatour-logo.png') => {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Draw crisp Dwidayatour logo + "making travel easy" tagline top-right on A4 page
 */
const drawDwidayatourHeaderLogo = (doc, logoDataUrl, rightMargin = 16, topY = 11) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoW = 54;
  const logoH = 9; // Exact 6:1 aspect ratio matching 492x82 PNG
  const x = pageWidth - rightMargin - logoW;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', x, topY, logoW, logoH, undefined, 'FAST');
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(12, 65, 134);
    doc.text('Dwidayatour', pageWidth - rightMargin, topY + 7, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('making travel easy', pageWidth - rightMargin, topY + logoH + 2.8, { align: 'right' });
  doc.setTextColor(15, 23, 42);
};

/**
 * Sanitize user-entered / copy-pasted text (e.g. from WhatsApp) into WinAnsi-safe ASCII/Latin-1
 * so jsPDF standard fonts never render broken/garbled glyphs.
 */
export const sanitizeForPdfText = (input) => {
  return String(input ?? '')
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2022\u25CF\u25AA\u25E6]/g, '-')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, '')
    .replace(/[ \t]{2,}/g, (m) => (m.length > 4 ? m : '  '));
};

/**
 * Draw justified/wrapped paragraph in jsPDF and return next Y coordinate
 */
const drawWrappedText = (doc, text, x, y, maxWidth, lineHeight, options = {}) => {
  const safeText = sanitizeForPdfText(text);
  const lines = doc.splitTextToSize(safeText, maxWidth);
  doc.text(lines, x, y, options);
  return y + lines.length * lineHeight;
};

/**
 * Generate Official 2-Page A4 Dwidayatour Registration Form PDF
 * Includes dynamic anti-overlap layout for large groups and WinAnsi text sanitization.
 */
export const generateTourRegistrationPdf = async (form, { mode = 'download' } = {}) => {
  const [{ jsPDF }, autoTableModule, logoDataUrl] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLogoDataUrl('/dwidayatour-logo.png')
  ]);
  const autoTable = autoTableModule.default || autoTableModule.autoTable;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentW = pageWidth - marginX * 2; // 174mm
  const safeBottomY = pageHeight - 16; // Reserve bottom 16mm for Page X of N footer

  // =========================================================================
  // PAGE 1: FORMULIR PENDAFTARAN
  // =========================================================================
  drawDwidayatourHeaderLogo(doc, logoDataUrl, marginX, 11);

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('FORMULIR PENDAFTARAN', pageWidth / 2, 29, { align: 'center' });

  // Horizontal separator rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.55);
  doc.line(marginX, 32.5, pageWidth - marginX, 32.5);

  // Opening sentence with automatic pax count & Indonesian terbilang
  const activePax = getActiveParticipants(form.participants);
  const paxCount = activePax.length;
  const terbilang = terbilangIndonesia(paxCount);
  const isCompactGroup = paxCount >= 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(isCompactGroup ? 10 : 10.5);
  const openingSentence = `Saya yang bertandatangan di bawah ini, mewakili seluruh peserta tur yang namanya tertera di bawah ini, yaitu total ${paxCount} ( ${terbilang} ) Peserta, melakukan reservasi sebagai berikut:`;
  let cursorY = drawWrappedText(doc, openingSentence, marginX, 39.5, contentW, isCompactGroup ? 4.4 : 4.8);
  cursorY += isCompactGroup ? 2.2 : 3;

  // Build participant table rows
  const leadPhone = sanitizeForPdfText(form.leadPhone || '').trim();
  const leadEmail = sanitizeForPdfText(form.leadEmail || '').trim();
  const roomingNote = sanitizeForPdfText(form.roomingNote || '').trim().toUpperCase();
  const tableBody = [];

  const minPaxSlots = Math.max(5, activePax.length);
  for (let i = 0; i < minPaxSlots; i += 1) {
    const pax = activePax[i];
    if (pax) {
      const ket =
        i === 0
          ? buildLeadContactNote(leadPhone, leadEmail, sanitizeForPdfText(pax.note))
          : sanitizeForPdfText(pax.note || '');
      tableBody.push([`${i + 1}.`, sanitizeForPdfText(`${pax.title} ${pax.fullName}`), ket]);
    } else {
      tableBody.push(['', '', '']);
    }
  }

  // Room row + optional empty bottom row (skip extra empty padding when 6+ pax to keep Page 1 clean)
  if (roomingNote) {
    tableBody.push(['', '', { content: `ROOM : ${roomingNote}`, styles: { fontStyle: 'bold' } }]);
    if (!isCompactGroup) tableBody.push(['', '', '']);
  } else if (!isCompactGroup) {
    tableBody.push(['', '', '']);
  }

  autoTable(doc, {
    startY: cursorY,
    margin: { top: 24, left: marginX, right: marginX, bottom: 18 },
    head: [['No.', 'Nama peserta sesuai paspor', 'Keterangan']],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: isCompactGroup ? 8.8 : 9.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.22,
      cellPadding: isCompactGroup
        ? { top: 1.05, right: 2.0, bottom: 1.05, left: 2.0 }
        : { top: 1.5, right: 2.2, bottom: 1.5, left: 2.2 },
      minCellHeight: isCompactGroup ? 4.8 : 5.8,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: isCompactGroup ? 9.3 : 10
    },
    columnStyles: {
      0: { cellWidth: 11, halign: 'left' },
      1: { cellWidth: 79 },
      2: { cellWidth: 84 }
    },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawDwidayatourHeaderLogo(doc, logoDataUrl, marginX, 10);
      }
    }
  });

  cursorY = (doc.lastAutoTable?.finalY || cursorY + 48) + (isCompactGroup ? 5.2 : 7.2);

  // Ensure enough room for the 5-row package details block
  if (cursorY > safeBottomY - 34) {
    doc.addPage();
    drawDwidayatourHeaderLogo(doc, logoDataUrl, marginX, 11);
    cursorY = 30;
  }

  // Package & Payment Key-Value Block
  const labelW = 58;
  const colonX = marginX + labelW;
  const valueX = colonX + 2.8;
  const valueMaxW = pageWidth - marginX - valueX;

  const receivedBy = sanitizeForPdfText(form.receivedBy || '').trim() || '-';
  const branchName = sanitizeForPdfText(form.branchName || '').trim() || 'Kelapa Gading';

  const detailRows = [
    { label: 'Nama tur / Tour code', value: sanitizeForPdfText(getTourDisplayName(form)) },
    { label: 'Tanggal keberangkatan', value: sanitizeForPdfText(formatDepartureDateRange(form.departureDate, form.returnDate)) },
    { label: 'Harga tur', value: sanitizeForPdfText(getTourPriceDisplay(form)) },
    { label: 'Jumlah Uang Muka yang dibayarkan', value: sanitizeForPdfText(getDepositDisplay(form)) },
    { label: 'Reservasi diterima oleh', value: `${receivedBy}  dari cabang / agent : ${branchName}` }
  ];

  doc.setFont('times', 'normal');
  doc.setFontSize(isCompactGroup ? 9.4 : 9.8);
  const detailLineH = isCompactGroup ? 4.3 : 4.7;

  detailRows.forEach((row) => {
    doc.text(row.label, marginX, cursorY);
    doc.text(':', colonX, cursorY);
    const wrappedVal = doc.splitTextToSize(row.value, valueMaxW);
    doc.text(wrappedVal, valueX, cursorY);
    cursorY += Math.max(1, wrappedVal.length) * detailLineH + 0.5;
  });

  cursorY += isCompactGroup ? 3.2 : 4.5;

  // Ensure enough room for the 2-point Legal Declarations block
  if (cursorY > safeBottomY - 46) {
    doc.addPage();
    drawDwidayatourHeaderLogo(doc, logoDataUrl, marginX, 11);
    cursorY = 30;
  }

  // Legal Declarations (Fixed 2-point statement)
  doc.setFont('times', 'normal');
  doc.setFontSize(isCompactGroup ? 9.4 : 10);
  const declLineH = isCompactGroup ? 4.2 : 4.6;
  doc.text('Dengan ini saya menyatakan bahwa:', marginX, cursorY);
  cursorY += isCompactGroup ? 4.5 : 5.2;

  const declNumX = marginX + 6;
  const declTextX = marginX + 12;
  const declMaxW = pageWidth - marginX - declTextX;

  doc.text('1.', declNumX, cursorY);
  cursorY = drawWrappedText(
    doc,
    'Pada saat menandatangani Formulir Pendaftaran ini dan membayar uang muka, saya telah membaca, memahami dan menyetujui seluruh Syarat dan Ketentuan sesuai dengan yang tertera pada halaman 2 Formulir Pendaftaran ini.',
    declTextX,
    cursorY,
    declMaxW,
    declLineH
  );
  cursorY += isCompactGroup ? 1.5 : 2;

  doc.text('2.', declNumX, cursorY);
  cursorY = drawWrappedText(
    doc,
    'Pada saat saya menandatangani Formulir Pendaftaran ini, saya bertindak untuk dan atas nama diri sendiri serta bertindak sebagai penerima kuasa dari seluruh peserta tur yang namanya tertera pada Formulir Pendaftaran ini. Dengan demikian, saya turut mengemban seluruh tanggung jawab dan pemenuhan kewajiban peserta tur sebagaimana yang ditetapkan pada Syarat dan Ketentuan pada Formulir Pendaftaran ini serta peraturan yang ditetapkan oleh pihak hotel, maskapai penerbangan, dan penyedia barang/jasa lainnya dalam tur ini.',
    declTextX,
    cursorY,
    declMaxW,
    declLineH
  );

  // Bottom 2-Column Area (Left Summary Box + Right Date & Signature)
  const summaryBoxW = 92;
  const summaryPadding = 3.2;
  const summaryText = sanitizeForPdfText(
    form.useCustomSummaryBox ? String(form.customSummaryBoxText || '') : buildSummaryBoxText(form)
  );

  const measureSummaryLines = (fontSize, lineH) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(fontSize);
    const out = [];
    summaryText.split(/\r?\n/).forEach((rawLine) => {
      if (!rawLine.trim()) {
        out.push('');
      } else {
        out.push(...doc.splitTextToSize(rawLine, summaryBoxW - summaryPadding * 2));
      }
    });
    const boxH = Math.max(44, out.length * lineH + summaryPadding * 2 + 2);
    return { lines: out, boxH, fontSize, lineH };
  };

  let summaryLayout = measureSummaryLines(9.2, 4.15);
  const minGapAfterDecl = 5.5;

  // Try slightly tighter box font if needed to fit comfortably on Page 1 without overlapping declarations
  if (cursorY + minGapAfterDecl + summaryLayout.boxH > safeBottomY) {
    const tightLayout = measureSummaryLines(8.2, 3.65);
    if (cursorY + minGapAfterDecl + tightLayout.boxH <= safeBottomY) {
      summaryLayout = tightLayout;
    }
  }

  let boxStartY;
  if (cursorY + minGapAfterDecl + summaryLayout.boxH > safeBottomY) {
    // Truly huge group or very long notes — cleanly move Summary Box & Signature to continuation page
    doc.addPage();
    drawDwidayatourHeaderLogo(doc, logoDataUrl, marginX, 11);
    boxStartY = 30;
  } else {
    // Place naturally below declarations without EVER overlapping cursorY or footer
    const idealBottomY = Math.min(206, safeBottomY - summaryLayout.boxH);
    boxStartY = Math.max(cursorY + minGapAfterDecl, idealBottomY);
  }

  // Draw bordered summary box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginX, boxStartY, summaryBoxW, summaryLayout.boxH);

  doc.setFont('times', 'normal');
  doc.setFontSize(summaryLayout.fontSize);
  doc.setTextColor(0, 0, 0);
  let boxTextY = boxStartY + summaryPadding + 3.0;
  summaryLayout.lines.forEach((line) => {
    if (line && boxTextY <= boxStartY + summaryLayout.boxH - 1.5) {
      doc.text(line, marginX + summaryPadding, boxTextY);
    }
    boxTextY += summaryLayout.lineH;
  });

  // Right signature block (strictly bounded within right margin)
  const sigLeftX = marginX + summaryBoxW + 7;
  const sigColW = pageWidth - marginX - sigLeftX;
  const sigCenterX = sigLeftX + sigColW / 2;
  const formDateStr = sanitizeForPdfText(formatIndonesianDate(form.formDate, true) || '-');

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Tanggal', sigLeftX, boxStartY + 8);
  doc.text(`: ${formDateStr}`, sigLeftX + 20, boxStartY + 8);

  const sigLineY = boxStartY + Math.min(Math.max(summaryLayout.boxH - 12, 28), 36);
  doc.text('(                                     )', sigCenterX, sigLineY, { align: 'center' });
  doc.setLineWidth(0.25);
  doc.line(sigCenterX - 20, sigLineY + 0.5, sigCenterX + 20, sigLineY + 0.5);

  if (form.showSignerName && activePax[0]) {
    doc.setFontSize(8.6);
    const signerLabel = sanitizeForPdfText(`${activePax[0].title} ${activePax[0].fullName}`);
    const signerLines = doc.splitTextToSize(signerLabel, sigColW - 2);
    doc.text(signerLines, sigCenterX, sigLineY + 4.8, { align: 'center' });
  }

  // =========================================================================
  // FINAL PAGE: SYARAT DAN KETENTUAN (BAKU / OFFICIAL LOCKED)
  // =========================================================================
  doc.addPage();
  drawDwidayatourHeaderLogo(doc, logoDataUrl, 14, 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(0, 0, 0);
  doc.text(TERMS_AND_CONDITIONS.title, pageWidth / 2, 26.5, { align: 'center' });

  const p2LeftX = 12;
  const p2ColGap = 6;
  const p2ColW = 90;
  const p2RightX = p2LeftX + p2ColW + p2ColGap; // 108mm
  const p2BodySize = 6.95;
  const p2LineH = 2.86;

  const drawClauseHeading = (num, title, x, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.35);
    doc.text(num, x, y);
    doc.text(title, x + 5.2, y);
    return y + 3.35;
  };

  const drawSubItem = (label, text, x, y, colW) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(p2BodySize);
    doc.text(label, x + 5.0, y);
    const bodyX = x + 9.5;
    const bodyW = colW - 9.5;
    const lines = doc.splitTextToSize(text, bodyW);
    doc.text(lines, bodyX, y);
    return y + lines.length * p2LineH + 1.05;
  };

  // --- LEFT COLUMN (Clauses 1 & 2) ---
  let leftY = 32.5;
  const lc = TERMS_AND_CONDITIONS.leftColumn;

  leftY = drawClauseHeading('1.', lc.clause1Title, p2LeftX, leftY);
  leftY = drawSubItem('a.', lc.clause1aIntro, p2LeftX, leftY, p2ColW);

  // Table 1: Deposit tiers
  autoTable(doc, {
    startY: leftY + 0.2,
    margin: { left: p2LeftX + 5, right: pageWidth - (p2LeftX + p2ColW) },
    tableWidth: p2ColW - 5,
    head: [['Route/Destinasi', 'Deposit yang harus\ndibayar']],
    body: TERMS_AND_CONDITIONS.depositTable,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: { top: 0.9, right: 1.3, bottom: 0.9, left: 1.3 },
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 56.5 },
      1: { cellWidth: 28.5, halign: 'left' }
    }
  });

  leftY = (doc.lastAutoTable?.finalY || leftY + 24) + 2.5;

  // Deposit non-refundable italic footnote
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.45);
  leftY = drawWrappedText(doc, TERMS_AND_CONDITIONS.depositFootnote, p2LeftX + 9.5, leftY, p2ColW - 9.5, 2.75);
  leftY += 1.2;

  // Clause 1a continuation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(p2BodySize);
  leftY = drawWrappedText(doc, lc.clause1aAfterTable, p2LeftX + 9.5, leftY, p2ColW - 9.5, p2LineH);
  leftY += 1.4;

  // Clause 1b & 1c
  leftY = drawSubItem('b.', lc.clause1b, p2LeftX, leftY, p2ColW);
  leftY = drawSubItem('c.', lc.clause1c, p2LeftX, leftY, p2ColW);
  leftY += 2.0;

  // Clause 2
  leftY = drawClauseHeading('2.', lc.clause2Title, p2LeftX, leftY);
  leftY = drawSubItem('a.', lc.clause2a, p2LeftX, leftY, p2ColW);
  leftY = drawSubItem('b.', lc.clause2b, p2LeftX, leftY, p2ColW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(p2BodySize);
  leftY = drawWrappedText(doc, lc.clause2bTableIntro, p2LeftX + 9.5, leftY + 0.1, p2ColW - 9.5, p2LineH);

  // Table 2: Cancellation fees
  autoTable(doc, {
    startY: leftY + 0.6,
    margin: { left: p2LeftX + 9.5, right: pageWidth - (p2LeftX + p2ColW) },
    tableWidth: p2ColW - 9.5,
    head: [['Waktu Pembatalan*', 'Biaya Pembatalan**']],
    body: TERMS_AND_CONDITIONS.cancellationTable.map(([time, fee]) => [time, fee]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: { top: 0.9, right: 1.4, bottom: 0.9, left: 1.4 },
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    }
  });

  leftY = (doc.lastAutoTable?.finalY || leftY + 20) + 2.5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.45);
  TERMS_AND_CONDITIONS.cancellationFootnotes.forEach((fn) => {
    leftY = drawWrappedText(doc, fn, p2LeftX + 9.5, leftY, p2ColW - 9.5, 2.7);
    leftY += 0.3;
  });
  leftY += 1.0;

  leftY = drawSubItem('c.', lc.clause2c, p2LeftX, leftY, p2ColW);
  leftY = drawSubItem('d.', lc.clause2d, p2LeftX, leftY, p2ColW);
  drawSubItem('e.', lc.clause2e, p2LeftX, leftY, p2ColW);

  // --- RIGHT COLUMN (Clauses 3 to 9) ---
  let rightY = 32.5;
  TERMS_AND_CONDITIONS.rightColumn.forEach((clause) => {
    rightY = drawClauseHeading(clause.num, clause.title, p2RightX, rightY);
    if (clause.paragraph) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(p2BodySize);
      rightY = drawWrappedText(doc, clause.paragraph, p2RightX + 5.2, rightY, p2ColW - 5.2, p2LineH);
      rightY += 1.15;
    }
    if (Array.isArray(clause.items)) {
      clause.items.forEach((item) => {
        rightY = drawSubItem(item.label, item.text, p2RightX, rightY, p2ColW);
      });
    }
    rightY += 1.1;
  });

  // Stamp dynamic "Page X of N" footer cleanly on EVERY page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const footerRightMargin = p === totalPages ? 14 : marginX;
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - footerRightMargin, pageHeight - 11, {
      align: 'right'
    });
  }

  const fileName = buildRegistrationFilename(form);
  if (mode === 'arraybuffer') {
    return { fileName, buffer: doc.output('arraybuffer'), pages: totalPages };
  }
  if (mode === 'blob') {
    return { fileName, blob: doc.output('blob'), pages: totalPages };
  }
  if (mode === 'bloburl') {
    return { fileName, url: doc.output('bloburl'), pages: totalPages };
  }
  doc.save(fileName);
  return { fileName, pages: totalPages };
};

/**
 * Print ONLY the exact vector A4 PDF directly via an isolated hidden iframe
 * (guarantees zero web UI, sidebar, navbar, toasts, or AI Copilot elements can ever appear).
 */
export const printTourRegistrationPdf = async (form) => {
  const { blob, fileName, pages } = await generateTourRegistrationPdf(form, { mode: 'blob' });
  const blobUrl = URL.createObjectURL(blob);

  return await new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = blobUrl;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        cleanup();
        resolve({ fileName, pages, method: 'iframe' });
      } catch {
        // Fallback: open pure PDF document in clean browser tab for native PDF print
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        cleanup();
        resolve({ fileName, pages, method: 'tab' });
      }
    };

    iframe.onerror = () => {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      cleanup();
      resolve({ fileName, pages, method: 'tab' });
    };

    document.body.appendChild(iframe);
  });
};
