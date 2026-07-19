// ใส่ข้อมูลตั้งต้น: บัญชีแอดมิน 1 คน + ตัวอย่างเนื้อหาให้เว็บไม่ว่างเปล่า
// รันด้วย: npm run db:seed  (รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ต้องตั้งค่า ADMIN_EMAIL และ ADMIN_PASSWORD ในไฟล์ .env ก่อน');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD ต้องยาวอย่างน้อย 8 ตัวอักษร');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, passwordHash, name: ADMIN_NAME },
    update: { passwordHash, name: ADMIN_NAME },
  });
  console.log(`สร้างบัญชีแอดมินแล้ว: ${ADMIN_EMAIL}`);

  await prisma.profile.upsert({
    where: { id: 'main' },
    create: {
      id: 'main',
      fullName: ADMIN_NAME,
      headline: 'Full-stack Developer',
      bio: 'เข้าหลังบ้านที่ /admin.html เพื่อแก้ข้อความส่วนนี้',
      location: 'กรุงเทพฯ ประเทศไทย',
      email: ADMIN_EMAIL,
    },
    update: {},
  });

  if ((await prisma.skill.count()) === 0) {
    await prisma.skill.createMany({
      data: [
        { name: 'TypeScript', category: 'language',  level: 5, sortOrder: 1 },
        { name: 'React',      category: 'framework', level: 5, sortOrder: 2 },
        { name: 'Node.js',    category: 'framework', level: 4, sortOrder: 3 },
        { name: 'PostgreSQL', category: 'tool',      level: 4, sortOrder: 4 },
        { name: 'Docker',     category: 'tool',      level: 3, sortOrder: 5 },
      ],
    });
    console.log('ใส่ทักษะตัวอย่างแล้ว');
  }

  if ((await prisma.experience.count()) === 0) {
    await prisma.experience.createMany({
      data: [
        {
          type: 'WORK',
          title: 'Senior Frontend Developer',
          org: 'ชื่อบริษัท จำกัด',
          startDate: new Date('2023-01-01'),
          endDate: null,
          bullets: ['ดูแลหน้าเว็บหลักที่มีผู้ใช้ราว 50,000 คนต่อเดือน', 'ลดเวลาโหลดหน้าแรกจาก 4.2 เหลือ 1.3 วินาที'],
          sortOrder: 1,
        },
        {
          type: 'EDUCATION',
          title: 'วิทยาศาสตรบัณฑิต สาขาวิทยาการคอมพิวเตอร์',
          org: 'ชื่อมหาวิทยาลัย',
          startDate: new Date('2017-06-01'),
          endDate: new Date('2021-05-31'),
          bullets: ['โปรเจกต์จบเป็นระบบจองห้องเรียนที่คณะใช้จริง'],
          sortOrder: 2,
        },
      ],
    });
    console.log('ใส่ประวัติตัวอย่างแล้ว');
  }

  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({
      data: [
        {
          slug: 'queue-system',
          title: 'ระบบจัดคิวร้านอาหาร',
          summary: 'ลูกค้าสแกน QR แล้วรอที่ไหนก็ได้ ใช้จริงใน 12 สาขา',
          coverEmoji: '{ }',
          tags: ['Next.js', 'Supabase'],
          featured: true,
          sortOrder: 1,
        },
        {
          slug: 'slip-reader',
          title: 'เครื่องมืออ่านสลิปโอนเงิน',
          summary: 'แปลงสลิปเป็นตารางบัญชี ประหยัดเวลาทีมการเงิน 6 ชั่วโมงต่อสัปดาห์',
          coverEmoji: '</>',
          tags: ['Python', 'FastAPI', 'OCR'],
          sortOrder: 2,
        },
      ],
    });
    console.log('ใส่โปรเจกต์ตัวอย่างแล้ว');
  }
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
