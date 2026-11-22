import { Calendar, Lock, Users, User, Filter } from 'lucide-react';

const PERIOD_OPTIONS = [
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'this_quarter', label: 'Kuartal Ini' },
  { id: 'last_90d', label: '90 Hari Terakhir' },
  { id: 'this_year', label: 'Tahun Ini (YTD)' },
  { id: 'all_time', label: 'Semua Data' }
];

const MODULE_OPTIONS = [
  { id: 'all', label: 'Semua Produk' },
  { id: 'tour', label: 'Tour' },
  { id: 'corporate', label: 'Corporate B2B' },
  { id: 'document', label: 'Visa & Dokumen' },
  { id: 'hotel_cruise', label: 'Hotel & Cruise' }
];

/**
 * Global Enterprise BI Filter Toolbar
 * Enforces RBAC scope boundaries (Staff locked to own portfolio).
 */
const BiFilterBar = ({
  periodPreset,
  onPeriodChange,
  periodWindowLabel,
  comparisonWindowLabel,
  scope,
  onScopeChange,
  canViewAllScope = true,
  moduleFilter = 'all',
  onModuleFilterChange,
  showModuleFilter = false
}) => {
  return (
    <div
      className="bi-filter-bar"
      role="region"
      aria-label="Filter Analitik"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.68rem 0.9rem',
        marginBottom: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}
    >
      {/* Left: Period Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.73rem',
            fontWeight: 700,
            color: 'var(--text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          <Calendar size={14} aria-hidden="true" />
          <span>Periode</span>
        </div>

        <div
          role="group"
          aria-label="Pilih periode analisis"
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
            padding: '2px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px'
          }}
        >
          {PERIOD_OPTIONS.map((opt) => {
            const active = periodPreset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onPeriodChange(opt.id)}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.32rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.14s ease'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {periodWindowLabel && (
          <span
            style={{
              fontSize: '0.73rem',
              color: 'var(--text-subtle)',
              paddingLeft: '0.25rem'
            }}
          >
            <strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{periodWindowLabel}</strong>
            {comparisonWindowLabel ? ` · pembanding: ${comparisonWindowLabel}` : ''}
          </span>
        )}
      </div>

      {/* Right: Optional Product Filter + RBAC Scope Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {showModuleFilter && typeof onModuleFilterChange === 'function' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={13} color="var(--text-subtle)" aria-hidden="true" />
            <label htmlFor="bi-module-filter" className="sr-only">
              Filter Produk
            </label>
            <select
              id="bi-module-filter"
              value={moduleFilter}
              onChange={(e) => onModuleFilterChange(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                padding: '0.32rem 0.6rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {canViewAllScope ? (
          <div
            role="group"
            aria-label="Cakupan data"
            style={{
              display: 'inline-flex',
              padding: '2px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px'
            }}
          >
            <button
              type="button"
              aria-pressed={scope === 'all'}
              onClick={() => onScopeChange('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: scope === 'all' ? 700 : 500,
                cursor: 'pointer',
                background: scope === 'all' ? 'var(--bg-card)' : 'transparent',
                color: scope === 'all' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              <Users size={13} aria-hidden="true" />
              Seluruh Cabang
            </button>
            <button
              type="button"
              aria-pressed={scope === 'mine'}
              onClick={() => onScopeChange('mine')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: scope === 'mine' ? 700 : 500,
                cursor: 'pointer',
                background: scope === 'mine' ? 'var(--bg-card)' : 'transparent',
                color: scope === 'mine' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              <User size={13} aria-hidden="true" />
              Portofolio Saya
            </button>
          </div>
        ) : (
          <span
            title="Hak akses Staff: hanya menampilkan data yang Anda tangani"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.32rem 0.65rem',
              borderRadius: '7px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}
          >
            <Lock size={12} aria-hidden="true" />
            Portofolio Saya (Staff)
          </span>
        )}
      </div>
    </div>
  );
};

export default BiFilterBar;
