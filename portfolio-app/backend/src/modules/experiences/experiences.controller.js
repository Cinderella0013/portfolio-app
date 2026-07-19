import { asyncHandler } from '../../utils/asyncHandler.js';
import { experiencesService } from './experiences.service.js';

export const experiencesController = {
  list: asyncHandler(async (req, res) => {
    const type = req.query.type === 'EDUCATION' || req.query.type === 'WORK' ? req.query.type : undefined;
    res.json({ ok: true, data: await experiencesService.list({ type }) });
  }),
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ ok: true, data: await experiencesService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await experiencesService.update(req.params.id, req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await experiencesService.remove(req.params.id);
    res.status(204).end();
  }),
};
