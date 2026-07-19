import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { experienceSchema, experiencePatchSchema } from './experiences.schema.js';
import { experiencesController } from './experiences.controller.js';

const router = Router();

router.get('/', experiencesController.list);
router.post('/', requireAuth, validate(experienceSchema), experiencesController.create);
router.patch('/:id', requireAuth, validate(experiencePatchSchema), experiencesController.update);
router.delete('/:id', requireAuth, experiencesController.remove);

export default router;
