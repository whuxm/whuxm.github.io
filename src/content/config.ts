import { defineCollection, z } from 'astro:content';

// YAML 会把形如 2026-06-28 的值自动解析为 Date 对象；
// 此处统一还原为 "YYYY-MM-DD" 字符串，保证 schema 始终收到 string。
const dateField = z.preprocess(
  v => v instanceof Date ? v.toISOString().slice(0, 10) : v,
  z.string()
);

const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cover: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['ongoing', 'completed', 'planning']),
    date: dateField
  })
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    date: dateField
  })
});

const share = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: dateField,
    images: z.array(z.string())
  })
});

export const collections = { research, notes, share };
