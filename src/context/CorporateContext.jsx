import React, { createContext, useContext, useState, useEffect } from 'react';

const CorporateContext = createContext();

export const useCorporate = () => useContext(CorporateContext);

export const CorporateProvider = ({ children }) => {
  const [corporateAccounts, setCorporateAccounts] = useState(() => {
    const saved = localStorage.getItem('corporateAccounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [corporateSales, setCorporateSales] = useState(() => {
    const saved = localStorage.getItem('corporateSales');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (corporateAccounts.length === 0) {
      setCorporateAccounts([
        {
          id: 'CORP-1001',
          accountCode: 'PT-ABC',
          corporateName: 'PT. ABC Indonesia',
          address: 'Jl. Sudirman No. 1, Jakarta',
          creditLimit: 500000000,
          status: 'Active',
          picName: 'Budi Santoso',
          picPhone: '081234567890',
          picOfficeEmail: 'budi@abc.co.id',
          picPersonalEmail: 'budi.s@gmail.com',
          remarks: 'VIP Client',
          flightFee: { domestic: 50000, international: 150000, reissued: 50000, refund: 100000, void: 0, revalidate: 50000 },
          hotelFee: { domestic: 50000, international: 100000, reissued: 50000, refund: 50000, void: 0, revalidate: 50000 },
          airlinesCode: 'GA-12345',
          detailLink: 'https://crm.travelops.com/abc'
        }
      ]);
    }
    if (corporateSales.length === 0) {
      setCorporateSales([
        {
          id: 'CSLS-1001',
          date: '2026-05',
          accountCode: 'PT-ABC',
          category: 'Flight',
          salesAmount: 25000000,
          profitAmount: 2500000,
          remarks: 'Group trip to Bali'
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('corporateAccounts', JSON.stringify(corporateAccounts));
  }, [corporateAccounts]);

  useEffect(() => {
    localStorage.setItem('corporateSales', JSON.stringify(corporateSales));
  }, [corporateSales]);

  const addAccount = (acc) => {
    const newAcc = { ...acc, id: `CORP-${Date.now()}` };
    setCorporateAccounts(prev => [newAcc, ...prev]);
  };

  const updateAccount = (id, updated) => {
    setCorporateAccounts(prev => prev.map(a => a.id === id ? { ...updated, id } : a));
  };

  const deleteAccount = (id) => {
    setCorporateAccounts(prev => prev.filter(a => a.id !== id));
  };

  const bulkImportAccounts = (dataArray) => {
    const cleaned = dataArray.map((d, i) => ({ ...d, id: d.id || `CORP-${Date.now()}-${i}` }));
    setCorporateAccounts(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems = cleaned.filter(c => !existingIds.has(c.id));
      return [...newItems, ...prev];
    });
  };

  const addSales = (sale) => {
    const newSale = { 
      ...sale, 
      id: `CSLS-${Date.now()}`,
      salesAmount: Number(sale.salesAmount) || 0,
      profitAmount: Number(sale.profitAmount) || 0
    };
    setCorporateSales(prev => [newSale, ...prev]);
  };

  const updateSales = (id, updated) => {
    const cleanUpdated = {
      ...updated,
      salesAmount: Number(updated.salesAmount) || 0,
      profitAmount: Number(updated.profitAmount) || 0
    };
    setCorporateSales(prev => prev.map(s => s.id === id ? { ...cleanUpdated, id } : s));
  };

  const deleteSales = (id) => {
    setCorporateSales(prev => prev.filter(s => s.id !== id));
  };

  const bulkImportSales = (dataArray) => {
    const cleaned = dataArray.map((d, i) => ({ 
      ...d, 
      id: d.id || `CSLS-${Date.now()}-${i}`,
      salesAmount: Number(d.salesAmount) || 0,
      profitAmount: Number(d.profitAmount) || 0 
    }));
    setCorporateSales(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems = cleaned.filter(c => !existingIds.has(c.id));
      return [...newItems, ...prev];
    });
  };

  return (
    <CorporateContext.Provider value={{ 
      corporateAccounts, addAccount, updateAccount, deleteAccount, bulkImportAccounts,
      corporateSales, addSales, updateSales, deleteSales, bulkImportSales,
      loading 
    }}>
      {children}
    </CorporateContext.Provider>
  );
};
