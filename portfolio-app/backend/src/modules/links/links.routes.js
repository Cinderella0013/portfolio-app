import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { linksService } from './links.service.js';

const createLinkSchema = z.object({
  url: z.string().url('URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย http:// หรือ https://'),
  code: z.string().regex(/^[a-zA-Z0-9_-]{3,30}$/, 'ชื่อสั้นใช้ได้เฉพาะ a-z 0-9 _ - ยาว 3-30 ตัว')
    .optional().or(z.literal('').transform(() => undefined)),
});

const router = Router();

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  res.json({ ok: true, data: await linksService.list() });
}));

router.post('/', requireAuth, validate(createLinkSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await linksService.create(req.body) });
}));

router.delete('/:code', requireAuth, asyncHandler(async (req, res) => {
  await linksService.remove(req.params.code);
  res.status(204).end();
}));

export default router;

// ทางเข้าสาธารณะ /s/:code — แยก export ให้ app.js ไป mount นอก /api
export const redirectHandler = asyncHandler(async (req, res) => {
  const url = await linksService.resolve(req.params.code);
  if (!url) return res.status(404).send('ไม่พบลิงก์นี้');
  res.redirect(302, url);
});
