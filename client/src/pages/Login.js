import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ onLogin }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [role, setRole] = useState('Student');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = Boolean(
    googleClientId && !googleClientId.includes('your_google_client_id_here')
  );

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const loginPayload = {
        credential: credentialResponse.credential
      };

      if (isDevelopment) {
        loginPayload.role = role;
      }

      const response = await login(loginPayload);
      
      onLogin(response.user);
    } catch (err) {
      setError(err?.error || err?.message || 'Login failed. Please try again.');
    }
  };

  const handleDevLogin = async () => {
    try {
      setError('');
      const response = await login({
        mode: 'dev',
        role,
        email: `dev.${role.toLowerCase().replace(/\s+/g, '')}@test.edu`,
        name: `Dev ${role}`
      });

      onLogin(response.user);
    } catch (err) {
      setError(err?.error || err?.message || 'Development login failed');
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1>Smart Campus Booking System</h1>
        <p>Welcome! Login with your institutional Google account to continue.</p>
        
        {error && <div className="alert alert-error">{error}</div>}

        {!isGoogleConfigured && (
          <div className="alert alert-error" style={{ marginTop: '12px' }}>
            Google OAuth is not configured. Set a valid REACT_APP_GOOGLE_CLIENT_ID in client/.env.
          </div>
        )}

        {isDevelopment && (
          <div className="form-group" style={{ marginTop: '16px', textAlign: 'left' }}>
            <label>Role (for development)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Vendor">Vendor</option>
              <option value="Cab Operator">Cab Operator</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          {isGoogleConfigured ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Check OAuth client configuration.')}
            />
          ) : isDevelopment ? (
            <button className="button button-success" onClick={handleDevLogin}>Sign in (Development)</button>
          ) : (
            <button className="button" disabled>Sign in with Google</button>
          )}
        </div>

        {isDevelopment && (
          <div style={{ marginTop: '12px' }}>
            <button className="button button-success" onClick={handleDevLogin}>Quick Dev Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;