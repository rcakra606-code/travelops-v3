import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileSpreadsheet } from 'lucide-react';
import TourSettlementModal from '../TourSettlementModal';

const Step4Confirmation = ({ data, onBackToFinancials }) => {
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const fin = data.financials || {};
  const basicPrice = fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0);
  const discSupplier = fin.discountSupplier || 0;
  const discBranch = fin.discountBranch || 0;
  const profitVal = fin.profit || 0;
  const totalSellingPrice = fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (fin.totalOmset || (basicPrice - discSupplier - discBranch));
  const totalNettPrice = fin.totalNettPrice !== undefined ? fin.totalNettPrice : (fin.cost || (basicPrice - discSupplier - profitVal));
  const depositAmount = Number(fin.depositAmount || 0);
  const sisaPelunasan = Math.max(0, totalSellingPrice - depositAmount);
  const sisaCostAgent = Math.max(0, totalNettPrice - depositAmount);
  const hasDeposit = Boolean(fin.depositNumber && fin.depositNumber.trim() !== '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Step 4: Confirmation</h2>
        <button
          type="button"
          onClick={() => setShowSettlementModal(true)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1.15rem',
            fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            borderColor: '#0284c7'
          }}
        >
          <FileSpreadsheet size={16} /> Preview Bukti Pelunasan Tour
        </button>
      </div>

      {!hasDeposit && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f87171'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <span style={{ fontSize: '0.875rem' }}>
              <strong>Nomor DP Belum Terinput:</strong> Nomor DP wajib terinput pada database untuk menyimpan data tour ini.
            </span>
          </div>
          {onBackToFinancials && (
            <button 
              onClick={onBackToFinancials}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#ef4444', borderColor: '#dc2626' }}
            >
              Isi Nomor DP Sekarang
            </button>
          )}
        </div>
      )}
      
      <div className="form-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>Tour Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tour Code:</span>
            <span style={{ fontWeight: '500' }}>{data.tourCode || '-'}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Booking Code:</span>
            <span style={{ fontWeight: '500' }}>{data.bookingCode || '-'}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
            <span style={{ fontWeight: '500' }}>{data.country || '-'}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Dates:</span>
            <span style={{ fontWeight: '500' }}>{data.departureDate} to {data.returnDate}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Staff:</span>
            <span style={{ fontWeight: '500' }}>{data.staffName || '-'}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span style={{ fontWeight: '500', color: data.status === 'Confirm' ? 'var(--success)' : data.status === 'Cancel' ? 'var(--danger)' : 'var(--warning)' }}>
              {data.status}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Form Claim MDR:</span>
            <span>
              {data.claimMdr ? (
                <span style={{ color: '#34d399', fontWeight: '700', fontSize: '0.8rem' }}>
                  ✓ Checked ({(() => {
                    try {
                      return new Date(data.claimMdrAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(data.claimMdrAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      return 'Aktif';
                    }
                  })()})
                </span>
              ) : (
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Belum Dicentang</span>
              )}
            </span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>Financial Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Harga Dasar Tour:</span>
            <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>Rp {formatCurrency(basicPrice)}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Discount Supplier:</span>
            <span style={{ fontWeight: '600', color: '#fbbf24', fontFamily: 'monospace' }}>- Rp {formatCurrency(discSupplier)}</span>

            <span style={{ color: 'var(--text-muted)' }}>Discount Branch:</span>
            <span style={{ fontWeight: '600', color: '#fbbf24', fontFamily: 'monospace' }}>- Rp {formatCurrency(discBranch)}</span>

            <span style={{ color: 'var(--text-muted)' }}>Nominal Profit:</span>
            <span style={{ fontWeight: '600', color: 'var(--success)', fontFamily: 'monospace' }}>Rp {formatCurrency(profitVal)}</span>
            
            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Total Selling Price:</span>
            <span style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace' }}>Rp {formatCurrency(totalSellingPrice)}</span>

            <span style={{ color: '#34d399', fontWeight: '600' }}>Total Nett Price (Cost):</span>
            <span style={{ fontWeight: '700', color: '#34d399', fontFamily: 'monospace' }}>Rp {formatCurrency(totalNettPrice)}</span>
            
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Nomor DP <span style={{ color: '#ef4444' }}>*</span>:
            </span>
            <span>
              {hasDeposit ? (
                <span className="font-mono" style={{ fontWeight: '700', color: '#10b981' }}>
                  ✓ {fin.depositNumber}
                </span>
              ) : (
                <span style={{ color: '#f87171', fontWeight: '700', fontSize: '0.8rem' }}>
                  ⚠️ Belum Terinput (Wajib)
                </span>
              )}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Nominal Deposit (DP):</span>
            <span style={{ fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>
              Rp {formatCurrency(depositAmount)}
            </span>

            <span style={{ color: '#38bdf8', fontWeight: '600' }}>Sisa Pelunasan Tamu:</span>
            <span style={{ fontWeight: '800', color: sisaPelunasan <= 0 && totalSellingPrice > 0 ? '#10b981' : '#38bdf8', fontFamily: 'monospace' }}>
              Rp {formatCurrency(sisaPelunasan)} {sisaPelunasan <= 0 && totalSellingPrice > 0 ? '(LUNAS)' : ''}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Invoice Number:</span>
            <span style={{ fontWeight: '500' }}>{fin.invoiceNumber || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum Terbit</span>}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
          Passengers ({data.paxInfo.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Harga Dasar</th>
                <th>Disc. Supplier</th>
                <th>Disc. Branch</th>
                <th>Profit</th>
                <th>Selling Price</th>
                <th>Nett Price</th>
              </tr>
            </thead>
            <tbody>
              {data.paxInfo.map((pax, idx) => {
                const pBasic = Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
                const pDiscSupplier = Number(pax.discountSupplier) || 0;
                const pDiscBranch = Number(pax.discountBranch) || 0;
                const pProfit = Number(pax.profit) || 0;
                const pSellingPrice = pBasic - pDiscSupplier - pDiscBranch;
                const pNettPrice = pBasic - pDiscSupplier - pProfit;

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{pax.title} {pax.firstName} {pax.lastName}</td>
                    <td>
                      <div>{pax.email || '-'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{pax.phone || '-'}</div>
                    </td>
                    <td className="font-mono">Rp {formatCurrency(pBasic)}</td>
                    <td className="font-mono" style={{ color: '#fbbf24' }}>- Rp {formatCurrency(pDiscSupplier)}</td>
                    <td className="font-mono" style={{ color: '#fbbf24' }}>- Rp {formatCurrency(pDiscBranch)}</td>
                    <td className="font-mono" style={{ color: 'var(--success)' }}>Rp {formatCurrency(pProfit)}</td>
                    <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>Rp {formatCurrency(pSellingPrice)}</td>
                    <td className="font-mono" style={{ color: '#34d399', fontWeight: '700' }}>Rp {formatCurrency(pNettPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', textAlign: 'center', color: 'var(--text-main)' }}>
        Please review the data above. Click <strong>Confirm & Save</strong> to submit.
      </div>

      {showSettlementModal && (
        <TourSettlementModal 
          tour={data} 
          onClose={() => setShowSettlementModal(false)} 
        />
      )}
    </div>
  );
};

export default Step4Confirmation;
