/**
 * Shared validation & prompt builder for AI Corporate Accounts Excel/CSV Auto-Input.
 * Supports:
 *   1. `tabular_mapping`: Horizontal spreadsheets including 1–3 row hierarchical headers
 *      (e.g. Flight -> Reissued -> Domestic/International, blank Col 0 for CustCode)
 *      AND multi-row continuation blocks per CustCode.
 *   2. `form_extraction`: Vertical key-value corporate registration sheets.
 *
 * Used by both production server.js and local dev middleware in vite.config.js.
 */

export const SUPPORTED_CORPORATE_TARGET_FIELDS = [
  'accountCode',
  'companyName',
  'address',
  'creditLimit',
  'status',
  'picName',
  'picContactCombined',
  'picPhone',
  'picOfficeEmail',
  'picPersonalEmail',
  'picEmailsCombined',
  'airlinesCode',
  'airlinesTier',
  'detailLink',
  'remarks',
  'remarksExtra',
  'flightFee.domestic',
  'flightFee.international',
  'flightFee.reissued',
  'flightFee.reissuedIntl',
  'flightFee.refund',
  'flightFee.refundIntl',
  'flightFee.void',
  'flightFee.revalidate',
  'flightFeeSummary',
  'hotelFee.domestic',
  'hotelFee.international',
  'hotelFee.reissued',
  'hotelFee.reissuedIntl',
  'hotelFee.refund',
  'hotelFee.refundIntl',
  'hotelFee.void',
  'hotelFee.revalidate',
  'hotelFeeSummary'
];

export function validateCorporateExcelPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload Excel tidak ditemukan.' };
  }

  const { previewRows, sheetName, totalRows } = payload;
  if (!Array.isArray(previewRows) || previewRows.length === 0) {
    return { valid: false, error: 'File Excel kosong atau tidak memiliki baris data yang dapat dibaca.' };
  }

  if (previewRows.length > 60) {
    return { valid: false, error: 'Preview rows melebihi batas aman (maksimal 60 baris preview).' };
  }

  const serialized = JSON.stringify(previewRows);
  if (serialized.length > 140_000) {
    return { valid: false, error: 'Ukuran preview data terlalu besar untuk diproses AI.' };
  }

  return {
    valid: true,
    sheetName: String(sheetName || 'Sheet1').trim(),
    totalRows: Number(totalRows) || previewRows.length,
    previewRows
  };
}

