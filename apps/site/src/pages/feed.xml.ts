import { getCollection } from 'astro:content';
import { snapshotUrl, withBase } from '@aigov/shared';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? '';
  const basePath = withBase(import.meta.env.BASE_URL, '/');
  const base = `${origin}${basePath.replace(/\/$/, '')}`;
  const snapshots = (await getCollection('snapshots'))
    .filter((s) => !s.id.includes('_'))
    .map((s) => {
      const source =
        typeof s.data.source === 'string'
          ? s.data.source
          : (s.data.source as { id: string }).id;
      return {
        source,
        date: s.data.snapshotDate,
        summary: s.data.changeSummary,
        kind: s.data.changeKind,
        material: s.data.materialChange,
        href: `${base}${snapshotUrl(source, s.data.snapshotDate)}`,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const escape = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = snapshots
    .map(
      (s) => `    <item>
      <title>${escape(s.source)} — ${escape(s.summary)}</title>
      <link>${escape(s.href)}</link>
      <guid isPermaLink="true">${escape(s.href)}</guid>
      <pubDate>${new Date(s.date).toUTCString()}</pubDate>
      <category>${escape(s.kind)}</category>
      <description>${escape(s.summary)}${s.material ? ' (material change)' : ''}</description>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI Governance — What's new</title>
    <link>${origin}${withBase(import.meta.env.BASE_URL, '/whats-new/')}</link>
    <description>Tracked changes across authoritative AI regulations and vendor frameworks.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
