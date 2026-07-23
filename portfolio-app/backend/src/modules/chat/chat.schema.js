import { z } from 'zod';

// รับเฉพาะบทสนทนาสั้นๆ กันคนยัด context ยาวเพื่อผลาญโควตา
export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});
