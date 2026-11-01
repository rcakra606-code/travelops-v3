export const createEmptyPax = (seedOffset = 0) => ({
  id: `pax-${Date.now()}-${seedOffset}-${Math.random().toString(36).slice(2, 6)}`,
  title: 'Mr',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  basicPrice: '',
  sellingPrice: '',
  profit: '',
  discountSupplier: '',
  discountBranch: '',
  discount: '',
  notes: ''
});

export const resizePaxList = (existingList = [], targetCount = 1) => {
  const safeCount = Math.max(1, parseInt(targetCount, 10) || 1);
  const current = Array.isArray(existingList) ? existingList : [];
  if (current.length === safeCount) return current;
  if (current.length > safeCount) return current.slice(0, safeCount);
  const added = Array.from({ length: safeCount - current.length }, (_, idx) =>
    createEmptyPax(current.length + idx)
  );
  return [...current, ...added];
};

export const hasPerPaxPricing = (paxList = []) => {
  if (!Array.isArray(paxList) || paxList.length === 0) return false;
  return paxList.some((pax) => {
    const bp = Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
    const ds = Number(pax.discountSupplier) || 0;
    const db = Number(pax.discountBranch) || 0;
    const legacyDisc = pax.discount && !pax.discountSupplier && !pax.discountBranch ? Number(pax.discount) || 0 : 0;
    const pf = Number(pax.profit) || 0;
    return bp > 0 || ds > 0 || db > 0 || legacyDisc > 0 || pf > 0;
  });
};

export const computeFinancialsFromPax = (paxList = [], currentFinancials = {}) => {
  let totalBasicPrice = 0;
  let totalDiscountSupplier = 0;
  let totalDiscountBranch = 0;
  let totalProfit = 0;

  if (Array.isArray(paxList)) {
    paxList.forEach((pax) => {
      const bp = Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
      const ds = Number(pax.discountSupplier) || 0;
      const db = Number(pax.discountBranch) || 0;
      const legacyDisc = pax.discount && !pax.discountSupplier && !pax.discountBranch ? Number(pax.discount) || 0 : 0;
      const pf = Number(pax.profit) || 0;

      totalBasicPrice += bp;
      totalDiscountSupplier += ds + legacyDisc;
      totalDiscountBranch += db;
      totalProfit += pf;
    });
  }

  const totalSellingPrice = totalBasicPrice - totalDiscountSupplier - totalDiscountBranch;
  const totalNettPrice = totalBasicPrice - totalDiscountSupplier - totalProfit;
  const depositAmount = Number(currentFinancials.depositAmount || 0);
  const sisaPelunasan = totalSellingPrice - depositAmount;

  return {
    ...currentFinancials,
    basicTourPrice: totalBasicPrice,
    totalSales: totalBasicPrice,
    discountSupplier: totalDiscountSupplier,
    discountBranch: totalDiscountBranch,
    discount: totalDiscountSupplier + totalDiscountBranch,
    profit: totalProfit,
    totalSellingPrice,
    totalOmset: totalSellingPrice,
    totalNettPrice,
    cost: totalNettPrice,
    depositAmount,
    sisaPelunasan
  };
};

export const getTripDurationInfo = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) return null;
  const depClean = String(departureDate).trim().slice(0, 10);
  const retClean = String(returnDate).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(depClean) || !/^\d{4}-\d{2}-\d{2}$/.test(retClean)) return null;

  const dep = new Date(`${depClean}T00:00:00`);
  const ret = new Date(`${retClean}T00:00:00`);
  if (Number.isNaN(dep.getTime()) || Number.isNaN(ret.getTime())) return null;

  const diffDays = Math.round((ret - dep) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      valid: false,
      days: 0,
      nights: 0,
      label: 'Return date is before departure'
    };
  }

  const nights = diffDays;
  const days = diffDays + 1;
  return {
    valid: true,
    days,
    nights,
    label: nights === 0 ? '1 Day Trip' : `${days}D / ${nights}N`
  };
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  const clean = String(dateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return String(dateStr);
  const d = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getLeadPaxLabel = (paxInfo = []) => {
  if (!Array.isArray(paxInfo) || paxInfo.length === 0) return '';
  for (const p of paxInfo) {
    const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    if (full) {
      return `${p.title ? p.title + '. ' : ''}${full}`;
    }
  }
  return '';
};

export const buildPaxSearchBlob = (paxInfo = []) => {
  if (!Array.isArray(paxInfo) || paxInfo.length === 0) return '';
  return paxInfo
    .map((p) => [p.title, p.firstName, p.lastName, p.email, p.phone, p.notes].filter(Boolean).join(' '))
    .join(' | ');
};

export const parseSpreadsheetAmount = (raw) => {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
};

