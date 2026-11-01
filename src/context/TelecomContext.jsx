import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const TelecomContext = createContext(null);

const toLocalTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeTelDateInput = (val) => {
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

const parseDepositNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) && val >= 0 ? val : 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

const normalizeDepositStatus = (rawStatus, depositAmount = 0) => {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (['refunded', 'returned', 'dikembalikan', 'selesai refund'].includes(s)) {
    return 'Refunded';
  }
  if (['sudah', 'held', 'paid', 'collected', 'deposit held', 'lunas'].includes(s)) {
    return 'Sudah';
  }
  if (['none', 'no deposit', 'tanpa deposit', 'n/a', '-'].includes(s)) {
    return 'None';
  }
  if (['belum', 'pending', 'unpaid', 'pending deposit'].includes(s)) {
    return depositAmount > 0 ? 'Belum' : 'Belum';
  }
  return depositAmount > 0 ? 'Belum' : 'None';
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
    if (
      matchedKey &&
      row[matchedKey] !== undefined &&
      row[matchedKey] !== null &&
      String(row[matchedKey]).trim() !== ''
    ) {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
};

const loadTelecomsFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_telecoms')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((t) => {
    const amount = Number(t.jumlah_deposit) || 0;
    const rawDepStatus = t.deposit_status || (amount > 0 ? 'Belum' : 'None');
    return {
      id: t.id,
      typeProduct: t.type || '',
      nama: t.nama || '',
      region: t.region || '',
      noTelephone: t.no_telp || '',
      tanggalMulai: t.tanggal_mulai || '',
      tanggalSelesai: t.tanggal_selesai || '',
      jumlahDeposit: amount,
      noRekening: t.no_rekening || '',
      bank: t.bank || '',
      namaRekening: t.nama_rekening || '',
      estimasiPengambilan: t.estimasi_pengambilan || '',
      staff: t.staff || '',
      depositStatus: rawDepStatus,
      tanggalPengambilan: t.tanggal_pengambilan || '',
      tanggalPengembalian: t.tanggal_pengembalian || ''
    };
  });
};

