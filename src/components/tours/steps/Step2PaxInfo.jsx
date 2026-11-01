import { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Plus, Minus, Users, Star } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../../../utils/currency';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import {
  resizePaxList,
  hasPerPaxPricing,
  computeFinancialsFromPax
} from '../../../utils/tourHelpers';

const Step2PaxInfo = ({ data, updateData }) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const paxList = resizePaxList(data.paxInfo, data.paxCount);
  const [collapsedMap, setCollapsedMap] = useState({});

  const commitPaxAndFinancials = (nextPaxList, extraPatch = {}) => {
    const patch = {
      ...extraPatch,
      paxInfo: nextPaxList
    };
    if (hasPerPaxPricing(nextPaxList)) {
      patch.financials = computeFinancialsFromPax(nextPaxList, data.financials);
    }
    updateData(patch);
  };

  const handlePaxChange = (index, field, value) => {
    const updatedPaxInfo = [...paxList];
    updatedPaxInfo[index] = { ...updatedPaxInfo[index], [field]: value };
    commitPaxAndFinancials(updatedPaxInfo);
  };

  const handleCurrencyChange = (index, field, value) => {
    if (!/^[0-9,]*$/.test(value)) return;

    const parsed = parseCurrency(value);
    const parsedVal = parsed === 0 && value !== '0' ? '' : parsed;
    const updatedPaxInfo = [...paxList];

    if (field === 'basicPrice') {
      updatedPaxInfo[index] = {
        ...updatedPaxInfo[index],
        basicPrice: parsedVal,
        sellingPrice: parsedVal
      };
    } else if (field === 'discountSupplier' || field === 'discountBranch') {
      const currentSupp =
        field === 'discountSupplier'
          ? Number(parsedVal) || 0
          : Number(updatedPaxInfo[index].discountSupplier) || 0;
      const currentBranch =
        field === 'discountBranch'
          ? Number(parsedVal) || 0
          : Number(updatedPaxInfo[index].discountBranch) || 0;
      updatedPaxInfo[index] = {
        ...updatedPaxInfo[index],
        [field]: parsedVal,
        discount: currentSupp + currentBranch
      };
    } else {
      updatedPaxInfo[index] = { ...updatedPaxInfo[index], [field]: parsedVal };
    }

    commitPaxAndFinancials(updatedPaxInfo);
  };

  const handleCopyFirstPaxPricingToAll = () => {
    if (paxList.length <= 1) return;
    const source = paxList[0];
    const srcBasic = source.basicPrice !== undefined && source.basicPrice !== '' ? source.basicPrice : source.sellingPrice;
    const srcSupp = source.discountSupplier;
    const srcBranch = source.discountBranch;
    const srcProfit = source.profit;
    const srcDisc = (Number(srcSupp) || 0) + (Number(srcBranch) || 0);

    const updated = paxList.map((pax, idx) =>
      idx === 0
        ? pax
        : {
            ...pax,
            basicPrice: srcBasic,
            sellingPrice: srcBasic,
            profit: srcProfit,
            discountSupplier: srcSupp,
            discountBranch: srcBranch,
            discount: srcDisc
          }
    );

    const nextFinancials = computeFinancialsFromPax(updated, data.financials);
    updateData({
      paxInfo: updated,
      financials: nextFinancials
    });
    toast.success(`Applied Passenger 1 pricing across all ${updated.length} travelers!`);
  };

  const handleAdjustPaxCount = (delta) => {
    const nextCount = Math.max(1, (Number(data.paxCount) || 1) + delta);
    if (nextCount === data.paxCount) return;
    const resized = resizePaxList(paxList, nextCount);
    commitPaxAndFinancials(resized, { paxCount: nextCount });
  };

  const toggleAllCollapsed = (shouldCollapse) => {
    const next = {};
    paxList.forEach((_, idx) => {
      next[idx] = shouldCollapse;
    });
    setCollapsedMap(next);
  };

  // Group live totals
  const liveTotals = computeFinancialsFromPax(paxList, data.financials);
  const anyCollapsed = paxList.some((_, idx) => Boolean(collapsedMap[idx]));

  return (
    <div>
      {/* Header & Quick Group Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.85rem',
          marginBottom: '1.15rem'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Step 2: Traveler Manifest &amp; Per-Pax Pricing
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Add traveler details and individual pricing — or leave pricing blank here to enter a group lump-sum in Step 3.
          </p>
        </div>

        {/* Quick Pax Counter & Bulk Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.28rem 0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.06)'
            }}
          >
            <button
              type="button"
              onClick={() => handleAdjustPaxCount(-1)}
              disabled={paxList.length <= 1}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: paxList.length <= 1 ? 'not-allowed' : 'pointer',
                opacity: paxList.length <= 1 ? 0.45 : 1
              }}
              title="Remove last passenger slot"
            >
              <Minus size={13} />
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '0 0.35rem', color: 'var(--text-main)' }}>
              {paxList.length} Pax
            </span>
            <button
              type="button"
              onClick={() => handleAdjustPaxCount(1)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Add passenger slot"
            >
              <Plus size={13} />
            </button>
          </div>

          {paxList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handleCopyFirstPaxPricingToAll}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  borderColor: isLight ? '#bae6fd' : 'rgba(0, 168, 255, 0.35)',
                  background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.1)'
                }}
              >
                <Copy size={13} /> Copy Pax 1 Pricing to All ({paxList.length})
              </button>

              <button
                type="button"
                onClick={() => toggleAllCollapsed(!anyCollapsed)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
              >
                {anyCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Group Totals Strip */}
      {hasPerPaxPricing(paxList) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            padding: '0.8rem 1.1rem',
            marginBottom: '1.25rem',
            borderRadius: '12px',
            background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.08)',
            border: `1px solid ${isLight ? '#bae6fd' : 'rgba(0, 168, 255, 0.25)'}`,
            fontSize: '0.82rem'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', color: 'var(--primary)' }}>
            <Users size={15} /> Group Sum ({paxList.length} Travelers)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Total Selling (Omset): </span>
              <strong className="font-mono" style={{ color: 'var(--primary)' }}>
                Rp {formatCurrency(liveTotals.totalSellingPrice)}
              </strong>
            </span>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Total Nett (Cost): </span>
              <strong className="font-mono" style={{ color: isLight ? '#047857' : '#34d399' }}>
                Rp {formatCurrency(liveTotals.totalNettPrice)}
              </strong>
            </span>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Profit: </span>
              <strong className="font-mono" style={{ color: 'var(--success)' }}>
                Rp {formatCurrency(liveTotals.profit)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Passenger Cards */}
      {paxList.map((pax, index) => {
        const pBasic =
          Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
        const pDiscSupplier = Number(pax.discountSupplier) || 0;
        const pDiscBranch = Number(pax.discountBranch) || 0;
        const pProfit = Number(pax.profit) || 0;

        const pSellingPrice = pBasic - pDiscSupplier - pDiscBranch;
        const pNettPrice = pBasic - pDiscSupplier - pProfit;

        const fullName = `${pax.firstName || ''} ${pax.lastName || ''}`.trim();
        const isCollapsed = Boolean(collapsedMap[index]);

        return (
          <div
            key={pax.id || index}
            className="card"
            style={{
              marginBottom: '1rem',
              padding: isCollapsed ? '0.9rem 1.25rem' : '1.25rem',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            {/* Collapsible Card Header */}
            <div
              onClick={() => setCollapsedMap((prev) => ({ ...prev, [index]: !prev[index] }))}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                cursor: 'pointer',
                borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                paddingBottom: isCollapsed ? 0 : '0.75rem',
                marginBottom: isCollapsed ? 0 : '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </span>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: 'var(--primary)' }}>
                  Passenger {index + 1}
                </h3>
                {index === 0 && (
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                  >
                    <Star size={10} /> Lead Traveler
                  </span>
                )}
                <span style={{ fontSize: '0.84rem', fontWeight: '600', color: fullName ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                  · {fullName ? `${pax.title}. ${fullName}` : 'Name not entered yet'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
                {pBasic > 0 && (
                  <span
                    className="font-mono"
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.12)',
                      color: 'var(--primary)',
                      fontWeight: '700'
                    }}
                  >
                    Rp {formatCurrency(pSellingPrice)}
                  </span>
                )}
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.73rem' }}>
                  {isCollapsed ? 'Expand' : 'Collapse'}
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Title</label>
                    <select
                      value={pax.title || 'Mr'}
                      onChange={(e) => handlePaxChange(index, 'title', e.target.value)}
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
                    <input
                      type="text"
                      value={pax.firstName || ''}
                      onChange={(e) => handlePaxChange(index, 'firstName', e.target.value)}
                      placeholder="Given name as on passport"
                    />
                  </div>

                  <div className="input-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={pax.lastName || ''}
                      onChange={(e) => handlePaxChange(index, 'lastName', e.target.value)}
                      placeholder="Family / surname"
                    />
                  </div>

                  <div className="input-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={pax.email || ''}
                      onChange={(e) => handlePaxChange(index, 'email', e.target.value)}
                      placeholder="guest@email.com"
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={pax.phone || ''}
                      onChange={(e) => handlePaxChange(index, 'phone', e.target.value)}
                      placeholder="+62 812..."
                    />
                  </div>

                  <div className="input-group">
                    <label>Harga Dasar Tour (Basic Price)</label>
                    <input
                      type="text"
                      value={formatCurrency(
                        pax.basicPrice !== undefined && pax.basicPrice !== ''
                          ? pax.basicPrice
                          : pax.sellingPrice
                      )}
                      onChange={(e) => handleCurrencyChange(index, 'basicPrice', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="input-group">
                    <label>Nominal Profit</label>
                    <input
                      type="text"
                      value={formatCurrency(pax.profit)}
                      onChange={(e) => handleCurrencyChange(index, 'profit', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="input-group">
                    <label>Discount Supplier</label>
                    <input
                      type="text"
                      value={formatCurrency(pax.discountSupplier)}
                      onChange={(e) => handleCurrencyChange(index, 'discountSupplier', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="input-group">
                    <label>Discount Branch</label>
                    <input
                      type="text"
                      value={formatCurrency(pax.discountBranch)}
                      onChange={(e) => handleCurrencyChange(index, 'discountBranch', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Calculated Preview Strip for this passenger */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '0.72rem 1rem',
                    background: isLight ? '#f4f9ff' : 'rgba(0, 168, 255, 0.06)',
                    border: `1px solid ${isLight ? '#bae6fd' : 'rgba(0, 168, 255, 0.22)'}`,
                    borderRadius: '10px',
                    marginTop: '1rem',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Selling Price (After Disc): </span>
                    <strong className="font-mono" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                      Rp {formatCurrency(pSellingPrice)}
                    </strong>
                  </div>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Nett Price (Cost): </span>
                    <strong
                      className="font-mono"
                      style={{ color: isLight ? '#047857' : '#34d399', fontSize: '0.9rem' }}
                    >
                      Rp {formatCurrency(pNettPrice)}
                    </strong>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '0.9rem' }}>
                  <label>Special Requests / Dietary / Rooming Notes</label>
                  <textarea
                    value={pax.notes || ''}
                    onChange={(e) => handlePaxChange(index, 'notes', e.target.value)}
                    rows="2"
                    placeholder="e.g. Twin share with Pax 2, No beef, Wheelchair assistance..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Step2PaxInfo;
