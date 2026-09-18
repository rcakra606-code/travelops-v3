import React from 'react';
import './mobile.css';
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

import AnimatedRoutes from './components/AnimatedRoutes';
import CommandPalette from './components/CommandPalette';
import AiCopilot from './components/AiCopilot';
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
  return (
    <AppProviders>
      <AutoLogout>
        <ForcePasswordChange />
        <Router>
          <ReminderEngine />
          <CommandPalette />
          <AiCopilot />
          <ToastNotification />
          <AnimatedRoutes />
        </Router>
      </AutoLogout>
    </AppProviders>
  );
}

export default App;
