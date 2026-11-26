import { useState } from 'react';
import { X, Plus, Trash2, Save, Ship } from 'lucide-react';
import { CLIENT_PROFILES, CRUISE_REGIONS } from '../../utils/cruiseSalesGuideData';
import { slugifyGuideId } from '../../utils/cruiseSalesGuideHelpers';

const SEGMENTS = ['Value & Family', 'Family Premium', 'Contemporary', 'Premium', 'Ultra-Luxury'];
const HALAL_OPTIONS = ['Certified Halal Kitchen', 'Pre-Order Halal', 'No-Pork / Veg Options'];
const CURRENCY_OPTIONS = ['USD', 'SGD', 'EUR', 'Included'];

const toLines = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
const fromLines = (text) =>
  String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const buildInitialForm = (entity) => ({
  id: entity?.id || '',
  brandName: entity?.brandName || '',
  tagline: entity?.tagline || '',
  segment: entity?.segment || 'Contemporary',
  budgetTier: entity?.budgetTier || 3,
  accentColor: entity?.accentColor || '#0284c7',
  vipClubName: entity?.vipClubName || '',
  homeportsText: (entity?.homeports || []).join(', '),
  typicalDurationsText: (entity?.typicalDurations || ['3N', '4N', '7N']).join(', '),
  regions: entity?.regions || ['singapore-sea'],
  targetProfiles: entity?.targetProfiles || ['family'],
  halalStatus: entity?.halalStatus || 'Pre-Order Halal',
  halalNotes: entity?.halalNotes || '',
  gratuityCurrency: entity?.gratuityCurrency || 'USD',
  gratuityStandard: entity?.gratuityStandard ?? 18,
  gratuitySuite: entity?.gratuitySuite ?? 22,
  gratuityNotes: entity?.gratuityNotes || '',
  minInfantMonths: entity?.minInfantMonths ?? 6,
  pregnancyMaxWeeks: entity?.pregnancyMaxWeeks ?? 23,
  minBookingAge: entity?.minBookingAge ?? 18,
  dressCode: entity?.dressCode || 'Smart Casual',
  websiteUrl: entity?.websiteUrl || '',
  sortOrder: entity?.sortOrder ?? 110,
  featuredShips:
    entity?.featuredShips?.length > 0
      ? entity.featuredShips.map((s) => ({
          name: s.name || '',
          shipClass: s.shipClass || '',
          tonnage: s.tonnage || '',
          capacity: s.capacity || '',
          decks: s.decks ?? '',
          yearBuilt: s.yearBuilt || '',
          deployment: s.deployment || '',
          bestFor: s.bestFor || '',
          highlight: s.highlight || ''
        }))
      : [{ name: '', shipClass: '', tonnage: '', capacity: '', decks: '', yearBuilt: '', deployment: '', bestFor: '', highlight: '' }],
  highlightsText: toLines(entity?.highlights),
  inclusionsText: toLines(entity?.inclusions),
  salesTipsText: toLines(entity?.salesTips)
});

