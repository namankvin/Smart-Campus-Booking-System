import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ onLogin }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Decode JWT to get user info
      const token = credentialResponse.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const userData = JSON.parse(jsonPayload);
      
      const response = await login({
        googleId: userData.sub,
        email: userData.email,
        name: userData.name,
        profilePicture: userData.picture
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