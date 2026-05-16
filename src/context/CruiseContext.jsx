import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CruiseContext = createContext(null);

export const CruiseProvider = ({ children }) => {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCruises();
  }, []);

  const fetchCruises = async () => {
    try {
      const { data, error } = await supabase.from('travelops_cruises').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(c => ({
        id: c.id,
        picName: c.pic_name,
        route: c.route,
        paxCount: c.pax_count,
        sailingStart: c.sailing_start,
        sailingEnd: c.sailing_end,
        cruiseLine: c.cruise_line,
        bookingRef: c.booking_ref,
        finalPaymentDate: c.final_payment_date
      }));
      setCruises(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCruise = async (cruiseData) => {
    try {
      const newId = `CRU-${Date.now()}`;
      const { error } = await supabase.from('travelops_cruises').insert([{
        id: newId,
        pic_name: cruiseData.picName,
        route: cruiseData.route,
        pax_count: cruiseData.paxCount,
        sailing_start: cruiseData.sailingStart,
        sailing_end: cruiseData.sailingEnd,
        cruise_line: cruiseData.cruiseLine,
        booking_ref: cruiseData.bookingRef,
        final_payment_date: cruiseData.finalPaymentDate
      }]);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error(err);
    }
  };

  const updateCruise = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.picName !== undefined) dbUpdates.pic_name = updatedData.picName;
      if (updatedData.route !== undefined) dbUpdates.route = updatedData.route;
      if (updatedData.paxCount !== undefined) dbUpdates.pax_count = updatedData.paxCount;
      if (updatedData.sailingStart !== undefined) dbUpdates.sailing_start = updatedData.sailingStart;
      if (updatedData.sailingEnd !== undefined) dbUpdates.sailing_end = updatedData.sailingEnd;
      if (updatedData.cruiseLine !== undefined) dbUpdates.cruise_line = updatedData.cruiseLine;
      if (updatedData.bookingRef !== undefined) dbUpdates.booking_ref = updatedData.bookingRef;
      if (updatedData.finalPaymentDate !== undefined) dbUpdates.final_payment_date = updatedData.finalPaymentDate;

      const { error } = await supabase.from('travelops_cruises').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCruise = async (id) => {
    try {
      const { error } = await supabase.from('travelops_cruises').delete().eq('id', id);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CruiseContext.Provider value={{ cruises, addCruise, updateCruise, deleteCruise, loading }}>
      {children}
    </CruiseContext.Provider>
  );
};

export const useCruises = () => useContext(CruiseContext);
