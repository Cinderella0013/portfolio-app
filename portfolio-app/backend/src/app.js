// ประกอบ Express app — แยกจาก server.js เพื่อให้เขียนเทสต์ได้โดยไม่ต้องเปิดพอร์ต
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes.js';
import { notFound, errorHandler } from './middlewares/error.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1); // อยู่หลัง reverse proxy ของผู้ให้บริการ ทำให้ req.ip ถูกต้อง

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '256kb' }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(cors({
    origin(origin, cb) {
      // ไม่มี origin = เรียกจาก curl หรือ server ด้วยกันเอง ปล่อยผ่าน
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`origin ${origin} ไม่ได้รับอนุญาต`));
    },
  }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
