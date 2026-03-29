import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodOrdering from './FoodOrdering';
import { bookingService, menuService } from '../services/api';

jest.mock('../services/api', () => ({
  bookingService: {
    placeFoodOrder: jest.fn()
  },
  menuService: {
    getByVendor: jest.fn()
  }
}));

const formatDatetimeLocal = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

describe('FoodOrdering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    menuService.getByVendor.mockResolvedValue({
      data: {
        items: [
          { name: 'Veg Sandwich', description: 'Fresh', price: 50 }
        ]
      }
    });
    bookingService.placeFoodOrder.mockResolvedValue({ data: { message: 'ok' } });
  });

  it('loads vendor menu and places order successfully', async () => {
    render(<FoodOrdering />);

    const vendorSelect = document.querySelector('select');
    await userEvent.selectOptions(vendorSelect, 'Taaza Tiffins');

    await waitFor(() => {
      expect(menuService.getByVendor).toHaveBeenCalled();
      expect(screen.getByText('Veg Sandwich')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    fireEvent.change(document.querySelector('input[type="datetime-local"]'), {
      target: { value: formatDatetimeLocal(new Date(Date.now() + 45 * 60 * 1000)) }
    });
    await userEvent.click(screen.getByRole('button', { name: 'Place Order' }));

    await waitFor(() => {
      expect(bookingService.placeFoodOrder).toHaveBeenCalledWith({
        vendor: 'Taaza Tiffins',
        items: [{ name: 'Veg Sandwich', quantity: 1 }],
        pickupTime: expect.any(String)
      });
    });
    await waitFor(() => {
      expect(screen.getByText('Order placed successfully!')).toBeInTheDocument();
    });
  });

  it('requires pickup time before placing order', async () => {
    render(<FoodOrdering />);

    const vendorSelect = document.querySelector('select');
    await userEvent.selectOptions(vendorSelect, 'Taaza Tiffins');

    await waitFor(() => expect(screen.getByText('Veg Sandwich')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Place Order' }));

    expect(screen.getByText('Please select pickup time')).toBeInTheDocument();
    expect(bookingService.placeFoodOrder).not.toHaveBeenCalled();
  });
});
