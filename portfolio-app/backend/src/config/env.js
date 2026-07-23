// อ่านและตรวจค่า environment ทั้งหมดที่จุดเดียว
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'ต้องตั้งค่า DATABASE_URL'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET ต้องยาวอย่างน้อย 24 ตัวอักษร'),
  JWT_EXPIRES_IN: z.string().default('2h'), // token แอดมินอายุสั้น ถูกขโมยก็ใช้ได้ไม่นาน
  CORS_ORIGINS: z.string().default(''),
  // Google Sheets สำหรับระบบย่อลิงก์ — ไม่ตั้งก็ได้ ฟีเจอร์นั้นจะปิดตัวเอง
  GOOGLE_SA_EMAIL: z.string().optional(),
  GOOGLE_SA_KEY: z.string().optional(),
  SHEETS_ID: z.string().optional(),
  // แชทบอท (OpenAI-compatible เช่น Gen AI KKU) — ไม่ตั้ง CHATBOT_API_KEY ก็ปิดฟีเจอร์
  CHATBOT_API_KEY: z.string().optional(),
  CHATBOT_BASE_URL: z.string().default('https://gen.ai.kku.ac.th/api/v1'),
  CHATBOT_MODEL: z.string().default('gemini-3.5-flash-lite'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const list = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');

  // โยน error แทนการ process.exit เพราะบน serverless การฆ่า process
  // ทำให้เห็นแค่ FUNCTION_INVOCATION_FAILED โดยไม่รู้ว่าค่าไหนขาด
  throw new Error(`ตั้งค่า environment ไม่ครบ:\n${list}`);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  isProd: parsed.data.NODE_ENV === 'production',
  // บน Vercel หน้าบ้านกับ API อยู่โดเมนเดียวกัน จึงไม่ต้องใช้ CORS
  isServerless: Boolean(process.env.VERCEL),
};
