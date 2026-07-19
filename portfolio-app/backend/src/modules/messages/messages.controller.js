import { asyncHandler } from '../../utils/asyncHandler.js';
import { messagesService } from './messages.service.js';

export const messagesController = {
  create: asyncHandler(async (req, res) => {
    await messagesService.create(req.body, req.ip);
    // ไม่ส่งข้อมูลที่บันทึกกลับไป หน้าบ้านแค่ต้องรู้ว่าส่งถึงแล้ว
    res.status(201).json({ ok: true, data: { message: 'ส่งข้อความเรียบร้อยแล้ว' } });
  }),
  list: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await messagesService.list({ unreadOnly: req.query.unread === 'true' }) });
  }),
  markRead: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await messagesService.markRead(req.params.id, req.body.isRead !== false) });
  }),
  remove: asyncHandler(async (req, res) => {
    await messagesService.remove(req.params.id);
    res.status(204).end();
  }),
};
