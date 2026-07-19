import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { updateProfileSchema } from './profile.schema.js';
import { profileController } from './profile.controller.js';

const router = Router();

router.get('/', profileController.get);                                        // สาธารณะ
router.put('/', requireAuth, validate(updateProfileSchema), profileController.update); // แอดมิน

export default router;
