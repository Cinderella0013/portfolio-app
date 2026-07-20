// สองภาษาแบบเบาที่สุด — ภาษาไทยเขียนอยู่ใน HTML ตามปกติ
// ส่วนอังกฤษเก็บใน data-en ของ element เดียวกัน สลับด้วยการ reload หน้า
// (หน้า static โหลดเร็วมาก ไม่คุ้มเขียนระบบ re-render สด)
export const lang = localStorage.getItem('lang') === 'en' ? 'en' : 'th';

// ใช้ในสคริปต์: t('ข้อความไทย', 'English text')
export const t = (th, en) => (lang === 'en' ? en : th);

export function initI18n() {
  document.documentElement.lang = lang;
  if (lang === 'en') {
    document.querySelectorAll('[data-en]').forEach((el) => { el.innerHTML = el.dataset.en; });
  }
  const btn = document.getElementById('lang-btn');
  if (!btn) return;
  btn.textContent = lang === 'en' ? 'ไทย' : 'EN';
  btn.addEventListener('click', () => {
    localStorage.setItem('lang', lang === 'en' ? 'th' : 'en');
    location.reload();
  });
}
