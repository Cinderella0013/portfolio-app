import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { chatSchema } from './chat.schema.js';
import { chatService, chatEnabled } from './chat.service.js';

const router = Router();

// จำกัด 30 ข้อความต่อ 15 นาทีต่อ IP กันคนสแปมผลาญโควตา API
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { message: 'คุยเร็วเกินไป พักสักครู่แล้วลองใหม่' } },
});

// หน้าบ้านเช็คก่อนว่าจะโชว์ปุ่มแชทไหม
router.get('/status', (_req, res) => res.json({ ok: true, data: { enabled: chatEnabled } }));

router.post('/', chatLimiter, validate(chatSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: { reply: await chatService.reply(req.body.messages) } });
}));

export default router;