export const TelecomProvider = ({ children }) => {
  const [telecoms, setTelecoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTelecoms = useCallback(async () => {
    try {
      const mapped = await loadTelecomsFromDb();
      setTelecoms(mapped);
    } catch (err) {
      console.error('Fetch telecoms error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadTelecomsFromDb()
      .then((mapped) => {
        if (!cancelled) setTelecoms(mapped);
      })
      .catch((err) => {
        console.error('Fetch telecoms error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addTelecom = async (telecomData) => {
    try {
      const newId = `TEL-${Date.now()}`;
      const depositAmt = parseDepositNumber(telecomData.jumlahDeposit);
      const depositStat =
        telecomData.depositStatus || (depositAmt > 0 ? 'Belum' : 'None');

      const { error } = await supabase.from('travelops_telecoms').insert([
        {
          id: newId,
          type: (telecomData.typeProduct || 'eSIM').trim(),
          nama: (telecomData.nama || '').trim(),
          region: (telecomData.region || '').trim(),
          no_telp: (telecomData.noTelephone || '').trim(),
          tanggal_mulai: telecomData.tanggalMulai || null,
          tanggal_selesai: telecomData.tanggalSelesai || null,
          jumlah_deposit: depositAmt,
          no_rekening: (telecomData.noRekening || '').trim(),
          bank: (telecomData.bank || '').trim(),
          nama_rekening: (telecomData.namaRekening || '').trim(),
          estimasi_pengambilan: telecomData.estimasiPengambilan || null,
          staff: (telecomData.staff || '').trim(),
          deposit_status: depositStat,
          tanggal_pengambilan: telecomData.tanggalPengambilan || null,
          tanggal_pengembalian: telecomData.tanggalPengembalian || null
        }
      ]);
      if (error) throw error;
      await fetchTelecoms();
      return newId;
    } catch (err) {
      console.error('Add telecom error:', err);
      throw err;
    }
  };

  const updateTelecom = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.typeProduct !== undefined) {
        dbUpdates.type = (updatedData.typeProduct || '').trim();
      }
      if (updatedData.nama !== undefined) {
        dbUpdates.nama = (updatedData.nama || '').trim();
      }
      if (updatedData.region !== undefined) {
        dbUpdates.region = (updatedData.region || '').trim();
      }
      if (updatedData.noTelephone !== undefined) {
        dbUpdates.no_telp = (updatedData.noTelephone || '').trim();
      }
      if (updatedData.tanggalMulai !== undefined) {
        dbUpdates.tanggal_mulai = updatedData.tanggalMulai || null;
      }
      if (updatedData.tanggalSelesai !== undefined) {
        dbUpdates.tanggal_selesai = updatedData.tanggalSelesai || null;
      }
      if (updatedData.jumlahDeposit !== undefined) {
        dbUpdates.jumlah_deposit = parseDepositNumber(updatedData.jumlahDeposit);
      }
      if (updatedData.noRekening !== undefined) {
        dbUpdates.no_rekening = (updatedData.noRekening || '').trim();
      }
      if (updatedData.bank !== undefined) {
        dbUpdates.bank = (updatedData.bank || '').trim();
      }
      if (updatedData.namaRekening !== undefined) {
        dbUpdates.nama_rekening = (updatedData.namaRekening || '').trim();
      }
      if (updatedData.estimasiPengambilan !== undefined) {
        dbUpdates.estimasi_pengambilan = updatedData.estimasiPengambilan || null;
      }
      if (updatedData.staff !== undefined) {
        dbUpdates.staff = (updatedData.staff || '').trim();
      }
      if (updatedData.depositStatus !== undefined) {
        dbUpdates.deposit_status = updatedData.depositStatus || 'None';
      }
      if (updatedData.tanggalPengambilan !== undefined) {
        dbUpdates.tanggal_pengambilan = updatedData.tanggalPengambilan || null;
      }
      if (updatedData.tanggalPengembalian !== undefined) {
        dbUpdates.tanggal_pengembalian = updatedData.tanggalPengembalian || null;
      }

      const { error } = await supabase
        .from('travelops_telecoms')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error('Update telecom error:', err);
      throw err;
    }
  };

  const deleteTelecom = async (id) => {
    try {
      const { error } = await supabase
        .from('travelops_telecoms')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error('Delete telecom error:', err);
      throw err;
    }
  };

  const bulkUpdateTelecomWorkflow = async (ids, action) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const todayStr = toLocalTodayStr();
      await Promise.all(
        ids.map((id) => {
          const existing = telecoms.find((t) => t.id === id);
          let patch = {};
          if (action === 'pickup') {
            patch = {
              tanggal_pengambilan: existing?.tanggalPengambilan || todayStr
            };
          } else if (action === 'return') {
            patch = {
              tanggal_pengambilan:
                existing?.tanggalPengambilan || existing?.tanggalMulai || todayStr,
              tanggal_pengembalian: existing?.tanggalPengembalian || todayStr
            };
          } else if (action === 'deposit_refunded') {
            patch = {
              deposit_status: 'Refunded'
            };
          } else if (action === 'deposit_held') {
            patch = {
              deposit_status: 'Sudah'
            };
          }
          return supabase.from('travelops_telecoms').update(patch).eq('id', id);
        })
      );
      await fetchTelecoms();
    } catch (err) {
      console.error('Bulk telecom workflow update error:', err);
      throw err;
    }
  };

  const bulkDeleteTelecoms = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const { error } = await supabase
        .from('travelops_telecoms')
        .delete()
        .in('id', ids);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error('Bulk delete telecoms error:', err);
      throw err;
    }
  };

  const bulkImportTelecoms = async (rows, fallbackStaff = '') => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    try {
      const baseTs = Date.now();
      const todayStr = toLocalTodayStr();

      const payload = rows
        .map((row, index) => {
          const nama = pickImportField(row, [
            'Traveler Name',
            'Guest Name',
            'Customer Name',
            'Nama',
            'nama'
          ]);
          if (!nama) return null;

          const noTelephone = pickImportField(row, [
            'Phone / WhatsApp',
            'Phone Number',
            'No. Telephone',
            'Phone',
            'WhatsApp',
            'noTelephone',
            'no_telp'
          ]);
          const typeProduct =
            pickImportField(row, [
              'Product Type',
              'Type Product',
              'Product',
              'Type',
              'typeProduct',
              'type'
            ]) || 'eSIM';
          const region =
            pickImportField(row, [
              'Coverage Region',
              'Region',
              'Country',
              'Destination',
              'region'
            ]) || 'Global Multi-Country';

          const rawStart =
            row['Start Date'] ??
            row['Roaming Start'] ??
            row['Tanggal Mulai'] ??
            row['tanggalMulai'] ??
            row['tanggal_mulai'] ??
            '';
          const rawEnd =
            row['End Date'] ??
            row['Roaming End'] ??
            row['Tanggal Selesai'] ??
            row['tanggalSelesai'] ??
            row['tanggal_selesai'] ??
            '';
          const rawEstPickup =
            row['Est. Pickup Date'] ??
            row['Estimasi Pengambilan'] ??
            row['estimasiPengambilan'] ??
            row['estimasi_pengambilan'] ??
            '';
          const rawPickup =
            row['Pickup Date'] ??
            row['Tanggal Pengambilan'] ??
            row['tanggalPengambilan'] ??
            row['tanggal_pengambilan'] ??
            '';
          const rawReturn =
            row['Return Date'] ??
            row['Tanggal Pengembalian'] ??
            row['tanggalPengembalian'] ??
            row['tanggal_pengembalian'] ??
            '';

          const tanggalMulai = normalizeTelDateInput(rawStart) || todayStr;
          const tanggalSelesai = normalizeTelDateInput(rawEnd);
          const estimasiPengambilan = normalizeTelDateInput(rawEstPickup);
          const tanggalPengambilan = normalizeTelDateInput(rawPickup);
          const tanggalPengembalian = normalizeTelDateInput(rawReturn);

          const jumlahDeposit = parseDepositNumber(
            row['Deposit Amount'] ??
              row['Jumlah Deposit'] ??
              row['Deposit'] ??
              row['jumlahDeposit'] ??
              row['jumlah_deposit'] ??
              0
          );
          const rawDepStatus = pickImportField(row, [
            'Deposit Status',
            'depositStatus',
            'deposit_status'
          ]);
          const depositStatus = normalizeDepositStatus(rawDepStatus, jumlahDeposit);

          const bank = pickImportField(row, ['Bank', 'Refund Bank', 'bank']);
          const noRekening = pickImportField(row, [
            'Account Number',
            'No. Rekening',
            'No Rekening',
            'noRekening',
            'no_rekening'
          ]);
          const namaRekening = pickImportField(row, [
            'Account Holder',
            'Nama Rekening',
            'namaRekening',
            'nama_rekening'
          ]);
          const staff =
            pickImportField(row, ['Staff', 'Consultant', 'PIC Staff', 'staff']) ||
            fallbackStaff;

          return {
            id: `TEL-${baseTs}-${index + 1}`,
            type: typeProduct,
            nama,
            region,
            no_telp: noTelephone,
            tanggal_mulai: tanggalMulai || null,
            tanggal_selesai: tanggalSelesai || null,
            jumlah_deposit: jumlahDeposit,
            no_rekening: noRekening,
            bank,
            nama_rekening: namaRekening,
            estimasi_pengambilan: estimasiPengambilan || null,
            staff,
            deposit_status: depositStatus,
            tanggal_pengambilan: tanggalPengambilan || null,
            tanggal_pengembalian: tanggalPengembalian || null
          };
        })
        .filter(Boolean);

      if (payload.length === 0) {
        throw new Error(
          'No valid Travel SIM / WiFi rows found. Make sure "Traveler Name" is filled.'
        );
      }

      const { error } = await supabase.from('travelops_telecoms').insert(payload);
      if (error) throw error;
      await fetchTelecoms();
      return payload.length;
    } catch (err) {
      console.error('Bulk import telecoms error:', err);
      throw err;
    }
  };

  return (
    <TelecomContext.Provider
      value={{
        telecoms,
        loading,
        addTelecom,
        updateTelecom,
        deleteTelecom,
        bulkUpdateTelecomWorkflow,
        bulkDeleteTelecoms,
        bulkImportTelecoms
      }}
    >
      {children}
    </TelecomContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTelecoms = () => useContext(TelecomContext);