export function buildCorporateExcelPrompt({
  sheetName = 'Sheet1',
  fileName = 'Corporate_Accounts.xlsx',
  totalRows = 0,
  previewRows = []
}) {
  const indexedRows = previewRows.slice(0, 35).map((row, rIdx) => {
    const cells = {};
    if (Array.isArray(row)) {
      row.forEach((val, cIdx) => {
        const str = val === null || val === undefined ? '' : String(val).replace(/\s+/g, ' ').trim();
        if (str !== '' && str.toLowerCase() !== 'nan') {
          cells[String(cIdx)] = str.slice(0, 220);
        }
      });
    }
    return { rowIndex: rIdx, cells };
  });

  return `You are an expert Indonesian Travel Agency Operations & Data Migration AI Engineer for TravelOps V4 (Dwidayatour / Enterprise TMC).
You are analyzing a preview of an uploaded Excel/CSV spreadsheet containing Corporate Client Accounts (B2B Accounts).

FILE METADATA:
- File Name: "${fileName}"
- Active Sheet: "${sheetName}"
- Total Non-Empty Rows in Sheet: ${totalRows}

PREVIEW GRID (0-based rowIndex, and 0-based columnIndex keys inside "cells"):
${JSON.stringify(indexedRows, null, 2)}

TARGET TRAVELOPS CORPORATE ACCOUNT FIELDS:
- "accountCode": Corporate Customer Code / CustCode (NOTE: Column 0 often has an EMPTY header cell but holds codes like "CBINDA", "CMIGRA", "CHEXIN", "CTOMAN", "CORP-001" — always map it to "accountCode"!)
- "companyName": Corporate / Company Name ("Nama Corporate", "Nama Perusahaan", "Company Name", "Client")
- "address": Office / Contact Address ("Contact Address", "Alamat", "Office Address")
- "creditLimit": Credit Limit / Plafon in IDR ("Credit Limit", "Limit Kredit", "Plafon")
- "status": Account Status ("Active" / "Inactive")
- "picContactCombined": Use when a column like "PIC Bookers" contains BOTH PIC name AND phone number together (e.g. "IBU MEI MEI (089651346555)", "Diah : 08129082859")
- "picName": Use ONLY if PIC name has its own separate column without phone numbers
- "picPhone": Use ONLY if phone/WA has its own separate column
- "picOfficeEmail": Primary/Office email ("Contact Email Address", "Office Email", "Email Kantor")
- "picPersonalEmail": Alternative/Personal email ("Contact Email Address Alternatif", "Personal Email")
- "picEmailsCombined": Use if one column mixes office and personal emails together
- "airlinesCode": Airlines Corporate Account / Airline code ("Airlines Corporate Account", "Airlines Code", e.g. "GA", "SQ", "TK", "QG")
- "airlinesTier": Tier / Entry Pricing / Tour Code column paired with airlinesCode (e.g. "Tier / Entry Pricing", "FXP/R,U*HEXI", "FQCTK-PAN001", "UFN")
- "detailLink": URL / Google Drive / SOP / Contract link
- "remarks": General notes / Remarks
- "remarksExtra": Any other useful column (e.g. "KAI Domestic", "NPWP", "Payment Term / TOP", "Account Manager") — include a readable label in "columnLabels"
- Flight Service Fees (handles 2-row or 3-row hierarchical headers!):
  - "flightFee.domestic": Flight -> Domestic
  - "flightFee.international": Flight -> International
  - "flightFee.reissued": Flight -> Reissued (or Reissued -> Domestic)
  - "flightFee.reissuedIntl": Flight -> Reissued -> International (when Reissued splits into Domestic & International)
  - "flightFee.refund": Flight -> Refund (or Refund -> Domestic)
  - "flightFee.refundIntl": Flight -> Refund -> International (when Refund splits into Domestic & International)
  - "flightFee.void": Flight -> Void
  - "flightFee.revalidate": Flight -> Revalidate
  - "flightFeeSummary": Single combined flight fee column
- Hotel Service Fees:
  - "hotelFee.domestic": Hotel -> Domestic
  - "hotelFee.international": Hotel -> International
  - "hotelFee.reissued": Hotel -> Reschedule / Reissued (or Reschedule -> Domestic)
  - "hotelFee.reissuedIntl": Hotel -> Reschedule -> International
  - "hotelFee.refund": Hotel -> Refund (or Refund -> Domestic)
  - "hotelFee.refundIntl": Hotel -> Refund -> International
  - "hotelFee.void": Hotel -> Void
  - "hotelFee.revalidate": Hotel -> Revalidate
  - "hotelFeeSummary": Single combined hotel fee column

CRITICAL INSTRUCTIONS:
1. Determine "layoutType":
   - Use "tabular_mapping" for horizontal tables (including 2-row or 3-row merged headers like Row 0: "Flight | Hotel | KAI", Row 1: "Domestic | International | Reissued | Refund | Void | Revalidate", Row 2: "Domestic | International | Domestic | International", and continuation rows where Col 0 & Col 1 are empty for extra PICs/airlines/fees of the same CustCode!).
   - Use "form_extraction" ONLY for vertical key-value forms (labels in Col 0, values in Col 1).
2. For "tabular_mapping":
   - List ALL header rows in "headerRowIndices" (e.g. [0, 1, 2] for 3-row headers).
   - Set "dataStartRowIndex" to the FIRST actual corporate data row (e.g. 3).
   - Map EVERY meaningful column index ("0", "1", "2", ...) accurately. Do NOT miss column "0" if it holds CustCodes even when its header is blank!
   - Do NOT map pure serial number columns ("No", "#").
   - Provide human-readable "columnLabels" for all mapped columns (especially "remarksExtra" like "KAI Domestic").
3. Write "detectionSummary" in concise, natural Bahasa Indonesia (1–2 sentences).
4. Respond ONLY with valid JSON matching:
{
  "layoutType": "tabular_mapping | form_extraction",
  "headerRowIndices": [0, 1, 2],
  "dataStartRowIndex": 3,
  "columnMapping": {
    "0": "accountCode",
    "1": "companyName"
  },
  "columnLabels": {
    "0": "CustCode",
    "1": "Nama Corporate"
  },
  "extractedAccounts": [],
  "detectionSummary": "Terdeteksi tabel ...",
  "warnings": []
}`;
}
