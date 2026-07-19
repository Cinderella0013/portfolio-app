// หลังบ้าน: ล็อกอิน + จัดการเนื้อหาทุกส่วน
import { api, token, ApiClientError } from './api.js';
import { $, $$, esc, dateRange, thaiDateTime, showAlert, hideAlert } from './dom.js';

const loginView = $('#login-view');
const adminView = $('#admin-view');
const adminAlert = $('#admin-alert');

/* ============ ตัวช่วย ============ */
const toast = (msg, kind = 'success') => {
  showAlert(adminAlert, msg, kind);
  scrollTo({ top: 0, behavior: 'smooth' });
  if (kind === 'success') setTimeout(() => hideAlert(adminAlert), 3000);
};

const handle = async (fn, successMsg) => {
  try {
    await fn();
    if (successMsg) toast(successMsg);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) return showLogin();
    const detail = err.details?.length ? ' — ' + err.details.map((d) => `${d.field}: ${d.message}`).join(', ') : '';
    toast(err.message + detail, 'error');
  }
};

// อ่านค่าฟอร์มเป็นออบเจกต์ พร้อมแปลง checkbox และตัวเลขให้ถูกชนิด
function readForm(form, { numbers = [], booleans = [] } = {}) {
  const data = Object.fromEntries(new FormData(form).entries());
  for (const k of numbers) data[k] = Number(data[k] || 0);
  for (const k of booleans) data[k] = form.elements[k].checked;
  return data;
}

function fillForm(form, data) {
  for (const [k, v] of Object.entries(data)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = Boolean(v);
    else if (el.type === 'date') el.value = v ? String(v).slice(0, 10) : '';
    else el.value = v ?? '';
  }
}

/* ============ สลับมุมมอง ============ */
function showLogin() {
  token.clear();
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
}
function showAdmin(user) {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  $('#admin-who').textContent = user.email;
  loadAll();
}

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    $$('.panel-view').forEach((v) => v.classList.toggle('hidden', v.dataset.view !== tab.dataset.tab));
  });
});

/* ============ เข้าสู่ระบบ ============ */
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = $('#login-alert');
  const btn = $('#login-submit');
  hideAlert(alertBox);
  btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ…';
  try {
    const { token: t, user } = await api.auth.login($('#l-email').value, $('#l-password').value);
    token.set(t);
    showAdmin(user);
  } catch (err) {
    showAlert(alertBox, err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
  }
});

$('#logout-btn').addEventListener('click', showLogin);

/* ============ โปรไฟล์ ============ */
const profileForm = $('#profile-form');
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handle(async () => {
    await api.profile.update(readForm(profileForm));
  }, 'บันทึกโปรไฟล์แล้ว');
});

const loadProfile = () => handle(async () => fillForm(profileForm, await api.profile.get()));

/* ============ ตัวสร้างส่วนจัดการแบบ CRUD ที่ใช้ซ้ำได้ ============ */
function makeCrud({ formId, rowsId, titleId, resource, toPayload, toRow, toForm, numbers = [], booleans = [] }) {
  const form = $(`#${formId}`);
  const rows = $(`#${rowsId}`);
  const title = $(`#${titleId}`);
  const cancelBtn = form.querySelector('[data-reset]');
  const defaultTitle = title.textContent;

  const reset = () => {
    form.reset();
    form.elements.id.value = '';
    title.textContent = defaultTitle;
    cancelBtn?.classList.add('hidden');
  };
  cancelBtn?.addEventListener('click', reset);

  const load = () => handle(async () => {
    const items = await resource.list(true);
    rows.innerHTML = items.length
      ? items.map(toRow).join('')
      : '<p class="empty">ยังไม่มีข้อมูล กรอกในฟอร์มด้านบนเพื่อเพิ่ม</p>';
    rows.dataset.cache = JSON.stringify(items);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = readForm(form, { numbers, booleans });
    const { id } = raw;
    delete raw.id;
    handle(async () => {
      const payload = toPayload(raw);
      if (id) await resource.update(id, payload);
      else await resource.create(payload);
      reset();
      await load();
    }, id ? 'แก้ไขเรียบร้อย' : 'เพิ่มเรียบร้อย');
  });

  rows.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const item = JSON.parse(rows.dataset.cache || '[]').find((x) => x.id === id);

    if (action === 'edit' && item) {
      fillForm(form, toForm(item));
      form.elements.id.value = id;
      title.textContent = 'กำลังแก้ไข';
      cancelBtn?.classList.remove('hidden');
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (action === 'delete') {
      if (!confirm('ลบรายการนี้ถาวร ยืนยันหรือไม่')) return;
      handle(async () => { await resource.remove(id); await load(); }, 'ลบแล้ว');
    }
  });

  return { load, reset };
}

const actionButtons = (id) => `
  <div class="row-actions">
    <button class="btn btn-sm" data-action="edit" data-id="${id}">แก้ไข</button>
    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${id}">ลบ</button>
  </div>`;

