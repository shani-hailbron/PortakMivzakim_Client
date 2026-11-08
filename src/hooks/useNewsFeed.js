import { useEffect, useState } from 'react';
import { fetchNews } from '../services/newsApi';

/**
 * Loads the news list and refreshes it periodically.
 * @param {number} refreshMs polling interval (default 60s). Pass 0 to disable.
 */
export function useNewsFeed(refreshMs = 60000, autoRefresh = true) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    let controller = new AbortController();

    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const items = await fetchNews(controller.signal);
        setState({ items, loading: false, error: null });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setState((s) => ({ ...s, loading: false, error: err }));
      }
    };

    load();
    const timer = autoRefresh && refreshMs > 0 ? window.setInterval(load, refreshMs) : undefined;
    return () => {
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [refreshMs, autoRefresh]);

  return state;
}
