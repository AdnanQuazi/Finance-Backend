import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { users } from '../src/db/schema.js';

describe('Auth Integration Tests', () => {
  const testUser = {
    name: 'Integration Test User',
    email: 'auth_test@finance.com',
    password: 'Password123!',
    role: 'viewer',
    status: 'active',
  };

  let token = '';

  beforeAll(async () => {
    // 1. Clean up user if already exists from a previous bad run
    await db.delete(users).where(eq(users.email, testUser.email));

    // 2. Seed the test user into the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    await db.insert(users).values({
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      role: testUser.role,
      status: testUser.status,
    });
  });

  afterAll(async () => {
    // 1. Clean up seeded data to leave test DB pristine
    await db.delete(users).where(eq(users.email, testUser.email));
    
    // (Note: Removed 'await pool.end()' since neon-http serverless driver disables persistent TCP pools)
  });

  describe('POST /auth/login', () => {
    it('should successfully log in with valid credentials and return a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined(); // Should not leak password hash
      
      // Save for subsequent GET /auth/me tests
      token = res.body.data.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should reject login with missing fields (Zod Validation Error)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        });

      expect(res.status).toBe(400); 
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /auth/me', () => {
    it('should fetch the current user profile when given a valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`); // Injected token from valid login

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.name).toBe(testUser.name);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should deny access if no token is provided', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should deny access if an expired or invalid token is provided', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALIDTOKEN.SIGNATURE');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
