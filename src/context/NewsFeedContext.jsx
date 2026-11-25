import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchNews } from '../services/newsApi';

/** How often the channels are checked for new mivzakim. */
export const NEWS_REFRESH_MS = 30000;

const NewsFeedContext = createContext(null);

/**
 * Loads the mivzakim from all channels once and shares them with every component below it,
 * refreshing every `refreshMs` (default 30s; 0 disables refreshing).
 *
 * Wrap the whole app (or the host's portal) with it, so the ticker and the all-mivzakim
 * screen share one request loop instead of each polling the channels on its own:
 *   <NewsFeedProvider><App /></NewsFeedProvider>
 *
 * Exposed to hosts as 'PortalMivzakim_Client/NewsFeedProvider'.
 */
export function NewsFeedProvider({ refreshMs = NEWS_REFRESH_MS, children }) {
  const [state, setState] = useState({ items: [], loading: true, error: null, updatedAt: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let controller = new AbortController();

    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const items = await fetchNews(controller.signal);
        setState({ items, loading: false, error: null, updatedAt: Date.now() });
      } catch (err) {
        if (err.name === 'AbortError') return;
        // Keep the last items on screen; only the error changes.
        setState((s) => ({ ...s, loading: false, error: err }));
      }
    };

    load();
    const timer = refreshMs > 0 ? window.setInterval(load, refreshMs) : undefined;
    return () => {
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [refreshMs, reloadKey]);

  /** Fetches again right away (e.g. the "נסו שוב" button after a failure). */
  const reload = useCallback(() => {
    // Show the loading state only when there is nothing on screen yet.
    setState((s) => ({ ...s, loading: s.items.length === 0, error: null }));
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo(() => ({ ...state, reload, refreshMs }), [state, reload, refreshMs]);
  return <NewsFeedContext.Provider value={value}>{children}</NewsFeedContext.Provider>;
}

/**
 * The shared mivzakim feed.
 * @returns {{ items: Array, loading: boolean, error: Error|null, updatedAt: number|null,
 *            reload: () => void, refreshMs: number }}
 */
export function useNewsFeed() {
  const feed = useContext(NewsFeedContext);
  if (!feed) throw new Error('useNewsFeed must be used inside <NewsFeedProvider>');
  return feed;
}

/**
 * Uses the NewsFeedProvider above it when there is one; otherwise creates its own.
 * The exposed components (NewsTickerContainer, AllNewsPage) wrap themselves with it, so they
 * keep working when a host imports them without wrapping the portal in NewsFeedProvider.
 */
export function EnsureNewsFeed({ refreshMs, children }) {
  const existing = useContext(NewsFeedContext);
  if (existing) return children;
  return <NewsFeedProvider refreshMs={refreshMs}>{children}</NewsFeedProvider>;
}

export default NewsFeedProvider;
