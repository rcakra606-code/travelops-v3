import './mobile.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// Stacked Data & Domain Providers
const AppProviders = composeProviders(
  ThemeProvider,
  SettingsProvider,
  AuthProvider,
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
  CorporateProvider,
  ToastProvider
);

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
      <AppProviders>
        <AutoLogout>
          <ForcePasswordChange />
          <Router>
            <ReminderEngine />
            <CommandPalette />
            <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            <AiCopilot />
            <ToastNotification />
            <AnimatedRoutes />
          </Router>
        </AutoLogout>
      </AppProviders>
    </GlobalErrorBoundary>
  );
}

export default App;
