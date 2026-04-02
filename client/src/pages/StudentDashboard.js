import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import ClassroomBooking from '../components/ClassroomBooking';
import FoodOrdering from '../components/FoodOrdering';
import CabBooking from '../components/CabBooking';
import BookingHistory from '../components/BookingHistory';
import NotificationCenter from '../components/NotificationCenter';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('classroom');

  const tabItems = [
    { key: 'classroom', label: 'Book Classroom' },
    { key: 'food', label: 'Order Food' },
    { key: 'cab', label: 'Book Cab' },
    { key: 'history', label: 'My Bookings' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <h1>{user?.role === 'Faculty' ? 'Faculty Dashboard' : 'Student Dashboard'}</h1>
        <div className="navbar-menu">
          <span>Welcome, {user?.name}!</span>
          <NotificationCenter />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        <div className="page-intro">
          <div className="section-kicker">Overview</div>
          <h2>Plan room bookings, meals, transport, and history from one place.</h2>
          <p>
            Use the tabs below to move between booking tools and review past requests. Faculty users can also create recurring classroom requests.
          </p>
          <div className="metric-row" style={{ marginTop: '18px' }}>
            <div className="metric-card">
              <strong>{user?.role === 'Faculty' ? 'Faculty' : 'Student'}</strong>
              <span>Active role</span>
            </div>
            <div className="metric-card">
              <strong>{activeTab}</strong>
              <span>Current tool</span>
            </div>
            <div className="metric-card">
              <strong>Live</strong>
              <span>Notifications enabled</span>
            </div>
          </div>
        </div>

        <div className="tab-strip" role="tablist" aria-label="Student dashboard tabs">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`button ${activeTab === tab.key ? 'button-success' : 'button-ghost'}`}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'classroom' && <ClassroomBooking onSuccess={() => setActiveTab('history')} />}
        {activeTab === 'food' && <FoodOrdering onSuccess={() => setActiveTab('history')} />}
        {activeTab === 'cab' && <CabBooking onSuccess={() => setActiveTab('history')} />}
        {activeTab === 'history' && <BookingHistory />}
      </div>
    </div>
  );
};

export default StudentDashboard;