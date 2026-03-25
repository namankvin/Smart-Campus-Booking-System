const request = require('supertest');
const { createAppServer } = require('../app');
const Classroom = require('../models/Classroom');
const Booking = require('../models/Booking');
const { createUserAndToken } = require('./helpers');

describe('Admin API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  it('allows admin to approve pending booking', async () => {
    const { app } = createAppServer();
    const { token: adminToken } = await createUserAndToken({ role: 'Admin', email: 'admin@test.edu' });
    const { user: student } = await createUserAndToken({ role: 'Student', email: 'student2@test.edu' });

    const classroom = await Classroom.create({
      name: 'A-201',
      capacity: 60,
      location: 'Academic Block'
    });

    const booking = await Booking.create({
      user: student._id,
      type: 'classroom',
      classroom: classroom._id,
      date: new Date(Date.now() + 86400000),
      startTime: '10:00',
      endTime: '11:00',
      purpose: 'Need approval',
      status: 'Pending'
    });

    const res = await request(app)
      .post(`/api/admin/bookings/${booking._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe('Approved');
  });

  it('blocks non-admin from pending-bookings endpoint', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({ role: 'Student' });

    await request(app)
      .get('/api/admin/bookings/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
