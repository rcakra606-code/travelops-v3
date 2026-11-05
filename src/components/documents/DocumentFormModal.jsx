import {
  Stamp,
  Globe,
  User,
  Phone,
  Building,
  DollarSign,
  Clipboard,
  Receipt,
  Ticket,
  Calendar,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';
import {
  DOCUMENT_TYPES,
  POPULAR_VISA_DESTINATIONS,
  DESTINATION_VENUE_HINTS,
  POPULAR_VENUES,
  POPULAR_VENDORS,
  SLA_DAY_PRESETS,
  PROCESS_SLA_DAYS,
  toDateInputStr,
  addDaysToDateStr,
  getDocumentStyles
} from './documentConstants';

const DocumentFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  editingDoc,
  isDuplicateMode,
  isSubmitting,
  onSubmit,
  activeStaff = [],
  currentUserName = '',
  isLight
}) => {
  if (!isOpen) return null;

  const {
    subtleSurface,
    chipBg,
    chipBorder,
    fieldStyle,
    iconFieldStyle,
    iconAdornmentStyle
  } = getDocumentStyles(isLight);

  const handleSelectCountryChip = (countryName) => {
    setFormData((prev) => {
      const hintVenue = DESTINATION_VENUE_HINTS[countryName] || '';
      return {
        ...prev,
        country: countryName,
        appointmentLocation: prev.appointmentLocation || hintVenue
      };
    });
  };

  const handleApplySlaDays = (days) => {
    const baseDate = formData.receiveDate || toDateInputStr(new Date());
    setFormData((prev) => ({
      ...prev,
      receiveDate: baseDate,
      estimatedDone: addDaysToDateStr(baseDate, days)
    }));
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content fade-in"
        style={{
          maxWidth: '860px',
          background: 'var(--bg-card)',
          padding: 0,
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: isLight ? '#f4f9ff' : 'var(--bg-surface)'
          }}
        >
          <div>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                fontSize: '1.15rem',
                color: 'var(--text-main)'
              }}
            >
              <Stamp size={20} color="var(--primary)" />
              {editingDoc
                ? 'Edit Visa / Document Record'
                : isDuplicateMode
                ? 'Duplicate for Family / Group Applicant'
                : 'Add Visa / Document Record'}
            </h2>
            {isDuplicateMode && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                Destination, booking/tour code, SLA dates, and appointment slot pre-filled. Enter the next family/group member&apos;s name.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={onSubmit}
          style={{ padding: '1.4rem 1.5rem', overflowY: 'auto' }}
        >
          <div className="form-grid">
            {/* Row 1: Document Type & Country */}
            <div className="input-group">
              <label>
                Document Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Stamp size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  required
                  placeholder="e.g., Tourist Visa, Passport Renewal"
                  value={formData.docType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, docType: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {DOCUMENT_TYPES.slice(0, 5).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, docType: dt }))}
                    style={{
                      border: `1px solid ${formData.docType === dt ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.docType === dt ? chipBg : 'transparent',
                      color: formData.docType === dt ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.12rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Destination Country / Embassy</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., Japan, Schengen, South Korea"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {POPULAR_VISA_DESTINATIONS.slice(0, 6).map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => handleSelectCountryChip(dest)}
                    style={{
                      border: `1px solid ${formData.country === dest ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.country === dest ? chipBg : 'transparent',
                      color: formData.country === dest ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.12rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Guest Name & Phone Number */}
            <div className="input-group">
              <label>
                Applicant / Guest Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  required
                  placeholder="Applicant name as on passport"
                  value={formData.guestName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guestName: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Applicant Phone / WhatsApp</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="+62..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            {/* Row 3: Process Speed, Receive Date & Estimated Done */}
            <div className="input-group">
              <label>
                Process Speed <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.processType}
                onChange={(e) => {
                  const nextSpeed = e.target.value;
                  const suggestedDays = PROCESS_SLA_DAYS[nextSpeed];
                  setFormData((prev) => ({
                    ...prev,
                    processType: nextSpeed,
                    estimatedDone:
                      !editingDoc && prev.receiveDate && suggestedDays
                        ? addDaysToDateStr(prev.receiveDate, suggestedDays)
                        : prev.estimatedDone
                  }));
                }}
                style={fieldStyle}
              >
                <option value="Normal">Normal (Standard SLA)</option>
                <option value="Express">Express (Priority)</option>
                <option value="Urgent">Urgent (Same / Next-Day Rush)</option>
              </select>
            </div>

            <div className="input-group">
              <label>
                Receive Date (Intake) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={formData.receiveDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, receiveDate: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div className="input-group">
              <label>Estimated Completion Date</label>
              <input
                type="date"
                min={formData.receiveDate || undefined}
                value={formData.estimatedDone}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDone: e.target.value }))}
                style={fieldStyle}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>SLA:</span>
                {SLA_DAY_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleApplySlaDays(d)}
                    style={{
                      border: `1px solid ${chipBorder}`,
                      background: chipBg,
                      color: 'var(--primary)',
                      borderRadius: '999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Dispatch / Send Date (Optional)</label>
              <input
                type="date"
                value={formData.sendDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, sendDate: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            {/* Row 4: Vendor / Visa Center & Service Fee */}
            <div className="input-group">
              <label>Vendor / Visa Center / Agent</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., VFS Global, JVAC, Partner Agent"
                  value={formData.supplier}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {POPULAR_VENDORS.slice(0, 5).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, supplier: v }))}
                    style={{
                      border: `1px solid ${formData.supplier === v ? 'var(--primary)' : 'var(--border)'}`,
                      background: formData.supplier === v ? chipBg : 'transparent',
                      color: formData.supplier === v ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      padding: '0.1rem 0.48rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Service / Visa Fee (IDR)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={iconAdornmentStyle} />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            {/* Row 5: Booking Code, Tour Code & Invoice Number */}
            <div className="input-group">
              <label>Booking Code</label>
              <div style={{ position: 'relative' }}>
                <Clipboard size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., BKG-2026-01"
                  value={formData.bookingCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bookingCode: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Invoice Number</label>
              <div style={{ position: 'relative' }}>
                <Receipt size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="e.g., INV-001"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                  }
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Linked Tour Code</label>
              <div style={{ position: 'relative' }}>
                <Ticket size={16} style={iconAdornmentStyle} />
                <input
                  type="text"
                  placeholder="Optional group tour code"
                  value={formData.tourCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))}
                  style={iconFieldStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>
                  Consultant (PIC Staff) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {currentUserName && formData.staff !== currentUserName && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, staff: currentUserName }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Assign to me
                  </button>
                )}
              </div>
              <select
                required
                value={formData.staff}
                onChange={(e) => setFormData((prev) => ({ ...prev, staff: e.target.value }))}
                style={{ ...fieldStyle, marginTop: '0.4rem' }}
              >
                <option value="">Select Staff</option>
                {formData.staff &&
                  !activeStaff.some((u) => u.name === formData.staff) && (
                    <option value={formData.staff}>{formData.staff}</option>
                  )}
                {activeStaff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.name}>
                    {staffMember.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 6: Biometric / Embassy Appointment Card */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: subtleSurface,
                border: `1.5px solid ${chipBorder}`,
                borderRadius: '0.75rem',
                padding: '1.15rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={17} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Visa Appointment Schedule (Biometrics / Embassy Interview)
                  </h3>
                </div>
                {formData.appointmentDate && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        appointmentDate: '',
                        appointmentTime: ''
                      }))
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.73rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear appointment
                  </button>
                )}
              </div>

              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="input-group">
                  <label>Appointment Date</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group">
                  <label>Appointment Time</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentTime: e.target.value }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Appointment Venue / Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={iconAdornmentStyle} />
                    <input
                      type="text"
                      list="visa-venue-suggestions"
                      placeholder="e.g., VFS Global Kuningan City Mall Lt. 2, Jakarta"
                      value={formData.appointmentLocation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          appointmentLocation: e.target.value
                        }))
                      }
                      style={iconFieldStyle}
                    />
                  </div>
                  <datalist id="visa-venue-suggestions">
                    {POPULAR_VENUES.map((venue) => (
                      <option key={venue} value={venue} />
                    ))}
                  </datalist>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Sparkles size={11} color="var(--primary)" /> Quick venues:
                    </span>
                    {POPULAR_VENUES.slice(0, 4).map((venue) => (
                      <button
                        key={venue}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, appointmentLocation: venue }))
                        }
                        style={{
                          border: `1px solid ${
                            formData.appointmentLocation === venue
                              ? 'var(--primary)'
                              : 'var(--border)'
                          }`,
                          background:
                            formData.appointmentLocation === venue ? chipBg : 'transparent',
                          color:
                            formData.appointmentLocation === venue
                              ? 'var(--primary)'
                              : 'var(--text-muted)',
                          borderRadius: '999px',
                          padding: '0.1rem 0.5rem',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {venue.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 7: Notes */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>Document Checklist & Operational Notes</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {(formData.notes || '').length} / 500
                </span>
              </div>
              <textarea
                rows="3"
                maxLength="500"
                placeholder="Missing bank statement, old passport attached, special courier instructions, etc."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                style={{ ...fieldStyle, marginTop: '0.4rem', resize: 'vertical' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.2rem',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingDoc
                ? 'Save Changes'
                : 'Create Document Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentFormModal;

