import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const GuestDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Guest Dashboard</h1>
        <div className="navbar-menu">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container dashboard-stack">
        <div className="card">
          <h2>Limited Access</h2>
          <p>
            Your email is not mapped to a Student/Faculty, Vendor, Cab Operator, or Admin profile.
            Contact an admin to map your account for role-based access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
