// หน้าบ้าน: ดึงข้อมูลจาก API แล้ววาดลงหน้าเว็บ
import { api, ApiClientError } from './api.js';
import { $, esc, dateRange, showAlert, hideAlert } from './dom.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- โปรไฟล์ + เทอร์มินัล ---------- */
function renderProfile(p) {
  document.title = `${p.fullName} — Portfolio`;
  $('#hero-name').textContent = p.fullName;
  $('#hero-headline').textContent = p.headline;
  $('#nav-logo').textContent = '~/' + p.fullName.split(/\s+/)[0].toLowerCase();
  $('#footer-name').textContent = `© ${new Date().getFullYear()} ${p.fullName}`;

  $('#about-bio').innerHTML = (p.bio || '')
    .split(/\n{2,}/).filter(Boolean)
    .map((para) => `<p>${esc(para)}</p>`).join('') || '<p>ยังไม่ได้กรอกข้อมูลแนะนำตัว</p>';

  const links = [
    ['ส่งอีเมล', p.email ? `mailto:${p.email}` : null],
    ['GitHub', p.githubUrl],
    ['LinkedIn', p.linkedinUrl],
    ['เว็บไซต์', p.websiteUrl],
    ['ดาวน์โหลดเรซูเม่', p.resumeUrl],
  ].filter(([, href]) => href);

  $('#contact-links').innerHTML = links
    .map(([label, href]) => `<a class="btn btn-sm" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`)
    .join('');

  typeTerminal([
    '<span class="term-prompt">$</span> whoami',
    `<span class="term-key">name</span>:  ${esc(p.fullName)}`,
    `<span class="term-key">role</span>:  ${esc(p.headline)}`,
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
    : '<span class="sticker">ยังไม่ได้เพิ่มทักษะ</span>';
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
    : '<p class="empty">ยังไม่ได้เพิ่มประวัติ</p>';
};

/* ---------- ผลงาน ---------- */
const renderProjects = (projects) => {
  $('#projects-grid').innerHTML = projects.length
    ? projects.map((p) => `
      <article class="card">
        <div class="card-top">${esc(p.coverEmoji)}</div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.summary)}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div>
            ${p.liveUrl ? `<a class="card-link" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">เปิดดู →</a>` : ''}
            ${p.repoUrl ? `<a class="card-link" href="${esc(p.repoUrl)}" target="_blank" rel="noopener">ซอร์สโค้ด →</a>` : ''}
          </div>
        </div>
      </article>`).join('')
    : '<p class="empty">ยังไม่ได้เพิ่มผลงาน</p>';
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
    submit.textContent = 'กำลังส่ง…';

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await api.messages.send(payload);
      form.reset();
      showAlert(alertBox, 'ส่งข้อความเรียบร้อยแล้ว ขอบคุณครับ', 'success');
    } catch (err) {
      const detail = err instanceof ApiClientError && err.details?.length
        ? ` (${err.details.map((d) => d.message).join(', ')})`
        : '';
      showAlert(alertBox, err.message + detail);
    } finally {
      submit.disabled = false;
      submit.textContent = 'ส่งข้อความ';
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
  bindReveal();

  // โหลดพร้อมกันทั้งหมด ส่วนไหนพังก็ไม่ลากส่วนอื่นล้มตาม
  const [profile, skills, experiences, projects] = await Promise.allSettled([
    api.profile.get(), api.skills.list(), api.experiences.list(), api.projects.list(),
  ]);

  if (profile.status === 'fulfilled') renderProfile(profile.value);
  else $('#hero-name').textContent = 'โหลดข้อมูลไม่สำเร็จ';

  if (skills.status === 'fulfilled') renderSkills(skills.value);
  if (experiences.status === 'fulfilled') renderTimeline(experiences.value);
  if (projects.status === 'fulfilled') renderProjects(projects.value);
})();
