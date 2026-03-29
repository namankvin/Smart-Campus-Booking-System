import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassroomBooking from './ClassroomBooking';
import { bookingService, classroomService } from '../services/api';

jest.mock('../services/api', () => ({
  bookingService: {
    createClassroomBooking: jest.fn()
  },
  classroomService: {
    getAll: jest.fn()
  }
}));

jest.mock('../services/authContext', () => ({
  useAuth: () => ({
    user: { name: 'Professor A', role: 'Faculty' }
  })
}));

describe('ClassroomBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classroomService.getAll.mockResolvedValue({
      data: [
        { _id: 'classroom-1', name: 'A-101', capacity: 60 }
      ]
    });
    bookingService.createClassroomBooking.mockResolvedValue({ data: { message: 'ok' } });
  });

  it('loads classrooms and shows faculty recurrence options', async () => {
    render(<ClassroomBooking />);

    await waitFor(() => {
      expect(screen.getByText('A-101 (Capacity: 60)')).toBeInTheDocument();
    });

    expect(screen.getByText('Recurrence')).toBeInTheDocument();
    expect(document.querySelector('select[name="recurrenceType"]')).toBeInTheDocument();
  });

  it('shows validation error when end time is before start time', async () => {
    render(<ClassroomBooking />);

    await waitFor(() => {
      expect(screen.getByText('A-101 (Capacity: 60)')).toBeInTheDocument();
    });

    await userEvent.selectOptions(document.querySelector('select[name="classroom"]'), 'classroom-1');
    await userEvent.type(document.querySelector('input[name="date"]'), '2026-12-10');
    await userEvent.type(document.querySelector('input[name="startTime"]'), '14:00');
    await userEvent.type(document.querySelector('input[name="endTime"]'), '13:00');
    await userEvent.type(document.querySelector('textarea[name="purpose"]'), 'Project review');

    await userEvent.click(screen.getByRole('button', { name: 'Submit Booking Request' }));

    expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    expect(bookingService.createClassroomBooking).not.toHaveBeenCalled();
  });
});
