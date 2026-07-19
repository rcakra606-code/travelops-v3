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
import AutoLogout from './components/AutoLogout';
import ReminderEngine from './components/ReminderEngine';
import ProtectedRoute from './components/ProtectedRoute';
import ForcePasswordChange from './components/ForcePasswordChange';

// Lazy loaded pages for performance optimization
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const ToursManager = lazy(() => import('./pages/ToursManager'));
const UserManager = lazy(() => import('./pages/UserManager'));
const Profile = lazy(() => import('./pages/Profile'));
const SalesInput = lazy(() => import('./pages/SalesInput'));
const Documents = lazy(() => import('./pages/Documents'));
const Telecom = lazy(() => import('./pages/Telecom'));
const Cruise = lazy(() => import('./pages/Cruise'));
const Hotel = lazy(() => import('./pages/Hotel'));
const Overtime = lazy(() => import('./pages/Overtime'));
const Productivity = lazy(() => import('./pages/Productivity'));
const Corporate = lazy(() => import('./pages/Corporate'));
const Cashout = lazy(() => import('./pages/Cashout'));
const StaffPerformance = lazy(() => import('./pages/StaffPerformance'));


// Loading fallback UI
const LoadingFallback = () => (
  <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#3b82f6' }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(59, 130, 246, 0.2)', borderLeftColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
  </div>
);

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
                                  <Suspense fallback={<LoadingFallback />}>
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
                                      <Route path="/staff-performance" element={<ProtectedRoute><StaffPerformance /></ProtectedRoute>} />
                                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                      <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                  </Suspense>
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
