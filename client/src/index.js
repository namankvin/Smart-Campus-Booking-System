import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();
const hasGoogleClientId = Boolean(googleClientId && !googleClientId.includes('your_google_client_id_here'));

const appTree = hasGoogleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
);

root.render(
  <React.StrictMode>
    {appTree}
  </React.StrictMode>
);