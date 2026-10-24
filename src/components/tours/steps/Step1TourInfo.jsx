import React, { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../../context/UserContext';
import { useAuth } from '../../../context/AuthContext';
import { isTourPast } from '../../../context/TourContext';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Step1TourInfo = ({ data, updateData }) => {
  const { users } = useUsers();
  const { user } = useAuth();
  const [countrySearch, setCountrySearch] = useState(data.country || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'Admin';
  // Staff & Manager CAN check when unchecked, but CANNOT uncheck once checked
  const isMdrLocked = Boolean(data.claimMdr && !isAdmin);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));

  useEffect(() => {
    // Determine Past Date status accurately based on full tour end date
    if (data.departureDate || data.returnDate) {
      const isPast = isTourPast(data.departureDate, data.returnDate);
      if (isPast && data.status !== 'Cancel') {
        if (data.status !== 'Past Date') {
          updateData({ status: 'Past Date' });
        }
      } else if (!isPast && data.status === 'Past Date') {
        // If user changed the date back to an ongoing or future date, recover to Confirm
        updateData({ status: 'Confirm' });
      }
    }
  }, [data.departureDate, data.returnDate]);

  useEffect(() => {
    setCountrySearch(data.country || '');
  }, [data.country]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setCountrySearch(country);
    updateData({ country });
    setShowDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Step 1: Tour Information</h2>
      
      <div className="form-grid">
        <div className="input-group">
          <label>Tour Code</label>
          <input type="text" name="tourCode" value={data.tourCode} onChange={handleChange} placeholder="e.g. EU-2024-01" />
        </div>
        
        <div className="input-group">
          <label>Booking Code</label>
          <input type="text" name="bookingCode" value={data.bookingCode} onChange={handleChange} placeholder="Unique Code" />
        </div>

        <div className="input-group">
          <label>Departure Date</label>
          <input type="date" name="departureDate" value={data.departureDate} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Return Date</label>
          <input type="date" name="returnDate" value={data.returnDate} onChange={handleChange} />
        </div>

        <div className="input-group" ref={dropdownRef} style={{ position: 'relative' }}>
          <label>Country</label>
          <input 
            type="text" 
            value={countrySearch} 
            onChange={(e) => {
              setCountrySearch(e.target.value);
              updateData({ country: e.target.value });
              setShowDropdown(true);
            }} 
            onFocus={() => setShowDropdown(true)}
            placeholder="Search country..." 
          />
          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, 
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
              {filteredCountries.length > 0 ? filteredCountries.map(country => (
                <div 
                  key={country} 
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onClick={() => handleCountrySelect(country)}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {country}
                </div>
              )) : (
                <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>No matches found</div>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <label>Number of Pax</label>
          <input 
            type="number" 
            name="paxCount" 
            value={data.paxCount} 
            onChange={(e) => updateData({ paxCount: Math.max(1, parseInt(e.target.value) || 1) })} 
            min="1" 
          />
        </div>

        <div className="input-group">
          <label>Staff Name</label>
          <select 
            name="staffName" 
            value={data.staffName || ''} 
            onChange={handleChange}
            style={{
              background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
              padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none'
            }}
          >
            <option value="">Select Staff</option>
            {users.filter(u => u.status === 'Active').map(u => (
              <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Status</label>
          <select 
            name="status" 
            value={data.status} 
            onChange={handleChange}
            style={{
              background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
              padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'var(--text-main)', outline: 'none'
            }}
          >
            <option value="Pending">Pending</option>
            <option value="Confirm">Confirm</option>
            <option value="Cancel">Cancel</option>
            <option value="Past Date">Past Date</option>
          </select>
        </div>

        {/* Form Claim MDR Checkbox */}
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <div style={{
            background: data.claimMdr ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${data.claimMdr ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'}`,
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}>
            <label 
              onClick={(e) => {
                if (isMdrLocked) {
                  e.preventDefault();
                  alert('⛔ Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: isMdrLocked ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                margin: 0
              }}
              title={isMdrLocked ? 'Terkunci: Role Staff & Manager tidak dapat membatalkan (un-check)' : ''}
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
                      alert('⛔ Akses Ditolak: Role Staff & Manager tidak diizinkan untuk membatalkan (un-check) Form Claim MDR yang telah divalidasi. Hubungi Admin jika terdapat kekeliruan.');
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
              <span style={{
                fontWeight: '700',
                fontSize: '0.925rem',
                color: data.claimMdr ? '#34d399' : 'var(--text-main)'
              }}>
                Form Claim MDR
              </span>
              {data.claimMdr && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399'
                }}>
                  Terverifikasi / Checked
                </span>
              )}
              {isMdrLocked && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔒 Terkunci (Role Staff/Manager tidak dapat un-check)
                </span>
              )}
            </label>

            <div style={{ marginLeft: '2.1rem', fontSize: '0.78rem' }}>
              {data.claimMdr ? (
                <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span>✓ <strong>Auto-generated Timestamp:</strong></span>
                  <span className="font-mono" style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    {(() => {
                      try {
                        const d = new Date(data.claimMdrAt || new Date());
                        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      } catch {
                        return data.claimMdrAt;
                      }
                    })()}
                  </span>
                  {data.claimMdrBy && (
                    <span style={{ color: 'var(--text-muted)' }}>• PIC: {data.claimMdrBy}</span>
                  )}
                  {isMdrLocked && (
                    <div style={{ width: '100%', color: '#fbbf24', fontSize: '0.72rem', marginTop: '0.2rem', fontWeight: '500' }}>
                      🔒 Perhatian: Hanya role Admin yang memiliki wewenang untuk membatalkan (un-check) status checklist Form Claim MDR.
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--text-subtle)' }}>
                  Centang kotak ini jika staf telah menyelesaikan Form Claim MDR. Tanggal dan jam akan di-generate otomatis saat dicentang.
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
