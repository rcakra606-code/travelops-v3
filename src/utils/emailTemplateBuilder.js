/**
 * TravelOps Enterprise Email Template Builder
 * Generates responsive, executive-styled HTML emails compatible with Gmail, Apple Mail, Outlook, and webmail clients.
 */

const getTodayDateFormatted = () => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getTimestampWib = () => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';
};

/**
 * Universal Executive Email Wrapper & Masthead
 */
const renderEmailHeader = ({ categoryTitle, categorySubtitle, icon = '✈️', badgeText = '', accentColor = '#00a8ff' }) => {
  const dateFormatted = getTodayDateFormatted();

  return `
    <!-- Top Brand Masthead -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #0b1329; border-top: 4px solid ${accentColor}; border-top-left-radius: 12px; border-top-right-radius: 12px;">
      <tr>
        <td style="padding: 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 28px; line-height: 1; padding-right: 14px;">${icon}</td>
                    <td>
                      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: ${accentColor}; margin-bottom: 2px;">
                        TRAVELOPS INTELLIGENCE
                      </div>
                      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                        ${categoryTitle}
                      </h1>
                      <div style="font-size: 12.5px; color: #94a3b8; margin-top: 3px;">
                        ${categorySubtitle}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" valign="middle">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; padding: 6px 14px; text-align: right;">
                  <div style="font-size: 11px; font-weight: 700; color: #e2e8f0;">${dateFormatted}</div>
                  ${badgeText ? `<div style="font-size: 10px; font-weight: 800; color: ${accentColor}; margin-top: 2px;">${badgeText}</div>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Universal Executive Email Footer
 */
const renderEmailFooter = ({ recipient, channelName, appUrl = '' }) => {
  const timeStr = getTimestampWib();

  return `
    <!-- CTA Button Section -->
    ${appUrl ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 26px 0 16px 0;">
        <tr>
          <td align="center">
            <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #00a8ff 0%, #0284c7 100%); color: #ffffff; font-size: 13.5px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0, 168, 255, 0.35); letter-spacing: 0.2px;">
              Buka Dashboard TravelOps &rarr;
            </a>
          </td>
        </tr>
      </table>
    ` : ''}

    <!-- Channel & Recipient Pill -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr>
        <td style="padding: 14px 18px; font-size: 12px; color: #64748b; line-height: 1.5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                Penerima Notifikasi: <strong style="color: #0f172a;">${recipient}</strong><br/>
                Kategori Dispatch: <strong style="color: #0284c7;">${channelName}</strong>
              </td>
              <td align="right" style="font-size: 11px; color: #94a3b8;">
                Waktu Kirim: <strong>${timeStr}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- System Signoff & Confidentiality -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
      <tr>
        <td align="center" style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
          TravelOps Operations Platform &bull; Automated Daily Dispatch Engine<br/>
          Pesan otomatis ini dihasilkan oleh sistem TravelOps. Rahasia &amp; ditujukan khusus untuk staf internal perusahaan.
        </td>
      </tr>
    </table>
  `;
};

/**
 * KPI Stat Widget Card
 */
const renderKpiStrip = (kpis = []) => {
  if (!kpis.length) return '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0 24px 0;">
      <tr>
        ${kpis.map((kpi, idx) => `
          <td width="${Math.floor(100 / kpis.length)}%" style="padding: 0 ${idx < kpis.length - 1 ? '8px' : '0'} 0 ${idx > 0 ? '8px' : '0'};" valign="top">
            <div style="background: ${kpi.bgColor || '#f8fafc'}; border: 1px solid ${kpi.borderColor || '#e2e8f0'}; border-radius: 8px; padding: 12px 14px; text-align: center;">
              <div style="font-size: 22px; font-weight: 800; color: ${kpi.textColor || '#0f172a'}; line-height: 1.1;">
                ${kpi.value}
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">
                ${kpi.label}
              </div>
            </div>
          </td>
        `).join('')}
      </tr>
    </table>
  `;
};

/**
 * 1. OPERATIONAL EMAIL TEMPLATE (Tour & Cruise Departure & Return Milestones)
 */
