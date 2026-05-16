import React, { createContext, useState, useContext, useEffect } from 'react';

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTours = localStorage.getItem('travelops_tours');
    if (savedTours) {
      setTours(JSON.parse(savedTours));
    } else {
      // Mock Data
      setTours([
        {
          id: 'T-1001',
          tourCode: 'EU-2024-01',
          bookingCode: 'BK-001',
          departureDate: '2024-12-01',
          returnDate: '2024-12-15',
          country: 'France',
          paxCount: 2,
          staffName: 'Admin TravelOps',
          status: 'Confirm',
          paxInfo: [
            { id: 1, title: 'Mr', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890', sellingPrice: 50000000, profit: 5000000, discount: 1000000, notes: 'VIP' },
            { id: 2, title: 'Mrs', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '0987654321', sellingPrice: 50000000, profit: 5000000, discount: 0, notes: '' }
          ],
          financials: {
            totalSales: 100000000,
            discount: 1000000,
            profit: 10000000,
            totalOmset: 99000000,
            cost: 89000000,
            depositNumber: 'DEP-001',
            invoiceNumber: 'INV-001',
            discountLink: ''
          }
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      // Check for past dates
      const updatedTours = tours.map(tour => {
        if (tour.status !== 'Past Date' && tour.status !== 'Cancel') {
          const returnDate = new Date(tour.returnDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
          
          if (returnDate < today) {
            return { ...tour, status: 'Past Date' };
          }
        }
        return tour;
      });
      
      const isChanged = JSON.stringify(tours) !== JSON.stringify(updatedTours);
      if (isChanged) {
        setTours(updatedTours);
      }
      localStorage.setItem('travelops_tours', JSON.stringify(isChanged ? updatedTours : tours));
    }
  }, [tours, loading]);

  const addTour = (tourData) => {
    const newTour = {
      ...tourData,
      id: `T-${Date.now()}` // Generate unique ID
    };
    setTours(prev => [newTour, ...prev]);
  };

  const updateTour = (id, updatedData) => {
    setTours(prev => prev.map(tour => tour.id === id ? { ...tour, ...updatedData } : tour));
  };

  const deleteTour = (id) => {
    setTours(prev => prev.filter(tour => tour.id !== id));
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
    <TourContext.Provider value={{ tours, addTour, updateTour, deleteTour, getStats, loading }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTours = () => useContext(TourContext);
