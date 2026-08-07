import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Map, Users, DollarSign, FileText, Phone, Settings, Anchor, Briefcase, Clock, Target, Building, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { useTours } from '../context/TourContext';
import { useCorporate } from '../context/CorporateContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';

const staticCommands = [
  { id: 'dashboard', name: 'Dashboard', icon: <Home size={18} />, path: '/' },
  { id: 'tours', name: 'Tours Manager', icon: <Map size={18} />, path: '/tours' },
  { id: 'users', name: 'User Manager', icon: <Users size={18} />, path: '/users' },
  { id: 'sales', name: 'Sales Input', icon: <DollarSign size={18} />, path: '/sales' },
  { id: 'documents', name: 'Documents', icon: <FileText size={18} />, path: '/documents' },
  { id: 'telecom', name: 'Telecom & Utilities', icon: <Phone size={18} />, path: '/telecom' },
  { id: 'cruise', name: 'Cruise Manager', icon: <Anchor size={18} />, path: '/cruise' },
  { id: 'hotel', name: 'Hotel Manager', icon: <Briefcase size={18} />, path: '/hotel' },
  { id: 'overtime', name: 'Overtime Logs', icon: <Clock size={18} />, path: '/overtime' },
  { id: 'productivity', name: 'Productivity', icon: <Target size={18} />, path: '/productivity' },
  { id: 'corporate', name: 'Corporate Clients', icon: <Building size={18} />, path: '/corporate' },
  { id: 'cashout', name: 'Cashout System', icon: <CreditCard size={18} />, path: '/cashout' },
  { id: 'staff', name: 'Staff Performance', icon: <Activity size={18} />, path: '/staff-performance' },
  { id: 'settings', name: 'Settings', icon: <Settings size={18} />, path: '/settings' },
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load Data for Omni-Search
  const { tours } = useTours();
  const { corporateAccounts } = useCorporate();
  const { cruises } = useCruises();
  const { hotels } = useHotels();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Aggregate Search Results
  const getSearchResults = () => {
    const q = query.toLowerCase();
    
    // Pages
    const filteredPages = staticCommands.filter((cmd) => cmd.name.toLowerCase().includes(q)).map(cmd => ({ ...cmd, type: 'Page' }));
    
    // Tours
    const filteredTours = (tours || []).filter(t => 
      t.bookingCode?.toLowerCase().includes(q) || 
      t.tourCode?.toLowerCase().includes(q) ||
      t.country?.toLowerCase().includes(q)
    ).map(t => ({
      id: `tour-${t.id}`,
      name: `${t.bookingCode || 'Unknown'} - ${t.country}`,
      icon: <Map size={18} />,
      path: '/tours',
      type: 'Tour Record'
    }));

    // Corporate
    const filteredCorporate = (corporateAccounts || []).filter(c => 
      c.companyName?.toLowerCase().includes(q) || 
      c.accountCode?.toLowerCase().includes(q)
    ).map(c => ({
      id: `corp-${c.id}`,
      name: `${c.companyName} (${c.accountCode})`,
      icon: <Building size={18} />,
      path: '/corporate',
      type: 'Corporate Account'
    }));

    // Hotels
    const filteredHotels = (hotels || []).filter(h => 
      h.hotelName?.toLowerCase().includes(q) || 
      h.bookingCode?.toLowerCase().includes(q)
    ).map(h => ({
      id: `hotel-${h.id}`,
      name: `${h.hotelName} - ${h.bookingCode || 'No Code'}`,
      icon: <Briefcase size={18} />,
      path: '/hotel',
      type: 'Hotel Booking'
    }));

    // Combine and limit results
    if (!q) return staticCommands.map(cmd => ({ ...cmd, type: 'Page' }));
    
    return [...filteredPages, ...filteredTours, ...filteredCorporate, ...filteredHotels].slice(0, 15);
  };

  const results = getSearchResults();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].path);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '10vh'
    }} onClick={() => setIsOpen(false)}>
      <div 
        className="card glass fade-in" 
        style={{
          width: '100%', maxWidth: '650px', 
          background: 'var(--bg-card)', 
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <Search size={22} style={{ color: 'var(--primary)', marginRight: '1rem' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Omni-Search: Pages, Tours, Hotels, Corporate..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: 'var(--text-main)', fontSize: '1.2rem', outline: 'none'
            }}
          />
          <div style={{ 
            fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--border)', 
            borderRadius: '4px', color: 'var(--text-muted)' 
          }}>
            ESC
          </div>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
          {results.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
              <div>No results found for "{query}".</div>
            </div>
          ) : (
            results.map((cmd, index) => (
              <div
                key={cmd.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  navigate(cmd.path);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                  cursor: 'pointer', borderRadius: '8px',
                  background: index === selectedIndex ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: 'var(--text-main)',
                  borderLeft: index === selectedIndex ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.1s'
                }}
              >
                <div style={{ marginRight: '1rem', color: index === selectedIndex ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {cmd.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: index === selectedIndex ? 'var(--text-main)' : 'var(--text-main)' }}>{cmd.name}</div>
                  {cmd.type && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {cmd.type}
                    </div>
                  )}
                </div>
                {index === selectedIndex && <div style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--primary)' }}>Jump <ArrowRight size={12} style={{ verticalAlign: 'middle', marginLeft: '2px' }}/></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
