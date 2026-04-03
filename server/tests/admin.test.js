const request = require('supertest');
const { createAppServer } = require('../app');
const Classroom = require('../models/Classroom');
const Booking = require('../models/Booking');
const Cab = require('../models/Cab');
const User = require('../models/User');
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

  it('blocks non-admin from updating user roles', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({ role: 'Student', email: 'student@test.edu' });
    const { user: targetUser } = await createUserAndToken({ role: 'Student', email: 'target@test.edu' });

    await request(app)
      .put(`/api/admin/users/${targetUser._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'Vendor' })
      .expect(403);
  });

  it('allows admin to map vendor user to a restaurant', async () => {
    const { app } = createAppServer();
    const { token: adminToken } = await createUserAndToken({ role: 'Admin', email: 'admin@test.edu' });
    const vendorUser = await User.create({
      googleId: 'vendor-map-1',
      email: 'vendor-map@test.edu',
      name: 'Vendor Mapper',
      role: 'Guest'
    });

    const res = await request(app)
      .put(`/api/admin/users/${vendorUser._id}/vendor-mapping`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ restaurantName: 'Taaza Tiffins' })
      .expect(200);

    expect(res.body.role).toBe('Vendor');
    expect(res.body.assignedRestaurant).toBe('Taaza Tiffins');
  });

  it('allows admin to map cab operator user to a cab', async () => {
    const { app } = createAppServer();
    const { token: adminToken } = await createUserAndToken({ role: 'Admin', email: 'admin@test.edu' });
    const cabUser = await User.create({
      googleId: 'cab-map-1',
      email: 'cab-map@test.edu',
      name: 'Cab Mapper',
      role: 'Guest'
    });

    await Cab.create({
      id: 'CAB-881',
      driver: 'Demo Driver',
      capacity: 4,
      routeName: 'Campus Loop',
      routeStops: ['Main Gate', 'Academic Block']
    });

    const res = await request(app)
      .put(`/api/admin/users/${cabUser._id}/cab-mapping`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cabId: 'CAB-881' })
      .expect(200);

    expect(res.body.user.role).toBe('Cab Operator');
    expect(res.body.cab.id).toBe('CAB-881');
    expect(res.body.cab.assignedOperator.toString()).toBe(cabUser._id.toString());
  });
});
