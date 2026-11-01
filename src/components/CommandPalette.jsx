import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Map, Users, DollarSign, FileText, Phone, Settings, Anchor, Briefcase, Clock, Target, Building, Activity, ArrowRight, Compass, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTours } from '../context/TourContext';
import { useCorporate } from '../context/CorporateContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';

const staticCommands = [
  { id: 'dashboard', name: 'Home Overview', icon: <Home size={18} />, path: '/' },
  { id: 'calendar', name: 'Trip Calendar', icon: <Calendar size={18} />, path: '/calendar' },
  { id: 'ai-copilot', name: 'TravelOps AI Copilot (Live Assistant)', icon: <Sparkles size={18} />, isAi: true },
  { id: 'tours', name: 'Tours & Trips', icon: <Map size={18} />, path: '/tours' },
  { id: 'documents', name: 'Documents & Visa', icon: <FileText size={18} />, path: '/documents' },
  { id: 'hotel', name: 'Hotel Stays', icon: <Briefcase size={18} />, path: '/hotel' },
  { id: 'cruise', name: 'Cruises', icon: <Anchor size={18} />, path: '/cruise' },
  { id: 'telecom', name: 'WiFi & SIM Rental', icon: <Phone size={18} />, path: '/telecom' },
  { id: 'knowledge', name: 'Travel Guides & Tips', icon: <Compass size={18} />, path: '/knowledge' },
  { id: 'corporate', name: 'Corporate Accounts', icon: <Building size={18} />, path: '/corporate' },
  { id: 'sales', name: 'Sales & Revenue', icon: <DollarSign size={18} />, path: '/sales' },
  { id: 'productivity', name: 'Team Goals', icon: <Target size={18} />, path: '/productivity' },
  { id: 'overtime', name: 'Overtime Logs', icon: <Clock size={18} />, path: '/overtime' },
  { id: 'staff', name: 'Team Insights', icon: <Activity size={18} />, path: '/staff-performance' },
  { id: 'users', name: 'Team & Access', icon: <Users size={18} />, path: '/users' },
  { id: 'settings', name: 'Workspace Settings', icon: <Settings size={18} />, path: '/settings' },
  { id: 'tracker', name: 'Guest Status Tracker (Public Portal)', icon: <Compass size={18} />, path: '/track' },
];

const CommandPalette = () => {
  const { user } = useAuth();
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
      if (!user) return;
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

    // Cruises
    const filteredCruises = (cruises || []).filter(c =>
      c.shipName?.toLowerCase().includes(q) ||
      c.cruiseBrand?.toLowerCase().includes(q) ||
      c.bookingRef?.toLowerCase().includes(q)
    ).map(c => ({
      id: `cruise-${c.id}`,
      name: `${c.shipName || c.cruiseBrand || 'Cruise'} - ${c.bookingRef || 'No Ref'}`,
      icon: <Anchor size={18} />,
      path: '/cruise',
      type: 'Cruise Booking'
    }));

    // Combine and limit results
    if (!q) return staticCommands.map(cmd => ({ ...cmd, type: 'Page' }));
    
    return [...filteredPages, ...filteredTours, ...filteredCorporate, ...filteredHotels, ...filteredCruises].slice(0, 15);
  };

  const results = getSearchResults();

  const executeCommand = (cmd) => {
    if (cmd.isAi) {
      window.dispatchEvent(new CustomEvent('open-ai-copilot'));
    } else if (cmd.path) {
      navigate(cmd.path);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
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
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Quick jump to pages, tours, hotels, cruises, or clients..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none'
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
                onClick={() => executeCommand(cmd)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                  cursor: 'pointer', borderRadius: '8px',
                  background: index === selectedIndex ? 'rgba(0, 168, 255, 0.14)' : 'transparent',
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
