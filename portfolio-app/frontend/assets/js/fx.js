// ลูกเล่นประกอบธีม — ทั้งไฟล์นี้เป็นของเล่น ลบทิ้งได้โดยเว็บยังทำงานครบ
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Y2K: ดาววิ่งตามเมาส์ในส่วน hero ---------- */
if (!reduced) {
  const hero = document.querySelector('.theme-y2k');
  let last = 0;
  hero?.addEventListener('mousemove', (e) => {
    if (Date.now() - last < 90) return; // จำกัดความถี่ ไม่ให้ DOM บวม
    last = Date.now();
    const star = document.createElement('span');
    star.className = 'y2k-sparkle';
    star.textContent = ['✦', '✧', '⋆', '☆'][Math.floor(Math.random() * 4)];
    star.style.left = `${e.clientX + (Math.random() * 16 - 8)}px`;
    star.style.top = `${e.clientY + (Math.random() * 16 - 8)}px`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 700);
  });
}

/* ---------- โหมดปาร์ตี้: พิมพ์รหัส Konami (↑↑↓↓←→←→BA) ---------- */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let pos = 0;
addEventListener('keydown', (e) => {
  pos = e.key === KONAMI[pos] ? pos + 1 : 0;
  if (pos === KONAMI.length) {
    pos = 0;
    document.body.classList.toggle('party');
  }
});

/* ---------- โลโก้ nav: คลิก 5 ครั้งติดๆ หมุนทั้งหน้า 1 รอบ ---------- */
let clicks = 0, clickTimer;
document.getElementById('nav-logo')?.addEventListener('click', () => {
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clicks = 0; }, 800);
  if (++clicks < 5 || reduced) return;
  clicks = 0;
  document.body.style.transition = 'transform 1.2s ease-in-out';
  document.body.style.transform = 'rotate(360deg)';
  setTimeout(() => { document.body.style.transform = ''; }, 1300);
});
