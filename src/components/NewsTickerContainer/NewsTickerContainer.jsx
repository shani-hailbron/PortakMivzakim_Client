import React from 'react';
import { useNewsFeed } from '../../hooks/useNewsFeed';
import { NewsTicker } from '../NewsTicker/NewsTicker';

export function NewsTickerContainer({ refreshMs, ...props }) {
  const { items, loading, error } = useNewsFeed(refreshMs);
  const emptyText = loading ? 'טוען מבזקים…' : error ? 'לא ניתן לטעון מבזקים כרגע' : 'אין מבזקים כרגע';
  return <NewsTicker items={items} emptyText={emptyText} {...props} />;
}

export default NewsTickerContainer;