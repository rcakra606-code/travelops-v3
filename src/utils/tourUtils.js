export const normalizeFinancials = (fin = {}) => {
  const basicTourPrice = Number(fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0));
  const discountSupplier = Number(fin.discountSupplier !== undefined ? fin.discountSupplier : (fin.discount || 0));
  const discountBranch = Number(fin.discountBranch || 0);
  const profit = Number(fin.profit || 0);
  const totalSellingPrice = Number(fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (fin.totalOmset !== undefined ? fin.totalOmset : (basicTourPrice - discountSupplier - discountBranch)));
  const totalNettPrice = Number(fin.totalNettPrice !== undefined ? fin.totalNettPrice : (fin.cost !== undefined ? fin.cost : (basicTourPrice - discountSupplier - profit)));
  const depositNumber = fin.depositNumber ? String(fin.depositNumber).trim() : '';
  const depositAmount = Number(fin.depositAmount || 0);
  const invoiceNumber = fin.invoiceNumber ? String(fin.invoiceNumber).trim() : '';
  const sisaPelunasan = totalSellingPrice - depositAmount;

  return {
    ...fin,
    basicTourPrice,
    totalSales: basicTourPrice,
    discountSupplier,
    discountBranch,
    discount: discountSupplier + discountBranch,
    profit,
    totalSellingPrice,
    totalOmset: totalSellingPrice,
    totalNettPrice,
    cost: totalNettPrice,
    depositNumber,
    depositAmount,
    sisaPelunasan,
    invoiceNumber,
    discountLink: fin.discountLink || ''
  };
};

export const parseLocalDateToEndOfDay = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4,})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day, 23, 59, 59, 999);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(trimmed);
  if (isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 23, 59, 59, 999);
};

export const isTourPast = (departureDateStr, returnDateStr) => {
  const now = new Date();
  const depEnd = parseLocalDateToEndOfDay(departureDateStr);
  const retEnd = parseLocalDateToEndOfDay(returnDateStr);

  // If no valid dates are present, do not mark as past
  if (!depEnd && !retEnd) return false;

  // If departure date is today or in the future, tour cannot be completed
  if (depEnd && now <= depEnd) return false;

  // If return date is today or in the future, tour cannot be completed
  if (retEnd && now <= retEnd) return false;

  // Determine latest end date
  const latestEnd = (depEnd && retEnd)
    ? (retEnd > depEnd ? retEnd : depEnd)
    : (retEnd || depEnd);

  return now > latestEnd;
};

