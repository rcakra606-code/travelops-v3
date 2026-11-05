import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const OvertimeContext = createContext(null);

const loadOvertimesFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_overtimes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(o => ({
    id: o.id,
    staff: o.staff || '',
    eventName: o.event_name || '',
    date: o.date || '',
    hours: Number(o.hours) || 0,
    status: o.status || 'Pending',
    remarks: o.remarks || ''
  }));
};

export const OvertimeProvider = ({ children }) => {
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOvertimes = useCallback(async () => {
    try {
      const mapped = await loadOvertimesFromDb();
      setOvertimes(mapped);
      return { success: true };
    } catch (err) {
      console.error('Error fetching overtimes:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadOvertimesFromDb()
      .then(mapped => {
        if (!cancelled) setOvertimes(mapped);
      })
      .catch(err => {
        console.error('Initial fetch overtimes error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addOvertime = async (data) => {
    try {
      const newId = `OT-${Date.now()}`;
      const { error } = await supabase.from('travelops_overtimes').insert([{
        id: newId,
        staff: data.staff?.trim() || '',
        event_name: data.eventName?.trim() || '',
        date: data.date || '',
        hours: Number(data.hours) || 0,
        status: data.status || 'Pending',
        remarks: data.remarks || ''
      }]);
      if (error) throw error;
      await fetchOvertimes();
      return { success: true };
    } catch (err) {
      console.error('Error adding overtime:', err);
      return { success: false, error: err?.message || 'Failed to add overtime record' };
    }
  };

  const updateOvertime = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff.trim();
      if (updatedData.eventName !== undefined) dbUpdates.event_name = updatedData.eventName.trim();
      if (updatedData.date !== undefined) dbUpdates.date = updatedData.date;
      if (updatedData.hours !== undefined) dbUpdates.hours = Number(updatedData.hours) || 0;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.remarks !== undefined) dbUpdates.remarks = updatedData.remarks;

      const { error } = await supabase.from('travelops_overtimes').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchOvertimes();
      return { success: true };
    } catch (err) {
      console.error('Error updating overtime:', err);
      return { success: false, error: err?.message || 'Failed to update overtime record' };
    }
  };

  const quickUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('travelops_overtimes').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      await fetchOvertimes();
      return { success: true };
    } catch (err) {
      console.error('Error updating overtime status:', err);
      return { success: false, error: err?.message || 'Failed to update status' };
    }
  };

  const deleteOvertime = async (id) => {
    try {
      const { error } = await supabase.from('travelops_overtimes').delete().eq('id', id);
      if (error) throw error;
      await fetchOvertimes();
      return { success: true };
    } catch (err) {
      console.error('Error deleting overtime:', err);
      return { success: false, error: err?.message || 'Failed to delete overtime record' };
    }
  };

  const bulkImportOvertimes = async (dataArray) => {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return { success: false, error: 'No data provided to import' };
      }
      const toInsert = dataArray.map((d, i) => ({
        id: d.id || `OT-${Date.now()}-${i}`,
        staff: (d.staff || '').trim(),
        event_name: (d.eventName || d.event_name || '').trim(),
        date: d.date || '',
        hours: Number(d.hours) || 0,
        status: d.status || 'Pending',
        remarks: d.remarks || ''
      }));
      const { error } = await supabase.from('travelops_overtimes').insert(toInsert);
      if (error) throw error;
      await fetchOvertimes();
      return { success: true, count: toInsert.length };
    } catch (err) {
      console.error('Error bulk importing overtimes:', err);
      return { success: false, error: err?.message || 'Failed to import overtime records' };
    }
  };

  return (
    <OvertimeContext.Provider value={{ 
      overtimes, 
      addOvertime, 
      updateOvertime, 
      quickUpdateStatus,
      deleteOvertime, 
      bulkImportOvertimes,
      fetchOvertimes,
      loading 
    }}>
      {children}
    </OvertimeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOvertimes = () => useContext(OvertimeContext);
