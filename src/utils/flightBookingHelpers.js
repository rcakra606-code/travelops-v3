/**
 * Flight Ticket Booking Form — GDS Parser, Smart Date/Transit/H-1 Dinihari Engine,
 * WhatsApp/Email Formatter & Official Dwidayatour A4 PDF Generator.
 */

import {
  resolveAirlineName,
  resolveAirportCity,
  formatAirportDetail
} from './flightReferenceData.js';

const MONTHS_EN_UPPER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const MONTHS_ID_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTHS_ID_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const CURRENCY_OPTIONS = ['IDR', 'USD', 'SGD', 'EUR', 'TWD', 'JPY', 'AUD', 'MYR', 'HKD', 'GBP'];

export const DEFAULT_PASSPORT_CLAUSE =
  'Dipastikan nama sesuai dengan passport / visa yang berlaku mengikuti ketentuan perundang-undangan keimigrasian atau perjalanan yang berlaku di tempat keberangkatan dan tujuan.';

export function parseAmountNumber(val) {
  if (typeof val === 'number') return Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  const digits = String(val || '').replace(/[^\d]/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) ? num : 0;
}

export function formatNumberWithCommas(val) {
  const num = parseAmountNumber(val);
  if (!num) return '';
  return num.toLocaleString('en-US');
}

export function formatCurrencyValue(val, currency = 'IDR') {
  const num = parseAmountNumber(val);
  if (!num) return '';
  return `${currency} ${num.toLocaleString('en-US')}`;
}

/**
 * Normalizes "1440", "14.40", "14:40" -> "14:40".
 */
