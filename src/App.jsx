import React from 'react';
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
import AutoLogout from './components/AutoLogout';
import ReminderEngine from './components/ReminderEngine';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ToursManager from './pages/ToursManager';
import UserManager from './pages/UserManager';
import Profile from './pages/Profile';
import SalesInput from './pages/SalesInput';
import Documents from './pages/Documents';
import Telecom from './pages/Telecom';
import Cruise from './pages/Cruise';
import Hotel from './pages/Hotel';
import Overtime from './pages/Overtime';
import Productivity from './pages/Productivity';
import Corporate from './pages/Corporate';
import Cashout from './pages/Cashout';
import ForcePasswordChange from './components/ForcePasswordChange';

function App() {
  return (
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
                                  <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                    <Route path="/tours" element={<ProtectedRoute><ToursManager /></ProtectedRoute>} />
                                    <Route path="/users" element={<ProtectedRoute><UserManager /></ProtectedRoute>} />
                                    <Route path="/sales" element={<ProtectedRoute><SalesInput /></ProtectedRoute>} />
                                    <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                                    <Route path="/telecom" element={<ProtectedRoute><Telecom /></ProtectedRoute>} />
                                    <Route path="/cruise" element={<ProtectedRoute><Cruise /></ProtectedRoute>} />
                                    <Route path="/hotel" element={<ProtectedRoute><Hotel /></ProtectedRoute>} />
                                    <Route path="/overtime" element={<ProtectedRoute><Overtime /></ProtectedRoute>} />
                                    <Route path="/productivity" element={<ProtectedRoute><Productivity /></ProtectedRoute>} />
                                    <Route path="/corporate" element={<ProtectedRoute><Corporate /></ProtectedRoute>} />
                                    <Route path="/cashout" element={<ProtectedRoute><Cashout /></ProtectedRoute>} />
                                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                  </Routes>
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
  );
}

export default App;
