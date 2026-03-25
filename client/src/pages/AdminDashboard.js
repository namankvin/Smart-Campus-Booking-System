import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { adminService } from '../services/api';
import NotificationCenter from '../components/NotificationCenter';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingBookings, setPendingBookings] = useState([]);
  const [users, setUsers] = useState([]);
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

      const usersRes = await adminService.getUsers();
      setPendingBookings(bookingsRes.data);
      setReports(reportsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch admin data');
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveBooking(id);
      setPendingBookings(pendingBookings.filter(b => b._id !== id));
    } catch (err) {
      setError('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminService.rejectBooking(id);
      setPendingBookings(pendingBookings.filter(b => b._id !== id));
    } catch (err) {
      setError('Failed to reject booking');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await adminService.updateUserRole(id, role);
      setUsers(users.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div>
      <nav className="navbar">
        <h1>Admin Dashboard</h1>
        <div className="navbar-menu">
          <span>Welcome, {user?.name}</span>
          <NotificationCenter />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
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

      <div className="card">
        <h2>User Role Management</h2>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Cab Operator">Cab Operator</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td>Saved on select</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;