import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createUserSchema,
  updateRoleSchema,
  updateStatusSchema,
  userIdParamSchema
} from '../validators/user.validator.js';

const router = Router();


router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', userController.getUsers);

router.post(
  '/',
  validate(createUserSchema),
  userController.createUser
);

router.patch(
  '/:id/role',
  validate(updateRoleSchema),
  userController.updateRole
);

router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  userController.updateStatus
);

router.delete(
  '/:id',
  validate(userIdParamSchema),
  userController.deleteUser
);

export default router;