const CruiseGuideFormModal = ({ isOpen, mode = 'create', initialGuide = null, onClose, onSave }) => {
  const [form, setForm] = useState(() => buildInitialForm(initialGuide));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key, itemId) => {
    setForm((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.includes(itemId) ? list.filter((x) => x !== itemId) : [...list, itemId]
      };
    });
  };

  const updateShip = (index, field, val) => {
    setForm((prev) => ({
      ...prev,
      featuredShips: prev.featuredShips.map((ship, idx) => (idx === index ? { ...ship, [field]: val } : ship))
    }));
  };

  const addShipRow = () => {
    setForm((prev) => ({
      ...prev,
      featuredShips: [
        ...prev.featuredShips,
        { name: '', shipClass: '', tonnage: '', capacity: '', decks: '', yearBuilt: '', deployment: '', bestFor: '', highlight: '' }
      ]
    }));
  };

  const removeShipRow = (index) => {
    setForm((prev) => ({
      ...prev,
      featuredShips: prev.featuredShips.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.brandName.trim()) {
      setError('Nama brand kapal pesiar wajib diisi.');
      return;
    }

    const payload = {
      id: mode === 'edit' && form.id ? form.id : slugifyGuideId(form.brandName),
      brandName: form.brandName.trim(),
      tagline: form.tagline.trim(),
      segment: form.segment,
      budgetTier: Number(form.budgetTier) || 3,
      accentColor: form.accentColor || '#0284c7',
      vipClubName: form.vipClubName.trim(),
      homeports: form.homeportsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      typicalDurations: form.typicalDurationsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      regions: form.regions,
      targetProfiles: form.targetProfiles,
      halalStatus: form.halalStatus,
      halalNotes: form.halalNotes.trim(),
      gratuityCurrency: form.gratuityCurrency,
      gratuityStandard: form.gratuityCurrency === 'Included' ? 0 : Number(form.gratuityStandard) || 0,
      gratuitySuite: form.gratuityCurrency === 'Included' ? 0 : Number(form.gratuitySuite) || 0,
      gratuityNotes: form.gratuityNotes.trim(),
      minInfantMonths: Number(form.minInfantMonths) || 6,
      pregnancyMaxWeeks: Number(form.pregnancyMaxWeeks) || 23,
      minBookingAge: Number(form.minBookingAge) || 18,
      dressCode: form.dressCode.trim(),
      websiteUrl: form.websiteUrl.trim(),
      sortOrder: Number(form.sortOrder) || 100,
      featuredShips: form.featuredShips.filter((s) => s.name.trim()),
      highlights: fromLines(form.highlightsText),
      inclusions: fromLines(form.inclusionsText),
      salesTips: fromLines(form.salesTipsText),
      isActive: true
    };

    try {
      setSaving(true);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan panduan cruise.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    fontSize: '0.83rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 700,
    color: 'var(--text-subtle)',
    marginBottom: '0.28rem'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Ship size={18} color="var(--primary)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                {mode === 'edit' ? `Edit Panduan Brand: ${initialGuide?.brandName}` : 'Tambah Panduan Brand Kapal Pesiar'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Perubahan langsung tersimpan ke database Supabase dan tampil untuk seluruh tim sales.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Nama Brand Kapal Pesiar *</label>
              <input style={inputStyle} value={form.brandName} onChange={(e) => setField('brandName', e.target.value)} placeholder="Contoh: Cunard Line" required />
            </div>
            <div>
              <label style={labelStyle}>Segmen</label>
              <select style={inputStyle} value={form.segment} onChange={(e) => setField('segment', e.target.value)}>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Kelas Budget (1 = Hemat, 5 = Ultra-Luxury)</label>
              <select style={inputStyle} value={form.budgetTier} onChange={(e) => setField('budgetTier', Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{'$'.repeat(n)} ({n}/5)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nama Layanan VIP / Suite Club</label>
              <input style={inputStyle} value={form.vipClubName} onChange={(e) => setField('vipClubName', e.target.value)} placeholder="Contoh: Queens Grill / The Palace" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tagline / Ringkasan 1 Kalimat untuk Sales</label>
            <input style={inputStyle} value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} placeholder="Highlight utama yang langsung mudah diingat tim sales..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Homeport Utama (pisahkan koma)</label>
              <input style={inputStyle} value={form.homeportsText} onChange={(e) => setField('homeportsText', e.target.value)} placeholder="Singapore (MBCCS), Yokohama, Barcelona" />
            </div>
            <div>
              <label style={labelStyle}>Durasi Populer (pisahkan koma)</label>
              <input style={inputStyle} value={form.typicalDurationsText} onChange={(e) => setField('typicalDurationsText', e.target.value)} placeholder="3N, 4N, 7N" />
            </div>
            <div>
              <label style={labelStyle}>Urutan Tampil (angka kecil = lebih atas)</label>
              <input type="number" style={inputStyle} value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} />
            </div>
          </div>

          {/* Regions & Target Profiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Wilayah Pelayaran Aktif</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {CRUISE_REGIONS.map((r) => {
                  const active = form.regions.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleArrayItem('regions', r.id)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 999,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'rgba(14,165,233,0.16)' : 'var(--bg-surface)',
                        color: active ? 'var(--primary)' : 'var(--text-subtle)'
                      }}
                    >
                      {r.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Profil Klien Ideal</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {CLIENT_PROFILES.map((p) => {
                  const active = form.targetProfiles.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleArrayItem('targetProfiles', p.id)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 999,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${active ? p.color : 'var(--border)'}`,
                        background: active ? `${p.color}20` : 'var(--bg-surface)',
                        color: active ? p.color : 'var(--text-subtle)'
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Halal & Gratuity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Status Halal / Dietary</label>
              <select style={inputStyle} value={form.halalStatus} onChange={(e) => setField('halalStatus', e.target.value)}>
                {HALAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mata Uang Gratuity</label>
              <select style={inputStyle} value={form.gratuityCurrency} onChange={(e) => setField('gratuityCurrency', e.target.value)}>
                {CURRENCY_OPTIONS.map((cur) => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Gratuity Standar (/pax/mlm)</label>
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={form.gratuityStandard}
                disabled={form.gratuityCurrency === 'Included'}
                onChange={(e) => setField('gratuityStandard', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Gratuity Suite (/pax/mlm)</label>
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={form.gratuitySuite}
                disabled={form.gratuityCurrency === 'Included'}
                onChange={(e) => setField('gratuitySuite', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Catatan Makanan Halal & Dietary</label>
              <textarea rows={2} style={inputStyle} value={form.halalNotes} onChange={(e) => setField('halalNotes', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Catatan Gratuity / Paket Tambahan</label>
              <textarea rows={2} style={inputStyle} value={form.gratuityNotes} onChange={(e) => setField('gratuityNotes', e.target.value)} />
            </div>
          </div>

          {/* Age & Dress Code */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Min. Bayi (bulan)</label>
              <input type="number" style={inputStyle} value={form.minInfantMonths} onChange={(e) => setField('minInfantMonths', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Maks. Ibu Hamil (minggu)</label>
              <input type="number" style={inputStyle} value={form.pregnancyMaxWeeks} onChange={(e) => setField('pregnancyMaxWeeks', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Min. Pemesan Utama (thn)</label>
              <input type="number" style={inputStyle} value={form.minBookingAge} onChange={(e) => setField('minBookingAge', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Warna Aksen Kartu</label>
              <input type="color" style={{ ...inputStyle, height: '36px', padding: '0.2rem' }} value={form.accentColor} onChange={(e) => setField('accentColor', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Dress Code</label>
              <input style={inputStyle} value={form.dressCode} onChange={(e) => setField('dressCode', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Website Resmi (opsional)</label>
              <input style={inputStyle} value={form.websiteUrl} onChange={(e) => setField('websiteUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Complete Fleet Ships Editor */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Daftar Semua Kapal Beroperasi ({form.featuredShips.length} Kapal)
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addShipRow}
                style={{ padding: '0.28rem 0.6rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={13} /> Tambah Kapal
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {form.featuredShips.map((ship, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.6rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr 0.8fr 0.5fr 0.7fr auto', gap: '0.35rem', alignItems: 'center' }}>
                    <input style={inputStyle} value={ship.name} onChange={(e) => updateShip(idx, 'name', e.target.value)} placeholder="Nama Kapal" />
                    <input style={inputStyle} value={ship.shipClass || ''} onChange={(e) => updateShip(idx, 'shipClass', e.target.value)} placeholder="Class (mis. Icon Class)" />
                    <input style={inputStyle} value={ship.tonnage} onChange={(e) => updateShip(idx, 'tonnage', e.target.value)} placeholder="Tonase (GT)" />
                    <input style={inputStyle} value={ship.capacity} onChange={(e) => updateShip(idx, 'capacity', e.target.value)} placeholder="Kapasitas" />
                    <input style={inputStyle} value={ship.decks ?? ''} onChange={(e) => updateShip(idx, 'decks', e.target.value)} placeholder="Deck" />
                    <input style={inputStyle} value={ship.yearBuilt} onChange={(e) => updateShip(idx, 'yearBuilt', e.target.value)} placeholder="Tahun" />
                    <button
                      type="button"
                      onClick={() => removeShipRow(idx)}
                      aria-label="Hapus kapal"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: '0.35rem' }}>
                    <input style={inputStyle} value={ship.deployment || ''} onChange={(e) => updateShip(idx, 'deployment', e.target.value)} placeholder="Wilayah / Homeport utama" />
                    <input style={inputStyle} value={ship.bestFor || ''} onChange={(e) => updateShip(idx, 'bestFor', e.target.value)} placeholder="Cocok untuk segmen..." />
                    <input style={inputStyle} value={ship.highlight} onChange={(e) => updateShip(idx, 'highlight', e.target.value)} placeholder="Daya tarik & fasilitas ikonik..." />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-line Selling Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Keunggulan Utama (1 poin per baris)</label>
              <textarea rows={4} style={inputStyle} value={form.highlightsText} onChange={(e) => setField('highlightsText', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Sudah Termasuk di Harga (1 poin per baris)</label>
              <textarea rows={4} style={inputStyle} value={form.inclusionsText} onChange={(e) => setField('inclusionsText', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Tips Internal Sales (1 poin per baris)</label>
              <textarea rows={4} style={inputStyle} value={form.salesTipsText} onChange={(e) => setField('salesTipsText', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Save size={14} /> {saving ? 'Menyimpan…' : 'Simpan ke Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CruiseGuideFormModal;
