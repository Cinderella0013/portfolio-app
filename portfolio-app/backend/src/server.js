// จุดเริ่มโปรแกรม — เปิดพอร์ตและปิดระบบอย่างเรียบร้อยเมื่อถูกสั่งหยุด
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

// ดึง Port จาก Railway อัตโนมัติเป็นอันดับแรก
const port = process.env.PORT || env.PORT || 4000;

// ระบุ '0.0.0.0' เพื่อเปิดรับการเชื่อมต่อจากภายนอก
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API พร้อมใช้งานที่พอร์ต ${port}  [${env.NODE_ENV}]`);
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