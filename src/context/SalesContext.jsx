import { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { QUERY_KEYS } from '../lib/queryClient';
import { useAuth } from './AuthContext';

const SalesContext = createContext(null);
const LAST_UPDATE_SETTING_KEY = 'sales_targets_last_update';

const getCurrentPeriodStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const parseMoneyNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) && val >= 0 ? val : 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

const normalizePeriodInput = (val, fallback = '') => {
  if (!val) return fallback || getCurrentPeriodStr();
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const str = String(val).trim();
  const ymDash = str.match(/^(\d{4})[-/](\d{1,2})/);
  if (ymDash) {
    return `${ymDash[1]}-${ymDash[2].padStart(2, '0')}`;
  }
  const mySlash = str.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mySlash) {
    return `${mySlash[2]}-${mySlash[1].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return fallback || getCurrentPeriodStr();
};

const pickImportField = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
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
      return String(row[matchedKey]).trim();
    }
  }
  return '';
};

const loadSalesFromDb = async () => {
  const [salesRes, metaRes] = await Promise.all([
    supabase
      .from('travelops_sales_targets')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('travelops_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', LAST_UPDATE_SETTING_KEY)
      .maybeSingle()
  ]);

  if (salesRes.error) throw salesRes.error;

  const mappedSales = (salesRes.data || []).map((s) => ({
    id: s.id,
    staffName: (s.staff_name || '').trim(),
    targetSales: Number(s.target_sales) || 0,
    targetProfit: Number(s.target_profit) || 0,
    achievementSales: Number(s.achievement_sales) || 0,
    achievementProfit: Number(s.achievement_profit) || 0,
    period: (s.period || '').trim(),
    createdAt: s.created_at || null,
    updatedAt: s.updated_at || s.created_at || null
  }));

  let lastUpdatedMeta = null;
  if (!metaRes.error && metaRes.data?.setting_value) {
    const val = metaRes.data.setting_value;
    lastUpdatedMeta = {
      updatedAt: val.updatedAt || metaRes.data.updated_at || null,
      updatedBy: val.updatedBy || 'Admin',
      updatedRole: val.updatedRole || 'Admin',
      period: val.period || '',
      action: val.action || '',
      note: val.note || ''
    };
  }

  return { mappedSales, lastUpdatedMeta };
};

export const SalesProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.sales,
    queryFn: loadSalesFromDb,
    enabled: Boolean(user),
    staleTime: 2 * 60 * 1000
  });

  const sales = data?.mappedSales || [];
  const lastUpdatedMeta = data?.lastUpdatedMeta || null;

  const fetchSales = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
  }, [queryClient]);

  /**
   * Persist official Last Updated metadata for Sales & Target into travelops_settings
   */
  const recordSalesLastUpdate = useCallback(
    async ({ updatedAt, updatedBy, updatedRole, period = '', action = '', note = '' } = {}) => {
      const isoTime = updatedAt || new Date().toISOString();
      const payload = {
        updatedAt: isoTime,
        updatedBy: (updatedBy || user?.name || 'Admin').trim(),
        updatedRole: (updatedRole || user?.role || 'Admin').trim(),
        period: String(period || '').trim(),
        action: String(action || '').trim(),
        note: String(note || '').trim()
      };

      const { error } = await supabase.from('travelops_settings').upsert({
        setting_key: LAST_UPDATE_SETTING_KEY,
        setting_value: payload,
        updated_at: isoTime
      });

      if (error) throw error;
      queryClient.setQueryData(QUERY_KEYS.sales, (prev) => ({
        mappedSales: prev?.mappedSales || [],
        lastUpdatedMeta: payload
      }));
      return payload;
    },
    [user?.name, user?.role, queryClient]
  );

  // Best-effort auto stamp whenever Admin/Manager modifies sales & target data
  const autoStampSalesUpdate = useCallback(
    async ({ period = '', action = '' } = {}) => {
      try {
        await recordSalesLastUpdate({
          period,
          action,
          note: lastUpdatedMeta?.note || ''
        });
      } catch (err) {
        console.warn('Could not persist sales last-update metadata:', err?.message || err);
      }
    },
    [recordSalesLastUpdate, lastUpdatedMeta]
  );

  const addSale = async (saleData) => {
    try {
      const cleanStaff = (saleData.staffName || '').trim();
      const cleanPeriod = normalizePeriodInput(saleData.period);

      // Upsert protection: prevent duplicate (staffName, period) rows
      const existing = sales.find(
        (s) =>
          s.staffName.toLowerCase() === cleanStaff.toLowerCase() &&
          s.period === cleanPeriod
      );

      if (existing) {
        const { error: updateErr } = await supabase
          .from('travelops_sales_targets')
          .update({
            staff_name: cleanStaff,
            target_sales: parseMoneyNumber(saleData.targetSales),
            target_profit: parseMoneyNumber(saleData.targetProfit),
            achievement_sales: parseMoneyNumber(saleData.achievementSales),
            achievement_profit: parseMoneyNumber(saleData.achievementProfit),
            period: cleanPeriod
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
        await autoStampSalesUpdate({
          period: cleanPeriod,
          action: `Update target/realisasi ${cleanStaff}`
        });
        await fetchSales();
        return { id: existing.id, mode: 'updated' };
      }

      const newId = `TGT-${Date.now()}`;
      const { error } = await supabase.from('travelops_sales_targets').insert([
        {
          id: newId,
          staff_name: cleanStaff,
          target_sales: parseMoneyNumber(saleData.targetSales),
          target_profit: parseMoneyNumber(saleData.targetProfit),
          achievement_sales: parseMoneyNumber(saleData.achievementSales),
          achievement_profit: parseMoneyNumber(saleData.achievementProfit),
          period: cleanPeriod
        }
      ]);
      if (error) throw error;
      await autoStampSalesUpdate({
        period: cleanPeriod,
        action: `Input data ${cleanStaff}`
      });
      await fetchSales();
      return { id: newId, mode: 'created' };
    } catch (err) {
      console.error('Add sale target error:', err);
      throw err;
    }
  };

  const updateSale = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.staffName !== undefined) {
        dbUpdates.staff_name = (updatedData.staffName || '').trim();
      }
      if (updatedData.targetSales !== undefined) {
        dbUpdates.target_sales = parseMoneyNumber(updatedData.targetSales);
      }
      if (updatedData.targetProfit !== undefined) {
        dbUpdates.target_profit = parseMoneyNumber(updatedData.targetProfit);
      }
      if (updatedData.achievementSales !== undefined) {
        dbUpdates.achievement_sales = parseMoneyNumber(updatedData.achievementSales);
      }
      if (updatedData.achievementProfit !== undefined) {
        dbUpdates.achievement_profit = parseMoneyNumber(updatedData.achievementProfit);
      }
      if (updatedData.period !== undefined) {
        dbUpdates.period = normalizePeriodInput(updatedData.period);
      }

      const { error } = await supabase
        .from('travelops_sales_targets')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;

      const existing = sales.find((s) => s.id === id);
      await autoStampSalesUpdate({
        period: dbUpdates.period || existing?.period || '',
        action: `Update data ${dbUpdates.staff_name || existing?.staffName || 'konsultan'}`
      });
      await fetchSales();
    } catch (err) {
      console.error('Update sale target error:', err);
      throw err;
    }
  };

  const deleteSale = async (id) => {
    try {
      const existing = sales.find((s) => s.id === id);
      const { error } = await supabase
        .from('travelops_sales_targets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await autoStampSalesUpdate({
        period: existing?.period || '',
        action: `Hapus data ${existing?.staffName || 'konsultan'}`
      });
      await fetchSales();
    } catch (err) {
      console.error('Delete sale target error:', err);
      throw err;
    }
  };

  const bulkDeleteSales = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const { error } = await supabase
        .from('travelops_sales_targets')
        .delete()
        .in('id', ids);
      if (error) throw error;
      await autoStampSalesUpdate({
        action: `Hapus massal ${ids.length} data`
      });
      await fetchSales();
    } catch (err) {
      console.error('Bulk delete sales error:', err);
      throw err;
    }
  };

  const clonePeriodTargets = async (sourcePeriod, targetPeriod) => {
    try {
      const sourceRows = sales.filter((s) => s.period === sourcePeriod);
      if (sourceRows.length === 0) {
        throw new Error(`No quota records found in ${sourcePeriod} to copy from.`);
      }

      const existingTargetStaff = new Set(
        sales
          .filter((s) => s.period === targetPeriod)
          .map((s) => s.staffName.toLowerCase())
      );

      const baseTs = Date.now();
      const toInsert = sourceRows
        .filter((s) => !existingTargetStaff.has(s.staffName.toLowerCase()))
        .map((s, idx) => ({
          id: `TGT-${baseTs}-${idx + 1}`,
          staff_name: s.staffName,
          target_sales: s.targetSales || 0,
          target_profit: s.targetProfit || 0,
          achievement_sales: 0,
          achievement_profit: 0,
          period: targetPeriod
        }));

      if (toInsert.length === 0) {
        throw new Error(
          `All consultants from ${sourcePeriod} already have quota records in ${targetPeriod}.`
        );
      }

      const { error } = await supabase
        .from('travelops_sales_targets')
        .insert(toInsert);
      if (error) throw error;
      await autoStampSalesUpdate({
        period: targetPeriod,
        action: `Salin ${toInsert.length} target dari ${sourcePeriod}`
      });
      await fetchSales();
      return toInsert.length;
    } catch (err) {
      console.error('Clone period targets error:', err);
      throw err;
    }
  };

  const bulkImportSales = async (rows, fallbackPeriod = '') => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    try {
      const baseTs = Date.now();
      const defaultPeriod = fallbackPeriod || getCurrentPeriodStr();

      // Deduplicate incoming rows by (staffName.toLowerCase(), period)
      const dedupedIncoming = new Map();
      rows.forEach((row) => {
        const staffName = pickImportField(row, [
          'Consultant',
          'Staff Consultant',
          'Staff Name',
          'NAMA TC',
          'Staff',
          'staffName',
          'staff_name'
        ]);
        if (!staffName) return;

        const rawPeriod = pickImportField(row, [
          'Period',
          'Month',
          'Periode',
          'period'
        ]);
        const period = normalizePeriodInput(rawPeriod, defaultPeriod);

        const targetSales = parseMoneyNumber(
          row['Target Sales (IDR)'] ??
            row['Target Sales'] ??
            row['TARGET SALES'] ??
            row['targetSales'] ??
            row['target_sales'] ??
            0
        );
        const targetProfit = parseMoneyNumber(
          row['Target Profit (IDR)'] ??
            row['Target Profit'] ??
            row['TARGET PROFIT'] ??
            row['targetProfit'] ??
            row['target_profit'] ??
            0
        );
        const achievementSales = parseMoneyNumber(
          row['Actual Sales (IDR)'] ??
            row['Actual Sales'] ??
            row['Achieved Sales'] ??
            row['ACHIEVEMENT SALES'] ??
            row['achievementSales'] ??
            row['achievement_sales'] ??
            0
        );
        const achievementProfit = parseMoneyNumber(
          row['Actual Profit (IDR)'] ??
            row['Actual Profit'] ??
            row['Achieved Profit'] ??
            row['ACHIEVEMENT PROFIT'] ??
            row['achievementProfit'] ??
            row['achievement_profit'] ??
            0
        );

        const key = `${staffName.toLowerCase()}::${period}`;
        dedupedIncoming.set(key, {
          staffName,
          period,
          targetSales,
          targetProfit,
          achievementSales,
          achievementProfit
        });
      });

      if (dedupedIncoming.size === 0) {
        throw new Error(
          'No valid quota rows found. Make sure "Consultant" / "Staff Name" is filled.'
        );
      }

      const existingMap = new Map();
      sales.forEach((s) => {
        existingMap.set(`${s.staffName.toLowerCase()}::${s.period}`, s);
      });

      const toInsert = [];
      const toUpdate = [];
      let idx = 0;

      dedupedIncoming.forEach((item, key) => {
        const existing = existingMap.get(key);
        if (existing) {
          toUpdate.push(
            supabase
              .from('travelops_sales_targets')
              .update({
                staff_name: item.staffName,
                target_sales: item.targetSales,
                target_profit: item.targetProfit,
                achievement_sales: item.achievementSales,
                achievement_profit: item.achievementProfit,
                period: item.period
              })
              .eq('id', existing.id)
          );
        } else {
          idx += 1;
          toInsert.push({
            id: `TGT-${baseTs}-${idx}`,
            staff_name: item.staffName,
            target_sales: item.targetSales,
            target_profit: item.targetProfit,
            achievement_sales: item.achievementSales,
            achievement_profit: item.achievementProfit,
            period: item.period
          });
        }
      });

      if (toUpdate.length > 0) {
        await Promise.all(toUpdate);
      }
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('travelops_sales_targets')
          .insert(toInsert);
        if (error) throw error;
      }

      const totalProcessed = toUpdate.length + toInsert.length;
      await autoStampSalesUpdate({
        period: defaultPeriod,
        action: `Import Excel/CSV (${totalProcessed} data)`
      });
      await fetchSales();
      return totalProcessed;
    } catch (err) {
      console.error('Bulk import sales error:', err);
      throw err;
    }
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        lastUpdatedMeta,
        loading,
        addSale,
        updateSale,
        deleteSale,
        bulkDeleteSales,
        clonePeriodTargets,
        bulkImportSales,
        recordSalesLastUpdate
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSales = () => useContext(SalesContext);
