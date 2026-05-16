import React, { createContext, useState, useContext, useEffect } from 'react';

const ProductivityContext = createContext(null);

export const ProductivityProvider = ({ children }) => {
  const [productivityData, setProductivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem('travelops_productivity');
    if (savedData) {
      setProductivityData(JSON.parse(savedData));
    } else {
      // Mock Data
      setProductivityData([
        {
          id: 'PRD-1001',
          date: '2026-05',
          staff: 'Admin TravelOps',
          category: 'Flight',
          type: 'Retail',
          salesAmount: 15000000,
          profitAmount: 1500000,
          remarks: 'Roundtrip CGK-SIN'
        },
        {
          id: 'PRD-1002',
          date: '2026-05',
          staff: 'Admin TravelOps',
          category: 'Hotel',
          type: 'Corporate',
          salesAmount: 25000000,
          profitAmount: 3000000,
          remarks: 'Annual retreat booking'
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('travelops_productivity', JSON.stringify(productivityData));
    }
  }, [productivityData, loading]);

  const addRecord = (data) => {
    const newRecord = {
      ...data,
      id: `PRD-${Date.now()}`,
      salesAmount: Number(data.salesAmount),
      profitAmount: Number(data.profitAmount)
    };
    setProductivityData(prev => [newRecord, ...prev]);
  };

  const updateRecord = (id, updatedData) => {
    setProductivityData(prev => prev.map(rec => rec.id === id ? { 
      ...rec, 
      ...updatedData,
      salesAmount: Number(updatedData.salesAmount || rec.salesAmount),
      profitAmount: Number(updatedData.profitAmount || rec.profitAmount)
    } : rec));
  };

  const deleteRecord = (id) => {
    setProductivityData(prev => prev.filter(rec => rec.id !== id));
  };

  const bulkImport = (dataArray) => {
    const cleaned = dataArray.map((data, index) => ({
      ...data,
      id: data.id || `PRD-${Date.now()}-${index}`,
      salesAmount: Number(data.salesAmount) || 0,
      profitAmount: Number(data.profitAmount) || 0
    }));
    
    // To avoid duplicates, we could filter out existing IDs, or just prepend them.
    // We'll filter out existing IDs just in case they export -> edit -> import
    setProductivityData(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems = cleaned.filter(c => !existingIds.has(c.id));
      return [...newItems, ...prev];
    });
  };

  return (
    <ProductivityContext.Provider value={{ productivityData, addRecord, updateRecord, deleteRecord, bulkImport, loading }}>
      {children}
    </ProductivityContext.Provider>
  );
};

export const useProductivity = () => useContext(ProductivityContext);
