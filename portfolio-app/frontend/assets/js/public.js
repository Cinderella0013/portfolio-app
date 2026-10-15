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
  $('#hero-location').textContent = p.location ? `${t('อยู่ที่ ', 'Based in ')}${p.location}` : '';
  $('#nav-logo').textContent = '~/' + p.fullName.split(/\s+/)[0].toLowerCase();
  $('#footer-name').textContent = `© ${new Date().getFullYear()} ${p.fullName}`;
  renderPersonalContent(p);

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

function renderPersonalContent(p) {
  const text = (th, en) => t(th || en || '', en || th || '');
  const personality = text(p.personality, p.personalityEn);
  const tags = p.personalityTags || [];
  const music = text(p.music, p.musicEn);
  const sports = text(p.sports, p.sportsEn);
  const musicUrl = /^https?:\/\//i.test(p.musicUrl || '') ? p.musicUrl : '';
  const sportsImageUrl = /^https?:\/\//i.test(p.sportsImageUrl || '') ? p.sportsImageUrl : '';
  $('#personality-text').textContent = personality;
  $('#personality-tags').innerHTML = tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
  $('#life-personality').classList.toggle('hidden', !personality && !tags.length);
  $('#music-text').textContent = music;
  $('#music-link').classList.toggle('hidden', !musicUrl);
  if (musicUrl) $('#music-link').href = musicUrl;
  $('#life-music').classList.toggle('hidden', !music && !musicUrl);
  $('#sports-text').textContent = sports;
  $('#sports-photo').innerHTML = sportsImageUrl
    ? `<img id="sports-image" class="content-image" src="${esc(sportsImageUrl)}" alt="${esc(sports || t('กิจกรรมยามว่าง', 'An activity I enjoy'))}" loading="lazy" width="600" height="400">`
    : '';
  $('#life-sports').classList.toggle('hidden', !sports && !sportsImageUrl);
  const hasLifestyle = Boolean(personality || tags.length || music || musicUrl || sports || sportsImageUrl);
  for (const id of ['lifestyle', 'lifestyle-nav', 'discovery-life']) {
    $(`#${id}`).classList.toggle('hidden', !hasLifestyle);
  }

  const now = text(p.nowText, p.nowTextEn);
  $('#now').classList.toggle('hidden', !now);
  $('#discovery-now').classList.toggle('hidden', !now);
  $('#now-text').textContent = now;
  $('#discovery-now-text').textContent = now;
  if (now && p.nowUpdatedAt) {
    const date = new Date(p.nowUpdatedAt).toLocaleDateString(t('th-TH', 'en-GB'), { dateStyle: 'medium', timeZone: 'Asia/Bangkok' });
    $('#now-updated').textContent = `${t('อัปเดต', 'Updated')} ${date}`;
  }
}

function bindDiscovery() {
  const track = $('#discovery-track');
  const prev = $('#discovery-prev');
  const next = $('#discovery-next');
  prev.setAttribute('aria-label', t('เลื่อนรายการก่อนหน้า', 'Scroll to previous stories'));
  next.setAttribute('aria-label', t('เลื่อนรายการถัดไป', 'Scroll to next stories'));
  const update = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const move = (direction) => track.scrollBy({
    left: direction * (track.querySelector('li:not(.hidden)').getBoundingClientRect().width + 16),
    behavior: reduced ? 'instant' : 'smooth',
  });
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(track);
  update();
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
async function fetchGithubProjects() {
  const response = await fetch('https://api.github.com/users/Cinderella0013/repos?per_page=100&sort=updated', {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

  const repos = (await response.json()).filter((repo) => !repo.fork && !repo.archived);
  return repos.sort(() => Math.random() - 0.5).slice(0, 2).map((repo) => ({
    title: repo.name,
    summary: repo.description || t('โปรเจกต์จาก GitHub', 'GitHub project'),
    coverEmoji: repo.language ? '</>' : '{ }',
    tags: repo.language ? [repo.language] : [],
    repoUrl: repo.html_url,
  }));
}

const renderProjects = (projects) => {
  $('#projects-grid').innerHTML = projects.length
    ? projects.map((p) => `
      <article class="card${p.featured ? ' is-featured' : ''}">
        <div class="card-top">${p.coverUrl && /^https?:\/\//i.test(p.coverUrl) ? `<img class="project-cover content-image" src="${esc(p.coverUrl)}" alt="${esc(t('ภาพผลงาน ', 'Project preview: ') + p.title)}" loading="lazy" width="800" height="500">` : ''}<span aria-hidden="true">${esc(p.coverEmoji || '{ }')}</span></div>
        <div class="card-body">
          ${p.featured ? `<span class="featured-label">${t('ผลงานเด่น', 'Featured project')}</span>` : ''}
          <h3>${esc(p.title)}</h3>
          <p>${esc(t(p.summary, p.summaryEn || p.summary))}</p>
          ${[p.problem, p.problemEn, p.contribution, p.contributionEn, p.outcome, p.outcomeEn, p.description].some(Boolean) ? `
            <details class="project-story">
              <summary>${t('อ่านเรื่องเบื้องหลัง', 'Behind the project')} <span aria-hidden="true">＋</span></summary>
              <dl>${[
                [t('โจทย์ที่ต้องแก้', 'The problem'), t(p.problem || p.problemEn, p.problemEn || p.problem)],
                [t('ส่วนที่ผมรับผิดชอบ', 'My contribution'), t(p.contribution || p.contributionEn, p.contributionEn || p.contribution)],
                [t('ผลลัพธ์', 'The outcome'), t(p.outcome || p.outcomeEn, p.outcomeEn || p.outcome)],
              ].filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
              ${p.description ? `<p class="project-description">${esc(p.description)}</p>` : ''}
            </details>` : ''}
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="card-actions">
            ${p.repoUrl ? `<a class="btn btn-primary card-link-primary" href="${esc(p.repoUrl)}" target="_blank" rel="noopener">${t('ดูบน GitHub', 'View on GitHub')} →</a>` : ''}
            ${p.liveUrl ? `<a class="card-link" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">${t('เปิดเดโม', 'Live demo')} →</a>` : ''}
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
  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement && event.target.classList.contains('content-image')) event.target.classList.add('hidden');
  }, true);

  // โหลดพร้อมกันทั้งหมด ส่วนไหนพังก็ไม่ลากส่วนอื่นล้มตาม
  const [profile, skills, experiences, projects, githubProjects] = await Promise.allSettled([
    api.profile.get(), api.skills.list(), api.experiences.list(), api.projects.list(), fetchGithubProjects(),
  ]);

  if (profile.status === 'fulfilled') renderProfile(profile.value);
  else $('#hero-name').textContent = t('โหลดข้อมูลไม่สำเร็จ', 'Failed to load');

  if (skills.status === 'fulfilled') renderSkills(skills.value);
  if (experiences.status === 'fulfilled') renderTimeline(experiences.value);
  if (projects.status === 'fulfilled' && projects.value.length) renderProjects(projects.value);
  else if (githubProjects.status === 'fulfilled') renderProjects(githubProjects.value);
  else renderProjects([]);
  bindDiscovery();

  // ผูก reveal หลังวาดเนื้อหาแล้วเท่านั้น — ถ้าผูกก่อน section ที่อยู่ในจอ
  // จะถูกนับว่า "เห็นแล้ว" ตั้งแต่ยังว่าง ของที่มาทีหลังเลยโผล่ทันทีไม่ทยอยไหล
  bindReveal();
})();
