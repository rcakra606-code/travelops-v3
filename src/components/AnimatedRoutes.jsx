import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PageWrapper from './PageWrapper';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const ToursManager = lazy(() => import('../pages/ToursManager'));
const TourRegistrationForm = lazy(() => import('../pages/TourRegistrationForm'));
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
const StaffPerformance = lazy(() => import('../pages/StaffPerformance'));
const KnowledgeBase = lazy(() => import('../pages/KnowledgeBase'));
const OperationsCalendar = lazy(() => import('../pages/OperationsCalendar'));
const PublicTracker = lazy(() => import('../pages/PublicTracker'));

const LoadingFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}
    aria-busy="true"
    aria-label="Loading workspace..."
  >
    {/* Header Skeleton */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="shimmer-skeleton" style={{ width: '220px', height: '28px' }} />
        <div className="shimmer-skeleton" style={{ width: '320px', height: '14px' }} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="shimmer-skeleton" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
        <div className="shimmer-skeleton" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="shimmer-skeleton"
          style={{ height: '96px', borderRadius: '14px', border: '1px solid var(--border)' }}
        />
      ))}
    </div>

    {/* Table / Content Wireframe Skeleton */}
    <div
      style={{
        flex: 1,
        minHeight: '380px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div className="shimmer-skeleton" style={{ width: '200px', height: '36px', borderRadius: '8px' }} />
        <div className="shimmer-skeleton" style={{ width: '160px', height: '36px', borderRadius: '8px' }} />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="shimmer-skeleton"
          style={{ width: '100%', height: '42px', borderRadius: '8px' }}
        />
      ))}
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<PublicTracker />} />
          <Route path="/track/:code" element={<PublicTracker />} />

          <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><PageWrapper><OperationsCalendar /></PageWrapper></ProtectedRoute>} />
          <Route path="/tours" element={<ProtectedRoute><PageWrapper><ToursManager /></PageWrapper></ProtectedRoute>} />
          <Route path="/tour-registration-form" element={<ProtectedRoute><PageWrapper><TourRegistrationForm /></PageWrapper></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><PageWrapper><KnowledgeBase /></PageWrapper></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><RoleRoute allowedRoles={['Admin']}><PageWrapper><UserManager /></PageWrapper></RoleRoute></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><PageWrapper><SalesInput /></PageWrapper></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><PageWrapper><Documents /></PageWrapper></ProtectedRoute>} />
          <Route path="/telecom" element={<ProtectedRoute><PageWrapper><Telecom /></PageWrapper></ProtectedRoute>} />
          <Route path="/cruise" element={<ProtectedRoute><PageWrapper><Cruise /></PageWrapper></ProtectedRoute>} />
          <Route path="/hotel" element={<ProtectedRoute><PageWrapper><Hotel /></PageWrapper></ProtectedRoute>} />
          <Route path="/overtime" element={<ProtectedRoute><PageWrapper><Overtime /></PageWrapper></ProtectedRoute>} />
          <Route path="/productivity" element={<ProtectedRoute><PageWrapper><Productivity /></PageWrapper></ProtectedRoute>} />
          <Route path="/corporate" element={<ProtectedRoute><PageWrapper><Corporate /></PageWrapper></ProtectedRoute>} />
          <Route path="/staff-performance" element={<ProtectedRoute><PageWrapper><StaffPerformance /></PageWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['Admin']}><PageWrapper><Settings /></PageWrapper></RoleRoute></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

export default AnimatedRoutes;
