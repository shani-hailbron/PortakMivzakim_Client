import { fetchRssSource } from './rssSource';
import { fetchN12DeskSource } from './n12DeskSource';
import { fetchWordpressSource } from './wordpressSource';

/** How each source TYPE in NEWS_SOURCES is read. */
const sourceFetchers = {
  rss: fetchRssSource,
  'n12-desk': fetchN12DeskSource,
  wordpress: fetchWordpressSource,
};

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

/** Channels read directly (SERVICES.MIVZAKIM.NEWS_SOURCES in env.config.js). */
const NEWS_SOURCES = Object.entries(mivzakimService.NEWS_SOURCES || {})
  .map(([key, source]) => ({
    key: key.toLowerCase(),
    type: source.TYPE || 'rss',
    name: source.NAME,
    url: String(source.URL || '').trim(),
    limit: source.LIMIT,
    linkPathPrefixes: source.LINK_PATH_PREFIXES || [],
  }))
  .filter((source) => source.url && source.name && sourceFetchers[source.type]);

const DAY_MS = 24 * 60 * 60 * 1000;
const weekdayFormatter = new Intl.DateTimeFormat('he-IL', { weekday: 'long' });

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysBetween(date, now) {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
}

/** "היום · יום שני 2.11" / "אתמול · יום ראשון 1.11" / "יום שבת 31.10" – same format as the design. */
function getDayLabel(date, now) {
  const dayText = `${weekdayFormatter.format(date)} ${date.getDate()}.${date.getMonth() + 1}`;
  const daysAgo = daysBetween(date, now);
  if (daysAgo === 0) return `היום · ${dayText}`;
  if (daysAgo === 1) return `אתמול · ${dayText}`;
  return dayText;
}

function getRelativeTime(date, now) {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const daysAgo = daysBetween(date, now);
  if (daysAgo === 0) {
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'לפני שעה';
    if (hours === 2) return 'לפני שעתיים';
    return `לפני ${hours} שעות`;
  }
  return daysAgo === 1 ? 'אתמול' : '';
}

/** Fills relativeTime / dayLabel from publishedAt when the source didn't send them. */
function withTimeLabels(item, now) {
  const date = new Date(item.publishedAt);
  if (Number.isNaN(date.getTime())) return item;
  return {
    ...item,
    relativeTime: item.relativeTime || getRelativeTime(date, now),
    dayLabel: item.dayLabel || getDayLabel(date, now),
  };
}

const sourceAliases = {
  n12: 'חדשות 12',
  ynet: 'וויינט',
};

function mapSource(value) {
  const source = String(value ?? '').trim();
  return sourceAliases[source.toLocaleLowerCase('he')] || source;
}

function readFlag(raw) {
  const isRead = raw.isRead ?? raw.IsRead;
  if (isRead !== undefined && isRead !== null) return isRead === true || isRead === 1;
  const isUnread = raw.isUnread ?? raw.IsUnread;
  if (isUnread !== undefined && isUnread !== null) return !(isUnread === true || isUnread === 1);
  return undefined;
}

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
    source: mapSource(raw.source ?? raw.Source ?? raw.sourceName ?? raw.SourceName),
    publishedAt: raw.publishedAt ?? raw.PublishedAt ?? raw.date ?? raw.Date ?? raw.createdAt ?? raw.CreatedAt ?? '',
    details: raw.details ?? raw.Details ?? raw.description ?? raw.Description ?? raw.summary ?? raw.Summary ?? '',
    priority: isUrgent ? 'urgent' : 'regular',
    relativeTime: raw.relativeTime ?? raw.RelativeTime ?? '',
    dayLabel: raw.dayLabel ?? raw.DayLabel,
    isNew: raw.isNew === true || raw.IsNew === true,
    // Read state from the server, if it sends one. Otherwise the browser keeps it (services/readStatus.js).
    isRead: readFlag(raw),
    url: raw.url ?? raw.Url ?? undefined,
  };
}

/**
 * Reads every configured channel in parallel. A channel that fails is skipped,
 * so one broken feed doesn't hide the others; it throws only when all of them failed.
 */
async function fetchChannelsNews(signal) {
  if (NEWS_SOURCES.length === 0) throw new Error('No news source is configured');

  const results = await Promise.allSettled(
    NEWS_SOURCES.map((source) => sourceFetchers[source.type](source, signal)),
  );
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length === results.length) throw failed[0].reason;
  failed.forEach((result) => console.warn('[PortalMivzakim] news source failed:', result.reason));

  const now = new Date();
  return results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .map((item) => withTimeLabels(item, now));
}

function timeOf(item) {
  return new Date(item.publishedAt).getTime();
}

/** Items without a valid date are not shown at all. */
function hasValidDate(item) {
  return !Number.isNaN(timeOf(item));
}

/** Newest first, across all channels. */
function sortNewestFirst(items) {
  return [...items].sort((a, b) => timeOf(b) - timeOf(a));
}

/**
 * Where the mivzakim come from:
 *   - SERVICES.MIVZAKIM.URL  – the internal mivzakim API, when configured.
 *   - Otherwise              – straight from the channels (NEWS_SOURCES: RSS feeds, N12 desk, WordPress).
 * The list always comes back without undated items and sorted newest first,
 * so every component (ticker, all-news page) gets it that way.
 */
export async function fetchNews(signal) {
  const items = await loadNews(signal);
  return sortNewestFirst(items.filter(hasValidDate));
}

async function loadNews(signal) {
  if (!API_URL) return fetchChannelsNews(signal);

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
  const now = new Date();
  return list.map((raw) => withTimeLabels(mapApiItem(raw), now));
}
