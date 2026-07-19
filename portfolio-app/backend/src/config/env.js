// อ่านและตรวจค่า environment ทั้งหมดที่จุดเดียว
// ถ้าค่าไหนขาด ให้แอปตายตั้งแต่ตอนเปิด ดีกว่าไปพังตอนมีผู้ใช้จริง
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'ต้องตั้งค่า DATABASE_URL'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET ต้องยาวอย่างน้อย 24 ตัวอักษร'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('ตั้งค่า environment ไม่ครบ:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  isProd: parsed.data.NODE_ENV === 'production',
};
