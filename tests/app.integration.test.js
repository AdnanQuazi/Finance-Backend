import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('App Middleware & Rate Limiting', () => {
  it('should return 404 NOT_FOUND for non-existent routes', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should enforce rate limiting after exceeding the limit', async () => {
    let hitRateLimit = false;
    let lastResponse;

    for (let i = 0; i < 12; i++) {
        // we hit a fake endpoint or auth/login
      lastResponse = await request(app).post('/auth/login').send({
        email: 'dummy@finance.com',
        password: 'password',
      });

      if (lastResponse.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    expect(hitRateLimit).toBe(true);
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.success).toBe(false);
    expect(lastResponse.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