export function normalizeTimeHHMM(raw) {
  const str = String(raw || '').trim();
  if (!str) return '';
  const colonMatch = str.match(/^(\d{1,2})[:.](\d{2})$/);
  if (colonMatch) {
    const h = Math.min(23, Math.max(0, parseInt(colonMatch[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(colonMatch[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const fourDigit = str.match(/^(\d{2})(\d{2})$/);
  if (fourDigit) {
    const h = Math.min(23, Math.max(0, parseInt(fourDigit[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(fourDigit[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return str;
}

/**
 * Parses an ISO date string "YYYY-MM-DD" into UTC Date (midnight) safely without local TZ drift.
 */
function parseIsoUtc(isoDate) {
  const m = String(isoDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const dt = new Date(Date.UTC(y, mo, d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatUtcToIso(utcDate) {
  if (!utcDate) return '';
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToIsoDate(isoDate, offsetDays = 0) {
  const base = parseIsoUtc(isoDate);
  if (!base) return '';
  const next = new Date(base.getTime() + Number(offsetDays || 0) * 86_400_000);
  return formatUtcToIso(next);
}

/**
 * Formats ISO date "2026-11-25" -> "25 Nov 2026" (or "25NOV26" for compact/GDS style).
 */
export function formatDateShortId(isoDate) {
  const dt = parseIsoUtc(isoDate);
  if (!dt) return '';
  const d = String(dt.getUTCDate()).padStart(2, '0');
  const m = MONTHS_ID_SHORT[dt.getUTCMonth()];
  const y = dt.getUTCFullYear();
  return `${d} ${m} ${y}`;
}

export function formatDateWithDayId(isoDate) {
  const dt = parseIsoUtc(isoDate);
  if (!dt) return '';
  const day = DAYS_ID[dt.getUTCDay()];
  const d = String(dt.getUTCDate()).padStart(2, '0');
  const m = MONTHS_ID_SHORT[dt.getUTCMonth()];
  const y = dt.getUTCFullYear();
  return `${day}, ${d} ${m} ${y}`;
}

export function formatDateDDMMMYY(isoDate) {
  const dt = parseIsoUtc(isoDate);
  if (!dt) return '';
  const d = String(dt.getUTCDate()).padStart(2, '0');
  const m = MONTHS_EN_UPPER[dt.getUTCMonth()];
  const yy = String(dt.getUTCFullYear()).slice(-2);
  return `${d}${m}${yy}`;
}

export function formatDateDDMMM(isoDate) {
  const dt = parseIsoUtc(isoDate);
  if (!dt) return '';
  const d = String(dt.getUTCDate()).padStart(2, '0');
  const m = MONTHS_EN_UPPER[dt.getUTCMonth()];
  return `${d}${m}`;
}

export function formatDateFullId(isoDate) {
  const dt = parseIsoUtc(isoDate);
  if (!dt) return '';
  const d = dt.getUTCDate();
  const m = MONTHS_ID_FULL[dt.getUTCMonth()];
  const y = dt.getUTCFullYear();
  return `${d} ${m} ${y}`;
}

/**
 * Parses GDS date token like "25NOV", "08DEC", "25NOV26" into ISO "YYYY-MM-DD".
 */
export function parseGdsDateToken(token, referenceDate = new Date(), prevIsoDate = '') {
  const clean = String(token || '').trim().toUpperCase();
  const m = clean.match(/^(\d{1,2})([A-Z]{3})(\d{2,4})?$/);
  if (!m) return '';
  const day = parseInt(m[1], 10);
  const monthIdx = MONTHS_EN_UPPER.indexOf(m[2]);
  if (monthIdx === -1 || day < 1 || day > 31) return '';

  let year;
  if (m[3]) {
    year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  } else if (prevIsoDate) {
    const prev = parseIsoUtc(prevIsoDate);
    year = prev ? prev.getUTCFullYear() : referenceDate.getFullYear();
    const candidate = Date.UTC(year, monthIdx, day);
    if (prev && candidate < prev.getTime() - 2 * 86_400_000) {
      year += 1;
    }
  } else {
    year = referenceDate.getFullYear();
    const todayUtc = Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const candidate = Date.UTC(year, monthIdx, day);
    if (candidate < todayUtc - 14 * 86_400_000) {
      year += 1;
    }
  }

  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Converts (isoDate, "HH:MM") into epoch minutes (treating both times in the SAME local airport clock
 * — which is exact for transit duration at the SAME connecting airport!).
 */
function toClockMinutes(isoDate, hhmm) {
  const dt = parseIsoUtc(isoDate);
  const norm = normalizeTimeHHMM(hhmm);
  if (!dt || !norm || !norm.includes(':')) return null;
  const [h, m] = norm.split(':').map((n) => parseInt(n, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return Math.floor(dt.getTime() / 60_000) + h * 60 + m;
}

/**
 * Formats transit minutes into Indonesian readable duration:
 * 150 -> "2 jam 30 menit", 180 -> "3 jam", 45 -> "45 menit".
 */
export function formatTransitDurationId(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours} jam ${mins} menit`;
  if (hours > 0) return `${hours} jam`;
  return `${mins} menit`;
}

/**
 * Checks whether a departure time is midnight / early morning ("dinihari": 00:00 - 04:59).
 */
export function isEarlyMorningTime(hhmm) {
  const norm = normalizeTimeHHMM(hhmm);
  if (!norm || !norm.includes(':')) return false;
  const hour = parseInt(norm.split(':')[0], 10);
  return Number.isFinite(hour) && hour >= 0 && hour < 5;
}

export function createEmptyPassenger() {
  return {
    title: 'MR',
    fullName: '',
    paxType: 'ADT' // 'ADT' | 'CHD' | 'INF'
  };
}

export function createEmptySegment() {
  return {
    airlineCode: '',
    airlineName: '',
    flightNumber: '',
    bookingClass: '',
    departureDate: '',
    originCode: '',
    originCity: '',
    destinationCode: '',
    destinationCity: '',
    departureTime: '',
    arrivalTime: '',
    arrivalDayOffset: 0,
    terminalOrigin: '',
    terminalDestination: '',
    forceDinihariNotice: null // null = auto, true = force on, false = force off
  };
}

/**
 * Enriches every flight segment with:
 * - Resolved airline name & detailed airport names ("Jakarta (CGK)", "Taipei (TPE)")
 * - Computed arrival date (respecting +1 / +2 / -1 day offsets)
 * - Auto transit duration to the NEXT segment when arriving & departing the same airport within 24h
 * - Auto early-morning / midnight (00:00–04:59) H-1 airport reminder on initial/standalone departures
 */
export function computeEnrichedSegments(rawSegments = []) {
  const segments = (Array.isArray(rawSegments) ? rawSegments : []).map((seg) => {
    const airlineCode = String(seg?.airlineCode || '').trim().toUpperCase();
    const originCode = String(seg?.originCode || '').trim().toUpperCase();
    const destinationCode = String(seg?.destinationCode || '').trim().toUpperCase();
    const departureTime = normalizeTimeHHMM(seg?.departureTime);
    const arrivalTime = normalizeTimeHHMM(seg?.arrivalTime);
    const arrivalDayOffset = Number.isFinite(Number(seg?.arrivalDayOffset))
      ? parseInt(seg.arrivalDayOffset, 10)
      : 0;
    const departureDate = String(seg?.departureDate || '').trim();
    const arrivalDate = departureDate ? addDaysToIsoDate(departureDate, arrivalDayOffset) : '';

    return {
      ...createEmptySegment(),
      ...seg,
      airlineCode,
      airlineName: resolveAirlineName(airlineCode, seg?.airlineName),
      flightNumber: String(seg?.flightNumber || '').trim().toUpperCase(),
      bookingClass: String(seg?.bookingClass || '').trim().toUpperCase(),
      departureDate,
      arrivalDate,
      arrivalDayOffset,
      originCode,
      originCity: resolveAirportCity(originCode, seg?.originCity),
      originDetail: formatAirportDetail(originCode, seg?.originCity),
      destinationCode,
      destinationCity: resolveAirportCity(destinationCode, seg?.destinationCity),
      destinationDetail: formatAirportDetail(destinationCode, seg?.destinationCity),
      departureTime,
      arrivalTime
    };
  });

  // Compute transit durations between consecutive segments (seg[i] -> seg[i+1])
  for (let i = 0; i < segments.length; i += 1) {
    const cur = segments[i];
    const next = segments[i + 1];
    cur.transitAfterMinutes = null;
    cur.transitAfterLabel = '';
    cur.transitAirportDetail = '';
    cur.isPrecededByTransit = false;

    if (next && cur.destinationCode && next.originCode && cur.destinationCode === next.originCode) {
      const arrMins = toClockMinutes(cur.arrivalDate || cur.departureDate, cur.arrivalTime);
      const depMins = toClockMinutes(next.departureDate, next.departureTime);
      if (arrMins !== null && depMins !== null) {
        const diffMins = depMins - arrMins;
        if (diffMins > 0 && diffMins <= 24 * 60) {
          cur.transitAfterMinutes = diffMins;
          cur.transitAfterLabel = formatTransitDurationId(diffMins);
          cur.transitAirportDetail = cur.destinationDetail;
        }
      }
    }
  }

  for (let i = 1; i < segments.length; i += 1) {
    if (segments[i - 1].transitAfterMinutes !== null) {
      segments[i].isPrecededByTransit = true;
    }
  }

  // Auto H-1 "Di airport" notice for midnight/dinihari departures (00:00–04:59)
  // Triggered automatically on Segment 1 (index 0) or any standalone non-transit leg departure!
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const isAutoDinihari =
      isEarlyMorningTime(seg.departureTime) &&
      (i === 0 || !seg.isPrecededByTransit);

    const showDinihari =
      seg.forceDinihariNotice === true
        ? true
        : seg.forceDinihariNotice === false
          ? false
          : isAutoDinihari;

    seg.isAutoDinihari = isAutoDinihari;
    seg.showDinihariNotice = showDinihari;
    seg.airportCheckinDate = showDinihari && seg.departureDate
      ? addDaysToIsoDate(seg.departureDate, -1)
      : '';
    seg.dinihariNoticeText = seg.airportCheckinDate
      ? `Di airport tgl ${formatDateShortId(seg.airportCheckinDate)} malam (H-1 sebelum keberangkatan)`
      : showDinihari
        ? 'Di airport H-1 malam sebelum keberangkatan'
        : '';
  }

  return segments;
}

/**
 * Summarizes distinct airlines across all flight segments (e.g. "EVA Air (BR)" or "EVA Air (BR) / Singapore Airlines (SQ)").
 */
export function summarizeAirlinesFromSegments(segments = []) {
  const seen = new Set();
  const labels = [];
  for (const seg of segments) {
    const code = String(seg?.airlineCode || '').trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const name = resolveAirlineName(code, seg?.airlineName);
    labels.push(name && name !== code ? `${name} (${code})` : code);
  }
  return labels.join(' / ');
}

/**
 * Deterministic fallback parser for raw GDS text (Galileo / Amadeus / Sabre / Abacus / Travelport).
 * Handles lines such as:
 *   1  BR 238 S 25NOV 3*CGKTPE 1440 2100
 *   2  BR 028 S 25NOV 3*TPESFO 2330 1840
 *   3  BR 017 W 08DEC 2*SFOTPE 2350 0600 +2
 *   4  BR 237 W 10DEC 4*TPECGK 0900 1325
 * And passenger lines such as:
 *   1.1SANTOSO/BUDI MR   2.1SANTOSO/ANI MRS
 *   1.BUDI/SANTOSO MR
 *   MR BUDI SANTOSO
 */
export function parseGdsTextFallback(rawText = '', referenceDate = new Date()) {
  const lines = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const segments = [];
  const passengers = [];
  const seenPax = new Set();
  let prevIsoDate = '';

  // 1. Flight Segment Regex (handles Galileo, Amadeus, Sabre formats)
  // Examples:
  //   "1  BR 238 S 25NOV 3*CGKTPE 1440 2100"
  //   "3  BR 017 W 08DEC 2*SFOTPE 2350 0600 +2"
  //   "2 SQ 951 Q 12JAN 1 CGK SIN HK2 0525 0810"
  //   "GA 874 Y 01FEB CGKHND 0035 0955"
  const segRegex =
    /^(?:\d+\s*[.)]?\s*)?([A-Z0-9]{2})\s*(\d{1,4})\s+([A-Z])?\s*(\d{1,2}[A-Z]{3}(?:\d{2,4})?)\s+(?:[1-7A-Z]{1,3}\*?)?\s*([A-Z]{3})[\s/-]*([A-Z]{3})\s+(?:[A-Z]{2}\d*\s+)?(\d{2}:?\d{2})\s+(\d{2}:?\d{2})(?:\s*([+-]\s*\d|#\s*\d|\*\s*\d))?/i;

  for (const line of lines) {
    // Strip inline parenthetical transit notes if user pasted annotated lines like "(transit 2 jam 30 menit)"
    const cleanedLine = line.replace(/\([^)]*transit[^)]*\)/gi, '').trim();
    const m = cleanedLine.match(segRegex);
    if (m) {
      const airlineCode = m[1].toUpperCase();
      const flightNumber = m[2];
      const bookingClass = (m[3] || '').toUpperCase();
      const depIso = parseGdsDateToken(m[4], referenceDate, prevIsoDate);
      if (depIso) prevIsoDate = depIso;
      const originCode = m[5].toUpperCase();
      const destinationCode = m[6].toUpperCase();
      const departureTime = normalizeTimeHHMM(m[7]);
      const arrivalTime = normalizeTimeHHMM(m[8]);

      let arrivalDayOffset = 0;
      if (m[9]) {
        const offsetStr = m[9].replace(/\s+/g, '');
        if (offsetStr.startsWith('#') || offsetStr.startsWith('*')) {
          arrivalDayOffset = parseInt(offsetStr.slice(1), 10) || 1;
        } else {
          arrivalDayOffset = parseInt(offsetStr, 10) || 0;
        }
      }

      segments.push({
        ...createEmptySegment(),
        airlineCode,
        airlineName: resolveAirlineName(airlineCode),
        flightNumber,
        bookingClass,
        departureDate: depIso,
        originCode,
        originCity: resolveAirportCity(originCode),
        destinationCode,
        destinationCity: resolveAirportCity(destinationCode),
        departureTime,
        arrivalTime,
        arrivalDayOffset
      });
      continue;
    }

    // 2. GDS Passenger lines: "1.1LAST/FIRST MR" or "1.LAST/FIRST MRS" or "MR FIRST LAST"
    const gdsPaxMatches = line.matchAll(
      /(?:^|\s)\d+(?:\.\d+)?\.?\s*([A-Z][A-Z\s'-]+\/[A-Z][A-Z\s'-]+?)(?:\s+(MR|MRS|MS|MSTR|MISS))?(?:\s*\((CHD|INF)[^)]*\))?(?=\s+\d+\.|\s*$)/gi
    );
    for (const pm of gdsPaxMatches) {
      const rawName = pm[1].trim().toUpperCase();
      const [last, first] = rawName.split('/').map((s) => s.trim());
      const titleMatch = (first || '').match(/\b(MR|MRS|MS|MSTR|MISS)\b$/i);
      const title = (pm[2] || (titleMatch ? titleMatch[1] : 'MR')).toUpperCase();
      const cleanFirst = (first || '').replace(/\b(MR|MRS|MS|MSTR|MISS)\b$/i, '').trim();
      const fullName = `${cleanFirst} ${last}`.replace(/\s+/g, ' ').trim();
      const typeTag = (pm[3] || '').toUpperCase();
      const paxType =
        typeTag === 'INF'
          ? 'INF'
          : typeTag === 'CHD' || title === 'MSTR' || title === 'MISS'
            ? 'CHD'
            : 'ADT';
      const dedupKey = `${title}|${fullName}`;
      if (fullName && !seenPax.has(dedupKey)) {
        seenPax.add(dedupKey);
        passengers.push({ title, fullName, paxType });
      }
    }

    // Plain human name line with title: "1. MR BUDI SANTOSO" or "MRS SITI RAHAYU"
    if (passengers.length === 0 || /^\d*\.?\s*(MR|MRS|MS|MSTR|MISS)\b/i.test(line)) {
      const plainMatch = line.match(
        /^(?:\d+[.)]\s*)?(MR|MRS|MS|MSTR|MISS)\.?\s+([A-Z][A-Z\s.'-]{2,})(?:\s*\((ADT|CHD|INF|DEWASA|ANAK|BAYI)\))?$/i
      );
      if (plainMatch) {
        const title = plainMatch[1].toUpperCase();
        const fullName = plainMatch[2].trim().toUpperCase();
        const tag = (plainMatch[3] || '').toUpperCase();
        const paxType =
          tag === 'INF' || tag === 'BAYI'
            ? 'INF'
            : tag === 'CHD' || tag === 'ANAK' || title === 'MSTR' || title === 'MISS'
              ? 'CHD'
              : 'ADT';
        const dedupKey = `${title}|${fullName}`;
        if (!seenPax.has(dedupKey)) {
          seenPax.add(dedupKey);
          passengers.push({ title, fullName, paxType });
        }
      }
    }
  }

  return {
    agentBookingCode: '',
    airlinesBookingCode: '',
    passengers,
    segments,
    baggageNote: '',
    timeLimitNote: '',
    summary:
      segments.length > 0
        ? `Parser GDS mendeteksi ${segments.length} segmen penerbangan dan ${passengers.length} penumpang.`
        : 'Tidak ditemukan segmen penerbangan terstruktur.'
  };
}

/**
 * Formats Baggage clause based on Weight Concept ("30 Kg") vs Piece Concept ("2 pcs @ 23 Kg masing-masing").
 */
export function buildBaggageText(form = {}) {
  if (form.baggageConcept === 'piece') {
    const pieces = String(form.baggagePieces || '').trim();
    const weightPerPc = String(form.baggageWeightPerPiece || '').trim();
    if (pieces && weightPerPc) {
      return `Bagasi ${pieces} pcs (${weightPerPc} Kg masing-masing)`;
    }
    if (pieces) {
      return `Bagasi ${pieces} pcs`;
    }
    return 'Bagasi sesuai ketentuan maskapai (Piece Concept)';
  }
  const kg = String(form.baggageWeightKg || '').trim();
  return kg ? `Bagasi ${kg} Kg` : 'Bagasi sesuai ketentuan maskapai';
}

export function buildChangePolicyText(form = {}) {
  if (form.isNonChangeable) {
    return 'Ticket nonchangeable';
  }
  const currency = form.changePenaltyCurrency || 'IDR';
  const amount = formatNumberWithCommas(form.changePenaltyAmount);
  const penaltyPart = amount ? `${currency} ${amount}` : `${currency} ...............`;
  return `Tiket masih dapat diubah dengan penalty ${penaltyPart} diluar selisih harga & pajak yang berlaku`;
}

export function buildRefundPolicyText(form = {}) {
  if (form.isNonRefundable) {
    return 'Ticket nonrefundable';
  }
  const currency = form.refundPenaltyCurrency || 'IDR';
  const amount = formatNumberWithCommas(form.refundPenaltyAmount);
  const penaltyPart = amount ? `${currency} ${amount}` : `${currency} ...............`;
  return `Ticket masih bisa direfund dengan penalty ${penaltyPart} diluar pajak yang tidak kembali dan ketentuan yang berlaku`;
}

export function buildTimeLimitText(form = {}) {
  const datePart = form.timeLimitDate ? formatDateDDMMMYY(form.timeLimitDate) : 'DDMMMYY';
  const timePart = form.timeLimitTime ? normalizeTimeHHMM(form.timeLimitTime) : 'HH:MM';
  const tz = form.timeLimitTz || 'WIB';
  return `Batas pembayaran / Batas issued sebelum tanggal ${datePart} Jam ${timePart} ${tz}`;
}

export function getActivePassengers(passengers = []) {
  return (Array.isArray(passengers) ? passengers : [])
    .filter((p) => String(p?.fullName || '').trim().length > 0)
    .map((p) => ({
      title: String(p.title || 'MR').trim().toUpperCase(),
      fullName: String(p.fullName || '').trim().toUpperCase(),
      paxType: p.paxType || 'ADT'
    }));
}

/**
 * Formats a single flight segment line cleanly for WhatsApp / Copy-Paste confirmation.
 */
export function formatSegmentLineForText(seg, index) {
  const num = index + 1;
  const flightCode = `${seg.airlineCode || '--'} ${seg.flightNumber || '---'}${seg.bookingClass ? ` (${seg.bookingClass})` : ''}`;
  const depDateStr = seg.departureDate ? formatDateWithDayId(seg.departureDate) : 'Tanggal TBA';
  const routeStr = `${seg.originDetail} -> ${seg.destinationDetail}`;
  const timeDep = seg.departureTime || '--:--';
  const timeArr = seg.arrivalTime || '--:--';

  let arrivalExtra = '';
  if (seg.arrivalDayOffset > 0) {
    const arrDateLabel = seg.arrivalDate ? `Tgl ${formatDateShortId(seg.arrivalDate)}` : '';
    arrivalExtra = ` (+${seg.arrivalDayOffset}${arrDateLabel ? `, ${arrDateLabel}` : ''})`;
  } else if (seg.arrivalDayOffset < 0) {
    const arrDateLabel = seg.arrivalDate ? `Tgl ${formatDateShortId(seg.arrivalDate)}` : '';
    arrivalExtra = ` (${seg.arrivalDayOffset}${arrDateLabel ? `, ${arrDateLabel}` : ''})`;
  }

  const lines = [
    `${num}. ${flightCode} | ${depDateStr}`,
    `   ${routeStr}`,
    `   Berangkat ${timeDep} - Tiba ${timeArr}${arrivalExtra}`
  ];

  if (seg.showDinihariNotice && seg.dinihariNoticeText) {
    lines.push(`   *Catatan Check-in:* ${seg.dinihariNoticeText}`);
  }

  if (seg.transitAfterLabel) {
    lines.push(`   ↳ Transit di ${seg.transitAirportDetail} selama *${seg.transitAfterLabel}*`);
  }

  return lines.join('\n');
}

/**
 * Builds the complete, ready-to-send WhatsApp / Chat Confirmation Text matching the agency format.
 */
export function buildFlightConfirmationWhatsAppText(form = {}) {
  const activePax = getActivePassengers(form.passengers);
  const enrichedSegments = computeEnrichedSegments(form.segments);
  const airlinesSummary =
    String(form.airlinesLabel || '').trim() || summarizeAirlinesFromSegments(enrichedSegments) || '-';

  const lines = [];
  lines.push('*KONFIRMASI PEMESANAN TIKET PESAWAT*');
  lines.push('================================');
  lines.push(`*Agent Booking Code* : ${String(form.agentBookingCode || '').trim() || '-'}`);
  lines.push(`*Airlines Booking Code* : ${String(form.airlinesBookingCode || '').trim() || '-'}`);
  lines.push('');

  lines.push(`*Passenger Name (${activePax.length} Pax):*`);
  if (activePax.length === 0) {
    lines.push('1. -');
  } else {
    activePax.forEach((p, idx) => {
      const typeLabel = p.paxType === 'CHD' ? ' (Anak)' : p.paxType === 'INF' ? ' (Bayi)' : '';
      lines.push(`${idx + 1}. ${p.title} ${p.fullName}${typeLabel}`);
    });
  }
  lines.push('');

  lines.push('*Flight Detail*');
  lines.push(`Airlines : *${airlinesSummary}*`);
  if (enrichedSegments.length === 0) {
    lines.push('-');
  } else {
    enrichedSegments.forEach((seg, idx) => {
      lines.push(formatSegmentLineForText(seg, idx));
    });
  }
  lines.push('');

  lines.push('*Harga :*');
  const adultPrice = formatNumberWithCommas(form.priceAdult);
  const childPrice = formatNumberWithCommas(form.priceChild);
  const infantPrice = formatNumberWithCommas(form.priceInfant);
  const hasAnyPrice = Boolean(adultPrice || childPrice || infantPrice);

  if (!hasAnyPrice) {
    lines.push('• Dewasa : IDR ............... /Pax');
    lines.push('• Anak   : IDR ............... /Pax');
    lines.push('• Bayi   : IDR ............... /Pax');
  } else {
    if (adultPrice) lines.push(`• Dewasa : IDR ${adultPrice} /Pax`);
    if (childPrice) lines.push(`• Anak   : IDR ${childPrice} /Pax`);
    if (infantPrice) lines.push(`• Bayi   : IDR ${infantPrice} /Pax`);
  }
  lines.push('');

  lines.push('*Ketentuan :*');
  lines.push(`1. ${buildTimeLimitText(form)}`);
  lines.push(`2. ${buildBaggageText(form)}`);
  lines.push(`3. ${buildChangePolicyText(form)}`);
  lines.push(`4. ${buildRefundPolicyText(form)}`);
  lines.push(`5. ${DEFAULT_PASSPORT_CLAUSE}`);
  if (String(form.extraNotes || '').trim()) {
    lines.push(`6. ${String(form.extraNotes).trim()}`);
  }

  return lines.join('\n');
}

export function buildFlightConfirmationEmailDraft(form = {}) {
  const activePax = getActivePassengers(form.passengers);
  const leadName = activePax[0] ? `${activePax[0].title} ${activePax[0].fullName}` : 'Customer';
  const bookingRef = String(form.airlinesBookingCode || form.agentBookingCode || '').trim();
  const subject = bookingRef
    ? `Konfirmasi Reservasi Tiket Pesawat - ${bookingRef} (${leadName})`
    : `Konfirmasi Reservasi Tiket Pesawat - ${leadName}`;
  const body = buildFlightConfirmationWhatsAppText(form).replace(/\*/g, '');
  const to = String(form.customerEmail || '').trim();
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailtoUrl };
}

export function buildFlightPdfFilename(form = {}) {
  const activePax = getActivePassengers(form.passengers);
  const firstPax = activePax[0]?.fullName || 'Customer';
  const ref = String(form.airlinesBookingCode || form.agentBookingCode || '').trim();
  const safeName = firstPax.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28);
  const safeRef = ref.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 12);
  return safeRef
    ? `Flight_Booking_${safeRef}_${safeName}.pdf`
    : `Flight_Booking_${safeName}.pdf`;
}

/**
 * Generates an official, clean 1-page A4 PDF Flight Booking Confirmation via jsPDF + autoTable.
 */
async function buildFlightBookingJsPdfDoc(form = {}) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const activePax = getActivePassengers(form.passengers);
  const enrichedSegments = computeEnrichedSegments(form.segments);
  const airlinesSummary =
    String(form.airlinesLabel || '').trim() || summarizeAirlinesFromSegments(enrichedSegments) || '-';

  // Top Header Bar
  doc.setFillColor(11, 19, 41);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KONFIRMASI PEMESANAN TIKET PESAWAT', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text('FLIGHT RESERVATION & TICKETING CONFIRMATION', margin, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(String(form.branchName || 'Dwidayatour'), pageWidth - margin, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    form.staffName ? `Staff: ${form.staffName}` : 'making travel easy',
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  let y = 32;

  // Booking Codes Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AGENT BOOKING CODE', margin + 4, y + 5.5);
  doc.text('AIRLINES BOOKING CODE', margin + contentWidth * 0.36, y + 5.5);
  doc.text('AIRLINES', margin + contentWidth * 0.68, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(form.agentBookingCode || '-').toUpperCase(), margin + 4, y + 12.2);
  doc.text(String(form.airlinesBookingCode || '-').toUpperCase(), margin + contentWidth * 0.36, y + 12.2);
  doc.setFontSize(9.5);
  doc.text(airlinesSummary.slice(0, 34), margin + contentWidth * 0.68, y + 12.2);

  y += 22;

  // Passengers Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PASSENGER LIST (${activePax.length} PAX)`, margin, y);
  y += 2.5;

  const paxRows = activePax.length > 0
    ? activePax.map((p, i) => [
        `${i + 1}`,
        `${p.title} ${p.fullName}`,
        p.paxType === 'CHD' ? 'Anak (CHD)' : p.paxType === 'INF' ? 'Bayi (INF)' : 'Dewasa (ADT)'
      ])
    : [['1', '-', '-']];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['No', 'Passenger Name (Sesuai Paspor)', 'Kategori']],
    body: paxRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [15, 23, 42] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 34 } }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Flight Details Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`FLIGHT DETAIL — ${airlinesSummary}`, margin, y);
  y += 2.5;

  const flightBody = [];
  enrichedSegments.forEach((seg, idx) => {
    const depDate = seg.departureDate ? formatDateWithDayId(seg.departureDate) : '-';
    const arrOffsetText =
      seg.arrivalDayOffset > 0
        ? ` (+${seg.arrivalDayOffset}, ${formatDateShortId(seg.arrivalDate)})`
        : seg.arrivalDayOffset < 0
          ? ` (${seg.arrivalDayOffset}, ${formatDateShortId(seg.arrivalDate)})`
          : '';

    const noteParts = [];
    if (seg.showDinihariNotice && seg.dinihariNoticeText) {
      noteParts.push(seg.dinihariNoticeText);
    }
    if (seg.transitAfterLabel) {
      noteParts.push(`Transit di ${seg.transitAirportDetail}: ${seg.transitAfterLabel}`);
    }

    flightBody.push([
      `${idx + 1}`,
      `${seg.airlineCode} ${seg.flightNumber}${seg.bookingClass ? `\nClass ${seg.bookingClass}` : ''}`,
      depDate,
      `${seg.originDetail}\n${seg.departureTime || '--:--'}`,
      `${seg.destinationDetail}\n${seg.arrivalTime || '--:--'}${arrOffsetText}`,
      noteParts.join('\n') || '-'
    ]);
  });

  if (flightBody.length === 0) {
    flightBody.push(['1', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['No', 'Flight', 'Tanggal', 'Keberangkatan', 'Ketibaan', 'Catatan / Transit']],
    body: flightBody,
    theme: 'grid',
    styles: { fontSize: 7.8, cellPadding: 2.2, textColor: [15, 23, 42], valign: 'middle' },
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.8 },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 38 },
      4: { cellWidth: 42 },
      5: { cellWidth: 'auto' }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Pricing Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('HARGA TIKET (PER PAX)', margin, y);
  y += 2.5;

  const priceRows = [];
  const pAdult = formatNumberWithCommas(form.priceAdult);
  const pChild = formatNumberWithCommas(form.priceChild);
  const pInfant = formatNumberWithCommas(form.priceInfant);

  if (pAdult || (!pChild && !pInfant)) {
    priceRows.push(['Dewasa (Adult)', pAdult ? `IDR ${pAdult} / Pax` : 'IDR ............... / Pax']);
  }
  if (pChild || (!pAdult && !pInfant)) {
    priceRows.push(['Anak (Child)', pChild ? `IDR ${pChild} / Pax` : 'IDR ............... / Pax']);
  }
  if (pInfant || (!pAdult && !pChild)) {
    priceRows.push(['Bayi (Infant)', pInfant ? `IDR ${pInfant} / Pax` : 'IDR ............... / Pax']);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Kategori Penumpang', 'Harga per Pax']],
    body: priceRows,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [15, 23, 42] },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Terms & Conditions Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KETENTUAN & SYARAT TIKET', margin, y);
  y += 4;

  const terms = [
    `1. ${buildTimeLimitText(form)}`,
    `2. ${buildBaggageText(form)}`,
    `3. ${buildChangePolicyText(form)}`,
    `4. ${buildRefundPolicyText(form)}`,
    `5. ${DEFAULT_PASSPORT_CLAUSE}`
  ];
  if (String(form.extraNotes || '').trim()) {
    terms.push(`6. ${String(form.extraNotes).trim()}`);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);

  for (const line of terms) {
    const wrapped = doc.splitTextToSize(line, contentWidth - 4);
    if (y + wrapped.length * 4 > 282) {
      doc.addPage();
      y = 18;
    }
    doc.text(wrapped, margin + 2, y);
    y += wrapped.length * 4 + 1.5;
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Dokumen ini dibuat melalui TravelOps Flight Ticketing Confirmation Generator.',
    margin,
    290
  );

  return { doc, fileName: buildFlightPdfFilename(form) };
}

export async function generateFlightBookingPdf(form = {}) {
  const { doc, fileName } = await buildFlightBookingJsPdfDoc(form);
  doc.save(fileName);
  return { fileName };
}

export async function printFlightBookingPdf(form = {}) {
  const { doc } = await buildFlightBookingJsPdfDoc(form);
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (win) {
    return { method: 'tab' };
  }
  doc.autoPrint();
  window.print();
  return { method: 'window' };
}
