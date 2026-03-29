import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentDashboard from './StudentDashboard';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('../services/authContext', () => ({
  useAuth: () => ({
    user: { name: 'Student User', role: 'Student' },
    logout: mockLogout
  })
}));

jest.mock('../components/ClassroomBooking', () => () => <div>Classroom Booking Component</div>);
jest.mock('../components/FoodOrdering', () => () => <div>Food Ordering Component</div>);
jest.mock('../components/CabBooking', () => () => <div>Cab Booking Component</div>);
jest.mock('../components/BookingHistory', () => () => <div>Booking History Component</div>);
jest.mock('../components/NotificationCenter', () => () => <div>Notifications</div>);

describe('StudentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches tabs and logs out', async () => {
    render(<StudentDashboard />);

    expect(screen.getByText('Classroom Booking Component')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Order Food' }));
    expect(screen.getByText('Food Ordering Component')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Book Cab' }));
    expect(screen.getByText('Cab Booking Component')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
