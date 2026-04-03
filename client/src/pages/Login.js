import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { GoogleLogin } from '@react-oauth/google';
import { FiArrowRight, FiShield, FiUsers, FiZap } from 'react-icons/fi';

const Login = ({ onLogin }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [role, setRole] = useState('Student');
  const featureHighlights = [
    { label: 'Role-based dashboards', Icon: FiUsers },
    { label: 'Fast booking flows', Icon: FiZap },
    { label: 'Secure session handling', Icon: FiShield }
  ];
  const isDevelopment = process.env.NODE_ENV === 'development';
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = Boolean(
    googleClientId && !googleClientId.includes('your_google_client_id_here')
  );

  const roleOptions = [
    { value: 'Student', label: 'Student/Faculty' },
    { value: 'Vendor', label: 'Vendor' },
    { value: 'Cab Operator', label: 'Cab Operator' },
    { value: 'Admin', label: 'Admin' }
  ];

  const roleHelperText = role === 'Student'
    ? 'Student/Faculty sign-in requires institutional mail ending with .nitw.ac.in.'
    : role === 'Admin'
      ? 'Admin access is restricted to pre-approved email addresses.'
      : 'Vendor and cab operator access requires admin mapping. Unmapped emails are signed in as Guest.';

  const demoIdentityByRole = {
    Student: 'student.demo@smartcampus.local',
    Vendor: 'vendor.demo@smartcampus.local',
    'Cab Operator': 'cab.demo@smartcampus.local',
    Admin: 'admin.demo@smartcampus.local'
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const loginPayload = {
        credential: credentialResponse.credential,
        role
      };

      const response = await login(loginPayload);

      if (typeof onLogin === 'function') {
        onLogin(response.user);
      }
    } catch (err) {
      setError(err?.error || err?.message || 'Google login failed. Check if your email meets the requirements.');
    }
  };

  const handleDevLogin = async () => {
    try {
      setError('');
      const response = await login({
        mode: 'dev',
        role,
        email: demoIdentityByRole[role] || 'student.demo@smartcampus.local',
        name: `${role} Demo`
      });

      if (typeof onLogin === 'function') {
        onLogin(response.user);
      }
    } catch (err) {
      setError(err?.error || err?.message || 'Development login failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <h1>One place for rooms, rides, meals, and approvals.</h1>
        <p>
          A cleaner way for students, faculty, vendors, cab operators, and admins to manage daily campus logistics without friction.
        </p>

        <div className="feature-marquee" aria-label="Platform capabilities">
          <div className="feature-track feature-track-a">
            {featureHighlights.map(({ label, Icon }) => (
              <div className="feature-chip" key={`a-${label}`}>
                <Icon />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="feature-track feature-track-b" aria-hidden="true">
            {featureHighlights.map(({ label, Icon }) => (
              <div className="feature-chip" key={`b-${label}`}>
                <Icon />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div className="card-header">
          <div>
            <div className="section-kicker">Sign in</div>
            <h2>Continue to your dashboard</h2>
          </div>
        </div>

        <p className="auth-copy">
          Pick your role, then sign in with your Google account. Access rules are applied based on selected role.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {!isGoogleConfigured && (
          <div className="alert alert-warning">
            Google OAuth is not configured. Configure it to allow NITW account login, or use local development login.
          </div>
        )}

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="helper-text">
            {roleHelperText}
          </p>
        </div>

        <div className="auth-actions">
          {isGoogleConfigured ? (
            <div className="google-login-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Check OAuth client configuration.')}
              />
            </div>
          ) : isDevelopment ? (
            <button className="button button-success button-wide" onClick={handleDevLogin}>
              Continue in development <FiArrowRight />
            </button>
          ) : (
            <button className="button button-wide" disabled>
              Google sign-in unavailable
            </button>
          )}

          {isDevelopment && (
            <button className="button button-ghost button-wide" onClick={handleDevLogin}>
              Use demo session <FiArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;