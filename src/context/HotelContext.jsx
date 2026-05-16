import React, { createContext, useState, useContext, useEffect } from 'react';

const HotelContext = createContext(null);

export const HotelProvider = ({ children }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedHotels = localStorage.getItem('travelops_hotels');
    if (savedHotels) {
      setHotels(JSON.parse(savedHotels));
    } else {
      setHotels([
        {
          id: 'HTL-1001',
          checkIn: '2026-06-01',
          checkOut: '2026-06-05',
          hotelName: 'Grand Hyatt Jakarta',
          region: 'Indonesia',
          confirmationNumber: 'GHJ-889900',
          guestList: 'John Doe, Jane Doe',
          supplierCode: 'AGD',
          supplierName: 'Agoda',
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

      const updatedHotels = hotels.map(htl => {
        if (htl.status !== 'Cancel') {
          const inDate = new Date(htl.checkIn);
          inDate.setHours(0,0,0,0);
          
          const outDate = new Date(htl.checkOut);
          outDate.setHours(0,0,0,0);

          if (outDate < today) {
            return { ...htl, status: 'Past Date' };
          } else if (today >= inDate && today <= outDate) {
            return { ...htl, status: 'Active' };
          } else if (inDate > today) {
            return { ...htl, status: 'Upcoming' };
          }
        }
        return htl;
      });

      const isChanged = JSON.stringify(hotels) !== JSON.stringify(updatedHotels);
      if (isChanged) {
        setHotels(updatedHotels);
      } else {
        localStorage.setItem('travelops_hotels', JSON.stringify(hotels));
      }
    }
  }, [hotels, loading]);

  const addHotel = (data) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const inDate = new Date(data.checkIn);
    inDate.setHours(0,0,0,0);
    const outDate = new Date(data.checkOut);
    outDate.setHours(0,0,0,0);
    
    let initialStatus = 'Upcoming';
    if (outDate < today) initialStatus = 'Past Date';
    else if (today >= inDate && today <= outDate) initialStatus = 'Active';

    const newHotel = {
      ...data,
      id: `HTL-${Date.now()}`,
      status: initialStatus
    };
    setHotels(prev => [newHotel, ...prev]);
  };

  const updateHotel = (id, updatedData) => {
    setHotels(prev => prev.map(htl => htl.id === id ? { ...htl, ...updatedData } : htl));
  };

  const deleteHotel = (id) => {
    setHotels(prev => prev.filter(htl => htl.id !== id));
  };

  return (
    <HotelContext.Provider value={{ hotels, addHotel, updateHotel, deleteHotel, loading }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotels = () => useContext(HotelContext);
