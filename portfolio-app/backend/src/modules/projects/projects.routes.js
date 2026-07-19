import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { validate } from '../../middlewares/validate.js';
import { projectSchema, projectPatchSchema } from './projects.schema.js';
import { projectsController } from './projects.controller.js';

const router = Router();

router.get('/', optionalAuth, projectsController.list);
router.get('/:slug', projectsController.getBySlug);
router.post('/', requireAuth, validate(projectSchema), projectsController.create);
router.patch('/:id', requireAuth, validate(projectPatchSchema), projectsController.update);
router.delete('/:id', requireAuth, projectsController.remove);

export default router;
