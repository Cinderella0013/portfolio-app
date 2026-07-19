// จุดเริ่มโปรแกรม — เปิดพอร์ตและปิดระบบอย่างเรียบร้อยเมื่อถูกสั่งหยุด
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`API พร้อมใช้งานที่ http://localhost:${env.PORT}/api  [${env.NODE_ENV}]`);
});

const shutdown = async (signal) => {
  console.log(`\nได้รับสัญญาณ ${signal} กำลังปิดระบบ`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
