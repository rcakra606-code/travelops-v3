import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, User, Copy, Check, 
  RefreshCw, Minimize2, Maximize2, MessageSquare, 
  HelpCircle, Globe, Plane, ShieldCheck, ChevronDown
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const QUICK_PROMPTS = [
  { icon: '💬', label: 'Draft WA Reminder Pelunasan', prompt: 'Tolong buatkan template pesan WhatsApp yang ramah dan profesional kepada tamu untuk reminder pelunasan tour group yang jatuh tempo H-7 keberangkatan.' },
  { icon: '🛂', label: 'Cek Syarat Visa & Paspor', prompt: 'Apa saja syarat umum pengajuan visa turis (misal Schengen / Jepang / Korea) untuk pemegang paspor Indonesia dan ketentuan masa berlaku paspor?' },
  { icon: '🗺️', label: 'Ide Rute Tour 5H4M', prompt: 'Buatkan usulan itinerary ringkas 5 Hari 4 Malam untuk paket tour keluarga ke Jepang (Tokyo - Fuji - Yokohama) lengkap dengan highlight per hari.' },
  { icon: '🔌', label: 'Info Cuaca & Colokan Listrik', prompt: 'Berikan informasi tipe colokan listrik, voltase, dan tips musim/pakaian yang harus disiapkan untuk turis yang berkunjung ke Eropa Barat di musim gugur.' }
];

const SYSTEM_PROMPT = `
You are the "TravelOps AI Operations Copilot", a high-level travel consultant and operations assistant built inside the TravelOps travel management platform.
Your job is to assist travel consultants, tour operators, and reservation staff with:
1. Destination Intelligence: Visa requirements, electrical plugs, weather, currency, emergency contacts, local customs, and halal/dietary guidance.
2. Communication: Drafting professional WhatsApp messages, customer booking confirmations, tour leader briefing notes, and payment reminder emails.
3. Operations Planning: Day-by-day tour itinerary suggestions, POI visit estimates, flight connection advisories, and hotel location recommendations.
4. Professionalism: Be concise, highly accurate, polite, and structure your responses with clean bullet points and emojis. If the user writes in Indonesian, respond in natural, professional Indonesian.
`;

const AiCopilot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya **TravelOps AI Copilot** yang terhubung langsung dengan Google Gemini. Ada yang bisa saya bantu terkait informasi destinasi, syarat visa, rute tour, atau pembuatan pesan untuk klien hari ini?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // Hide on public tracker if desired (or keep accessible)
  if (location.pathname.startsWith('/track')) {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert('VITE_GEMINI_API_KEY is not configured in .env');
      return;
    }

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
      // Build conversation payload for Gemini
      const conversationContents = [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${text}` }]
        }
      ];

      // Try gemini-2.5-flash then fallback to gemini-2.0-flash
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let responseText = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: conversationContents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) break;
          }
        } catch (mErr) {
          console.warn(`Copilot model ${model} attempt failed:`, mErr.message);
        }
      }

      if (!responseText) {
        throw new Error('Tidak menerima balasan dari AI. Silakan coba beberapa saat lagi.');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Percakapan telah dibersihkan. Silakan ajukan pertanyaan atau pilih template prompt di bawah ini!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
            bottom: '24px',
            right: '24px',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.45)',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.875rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Open TravelOps AI Copilot"
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <span>AI Copilot</span>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#4ade80', boxShadow: '0 0 8px #4ade80'
          }} />
        </button>
      )}

      {/* CHAT WINDOW MODAL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isExpanded ? '20px' : '24px',
          right: isExpanded ? '20px' : '24px',
          width: isExpanded ? 'calc(100vw - 40px)' : '420px',
          maxWidth: isExpanded ? '900px' : '92vw',
          height: isExpanded ? 'calc(100vh - 40px)' : '580px',
          maxHeight: '88vh',
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
            padding: '0.85rem 1rem',
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
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>TravelOps Copilot</span>
                  <span style={{
                    fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.2)', color: 'var(--primary)', fontWeight: '700'
                  }}>
                    Gemini Live
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Intelligent Travel Assistant
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
                title="Close"
              >
                <X size={18} />
              </button>
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
                    maxWidth: isExpanded ? '75%' : '88%',
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
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      position: 'relative'
                    }}>
                      {msg.content}

                      {isAssistant && (
                        <div style={{
                          display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', gap: '0.35rem'
                        }}>
                          <button
                            onClick={() => handleCopyText(msg.content, idx)}
                            style={{
                              background: 'transparent', border: 'none', color: 'var(--text-muted)',
                              cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '3px',
                              fontSize: '0.675rem'
                            }}
                            title="Copy response"
                          >
                            {copiedIndex === idx ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{copiedIndex === idx ? 'Copied' : 'Salin'}</span>
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
                <span>TravelOps AI sedang menyusun jawaban...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.15)'
          }}>
            {QUICK_PROMPTS.map((qp, idx) => (
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
                placeholder="Tanyakan apa saja seputar visa, tour, pesan klien..."
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
              <span>Ditenagai Google Gemini 2.5 Flash</span>
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
