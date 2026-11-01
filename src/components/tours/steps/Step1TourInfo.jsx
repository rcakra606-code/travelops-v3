import { useState, useEffect, useRef } from 'react';
import { Calendar, Globe, Users, Sparkles, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUsers } from '../../../context/UserContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { isTourPast } from '../../../context/TourContext';
import {
  getTripDurationInfo,
  resizePaxList,
  hasPerPaxPricing,
  computeFinancialsFromPax
} from '../../../utils/tourHelpers';

const POPULAR_DESTINATIONS = [
  'Japan',
  'South Korea',
  'Switzerland',
  'China',
  'Thailand',
  'Singapore',
  'Australia',
  'Italy'
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const TOUR_CATEGORIES = [
  'Leisure',
  'Corporate / Incentive',
  'Private / FIT',
  'Consortium',
  'Religious / Pilgrimage'
];

const Step1TourInfo = ({ data, updateData, errors = {}, clearError }) => {
  const { users } = useUsers();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'Admin';
  const isMdrLocked = Boolean(data.claimMdr && !isAdmin);

  const countryQuery = data.country || '';
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countryQuery.toLowerCase())
  );

  const durationInfo = getTripDurationInfo(data.departureDate, data.returnDate);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    updateData({ country });
    if (clearError) clearError('country');
    setShowDropdown(false);
  };

  const handleDateChange = (field, value) => {
    const nextDep = field === 'departureDate' ? value : data.departureDate;
    const nextRet = field === 'returnDate' ? value : data.returnDate;
    const patch = { [field]: value };

    if (nextDep || nextRet) {
      const past = isTourPast(nextDep, nextRet);
      if (past && data.status !== 'Cancel') {
        patch.status = 'Past Date';
      } else if (!past && data.status === 'Past Date') {
        patch.status = 'Confirm';
      }
    }

    // If departureDate moves past existing returnDate, keep returnDate user-editable or clear error once fixed
    updateData(patch);
    if (clearError) {
      clearError(field);
      clearError('dateOrder');
    }
  };

  const handlePaxCountChange = (rawVal) => {
    const nextCount = Math.max(1, parseInt(rawVal, 10) || 1);
    const nextPaxInfo = resizePaxList(data.paxInfo, nextCount);
    const patch = {
      paxCount: nextCount,
      paxInfo: nextPaxInfo
    };
    if (hasPerPaxPricing(nextPaxInfo)) {
      patch.financials = computeFinancialsFromPax(nextPaxInfo, data.financials);
    }
    updateData(patch);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
    if (clearError) clearError(name);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Step 1: Tour &amp; Schedule Details
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Enter core group itinerary codes, travel dates, destination, and assigned consultant.
          </p>
        </div>

        {durationInfo && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.36rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              background: durationInfo.valid
                ? isLight ? '#e0f2fe' : 'rgba(0, 168, 255, 0.14)'
                : 'rgba(239, 68, 68, 0.14)',
              color: durationInfo.valid
                ? isLight ? '#0369a1' : '#38bdf8'
                : '#ef4444',
              border: `1px solid ${durationInfo.valid ? 'rgba(0, 168, 255, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`
            }}
          >
            <Calendar size={14} />
            {durationInfo.valid ? `Trip Duration: ${durationInfo.label}` : durationInfo.label}
          </span>
        )}
      </div>

      <div className="form-grid">
        {/* Tour Code */}
        <div className="input-group">
          <label>Tour Code</label>
          <input
            type="text"
            name="tourCode"
            value={data.tourCode || ''}
            onChange={handleChange}
            placeholder="e.g. JPN-2026-AUTUMN"
          />
        </div>

        {/* Booking Code */}
        <div className="input-group">
          <label>Booking Code</label>
          <input
            type="text"
            name="bookingCode"
            value={data.bookingCode || ''}
            onChange={handleChange}
            placeholder="e.g. BK-88241"
          />
        </div>

        {/* Departure Date */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Departure Date <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            {errors.departureDate && (
              <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: '700' }}>
                Required
              </span>
            )}
          </label>
          <input
            type="date"
            name="departureDate"
            value={data.departureDate || ''}
            onChange={(e) => handleDateChange('departureDate', e.target.value)}
            style={errors.departureDate ? { borderColor: 'var(--danger)' } : undefined}
          />
        </div>

        {/* Return Date */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Return Date</span>
            {(errors.dateOrder || (durationInfo && !durationInfo.valid)) && (
              <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: '700' }}>
                Must be &gt;= Departure
              </span>
            )}
          </label>
          <input
            type="date"
            name="returnDate"
            min={data.departureDate || undefined}
            value={data.returnDate || ''}
            onChange={(e) => handleDateChange('returnDate', e.target.value)}
            style={
              errors.dateOrder || (durationInfo && !durationInfo.valid)
                ? { borderColor: 'var(--danger)' }
                : undefined
            }
          />
        </div>

        {/* Destination / Country */}
        <div className="input-group" ref={dropdownRef} style={{ position: 'relative', gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={14} color="var(--primary)" /> Destination / Country <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            {errors.country && (
              <span style={{ color: 'var(--danger)', fontSize: '0.72rem', fontWeight: '700' }}>
                {errors.country}
              </span>
            )}
          </label>
          <input
            type="text"
            value={countryQuery}
            onChange={(e) => {
              updateData({ country: e.target.value });
              if (clearError) clearError('country');
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type or pick destination country (e.g. Japan, Switzerland)..."
            style={errors.country ? { borderColor: 'var(--danger)' } : undefined}
          />

          {/* Quick-Pick Popular Destinations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.2rem' }}>
              <Sparkles size={11} color="var(--primary)" /> Quick pick:
            </span>
            {POPULAR_DESTINATIONS.map((dest) => {
              const isSelected = countryQuery.toLowerCase() === dest.toLowerCase();
              return (
                <button
                  key={dest}
                  type="button"
                  onClick={() => handleCountrySelect(dest)}
                  style={{
                    padding: '0.2rem 0.58rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected
                      ? isLight ? '#e0f2fe' : 'rgba(0, 168, 255, 0.18)'
                      : isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dest}
                </button>
              );
            })}
          </div>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '4.45rem',
                left: 0,
                right: 0,
                background: isLight ? '#ffffff' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                maxHeight: '210px',
                overflowY: 'auto',
                zIndex: 25,
                boxShadow: 'var(--shadow-card-hover)'
              }}
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.62rem 0.95rem',
                      fontSize: '0.84rem',
                      color: 'var(--text-main)',
                      background: countryQuery === country
                        ? isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.12)'
                        : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    {country}
                  </button>
                ))
              ) : (
                <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Custom destination: &ldquo;<strong>{countryQuery}</strong>&rdquo; will be saved.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="input-group">
          <label>Trip Category</label>
          <select
            name="category"
            value={data.category || 'Leisure'}
            onChange={handleChange}
          >
            {TOUR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Number of Pax */}
        <div className="input-group">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={14} color="var(--primary)" /> Number of Travelers (Pax)
          </label>
          <input
            type="number"
            name="paxCount"
            value={data.paxCount}
            onChange={(e) => handlePaxCountChange(e.target.value)}
            min="1"
          />
        </div>

        {/* Staff Name */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>PIC Consultant (Staff)</span>
            {user?.name && data.staffName !== user.name && (
              <button
                type="button"
                onClick={() => updateData({ staffName: user.name })}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  cursor: 'pointer'
                }}
              >
                Assign to me ({user.name})
              </button>
            )}
          </label>
          <select name="staffName" value={data.staffName || ''} onChange={handleChange}>
            <option value="">Select Staff</option>
            {users
              .filter((u) => u.status === 'Active')
              .map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
          </select>
        </div>

        {/* Booking Status */}
        <div className="input-group">
          <label>Booking Status</label>
          <select name="status" value={data.status || 'Pending'} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="Confirm">Confirm</option>
            <option value="Cancel">Cancel</option>
            <option value="Past Date">Past Date (Completed)</option>
          </select>
        </div>

        {/* Form Claim MDR Checkbox */}
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <div
            style={{
              background: data.claimMdr
                ? isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.08)'
                : isLight ? '#f8fbff' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${data.claimMdr ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '1rem 1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <label
              onClick={(e) => {
                if (isMdrLocked) {
                  e.preventDefault();
                  toast.warning(
                    'Locked: Only an Admin can uncheck a verified Form Claim MDR.'
                  );
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                cursor: isMdrLocked ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                margin: 0,
                flexWrap: 'wrap'
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(data.claimMdr)}
                disabled={isMdrLocked}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (isChecked) {
                    const nowIso = new Date().toISOString();
                    updateData({
                      claimMdr: true,
                      claimMdrAt: nowIso,
                      claimMdrBy: data.staffName || user?.name || 'Staff'
                    });
                  } else {
                    if (!isAdmin) {
                      toast.warning(
                        'Locked: Only an Admin can uncheck a verified Form Claim MDR.'
                      );
                      return;
                    }
                    updateData({
                      claimMdr: false,
                      claimMdrAt: null,
                      claimMdrBy: null
                    });
                  }
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: isMdrLocked ? 'not-allowed' : 'pointer',
                  accentColor: '#10b981'
                }}
              />
              <span
                style={{
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  color: data.claimMdr
                    ? isLight ? '#047857' : '#34d399'
                    : 'var(--text-main)'
                }}
              >
                Form Claim MDR
              </span>

              {data.claimMdr && (
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  <CheckCircle2 size={12} /> Verified / Checked
                </span>
              )}

              {isMdrLocked && (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  <Lock size={11} /> Locked (Admin only to uncheck)
                </span>
              )}
            </label>

            <div style={{ marginLeft: '1.85rem', fontSize: '0.78rem' }}>
              {data.claimMdr ? (
                <div
                  style={{
                    color: isLight ? '#047857' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <span>
                    Timestamp:{' '}
                    <strong className="font-mono">
                      {(() => {
                        try {
                          const d = new Date(data.claimMdrAt || new Date());
                          return (
                            d.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) +
                            ' ' +
                            d.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          );
                        } catch {
                          return data.claimMdrAt;
                        }
                      })()}
                    </strong>
                  </span>
                  {data.claimMdrBy && (
                    <span style={{ color: 'var(--text-muted)' }}>· PIC: {data.claimMdrBy}</span>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={13} /> Check once Form Claim MDR is completed. Timestamp &amp; PIC are recorded automatically.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1TourInfo;
