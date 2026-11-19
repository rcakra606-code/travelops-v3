/**
 * Frontend normalizer, Schengen/VFS resolver, working-day SLA calculator,
 * anomaly detector, and Draft Queue builder for AI-parsed Visa/Document requests.
 */

const SCHENGEN_COUNTRIES = new Set([
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland'
]);

const TLS_COUNTRIES = new Set(['France', 'Switzerland']);

const COUNTRY_ALIASES = {
  finlandia: 'Finland',
  finland: 'Finland',
  belanda: 'Netherlands',
  holland: 'Netherlands',
  netherlands: 'Netherlands',
  jerman: 'Germany',
  germany: 'Germany',
  prancis: 'France',
  perancis: 'France',
  france: 'France',
  italia: 'Italy',
  italy: 'Italy',
  swiss: 'Switzerland',
  switzerland: 'Switzerland',
  spanyol: 'Spain',
  spain: 'Spain',
  austria: 'Austria',
  belgia: 'Belgium',
  belgium: 'Belgium',
  swedia: 'Sweden',
  sweden: 'Sweden',
  norwegia: 'Norway',
  norway: 'Norway',
  denmark: 'Denmark',
  islandia: 'Iceland',
  iceland: 'Iceland',
  yunani: 'Greece',
  greece: 'Greece',
  portugal: 'Portugal',
  polandia: 'Poland',
  poland: 'Poland',
  ceko: 'Czech Republic',
  czechia: 'Czech Republic',
  'czech republic': 'Czech Republic',
  hungaria: 'Hungary',
  hungary: 'Hungary',
  kroasia: 'Croatia',
  croatia: 'Croatia',
  schengen: 'Schengen',
  jepang: 'Japan',
  japan: 'Japan',
  korea: 'South Korea',
  'korea selatan': 'South Korea',
  'south korea': 'South Korea',
  inggris: 'United Kingdom',
  uk: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  amerika: 'United States',
  'amerika serikat': 'United States',
  usa: 'United States',
  us: 'United States',
  'united states': 'United States',
  australia: 'Australia',
  china: 'China',
  tiongkok: 'China',
  taiwan: 'Taiwan',
  kanada: 'Canada',
  canada: 'Canada',
  indonesia: 'Indonesia',
  'new zealand': 'New Zealand',
  'selandia baru': 'New Zealand'
};

const toIsoDate = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
};

