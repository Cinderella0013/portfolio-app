import { z } from 'zod';

export const projectSchema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อโปรเจกต์').max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง').max(80).optional(),
  summary: z.string().min(1, 'กรุณากรอกคำอธิบายสั้น').max(300),
  description: z.string().max(8000).nullish(),
  coverEmoji: z.string().max(8).default('{ }'),
  tags: z.array(z.string().max(30)).max(12).default([]),
  repoUrl: z.string().url('ต้องเป็น URL ที่ถูกต้อง').nullish().or(z.literal('')),
  liveUrl: z.string().url('ต้องเป็น URL ที่ถูกต้อง').nullish().or(z.literal('')),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const projectPatchSchema = projectSchema.partial();
