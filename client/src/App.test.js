import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockAuthState = {
  user: null,
  token: null
};

jest.mock('./services/authContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => mockAuthState
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
    window.history.pushState({}, '', '/');
    mockAuthState.user = null;
    mockAuthState.token = null;
  });

  it('redirects to login when no user is stored', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard for admin role', async () => {
    mockAuthState.token = 'fake-token';
    mockAuthState.user = { name: 'Admin', role: 'Admin', email: 'admin@test.edu' };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard Mock')).toBeInTheDocument();
    });
  });

  it('renders vendor dashboard for vendor role', async () => {
    mockAuthState.token = 'fake-token';
    mockAuthState.user = { name: 'Vendor', role: 'Vendor', email: 'vendor@test.edu' };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Vendor Dashboard Mock')).toBeInTheDocument();
    });
  });
});
