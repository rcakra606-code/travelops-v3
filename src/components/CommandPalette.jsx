import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Home, Map, Users, DollarSign, FileText, Phone, Settings, Anchor,
  Briefcase, Clock, Target, Building, Activity, ArrowRight, Compass, Calendar,
  Sparkles, PlusCircle, Sun, Moon, ClipboardList, PieChart, Plane
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTours } from '../context/TourContext';
import { useCorporate } from '../context/CorporateContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { formatCurrency } from '../utils/currency';

const staticCommands = [
  { id: 'dashboard', name: 'Beranda Operasional', subtitle: 'Dashboard KPI & Action Desk', icon: <Home size={18} />, path: '/' },
  { id: 'executive-bi', name: 'Executive BI & AI Analyst', subtitle: 'Analitik Operasional, Finansial, Bisnis & AI Insights', icon: <PieChart size={18} />, path: '/executive-bi' },
  { id: 'calendar', name: 'Kalender Perjalanan', subtitle: 'Jadwal keberangkatan & visa lintas modul', icon: <Calendar size={18} />, path: '/calendar' },
  { id: 'ai-copilot', name: 'TravelOps AI Copilot', subtitle: 'Asisten operasional & pembuat template WA', icon: <Sparkles size={18} />, isAi: true },
  { id: 'tours', name: 'Tour & Perjalanan', subtitle: 'Series, Incentive & Consortium Tours', icon: <Map size={18} />, path: '/tours' },
  { id: 'tour-registration-form', name: 'Form Pendaftaran Tour', subtitle: 'Buat PDF Formulir Pendaftaran resmi Dwidayatour (2 hal.)', icon: <ClipboardList size={18} />, path: '/tour-registration-form' },
  { id: 'flight-booking-form', name: 'Form Pemesanan Tiket Pesawat', subtitle: 'AI Parser Screenshot/PDF/GDS + Transit, H-1 Dinihari & PDF/WA', icon: <Plane size={18} />, path: '/flight-booking-form' },
  { id: 'documents', name: 'Visa & Dokumen', subtitle: 'Intake paspor, biometrik & resi AWB', icon: <FileText size={18} />, path: '/documents' },
  { id: 'hotel', name: 'Reservasi Hotel', subtitle: 'Database voucher & rooming hotel', icon: <Briefcase size={18} />, path: '/hotel' },
  { id: 'cruise', name: 'Pelayaran Cruise', subtitle: 'Manajemen kabin & jadwal kapal pesiar', icon: <Anchor size={18} />, path: '/cruise' },
  { id: 'cruise-guide', name: 'Panduan Penjualan Cruise', subtitle: 'Info kapal pesiar, bandingkan brand, kabin, gratuity & FAQ WA/PDF', icon: <Anchor size={18} />, path: '/cruise-guide' },
  { id: 'telecom', name: 'SIM, eSIM & WiFi', subtitle: 'Sewa modem & konektivitas perjalanan', icon: <Phone size={18} />, path: '/telecom' },
  { id: 'knowledge', name: 'Panduan & Knowledge Base', subtitle: 'SOP destinasi, visa & tips lapangan', icon: <Compass size={18} />, path: '/knowledge' },
  { id: 'corporate', name: 'Klien Korporasi (B2B)', subtitle: 'Akun corporate & matriks kontrak', icon: <Building size={18} />, path: '/corporate' },
  { id: 'sales', name: 'Penjualan & Target', subtitle: 'Input omset & pencapaian kuota', icon: <DollarSign size={18} />, path: '/sales' },
  { id: 'productivity', name: 'Produktivitas & P&L', subtitle: 'Rincian profitabilitas & tugas harian', icon: <Target size={18} />, path: '/productivity' },
  { id: 'overtime', name: 'Log Lembur Tim', subtitle: 'Pengajuan & persetujuan lembur staf', icon: <Clock size={18} />, path: '/overtime' },
  { id: 'staff', name: 'Performa Konsultan', subtitle: 'Scorecard 360° & kontribusi tim', icon: <Activity size={18} />, path: '/staff-performance' },
  { id: 'users', name: 'Tim & Hak Akses', subtitle: 'Kelola akun & peran staf', icon: <Users size={18} />, path: '/users', adminOnly: true },
  { id: 'settings', name: 'Pengaturan Sistem', subtitle: 'Konfigurasi workspace & log audit', icon: <Settings size={18} />, path: '/settings', adminOnly: true },
  { id: 'tracker', name: 'Portal Status Tamu (Public)', subtitle: 'Halaman lacak status untuk pelanggan', icon: <Compass size={18} />, path: '/track' }
];

