import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('./services/authContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => {
    const storedUser = global.localStorage.getItem('user');
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: global.localStorage.getItem('token')
    };
  }
}));

import App from './App';

jest.mock('./pages/Login', () => () => <div>Login Page</div>);
jest.mock('./pages/StudentDashboard', () => () => <div>Student Dashboard Mock</div>);
jest.mock('./pages/AdminDashboard', () => () => <div>Admin Dashboard Mock</div>);
jest.mock('./pages/VendorDashboard', () => () => <div>Vendor Dashboard Mock</div>);
jest.mock('./pages/CabOperatorDashboard', () => () => <div>Cab Dashboard Mock</div>);

describe('App role routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when no user is stored', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard for admin role', async () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'Admin' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard Mock')).toBeInTheDocument();
    });
  });

  it('renders vendor dashboard for vendor role', async () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Vendor', role: 'Vendor' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Vendor Dashboard Mock')).toBeInTheDocument();
    });
  });
});
