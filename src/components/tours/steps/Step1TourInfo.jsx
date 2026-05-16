import React, { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../../context/UserContext';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Step1TourInfo = ({ data, updateData }) => {
  const { users } = useUsers();
  const [countrySearch, setCountrySearch] = useState(data.country || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));

  useEffect(() => {
    // Determine Past Date status
    if (data.returnDate && data.status !== 'Past Date' && data.status !== 'Cancel') {
      const retDate = new Date(data.returnDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (retDate < today) {
        updateData({ status: 'Past Date' });
      }
    }
  }, [data.returnDate]);

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
            <option value="Past Date" disabled>Past Date (Auto)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Step1TourInfo;