export const buildOperationalEmailHtml = ({ operationalItems = [], targetRecipient = '', appUrl = '' }) => {
  const urgentCount = operationalItems.filter(i => i.diff === 0 || i.diff === 1).length;
  const warningCount = operationalItems.filter(i => i.diff > 1 && i.diff <= 3).length;
  const upcomingCount = operationalItems.filter(i => i.diff > 3).length;

  const kpis = [
    { label: 'Total Agenda', value: operationalItems.length, textColor: '#0284c7', bgColor: '#f0f9ff', borderColor: '#bae6fd' },
    { label: 'Hari Ini & H-1', value: urgentCount, textColor: '#b91c1c', bgColor: '#fef2f2', borderColor: '#fecdd3' },
    { label: 'H-2 s/d H-3', value: warningCount, textColor: '#b45309', bgColor: '#fffbeb', borderColor: '#fde68a' },
    { label: 'Milestone H-4+', value: upcomingCount, textColor: '#047857', bgColor: '#f0fdf4', borderColor: '#bbf7d0' }
  ];

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelOps Operasional Reminder</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 740px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0;">
        
        ${renderEmailHeader({
          categoryTitle: 'Jadwal Operasional Tour & Cruise',
          categorySubtitle: 'Monitoring Keberangkatan & Kepulangan Tamu',
          icon: '✈️',
          badgeText: `${operationalItems.length} Agenda Aktif`,
          accentColor: '#00a8ff'
        })}

        <div style="padding: 26px 28px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 1.55;">
            Halo <strong>Tim Operasional TravelOps</strong>, berikut adalah daftar agenda keberangkatan dan kepulangan tour &amp; cruise yang terdeteksi untuk pemantauan operasional per <strong>${getTodayDateFormatted()}</strong>:
          </p>

          ${renderKpiStrip(kpis)}

          <!-- Operational Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">Tipe &amp; Kode</th>
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">Destinasi &amp; Produk</th>
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">Nama Tamu</th>
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">PIC Staff</th>
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">Tgl Target</th>
                <th style="padding: 12px 10px; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px;">Milestone</th>
              </tr>
            </thead>
            <tbody>
              ${operationalItems.map((m, idx) => {
                const isUrgent = m.diff === 0 || m.diff === 1;
                const isWarning = m.diff > 1 && m.diff <= 3;
                const badgeBg = isUrgent ? '#fee2e2' : isWarning ? '#fef3c7' : '#ecfdf5';
                const badgeColor = isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#047857';
                const badgeBorder = isUrgent ? '#f87171' : isWarning ? '#fcd34d' : '#86efac';

                return `
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfd'}; border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 11px 10px; font-weight: 700; color: #0f172a;">
                      <span style="font-size: 10px; font-weight: 800; color: ${m.type === 'Cruise' ? '#0284c7' : '#6366f1'}; text-transform: uppercase; display: block; margin-bottom: 2px;">
                        ${m.type === 'Cruise' ? '🚢 Cruise' : '✈️ Tour'}
                      </span>
                      <span style="font-family: Consolas, monospace; font-size: 12.5px;">${m.code}</span>
                    </td>
                    <td style="padding: 11px 10px; color: #334155;">
                      <strong style="color: #0f172a; display: block; font-size: 12.5px;">${m.productDetails}</strong>
                      <span style="font-size: 11px; color: #64748b;">Pax: <strong>${m.pax}</strong></span>
                    </td>
                    <td style="padding: 11px 10px; color: #0f172a; font-weight: 600;">
                      ${m.customerName}
                    </td>
                    <td style="padding: 11px 10px; color: #0284c7; font-weight: 600;">
                      ${m.handlingStaff}
                    </td>
                    <td style="padding: 11px 10px; font-family: Consolas, monospace; color: #0f172a; font-weight: 700; font-size: 12px;">
                      ${m.date}
                    </td>
                    <td style="padding: 11px 10px;">
                      <span style="display: inline-block; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-weight: 800; padding: 4px 8px; border-radius: 5px; font-size: 11px; white-space: nowrap;">
                        ${m.milestone}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${renderEmailFooter({ recipient: targetRecipient, channelName: 'Jalur 1 — Operasional Tour & Cruise', appUrl })}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 2. ADMIN & FINANCE EMAIL TEMPLATE (Unclaimed Form Claim MDR & Pending Invoices)
 */
export const buildAdminEmailHtml = ({ unclaimedMdrItems = [], uninvoicedItems = [], targetRecipient = '', appUrl = '' }) => {
  const kpis = [
    { label: 'Claim MDR Pending', value: unclaimedMdrItems.length, textColor: '#e11d48', bgColor: '#fff1f2', borderColor: '#fecdd3' },
    { label: 'Belum Di-Invoice', value: uninvoicedItems.length, textColor: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
    { label: 'Total Tindakan', value: unclaimedMdrItems.length + uninvoicedItems.length, textColor: '#4338ca', bgColor: '#eef2ff', borderColor: '#c7d2fe' }
  ];

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelOps Administrasi &amp; Keuangan</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06); border: 1px solid #fecdd3;">
        
        ${renderEmailHeader({
          categoryTitle: 'TravelOps Administrasi &amp; Keuangan',
          categorySubtitle: 'Peringatan Form Claim MDR &amp; Penerbitan Invoice Tour',
          icon: '🧾',
          badgeText: `${unclaimedMdrItems.length + uninvoicedItems.length} Tindakan Pending`,
          accentColor: '#f43f5e'
        })}

        <div style="padding: 26px 28px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 1.55;">
            Halo <strong>Tim Administrasi &amp; Keuangan</strong>, sistem mendeteksi kelengkapan berkas administrasi dan status invoice tour yang <strong>memerlukan tindakan segera</strong> per <strong>${getTodayDateFormatted()}</strong>:
          </p>

          ${renderKpiStrip(kpis)}

          <!-- SECTION 1: FORM CLAIM MDR -->
          ${unclaimedMdrItems.length > 0 ? `
            <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-bottom: 1px solid #fda4af; padding-bottom: 10px;">
                <tr>
                  <td valign="middle">
                    <h3 style="margin: 0; color: #9f1239; font-size: 15.5px; font-weight: 800;">
                      1. Form Claim MDR Belum Dicentang (${unclaimedMdrItems.length} Tour)
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #be123c;">
                      Checklist verifikasi berkas Form Claim MDR belum dicentang. Mohon PIC segera verifikasi dan centang checkbox pada modul Tour.
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: #e11d48; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                      MDR ACTION
                    </span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecdd3;">
                <thead>
                  <tr style="background: #ffe4e6; color: #881337; text-align: left;">
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Kode Tour</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Destinasi &amp; Produk</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Nama Tamu</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">PIC Staff</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Tgl Berangkat</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${unclaimedMdrItems.map((item, idx) => `
                    <tr style="border-bottom: 1px solid #ffe4e6; background: ${idx % 2 === 0 ? '#ffffff' : '#fffbfa'};">
                      <td style="padding: 10px 10px; font-weight: 700; color: #0f172a; font-family: Consolas, monospace;">
                        ${item.code}
                        <div style="font-size: 10.5px; color: #64748b; font-family: sans-serif; font-weight: normal; margin-top: 2px;">${item.pax} Pax</div>
                      </td>
                      <td style="padding: 10px 10px; color: #334155;">
                        <strong style="color: #0f172a;">${item.destination}</strong>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.productDetails}</div>
                      </td>
                      <td style="padding: 10px 10px; color: #0f172a; font-weight: 600;">
                        ${item.customerName}
                      </td>
                      <td style="padding: 10px 10px; color: #0284c7; font-weight: 600;">
                        ${item.handlingStaff}
                      </td>
                      <td style="padding: 10px 10px; font-family: Consolas, monospace; color: #0f172a; font-weight: 700;">
                        ${item.departureDate}
                      </td>
                      <td style="padding: 10px 10px;">
                        <span style="background: #fee2e2; color: #991b1b; font-weight: 800; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; border: 1px solid #f87171; display: inline-block;">
                          ❌ Belum Dicentang
                        </span>
                        <div style="font-size: 10.5px; color: #b91c1c; margin-top: 3px; font-weight: 600;">${item.milestone}</div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- SECTION 2: UNINVOICED TOURS -->
          ${uninvoicedItems.length > 0 ? `
            <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-bottom: 1px solid #fcd34d; padding-bottom: 10px;">
                <tr>
                  <td valign="middle">
                    <h3 style="margin: 0; color: #92400e; font-size: 15.5px; font-weight: 800;">
                      2. Tour Belum Memiliki Nomor Invoice (${uninvoicedItems.length} Tour)
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309;">
                      Tour berikut belum di-invoice dan telah memasuki jendela H-30 keberangkatan. Mohon segera terbitkan dan input nomor invoice.
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: #d97706; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                      INVOICE NEEDED
                    </span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fde68a;">
                <thead>
                  <tr style="background: #fef3c7; color: #78350f; text-align: left;">
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Kode Tour</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Destinasi &amp; Produk</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Nama Tamu</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">PIC Staff</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Tgl Berangkat</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${uninvoicedItems.map((item, idx) => `
                    <tr style="border-bottom: 1px solid #fef3c7; background: ${idx % 2 === 0 ? '#ffffff' : '#fffdf9'};">
                      <td style="padding: 10px 10px; font-weight: 700; color: #0f172a; font-family: Consolas, monospace;">
                        ${item.code}
                        <div style="font-size: 10.5px; color: #64748b; font-family: sans-serif; font-weight: normal; margin-top: 2px;">${item.pax} Pax</div>
                      </td>
                      <td style="padding: 10px 10px; color: #334155;">
                        <strong style="color: #0f172a;">${item.destination}</strong>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.productDetails}</div>
                      </td>
                      <td style="padding: 10px 10px; color: #0f172a; font-weight: 600;">
                        ${item.customerName}
                      </td>
                      <td style="padding: 10px 10px; color: #0284c7; font-weight: 600;">
                        ${item.handlingStaff}
                      </td>
                      <td style="padding: 10px 10px; font-family: Consolas, monospace; color: #0f172a; font-weight: 700;">
                        ${item.departureDate}
                      </td>
                      <td style="padding: 10px 10px;">
                        <span style="background: #fef2f2; color: #991b1b; font-weight: 800; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; border: 1px solid #f87171; display: inline-block;">
                          ⚠️ Belum Di-Invoice
                        </span>
                        <div style="font-size: 10.5px; color: #b45309; margin-top: 3px; font-weight: 600;">${item.milestone}</div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${renderEmailFooter({ recipient: targetRecipient, channelName: 'Jalur 2 — Administrasi & Keuangan', appUrl })}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 3. DOCUMENT & VISA EMAIL TEMPLATE (Biometric Appointments & In-Progress Visas)
 */
export const buildDocumentEmailHtml = ({ appointmentDocItems = [], pendingDocItems = [], targetRecipient = '', appUrl = '' }) => {
  const kpis = [
    { label: 'Janji Temu Visa', value: appointmentDocItems.length, textColor: '#6d28d9', bgColor: '#f5f3ff', borderColor: '#ddd6fe' },
    { label: 'Dokumen In-Progress', value: pendingDocItems.length, textColor: '#4338ca', bgColor: '#eef2ff', borderColor: '#c7d2fe' },
    { label: 'Total Monitoring', value: appointmentDocItems.length + pendingDocItems.length, textColor: '#0f172a', bgColor: '#f8fafc', borderColor: '#e2e8f0' }
  ];

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelOps Dokumen &amp; Visa</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 780px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06); border: 1px solid #c7d2fe;">
        
        ${renderEmailHeader({
          categoryTitle: 'TravelOps Dokumen &amp; Visa',
          categorySubtitle: 'Monitoring Berkas Dalam Proses &amp; Reminder Janji Temu Biometrik',
          icon: '🛂',
          badgeText: `${appointmentDocItems.length + pendingDocItems.length} Dokumen Dipantau`,
          accentColor: '#6366f1'
        })}

        <div style="padding: 26px 28px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 1.55;">
            Halo <strong>Tim Dokumen &amp; Visa Operations</strong>, berikut ringkasan status <strong>seluruh dokumen yang masih dalam proses</strong> serta <strong>jadwal appointment visa (H-3 s/d Hari-H)</strong> per <strong>${getTodayDateFormatted()}</strong>:
          </p>

          ${renderKpiStrip(kpis)}

          <!-- SECTION 1: VISA APPOINTMENTS -->
          ${appointmentDocItems.length > 0 ? `
            <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-bottom: 1px solid #c4b5fd; padding-bottom: 10px;">
                <tr>
                  <td valign="middle">
                    <h3 style="margin: 0; color: #4c1d95; font-size: 15.5px; font-weight: 800;">
                      1. Jadwal Appointment Visa &amp; Biometrik (${appointmentDocItems.length} Janji Temu)
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6d28d9;">
                      Janji Temu / Wawancara Kedutaan (milestone H-3 s/d Hari-H). Mohon briefing tamu &amp; persiapkan paspor serta berkas asli.
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: #7c3aed; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                      VISA APPOINTMENT
                    </span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd6fe;">
                <thead>
                  <tr style="background: #ede9fe; color: #4c1d95; text-align: left;">
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Nama Tamu &amp; Kontak</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Tipe &amp; Negara</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Jadwal Appointment</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Lokasi Janji Temu</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">PIC Staff</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointmentDocItems.map((item, idx) => {
                    const isToday = item.diff === 0;
                    const isH1 = item.diff === 1;
                    const pillBg = isToday ? '#fee2e2' : isH1 ? '#ffedd5' : '#ede9fe';
                    const pillColor = isToday ? '#b91c1c' : isH1 ? '#c2410c' : '#5b21b6';
                    const pillBorder = isToday ? '#f87171' : isH1 ? '#fb923c' : '#c4b5fd';

                    return `
                      <tr style="border-bottom: 1px solid #ede9fe; background: ${idx % 2 === 0 ? '#ffffff' : '#faf9ff'};">
                        <td style="padding: 10px 10px; font-weight: 700; color: #0f172a;">
                          👤 ${item.guestName}
                          <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">
                            📞 ${item.phoneNumber}
                            ${item.bookingRef && item.bookingRef !== '-' ? ` &bull; <span style="font-family: Consolas, monospace;">${item.bookingRef}</span>` : ''}
                          </div>
                        </td>
                        <td style="padding: 10px 10px; color: #334155;">
                          <strong style="color: #0f172a;">${item.country}</strong>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                            ${item.docType}
                            ${item.processType && item.processType !== 'Normal' ? ` &bull; <span style="color: #e11d48; font-weight: 700;">${item.processType}</span>` : ''}
                          </div>
                        </td>
                        <td style="padding: 10px 10px;">
                          <div style="font-family: Consolas, monospace; color: #4338ca; font-weight: 700; font-size: 12.5px;">
                            📅 ${item.appointmentDate}
                          </div>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                            ⏰ ${item.appointmentTime !== '-' ? item.appointmentTime : 'Waktu Belum Diset'}
                          </div>
                        </td>
                        <td style="padding: 10px 10px; color: #334155;">
                          📍 <strong>${item.appointmentLocation}</strong>
                        </td>
                        <td style="padding: 10px 10px; color: #4f46e5; font-weight: 600;">
                          ${item.staff}
                        </td>
                        <td style="padding: 10px 10px;">
                          <span style="display: inline-block; background: ${pillBg}; color: ${pillColor}; border: 1px solid ${pillBorder}; font-weight: 800; padding: 4px 8px; border-radius: 5px; font-size: 10.5px; white-space: nowrap;">
                            ${item.milestoneLabel}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- SECTION 2: IN-PROGRESS DOCUMENTS -->
          ${pendingDocItems.length > 0 ? `
            <div style="background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-bottom: 1px solid #a5b4fc; padding-bottom: 10px;">
                <tr>
                  <td valign="middle">
                    <h3 style="margin: 0; color: #312e81; font-size: 15.5px; font-weight: 800;">
                      2. Dokumen Masih Dalam Proses / Belum Selesai (${pendingDocItems.length} Dokumen)
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #4338ca;">
                      Seluruh dokumen aktif yang belum delivered. Urgensi dipantau berdasarkan Target Tanggal Estimasi Selesai yang diinput oleh staff.
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                      IN-PROGRESS MONITOR
                    </span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #c7d2fe;">
                <thead>
                  <tr style="background: #e0e7ff; color: #312e81; text-align: left;">
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Nama Tamu &amp; Kontak</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Tipe &amp; Negara</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Tgl Terima &amp; Logistik</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Target Selesai Staff</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">PIC Staff</th>
                    <th style="padding: 10px 10px; font-weight: 700; font-size: 11px;">Urgensi</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingDocItems.map((item, idx) => {
                    const isOverdue = item.urgencyLevel === 'overdue';
                    const isToday = item.urgencyLevel === 'today';
                    const isWarn = item.urgencyLevel === 'warning' || item.urgencyLevel === 'unassigned';
                    const urgencyBg = isOverdue ? '#fee2e2' : isToday ? '#ffedd5' : isWarn ? '#fef3c7' : '#ecfdf5';
                    const urgencyColor = isOverdue ? '#b91c1c' : isToday ? '#c2410c' : isWarn ? '#b45309' : '#047857';
                    const urgencyBorder = isOverdue ? '#f87171' : isToday ? '#fb923c' : isWarn ? '#fcd34d' : '#86efac';

                    return `
                      <tr style="border-bottom: 1px solid #e0e7ff; background: ${idx % 2 === 0 ? '#ffffff' : '#f8f9ff'};">
                        <td style="padding: 10px 10px; font-weight: 700; color: #0f172a;">
                          👤 ${item.guestName}
                          <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">
                            📞 ${item.phoneNumber}
                            ${item.bookingRef && item.bookingRef !== '-' ? ` &bull; <span style="font-family: Consolas, monospace;">${item.bookingRef}</span>` : ''}
                          </div>
                        </td>
                        <td style="padding: 10px 10px; color: #334155;">
                          <strong style="color: #0f172a;">${item.country}</strong>
                          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                            ${item.docType}
                            ${item.processType && item.processType !== 'Normal' ? ` &bull; <span style="color: #e11d48; font-weight: 700;">${item.processType}</span>` : ''}
                          </div>
                        </td>
                        <td style="padding: 10px 10px;">
                          <div style="font-family: Consolas, monospace; color: #334155; font-size: 11.5px;">📥 ${item.receiveDate}</div>
                          <span style="display: inline-block; margin-top: 4px; font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${item.shippingStatus === 'Sent' ? '#fef3c7' : item.shippingStatus === 'Returned' ? '#fee2e2' : '#e0e7ff'}; color: ${item.shippingStatus === 'Sent' ? '#b45309' : item.shippingStatus === 'Returned' ? '#b91c1c' : '#3730a3'};">
                            📦 ${item.shippingStatus}
                          </span>
                        </td>
                        <td style="padding: 10px 10px;">
                          ${item.estimatedDone ? `
                            <div style="font-family: Consolas, monospace; color: #312e81; font-weight: 700; font-size: 12px;">
                              🎯 ${item.estimatedDone}
                            </div>
                          ` : `
                            <div style="color: #d97706; font-size: 11px; font-weight: 700;">
                              ⚠️ Belum Diinput
                            </div>
                          `}
                        </td>
                        <td style="padding: 10px 10px; color: #4f46e5; font-weight: 600;">
                          ${item.staff}
                        </td>
                        <td style="padding: 10px 10px;">
                          <span style="display: inline-block; background: ${urgencyBg}; color: ${urgencyColor}; border: 1px solid ${urgencyBorder}; font-weight: 800; padding: 4px 8px; border-radius: 5px; font-size: 10px; white-space: nowrap;">
                            ${item.statusLabel}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${renderEmailFooter({ recipient: targetRecipient, channelName: 'Jalur 3 — Dokumen & Visa Operasional', appUrl })}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 4. TEST VERIFICATION EMAIL TEMPLATE (SMTP Server Diagnostic)
 */
export const buildTestVerificationEmailHtml = ({ host, port, senderName, userEmail, recipient, appUrl = '' }) => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelOps SMTP Verification</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0;">
        
        ${renderEmailHeader({
          categoryTitle: 'Verifikasi Server SMTP TravelOps',
          categorySubtitle: 'Konfirmasi Koneksi & Pengiriman Email Berhasil',
          icon: '⚡',
          badgeText: 'Koneksi Terverifikasi',
          accentColor: '#10b981'
        })}

        <div style="padding: 26px 28px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 18px 0; line-height: 1.55;">
            Halo Administrator, email uji coba ini mengonfirmasi bahwa <strong>konfigurasi server SMTP di platform TravelOps Anda telah terhubung aktif</strong> dan siap melakukan pengiriman otomatis 3 Jalur Reminder harian.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; margin: 20px 0;">
            <tr>
              <td style="padding: 16px 18px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 700;">Host Server:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-family: Consolas, monospace;">${host}:${port}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 700;">Nama Pengirim:</td>
                    <td style="padding: 6px 0; color: #0f172a;">${senderName} &lt;${userEmail}&gt;</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 700;">Tujuan Email:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${recipient}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 700;">Status Layanan:</td>
                    <td style="padding: 6px 0;">
                      <span style="display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 800; padding: 3px 10px; border-radius: 4px; font-size: 11px;">
                        &check; Aktif &amp; Terverifikasi
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${renderEmailFooter({ recipient, channelName: 'Uji Coba Pengaturan SMTP', appUrl })}
        </div>
      </div>
    </body>
    </html>
  `;
};

