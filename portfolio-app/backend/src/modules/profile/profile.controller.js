import { asyncHandler } from '../../utils/asyncHandler.js';
import { profileService } from './profile.service.js';

export const profileController = {
  get: asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: await profileService.get() });
  }),

  update: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await profileService.upsert(req.body) });
  }),
};
