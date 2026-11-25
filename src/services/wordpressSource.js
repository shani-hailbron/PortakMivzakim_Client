/**
 * Latest posts from a WordPress site's standard REST API (/wp-json/wp/v2/posts).
 * Used for Channel 14 (c14.co.il), which has no mivzakim feed. The API allows CORS,
 * so no proxy is needed.
 */

import { plainText } from './rssSource';

/** WordPress `date_gmt` is UTC without a zone ("2026-11-25T07:16:41"). */
function toIso(dateGmt) {
  if (!dateGmt) return '';
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(dateGmt) ? dateGmt : `${dateGmt}Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function mapWordpressPost(post, { sourceName, idPrefix }) {
  return {
    id: `${idPrefix}:${post.id}`,
    // title/excerpt come as HTML (entities like &quot; and <p> tags).
    title: plainText(post.title?.rendered),
    details: plainText(post.excerpt?.rendered),
    source: sourceName,
    publishedAt: toIso(post.date_gmt),
    url: post.link || undefined,
  };
}

export async function fetchWordpressSource(source, signal) {
  const url = new URL(source.url);
  url.searchParams.set('per_page', String(source.limit || 30));
  // Only the fields we use – the full post objects are much larger.
  url.searchParams.set('_fields', 'id,date_gmt,link,title,excerpt');

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${source.name} failed: ${res.status}`);

  const posts = await res.json();
  if (!Array.isArray(posts)) return [];
  return posts
    .map((post) => mapWordpressPost(post, { sourceName: source.name, idPrefix: source.key }))
    .filter((item) => item.title);
}
