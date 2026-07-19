// จุดรวม error ทั้งระบบ — หน้าบ้านจะได้รูปแบบคำตอบเหมือนกันเสมอ
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => {
  next(Object.assign(new Error(`ไม่พบเส้นทาง ${req.method} ${req.originalUrl}`), { status: 404, isApiError: true }));
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.isApiError ? err.status : 500;

  if (!err.isApiError) console.error(err);

  res.status(status).json({
    ok: false,
    error: {
      message: status === 500 && env.isProd ? 'เกิดข้อผิดพลาดภายในระบบ' : err.message,
      details: err.details,
    },
  });
};
