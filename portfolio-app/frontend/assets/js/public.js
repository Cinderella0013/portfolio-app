// หน้าบ้าน: ดึงข้อมูลจาก API แล้ววาดลงหน้าเว็บ
import { api, ApiClientError } from './api.js';
import { $, esc, dateRange, showAlert, hideAlert } from './dom.js';
import { t, initI18n } from './i18n.js';

initI18n(); // สลับข้อความ static เป็นภาษาที่เลือกไว้ก่อนวาดส่วนอื่น

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- โปรไฟล์ + เทอร์มินัล ---------- */
function renderProfile(p) {
  document.title = `${p.fullName} — Portfolio`;
  $('#hero-name').textContent = p.fullName;
  $('#hero-headline').textContent = t(p.headline, p.headlineEn || p.headline);
  $('#nav-logo').textContent = '~/' + p.fullName.split(/\s+/)[0].toLowerCase();
  $('#footer-name').textContent = `© ${new Date().getFullYear()} ${p.fullName}`;

  $('#about-bio').innerHTML = t(p.bio || '', p.bioEn || p.bio || '')
    .split(/\n{2,}/).filter(Boolean)
    .map((para) => `<p>${esc(para)}</p>`).join('') || `<p>${t('ยังไม่ได้กรอกข้อมูลแนะนำตัว', 'No bio yet')}</p>`;

  const links = [
    [t('ส่งอีเมล', 'Email me'), p.email ? `mailto:${p.email}` : null],
    ['GitHub', p.githubUrl],
    ['LinkedIn', p.linkedinUrl],
    [t('เว็บไซต์', 'Website'), p.websiteUrl],
    [t('ดาวน์โหลดเรซูเม่', 'Download resume'), p.resumeUrl],
  ].filter(([, href]) => href);

  $('#contact-links').innerHTML = links
    .map(([label, href]) => `<a class="btn btn-sm" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`)
    .join('');

  typeTerminal([
    '<span class="term-prompt">$</span> whoami',
    `<span class="term-key">name</span>:  ${esc(p.fullName)}`,
    `<span class="term-key">role</span>:  ${esc(t(p.headline, p.headlineEn || p.headline))}`,
    p.location ? `<span class="term-key">base</span>:  ${esc(p.location)}` : null,
    '<span class="term-prompt">$</span> <span class="caret"></span>',
  ].filter(Boolean));
}

function typeTerminal(lines) {
  const out = $('#term-out');
  out.innerHTML = '';
  if (reduced) {
    out.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    return;
  }
  let i = 0;
  const next = () => {
    if (i >= lines.length) return;
    const p = document.createElement('p');
    p.innerHTML = lines[i++];
    out.appendChild(p);
    setTimeout(next, i === 1 ? 480 : 320);
  };
  setTimeout(next, 350);
}

/* ---------- ทักษะ ---------- */
const renderSkills = (skills) => {
  $('#skills-list').innerHTML = skills.length
    ? skills.map((s) => `<span class="sticker">${esc(s.name)}</span>`).join('')
    : `<span class="sticker">${t('ยังไม่ได้เพิ่มทักษะ', 'No skills yet')}</span>`;
};

/* ---------- ประวัติ ---------- */
const renderTimeline = (items) => {
  $('#timeline').innerHTML = items.length
    ? items.map((e) => `
      <div class="tl-item${e.type === 'EDUCATION' ? ' is-edu' : ''}">
        <p class="tl-date">${esc(dateRange(e.startDate, e.endDate))}</p>
        <h3>${esc(e.title)}</h3>
        <p class="tl-org">${esc(e.org)}</p>
        ${e.bullets?.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')
    : `<p class="empty">${t('ยังไม่ได้เพิ่มประวัติ', 'Nothing here yet')}</p>`;
};

/* ---------- ผลงาน ---------- */
const renderProjects = (projects) => {
  $('#projects-grid').innerHTML = projects.length
    ? projects.map((p) => `
      <article class="card">
        <div class="card-top">${esc(p.coverEmoji)}</div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(t(p.summary, p.summaryEn || p.summary))}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div>
            ${p.liveUrl ? `<a class="card-link" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">${t('เปิดดู', 'Live')} →</a>` : ''}
            ${p.repoUrl ? `<a class="card-link" href="${esc(p.repoUrl)}" target="_blank" rel="noopener">${t('ซอร์สโค้ด', 'Source')} →</a>` : ''}
          </div>
        </div>
      </article>`).join('')
    : `<p class="empty">${t('ยังไม่ได้เพิ่มผลงาน', 'No projects yet')}</p>`;
};

/* ---------- ฟอร์มติดต่อ ---------- */
function bindContactForm() {
  const form = $('#contact-form');
  const alertBox = $('#contact-alert');
  const submit = $('#contact-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    submit.disabled = true;
    submit.textContent = t('กำลังส่ง…', 'Sending…');

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await api.messages.send(payload);
      form.reset();
      showAlert(alertBox, t('ส่งข้อความเรียบร้อยแล้ว ขอบคุณครับ', 'Message sent — thank you!'), 'success');
    } catch (err) {
      const detail = err instanceof ApiClientError && err.details?.length
        ? ` (${err.details.map((d) => d.message).join(', ')})`
        : '';
      showAlert(alertBox, err.message + detail);
    } finally {
      submit.disabled = false;
      submit.textContent = t('ส่งข้อความ', 'Send message');
    }
  });
}

/* ---------- เผยเนื้อหาตอนเลื่อนถึง ---------- */
function bindReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

/* ---------- เริ่มทำงาน ---------- */
(async function init() {
  bindContactForm();

  // โหลดพร้อมกันทั้งหมด ส่วนไหนพังก็ไม่ลากส่วนอื่นล้มตาม
  const [profile, skills, experiences, projects] = await Promise.allSettled([
    api.profile.get(), api.skills.list(), api.experiences.list(), api.projects.list(),
  ]);

  if (profile.status === 'fulfilled') renderProfile(profile.value);
  else $('#hero-name').textContent = t('โหลดข้อมูลไม่สำเร็จ', 'Failed to load');

  if (skills.status === 'fulfilled') renderSkills(skills.value);
  if (experiences.status === 'fulfilled') renderTimeline(experiences.value);
  if (projects.status === 'fulfilled') renderProjects(projects.value);

  // ผูก reveal หลังวาดเนื้อหาแล้วเท่านั้น — ถ้าผูกก่อน section ที่อยู่ในจอ
  // จะถูกนับว่า "เห็นแล้ว" ตั้งแต่ยังว่าง ของที่มาทีหลังเลยโผล่ทันทีไม่ทยอยไหล
  bindReveal();
})();
