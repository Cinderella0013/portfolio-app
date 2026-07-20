// สารบัญ API ทั้งหมด — อยากรู้ว่าระบบมีอะไรบ้าง ดูไฟล์นี้ไฟล์เดียว
import { Router } from 'express';
import { prisma } from './config/prisma.js';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import skillsRoutes from './modules/skills/skills.routes.js';
import experiencesRoutes from './modules/experiences/experiences.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import linksRoutes from './modules/links/links.routes.js';

const router = Router();

// เปิด /api/health เพื่อดูว่าเซิร์ฟเวอร์ขึ้นและต่อฐานข้อมูลได้จริงหรือไม่
router.get('/health', async (_req, res) => {
  let database = 'ok';
  try {
    await prisma.$runCommandRaw({ ping: 1 }); // MongoDB ไม่มี $queryRaw แบบ SQL
  } catch (err) {
    database = `ต่อฐานข้อมูลไม่ได้: ${err.message.split('\n')[0]}`;
  }
  res.json({ ok: true, data: { status: 'up', database, time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/skills', skillsRoutes);
router.use('/experiences', experiencesRoutes);
router.use('/projects', projectsRoutes);
router.use('/messages', messagesRoutes);
router.use('/links', linksRoutes);

export default router;
