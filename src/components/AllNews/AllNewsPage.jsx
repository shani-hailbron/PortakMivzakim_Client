import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EnsureNewsFeed, useNewsFeed } from '../../context/NewsFeedContext';
import { useReadStatus } from '../../hooks/useReadStatus';
import {
  AllNewsSearchIcon,
  AllNewsArrowUpIcon,
  AllNewsDotIcon,
  AllNewsMarkerIcon,
  AllNewsAllSourcesIcon,
  AllNewsEmptyStateIcon,
  AllNewsNoFlashesIcon,
  AllNewsOfflineIcon,
  AllNewsToggleIcon,
  AllNewsPlayIcon,
  AllNewsLiveIcon,
} from '../../assets';
import { ChannelIcon } from '../ChannelIcon/ChannelIcon';
import styles from './AllNews.module.css';

const sourceFilters = ['וויינט ספורט', 'ישראל היום', 'חדשות 12', 'ערוץ 14', 'וויינט', 'הארץ'];

const sourcePrepositions = {
  'וויינט ספורט': 'מוויינט ספורט',
  'ישראל היום': 'מישראל היום',
  'חדשות 12': 'מחדשות 12',
  'ערוץ 14': 'מערוץ 14',
  'וויינט': 'מוויינט',
  'הארץ': 'מהארץ',
};

function itemTime(item) {
  const date = new Date(item.publishedAt);
  if (Number.isNaN(date.getTime())) return String(item.publishedAt || '');
  return new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function isToday(item) {
  if (item.dayLabel) return item.dayLabel.startsWith('היום');

  const publishedAt = new Date(item.publishedAt);
  const now = new Date();
  return !Number.isNaN(publishedAt.getTime()) &&
    publishedAt.getFullYear() === now.getFullYear() &&
    publishedAt.getMonth() === now.getMonth() &&
    publishedAt.getDate() === now.getDate();
}

function NewsItem({ item, selected, isUnread, showSource = true, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.flash} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={styles.flashBody}>
        {showSource && (
          <span className={styles.meta}>
            <ChannelIcon name={item.source} className={styles.sourceLogo} />
            <span className={styles.source}>{item.source}</span>
          </span>
        )}
        <span className={styles.headline}>{item.title}</span>
        {item.details && <span className={styles.details}>{item.details}</span>}
      </span>
      <span className={styles.rail} aria-hidden="true">
        <AllNewsMarkerIcon className={styles.marker} aria-hidden="true" />
        {isUnread && <AllNewsDotIcon className={styles.newDot} aria-hidden="true" />}
        {isUnread && <span className={styles.visuallyHidden}>לא נקרא</span>}
      </span>
      <time className={styles.time} dateTime={item.publishedAt}>
        {itemTime(item)}
        <span>{item.relativeTime || ''}</span>
      </time>
    </button>
  );
}

function AllNewsWithFeed(props) {
  return <AllNewsView {...props} feed={useNewsFeed()} />;
}

/**
 * The all-mivzakim screen.
 * - `items` given: shows them as they are (no requests).
 * - Otherwise: reads the shared feed from NewsFeedProvider; without a provider above it,
 *   it loads the feed itself (`refreshMs` applies only then).
 */
export function AllNewsPage({ refreshMs, ...props }) {
  if (props.items !== undefined) return <AllNewsView {...props} feed={null} />;
  return (
    <EnsureNewsFeed refreshMs={refreshMs}>
      <AllNewsWithFeed {...props} />
    </EnsureNewsFeed>
  );
}

