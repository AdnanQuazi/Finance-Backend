import { Router } from 'express';
import * as recordController from '../controllers/record.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { idempotencyCheck } from '../middleware/idempotency.js';
import {
  createRecordSchema,
  updateRecordSchema,
  getRecordsQuerySchema,
  recordIdParamSchema
} from '../validators/record.validator.js';

const router = Router();

router.use(authenticate);

// Viewers and above
router.get('/', authorize(['viewer', 'analyst', 'manager', 'admin']), validate(getRecordsQuerySchema), recordController.getRecords);
router.get('/:id', authorize(['viewer', 'analyst', 'manager', 'admin']), validate(recordIdParamSchema), recordController.getRecordById);

// Managers and above
router.post('/', authorize(['manager', 'admin']), idempotencyCheck, validate(createRecordSchema), recordController.createRecord);
router.patch('/:id', authorize(['manager', 'admin']), validate(updateRecordSchema), recordController.updateRecord);
router.delete('/:id', authorize(['manager', 'admin']), validate(recordIdParamSchema), recordController.softDeleteRecord);

// Admins only
router.delete('/:id/hard', authorize(['admin']), validate(recordIdParamSchema), recordController.hardDeleteRecord);

export default router;
