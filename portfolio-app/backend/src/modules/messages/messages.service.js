import crypto from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

// เก็บ IP แบบแฮชไว้ดูรูปแบบสแปม โดยไม่เก็บ IP จริง
const hashIp = (ip) =>
  ip ? crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32) : null;

export const messagesService = {
  create({ website, ...data }, ip) {
    return prisma.message.create({ data: { ...data, ipHash: hashIp(ip) } });
  },

  list({ unreadOnly = false } = {}) {
    return prisma.message.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },

  async markRead(id, isRead) {
    await this.ensureExists(id);
    return prisma.message.update({ where: { id }, data: { isRead } });
  },

  async remove(id) {
    await this.ensureExists(id);
    await prisma.message.delete({ where: { id } });
  },

  async ensureExists(id) {
    const found = await prisma.message.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw ApiError.notFound('ไม่พบข้อความที่ระบุ');
  },
};
