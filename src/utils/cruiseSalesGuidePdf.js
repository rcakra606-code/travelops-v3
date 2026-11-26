/**
 * Branded Client Handout PDF Generators for Cruise Sales Guide.
 * Uses dynamic imports of jsPDF + jspdf-autotable to keep initial bundle lean.
 */
import {
  COMPLIANCE_RULES,
  EXCLUDED_ITEMS,
  INCLUDED_ITEMS,
  PRE_SAILING_TIMELINE
} from './cruiseSalesGuideData.js';
import { formatBudgetTier, formatGratuityBadge } from './cruiseSalesGuideHelpers.js';

const cleanPdf = (val) =>
  String(val || '')
    .replace(/\*\*/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

let cachedLogoDataUrl = null;

async function loadBrandLogo() {
  if (cachedLogoDataUrl !== null) return cachedLogoDataUrl;
  try {
    const res = await fetch('/dwidayatour-logo.png');
    if (!res.ok) {
      cachedLogoDataUrl = '';
      return '';
    }
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
    cachedLogoDataUrl = dataUrl;
    return dataUrl;
  } catch {
    cachedLogoDataUrl = '';
    return '';
  }
}

function drawBrandedHeader(doc, logoDataUrl, title, subtitle, consultantName) {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Deep ocean header banner
  doc.setFillColor(12, 36, 74);
  doc.rect(0, 0, pageWidth, 26, 'F');

  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 5, 36, 15, 2, 2, 'F');
      doc.addImage(logoDataUrl, 'PNG', 14, 6.5, 32, 12);
    } catch {
      // Ignore logo render errors
    }
  }

  const textStartX = logoDataUrl ? 54 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(cleanPdf(title), textStartX, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(cleanPdf(subtitle), textStartX, 18.5);

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const metaRight = consultantName ? `Konsultan: ${cleanPdf(consultantName)}  |  ${dateStr}` : dateStr;
  doc.setFontSize(7.5);
  doc.text(metaRight, pageWidth - 14, 23, { align: 'right' });
  doc.setTextColor(15, 23, 42);
}

