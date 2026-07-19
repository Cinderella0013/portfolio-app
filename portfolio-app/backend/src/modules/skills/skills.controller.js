import { asyncHandler } from '../../utils/asyncHandler.js';
import { skillsService } from './skills.service.js';

export const skillsController = {
  list: asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: await skillsService.list() });
  }),
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ ok: true, data: await skillsService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await skillsService.update(req.params.id, req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await skillsService.remove(req.params.id);
    res.status(204).end();
  }),
};
