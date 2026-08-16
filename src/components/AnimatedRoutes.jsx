import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import PageWrapper from './PageWrapper';

// Lazy loaded pages
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const ToursManager = lazy(() => import('../pages/ToursManager'));
const UserManager = lazy(() => import('../pages/UserManager'));
const Profile = lazy(() => import('../pages/Profile'));
const SalesInput = lazy(() => import('../pages/SalesInput'));
const Documents = lazy(() => import('../pages/Documents'));
const Telecom = lazy(() => import('../pages/Telecom'));
const Cruise = lazy(() => import('../pages/Cruise'));
const Hotel = lazy(() => import('../pages/Hotel'));
const Overtime = lazy(() => import('../pages/Overtime'));
const Productivity = lazy(() => import('../pages/Productivity'));
const Corporate = lazy(() => import('../pages/Corporate'));
const Cashout = lazy(() => import('../pages/Cashout'));
const StaffPerformance = lazy(() => import('../pages/StaffPerformance'));
const KnowledgeBase = lazy(() => import('../pages/KnowledgeBase'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark)', color: 'var(--primary)' }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(6, 182, 212, 0.2)', borderLeftColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/tours" element={<ProtectedRoute><PageWrapper><ToursManager /></PageWrapper></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><PageWrapper><KnowledgeBase /></PageWrapper></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><PageWrapper><UserManager /></PageWrapper></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><PageWrapper><SalesInput /></PageWrapper></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><PageWrapper><Documents /></PageWrapper></ProtectedRoute>} />
          <Route path="/telecom" element={<ProtectedRoute><PageWrapper><Telecom /></PageWrapper></ProtectedRoute>} />
          <Route path="/cruise" element={<ProtectedRoute><PageWrapper><Cruise /></PageWrapper></ProtectedRoute>} />
          <Route path="/hotel" element={<ProtectedRoute><PageWrapper><Hotel /></PageWrapper></ProtectedRoute>} />
          <Route path="/overtime" element={<ProtectedRoute><PageWrapper><Overtime /></PageWrapper></ProtectedRoute>} />
          <Route path="/productivity" element={<ProtectedRoute><PageWrapper><Productivity /></PageWrapper></ProtectedRoute>} />
          <Route path="/corporate" element={<ProtectedRoute><PageWrapper><Corporate /></PageWrapper></ProtectedRoute>} />
          <Route path="/cashout" element={<ProtectedRoute><PageWrapper><Cashout /></PageWrapper></ProtectedRoute>} />
          <Route path="/staff-performance" element={<ProtectedRoute><PageWrapper><StaffPerformance /></PageWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

export default AnimatedRoutes;