function drawFooters(doc) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Informasi bersifat indikatif & dapat berubah mengikuti ketentuan terbaru dari pihak kapal pesiar. Hubungi Travel Consultant Dwidayatour untuk konfirmasi final.',
      14,
      pageHeight - 8
    );
    doc.text(`Hal. ${p}/${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

export async function generateShipInfoPdf(guide, consultantName = '') {
  if (!guide) return;
  const [{ jsPDF }, { default: autoTable }, logoDataUrl] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadBrandLogo()
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBrandedHeader(
    doc,
    logoDataUrl,
    `Lembar Informasi Kapal Pesiar: ${guide.brandName}`,
    guide.tagline || 'Panduan Umum & Fasilitas Pelayaran untuk Calon Peserta',
    consultantName
  );

  let y = 33;
  // Summary grid
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Profil & Ketentuan Utama', 'Detail']],
    body: [
      ['Segmen & Kelas Budget', `${cleanPdf(guide.segment)} (${formatBudgetTier(guide.budgetTier)})`],
      ['Homeport Utama', cleanPdf((guide.homeports || []).join(', ') || '-')],
      ['Durasi Populer', cleanPdf((guide.typicalDurations || []).join(' / ') || '-')],
      ['Status Halal / Dietary', `${cleanPdf(guide.halalStatus)} — ${cleanPdf(guide.halalNotes)}`],
      ['Estimasi Gratuity / Tipping', `${cleanPdf(formatGratuityBadge(guide))} — ${cleanPdf(guide.gratuityNotes)}`],
      ['Kategori VIP / Suite Club', cleanPdf(guide.vipClubName || '-')],
      [
        'Batas Usia & Kehamilan',
        `Bayi minimal ${guide.minInfantMonths} bulan | Ibu hamil maks. ${guide.pregnancyMaxWeeks} minggu | Usia pemesan min. ${guide.minBookingAge} tahun`
      ],
      ['Dress Code', cleanPdf(guide.dressCode || 'Smart Casual')]
    ],
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.6, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52, fillColor: [248, 250, 252] } }
  });

  y = (doc.lastAutoTable?.finalY || y) + 6;

  if ((guide.featuredShips || []).length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'striped',
      head: [['Nama Kapal', 'Class', 'Tonase / Kapasitas', 'Tahun', 'Wilayah & Daya Tarik']],
      body: guide.featuredShips.map((s) => [
        cleanPdf(s.name),
        cleanPdf(s.shipClass || '-'),
        cleanPdf([s.tonnage, s.capacity].filter(Boolean).join(' / ') || '-'),
        cleanPdf(s.yearBuilt || '-'),
        cleanPdf([s.deployment, s.highlight].filter(Boolean).join(' — ') || '-')
      ]),
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.4, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 34 },
        1: { cellWidth: 26 },
        2: { cellWidth: 30 },
        3: { cellWidth: 18 }
      }
    });
    y = (doc.lastAutoTable?.finalY || y) + 6;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Keunggulan & Pengalaman Utama', 'Umumnya Sudah Termasuk dalam Harga']],
    body: [
      [
        (guide.highlights || []).map((h) => `• ${cleanPdf(h)}`).join('\n') || '-',
        (guide.inclusions || []).map((inc) => `• ${cleanPdf(inc)}`).join('\n') || '-'
      ]
    ],
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8.2, cellPadding: 3, valign: 'top' }
  });

  drawFooters(doc);
  const safeSlug = cleanPdf(guide.brandName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`Info-Cruise-${safeSlug}.pdf`);
}

export async function generateIndividualShipPdf(guide, ship, consultantName = '') {
  if (!guide || !ship) return;
  const [{ jsPDF }, { default: autoTable }, logoDataUrl] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadBrandLogo()
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBrandedHeader(
    doc,
    logoDataUrl,
    `Spesifikasi Kapal Pesiar: ${ship.name}`,
    `${guide.brandName}${ship.shipClass ? ` · ${ship.shipClass}` : ''} · ${guide.segment}`,
    consultantName
  );

  autoTable(doc, {
    startY: 33,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Profil & Spesifikasi Kapal', 'Detail']],
    body: [
      ['Nama Kapal & Brand', `${cleanPdf(ship.name)} — ${cleanPdf(guide.brandName)}`],
      ['Kelas Kapal (Class)', cleanPdf(ship.shipClass || '-')],
      ['Tonase & Kapasitas Tamu', cleanPdf([ship.tonnage, ship.capacity].filter(Boolean).join(' · ') || '-')],
      ['Jumlah Deck & Tahun Operasi', cleanPdf([ship.decks ? `${ship.decks} deck` : '', ship.yearBuilt].filter(Boolean).join(' · ') || '-')],
      ['Wilayah / Homeport Utama', cleanPdf(ship.deployment || (guide.homeports || []).join(', ') || '-')],
      ['Paling Cocok Untuk', cleanPdf(ship.bestFor || guide.segment)],
      ['Daya Tarik & Fasilitas Ikonik', cleanPdf(ship.highlight || '-')],
      ['Status Halal / Dietary', `${cleanPdf(guide.halalStatus)} — ${cleanPdf(guide.halalNotes)}`],
      ['Estimasi Gratuity / Tipping', `${cleanPdf(formatGratuityBadge(guide))} — ${cleanPdf(guide.gratuityNotes)}`],
      ['Layanan VIP / Suite Club', cleanPdf(guide.vipClubName || '-')],
      [
        'Ketentuan Penumpang',
        `Paspor min. 6 bulan | Bayi min. ${guide.minInfantMonths} bln | Ibu hamil maks. ${guide.pregnancyMaxWeeks} mgg | Pemesan min. ${guide.minBookingAge} thn`
      ],
      ['Dress Code', cleanPdf(guide.dressCode || 'Smart Casual')]
    ],
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 54, fillColor: [248, 250, 252] } }
  });

  const y = (doc.lastAutoTable?.finalY || 160) + 6;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    head: [['Keunggulan Brand', 'Umumnya Sudah Termasuk di Harga Dasar']],
    body: [
      [
        (guide.highlights || []).map((h) => `• ${cleanPdf(h)}`).join('\n') || '-',
        (guide.inclusions || []).map((inc) => `• ${cleanPdf(inc)}`).join('\n') || '-'
      ]
    ],
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8.1, cellPadding: 2.8, valign: 'top' }
  });

  drawFooters(doc);
  const safeSlug = cleanPdf(ship.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`Spesifikasi-Kapal-${safeSlug}.pdf`);
}

export async function generateCruiseComparisonPdf(guides = [], consultantName = '') {
  const valid = (guides || []).filter(Boolean);
  if (valid.length === 0) return;

  const [{ jsPDF }, { default: autoTable }, logoDataUrl] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadBrandLogo()
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  drawBrandedHeader(
    doc,
    logoDataUrl,
    'Perbandingan Pilihan Kapal Pesiar',
    valid.map((g) => g.brandName).join('  vs  '),
    consultantName
  );

  const rows = [
    ['Segmen & Budget', ...valid.map((g) => `${cleanPdf(g.segment)} (${formatBudgetTier(g.budgetTier)})`)],
    ['Kapal Unggulan', ...valid.map((g) => cleanPdf((g.featuredShips || []).map((s) => s.name).join(', ') || '-'))],
    ['Homeport Utama', ...valid.map((g) => cleanPdf((g.homeports || []).join(', ') || '-'))],
    ['Durasi Populer', ...valid.map((g) => cleanPdf((g.typicalDurations || []).join(' / ') || '-'))],
    ['Status Halal', ...valid.map((g) => `${cleanPdf(g.halalStatus)}\n${cleanPdf(g.halalNotes)}`)],
    ['Estimasi Gratuity', ...valid.map((g) => `${cleanPdf(formatGratuityBadge(g))}\n${cleanPdf(g.gratuityNotes)}`)],
    ['Layanan VIP / Suite', ...valid.map((g) => cleanPdf(g.vipClubName || '-'))],
    [
      'Aturan Bayi & Hamil',
      ...valid.map((g) => `Bayi min. ${g.minInfantMonths} bln | Hamil maks. ${g.pregnancyMaxWeeks} mgg | Min. usia pemesan ${g.minBookingAge} thn`)
    ],
    ['Keunggulan Utama', ...valid.map((g) => (g.highlights || []).slice(0, 3).map((h) => `• ${cleanPdf(h)}`).join('\n'))],
    ['Dress Code', ...valid.map((g) => cleanPdf(g.dressCode || 'Smart Casual'))]
  ];

  autoTable(doc, {
    startY: 32,
    margin: { left: 12, right: 12, bottom: 16 },
    theme: 'grid',
    head: [['Aspek Perbandingan', ...valid.map((g) => cleanPdf(g.brandName))]],
    body: rows,
    headStyles: { fillColor: [12, 36, 74], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2.6, valign: 'top', textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, fillColor: [241, 245, 249] } }
  });

  drawFooters(doc);
  doc.save('Perbandingan-Kapal-Pesiar-Dwidayatour.pdf');
}

export async function generatePreSailingChecklistPdf(consultantName = '') {
  const [{ jsPDF }, { default: autoTable }, logoDataUrl] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadBrandLogo()
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBrandedHeader(
    doc,
    logoDataUrl,
    'Panduan & Checklist Wajib Sebelum Berlayar',
    'Dokumen Perjalanan, Ketentuan Penumpang, Biaya Termasuk/Tambahan & Timeline Check-In',
    consultantName
  );

  autoTable(doc, {
    startY: 32,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Aturan Wajib Penumpang', 'Penjelasan']],
    body: COMPLIANCE_RULES.map((r) => [cleanPdf(r.title), cleanPdf(r.summary)]),
    headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 8.8 },
    styles: { fontSize: 8.1, cellPadding: 2.4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 54, fillColor: [254, 242, 242] } }
  });

  let y = (doc.lastAutoTable?.finalY || 110) + 6;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['Waktu', 'Tahapan Persiapan', 'Hal yang Perlu Dilakukan']],
    body: PRE_SAILING_TIMELINE.map((t) => [cleanPdf(t.timing), cleanPdf(t.title), cleanPdf(t.detail)]),
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontSize: 8.8 },
    styles: { fontSize: 8.1, cellPadding: 2.3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { fontStyle: 'bold', cellWidth: 46 } }
  });

  y = (doc.lastAutoTable?.finalY || y) + 6;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    head: [['Umumnya Sudah Termasuk', 'Biaya Tambahan / Opsional']],
    body: [
      [
        INCLUDED_ITEMS.map((i) => `• ${cleanPdf(i.title)}: ${cleanPdf(i.detail)}`).join('\n'),
        EXCLUDED_ITEMS.map((e) => `• ${cleanPdf(e.title)}: ${cleanPdf(e.detail)}`).join('\n')
      ]
    ],
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 7.9, cellPadding: 2.8, valign: 'top' }
  });

  drawFooters(doc);
  doc.save('Checklist-Persiapan-Cruise-Dwidayatour.pdf');
}
