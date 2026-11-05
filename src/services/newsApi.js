import { mockNews } from '../mocks/news.mock';

/**
 * ===== REAL DATA GOES HERE =====
 * Set NEWS_API_URL in a .env file (see .env.example).
 * If it is not set, the ticker falls back to the mock data from the design.
 */
const API_URL = process.env.NEWS_API_URL;

/**
 * Maps one raw record from your API to the item shape used by the ticker.
 * TODO: adjust the field names to match the real API response.
 */
function mapApiItem(raw) {
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    source: raw.source ?? '',
    publishedAt: raw.publishedAt ?? raw.date ?? '',
    url: raw.url || undefined,
  };
}

export async function fetchNews(signal) {
  if (!API_URL) return mockNews;

  const res = await fetch(API_URL, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`News API failed: ${res.status}`);

  const json = await res.json();
  // TODO: if the API wraps the list (e.g. { data: [...] }), unwrap it here.
  const list = Array.isArray(json) ? json : json.data ?? json.items ?? [];
  return list.map(mapApiItem);
}
