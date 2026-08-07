import React, { useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { Upload, X, Check, FileSpreadsheet, AlertCircle, DownloadCloud } from 'lucide-react';

const CsvImportUtility = ({ onImport, templateHeaders }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
      setIsProcessing(true);
      
      try {
        let parsedData = [];
        if (selected.name.toLowerCase().endsWith('.csv')) {
          Papa.parse(selected, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors && results.errors.length > 0) {
                 console.error(results.errors);
              }
              if (results.data.length === 0) {
                setError("File is empty or invalid format.");
              } else {
                setData(results.data);
              }
              setIsProcessing(false);
            },
            error: (err) => {
              setError(err.message || 'Error parsing file.');
              setIsProcessing(false);
            }
          });
        } else {
          const workbook = new ExcelJS.Workbook();
          const arrayBuffer = await selected.arrayBuffer();
          await workbook.xlsx.load(arrayBuffer);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) throw new Error("No worksheets found in Excel file.");
          
          const headers = [];
          worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.value;
          });
          
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber];
              if (header) {
                rowData[header] = cell.value?.result ?? cell.value;
              }
            });
            parsedData.push(rowData);
          });
          
          if (parsedData.length === 0) {
            throw new Error("File is empty or invalid format.");
          }
          setData(parsedData);
          setIsProcessing(false);
        }
      } catch (err) {
        setError(err.message || 'Error parsing file.');
        setIsProcessing(false);
      }
    }
  };

  const handleClear = () => {
    setFile(null);
    setData([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    onImport(data);
    handleClear();
  };

  const handleDownloadTemplate = async () => {
    if (!templateHeaders) return;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');
    worksheet.addRow(templateHeaders);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Import_Template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px dashed var(--border)', marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={18} color="var(--primary)" /> Import Data (CSV/Excel)
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Upload a .csv or .xlsx file. 
            {templateHeaders && <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-main)', opacity: 0.8 }}>Expected Headers: {templateHeaders.join(', ')}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {templateHeaders && (
            <button onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>
              <DownloadCloud size={16} /> Template
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Select File
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileUpload}
        />
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {file && !error && (
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
              <FileSpreadsheet size={24} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontWeight: '500' }}>{file.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isProcessing ? 'Processing...' : `${data.length} records found ready to import.`}
              </div>
            </div>
          </div>
          
          {!isProcessing && data.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleClear} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <X size={16} /> Cancel
              </button>
              <button onClick={handleConfirm} className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={16} /> Import {data.length} Records
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CsvImportUtility;
