import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getFoodOrders();
      setBookings(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(id);
        setBookings(bookings.map(b => b._id === id ? { ...b, status: 'Cancelled' } : b));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to cancel booking');
      }
    }
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="card">
      <h2>My Bookings</h2>
      {error && <div className="alert alert-error">{error}</div>}
      
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td>{booking.type}</td>
                <td>
                  {booking.type === 'classroom' && booking.classroom?.name}
                  {booking.type === 'food' && booking.vendor}
                  {booking.type === 'cab' && `${booking.pickupLocation} → ${booking.dropLocation}`}
                </td>
                <td>{new Date(booking.date || booking.pickupTime).toLocaleDateString()}</td>
                <td><strong>{booking.status}</strong></td>
                <td>
                  {['Pending', 'Accepted'].includes(booking.status) && (
                    <button onClick={() => handleCancel(booking._id)} className="button button-danger">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BookingHistory;