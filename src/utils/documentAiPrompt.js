/**
 * Shared validation & prompt builder for AI Visa / Document Request Form parsing
 * (Lark Suite "Request VISA/DOCUMENT" PDFs, scans, or photos).
 * Used by both production server.js and local dev middleware in vite.config.js.
 */

export { validateRegistrationFilePayload as validateDocumentFilePayload } from './tourRegistrationPrompt.js';

export function buildDocumentRequestPrompt(staffNames = []) {
  const safeStaffList = Array.isArray(staffNames)
    ? staffNames.filter((s) => typeof s === 'string' && s.trim()).slice(0, 60)
    : [];

  const staffHint = safeStaffList.length > 0
    ? `Active Non-Admin Consultant Directory in TravelOps (match "Requester" to the closest full name here if clearly referring to one of them; DO NOT assign central "PIC Document" checkers unless Requester is missing): ${JSON.stringify(safeStaffList)}`
    : 'No staff directory provided; extract raw "Requester" name if visible.';

  return `
You are an expert Indonesian Travel Operations AI Agent specializing in Visa, Passport, and Document Request Forms (especially Dwidayatour Lark Suite "Request VISA/DOCUMENT" approval PDFs, visa order forms, and intake sheets).

Carefully examine ALL pages of the uploaded document (including Page 1 Request/Applicant details AND Page 2 Approval Record if present).

${staffHint}

Extract all available details into STRICT, VALID JSON with this exact schema:
{
  "requestNo": "",
  "approvalNo": "",
  "applicationDate": "YYYY-MM-DD or empty string",
  "requesterName": "",
  "department": "",
  "approvalStatus": "",
  "typeDocument": "VISA | PASSPORT | KITAS | LEGALIZATION | OTHER",
  "visaCategory": "",
  "visaCountry": "",
  "purpose": "",
  "visaType": "",
  "processSpeed": "REGULAR | EXPRESS | URGENT",
  "estimatedDaysRaw": "",
  "estimatedMinDays": 0,
  "estimatedMaxDays": 0,
  "nettFarePerApplicant": 0,
  "publishFarePerApplicant": 0,
  "totalApplicants": 1,
  "totalNettFare": 0,
  "totalPublishFare": 0,
  "picDocuments": [],
  "departureDate": "YYYY-MM-DD or empty string",
  "arrivalDate": "YYYY-MM-DD or empty string",
  "durationDays": 0,
  "booker": {
    "title": "",
    "fullName": "",
    "phone": "",
    "email": ""
  },
  "applicants": [
    {
      "title": "",
      "fullName": "",
      "category": "Adult | Child | Infant",
      "passportNumber": "",
      "passportExpiredDate": "YYYY-MM-DD or empty string",
      "dateOfBirth": "YYYY-MM-DD or empty string",
      "note": ""
    }
  ],
  "approvalRecord": {
    "managerName": "",
    "managerStatus": "",
    "checkerNames": [],
    "checkerStatus": ""
  },
  "confidence": "high" | "medium" | "low",
  "warnings": [
    "Clear Indonesian warning strings about anomalies, tight deadlines, missing approvals, etc."
  ],
  "missingFields": [
    "Short Indonesian labels of important operational fields not present in the document"
  ]
}

CRITICAL EXTRACTION RULES:
1. APPLICANT vs BOOKER:
   - Extract the actual visa/passport holder(s) from "Applicant VISA Details" (or applicant table) into "applicants[]".
   - Extract the contact person / booker from "Bookers Full Name", "Bookers Contact Number", "Bookers Email Address" into "booker".
   - NEVER put the Booker's name into "applicants[]" unless no separate applicant exists.
   - If the document lists multiple applicants (Total Applicant VISA > 1), include EVERY single applicant as a separate object in "applicants[]".
2. REQUESTER vs PIC DOCUMENT:
   - "requesterName" MUST come from the "Requester" / "Initiate" field (branch consultant who submitted the request), matched to the active staff list above if closely matching.
   - Put "PIC Document" names (central document checkers) into "picDocuments[]" only.
3. NUMBERS & DATES:
   - Parse all currency values as pure integers in IDR (e.g. "3,100,000 IDR-Rupiah" -> 3100000, "2,900,000" -> 2900000).
   - Format every date strictly as "YYYY-MM-DD".
   - For "Estimated Days" like "15 - 21 Hari Kerja", set "estimatedDaysRaw": "15 - 21 Hari Kerja", "estimatedMinDays": 15, "estimatedMaxDays": 21.
4. APPROVAL RECORD (Page 2 / Bottom Table):
   - Read "Manager Approval" (name + status such as Approved / Pending / Rejected) and "Document Checker VISA" (names + status such as Under Review / Approved).
5. ANOMALY WARNINGS (in Indonesian):
   - Check if the document mentions "Join Tour" or a group tour without an explicit Tour Code.
   - Check if any required field looks inconsistent or incomplete.
6. Return ONLY raw valid JSON without markdown code fences or extra commentary.
`.trim();
}
