import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { cabService } from '../services/api';
import NotificationCenter from '../components/NotificationCenter';

const CabOperatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cabs, setCabs] = useState([]);
  const [newCab, setNewCab] = useState({ id: '', driver: '', capacity: 4 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableCount = cabs.length;

  const fetchCabs = async () => {
    try {
      const res = await cabService.getAvailable();
      setCabs(res.data || []);
    } catch (err) {
      setError('Failed to fetch cabs');
    }
  };

  useEffect(() => {
    fetchCabs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateCab = async () => {
    if (!newCab.id) {
      setError('Cab ID is required');
      return;
    }

    try {
      await cabService.create({
        id: newCab.id,
        driver: newCab.driver,
        capacity: Number(newCab.capacity || 4)
      });
      setSuccess('Cab added successfully');
      setError('');
      setNewCab({ id: '', driver: '', capacity: 4 });
      fetchCabs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add cab');
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Cab Operator Dashboard</h1>
        <div className="navbar-menu">
          <span>Welcome, {user?.name}</span>
          <NotificationCenter />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container dashboard-stack">
        <div className="page-intro">
          <div className="section-kicker">Fleet</div>
          <h2>Keep the campus cab fleet available, visible, and ready for booking.</h2>
          <p>
            Add new cabs, review active inventory, and ensure pickup details stay readable for riders and operators.
          </p>
          <div className="metric-row" style={{ marginTop: '18px' }}>
            <div className="metric-card">
              <strong>{availableCount}</strong>
              <span>Available cabs</span>
            </div>
            <div className="metric-card">
              <strong>{newCab.capacity || 4}</strong>
              <span>Draft capacity</span>
            </div>
            <div className="metric-card">
              <strong>Live</strong>
              <span>Operator dashboard</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <h2>Add Cab</h2>
          <div className="form-group">
            <label>Cab ID</label>
            <input value={newCab.id} onChange={(e) => setNewCab((p) => ({ ...p, id: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Driver</label>
            <input value={newCab.driver} onChange={(e) => setNewCab((p) => ({ ...p, driver: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              min="1"
              value={newCab.capacity}
              onChange={(e) => setNewCab((p) => ({ ...p, capacity: e.target.value }))}
            />
          </div>
          <button className="button" onClick={handleCreateCab}>Create Cab</button>
        </div>

        <div className="card">
          <h2>Available Cabs</h2>
          {cabs.length === 0 ? (
            <p>No available cabs right now.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cab ID</th>
                  <th>Driver</th>
                  <th>Capacity</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {cabs.map((cab) => (
                  <tr key={cab._id}>
                    <td>{cab.id}</td>
                    <td>{cab.driver || '-'}</td>
                    <td>{cab.capacity}</td>
                    <td>{cab.currentLocation || '-'}</td>
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

export default CabOperatorDashboard;
