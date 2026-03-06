const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test Student',
    email: 'testauth@university.edu',
    password: 'Password123!',
    role: 'student',
    profile: {
      student: {
        department: 'Computer Science',
        graduationYear: 2026
      }
    }
  };

  it('should register a new student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toEqual(testUser.email);
  });

  it('should login an existing user', async () => {
    // Create the test user using the register endpoint to ensure proper hashing
    await request(app)
      .post('/api/auth/register')
      .send({
        name: testUser.name,
        email: 'testlogin@university.edu',
        password: testUser.password,
        role: testUser.role,
        profile: testUser.profile
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testlogin@university.edu',
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testauth@university.edu',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
