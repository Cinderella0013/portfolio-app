// ชั้นเดียวที่คุยกับ backend — หน้าอื่นเรียกผ่านที่นี่เท่านั้น
import { API_BASE } from './config.js';

const TOKEN_KEY = 'portfolio.token';

export const token = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (v) => sessionStorage.setItem(TOKEN_KEY, v),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

// error ที่พกข้อความภาษาไทยจาก backend มาให้หน้าจอแสดงได้เลย
export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = token.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองตรวจว่า backend เปิดอยู่หรือไม่', 0);
  }

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) token.clear();
    throw new ApiClientError(
      payload?.error?.message || `เกิดข้อผิดพลาด (${res.status})`,
      res.status,
      payload?.error?.details,
    );
  }
  return payload.data;
}

export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    me: () => request('/auth/me', { auth: true }),
  },
  profile: {
    get: () => request('/profile'),
    update: (data) => request('/profile', { method: 'PUT', body: data, auth: true }),
  },
  skills: {
    list: () => request('/skills'),
    create: (d) => request('/skills', { method: 'POST', body: d, auth: true }),
    update: (id, d) => request(`/skills/${id}`, { method: 'PATCH', body: d, auth: true }),
    remove: (id) => request(`/skills/${id}`, { method: 'DELETE', auth: true }),
  },
  experiences: {
    list: () => request('/experiences'),
    create: (d) => request('/experiences', { method: 'POST', body: d, auth: true }),
    update: (id, d) => request(`/experiences/${id}`, { method: 'PATCH', body: d, auth: true }),
    remove: (id) => request(`/experiences/${id}`, { method: 'DELETE', auth: true }),
  },
  projects: {
    list: (includeDrafts = false) =>
      request(`/projects${includeDrafts ? '?includeDrafts=true' : ''}`, { auth: includeDrafts }),
    create: (d) => request('/projects', { method: 'POST', body: d, auth: true }),
    update: (id, d) => request(`/projects/${id}`, { method: 'PATCH', body: d, auth: true }),
    remove: (id) => request(`/projects/${id}`, { method: 'DELETE', auth: true }),
  },
  links: {
    list: () => request('/links', { auth: true }),
    create: (d) => request('/links', { method: 'POST', body: d, auth: true }),
    remove: (code) => request(`/links/${code}`, { method: 'DELETE', auth: true }),
  },
  chat: {
    status: () => request('/chat/status'),
    send: (messages) => request('/chat', { method: 'POST', body: { messages } }).then((d) => d.reply),
  },
  messages: {
    send: (d) => request('/messages', { method: 'POST', body: d }),
    list: () => request('/messages', { auth: true }),
    markRead: (id, isRead) => request(`/messages/${id}/read`, { method: 'PATCH', body: { isRead }, auth: true }),
    remove: (id) => request(`/messages/${id}`, { method: 'DELETE', auth: true }),
  },
};
