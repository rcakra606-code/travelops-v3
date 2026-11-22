import { Plane, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  computeEnrichedSegments,
  summarizeAirlinesFromSegments,
  getActivePassengers,
  formatDateWithDayId,
  formatDateShortId,
  formatNumberWithCommas,
  buildTimeLimitText,
  buildBaggageText,
  buildChangePolicyText,
  buildRefundPolicyText,
  buildFlightConfirmationWhatsAppText,
  DEFAULT_PASSPORT_CLAUSE
} from '../../utils/flightBookingHelpers';

const FlightBookingPreview = ({ form, viewMode = 'whatsapp', isLight = false }) => {
  const activePax = getActivePassengers(form.passengers);
  const enrichedSegments = computeEnrichedSegments(form.segments);
  const airlinesSummary =
    String(form.airlinesLabel || '').trim() || summarizeAirlinesFromSegments(enrichedSegments) || '-';

  const whatsappText = buildFlightConfirmationWhatsAppText(form);

  const adultPrice = formatNumberWithCommas(form.priceAdult);
  const childPrice = formatNumberWithCommas(form.priceChild);
  const infantPrice = formatNumberWithCommas(form.priceInfant);
  const hasAnyPrice = Boolean(adultPrice || childPrice || infantPrice);

  const terms = [
    buildTimeLimitText(form),
    buildBaggageText(form),
    buildChangePolicyText(form),
    buildRefundPolicyText(form),
    DEFAULT_PASSPORT_CLAUSE,
    ...(String(form.extraNotes || '').trim() ? [String(form.extraNotes).trim()] : [])
  ];

  const showWa = viewMode === 'whatsapp' || viewMode === 'both';
  const showDoc = viewMode === 'document' || viewMode === 'both';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* WHATSAPP / CHAT COPY-PASTE PREVIEW */}
      {showWa && (
        <div
          className="no-print-area"
          style={{
            background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '0.65rem 1rem',
              background: isLight ? '#047857' : 'rgba(6, 78, 59, 0.85)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <span>Preview Teks WhatsApp / Chat Customer</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
              Siap salin &amp; kirim
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '1rem 1.15rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: isLight ? '#0f172a' : '#e2e8f0',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.72)'
            }}
          >
            {whatsappText}
          </pre>
        </div>
      )}

      {/* OFFICIAL A4 DOCUMENT PREVIEW (PDF / PRINT) */}
      {showDoc && (
        <div className="flight-booking-print-root">
          <article
            className="flight-booking-sheet"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '794px',
              margin: '0 auto',
              borderRadius: '6px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.22)',
              overflow: 'hidden',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '12px',
              lineHeight: 1.45
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0b1329 0%, #0f274c 100%)',
                color: '#ffffff',
                padding: '20px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.02em' }}>
                  KONFIRMASI PEMESANAN TIKET PESAWAT
                </div>
                <div style={{ fontSize: '10px', color: '#bae6fd', marginTop: '3px', letterSpacing: '0.06em' }}>
                  FLIGHT RESERVATION &amp; TICKETING CONFIRMATION
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <img
                  src="/dwidayatour-logo.png"
                  alt="Dwidayatour"
                  style={{ height: '26px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '3px' }}>
                  {form.branchName || 'Dwidayatour'}
                  {form.staffName ? ` · ${form.staffName}` : ''}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 28px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Booking Codes Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1'
                }}
              >
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    AGENT BOOKING CODE
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0f172a',
                      fontFamily: 'monospace',
                      marginTop: '2px'
                    }}
                  >
                    {String(form.agentBookingCode || '').trim().toUpperCase() || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    AIRLINES BOOKING CODE
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0284c7',
                      fontFamily: 'monospace',
                      marginTop: '2px'
                    }}
                  >
                    {String(form.airlinesBookingCode || '').trim().toUpperCase() || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    AIRLINES
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {airlinesSummary}
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '0.03em' }}>
                  PASSENGER NAME ({activePax.length} PAX)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', width: '38px', textAlign: 'center', border: '1px solid #0f172a' }}>No</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #0f172a' }}>Nama Penumpang (Sesuai Paspor)</th>
                      <th style={{ padding: '6px 10px', width: '110px', textAlign: 'left', border: '1px solid #0f172a' }}>Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePax.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '8px', textAlign: 'center', color: '#64748b', border: '1px solid #cbd5e1' }}>
                          Belum ada penumpang
                        </td>
                      </tr>
                    ) : (
                      activePax.map((p, idx) => (
                        <tr key={`doc-pax-${idx}`} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '5.5px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '5.5px 10px', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                            {p.title} {p.fullName}
                          </td>
                          <td style={{ padding: '5.5px 10px', border: '1px solid #cbd5e1', color: '#475569' }}>
                            {p.paxType === 'CHD' ? 'Anak (CHD)' : p.paxType === 'INF' ? 'Bayi (INF)' : 'Dewasa (ADT)'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Flight Itinerary */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    letterSpacing: '0.03em'
                  }}
                >
                  <Plane size={13} color="#0284c7" />
                  <span>FLIGHT DETAIL — {airlinesSummary}</span>
                </div>

                {enrichedSegments.length === 0 ? (
                  <div style={{ padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada jadwal penerbangan. Parse reservasi atau tambahkan segmen di sebelah kiri.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {enrichedSegments.map((seg, idx) => (
                      <div key={`doc-seg-${idx}`}>
                        <div
                          style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            background: '#ffffff'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '6px',
                              paddingBottom: '6px',
                              marginBottom: '7px',
                              borderBottom: '1px dashed #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '10px',
                                  padding: '2px 7px',
                                  borderRadius: '5px'
                                }}
                              >
                                {idx + 1}. {seg.airlineCode || '--'} {seg.flightNumber || '---'}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '11px', color: '#0f172a' }}>
                                {seg.airlineName || seg.airlineCode}
                              </span>
                              {seg.bookingClass && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    fontWeight: 700
                                  }}
                                >
                                  Class {seg.bookingClass}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                              {seg.departureDate ? formatDateWithDayId(seg.departureDate) : 'Tanggal TBA'}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr auto 1fr',
                              gap: '10px',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                {seg.departureTime || '--:--'}
                              </div>
                              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b' }}>
                                {seg.originDetail}
                              </div>
                              {seg.terminalOrigin && (
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Terminal {seg.terminalOrigin}</div>
                              )}
                            </div>

                            <div style={{ textAlign: 'center', color: '#0284c7', fontSize: '11px', fontWeight: 700 }}>
                              <Plane size={14} />
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  justifyContent: 'flex-end',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                  {seg.arrivalTime || '--:--'}
                                </span>
                                {seg.arrivalDayOffset !== 0 && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: '999px',
                                      background: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fcd34d'
                                    }}
                                  >
                                    {seg.arrivalDayOffset > 0 ? `+${seg.arrivalDayOffset}` : seg.arrivalDayOffset}
                                    {seg.arrivalDate ? ` (${formatDateShortId(seg.arrivalDate)})` : ''}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b' }}>
                                {seg.destinationDetail}
                              </div>
                              {seg.terminalDestination && (
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Terminal {seg.terminalDestination}</div>
                              )}
                            </div>
                          </div>

                          {/* Dinihari H-1 Airport Alert */}
                          {seg.showDinihariNotice && seg.dinihariNoticeText && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                background: '#fff7ed',
                                border: '1px solid #fdba74',
                                color: '#9a3412',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <AlertTriangle size={13} />
                              <span>{seg.dinihariNoticeText}</span>
                            </div>
                          )}
                        </div>

                        {/* Transit Duration Connector Pill */}
                        {seg.transitAfterLabel && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: '6px'
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 12px',
                                borderRadius: '999px',
                                background: '#e0f2fe',
                                border: '1px solid #7dd3fc',
                                color: '#0369a1',
                                fontSize: '10.5px',
                                fontWeight: 700
                              }}
                            >
                              <Clock size={11} />
                              Transit di {seg.transitAirportDetail} selama {seg.transitAfterLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Table */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '0.03em' }}>
                  HARGA TIKET
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <tbody>
                    {(adultPrice || !hasAnyPrice) && (
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, width: '40%' }}>
                          Dewasa (Adult)
                        </td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 800, textAlign: 'right', fontFamily: 'monospace' }}>
                          {adultPrice ? `IDR ${adultPrice} / Pax` : 'IDR .................... / Pax'}
                        </td>
                      </tr>
                    )}
                    {(childPrice || !hasAnyPrice) && (
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}>
                          Anak (Child)
                        </td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 800, textAlign: 'right', fontFamily: 'monospace' }}>
                          {childPrice ? `IDR ${childPrice} / Pax` : 'IDR .................... / Pax'}
                        </td>
                      </tr>
                    )}
                    {(infantPrice || !hasAnyPrice) && (
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}>
                          Bayi (Infant)
                        </td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 800, textAlign: 'right', fontFamily: 'monospace' }}>
                          {infantPrice ? `IDR ${infantPrice} / Pax` : 'IDR .................... / Pax'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Terms & Conditions */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={13} color="#047857" />
                  <span>KETENTUAN &amp; SYARAT TIKET</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#1e293b' }}>
                  {terms.map((t, i) => (
                    <li key={`term-${i}`}>{t}</li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default FlightBookingPreview;
