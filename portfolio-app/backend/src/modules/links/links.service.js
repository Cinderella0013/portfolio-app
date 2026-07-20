// ย่อลิงก์ — เก็บข้อมูลใน Google Sheets แท็บ "links" (คอลัมน์: code, url, clicks, createdAt)
import crypto from 'node:crypto';
import { sheets, sheetsEnabled } from '../../config/sheets.js';
import { ApiError } from '../../utils/ApiError.js';

const TAB = 'links';
let tabReady = false; // เช็คครั้งเดียวต่อการรัน process
let cachedGid = null; // sheetId ตัวเลขของแท็บ ใช้ตอนลบแถว

function requireSheets() {
  if (!sheetsEnabled) {
    throw new ApiError(503, 'ยังไม่ได้ตั้งค่า Google Sheets — ต้องใส่ GOOGLE_SA_EMAIL, GOOGLE_SA_KEY, SHEETS_ID');
  }
}

// สร้างแท็บ links พร้อมหัวตารางถ้ายังไม่มี ผู้ใช้จะได้ไม่ต้องเตรียมชีตเอง
async function ensureTab() {
  if (tabReady) return;
  const meta = await sheets('?fields=sheets.properties');
  const tab = meta.sheets?.find((s) => s.properties.title === TAB);
  if (tab) {
    cachedGid = tab.properties.sheetId;
  } else {
    const res = await sheets(':batchUpdate', {
      method: 'POST',
      body: { requests: [{ addSheet: { properties: { title: TAB } } }] },
    });
    cachedGid = res.replies[0].addSheet.properties.sheetId;
    await sheets(`/values/${TAB}!A1:D1?valueInputOption=RAW`, {
      method: 'PUT',
      body: { values: [['code', 'url', 'clicks', 'createdAt']] },
    });
  }
  tabReady = true;
}

async function rows() {
  await ensureTab();
  const data = await sheets(`/values/${TAB}!A2:D`);
  return (data.values || []).map(([code, url, clicks, createdAt], i) => ({
    code, url, clicks: Number(clicks || 0), createdAt,
    rowIndex: i + 2, // แถวจริงในชีต (1-based, ข้ามหัวตาราง)
  }));
}

export const linksService = {
  async list() {
    requireSheets();
    return (await rows()).map(({ rowIndex, ...link }) => link).reverse(); // ใหม่สุดขึ้นก่อน
  },

  async create({ url, code }) {
    requireSheets();
    const all = await rows();
    const finalCode = code || crypto.randomBytes(4).toString('base64url').slice(0, 6);
    if (all.some((r) => r.code === finalCode)) {
      throw ApiError.conflict(`ชื่อสั้น "${finalCode}" ถูกใช้แล้ว ลองชื่ออื่น`);
    }
    await sheets(`/values/${TAB}!A:D:append?valueInputOption=RAW`, {
      method: 'POST',
      body: { values: [[finalCode, url, 0, new Date().toISOString()]] },
    });
    return { code: finalCode, url, clicks: 0 };
  },

  async remove(code) {
    requireSheets();
    const row = (await rows()).find((r) => r.code === code);
    if (!row) throw ApiError.notFound('ไม่พบลิงก์นี้');
    await sheets(':batchUpdate', {
      method: 'POST',
      body: {
        requests: [{
          deleteDimension: {
            range: { sheetId: cachedGid, dimension: 'ROWS', startIndex: row.rowIndex - 1, endIndex: row.rowIndex },
          },
        }],
      },
    });
  },

  // หา URL ปลายทางแล้วนับคลิกแบบไม่รอผล — คนคลิกไม่ควรต้องรอเราเขียนชีต
  async resolve(code) {
    requireSheets();
    const row = (await rows()).find((r) => r.code === code);
    if (!row) return null;
    sheets(`/values/${TAB}!C${row.rowIndex}?valueInputOption=RAW`, {
      method: 'PUT',
      body: { values: [[row.clicks + 1]] },
    }).catch(() => {}); // นับคลิกพลาดไม่ใช่เรื่องใหญ่ ปล่อยผ่าน
    return row.url;
  },
};
