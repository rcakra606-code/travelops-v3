import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ProductivityContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const PRODUCTIVITY_CATEGORIES = [
  'Flight',
  'Hotel',
  'Tour',
  'Package',
  'Cruise',
  'Admission',
  'Passport',
  'Visa',
  'Insurance',
  'Train',
  'Other'
];

// eslint-disable-next-line react-refresh/only-export-components
export const PRODUCTIVITY_TYPES = ['Retail', 'Corporate'];

const getCurrentMonthStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const parseMoneyNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const str = String(val).trim();
  if (!str) return 0;
  // Support Indonesian thousand dots (e.g. "150.000.000") and standard decimals
  const dotCount = (str.match(/\./g) || []).length;
  const commaCount = (str.match(/,/g) || []).length;
  let normalized = str.replace(/[^0-9.,-]/g, '');
  if (dotCount > 1 && commaCount === 0) {
    normalized = normalized.replace(/\./g, '');
  } else if (dotCount >= 1 && commaCount === 1 && str.lastIndexOf(',') > str.lastIndexOf('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (dotCount === 1 && commaCount === 0 && /\.\d{3}$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  } else {
    normalized = normalized.replace(/,/g, '');
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const normalizeDateInput = (val, fallback = '') => {
  if (!val) return fallback || getCurrentMonthStr();
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const str = String(val).trim();
  // Match YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }
  // Match YYYY-MM
  const ymMatch = str.match(/^(\d{4})[-/](\d{1,2})$/);
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}`;
  }
  // Match MM/YYYY or MM-YYYY
  const myMatch = str.match(/^(\d{1,2})[-/](\d{4})$/);
  if (myMatch) {
    return `${myMatch[2]}-${myMatch[1].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return fallback || getCurrentMonthStr();
};

const normalizeCategory = (raw) => {
  if (!raw) return 'Other';
  const clean = String(raw).trim();
  const exact = PRODUCTIVITY_CATEGORIES.find(
    (c) => c.toLowerCase() === clean.toLowerCase()
  );
  if (exact) return exact;

  const lower = clean.toLowerCase();
  if (lower.includes('flight') || lower.includes('air') || lower.includes('ticket')) return 'Flight';
  if (lower.includes('hotel') || lower.includes('accom') || lower.includes('resort')) return 'Hotel';
  if (lower.includes('tour') || lower.includes('group')) return 'Tour';
  if (lower.includes('pack') || lower.includes('fit')) return 'Package';
  if (lower.includes('cruise') || lower.includes('ship')) return 'Cruise';
  if (lower.includes('admis') || lower.includes('theme') || lower.includes('attrac')) return 'Admission';
  if (lower.includes('passp')) return 'Passport';
  if (lower.includes('visa')) return 'Visa';
  if (lower.includes('insur')) return 'Insurance';
  if (lower.includes('train') || lower.includes('rail') || lower.includes('jr')) return 'Train';
  return 'Other';
};

const normalizeType = (raw) => {
  if (!raw) return 'Retail';
  const lower = String(raw).trim().toLowerCase();
  if (lower.includes('corp') || lower === 'b2b' || lower.includes('company')) {
    return 'Corporate';
  }
  return 'Retail';
};

const pickImportField = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  const rowKeys = Object.keys(row || {});
  for (const target of keys) {
    const lowerTarget = target.toLowerCase();
    const matchedKey = rowKeys.find((rk) => rk.trim().toLowerCase() === lowerTarget);
    if (
      matchedKey &&
      row[matchedKey] !== undefined &&
      row[matchedKey] !== null &&
      String(row[matchedKey]).trim() !== ''
    ) {
      return row[matchedKey];
    }
  }
  return '';
};

const loadProductivityFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_productivity')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    date: (p.date || '').trim(),
    staff: (p.staff || '').trim(),
    category: normalizeCategory(p.category),
    type: normalizeType(p.type),
    salesAmount: Number(p.sales_amount) || 0,
    profitAmount: Number(p.profit_amount) || 0,
    remarks: p.remarks || ''
  }));
};

