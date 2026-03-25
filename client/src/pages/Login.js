import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ onLogin }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [role, setRole] = useState('Student');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await login({
        credential: credentialResponse.credential,
        role
      });
      
      onLogin(response.user);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1>Smart Campus Booking System</h1>
        <p>Welcome! Login with your institutional Google account to continue.</p>
        
        {error && <div className="alert alert-error">{error}</div>}

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
        
        <div style={{ marginTop: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Login failed')}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;