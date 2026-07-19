# Portfolio — ระบบพอร์ตโฟลิโอแบบมีหลังบ้าน

เว็บพอร์ตโฟลิโอที่แก้เนื้อหาได้เองผ่านหน้าหลังบ้าน ไม่ต้องกลับไปแก้โค้ด

## สัดส่วนของระบบ

```
portfolio-app/
├── frontend/                 หน้าบ้าน — HTML + JS ล้วน ไม่ต้อง build
│   ├── index.html            หน้าเว็บสาธารณะ ดึงข้อมูลจาก API
│   ├── admin.html            หลังบ้าน ต้องล็อกอิน
│   └── assets/
│       ├── css/style.css     ระบบสีและตัวอักษรทั้งหมด
│       └── js/
│           ├── config.js     ที่อยู่ของ API
│           ├── api.js        ชั้นเดียวที่คุยกับ backend
│           ├── dom.js        ตัวช่วยที่ใช้ร่วมกัน
│           ├── public.js     ตรรกะหน้าสาธารณะ
│           └── admin.js      ตรรกะหน้าหลังบ้าน
│
├── backend/                  หลังบ้าน — Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     โครงสร้างฐานข้อมูล
│   │   └── seed.js           ข้อมูลตั้งต้น + บัญชีแอดมิน
│   └── src/
│       ├── server.js         เปิดพอร์ต ปิดระบบอย่างเรียบร้อย
│       ├── app.js            ประกอบ Express (แยกไว้เพื่อเขียนเทสต์ได้)
│       ├── routes.js         สารบัญ API ทั้งหมด
│       ├── config/           env.js, prisma.js
│       ├── middlewares/      auth, validate, error
│       ├── utils/            ApiError, asyncHandler
│       └── modules/          แยกตามเรื่อง ไม่แยกตามชนิดไฟล์
│           └── <ชื่อ>/
│               ├── *.routes.js      ผูก URL กับ middleware
│               ├── *.controller.js  แปลง req/res
│               ├── *.service.js     ตรรกะธุรกิจ + คุยฐานข้อมูล
│               └── *.schema.js      กติกาตรวจข้อมูลด้วย zod
│
└── docker-compose.yml        db + api + web ยกขึ้นพร้อมกัน
```

**กติกาการไหลของข้อมูล** — request วิ่งทางเดียวเสมอ:

```
เบราว์เซอร์ → routes → middleware (auth/validate) → controller → service → Prisma → PostgreSQL
```

controller ไม่แตะฐานข้อมูลตรงๆ และ service ไม่รู้จัก `req`/`res` เลย ทำให้ย้าย service ไปใช้ที่อื่น
หรือเขียนเทสต์ได้โดยไม่ต้องจำลอง HTTP

## เริ่มใช้งานในเครื่อง

**ทางที่ 1 — Docker (ง่ายสุด)**

```bash
cp backend/.env.example backend/.env   # แก้ JWT_SECRET กับ ADMIN_PASSWORD ก่อน
docker compose up -d db
cd backend && npm install && npx prisma db push && npm run db:seed && npm run dev
```

เปิดหน้าบ้านด้วยเซิร์ฟเวอร์ไฟล์ธรรมดา (โมดูล ES ใช้ `file://` ไม่ได้):

```bash
cd frontend && npx serve -l 3000
```

- หน้าเว็บ: http://localhost:3000
- หลังบ้าน: http://localhost:3000/admin.html
- API: http://localhost:4000/api/health

**ทางที่ 2 — ใช้ Postgres บนคลาวด์** สร้างฐานข้อมูลฟรีที่ Neon หรือ Supabase
แล้วเอา connection string มาใส่ `DATABASE_URL` ที่เหลือทำเหมือนเดิม

## API

| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/api/health` | ทุกคน | เช็คว่าเซิร์ฟเวอร์ยังอยู่ |
| POST | `/api/auth/login` | ทุกคน | เข้าสู่ระบบ รับ JWT |
| GET | `/api/auth/me` | แอดมิน | ข้อมูลบัญชีที่ล็อกอินอยู่ |
| GET | `/api/profile` | ทุกคน | อ่านโปรไฟล์ |
| PUT | `/api/profile` | แอดมิน | แก้โปรไฟล์ |
| GET | `/api/skills` | ทุกคน | รายการทักษะ |
| POST / PATCH / DELETE | `/api/skills[/:id]` | แอดมิน | จัดการทักษะ |
| GET | `/api/experiences?type=WORK` | ทุกคน | ประวัติ กรองตามประเภทได้ |
| POST / PATCH / DELETE | `/api/experiences[/:id]` | แอดมิน | จัดการประวัติ |
| GET | `/api/projects` | ทุกคน | ผลงานที่เผยแพร่แล้ว |
| GET | `/api/projects/:slug` | ทุกคน | ผลงานชิ้นเดียว |
| POST / PATCH / DELETE | `/api/projects[/:id]` | แอดมิน | จัดการผลงาน |
| POST | `/api/messages` | ทุกคน | ส่งข้อความจากฟอร์มติดต่อ |
| GET / PATCH / DELETE | `/api/messages[/:id]` | แอดมิน | อ่านและจัดการข้อความ |

คำตอบมีรูปแบบเดียวกันหมด: สำเร็จได้ `{ "ok": true, "data": ... }` ผิดพลาดได้ `{ "ok": false, "error": { "message": "...", "details": [...] } }`

## ความปลอดภัยที่ใส่ไว้แล้ว

- รหัสผ่านเก็บเป็น bcrypt hash (cost 12) ไม่เคยเก็บรหัสจริง
- JWT หมดอายุตามค่า `JWT_EXPIRES_IN` เก็บใน `sessionStorage` (ปิดแท็บแล้วหลุด)
- จำกัดจำนวนครั้ง: ล็อกอิน 10 ครั้ง/15 นาที, ส่งข้อความ 5 ครั้ง/ชั่วโมง ต่อ IP
- ตรวจข้อมูลขาเข้าทุกเส้นทางด้วย zod ก่อนถึงตรรกะธุรกิจ
- CORS อนุญาตเฉพาะโดเมนที่ระบุใน `CORS_ORIGINS`
- helmet ตั้งค่า security header ให้
- ทุกข้อความจากผู้ใช้ผ่าน `esc()` ก่อนใส่ลง DOM กัน XSS
- IP ของผู้ส่งข้อความเก็บเป็นแฮช ไม่เก็บของจริง
- ฟอร์มติดต่อมี honeypot ดักบอทที่กรอกทุกช่อง

## เอาขึ้นออนไลน์จริง

1. **ฐานข้อมูล** — Neon หรือ Supabase (มีแพลนฟรี) เอา connection string มาใส่ `DATABASE_URL`
2. **หลังบ้าน** — Railway, Render หรือ Fly.io ชี้ไปที่โฟลเดอร์ `backend/` (มี Dockerfile ให้แล้ว)
   ตั้ง env ให้ครบ โดยเฉพาะ `JWT_SECRET` ที่สุ่มใหม่ และ `CORS_ORIGINS` เป็นโดเมนหน้าบ้านจริง
3. **หน้าบ้าน** — Netlify, Vercel หรือ Cloudflare Pages ลากโฟลเดอร์ `frontend/` ขึ้นไปได้เลย
   อย่าลืมแก้ `API_BASE` ใน `assets/js/config.js` ให้ชี้ไปที่โดเมน backend
4. รัน `npx prisma migrate deploy` แล้วตามด้วย `npm run db:seed` ครั้งเดียวเพื่อสร้างบัญชีแอดมิน

## สิ่งที่ควรทำต่อ

- อัปโหลดรูปภาพจริง (ตอนนี้รับเป็น URL) — ต่อกับ Cloudinary หรือ S3
- ส่งอีเมลแจ้งเตือนเมื่อมีคนทักผ่านฟอร์ม (Resend, Postmark)
- เขียนเทสต์ — `app.js` แยกจาก `server.js` ไว้แล้วเพื่อการนี้
- ทำ SEO ให้หน้าเว็บ ถ้าต้องการให้ Google เห็นเนื้อหา ควรย้ายหน้าบ้านไป Next.js เพื่อ render ฝั่งเซิร์ฟเวอร์
