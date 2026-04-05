import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import app from '../src/app.js';
import { db } from '../src/config/db.js';
import { users } from '../src/db/schema.js';

describe('User Integration Tests', () => {
  const adminUser = {
    name: 'Admin User',
    email: 'admin_test@finance.com',
    password: 'Password123!',
    role: 'admin',
    status: 'active',
  };

  const testUser = {
    name: 'Regular User',
    email: 'regular_test@finance.com',
    password: 'Password123!',
    role: 'viewer',
    status: 'active',
  };

  let adminToken = '';
  let targetedUserId = '';

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, adminUser.email));
    await db.delete(users).where(eq(users.email, testUser.email));

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, salt);
    
    await db.insert(users).values({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedAdminPassword,
      role: adminUser.role,
      status: adminUser.status,
    });

    const res = await request(app).post('/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });
    adminToken = res.body.data.token;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, adminUser.email));
    await db.delete(users).where(eq(users.email, testUser.email));
    if (targetedUserId) {
        await db.delete(users).where(eq(users.id, targetedUserId));
    }
  });

  it('Admin should be able to create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Test User',
        email: 'new_target@finance.com',
        password: 'Password123!',
        role: 'manager'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.role).toBe('manager');
    targetedUserId = res.body.data.id;
  });

  it('Admin should be able to get all users', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some(u => u.email === adminUser.email)).toBe(true);
    expect(res.body.data.some(u => u.id === targetedUserId)).toBe(true);
  });

  it('Admin should be able to update user role', async () => {
    const res = await request(app)
      .patch(`/users/${targetedUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: 'analyst'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('analyst');
  });

  it('Admin should be able to update user status', async () => {
    const res = await request(app)
      .patch(`/users/${targetedUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'inactive'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('inactive');
  });

  it('Admin should be able to delete user', async () => {
    const res = await request(app)
      .delete(`/users/${targetedUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('A standard user should not be able to get users list (RBAC check)', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testUser.password, salt);
    
    await db.insert(users).values({
      name: testUser.name,
      email: testUser.email,
      password: hash,
      role: testUser.role,
      status: testUser.status,
    });

    const loginRes = await request(app).post('/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    
    const regularToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Should return 400 when missing required fields on user creation', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Email' }); // Missing email and password
      
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Should return 400 when user ID is not a valid UUID', async () => {
    const res = await request(app)
      .patch('/users/invalid-uuid-string/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'analyst' });
      
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Should return 409 when creating a user with an existing email', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Email User',
        email: adminUser.email, // using an already existing email
        password: 'Password123!',
      });
      
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('Should return 404 when updating non-existent user', async () => {
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`/users/${dummyId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'analyst' });
      
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });


  it('Should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get('/users');
      // No Authorization header set
      
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
  
});