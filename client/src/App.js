import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CabOperatorDashboard from './pages/CabOperatorDashboard';

const ProtectedRoute = ({ user, children, requiredRole }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AppContent = () => {
  const { user, token } = useAuth();
  const [loggedInUser, setLoggedInUser] = useState(user);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }
  }, [user, token]);

  const handleLogin = (user) => {
    setLoggedInUser(user);
  };

  const renderDashboard = () => {
    if (!loggedInUser) return <Navigate to="/login" />;
    if (loggedInUser.role === 'Admin') return <AdminDashboard />;
    if (loggedInUser.role === 'Vendor') return <VendorDashboard />;
    if (loggedInUser.role === 'Cab Operator') return <CabOperatorDashboard />;
    return <StudentDashboard />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={loggedInUser}>
            {renderDashboard()}
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={loggedInUser ? '/dashboard' : '/login'} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;