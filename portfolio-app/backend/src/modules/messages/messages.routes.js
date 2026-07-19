import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createMessageSchema } from './messages.schema.js';
import { messagesController } from './messages.controller.js';

const router = Router();

// ส่งได้ 5 ข้อความต่อชั่วโมงต่อ IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { message: 'ส่งข้อความบ่อยเกินไป ลองใหม่ในอีก 1 ชั่วโมง' } },
});

router.post('/', contactLimiter, validate(createMessageSchema), messagesController.create);
router.get('/', requireAuth, messagesController.list);
router.patch('/:id/read', requireAuth, messagesController.markRead);
router.delete('/:id', requireAuth, messagesController.remove);

export default router;
