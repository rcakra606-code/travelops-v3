import React, { Suspense, lazy } from 'react';
import './mobile.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { CashoutProvider } from './context/CashoutContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import AutoLogout from './components/AutoLogout';
import ReminderEngine from './components/ReminderEngine';
import ProtectedRoute from './components/ProtectedRoute';
import ForcePasswordChange from './components/ForcePasswordChange';

import AnimatedRoutes from './components/AnimatedRoutes';
import CommandPalette from './components/CommandPalette';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <AutoLogout>
            <ForcePasswordChange />
            <UserProvider>
              <TourProvider>
                <SalesProvider>
                  <DocumentProvider>
                    <TelecomProvider>
                      <CruiseProvider>
                        <HotelProvider>
                          <OvertimeProvider>
                            <ProductivityProvider>
                              <CorporateProvider>
                                <CashoutProvider>
                                  <Router>
                                    <ReminderEngine />
                                    <CommandPalette />
                                    <AnimatedRoutes />
                                  </Router>
                                </CashoutProvider>
                              </CorporateProvider>
                            </ProductivityProvider>
                          </OvertimeProvider>
                        </HotelProvider>
                      </CruiseProvider>
                    </TelecomProvider>
                  </DocumentProvider>
                </SalesProvider>
              </TourProvider>
            </UserProvider>
          </AutoLogout>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
