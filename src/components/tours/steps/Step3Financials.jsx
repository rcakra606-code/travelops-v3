import React, { useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';

const Step3Financials = ({ data, updateData }) => {

  useEffect(() => {
    // Auto calculate from Pax Info
    let totalSales = 0;
    let discount = 0;
    let profit = 0;

    data.paxInfo.forEach(pax => {
      totalSales += (Number(pax.sellingPrice) || 0);
      discount += (Number(pax.discount) || 0);
      profit += (Number(pax.profit) || 0);
    });

    const totalOmset = totalSales - discount;
    const cost = totalSales - discount - profit;

    updateData({
      financials: {
        ...data.financials,
        totalSales,
        discount,
        profit,
        totalOmset,
        cost
      }
    });
  }, [data.paxInfo]); // Re-run when paxInfo changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({
      financials: {
        ...data.financials,
        [name]: value
      }
    });
  };

  const { financials } = data;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Step 3: Financial Summary</h2>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Calculations</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Sales</span>
            <span style={{ fontWeight: '600' }}>Rp {formatCurrency(financials.totalSales)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Discount</span>
            <span style={{ fontWeight: '600', color: 'var(--warning)' }}>- Rp {formatCurrency(financials.discount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', gridColumn: '1 / -1' }}>
            <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Total Omset (Sales - Discount)</span>
            <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.25rem' }}>Rp {formatCurrency(financials.totalOmset)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Profit</span>
            <span style={{ fontWeight: '600', color: 'var(--success)' }}>Rp {formatCurrency(financials.profit)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Cost (Omset - Profit)</span>
            <span style={{ fontWeight: '600', color: 'var(--danger)' }}>Rp {formatCurrency(financials.cost)}</span>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Deposit Number</label>
          <input type="text" name="depositNumber" value={financials.depositNumber} onChange={handleChange} placeholder="e.g. DEP-2024-001" />
        </div>

        <div className="input-group">
          <label>Invoice Number</label>
          <input type="text" name="invoiceNumber" value={financials.invoiceNumber} onChange={handleChange} placeholder="e.g. INV-2024-001" />
        </div>

        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <label>Discount Proof Link</label>
          <input type="url" name="discountLink" value={financials.discountLink} onChange={handleChange} placeholder="https://..." />
        </div>
      </div>
    </div>
  );
};

export default Step3Financials;
