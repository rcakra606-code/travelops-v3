import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TelecomContext = createContext(null);

export const TelecomProvider = ({ children }) => {
  const [telecoms, setTelecoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelecoms();
  }, []);

  const fetchTelecoms = async () => {
    try {
      const { data, error } = await supabase.from('travelops_telecoms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(t => ({
        id: t.id,
        typeProduct: t.type,
        nama: t.nama,
        region: t.region,
        noTelephone: t.no_telp,
        tanggalMulai: t.tanggal_mulai,
        tanggalSelesai: t.tanggal_selesai,
        jumlahDeposit: t.jumlah_deposit,
        noRekening: t.no_rekening,
        bank: t.bank,
        namaRekening: t.nama_rekening,
        estimasiPengambilan: t.estimasi_pengambilan,
        staff: t.staff,
        depositStatus: t.deposit_status,
        tanggalPengambilan: t.tanggal_pengambilan,
        tanggalPengembalian: t.tanggal_pengembalian
      }));
      setTelecoms(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTelecom = async (telecomData) => {
    try {
      const newId = `TEL-${Date.now()}`;
      const { error } = await supabase.from('travelops_telecoms').insert([{
        id: newId,
        type: telecomData.typeProduct,
        nama: telecomData.nama,
        region: telecomData.region,
        no_telp: telecomData.noTelephone,
        tanggal_mulai: telecomData.tanggalMulai,
        tanggal_selesai: telecomData.tanggalSelesai || null,
        jumlah_deposit: telecomData.jumlahDeposit || 0,
        no_rekening: telecomData.noRekening,
        bank: telecomData.bank,
        nama_rekening: telecomData.namaRekening,
        estimasi_pengambilan: telecomData.estimasiPengambilan || null,
        staff: telecomData.staff,
        deposit_status: telecomData.depositStatus,
        tanggal_pengambilan: telecomData.tanggalPengambilan || null,
        tanggal_pengembalian: telecomData.tanggalPengembalian || null
      }]);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTelecom = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.typeProduct !== undefined) dbUpdates.type = updatedData.typeProduct;
      if (updatedData.nama !== undefined) dbUpdates.nama = updatedData.nama;
      if (updatedData.region !== undefined) dbUpdates.region = updatedData.region;
      if (updatedData.noTelephone !== undefined) dbUpdates.no_telp = updatedData.noTelephone;
      if (updatedData.tanggalMulai !== undefined) dbUpdates.tanggal_mulai = updatedData.tanggalMulai;
      if (updatedData.tanggalSelesai !== undefined) dbUpdates.tanggal_selesai = updatedData.tanggalSelesai;
      if (updatedData.jumlahDeposit !== undefined) dbUpdates.jumlah_deposit = updatedData.jumlahDeposit;
      if (updatedData.noRekening !== undefined) dbUpdates.no_rekening = updatedData.noRekening;
      if (updatedData.bank !== undefined) dbUpdates.bank = updatedData.bank;
      if (updatedData.namaRekening !== undefined) dbUpdates.nama_rekening = updatedData.namaRekening;
      if (updatedData.estimasiPengambilan !== undefined) dbUpdates.estimasi_pengambilan = updatedData.estimasiPengambilan;
      if (updatedData.staff !== undefined) dbUpdates.staff = updatedData.staff;
      if (updatedData.depositStatus !== undefined) dbUpdates.deposit_status = updatedData.depositStatus;
      if (updatedData.tanggalPengambilan !== undefined) dbUpdates.tanggal_pengambilan = updatedData.tanggalPengambilan;
      if (updatedData.tanggalPengembalian !== undefined) dbUpdates.tanggal_pengembalian = updatedData.tanggalPengembalian;

      const { error } = await supabase.from('travelops_telecoms').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTelecom = async (id) => {
    try {
      const { error } = await supabase.from('travelops_telecoms').delete().eq('id', id);
      if (error) throw error;
      await fetchTelecoms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TelecomContext.Provider value={{ telecoms, addTelecom, updateTelecom, deleteTelecom, loading }}>
      {children}
    </TelecomContext.Provider>
  );
};

export const useTelecoms = () => useContext(TelecomContext);
