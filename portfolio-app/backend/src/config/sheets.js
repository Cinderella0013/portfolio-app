// คุยกับ Google Sheets API ตรงๆ ผ่าน fetch — ไม่ใช้แพ็กเกจ googleapis
// เพราะตัวนั้นหนักมากบน serverless แค่เซ็น JWT ขอ access token เองก็พอ
import jwt from 'jsonwebtoken';
import { env } from './env.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const sheetsEnabled = Boolean(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY && env.SHEETS_ID);

// เก็บ token ไว้ใช้ซ้ำจนใกล้หมดอายุ จะได้ไม่ขอใหม่ทุก request
let cached = { token: null, expiresAt: 0 };

async function accessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  // ค่าใน env เก็บ \n เป็นตัวอักษรจริงไม่ได้ จึงเก็บเป็น "\\n" แล้วแปลงกลับตรงนี้
  const key = env.GOOGLE_SA_KEY.replace(/\\n/g, '\n');
  const assertion = jwt.sign(
    {
      iss: env.GOOGLE_SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    key,
    { algorithm: 'RS256' },
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`ขอ token จาก Google ไม่ผ่าน: ${data.error_description || data.error || res.status}`);

  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

// เรียก Sheets API — path ต่อท้าย /spreadsheets/{SHEETS_ID} เช่น '/values/links!A2:D'
export async function sheets(path, { method = 'GET', body } = {}) {
  const token = await accessToken();
  const res = await fetch(`${SHEETS_API}/${env.SHEETS_ID}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Sheets API (${res.status}): ${data.error?.message || 'ไม่ทราบสาเหตุ'}`);
  return data;
}
