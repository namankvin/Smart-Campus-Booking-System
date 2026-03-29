const request = require('supertest');

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

  it('creates a new user from a valid Google token and forces Student role', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'new.user@test.edu',
        name: 'New User',
        picture: 'https://example.com/photo.png'
      })
    });

    const { app } = createAppServer();

    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ credential: 'valid-token', role: 'Admin' })
      .expect(200);

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: 'test-google-client-id'
    });
    expect(res.body.user).toMatchObject({
      email: 'new.user@test.edu',
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

  it('returns 403 when institutional domain does not match', async () => {
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
      .send({ credential: 'domain-mismatch-token' })
      .expect(403);

    expect(res.body.error).toContain('@test.edu');
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