// ห่อ controller ที่เป็น async ให้ส่ง error เข้า middleware กลางได้เอง
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