/* ---- ทักษะ ---- */
const skillsCrud = makeCrud({
  formId: 'skill-form', rowsId: 'skills-rows', titleId: 'skill-form-title',
  resource: { ...api.skills, list: () => api.skills.list() },
  numbers: ['level', 'sortOrder'],
  toPayload: (d) => d,
  toForm: (s) => s,
  toRow: (s) => `
    <div class="row">
      <div class="row-main">
        <div class="row-title">${esc(s.name)}</div>
        <div class="row-meta">${esc(s.category)} · ระดับ ${s.level} · ลำดับ ${s.sortOrder}</div>
      </div>${actionButtons(s.id)}
    </div>`,
});

/* ---- ประวัติ ---- */
const experiencesCrud = makeCrud({
  formId: 'experience-form', rowsId: 'experiences-rows', titleId: 'experience-form-title',
  resource: { ...api.experiences, list: () => api.experiences.list() },
  numbers: ['sortOrder'],
  toPayload: (d) => ({
    ...d,
    endDate: d.endDate || null,
    bullets: String(d.bullets || '').split('\n').map((s) => s.trim()).filter(Boolean),
  }),
  toForm: (e) => ({ ...e, bullets: (e.bullets || []).join('\n') }),
  toRow: (e) => `
    <div class="row">
      <div class="row-main">
        <div class="row-title">${esc(e.title)} — ${esc(e.org)}</div>
        <div class="row-meta">${e.type === 'EDUCATION' ? 'การศึกษา' : 'การทำงาน'} · ${esc(dateRange(e.startDate, e.endDate))}</div>
      </div>${actionButtons(e.id)}
    </div>`,
});

/* ---- ผลงาน ---- */
const projectsCrud = makeCrud({
  formId: 'project-form', rowsId: 'projects-rows', titleId: 'project-form-title',
  resource: api.projects,
  numbers: ['sortOrder'], booleans: ['featured', 'published'],
  toPayload: (d) => ({ ...d, tags: String(d.tags || '').split(',').map((s) => s.trim()).filter(Boolean) }),
  toForm: (p) => ({ ...p, tags: (p.tags || []).join(', ') }),
  toRow: (p) => `
    <div class="row">
      <div class="row-main">
        <div class="row-title">${p.featured ? '📌 ' : ''}${esc(p.title)}</div>
        <div class="row-meta">${p.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'} · /${esc(p.slug)} · ${(p.tags || []).map(esc).join(', ') || 'ไม่มีแท็ก'}</div>
      </div>${actionButtons(p.id)}
    </div>`,
});

/* ============ ข้อความ (อ่าน / ทำเครื่องหมาย / ลบ เท่านั้น) ============ */
const messagesRows = $('#messages-rows');

const loadMessages = () => handle(async () => {
  const items = await api.messages.list();
  messagesRows.dataset.cache = JSON.stringify(items);

  const unread = items.filter((m) => !m.isRead).length;
  $('#unread-badge').textContent = unread ? `(${unread})` : '';

  messagesRows.innerHTML = items.length
    ? items.map((m) => `
      <div class="row${m.isRead ? '' : ' is-unread'}">
        <div class="row-main">
          <div class="row-title">${esc(m.name)} &lt;${esc(m.email)}&gt;</div>
          <div class="row-meta">${esc(thaiDateTime(m.createdAt))}${m.isRead ? '' : ' · ยังไม่ได้อ่าน'}</div>
          <p style="margin-top:.5rem;white-space:pre-line">${esc(m.body)}</p>
        </div>
        <div class="row-actions">
          <a class="btn btn-sm" href="mailto:${esc(m.email)}">ตอบกลับ</a>
          <button class="btn btn-sm" data-action="toggle" data-id="${m.id}">${m.isRead ? 'ทำเป็นยังไม่อ่าน' : 'ทำเป็นอ่านแล้ว'}</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${m.id}">ลบ</button>
        </div>
      </div>`).join('')
    : '<p class="empty">ยังไม่มีข้อความเข้ามา</p>';
});

messagesRows.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'toggle') {
    const item = JSON.parse(messagesRows.dataset.cache || '[]').find((x) => x.id === id);
    handle(async () => { await api.messages.markRead(id, !item.isRead); await loadMessages(); });
  }
  if (action === 'delete') {
    if (!confirm('ลบข้อความนี้ถาวร ยืนยันหรือไม่')) return;
    handle(async () => { await api.messages.remove(id); await loadMessages(); }, 'ลบข้อความแล้ว');
  }
});

/* ============ เริ่มทำงาน ============ */
function loadAll() {
  loadProfile();
  skillsCrud.load();
  experiencesCrud.load();
  projectsCrud.load();
  loadMessages();
}

(async function init() {
  if (!token.get()) return showLogin();
  try {
    showAdmin(await api.auth.me());
  } catch {
    showLogin();
  }
})();
