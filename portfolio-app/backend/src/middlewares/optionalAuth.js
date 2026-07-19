// อ่าน token ถ้ามี แต่ไม่บังคับ ใช้กับเส้นทางที่แอดมินเห็นข้อมูลมากกว่าคนทั่วไป
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const optionalAuth = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try { req.user = jwt.verify(token, env.JWT_SECRET); } catch { /* ปล่อยผ่านแบบไม่ล็อกอิน */ }
  }
  next();
};
