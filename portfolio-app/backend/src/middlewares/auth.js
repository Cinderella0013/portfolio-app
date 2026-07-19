// ตรวจ JWT จาก header Authorization: Bearer <token>
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('ไม่พบ token กรุณาเข้าสู่ระบบใหม่'));
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(ApiError.unauthorized('token หมดอายุหรือไม่ถูกต้อง'));
  }
};
