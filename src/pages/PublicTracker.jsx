import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, ShieldCheck, CheckCircle2, Clock, Truck, MapPin, 
  Calendar, FileText, Ship, Building, Plane, ArrowRight, 
  ExternalLink, Copy, Check, AlertCircle, Phone, Share2, Sparkles, RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const PublicTracker = () => {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(paramCode || '');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paramCode) {
      fetchTrackingData(paramCode);
    }
  }, [paramCode]);

  const fetchTrackingData = async (codeToTrack) => {
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
      } catch (apiErr) {
        // Backend API might not be running or proxied in some environments, fallback to Supabase query
      }

      // 2. Fallback: Query Supabase directly
      // Check Documents
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
          processType: d.process_type || 'Normal',
          receiveDate: d.receive_date,
          estimatedDone: d.estimated_done,
          sendDate: d.send_date,
          bookingCode: d.booking_code,
          invoiceNumber: d.invoice_number,
          shippingStatus: d.shipping_status || 'Processing',
          shippingMethod: d.shipping_method,
          shippingCourier: d.shipping_courier,
          shippingResi: d.shipping_resi,
          shippingNotes: d.shipping_notes,
          receivedStatus: d.received_status
        });
        setLoading(false);
        return;
      }

      // Check Tours
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

      // Check Hotels
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

      // Check Cruises
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

      // Not found
      setError(`No travel record found for code "${cleanCode}". Please verify your booking reference or resi number.`);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError('Unable to fetch live tracking details at the moment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/track/${encodeURIComponent(inputCode.trim())}`);
      fetchTrackingData(inputCode.trim());
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `Halo, berikut link update status perjalanan & dokumen saya di TravelOps:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Determine Stepper Stage for Documents
  const getDocumentProgressStage = (doc) => {
    if (doc.shippingStatus === 'Delivered' || doc.receivedStatus === 'Final' || doc.sendDate) {
      return 4; // Complete / Delivered
    }
    if (doc.shippingResi || doc.shippingStatus === 'Sent' || doc.shippingStatus === 'In Transit') {
      return 3; // Dispatched / In Delivery
    }
    if (doc.estimatedDone) {
      const est = new Date(doc.estimatedDone);
      const now = new Date();
      if (now >= est) return 3;
      return 2; // Embassy Processing
    }
    if (doc.receiveDate) {
      return 1; // Document Verification
    }
    return 0; // Received
  };

  // Days Countdown Helper
  const getDaysCountdown = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '1.5rem 1rem'
    }}>
      {/* Brand Top Header */}
      <div style={{
        maxWidth: '840px',
        margin: '0 auto 1.75rem auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
          }}>
            <Plane size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              TravelOps
            </div>
            <div style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Client Live Tracking Hub
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.6rem', borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.7rem', color: '#34d399', fontWeight: '600'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>

        {/* Tracking Search Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
            Track Your Travel & Document Status
          </h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: '#94a3b8' }}>
            Enter your Booking Code, Courier Resi Number, or Confirmation Reference to check live progress.
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="e.g. BOOK-12345, JNE98213..."
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)'
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
              <span>Track Now</span>
            </button>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#06b6d4' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(6, 182, 212, 0.2)', borderLeftColor: '#06b6d4', borderRadius: '50%' }} />
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Retrieving live operational status...</div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {/* RESULT: DOCUMENT / VISA DETAILS */}
        {record && record.type === 'document' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Top Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                  background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)'
                }}>
                  DOCUMENT / VISA TRACKING
                </span>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
                  {record.docType} • {record.country || 'International'}
                </h3>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Passenger / Applicant: <strong style={{ color: '#f8fafc' }}>{record.guestName}</strong>
                </div>
              </div>

              {/* Share & Copy Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.45rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Share Link'}</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.45rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* VISUAL STEPPER (5 STAGES) */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                Processing Progress
              </div>

              {(() => {
                const currentStage = getDocumentProgressStage(record);
                const steps = [
                  { label: 'Received', desc: record.receiveDate || 'Documents In' },
                  { label: 'Verification', desc: record.processType || 'Verified' },
                  { label: 'Embassy / Process', desc: record.estimatedDone ? `Est. ${record.estimatedDone}` : 'In Progress' },
                  { label: 'Delivery / Courier', desc: record.shippingCourier || 'Dispatched' },
                  { label: 'Completed', desc: 'Ready / Delivered' }
                ];

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', position: 'relative' }}>
                    {steps.map((step, idx) => {
                      const isPast = idx < currentStage;
                      const isCurrent = idx === currentStage;
                      const isUpcoming = idx > currentStage;

                      return (
                        <div key={step.label} style={{ textAlign: 'center', position: 'relative' }}>
                          {/* Step Circle */}
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            margin: '0 auto 0.5rem auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isPast || isCurrent 
                              ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${isCurrent ? '#38bdf8' : isPast ? '#06b6d4' : 'rgba(255, 255, 255, 0.15)'}`,
                            color: isPast || isCurrent ? '#ffffff' : '#64748b',
                            fontWeight: '700', fontSize: '0.8rem',
                            boxShadow: isCurrent ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none'
                          }}>
                            {isPast ? <CheckCircle2 size={18} /> : (idx + 1)}
                          </div>
                          <div style={{
                            fontSize: '0.75rem', fontWeight: isCurrent ? '800' : '600',
                            color: isCurrent ? '#38bdf8' : isPast ? '#ffffff' : '#64748b',
                            marginBottom: '2px'
                          }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Courier / Shipping Resi Callout Card */}
            {record.shippingResi && (
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Truck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', fontWeight: '700', color: '#06b6d4', textTransform: 'uppercase' }}>
                      Courier Dispatch & Tracking Number
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
                      {record.shippingCourier ? `${record.shippingCourier}: ` : ''}{record.shippingResi}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(record.shippingResi);
                    alert(`Courier Resi number "${record.shippingResi}" copied!`);
                  }}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: '8px',
                    background: '#06b6d4', color: '#ffffff', border: 'none',
                    fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  Copy Resi
                </button>
              </div>
            )}

            {/* Information Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Booking Reference</span>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>{record.bookingCode || '-'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target Completion</span>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#38bdf8' }}>{record.estimatedDone || '-'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Process Type</span>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>{record.processType}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Delivery Status</span>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#34d399' }}>{record.shippingStatus}</div>
              </div>
            </div>
          </div>
        )}

        {/* RESULT: TOUR DETAILS */}
        {record && record.type === 'tour' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                  background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.35)'
                }}>
                  TOUR ITINERARY PASS
                </span>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
                  {record.tourCode} • {record.country}
                </h3>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Category: <strong>{record.category || 'Leisure'}</strong> • {record.paxCount} Participant(s)
                </div>
              </div>

              {/* Countdown Pill */}
              {(() => {
                const days = getDaysCountdown(record.departureDate);
                if (days !== null) {
                  return (
                    <div style={{
                      padding: '0.5rem 1rem', borderRadius: '12px',
                      background: days > 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${days > 0 ? 'rgba(6, 182, 212, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: days > 0 ? '#06b6d4' : '#34d399', textTransform: 'uppercase' }}>
                        Departure Countdown
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                        {days > 0 ? `${days} Days Left` : days === 0 ? 'Departs TODAY!' : 'Tour Departed'}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Travel Dates Card */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
              background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px',
              padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Departure Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>
                  {record.departureDate ? new Date(record.departureDate + 'T00:00:00').toLocaleDateString('en-US', { dateStyle: 'full' }) : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Return Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
                  {record.returnDate ? new Date(record.returnDate + 'T00:00:00').toLocaleDateString('en-US', { dateStyle: 'full' }) : '-'}
                </div>
              </div>
            </div>

            {/* Travel Advisory Note */}
            <div style={{
              padding: '1rem', borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fde047', fontSize: '0.8rem', lineHeight: '1.5'
            }}>
              <strong>💡 Tour Preparation Tip:</strong> Please ensure your passport is valid for at least 6 months beyond your return date. Arrive at the airport departure terminal 3 hours prior to international flights.
            </div>
          </div>
        )}

        {/* RESULT: HOTEL DETAILS */}
        {record && record.type === 'hotel' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
          }}>
            <span style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
              background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              HOTEL VOUCHER PASS
            </span>
            <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
              {record.hotelName}
            </h3>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Region: {record.region} • Room Type: {record.roomType || 'Standard'}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
              background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', padding: '1.25rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Check-In</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>{record.checkIn}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Check-Out</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>{record.checkOut}</div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Care Footer */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: '#64748b',
          fontSize: '0.8rem'
        }}>
          <div>Protected by TravelOps Operations Suite • Verified Real-time Tracking</div>
          <div style={{ marginTop: '0.5rem' }}>
            Need help with your itinerary or documents? Please contact your travel consultant or agency helpdesk.
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicTracker;
