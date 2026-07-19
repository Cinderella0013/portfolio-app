// ที่อยู่ของ API — ตอนขึ้นจริงเปลี่ยนเป็นโดเมนของ backend
export const API_BASE =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : 'https://your-api-domain.com/api';
