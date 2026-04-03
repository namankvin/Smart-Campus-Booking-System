import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { adminService, classroomService } from '../services/api';
import NotificationCenter from '../components/NotificationCenter';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingBookings, setPendingBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    capacity: '',
    location: '',
    amenities: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [bookingsRes, reportsRes, usersRes, classroomsRes] = await Promise.all([
        adminService.getPendingBookings(),
        adminService.generateReports({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }),
        adminService.getUsers(),
        adminService.getClassrooms()
      ]);

      setPendingBookings(bookingsRes.data);
      setReports(reportsRes.data);
      setUsers(usersRes.data);
      setClassrooms(classroomsRes.data || []);
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

  const handleCreateClassroom = async (event) => {
    event.preventDefault();

    if (!classroomForm.name || !classroomForm.capacity || !classroomForm.location) {
      setError('Classroom name, capacity, and location are required');
      return;
    }

    try {
      setError('');
      const payload = {
        name: classroomForm.name,
        capacity: Number(classroomForm.capacity),
        location: classroomForm.location,
        amenities: classroomForm.amenities
          ? classroomForm.amenities.split(',').map((item) => item.trim()).filter(Boolean)
          : []
      };
      const response = await classroomService.create(payload);
      setClassrooms((current) => [response.data, ...current]);
      setClassroomForm({ name: '', capacity: '', location: '', amenities: '' });
    } catch (createError) {
      setError(createError.response?.data?.error || 'Failed to create classroom');
    }
  };

  const handleToggleClassroomAvailability = async (classroom) => {
    try {
      setError('');
      const response = await classroomService.update(classroom._id, {
        isActive: classroom.isActive === false
      });
      setClassrooms((current) =>
        current.map((item) => (item._id === classroom._id ? response.data : item))
      );
    } catch (toggleError) {
      setError(toggleError.response?.data?.error || 'Failed to update classroom availability');
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  const totalPendingClassroomApprovals = pendingBookings.length;
  const totalClassroomBookings = reports?.byType?.classroom || 0;
  const totalVendorOrdersManaged = reports?.byType?.food || 0;
  const totalCabOrdersHandled = reports?.byType?.cab || 0;

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

      <div className="container dashboard-stack">
        <div className="page-intro">
          <div className="section-kicker">Operations</div>
          <h2>Approve requests, monitor usage, and keep the campus system moving.</h2>
          <p>
            Review classroom approvals, monitor order volume, and track the 30-day operational snapshot.
          </p>
          <div className="metric-row" style={{ marginTop: '18px' }}>
            <div className="metric-card">
              <strong>{totalPendingClassroomApprovals}</strong>
              <span>Pending classroom approvals</span>
            </div>
            <div className="metric-card">
              <strong>{totalClassroomBookings}</strong>
              <span>Total classroom bookings</span>
            </div>
            <div className="metric-card">
              <strong>{totalVendorOrdersManaged}</strong>
              <span>Vendor orders managed</span>
            </div>
            <div className="metric-card">
              <strong>{totalCabOrdersHandled}</strong>
              <span>Cab orders handled by operators</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

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

        <div className="card">
          <h2>Classroom Management</h2>
          <form onSubmit={handleCreateClassroom}>
            <div className="surface-grid">
              <div className="form-group">
                <label>Classroom Name</label>
                <input
                  type="text"
                  value={classroomForm.name}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. LHC-202"
                />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={classroomForm.capacity}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="e.g. 80"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={classroomForm.location}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. LHC Block B"
                />
              </div>
              <div className="form-group">
                <label>Amenities (comma separated)</label>
                <input
                  type="text"
                  value={classroomForm.amenities}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, amenities: e.target.value }))}
                  placeholder="Projector, Smart Board"
                />
              </div>
            </div>
            <button type="submit" className="button button-success">Add Classroom</button>
          </form>

          {classrooms.length === 0 ? (
            <p style={{ marginTop: '16px' }}>No classrooms found.</p>
          ) : (
            <table className="table" style={{ marginTop: '16px' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((classroom) => (
                  <tr key={classroom._id}>
                    <td>{classroom.name}</td>
                    <td>{classroom.capacity}</td>
                    <td>{classroom.location}</td>
                    <td>
                      <span className={classroom.isActive === false ? 'status-offline' : 'status-online'}>
                        {classroom.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button button-ghost"
                        onClick={() => handleToggleClassroomAvailability(classroom)}
                        type="button"
                      >
                        {classroom.isActive === false ? 'Mark Active' : 'Mark Inactive'}
                      </button>
                    </td>
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
