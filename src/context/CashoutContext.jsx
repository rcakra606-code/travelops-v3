import React, { createContext, useState, useEffect } from 'react';

export const CashoutContext = createContext();

const DUMMY_CASHOUTS = [
  {
    id: 'c1',
    requestDate: '2026-05-10',
    staffName: 'John Doe',
    amount: 1500000,
    custCode: 'CORP-ABC',
    purpose: 'Client Meeting Dinner',
    ticketId: 'TRV-1023',
    completionDate: '2026-05-12',
    status: 'Completed'
  },
  {
    id: 'c2',
    requestDate: '2026-05-15',
    staffName: 'Jane Smith',
    amount: 500000,
    custCode: 'CORP-XYZ',
    purpose: 'Taxi for visa lodgement',
    ticketId: 'TRV-1045',
    completionDate: '',
    status: 'Pending'
  },
  {
    id: 'c3',
    requestDate: '2026-05-16',
    staffName: 'Mike Johnson',
    amount: 2500000,
    custCode: 'CORP-DEF',
    purpose: 'Urgent ticket purchase advance',
    ticketId: 'TRV-1050',
    completionDate: '',
    status: 'Approved'
  }
];

export const CashoutProvider = ({ children }) => {
  const [cashouts, setCashouts] = useState(() => {
    const saved = localStorage.getItem('travelops_cashouts');
    return saved ? JSON.parse(saved) : DUMMY_CASHOUTS;
  });

  useEffect(() => {
    localStorage.setItem('travelops_cashouts', JSON.stringify(cashouts));
  }, [cashouts]);

  const addCashout = (cashoutData) => {
    const newCashout = {
      ...cashoutData,
      id: `co_${Date.now()}`
    };
    setCashouts([...cashouts, newCashout]);
  };

  const updateCashout = (id, updatedData) => {
    setCashouts(cashouts.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const deleteCashout = (id) => {
    setCashouts(cashouts.filter(c => c.id !== id));
  };

  const updateStatus = (id, newStatus) => {
    setCashouts(cashouts.map(c => {
      if (c.id === id) {
        const update = { status: newStatus };
        if (newStatus === 'Completed' && !c.completionDate) {
          update.completionDate = new Date().toISOString().split('T')[0];
        }
        return { ...c, ...update };
      }
      return c;
    }));
  };

  return (
    <CashoutContext.Provider value={{
      cashouts,
      addCashout,
      updateCashout,
      deleteCashout,
      updateStatus
    }}>
      {children}
    </CashoutContext.Provider>
  );
};
