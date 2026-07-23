// ดึงข้อมูลสด "จริง" จาก API ฟรีที่ไม่ต้องใช้ key ให้บอทตอบค่าปัจจุบันได้แม่นแทนการเดา
// ครอบคลุม: อากาศ (Open-Meteo) · คริปโต (CoinGecko) · อัตราแลกเปลี่ยน (er-api)
// ponytail: อากาศล็อกที่ขอนแก่น (เมืองเจ้าของเว็บ) — หลายเมืองค่อยเพิ่ม geocoding ภายหลัง
const fetchJson = async (url, ms = 6000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

// แคชต่อแหล่ง กันยิง API ซ้ำถี่ (ค่าไม่ได้เปลี่ยนทุกวินาที)
const cache = new Map();
async function cached(key, ttlMs, build) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.val;
  const val = await build();
  cache.set(key, { val, at: Date.now() });
  return val;
}

/* ---------- อากาศ (ขอนแก่น) ---------- */
const WEATHER_RE = /อากาศ|อุณหภูมิ|องศา|ร้อน|หนาว|ฝน|แดด|ความชื้น|weather|temperature|\btemp\b|humid|hot|cold|rain/i;
const wmo = (c) => (
  c === 0 ? 'ท้องฟ้าแจ่มใส' : c <= 2 ? 'มีเมฆบางส่วน' : c === 3 ? 'มีเมฆมาก'
    : c <= 48 ? 'มีหมอก' : c <= 57 ? 'ฝนปรอย' : c <= 67 ? 'ฝนตก'
      : c <= 82 ? 'ฝนตกหนัก' : c <= 99 ? 'พายุฝนฟ้าคะนอง' : 'ไม่ทราบสภาพอากาศ'
);
async function weather() {
  const { current: w } = await fetchJson(
    'https://api.open-meteo.com/v1/forecast?latitude=16.4419&longitude=102.836'
    + '&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature&timezone=Asia/Bangkok',
  );
  return `[อากาศสดที่ขอนแก่น] อุณหภูมิ ${Math.round(w.temperature_2m)}°C `
    + `(รู้สึกเหมือน ${Math.round(w.apparent_temperature)}°C), ${wmo(w.weather_code)}, `
    + `ความชื้น ${w.relative_humidity_2m}%`;
}

/* ---------- คริปโต ---------- */
const COINS = [
  { id: 'bitcoin', re: /bitcoin|btc|บิทคอยน์|บิตคอยน์/i, label: 'Bitcoin' },
  { id: 'ethereum', re: /ethereum|eth|อีเธอ/i, label: 'Ethereum' },
  { id: 'binancecoin', re: /\bbnb\b|binance/i, label: 'BNB' },
  { id: 'ripple', re: /\bxrp\b|ripple/i, label: 'XRP' },
  { id: 'dogecoin', re: /doge|โดจ/i, label: 'Dogecoin' },
  { id: 'solana', re: /solana|\bsol\b/i, label: 'Solana' },
  { id: 'tether', re: /tether|usdt/i, label: 'USDT' },
];
const CRYPTO_RE = /คริปโต|crypto|เหรียญ|coin|bitcoin|btc|ethereum|\beth\b|\bbnb\b|\bxrp\b|doge|solana|\bsol\b|usdt/i;
async function crypto(text) {
  let want = COINS.filter((c) => c.re.test(text));
  if (!want.length) want = COINS.slice(0, 2); // ถามคริปโตลอยๆ เอา BTC + ETH
  const ids = want.map((c) => c.id).join(',');
  const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,thb`);
  const rows = want
    .filter((c) => data[c.id])
    .map((c) => `${c.label} $${data[c.id].usd.toLocaleString('en-US')} (฿${data[c.id].thb.toLocaleString('en-US')})`);
  return rows.length ? `[ราคาคริปโตสด] ${rows.join(' · ')}` : null;
}

/* ---------- อัตราแลกเปลี่ยน (ต่อบาท) ---------- */
const CURRENCIES = [
  { code: 'USD', re: /\busd\b|ดอลลาร์|ดอลล่าร์|เหรียญสหรัฐ/i },
  { code: 'EUR', re: /\beur\b|ยูโร/i },
  { code: 'JPY', re: /\bjpy\b|เยน/i },
  { code: 'GBP', re: /\bgbp\b|ปอนด์/i },
  { code: 'CNY', re: /\bcny\b|หยวน|เงินจีน/i },
  { code: 'KRW', re: /\bkrw\b|วอน/i },
];
const CURRENCY_RE = /ค่าเงิน|อัตราแลกเปลี่ยน|เรทเงิน|แลกเงิน|กี่บาท|exchange rate|forex|usd|eur|jpy|gbp|ดอลลาร์|ยูโร|เยน|ปอนด์|หยวน|วอน/i;
async function currency(text) {
  const { rates } = await fetchJson('https://open.er-api.com/v6/latest/USD');
  if (!rates?.THB) return null;
  let want = CURRENCIES.filter((c) => c.re.test(text) && rates[c.code]);
  if (!want.length) want = CURRENCIES.slice(0, 3); // ลอยๆ เอา USD/EUR/JPY
  const rows = want.map((c) => {
    const thbPerUnit = rates.THB / rates[c.code]; // base USD: บาทต่อ 1 หน่วยสกุลนั้น
    return `1 ${c.code} = ${thbPerUnit.toFixed(2)} บาท`;
  });
  return `[อัตราแลกเปลี่ยนสด] ${rows.join(' · ')}`;
}

// รวมข้อมูลสดที่ตรงกับคำถามล่าสุด — ดึงเฉพาะที่เกี่ยวข้อง พังแหล่งไหนก็ข้ามไป
export async function liveData(text) {
  const jobs = [];
  if (WEATHER_RE.test(text)) jobs.push(cached('weather', 10 * 60_000, weather));
  if (CRYPTO_RE.test(text)) jobs.push(cached('crypto:' + text, 3 * 60_000, () => crypto(text)));
  if (CURRENCY_RE.test(text)) jobs.push(cached('fx:' + text, 30 * 60_000, () => currency(text)));
  if (!jobs.length) return '';
  const results = await Promise.allSettled(jobs);
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value)
    .join('\n');
}
