/**
 * Reads mivzakim straight from a channel's RSS feed (RSS 2.0).
 *
 * The channels do not send CORS headers (Ynet even answers 403 when an Origin header
 * is present), so the browser can't call them directly. The URL configured for each
 * source is therefore a path on our own server that proxies to the channel:
 *   - local: webpack devServer.proxy (see webpack.config.js)
 *   - other environments: a reverse proxy / gateway rule with the same path,
 *     or set the full URL through the env variable named in env.config.js.
 */

function text(node, tagName) {
  const element = node.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : '';
}

/** Strips HTML from an RSS description (some feeds put markup inside CDATA). */
export function plainText(value) {
  if (!value) return '';
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function parseRss(xml, { sourceName, idPrefix }) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`${sourceName}: invalid RSS response`);
  }

  return Array.from(doc.getElementsByTagName('item')).map((node) => {
    const link = text(node, 'link');
    const guid = text(node, 'guid') || link;
    const title = plainText(text(node, 'title'));
    const date = new Date(text(node, 'pubDate'));

    return {
      id: `${idPrefix}:${guid || title}`,
      title,
      details: plainText(text(node, 'description')),
      source: sourceName,
      publishedAt: Number.isNaN(date.getTime()) ? '' : date.toISOString(),
      url: link || undefined,
    };
  });
}

/**
 * Keeps only items whose link path starts with one of the prefixes (e.g. ['/news/']).
 * Used for channels that have no mivzakim feed, only a general one with sport, food etc.
 */
function matchesLinkPath(item, prefixes) {
  if (!prefixes || prefixes.length === 0) return true;
  if (!item.url) return false;
  try {
    const { pathname } = new URL(item.url);
    return prefixes.some((prefix) => pathname.startsWith(prefix));
  } catch (error) {
    return false;
  }
}

export async function fetchRssSource(source, signal) {
  const res = await fetch(source.url, {
    signal,
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!res.ok) throw new Error(`${source.name} RSS failed: ${res.status}`);
  return parseRss(await res.text(), { sourceName: source.name, idPrefix: source.key })
    .filter((item) => matchesLinkPath(item, source.linkPathPrefixes));
}
