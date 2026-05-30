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
        cruiseBrand: c.cruise_brand,
        shipName: c.ship_name,
        picName: c.pic_name,
        route: c.route,
        paxCount: c.pax_count,
        sailingStart: c.sailing_start,
        sailingEnd: c.sailing_end,
        cruiseLine: c.cruise_line,
        bookingRef: c.booking_ref,
        reservationCode: c.booking_ref, // Keep fallback or map properly
        finalPaymentDate: c.final_payment_date,
        staff: c.staff,
        participants: c.participants || [],
        phoneNumber: c.phone_number,
        email: c.email,
        status: c.status
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
      const today = new Date();
      today.setHours(0,0,0,0);
      const inDate = new Date(cruiseData.sailingStart);
      inDate.setHours(0,0,0,0);
      const outDate = new Date(cruiseData.sailingEnd);
      outDate.setHours(0,0,0,0);
      
      let initialStatus = 'Upcoming';
      if (outDate < today) initialStatus = 'Past Date';
      else if (today >= inDate && today <= outDate) initialStatus = 'Active';

      const { error } = await supabase.from('travelops_cruises').insert([{
        id: newId,
        cruise_brand: cruiseData.cruiseBrand,
        ship_name: cruiseData.shipName,
        pic_name: cruiseData.picName,
        route: cruiseData.route,
        pax_count: cruiseData.paxCount || 1 + (cruiseData.participants?.length || 0),
        sailing_start: cruiseData.sailingStart,
        sailing_end: cruiseData.sailingEnd,
        cruise_line: cruiseData.cruiseLine,
        booking_ref: cruiseData.reservationCode || cruiseData.bookingRef,
        final_payment_date: cruiseData.finalPaymentDate,
        staff: cruiseData.staff,
        participants: cruiseData.participants,
        phone_number: cruiseData.phoneNumber,
        email: cruiseData.email,
        status: initialStatus
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
      if (updatedData.cruiseBrand !== undefined) dbUpdates.cruise_brand = updatedData.cruiseBrand;
      if (updatedData.shipName !== undefined) dbUpdates.ship_name = updatedData.shipName;
      if (updatedData.picName !== undefined) dbUpdates.pic_name = updatedData.picName;
      if (updatedData.route !== undefined) dbUpdates.route = updatedData.route;
      if (updatedData.paxCount !== undefined) dbUpdates.pax_count = updatedData.paxCount;
      if (updatedData.sailingStart !== undefined) dbUpdates.sailing_start = updatedData.sailingStart;
      if (updatedData.sailingEnd !== undefined) dbUpdates.sailing_end = updatedData.sailingEnd;
      if (updatedData.cruiseLine !== undefined) dbUpdates.cruise_line = updatedData.cruiseLine;
      if (updatedData.bookingRef !== undefined) dbUpdates.booking_ref = updatedData.bookingRef;
      if (updatedData.reservationCode !== undefined) dbUpdates.booking_ref = updatedData.reservationCode;
      if (updatedData.finalPaymentDate !== undefined) dbUpdates.final_payment_date = updatedData.finalPaymentDate;
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff;
      if (updatedData.participants !== undefined) dbUpdates.participants = updatedData.participants;
      if (updatedData.phoneNumber !== undefined) dbUpdates.phone_number = updatedData.phoneNumber;
      if (updatedData.email !== undefined) dbUpdates.email = updatedData.email;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;

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
