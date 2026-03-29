import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './authContext';
import { authService } from './api';

jest.mock('./api', () => ({
  authService: {
    login: jest.fn()
  }
}));

const TestHarness = () => {
  const { user, token, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <button
        onClick={() =>
          login({ credential: 'x' })
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authService.login.mockResolvedValue({
      data: {
        token: 'jwt-token',
        user: { name: 'Naman', role: 'Student' }
      }
    });
  });

  it('stores user and token on login and clears on logout', async () => {
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Naman');
      expect(screen.getByTestId('token')).toHaveTextContent('jwt-token');
    });

    expect(localStorage.getItem('token')).toBe('jwt-token');

    await userEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
      expect(screen.getByTestId('token')).toHaveTextContent('none');
    });
  });
});
