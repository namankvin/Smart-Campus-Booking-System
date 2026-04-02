import React, { useState, useEffect } from 'react';
import { bookingService, classroomService } from '../services/api';
import { useAuth } from '../services/authContext';
import { demoClassrooms } from '../data/demoData';

const ClassroomBooking = ({ onSuccess }) => {
  const { user } = useAuth();
  const isFaculty = user?.role === 'Faculty';

  const [classrooms, setClassrooms] = useState([]);
  const [formData, setFormData] = useState({
    classroom: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    joinWaitlist: false,
    recurrenceType: 'none',
    recurrenceCount: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usingDemoClassrooms, setUsingDemoClassrooms] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomService.getAll();
      const items = Array.isArray(response.data) ? response.data : [];
      if (items.length > 0) {
        setClassrooms(items);
        setUsingDemoClassrooms(false);
      } else {
        setClassrooms(demoClassrooms);
        setUsingDemoClassrooms(true);
      }
    } catch (err) {
      setClassrooms(demoClassrooms);
      setUsingDemoClassrooms(true);
      setError('Live classroom list is unavailable. Showing demo classroom availability.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    const selectedClassroom = classrooms.find((item) => item._id === formData.classroom);

    if (selectedClassroom?.isDemo) {
      setSuccess('Demo classroom selected. Availability preview is enabled for UI demonstration.');
      setError('');
      if (onSuccess) onSuccess();
      return;
    }

    try {
      await bookingService.createClassroomBooking(formData);
      setSuccess(
        formData.recurrenceType !== 'none'
          ? 'Recurring classroom booking submitted for approval!'
          : 'Classroom booking submitted for approval!'
      );
      setError('');
      setFormData({
        classroom: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        joinWaitlist: false,
        recurrenceType: 'none',
        recurrenceCount: 1
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.code === 'PENDING_EXISTS') {
        setError('A pending request already exists for this slot. You can enable join waitlist and resubmit.');
      } else if (Array.isArray(apiError?.conflicts) && apiError.conflicts.length > 0) {
        setError(`Approved conflicts on: ${apiError.conflicts.join(', ')}`);
      } else {
        setError(apiError?.error || 'Failed to create booking');
      }
    }
  };

  return (
    <div className="card">
      <h2>Book Classroom</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {usingDemoClassrooms && (
        <div className="alert alert-warning">Showing sample classrooms because live data is empty.</div>
      )}

      {classrooms.length > 0 && (
        <div className="surface-grid" style={{ marginBottom: '16px' }}>
          {classrooms.map((item) => (
            <div key={`${item._id}-availability`} className="metric-card">
              <strong>{item.name}</strong>
              <div>{item.location || 'Campus Block'}</div>
              <div>Capacity: {item.capacity}</div>
              <div className={item.isActive === false ? 'status-offline' : 'status-online'}>
                {item.isActive === false ? 'Not Available' : 'Available'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Classroom</label>
          <select name="classroom" value={formData.classroom} onChange={handleChange} required>
            <option value="">Select a classroom</option>
            {classrooms.map(c => (
              <option key={c._id} value={c._id}>
                {c.name} (Capacity: {c.capacity}) - {c.isActive === false ? 'Not Available' : 'Available'}
              </option>
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

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              name="joinWaitlist"
              checked={formData.joinWaitlist}
              onChange={handleChange}
            />
            Join waitlist if a pending request already exists for this slot
          </label>
        </div>

        {isFaculty && (
          <>
            <div className="form-group">
              <label>Recurrence</label>
              <select name="recurrenceType" value={formData.recurrenceType} onChange={handleChange}>
                <option value="none">None (single booking)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {formData.recurrenceType !== 'none' && (
              <div className="form-group">
                <label>Occurrences (max 16)</label>
                <input
                  type="number"
                  name="recurrenceCount"
                  min="1"
                  max="16"
                  value={formData.recurrenceCount}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </>
        )}
        
        <button type="submit" className="button">Submit Booking Request</button>
      </form>
    </div>
  );
};

export default ClassroomBooking;