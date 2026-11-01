import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const HotelContext = createContext(null);

const parseLocalDay = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const parsed = new Date(`${clean}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeHotelDateInput = (val) => {
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
  // Support YYYY/MM/DD
  const ymdSlash = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdSlash) {
    return `${ymdSlash[1]}-${ymdSlash[2].padStart(2, '0')}-${ymdSlash[3].padStart(2, '0')}`;
  }
  // Support DD/MM/YYYY or DD-MM-YYYY
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

const computeHotelStayStatus = (checkIn, checkOut, statusHint) => {
  if (isCancelledStatus(statusHint)) {
    return 'Cancelled';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inDate = parseLocalDay(checkIn);
  const outDate = parseLocalDay(checkOut);

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

const pickImportField = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  // Fallback case-insensitive match
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

const loadHotelsFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_hotels')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((h) => {
    const computedStatus = computeHotelStayStatus(h.check_in, h.check_out, h.status);

    if (computedStatus !== h.status) {
      supabase
        .from('travelops_hotels')
        .update({ status: computedStatus })
        .eq('id', h.id)
        .then(({ error: syncErr }) => {
          if (syncErr) console.error('Hotel status auto-sync error:', syncErr);
        });
    }

    return {
      id: h.id,
      hotelName: h.hotel_name || '',
      guestList: h.guest_list || '',
      checkIn: h.check_in || '',
      checkOut: h.check_out || '',
      roomType: h.room_type || '',
      region: h.region || '',
      status: computedStatus,
      confirmationNumber: h.confirmation_number || '',
      supplierCode: h.supplier_code || '',
      supplierName: h.supplier_name || '',
      staff: h.staff || ''
    };
  });
};

export const HotelProvider = ({ children }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHotels = useCallback(async () => {
    try {
      const mapped = await loadHotelsFromDb();
      setHotels(mapped);
    } catch (err) {
      console.error('Fetch hotels error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadHotelsFromDb()
      .then((mapped) => {
        if (!cancelled) setHotels(mapped);
      })
      .catch((err) => {
        console.error('Fetch hotels error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addHotel = async (data) => {
    try {
      const newId = `HTL-${Date.now()}`;
      const initialStatus = computeHotelStayStatus(data.checkIn, data.checkOut, data.status);

      const { error } = await supabase.from('travelops_hotels').insert([
        {
          id: newId,
          hotel_name: (data.hotelName || '').trim(),
          guest_list: (data.guestList || '').trim(),
          check_in: data.checkIn || null,
          check_out: data.checkOut || null,
          room_type: (data.roomType || '').trim(),
          region: (data.region || '').trim(),
          status: initialStatus,
          confirmation_number: (data.confirmationNumber || '').trim(),
          supplier_code: (data.supplierCode || '').trim(),
          supplier_name: (data.supplierName || '').trim(),
          staff: (data.staff || '').trim()
        }
      ]);
      if (error) throw error;
      await fetchHotels();
      return newId;
    } catch (err) {
      console.error('Add hotel error:', err);
      throw err;
    }
  };

  const updateHotel = async (id, updatedData) => {
    try {
      const existing = hotels.find((h) => h.id === id);
      const dbUpdates = {};

      if (updatedData.hotelName !== undefined) dbUpdates.hotel_name = (updatedData.hotelName || '').trim();
      if (updatedData.guestList !== undefined) dbUpdates.guest_list = (updatedData.guestList || '').trim();
      if (updatedData.checkIn !== undefined) dbUpdates.check_in = updatedData.checkIn || null;
      if (updatedData.checkOut !== undefined) dbUpdates.check_out = updatedData.checkOut || null;
      if (updatedData.roomType !== undefined) dbUpdates.room_type = (updatedData.roomType || '').trim();
      if (updatedData.region !== undefined) dbUpdates.region = (updatedData.region || '').trim();
      if (updatedData.confirmationNumber !== undefined) {
        dbUpdates.confirmation_number = (updatedData.confirmationNumber || '').trim();
      }
      if (updatedData.supplierCode !== undefined) dbUpdates.supplier_code = (updatedData.supplierCode || '').trim();
      if (updatedData.supplierName !== undefined) dbUpdates.supplier_name = (updatedData.supplierName || '').trim();
      if (updatedData.staff !== undefined) dbUpdates.staff = (updatedData.staff || '').trim();

      const nextCheckIn = updatedData.checkIn !== undefined ? updatedData.checkIn : existing?.checkIn;
      const nextCheckOut = updatedData.checkOut !== undefined ? updatedData.checkOut : existing?.checkOut;

      if (updatedData.status !== undefined) {
        if (isCancelledStatus(updatedData.status)) {
          dbUpdates.status = 'Cancelled';
        } else {
          dbUpdates.status = computeHotelStayStatus(nextCheckIn, nextCheckOut, 'AUTO');
        }
      } else if (
        (updatedData.checkIn !== undefined || updatedData.checkOut !== undefined) &&
        !isCancelledStatus(existing?.status)
      ) {
        dbUpdates.status = computeHotelStayStatus(nextCheckIn, nextCheckOut, 'AUTO');
      }

      const { error } = await supabase.from('travelops_hotels').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error('Update hotel error:', err);
      throw err;
    }
  };

  const deleteHotel = async (id) => {
    try {
      const { error } = await supabase.from('travelops_hotels').delete().eq('id', id);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error('Delete hotel error:', err);
      throw err;
    }
  };

  const bulkUpdateHotelStatus = async (ids, targetStatus) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      if (isCancelledStatus(targetStatus)) {
        const { error } = await supabase
          .from('travelops_hotels')
          .update({ status: 'Cancelled' })
          .in('id', ids);
        if (error) throw error;
      } else {
        await Promise.all(
          ids.map((id) => {
            const target = hotels.find((h) => h.id === id);
            const nextStatus = computeHotelStayStatus(target?.checkIn, target?.checkOut, 'AUTO');
            return supabase.from('travelops_hotels').update({ status: nextStatus }).eq('id', id);
          })
        );
      }
      await fetchHotels();
    } catch (err) {
      console.error('Bulk status update error:', err);
      throw err;
    }
  };

  const bulkDeleteHotels = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const { error } = await supabase.from('travelops_hotels').delete().in('id', ids);
      if (error) throw error;
      await fetchHotels();
    } catch (err) {
      console.error('Bulk delete hotels error:', err);
      throw err;
    }
  };

  const bulkImportHotels = async (rows, fallbackStaff = '') => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    try {
      const baseTs = Date.now();
      const payload = rows
        .map((row, index) => {
          const hotelName = pickImportField(row, ['Hotel Name', 'Hotel', 'Property', 'hotelName', 'hotel_name']);
          const rawCheckIn =
            row['Check In'] ?? row['Check-In'] ?? row['checkIn'] ?? row['check_in'] ?? '';
          const rawCheckOut =
            row['Check Out'] ?? row['Check-Out'] ?? row['checkOut'] ?? row['check_out'] ?? '';
          const checkIn = normalizeHotelDateInput(rawCheckIn);
          const checkOut = normalizeHotelDateInput(rawCheckOut);

          if (!hotelName) return null;

          const roomType = pickImportField(row, ['Room Type', 'Room', 'roomType', 'room_type']);
          const region = pickImportField(row, ['Region', 'Country', 'Destination', 'region']);
          const confirmationNumber = pickImportField(row, [
            'Confirmation Number',
            'Confirmation #',
            'Conf #',
            'Booking Ref',
            'confirmationNumber',
            'confirmation_number'
          ]);
          const guestList = pickImportField(row, ['Guest List', 'Guests', 'Guest Names', 'guestList', 'guest_list']);
          const supplierName = pickImportField(row, ['Supplier Name', 'Supplier', 'Bedbank', 'supplierName', 'supplier_name']);
          const supplierCode = pickImportField(row, ['Supplier Code', 'Vendor Code', 'supplierCode', 'supplier_code']);
          const staff = pickImportField(row, ['Staff', 'PIC Staff', 'Consultant', 'staff']) || fallbackStaff;
          const rawStatus = pickImportField(row, ['Status', 'status']);

          const status = computeHotelStayStatus(checkIn, checkOut, rawStatus);

          return {
            id: `HTL-${baseTs}-${index + 1}`,
            hotel_name: hotelName,
            guest_list: guestList,
            check_in: checkIn || null,
            check_out: checkOut || null,
            room_type: roomType,
            region: region || 'Unknown',
            status,
            confirmation_number: confirmationNumber,
            supplier_code: supplierCode,
            supplier_name: supplierName,
            staff
          };
        })
        .filter(Boolean);

      if (payload.length === 0) {
        throw new Error('No valid hotel rows found. Make sure "Hotel Name" is filled.');
      }

      const { error } = await supabase.from('travelops_hotels').insert(payload);
      if (error) throw error;
      await fetchHotels();
      return payload.length;
    } catch (err) {
      console.error('Bulk import hotels error:', err);
      throw err;
    }
  };

  return (
    <HotelContext.Provider
      value={{
        hotels,
        loading,
        addHotel,
        updateHotel,
        deleteHotel,
        bulkUpdateHotelStatus,
        bulkDeleteHotels,
        bulkImportHotels
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHotels = () => useContext(HotelContext);
