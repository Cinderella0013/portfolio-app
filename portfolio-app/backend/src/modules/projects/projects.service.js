import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

// แปลงชื่อเป็น slug รองรับทั้งไทยและอังกฤษ
const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'project';

export const projectsService = {
  // includeDrafts เปิดเฉพาะตอนเรียกจากหลังบ้าน หน้าบ้านเห็นแค่ที่เผยแพร่แล้ว
  list({ includeDrafts = false } = {}) {
    return prisma.project.findMany({
      where: includeDrafts ? undefined : { published: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async getBySlug(slug) {
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project || !project.published) throw ApiError.notFound('ไม่พบโปรเจกต์นี้');
    return project;
  },

  async create(data) {
    const slug = await this.uniqueSlug(data.slug || slugify(data.title));
    return prisma.project.create({ data: { ...data, slug } });
  },

  async update(id, data) {
    await this.ensureExists(id);
    const patch = { ...data };
    if (patch.slug) patch.slug = await this.uniqueSlug(patch.slug, id);
    return prisma.project.update({ where: { id }, data: patch });
  },

  async remove(id) {
    await this.ensureExists(id);
    await prisma.project.delete({ where: { id } });
  },

  async ensureExists(id) {
    const found = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw ApiError.notFound('ไม่พบโปรเจกต์ที่ระบุ');
  },

  // ถ้า slug ซ้ำให้ต่อท้ายด้วยเลข แทนที่จะโยน error ใส่หน้าผู้ใช้
  async uniqueSlug(base, ignoreId = null) {
    let slug = base;
    let n = 1;
    while (true) {
      const clash = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
      if (!clash || clash.id === ignoreId) return slug;
      slug = `${base}-${++n}`;
    }
  },
};
