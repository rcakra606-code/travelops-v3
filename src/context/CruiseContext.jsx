import React, { createContext, useState, useContext, useEffect } from 'react';

const CruiseContext = createContext(null);

export const CruiseProvider = ({ children }) => {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCruises = localStorage.getItem('travelops_cruises');
    if (savedCruises) {
      setCruises(JSON.parse(savedCruises));
    } else {
      setCruises([
        {
          id: 'CRS-1001',
          cruiseBrand: 'Royal Caribbean',
          shipName: 'Symphony of the Seas',
          sailingStart: '2026-06-01',
          sailingEnd: '2026-06-05',
          route: 'Singapore - Penang - Langkawi',
          picName: 'John Doe',
          participants: ['Jane Doe', 'Jimmy Doe'],
          phoneNumber: '+6281234567890',
          email: 'john@example.com',
          reservationCode: 'RC-98765',
          staff: 'Admin TravelOps',
          status: 'Upcoming'
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedCruises = cruises.map(crs => {
        if (crs.status !== 'Past Date' && crs.status !== 'Cancel' && crs.sailingEnd) {
          const endDate = new Date(crs.sailingEnd);
          if (endDate < today) {
            return { ...crs, status: 'Past Date' };
          }
        }
        
        // Handle initial status if not set
        if (!crs.status) {
          const startDate = new Date(crs.sailingStart);
          return { ...crs, status: startDate >= today ? 'Upcoming' : 'Past Date' };
        }
        
        return crs;
      });

      const isChanged = JSON.stringify(cruises) !== JSON.stringify(updatedCruises);
      if (isChanged) {
        setCruises(updatedCruises);
      } else {
        localStorage.setItem('travelops_cruises', JSON.stringify(cruises));
      }
    }
  }, [cruises, loading]);

  const addCruise = (data) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date(data.sailingStart);
    const newCruise = {
      ...data,
      id: `CRS-${Date.now()}`,
      status: data.status || (startDate >= today ? 'Upcoming' : 'Past Date')
    };
    setCruises(prev => [newCruise, ...prev]);
  };

  const updateCruise = (id, updatedData) => {
    setCruises(prev => prev.map(crs => crs.id === id ? { ...crs, ...updatedData } : crs));
  };

  const deleteCruise = (id) => {
    setCruises(prev => prev.filter(crs => crs.id !== id));
  };

  return (
    <CruiseContext.Provider value={{ cruises, addCruise, updateCruise, deleteCruise, loading }}>
      {children}
    </CruiseContext.Provider>
  );
};

export const useCruises = () => useContext(CruiseContext);
