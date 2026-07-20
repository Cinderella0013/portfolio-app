// ประกอบ Express app — แยกจาก server.js เพื่อให้เขียนเทสต์ได้โดยไม่ต้องเปิดพอร์ต
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes.js';
import { redirectHandler } from './modules/links/links.routes.js';
import { notFound, errorHandler } from './middlewares/error.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1); // อยู่หลัง reverse proxy ของผู้ให้บริการ ทำให้ req.ip ถูกต้อง

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '256kb' }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // บน Vercel หน้าบ้านกับ API อยู่โดเมนเดียวกัน ไม่ต้องเปิด CORS เลย
  // ถ้าแยกโดเมนกัน ให้ตั้ง CORS_ORIGINS เป็นโดเมนหน้าบ้าน
  if (env.corsOrigins.length > 0) {
    app.use(cors({
      origin(origin, cb) {
        // ไม่มี origin = เรียกจาก curl หรือ server ด้วยกันเอง ปล่อยผ่าน
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        // origin นอกลิสต์: แค่ไม่ใส่ header CORS พอ ห้ามโยน error
        // เพราะ request จากโดเมนเดียวกัน (เช่นโดเมนจริงที่เพิ่งผูก) ก็ส่ง Origin มาด้วย
        // ถ้าโยน error จะพังทั้งที่ same-origin ไม่ต้องใช้ CORS เลย
        // ส่วน cross-origin จริงๆ browser จะบล็อกเองเมื่อไม่เห็น header
        cb(null, false);
      },
    }));
  }

  app.use('/api', routes);
  app.get('/s/:code', redirectHandler); // ลิงก์ย่อสาธารณะ เช่น /s/abc123

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
