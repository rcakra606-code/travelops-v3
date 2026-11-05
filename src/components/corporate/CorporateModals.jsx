import { 
  Building, Phone, Mail, ExternalLink, Edit2, 
  CreditCard, Plane, DollarSign, Calendar, MessageSquare, X, ShieldAlert
} from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';

// Helper to format WhatsApp link
const getWhatsAppUrl = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, '');
  const international = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
  return `https://wa.me/${international}`;
};

// 1. CONFIRM DELETE MODAL
export const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '440px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.12)', 
            color: '#ef4444', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: '600' }}>
              {title || 'Confirm Deletion'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-main)',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn" 
            onClick={onConfirm}
            style={{ 
              background: '#ef4444', 
              color: '#ffffff', 
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. ACCOUNT FORM MODAL
export const AccountFormModal = ({
  isOpen,
  onClose,
  accountFormData,
  setAccountFormData,
  handleSubmit,
  isEditing,
  neonBlue = '#00d4ff'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${neonBlue}18`, color: neonBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Corporate Account' : 'New Corporate Account'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Manage company profile, contact PIC, credit limit, and service fee structures.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* General Info */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: neonBlue, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <Building size={16} /> General Company Information
              </h4>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Account Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. CORP-001"
                    value={accountFormData.accountCode} 
                    onChange={e => setAccountFormData({ ...accountFormData, accountCode: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Corporate / Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. PT Mandiri Solusindo"
                    value={accountFormData.corporateName || accountFormData.companyName || ''} 
                    onChange={e => setAccountFormData({ 
                      ...accountFormData, 
                      corporateName: e.target.value,
                      companyName: e.target.value 
                    })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Account Status</label>
                  <select 
                    value={accountFormData.status} 
                    onChange={e => setAccountFormData({ ...accountFormData, status: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Credit Limit (IDR)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={accountFormData.creditLimit} 
                    onChange={e => setAccountFormData({ ...accountFormData, creditLimit: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Office Address</label>
                  <input 
                    type="text" 
                    placeholder="Street, City, Postal Code"
                    value={accountFormData.address} 
                    onChange={e => setAccountFormData({ ...accountFormData, address: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
              </div>
            </div>

            {/* PIC Info */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <Phone size={16} /> PIC / Booker Contact Details
              </h4>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>PIC Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={accountFormData.picName} 
                    onChange={e => setAccountFormData({ ...accountFormData, picName: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Phone / WhatsApp Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 08123456789"
                    value={accountFormData.picPhone} 
                    onChange={e => setAccountFormData({ ...accountFormData, picPhone: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Office Email</label>
                  <input 
                    type="email" 
                    placeholder="pic@corporate.com"
                    value={accountFormData.picOfficeEmail} 
                    onChange={e => setAccountFormData({ ...accountFormData, picOfficeEmail: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Personal Email</label>
                  <input 
                    type="email" 
                    placeholder="john@gmail.com"
                    value={accountFormData.picPersonalEmail} 
                    onChange={e => setAccountFormData({ ...accountFormData, picPersonalEmail: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
              </div>
            </div>

            {/* Service Fees */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <DollarSign size={16} /> Service Fees Profile (IDR)
              </h4>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>Flight Service Fees</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                  {['domestic', 'international', 'reissued', 'refund', 'void', 'revalidate'].map(fee => (
                    <div className="input-group" key={`flight-${fee}`}>
                      <label style={{ fontSize: '0.725rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{fee}</label>
                      <input 
                        type="number" 
                        value={accountFormData.flightFee?.[fee] ?? 0} 
                        onChange={e => setAccountFormData({
                          ...accountFormData, 
                          flightFee: { ...accountFormData.flightFee, [fee]: Number(e.target.value) || 0 }
                        })} 
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' }} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>Hotel Service Fees</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                  {['domestic', 'international', 'reissued', 'refund', 'void', 'revalidate'].map(fee => (
                    <div className="input-group" key={`hotel-${fee}`}>
                      <label style={{ fontSize: '0.725rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{fee}</label>
                      <input 
                        type="number" 
                        value={accountFormData.hotelFee?.[fee] ?? 0} 
                        onChange={e => setAccountFormData({
                          ...accountFormData, 
                          hotelFee: { ...accountFormData.hotelFee, [fee]: Number(e.target.value) || 0 }
                        })} 
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <Plane size={16} /> Additional Details & Credentials
              </h4>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Airlines Corporate Account Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GA-CORP-9921" 
                    value={accountFormData.airlinesCode} 
                    onChange={e => setAccountFormData({ ...accountFormData, airlinesCode: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Detail Link (Google Drive / CRM)</label>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={accountFormData.detailLink} 
                    onChange={e => setAccountFormData({ ...accountFormData, detailLink: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
                  />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Account Remarks / Notes</label>
                  <textarea 
                    placeholder="Special contract notes, payment terms, or billing contact..."
                    value={accountFormData.remarks} 
                    onChange={e => setAccountFormData({ ...accountFormData, remarks: e.target.value })} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px', minHeight: '65px' }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
              {isEditing ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. SALES FORM MODAL
export const SalesFormModal = ({
  isOpen,
  onClose,
  salesFormData,
  setSalesFormData,
  handleSubmit,
  isEditing,
  accounts,
  categories,
  neonBlue = '#00d4ff'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${neonBlue}18`, color: neonBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Sales Record' : 'Add Sales Record'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record monthly corporate billing and margin details.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Period (YYYY-MM) <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="month" 
                required 
                value={salesFormData.date} 
                onChange={e => setSalesFormData({ ...salesFormData, date: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Corporate Account <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                required 
                value={salesFormData.accountCode} 
                onChange={e => setSalesFormData({ ...salesFormData, accountCode: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.accountCode}>
                    {a.accountCode} - {a.corporateName || a.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Service Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                required 
                value={salesFormData.category} 
                onChange={e => setSalesFormData({ ...salesFormData, category: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Sales Amount (IDR) <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="number" 
                required 
                placeholder="0"
                value={salesFormData.salesAmount} 
                onChange={e => setSalesFormData({ ...salesFormData, salesAmount: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Profit Amount (IDR) <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="number" 
                required 
                placeholder="0"
                value={salesFormData.profitAmount} 
                onChange={e => setSalesFormData({ ...salesFormData, profitAmount: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px' }} 
              />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Remarks / Notes</label>
              <textarea 
                placeholder="Invoice number, PNR reference, or notes..."
                value={salesFormData.remarks} 
                onChange={e => setSalesFormData({ ...salesFormData, remarks: e.target.value })} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: '8px', minHeight: '60px' }} 
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
              {isEditing ? 'Save Changes' : 'Record Sales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. 360° ACCOUNT DOSSIER SLIDE-OVER DRAWER
export const AccountDossierDrawer = ({
  account,
  sales = [],
  onClose,
  onEdit,
  neonBlue = '#00d4ff',
  formatCurrency
}) => {
  if (!account) return null;

  const compName = account.corporateName || account.companyName || 'Corporate Account';
  const creditLimit = Number(account.creditLimit) || 0;

  // Account specific sales & metrics
  const accSales = sales.filter(s => s.accountCode === account.accountCode);
  const totalSalesAmount = accSales.reduce((sum, s) => sum + (Number(s.salesAmount) || 0), 0);
  const totalProfitAmount = accSales.reduce((sum, s) => sum + (Number(s.profitAmount) || 0), 0);
  const overallMargin = totalSalesAmount > 0 ? ((totalProfitAmount / totalSalesAmount) * 100).toFixed(1) : 0;

  // Credit limit utilization ratio
  const utilizationRatio = creditLimit > 0 ? (totalSalesAmount / creditLimit) * 100 : 0;
  const isOverLimit = utilizationRatio >= 100;
  const isWarningLimit = utilizationRatio >= 80 && utilizationRatio < 100;

  const waUrl = getWhatsAppUrl(account.picPhone);

  return (
    <SlideOverDrawer
      isOpen={Boolean(account)}
      onClose={onClose}
      title={compName}
      subtitle={`Account Code: ${account.accountCode} • Status: ${account.status}`}
      width="620px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px' }}
          >
            Close
          </button>
          {onEdit && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => { onClose(); onEdit(account); }}
              style={{ background: neonBlue, borderColor: neonBlue, color: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Edit2 size={16} /> Edit Account
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
        
        {/* Credit Limit Utilization Card */}
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: `1px solid ${isOverLimit ? 'rgba(239,68,68,0.4)' : (isWarningLimit ? 'rgba(245,158,11,0.4)' : 'var(--border)')}`,
          borderRadius: '14px', 
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Credit Limit Utilization
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {formatCurrency(totalSalesAmount)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {formatCurrency(creditLimit)}</span>
              </div>
            </div>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              background: isOverLimit ? 'rgba(239, 68, 68, 0.15)' : (isWarningLimit ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
              color: isOverLimit ? '#ef4444' : (isWarningLimit ? '#f59e0b' : '#10b981'),
              border: `1px solid ${isOverLimit ? 'rgba(239, 68, 68, 0.3)' : (isWarningLimit ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)')}`
            }}>
              {utilizationRatio.toFixed(1)}% {isOverLimit ? 'EXCEEDED' : (isWarningLimit ? 'WARNING' : 'HEALTHY')}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-card)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div 
              style={{ 
                width: `${Math.min(utilizationRatio, 100)}%`, 
                height: '100%', 
                background: isOverLimit ? '#ef4444' : (isWarningLimit ? '#f59e0b' : neonBlue),
                transition: 'width 0.4s ease',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Total Margin: <strong style={{ color: '#10b981' }}>{formatCurrency(totalProfitAmount)} ({overallMargin}%)</strong></span>
            <span>Recorded Invoices: <strong style={{ color: 'var(--text-main)' }}>{accSales.length} records</strong></span>
          </div>
        </div>

        {/* PIC & Quick Contact Shortcuts */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: neonBlue, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={16} /> PIC & Direct Contact Shortcuts
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIC Name:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{account.picName || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-main)' }}>{account.picPhone || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Office Email:</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{account.picOfficeEmail || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal Email:</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{account.picPersonalEmail || '-'}</div>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            {account.picPhone && (
              <>
                <a 
                  href={`tel:${account.picPhone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '20px', background: `${neonBlue}15`, color: neonBlue, textDecoration: 'none', border: `1px solid ${neonBlue}30` }}
                >
                  <Phone size={13} /> Call
                </a>
                {waUrl && (
                  <a 
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', textDecoration: 'none', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <MessageSquare size={13} /> WhatsApp
                  </a>
                )}
              </>
            )}
            {account.picOfficeEmail && (
              <a 
                href={`mailto:${account.picOfficeEmail}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', textDecoration: 'none', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                <Mail size={13} /> Email Office
              </a>
            )}
          </div>
        </div>

        {/* Corporate Profile & Credentials */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={16} /> Corporate Profile & Credentials
          </h4>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Office Address:</span>
              <span style={{ color: 'var(--text-main)' }}>{account.address || '-'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Airlines Code:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                {account.airlinesCode ? (
                  <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px' }}>
                    {account.airlinesCode}
                  </span>
                ) : '-'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
              <span style={{ color: 'var(--text-muted)' }}>Detail Link:</span>
              <span>
                {account.detailLink ? (
                  <a href={account.detailLink} target="_blank" rel="noreferrer" style={{ color: neonBlue, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '500' }}>
                    Open Document <ExternalLink size={12}/>
                  </a>
                ) : '-'}
              </span>
            </div>
            {account.remarks && (
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remarks:</span>
                <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{account.remarks}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Fee Structures */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} /> Service Fee Profiles
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: neonBlue, marginBottom: '0.5rem' }}>Flight Fees</div>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(account.flightFee || {}).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.35rem 0', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</td>
                      <td style={{ padding: '0.35rem 0', textAlign: 'right', color: 'var(--text-main)', fontWeight: '500' }}>{formatCurrency(v)}</td>
                    </tr>
                  ))}
                  {Object.keys(account.flightFee || {}).length === 0 && (
                    <tr><td colSpan="2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0' }}>No fee configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>Hotel Fees</div>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(account.hotelFee || {}).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.35rem 0', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</td>
                      <td style={{ padding: '0.35rem 0', textAlign: 'right', color: 'var(--text-main)', fontWeight: '500' }}>{formatCurrency(v)}</td>
                    </tr>
                  ))}
                  {Object.keys(account.hotelFee || {}).length === 0 && (
                    <tr><td colSpan="2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0' }}>No fee configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#a855f7', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} /> Recent Sales Ledger ({accSales.length})
          </h4>
          {accSales.length > 0 ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0' }}>Period</th>
                    <th style={{ padding: '0.5rem' }}>Category</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Sales</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {accSales.slice(0, 8).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-main)', fontWeight: '500' }}>{s.date}</td>
                      <td style={{ padding: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          {s.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.4rem', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>{formatCurrency(s.salesAmount)}</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', color: '#f59e0b', fontWeight: '500' }}>{formatCurrency(s.profitAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No sales records logged yet for this corporate account.
            </div>
          )}
        </div>

      </div>
    </SlideOverDrawer>
  );
};