const quickCreateCommands = [
  { id: 'new-tour', name: 'Buat Booking Tour Baru', subtitle: 'Buka wizard tambah tour (Series / Incentive / Consortium)', icon: <PlusCircle size={18} />, path: '/tours', navState: { openNew: true }, type: 'Aksi Cepat' },
  { id: 'new-tour-reg-form', name: 'Buat Formulir Pendaftaran Tour (PDF)', subtitle: 'Generate PDF 2 halaman untuk dikirim ke customer (Non-DB)', icon: <ClipboardList size={18} />, path: '/tour-registration-form', type: 'Aksi Cepat' },
  { id: 'new-flight-booking-form', name: 'Buat Form Pemesanan Tiket Pesawat (AI)', subtitle: 'Parse screenshot/PDF/GDS otomatis ke format konfirmasi WA & PDF', icon: <Plane size={18} />, path: '/flight-booking-form', type: 'Aksi Cepat' },
  { id: 'new-doc', name: 'Buat Pengajuan Visa & Dokumen', subtitle: 'Input paspor / visa / biometrik baru', icon: <PlusCircle size={18} />, path: '/documents', navState: { openNew: true }, type: 'Aksi Cepat' },
  { id: 'new-hotel', name: 'Buat Reservasi Hotel Baru', subtitle: 'Catat booking kamar & check-in hotel', icon: <PlusCircle size={18} />, path: '/hotel', navState: { openNew: true }, type: 'Aksi Cepat' },
  { id: 'new-cruise', name: 'Buat Booking Cruise Baru', subtitle: 'Catat reservasi kabin kapal pesiar', icon: <PlusCircle size={18} />, path: '/cruise', navState: { openNew: true }, type: 'Aksi Cepat' },
  { id: 'new-telecom', name: 'Buat Order SIM / eSIM / WiFi', subtitle: 'Input pesanan konektivitas tamu', icon: <PlusCircle size={18} />, path: '/telecom', navState: { openNew: true }, type: 'Aksi Cepat' }
];

