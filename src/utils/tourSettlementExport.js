import ExcelJS from 'exceljs';
import { formatCurrency } from './currency';

/**
 * Extracts and prepares display data from tour object
 */
export const prepareSettlementData = (tour) => {
  const fin = tour.financials || {};
  const paxList = Array.isArray(tour.paxInfo) ? tour.paxInfo : [];
  const paxCount = Number(tour.paxCount) || (paxList.length > 0 ? paxList.length : 1);

  // Pax Names
  const paxNames = paxList
    .map(p => `${p.title ? p.title + ' ' : ''}${p.firstName || ''} ${p.lastName || ''}`.trim())
    .filter(Boolean)
    .join(', ') || 'GUEST / PASSENGER';

  // Group / Tour Details
  const groupName = `${tour.tourCode || ''}${tour.bookingCode ? ' - ' + tour.bookingCode : ''}${tour.country ? ' - ' + tour.country : ''}`.trim() || 'TOUR PACKAGE';
  const depDate = tour.departureDate ? `${tour.departureDate} ${tour.returnDate ? '- ' + tour.returnDate : ''}` : '-';

  // Financial calculations
  const basicPrice = Number(fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0));
  const discSupplier = Number(fin.discountSupplier !== undefined ? fin.discountSupplier : (fin.discount || 0));
  const discBranch = Number(fin.discountBranch || 0);
  const totalDisc = discSupplier + discBranch;
  const profit = Number(fin.profit || 0);
  const totalSellingPrice = Number(fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (basicPrice - totalDisc));
  const totalNettPrice = Number(fin.totalNettPrice !== undefined ? fin.totalNettPrice : (basicPrice - discSupplier - profit));
  const depositAmount = Number(fin.depositAmount || 0);
  const depositNumber = fin.depositNumber ? String(fin.depositNumber).trim() : (tour.depositNumber || '-');
  const invoiceNumber = fin.invoiceNumber ? String(fin.invoiceNumber).trim() : (tour.invoiceNumber || '-');

  // Balances
  const sisaPassenger = Math.max(0, totalSellingPrice - depositAmount);
  const sisaAgentCost = Math.max(0, totalNettPrice - depositAmount);

  // Per pax estimations
  const basicPerPax = paxCount > 0 ? Math.round(basicPrice / paxCount) : basicPrice;
  const discPerPax = paxCount > 0 ? Math.round(totalDisc / paxCount) : totalDisc;
  const dpPerPax = paxCount > 0 ? Math.round(depositAmount / paxCount) : depositAmount;
  const nettPerPax = paxCount > 0 ? Math.round(totalNettPrice / paxCount) : totalNettPrice;

  const staffName = tour.staffName || tour.internals?.staffName || 'OPERATIONAL STAFF';

  return {
    paxNames,
    groupName,
    depDate,
    paxCount,
    basicPrice,
    discSupplier,
    discBranch,
    totalDisc,
    profit,
    totalSellingPrice,
    totalNettPrice,
    depositAmount,
    depositNumber,
    invoiceNumber,
    sisaPassenger,
    sisaAgentCost,
    basicPerPax,
    discPerPax,
    dpPerPax,
    nettPerPax,
    staffName
  };
};

/**
 * Common style helper for Excel cells
 */
const applyBoxBorder = (worksheet, startRow, startCol, endRow, endCol) => {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getCell(r, c);
      const border = cell.border || {};
      if (r === startRow) border.top = { style: 'thin' };
      if (r === endRow) border.bottom = { style: 'thin' };
      if (c === startCol) border.left = { style: 'thin' };
      if (c === endCol) border.right = { style: 'thin' };
      cell.border = border;
    }
  }
};

/**
 * 1. Generate PASSENGER CONFIRMATION Excel
 * Focus: Selling Price, Discount, Total Selling Price, Deposit, Sisa Pelunasan Tamu
 */
