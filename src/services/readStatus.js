/**
 * Keeps track of which mivzakim the user already read, for the current session only.
 *
 * - Entering the mivzakim screen marks everything already in the list as read.
 * - Mivzakim that arrive later (the "N מבזקים חדשים" banner) are unread until clicked.
 * - The state lives in sessionStorage, so every new session (new tab / browser) starts over.
 *
 * If the server exposes a "mark as read" endpoint, set
 * SERVICES.MIVZAKIM.METHODS.MARK_AS_READ in env.config.js and every read is
 * also reported to the server (POST { ids: [...] }).
 */

const STORAGE_KEY = 'PortalMivzakim.readIds';
const CHANGE_EVENT = 'PortalMivzakim:read-change';
const MAX_ENTRIES = 1000;

function readServices() {
  try {
    return JSON.parse(process.env.SERVICES || '{}');
  } catch (error) {
    return {};
  }
}

const mivzakimService = readServices().MIVZAKIM || {};
const serviceUrl = String(mivzakimService.URL || '').trim();
const markAsReadMethod = String(mivzakimService.METHODS?.MARK_AS_READ || '').trim();
const MARK_AS_READ_URL = serviceUrl && markAsReadMethod
  ? `${serviceUrl.replace(/\/+$/, '')}/${markAsReadMethod.replace(/^\/+/, '')}`
  : '';

/** @type {Record<string, number>} id -> time it was read */
let cache = null;

function load() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
    cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    cache = {};
  }
  return cache;
}

function save(entries) {
  const kept = Object.entries(entries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ENTRIES);
  cache = Object.fromEntries(kept);
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Storage is full or blocked: keep the state in memory for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function reportToServer(ids) {
  if (!MARK_AS_READ_URL || ids.length === 0) return;
  fetch(MARK_AS_READ_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ids }),
  }).catch(() => {
    // The local read state is already saved; a failed report is not shown to the user.
  });
}

export function isReadId(id) {
  return Object.prototype.hasOwnProperty.call(load(), String(id));
}

/**
 * A mivzak is read when the user opened it here, or when the server says it was read.
 * Without either, it is unread.
 */
export function isItemRead(item) {
  return isReadId(item.id) || item.isRead === true;
}

export function markAsRead(idOrIds) {
  const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).map(String);
  const entries = { ...load() };
  const now = Date.now();
  const added = ids.filter((id) => !Object.prototype.hasOwnProperty.call(entries, id));
  if (added.length === 0) return;
  added.forEach((id) => { entries[id] = now; });
  save(entries);
  reportToServer(added);
}

/** Calls `listener` whenever the read state changes. */
export function subscribeReadStatus(listener) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
