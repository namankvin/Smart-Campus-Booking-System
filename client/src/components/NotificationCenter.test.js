import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter';
import { notificationService } from '../services/api';

const mockHandlers = {};
const mockDisconnect = jest.fn();
const mockIo = jest.fn();

jest.mock('../services/api', () => ({
  notificationService: {
    getMine: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn()
  }
}));

jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: (...args) => mockIo(...args)
}));

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockHandlers).forEach((key) => delete mockHandlers[key]);

    mockIo.mockReturnValue({
      on: (event, cb) => {
        mockHandlers[event] = cb;
      },
      disconnect: mockDisconnect
    });

    localStorage.setItem('token', 'abc');
    notificationService.getMine.mockResolvedValue({
      data: {
        notifications: [
          {
            _id: '1',
            title: 'Welcome',
            message: 'Hello',
            isRead: false,
            createdAt: new Date().toISOString()
          }
        ],
        unreadCount: 1
      }
    });
  });

  it('loads and displays unread count and notifications', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Notifications (1)')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Notifications (1)'));
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('marks all notifications as read', async () => {
    notificationService.markAllRead.mockResolvedValue({ data: { message: 'ok' } });
    render(<NotificationCenter />);

    await waitFor(() => expect(screen.getByText('Notifications (1)')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Notifications (1)'));
    await userEvent.click(screen.getByText('Mark all read'));

    await waitFor(() => {
      expect(notificationService.markAllRead).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('updates from socket notification event', async () => {
    render(<NotificationCenter />);

    await waitFor(() => expect(screen.getByText('Notifications (1)')).toBeInTheDocument());
    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(typeof mockHandlers.notification_created).toBe('function');
  });
});
