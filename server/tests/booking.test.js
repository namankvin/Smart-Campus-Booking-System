const request = require('supertest');
const { createAppServer } = require('../app');
const Classroom = require('../models/Classroom');
const Booking = require('../models/Booking');
const Cab = require('../models/Cab');
const { createUserAndToken } = require('./helpers');

describe('Booking API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  it('creates a classroom booking request', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({ role: 'Student' });

    const classroom = await Classroom.create({
      name: 'A-101',
      capacity: 50,
      location: 'Academic Block'
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/bookings/classroom')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classroom: classroom._id,
        date: tomorrow.toISOString(),
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Project meeting'
      })
      .expect(200);

    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].status).toBe('Pending');
  });

  it('rejects booking with invalid time range', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({ role: 'Student' });

    const classroom = await Classroom.create({
      name: 'A-102',
      capacity: 40,
      location: 'Academic Block'
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await request(app)
      .post('/api/bookings/classroom')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classroom: classroom._id,
        date: tomorrow.toISOString(),
        startTime: '12:00',
        endTime: '11:00',
        purpose: 'Invalid test'
      })
      .expect(400);
  });

  it('cancels own booking', async () => {
    const { app } = createAppServer();
    const { user, token } = await createUserAndToken({ role: 'Student' });

    const booking = await Booking.create({
      user: user._id,
      type: 'classroom',
      date: new Date(Date.now() + 86400000),
      startTime: '09:00',
      endTime: '10:00',
      purpose: 'Cancelable',
      status: 'Pending'
    });

    const res = await request(app)
      .delete(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('Cancelled');
  });

  it('creates cab booking in development mode when fleet is initially empty', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({ role: 'Student' });
    process.env.NODE_ENV = 'development';

    const requestedTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/bookings/cab')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pickupLocation: 'Main Gate',
        dropLocation: 'Library',
        requestedTime
      })
      .expect(200);

    expect(res.body.booking.type).toBe('cab');
    expect(res.body.booking.status).toBe('Confirmed');
    expect(res.body.cab.id).toContain('DEV-CAB-');

    const persistedCab = await Cab.findOne({ id: res.body.cab.id });
    expect(persistedCab).toBeTruthy();
    expect(persistedCab.isAvailable).toBe(false);
  });
});
