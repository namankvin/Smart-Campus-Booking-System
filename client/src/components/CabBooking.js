import React, { useState } from 'react';
import { bookingService } from '../services/api';

const CabBooking = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    requestedTime: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    
    // Validate 6-hour advance booking
    const now = new Date();
    const requestedTime = new Date(formData.requestedTime);
    const maxTime = new Date(now.getTime() + 6 * 60 * 60000);
    
    if (requestedTime > maxTime) {
      setError('Can only book cabs up to 6 hours in advance');
      return;
    }

    try {
      await bookingService.bookCab(formData);
      setSuccess('Cab booked successfully!');
      setFormData({ pickupLocation: '', dropLocation: '', requestedTime: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book cab');
    }
  };

  return (
    <div className="card">
      <h2>Book Electric Cab</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleBook}>
        <div className="form-group">
          <label>Pickup Location</label>
          <input type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Drop Location</label>
          <input type="text" name="dropLocation" value={formData.dropLocation} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Requested Time (within 6 hours)</label>
          <input type="datetime-local" name="requestedTime" value={formData.requestedTime} onChange={handleChange} required />
        </div>
        
        <button type="submit" className="button">Book Cab</button>
      </form>
    </div>
  );
};

export default CabBooking;