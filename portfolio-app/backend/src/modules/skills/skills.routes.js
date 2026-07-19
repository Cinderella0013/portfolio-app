import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { skillSchema, skillPatchSchema } from './skills.schema.js';
import { skillsController } from './skills.controller.js';

const router = Router();

router.get('/', skillsController.list);
router.post('/', requireAuth, validate(skillSchema), skillsController.create);
router.patch('/:id', requireAuth, validate(skillPatchSchema), skillsController.update);
router.delete('/:id', requireAuth, skillsController.remove);

export default router;
