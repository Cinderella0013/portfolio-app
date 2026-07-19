import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

export const experiencesService = {
  list({ type } = {}) {
    return prisma.experience.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    });
  },

  create(data) {
    return prisma.experience.create({ data });
  },

  async update(id, data) {
    await this.ensureExists(id);
    return prisma.experience.update({ where: { id }, data });
  },

  async remove(id) {
    await this.ensureExists(id);
    await prisma.experience.delete({ where: { id } });
  },

  async ensureExists(id) {
    const found = await prisma.experience.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw ApiError.notFound('ไม่พบรายการประวัติที่ระบุ');
  },
};
