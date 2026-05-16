import React, { createContext, useState, useContext, useEffect } from 'react';

const TelecomContext = createContext(null);

export const TelecomProvider = ({ children }) => {
  const [telecoms, setTelecoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTelecoms = localStorage.getItem('travelops_telecoms');
    if (savedTelecoms) {
      setTelecoms(JSON.parse(savedTelecoms));
    } else {
      setTelecoms([
        {
          id: 'TEL-1001',
          nama: 'Jane Smith',
          noTelephone: '+6281234567890',
          typeProduct: 'SIM Card',
          region: 'Japan',
          tanggalMulai: '2026-05-01',
          tanggalSelesai: '',
          noRekening: '1234567890',
          bank: 'BCA',
          namaRekening: 'Jane Smith',
          estimasiPengambilan: '2026-05-02',
          staff: 'Admin TravelOps',
          depositStatus: 'Sudah',
          jumlahDeposit: '500000',
          tanggalPengambilan: '2026-05-02',
          tanggalPengembalian: ''
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('travelops_telecoms', JSON.stringify(telecoms));
    }
  }, [telecoms, loading]);

  const addTelecom = (data) => {
    const newTelecom = {
      ...data,
      id: `TEL-${Date.now()}`
    };
    setTelecoms(prev => [newTelecom, ...prev]);
  };

  const updateTelecom = (id, updatedData) => {
    setTelecoms(prev => prev.map(tel => tel.id === id ? { ...tel, ...updatedData } : tel));
  };

  const deleteTelecom = (id) => {
    setTelecoms(prev => prev.filter(tel => tel.id !== id));
  };

  return (
    <TelecomContext.Provider value={{ telecoms, addTelecom, updateTelecom, deleteTelecom, loading }}>
      {children}
    </TelecomContext.Provider>
  );
};

export const useTelecoms = () => useContext(TelecomContext);
