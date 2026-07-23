// แชทบอท — proxy ไป OpenAI-compatible API โดยเก็บ key ไว้ฝั่ง server เท่านั้น
// (ถ้าฝัง key ในหน้าบ้าน ใครเปิดเว็บก็ขโมย key ไปใช้ได้)
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export const chatEnabled = Boolean(env.CHATBOT_API_KEY);

// system prompt เปลี่ยนตามข้อมูลโปรไฟล์จริง แคชไว้ 5 นาที ไม่ต้อง query ทุกข้อความ
let cachedPrompt = { text: null, at: 0 };

async function systemPrompt() {
  if (cachedPrompt.text && Date.now() - cachedPrompt.at < 5 * 60_000) return cachedPrompt.text;

  const [profile, projects] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'main' } }),
    prisma.project.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
      take: 12,
      select: { title: true, summary: true },
    }),
  ]);

  const name = profile?.fullName || 'เจ้าของเว็บ';
  const lines = [
    `คุณเป็นผู้ช่วย AI ที่เป็นมิตรและมีความรู้กว้าง อยู่บนเว็บพอร์ตโฟลิโอของ "${name}"`,
    `กฎสำคัญ: ตอบเนื้อหาที่ผู้ใช้ถามทันทีและตรงประเด็น ห้ามตอบแค่ทักทายลอยๆ หรือถามกลับว่าให้ช่วยอะไร`,
    `ตอบได้ทุกเรื่องเต็มที่ ทั้งเรื่องทั่วไป (สภาพอากาศ ความรู้ ทำอาหาร คำแนะนำ ฯลฯ) และเรื่องของ ${name}`,
    `ถ้าเป็นข้อมูลสดที่คุณไม่มีจริง (อากาศ ณ ขณะนี้ ราคาปัจจุบัน ข่าววันนี้) ให้บอกสั้นๆ ว่าไม่มีข้อมูลเรียลไทม์ แล้วให้ความรู้/คำแนะนำทั่วไปที่เป็นประโยชน์แทน เช่น อากาศตามฤดูกาล`,
    `ตอบด้วยน้ำเสียงเป็นกันเองและกระชับ ภาษาเดียวกับที่ผู้ใช้ถาม (ไทยหรืออังกฤษ)`,
    `ถ้าถามเรื่องจ้างงานหรือติดต่อ ให้แนะนำฟอร์มติดต่อในหน้าเว็บ`,
    `--- ข้อมูลของ ${name} (ใช้เมื่อถูกถามถึง) ---`,
    profile?.headline ? `ตำแหน่ง: ${profile.headline}` : null,
    profile?.location ? `ที่อยู่: ${profile.location}` : null,
    profile?.bio ? `แนะนำตัว: ${profile.bio}` : null,
    projects.length ? `ผลงานเด่น:\n${projects.map((p) => `- ${p.title}: ${p.summary}`).join('\n')}` : null,
  ].filter(Boolean);

  cachedPrompt = { text: lines.join('\n'), at: Date.now() };
  return cachedPrompt.text;
}

export const chatService = {
  async reply(messages) {
    if (!chatEnabled) throw ApiError.badRequest('ระบบแชทยังไม่พร้อมใช้งาน');

    const body = {
      model: env.CHATBOT_MODEL,
      messages: [{ role: 'system', content: await systemPrompt() }, ...messages],
      max_tokens: 800,
      temperature: 0.6,
    };

    let res;
    try {
      res = await fetch(`${env.CHATBOT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CHATBOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new ApiError(502, 'ต่อระบบแชทไม่ได้ ลองใหม่อีกครั้ง');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(502, `ระบบแชทตอบกลับผิดพลาด (${res.status})`);

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new ApiError(502, 'ระบบแชทไม่มีคำตอบ');
    return text;
  },
};
