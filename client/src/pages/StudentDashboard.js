import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import ClassroomBooking from '../components/ClassroomBooking';
import FoodOrdering from '../components/FoodOrdering';
import CabBooking from '../components/CabBooking';
import BookingHistory from '../components/BookingHistory';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('classroom');

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
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <button 
            className={`button ${activeTab === 'classroom' ? 'button-success' : ''}`}
            onClick={() => setActiveTab('classroom')}
          >
            Book Classroom
          </button>
          <button 
            className={`button ${activeTab === 'food' ? 'button-success' : ''}`}
            onClick={() => setActiveTab('food')}
            style={{ marginLeft: '10px' }}
          >
            Order Food
          </button>
          <button 
            className={`button ${activeTab === 'cab' ? 'button-success' : ''}`}
            onClick={() => setActiveTab('cab')}
            style={{ marginLeft: '10px' }}
          >
            Book Cab
          </button>
          <button 
            className={`button ${activeTab === 'history' ? 'button-success' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ marginLeft: '10px' }}
          >
            My Bookings
          </button>
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