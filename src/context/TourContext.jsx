import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const { data, error } = await supabase.from('travelops_tours').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(t => ({
        id: t.id,
        country: t.country,
        category: t.category,
        departureDate: t.departure_date,
        returnDate: t.return_date,
        maxCapacity: t.max_capacity,
        status: t.status,
        financials: t.financials || {},
        paxInfo: t.pax_info || [],
        internals: t.internals || {}
      }));
      setTours(mapped);
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTour = async (tourData) => {
    try {
      const newId = tourData.id || `T-${Date.now()}`;
      const { error } = await supabase.from('travelops_tours').insert([{
        id: newId,
        country: tourData.country,
        category: tourData.category,
        departure_date: tourData.departureDate,
        return_date: tourData.returnDate,
        max_capacity: tourData.maxCapacity,
        status: tourData.status || 'Pending',
        financials: tourData.financials,
        pax_info: tourData.paxInfo,
        internals: tourData.internals
      }]);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Add tour error:', err);
    }
  };

  const updateTour = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.country !== undefined) dbUpdates.country = updatedData.country;
      if (updatedData.category !== undefined) dbUpdates.category = updatedData.category;
      if (updatedData.departureDate !== undefined) dbUpdates.departure_date = updatedData.departureDate;
      if (updatedData.returnDate !== undefined) dbUpdates.return_date = updatedData.returnDate;
      if (updatedData.maxCapacity !== undefined) dbUpdates.max_capacity = updatedData.maxCapacity;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.financials !== undefined) dbUpdates.financials = updatedData.financials;
      if (updatedData.paxInfo !== undefined) dbUpdates.pax_info = updatedData.paxInfo;
      if (updatedData.internals !== undefined) dbUpdates.internals = updatedData.internals;

      const { error } = await supabase.from('travelops_tours').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Update tour error:', err);
    }
  };

  const deleteTour = async (id) => {
    try {
      const { error } = await supabase.from('travelops_tours').delete().eq('id', id);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Delete tour error:', err);
    }
  };

  const getStats = () => {
    let totalOmset = 0;
    let totalProfit = 0;
    let activeBookings = 0;
    const statusCounts = { Pending: 0, Confirm: 0, Cancel: 0, 'Past Date': 0 };

    tours.forEach(tour => {
      totalOmset += (tour.financials?.totalOmset || 0);
      totalProfit += (tour.financials?.profit || 0);
      if (tour.status === 'Confirm' || tour.status === 'Pending') activeBookings++;
      
      if (statusCounts[tour.status] !== undefined) {
        statusCounts[tour.status]++;
      }
    });

    return { totalOmset, totalProfit, activeBookings, statusCounts, totalTours: tours.length };
  };

  return (
    <TourContext.Provider value={{ tours, addTour, updateTour, deleteTour, getStats, loading }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTours = () => useContext(TourContext);
