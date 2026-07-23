// แชทบอทลอย — icon กดแล้วเด้งหน้าต่าง คุยผ่าน /api/chat (key อยู่ฝั่ง server)
// ประวัติแชทเก็บใน localStorage รีเซ็ตเมื่อเงียบครบ 20 นาที
import { api, ApiClientError } from './api.js';
import { esc } from './dom.js';
import { t } from './i18n.js';

const STORE = 'portfolio.chat';
const IDLE = 20 * 60 * 1000; // เงียบครบ 20 นาที (ไม่มีการถามต่อ) ให้รีเซ็ต

// สุ่มชวนคุย: ทุก 5 นาทีที่เปิดหน้าไว้ มีโอกาส 1/20 เด้งคำถามเล่นๆ ขึ้นมา
const PROACTIVE_EVERY = 5 * 60 * 1000;
const PROACTIVE_CHANCE = 1 / 20;
const ICEBREAKERS = [
  ['ถ้ามีพลังพิเศษได้ 1 อย่าง อยากได้อะไร?', 'If you could have one superpower, what would it be?'],
  ['ชา หรือ กาแฟ?', 'Tea or coffee?'],
  ['ถ้าไปเที่ยวได้ทุกที่ตอนนี้ จะไปไหน?', 'If you could teleport anywhere right now, where to?'],
  ['เพลงที่ฟังวนล่าสุดคือเพลงอะไร?', "What's the last song you had on repeat?"],
  ['หมา หรือ แมว?', 'Dogs or cats?'],
  ['ของกินที่กินได้ทุกวันไม่มีเบื่อคืออะไร?', "What food could you eat every day and never get tired of?"],
  ['กลางวัน หรือ กลางคืน?', 'Are you a morning person or a night owl?'],
  ['ถ้าเลี้ยงไดโนเสาร์เป็นสัตว์เลี้ยงได้ จะเลือกตัวไหน?', 'If you could keep a dinosaur as a pet, which one?'],
  ['ทะเล หรือ ภูเขา?', 'Beach or mountains?'],
  ['superpower อยากบินได้ หรือ ล่องหนได้?', 'Would you rather fly or turn invisible?'],
  ['ถ้าย้อนเวลาได้ อยากกลับไปดูยุคไหน?', 'If you could time-travel, which era would you visit?'],
  ['ตอนนี้กำลังอินกับอะไรอยู่?', "What's something you're really into these days?"],
];

// โหลดประวัติ ถ้าเงียบเกิน 20 นาทีนับจากข้อความล่าสุด ทิ้งทั้งชุด
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && Date.now() - saved.lastAt < IDLE) return saved.messages;
  } catch { /* ข้อมูลเสีย ถือว่าไม่มี */ }
  localStorage.removeItem(STORE);
  return [];
}

// lastAt เลื่อนตามทุกครั้งที่มีข้อความใหม่ — นับถอยหลังใหม่จากกิจกรรมล่าสุด
function save(messages) {
  localStorage.setItem(STORE, JSON.stringify({ lastAt: Date.now(), messages }));
}

let messages = load();
let busy = false;
let proactivePaused = false; // ยิงคำถามชวนคุยแล้วรอคำตอบอยู่ — หยุดยิงจนกว่าผู้ใช้จะตอบ

/* ---------- ไอคอนหุ่นยนต์ AI + ประกาย (inline SVG สีขาวบนพื้น gradient) ---------- */
const ICON_BOT = `
  <svg viewBox="0 0 512 512" width="34" height="34" aria-hidden="true" fill="none"
       stroke="currentColor" stroke-width="42" stroke-linejoin="round" stroke-linecap="round">
    <rect x="242" y="46" width="28" height="72" rx="14" fill="currentColor" stroke="none"/>
    <path d="M150 112 H360 A55 55 0 0 1 415 167 V292 A55 55 0 0 1 360 347 H250
             A150 150 0 0 1 100 197 V167 A55 55 0 0 1 150 112 Z"/>
    <circle cx="196" cy="228" r="30" fill="currentColor" stroke="none"/>
    <circle cx="320" cy="228" r="30" fill="currentColor" stroke="none"/>
    <path fill="currentColor" stroke="none"
          d="M410 330 Q432 388 490 410 Q432 432 410 490 Q388 432 330 410 Q388 388 410 330 Z"/>
  </svg>`;

/* ---------- สร้าง DOM ---------- */
const root = document.createElement('div');
root.id = 'chat-widget';
root.innerHTML = `
  <button id="chat-fab" aria-label="${t('เปิดแชท', 'Open chat')}" aria-expanded="false">${ICON_BOT}</button>
  <section id="chat-panel" class="hidden" role="dialog" aria-label="${t('แชท', 'Chat')}">
    <header>
      <span>${t('💬 ถามอะไรก็ได้', "💬 Ask me anything")}</span>
      <button id="chat-close" aria-label="${t('ปิด', 'Close')}">✕</button>
    </header>
    <div id="chat-log"></div>
    <form id="chat-form">
      <input id="chat-input" autocomplete="off" maxlength="2000"
             placeholder="${t('พิมพ์คำถาม…', 'Type a question…')}" required>
      <button class="btn btn-sm btn-primary" type="submit">${t('ส่ง', 'Send')}</button>
    </form>
  </section>`;
