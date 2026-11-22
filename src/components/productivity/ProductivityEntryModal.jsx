import { Plus, Edit2, X, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatIdr, formatNumber } from '../../utils/formatters';
import { parseDigitsInput } from '../../utils/productivityEngine';

const SALES_QUICK_ADD = [
  { label: '+10M', value: 10_000_000 },
  { label: '+25M', value: 25_000_000 },
  { label: '+50M', value: 50_000_000 },
  { label: '+100M', value: 100_000_000 },
  { label: '+250M', value: 250_000_000 }
];

const MARGIN_PRESETS = [5, 8, 10, 12, 15, 20];

const ProductivityEntryModal = ({
  isOpen,
  editingRec,
  isSaving,
  isStaff,
  userName,
  staffOptions,
  categories,
  types,
  formData,
  onChangeFormData,
  onClose,
  onSubmit,
  onSaveAndAddAnother,
  onInfoToast
}) => {
  if (!isOpen) return null;

  const formSalesNum = Number(formData.salesAmount) || 0;
  const formProfitNum = Number(formData.profitAmount) || 0;
  const formMarginPct = formSalesNum > 0 ? (formProfitNum / formSalesNum) * 100 : 0;
  const isProfitExceedingSales = formSalesNum > 0 && formProfitNum > formSalesNum;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prod-entry-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '95%',
          background: 'var(--bg-card)',
          padding: 0,
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.05rem 1.35rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)'
          }}
        >
          <div>
            <h2
              id="prod-entry-modal-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-main)'
              }}
            >
              {editingRec ? <Edit2 size={17} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />}
              {editingRec ? 'Edit Entri Produktivitas' : 'Input Produktivitas & P&L'}
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {isStaff
                ? `Dicatat atas profil konsultan Anda (${userName})`
                : 'Masukkan Gross Sales & Profit — atau klik tombol margin % untuk menghitung profit otomatis'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup modal input produktivitas"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.25rem 1.35rem', maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Period + Consultant */}
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="input-group">
              <label htmlFor="prod-input-period">
                Periode (Bulan / Tahun) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="prod-input-period"
                type="month"
                required
                value={formData.date}
                onChange={(e) => onChangeFormData({ ...formData, date: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%' }}
              />
            </div>

            <div className="input-group">
              <label htmlFor="prod-input-staff" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  Konsultan <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                {isStaff && (
                  <span style={{ fontSize: '0.69rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.22rem' }}>
                    <Lock size={11} aria-hidden="true" /> Profil Anda
                  </span>
                )}
              </label>
              {isStaff ? (
                <input
                  id="prod-input-staff"
                  type="text"
                  value={userName || ''}
                  disabled
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontWeight: 700, opacity: 0.85 }}
                />
              ) : (
                <select
                  id="prod-input-staff"
                  required
                  value={formData.staff}
                  onChange={(e) => onChangeFormData({ ...formData, staff: e.target.value })}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontWeight: 600 }}
                >
                  <option value="">Pilih Konsultan</option>
                  {staffOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Segment */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Segmen Penjualan <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <div role="group" aria-label="Pilih segmen penjualan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {types.map((seg) => {
                const active = formData.type === seg;
                return (
                  <button
                    key={seg}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeFormData({ ...formData, type: seg })}
                    style={{
                      padding: '0.58rem 0.9rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--primary-soft)' : 'var(--bg-surface)',
                      color: active ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {seg === 'Retail' ? 'Retail (B2C / FIT)' : 'Corporate (B2B / Company)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Category */}
          <div style={{ marginBottom: '1.05rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Kategori Produk <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <div role="group" aria-label="Pilih kategori produk" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {categories.map((cat) => {
                const active = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeFormData({ ...formData, category: cat })}
                    style={{
                      padding: '0.36rem 0.72rem',
                      borderRadius: '6px',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--primary)' : 'var(--bg-surface)',
                      color: active ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.76rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Inputs + Quick Presets */}
          <div className="form-grid" style={{ marginBottom: '0.9rem' }}>
            <div className="input-group">
              <label htmlFor="prod-input-sales">
                Gross Sales Amount (IDR) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--success)' }}>
                  Rp
                </span>
                <input
                  id="prod-input-sales"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formSalesNum > 0 ? formatNumber(formSalesNum) : ''}
                  onChange={(e) => onChangeFormData({ ...formData, salesAmount: parseDigitsInput(e.target.value) })}
                  className="tabular-nums"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px', width: '100%', padding: '0.64rem 0.85rem 0.64rem 2.3rem', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap', marginTop: '0.38rem' }}>
                {SALES_QUICK_ADD.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onChangeFormData({ ...formData, salesAmount: formSalesNum + p.value })}
                    style={{ padding: '0.18rem 0.45rem', fontSize: '0.7rem', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--success)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {p.label}
                  </button>
                ))}
                {formSalesNum > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeFormData({ ...formData, salesAmount: 0 })}
                    style={{ padding: '0.18rem 0.45rem', fontSize: '0.7rem', borderRadius: '5px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="prod-input-profit">
                Profit Amount (IDR) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>
                  Rp
                </span>
                <input
                  id="prod-input-profit"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formProfitNum > 0 ? formatNumber(formProfitNum) : ''}
                  onChange={(e) => onChangeFormData({ ...formData, profitAmount: parseDigitsInput(e.target.value) })}
                  className="tabular-nums"
                  style={{ background: 'var(--bg-surface)', border: `1px solid ${isProfitExceedingSales ? 'var(--warning)' : 'var(--border)'}`, color: 'var(--text-main)', borderRadius: '8px', width: '100%', padding: '0.64rem 0.85rem 0.64rem 2.3rem', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.38rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>Calc Margin:</span>
                {MARGIN_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      if (formSalesNum <= 0) {
                        onInfoToast('Masukkan Gross Sales terlebih dahulu untuk menghitung profit otomatis.');
                        return;
                      }
                      onChangeFormData({ ...formData, profitAmount: Math.round(formSalesNum * (pct / 100)) });
                    }}
                    style={{ padding: '0.18rem 0.44rem', fontSize: '0.7rem', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Margin Preview */}
          <div
            style={{
              padding: '0.72rem 0.9rem',
              borderRadius: '8px',
              background: isProfitExceedingSales ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface)',
              border: `1px solid ${isProfitExceedingSales ? 'rgba(245, 158, 11, 0.35)' : 'var(--border)'}`,
              marginBottom: '0.95rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {isProfitExceedingSales ? (
                <>
                  <AlertTriangle size={15} color="var(--warning)" aria-hidden="true" />
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                    Profit melebihi Gross Sales ({formMarginPct.toFixed(1)}%). Cek ulang digit sebelum menyimpan.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} color="var(--success)" aria-hidden="true" />
                  <span style={{ color: 'var(--text-muted)' }}>
                    Margin Kalkulasi:{' '}
                    <strong className="tabular-nums" style={{ color: 'var(--text-main)' }}>{formMarginPct.toFixed(2)}%</strong>
                  </span>
                </>
              )}
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Estimasi Cost Supplier:{' '}
              <strong style={{ color: 'var(--text-main)' }}>{formatIdr(Math.max(0, formSalesNum - formProfitNum))}</strong>
            </div>
          </div>

          {/* Remarks */}
          <div className="input-group">
            <label htmlFor="prod-input-remarks">Catatan / Referensi Klien / Booking</label>
            <textarea
              id="prod-input-remarks"
              placeholder="Opsional: nama corporate account, kode booking, atau catatan transaksi..."
              value={formData.remarks}
              onChange={(e) => onChangeFormData({ ...formData, remarks: e.target.value })}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.85rem', width: '100%', color: 'var(--text-main)', minHeight: '72px', resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Batal
            </button>
            {!editingRec && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSaving}
                onClick={onSaveAndAddAnother}
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
              >
                Simpan &amp; Tambah Lagi
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ fontWeight: 700 }}>
              {isSaving ? 'Menyimpan...' : editingRec ? 'Perbarui Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductivityEntryModal;
