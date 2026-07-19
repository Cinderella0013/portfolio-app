// ที่อยู่ของ API
// - ตอนพัฒนาในเครื่อง: backend รันแยกที่พอร์ต 4000
// - ตอน deploy บน Vercel: หน้าบ้านกับ API อยู่โดเมนเดียวกัน ใช้ path สัมพัทธ์ได้เลย
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = isLocal ? 'http://localhost:4000/api' : '/api';
