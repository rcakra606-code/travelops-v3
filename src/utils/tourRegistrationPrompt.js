/**
 * Shared validation & prompt builder for AI Tour Registration Form parsing
 * (used by both production server.js and local dev middleware in vite.config.js).
 */

const ALLOWED_MIME_MAGIC = {
  'application/pdf': ['JVBERi'], // %PDF
  'image/png': ['iVBORw0KGgo'],
  'image/jpeg': ['/9j/'],
  'image/jpg': ['/9j/'],
  'image/webp': ['UklGR']
};

export function validateRegistrationFilePayload(fileBase64, mimeType = 'application/pdf') {
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return { valid: false, error: 'File dokumen (PDF/Gambar) wajib diunggah.' };
  }

  let detectedMime = (mimeType || 'application/pdf').toLowerCase().trim();
  let cleanBase64 = fileBase64;

  const dataUriMatch = cleanBase64.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUriMatch) {
    detectedMime = dataUriMatch[1].toLowerCase().trim();
    cleanBase64 = dataUriMatch[2];
  } else if (cleanBase64.includes('base64,')) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }

  cleanBase64 = cleanBase64.replace(/\s+/g, '');

  if (detectedMime === 'image/jpg') detectedMime = 'image/jpeg';

  // Roughly 12MB raw file limit (~16MB base64)
  if (cleanBase64.length > 16 * 1024 * 1024) {
    return { valid: false, error: 'Ukuran file terlalu besar (maksimal 12 MB).' };
  }

  const expectedPrefixes = ALLOWED_MIME_MAGIC[detectedMime];
  if (!expectedPrefixes) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan file PDF, JPG, PNG, atau WEBP.'
    };
  }

  const magicValid = expectedPrefixes.some((prefix) => cleanBase64.startsWith(prefix));
  if (!magicValid) {
    return {
      valid: false,
      error: `Isi file tidak cocok dengan format ${detectedMime}. Pastikan file valid dan tidak rusak.`
    };
  }

  return {
    valid: true,
    cleanBase64,
    mimeType: detectedMime
  };
}

