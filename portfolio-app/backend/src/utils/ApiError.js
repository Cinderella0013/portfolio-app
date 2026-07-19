// error ที่ตั้งใจโยน เพื่อให้ตัวจัดการ error กลางรู้ว่าควรตอบ status อะไร
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
    this.isApiError = true;
  }

  static badRequest(msg = 'คำขอไม่ถูกต้อง', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'กรุณาเข้าสู่ระบบ') { return new ApiError(401, msg); }
  static forbidden(msg = 'ไม่มีสิทธิ์เข้าถึง') { return new ApiError(403, msg); }
  static notFound(msg = 'ไม่พบข้อมูลที่ต้องการ') { return new ApiError(404, msg); }
  static conflict(msg = 'ข้อมูลนี้มีอยู่แล้ว') { return new ApiError(409, msg); }
}
