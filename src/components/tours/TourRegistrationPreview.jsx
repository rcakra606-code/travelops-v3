import {
  TERMS_AND_CONDITIONS,
  terbilangIndonesia,
  formatIndonesianDate,
  formatDepartureDateRange,
  getActiveParticipants,
  getTourDisplayName,
  getTourPriceDisplay,
  getDepositDisplay,
  buildSummaryBoxText,
  buildLeadContactNote
} from '../../utils/tourRegistrationPdf';

const SheetHeader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '6px' }}>
    <img
      src="/dwidayatour-logo.png"
      alt="Dwidayatour"
      style={{ height: '27px', width: 'auto', objectFit: 'contain', display: 'block' }}
    />
    <span
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '8.5px',
        color: '#64748b',
        marginTop: '1px',
        letterSpacing: '0.01em'
      }}
    >
      making travel easy
    </span>
  </div>
);

const TourRegistrationPreview = ({ form, viewMode = 'both' }) => {
  const activePax = getActiveParticipants(form.participants);
  const paxCount = activePax.length;
  const terbilang = terbilangIndonesia(paxCount);
  const leadPhone = String(form.leadPhone || '').trim();
  const leadEmail = String(form.leadEmail || '').trim();
  const roomingNote = String(form.roomingNote || '').trim().toUpperCase();
  const minPaxSlots = Math.max(5, activePax.length);

  const participantRows = [];
  for (let i = 0; i < minPaxSlots; i += 1) {
    const pax = activePax[i];
    if (pax) {
      const ket = i === 0 ? buildLeadContactNote(leadPhone, leadEmail, pax.note) : pax.note || '';
      participantRows.push({
        no: `${i + 1}.`,
        name: `${pax.title} ${pax.fullName}`,
        note: ket,
        isBoldNote: false
      });
    } else {
      participantRows.push({ no: '', name: '', note: '', isBoldNote: false });
    }
  }

  if (roomingNote) {
    participantRows.push({ no: '', name: '', note: `ROOM : ${roomingNote}`, isBoldNote: true });
    participantRows.push({ no: '', name: '', note: '', isBoldNote: false });
  } else {
    participantRows.push({ no: '', name: '', note: '', isBoldNote: false });
  }

  const summaryBoxText = form.useCustomSummaryBox
    ? String(form.customSummaryBoxText || '')
    : buildSummaryBoxText(form);

  const formDateStr = formatIndonesianDate(form.formDate, true) || '-';
  const receivedBy = String(form.receivedBy || '').trim() || '-';
  const branchName = String(form.branchName || '').trim() || 'Kelapa Gading';
  const lc = TERMS_AND_CONDITIONS.leftColumn;

  const sheetBaseStyle = {
    background: '#ffffff',
    color: '#000000',
    width: '100%',
    maxWidth: '794px',
    minHeight: '1060px',
    margin: '0 auto',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.22)',
    borderRadius: '4px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  return (
    <div
      className="tour-reg-print-root tour-reg-preview-stack"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* PAGE 1: FORMULIR PENDAFTARAN */}
      <article
        className={`tour-reg-sheet ${viewMode === 'page2' ? 'tour-reg-screen-hidden' : ''}`}
        style={{
          ...sheetBaseStyle,
          padding: '34px 46px 28px',
          fontFamily: '"Times New Roman", Times, Georgia, serif',
          fontSize: '12.5px',
          lineHeight: 1.42
        }}
      >
          <div>
            <SheetHeader />

            <h2
              style={{
                textAlign: 'center',
                fontSize: '17px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                margin: '4px 0 8px',
                color: '#000000',
                fontFamily: '"Times New Roman", Times, Georgia, serif'
              }}
            >
              FORMULIR PENDAFTARAN
            </h2>

            <hr style={{ border: 0, borderTop: '1.8px solid #000000', margin: '0 0 14px' }} />

            <p style={{ margin: '0 0 12px', textAlign: 'left', color: '#000000' }}>
              Saya yang bertandatangan di bawah ini, mewakili seluruh peserta tur yang namanya tertera di bawah ini,
              yaitu total <strong>{paxCount} ( {terbilang} )</strong> Peserta, melakukan reservasi sebagai berikut:
            </p>

            {/* Participants Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '16px',
                fontSize: '11.5px',
                color: '#000000'
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '4px 6px',
                      textAlign: 'left',
                      fontWeight: 400,
                      width: '7%',
                      background: '#fff',
                      color: '#000'
                    }}
                  >
                    No.
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '4px 6px',
                      textAlign: 'left',
                      fontWeight: 400,
                      width: '45%',
                      background: '#fff',
                      color: '#000'
                    }}
                  >
                    Nama peserta sesuai paspor
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '4px 6px',
                      textAlign: 'left',
                      fontWeight: 400,
                      width: '48%',
                      background: '#fff',
                      color: '#000'
                    }}
                  >
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantRows.map((row, idx) => (
                  <tr key={idx} style={{ background: '#fff' }}>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '3.5px 6px',
                        height: '21px',
                        color: '#000',
                        background: '#fff'
                      }}
                    >
                      {row.no}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '3.5px 6px',
                        height: '21px',
                        color: '#000',
                        background: '#fff'
                      }}
                    >
                      {row.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '3.5px 6px',
                        height: '21px',
                        fontWeight: row.isBoldNote ? 700 : 400,
                        color: '#000',
                        background: '#fff',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.32
                      }}
                    >
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Package Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', fontSize: '12px' }}>
              {[
                { label: 'Nama tur / Tour code', val: getTourDisplayName(form) },
                { label: 'Tanggal keberangkatan', val: formatDepartureDateRange(form.departureDate, form.returnDate) },
                { label: 'Harga tur', val: getTourPriceDisplay(form) },
                { label: 'Jumlah Uang Muka yang dibayarkan', val: getDepositDisplay(form) },
                { label: 'Reservasi diterima oleh', val: `${receivedBy}  dari cabang / agent : ${branchName}` }
              ].map((item) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '205px 12px 1fr', alignItems: 'start' }}>
                  <span>{item.label}</span>
                  <span>:</span>
                  <span style={{ wordBreak: 'break-word' }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Legal Declarations */}
            <div style={{ fontSize: '12px', marginBottom: '26px' }}>
              <p style={{ margin: '0 0 6px', color: '#000' }}>Dengan ini saya menyatakan bahwa:</p>
              <ol style={{ margin: 0, paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ textAlign: 'justify' }}>
                  Pada saat menandatangani Formulir Pendaftaran ini dan membayar uang muka, saya telah membaca, memahami
                  dan menyetujui seluruh Syarat dan Ketentuan sesuai dengan yang tertera pada halaman 2 Formulir
                  Pendaftaran ini.
                </li>
                <li style={{ textAlign: 'justify' }}>
                  Pada saat saya menandatangani Formulir Pendaftaran ini, saya bertindak untuk dan atas nama diri sendiri
                  serta bertindak sebagai penerima kuasa dari seluruh peserta tur yang namanya tertera pada Formulir
                  Pendaftaran ini. Dengan demikian, saya turut mengemban seluruh tanggung jawab dan pemenuhan kewajiban
                  peserta tur sebagaimana yang ditetapkan pada Syarat dan Ketentuan pada Formulir Pendaftaran ini serta
                  peraturan yang ditetapkan oleh pihak hotel, maskapai penerbangan, dan penyedia barang/jasa lainnya
                  dalam tur ini.
                </li>
              </ol>
            </div>

            {/* Bottom 2 Columns: Summary Box + Date & Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '26px', alignItems: 'stretch' }}>
              <div
                style={{
                  border: '1px solid #000',
                  padding: '10px 12px',
                  minHeight: '155px',
                  fontSize: '11.2px',
                  lineHeight: 1.42,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#000'
                }}
              >
                {summaryBoxText || (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Rincian harga &amp; catatan akan tampil otomatis di sini...
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  paddingBottom: '12px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', fontSize: '12px' }}>
                  <span>Tanggal</span>
                  <span>: {formDateStr}</span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '72px' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '0.02em' }}>
                    (&nbsp;
                    <span
                      style={{
                        display: 'inline-block',
                        width: '148px',
                        borderBottom: '1px solid #000',
                        verticalAlign: 'baseline'
                      }}
                    />
                    &nbsp;)
                  </div>
                  {form.showSignerName && activePax[0] && (
                    <div style={{ fontSize: '10.5px', marginTop: '4px', fontWeight: 600 }}>
                      {activePax[0].title} {activePax[0].fullName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#1e293b', marginTop: '20px' }}>
            Page 1 of 2
          </div>
      </article>

      {/* PAGE 2: SYARAT DAN KETENTUAN (BAKU / LOCKED) */}
      <article
        className={`tour-reg-sheet ${viewMode === 'page1' ? 'tour-reg-screen-hidden' : ''}`}
        style={{
          ...sheetBaseStyle,
          padding: '28px 34px 24px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '8.7px',
          lineHeight: 1.33
        }}
      >
          <div>
            <SheetHeader />

            <h2
              style={{
                textAlign: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                margin: '2px 0 12px',
                color: '#000',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            >
              {TERMS_AND_CONDITIONS.title}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>
              {/* Left Column: Clause 1 & 2 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '10px' }}>
                  <span>1.</span>
                  <span>{lc.clause1Title}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '5px' }}>
                  <span>a.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px', textAlign: 'justify', color: '#000' }}>{lc.clause1aIntro}</p>

                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: '4px 0',
                        fontSize: '8px',
                        color: '#000'
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: '1px solid #000',
                              padding: '3px 4px',
                              textAlign: 'center',
                              fontWeight: 700,
                              background: '#fff',
                              color: '#000'
                            }}
                          >
                            Route/Destinasi
                          </th>
                          <th
                            style={{
                              border: '1px solid #000',
                              padding: '3px 4px',
                              textAlign: 'center',
                              fontWeight: 700,
                              background: '#fff',
                              color: '#000'
                            }}
                          >
                            Deposit yang harus dibayar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {TERMS_AND_CONDITIONS.depositTable.map(([route, dep], idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #000', padding: '2.5px 4px', background: '#fff', color: '#000' }}>
                              {route}
                            </td>
                            <td style={{ border: '1px solid #000', padding: '2.5px 4px', background: '#fff', color: '#000' }}>
                              {dep}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p style={{ margin: '4px 0 5px', fontStyle: 'italic', fontSize: '8px', color: '#000' }}>
                      {TERMS_AND_CONDITIONS.depositFootnote}
                    </p>
                    <p style={{ margin: '0 0 5px', textAlign: 'justify', color: '#000' }}>{lc.clause1aAfterTable}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '5px' }}>
                  <span>b.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause1b}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '10px' }}>
                  <span>c.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause1c}</p>
                </div>

                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '10px' }}>
                  <span>2.</span>
                  <span>{lc.clause2Title}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '4px' }}>
                  <span>a.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause2a}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '4px' }}>
                  <span>b.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', textAlign: 'justify', color: '#000' }}>{lc.clause2b}</p>
                    <p style={{ margin: '0 0 4px', color: '#000' }}>{lc.clause2bTableIntro}</p>

                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: '3px 0 4px',
                        fontSize: '8.2px',
                        color: '#000'
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: '1px solid #000',
                              padding: '2.5px 4px',
                              textAlign: 'center',
                              fontWeight: 700,
                              background: '#fff',
                              color: '#000'
                            }}
                          >
                            Waktu Pembatalan*
                          </th>
                          <th
                            style={{
                              border: '1px solid #000',
                              padding: '2.5px 4px',
                              textAlign: 'center',
                              fontWeight: 700,
                              background: '#fff',
                              color: '#000'
                            }}
                          >
                            Biaya Pembatalan**
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {TERMS_AND_CONDITIONS.cancellationTable.map(([, fee, displayTime], idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                border: '1px solid #000',
                                padding: '2px 4px',
                                textAlign: 'center',
                                background: '#fff',
                                color: '#000'
                              }}
                            >
                              {displayTime}
                            </td>
                            <td
                              style={{
                                border: '1px solid #000',
                                padding: '2px 4px',
                                textAlign: 'center',
                                background: '#fff',
                                color: '#000'
                              }}
                            >
                              {fee}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ fontStyle: 'italic', fontSize: '8px', marginBottom: '5px', color: '#000' }}>
                      {TERMS_AND_CONDITIONS.cancellationFootnotes.map((fn, i) => (
                        <div key={i}>{fn}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '4px' }}>
                  <span>c.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause2c}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '4px' }}>
                  <span>d.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause2d}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', paddingLeft: '14px' }}>
                  <span>e.</span>
                  <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{lc.clause2e}</p>
                </div>
              </div>

              {/* Right Column: Clauses 3 to 9 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {TERMS_AND_CONDITIONS.rightColumn.map((clause) => (
                  <div key={clause.num}>
                    <div style={{ fontWeight: 700, marginBottom: '3px', display: 'flex', gap: '8px' }}>
                      <span>{clause.num}</span>
                      <span>{clause.title}</span>
                    </div>
                    {clause.paragraph && (
                      <p style={{ margin: '0 0 2px', paddingLeft: '15px', textAlign: 'justify', color: '#000' }}>
                        {clause.paragraph}
                      </p>
                    )}
                    {Array.isArray(clause.items) &&
                      clause.items.map((item) => (
                        <div
                          key={item.label}
                          style={{ display: 'flex', gap: '8px', paddingLeft: '14px', marginBottom: '3px' }}
                        >
                          <span>{item.label}</span>
                          <p style={{ margin: 0, flex: 1, textAlign: 'justify', color: '#000' }}>{item.text}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              fontSize: '10.5px',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              color: '#1e293b',
              marginTop: '14px'
            }}
          >
            Page 2 of 2
          </div>
      </article>
    </div>
  );
};

export default TourRegistrationPreview;
