import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.from('travelops_documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mapped = data.map(d => ({
        id: d.id,
        docType: d.doc_type,
        guestName: d.guest_name,
        country: d.country,
        receiveDate: d.receive_date,
        estimatedDone: d.estimated_done,
        sendDate: d.send_date,
        price: d.price,
        supplier: d.supplier
      }));
      setDocuments(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (docData) => {
    try {
      const newId = `DOC-${Date.now()}`;
      const { error } = await supabase.from('travelops_documents').insert([{
        id: newId,
        doc_type: docData.docType,
        guest_name: docData.guestName,
        country: docData.country,
        receive_date: docData.receiveDate,
        estimated_done: docData.estimatedDone,
        send_date: docData.sendDate || null,
        price: docData.price || 0,
        supplier: docData.supplier
      }]);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const updateDocument = async (id, updatedData) => {
    try {
      const dbUpdates = {};
      if (updatedData.docType !== undefined) dbUpdates.doc_type = updatedData.docType;
      if (updatedData.guestName !== undefined) dbUpdates.guest_name = updatedData.guestName;
      if (updatedData.country !== undefined) dbUpdates.country = updatedData.country;
      if (updatedData.receiveDate !== undefined) dbUpdates.receive_date = updatedData.receiveDate;
      if (updatedData.estimatedDone !== undefined) dbUpdates.estimated_done = updatedData.estimatedDone;
      if (updatedData.sendDate !== undefined) dbUpdates.send_date = updatedData.sendDate;
      if (updatedData.price !== undefined) dbUpdates.price = updatedData.price;
      if (updatedData.supplier !== undefined) dbUpdates.supplier = updatedData.supplier;

      const { error } = await supabase.from('travelops_documents').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteDocument = async (id) => {
    try {
      const { error } = await supabase.from('travelops_documents').delete().eq('id', id);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
