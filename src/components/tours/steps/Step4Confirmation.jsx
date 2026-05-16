import React from 'react';
import { formatCurrency } from '../../../utils/currency';

const Step4Confirmation = ({ data }) => {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Step 4: Confirmation</h2>
      
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
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>Financials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Omset:</span>
            <span style={{ fontWeight: '600' }}>Rp {formatCurrency(data.financials.totalOmset)}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Total Cost:</span>
            <span style={{ fontWeight: '600' }}>Rp {formatCurrency(data.financials.cost)}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Total Profit:</span>
            <span style={{ fontWeight: '600', color: 'var(--success)' }}>Rp {formatCurrency(data.financials.profit)}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Deposit Number:</span>
            <span style={{ fontWeight: '500' }}>{data.financials.depositNumber || '-'}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>Invoice Number:</span>
            <span style={{ fontWeight: '500' }}>{data.financials.invoiceNumber || '-'}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
          Passengers ({data.paxInfo.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Selling Price</th>
                <th>Profit</th>
                <th>Discount</th>
              </tr>
            </thead>
            <tbody>
              {data.paxInfo.map((pax, idx) => (
                <tr key={idx}>
                  <td>{pax.title} {pax.firstName} {pax.lastName}</td>
                  <td>
                    <div>{pax.email}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{pax.phone}</div>
                  </td>
                  <td>Rp {formatCurrency(pax.sellingPrice)}</td>
                  <td style={{ color: 'var(--success)' }}>Rp {formatCurrency(pax.profit)}</td>
                  <td style={{ color: 'var(--warning)' }}>Rp {formatCurrency(pax.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', textAlign: 'center', color: 'var(--text-main)' }}>
        Please review the data above. Click <strong>Confirm & Save</strong> to submit.
      </div>
    </div>
  );
};

export default Step4Confirmation;
