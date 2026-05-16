import React, { createContext, useState, useContext, useEffect } from 'react';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedDocs = localStorage.getItem('travelops_documents');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    } else {
      setDocuments([
        {
          id: 'DOC-1001',
          receiveDate: '2026-05-01',
          sendDate: '',
          guestName: 'John Doe',
          country: 'Japan',
          processType: 'Normal',
          bookingCode: 'BKG-001',
          invoiceNumber: 'INV-001',
          phoneNumber: '+6281234567890',
          estimatedDone: '2026-05-10',
          staff: 'Admin TravelOps',
          tourCode: 'TRV-001',
          notes: 'Passport renewal'
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('travelops_documents', JSON.stringify(documents));
    }
  }, [documents, loading]);

  const addDocument = (docData) => {
    const newDoc = {
      ...docData,
      id: `DOC-${Date.now()}`
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const updateDocument = (id, updatedData) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updatedData } : doc));
  };

  const deleteDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
