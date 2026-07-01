import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const [research, notes, share] = await Promise.all([
    getCollection('research'),
    getCollection('notes'),
    getCollection('share')
  ]);

  const data = {
    research: research.map(r => ({
      type: 'research' as const,
      title: r.data.title,
      snippet: r.data.description,
      tags: r.data.tags,
      url: `/research/${r.slug}`
    })),
    notes: notes.map(n => ({
      type: 'notes' as const,
      title: n.data.title,
      snippet: n.data.summary,
      tags: n.data.tags,
      url: `/notes/${n.slug}`
    })),
    share: share.map(s => ({
      type: 'share' as const,
      title: s.data.title,
      snippet: s.body.slice(0, 120).replace(/\n/g, ' '),
      tags: [] as string[],
      url: `/share#${s.slug}`
    }))
  };

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};
