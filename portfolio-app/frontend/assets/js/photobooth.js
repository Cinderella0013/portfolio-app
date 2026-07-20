// ห้องถ่ายรูปลับ — เลือก layout ถ่ายครบชุด แล้วรีวิว/แต่งรูปก่อนเซฟ ไม่มี backend เกี่ยวข้อง
import { $ } from './dom.js';
import { t, lang, initI18n } from './i18n.js';

initI18n();

/* ---------- ค่าคงที่ ---------- */
const FILTERS = [
  { th: 'ปกติ', en: 'Normal', css: 'none' },
  { th: 'ขาวดำ', en: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { th: 'วินเทจ', en: 'Vintage', css: 'sepia(.65) contrast(1.05) brightness(1.05)' },
  { th: 'Y2K', en: 'Y2K', css: 'saturate(1.6) hue-rotate(-12deg) brightness(1.08)' },
  { th: 'ไซเบอร์', en: 'Cyber', css: 'hue-rotate(160deg) saturate(1.8) contrast(1.15)' },
  { th: 'กลับสี', en: 'Invert', css: 'invert(1)' },
];
const LAYOUTS = [
  { th: '1 รูป', en: 'Single', cols: 1, rows: 1 },
  { th: 'แถบ 3 รูป', en: 'Strip of 3', cols: 1, rows: 3 },
  { th: 'แถบ 4 รูป', en: 'Strip of 4', cols: 1, rows: 4 },
  { th: 'ตาราง 2×2', en: '2×2 Grid', cols: 2, rows: 2 },
];
const FRAME_COLORS = ['#FFFFFF', '#FFD6F5', '#FFD23F', '#2EE6A8', '#46C6FF', '#FF4D8D', '#6C4DF6', '#17142B'];
const SHAPES = [
  { id: 'square', th: 'เหลี่ยม', en: 'Square' },
  { id: 'rounded', th: 'มุมมน', en: 'Rounded' },
  { id: 'circle', th: 'วงกลม', en: 'Circle' },
];
const STICKER_SET = ['⭐', '💖', '✨', '🔥', '🌈', '🐱', '🍓', '👑', '💬', '🎀'];
const CELL_W = 480, CELL_H = 360, PAD = 28, GAP = 18, FOOTER = 56;

/* ---------- state ---------- */
let layout = null;
let filter = 'none';
let shots = [];          // canvas ต่อรูป (ฟิลเตอร์เผาลงพิกเซลแล้ว)
let retakeIndex = null;  // ถ่ายซ่อมช่องไหน (null = ถ่ายเรียงตามปกติ)
let frameColor = FRAME_COLORS[0];
let shape = 'square';
let stickers = [];       // { e, x, y } พิกัดสัดส่วน 0-1 ของผืน canvas
let placing = null;      // อีโมจิที่กำลังจะวาง

const cam = $('#cam');
const preview = $('#preview');

const show = (id) => ['layout-view', 'shoot-view', 'edit-view']
  .forEach((v) => $(`#${v}`).classList.toggle('hidden', v !== id));

/* ---------- เฟส 1: เลือก layout ---------- */
LAYOUTS.forEach((L) => {
  const btn = document.createElement('button');
  btn.className = 'btn layout-btn';
  const mini = document.createElement('span');
  mini.className = 'layout-mini';
  mini.style.gridTemplateColumns = `repeat(${L.cols},auto)`;
  mini.innerHTML = '<i></i>'.repeat(L.cols * L.rows);
  btn.append(mini, document.createTextNode(t(L.th, L.en)));
  btn.addEventListener('click', () => {
    layout = L;
    shots = [];
    retakeIndex = null;
    updateShootCount();
    show('shoot-view');
  });
  $('#layout-grid').appendChild(btn);
});

/* ---------- เฟส 2: ถ่ายรูป ---------- */
const barF = $('#filters');
FILTERS.forEach((f, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(f.th, f.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    filter = f.css;
    cam.style.filter = filter === 'none' ? '' : filter;
    barF.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  });
  barF.appendChild(btn);
});

function updateShootCount() {
  const total = layout.cols * layout.rows;
  $('#shoot-count').textContent = retakeIndex !== null
    ? t(`ถ่ายซ่อมรูปที่ ${retakeIndex + 1}`, `Retaking #${retakeIndex + 1}`)
    : t(`รูปที่ ${shots.length + 1}/${total}`, `Shot ${shots.length + 1}/${total}`);
}

$('#snap-btn').addEventListener('click', () => {
  if (cam.readyState < 2) return; // กล้องยังไม่มีภาพเฟรมแรก กดไปก็ได้รูปว่าง
  const c = document.createElement('canvas');
  c.width = cam.videoWidth || 1280;
  c.height = cam.videoHeight || 960;
  const ctx = c.getContext('2d');
  // ponytail: ctx.filter ไม่รองรับใน Safari เก่า — รูปจะไม่มีฟิลเตอร์ แต่ถ่ายได้ปกติ
  if (filter !== 'none') ctx.filter = filter;
  // วาดกลับด้านให้ตรงกับพรีวิวกระจก
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(cam, 0, 0, c.width, c.height);

  $('#flash').classList.remove('go');
  void $('#flash').offsetWidth; // รีสตาร์ทอนิเมชั่นแฟลช
  $('#flash').classList.add('go');

  if (retakeIndex !== null) {
    shots[retakeIndex] = c;
    retakeIndex = null;
  } else {
    shots.push(c);
  }

  if (shots.length >= layout.cols * layout.rows) {
    renderThumbs();
    compose();
    show('edit-view');
  } else {
    updateShootCount();
  }
});

