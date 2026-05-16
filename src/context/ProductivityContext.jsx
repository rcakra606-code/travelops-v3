import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProductivityContext = createContext(null);

export const ProductivityProvider = ({ children }) => {
  const [productivityData, setProductivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductivity();
  }, []);

  const fetchProductivity = async () => {
    try {
      const { data, error } = await supabase.from('travelops_productivity').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(p => ({
        id: p.id,
        date: p.date,
        staff: p.staff,
        category: p.category,
        type: p.type,
        salesAmount: p.sales_amount,
        profitAmount: p.profit_amount,
        remarks: p.remarks
      }));
      setProductivityData(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (data) => {
    try {
      const newId = `PRD-${Date.now()}`;
      const { error } = await supabase.from('travelops_productivity').insert([{
        id: newId,
        date: data.date,
        staff: data.staff,
        category: data.category,
        type: data.type,
        sales_amount: Number(data.salesAmount) || 0,
        profit_amount: Number(data.profitAmount) || 0,
        remarks: data.remarks
      }]);
      if (error) throw error;
      await fetchProductivity();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRecord = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.date !== undefined) dbUpdates.date = updatedData.date;
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff;
      if (updatedData.category !== undefined) dbUpdates.category = updatedData.category;
      if (updatedData.type !== undefined) dbUpdates.type = updatedData.type;
      if (updatedData.salesAmount !== undefined) dbUpdates.sales_amount = Number(updatedData.salesAmount);
      if (updatedData.profitAmount !== undefined) dbUpdates.profit_amount = Number(updatedData.profitAmount);
      if (updatedData.remarks !== undefined) dbUpdates.remarks = updatedData.remarks;

      const { error } = await supabase.from('travelops_productivity').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchProductivity();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('travelops_productivity').delete().eq('id', id);
      if (error) throw error;
      await fetchProductivity();
    } catch (err) {
      console.error(err);
    }
  };

  const bulkImport = async (dataArray) => {
    try {
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `PRD-${Date.now()}-${i}`,
        date: d.date,
        staff: d.staff,
        category: d.category,
        type: d.type,
        sales_amount: Number(d.salesAmount) || 0,
        profit_amount: Number(d.profitAmount) || 0,
        remarks: d.remarks
      }));
      // Basic insert, ignores conflicts if IDs somehow match (though we generate new ones mostly)
      const { error } = await supabase.from('travelops_productivity').insert(toInsert);
      if (error) throw error;
      await fetchProductivity();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProductivityContext.Provider value={{ productivityData, addRecord, updateRecord, deleteRecord, bulkImport, loading }}>
      {children}
    </ProductivityContext.Provider>
  );
};

export const useProductivity = () => useContext(ProductivityContext);
