// ชั้น HTTP: แปลง request เป็นการเรียก service แล้วห่อคำตอบ
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.json({ ok: true, data });
  }),

  me: asyncHandler(async (req, res) => {
    const data = await authService.me(req.user.sub);
    res.json({ ok: true, data });
  }),
};
