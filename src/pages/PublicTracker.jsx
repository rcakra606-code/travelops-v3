import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, CheckCircle2, Truck, MapPin,
  Calendar, FileText, Ship, Building, Plane, ArrowRight,
  Copy, Check, AlertCircle, Share2, RefreshCw, Sun, Moon,
  HelpCircle, MessageCircle, Compass
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const formatFriendlyDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return 'To be announced';
  const parsed = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PublicTracker = () => {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const isLight = theme === 'light';

  const [inputCode, setInputCode] = useState(paramCode || '');
  const [loading, setLoading] = useState(Boolean(paramCode));
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  const fetchTrackingData = useCallback(async (codeToTrack) => {
    if (!codeToTrack || !codeToTrack.trim()) return;

    setLoading(true);
    setError('');
    setRecord(null);

    const cleanCode = codeToTrack.trim();

    try {
      // 1. First attempt: Query backend API if available
      try {
        const res = await fetch(`/api/public/track/${encodeURIComponent(cleanCode)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRecord(json.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to direct Supabase query below
      }

      // 2. Fallback: Query Supabase directly
      const { data: docs } = await supabase
        .from('travelops_documents')
        .select('*')
        .or(`booking_code.eq.${cleanCode},invoice_number.eq.${cleanCode},shipping_resi.eq.${cleanCode},id.eq.${cleanCode}`)
        .limit(1);

      if (docs && docs.length > 0) {
        const d = docs[0];
        setRecord({
          type: 'document',
          id: d.id,
          docType: d.doc_type || 'Visa / Passport',
          guestName: d.guest_name,
          country: d.country,
          processType: d.process_type || 'Standard',
          receiveDate: d.receive_date,
          estimatedDone: d.estimated_done,
          sendDate: d.send_date,
          bookingCode: d.booking_code,
          invoiceNumber: d.invoice_number,
          shippingStatus: d.shipping_status || 'In Progress',
          shippingMethod: d.shipping_method,
          shippingCourier: d.shipping_courier,
          shippingResi: d.shipping_resi,
          shippingNotes: d.shipping_notes,
          receivedStatus: d.received_status,
          appointmentDate: d.appointment_date,
          appointmentTime: d.appointment_time,
          appointmentLocation: d.appointment_location
        });
        setLoading(false);
        return;
      }

      const { data: tours } = await supabase
        .from('travelops_tours')
        .select('*')
        .or(`id.eq.${cleanCode}`)
        .limit(1);

      if (tours && tours.length > 0) {
        const t = tours[0];
        setRecord({
          type: 'tour',
          id: t.id,
          tourCode: t.internals?.tourCode || t.id,
          bookingCode: t.internals?.bookingCode || t.id,
          country: t.country,
          category: t.category,
          departureDate: t.departure_date,
          returnDate: t.return_date,
          paxCount: t.internals?.paxCount || 1,
          status: t.status,
          paxList: t.pax_info || []
        });
        setLoading(false);
        return;
      }

      const { data: hotels } = await supabase
        .from('travelops_hotels')
        .select('*')
        .or(`confirmation_number.eq.${cleanCode},id.eq.${cleanCode}`)
        .limit(1);

      if (hotels && hotels.length > 0) {
        const h = hotels[0];
        setRecord({
          type: 'hotel',
          id: h.id,
          hotelName: h.hotel_name,
          region: h.region,
          checkIn: h.check_in,
          checkOut: h.check_out,
          roomType: h.room_type,
          confirmationNumber: h.confirmation_number,
          status: h.status
        });
        setLoading(false);
        return;
      }

      const { data: cruises } = await supabase
        .from('travelops_cruises')
        .select('*')
        .or(`booking_ref.eq.${cleanCode},id.eq.${cleanCode}`)
        .limit(1);

      if (cruises && cruises.length > 0) {
        const c = cruises[0];
        setRecord({
          type: 'cruise',
          id: c.id,
          shipName: c.ship_name,
          cruiseBrand: c.cruise_brand,
          bookingRef: c.booking_ref,
          sailingStart: c.sailing_start,
          sailingEnd: c.sailing_end,
          route: c.route,
          status: c.status
        });
        setLoading(false);
        return;
      }

      setError(cleanCode);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError('CONNECTION_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!paramCode) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        fetchTrackingData(paramCode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [paramCode, fetchTrackingData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/track/${encodeURIComponent(inputCode.trim())}`);
      fetchTrackingData(inputCode.trim());
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Tracking link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyResi = (resi) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    toast.success(`Courier tracking number "${resi}" copied!`);
    setTimeout(() => setCopiedResi(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `Hi! Here is my live trip & document tracking link on TravelOps:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWhatsAppHelpdesk = () => {
    const query = inputCode.trim() ? ` regarding reference code "${inputCode.trim()}"` : '';
    const text = `Hi TravelOps team, I'd like help checking my booking/document status${query}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getDocumentProgressStage = (doc) => {
    if (doc.shippingStatus === 'Delivered' || doc.receivedStatus === 'Final' || doc.sendDate) {
      return 4;
    }
    if (doc.shippingResi || doc.shippingStatus === 'Sent' || doc.shippingStatus === 'In Transit') {
      return 3;
    }
    if (doc.estimatedDone) {
      const est = new Date(doc.estimatedDone);
      const now = new Date();
      if (now >= est) return 3;
      return 2;
    }
    if (doc.receiveDate) {
      return 1;
    }
    return 0;
  };

  const getDaysCountdown = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr.includes('T') ? targetDateStr : `${targetDateStr}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  const subSurfaceStyle = {
    background: isLight ? '#f4f9ff' : 'rgba(5, 10, 22, 0.55)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '1.15rem'
  };

  const shareActions = (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={handleCopyLink}
        className="btn btn-secondary"
        style={{ padding: '0.45rem 0.85rem', fontSize: '0.775rem', borderRadius: '9px' }}
      >
        {copiedLink ? <Check size={14} color="var(--success)" /> : <Copy size={14} color="var(--primary)" />}
        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
      </button>

      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="btn"
        style={{
          padding: '0.45rem 0.85rem',
          borderRadius: '9px',
          background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
          border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.32)'}`,
          color: isLight ? '#047857' : '#34d399',
          fontSize: '0.775rem'
        }}
      >
        <Share2 size={14} />
        <span>Share via WhatsApp</span>
      </button>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-main)',
        padding: '1.5rem 1rem 3rem'
      }}
    >
      {/* Friendly Brand Top Header */}
      <header
        style={{
          maxWidth: '860px',
          margin: '0 auto 1.75rem auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1rem',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00b4ff 0%, #0066ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 168, 255, 0.35)'
            }}
          >
            <Compass size={21} strokeWidth={2.3} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              TravelOps
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Guest Trip &amp; Visa Status Concierge
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span className="badge badge-primary">
            <span className="pulse-dot pulse-dot-cyan" />
            Live Updates
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary"
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle color theme"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px' }}
          >
            {isLight ? <Moon size={16} color="var(--primary)" /> : <Sun size={16} color="#38bdf8" />}
          </button>

          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.775rem', borderRadius: '10px' }}
          >
            Staff Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Welcoming Search Hero Card */}
        <div
          className="card"
          style={{
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-primary">Easy Self-Service Check</span>
          </div>
          <h1 style={{ margin: '0 0 0.45rem 0', fontSize: '1.55rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Check Your Trip, Hotel, Cruise, or Visa Status
          </h1>
          <p style={{ margin: '0 0 1.35rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            Pop in your booking code, confirmation number, or courier tracking receipt below for an instant live update.
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="e.g. BOOK-12345, JNE98213, or Hotel Confirmation..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                aria-label="Booking or tracking reference code"
                style={{
                  width: '100%',
                  padding: '0.82rem 1rem 0.82rem 2.75rem',
                  borderRadius: '12px',
                  fontSize: '0.925rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.82rem 1.65rem',
                borderRadius: '12px',
                fontSize: '0.925rem',
                opacity: !inputCode.trim() ? 0.65 : 1
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
              <span>{loading ? 'Checking...' : 'Check Status'}</span>
            </button>
          </form>

          {/* Friendly Helper Chips when idle */}
          {!record && !loading && !error && (
            <div
              style={{
                marginTop: '1.35rem',
                paddingTop: '1.15rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.65rem',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <HelpCircle size={14} color="var(--primary)" /> What codes work here?
              </span>
              {[
                { icon: <FileText size={13} />, text: 'Visa / Document Receipt' },
                { icon: <Plane size={13} />, text: 'Tour Booking ID' },
                { icon: <Building size={13} />, text: 'Hotel Confirmation' },
                { icon: <Ship size={13} />, text: 'Cruise Reference' },
                { icon: <Truck size={13} />, text: 'Courier Resi Number' }
              ].map((tip) => (
                <span
                  key={tip.text}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.76rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '9999px',
                    background: isLight ? '#f0f7ff' : 'rgba(56, 189, 248, 0.08)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{tip.icon}</span>
                  {tip.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Friendly Loading State */}
        {loading && (
          <div className="card fade-in" style={{ padding: '3rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              className="spin"
              style={{
                margin: '0 auto 1rem auto',
                width: '38px',
                height: '38px',
                border: '3px solid var(--primary-glow)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%'
              }}
            />
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Looking up your travel details...
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Just a moment while we fetch the latest status for you.
            </div>
          </div>
        )}

        {/* Warm, Helpful Not-Found / Error Guidance */}
        {error && (
          <div
            className="card fade-in"
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--warning)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', maxWidth: '540px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.14)',
                    color: 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {error === 'CONNECTION_ERROR'
                      ? "We couldn't reach the tracking service right now"
                      : `We couldn't find a match for "${error}"`}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {error === 'CONNECTION_ERROR'
                      ? 'Please check your internet connection and try again in a few seconds.'
                      : 'Double-check for extra spaces or dashes on your receipt. If your booking was just created today, our team may still be registering it.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppHelpdesk}
                className="btn btn-primary"
                style={{ fontSize: '0.825rem', padding: '0.6rem 1.1rem', flexShrink: 0 }}
              >
                <MessageCircle size={15} />
                <span>Ask Helpdesk on WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* RESULT 1: DOCUMENT / VISA DETAILS */}
        {record && record.type === 'document' && (
          <div className="card fade-in" style={{ borderRadius: '20px', padding: '1.85rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  <FileText size={13} /> Visa &amp; Document Pass
                </span>
                <h2 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {record.docType} • {record.country || 'International'}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Traveler / Applicant: <strong style={{ color: 'var(--text-main)' }}>{record.guestName || 'Valued Guest'}</strong>
                </div>
              </div>

              {shareActions}
            </div>

            {/* Responsive 5-Stage Visual Stepper */}
            <div style={{ ...subSurfaceStyle, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.1rem', letterSpacing: '0.06em' }}>
                Step-by-Step Progress
              </div>

              {(() => {
                const currentStage = getDocumentProgressStage(record);
                const steps = [
                  { label: 'Received', desc: record.receiveDate ? formatFriendlyDate(record.receiveDate) : 'Documents logged' },
                  { label: 'Reviewed', desc: `${record.processType} service` },
                  { label: 'Embassy / Process', desc: record.estimatedDone ? `Est. ${formatFriendlyDate(record.estimatedDone)}` : 'Being processed' },
                  { label: 'On Delivery', desc: record.shippingCourier || 'Courier dispatch' },
                  { label: 'Ready / Delivered', desc: record.sendDate ? formatFriendlyDate(record.sendDate) : 'Complete' }
                ];

                return (
                  <div className="tracker-stepper-grid">
                    {steps.map((step, idx) => {
                      const isPast = idx < currentStage;
                      const isCurrent = idx === currentStage;

                      return (
                        <div key={step.label} className="tracker-stepper-item" style={{ textAlign: 'center', position: 'relative' }}>
                          <div
                            className="tracker-stepper-circle"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              margin: '0 auto 0.55rem auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isPast || isCurrent
                                ? 'linear-gradient(135deg, #00b4ff 0%, #0072f5 100%)'
                                : isLight ? '#e8f3ff' : 'rgba(255, 255, 255, 0.06)',
                              border: `2px solid ${isCurrent ? '#38bdf8' : isPast ? '#0095ff' : 'var(--border)'}`,
                              color: isPast || isCurrent ? '#ffffff' : 'var(--text-subtle)',
                              fontWeight: '700',
                              fontSize: '0.825rem',
                              boxShadow: isCurrent ? '0 0 18px rgba(0, 180, 255, 0.45)' : 'none'
                            }}
                          >
                            {isPast ? <CheckCircle2 size={18} /> : idx + 1}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: isCurrent ? '800' : '600',
                                color: isCurrent ? 'var(--primary)' : isPast ? 'var(--text-main)' : 'var(--text-subtle)',
                                marginBottom: '2px'
                              }}
                            >
                              {step.label}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Visa Appointment Callout */}
            {record.appointmentDate && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
                  border: `1.5px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.35)'}`,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: 'var(--warning)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Your Visa Appointment
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {formatFriendlyDate(record.appointmentDate)} {record.appointmentTime ? `• ${record.appointmentTime}` : ''}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const days = getDaysCountdown(record.appointmentDate);
                    if (days === 0) return <span className="badge badge-danger">Today</span>;
                    if (days === 1) return <span className="badge badge-warning">Tomorrow</span>;
                    if (days > 1) return <span className="badge badge-success">In {days} days</span>;
                    return <span className="badge badge-primary">Completed</span>;
                  })()}
                </div>

                {record.appointmentLocation && (
                  <div
                    style={{
                      background: isLight ? '#ffffff' : 'rgba(5, 10, 22, 0.5)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <MapPin size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Location:</strong> {record.appointmentLocation}
                    </span>
                  </div>
                )}

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Friendly reminder: Please arrive 15–20 minutes early with your original passport, photos, and supporting documents.
                </div>
              </div>
            )}

            {/* Courier Resi Callout */}
            {record.shippingResi && (
              <div
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '14px',
                  background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid var(--border-hover)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: 'var(--primary-glow)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Truck size={21} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                      Courier Tracking Number
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {record.shippingCourier ? `${record.shippingCourier}: ` : ''}{record.shippingResi}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyResi(record.shippingResi)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.8rem' }}
                >
                  {copiedResi ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedResi ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>
            )}

            {/* Key Summary Grid */}
            <div
              style={{
                ...subSurfaceStyle,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Booking Reference</span>
                <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {record.bookingCode || '-'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Estimated Ready Date</span>
                <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--primary)', marginTop: '2px' }}>
                  {formatFriendlyDate(record.estimatedDone)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Service Tier</span>
                <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {record.processType}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Current Status</span>
                <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--success)', marginTop: '2px' }}>
                  {record.shippingStatus}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULT 2: TOUR DETAILS */}
        {record && record.type === 'tour' && (
          <div className="card fade-in" style={{ borderRadius: '20px', padding: '1.85rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  <Plane size={13} /> Tour Itinerary Pass
                </span>
                <h2 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {record.tourCode} • {record.country}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {record.category || 'Leisure'} Trip • <strong style={{ color: 'var(--text-main)' }}>{record.paxCount} Traveler(s)</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
                {shareActions}
                {(() => {
                  const days = getDaysCountdown(record.departureDate);
                  if (days === null) return null;
                  return (
                    <span className={`badge ${days >= 0 ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                      {days > 0 ? `Departs in ${days} days` : days === 0 ? 'Departs Today!' : 'Trip Underway / Completed'}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div
              style={{
                ...subSurfaceStyle,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.35rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>Departure Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {formatFriendlyDate(record.departureDate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>Return Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {formatFriendlyDate(record.returnDate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>Booking Status</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--success)' }}>
                  {record.status || 'Confirmed'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.15rem',
                borderRadius: '12px',
                background: isLight ? '#eff8ff' : 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '0.825rem',
                lineHeight: '1.55'
              }}
            >
              <strong style={{ color: 'var(--text-main)' }}>Helpful Travel Tip:</strong> Make sure your passport is valid for at least 6 months past your return date, and plan to arrive at the airport 3 hours before international flights.
            </div>
          </div>
        )}

        {/* RESULT 3: HOTEL DETAILS */}
        {record && record.type === 'hotel' && (
          <div className="card fade-in" style={{ borderRadius: '20px', padding: '1.85rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.4rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  <Building size={13} /> Hotel Stay Voucher
                </span>
                <h2 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {record.hotelName}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {record.region || 'Destination'} • Room: <strong style={{ color: 'var(--text-main)' }}>{record.roomType || 'Standard'}</strong>
                </div>
              </div>
              {shareActions}
            </div>

            <div
              style={{
                ...subSurfaceStyle,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Check-In</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
                  {formatFriendlyDate(record.checkIn)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Check-Out</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatFriendlyDate(record.checkOut)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Confirmation No.</span>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                  {record.confirmationNumber || record.id}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULT 4: CRUISE DETAILS (Newly Rendered!) */}
        {record && record.type === 'cruise' && (
          <div className="card fade-in" style={{ borderRadius: '20px', padding: '1.85rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.4rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  <Ship size={13} /> Cruise Voyage Pass
                </span>
                <h2 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {record.shipName || 'Cruise Booking'} {record.cruiseBrand ? `• ${record.cruiseBrand}` : ''}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Voyage Route: <strong style={{ color: 'var(--text-main)' }}>{record.route || 'International Sailing'}</strong>
                </div>
              </div>
              {shareActions}
            </div>

            <div
              style={{
                ...subSurfaceStyle,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Embarkation</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
                  {formatFriendlyDate(record.sailingStart)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Disembarkation</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatFriendlyDate(record.sailingEnd)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Booking Reference</span>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                  {record.bookingRef || record.id}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warm Customer Care Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '1.75rem 1rem 0.5rem',
            color: 'var(--text-subtle)',
            fontSize: '0.825rem',
            lineHeight: '1.6'
          }}
        >
          <div style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
            Powered by TravelOps • Real-Time Travel &amp; Visa Concierge
          </div>
          <div>
            Have questions about your trip? Reach out to your personal travel consultant anytime.
          </div>
        </footer>
      </main>
    </div>
  );
};

export default PublicTracker;
