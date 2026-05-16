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
        type: t.type,
        nama: t.nama,
        region: t.region,
        noTelp: t.no_telp,
        tanggalMulai: t.tanggal_mulai,
        tanggalSelesai: t.tanggal_selesai,
        jumlahDeposit: t.jumlah_deposit,
        metodeDeposit: t.metode_deposit
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
        type: telecomData.type,
        nama: telecomData.nama,
        region: telecomData.region,
        no_telp: telecomData.noTelp,
        tanggal_mulai: telecomData.tanggalMulai,
        tanggal_selesai: telecomData.tanggalSelesai || null,
        jumlah_deposit: telecomData.jumlahDeposit || 0,
        metode_deposit: telecomData.metodeDeposit
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
      if (updatedData.type !== undefined) dbUpdates.type = updatedData.type;
      if (updatedData.nama !== undefined) dbUpdates.nama = updatedData.nama;
      if (updatedData.region !== undefined) dbUpdates.region = updatedData.region;
      if (updatedData.noTelp !== undefined) dbUpdates.no_telp = updatedData.noTelp;
      if (updatedData.tanggalMulai !== undefined) dbUpdates.tanggal_mulai = updatedData.tanggalMulai;
      if (updatedData.tanggalSelesai !== undefined) dbUpdates.tanggal_selesai = updatedData.tanggalSelesai;
      if (updatedData.jumlahDeposit !== undefined) dbUpdates.jumlah_deposit = updatedData.jumlahDeposit;
      if (updatedData.metodeDeposit !== undefined) dbUpdates.metode_deposit = updatedData.metodeDeposit;

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
