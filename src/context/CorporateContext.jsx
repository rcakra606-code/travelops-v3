import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CorporateContext = createContext(null);

const loadCorporateFromDb = async () => {
  const [accRes, salesRes] = await Promise.all([
    supabase.from('travelops_corporate_accounts').select('*').order('created_at', { ascending: false }),
    supabase.from('travelops_corporate_sales').select('*').order('created_at', { ascending: false })
  ]);

  if (accRes.error) throw accRes.error;
  if (salesRes.error) throw salesRes.error;

  const accounts = (accRes.data || []).map(a => ({
    id: a.id,
    accountCode: a.account_code || '',
    companyName: a.company_name || '',
    corporateName: a.company_name || '', // bidirectional compatibility
    address: a.address || '',
    creditLimit: Number(a.credit_limit) || 0,
    status: a.status || 'Active',
    picName: a.pic_name || '',
    picPhone: a.pic_phone || '',
    picOfficeEmail: a.pic_office_email || '',
    picPersonalEmail: a.pic_personal_email || '',
    remarks: a.remarks || '',
    flightFee: a.flight_fee || {},
    hotelFee: a.hotel_fee || {},
    airlinesCode: a.airlines_code || '',
    detailLink: a.detail_link || ''
  }));

  const sales = (salesRes.data || []).map(s => ({
    id: s.id,
    date: s.date || '',
    accountCode: s.account_code || '',
    category: s.category || 'Flight',
    salesAmount: Number(s.sales_amount) || 0,
    profitAmount: Number(s.profit_amount) || 0,
    remarks: s.remarks || ''
  }));

  return { accounts, sales };
};

