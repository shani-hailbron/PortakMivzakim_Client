/**
 * N12 mivzakim ("צ'אט הכתבים") – read from the Firebase Realtime Database that n12.co.il itself uses.
 *
 * NOTE: this is not a feed N12 published for outside use. It is open for reading and allows CORS,
 * so no proxy is needed, but N12 can change its structure or close it without notice. If that
 * happens this source fails and is skipped (the other channels keep working).
 *
 * Message shape (only the fields we use):
 *   {
 *     messageID: 1661370,
 *     messageContent: 'המשטרה: ...',                 // the text; may be missing for media posts
 *     medias: [{ typeId: 1, mediaContent: '...' }],   // image/video, with its caption
 *     important: false,
 *     reporter: { reporter: { name: 'מבזקן 12' } },
 *     updatedDate: { time: 1795589203917 },           // epoch ms
 *   }
 */

import { plainText } from './rssSource';

function messageText(message) {
  const text = plainText(message.messageContent);
  if (text) return text;
  const caption = (message.medias || []).map((media) => plainText(media.mediaContent)).find(Boolean);
  return caption || '';
}

export function mapN12Message(key, message, sourceName) {
  const time = Number(message.updatedDate?.time);
  return {
    id: `n12:${message.messageID ?? message.id ?? key}`,
    title: messageText(message),
    details: '',
    source: sourceName,
    publishedAt: Number.isFinite(time) ? new Date(time).toISOString() : '',
    priority: message.important === true ? 'urgent' : 'regular',
    reporter: message.reporter?.reporter?.name || undefined,
  };
}

export async function fetchN12DeskSource(source, signal) {
  // Only the newest `limit` messages (the database keeps a few hundred).
  const url = new URL(source.url);
  url.searchParams.set('orderBy', '"$key"');
  url.searchParams.set('limitToLast', String(source.limit || 30));

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${source.name} failed: ${res.status}`);

  const json = await res.json();
  if (!json || typeof json !== 'object') return [];
  return Object.entries(json)
    .map(([key, message]) => mapN12Message(key, message || {}, source.name))
    .filter((item) => item.title);
}
