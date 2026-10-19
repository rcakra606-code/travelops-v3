import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TourContext = createContext(null);

export const normalizeFinancials = (fin = {}) => {
  const basicTourPrice = Number(fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0));
  const discountSupplier = Number(fin.discountSupplier !== undefined ? fin.discountSupplier : (fin.discount || 0));
  const discountBranch = Number(fin.discountBranch || 0);
  const profit = Number(fin.profit || 0);
  const totalSellingPrice = Number(fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (fin.totalOmset !== undefined ? fin.totalOmset : (basicTourPrice - discountSupplier - discountBranch)));
  const totalNettPrice = Number(fin.totalNettPrice !== undefined ? fin.totalNettPrice : (fin.cost !== undefined ? fin.cost : (basicTourPrice - discountSupplier - profit)));
  const depositNumber = fin.depositNumber ? String(fin.depositNumber).trim() : '';
  const depositAmount = Number(fin.depositAmount || 0);
  const invoiceNumber = fin.invoiceNumber ? String(fin.invoiceNumber).trim() : '';
  const sisaPelunasan = totalSellingPrice - depositAmount;

  return {
    ...fin,
    basicTourPrice,
    totalSales: basicTourPrice,
    discountSupplier,
    discountBranch,
    discount: discountSupplier + discountBranch,
    profit,
    totalSellingPrice,
    totalOmset: totalSellingPrice,
    totalNettPrice,
    cost: totalNettPrice,
    depositNumber,
    depositAmount,
    sisaPelunasan,
    invoiceNumber,
    discountLink: fin.discountLink || ''
  };
};

export const parseLocalDateToEndOfDay = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4,})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day, 23, 59, 59, 999);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(trimmed);
  if (isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 23, 59, 59, 999);
};

