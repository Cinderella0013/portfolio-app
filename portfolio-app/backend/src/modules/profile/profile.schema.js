import { z } from 'zod';

const url = z.string().url('ต้องเป็น URL ที่ถูกต้อง').nullish().or(z.literal(''));

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'กรุณากรอกชื่อ').max(120),
  headline: z.string().min(1, 'กรุณากรอกตำแหน่งหรือคำโปรย').max(200),
  bio: z.string().max(4000).default(''),
  location: z.string().max(120).nullish(),
  email: z.string().email('อีเมลไม่ถูกต้อง').nullish().or(z.literal('')),
  phone: z.string().max(40).nullish(),
  githubUrl: url,
  linkedinUrl: url,
  websiteUrl: url,
  avatarUrl: url,
  resumeUrl: url,
});
