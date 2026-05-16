import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const OvertimeContext = createContext(null);

export const OvertimeProvider = ({ children }) => {
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOvertimes();
  }, []);

  const fetchOvertimes = async () => {
    try {
      const { data, error } = await supabase.from('travelops_overtimes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(o => ({
        id: o.id,
        staff: o.staff,
        eventName: o.event_name,
        date: o.date,
        hours: o.hours,
        status: o.status,
        remarks: o.remarks
      }));
      setOvertimes(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addOvertime = async (data) => {
    try {
      const newId = `OT-${Date.now()}`;
      const { error } = await supabase.from('travelops_overtimes').insert([{
        id: newId,
        staff: data.staff,
        event_name: data.eventName,
        date: data.date,
        hours: data.hours,
        status: data.status || 'Pending',
        remarks: data.remarks
      }]);
      if (error) throw error;
      await fetchOvertimes();
    } catch (err) {
      console.error(err);
    }
  };

  const updateOvertime = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff;
      if (updatedData.eventName !== undefined) dbUpdates.event_name = updatedData.eventName;
      if (updatedData.date !== undefined) dbUpdates.date = updatedData.date;
      if (updatedData.hours !== undefined) dbUpdates.hours = updatedData.hours;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.remarks !== undefined) dbUpdates.remarks = updatedData.remarks;

      const { error } = await supabase.from('travelops_overtimes').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchOvertimes();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOvertime = async (id) => {
    try {
      const { error } = await supabase.from('travelops_overtimes').delete().eq('id', id);
      if (error) throw error;
      await fetchOvertimes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <OvertimeContext.Provider value={{ overtimes, addOvertime, updateOvertime, deleteOvertime, loading }}>
      {children}
    </OvertimeContext.Provider>
  );
};

export const useOvertimes = () => useContext(OvertimeContext);
