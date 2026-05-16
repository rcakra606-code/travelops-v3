import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CorporateContext = createContext(null);

export const CorporateProvider = ({ children }) => {
  const [corporateAccounts, setCorporateAccounts] = useState([]);
  const [corporateSales, setCorporateSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, salesRes] = await Promise.all([
        supabase.from('travelops_corporate_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('travelops_corporate_sales').select('*').order('created_at', { ascending: false })
      ]);

      if (accRes.error) throw accRes.error;
      if (salesRes.error) throw salesRes.error;

      setCorporateAccounts(accRes.data.map(a => ({
        id: a.id,
        accountCode: a.account_code,
        companyName: a.company_name,
        address: a.address,
        creditLimit: a.credit_limit,
        status: a.status,
        picName: a.pic_name,
        picPhone: a.pic_phone,
        picOfficeEmail: a.pic_office_email,
        picPersonalEmail: a.pic_personal_email,
        remarks: a.remarks,
        flightFee: a.flight_fee || {},
        hotelFee: a.hotel_fee || {},
        airlinesCode: a.airlines_code,
        detailLink: a.detail_link
      })));

      setCorporateSales(salesRes.data.map(s => ({
        id: s.id,
        date: s.date,
        accountCode: s.account_code,
        category: s.category,
        salesAmount: s.sales_amount,
        profitAmount: s.profit_amount,
        remarks: s.remarks
      })));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (acc) => {
    try {
      const newId = `CORP-${Date.now()}`;
      const { error } = await supabase.from('travelops_corporate_accounts').insert([{
        id: newId,
        account_code: acc.accountCode,
        company_name: acc.companyName,
        address: acc.address,
        credit_limit: acc.creditLimit,
        status: acc.status || 'Active',
        pic_name: acc.picName,
        pic_phone: acc.picPhone,
        pic_office_email: acc.picOfficeEmail,
        pic_personal_email: acc.picPersonalEmail,
        remarks: acc.remarks,
        flight_fee: acc.flightFee,
        hotel_fee: acc.hotelFee,
        airlines_code: acc.airlinesCode,
        detail_link: acc.detailLink
      }]);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateAccount = async (id, updated) => {
    try {
      const dbUpdates = {
        account_code: updated.accountCode,
        company_name: updated.companyName,
        address: updated.address,
        credit_limit: updated.creditLimit,
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
      // Clean undefined
      Object.keys(dbUpdates).forEach(k => dbUpdates[k] === undefined && delete dbUpdates[k]);

      const { error } = await supabase.from('travelops_corporate_accounts').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAccount = async (id) => {
    try {
      await supabase.from('travelops_corporate_accounts').delete().eq('id', id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const bulkImportAccounts = async (dataArray) => {
    try {
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `CORP-${Date.now()}-${i}`,
        account_code: d.accountCode,
        company_name: d.companyName,
        address: d.address,
        credit_limit: d.creditLimit,
        status: d.status || 'Active',
        pic_name: d.picName,
        pic_phone: d.picPhone,
        pic_office_email: d.picOfficeEmail,
        pic_personal_email: d.picPersonalEmail,
        remarks: d.remarks,
        flight_fee: d.flightFee || {},
        hotel_fee: d.hotelFee || {},
        airlines_code: d.airlinesCode,
        detail_link: d.detailLink
      }));
      await supabase.from('travelops_corporate_accounts').insert(toInsert);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addSales = async (sale) => {
    try {
      const { error } = await supabase.from('travelops_corporate_sales').insert([{
        id: `CSLS-${Date.now()}`,
        date: sale.date,
        account_code: sale.accountCode,
        category: sale.category,
        sales_amount: Number(sale.salesAmount) || 0,
        profit_amount: Number(sale.profitAmount) || 0,
        remarks: sale.remarks
      }]);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateSales = async (id, updated) => {
    try {
      const dbUpdates = {
        date: updated.date,
        account_code: updated.accountCode,
        category: updated.category,
        sales_amount: updated.salesAmount !== undefined ? Number(updated.salesAmount) : undefined,
        profit_amount: updated.profitAmount !== undefined ? Number(updated.profitAmount) : undefined,
        remarks: updated.remarks
      };
      Object.keys(dbUpdates).forEach(k => dbUpdates[k] === undefined && delete dbUpdates[k]);

      const { error } = await supabase.from('travelops_corporate_sales').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSales = async (id) => {
    try {
      await supabase.from('travelops_corporate_sales').delete().eq('id', id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const bulkImportSales = async (dataArray) => {
    try {
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `CSLS-${Date.now()}-${i}`,
        date: d.date,
        account_code: d.accountCode,
        category: d.category,
        sales_amount: Number(d.salesAmount) || 0,
        profit_amount: Number(d.profitAmount) || 0,
        remarks: d.remarks
      }));
      await supabase.from('travelops_corporate_sales').insert(toInsert);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CorporateContext.Provider value={{ 
      corporateAccounts, addAccount, updateAccount, deleteAccount, bulkImportAccounts,
      corporateSales, addSales, updateSales, deleteSales, bulkImportSales,
      loading 
    }}>
      {children}
    </CorporateContext.Provider>
  );
};

export const useCorporate = () => useContext(CorporateContext);
