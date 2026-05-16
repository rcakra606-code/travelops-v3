import React, { createContext, useState, useContext, useEffect } from 'react';

const OvertimeContext = createContext(null);

export const OvertimeProvider = ({ children }) => {
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedOvertimes = localStorage.getItem('travelops_overtimes');
    if (savedOvertimes) {
      setOvertimes(JSON.parse(savedOvertimes));
    } else {
      setOvertimes([
        {
          id: 'OT-1001',
          staff: 'Admin TravelOps',
          eventName: 'Weekend tour support',
          date: '2026-05-10',
          hours: 4.5,
          status: 'Pending',
          remarks: 'Supported group from Singapore'
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('travelops_overtimes', JSON.stringify(overtimes));
    }
  }, [overtimes, loading]);

  const addOvertime = (data) => {
    const newOvertime = {
      ...data,
      id: `OT-${Date.now()}`
    };
    setOvertimes(prev => [newOvertime, ...prev]);
  };

  const updateOvertime = (id, updatedData) => {
    setOvertimes(prev => prev.map(ot => ot.id === id ? { ...ot, ...updatedData } : ot));
  };

  const deleteOvertime = (id) => {
    setOvertimes(prev => prev.filter(ot => ot.id !== id));
  };

  return (
    <OvertimeContext.Provider value={{ overtimes, addOvertime, updateOvertime, deleteOvertime, loading }}>
      {children}
    </OvertimeContext.Provider>
  );
};

export const useOvertimes = () => useContext(OvertimeContext);
