import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '../utils/currency';

/**
 * Reusable Export Menu Component
 * @param {Array} data - The array of objects to export
 * @param {Array} columns - Array of column objects { header: 'Name', key: 'dataKey', format: 'currency'|'date'|null }
 * @param {String} filename - Base filename without extension
 */
const ExportMenu = ({ data, columns, filename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatValue = (val, format) => {
    if (val === null || val === undefined) return '-';
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return `${val}%`;
    return val;
  };

  const getProcessedData = () => {
    return data.map(item => {
      const row = {};
      columns.forEach(col => {
        row[col.header] = formatValue(item[col.key], col.format);
      });
      return row;
    });
  };

  const handleExportExcel = () => {
    const processedData = getProcessedData();
    const ws = XLSX.utils.json_to_sheet(processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(16);
    doc.text(filename.replace(/_/g, ' '), 14, 15);
    
    // Add Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = columns.map(col => col.header);
    const tableRows = data.map(item => columns.map(col => formatValue(item[col.key], col.format)));

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
          border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem 1rem',
          borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem'
        }}
      >
        <Download size={16} /> Export <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '0.5rem', padding: '0.5rem', minWidth: '160px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', zIndex: 50,
          display: 'flex', flexDirection: 'column', gap: '0.25rem'
        }}>
          <button 
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
              background: 'transparent', border: 'none', color: 'var(--text-main)',
              padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.875rem'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileSpreadsheet size={16} color="#10b981" /> Export to Excel
          </button>
          
          <button 
            onClick={handleExportPDF}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
              background: 'transparent', border: 'none', color: 'var(--text-main)',
              padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.875rem'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileText size={16} color="#ef4444" /> Export to PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
