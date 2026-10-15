import { z } from 'zod';

const url = z.string().url('ต้องเป็น URL ที่ถูกต้อง').nullish().or(z.literal(''));
const webUrl = z.string().trim().max(2000).url('ต้องเป็น URL ที่ถูกต้อง').regex(/^https?:\/\//i, 'ใช้ลิงก์ http หรือ https เท่านั้น').nullish().or(z.literal(''));

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'กรุณากรอกชื่อ').max(120),
  headline: z.string().min(1, 'กรุณากรอกตำแหน่งหรือคำโปรย').max(200),
  headlineEn: z.string().max(200).nullish(),
  bio: z.string().max(4000).default(''),
  bioEn: z.string().max(4000).nullish(),
  location: z.string().max(120).nullish(),
  email: z.string().email('อีเมลไม่ถูกต้อง').nullish().or(z.literal('')),
  phone: z.string().max(40).nullish(),
  githubUrl: url,
  linkedinUrl: url,
  websiteUrl: url,
  avatarUrl: url,
  resumeUrl: url,
  personality: z.string().trim().max(1000).nullish(),
  personalityEn: z.string().trim().max(1000).nullish(),
  personalityTags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  music: z.string().trim().max(1000).nullish(),
  musicEn: z.string().trim().max(1000).nullish(),
  musicUrl: webUrl,
  sports: z.string().trim().max(1000).nullish(),
  sportsEn: z.string().trim().max(1000).nullish(),
  sportsImageUrl: webUrl,
  nowText: z.string().trim().max(2000).nullish(),
  nowTextEn: z.string().trim().max(2000).nullish(),
});
