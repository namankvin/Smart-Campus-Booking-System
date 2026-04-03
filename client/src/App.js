import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CabOperatorDashboard from './pages/CabOperatorDashboard';
import GuestDashboard from './pages/GuestDashboard';

const ProtectedRoute = ({ user, children, requiredRole }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { user, ready = true } = useAuth();

  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'Admin') return <AdminDashboard />;
    if (user.role === 'Vendor') return <VendorDashboard />;
    if (user.role === 'Cab Operator') return <CabOperatorDashboard />;
    if (user.role === 'Guest') return <GuestDashboard />;
    return <StudentDashboard />;
  };

  if (!ready) {
    return (
      <div className="app-loading-shell">
        <div className="loading-card">
          <div className="loading-badge" />
          <h1>Loading Smart Campus</h1>
          <p>Checking your session and preparing the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            {renderDashboard()}
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;