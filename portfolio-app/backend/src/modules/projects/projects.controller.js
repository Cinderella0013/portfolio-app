import { asyncHandler } from '../../utils/asyncHandler.js';
import { projectsService } from './projects.service.js';

export const projectsController = {
  list: asyncHandler(async (req, res) => {
    // req.user จะมีค่าก็ต่อเมื่อผ่าน requireAuth มาแล้ว
    const includeDrafts = Boolean(req.user) && req.query.includeDrafts === 'true';
    res.json({ ok: true, data: await projectsService.list({ includeDrafts }) });
  }),
  getBySlug: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await projectsService.getBySlug(req.params.slug) });
  }),
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ ok: true, data: await projectsService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await projectsService.update(req.params.id, req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await projectsService.remove(req.params.id);
    res.status(204).end();
  }),
};