const parseLocalDate = (isoDate) => {
  const clean = toIsoDate(isoDate);
  if (!clean) return null;
  const [y, m, d] = clean.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const formatDateObjIso = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toPositiveInt = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  const cleaned = String(val ?? '').replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

/**
 * Normalize visa destination country; Schengen members are formatted as "Finland (Schengen)"
 */
export const formatDocumentCountry = (rawCountry) => {
  const raw = String(rawCountry || '').trim();
  if (!raw) return '';

  // Strip any existing "(Schengen)" suffix before normalizing
  const baseRaw = raw.replace(/\s*\(schengen\)\s*$/i, '').trim();
  const key = baseRaw.toLowerCase();
  const canonical = COUNTRY_ALIASES[key] || baseRaw;

  if (SCHENGEN_COUNTRIES.has(canonical)) {
    return `${canonical} (Schengen)`;
  }
  return canonical;
};

/**
 * Infer default Visa Center vendor & appointment venue hint from normalized country
 */
export const inferVendorAndVenue = (formattedCountry) => {
  const clean = String(formattedCountry || '').trim();
  if (!clean) return { supplier: '', appointmentLocation: '' };

  const base = clean.replace(/\s*\(schengen\)\s*$/i, '').trim();

  if (clean.includes('(Schengen)') || base === 'Schengen' || SCHENGEN_COUNTRIES.has(base)) {
    if (TLS_COUNTRIES.has(base)) {
      return {
        supplier: 'TLScontact',
        appointmentLocation: 'TLScontact Menara Anugrah Lt. 2, Mega Kuningan, Jakarta'
      };
    }
    return {
      supplier: 'VFS Global',
      appointmentLocation: 'VFS Global Kuningan City Mall Lt. 2, Jakarta'
    };
  }

  switch (base) {
    case 'Japan':
      return {
        supplier: 'JVAC',
        appointmentLocation: 'JVAC (Japan Visa Application Centre) Lotte Shopping Avenue Lt. 4, Jakarta'
      };
    case 'South Korea':
      return {
        supplier: 'KVAC',
        appointmentLocation: 'KVAC (Korea Visa Application Center) Lotte Shopping Avenue Lt. 5, Jakarta'
      };
    case 'China':
      return {
        supplier: 'CVASC',
        appointmentLocation: 'CVASC (Chinese Visa Application Service Center), Mega Kuningan, Jakarta'
      };
    case 'United Kingdom':
    case 'Canada':
      return {
        supplier: 'VFS Global',
        appointmentLocation: 'VFS Global Kuningan City Mall Lt. 2, Jakarta'
      };
    case 'Australia':
      return {
        supplier: 'VFS Global',
        appointmentLocation: 'VFS Global Kuningan City Mall Lt. 2, Jakarta (Biometrics)'
      };
    case 'United States':
      return {
        supplier: 'Direct Embassy',
        appointmentLocation: 'U.S. Embassy Jakarta, Jl. Medan Merdeka Selatan'
      };
    case 'Taiwan':
      return {
        supplier: 'Direct Embassy',
        appointmentLocation: 'TETO Artha Graha Building, SCBD Jakarta'
      };
    case 'Indonesia':
      return {
        supplier: 'Immigration Office',
        appointmentLocation: 'Kantor Imigrasi Jakarta Selatan'
      };
    default:
      return { supplier: '', appointmentLocation: '' };
  }
};

/**
 * Map Lark Type Document + Purpose + Visa Type to exact TravelOps DOCUMENT_TYPES
 */
export const normalizeDocumentType = (typeDocument, purpose, visaType) => {
  const combined = `${typeDocument || ''} ${purpose || ''} ${visaType || ''}`.toLowerCase();

  if (combined.includes('kitas') || combined.includes('stay permit') || combined.includes('kitap')) {
    return 'KITAS / Stay Permit';
  }
  if (combined.includes('legalis') || combined.includes('legaliz') || combined.includes('apostille')) {
    return 'Legalization';
  }
  if (combined.includes('passport') || combined.includes('paspor')) {
    if (/\b(new|baru)\b/i.test(combined) && !/renew|perpanjang/i.test(combined)) {
      return 'New Passport';
    }
    return 'Passport Renewal';
  }
  if (combined.includes('e-visa') || combined.includes('evisa') || combined.includes('waiver') || combined.includes('eta')) {
    return 'E-Visa / Waiver';
  }
  if (combined.includes('business') || combined.includes('bisnis')) {
    return 'Business Visa';
  }
  return 'Tourist Visa';
};

/**
 * Map Lark Process field (REGULAR / EXPRESS / URGENT) to TravelOps Process Speed
 */
export const normalizeProcessType = (rawSpeed) => {
  const val = String(rawSpeed || '').trim().toLowerCase();
  if (val.includes('urgent') || val.includes('rush') || val.includes('super')) return 'Urgent';
  if (val.includes('express') || val.includes('priority') || val.includes('kilat') || val.includes('fast')) {
    return 'Express';
  }
  return 'Normal';
};

/**
 * Normalize Indonesian phone numbers (e.g. "82297027282" -> "+6282297027282")
 */
export const normalizeIndonesianPhone = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  if (digits.startsWith('8') && digits.length >= 8 && digits.length <= 13) {
    return `+62${digits}`;
  }
  return `+${digits}`;
};

/**
 * Add N working days (Mon-Fri) to an ISO YYYY-MM-DD date
 */
