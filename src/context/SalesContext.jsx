import React, { createContext, useContext, useState, useEffect } from 'react';

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('travelops_sales');
    if (saved) {
      setSalesData(JSON.parse(saved));
    } else {
      // Default dummy data
      const defaultSales = [
        { id: '1', staffName: 'ANGELA LEONY SEKEWAEL', targetSales: 1568107931, targetProfit: 77938111, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '2', staffName: 'CHRISTOPHER CALVIN INDRA JAYA', targetSales: 1525837666, targetProfit: 76340174, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '3', staffName: 'SITI YASMIN SALSABILA SUNANTOPUTRI', targetSales: 1504702534, targetProfit: 75541205, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '4', staffName: 'EMILIA YUNINDA', targetSales: 1504702534, targetProfit: 75541205, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '5', staffName: 'ENRICO DASTIN', targetSales: 1504702534, targetProfit: 75541205, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '6', staffName: 'MARIA ANGELA STEPHANIE', targetSales: 1885134914, targetProfit: 89922639, achievementSales: 0, achievementProfit: 0, period: '2026-05' },
        { id: '7', staffName: 'TJONG MARIA VALENTINA', targetSales: 1525837666, targetProfit: 76340174, achievementSales: 0, achievementProfit: 0, period: '2026-05' }
      ];
      setSalesData(defaultSales);
      localStorage.setItem('travelops_sales', JSON.stringify(defaultSales));
    }
  }, []);

  const saveSales = (newData) => {
    setSalesData(newData);
    localStorage.setItem('travelops_sales', JSON.stringify(newData));
  };

  const addSale = (sale) => {
    const newSale = { ...sale, id: Date.now().toString() };
    saveSales([...salesData, newSale]);
  };

  const updateSale = (id, updatedSale) => {
    saveSales(salesData.map(s => s.id === id ? { ...s, ...updatedSale } : s));
  };

  const deleteSale = (id) => {
    saveSales(salesData.filter(s => s.id !== id));
  };

  return (
    <SalesContext.Provider value={{ salesData, addSale, updateSale, deleteSale }}>
      {children}
    </SalesContext.Provider>
  );
};
