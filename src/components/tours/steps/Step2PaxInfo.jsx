import React, { useEffect } from 'react';
import { formatCurrency, parseCurrency } from '../../../utils/currency';

const emptyPax = { title: 'Mr', firstName: '', lastName: '', email: '', phone: '', sellingPrice: '', profit: '', discount: '', notes: '' };

const Step2PaxInfo = ({ data, updateData }) => {
  
  // Sync paxInfo array size with paxCount
  useEffect(() => {
    const currentCount = data.paxInfo.length;
    if (currentCount < data.paxCount) {
      const added = Array(data.paxCount - currentCount).fill(null).map((_, i) => ({ ...emptyPax, id: Date.now() + i }));
      updateData({ paxInfo: [...data.paxInfo, ...added] });
    } else if (currentCount > data.paxCount) {
      updateData({ paxInfo: data.paxInfo.slice(0, data.paxCount) });
    }
  }, [data.paxCount, data.paxInfo.length]);

  const handlePaxChange = (index, field, value) => {
    const updatedPaxInfo = [...data.paxInfo];
    updatedPaxInfo[index] = { ...updatedPaxInfo[index], [field]: value };
    updateData({ paxInfo: updatedPaxInfo });
  };

  const handleCurrencyChange = (index, field, value) => {
    // Only allow numbers and commas during typing
    if (!/^[0-9,]*$/.test(value)) return;
    
    // Parse it and then immediately format it
    const parsed = parseCurrency(value);
    const updatedPaxInfo = [...data.paxInfo];
    updatedPaxInfo[index] = { ...updatedPaxInfo[index], [field]: parsed === 0 && value !== '0' ? '' : parsed };
    updateData({ paxInfo: updatedPaxInfo });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Step 2: Passenger Information</h2>
      
      {data.paxInfo.map((pax, index) => (
        <div key={pax.id || index} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Passenger {index + 1}
          </h3>
          
          <div className="form-grid">
            <div className="input-group">
              <label>Title</label>
              <select 
                value={pax.title} 
                onChange={(e) => handlePaxChange(index, 'title', e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
                  padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none'
                }}
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Mstr">Mstr</option>
                <option value="Miss">Miss</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>First Name</label>
              <input type="text" value={pax.firstName} onChange={(e) => handlePaxChange(index, 'firstName', e.target.value)} />
            </div>
            
            <div className="input-group">
              <label>Last Name</label>
              <input type="text" value={pax.lastName} onChange={(e) => handlePaxChange(index, 'lastName', e.target.value)} />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" value={pax.email} onChange={(e) => handlePaxChange(index, 'email', e.target.value)} />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" value={pax.phone} onChange={(e) => handlePaxChange(index, 'phone', e.target.value)} />
            </div>
            
            <div className="input-group">
              <label>Selling Price</label>
              <input 
                type="text" 
                value={formatCurrency(pax.sellingPrice)} 
                onChange={(e) => handleCurrencyChange(index, 'sellingPrice', e.target.value)} 
                placeholder="0"
              />
            </div>

            <div className="input-group">
              <label>Profit</label>
              <input 
                type="text" 
                value={formatCurrency(pax.profit)} 
                onChange={(e) => handleCurrencyChange(index, 'profit', e.target.value)} 
                placeholder="0"
              />
            </div>

            <div className="input-group">
              <label>Discount</label>
              <input 
                type="text" 
                value={formatCurrency(pax.discount)} 
                onChange={(e) => handleCurrencyChange(index, 'discount', e.target.value)} 
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Notes</label>
            <textarea 
              value={pax.notes} 
              onChange={(e) => handlePaxChange(index, 'notes', e.target.value)}
              rows="3"
              style={{
                background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
                padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Step2PaxInfo;