export const addBusinessDays = (isoDate, businessDays) => {
  const base = parseLocalDate(isoDate);
  const count = Math.max(0, Math.floor(Number(businessDays) || 0));
  if (!base) return '';
  if (count === 0) return formatDateObjIso(base);

  const cur = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let added = 0;
  while (added < count) {
    cur.setDate(cur.getDate() + 1);
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added += 1;
    }
  }
  return formatDateObjIso(cur);
};

/**
 * Parse estimated working days range from string/numbers (e.g. "15 - 21 Hari Kerja" -> { min: 15, max: 21, isWorkingDays: true })
 */
export const parseEstimatedDaysInfo = (rawStr, minDays = 0, maxDays = 0) => {
  const str = String(rawStr || '');
  const isWorkingDays = /kerja|working|business/i.test(str) || !/kalender|calendar/i.test(str);

  let min = toPositiveInt(minDays);
  let max = toPositiveInt(maxDays);

  if (!min && !max && str) {
    const nums = str.match(/\d+/g)?.map(Number).filter((n) => n > 0 && n <= 180) || [];
    if (nums.length >= 2) {
      min = Math.min(nums[0], nums[1]);
      max = Math.max(nums[0], nums[1]);
    } else if (nums.length === 1) {
      min = nums[0];
      max = nums[0];
    }
  }

  if (min && !max) max = min;
  if (max && !min) min = max;

  return { min, max, isWorkingDays };
};

/**
 * Fuzzy-match Lark Requester name against active non-admin staff directory
 */
