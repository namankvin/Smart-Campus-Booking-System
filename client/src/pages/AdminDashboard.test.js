import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';
import { adminService, classroomService } from '../services/api';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('../services/authContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', role: 'Admin' },
    logout: jest.fn()
  })
}));

jest.mock('../services/api', () => ({
  adminService: {
    getPendingBookings: jest.fn(),
    generateReports: jest.fn(),
    getUsers: jest.fn(),
    getClassrooms: jest.fn(),
    getCabs: jest.fn(),
    approveBooking: jest.fn(),
    rejectBooking: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    mapVendorRestaurant: jest.fn(),
    mapCabOperator: jest.fn(),
    getVendorOrders: jest.fn(),
    updateOrderStatus: jest.fn()
  },
  classroomService: {
    create: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../components/NotificationCenter', () => () => <div>Notifications</div>);

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getPendingBookings.mockResolvedValue({
      data: [
        {
          _id: 'booking-1',
          user: { name: 'Student One' },
          classroom: { name: 'A-301' },
          date: new Date('2026-05-10T00:00:00.000Z').toISOString(),
          startTime: '10:00',
          endTime: '11:00',
          purpose: 'Project work'
        }
      ]
    });
    adminService.generateReports.mockResolvedValue({
      data: { totalBookings: 7, byType: { classroom: 3, food: 2, cab: 2 } }
    });
    adminService.getUsers.mockResolvedValue({
      data: [{ _id: 'user-1', name: 'Alice', email: 'alice@test.edu', role: 'Student' }]
    });
    adminService.getClassrooms.mockResolvedValue({
      data: [{ _id: 'classroom-1', name: 'LHC-101', capacity: 80, location: 'LHC Block A', isActive: true }]
    });
    adminService.getCabs.mockResolvedValue({
      data: [{ _id: 'cab-1', id: 'CAB-001', routeName: 'North Campus Loop', assignedOperator: null }]
    });
    adminService.updateUserRole.mockResolvedValue({ data: { _id: 'user-1', role: 'Vendor' } });
    classroomService.create.mockResolvedValue({ data: { _id: 'classroom-2', name: 'CSE-102' } });
    classroomService.update.mockResolvedValue({ data: { _id: 'classroom-1', isActive: false } });
  });

  it('loads dashboard data and updates user role', async () => {
    const { container } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pending Classroom Bookings (1)')).toBeInTheDocument();
      expect(screen.getByText('Total classroom bookings')).toBeInTheDocument();
      expect(screen.getByText('Vendor orders managed')).toBeInTheDocument();
      expect(screen.getByText('Cab orders handled by operators')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const roleSelect = container.querySelector('select');
    await userEvent.selectOptions(roleSelect, 'Vendor');

    await waitFor(() => {
      expect(adminService.updateUserRole).toHaveBeenCalledWith('user-1', 'Vendor');
    });
  });
});
