/**
 * Auth Endpoint Tests
 * Integration tests that hit the real Express app backed by MongoMemoryServer
 * (configured in tests/setup.js).
 *
 * Covers endpoints not fully tested by tests/integration/auth.test.js:
 *   - Duplicate-email registration error
 *   - Protected GET /api/auth/profile (valid token vs. missing token)
 */

const request = require('supertest');
const app     = require('../app');

const baseUser = {
  name: 'Unit Test User',
  email: 'unit-auth@example.edu',
  password: 'StrongPass123!',
  role: 'student',
  profile: {
    student: { department: 'Computer Science', graduationYear: 2026 }
  }
};

describe('Auth Endpoints', () => {
  // ─── POST /api/auth/register ───────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(baseUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', baseUser.email);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return an error when registering with a duplicate email', async () => {
      // First registration succeeds.
      await request(app)
        .post('/api/auth/register')
        .send({ ...baseUser, email: 'duplicate@example.edu' });

      // Second registration with the same email should fail.
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...baseUser, email: 'duplicate@example.edu' });

      expect([400, 409]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...baseUser, email: 'not-an-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /api/auth/login ──────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Ensure the user exists before login tests.
      await request(app)
        .post('/api/auth/register')
        .send({ ...baseUser, email: 'login-test@example.edu' });
    });

    it('should return a token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-test@example.edu', password: baseUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 401 on invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-test@example.edu', password: 'WrongPass999!' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'SomePass123!' });

      expect([401, 400]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when email or password are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-test@example.edu' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/auth/profile ─────────────────────────────────────────────────

  describe('GET /api/auth/profile', () => {
    it('should return 401 without an Authorization header', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for a malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer this-is-not-a-valid-jwt');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with user data for a valid token', async () => {
      // Register and obtain a real JWT.
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ ...baseUser, email: 'profile-test@example.edu' });

      const { token } = registerRes.body.data;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'profile-test@example.edu');
    });
  });
});
