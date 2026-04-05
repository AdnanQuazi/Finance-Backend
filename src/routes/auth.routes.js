import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authController from '../controllers/auth.controller.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authRateLimiter, authenticate, asyncHandler(authController.getMe));

export default router;
