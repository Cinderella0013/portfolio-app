// สารบัญ API ทั้งหมด — อยากรู้ว่าระบบมีอะไรบ้าง ดูไฟล์นี้ไฟล์เดียว
import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import skillsRoutes from './modules/skills/skills.routes.js';
import experiencesRoutes from './modules/experiences/experiences.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, data: { status: 'up', time: new Date().toISOString() } }));

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/skills', skillsRoutes);
router.use('/experiences', experiencesRoutes);
router.use('/projects', projectsRoutes);
router.use('/messages', messagesRoutes);

export default router;
