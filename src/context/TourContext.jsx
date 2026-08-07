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
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const mapped = data.map(t => {
        let currentStatus = t.status;
        
        // Auto-move tours to "Past Date" if their departure date has passed
        if (t.departure_date && currentStatus !== 'Past Date' && currentStatus !== 'Cancel' && currentStatus !== 'Cancelled') {
          const depDate = new Date(t.departure_date);
          depDate.setHours(0,0,0,0);
          if (depDate < today) {
            currentStatus = 'Past Date';
            // Background update to database
            supabase.from('travelops_tours').update({ status: 'Past Date' }).eq('id', t.id).then();
          }
        }

        return {
          id: t.id,
          country: t.country,
          category: t.category,
          departureDate: t.departure_date,
          returnDate: t.return_date,
          maxCapacity: t.max_capacity,
          status: currentStatus,
          financials: t.financials || {},
          paxInfo: t.pax_info || [],
          internals: t.internals || {},
          tourCode: t.internals?.tourCode || '',
          bookingCode: t.internals?.bookingCode || '',
          paxCount: t.internals?.paxCount || 1,
          staffName: t.internals?.staffName || '',
          history: t.internals?.history || []
        };
      });
      
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
        internals: {
          ...(tourData.internals || {}),
          tourCode: tourData.tourCode,
          bookingCode: tourData.bookingCode,
          paxCount: tourData.paxCount,
          staffName: tourData.staffName,
          history: [{
            timestamp: new Date().toISOString(),
            user: tourData.updatedBy || tourData.staffName || 'System',
            action: 'Created Record',
            details: 'Initial tour record created.'
          }]
        }
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
      
      const currentTour = tours.find(t => t.id === id);
      const existingHistory = currentTour?.history || [];
      
      const newHistoryLog = {
        timestamp: new Date().toISOString(),
        user: updatedData.updatedBy || 'System',
        action: 'Updated Record',
        details: updatedData.status !== currentTour?.status 
          ? `Status changed to ${updatedData.status}`
          : 'Record information was modified.'
      };

      if (updatedData.internals !== undefined || updatedData.tourCode !== undefined || updatedData.bookingCode !== undefined || updatedData.paxCount !== undefined || updatedData.staffName !== undefined) {
        let newInternals = { ...(updatedData.internals || currentTour?.internals || {}) };
        if (updatedData.tourCode !== undefined) newInternals.tourCode = updatedData.tourCode;
        if (updatedData.bookingCode !== undefined) newInternals.bookingCode = updatedData.bookingCode;
        if (updatedData.paxCount !== undefined) newInternals.paxCount = updatedData.paxCount;
        if (updatedData.staffName !== undefined) newInternals.staffName = updatedData.staffName;
        newInternals.history = [newHistoryLog, ...existingHistory];
        dbUpdates.internals = newInternals;
      } else {
        dbUpdates.internals = { ...(currentTour?.internals || {}), history: [newHistoryLog, ...existingHistory] };
      }

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

  const bulkImportTours = async (dataArray) => {
    try {
      const toInsert = dataArray.map((tourData, i) => ({
        id: tourData.id || `T-${Date.now()}-${i}`,
        country: tourData.country,
        category: tourData.category || 'Leisure',
        departure_date: tourData.departureDate,
        return_date: tourData.returnDate,
        max_capacity: tourData.maxCapacity || parseInt(tourData.paxCount) || 1,
        status: tourData.status || 'Pending',
        financials: tourData.financials || {},
        pax_info: tourData.paxInfo || [],
        internals: {
          tourCode: tourData.tourCode || '',
          bookingCode: tourData.bookingCode || '',
          paxCount: tourData.paxCount || 1,
          staffName: tourData.staffName || ''
        }
      }));
      const { error } = await supabase.from('travelops_tours').insert(toInsert);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Bulk import tours error:', err);
      throw err;
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
    <TourContext.Provider value={{ tours, addTour, updateTour, deleteTour, bulkImportTours, getStats, loading }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTours = () => useContext(TourContext);
