// ตัวช่วยเล็กๆ ที่ทั้งหน้าบ้านและหลังบ้านใช้ร่วมกัน
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// แปลงข้อความผู้ใช้เป็น HTML ที่ปลอดภัย ป้องกัน XSS
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// แสดงเป็นเดือนย่อ + ปี พ.ศ.
export const thaiMonthYear = (iso) => {
  if (!iso) return 'ปัจจุบัน';
  const d = new Date(iso);
  return `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export const dateRange = (start, end) => `${thaiMonthYear(start)} — ${thaiMonthYear(end)}`;

export const thaiDateTime = (iso) =>
  new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export function showAlert(el, message, kind = 'error') {
  el.className = `alert alert-${kind}`;
  el.textContent = message;
  el.classList.remove('hidden');
}
export const hideAlert = (el) => el.classList.add('hidden');
