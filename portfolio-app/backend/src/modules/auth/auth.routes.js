import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { loginSchema } from './auth.schema.js';
import { authController } from './auth.controller.js';

const router = Router();

// จำกัดการล็อกอิน 10 ครั้งต่อ 15 นาทีต่อ IP กันการสุ่มรหัสผ่าน
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { message: 'พยายามเข้าสู่ระบบบ่อยเกินไป ลองใหม่ใน 15 นาที' } },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
