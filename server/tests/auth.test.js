const request = require('supertest');
const User = require('../models/User');
const Cab = require('../models/Cab');

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken
  }))
}));

const { createAppServer } = require('../app');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.NODE_ENV = 'development';
    delete process.env.INSTITUTIONAL_EMAIL_DOMAIN;
  });

  it('creates a new student user from a valid institutional Google token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'new.user@student.nitw.ac.in',
        name: 'New User',
        picture: 'https://example.com/photo.png'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'valid-token', role: 'Student' })
      .expect(200);

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: 'test-google-client-id'
    });
    expect(res.body.user).toMatchObject({
      email: 'new.user@student.nitw.ac.in',
      name: 'New User',
      role: 'Student'
    });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it('returns 401 when Google payload is invalid', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-2'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'invalid-payload-token' })
      .expect(401);

    expect(res.body.error).toBe('Invalid Google token');
  });

  it('returns 403 when institutional domain does not match for student/faculty sign-in', async () => {
    process.env.INSTITUTIONAL_EMAIL_DOMAIN = 'test.edu';
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-3',
        email: 'user@gmail.com',
        name: 'External User'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'domain-mismatch-token', role: 'Student' })
      .expect(403);

    expect(res.body.error).toContain('@test.edu');
  });

  it('returns 403 for non-NITW email when student/faculty domain override is not configured', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-4',
        email: 'user@gmail.com',
        name: 'External User'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'non-nitw-token', role: 'Student' })
      .expect(403);

    expect(res.body.error).toContain('.nitw.ac.in');
  });

  it('allows only hardcoded admin email for admin login', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-admin',
        email: 'not-allowed-admin@gmail.com',
        name: 'Blocked Admin'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'admin-blocked-token', role: 'Admin' })
      .expect(403);

    expect(res.body.error).toContain('authorized email');
  });

  it('falls back to Guest for unmapped vendor login', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-vendor',
        email: 'vendor.unmapped@gmail.com',
        name: 'Unmapped Vendor'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'vendor-unmapped-token', role: 'Vendor' })
      .expect(200);

    expect(res.body.user.role).toBe('Guest');
  });

  it('allows mapped vendor email to sign in as vendor', async () => {
    await User.create({
      googleId: 'existing-vendor-sub',
      email: 'vendor.mapped@gmail.com',
      name: 'Mapped Vendor',
      role: 'Vendor',
      assignedRestaurant: 'Taaza Tiffins'
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'existing-vendor-sub',
        email: 'vendor.mapped@gmail.com',
        name: 'Mapped Vendor'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'vendor-mapped-token', role: 'Vendor' })
      .expect(200);

    expect(res.body.user.role).toBe('Vendor');
    expect(res.body.user.assignedRestaurant).toBe('Taaza Tiffins');
  });

  it('allows mapped cab operator email to sign in as cab operator', async () => {
    const operator = await User.create({
      googleId: 'existing-cab-sub',
      email: 'cab.operator@gmail.com',
      name: 'Mapped Cab Operator',
      role: 'Cab Operator'
    });

    await Cab.create({
      id: 'CAB-991',
      assignedOperator: operator._id,
      driver: 'Mapped Cab Operator',
      capacity: 4,
      routeName: 'North Campus Loop',
      routeStops: ['Main Gate', 'Library']
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'existing-cab-sub',
        email: 'cab.operator@gmail.com',
        name: 'Mapped Cab Operator'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'cab-mapped-token', role: 'Cab Operator' })
      .expect(200);

    expect(res.body.user.role).toBe('Cab Operator');
  });

  it('allows a guest user to sign in as student with institutional email', async () => {
    await User.create({
      googleId: 'guest-sub',
      email: 'guest.user@student.nitw.ac.in',
      name: 'Guest User',
      role: 'Guest'
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'guest-sub',
        email: 'guest.user@student.nitw.ac.in',
        name: 'Guest User'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'guest-to-student-token', role: 'Student' })
      .expect(200);

    expect(res.body.user.role).toBe('Student');
  });

  it('allows quick development login in non-production mode', async () => {
    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/dev-login')
      .send({ email: 'dev.student@test.edu', name: 'Dev Student', role: 'Student' })
      .expect(200);

    expect(res.body.user).toMatchObject({
      email: 'dev.student@test.edu',
      role: 'Student'
    });
    expect(typeof res.body.token).toBe('string');
  });

  it('blocks development login in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/dev-login')
      .send({ email: 'dev.student@test.edu', role: 'Student' })
      .expect(403);

    expect(res.body.error).toBe('Development login is disabled in production');
  });
});