import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { trendsSchema } from '../validators/dashboard.validator.js';

const router = Router();

// Dashboard strictly requires authentication before hitting any route
router.use(authenticate);

router.get(
  '/summary', 
  authorize(['viewer', 'analyst', 'manager', 'admin']), 
  asyncHandler(dashboardController.getSummary)
);

router.get(
  '/activity', 
  authorize(['viewer', 'analyst', 'manager', 'admin']), 
  asyncHandler(dashboardController.getActivity)
);

// Analyst level and above 
router.get(
  '/categories', 
  authorize(['analyst', 'manager', 'admin']), 
  asyncHandler(dashboardController.getCategories)
);

router.get(
  '/trends', 
  authorize(['analyst', 'manager', 'admin']), 
  validate(trendsSchema), 
  asyncHandler(dashboardController.getTrends)
);

export default router;
