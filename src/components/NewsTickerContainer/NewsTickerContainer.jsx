import React from 'react';
import { EnsureNewsFeed, useNewsFeed } from '../../context/NewsFeedContext';
import { NewsTicker } from '../NewsTicker/NewsTicker';

function TickerWithFeed(props) {
  const { items, loading, error } = useNewsFeed();
  const emptyText = loading ? 'טוען מבזקים…' : error ? 'לא ניתן לטעון מבזקים כרגע' : 'אין מבזקים כרגע';
  return <NewsTicker items={items} emptyText={emptyText} {...props} />;
}

/**
 * The ticker with its data. Reads the shared feed from NewsFeedProvider;
 * without a provider above it, it loads the feed itself (`refreshMs` applies only then).
 */
export function NewsTickerContainer({ refreshMs, ...props }) {
  return (
    <EnsureNewsFeed refreshMs={refreshMs}>
      <TickerWithFeed {...props} />
    </EnsureNewsFeed>
  );
}

export default NewsTickerContainer;
