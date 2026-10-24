import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, Copy, Check, 
  RefreshCw, Minimize2, Maximize2, MessageCircle,
  Database, MapPin, Compass
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Module context detector
const getModuleInfo = (pathname) => {
  const p = (pathname || '').toLowerCase();
  if (p.includes('/tour')) {
    return { name: 'Tour Management', icon: '🗺️', key: 'tours' };
  }
  if (p.includes('/document')) {
    return { name: 'Dokumen & Visa Desk', icon: '🛂', key: 'documents' };
  }
  if (p.includes('/hotel')) {
    return { name: 'Hotel Reservations', icon: '🏨', key: 'hotels' };
  }
  if (p.includes('/cruise')) {
    return { name: 'Cruise Bookings', icon: '🚢', key: 'cruises' };
  }
  if (p.includes('/corporate')) {
    return { name: 'Corporate & MICE', icon: '💼', key: 'corporate' };
  }
  if (p.includes('/knowledge') || p.includes('/destination')) {
    return { name: 'Knowledge Base', icon: '📚', key: 'kb' };
  }
  if (p.includes('/productivity') || p.includes('/task')) {
    return { name: 'Productivity & Tasks', icon: '⚡', key: 'tasks' };
  }
  if (p.includes('/sales')) {
    return { name: 'Sales & Targets', icon: '📈', key: 'sales' };
  }
  return { name: 'Operasional Travel', icon: '✈️', key: 'default' };
};