const CommandPalette = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load Data for Deep-Link Omni-Search
  const { tours } = useTours();
  const { corporateAccounts } = useCorporate();
  const { cruises } = useCruises();
  const { hotels } = useHotels();
  const { documents } = useDocuments();
  const { telecoms } = useTelecoms();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!user) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleOpenCustom = () => {
      if (!user) return;
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenCustom);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenCustom);
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isAdmin = user?.role === 'Admin' || user?.email === 'admin@travelops.com';

    const availablePages = staticCommands
      .filter((cmd) => !cmd.adminOnly || isAdmin)
      .map((cmd) => ({ ...cmd, type: 'Halaman' }));

    const themeCmd = {
      id: 'toggle-theme',
      name: theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)',
      subtitle: 'Ubah tampilan warna workspace secara instan',
      icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />,
      isThemeToggle: true,
      type: 'Aksi Cepat'
    };

    if (!q) {
      return [...quickCreateCommands.slice(0, 3), themeCmd, ...availablePages];
    }

    const filteredQuickActions = [...quickCreateCommands, themeCmd].filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(q) ||
        (cmd.subtitle || '').toLowerCase().includes(q)
    );

    const filteredPages = availablePages.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(q) ||
        (cmd.subtitle || '').toLowerCase().includes(q)
    );

    // Tours (includes booking code, tour code, country, invoice, staff, AND passenger names!)
    const filteredTours = (tours || [])
      .filter((t) => {
        const paxNames = Array.isArray(t.paxInfo)
          ? t.paxInfo.map((p) => p?.name || '').join(' ').toLowerCase()
          : '';
        return (
          t.bookingCode?.toLowerCase().includes(q) ||
          t.tourCode?.toLowerCase().includes(q) ||
          t.country?.toLowerCase().includes(q) ||
          t.invoiceNumber?.toLowerCase().includes(q) ||
          t.financials?.invoiceNumber?.toLowerCase().includes(q) ||
          t.staffName?.toLowerCase().includes(q) ||
          paxNames.includes(q)
        );
      })
      .slice(0, 6)
      .map((t) => {
        const leadPax = Array.isArray(t.paxInfo) && t.paxInfo[0]?.name ? t.paxInfo[0].name : '';
        const sisa = Number(t.sisaPelunasan ?? t.financials?.sisaPelunasan ?? 0);
        return {
          id: `tour-${t.id}`,
          name: `${t.bookingCode || t.tourCode || 'Tour'} — ${t.country || 'Destinasi'}`,
          subtitle: [
            leadPax ? `Tamu: ${leadPax}` : null,
            t.departureDate ? `Berangkat: ${t.departureDate}` : null,
            sisa > 0 ? `Sisa: ${formatCurrency(sisa)}` : 'Lunas'
          ]
            .filter(Boolean)
            .join(' • '),
          icon: <Map size={18} />,
          path: '/tours',
          navState: { openTab: 'database', openId: t.id, search: t.bookingCode || t.tourCode || '' },
          type: 'Tour'
        };
      });

    // Documents & Visa (applicant name, country, docType, bookingCode, tourCode, awbNumber)
    const filteredDocs = (documents || [])
      .filter(
        (d) =>
          d.guestName?.toLowerCase().includes(q) ||
          d.country?.toLowerCase().includes(q) ||
          d.docType?.toLowerCase().includes(q) ||
          d.bookingCode?.toLowerCase().includes(q) ||
          d.tourCode?.toLowerCase().includes(q) ||
          d.awbNumber?.toLowerCase().includes(q) ||
          d.invoiceNumber?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((d) => ({
        id: `doc-${d.id}`,
        name: `${d.guestName || 'Pemohon'} — ${d.docType || 'Dokumen'} ${d.country || ''}`.trim(),
        subtitle: [
          d.shippingStatus || 'Proses',
          d.appointmentDate ? `Janji Visa: ${d.appointmentDate}` : null,
          d.awbNumber ? `AWB: ${d.awbNumber}` : null
        ]
          .filter(Boolean)
          .join(' • '),
        icon: <FileText size={18} />,
        path: '/documents',
        navState: { openId: d.id, search: d.guestName || '' },
        type: 'Visa & Dokumen'
      }));

    // Hotels (hotel name, guest name, booking code, city)
    const filteredHotels = (hotels || [])
      .filter(
        (h) =>
          h.hotelName?.toLowerCase().includes(q) ||
          h.guestName?.toLowerCase().includes(q) ||
          h.bookingCode?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((h) => ({
        id: `hotel-${h.id}`,
        name: `${h.hotelName || 'Hotel'} — ${h.bookingCode || 'No Code'}`,
        subtitle: [
          h.guestName ? `Tamu: ${h.guestName}` : null,
          h.checkIn ? `Check-In: ${h.checkIn}` : null,
          h.status || null
        ]
          .filter(Boolean)
          .join(' • '),
        icon: <Briefcase size={18} />,
        path: '/hotel',
        navState: { openId: h.id, search: h.bookingCode || h.hotelName || '' },
        type: 'Hotel'
      }));

    // Cruises (ship, brand, guest, bookingRef)
    const filteredCruises = (cruises || [])
      .filter(
        (c) =>
          c.shipName?.toLowerCase().includes(q) ||
          c.cruiseBrand?.toLowerCase().includes(q) ||
          c.guestName?.toLowerCase().includes(q) ||
          c.bookingRef?.toLowerCase().includes(q) ||
          c.route?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: `cruise-${c.id}`,
        name: `${c.shipName || c.cruiseBrand || 'Cruise'} — ${c.bookingRef || 'No Ref'}`,
        subtitle: [
          c.guestName ? `Tamu: ${c.guestName}` : null,
          c.sailingStart ? `Sailing: ${c.sailingStart}` : null,
          c.status || null
        ]
          .filter(Boolean)
          .join(' • '),
        icon: <Anchor size={18} />,
        path: '/cruise',
        navState: { openId: c.id, search: c.bookingRef || c.shipName || '' },
        type: 'Cruise'
      }));

    // Telecom (namaTamu, negara, jenisProduk, kodeBooking)
    const filteredTelecoms = (telecoms || [])
      .filter(
        (tc) =>
          (tc.namaTamu || tc.guestName || '').toLowerCase().includes(q) ||
          (tc.negara || tc.country || '').toLowerCase().includes(q) ||
          (tc.jenisProduk || tc.productType || '').toLowerCase().includes(q) ||
          (tc.kodeBooking || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((tc) => ({
        id: `telecom-${tc.id}`,
        name: `${tc.namaTamu || tc.guestName || 'Order SIM'} — ${tc.jenisProduk || 'SIM/eSIM'}`,
        subtitle: [
          tc.negara || tc.country || null,
          tc.tanggalMulai ? `Mulai: ${tc.tanggalMulai}` : null,
          tc.status || null
        ]
          .filter(Boolean)
          .join(' • '),
        icon: <Phone size={18} />,
        path: '/telecom',
        navState: { openId: tc.id, search: tc.namaTamu || tc.kodeBooking || '' },
        type: 'SIM & WiFi'
      }));

    // Corporate
    const filteredCorporate = (corporateAccounts || [])
      .filter(
        (c) =>
          c.companyName?.toLowerCase().includes(q) ||
          c.accountCode?.toLowerCase().includes(q) ||
          c.picName?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((c) => ({
        id: `corp-${c.id}`,
        name: `${c.companyName} (${c.accountCode || 'B2B'})`,
        subtitle: c.picName ? `PIC Klien: ${c.picName}` : 'Akun Korporasi',
        icon: <Building size={18} />,
        path: '/corporate',
        navState: { openId: c.id },
        type: 'Corporate'
      }));

    return [
      ...filteredTours,
      ...filteredDocs,
      ...filteredHotels,
      ...filteredCruises,
      ...filteredTelecoms,
      ...filteredCorporate,
      ...filteredQuickActions,
      ...filteredPages
    ].slice(0, 18);
  }, [query, user, theme, tours, documents, hotels, cruises, telecoms, corporateAccounts]);

  const executeCommand = (cmd) => {
    if (cmd.isAi) {
      window.dispatchEvent(new CustomEvent('open-ai-copilot'));
    } else if (cmd.isThemeToggle) {
      toggleTheme();
    } else if (cmd.path) {
      navigate(cmd.path, {
        state: {
          ...(cmd.navState || {}),
          _ts: Date.now()
        }
      });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      executeCommand(results[selectedIndex]);
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '9vh 1.25rem 2rem 1.25rem'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="card glass fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian Cepat dan Navigasi"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.15rem',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <Search size={20} style={{ color: 'var(--primary)', marginRight: '0.85rem', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari nama tamu, kode booking, visa, AWB, hotel, cruise, atau menu..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '0.22rem 0.5rem',
              background: 'var(--border)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}
          >
            ESC
          </div>
        </div>

        <div style={{ maxHeight: '480px', overflowY: 'auto', padding: '0.5rem' }}>
          {results.length === 0 ? (
            <div style={{ padding: '2.75rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={30} style={{ opacity: 0.45, margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Coba cari dengan nama tamu, kode booking, nomor invoice, negara tujuan, atau nama menu.
              </div>
            </div>
          ) : (
            results.map((cmd, index) => (
              <div
                key={cmd.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => executeCommand(cmd)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.68rem 0.9rem',
                  cursor: 'pointer',
                  borderRadius: '9px',
                  background: index === selectedIndex ? 'rgba(0, 168, 255, 0.14)' : 'transparent',
                  color: 'var(--text-main)',
                  borderLeft: index === selectedIndex ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.1s'
                }}
              >
                <div
                  style={{
                    marginRight: '0.85rem',
                    color: index === selectedIndex ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  {cmd.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {cmd.name}
                  </div>
                  {cmd.subtitle && (
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '1px'
                      }}
                    >
                      {cmd.subtitle}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.6rem' }}>
                  {cmd.type && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background:
                          cmd.type === 'Aksi Cepat'
                            ? 'rgba(16, 185, 129, 0.14)'
                            : cmd.type === 'Halaman'
                              ? 'var(--bg-surface)'
                              : 'rgba(56, 189, 248, 0.14)',
                        color:
                          cmd.type === 'Aksi Cepat'
                            ? '#10b981'
                            : cmd.type === 'Halaman'
                              ? 'var(--text-muted)'
                              : 'var(--primary)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {cmd.type}
                    </span>
                  )}
                  {index === selectedIndex && <ArrowRight size={15} color="var(--primary)" />}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: '0.6rem 1.15rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span>Klik item untuk langsung membuka detail record (Deep-Link)</span>
          <span>
            <kbd className="kbd-badge">↑↓</kbd> Navigasi · <kbd className="kbd-badge">Enter</kbd> Buka ·{' '}
            <kbd className="kbd-badge">Ctrl K</kbd> Tutup
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
