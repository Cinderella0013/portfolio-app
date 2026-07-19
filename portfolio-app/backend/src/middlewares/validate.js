// ตรวจ body/params/query ด้วย zod ก่อนเข้า controller
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('ข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ', details));
  }
  req[source] = result.data;
  next();
};
