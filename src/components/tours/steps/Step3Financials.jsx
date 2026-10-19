import React, { useEffect } from 'react';
import { formatCurrency, parseCurrency } from '../../../utils/currency';

const Step3Financials = ({ data, updateData, errors, setErrors }) => {

  useEffect(() => {
    // Auto calculate from Pax Info if provided
    let totalBasicPrice = 0;
    let totalDiscountSupplier = 0;
    let totalDiscountBranch = 0;
    let totalProfit = 0;
    let hasPaxPrices = false;

    if (Array.isArray(data.paxInfo) && data.paxInfo.length > 0) {
      data.paxInfo.forEach(pax => {
        const bp = Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
        const ds = Number(pax.discountSupplier) || 0;
        const db = Number(pax.discountBranch) || 0;
        const legacyDisc = (pax.discount && !pax.discountSupplier && !pax.discountBranch) ? (Number(pax.discount) || 0) : 0;
        const pf = Number(pax.profit) || 0;

        if (bp > 0 || ds > 0 || db > 0 || pf > 0 || legacyDisc > 0) {
          hasPaxPrices = true;
        }

        totalBasicPrice += bp;
        totalDiscountSupplier += (ds + legacyDisc);
        totalDiscountBranch += db;
        totalProfit += pf;
      });
    }

    if (!hasPaxPrices) {
      totalBasicPrice = Number(data.financials?.basicTourPrice !== undefined ? data.financials.basicTourPrice : (data.financials?.totalSales || 0));
      totalDiscountSupplier = Number(data.financials?.discountSupplier !== undefined ? data.financials.discountSupplier : (data.financials?.discount || 0));
      totalDiscountBranch = Number(data.financials?.discountBranch || 0);
      totalProfit = Number(data.financials?.profit || 0);
    }

    // Logic 1: Total selling price = Harga dasar tour - discount supplier - discount branch
    const totalSellingPrice = totalBasicPrice - totalDiscountSupplier - totalDiscountBranch;

    // Logic 2: Total nett price = Harga dasar tour - discount supplier - profit (untuk kebutuhan pembuatan invoice)
    const totalNettPrice = totalBasicPrice - totalDiscountSupplier - totalProfit;

    updateData({
      financials: {
        ...data.financials,
        basicTourPrice: totalBasicPrice,
        totalSales: totalBasicPrice, // Backwards compatibility
        discountSupplier: totalDiscountSupplier,
        discountBranch: totalDiscountBranch,
        discount: totalDiscountSupplier + totalDiscountBranch, // Backwards compatibility
        profit: totalProfit,
        totalSellingPrice,
        totalOmset: totalSellingPrice, // Backwards compatibility
        totalNettPrice,
        cost: totalNettPrice // Backwards compatibility
      }
    });
  }, [data.paxInfo]); // Re-run when paxInfo changes

  const handleCurrencyFieldChange = (field, value) => {
    if (!/^[0-9,]*$/.test(value)) return;
    const parsed = parseCurrency(value);
    const parsedVal = parsed === 0 && value !== '0' ? 0 : parsed;

    const fin = { ...data.financials, [field]: parsedVal };

    const basic = field === 'basicTourPrice' ? parsedVal : (Number(fin.basicTourPrice) || 0);
    const dSupp = field === 'discountSupplier' ? parsedVal : (Number(fin.discountSupplier) || 0);
    const dBranch = field === 'discountBranch' ? parsedVal : (Number(fin.discountBranch) || 0);
    const prof = field === 'profit' ? parsedVal : (Number(fin.profit) || 0);

    // Logic 1: Total selling price = Harga dasar tour - discount supplier - discount branch
    const totalSellingPrice = basic - dSupp - dBranch;

    // Logic 2: Total nett price = Harga dasar tour - discount supplier - profit
    const totalNettPrice = basic - dSupp - prof;

    updateData({
      financials: {
        ...fin,
        basicTourPrice: basic,
        totalSales: basic,
        discountSupplier: dSupp,
        discountBranch: dBranch,
        discount: dSupp + dBranch,
        profit: prof,
        totalSellingPrice,
        totalOmset: totalSellingPrice,
        totalNettPrice,
        cost: totalNettPrice
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'depositNumber' && setErrors) {
      if (value.trim()) {
        setErrors(prev => ({ ...prev, depositNumber: null }));
      }
    }
    updateData({
      financials: {
        ...data.financials,
        [name]: value
      }
    });
  };

  const { financials } = data;
  const basicPrice = financials.basicTourPrice !== undefined ? financials.basicTourPrice : (financials.totalSales || 0);
  const discSupplier = financials.discountSupplier || 0;
  const discBranch = financials.discountBranch || 0;
  const profitVal = financials.profit || 0;
  const totalSellingPrice = financials.totalSellingPrice !== undefined ? financials.totalSellingPrice : (basicPrice - discSupplier - discBranch);
  const totalNettPrice = financials.totalNettPrice !== undefined ? financials.totalNettPrice : (basicPrice - discSupplier - profitVal);
  const depositAmount = Number(financials.depositAmount || 0);
  const sisaPelunasan = totalSellingPrice - depositAmount;
  const sisaCostAgent = totalNettPrice - depositAmount;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Step 3: Perhitungan Biaya (Financial Summary)</h2>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '700' }}>
            Rincian &amp; Perhitungan Biaya Tour
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Otomatis terakumulasi dari Data Penumpang (Step 2)
          </span>
        </div>
        
        {/* Cost Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          
          {/* 1. Harga Dasar Tour */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
              Harga Dasar Tour (Basic Tour Price)
            </span>
            <div style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'monospace' }}>
              Rp {formatCurrency(basicPrice)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Menggantikan Selling Price</span>
          </div>
          
          {/* 2. Nominal Profit */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
              Nominal Profit (Profit)
            </span>
            <div style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'monospace' }}>
              Rp {formatCurrency(profitVal)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Margin keuntungan tour</span>
          </div>

          {/* 3. Discount Supplier */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
              Discount Supplier
            </span>
            <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#fbbf24', fontFamily: 'monospace' }}>
              - Rp {formatCurrency(discSupplier)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Potongan harga dari vendor/supplier</span>
          </div>

          {/* 4. Discount Branch */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
              Discount Branch
            </span>
            <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#fbbf24', fontFamily: 'monospace' }}>
              - Rp {formatCurrency(discBranch)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Potongan harga cabang</span>
          </div>
        </div>

        {/* Highlighted Results Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          
          {/* Formula 1: Total Selling Price After Discount */}
          <div style={{ 
            padding: '1.15rem', 
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.06))', 
            borderRadius: '0.75rem', 
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Selling Price After Discount
              </span>
              <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--primary)', fontSize: '0.675rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                Omset
              </span>
            </div>
            <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.45rem', fontFamily: 'monospace', marginBottom: '0.35rem' }}>
              Rp {formatCurrency(totalSellingPrice)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              = Harga Dasar ({formatCurrency(basicPrice)}) - Disc Supplier ({formatCurrency(discSupplier)}) - Disc Branch ({formatCurrency(discBranch)})
            </div>
          </div>

          {/* Formula 2: Total Nett Price (Cost) - Kebutuhan Invoice */}
          <div style={{ 
            padding: '1.15rem', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06))', 
            borderRadius: '0.75rem', 
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: '#34d399', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Nett Price (Cost)
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.675rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                Invoice Base
              </span>
            </div>
            <div style={{ fontWeight: '800', color: '#34d399', fontSize: '1.45rem', fontFamily: 'monospace', marginBottom: '0.35rem' }}>
              Rp {formatCurrency(totalNettPrice)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              = Harga Dasar ({formatCurrency(basicPrice)}) - Disc Supplier ({formatCurrency(discSupplier)}) - Profit ({formatCurrency(profitVal)})
            </div>
          </div>

        </div>
      </div>

      {/* Operational Invoice & Deposit Settings */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>
            Informasi Invoice &amp; Administrasi
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '700', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            * Nomor DP Wajib Diisi
          </span>
        </div>

        {errors?.depositNumber && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1.5px solid rgba(239, 68, 68, 0.4)', 
            color: '#f87171', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            fontSize: '0.825rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span><strong>Validasi Wajib Database:</strong> {errors.depositNumber}</span>
          </div>
        )}

        <div className="form-grid">
          <div className="input-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Nomor DP (Deposit Number) <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span></span>
              <span style={{ fontSize: '0.675rem', color: financials.depositNumber?.trim() ? '#34d399' : '#f87171', fontWeight: '700' }}>
                {financials.depositNumber?.trim() ? '✓ Valid' : 'Wajib Diisi'}
              </span>
            </label>
            <input 
              type="text" 
              name="depositNumber" 
              value={financials.depositNumber || ''} 
              onChange={handleChange} 
              placeholder="e.g. DP-2024-001 / DEP-088" 
              required
              style={{
                borderColor: (errors?.depositNumber || (!financials.depositNumber || !financials.depositNumber.trim())) ? 'rgba(239, 68, 68, 0.65)' : undefined,
                background: (!financials.depositNumber || !financials.depositNumber.trim()) ? 'rgba(239, 68, 68, 0.03)' : undefined
              }}
            />
            {(!financials.depositNumber || !financials.depositNumber.trim()) ? (
              <span style={{ fontSize: '0.725rem', color: '#f87171', marginTop: '4px', display: 'block' }}>
                * Nomor DP wajib terinput sebelum konfirmasi dan disimpan ke database.
              </span>
            ) : (
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Nomor DP terverifikasi untuk pencatatan database.
              </span>
            )}
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Nominal Deposit (IDR)</span>
              <span style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: '700' }}>Uang Muka / DP</span>
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
                    ...data.financials,
                    depositAmount: val,
                    sisaPelunasan: totalSellingPrice - val
                  }
                });
              }} 
              placeholder="0" 
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Nominal DP tamu untuk perhitungan Bukti Pelunasan Tour.
            </span>
          </div>

          <div className="input-group">
            <label>Nomor Invoice (Opsional jika belum terbit)</label>
            <input type="text" name="invoiceNumber" value={financials.invoiceNumber || ''} onChange={handleChange} placeholder="e.g. INV-2024-001" />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Dapat diinput sekarang atau menyusul melalui quick update.
            </span>
          </div>

          <div className="input-group">
            <label>Discount Proof Link</label>
            <input type="url" name="discountLink" value={financials.discountLink || ''} onChange={handleChange} placeholder="https://..." />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Link bukti persetujuan diskon (jika ada).
            </span>
          </div>
        </div>

        {/* Live Pelunasan Preview Strip */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          
          {/* Passenger Settlement Preview */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(56, 189, 248, 0.06)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                Pelunasan Tamu (Passenger)
              </span>
              <span style={{ fontSize: '0.675rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                Selling Price - DP
              </span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', color: sisaPelunasan <= 0 && totalSellingPrice > 0 ? '#34d399' : 'var(--text-main)' }}>
              Rp {formatCurrency(Math.max(0, sisaPelunasan))}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Jual ({formatCurrency(totalSellingPrice)}) - DP ({formatCurrency(depositAmount)})
              {sisaPelunasan <= 0 && totalSellingPrice > 0 && <span style={{ color: '#34d399', fontWeight: 'bold' }}> (LUNAS)</span>}
            </div>
          </div>

          {/* Agent Cost Settlement Preview */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase' }}>
                Pelunasan Cost / Invoice (Agent)
              </span>
              <span style={{ fontSize: '0.675rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                Cost - DP
              </span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', color: '#34d399' }}>
              Rp {formatCurrency(Math.max(0, sisaCostAgent))}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total Cost ({formatCurrency(totalNettPrice)}) - DP ({formatCurrency(depositAmount)})
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Step3Financials;
