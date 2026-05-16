import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const HotelContext = createContext(null);

export const HotelProvider = ({ children }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase.from('travelops_hotels').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(h => ({
        id: h.id,
        hotelName: h.hotel_name,
        guestList: h.guest_list,
        checkIn: h.check_in,
        checkOut: h.check_out,
        roomType: h.room_type,
        region: h.region,
        status: h.status,
        confirmationNumber: h.confirmation_number,
        supplierCode: h.supplier_code,
        supplierName: h.supplier_name,
        staff: h.staff
      }));
      setHotels(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addHotel = async (data) => {
    try {
      const newId = `HTL-${Date.now()}`;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const inDate = new Date(data.checkIn);
      inDate.setHours(0,0,0,0);
      const outDate = new Date(data.checkOut);
      outDate.setHours(0,0,0,0);
      
      let initialStatus = 'Upcoming';
      if (outDate < today) initialStatus = 'Past Date';
      else if (today >= inDate && today <= outDate) initialStatus = 'Active';

      const { error } = await supabase.from('travelops_hotels').insert([{
        id: newId,
        hotel_name: data.hotelName,
        guest_list: data.guestList,
        check_in: data.checkIn,
        check_out: data.checkOut,
        room_type: data.roomType,
        region: data.region,
        status: initialStatus,
        confirmation_number: data.confirmationNumber,
        supplier_code: data.supplierCode,
        supplier_name: data.supplierName,
        staff: data.staff
      }]);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error(err);
    }
  };

  const updateHotel = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.hotelName !== undefined) dbUpdates.hotel_name = updatedData.hotelName;
      if (updatedData.guestList !== undefined) dbUpdates.guest_list = updatedData.guestList;
      if (updatedData.checkIn !== undefined) dbUpdates.check_in = updatedData.checkIn;
      if (updatedData.checkOut !== undefined) dbUpdates.check_out = updatedData.checkOut;
      if (updatedData.roomType !== undefined) dbUpdates.room_type = updatedData.roomType;
      if (updatedData.region !== undefined) dbUpdates.region = updatedData.region;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.confirmationNumber !== undefined) dbUpdates.confirmation_number = updatedData.confirmationNumber;
      if (updatedData.supplierCode !== undefined) dbUpdates.supplier_code = updatedData.supplierCode;
      if (updatedData.supplierName !== undefined) dbUpdates.supplier_name = updatedData.supplierName;
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff;

      const { error } = await supabase.from('travelops_hotels').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHotel = async (id) => {
    try {
      const { error } = await supabase.from('travelops_hotels').delete().eq('id', id);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <HotelContext.Provider value={{ hotels, addHotel, updateHotel, deleteHotel, loading }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotels = () => useContext(HotelContext);
