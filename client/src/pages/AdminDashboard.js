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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [bookingsRes, reportsRes, usersRes] = await Promise.all([
        adminService.getPendingBookings(),
        adminService.generateReports({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }),
        adminService.getUsers()
      ]);

      setPendingBookings(bookingsRes.data);
      setReports(reportsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminService.approveBooking(id);
      setPendingBookings((current) => current.filter((booking) => booking._id !== id));
    } catch (err) {
      setError('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminService.rejectBooking(id);
      setPendingBookings((current) => current.filter((booking) => booking._id !== id));
    } catch (err) {
      setError('Failed to reject booking');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await adminService.updateUserRole(id, role);
      setUsers((current) => current.map((item) => (item._id === id ? { ...item, role } : item)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  const totalUsers = users.length;
  const totalPending = pendingBookings.length;
  const totalRevenue = reports?.revenue || 0;

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
        <div className="page-intro">
          <div className="section-kicker">Operations</div>
          <h2>Approve requests, monitor usage, and keep the campus system moving.</h2>
          <p>
            Review pending bookings, update user roles, and track the operational snapshot for the last 30 days.
          </p>
          <div className="metric-row" style={{ marginTop: '18px' }}>
            <div className="metric-card">
              <strong>{totalPending}</strong>
              <span>Pending requests</span>
            </div>
            <div className="metric-card">
              <strong>{totalUsers}</strong>
              <span>Total users</span>
            </div>
            <div className="metric-card">
              <strong>${totalRevenue}</strong>
              <span>Reported revenue</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="dashboard">
          <div className="card">
            <h2>Summary</h2>
            {reports ? (
              <>
                <p>Total Bookings: <strong>{reports.totalBookings}</strong></p>
                <p>Revenue: <strong>${reports.revenue}</strong></p>
                <p>Pending classroom approvals: <strong>{pendingBookings.length}</strong></p>
              </>
            ) : (
              <p>No reporting data available.</p>
            )}
            <div className="button-group" style={{ marginTop: '16px' }}>
              <button className="button button-ghost" onClick={fetchData}>Refresh data</button>
            </div>
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
                {pendingBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.user?.name}</td>
                    <td>{booking.classroom?.name}</td>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{booking.startTime} - {booking.endTime}</td>
                    <td>{booking.purpose}</td>
                    <td>
                      <div className="button-group" style={{ margin: 0 }}>
                        <button onClick={() => handleApprove(booking._id)} className="button button-success">Approve</button>
                        <button onClick={() => handleReject(booking._id)} className="button button-danger">Reject</button>
                      </div>
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
                {users.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <select
                        value={item.role}
                        onChange={(e) => handleRoleChange(item._id, e.target.value)}
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
