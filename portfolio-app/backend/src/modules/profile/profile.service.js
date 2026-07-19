import { prisma } from '../../config/prisma.js';

const PROFILE_ID = 'main';

const FALLBACK = {
  id: PROFILE_ID,
  fullName: 'ยังไม่ได้ตั้งชื่อ',
  headline: 'เข้าหลังบ้านเพื่อกรอกข้อมูลโปรไฟล์',
  bio: '',
};

export const profileService = {
  async get() {
    return (await prisma.profile.findUnique({ where: { id: PROFILE_ID } })) ?? FALLBACK;
  },

  // โปรไฟล์มีแถวเดียวเสมอ จึงใช้ upsert แทน create/update แยกกัน
  async upsert(data) {
    const clean = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]),
    );
    return prisma.profile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, ...clean },
      update: clean,
    });
  },
};
