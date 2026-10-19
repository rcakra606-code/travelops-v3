import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Printer, X, User, Building, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { 
  prepareSettlementData, 
  exportPassengerConfirmationExcel, 
  exportAgentConfirmationExcel 
} from '../../utils/tourSettlementExport';

const TourSettlementModal = ({ tour, onClose }) => {
  const [activeTab, setActiveTab] = useState('passenger'); // 'passenger' | 'agent'
  const data = prepareSettlementData(tour);

  const handleDownloadExcel = async () => {
    if (activeTab === 'passenger') {
      await exportPassengerConfirmationExcel(tour);
    } else {
      await exportAgentConfirmationExcel(tour);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.25rem'
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-settlement-sheet, #printable-settlement-sheet * {
            visibility: visible !important;
          }
          #printable-settlement-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        background: 'var(--bg-surface, #1e293b)',
        border: '1px solid var(--border-glow, #334155)',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden'
      }}>
        
        {/* Modal Top Bar */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-dark, #0f172a)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={20} color="var(--primary)" />
              Auto Export Bukti Pelunasan Tour
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Format resmi pelunasan tour sesuai template finance &amp; operasional
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab & Action Toolbar */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('passenger')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === 'passenger' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'passenger' ? '#0f172a' : 'var(--text-main)',
                border: activeTab === 'passenger' ? '1px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <User size={15} /> 1. Passenger Confirmation (Tamu)
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === 'agent' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'agent' ? '#ffffff' : 'var(--text-main)',
                border: activeTab === 'agent' ? '1px solid #10b981' : '1px solid var(--border)'
              }}
            >
              <Building size={15} /> 2. Agent Confirmation (Invoice Base)
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleDownloadExcel}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: '700'
              }}
            >
              <Download size={15} /> Download Excel (.xlsx)
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print / PDF
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'rgba(0,0,0,0.25)'
        }}>
          
          {/* THE EXACT SPREADSHEET DOCUMENT BOX */}
          <div 
            id="printable-settlement-sheet"
            style={{
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'Calibri, Arial, sans-serif',
              border: '2px solid #000000',
              borderRadius: '2px',
              padding: '1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '720px',
              margin: '0 auto',
              fontSize: '11px',
              lineHeight: '1.3'
            }}
          >
            {/* Title Header */}
            <div style={{
              border: '1.5px solid #000000',
              textAlign: 'center',
              padding: '6px 0',
              fontWeight: '800',
              fontSize: '15px',
              letterSpacing: '1px',
              marginBottom: '10px',
              background: '#fafafa'
            }}>
              BUKTI PELUNASAN TOUR {activeTab === 'agent' ? '(AGENT CONFIRMATION)' : ''}
            </div>

            {/* Header Details Table */}
            <div style={{ border: '1.5px solid #000000', padding: '8px 10px', marginBottom: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '120px', padding: '3px 0' }}>Pax Name</td>
                    <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                    <td style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                      {data.paxNames}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>Group Name</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td style={{ fontWeight: '700' }}>
                      {data.groupName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>Departure Date</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td style={{ fontWeight: '700' }}>
                      {data.depDate}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>Total Passenger</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td>
                      <span style={{ fontWeight: '700' }}>{data.paxCount} Adult</span> &nbsp;+&nbsp; Child
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>Total Room</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td>
                      <span style={{ fontWeight: '700' }}>{Math.ceil(data.paxCount / 2)} Room</span> &nbsp;+&nbsp; SINGLE / TWN
                    </td>
                  </tr>
                  {activeTab === 'agent' && (
                    <tr>
                      <td style={{ padding: '3px 0', color: '#0369a1', fontWeight: 'bold' }}>Invoice Number</td>
                      <td style={{ textAlign: 'center' }}>:</td>
                      <td style={{ fontWeight: '700', color: '#0369a1' }}>
                        {data.invoiceNumber !== '-' ? data.invoiceNumber : 'BELUM TERBIT (DRAFT)'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section Header: PERHITUNGAN BIAYA */}
            <div style={{
              border: '1.5px solid #000000',
              textAlign: 'center',
              padding: '4px 0',
              fontWeight: '800',
              fontSize: '13px',
              letterSpacing: '2px',
              background: '#f1f5f9',
              marginBottom: '10px'
            }}>
              {activeTab === 'passenger' ? 'PERHITUNGAN BIAYA' : 'PERHITUNGAN BIAYA & NETT (COST AGEN)'}
            </div>

            {/* Content: BIAYA TOUR */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '4px', letterSpacing: '0.5px' }}>
                {activeTab === 'passenger' ? 'BIAYA TOUR' : 'KOMPONEN BIAYA TOUR'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '120px' }}>{activeTab === 'passenger' ? 'ADULT' : 'Harga Dasar'}</td>
                    <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                    <td style={{ width: '240px' }}>{data.paxCount} Adult x IDR {formatCurrency(data.basicPerPax)}</td>
                    <td style={{ width: '40px', textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(data.basicPrice)}</td>
                  </tr>
                  
                  {activeTab === 'passenger' ? (
                    <tr>
                      <td>Discount</td>
                      <td style={{ textAlign: 'center' }}>:</td>
                      <td>{data.paxCount} Paxs x IDR {formatCurrency(data.discPerPax)}</td>
                      <td style={{ textAlign: 'right' }}>= IDR</td>
                      <td style={{ textAlign: 'right', color: '#b91c1c' }}>
                        {formatCurrency(data.totalDisc)} (-)
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td>Discount Supplier</td>
                        <td style={{ textAlign: 'center' }}>:</td>
                        <td>Potongan Harga Supplier</td>
                        <td style={{ textAlign: 'right' }}>= IDR</td>
                        <td style={{ textAlign: 'right', color: '#b91c1c' }}>
                          {formatCurrency(data.discSupplier)} (-)
                        </td>
                      </tr>
                      <tr>
                        <td>Nominal Profit</td>
                        <td style={{ textAlign: 'center' }}>:</td>
                        <td>Margin Profit Operasional</td>
                        <td style={{ textAlign: 'right' }}>= IDR</td>
                        <td style={{ textAlign: 'right', color: '#047857', fontWeight: 'bold' }}>
                          {formatCurrency(data.profit)}
                        </td>
                      </tr>
                    </>
                  )}

                  <tr>
                    <td>Apt tax Int'l</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td>{data.paxCount} Paxs x IDR 0.00</td>
                    <td style={{ textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right' }}>0.00 (+)</td>
                  </tr>

                  <tr style={{ fontWeight: '700' }}>
                    <td style={{ paddingTop: '6px' }}>
                      {activeTab === 'passenger' ? 'Total Biaya Tour' : 'Total Nett Price (Cost)'}
                    </td>
                    <td style={{ textAlign: 'center', paddingTop: '6px' }}>:</td>
                    <td></td>
                    <td style={{ textAlign: 'right', paddingTop: '6px' }}>IDR</td>
                    <td style={{ textAlign: 'right', paddingTop: '6px', borderTop: '1px solid #000000', borderBottom: '3px double #000000' }}>
                      {formatCurrency(activeTab === 'passenger' ? data.totalSellingPrice : data.totalNettPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BIAYA TAMBAHAN */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '4px', letterSpacing: '0.5px' }}>
                BIAYA TAMBAHAN
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '120px' }}>VISA GROUP</td>
                    <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                    <td style={{ width: '240px' }}>{data.paxCount} Paxs x IDR 0.00</td>
                    <td style={{ width: '40px', textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right' }}>0.00 (+)</td>
                  </tr>
                  <tr style={{ fontWeight: '700' }}>
                    <td style={{ paddingTop: '4px' }}>Total Biaya Tambahan</td>
                    <td style={{ textAlign: 'center', paddingTop: '4px' }}>:</td>
                    <td></td>
                    <td style={{ textAlign: 'right', paddingTop: '4px' }}>IDR</td>
                    <td style={{ textAlign: 'right', paddingTop: '4px', borderTop: '1px solid #000000', borderBottom: '3px double #000000' }}>
                      0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOTAL BIAYA + DEPOSIT + PELUNASAN */}
            <div style={{ borderTop: '1.5px solid #000000', paddingTop: '8px', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr style={{ fontWeight: '700' }}>
                    <td colSpan={3}>
                      {activeTab === 'passenger' ? 'TOTAL BIAYA TOUR + BIAYA TAMBAHAN' : 'TOTAL COST INVOICE (NETT DASAR INVOICE)'}
                    </td>
                    <td style={{ width: '40px', textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(activeTab === 'passenger' ? data.totalSellingPrice : data.totalNettPrice)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '140px' }}>DEPOSIT ({data.depositNumber})</td>
                    <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                    <td style={{ width: '220px' }}>{data.paxCount} Paxs x IDR {formatCurrency(data.dpPerPax)}</td>
                    <td style={{ width: '40px', textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right', color: '#047857', fontWeight: '600' }}>
                      {formatCurrency(data.depositAmount)} (-)
                    </td>
                  </tr>
                  <tr>
                    <td>PELUNASAN</td>
                    <td style={{ textAlign: 'center' }}>:</td>
                    <td>
                      {data.paxCount} Paxs x IDR {formatCurrency(data.paxCount > 0 ? Math.round((activeTab === 'passenger' ? data.sisaPassenger : data.sisaAgentCost) / data.paxCount) : 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>= IDR</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(activeTab === 'passenger' ? data.sisaPassenger : data.sisaAgentCost)}
                    </td>
                  </tr>
                  <tr style={{ fontWeight: '800', fontSize: '12px' }}>
                    <td colSpan={3} style={{ paddingTop: '8px' }}>
                      {activeTab === 'passenger' ? 'SISA YANG HARUS DIBAYAR' : 'SISA COST INVOICE YANG HARUS DILUNASI'}
                    </td>
                    <td style={{ textAlign: 'right', paddingTop: '8px' }}>= IDR</td>
                    <td style={{ textAlign: 'right', paddingTop: '8px', borderTop: '1px solid #000000', borderBottom: '3px double #000000', color: (activeTab === 'passenger' ? data.sisaPassenger : data.sisaAgentCost) <= 0 ? '#047857' : '#0369a1' }}>
                      {formatCurrency(activeTab === 'passenger' ? data.sisaPassenger : data.sisaAgentCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* REMARKS & SIGNATURE FOOTER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', border: '1.5px solid #000000' }}>
              <div style={{ padding: '8px 10px', borderRight: '1.5px solid #000000' }}>
                <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '4px' }}>
                  REMARKS
                </div>
                <table style={{ fontSize: '10.5px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '90px', color: '#475569' }}>Account Name</td>
                      <td style={{ fontWeight: '700' }}>: PT. DWIDAYA WORLDWIDE</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#475569' }}>BCA</td>
                      <td style={{ fontWeight: '700' }}>: 002 307 3100</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#475569' }}>Status Booking</td>
                      <td style={{ fontWeight: '700' }}>: {tour.status || 'Active'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
                <div style={{ fontWeight: '800', textDecoration: 'underline' }}>
                  RECEIVED BY
                </div>
                <div style={{ height: '40px' }}></div>
                <div style={{ fontWeight: '800', textDecoration: 'underline', textTransform: 'uppercase' }}>
                  {data.staffName}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-dark, #0f172a)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menampilkan data pelunasan tour: <strong>{data.groupName}</strong>
          </span>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.825rem' }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default TourSettlementModal;
