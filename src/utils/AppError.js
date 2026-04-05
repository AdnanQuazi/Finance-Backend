export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