export const isTourPast = (departureDateStr, returnDateStr) => {
  const now = new Date();
  const depEnd = parseLocalDateToEndOfDay(departureDateStr);
  const retEnd = parseLocalDateToEndOfDay(returnDateStr);

  // If no valid dates are present, do not mark as past
  if (!depEnd && !retEnd) return false;

  // If departure date is today or in the future, tour cannot be completed
  if (depEnd && now <= depEnd) return false;

  // If return date is today or in the future, tour cannot be completed
  if (retEnd && now <= retEnd) return false;

  // Determine latest end date
  const latestEnd = (depEnd && retEnd)
    ? (retEnd > depEnd ? retEnd : depEnd)
    : (retEnd || depEnd);

  return now > latestEnd;
};

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
      
      const mapped = data.map(t => {
        let currentStatus = t.status;
        
        // Auto-detect status based on return_date (or departure_date if no return_date)
        const tourHasEnded = isTourPast(t.departure_date, t.return_date);

        if (tourHasEnded) {
          // Tour has ended: transition to Past Date if not Cancelled
          if (currentStatus !== 'Past Date' && currentStatus !== 'Cancel' && currentStatus !== 'Cancelled') {
            currentStatus = 'Past Date';
            // Background update to database
            supabase.from('travelops_tours').update({ status: 'Past Date' }).eq('id', t.id).then();
          }
        } else {
          // Tour is still on-going or in the future:
          // If status in database was erroneously recorded as "Past Date", recover to "Confirm"
          if (currentStatus === 'Past Date') {
            currentStatus = 'Confirm';
            supabase.from('travelops_tours').update({ status: 'Confirm' }).eq('id', t.id).then();
          }
        }

        const fin = normalizeFinancials(t.financials || {});
        // Also fallback to internals if depositNumber was saved there
        if (!fin.depositNumber && t.internals?.depositNumber) {
          fin.depositNumber = String(t.internals.depositNumber).trim();
        }

        return {
          id: t.id,
          country: t.country,
          category: t.category,
          departureDate: t.departure_date,
          returnDate: t.return_date,
          maxCapacity: t.max_capacity,
          status: currentStatus,
          financials: fin,
          depositNumber: fin.depositNumber,
          depositAmount: fin.depositAmount,
          sisaPelunasan: fin.sisaPelunasan,
          invoiceNumber: fin.invoiceNumber,
          totalOmset: fin.totalSellingPrice,
          totalSellingPrice: fin.totalSellingPrice,
          totalNettPrice: fin.totalNettPrice,
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
      const fin = normalizeFinancials(tourData.financials || {});
      if (!fin.depositNumber) {
        throw new Error('Nomor DP (Deposit Number) wajib terinput pada database.');
      }

      let initialStatus = tourData.status || 'Pending';
      if (initialStatus !== 'Cancel' && initialStatus !== 'Cancelled') {
        if (isTourPast(tourData.departureDate, tourData.returnDate)) {
          initialStatus = 'Past Date';
        }
      }

      const newId = tourData.id || `T-${Date.now()}`;
      const { error } = await supabase.from('travelops_tours').insert([{
        id: newId,
        country: tourData.country,
        category: tourData.category,
        departure_date: tourData.departureDate,
        return_date: tourData.returnDate,
        max_capacity: tourData.maxCapacity,
        status: initialStatus,
        financials: fin,
        pax_info: tourData.paxInfo,
        internals: {
          ...(tourData.internals || {}),
          depositNumber: fin.depositNumber,
          tourCode: tourData.tourCode,
          bookingCode: tourData.bookingCode,
          paxCount: tourData.paxCount,
          staffName: tourData.staffName,
          history: [{
            timestamp: new Date().toISOString(),
            user: tourData.updatedBy || tourData.staffName || 'System',
            action: 'Created Record',
            details: `Initial tour record created with DP: ${fin.depositNumber}`
          }]
        }
      }]);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Add tour error:', err);
      throw err;
    }
  };

  const updateTour = async (id, updatedData) => {
    try {
      const currentTour = tours.find(t => t.id === id);
      const dbUpdates = {};
      if (updatedData.country !== undefined) dbUpdates.country = updatedData.country;
      if (updatedData.category !== undefined) dbUpdates.category = updatedData.category;
      if (updatedData.departureDate !== undefined) dbUpdates.departure_date = updatedData.departureDate;
      if (updatedData.returnDate !== undefined) dbUpdates.return_date = updatedData.returnDate;
      if (updatedData.maxCapacity !== undefined) dbUpdates.max_capacity = updatedData.maxCapacity;
      
      let nextStatus = updatedData.status !== undefined ? updatedData.status : currentTour?.status;
      if (nextStatus !== 'Cancel' && nextStatus !== 'Cancelled') {
        const dep = updatedData.departureDate !== undefined ? updatedData.departureDate : currentTour?.departureDate;
        const ret = updatedData.returnDate !== undefined ? updatedData.returnDate : currentTour?.returnDate;
        if (isTourPast(dep, ret)) {
          nextStatus = 'Past Date';
        } else if (nextStatus === 'Past Date') {
          nextStatus = 'Confirm';
        }
      }
      if (nextStatus !== undefined) dbUpdates.status = nextStatus;

      if (updatedData.financials !== undefined) {
        const fin = normalizeFinancials(updatedData.financials);
        dbUpdates.financials = fin;
      }
      if (updatedData.paxInfo !== undefined) dbUpdates.pax_info = updatedData.paxInfo;
      
      const existingHistory = currentTour?.history || [];
      
      const newHistoryLog = {
        timestamp: new Date().toISOString(),
        user: updatedData.updatedBy || 'System',
        action: 'Updated Record',
        details: updatedData.status !== currentTour?.status 
          ? `Status changed to ${updatedData.status}`
          : 'Record information was modified.'
      };

      let newInternals = { ...(updatedData.internals || currentTour?.internals || {}) };
      if (updatedData.tourCode !== undefined) newInternals.tourCode = updatedData.tourCode;
      if (updatedData.bookingCode !== undefined) newInternals.bookingCode = updatedData.bookingCode;
      if (updatedData.paxCount !== undefined) newInternals.paxCount = updatedData.paxCount;
      if (updatedData.staffName !== undefined) newInternals.staffName = updatedData.staffName;
      if (updatedData.financials?.depositNumber) newInternals.depositNumber = updatedData.financials.depositNumber;
      newInternals.history = [newHistoryLog, ...existingHistory];
      dbUpdates.internals = newInternals;

      const { error } = await supabase.from('travelops_tours').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchTours();
    } catch (err) {
      console.error('Update tour error:', err);
      throw err;
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
      const toInsert = dataArray.map((tourData, i) => {
        const fin = normalizeFinancials(tourData.financials || {});
        return {
          id: tourData.id || `T-${Date.now()}-${i}`,
          country: tourData.country,
          category: tourData.category || 'Leisure',
          departure_date: tourData.departureDate,
          return_date: tourData.returnDate,
          max_capacity: tourData.maxCapacity || parseInt(tourData.paxCount) || 1,
          status: tourData.status || 'Pending',
          financials: fin,
          pax_info: tourData.paxInfo || [],
          internals: {
            tourCode: tourData.tourCode || '',
            bookingCode: tourData.bookingCode || '',
            depositNumber: fin.depositNumber || '',
            paxCount: tourData.paxCount || 1,
            staffName: tourData.staffName || ''
          }
        };
      });
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