export const CorporateProvider = ({ children }) => {
  const [corporateAccounts, setCorporateAccounts] = useState([]);
  const [corporateSales, setCorporateSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { accounts, sales } = await loadCorporateFromDb();
      setCorporateAccounts(accounts);
      setCorporateSales(sales);
      return { success: true };
    } catch (err) {
      console.error('Error fetching corporate data:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCorporateFromDb()
      .then(({ accounts, sales }) => {
        if (!cancelled) {
          setCorporateAccounts(accounts);
          setCorporateSales(sales);
        }
      })
      .catch((err) => {
        console.error('Initial fetch corporate error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addAccount = async (acc) => {
    try {
      const newId = `CORP-${Date.now()}`;
      const compName = acc.companyName || acc.corporateName || '';
      const { error } = await supabase.from('travelops_corporate_accounts').insert([{
        id: newId,
        account_code: acc.accountCode?.trim() || '',
        company_name: compName.trim(),
        address: acc.address || '',
        credit_limit: Number(acc.creditLimit) || 0,
        status: acc.status || 'Active',
        pic_name: acc.picName || '',
        pic_phone: acc.picPhone || '',
        pic_office_email: acc.picOfficeEmail || '',
        pic_personal_email: acc.picPersonalEmail || '',
        remarks: acc.remarks || '',
        flight_fee: acc.flightFee || {},
        hotel_fee: acc.hotelFee || {},
        airlines_code: acc.airlinesCode || '',
        detail_link: acc.detailLink || ''
      }]);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error adding account:', err);
      return { success: false, error: err?.message || 'Failed to add account' };
    }
  };

  const updateAccount = async (id, updated) => {
    try {
      const compName = updated.companyName !== undefined 
        ? updated.companyName 
        : (updated.corporateName !== undefined ? updated.corporateName : undefined);

      const dbUpdates = {
        account_code: updated.accountCode !== undefined ? updated.accountCode.trim() : undefined,
        company_name: compName !== undefined ? compName.trim() : undefined,
        address: updated.address,
        credit_limit: updated.creditLimit !== undefined ? Number(updated.creditLimit) : undefined,
        status: updated.status,
        pic_name: updated.picName,
        pic_phone: updated.picPhone,
        pic_office_email: updated.picOfficeEmail,
        pic_personal_email: updated.picPersonalEmail,
        remarks: updated.remarks,
        flight_fee: updated.flightFee,
        hotel_fee: updated.hotelFee,
        airlines_code: updated.airlinesCode,
        detail_link: updated.detailLink
      };
      Object.keys(dbUpdates).forEach(k => dbUpdates[k] === undefined && delete dbUpdates[k]);

      const { error } = await supabase.from('travelops_corporate_accounts').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error updating account:', err);
      return { success: false, error: err?.message || 'Failed to update account' };
    }
  };

  const deleteAccount = async (id) => {
    try {
      const { error } = await supabase.from('travelops_corporate_accounts').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { success: false, error: err?.message || 'Failed to delete account' };
    }
  };

  const bulkImportAccounts = async (dataArray) => {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return { success: false, error: 'No account data provided' };
      }
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `CORP-${Date.now()}-${i}`,
        account_code: (d.accountCode || d.account_code || '').trim(),
        company_name: (d.companyName || d.corporateName || d.company_name || '').trim(),
        address: d.address || '',
        credit_limit: Number(d.creditLimit ?? d.credit_limit) || 0,
        status: d.status || 'Active',
        pic_name: d.picName || d.pic_name || '',
        pic_phone: d.picPhone || d.pic_phone || '',
        pic_office_email: d.picOfficeEmail || d.pic_office_email || '',
        pic_personal_email: d.picPersonalEmail || d.pic_personal_email || '',
        remarks: d.remarks || '',
        flight_fee: d.flightFee || d.flight_fee || {},
        hotel_fee: d.hotelFee || d.hotel_fee || {},
        airlines_code: d.airlinesCode || d.airlines_code || '',
        detail_link: d.detailLink || d.detail_link || ''
      }));
      const { error } = await supabase.from('travelops_corporate_accounts').insert(toInsert);
      if (error) throw error;
      await fetchData();
      return { success: true, count: toInsert.length };
    } catch (err) {
      console.error('Error bulk importing accounts:', err);
      return { success: false, error: err?.message || 'Failed to import accounts' };
    }
  };

  const addSales = async (sale) => {
    try {
      const { error } = await supabase.from('travelops_corporate_sales').insert([{
        id: `CSLS-${Date.now()}`,
        date: sale.date,
        account_code: sale.accountCode?.trim() || '',
        category: sale.category || 'Flight',
        sales_amount: Number(sale.salesAmount) || 0,
        profit_amount: Number(sale.profitAmount) || 0,
        remarks: sale.remarks || ''
      }]);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error adding sales record:', err);
      return { success: false, error: err?.message || 'Failed to add sales record' };
    }
  };

  const updateSales = async (id, updated) => {
    try {
      const dbUpdates = {
        date: updated.date,
        account_code: updated.accountCode !== undefined ? updated.accountCode.trim() : undefined,
        category: updated.category,
        sales_amount: updated.salesAmount !== undefined ? Number(updated.salesAmount) : undefined,
        profit_amount: updated.profitAmount !== undefined ? Number(updated.profitAmount) : undefined,
        remarks: updated.remarks
      };
      Object.keys(dbUpdates).forEach(k => dbUpdates[k] === undefined && delete dbUpdates[k]);

      const { error } = await supabase.from('travelops_corporate_sales').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error updating sales record:', err);
      return { success: false, error: err?.message || 'Failed to update sales record' };
    }
  };

  const deleteSales = async (id) => {
    try {
      const { error } = await supabase.from('travelops_corporate_sales').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error deleting sales record:', err);
      return { success: false, error: err?.message || 'Failed to delete sales record' };
    }
  };

  const bulkImportSales = async (dataArray) => {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return { success: false, error: 'No sales data provided' };
      }
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `CSLS-${Date.now()}-${i}`,
        date: d.date,
        account_code: (d.accountCode || d.account_code || '').trim(),
        category: d.category || 'Flight',
        sales_amount: Number(d.salesAmount ?? d.sales_amount) || 0,
        profit_amount: Number(d.profitAmount ?? d.profit_amount) || 0,
        remarks: d.remarks || ''
      }));
      const { error } = await supabase.from('travelops_corporate_sales').insert(toInsert);
      if (error) throw error;
      await fetchData();
      return { success: true, count: toInsert.length };
    } catch (err) {
      console.error('Error bulk importing sales:', err);
      return { success: false, error: err?.message || 'Failed to import sales' };
    }
  };

  return (
    <CorporateContext.Provider value={{ 
      corporateAccounts, addAccount, updateAccount, deleteAccount, bulkImportAccounts,
      corporateSales, addSales, updateSales, deleteSales, bulkImportSales,
      loading, refreshData: fetchData 
    }}>
      {children}
    </CorporateContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCorporate = () => useContext(CorporateContext);
