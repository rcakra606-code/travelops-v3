import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CruiseContext = createContext(null);

const parseLocalDay = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const parsed = new Date(`${clean}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCruiseDateInput = (val) => {
  if (!val) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const ymdSlash = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdSlash) {
    return `${ymdSlash[1]}-${ymdSlash[2].padStart(2, '0')}-${ymdSlash[3].padStart(2, '0')}`;
  }
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

const isCancelledStatus = (status) => {
  if (!status) return false;
  const normalized = String(status).trim().toLowerCase();
  return normalized === 'cancel' || normalized === 'cancelled' || normalized === 'canceled';
};

const computeCruiseVoyageStatus = (sailingStart, sailingEnd, statusHint) => {
  if (isCancelledStatus(statusHint)) {
    return 'Cancelled';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inDate = parseLocalDay(sailingStart);
  const outDate = parseLocalDay(sailingEnd);

  if (outDate && outDate < today) {
    return 'Past Date';
  }
  if (inDate && outDate && today >= inDate && today <= outDate) {
    return 'Active';
  }
  if (inDate && !outDate) {
    if (inDate < today) return 'Past Date';
    if (inDate.getTime() === today.getTime()) return 'Active';
  }
  return 'Upcoming';
};

const sanitizeParticipants = (list) => {
  if (!list) return [];
  if (Array.isArray(list)) {
    return list.map((p) => String(p || '').trim()).filter(Boolean);
  }
  if (typeof list === 'string') {
    return list
      .split(/[\n,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
};

const pickImportField = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  const rowKeys = Object.keys(row || {});
  for (const target of keys) {
    const lowerTarget = target.toLowerCase();
    const matchedKey = rowKeys.find((rk) => rk.trim().toLowerCase() === lowerTarget);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
};

const loadCruisesFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_cruises')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((c) => {
    const participants = sanitizeParticipants(c.participants);
    const computedStatus = computeCruiseVoyageStatus(c.sailing_start, c.sailing_end, c.status);
    const syncedPaxCount =
      participants.length > 0
        ? 1 + participants.length
        : Math.max(1, Number(c.pax_count) || 1);

    if (computedStatus !== c.status) {
      supabase
        .from('travelops_cruises')
        .update({ status: computedStatus })
        .eq('id', c.id)
        .then(({ error: syncErr }) => {
          if (syncErr) console.error('Cruise status auto-sync error:', syncErr);
        });
    }

    const cleanBookingRef = c.booking_ref || '';

    return {
      id: c.id,
      cruiseBrand: c.cruise_brand || '',
      shipName: c.ship_name || '',
      picName: c.pic_name || '',
      route: c.route || '',
      paxCount: syncedPaxCount,
      sailingStart: c.sailing_start || '',
      sailingEnd: c.sailing_end || '',
      cruiseLine: c.cruise_line || '',
      bookingRef: cleanBookingRef,
      reservationCode: cleanBookingRef,
      finalPaymentDate: c.final_payment_date || '',
      staff: c.staff || '',
      participants,
      phoneNumber: c.phone_number || '',
      email: c.email || '',
      status: computedStatus
    };
  });
};

export const CruiseProvider = ({ children }) => {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCruises = useCallback(async () => {
    try {
      const mapped = await loadCruisesFromDb();
      setCruises(mapped);
    } catch (err) {
      console.error('Fetch cruises error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCruisesFromDb()
      .then((mapped) => {
        if (!cancelled) setCruises(mapped);
      })
      .catch((err) => {
        console.error('Fetch cruises error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addCruise = async (cruiseData) => {
    try {
      const newId = `CRU-${Date.now()}`;
      const cleanParticipants = sanitizeParticipants(cruiseData.participants);
      const computedPax = 1 + cleanParticipants.length;
      const initialStatus = computeCruiseVoyageStatus(
        cruiseData.sailingStart,
        cruiseData.sailingEnd,
        cruiseData.status
      );
      const bookingRefVal = (cruiseData.reservationCode ?? cruiseData.bookingRef ?? '').trim();

      const { error } = await supabase.from('travelops_cruises').insert([
        {
          id: newId,
          cruise_brand: (cruiseData.cruiseBrand || '').trim(),
          ship_name: (cruiseData.shipName || '').trim(),
          pic_name: (cruiseData.picName || '').trim(),
          route: (cruiseData.route || '').trim(),
          pax_count: computedPax,
          sailing_start: cruiseData.sailingStart || null,
          sailing_end: cruiseData.sailingEnd || null,
          cruise_line: (cruiseData.cruiseLine || '').trim(),
          booking_ref: bookingRefVal,
          final_payment_date: cruiseData.finalPaymentDate || null,
          staff: (cruiseData.staff || '').trim(),
          participants: cleanParticipants,
          phone_number: (cruiseData.phoneNumber || '').trim(),
          email: (cruiseData.email || '').trim(),
          status: initialStatus
        }
      ]);
      if (error) throw error;
      await fetchCruises();
      return newId;
    } catch (err) {
      console.error('Add cruise error:', err);
      throw err;
    }
  };

  const updateCruise = async (id, updatedData) => {
    try {
      const existing = cruises.find((c) => c.id === id);
      const dbUpdates = {};

      if (updatedData.cruiseBrand !== undefined) dbUpdates.cruise_brand = (updatedData.cruiseBrand || '').trim();
      if (updatedData.shipName !== undefined) dbUpdates.ship_name = (updatedData.shipName || '').trim();
      if (updatedData.picName !== undefined) dbUpdates.pic_name = (updatedData.picName || '').trim();
      if (updatedData.route !== undefined) dbUpdates.route = (updatedData.route || '').trim();
      if (updatedData.sailingStart !== undefined) dbUpdates.sailing_start = updatedData.sailingStart || null;
      if (updatedData.sailingEnd !== undefined) dbUpdates.sailing_end = updatedData.sailingEnd || null;
      if (updatedData.cruiseLine !== undefined) dbUpdates.cruise_line = (updatedData.cruiseLine || '').trim();
      if (updatedData.bookingRef !== undefined) dbUpdates.booking_ref = (updatedData.bookingRef || '').trim();
      if (updatedData.reservationCode !== undefined) dbUpdates.booking_ref = (updatedData.reservationCode || '').trim();
      if (updatedData.finalPaymentDate !== undefined) {
        dbUpdates.final_payment_date = updatedData.finalPaymentDate || null;
      }
      if (updatedData.staff !== undefined) dbUpdates.staff = (updatedData.staff || '').trim();
      if (updatedData.phoneNumber !== undefined) dbUpdates.phone_number = (updatedData.phoneNumber || '').trim();
      if (updatedData.email !== undefined) dbUpdates.email = (updatedData.email || '').trim();

      if (updatedData.participants !== undefined) {
        const cleanParticipants = sanitizeParticipants(updatedData.participants);
        dbUpdates.participants = cleanParticipants;
        dbUpdates.pax_count = 1 + cleanParticipants.length;
      } else if (updatedData.paxCount !== undefined) {
        dbUpdates.pax_count = Number(updatedData.paxCount) || 1;
      }

      const nextStart =
        updatedData.sailingStart !== undefined ? updatedData.sailingStart : existing?.sailingStart;
      const nextEnd =
        updatedData.sailingEnd !== undefined ? updatedData.sailingEnd : existing?.sailingEnd;

      if (updatedData.status !== undefined) {
        if (isCancelledStatus(updatedData.status)) {
          dbUpdates.status = 'Cancelled';
        } else {
          dbUpdates.status = computeCruiseVoyageStatus(nextStart, nextEnd, 'AUTO');
        }
      } else if (
        (updatedData.sailingStart !== undefined || updatedData.sailingEnd !== undefined) &&
        !isCancelledStatus(existing?.status)
      ) {
        dbUpdates.status = computeCruiseVoyageStatus(nextStart, nextEnd, 'AUTO');
      }

      const { error } = await supabase.from('travelops_cruises').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error('Update cruise error:', err);
      throw err;
    }
  };

  const deleteCruise = async (id) => {
    try {
      const { error } = await supabase.from('travelops_cruises').delete().eq('id', id);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error('Delete cruise error:', err);
      throw err;
    }
  };

  const bulkUpdateCruiseStatus = async (ids, targetStatus) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      if (isCancelledStatus(targetStatus)) {
        const { error } = await supabase
          .from('travelops_cruises')
          .update({ status: 'Cancelled' })
          .in('id', ids);
        if (error) throw error;
      } else {
        await Promise.all(
          ids.map((id) => {
            const target = cruises.find((c) => c.id === id);
            const nextStatus = computeCruiseVoyageStatus(
              target?.sailingStart,
              target?.sailingEnd,
              'AUTO'
            );
            return supabase.from('travelops_cruises').update({ status: nextStatus }).eq('id', id);
          })
        );
      }
      await fetchCruises();
    } catch (err) {
      console.error('Bulk status update error:', err);
      throw err;
    }
  };

  const bulkDeleteCruises = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const { error } = await supabase.from('travelops_cruises').delete().in('id', ids);
      if (error) throw error;
      await fetchCruises();
    } catch (err) {
      console.error('Bulk delete cruises error:', err);
      throw err;
    }
  };

  const bulkImportCruises = async (rows, fallbackStaff = '') => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    try {
      const baseTs = Date.now();
      const payload = rows
        .map((row, index) => {
          const cruiseBrand = pickImportField(row, [
            'Cruise Brand',
            'Brand',
            'cruiseBrand',
            'cruise_brand'
          ]);
          const shipName = pickImportField(row, [
            'Ship Name',
            'Ship',
            'Vessel',
            'shipName',
            'ship_name'
          ]);

          if (!cruiseBrand && !shipName) return null;

          const rawStart =
            row['Sailing Start'] ??
            row['Sailing Date'] ??
            row['Embarkation'] ??
            row['sailingStart'] ??
            row['sailing_start'] ??
            '';
          const rawEnd =
            row['Sailing End'] ??
            row['Docking Date'] ??
            row['Disembarkation'] ??
            row['sailingEnd'] ??
            row['sailing_end'] ??
            '';
          const rawFinalPay =
            row['Final Payment Date'] ??
            row['Final Payment'] ??
            row['Payment Due'] ??
            row['finalPaymentDate'] ??
            row['final_payment_date'] ??
            '';

          const sailingStart = normalizeCruiseDateInput(rawStart);
          const sailingEnd = normalizeCruiseDateInput(rawEnd);
          const finalPaymentDate = normalizeCruiseDateInput(rawFinalPay);

          const route = pickImportField(row, ['Route', 'Itinerary', 'Ports', 'route']);
          const picName =
            pickImportField(row, [
              'Lead Passenger (PIC)',
              'PIC Name',
              'Lead Guest',
              'PIC',
              'picName',
              'pic_name'
            ]) || 'Cruise Guest';
          const rawParticipants = pickImportField(row, [
            'Accompanying Passengers',
            'Participants',
            'Other Guests',
            'participants'
          ]);
          const participants = sanitizeParticipants(rawParticipants).filter(
            (name) => name.toLowerCase() !== picName.toLowerCase()
          );
          const rawPaxCount = Number(
            pickImportField(row, ['Pax Count', 'Pax', 'Total Pax', 'paxCount', 'pax_count'])
          );
          const paxCount =
            participants.length > 0
              ? 1 + participants.length
              : Math.max(1, Number.isFinite(rawPaxCount) && rawPaxCount > 0 ? rawPaxCount : 1);

          const cruiseLine = pickImportField(row, [
            'Cabin / Category',
            'Cabin',
            'Cruise Line',
            'cruiseLine',
            'cruise_line'
          ]);
          const bookingRef = pickImportField(row, [
            'Reservation Code',
            'Booking Ref',
            'Confirmation #',
            'reservationCode',
            'bookingRef',
            'booking_ref'
          ]);
          const phoneNumber = pickImportField(row, [
            'Phone Number',
            'Phone',
            'WhatsApp',
            'phoneNumber',
            'phone_number'
          ]);
          const email = pickImportField(row, ['Email', 'email']);
          const staff =
            pickImportField(row, ['Staff', 'PIC Staff', 'Consultant', 'staff']) || fallbackStaff;
          const rawStatus = pickImportField(row, ['Status', 'status']);

          const status = computeCruiseVoyageStatus(sailingStart, sailingEnd, rawStatus);

          return {
            id: `CRU-${baseTs}-${index + 1}`,
            cruise_brand: cruiseBrand || 'Cruise Line',
            ship_name: shipName || cruiseBrand,
            pic_name: picName,
            route,
            pax_count: paxCount,
            sailing_start: sailingStart || null,
            sailing_end: sailingEnd || null,
            cruise_line: cruiseLine,
            booking_ref: bookingRef,
            final_payment_date: finalPaymentDate || null,
            staff,
            participants,
            phone_number: phoneNumber,
            email,
            status
          };
        })
        .filter(Boolean);

      if (payload.length === 0) {
        throw new Error('No valid cruise rows found. Make sure "Cruise Brand" or "Ship Name" is filled.');
      }

      const { error } = await supabase.from('travelops_cruises').insert(payload);
      if (error) throw error;
      await fetchCruises();
      return payload.length;
    } catch (err) {
      console.error('Bulk import cruises error:', err);
      throw err;
    }
  };

  return (
    <CruiseContext.Provider
      value={{
        cruises,
        loading,
        addCruise,
        updateCruise,
        deleteCruise,
        bulkUpdateCruiseStatus,
        bulkDeleteCruises,
        bulkImportCruises
      }}
    >
      {children}
    </CruiseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCruises = () => useContext(CruiseContext);
