import { z } from 'zod';

export const experienceSchema = z.object({
  type: z.enum(['WORK', 'EDUCATION']).default('WORK'),
  title: z.string().min(1, 'กรุณากรอกตำแหน่งหรือชื่อหลักสูตร').max(160),
  org: z.string().min(1, 'กรุณากรอกชื่อองค์กรหรือสถาบัน').max(160),
  startDate: z.coerce.date({ invalid_type_error: 'วันที่เริ่มไม่ถูกต้อง' }),
  endDate: z.coerce.date().nullish(),   // ว่างไว้ = ยังทำอยู่
  bullets: z.array(z.string().max(400)).max(10).default([]),
  sortOrder: z.number().int().default(0),
});

export const experiencePatchSchema = experienceSchema.partial();
