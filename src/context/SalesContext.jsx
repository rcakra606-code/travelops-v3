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
      const { data, error } = await supabase.from('travelops_sales').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        pic: s.pic,
        date: s.date,
        amount: s.amount,
        paxCount: s.pax_count
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
      const newId = `SLS-${Date.now()}`;
      const { error } = await supabase.from('travelops_sales').insert([{
        id: newId,
        type: saleData.type,
        title: saleData.title,
        pic: saleData.pic,
        date: saleData.date,
        amount: saleData.amount || 0,
        pax_count: saleData.paxCount || 0
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
      if (updatedData.type !== undefined) dbUpdates.type = updatedData.type;
      if (updatedData.title !== undefined) dbUpdates.title = updatedData.title;
      if (updatedData.pic !== undefined) dbUpdates.pic = updatedData.pic;
      if (updatedData.date !== undefined) dbUpdates.date = updatedData.date;
      if (updatedData.amount !== undefined) dbUpdates.amount = updatedData.amount;
      if (updatedData.paxCount !== undefined) dbUpdates.pax_count = updatedData.paxCount;

      const { error } = await supabase.from('travelops_sales').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSale = async (id) => {
    try {
      const { error } = await supabase.from('travelops_sales').delete().eq('id', id);
      if (error) throw error;
      await fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const getStats = () => {
    let totalSales = 0;
    let totalPax = 0;
    const typeCounts = { Tour: 0, Cruise: 0, Hotel: 0 };

    sales.forEach(s => {
      totalSales += Number(s.amount) || 0;
      totalPax += Number(s.paxCount) || 0;
      if (typeCounts[s.type] !== undefined) {
        typeCounts[s.type] += Number(s.amount) || 0;
      }
    });

    return { totalSales, totalPax, typeCounts };
  };

  return (
    <SalesContext.Provider value={{ sales, addSale, updateSale, deleteSale, getStats, loading }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => useContext(SalesContext);
