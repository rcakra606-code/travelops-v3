/**
 * Gemini AI Prompt Builder & Payload Validator for Flight Ticket Reservation Parsing.
 * Supports:
 *  - Copy-pasted screenshots / images (PNG, JPEG, WEBP)
 *  - PDF e-tickets / GDS itinerary confirmations
 *  - Pure raw reservation text (Galileo, Amadeus, Sabre, Abacus, Travelport, airline confirmation text)
 */

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateFlightReservationPayload(body = {}) {
  const textInput = typeof body.textInput === 'string' ? body.textInput.trim() : '';
  const hasFile = Boolean(body.fileBase64 && String(body.fileBase64).trim().length > 10);

  if (!textInput && !hasFile) {
    return {
      valid: false,
      error: 'Masukkan teks reservasi atau unggah / tempel (Ctrl+V) screenshot atau PDF terlebih dahulu.'
    };
  }

  let cleanBase64 = '';
  let normalizedMime = '';

  if (hasFile) {
    const rawStr = String(body.fileBase64).trim();
    const dataUrlMatch = rawStr.match(/^data:([^;]+);base64,(.+)$/s);
    if (dataUrlMatch) {
      normalizedMime = dataUrlMatch[1].toLowerCase().trim();
      cleanBase64 = dataUrlMatch[2].replace(/\s+/g, '');
    } else {
      normalizedMime = String(body.mimeType || 'image/png').toLowerCase().trim();
      cleanBase64 = rawStr.replace(/\s+/g, '');
    }

    if (normalizedMime === 'image/jpg') normalizedMime = 'image/jpeg';

    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return {
        valid: false,
        error: `Format file "${normalizedMime}" tidak didukung. Gunakan PDF, PNG, JPG, atau WEBP.`
      };
    }

    const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4);
    if (estimatedBytes > MAX_FILE_BYTES) {
      return {
        valid: false,
        error: 'Ukuran file terlalu besar (maksimal 10 MB).'
      };
    }
  }

  return {
    valid: true,
    textInput,
    hasFile,
    cleanBase64,
    mimeType: normalizedMime,
    fileName: String(body.fileName || '').slice(0, 200)
  };
}

export function buildFlightReservationPrompt({ textInput = '', currentYear = new Date().getFullYear() } = {}) {
  const textSection = textInput
    ? `\nRAW RESERVATION TEXT PROVIDED BY AGENT:\n"""\n${textInput.slice(0, 18000)}\n"""\n`
    : '';

  return `You are an expert airline ticketing & GDS (Galileo, Amadeus, Sabre, Abacus, Travelport) reservation parser for an Indonesian travel agency (Dwidayatour).

Analyze the attached screenshot/PDF and/or raw reservation text and extract ALL passengers and ALL flight segments into strict JSON.
${textSection}
CRITICAL PARSING RULES:
1. PASSENGERS:
   - Extract EVERY passenger listed in the PNR / reservation / e-ticket.
   - Standardize GDS name formats like "1.1BUDI/SANTOSO MR" or "1.SANTOSO/BUDI MR" or "MR BUDI SANTOSO" into:
     - "title": one of "MR", "MRS", "MS", "MSTR", "MISS" (infer MR/MRS/MS if obvious, default "MR" if omitted)
     - "fullName": clean UPPERCASE full name WITHOUT title (keep surname/given name cleanly, e.g. "BUDI SANTOSO" or "SANTOSO/BUDI" -> convert "LAST/FIRST" into "FIRST LAST" when clearly GDS surname/given format, or preserve exact passport order if ambiguous).
     - "paxType": "ADT" (Dewasa), "CHD" (Anak — if marked CHD, C05-C11, MSTR, MISS with child note), or "INF" (Bayi — if marked INF / infant).
   - If no passenger names exist in the snippet (e.g. itinerary-only quote), return an empty array [].

2. FLIGHT SEGMENTS (preserve exact chronological order 1..N):
   - Handle GDS compact lines like:
     "1  BR 238 S 25NOV 3*CGKTPE 1440 2100"
     "3  BR 017 W 08DEC 2*SFOTPE 2350 0600 +2"
     "SQ 951 Q 12JAN CGKSIN 0525 0810"
     as well as human-readable airline PDFs/screenshots!
   - "airlineCode": 2-character IATA carrier code (UPPERCASE, e.g. "BR", "SQ", "GA", "CX", "JL", "NH", "QR", "EK", "TK", "CI", "JX").
   - "airlineName": full airline name (e.g. "EVA Air", "Singapore Airlines", "Garuda Indonesia").
   - "flightNumber": numeric flight number without airline code (e.g. "238", "028", "017", "237").
   - "bookingClass": 1-letter booking class/RBD if shown (e.g. "S", "W", "Y", "J"), else "".
   - "departureDate": ISO "YYYY-MM-DD". If year is NOT shown (e.g. "25NOV"), infer the nearest upcoming date relative to reference year ${currentYear} (if the itinerary spans DEC -> JAN, increment year for JAN!).
   - "originCode": 3-letter IATA airport code UPPERCASE (e.g. "CGK", "TPE", "SFO").
   - "originCity": readable city/airport name (e.g. "Jakarta", "Taipei", "San Francisco", "Tokyo Narita").
   - "destinationCode": 3-letter IATA airport code UPPERCASE (e.g. "TPE", "SFO", "CGK").
   - "destinationCity": readable city/airport name (e.g. "Taipei", "San Francisco", "Jakarta").
   - "departureTime": 24-hour "HH:MM" (e.g. "14:40", "23:50", "00:35").
   - "arrivalTime": 24-hour "HH:MM" (e.g. "21:00", "06:00", "13:25").
   - "arrivalDayOffset": integer day offset from departureDate to arrivalDate (0 for same day, 1 for "+1" / next day, 2 for "+2" / two days later, -1 for "-1" previous day). ALWAYS verify against explicit "+1", "+2", "#1", "#2", "*1", or explicit arrival date shown in PDF/screenshot!
   - "terminalOrigin": departure terminal if shown (e.g. "T3"), else "".
   - "terminalDestination": arrival terminal if shown (e.g. "T2"), else "".

3. OPTIONAL DETECTED METADATA (leave empty string "" if not clearly visible; do NOT hallucinate):
   - "agentBookingCode": GDS PNR / agency locator if visible (user can still overwrite manually).
   - "airlinesBookingCode": Airline record locator / reloc if visible.
   - "baggageNote": baggage allowance text if shown on ticket (e.g. "30K", "2PC", "23KG x 2"), else "".
   - "timeLimitNote": ticketing time limit if shown, else "".

RETURN STRICT JSON ONLY matching this exact schema (no markdown, no explanation):
{
  "agentBookingCode": "",
  "airlinesBookingCode": "",
  "passengers": [
    { "title": "MR", "fullName": "BUDI SANTOSO", "paxType": "ADT" }
  ],
  "segments": [
    {
      "airlineCode": "BR",
      "airlineName": "EVA Air",
      "flightNumber": "238",
      "bookingClass": "S",
      "departureDate": "${currentYear}-11-25",
      "originCode": "CGK",
      "originCity": "Jakarta",
      "destinationCode": "TPE",
      "destinationCity": "Taipei",
      "departureTime": "14:40",
      "arrivalTime": "21:00",
      "arrivalDayOffset": 0,
      "terminalOrigin": "",
      "terminalDestination": ""
    }
  ],
  "baggageNote": "",
  "timeLimitNote": "",
  "summary": "Ringkasan singkat hasil parsing dalam bahasa Indonesia"
}`;
}
