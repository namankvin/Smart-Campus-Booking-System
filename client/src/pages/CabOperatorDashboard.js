import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../services/authContext';
import { cabService } from '../services/api';
import NotificationCenter from '../components/NotificationCenter';
import { demoCabs, demoRouteSuggestions } from '../data/demoData';

const CabOperatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cab, setCab] = useState(null);
  const [stats, setStats] = useState({ totalAssignedRides: 0, upcomingRides: 0, completedRides: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOperatorStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await cabService.getMyStats();
      const fetchedCab = res.data?.cab || null;
      if (fetchedCab) {
        const demoMatch = demoCabs.find((item) => item.id === fetchedCab.id);
        const fallbackRouteStops = [
          fetchedCab.currentLocation || demoMatch?.currentLocation,
          ...demoRouteSuggestions
        ].filter(Boolean).slice(0, 5);

        setCab({
          ...demoMatch,
          ...fetchedCab,
          driver: fetchedCab.driver || demoMatch?.driver || user?.name || '-',
          currentLocation: fetchedCab.currentLocation || demoMatch?.currentLocation || 'Main Gate',
          routeName: fetchedCab.routeName || 'Campus Mobility Loop',
          routeStops: Array.isArray(fetchedCab.routeStops) && fetchedCab.routeStops.length > 0
            ? fetchedCab.routeStops
            : fallbackRouteStops
        });
      } else {
        setCab(null);
      }
      setStats(res.data?.stats || { totalAssignedRides: 0, upcomingRides: 0, completedRides: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch cab statistics');
    } finally {
      setLoading(false);
    }
  }, [user?.name]);

  useEffect(() => {
    fetchOperatorStats();
  }, [fetchOperatorStats]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading cab operator dashboard...</div>;

  const routeStops = Array.isArray(cab?.routeStops) ? cab.routeStops : [];
  const currentStopIndex = routeStops.findIndex((stop) => stop === cab?.currentLocation);
  const nextStopIndex = routeStops.length > 0 && currentStopIndex >= 0
    ? (currentStopIndex + 1) % routeStops.length
    : -1;

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
          <h2>Track your assigned cab and monitor ride activity in one place.</h2>
          <p>
            Cab creation is managed by admins. Operators can view only their assigned cab statistics and route coverage.
          </p>
          <div className="metric-row" style={{ marginTop: '18px' }}>
            <div className="metric-card">
              <strong>{stats.totalAssignedRides}</strong>
              <span>Total assigned rides</span>
            </div>
            <div className="metric-card">
              <strong>{stats.upcomingRides}</strong>
              <span>Upcoming rides</span>
            </div>
            <div className="metric-card">
              <strong>{stats.completedRides}</strong>
              <span>Completed rides</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <h2>Assigned Cab</h2>
          {!cab ? (
            <p>No cab is assigned to your account yet.</p>
          ) : (
            <div className="surface-grid">
              <div>
                <p><strong>Cab ID:</strong> {cab.id}</p>
                <p><strong>Driver:</strong> {cab.driver || user?.name || '-'}</p>
                <p><strong>Capacity:</strong> {cab.capacity}</p>
                <p><strong>Current location:</strong> {cab.currentLocation || '-'}</p>
              </div>
              <div>
                <p><strong>Route:</strong> {cab.routeName || 'Not defined'}</p>
                {routeStops.length > 0 ? (
                  <>
                    <div className="route-map" aria-label="Assigned cab route">
                      {routeStops.map((stop, index) => {
                        const isCurrent = stop === cab.currentLocation;
                        const isNext = index === nextStopIndex;
                        const isCompleted = currentStopIndex >= 0 && index < currentStopIndex;
                        const stopClassName = `route-stop ${isCurrent ? 'is-current' : isNext ? 'is-next' : isCompleted ? 'is-completed' : 'is-upcoming'}`;

                        return (
                          <React.Fragment key={`${stop}-${index}`}>
                            <span className={stopClassName}>{stop}</span>
                            {index < routeStops.length - 1 && <FiArrowRight className="route-arrow" aria-hidden="true" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p>No route stops configured.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Operator Access</h2>
          <p>
            Cab operators have read-only access to assigned cab insights. Admins control cab creation and fleet configuration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CabOperatorDashboard;