// Contextual Quick Prompts Map
const CONTEXT_PROMPTS = {
  tours: [
    { icon: '🗺️', label: 'Draft Itinerary 7D6N Jepang', prompt: 'Buatkan usulan itinerary ringkas 7 Hari 6 Malam ke Jepang (Tokyo - Mt Fuji - Kyoto - Osaka) lengkap dengan highlight per hari, estimasi durasi kunjungan objek, dan rekomendasi area hotel.' },
    { icon: '📊', label: 'Hitung Margin & FOC Tour', prompt: 'Jelaskan cara perhitungan harga jual paket tour group dengan rasio 15+1 FOC (Free of Charge tour leader), single supplement, dan target margin 18%.' },
    { icon: '🚌', label: 'Briefing Sheet Tour Leader', prompt: 'Buatkan template checklist briefing sheet Tour Leader di bus hari pertama: meeting point bandara, jam istirahat rest area, aturan toilet di bus, dan tips barang berharga.' },
    { icon: '⏰', label: 'Pacing & Batas Jam Driver', prompt: 'Bagaimana standar pacing waktu tempuh perjalanan bus (coach travel) yang aman dan nyaman untuk tamu group, serta aturan batas jam kerja driver bus di Eropa?' }
  ],
  documents: [
    { icon: '🛂', label: 'Syarat Visa Schengen WNI', prompt: 'Apa saja checklist dokumen persyaratan pengajuan visa turis Schengen terbaru untuk pemegang paspor Indonesia (rekening koran, asuransi 30.000 EUR, surat sponsor, tiket, booking hotel)?' },
    { icon: '⏳', label: 'Aturan Paspor 6 Bulan', prompt: 'Jelaskan ketentuan internasional mengenai masa berlaku paspor minimal 6 bulan saat tanggal keberangkatan, aturan halaman kosong (blank pages), dan risiko jika paspor cacat/terkelupas.' },
    { icon: '✉️', label: 'Template WA Berkas Kurang', prompt: 'Buatkan template pesan WhatsApp sopan dan mendesak kepada tamu yang belum melengkapi pasfoto dan mutasi rekening untuk proses visa H-21 keberangkatan.' },
    { icon: '🇯🇵', label: 'Ketentuan Visa Jepang / e-Visa', prompt: 'Jelaskan perbedaan pengajuan visa waiver untuk e-Paspor Indonesia vs visa reguler (stiker) untuk paspor biasa ke Jepang beserta masa tinggal dan masa berlakunya.' }
  ],
  hotels: [
    { icon: '🏨', label: 'Draft Email Negosiasi Hotel', prompt: 'Tolong buatkan draft email resmi dalam bahasa Inggris kepada sales manager hotel untuk meminta penawaran Group Booking 15 Twin Rooms, include breakfast buffet & complimentary room voucher.' },
    { icon: '🛏️', label: 'Format Standar Rooming List', prompt: 'Bagaimana format standar rooming list internasional yang harus diserahkan ke hotel (Pax Name, Room Type, Twin/Double, Bed Configuration, Special Request, Arrival/Departure Time)?' },
    { icon: '📍', label: 'Kriteria Lokasi Hotel Grup', prompt: 'Apa saja kriteria pemilihan hotel ideal untuk grup tour di kota besar (kemudahan akses bus besar, jarak ke metro/stasiun, minimarket di sekitar, dan regulasi city tax)?' }
  ],
  cruises: [
    { icon: '🚢', label: 'Biaya Wajib & Port Taxes', prompt: 'Jelaskan komponen biaya wajib pada paket cruise selain harga kamar (Port Charges, Government Taxes, Gratuity/Tips harian, dan Fuel Surcharge).' },
    { icon: '🎫', label: 'Kategori Kabin Cruise', prompt: 'Jelaskan perbedaan keuntungan dan tips rekomendasi kamar Interior Stateroom, Oceanview, Balcony, dan Suite untuk paket liburan kapal pesiar.' },
    { icon: '🌊', label: 'Info Shore Excursion', prompt: 'Buatkan panduan dan tips penting bagi tamu saat mengikuti Shore Excursion (tur turun di pelabuhan) agar tidak tertinggal jadwal all-aboard kapal pesiar.' }
  ],
  corporate: [
    { icon: '💼', label: 'Draft Proposal Gathering B2B', prompt: 'Buatkan kerangka proposal penawaran paket Corporate Outing / Gathering 3 Hari 2 Malam untuk 80 peserta karyawan, mencakup teambuilding, gala dinner, dan estimasi budget.' },
    { icon: '📑', label: 'Format Quotation All-In', prompt: 'Bagaimana menyusun format quotation B2B corporate yang profesional: item include vs exclude, breakdown per pax, terms of payment, dan validitas penawaran?' },
    { icon: '💳', label: 'Aturan Term of Payment (TOP)', prompt: 'Berikan saran klausul Term of Payment (TOP) dan kebijakan cancellation refund yang aman bagi travel agency saat menangani kontrak tour korporasi skala besar.' }
  ],
  kb: [
    { icon: '🔌', label: 'Info Colokan & Adaptor', prompt: 'Tolong berikan ringkasan tipe colokan listrik (A, C, G, dll), voltase standar, dan apakah perlu universal adaptor untuk destinasi wisata populer (Jepang, Eropa, UK, Swiss, Korsel).' },
    { icon: '💶', label: 'Aturan Mata Uang & Kartu', prompt: 'Bagaimana tren pembayaran untuk turis di destinasi utama (apakah cashless/kartu debit-kredit seperti di Eropa/Korsel, atau masih membutuhkan banyak uang tunai/yen di Jepang)?' },
    { icon: '🍜', label: 'Panduan Makanan Halal', prompt: 'Berikan tips praktis bagi tour leader dan tamu muslim untuk mencari makanan halal atau no-pork/no-lard saat berwisata di Jepang, Korea, dan Eropa.' }
  ],
  default: [
    { icon: '💬', label: 'Draft WA Reminder Pelunasan', prompt: 'Tolong buatkan template pesan WhatsApp yang ramah, jelas, dan profesional kepada tamu untuk reminder pelunasan tour group yang jatuh tempo H-7 keberangkatan.' },
    { icon: '🛂', label: 'Cek Syarat Visa & Paspor', prompt: 'Apa saja syarat umum pengajuan visa turis (misal Schengen / Jepang / Korea) untuk pemegang paspor Indonesia dan ketentuan masa berlaku paspor?' },
    { icon: '🗺️', label: 'Ide Rute Tour 5H4M', prompt: 'Buatkan usulan itinerary ringkas 5 Hari 4 Malam untuk paket tour keluarga ke Jepang (Tokyo - Fuji - Yokohama) lengkap dengan highlight per hari.' },
    { icon: '🎒', label: 'Tips Packing Musim Dingin', prompt: 'Buatkan daftar perlengkapan dan pakaian penting (thermal layer, heattech, sarung tangan waterproof, lip balm) yang wajib dibawa turis untuk tour musim dingin / salju.' }
  ]
};

// WhatsApp Text Formatter Converter
const formatForWhatsApp = (text) => {
  if (!text) return '';
  let wa = text;
  // Convert markdown bold **text** to *text*
  wa = wa.replace(/\*\*(.*?)\*\*/g, '*$1*');
  // Convert markdown headers ### Heading to *HEADING*
  wa = wa.replace(/^###\s*(.*$)/gim, '\n*$1*');
  wa = wa.replace(/^##\s*(.*$)/gim, '\n*$1*');
  wa = wa.replace(/^#\s*(.*$)/gim, '\n*$1*');
  // Convert bullet points - or * to •
  wa = wa.replace(/^[\*\-]\s+/gm, '• ');
  // Clean up excess blank lines
  wa = wa.replace(/\n{3,}/g, '\n\n');
  return wa.trim();
};

// Inline Markdown Parser
const parseInlineFormatting = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} style={{ fontWeight: '700', color: 'inherit' }}>
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} style={{
          background: 'rgba(255, 255, 255, 0.12)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.78rem'
        }}>
          {part.substring(1, part.length - 1)}
        </code>
      );
    }
    return part;
  });
};

