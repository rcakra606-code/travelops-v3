import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { normalizeFinancials, isTourPast } from '../utils/tourUtils';

const TourContext = createContext(null);

const loadToursFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_tours')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  return (data || []).map(t => {
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

    const claimMdr = Boolean(t.claim_mdr !== undefined ? t.claim_mdr : t.internals?.claimMdr);
    const claimMdrAt = t.claim_mdr_at || t.internals?.claimMdrAt || null;
    const claimMdrBy = t.claim_mdr_by || t.internals?.claimMdrBy || '';

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
      claimMdr,
      claimMdrAt,
      claimMdrBy,
      history: t.internals?.history || []
    };
  });
};

export const TourProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    try {
      const mapped = await loadToursFromDb();
      setTours(mapped);
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadToursFromDb()
      .then((mapped) => {
        if (!cancelled) setTours(mapped);
      })
      .catch((err) => {
        console.error('Initial fetch tours error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const channel = supabase
      .channel('travelops_tours_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'travelops_tours' },
        () => {
          if (!cancelled) {
            loadToursFromDb()
              .then((mapped) => {
                if (!cancelled) setTours(mapped);
              })
              .catch((err) => console.error('Realtime sync error:', err));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

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

      const isClaimMdr = Boolean(tourData.claimMdr);
      const claimMdrAt = isClaimMdr ? (tourData.claimMdrAt || new Date().toISOString()) : null;
      const claimMdrBy = isClaimMdr ? (tourData.claimMdrBy || tourData.updatedBy || tourData.staffName || 'Staff') : null;

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
        claim_mdr: isClaimMdr,
        claim_mdr_at: claimMdrAt,
        claim_mdr_by: claimMdrBy,
        internals: {
          ...(tourData.internals || {}),
          depositNumber: fin.depositNumber,
          tourCode: tourData.tourCode,
          bookingCode: tourData.bookingCode,
          paxCount: tourData.paxCount,
          staffName: tourData.staffName,
          claimMdr: isClaimMdr,
          claimMdrAt: claimMdrAt,
          claimMdrBy: claimMdrBy,
          history: [{
            timestamp: new Date().toISOString(),
            user: tourData.updatedBy || tourData.staffName || 'System',
            action: 'Created Record',
            details: `Initial tour record created with DP: ${fin.depositNumber}${isClaimMdr ? ' (Form Claim MDR dicentang)' : ''}`
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
      
      if (updatedData.claimMdr !== undefined) {
        const isChecked = Boolean(updatedData.claimMdr);
        const wasChecked = Boolean(currentTour?.claimMdr);

        // Guard: Role Staff & Manager cannot uncheck MDR checklist!
        if (!isChecked && wasChecked) {
          const userRole = updatedData.userRole || updatedData.role;
          if (userRole && userRole !== 'Admin') {
            throw new Error('Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
          }
        }

        const nowIso = new Date().toISOString();
        dbUpdates.claim_mdr = isChecked;
        dbUpdates.claim_mdr_at = isChecked ? (updatedData.claimMdrAt || nowIso) : null;
        dbUpdates.claim_mdr_by = isChecked ? (updatedData.claimMdrBy || updatedData.updatedBy || 'Staff') : null;
      }

      let actionDetails = 'Record information was modified.';
      if (updatedData.status !== undefined && updatedData.status !== currentTour?.status) {
        actionDetails = `Status changed to ${updatedData.status}`;
      } else if (updatedData.claimMdr !== undefined && updatedData.claimMdr !== currentTour?.claimMdr) {
        actionDetails = updatedData.claimMdr 
          ? `Form Claim MDR divalidasi pada ${new Date().toLocaleString('id-ID')}` 
          : 'Form Claim MDR dibatalkan checklist';
      }

      const existingHistory = currentTour?.history || [];
      const newHistoryLog = {
        timestamp: new Date().toISOString(),
        user: updatedData.updatedBy || 'System',
        action: 'Updated Record',
        details: actionDetails
      };

      let newInternals = { ...(updatedData.internals || currentTour?.internals || {}) };
      if (updatedData.tourCode !== undefined) newInternals.tourCode = updatedData.tourCode;
      if (updatedData.bookingCode !== undefined) newInternals.bookingCode = updatedData.bookingCode;
      if (updatedData.paxCount !== undefined) newInternals.paxCount = updatedData.paxCount;
      if (updatedData.staffName !== undefined) newInternals.staffName = updatedData.staffName;
      if (updatedData.financials?.depositNumber) newInternals.depositNumber = updatedData.financials.depositNumber;
      if (updatedData.claimMdr !== undefined) {
        newInternals.claimMdr = dbUpdates.claim_mdr;
        newInternals.claimMdrAt = dbUpdates.claim_mdr_at;
        newInternals.claimMdrBy = dbUpdates.claim_mdr_by;
      }
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
        const isClaimMdr = Boolean(tourData.claimMdr || tourData.claim_mdr);
        const claimMdrAt = isClaimMdr ? (tourData.claimMdrAt || tourData.claim_mdr_at || new Date().toISOString()) : null;
        const claimMdrBy = isClaimMdr ? (tourData.claimMdrBy || tourData.claim_mdr_by || tourData.staffName || 'Staff') : null;

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
          claim_mdr: isClaimMdr,
          claim_mdr_at: claimMdrAt,
          claim_mdr_by: claimMdrBy,
          internals: {
            tourCode: tourData.tourCode || '',
            bookingCode: tourData.bookingCode || '',
            depositNumber: fin.depositNumber || '',
            paxCount: tourData.paxCount || 1,
            staffName: tourData.staffName || '',
            claimMdr: isClaimMdr,
            claimMdrAt: claimMdrAt,
            claimMdrBy: claimMdrBy
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

// eslint-disable-next-line react-refresh/only-export-components
export const useTours = () => useContext(TourContext);
