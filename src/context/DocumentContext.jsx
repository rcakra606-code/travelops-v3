import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const DocumentContext = createContext(null);

const toLocalTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeDocDateInput = (val) => {
  if (!val) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const ymdSlash = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdSlash) {
    return `${ymdSlash[1]}-${ymdSlash[2].padStart(2, '0')}-${ymdSlash[3].padStart(2, '0')}`;
  }
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

const parseFeeNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

const resolveLogisticsStatus = (shippingStatus, receivedStatus, sendDate) => {
  const normShip = String(shippingStatus || '').trim();
  const normRecv = String(receivedStatus || '').trim();
  if (normShip === 'Received' || normRecv === 'Final') return 'Received';
  if (normShip === 'Returned' || normRecv === 'Needs Return') return 'Returned';
  if (normShip === 'Sent' || Boolean(sendDate)) return 'Sent';
  return 'Processing';
};

const pickImportField = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  const rowKeys = Object.keys(row || {});
  for (const target of keys) {
    const lowerTarget = target.toLowerCase();
    const matchedKey = rowKeys.find((rk) => rk.trim().toLowerCase() === lowerTarget);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
};

const loadDocumentsFromDb = async () => {
  const { data, error } = await supabase
    .from('travelops_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((d) => {
    const syncedStatus = resolveLogisticsStatus(d.shipping_status, d.received_status, d.send_date);

    if (syncedStatus !== d.shipping_status) {
      supabase
        .from('travelops_documents')
        .update({ shipping_status: syncedStatus })
        .eq('id', d.id)
        .then(({ error: syncErr }) => {
          if (syncErr) console.error('Document status auto-sync error:', syncErr);
        });
    }

    return {
      id: d.id,
      docType: d.doc_type || '',
      guestName: d.guest_name || '',
      country: d.country || '',
      receiveDate: d.receive_date || '',
      estimatedDone: d.estimated_done || '',
      sendDate: d.send_date || '',
      price: Number(d.price) || 0,
      supplier: d.supplier || '',
      processType: d.process_type || 'Normal',
      bookingCode: d.booking_code || '',
      invoiceNumber: d.invoice_number || '',
      phoneNumber: d.phone_number || '',
      staff: d.staff || '',
      tourCode: d.tour_code || '',
      notes: d.notes || '',
      shippingStatus: syncedStatus,
      shippingMethod: d.shipping_method || '',
      shippingCourier: d.shipping_courier || '',
      shippingResi: d.shipping_resi || '',
      shippingNotes: d.shipping_notes || '',
      receivedStatus: d.received_status || '',
      appointmentDate: d.appointment_date || '',
      appointmentTime: d.appointment_time || '',
      appointmentLocation: d.appointment_location || ''
    };
  });
};

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const mapped = await loadDocumentsFromDb();
      setDocuments(mapped);
    } catch (err) {
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadDocumentsFromDb()
      .then((mapped) => {
        if (!cancelled) setDocuments(mapped);
      })
      .catch((err) => {
        console.error('Fetch documents error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const channel = supabase
      .channel('travelops_documents_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'travelops_documents' },
        () => {
          if (!cancelled) {
            loadDocumentsFromDb()
              .then((mapped) => {
                if (!cancelled) setDocuments(mapped);
              })
              .catch((err) => console.error('Realtime sync error:', err));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const addDocument = async (docData) => {
    try {
      const newId = `DOC-${Date.now()}`;
      const cleanSendDate = docData.sendDate || null;
      const initialShippingStatus = resolveLogisticsStatus(
        docData.shippingStatus,
        docData.receivedStatus,
        cleanSendDate
      );

      const { error } = await supabase.from('travelops_documents').insert([
        {
          id: newId,
          doc_type: (docData.docType || 'Tourist Visa').trim(),
          guest_name: (docData.guestName || '').trim(),
          country: (docData.country || '').trim(),
          receive_date: docData.receiveDate || null,
          estimated_done: docData.estimatedDone || null,
          send_date: cleanSendDate,
          price: parseFeeNumber(docData.price),
          supplier: (docData.supplier || '').trim(),
          process_type: docData.processType || 'Normal',
          booking_code: (docData.bookingCode || '').trim(),
          invoice_number: (docData.invoiceNumber || '').trim(),
          phone_number: (docData.phoneNumber || '').trim(),
          staff: (docData.staff || '').trim(),
          tour_code: (docData.tourCode || '').trim(),
          notes: (docData.notes || '').trim(),
          shipping_status: initialShippingStatus,
          shipping_method: (docData.shippingMethod || '').trim(),
          shipping_courier: (docData.shippingCourier || '').trim(),
          shipping_resi: (docData.shippingResi || '').trim(),
          shipping_notes: (docData.shippingNotes || '').trim(),
          received_status: docData.receivedStatus || null,
          appointment_date: docData.appointmentDate || null,
          appointment_time: docData.appointmentTime || null,
          appointment_location: (docData.appointmentLocation || '').trim() || null
        }
      ]);
      if (error) throw error;
      await fetchDocuments();
      return newId;
    } catch (err) {
      console.error('Add document error:', err);
      throw err;
    }
  };

  const updateDocument = async (id, updatedData) => {
    try {
      const existing = documents.find((d) => d.id === id);
      const dbUpdates = {};

      if (updatedData.docType !== undefined) dbUpdates.doc_type = (updatedData.docType || '').trim();
      if (updatedData.guestName !== undefined) dbUpdates.guest_name = (updatedData.guestName || '').trim();
      if (updatedData.country !== undefined) dbUpdates.country = (updatedData.country || '').trim();
      if (updatedData.receiveDate !== undefined) dbUpdates.receive_date = updatedData.receiveDate || null;
      if (updatedData.estimatedDone !== undefined) dbUpdates.estimated_done = updatedData.estimatedDone || null;
      if (updatedData.sendDate !== undefined) dbUpdates.send_date = updatedData.sendDate || null;
      if (updatedData.price !== undefined) dbUpdates.price = parseFeeNumber(updatedData.price);
      if (updatedData.supplier !== undefined) dbUpdates.supplier = (updatedData.supplier || '').trim();
      if (updatedData.processType !== undefined) dbUpdates.process_type = updatedData.processType || 'Normal';
      if (updatedData.bookingCode !== undefined) dbUpdates.booking_code = (updatedData.bookingCode || '').trim();
      if (updatedData.invoiceNumber !== undefined) dbUpdates.invoice_number = (updatedData.invoiceNumber || '').trim();
      if (updatedData.phoneNumber !== undefined) dbUpdates.phone_number = (updatedData.phoneNumber || '').trim();
      if (updatedData.staff !== undefined) dbUpdates.staff = (updatedData.staff || '').trim();
      if (updatedData.tourCode !== undefined) dbUpdates.tour_code = (updatedData.tourCode || '').trim();
      if (updatedData.notes !== undefined) dbUpdates.notes = (updatedData.notes || '').trim();
      if (updatedData.shippingMethod !== undefined) dbUpdates.shipping_method = (updatedData.shippingMethod || '').trim();
      if (updatedData.shippingCourier !== undefined) dbUpdates.shipping_courier = (updatedData.shippingCourier || '').trim();
      if (updatedData.shippingResi !== undefined) dbUpdates.shipping_resi = (updatedData.shippingResi || '').trim();
      if (updatedData.shippingNotes !== undefined) dbUpdates.shipping_notes = (updatedData.shippingNotes || '').trim();
      if (updatedData.receivedStatus !== undefined) dbUpdates.received_status = updatedData.receivedStatus || null;
      if (updatedData.appointmentDate !== undefined) dbUpdates.appointment_date = updatedData.appointmentDate || null;
      if (updatedData.appointmentTime !== undefined) dbUpdates.appointment_time = updatedData.appointmentTime || null;
      if (updatedData.appointmentLocation !== undefined) {
        dbUpdates.appointment_location = (updatedData.appointmentLocation || '').trim() || null;
      }

      if (updatedData.shippingStatus !== undefined) {
        dbUpdates.shipping_status = updatedData.shippingStatus;
        if (
          (updatedData.shippingStatus === 'Sent' || updatedData.shippingStatus === 'Received') &&
          updatedData.sendDate === undefined &&
          !existing?.sendDate
        ) {
          dbUpdates.send_date = toLocalTodayStr();
        }
      } else if (updatedData.sendDate !== undefined) {
        if (updatedData.sendDate && (!existing?.shippingStatus || existing.shippingStatus === 'Processing')) {
          dbUpdates.shipping_status = 'Sent';
        } else if (!updatedData.sendDate && existing?.shippingStatus === 'Sent') {
          dbUpdates.shipping_status = 'Processing';
        }
      }

      const { error } = await supabase.from('travelops_documents').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error('Update document error:', err);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      const { error } = await supabase.from('travelops_documents').delete().eq('id', id);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error('Delete document error:', err);
      throw err;
    }
  };

  const bulkUpdateDocumentStatus = async (ids, targetStatus) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const todayStr = toLocalTodayStr();
      await Promise.all(
        ids.map((id) => {
          const target = documents.find((d) => d.id === id);
          let patch = { shipping_status: 'Processing', received_status: null, send_date: null };
          if (targetStatus === 'Sent') {
            patch = {
              shipping_status: 'Sent',
              send_date: target?.sendDate || todayStr
            };
          } else if (targetStatus === 'Received') {
            patch = {
              shipping_status: 'Received',
              received_status: 'Final',
              send_date: target?.sendDate || todayStr
            };
          }
          return supabase.from('travelops_documents').update(patch).eq('id', id);
        })
      );
      await fetchDocuments();
    } catch (err) {
      console.error('Bulk update document status error:', err);
      throw err;
    }
  };

  const bulkDeleteDocuments = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const { error } = await supabase.from('travelops_documents').delete().in('id', ids);
      if (error) throw error;
      await fetchDocuments();
    } catch (err) {
      console.error('Bulk delete documents error:', err);
      throw err;
    }
  };

  const bulkImportDocuments = async (rows, fallbackStaff = '') => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    try {
      const baseTs = Date.now();
      const todayStr = toLocalTodayStr();

      const payload = rows
        .map((row, index) => {
          const guestName = pickImportField(row, [
            'Guest Name',
            'Applicant Name',
            'Nama Tamu',
            'guestName',
            'guest_name'
          ]);
          if (!guestName) return null;

          const docType =
            pickImportField(row, ['Document Type', 'Doc Type', 'Type', 'docType', 'doc_type']) ||
            'Tourist Visa';
          const country = pickImportField(row, [
            'Country',
            'Destination',
            'Negara',
            'country'
          ]);
          const rawProcess = pickImportField(row, [
            'Process Type',
            'Speed',
            'Urgency',
            'processType',
            'process_type'
          ]);
          const processType = ['Normal', 'Express', 'Urgent'].includes(rawProcess)
            ? rawProcess
            : 'Normal';

          const rawReceive =
            row['Receive Date'] ??
            row['Tgl Terima'] ??
            row['receiveDate'] ??
            row['receive_date'] ??
            '';
          const rawEst =
            row['Estimated Done'] ??
            row['Est. Done'] ??
            row['estimatedDone'] ??
            row['estimated_done'] ??
            '';
          const rawSend =
            row['Send Date'] ?? row['Tgl Kirim'] ?? row['sendDate'] ?? row['send_date'] ?? '';
          const rawApptDate =
            row['Appointment Date'] ??
            row['Tanggal Appointment Visa'] ??
            row['appointmentDate'] ??
            row['appointment_date'] ??
            '';

          const receiveDate = normalizeDocDateInput(rawReceive) || todayStr;
          const estimatedDone = normalizeDocDateInput(rawEst);
          const sendDate = normalizeDocDateInput(rawSend);
          const appointmentDate = normalizeDocDateInput(rawApptDate);

          const appointmentTime = pickImportField(row, [
            'Appointment Time',
            'Waktu Appointment Visa',
            'appointmentTime',
            'appointment_time'
          ]);
          const appointmentLocation = pickImportField(row, [
            'Appointment Location',
            'Tempat Appointment Visa',
            'Venue',
            'appointmentLocation',
            'appointment_location'
          ]);

          const bookingCode = pickImportField(row, ['Booking Code', 'bookingCode', 'booking_code']);
          const tourCode = pickImportField(row, ['Tour Code', 'tourCode', 'tour_code']);
          const invoiceNumber = pickImportField(row, [
            'Invoice Number',
            'Invoice #',
            'invoiceNumber',
            'invoice_number'
          ]);
          const supplier = pickImportField(row, [
            'Vendor / Visa Center',
            'Supplier',
            'Vendor',
            'supplier'
          ]);
          const price = parseFeeNumber(
            row['Service Fee'] ?? row['Price'] ?? row['Fee'] ?? row['price'] ?? 0
          );
          const phoneNumber = pickImportField(row, [
            'Phone Number',
            'Phone',
            'WhatsApp',
            'phoneNumber',
            'phone_number'
          ]);
          const staff =
            pickImportField(row, ['Staff', 'PIC Staff', 'Consultant', 'staff']) || fallbackStaff;
          const rawShipStatus = pickImportField(row, [
            'Shipping Status',
            'Status',
            'shippingStatus',
            'shipping_status'
          ]);
          const shippingMethod = pickImportField(row, [
            'Shipping Method',
            'Method',
            'shippingMethod',
            'shipping_method'
          ]);
          const shippingCourier = pickImportField(row, [
            'Courier',
            'Shipping Courier',
            'shippingCourier',
            'shipping_courier'
          ]);
          const shippingResi = pickImportField(row, [
            'Tracking Resi',
            'AWB / Resi',
            'Resi',
            'shippingResi',
            'shipping_resi'
          ]);
          const notes = pickImportField(row, ['Notes', 'Catatan', 'notes']);

          const shippingStatus = resolveLogisticsStatus(rawShipStatus, null, sendDate);

          return {
            id: `DOC-${baseTs}-${index + 1}`,
            doc_type: docType,
            guest_name: guestName,
            country,
            receive_date: receiveDate || null,
            estimated_done: estimatedDone || null,
            send_date: sendDate || null,
            price,
            supplier,
            process_type: processType,
            booking_code: bookingCode,
            invoice_number: invoiceNumber,
            phone_number: phoneNumber,
            staff,
            tour_code: tourCode,
            notes,
            shipping_status: shippingStatus,
            shipping_method: shippingMethod,
            shipping_courier: shippingCourier,
            shipping_resi: shippingResi,
            shipping_notes: '',
            received_status: shippingStatus === 'Received' ? 'Final' : null,
            appointment_date: appointmentDate || null,
            appointment_time: appointmentTime || null,
            appointment_location: appointmentLocation || null
          };
        })
        .filter(Boolean);

      if (payload.length === 0) {
        throw new Error('No valid document rows found. Make sure "Guest Name" is filled.');
      }

      const { error } = await supabase.from('travelops_documents').insert(payload);
      if (error) throw error;
      await fetchDocuments();
      return payload.length;
    } catch (err) {
      console.error('Bulk import documents error:', err);
      throw err;
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        addDocument,
        updateDocument,
        deleteDocument,
        bulkUpdateDocumentStatus,
        bulkDeleteDocuments,
        bulkImportDocuments
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDocuments = () => useContext(DocumentContext);
