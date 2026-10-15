import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { updateProfileSchema } from './modules/profile/profile.schema.js';
import { projectSchema, projectPatchSchema } from './modules/projects/projects.schema.js';

process.env.DATABASE_URL ||= 'mongodb://localhost:27017/portfolio';
process.env.JWT_SECRET ||= 'abcdefghijklmnopqrstuvwxyz123456';

const { prisma } = await import('./config/prisma.js');
const { env } = await import('./config/env.js');
const { createApp } = await import('./app.js');
const baseProfile = { fullName: 'Test owner', headline: 'Developer', bio: '' };

test('profile accepts bilingual lifestyle and now content without losing it', () => {
  const content = {
    personality: 'ชอบเรียนรู้', personalityEn: 'Curious', personalityTags: ['ช่างสงสัย'],
    music: 'เพลงระหว่างเขียนโค้ด', musicEn: 'Coding playlist', musicUrl: 'https://open.spotify.com/playlist/example',
    sports: 'แบดมินตัน', sportsEn: 'Badminton', sportsImageUrl: 'https://example.com/sport.jpg',
    nowText: 'กำลังเรียนรู้สิ่งใหม่', nowTextEn: 'Learning something new',
  };
  assert.deepEqual(updateProfileSchema.parse({ ...baseProfile, ...content }), { ...baseProfile, ...content });
  assert.equal(updateProfileSchema.safeParse(baseProfile).success, true);
});

test('new public links reject executable URLs and lifestyle content is bounded', () => {
  for (const field of ['musicUrl', 'sportsImageUrl']) {
    for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'ftp://example.com/file']) {
      assert.equal(updateProfileSchema.safeParse({ ...baseProfile, [field]: value }).success, false, field);
    }
    assert.equal(updateProfileSchema.safeParse({ ...baseProfile, [field]: '' }).success, true);
  }
  assert.equal(updateProfileSchema.safeParse({ ...baseProfile, personalityTags: Array(13).fill('tag') }).success, false);
  assert.equal(updateProfileSchema.safeParse({ ...baseProfile, nowText: 'a'.repeat(2001) }).success, false);
});

test('case study fields survive creation and partial edits; image URLs are safe', () => {
  const story = { problem: 'Problem', problemEn: 'Problem EN', contribution: 'My work', contributionEn: 'My work EN', outcome: 'Result', outcomeEn: 'Result EN', coverUrl: 'https://example.com/project.jpg' };
  const parsed = projectSchema.parse({ title: 'Project', summary: 'Summary', ...story });
  for (const [key, value] of Object.entries(story)) assert.equal(parsed[key], value);
  assert.deepEqual(projectPatchSchema.parse({ outcome: 'Updated result' }), { outcome: 'Updated result' });
  assert.equal(projectSchema.safeParse({ title: 'Project', summary: 'Summary', coverUrl: 'javascript:alert(1)' }).success, false);
});

test('profile API saves public content, protects writes, and dates only changes to now', async (t) => {
  let saved = { id: 'main', ...baseProfile };
  const originalFind = prisma.profile.findUnique;
  const originalUpsert = prisma.profile.upsert;
  prisma.profile.findUnique = async () => saved;
  prisma.profile.upsert = async ({ update }) => (saved = { ...saved, ...update });
  t.after(() => {
    prisma.profile.findUnique = originalFind;
    prisma.profile.upsert = originalUpsert;
  });
  const server = createApp().listen(0);
  const url = `http://127.0.0.1:${server.address().port}/api/profile`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ sub: 'admin' }, env.JWT_SECRET)}` };
  const put = (body) => fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(baseProfile) })).status, 401);
    const start = Date.now();
    const response = await put({ ...baseProfile, personality: 'Curious', personalityTags: ['Builder'], nowText: 'Learning', nowUpdatedAt: '2000-01-01' });
    assert.equal(response.status, 200);
    let profile = (await (await fetch(url)).json()).data;
    assert.equal(profile.personality, 'Curious');
    assert.deepEqual(profile.personalityTags, ['Builder']);
    assert.equal(profile.nowText, 'Learning');
    assert.ok(Date.parse(profile.nowUpdatedAt) >= start);
    const firstDate = profile.nowUpdatedAt;
    await put({ ...baseProfile, personality: 'Updated', nowText: 'Learning' });
    profile = (await (await fetch(url)).json()).data;
    assert.equal(profile.nowUpdatedAt, firstDate);
    await put(baseProfile);
    assert.equal(saved.nowText, 'Learning');
    saved.nowUpdatedAt = new Date(0);
    await put({ ...baseProfile, nowTextEn: 'A new note' });
    assert.ok(saved.nowUpdatedAt.getTime() >= start);
    await put({ ...baseProfile, nowText: '', nowTextEn: '' });
    assert.equal(saved.nowText, null);
    assert.equal(saved.nowTextEn, null);
    assert.equal((await put({ ...baseProfile, musicUrl: 'javascript:alert(1)' })).status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
