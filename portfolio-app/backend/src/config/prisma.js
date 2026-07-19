// Prisma client ตัวเดียวใช้ทั้งแอป กัน connection pool รั่วตอน hot reload
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({ log: env.isProd ? ['error'] : ['warn', 'error'] });

if (!env.isProd) globalForPrisma.__prisma = prisma;
