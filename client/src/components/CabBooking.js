import React, { useEffect, useState } from 'react';
import { bookingService, cabService } from '../services/api';
import { demoCabs, demoRouteSuggestions } from '../data/demoData';

const CabBooking = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    requestedTime: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableCabs, setAvailableCabs] = useState([]);
  const [usingDemoCabs, setUsingDemoCabs] = useState(false);

  useEffect(() => {
    const fetchCabs = async () => {
      try {
        const response = await cabService.getAvailable();
        const items = Array.isArray(response.data) ? response.data : [];
        if (items.length > 0) {
          setAvailableCabs(items);
          setUsingDemoCabs(false);
        } else {
          setAvailableCabs(demoCabs);
          setUsingDemoCabs(true);
        }
      } catch (fetchError) {
        setAvailableCabs(demoCabs);
        setUsingDemoCabs(true);
      }
    };

    fetchCabs();
  }, []);

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
      setError('');
      setFormData({ pickupLocation: '', dropLocation: '', requestedTime: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.error || 'Failed to book cab');
    }
  };

  return (
    <div className="card">
      <h2>Book Electric Cab</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {usingDemoCabs && <div className="alert alert-warning">Showing demo cab fleet because live data is unavailable.</div>}

      <div className="surface-grid" style={{ marginBottom: '16px' }}>
        {availableCabs.map((cab) => (
          <div key={cab._id || cab.id} className="metric-card">
            <strong>{cab.id}</strong>
            <div>Driver: {cab.driver || 'Assigned at dispatch'}</div>
            <div>Capacity: {cab.capacity}</div>
            <div>Location: {cab.currentLocation || 'Campus Core'}</div>
            <div className={cab.isAvailable === false ? 'status-offline' : 'status-online'}>
              {cab.isAvailable === false ? 'Unavailable' : 'Available'}
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleBook}>
        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleChange}
            list="campus-locations"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Drop Location</label>
          <input
            type="text"
            name="dropLocation"
            value={formData.dropLocation}
            onChange={handleChange}
            list="campus-locations"
            required
          />
        </div>

        <datalist id="campus-locations">
          {demoRouteSuggestions.map((location) => (
            <option key={location} value={location} />
          ))}
        </datalist>
        
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