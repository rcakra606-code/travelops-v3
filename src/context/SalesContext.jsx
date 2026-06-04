import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SalesContext = createContext(null);

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase.from('travelops_sales_targets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(s => ({
        id: s.id,
        staffName: s.staff_name,
        targetSales: Number(s.target_sales) || 0,
        targetProfit: Number(s.target_profit) || 0,
        achievementSales: Number(s.achievement_sales) || 0,
        achievementProfit: Number(s.achievement_profit) || 0,
        period: s.period
      }));
      setSales(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData) => {
    try {
      const newId = `TGT-${Date.now()}`;
      const { error } = await supabase.from('travelops_sales_targets').insert([{
        id: newId,
        staff_name: saleData.staffName,
        target_sales: saleData.targetSales || 0,
        target_profit: saleData.targetProfit || 0,
        achievement_sales: saleData.achievementSales || 0,
        achievement_profit: saleData.achievementProfit || 0,
        period: saleData.period
      }]);
      if (error) throw error;
      await fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const updateSale = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.staffName !== undefined) dbUpdates.staff_name = updatedData.staffName;
      if (updatedData.targetSales !== undefined) dbUpdates.target_sales = updatedData.targetSales;
      if (updatedData.targetProfit !== undefined) dbUpdates.target_profit = updatedData.targetProfit;
      if (updatedData.achievementSales !== undefined) dbUpdates.achievement_sales = updatedData.achievementSales;
      if (updatedData.achievementProfit !== undefined) dbUpdates.achievement_profit = updatedData.achievementProfit;
      if (updatedData.period !== undefined) dbUpdates.period = updatedData.period;

      const { error } = await supabase.from('travelops_sales_targets').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSale = async (id) => {
    try {
      const { error } = await supabase.from('travelops_sales_targets').delete().eq('id', id);
      if (error) throw error;
      await fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SalesContext.Provider value={{ sales, addSale, updateSale, deleteSale, loading }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => useContext(SalesContext);
