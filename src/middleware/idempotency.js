import { eq, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { idempotencyKeys } from '../db/schema.js';
import { errorResponse } from '../utils/apiResponse.js';

export const idempotencyCheck = async (req, res, next) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'x-idempotency-key header is required');
  }

  const userId = req.user?.id;
  if (!userId) {
    return next(); // Should only happen if auth is missing, handled by auth middleware
  }

  try {
    const existing = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      return res.status(record.responseCode).json(record.responseBody);
    }

    const originalSend = res.json.bind(res);
    res.json = function (body) {
      if (!res.locals.intercepted) {
        res.locals.intercepted = true;
        res.locals.responseBody = body;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          db.insert(idempotencyKeys).values({
            key,
            userId,
            responseCode: res.statusCode,
            responseBody: body,
          }).catch(err => {
            console.error('Failed to save idempotency key:', err);
          });
        }
      }
      return originalSend(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
