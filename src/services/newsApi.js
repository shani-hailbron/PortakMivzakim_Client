import { mockNews } from '../mocks/news.mock';

function readServices() {
  try {
    return JSON.parse(process.env.SERVICES || '{}');
  } catch (error) {
    return {};
  }
}

const mivzakimService = readServices().MIVZAKIM || {};
const serviceUrl = String(mivzakimService.URL || '').trim();
const getListMethod = mivzakimService.METHODS?.GET_MIVZAKIM || 'Mivzakim/GetList';
const API_URL = serviceUrl
  ? `${serviceUrl.replace(/\/+$/, '')}/${getListMethod.replace(/^\/+/, '')}`
  : '';

/**
 * Maps one raw record from your API to the item shape used by the ticker.
 * TODO: adjust the field names to match the real API response.
 */
function mapApiItem(raw) {
  const priority = raw.priority ?? raw.Priority ?? raw.urgency ?? raw.Urgency;
  const urgentValue = raw.isUrgent ?? raw.IsUrgent ?? raw.urgent ?? raw.Urgent;
  const isUrgent = urgentValue === true || urgentValue === 1 ||
    ['urgent', 'high', 'דחוף', 'true', '1'].includes(String(priority ?? urgentValue).toLowerCase());

  return {
    id: String(raw.id ?? raw.Id ?? raw.mivzakId ?? raw.MivzakId ?? `${raw.title ?? raw.Title}-${raw.date ?? raw.Date ?? ''}`),
    title: raw.title ?? raw.Title ?? raw.headline ?? raw.Headline ?? '',
    source: raw.source ?? raw.Source ?? raw.sourceName ?? raw.SourceName ?? '',
    publishedAt: raw.publishedAt ?? raw.PublishedAt ?? raw.date ?? raw.Date ?? raw.createdAt ?? raw.CreatedAt ?? '',
    details: raw.details ?? raw.Details ?? raw.description ?? raw.Description ?? raw.summary ?? raw.Summary ?? '',
    priority: isUrgent ? 'urgent' : 'regular',
    relativeTime: raw.relativeTime ?? raw.RelativeTime ?? '',
    dayLabel: raw.dayLabel ?? raw.DayLabel,
    isNew: raw.isNew === true || raw.IsNew === true,
    url: raw.url ?? raw.Url ?? undefined,
  };
}

export async function fetchNews(signal) {
  if (!API_URL) return mockNews;

  const res = await fetch(API_URL, {
    signal,
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`News API failed: ${res.status}`);

  const json = await res.json();
  const list = Array.isArray(json)
    ? json
    : json.data ?? json.Data ?? json.items ?? json.Items ?? json.list ?? json.List ?? json.result ?? [];
  return list.map(mapApiItem);
}
