import React from 'react';
import { useNewsFeed } from '../../hooks/useNewsFeed';
import { NewsTicker } from './NewsTicker';
import './fonts';

/**
 * Ready-to-use version: loads the data by itself (services/newsApi.js).
 * Use <NewsTicker items={...} /> instead if the host already has the data.
 *
 * @param {object} props    all NewsTicker props except `items`
 * @param {number} [props.refreshMs] refresh interval in ms (default 60s)
 */
export function NewsTickerContainer({ refreshMs, ...props }) {
  const { items, loading, error } = useNewsFeed(refreshMs);
  const emptyText = loading ? 'טוען מבזקים…' : error ? 'לא ניתן לטעון מבזקים כרגע' : 'אין מבזקים כרגע';
  return <NewsTicker items={items} emptyText={emptyText} {...props} />;
}

export default NewsTickerContainer;
