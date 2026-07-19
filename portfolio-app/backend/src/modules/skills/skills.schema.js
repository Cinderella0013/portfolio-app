import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อทักษะ').max(60),
  category: z.enum(['language', 'framework', 'tool', 'other']).default('other'),
  level: z.number().int().min(1).max(5).default(3),
  sortOrder: z.number().int().default(0),
});

export const skillPatchSchema = skillSchema.partial();
export const idSchema = z.object({ id: z.string().min(1) });