// Formatted Message Body Renderer
const renderFormattedContent = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} style={{ height: '0.4rem' }} />);
      return;
    }

    // Headings
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <div key={`h-${i}`} style={{
          fontWeight: '700',
          fontSize: '0.85rem',
          color: 'var(--primary, #06b6d4)',
          marginTop: '0.45rem',
          marginBottom: '0.15rem'
        }}>
          {parseInlineFormatting(headingText)}
        </div>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.substring(2).trim();
      elements.push(
        <div key={`b-${i}`} style={{
          display: 'flex',
          gap: '0.45rem',
          alignItems: 'flex-start',
          margin: '0.12rem 0',
          paddingLeft: '0.2rem'
        }}>
          <span style={{ color: 'var(--primary, #06b6d4)', fontSize: '0.8rem', lineHeight: '1.4' }}>•</span>
          <span style={{ flex: 1, lineHeight: '1.45' }}>{parseInlineFormatting(bulletContent)}</span>
        </div>
      );
      return;
    }

    // Numbered lists (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} style={{
          display: 'flex',
          gap: '0.45rem',
          alignItems: 'flex-start',
          margin: '0.12rem 0',
          paddingLeft: '0.2rem'
        }}>
          <span style={{ fontWeight: '700', color: 'var(--primary, #06b6d4)', fontSize: '0.75rem', minWidth: '18px' }}>
            {numMatch[1]}.
          </span>
          <span style={{ flex: 1, lineHeight: '1.45' }}>{parseInlineFormatting(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} style={{ margin: '0.18rem 0', lineHeight: '1.45' }}>
        {parseInlineFormatting(trimmed)}
      </p>
    );
  });

  return elements;
};