export function buildTourRegistrationPrompt(staffNames = []) {
  const safeStaffList = Array.isArray(staffNames)
    ? staffNames.filter((s) => typeof s === 'string' && s.trim()).slice(0, 60)
    : [];

  const staffHint = safeStaffList.length > 0
    ? `Active Staff Directory in TravelOps (match "Reservasi diterima oleh / PIC / Agent" to the closest full name here if clearly referring to one of them): ${JSON.stringify(safeStaffList)}`
    : 'No staff directory provided; extract raw consultant/agent name if visible.';

  return `
You are an expert Indonesian Travel Operations AI Agent (specializing in Dwidayatour, Series, Corporate Incentive, and Consortium Tour Registration Forms / Formulir Pendaftaran).

Carefully examine the uploaded document (PDF or photo/scan, including tables, handwritten notes, stamps, and bottom summary boxes). Focus primarily on booking registration details (ignore standard legal Terms & Conditions pages unless they clarify a specific booking detail).

${staffHint}

Extract all available booking details into STRICT, VALID JSON with this exact schema:
{
  "tourType": "Series" | "Incentive" | "Consortium",
  "supplier": "",
  "tourCode": "",
  "tourTitle": "",
  "bookingCode": "",
  "country": "",
  "category": "Leisure" | "Corporate / Incentive" | "Private / FIT" | "Consortium" | "Religious / Pilgrimage",
  "departureDate": "YYYY-MM-DD or empty string",
  "returnDate": "YYYY-MM-DD or empty string",
  "paxCount": 1,
  "staffName": "",
  "roomingNote": "",
  "paxInfo": [
    {
      "title": "Mr" | "Mrs" | "Ms" | "Mstr" | "Miss",
      "firstName": "",
      "lastName": "",
      "phone": "",
      "email": "",
      "basicPrice": 0,
      "airportTax": 0,
      "tipping": 0,
      "miscCharge": 0,
      "ppn": 0,
      "discountSupplier": 0,
      "discountBranch": 0,
      "notes": ""
    }
  ],
  "financials": {
    "basicTourPrice": 0,
    "depositAmount": 0,
    "depositNumber": "",
    "invoiceNumber": "",
    "discountSupplier": 0,
    "discountBranch": 0,
    "airportTax": 0,
    "tipping": 0,
    "miscCharge": 0,
    "ppn": 0,
    "paymentSummary": ""
  },
  "importantNotes": [
    "Concise bullet points from notes/boxes, e.g., voucher details, payment deadline, visa/tipping exclusions"
  ],
  "warnings": [
    "Proactive Indonesian warnings about ANY anomaly, conflict, or ambiguity found in the document"
  ],
  "confidence": "high" | "medium" | "low"
}

EXTRACTION & AUDIT RULES (CRITICAL):
1. "tourCode" vs "tourTitle":
   - If "Nama tur / Tour code" is e.g. "VDASKOSKIDMZ 7D5N VD Korea Incheon Winter with DMZ Ski Experience", extract "tourCode": "VDASKOSKIDMZ" (the leading alphanumeric code) and "tourTitle": "7D5N VD Korea Incheon Winter with DMZ Ski Experience".
2. "country":
   - Normalize destination country into standard English country name (e.g. "Korea" -> "South Korea", "Jepang" -> "Japan", "Swiss" -> "Switzerland", "Cina" -> "China", "Inggris" -> "United Kingdom", "Turki" -> "Turkey").
3. "departureDate" & "returnDate":
   - Convert Indonesian/English dates (e.g. "04 Januari - 10 Januari 2027") strictly to ISO "YYYY-MM-DD" ("2027-01-04" and "2027-01-10"). If start date omits year, inherit the year from end date.
4. "paxCount" & "paxInfo":
   - Count ACTUAL participants listed in the passenger table! Do NOT blindly trust narrative text if the table lists more/fewer names.
   - Split passenger names cleanly: e.g. "MR EDY NURKISWOYO" -> title: "Mr", firstName: "EDY", lastName: "NURKISWOYO". For 3-word names like "MRS EMERALDA ZULKARNAEN KASIM" -> title: "Mrs", firstName: "EMERALDA", lastName: "ZULKARNAEN KASIM".
   - Extract phone numbers ("NOTELP: +628121055607") and attach to the corresponding passenger's "phone" field.
   - If a per-pax tour price is listed (e.g. "IDR 18,977,000 / PAX"), populate each pax's "basicPrice" with 18977000 (numeric integer, NO commas or currency text) AND set "financials.basicTourPrice" to the sum across all pax.
   - Put room configuration (e.g. "ROOM: TRIPLE ROOM") into "roomingNote" and lead pax "notes".
5. Deposit & Mixed Voucher/Payment Boxes:
   - Carefully read bottom notes / summary boxes! If there is a voucher (e.g. "DP: IDR 16.900.000 / PAX (Voucher PMK)" x 2 pax) PLUS cash/transfer deposit (e.g. "DEPOSIT: 10,000,000"), calculate the total recorded deposit or put the clearest numeric deposit into "financials.depositAmount", explain the exact breakdown in "financials.paymentSummary", AND add a clear Indonesian warning in "warnings" asking staff to verify the exact DP amount before finalizing!
6. Proactive "warnings" (in clear Indonesian):
   - ALWAYS check and warn if:
     * Narrative text pax count disagrees with actual participant table row count (e.g. "Paragraf atas tertulis 2 Peserta, namun tabel berisi 3 nama peserta & TRIPLE ROOM — harap verifikasi jumlah pax.").
     * Payment uses vouchers / mixed DP / split pricing that requires human double-check.
     * Price explicitly excludes Visa, Tipping, Airport Tax, or PPN.
     * Any handwritten/blurry text has low confidence.
     * Staff name in document is a nickname or branch label that needs confirmation.
7. NEVER hallucinate missing internal codes ("bookingCode", "depositNumber", "invoiceNumber", "profit"). Leave them as "" or 0 if not explicitly printed on the form.

Respond ONLY with valid JSON. No markdown fencing, no prose before or after JSON.
`;
}
