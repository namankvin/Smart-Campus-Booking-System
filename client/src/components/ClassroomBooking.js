import React, { useState, useEffect } from 'react';
import { bookingService, classroomService } from '../services/api';

const ClassroomBooking = ({ onSuccess }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [formData, setFormData] = useState({
    classroom: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomService.getAll();
      setClassrooms(response.data);
    } catch (err) {
      setError('Failed to fetch classrooms');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingService.createClassroomBooking(formData);
      setSuccess('Classroom booking submitted for approval!');
      setFormData({ classroom: '', date: '', startTime: '', endTime: '', purpose: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    }
  };

  return (
    <div className="card">
      <h2>Book Classroom</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Classroom</label>
          <select name="classroom" value={formData.classroom} onChange={handleChange} required>
            <option value="">Select a classroom</option>
            {classrooms.map(c => (
              <option key={c._id} value={c._id}>{c.name} (Capacity: {c.capacity})</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Start Time</label>
          <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>End Time</label>
          <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Purpose</label>
          <textarea name="purpose" value={formData.purpose} onChange={handleChange} required></textarea>
        </div>
        
        <button type="submit" className="button">Submit Booking Request</button>
      </form>
    </div>
  );
};

export default ClassroomBooking;