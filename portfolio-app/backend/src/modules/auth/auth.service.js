// ชั้นตรรกะ: รู้เรื่องผู้ใช้และ token แต่ไม่รู้จัก req/res
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export const authService = {
  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });

    // ตอบข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผิด เพื่อไม่ให้เดาว่าอีเมลไหนมีอยู่
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw ApiError.unauthorized('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  },

  async me(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw ApiError.unauthorized('ไม่พบบัญชีผู้ใช้');
    return user;
  },
};