$('#back-layout-btn').addEventListener('click', () => show('layout-view'));

/* ---------- เปิดกล้อง ---------- */
try {
  cam.srcObject = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 } },
    audio: false,
  });
} catch {
  cam.classList.add('hidden');
  $('#snap-btn').disabled = true;
  const msg = $('#cam-msg');
  msg.textContent = t(
    'เปิดกล้องไม่ได้ — ลองกดอนุญาตให้เว็บใช้กล้อง แล้วรีเฟรชหน้าอีกครั้ง',
    'Camera unavailable — allow camera access for this site, then refresh.',
  );
  msg.classList.remove('hidden');
}

/* ---------- เฟส 3: ประกอบภาพ ---------- */
function compose() {
  const { cols, rows } = layout;
  preview.width = PAD * 2 + cols * CELL_W + (cols - 1) * GAP;
  preview.height = PAD * 2 + rows * CELL_H + (rows - 1) * GAP + FOOTER;
  const ctx = preview.getContext('2d');

  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, preview.width, preview.height);

  shots.forEach((s, i) => {
    const x = PAD + (i % cols) * (CELL_W + GAP);
    const y = PAD + Math.floor(i / cols) * (CELL_H + GAP);
    ctx.save();
    if (shape === 'circle') {
      // วงกลม: ตัดกลางภาพเป็นสี่เหลี่ยมจัตุรัสก่อน แล้ว clip เป็นวงกลมกลางช่อง
      ctx.beginPath();
      ctx.arc(x + CELL_W / 2, y + CELL_H / 2, CELL_H / 2, 0, Math.PI * 2);
      ctx.clip();
      const side = Math.min(s.width, s.height);
      ctx.drawImage(s, (s.width - side) / 2, (s.height - side) / 2, side, side,
        x + (CELL_W - CELL_H) / 2, y, CELL_H, CELL_H);
    } else {
      if (shape === 'rounded') {
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_W, CELL_H, 26); // ponytail: roundRect ต้องเบราว์เซอร์ปี 2022+ เท่านั้น
        ctx.clip();
      }
      ctx.drawImage(s, x, y, CELL_W, CELL_H);
    }
    ctx.restore();
  });

  // สติกเกอร์
  ctx.font = '72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  stickers.forEach((st) => ctx.fillText(st.e, st.x * preview.width, st.y * preview.height));

  // วันที่ท้ายแถบ แบบตู้สติกเกอร์
  const dark = frameColor === '#17142B' || frameColor === '#6C4DF6';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.85)' : 'rgba(23,20,43,.65)';
  ctx.font = '600 26px "IBM Plex Mono", monospace';
  ctx.fillText(
    `✦ photobooth · ${new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ✦`,
    preview.width / 2, preview.height - FOOTER / 2 - PAD / 2,
  );

  $('#save-btn').href = preview.toDataURL('image/png');
}

function renderThumbs() {
  const box = $('#thumbs');
  box.innerHTML = '';
  shots.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    const img = new Image();
    img.src = s.toDataURL('image/jpeg', 0.6);
    img.alt = t(`รูปที่ ${i + 1}`, `Shot ${i + 1}`);
    btn.append(img, document.createTextNode(t(`ถ่ายซ่อม #${i + 1}`, `Retake #${i + 1}`)));
    btn.addEventListener('click', () => {
      retakeIndex = i;
      updateShootCount();
      show('shoot-view');
    });
    box.appendChild(btn);
  });
}

/* ---------- ตัวเลือกแต่งรูป ---------- */
const pressGroup = (root, btn) =>
  root.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

FRAME_COLORS.forEach((c, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm swatch';
  btn.style.background = c;
  btn.setAttribute('aria-label', c);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    frameColor = c;
    pressGroup($('#frame-colors'), btn);
    compose();
  });
  $('#frame-colors').appendChild(btn);
});

SHAPES.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(s.th, s.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    shape = s.id;
    pressGroup($('#shapes'), btn);
    compose();
  });
  $('#shapes').appendChild(btn);
});

STICKER_SET.forEach((e) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm sticker-btn';
  btn.textContent = e;
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
    placing = placing === e ? null : e; // กดซ้ำ = ยกเลิกโหมดวาง
    pressGroup($('#stickers'), placing ? btn : null);
  });
  $('#stickers').appendChild(btn);
});

// แตะบนพรีวิว: กำลังวางสติกเกอร์ = วาง / ไม่ได้วาง = ลบตัวที่โดนแตะ
preview.addEventListener('click', (ev) => {
  const r = preview.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  const y = (ev.clientY - r.top) / r.height;
  if (placing) {
    stickers.push({ e: placing, x, y });
  } else {
    const hit = stickers.findLastIndex((st) =>
      Math.abs(st.x - x) * preview.width < 45 && Math.abs(st.y - y) * preview.height < 45);
    if (hit === -1) return;
    stickers.splice(hit, 1);
  }
  compose();
});

/* ---------- เริ่มใหม่ ---------- */
$('#restart-btn').addEventListener('click', () => {
  shots = [];
  stickers = [];
  placing = null;
  retakeIndex = null;
  show('layout-view');
});
