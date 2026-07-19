// จุดเข้าของ Vercel Serverless Function
// Vercel ไม่ได้เปิดพอร์ตค้างไว้แบบ server.js แต่เรียก handler นี้ต่อ 1 request
// เราจึงส่ง Express app ออกไปตรงๆ โดยไม่เรียก app.listen()
import { createApp } from '../backend/src/app.js';

export default createApp();