document.body.appendChild(root);

const fab = root.querySelector('#chat-fab');
const panel = root.querySelector('#chat-panel');
const log = root.querySelector('#chat-log');
const form = root.querySelector('#chat-form');
const input = root.querySelector('#chat-input');

/* ---------- รีเซ็ตเมื่อเงียบครบ 20 นาที (กันเคสเปิดหน้าต่างค้างไว้ไม่รีเฟรช) ---------- */
let idleTimer;
function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    messages = [];
    localStorage.removeItem(STORE);
    if (!panel.classList.contains('hidden')) renderHistory(); // เปิดอยู่ ก็กลับไปทักทายใหม่
  }, IDLE);
}

/* ---------- วาด log ---------- */
function bubble(role, text, pending = false) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}${pending ? ' pending' : ''}`;
  div.innerHTML = esc(text).replace(/\n/g, '<br>');
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function greeting() {
  bubble('assistant', t(
    'สวัสดีครับ 👋 ถามเรื่องผลงาน ทักษะ หรือช่องทางติดต่อได้เลย',
    'Hi 👋 Ask me about the projects, skills, or how to get in touch.',
  ));
}

function renderHistory() {
  log.innerHTML = '';
  if (!messages.length) greeting();
  else messages.forEach((m) => bubble(m.role, m.content));
}

/* ---------- เปิด/ปิด ---------- */
function toggle(open) {
  panel.classList.toggle('hidden', !open);
  fab.setAttribute('aria-expanded', String(open));
  fab.innerHTML = open ? '✕' : ICON_BOT;
  if (open) { renderHistory(); input.focus(); }
}
fab.addEventListener('click', () => toggle(panel.classList.contains('hidden')));
root.querySelector('#chat-close').addEventListener('click', () => toggle(false));

/* ---------- สุ่มชวนคุย ---------- */
function askIcebreaker() {
  const [th, en] = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
  const q = t(th, en);
  messages.push({ role: 'assistant', content: q });
  // ยังไม่ save() — ถ้าผู้ใช้ไม่ตอบแล้วรีเฟรช คำถามชวนคุยก็หายไปเลย
  if (panel.classList.contains('hidden')) toggle(true); // เปิดหน้าต่างให้เห็น (renderHistory วาด q ให้)
  else bubble('assistant', q);
  proactivePaused = true; // ถามแล้ว รอคำตอบ — หยุดยิงจนกว่าจะตอบ
}

/* ---------- ส่งข้อความ ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;

  busy = true;
  proactivePaused = false; // ผู้ใช้ตอบแล้ว เปิดให้สุ่มถามได้อีกในรอบถัดไป
  input.value = '';
  armIdle(); // มีการถามต่อ นับถอยหลัง 20 นาทีใหม่
  messages.push({ role: 'user', content: text });
  save(messages);
  bubble('user', text);
  const typing = bubble('assistant', t('กำลังพิมพ์…', 'Typing…'), true);

  try {
    const reply = await api.chat.send(messages);
    typing.remove();
    messages.push({ role: 'assistant', content: reply });
    save(messages);
    bubble('assistant', reply);
  } catch (err) {
    typing.remove();
    const msg = err instanceof ApiClientError
      ? err.message
      : t('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', 'Something went wrong, please try again.');
    bubble('assistant', `⚠️ ${msg}`);
    // ถอนข้อความผู้ใช้ที่ค้างออก เพื่อไม่ให้ context เพี้ยนตอนส่งรอบหน้า
    messages.pop();
    save(messages);
  } finally {
    busy = false;
    input.focus();
  }
});

/* ---------- เริ่มทำงาน: โชว์ปุ่มเฉพาะเมื่อ backend เปิดฟีเจอร์แชท ---------- */
if (messages.length) armIdle(); // โหลดมายังมีประวัติค้าง เดินนาฬิกา 20 นาทีต่อ

(async function init() {
  try {
    const { enabled } = await api.chat.status();
    if (!enabled) return;
    root.classList.add('ready');
    // สุ่มชวนคุยทุก 5 นาที โอกาส 1/20 เริ่มหลังยืนยันว่าฟีเจอร์เปิด
    setInterval(() => {
      if (!proactivePaused && Math.random() < PROACTIVE_CHANCE) askIcebreaker();
    }, PROACTIVE_EVERY);
  } catch { /* ต่อ backend ไม่ได้ ก็ไม่ต้องโชว์ปุ่มแชท */ }
})();
