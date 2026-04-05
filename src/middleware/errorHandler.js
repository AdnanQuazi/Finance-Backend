import { ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues[0].message,
        details: err.issues.map(e => ({ path: e.path, message: e.message }))
      }
    });
  }

  const pgErrorMap = {
    '23505': { status: 409, code: 'CONFLICT', message: 'Resource already exists.' },
    '23514': { status: 400, code: 'VALIDATION_ERROR', message: 'Data constraint violated.' },
    '23503': { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid reference.' },
  };

  if (err.code && pgErrorMap[err.code]) {
    const { status, code, message } = pgErrorMap[err.code];
    return errorResponse(res, status, code, message);
  }

  const statusCode = err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'An unexpected error occurred.' : err.message;

  return errorResponse(res, statusCode, errorCode, message);
};
