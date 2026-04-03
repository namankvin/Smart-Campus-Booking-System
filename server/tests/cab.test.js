const request = require('supertest');

const { createAppServer } = require('../app');
const Cab = require('../models/Cab');
const Booking = require('../models/Booking');
const { createUserAndToken } = require('./helpers');

describe('Cab API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.NODE_ENV = 'development';
  });

  it('blocks cab operators from creating cabs', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({
      email: 'operator-1@test.edu',
      role: 'Cab Operator',
      name: 'Operator One'
    });

    const res = await request(app)
      .post('/api/cabs')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'CAB-401', driver: 'Driver One', capacity: 4 })
      .expect(403);

    expect(res.body.error).toBe('Insufficient permissions');
  });

  it('allows only admin to create cabs', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({
      email: 'admin-cab@test.edu',
      role: 'Admin',
      name: 'Admin User'
    });

    const res = await request(app)
      .post('/api/cabs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'CAB-402',
        driver: 'Driver Two',
        capacity: 6,
        routeName: 'Academic Loop',
        routeStops: ['Main Gate', 'Library', 'Hostel Circle']
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 'CAB-402',
      driver: 'Driver Two',
      capacity: 6,
      routeName: 'Academic Loop'
    });
  });

  it('returns operator-specific stats and creates a development dummy cab when none is assigned', async () => {
    const { app } = createAppServer();
    const { token } = await createUserAndToken({
      email: 'operator-dummy@test.edu',
      role: 'Cab Operator',
      name: 'Dummy Operator'
    });

    const res = await request(app)
      .get('/api/cabs/operator/my-stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.cab).toBeTruthy();
    expect(res.body.cab.id).toContain('DEV-CAB-');
    expect(res.body.cab.routeName).toBe('North Campus Loop');
    expect(res.body.cab.routeStops).toEqual([
      'Main Gate',
      'Academic Block',
      'Library',
      'Hostel Circle',
      'Sports Complex'
    ]);
    expect(res.body.stats).toEqual({
      totalAssignedRides: 0,
      upcomingRides: 0,
      completedRides: 0
    });
  });

  it('shows only the logged-in operator cab statistics', async () => {
    const { app } = createAppServer();
    const operatorA = await createUserAndToken({
      email: 'operator-a@test.edu',
      role: 'Cab Operator',
      name: 'Operator A'
    });
    const operatorB = await createUserAndToken({
      email: 'operator-b@test.edu',
      role: 'Cab Operator',
      name: 'Operator B'
    });
    const student = await createUserAndToken({
      email: 'student-cab@test.edu',
      role: 'Student',
      name: 'Student Cab User'
    });

    const cabA = await Cab.create({
      id: 'CAB-501',
      driver: 'Driver A',
      assignedOperator: operatorA.user._id,
      capacity: 4,
      routeName: 'Hostel Loop',
      routeStops: ['Hostel Circle', 'Main Gate']
    });

    await Cab.create({
      id: 'CAB-502',
      driver: 'Driver B',
      assignedOperator: operatorB.user._id,
      capacity: 4,
      routeName: 'Library Loop',
      routeStops: ['Library', 'Main Gate']
    });

    await Booking.insertMany([
      {
        user: student.user._id,
        type: 'cab',
        cabId: cabA.id,
        status: 'Confirmed',
        date: new Date(Date.now() + 60 * 60 * 1000),
        pickupLocation: 'Hostel Circle',
        dropLocation: 'Main Gate'
      },
      {
        user: student.user._id,
        type: 'cab',
        cabId: cabA.id,
        status: 'Completed',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        pickupLocation: 'Main Gate',
        dropLocation: 'Library'
      },
      {
        user: student.user._id,
        type: 'cab',
        cabId: 'CAB-502',
        status: 'Confirmed',
        date: new Date(Date.now() + 2 * 60 * 60 * 1000),
        pickupLocation: 'Library',
        dropLocation: 'Main Gate'
      }
    ]);

    const res = await request(app)
      .get('/api/cabs/operator/my-stats')
      .set('Authorization', `Bearer ${operatorA.token}`)
      .expect(200);

    expect(res.body.cab.id).toBe('CAB-501');
    expect(res.body.stats).toEqual({
      totalAssignedRides: 2,
      upcomingRides: 1,
      completedRides: 1
    });
  });
});
