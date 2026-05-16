import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const CashoutContext = createContext(null);

export const CashoutProvider = ({ children }) => {
  const [cashoutRequests, setCashoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashouts();
  }, []);

  const fetchCashouts = async () => {
    try {
      const { data, error } = await supabase.from('travelops_cashouts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(c => ({
        id: c.id,
        staffName: c.staff_name,
        division: c.division,
        totalAmount: c.total_amount,
        requestDate: c.request_date,
        status: c.status,
        needsApproval: c.needs_approval,
        requestItems: c.request_items || [],
        approvedBy: c.approved_by,
        approveDate: c.approve_date
      }));
      setCashoutRequests(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCashoutRequest = async (requestData) => {
    try {
      const newId = `CSH-${Date.now()}`;
      const { error } = await supabase.from('travelops_cashouts').insert([{
        id: newId,
        staff_name: requestData.staffName,
        division: requestData.division,
        total_amount: requestData.totalAmount,
        request_date: requestData.requestDate,
        status: requestData.status || 'Pending',
        needs_approval: requestData.needsApproval,
        request_items: requestData.requestItems
      }]);
      if (error) throw error;
      await fetchCashouts();
    } catch (err) {
      console.error(err);
    }
  };

  const updateCashoutRequest = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.approvedBy !== undefined) dbUpdates.approved_by = updatedData.approvedBy;
      if (updatedData.approveDate !== undefined) dbUpdates.approve_date = updatedData.approveDate;

      const { error } = await supabase.from('travelops_cashouts').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchCashouts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCashoutRequest = async (id) => {
    try {
      const { error } = await supabase.from('travelops_cashouts').delete().eq('id', id);
      if (error) throw error;
      await fetchCashouts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CashoutContext.Provider value={{ cashoutRequests, addCashoutRequest, updateCashoutRequest, deleteCashoutRequest, loading }}>
      {children}
    </CashoutContext.Provider>
  );
};

export const useCashouts = () => useContext(CashoutContext);
