import { z } from 'zod';

export const createMessageSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(120),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  body: z.string().min(10, 'ข้อความต้องยาวอย่างน้อย 10 ตัวอักษร').max(4000),
  // กับดักบอท: ฟิลด์นี้ซ่อนไว้ในฟอร์ม คนจริงจะไม่กรอก
  website: z.string().max(0, 'ตรวจพบการส่งอัตโนมัติ').optional(),
});
