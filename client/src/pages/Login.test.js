import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

const mockLogin = jest.fn();

jest.mock('../services/authContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: 'google-token' })}>Mock Google Login</button>
  )
}));

describe('Login', () => {
  const previousClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  beforeAll(() => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-google-client-id';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({
      user: { name: 'Test User', role: 'Student' }
    });
  });

  afterAll(() => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = previousClientId;
  });

  it('hides development role selector outside development mode', async () => {
    const onLogin = jest.fn();

    render(<Login onLogin={onLogin} />);

    expect(screen.queryByText('Role (for development)')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mock Google Login' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ credential: 'google-token', role: 'Student' });
      expect(onLogin).toHaveBeenCalledWith({ name: 'Test User', role: 'Student' });
    });
  });
});