export const ProductivityProvider = ({ children }) => {
  const [productivityData, setProductivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductivity = useCallback(async () => {
    try {
      const mapped = await loadProductivityFromDb();
      setProductivityData(mapped);
      return mapped;
    } catch (err) {
      console.error('Fetch productivity error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProductivityFromDb()
      .then((mapped) => {
        if (!cancelled) setProductivityData(mapped);
      })
      .catch((err) => {
        console.error('Initial productivity load error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addRecord = async (data) => {
    const cleanStaff = (data.staff || '').trim();
    const cleanDate = normalizeDateInput(data.date);
    if (!cleanStaff) {
      throw new Error('Consultant name is required.');
    }
    if (!cleanDate) {
      throw new Error('Period / Date is required.');
    }

    const newId = `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const payload = {
      id: newId,
      date: cleanDate,
      staff: cleanStaff,
      category: normalizeCategory(data.category),
      type: normalizeType(data.type),
      sales_amount: parseMoneyNumber(data.salesAmount),
      profit_amount: parseMoneyNumber(data.profitAmount),
      remarks: (data.remarks || '').trim()
    };

    const { error } = await supabase.from('travelops_productivity').insert([payload]);
    if (error) throw error;
    await fetchProductivity();
    return payload;
  };

  const updateRecord = async (id, updatedData) => {
    if (!id) throw new Error('Record ID is required for update.');
    const dbUpdates = {};
    if (updatedData.date !== undefined) dbUpdates.date = normalizeDateInput(updatedData.date);
    if (updatedData.staff !== undefined) dbUpdates.staff = String(updatedData.staff).trim();
    if (updatedData.category !== undefined) dbUpdates.category = normalizeCategory(updatedData.category);
    if (updatedData.type !== undefined) dbUpdates.type = normalizeType(updatedData.type);
    if (updatedData.salesAmount !== undefined) {
      dbUpdates.sales_amount = parseMoneyNumber(updatedData.salesAmount);
    }
    if (updatedData.profitAmount !== undefined) {
      dbUpdates.profit_amount = parseMoneyNumber(updatedData.profitAmount);
    }
    if (updatedData.remarks !== undefined) {
      dbUpdates.remarks = String(updatedData.remarks || '').trim();
    }

    const { error } = await supabase
      .from('travelops_productivity')
      .update(dbUpdates)
      .eq('id', id);
    if (error) throw error;
    await fetchProductivity();
  };

  const deleteRecord = async (id) => {
    if (!id) throw new Error('Record ID is required for delete.');
    const { error } = await supabase.from('travelops_productivity').delete().eq('id', id);
    if (error) throw error;
    await fetchProductivity();
  };

  const bulkDeleteRecords = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const { error } = await supabase
      .from('travelops_productivity')
      .delete()
      .in('id', ids);
    if (error) throw error;
    await fetchProductivity();
    return ids.length;
  };

  const bulkImport = async (dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('No rows found to import.');
    }

    const nowTs = Date.now();
    const toUpsert = [];
    let skippedCount = 0;

    dataArray.forEach((row, index) => {
      const rawId = pickImportField(row, ['id', 'ID', 'Record ID']);
      const rawDate = pickImportField(row, [
        'date',
        'Period',
        'Period (YYYY-MM)',
        'Month',
        'Date'
      ]);
      const rawStaff = pickImportField(row, [
        'staff',
        'Staff',
        'Consultant',
        'Staff Name',
        'PIC'
      ]);
      const rawCategory = pickImportField(row, [
        'category',
        'Category',
        'Product Category',
        'Product'
      ]);
      const rawType = pickImportField(row, [
        'type',
        'Type',
        'Sales Type',
        'Segment',
        'Channel'
      ]);
      const rawSales = pickImportField(row, [
        'salesAmount',
        'sales_amount',
        'Sales Amount (IDR)',
        'Sales Amount',
        'Sales (IDR)',
        'Sales',
        'Total Sales'
      ]);
      const rawProfit = pickImportField(row, [
        'profitAmount',
        'profit_amount',
        'Profit Amount (IDR)',
        'Profit Amount',
        'Profit (IDR)',
        'Profit',
        'Net Profit'
      ]);
      const rawRemarks = pickImportField(row, [
        'remarks',
        'Remarks',
        'Notes',
        'Description'
      ]);

      const cleanStaff = String(rawStaff || '').trim();
      const salesNum = parseMoneyNumber(rawSales);
      const profitNum = parseMoneyNumber(rawProfit);

      if (!cleanStaff && !rawDate && salesNum === 0 && profitNum === 0) {
        skippedCount += 1;
        return;
      }

      toUpsert.push({
        id: rawId ? String(rawId).trim() : `PRD-${nowTs}-${index}`,
        date: normalizeDateInput(rawDate),
        staff: cleanStaff || 'Unassigned',
        category: normalizeCategory(rawCategory),
        type: normalizeType(rawType),
        sales_amount: salesNum,
        profit_amount: profitNum,
        remarks: String(rawRemarks || '').trim()
      });
    });

    if (toUpsert.length === 0) {
      throw new Error('No valid productivity records found in the uploaded file.');
    }

    const { error } = await supabase
      .from('travelops_productivity')
      .upsert(toUpsert, { onConflict: 'id' });
    if (error) throw error;

    await fetchProductivity();
    return { importedCount: toUpsert.length, skippedCount };
  };

  return (
    <ProductivityContext.Provider
      value={{
        productivityData,
        loading,
        refreshProductivity: fetchProductivity,
        addRecord,
        updateRecord,
        deleteRecord,
        bulkDeleteRecords,
        bulkImport
      }}
    >
      {children}
    </ProductivityContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProductivity = () => useContext(ProductivityContext);
