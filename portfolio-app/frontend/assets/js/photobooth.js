// ห้องถ่ายรูปลับ — กล้อง + ฟิลเตอร์ CSS ล้วนๆ ไม่มี backend เกี่ยวข้อง
import { $ } from './dom.js';
import { t, initI18n } from './i18n.js';

initI18n();

// ฟิลเตอร์ = CSS filter string ตรงๆ ใช้ได้ทั้งพรีวิวและตอนวาดลง canvas
const FILTERS = [
  { th: 'ปกติ', en: 'Normal', css: 'none' },
  { th: 'ขาวดำ', en: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { th: 'วินเทจ', en: 'Vintage', css: 'sepia(.65) contrast(1.05) brightness(1.05)' },
  { th: 'Y2K', en: 'Y2K', css: 'saturate(1.6) hue-rotate(-12deg) brightness(1.08)' },
  { th: 'ไซเบอร์', en: 'Cyber', css: 'hue-rotate(160deg) saturate(1.8) contrast(1.15)' },
  { th: 'กลับสี', en: 'Invert', css: 'invert(1)' },
];

const cam = $('#cam');
const shot = $('#shot');
const msg = $('#cam-msg');
let filter = 'none';

/* ---------- ปุ่มฟิลเตอร์ ---------- */
const bar = $('#filters');
FILTERS.forEach((f, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(f.th, f.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    filter = f.css;
    cam.style.filter = shot.style.filter = filter === 'none' ? '' : filter;
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  });
  bar.appendChild(btn);
});

/* ---------- เปิดกล้อง ---------- */
try {
  cam.srcObject = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 } },
    audio: false,
  });
} catch {
  cam.classList.add('hidden');
  $('#snap-btn').disabled = true;
  msg.textContent = t(
    'เปิดกล้องไม่ได้ — ลองกดอนุญาตให้เว็บใช้กล้อง แล้วรีเฟรชหน้าอีกครั้ง',
    'Camera unavailable — allow camera access for this site, then refresh.',
  );
  msg.classList.remove('hidden');
}

/* ---------- ถ่าย / บันทึก / ถ่ายใหม่ ---------- */
$('#snap-btn').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = cam.videoWidth || 1280;
  canvas.height = cam.videoHeight || 960;
  const ctx = canvas.getContext('2d');
  // ponytail: ctx.filter ไม่รองรับใน Safari เก่า — รูปที่เซฟจะไม่มีฟิลเตอร์ แต่ถ่ายได้ปกติ
  if (filter !== 'none') ctx.filter = filter;
  // วาดกลับด้านให้ตรงกับพรีวิวกระจก
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(cam, 0, 0, canvas.width, canvas.height);

  shot.src = canvas.toDataURL('image/png');
  shot.style.filter = ''; // รูปถูกเผาฟิลเตอร์ลงพิกเซลแล้ว ไม่ต้องซ้ำ
  $('#save-btn').href = shot.src;

  $('#flash').classList.remove('go');
  void $('#flash').offsetWidth; // รีสตาร์ทอนิเมชั่นแฟลช
  $('#flash').classList.add('go');

  cam.classList.add('hidden');
  shot.classList.remove('hidden');
  $('#snap-btn').classList.add('hidden');
  $('#save-btn').classList.remove('hidden');
  $('#retake-btn').classList.remove('hidden');
});

$('#retake-btn').addEventListener('click', () => {
  shot.classList.add('hidden');
  cam.classList.remove('hidden');
  cam.style.filter = filter === 'none' ? '' : filter;
  $('#snap-btn').classList.remove('hidden');
  $('#save-btn').classList.add('hidden');
  $('#retake-btn').classList.add('hidden');
});