export const matchDocumentStaff = (rawRequester, activeStaff = []) => {
  const query = String(rawRequester || '').trim();
  if (!query || !Array.isArray(activeStaff) || activeStaff.length === 0) return '';

  const staffNames = activeStaff
    .map((u) => (typeof u === 'string' ? u : u?.name || ''))
    .filter(Boolean);

  const qLower = query.toLowerCase();

  // 1. Exact case-insensitive match
  const exact = staffNames.find((n) => n.toLowerCase() === qLower);
  if (exact) return exact;

  // 2. Prefix / substring match
  const substr = staffNames.find(
    (n) => n.toLowerCase().includes(qLower) || qLower.includes(n.toLowerCase())
  );
  if (substr) return substr;

  // 3. Token overlap match (first name / surname match)
  const qTokens = qLower.split(/\s+/).filter((t) => t.length >= 3);
  let best = '';
  let bestScore = 0;
  for (const name of staffNames) {
    const nTokens = name.toLowerCase().split(/\s+/);
    let score = 0;
    for (const qt of qTokens) {
      if (nTokens.some((nt) => nt === qt || nt.startsWith(qt) || qt.startsWith(nt))) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return bestScore > 0 ? best : '';
};

const formatCompactIdr = (amount) => {
  const num = toPositiveInt(amount);
  if (!num) return '';
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const diffCalendarDays = (fromIso, toIso) => {
  const a = parseLocalDate(fromIso);
  const b = parseLocalDate(toIso);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

/**
 * Compose compact structured operational notes clamped safely to 500 chars (DocumentFormModal maxLength)
 */
const composeApplicantNotes = ({
  visaCategory,
  visaType,
  applicant,
  departureDate,
  arrivalDate,
  nettFare,
  booker,
  requestNo
}) => {
  const segments = [];

  if (visaCategory || visaType) {
    segments.push([visaCategory, visaType].filter(Boolean).join(' / '));
  }
  if (applicant?.passportNumber) {
    const exp = applicant.passportExpiredDate ? ` (Exp ${applicant.passportExpiredDate})` : '';
    segments.push(`Pass: ${applicant.passportNumber}${exp}`);
  }
  if (applicant?.dateOfBirth) {
    segments.push(`DOB: ${applicant.dateOfBirth}`);
  }
  if (departureDate || arrivalDate) {
    const travelRange =
      departureDate && arrivalDate ? `${departureDate} s/d ${arrivalDate}` : departureDate || arrivalDate;
    segments.push(`Travel: ${travelRange}`);
  }
  if (nettFare > 0) {
    segments.push(`Nett: ${formatCompactIdr(nettFare)}`);
  }
  if (booker?.fullName) {
    const bName = [booker.title, booker.fullName].filter(Boolean).join(' ').trim();
    segments.push(`Booker: ${bName}`);
  }
  if (booker?.email) {
    segments.push(`Email: ${booker.email}`);
  }
  if (requestNo) {
    segments.push(`ReqNo: ${requestNo}`);
  }
  if (applicant?.note) {
    segments.push(applicant.note);
  }

  const joined = segments.join(' | ');
  if (joined.length <= 500) return joined;
  return `${joined.slice(0, 497)}...`;
};

const formatFullApplicantName = (applicant) => {
  if (!applicant) return '';
  const title = String(applicant.title || '').trim();
  const fullName = String(applicant.fullName || '').trim();
  if (!title) return fullName;
  // Avoid duplicating title if fullName already starts with it
  if (fullName.toLowerCase().startsWith(title.toLowerCase())) return fullName;
  return `${title} ${fullName}`.trim();
};

/**
 * Build complete DocumentFormModal draft queue + operational verification metadata from AI JSON
 */
export const buildDocumentDraftsFromAiResult = (aiData = {}, activeStaff = [], fileName = '') => {
  const safeData = aiData && typeof aiData === 'object' ? aiData : {};

  const docType = normalizeDocumentType(
    safeData.typeDocument,
    safeData.purpose,
    safeData.visaType
  );
  const country = formatDocumentCountry(safeData.visaCountry);
  const { supplier, appointmentLocation } = inferVendorAndVenue(country);
  const processType = normalizeProcessType(safeData.processSpeed);

  const todayIso = formatDateObjIso(new Date());
  const receiveDate = toIsoDate(safeData.applicationDate) || todayIso;

  // Estimate completion date using working days (or fallback to standard SLA)
  const estInfo = parseEstimatedDaysInfo(
    safeData.estimatedDaysRaw,
    safeData.estimatedMinDays,
    safeData.estimatedMaxDays
  );
  const defaultSla = processType === 'Urgent' ? 3 : processType === 'Express' ? 5 : 10;
  let estimatedDone = '';
  if (estInfo.max > 0) {
    if (estInfo.isWorkingDays) {
      estimatedDone = addBusinessDays(receiveDate, estInfo.max);
    } else {
      const base = parseLocalDate(receiveDate);
      if (base) {
        base.setDate(base.getDate() + estInfo.max);
        estimatedDone = formatDateObjIso(base);
      }
    }
  } else {
    estimatedDone = addBusinessDays(receiveDate, defaultSla);
  }

  // Booking Code: Lark No. Approval (fallback Request No.)
  const approvalNo = String(safeData.approvalNo || '').trim();
  const requestNo = String(safeData.requestNo || '').trim();
  const bookingCode = approvalNo || requestNo;

  // Pricing: Publish Fare per applicant (fallback to totalPublishFare / count, then Nett)
  const rawApplicants = Array.isArray(safeData.applicants) ? safeData.applicants : [];
  const applicantCount = Math.max(
    1,
    rawApplicants.length || toPositiveInt(safeData.totalApplicants) || 1
  );

  let publishFarePerPax = toPositiveInt(safeData.publishFarePerApplicant);
  if (!publishFarePerPax && toPositiveInt(safeData.totalPublishFare) > 0) {
    publishFarePerPax = Math.round(toPositiveInt(safeData.totalPublishFare) / applicantCount);
  }
  let nettFarePerPax = toPositiveInt(safeData.nettFarePerApplicant);
  if (!nettFarePerPax && toPositiveInt(safeData.totalNettFare) > 0) {
    nettFarePerPax = Math.round(toPositiveInt(safeData.totalNettFare) / applicantCount);
  }

  const priceValue = publishFarePerPax || nettFarePerPax || 0;

  // Contact & Staff
  const booker = safeData.booker && typeof safeData.booker === 'object' ? safeData.booker : {};
  const phoneNumber = normalizeIndonesianPhone(booker.phone);
  const rawRequester = String(safeData.requesterName || '').trim();
  const matchedStaff = matchDocumentStaff(rawRequester, activeStaff);

  const departureDate = toIsoDate(safeData.departureDate);
  const arrivalDate = toIsoDate(safeData.arrivalDate);

  // Build normalized applicant list (at least 1 placeholder if AI couldn't read applicant block)
  const normalizedApplicants =
    rawApplicants.length > 0
      ? rawApplicants.map((a) => ({
          title: String(a?.title || '').trim(),
          fullName: String(a?.fullName || '').trim(),
          category: String(a?.category || 'Adult').trim(),
          passportNumber: String(a?.passportNumber || '').trim().toUpperCase(),
          passportExpiredDate: toIsoDate(a?.passportExpiredDate),
          dateOfBirth: toIsoDate(a?.dateOfBirth),
          note: String(a?.note || '').trim()
        }))
      : [
          {
            title: String(booker.title || '').trim(),
            fullName: String(booker.fullName || '').trim(),
            category: 'Adult',
            passportNumber: '',
            passportExpiredDate: '',
            dateOfBirth: '',
            note: ''
          }
        ];

  // Operational Warnings & Anomaly Detection
  const warnings = [];
  const pushWarning = (msg) => {
    if (msg && !warnings.includes(msg)) warnings.push(msg);
  };

  // 1. SLA vs Departure Date Risk
  if (estimatedDone && departureDate) {
    const bufferDays = diffCalendarDays(estimatedDone, departureDate);
    if (bufferDays !== null && bufferDays < 0) {
      pushWarning(
        `Risiko Kritis SLA: Estimasi selesai (${estimatedDone}) melewati tanggal keberangkatan (${departureDate}) sebanyak ${Math.abs(bufferDays)} hari!`
      );
    } else if (bufferDays !== null && bufferDays <= 3) {
      pushWarning(
        `Risiko SLA Mepet: Estimasi selesai (${estimatedDone}${safeData.estimatedDaysRaw ? `, ${safeData.estimatedDaysRaw}` : ''}) hanya berselisih ${bufferDays} hari sebelum berangkat (${departureDate}). Segera amankan jadwal biometrik!`
      );
    }
  }

  // 2. Passport Validity Check (>= 7 months from arrival/departure date)
  const travelRefDate = arrivalDate || departureDate || receiveDate;
  normalizedApplicants.forEach((app) => {
    if (app.passportExpiredDate && travelRefDate) {
      const daysValid = diffCalendarDays(travelRefDate, app.passportExpiredDate);
      if (daysValid !== null && daysValid < 210) {
        const monthsApprox = Math.max(0, Math.floor(daysValid / 30));
        pushWarning(
          `Masa berlaku paspor ${formatFullApplicantName(app) || 'pemohon'} (${app.passportNumber || '-'}, exp ${app.passportExpiredDate}) tersisa ~${monthsApprox} bulan dari kepulangan (${travelRefDate}) — syarat umum kedutaan minimal 7 bulan!`
        );
      }
    }
  });

  // 3. Booker != Applicant Info
  const bookerFull = String(booker.fullName || '').trim();
  const firstApplicantName = String(normalizedApplicants[0]?.fullName || '').trim();
  if (
    bookerFull &&
    firstApplicantName &&
    bookerFull.toLowerCase() !== firstApplicantName.toLowerCase()
  ) {
    pushWarning(
      `Booker (${[booker.title, bookerFull].filter(Boolean).join(' ')}) berbeda dengan Pemohon Visa (${formatFullApplicantName(normalizedApplicants[0])}). Nama pemohon diisi ke Guest Name & kontak booker masuk ke WhatsApp/Notes.`
    );
  }

  // 4. Staff Match Check
  if (rawRequester && !matchedStaff) {
    pushWarning(
      `Requester "${rawRequester}" belum ditemukan pada daftar staff aktif non-admin. Mohon pilih PIC Consultant secara manual.`
    );
  }

  // 5. Approval Status Check (Page 2)
  const approvalRecord =
    safeData.approvalRecord && typeof safeData.approvalRecord === 'object'
      ? safeData.approvalRecord
      : {};
  const checkerStatus = String(approvalRecord.checkerStatus || '').trim();
  if (checkerStatus && /under review|pending|wait/i.test(checkerStatus)) {
    pushWarning(
      `Status Document Checker di Lark masih "${checkerStatus}"${approvalRecord.managerStatus ? ` (Manager: ${approvalRecord.managerStatus})` : ''}.`
    );
  }

  // 6. Include AI-generated warnings (deduplicated)
  if (Array.isArray(safeData.warnings)) {
    safeData.warnings.forEach((w) => {
      if (typeof w === 'string' && w.trim()) pushWarning(w.trim());
    });
  }

  // Checklist of internal fields typically missing from Lark PDF
  const missingFields = [];
  const hasJoinTourHint = normalizedApplicants.some((a) => /join\s*tour|group/i.test(a.note)) ||
    /join\s*tour|group/i.test(`${safeData.visaCategory || ''} ${safeData.visaType || ''}`);
  if (hasJoinTourHint) {
    missingFields.push('Tour Code (terdeteksi Join Tour / Group — hubungkan ke kode tour)');
  } else {
    missingFields.push('Tour Code (opsional jika terkait paket tour)');
  }
  missingFields.push('Invoice Number');
  missingFields.push('Appointment Date & Time (jadwal biometrik / kedutaan)');

  // Build individual DocumentFormModal draft per applicant
  const drafts = normalizedApplicants.map((applicant, idx) => ({
    _applicantIndex: idx,
    _applicantMeta: applicant,
    docType,
    guestName: formatFullApplicantName(applicant),
    country,
    processType,
    receiveDate,
    estimatedDone,
    sendDate: '',
    bookingCode,
    tourCode: '',
    invoiceNumber: '',
    supplier,
    price: priceValue > 0 ? String(priceValue) : '',
    phoneNumber,
    staff: matchedStaff,
    appointmentDate: '',
    appointmentTime: '',
    appointmentLocation,
    notes: composeApplicantNotes({
      visaCategory: safeData.visaCategory,
      visaType: safeData.visaType,
      applicant,
      departureDate,
      arrivalDate,
      nettFare: nettFarePerPax,
      booker,
      requestNo
    })
  }));

  return {
    drafts,
    meta: {
      fileName: fileName || 'Request_Visa_Document.pdf',
      requestNo,
      approvalNo,
      department: String(safeData.department || '').trim(),
      approvalStatus: String(safeData.approvalStatus || '').trim(),
      approvalRecord: {
        managerName: String(approvalRecord.managerName || '').trim(),
        managerStatus: String(approvalRecord.managerStatus || '').trim(),
        checkerNames: Array.isArray(approvalRecord.checkerNames) ? approvalRecord.checkerNames : [],
        checkerStatus
      },
      visaCategory: String(safeData.visaCategory || '').trim(),
      visaType: String(safeData.visaType || '').trim(),
      estimatedDaysRaw: String(safeData.estimatedDaysRaw || '').trim(),
      departureDate,
      arrivalDate,
      nettFarePerApplicant: nettFarePerPax,
      publishFarePerApplicant: publishFarePerPax,
      rawRequester,
      matchedStaff,
      booker: {
        title: String(booker.title || '').trim(),
        fullName: bookerFull,
        phone: phoneNumber,
        email: String(booker.email || '').trim()
      },
      confidence: ['high', 'medium', 'low'].includes(safeData.confidence) ? safeData.confidence : 'medium',
      warnings,
      missingFields,
      parsedAt: new Date().toISOString()
    }
  };
};
