import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CabBooking from './CabBooking';
import { bookingService } from '../services/api';

jest.mock('../services/api', () => ({
  bookingService: {
    bookCab: jest.fn()
  }
}));

const formatDatetimeLocal = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

describe('CabBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates that booking cannot be more than 6 hours ahead', async () => {
    render(<CabBooking />);

    const pickupInput = document.querySelector('input[name="pickupLocation"]');
    const dropInput = document.querySelector('input[name="dropLocation"]');
    const requestedTimeInput = document.querySelector('input[name="requestedTime"]');

    await userEvent.type(pickupInput, 'Library');
    await userEvent.type(dropInput, 'Main Gate');
    const sevenHoursLater = formatDatetimeLocal(new Date(Date.now() + 7 * 60 * 60 * 1000));
    fireEvent.change(requestedTimeInput, { target: { value: sevenHoursLater } });

    await userEvent.click(screen.getByRole('button', { name: 'Book Cab' }));

    await waitFor(() => {
      expect(screen.getByText('Can only book cabs up to 6 hours in advance')).toBeInTheDocument();
    });
    expect(bookingService.bookCab).not.toHaveBeenCalled();
  });

  it('submits booking when form is valid', async () => {
    const onSuccess = jest.fn();
    bookingService.bookCab.mockResolvedValue({ data: { message: 'ok' } });

    render(<CabBooking onSuccess={onSuccess} />);

    const pickupInput = document.querySelector('input[name="pickupLocation"]');
    const dropInput = document.querySelector('input[name="dropLocation"]');
    const requestedTimeInput = document.querySelector('input[name="requestedTime"]');

    await userEvent.type(pickupInput, 'Hostel');
    await userEvent.type(dropInput, 'Academic Block');
    fireEvent.change(requestedTimeInput, {
      target: { value: formatDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)) }
    });

    await userEvent.click(screen.getByRole('button', { name: 'Book Cab' }));

    await waitFor(() => {
      expect(bookingService.bookCab).toHaveBeenCalledWith({
        pickupLocation: 'Hostel',
        dropLocation: 'Academic Block',
        requestedTime: expect.any(String)
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Cab booked successfully!')).toBeInTheDocument();
    });
  });
});