export const exportPassengerConfirmationExcel = async (tour) => {
  const data = prepareSettlementData(tour);
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Pelunasan Passenger');

  ws.views = [{ showGridLines: true }];

  // Column widths
  ws.columns = [
    { width: 22 }, // A
    { width: 3 },  // B (colon)
    { width: 20 }, // C
    { width: 5 },  // D (x / + / -)
    { width: 18 }, // E (IDR label & per-unit)
    { width: 10 }, // F (= IDR)
    { width: 22 }, // G (Total amount)
  ];

  let r = 1;

  // Title Box
  ws.mergeCells(`A${r}:G${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = 'BUKTI PELUNASAN TOUR';
  titleCell.font = { name: 'Calibri', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  applyBoxBorder(ws, r, 1, r, 7);
  ws.getRow(r).height = 28;
  r += 2;

  // Header Details
  const infoStartRow = r;
  
  // Pax Name
  ws.getCell(`A${r}`).value = 'Pax Name';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.paxNames;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  // Group Name
  ws.getCell(`A${r}`).value = 'Group Name';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.groupName;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  // Departure Date
  ws.getCell(`A${r}`).value = 'Departure Date';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.depDate;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  // Total Passenger
  ws.getCell(`A${r}`).value = 'Total Passenger';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Adult`;
  ws.getCell(`D${r}`).value = '+';
  ws.getCell(`E${r}`).value = 'Child';
  r++;

  // Total Room
  ws.getCell(`A${r}`).value = 'Total Room';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${Math.ceil(data.paxCount / 2)} Room`;
  ws.getCell(`D${r}`).value = '+';
  ws.getCell(`E${r}`).value = 'SINGLE / TWN';
  r++;

  applyBoxBorder(ws, infoStartRow - 1, 1, r, 7);
  r++;

  // Section Header: PERHITUNGAN BIAYA
  ws.mergeCells(`A${r}:G${r}`);
  const calcHeader = ws.getCell(`A${r}`);
  calcHeader.value = 'P E R H I T U N G A N   B I A Y A';
  calcHeader.font = { name: 'Calibri', size: 11, bold: true };
  calcHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  calcHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  applyBoxBorder(ws, r, 1, r, 7);
  ws.getRow(r).height = 22;
  r += 2;

  // BIAYA TOUR
  ws.getCell(`A${r}`).value = 'BIAYA TOUR';
  ws.getCell(`A${r}`).font = { name: 'Calibri', size: 10, bold: true, underline: true };
  r++;

  // ADULT Basic Price
  ws.getCell(`A${r}`).value = 'ADULT';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Adult x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = data.basicPerPax;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.basicPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true };
  r++;

  // Discount
  ws.getCell(`A${r}`).value = 'Discount';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Paxs x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = data.discPerPax;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.totalDisc;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { color: { argb: 'FFDC2626' } };
  r++;

  // Apt Tax Int'l
  ws.getCell(`A${r}`).value = "Apt tax Int'l";
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Paxs x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = 0;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = 0;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  r++;

  // Total Biaya Tour
  ws.getCell(`A${r}`).value = 'Total Biaya Tour';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`F${r}`).value = 'IDR';
  ws.getCell(`F${r}`).font = { bold: true };
  ws.getCell(`G${r}`).value = data.totalSellingPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true };
  ws.getCell(`G${r}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  r += 2;

  // BIAYA TAMBAHAN
  ws.getCell(`A${r}`).value = 'BIAYA TAMBAHAN';
  ws.getCell(`A${r}`).font = { name: 'Calibri', size: 10, bold: true, underline: true };
  r++;

  // VISA GROUP
  ws.getCell(`A${r}`).value = 'VISA GROUP';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Paxs x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = 0;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = 0;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  r++;

  // Total Biaya Tambahan
  ws.getCell(`A${r}`).value = 'Total Biaya Tambahan';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`F${r}`).value = 'IDR';
  ws.getCell(`F${r}`).font = { bold: true };
  ws.getCell(`G${r}`).value = 0;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true };
  ws.getCell(`G${r}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  r += 2;

  // TOTAL BIAYA TOUR + TAMBAHAN
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = 'TOTAL BIAYA TOUR + BIAYA TAMBAHAN';
  ws.getCell(`A${r}`).font = { bold: true };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`F${r}`).font = { bold: true };
  ws.getCell(`G${r}`).value = data.totalSellingPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true };
  r++;

  // DEPOSIT
  ws.getCell(`A${r}`).value = `DEPOSIT (${data.depositNumber})`;
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Paxs x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = data.dpPerPax;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.depositAmount;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true, color: { argb: 'FF059669' } };
  r++;

  // PELUNASAN
  ws.getCell(`A${r}`).value = 'PELUNASAN';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Paxs x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = data.paxCount > 0 ? Math.round(data.sisaPassenger / data.paxCount) : data.sisaPassenger;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.sisaPassenger;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  r++;

  // SISA YANG HARUS DIBAYAR
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = 'SISA YANG HARUS DIBAYAR';
  ws.getCell(`A${r}`).font = { size: 11, bold: true };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`F${r}`).font = { size: 11, bold: true };
  ws.getCell(`G${r}`).value = data.sisaPassenger;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { size: 12, bold: true, color: { argb: data.sisaPassenger <= 0 ? 'FF059669' : 'FF0284C7' } };
  ws.getCell(`G${r}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  r += 2;

  // REMARKS & RECEIVED BY
  const footerRow = r;
  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = 'REMARKS';
  ws.getCell(`A${r}`).font = { bold: true, underline: true };

  ws.mergeCells(`E${r}:G${r}`);
  ws.getCell(`E${r}`).value = 'RECEIVED BY';
  ws.getCell(`E${r}`).font = { bold: true, underline: true };
  ws.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = 'Account Name : PT. DWIDAYA WORLDWIDE';
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = 'BCA : 002 307 3100';
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = `Status Booking : ${tour.status || 'Active'}`;
  
  // Received by Staff Name
  ws.mergeCells(`E${r}:G${r}`);
  ws.getCell(`E${r}`).value = data.staffName.toUpperCase();
  ws.getCell(`E${r}`).font = { bold: true, underline: true };
  ws.getCell(`E${r}`).alignment = { horizontal: 'center' };

  applyBoxBorder(ws, footerRow, 1, r, 4);
  applyBoxBorder(ws, footerRow, 5, r, 7);

  // Trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanCode = (tour.bookingCode || tour.tourCode || tour.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `Pelunasan_Tour_Passenger_${cleanCode}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * 2. Generate AGENT CONFIRMATION Excel
 * Focus: Cost / Nett Price, Nominal Profit, Tagihan Invoice Agen, Deposit, Sisa Cost/Invoice
 */
export const exportAgentConfirmationExcel = async (tour) => {
  const data = prepareSettlementData(tour);
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Agent Confirmation');

  ws.views = [{ showGridLines: true }];

  ws.columns = [
    { width: 22 }, // A
    { width: 3 },  // B
    { width: 20 }, // C
    { width: 5 },  // D
    { width: 18 }, // E
    { width: 10 }, // F
    { width: 22 }, // G
  ];

  let r = 1;

  // Title Box
  ws.mergeCells(`A${r}:G${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = 'BUKTI PELUNASAN TOUR (AGENT CONFIRMATION & INVOICE BASE)';
  titleCell.font = { name: 'Calibri', size: 13, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  applyBoxBorder(ws, r, 1, r, 7);
  ws.getRow(r).height = 28;
  r += 2;

  // Header Details
  const infoStartRow = r;
  
  ws.getCell(`A${r}`).value = 'Pax Name';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.paxNames;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  ws.getCell(`A${r}`).value = 'Group Name';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.groupName;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  ws.getCell(`A${r}`).value = 'Departure Date';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:G${r}`);
  ws.getCell(`C${r}`).value = data.depDate;
  ws.getCell(`C${r}`).font = { name: 'Calibri', size: 10, bold: true };
  r++;

  ws.getCell(`A${r}`).value = 'Total Passenger';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Adult`;
  ws.getCell(`D${r}`).value = '+';
  ws.getCell(`E${r}`).value = 'Child';
  r++;

  ws.getCell(`A${r}`).value = 'Invoice Number';
  ws.getCell(`B${r}`).value = ':';
  ws.mergeCells(`C${r}:E${r}`);
  ws.getCell(`C${r}`).value = data.invoiceNumber !== '-' ? data.invoiceNumber : 'BELUM TERBIT (DRAFT)';
  ws.getCell(`C${r}`).font = { bold: true, color: { argb: data.invoiceNumber !== '-' ? 'FF0284C7' : 'FFEF4444' } };
  r++;

  applyBoxBorder(ws, infoStartRow - 1, 1, r, 7);
  r++;

  // Section Header: PERHITUNGAN BIAYA & COST AGEN
  ws.mergeCells(`A${r}:G${r}`);
  const calcHeader = ws.getCell(`A${r}`);
  calcHeader.value = 'R I N C I A N   B I A Y A   N E T T   ( C O S T   A G E N )';
  calcHeader.font = { name: 'Calibri', size: 11, bold: true };
  calcHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  calcHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
  applyBoxBorder(ws, r, 1, r, 7);
  ws.getRow(r).height = 22;
  r += 2;

  // BIAYA TOUR
  ws.getCell(`A${r}`).value = 'KOMPONEN BIAYA TOUR';
  ws.getCell(`A${r}`).font = { name: 'Calibri', size: 10, bold: true, underline: true };
  r++;

  // Harga Dasar Tour
  ws.getCell(`A${r}`).value = 'Harga Dasar Tour';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = `${data.paxCount} Adult x IDR`;
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${r}`).value = data.basicPerPax;
  ws.getCell(`D${r}`).numFmt = '#,##0.00';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.basicPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  r++;

  // Discount Supplier
  ws.getCell(`A${r}`).value = 'Discount Supplier';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = 'Potongan Supplier';
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.discSupplier;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { color: { argb: 'FFDC2626' } };
  r++;

  // Profit Kantor / Agen
  ws.getCell(`A${r}`).value = 'Nominal Profit (Margin)';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = 'Profit Ditetapkan';
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.profit;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { color: { argb: 'FF059669' }, bold: true };
  r++;

  // Total Nett Price (Cost)
  ws.getCell(`A${r}`).value = 'TOTAL NETT PRICE (COST)';
  ws.getCell(`A${r}`).font = { bold: true };
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`F${r}`).value = 'IDR';
  ws.getCell(`F${r}`).font = { bold: true };
  ws.getCell(`G${r}`).value = data.totalNettPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true, color: { argb: 'FF059669' } };
  ws.getCell(`G${r}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  r += 2;

  // BIAYA TAMBAHAN
  ws.getCell(`A${r}`).value = 'BIAYA TAMBAHAN OPERASIONAL';
  ws.getCell(`A${r}`).font = { name: 'Calibri', size: 10, bold: true, underline: true };
  r++;

  ws.getCell(`A${r}`).value = 'Apt Tax & Visa Group';
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = 0;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  r += 2;

  // TOTAL COST INVOICE
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = 'TOTAL COST INVOICE (NETT DASAR PENAGIHAN)';
  ws.getCell(`A${r}`).font = { bold: true };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`F${r}`).font = { bold: true };
  ws.getCell(`G${r}`).value = data.totalNettPrice;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true };
  r++;

  // DEPOSIT
  ws.getCell(`A${r}`).value = `DEPOSIT DITERIMA (${data.depositNumber})`;
  ws.getCell(`B${r}`).value = ':';
  ws.getCell(`C${r}`).value = 'Potongan Uang Muka DP';
  ws.getCell(`C${r}`).alignment = { horizontal: 'right' };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`G${r}`).value = data.depositAmount;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { bold: true, color: { argb: 'FF059669' } };
  r++;

  // SISA TAGIHAN COST / INVOICE
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = 'SISA COST INVOICE YANG HARUS DILUNASI';
  ws.getCell(`A${r}`).font = { size: 11, bold: true };
  ws.getCell(`F${r}`).value = '= IDR';
  ws.getCell(`F${r}`).font = { size: 11, bold: true };
  ws.getCell(`G${r}`).value = data.sisaAgentCost;
  ws.getCell(`G${r}`).numFmt = '#,##0.00';
  ws.getCell(`G${r}`).font = { size: 12, bold: true, color: { argb: 'FF059669' } };
  ws.getCell(`G${r}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  r += 2;

  // REMARKS & RECEIVED BY
  const footerRow = r;
  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = 'REMARKS & INVOICE BASE';
  ws.getCell(`A${r}`).font = { bold: true, underline: true };

  ws.mergeCells(`E${r}:G${r}`);
  ws.getCell(`E${r}`).value = 'PREPARED / RECEIVED BY';
  ws.getCell(`E${r}`).font = { bold: true, underline: true };
  ws.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = `No. Invoice : ${data.invoiceNumber}`;
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = `Account Name : PT. DWIDAYA WORLDWIDE (BCA : 002 307 3100)`;
  r++;

  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = `Catatan : Dasar kalkulasi pembuatan invoice agen & cost operasional`;
  
  ws.mergeCells(`E${r}:G${r}`);
  ws.getCell(`E${r}`).value = data.staffName.toUpperCase();
  ws.getCell(`E${r}`).font = { bold: true, underline: true };
  ws.getCell(`E${r}`).alignment = { horizontal: 'center' };

  applyBoxBorder(ws, footerRow, 1, r, 4);
  applyBoxBorder(ws, footerRow, 5, r, 7);

  // Trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanCode = (tour.bookingCode || tour.tourCode || tour.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `Pelunasan_Tour_AgentConfirmation_${cleanCode}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
