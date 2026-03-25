import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, reportsRes] = await Promise.all([
        adminService.getPendingBookings(),
        adminService.generateReports({ startDate: new Date(Date.now() - 30*24*60*60*1000), endDate: new Date() })
      ]);
      setP endingBookings(bookingsRes.data);
      setReports(reportsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch admin data');
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveBooking(id);
      setP endingBookings(pendingBookings.filter(b => b._id !== id));
    } catch (err) {
      setError('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminService.rejectBooking(id);
      setP endingBookings(pendingBookings.filter(b => b._id !== id));
    } catch (err) {
      setError('Failed to reject booking');
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="dashboard">
        <div className="card">
          <h2>Summary</h2>
          {reports && (
            <>
              <p>Total Bookings: <strong>{reports.totalBookings}</strong></p>
              <p>Revenue: <strong>${reports.revenue}</strong></p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Pending Classroom Bookings ({pendingBookings.length})</h2>
        {pendingBookings.length === 0 ? (
          <p>No pending bookings.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Classroom</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.user?.name}</td>
                  <td>{booking.classroom?.name}</td>
                  <td>{new Date(booking.date).toLocaleDateString()}</td>
                  <td>{booking.startTime} - {booking.endTime}</td>
                  <td>{booking.purpose}</td>
                  <td>
                    <button onClick={() => handleApprove(booking._id)} className="button button-success">Approve</button>
                    <button onClick={() => handleReject(booking._id)} className="button button-danger">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;