import './mobile.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TourProvider } from './context/TourContext';
import { UserProvider } from './context/UserContext';
import { SalesProvider } from './context/SalesContext';
import { DocumentProvider } from './context/DocumentContext';
import { TelecomProvider } from './context/TelecomContext';
import { CruiseProvider } from './context/CruiseContext';
import { HotelProvider } from './context/HotelContext';
import { OvertimeProvider } from './context/OvertimeContext';
import { ProductivityProvider } from './context/ProductivityContext';
import { CorporateProvider } from './context/CorporateContext';
import { KnowledgeProvider } from './context/KnowledgeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import AutoLogout from './components/AutoLogout';
import ReminderEngine from './components/ReminderEngine';
import ForcePasswordChange from './components/ForcePasswordChange';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

import AnimatedRoutes from './components/AnimatedRoutes';
import CommandPalette from './components/CommandPalette';
import AiCopilot from './components/AiCopilot';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { ToastProvider } from './context/ToastContext';
import ToastNotification from './components/ToastNotification';

// Utility helper to compose multiple React context providers cleanly into a thoroughly stacked pipeline
const composeProviders = (...providers) => {
  return ({ children }) =>
    providers.reduceRight(
      (childTree, Provider) => <Provider>{childTree}</Provider>,
      children
    );
};

// Base application providers needed globally (theme, settings, auth, toast notifications)
const BaseProviders = composeProviders(
  ThemeProvider,
  SettingsProvider,
  AuthProvider,
  ToastProvider
);

// Operational Domain Data Providers
const DataProviderStack = composeProviders(
  UserProvider,
  TourProvider,
  KnowledgeProvider,
  SalesProvider,
  DocumentProvider,
  TelecomProvider,
  CruiseProvider,
  HotelProvider,
  OvertimeProvider,
  ProductivityProvider,
  CorporateProvider
);

// Session-aware wrapper: dynamic key remounts domain providers immediately upon login or logout
const AuthenticatedDataProviders = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg-dark, #0b1120)',
          color: 'var(--primary, #00d4ff)',
          fontSize: '1rem',
          fontFamily: 'inherit'
        }}
        aria-busy="true"
        aria-label="Memuat aplikasi TravelOps..."
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              border: '3px solid rgba(0, 212, 255, 0.2)',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '0.04em' }}>
            Memuat TravelOps...
          </span>
        </div>
      </div>
    );
  }

  return (
    <DataProviderStack key={user?.id || 'guest'}>
      {children}
    </DataProviderStack>
  );
};

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input or textarea
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setShowShortcuts(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-keyboard-shortcuts', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-keyboard-shortcuts', handleCustomOpen);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <BaseProviders>
        <Router>
          <AutoLogout>
            <ForcePasswordChange />
            <AuthenticatedDataProviders>
              <ReminderEngine />
              <CommandPalette />
              <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
              <AiCopilot />
              <ToastNotification />
              <AnimatedRoutes />
            </AuthenticatedDataProviders>
          </AutoLogout>
        </Router>
      </BaseProviders>
    </GlobalErrorBoundary>
  );
}

export default App;