function AllNewsView({
  items: suppliedItems,
  feed,
  totalCount,
  className = '',
}) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('כל המקורות');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [visibleItemCount, setVisibleItemCount] = useState(6);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const initialized = useRef(false);
  const displayedRef = useRef([]);
  const pendingRef = useRef([]);
  const listRef = useRef(null);
  const { isRead, markAsRead } = useReadStatus();
  const usesFeed = Boolean(feed);
  // While the server is failing, live updating is paused (Figma: "עדכון חי מושהה"); it resumes once a request succeeds.
  const [feedHasError, setFeedHasError] = useState(false);
  const liveActive = autoRefresh && !feedHasError;
  const feedFailed = usesFeed && Boolean(feed.error);
  useEffect(() => setFeedHasError(feedFailed), [feedFailed]);
  const incomingItems = usesFeed ? feed.items : suppliedItems;
  const loading = usesFeed && feed.loading;

  // The feed is shared (the ticker keeps updating), so pausing this screen means not taking
  // in updates. When the user resumes, the channels are asked again right away, as before.
  const wasAutoRefresh = useRef(autoRefresh);
  useEffect(() => {
    if (autoRefresh && !wasAutoRefresh.current && usesFeed) feed.reload();
    wasAutoRefresh.current = autoRefresh;
  }, [autoRefresh]);

  useEffect(() => {
    if (loading) return;
    // Paused: keep showing what is on screen (the first load still goes through).
    if (initialized.current && usesFeed && !liveActive) return;
    const incoming = sortNewestFirst(incomingItems || []);
    // A failed first load must not initialise the list as empty (later items would all count as "new").
    if (!initialized.current && feedFailed && incoming.length === 0) return;

    if (!initialized.current) {
      const currentItems = incoming.filter((item) => !item.isNew);
      const newItems = incoming.filter((item) => item.isNew);
      const initialItems = currentItems.length > 0 ? currentItems : incoming;
      const initialPending = currentItems.length > 0 ? newItems : [];
      displayedRef.current = initialItems;
      pendingRef.current = initialPending;
      setDisplayedItems(initialItems);
      setPendingItems(initialPending);
      // Entering the screen: everything already in the list counts as read.
      markAsRead(initialItems.map((item) => item.id));
      initialized.current = true;
      return;
    }

    const knownIds = new Set([...displayedRef.current, ...pendingRef.current].map((item) => String(item.id)));
    const incomingById = new Map(incoming.map((item) => [String(item.id), item]));
    const updatedDisplayed = displayedRef.current.map((item) => incomingById.get(String(item.id)) || item);
    const updatedPending = pendingRef.current.map((item) => incomingById.get(String(item.id)) || item);
    const additions = incoming.filter((item) => !knownIds.has(String(item.id)));
    const nextPending = sortNewestFirst([...updatedPending, ...additions]);

    displayedRef.current = updatedDisplayed;
    pendingRef.current = nextPending;
    setDisplayedItems(updatedDisplayed);
    setPendingItems(nextPending);
  }, [incomingItems, loading, feedFailed, liveActive]);

  useEffect(() => {
    setVisibleItemCount(6);
  }, [query, selectedSource]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('he');
    return displayedItems.filter((item) => {
      const matchesSource = selectedSource === 'כל המקורות' || item.source === selectedSource;
      const searchable = `${item.title} ${item.source} ${item.details || ''}`.toLocaleLowerCase('he');
      return matchesSource && searchable.includes(normalizedQuery);
    });
  }, [displayedItems, query, selectedSource]);

  const groupedItems = useMemo(() => {
    const groups = [];
    filteredItems.slice(0, visibleItemCount).forEach((item) => {
      const label = item.dayLabel;
      let group = groups[groups.length - 1];
      if (!group || group.label !== label) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
  }, [filteredItems, visibleItemCount]);

  const todayItems = useMemo(() => {
    const uniqueItems = new Map(
      [...displayedItems, ...pendingItems].map((item) => [String(item.id), item]),
    );
    return [...uniqueItems.values()].filter(isToday);
  }, [displayedItems, pendingItems]);

  const acceptUpdates = () => {
    const nextItems = sortNewestFirst([...displayedRef.current, ...pendingRef.current]);
    displayedRef.current = nextItems;
    pendingRef.current = [];
    setDisplayedItems(nextItems);
    setPendingItems([]);
    if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const trimmedQuery = query.trim();
  const isSourceFiltered = selectedSource !== 'כל המקורות';
  const showError = feedFailed && displayedItems.length === 0 && !loading;
  let countText = `${totalCount ?? todayItems.length} מבזקים היום`;
  if (showError) countText = 'המבזקים לא זמינים כרגע';
  else if (trimmedQuery !== '') countText = `${filteredItems.length} תוצאות ל"${trimmedQuery}"`;
  else if (isSourceFiltered) countText = `${filteredItems.length} מבזקים ${sourcePrepositions[selectedSource]} היום`;
  const isEmpty = !loading && !showError && groupedItems.length === 0;
  const nextItem = filteredItems[visibleItemCount];
  const nextGroupLabel = nextItem?.dayLabel;
  const lastVisibleGroup = groupedItems[groupedItems.length - 1];

  const clearFilters = () => {
    setQuery('');
    setSelectedSource('כל המקורות');
  };

  return (
    <main className={`${styles.page} ${className}`} dir="rtl">
      <div className={styles.content}>
        <header className={styles.pageHead}>
          <div className={styles.actions}>
            <label className={styles.search}>
              <span className={styles.visuallyHidden}>חיפוש במבזקים</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="חיפוש במבזקים"
              />
              <AllNewsSearchIcon width="24" height="24" aria-hidden="true" />
            </label>
            <button
              type="button"
              className={styles.liveStatus}
              onClick={() => {
                // Paused because of a server error: resuming means trying the server again.
                if (feedHasError && autoRefresh) feed?.reload();
                else setAutoRefresh((current) => !current);
              }}
              aria-pressed={autoRefresh}
              aria-label={autoRefresh ? 'השהיית עדכון חי' : 'הפעלת עדכון חי'}
            >
              {autoRefresh
                ? <AllNewsToggleIcon width="28" height="28" aria-hidden="true" />
                : <AllNewsPlayIcon width="28" height="28" aria-hidden="true" />}
              <span>{liveActive ? 'עדכון חי · עודכן לפני 30 שנ׳' : 'עדכון חי מושהה'}</span>
              <AllNewsLiveIcon className={autoRefresh ? '' : styles.dimmed} width="8" height="8" aria-hidden="true" />
            </button>
          </div>
          {/* Figma "Page title": the title only. */}
          <div className={styles.titleGroup}>
            <h1>מבזקים</h1>
          </div>
        </header>

        <section className={styles.filters} aria-label="סינון מבזקים">
          <p className={styles.count}>{countText}</p>
          <div className={styles.filterControls} role="group" aria-label="סינון לפי מקור">
            <span className={styles.filterDivider} aria-hidden="true" />
            {sourceFilters.map((name) => (
              <button
                type="button"
                key={name}
                className={`${styles.chip} ${selectedSource === name ? styles.chipSelected : ''}`}
                onClick={() => setSelectedSource((current) => (current === name ? 'כל המקורות' : name))}
                aria-pressed={selectedSource === name}
              >
                <ChannelIcon name={name} className={styles.sourceLogo} />
                <span>{name}</span>
              </button>
            ))}
            <button
              type="button"
              className={`${styles.chip} ${selectedSource === 'כל המקורות' ? styles.chipSelected : ''}`}
              onClick={() => setSelectedSource('כל המקורות')}
              aria-pressed={selectedSource === 'כל המקורות'}
            >
              <AllNewsAllSourcesIcon width="16" height="16" aria-hidden="true" />
              <span>כל המקורות</span>
            </button>
          </div>
        </section>

        <section
          className={`${styles.newsCard} ${isEmpty ? styles.newsCardPanel : ''}`}
          aria-label="כל המבזקים"
        >
          {showError ? (
            <div className={styles.pageState} role="alert">
              <AllNewsOfflineIcon width="220" height="220" aria-hidden="true" />
              <h2>לא הצלחנו לטעון את המבזקים</h2>
              <p>התקלה אצלנו, לא אצלך. נסו שוב בעוד רגע.</p>
              <button type="button" onClick={() => feed?.reload()}>נסו שוב</button>
            </div>
          ) : (
            <>
              {pendingItems.length > 0 && !isEmpty && (
                <div className={styles.newUpdatesRow}>
                  <button type="button" className={styles.newUpdates} onClick={acceptUpdates}>
                    <AllNewsArrowUpIcon width="10" height="12" aria-hidden="true" />
                    <span>{pendingItems.length} מבזקים חדשים</span>
                  </button>
                </div>
              )}

              <div className={styles.flashList} ref={listRef} aria-live="polite">
                {loading ? (
                  <p className={styles.message}>טוען מבזקים…</p>
                ) : isEmpty ? (
                  trimmedQuery !== '' ? (
                    <div className={styles.emptyState} role="status">
                      <AllNewsEmptyStateIcon width="160" height="160" aria-hidden="true" />
                      <h2>לא נמצאו מבזקים</h2>
                      <p>נסו מילה אחרת, או בחרו 'כל המקורות'.</p>
                      <button type="button" onClick={clearFilters}>ניקוי חיפוש</button>
                    </div>
                  ) : (
                    <div className={styles.emptyState} role="status">
                      <span className={styles.noFlashesArt} aria-hidden="true">
                        <AllNewsNoFlashesIcon width="128" height="128" />
                      </span>
                      <h2>
                        {isSourceFiltered
                          ? `אין היום מבזקים ${sourcePrepositions[selectedSource]}`
                          : 'אין היום מבזקים'}
                      </h2>
                      <p>{isSourceFiltered ? 'מבזקים חדשים מהערוץ יופיעו כאן.' : 'מבזקים חדשים יופיעו כאן.'}</p>
                      {isSourceFiltered && (
                        <button type="button" onClick={() => setSelectedSource('כל המקורות')}>
                          חזרה לכל המקורות
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    {groupedItems.map((group) => (
                      <div className={styles.dayGroup} key={group.label}>
                        <div className={styles.daySeparator}>
                          <p>{group.label}</p>
                          <span />
                        </div>
                        {group.items.map((item) => (
                          <NewsItem
                            key={item.id}
                            item={item}
                            selected={selectedItemId === item.id}
                            isUnread={!isRead(item)}
                            showSource={!isSourceFiltered}
                            onSelect={() => {
                              markAsRead(item.id);
                              setSelectedItemId((current) => (current === item.id ? null : item.id));
                            }}
                          />
                        ))}
                      </div>
                    ))}
                    {visibleItemCount < filteredItems.length && (
                      <>
                        {lastVisibleGroup && lastVisibleGroup.label !== nextGroupLabel && (
                          <div className={styles.daySeparator}>
                            <p>{nextGroupLabel}</p>
                            <span />
                          </div>
                        )}
                        <div className={styles.loadMoreRow}>
                          <button
                            type="button"
                            className={styles.loadMore}
                            onClick={() => setVisibleItemCount((count) => count + 6)}
                          >
                            טעינת מבזקים נוספים
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default AllNewsPage;