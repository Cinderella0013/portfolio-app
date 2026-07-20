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
const MODES = [
  { id: 'manual', th: '👆 กดถ่ายเองทีละรูป', en: '👆 Snap each shot myself' },
  { id: 'timer', th: '⏱ นับถอยหลัง 3 วิ ทุกรูป', en: '⏱ 3-sec countdown per shot' },
];
// สัดส่วนของช่องรูป — ตอนวาดใช้วิธี cover-crop เหมือน object-fit:cover ไม่มีการบีบภาพ
const SIZES = [
  { th: 'แนวนอน 4:3', en: 'Landscape 4:3', w: 480, h: 360 },
  { th: 'จัตุรัส 1:1', en: 'Square 1:1', w: 420, h: 420 },
  { th: 'แนวตั้ง 3:4', en: 'Portrait 3:4', w: 360, h: 480 },
];
// กรอบ: สีพื้น + ลาย — css ใช้โชว์บนปุ่ม ส่วน paint วาดจริงลง canvas
const solid = (c) => (ctx, w, h) => { ctx.fillStyle = c; ctx.fillRect(0, 0, w, h); };
const FRAMES = [
  { css: '#FFFFFF', paint: solid('#FFFFFF') },
  { css: '#FFD6F5', paint: solid('#FFD6F5') },
  { css: '#FFD23F', paint: solid('#FFD23F') },
  { css: '#2EE6A8', paint: solid('#2EE6A8') },
  { css: '#46C6FF', paint: solid('#46C6FF') },
  { css: '#FF4D8D', paint: solid('#FF4D8D') },
  { css: '#17142B', dark: true, paint: solid('#17142B') },
  {
    css: 'linear-gradient(135deg,#FFD6F5,#D1E8FF,#E8D6FF)', // ไล่สี Y2K
    paint(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#FFD6F5'); g.addColorStop(.5, '#D1E8FF'); g.addColorStop(1, '#E8D6FF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
  },
  {
    css: 'linear-gradient(180deg,#FFD23F,#FF4D8D,#6C4DF6)', dark: true, // ไล่สีพระอาทิตย์ตก
    paint(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#FFD23F'); g.addColorStop(.55, '#FF4D8D'); g.addColorStop(1, '#6C4DF6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
  },
  {
    css: 'radial-gradient(#FF4D8D 26%, transparent 27%) #fff 0 0/16px 16px', // จุดโพลก้า
    paint(ctx, w, h) {
      solid('#FFFFFF')(ctx, w, h);
      ctx.fillStyle = '#FF4D8D';
      for (let y = 12; y < h; y += 26) {
        for (let x = 12 + (Math.floor(y / 26) % 2) * 13; x < w; x += 26) {
          ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
  },
  {
    css: 'repeating-linear-gradient(45deg,#FFD23F 0 9px,#fff 9px 18px)', // ทแยงเหลือง
    paint(ctx, w, h) {
      solid('#FFFFFF')(ctx, w, h);
      ctx.fillStyle = '#FFD23F';
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 4);
      const d = Math.hypot(w, h);
      for (let x = -d; x < d; x += 56) ctx.fillRect(x, -d, 28, d * 2);
      ctx.restore();
    },
  },
  {
    css: 'conic-gradient(#46C6FF 25%,#fff 0 50%,#46C6FF 0 75%,#fff 0) 0 0/22px 22px', // หมากรุกฟ้า
    paint(ctx, w, h) {
      solid('#FFFFFF')(ctx, w, h);
      ctx.fillStyle = '#46C6FF';
      const s = 34;
      for (let y = 0; y < h; y += s) {
        for (let x = (Math.floor(y / s) % 2) * s; x < w; x += s * 2) ctx.fillRect(x, y, s, s);
      }
    },
  },
];
const SHAPES = [
  { id: 'square', th: 'เหลี่ยม', en: 'Square' },
  { id: 'rounded', th: 'มุมมน', en: 'Rounded' },
  { id: 'circle', th: 'วงกลม', en: 'Circle' },
];
const STICKER_SET = ['⭐', '💖', '✨', '🔥', '🌈', '🐱', '🍓', '👑', '💬', '🎀'];
const PAD = 28, GAP = 18, FOOTER = 56;

/* ---------- state ---------- */
let layout = null;
let filter = 'none';
let mode = 'manual';
let shooting = false;    // กำลังนับถอยหลังอัตโนมัติอยู่ กันกดซ้อน
let shots = [];          // canvas ต่อรูป (ฟิลเตอร์เผาลงพิกเซลแล้ว)
let retakeIndex = null;  // ถ่ายซ่อมช่องไหน (null = ถ่ายเรียงตามปกติ)
let cell = SIZES[0];
let frame = FRAMES[0];
let shape = 'square';
let showDate = true;
let stickers = [];       // { e, x, y } พิกัดสัดส่วน 0-1 ของผืน canvas
let placing = null;      // อีโมจิที่กำลังจะวาง

const cam = $('#cam');
const preview = $('#preview');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const show = (id) => ['layout-view', 'shoot-view', 'edit-view']
  .forEach((v) => $(`#${v}`).classList.toggle('hidden', v !== id));

const pressGroup = (root, btn) =>
  root.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

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
MODES.forEach((m, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(m.th, m.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    mode = m.id;
    pressGroup($('#shoot-mode'), btn);
    $('#snap-btn').textContent = mode === 'timer' ? t('⏱ เริ่มถ่าย!', '⏱ Start!') : t('📷 ถ่ายเลย!', '📷 Snap!');
  });
  $('#shoot-mode').appendChild(btn);
});

const barF = $('#filters');
FILTERS.forEach((f, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(f.th, f.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    filter = f.css;
    cam.style.filter = filter === 'none' ? '' : filter;
    pressGroup(barF, btn);
  });
  barF.appendChild(btn);
});

function updateShootCount() {
  const total = layout.cols * layout.rows;
  $('#shoot-count').textContent = retakeIndex !== null
    ? t(`ถ่ายซ่อมรูปที่ ${retakeIndex + 1}`, `Retaking #${retakeIndex + 1}`)
    : t(`รูปที่ ${shots.length + 1}/${total}`, `Shot ${shots.length + 1}/${total}`);
}

// เก็บภาพจากกล้อง 1 รูป — คืนค่า true เมื่อครบชุดและพาไปหน้าแต่งรูปแล้ว
function capture() {
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
    return true;
  }
  updateShootCount();
  return false;
}

$('#snap-btn').addEventListener('click', async () => {
  if (cam.readyState < 2 || shooting) return; // กล้องยังไม่มีเฟรมแรก หรือกำลังนับอยู่
  if (mode === 'manual') { capture(); return; }

  // โหมดนับถอยหลัง: กดครั้งเดียว วนถ่ายจนครบชุด (ถ้าถ่ายซ่อมก็นับรอบเดียว)
  shooting = true;
  $('#snap-btn').disabled = true;
  const num = $('#count-num');
  let done = false;
  while (!done) {
    for (let n = 3; n > 0; n--) {
      num.textContent = n;
      num.classList.remove('tick');
      void num.offsetWidth;
      num.classList.add('tick');
      await sleep(1000);
    }
    num.textContent = '';
    done = capture();
    if (!done) await sleep(600); // เว้นจังหวะให้เปลี่ยนท่า
  }
  shooting = false;
  $('#snap-btn').disabled = false;
});

$('#back-layout-btn').addEventListener('click', () => { if (!shooting) show('layout-view'); });

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
// วาดแบบ cover-crop: ตัดขอบต้นฉบับให้สัดส่วนตรงช่องก่อนวาด ภาพไม่ถูกบีบ/ยืดเด็ดขาด
function drawCover(ctx, s, x, y, w, h) {
  const sr = s.width / s.height, dr = w / h;
  let sw = s.width, sh = s.height, sx = 0, sy = 0;
  if (sr > dr) { sw = s.height * dr; sx = (s.width - sw) / 2; }
  else { sh = s.width / dr; sy = (s.height - sh) / 2; }
  ctx.drawImage(s, sx, sy, sw, sh, x, y, w, h);
}

function compose() {
  const { cols, rows } = layout;
  const footer = showDate ? FOOTER : 0;
  preview.width = PAD * 2 + cols * cell.w + (cols - 1) * GAP;
  preview.height = PAD * 2 + rows * cell.h + (rows - 1) * GAP + footer;
  const ctx = preview.getContext('2d');

  frame.paint(ctx, preview.width, preview.height);

  shots.forEach((s, i) => {
    const x = PAD + (i % cols) * (cell.w + GAP);
    const y = PAD + Math.floor(i / cols) * (cell.h + GAP);
    ctx.save();
    if (shape === 'circle') {
      const r = Math.min(cell.w, cell.h) / 2;
      ctx.beginPath();
      ctx.arc(x + cell.w / 2, y + cell.h / 2, r, 0, Math.PI * 2);
      ctx.clip();
      drawCover(ctx, s, x + cell.w / 2 - r, y + cell.h / 2 - r, r * 2, r * 2);
    } else {
      if (shape === 'rounded') {
        ctx.beginPath();
        ctx.roundRect(x, y, cell.w, cell.h, 26); // ponytail: roundRect ต้องเบราว์เซอร์ปี 2022+ เท่านั้น
        ctx.clip();
      }
      drawCover(ctx, s, x, y, cell.w, cell.h);
    }
    ctx.restore();
  });

  // สติกเกอร์
  ctx.font = '72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  stickers.forEach((st) => ctx.fillText(st.e, st.x * preview.width, st.y * preview.height));

  // วันที่ท้ายแถบ แบบตู้สติกเกอร์ (ปิดได้)
  if (showDate) {
    ctx.fillStyle = frame.dark ? 'rgba(255,255,255,.85)' : 'rgba(23,20,43,.65)';
    ctx.font = '600 26px "IBM Plex Mono", monospace';
    ctx.fillText(
      `✦ photobooth · ${new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ✦`,
      preview.width / 2, preview.height - footer / 2 - PAD / 2,
    );
  }

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
SIZES.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.textContent = t(s.th, s.en);
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    cell = s;
    pressGroup($('#sizes'), btn);
    compose();
  });
  $('#sizes').appendChild(btn);
});

FRAMES.forEach((f, i) => {
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm swatch';
  btn.style.background = f.css;
  btn.setAttribute('aria-label', t(`กรอบแบบที่ ${i + 1}`, `Frame ${i + 1}`));
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    frame = f;
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

$('#date-toggle').addEventListener('change', (e) => {
  showDate = e.target.checked;
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
