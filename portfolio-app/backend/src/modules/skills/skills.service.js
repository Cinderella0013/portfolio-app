import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

export const skillsService = {
  list() {
    return prisma.skill.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  },

  create(data) {
    return prisma.skill.create({ data });
  },

  async update(id, data) {
    await this.ensureExists(id);
    return prisma.skill.update({ where: { id }, data });
  },

  async remove(id) {
    await this.ensureExists(id);
    await prisma.skill.delete({ where: { id } });
  },

  async ensureExists(id) {
    const found = await prisma.skill.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw ApiError.notFound('ไม่พบทักษะที่ระบุ');
  },
};