const AiCopilot = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedWaIndex, setCopiedWaIndex] = useState(null);

  const activeModule = getModuleInfo(location.pathname);
  const quickPrompts = CONTEXT_PROMPTS[activeModule.key] || CONTEXT_PROMPTS.default;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya **TravelOps AI Copilot** yang terhubung langsung dengan Google Gemini dan Database Operasional Travel. Ada yang bisa saya bantu terkait destinasi, syarat visa, rute tour, atau pembuatan pesan klien?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grounded: true
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Personalize welcome message once user profile is loaded
  useEffect(() => {
    if (user?.name) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant') {
          return [{
            role: 'assistant',
            content: `Halo ${user.name}! Saya **TravelOps AI Copilot** yang terhubung dengan Google Gemini & Database TravelOps. Saat ini Anda sedang di modul **${activeModule.name}**. Ada yang bisa saya bantu hari ini?`,
            timestamp: prev[0].timestamp,
            grounded: true
          }];
        }
        return prev;
      });
    }
  }, [user?.name, activeModule.name]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Support global trigger event to open AI copilot
  useEffect(() => {
    const handleOpenAi = () => setIsOpen(true);
    window.addEventListener('open-ai-copilot', handleOpenAi);
    return () => window.removeEventListener('open-ai-copilot', handleOpenAi);
  }, []);

  // AI Feature is strictly available ONLY to authenticated/signed-in users
  if (authLoading || !user || location.pathname.startsWith('/track') || location.pathname === '/login') {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    if (!user) {
      alert('Sesi Anda tidak valid. Silakan login untuk menggunakan AI Copilot.');
      return;
    }

    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      let responseText = null;
      let isGrounded = false;

      // Primary Strategy: Call secure backend proxy endpoint with full module context
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const backendRes = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          currentPath: location.pathname,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          userContext: {
            name: user?.name,
            email: user?.email,
            role: user?.role
          }
        })
      });

      if (!backendRes.ok) {
        const errData = await backendRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${backendRes.status}) saat menghubungi Copilot AI.`);
      }

      const backendData = await backendRes.json();
      if (backendData.success && backendData.text) {
        responseText = backendData.text;
        isGrounded = Boolean(backendData.grounded);
      } else {
        throw new Error('Tidak menerima balasan dari AI Copilot.');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          grounded: isGrounded
        }
      ]);
    } catch (err) {
      console.error('Copilot Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Maaf, terjadi kendala koneksi AI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyWhatsApp = (content, index) => {
    const formatted = formatForWhatsApp(content);
    navigator.clipboard.writeText(formatted);
    setCopiedWaIndex(index);
    setTimeout(() => setCopiedWaIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Percakapan telah dibersihkan. Anda sedang di modul **${activeModule.name}**. Silakan ajukan pertanyaan baru atau pilih template quick prompt di bawah ini!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grounded: true
      }
    ]);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.785rem',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          title="Buka TravelOps AI Copilot"
        >
          <Sparkles size={14} />
          <span>AI Copilot</span>
          <span style={{
            fontSize: '0.65rem',
            padding: '1px 5px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            fontWeight: '700'
          }}>
            {activeModule.icon}
          </span>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4ade80'
          }} />
        </button>
      )}

      {/* CHAT WINDOW MODAL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isExpanded ? '20px' : '24px',
          right: isExpanded ? '20px' : '24px',
          width: isExpanded ? 'calc(100vw - 40px)' : '440px',
          maxWidth: isExpanded ? '920px' : '92vw',
          height: isExpanded ? 'calc(100vh - 40px)' : '600px',
          maxHeight: '90vh',
          zIndex: 9995,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
              }}>
                <Sparkles size={17} />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>TravelOps AI Copilot</span>
                  <span style={{
                    fontSize: '0.625rem', padding: '1px 6px', borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.2)', color: 'var(--primary)', fontWeight: '700'
                  }}>
                    Gemini Live
                  </span>
                </div>
                <div style={{ fontSize: '0.685rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{activeModule.icon}</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{activeModule.name}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ color: '#4ade80' }}>RAG Grounded</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                }}
                title={isExpanded ? 'Restore' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          <div style={{
            padding: '0.35rem 0.85rem',
            background: 'rgba(6, 182, 212, 0.08)',
            borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={13} color="var(--primary)" />
              <span>Konteks Halaman: <strong style={{ color: 'var(--text-main)' }}>{activeModule.name}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={11} color="#4ade80" />
              <span style={{ color: 'var(--text-subtle)' }}>Company DB Connected</span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    maxWidth: isExpanded ? '78%' : '90%',
                    alignItems: 'flex-start'
                  }}>
                    {isAssistant && (
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'rgba(6, 182, 212, 0.2)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '2px'
                      }}>
                        <Bot size={15} />
                      </div>
                    )}

                    <div style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                      background: isAssistant ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
                      border: isAssistant ? '1px solid var(--border)' : 'none',
                      color: isAssistant ? 'var(--text-main)' : '#ffffff',
                      fontSize: '0.825rem',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      position: 'relative'
                    }}>
                      {/* Formatted Content */}
                      <div>
                        {renderFormattedContent(msg.content)}
                      </div>

                      {/* Action buttons on Assistant reply */}
                      {isAssistant && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          marginTop: '0.55rem',
                          paddingTop: '0.4rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                          gap: '0.5rem'
                        }}>
                          {/* Salin WA Button */}
                          <button
                            onClick={() => handleCopyWhatsApp(msg.content, idx)}
                            style={{
                              background: 'rgba(37, 211, 102, 0.15)',
                              border: '1px solid rgba(37, 211, 102, 0.3)',
                              color: '#4ade80',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              padding: '2px 7px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.675rem',
                              fontWeight: '600',
                              transition: 'all 0.15s'
                            }}
                            title="Format and copy for WhatsApp chat"
                          >
                            {copiedWaIndex === idx ? (
                              <>
                                <Check size={12} color="#4ade80" />
                                <span>Tersalin WA!</span>
                              </>
                            ) : (
                              <>
                                <MessageCircle size={12} />
                                <span>Salin WA</span>
                              </>
                            )}
                          </button>

                          {/* Standard Copy Button */}
                          <button
                            onClick={() => handleCopyText(msg.content, idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.675rem'
                            }}
                            title="Salin teks lengkap"
                          >
                            {copiedIndex === idx ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{copiedIndex === idx ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '2px',
                    marginRight: isAssistant ? 0 : '4px', marginLeft: isAssistant ? '34px' : 0
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '34px' }}>
                <RefreshCw size={14} className="spin" />
                <span>TravelOps AI sedang menganalisis & menyusun respon...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel (Dynamically customized per module) */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.18)'
          }}>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <span>{qp.icon}</span>
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)'
          }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder={`Tanya seputar ${activeModule.name}, visa, atau pesan klien...`}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: loading || !inputMessage.trim() ? 'rgba(255, 255, 255, 0.08)' : 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={15} />
              </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
              <span>Ditenagai Gemini 2.5 Flash & RAG Database TravelOps</span>
              <button
                onClick={handleClearChat}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.65rem' }}
              >
                Bersihkan chat
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default AiCopilot;
