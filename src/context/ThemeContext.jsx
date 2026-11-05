import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const ACCENT_PRESETS = [
  { id: 'neon-blue', name: 'Neon Sky Blue', color: '#00a8ff' },
  { id: 'cyan', name: 'Electric Cyan', color: '#06b6d4' },
  { id: 'indigo', name: 'Royal Indigo', color: '#6366f1' },
  { id: 'emerald', name: 'Emerald Glow', color: '#10b981' },
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b' },
  { id: 'rose', name: 'Crimson Rose', color: '#f43f5e' },
  { id: 'purple', name: 'Neon Purple', color: '#a855f7' },
  { id: 'sage', name: 'Soft Sage', color: '#416b52' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('travelops_theme');
    if (saved) return saved;
    return 'light';
  });

  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('travelops_accent_v3') || 'neon-blue';
  });

  useEffect(() => {
    localStorage.setItem('travelops_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('travelops_accent_v3', accent);
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('travelops_theme_override')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('travelops_theme_override', 'true');
      return newTheme;
    });
  };

  const changeAccent = (newAccent) => {
    setAccent(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, changeAccent, ACCENT_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
