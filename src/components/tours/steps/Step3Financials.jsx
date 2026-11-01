import { Calculator, Users, Edit3 } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../../../utils/currency';
import { useTheme } from '../../../context/ThemeContext';
import { hasPerPaxPricing, computeFinancialsFromPax } from '../../../utils/tourHelpers';

const Step3Financials = ({ data, updateData, errors, setErrors, onGoToPassengers }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const paxPricingActive = hasPerPaxPricing(data.paxInfo);
  const financials = paxPricingActive
    ? computeFinancialsFromPax(data.paxInfo, data.financials || {})
    : data.financials || {};

  const basicPrice =
    financials.basicTourPrice !== undefined
      ? Number(financials.basicTourPrice) || 0
      : Number(financials.totalSales) || 0;
  const discSupplier = Number(financials.discountSupplier || 0);
  const discBranch = Number(financials.discountBranch || 0);
  const profitVal = Number(financials.profit || 0);
  const totalSellingPrice =
    financials.totalSellingPrice !== undefined
      ? Number(financials.totalSellingPrice) || 0
      : basicPrice - discSupplier - discBranch;
  const totalNettPrice =
    financials.totalNettPrice !== undefined
      ? Number(financials.totalNettPrice) || 0
      : basicPrice - discSupplier - profitVal;
  const depositAmount = Number(financials.depositAmount || 0);
  const sisaPelunasan = totalSellingPrice - depositAmount;
  const sisaCostAgent = totalNettPrice - depositAmount;
  const profitMarginPct =
    totalSellingPrice > 0 ? ((profitVal / totalSellingPrice) * 100).toFixed(1) : '0.0';

  const handleCurrencyFieldChange = (field, value) => {
    if (!/^[0-9,]*$/.test(value)) return;
    const parsed = parseCurrency(value);
    const parsedVal = parsed === 0 && value !== '0' ? 0 : parsed;

    const fin = { ...(data.financials || {}), [field]: parsedVal };
    const basic = field === 'basicTourPrice' ? parsedVal : Number(fin.basicTourPrice) || 0;
    const dSupp = field === 'discountSupplier' ? parsedVal : Number(fin.discountSupplier) || 0;
    const dBranch = field === 'discountBranch' ? parsedVal : Number(fin.discountBranch) || 0;
    const prof = field === 'profit' ? parsedVal : Number(fin.profit) || 0;

    const nextSelling = basic - dSupp - dBranch;
    const nextNett = basic - dSupp - prof;
    const depAmt = Number(fin.depositAmount || 0);

    updateData({
      financials: {
        ...fin,
        basicTourPrice: basic,
        totalSales: basic,
        discountSupplier: dSupp,
        discountBranch: dBranch,
        discount: dSupp + dBranch,
        profit: prof,
        totalSellingPrice: nextSelling,
        totalOmset: nextSelling,
        totalNettPrice: nextNett,
        cost: nextNett,
        sisaPelunasan: nextSelling - depAmt
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'depositNumber' && setErrors && value.trim()) {
      setErrors((prev) => ({ ...prev, depositNumber: null }));
    }
    updateData({
      financials: {
        ...financials,
        [name]: value
      }
    });
  };

  const handleSetDepositPreset = (amount) => {
    const safeAmt = Math.max(0, Math.round(amount));
    updateData({
      financials: {
        ...financials,
        depositAmount: safeAmt,
        sisaPelunasan: totalSellingPrice - safeAmt
      }
    });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.35rem'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Step 3: Financials, Deposit &amp; Invoice
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Review group revenue, supplier/branch discounts, deposit receipt, and settlement balance.
          </p>
        </div>

        {paxPricingActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.73rem' }}>
              <Users size={12} /> Auto-summed from {data.paxInfo?.length || 1} travelers
            </span>
            {onGoToPassengers && (
              <button
                type="button"
                onClick={onGoToPassengers}
                className="btn btn-secondary"
                style={{ padding: '0.32rem 0.7rem', fontSize: '0.76rem' }}
              >
                <Edit3 size={12} /> Edit Per-Pax Prices
              </button>
            )}
          </div>
        ) : (
          <span
            className="badge badge-primary"
            style={{ fontSize: '0.73rem' }}
          >
            <Calculator size={12} /> Group Lump-Sum Input Mode
          </span>
        )}
      </div>

      {/* Cost Breakdown Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.15rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.65rem'
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700' }}>
            Rincian &amp; Perhitungan Biaya Tour
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {paxPricingActive
              ? 'Calculated automatically from Passenger Information (Step 2)'
              : 'Enter group totals directly below (or enter per-traveler in Step 2)'}
          </span>
        </div>

        {/* 4 Breakdown Boxes (Editable when no per-pax prices, Read-Only Summary when per-pax prices exist) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          {/* 1. Harga Dasar Tour */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}
          >
            <label
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.35rem'
              }}
            >
              Harga Dasar Tour (Basic Price)
            </label>
            {paxPricingActive ? (
              <div className="font-mono" style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-main)' }}>
                Rp {formatCurrency(basicPrice)}
              </div>
            ) : (
              <input
                type="text"
                value={formatCurrency(basicPrice)}
                onChange={(e) => handleCurrencyFieldChange('basicTourPrice', e.target.value)}
                placeholder="0"
                className="font-mono"
                style={{ fontWeight: '700' }}
              />
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.25rem' }}>
              Gross published group price
            </span>
          </div>

          {/* 2. Nominal Profit */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>
                Nominal Profit
              </label>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: isLight ? '#047857' : '#34d399'
                }}
              >
                {profitMarginPct}% margin
              </span>
            </div>
            {paxPricingActive ? (
              <div
                className="font-mono"
                style={{ fontWeight: '800', fontSize: '1.15rem', color: isLight ? '#047857' : '#34d399' }}
              >
                Rp {formatCurrency(profitVal)}
              </div>
            ) : (
              <input
                type="text"
                value={formatCurrency(profitVal)}
                onChange={(e) => handleCurrencyFieldChange('profit', e.target.value)}
                placeholder="0"
                className="font-mono"
                style={{ fontWeight: '700' }}
              />
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.25rem' }}>
              Agency operational margin
            </span>
          </div>

          {/* 3. Discount Supplier */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            <label
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.35rem'
              }}
            >
              Discount Supplier
            </label>
            {paxPricingActive ? (
              <div
                className="font-mono"
                style={{ fontWeight: '800', fontSize: '1.15rem', color: isLight ? '#b45309' : '#fbbf24' }}
              >
                - Rp {formatCurrency(discSupplier)}
              </div>
            ) : (
              <input
                type="text"
                value={formatCurrency(discSupplier)}
                onChange={(e) => handleCurrencyFieldChange('discountSupplier', e.target.value)}
                placeholder="0"
                className="font-mono"
                style={{ fontWeight: '700' }}
              />
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.25rem' }}>
              Vendor / airline / operator discount
            </span>
          </div>

          {/* 4. Discount Branch */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            <label
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.35rem'
              }}
            >
              Discount Branch
            </label>
            {paxPricingActive ? (
              <div
                className="font-mono"
                style={{ fontWeight: '800', fontSize: '1.15rem', color: isLight ? '#b45309' : '#fbbf24' }}
              >
                - Rp {formatCurrency(discBranch)}
              </div>
            ) : (
              <input
                type="text"
                value={formatCurrency(discBranch)}
                onChange={(e) => handleCurrencyFieldChange('discountBranch', e.target.value)}
                placeholder="0"
                className="font-mono"
                style={{ fontWeight: '700' }}
              />
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.25rem' }}>
              Branch promotional discount
            </span>
          </div>
        </div>

        {/* Highlighted Results Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}
        >
          {/* Formula 1: Total Selling Price After Discount */}
          <div
            style={{
              padding: '1.15rem',
              background: isLight
                ? 'linear-gradient(135deg, #eff8ff 0%, #e0f2fe 100%)'
                : 'linear-gradient(135deg, rgba(0, 168, 255, 0.14), rgba(0, 119, 255, 0.06))',
              borderRadius: '12px',
              border: `1.5px solid ${isLight ? '#7dd3fc' : 'rgba(0, 168, 255, 0.35)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span
                style={{
                  color: 'var(--primary)',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Total Selling Price (After Disc)
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                Omset
              </span>
            </div>
            <div
              className="font-mono"
              style={{
                fontWeight: '800',
                color: 'var(--primary)',
                fontSize: '1.45rem',
                marginBottom: '0.3rem'
              }}
            >
              Rp {formatCurrency(totalSellingPrice)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              = Basic ({formatCurrency(basicPrice)}) - Disc Supplier ({formatCurrency(discSupplier)}) - Disc Branch ({formatCurrency(discBranch)})
            </div>
          </div>

          {/* Formula 2: Total Nett Price (Cost) */}
          <div
            style={{
              padding: '1.15rem',
              background: isLight
                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(5, 150, 105, 0.06))',
              borderRadius: '12px',
              border: `1.5px solid ${isLight ? '#6ee7b7' : 'rgba(16, 185, 129, 0.35)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span
                style={{
                  color: isLight ? '#047857' : '#34d399',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Total Nett Price (Cost)
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                Invoice Base
              </span>
            </div>
            <div
              className="font-mono"
              style={{
                fontWeight: '800',
                color: isLight ? '#047857' : '#34d399',
                fontSize: '1.45rem',
                marginBottom: '0.3rem'
              }}
            >
              Rp {formatCurrency(totalNettPrice)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              = Basic ({formatCurrency(basicPrice)}) - Disc Supplier ({formatCurrency(discSupplier)}) - Profit ({formatCurrency(profitVal)})
            </div>
          </div>
        </div>
      </div>

      {/* Operational Invoice & Deposit Settings */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.55rem'
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700' }}>
            Deposit Receipt (DP) &amp; Invoice Administration
          </h3>
          <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
            * Nomor DP Required
          </span>
        </div>

        {errors?.depositNumber && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              fontWeight: '600'
            }}
          >
            {errors.depositNumber}
          </div>
        )}

        <div className="form-grid">
          <div className="input-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Nomor DP (Deposit Number) <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>*</span>
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: financials.depositNumber?.trim()
                    ? isLight ? '#047857' : '#34d399'
                    : 'var(--danger)',
                  fontWeight: '700'
                }}
              >
                {financials.depositNumber?.trim() ? 'Verified' : 'Required'}
              </span>
            </label>
            <input
              type="text"
              name="depositNumber"
              value={financials.depositNumber || ''}
              onChange={handleChange}
              placeholder="e.g. DP-2026-001 / DEP-088"
              required
              style={{
                borderColor:
                  errors?.depositNumber || !financials.depositNumber?.trim()
                    ? 'rgba(239, 68, 68, 0.55)'
                    : undefined
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
              Required deposit receipt reference before saving booking.
            </span>
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Nominal Deposit (IDR)</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '700' }}>
                Down Payment / DP
              </span>
            </label>
            <input
              type="text"
              name="depositAmount"
              value={formatCurrency(depositAmount)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                const val = Number(raw) || 0;
                updateData({
                  financials: {
                    ...financials,
                    depositAmount: val,
                    sisaPelunasan: totalSellingPrice - val
                  }
                });
              }}
              placeholder="0"
              className="font-mono"
            />
            {totalSellingPrice > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Quick set:</span>
                {[
                  { label: '25%', val: totalSellingPrice * 0.25 },
                  { label: '30%', val: totalSellingPrice * 0.3 },
                  { label: '50%', val: totalSellingPrice * 0.5 },
                  { label: 'Lunas 100%', val: totalSellingPrice },
                  { label: 'Clear', val: 0 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSetDepositPreset(preset.val)}
                    style={{
                      padding: '0.16rem 0.5rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--border)',
                      background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.08)',
                      color: preset.label === 'Lunas 100%' ? 'var(--success)' : 'var(--primary)',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Nomor Invoice (Optional if not issued yet)</label>
            <input
              type="text"
              name="invoiceNumber"
              value={financials.invoiceNumber || ''}
              onChange={handleChange}
              placeholder="e.g. INV-2026-001"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
              Can also be added anytime via Quick Invoice in All Bookings.
            </span>
          </div>

          <div className="input-group">
            <label>Discount Approval Link</label>
            <input
              type="url"
              name="discountLink"
              value={financials.discountLink || ''}
              onChange={handleChange}
              placeholder="https://..."
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
              Link to branch/supplier discount approval document (if applicable).
            </span>
          </div>
        </div>

        {/* Live Pelunasan Preview Strip */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}
        >
          {/* Passenger Settlement Preview */}
          <div
            style={{
              padding: '0.9rem 1.05rem',
              background: isLight ? '#f0f9ff' : 'rgba(0, 168, 255, 0.06)',
              borderRadius: '10px',
              border: `1px solid ${isLight ? '#bae6fd' : 'rgba(0, 168, 255, 0.25)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Sisa Pelunasan Tamu (Passenger)
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.66rem' }}>
                Selling - DP
              </span>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color:
                  sisaPelunasan <= 0 && totalSellingPrice > 0
                    ? isLight ? '#047857' : '#34d399'
                    : 'var(--text-main)'
              }}
            >
              Rp {formatCurrency(Math.max(0, sisaPelunasan))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Jual ({formatCurrency(totalSellingPrice)}) - DP ({formatCurrency(depositAmount)})
              {sisaPelunasan <= 0 && totalSellingPrice > 0 && (
                <span style={{ color: isLight ? '#047857' : '#34d399', fontWeight: '800' }}> · LUNAS</span>
              )}
            </div>
          </div>

          {/* Agent Cost Settlement Preview */}
          <div
            style={{
              padding: '0.9rem 1.05rem',
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.06)',
              borderRadius: '10px',
              border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.25)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: isLight ? '#047857' : '#34d399',
                  textTransform: 'uppercase'
                }}
              >
                Pelunasan Cost / Invoice (Agent)
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>
                Cost - DP
              </span>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: isLight ? '#047857' : '#34d399'
              }}
            >
              Rp {formatCurrency(Math.max(0, sisaCostAgent))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Cost ({formatCurrency(totalNettPrice)}) - DP ({formatCurrency(depositAmount)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Financials;
