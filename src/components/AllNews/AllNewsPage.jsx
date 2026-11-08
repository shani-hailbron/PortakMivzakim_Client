import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNewsFeed } from '../../hooks/useNewsFeed';
import backIcon from '../../assets/all-news-back.svg';
import searchIcon from '../../assets/all-news-search.svg';
import sectionIcon from '../../assets/all-news-section.svg';
import arrowUpIcon from '../../assets/all-news-arrow-up.svg';
import dotIcon from '../../assets/all-news-dot.svg';
import urgentDotIcon from '../../assets/all-news-urgent-dot.svg';
import toggleIcon from '../../assets/all-news-toggle.svg';
import playIcon from '../../assets/all-news-play.svg';
import liveIcon from '../../assets/all-news-live.svg';
import styles from './AllNews.module.css';

const sourceFilters = ['N12', 'מעריב', 'וואלה', 'ynet', 'כאן חדשות', 'ערוץ 14'];

function itemTime(item) {
  const date = new Date(item.publishedAt);
  if (Number.isNaN(date.getTime())) return String(item.publishedAt || '');
  return new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function isUrgent(item) {
  return item.priority === 'urgent' || item.priority === 'Urgent' || item.isUrgent === true;
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

function NewsItem({ item, selected, onSelect }) {
  const urgent = isUrgent(item);

  return (
    <button
      type="button"
      className={`${styles.flash} ${urgent ? styles.urgent : ''} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <time className={`${styles.time} ${urgent ? styles.urgentTime : ''}`} dateTime={item.publishedAt}>
        {itemTime(item)}
        <span>{item.relativeTime || ''}</span>
      </time>
      <span className={styles.rail} aria-hidden="true">
        <img src={urgent ? urgentDotIcon : dotIcon} width="10" height="10" alt="" />
      </span>
      <span className={styles.flashBody}>
        <span className={styles.meta}>
          {urgent && <span className={styles.urgentBadge}>מבזק דחוף</span>}
          <span className={styles.source}>{item.source}</span>
        </span>
        <span className={styles.headline}>{item.title}</span>
        {item.details && <span className={styles.details}>{item.details}</span>}
      </span>
    </button>
  );
}

export function AllNewsPage({
  items: suppliedItems,
  refreshMs = 30000,
  totalCount,
  urgentCount,
  onBack,
  className = '',
}) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('כל המקורות');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const initialized = useRef(false);
  const displayedRef = useRef([]);
  const pendingRef = useRef([]);
  const listRef = useRef(null);
  const feed = useNewsFeed(refreshMs, autoRefresh && suppliedItems === undefined);
  const incomingItems = suppliedItems === undefined ? feed.items : suppliedItems;
  const loading = suppliedItems === undefined && feed.loading;

  useEffect(() => {
    if (loading) return;
    const incoming = sortNewestFirst(incomingItems || []);

    if (!initialized.current) {
      const currentItems = incoming.filter((item) => !item.isNew);
      const newItems = incoming.filter((item) => item.isNew);
      const initialItems = currentItems.length > 0 ? currentItems : incoming;
      const initialPending = currentItems.length > 0 ? newItems : [];
      displayedRef.current = initialItems;
      pendingRef.current = initialPending;
      setDisplayedItems(initialItems);
      setPendingItems(initialPending);
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
  }, [incomingItems, loading]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('he');
    return displayedItems.filter((item) => {
      const matchesSource = selectedSource === 'כל המקורות' || item.source === selectedSource;
      const matchesUrgency = !urgentOnly || isUrgent(item);
      const searchable = `${item.title} ${item.source} ${item.details || ''}`.toLocaleLowerCase('he');
      return matchesSource && matchesUrgency && searchable.includes(normalizedQuery);
    });
  }, [displayedItems, query, selectedSource, urgentOnly]);

  const groupedItems = useMemo(() => {
    const groups = [];
    filteredItems.forEach((item) => {
      const label = item.dayLabel || 'היום · יום שני 2.11';
      let group = groups[groups.length - 1];
      if (!group || group.label !== label) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
  }, [filteredItems]);

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

  const filtered = query.trim() !== '' || selectedSource !== 'כל המקורות' || urgentOnly;
  const countText = filtered
    ? `${filteredItems.length} מבזקים`
    : `${totalCount ?? todayItems.length} מבזקים היום · ${urgentCount ?? todayItems.filter(isUrgent).length} דחופים`;

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
              <img src={searchIcon} width="24" height="24" alt="" />
            </label>
            <button
              type="button"
              className={styles.liveStatus}
              onClick={() => setAutoRefresh((current) => !current)}
              aria-pressed={autoRefresh}
              aria-label={autoRefresh ? 'השהיית עדכון חי' : 'הפעלת עדכון חי'}
            >
              <img src={autoRefresh ? toggleIcon : playIcon} width="28" height="28" alt="" />
              <span>{autoRefresh ? 'עדכון חי · עודכן לפני 30 שנ׳' : 'עדכון מושהה'}</span>
              <img className={autoRefresh ? '' : styles.dimmed} src={liveIcon} width="8" height="8" alt="" />
            </button>
          </div>
          <div className={styles.titleGroup}>
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack || (() => window.history.back())}
              aria-label="חזרה"
            >
              <img src={backIcon} width="16" height="16" alt="" />
            </button>
            <h1>מבזקים</h1>
          </div>
        </header>

        <section className={styles.filters} aria-label="סינון מבזקים">
          <p className={styles.count}>{countText}</p>
          <div className={styles.filterControls} role="group" aria-label="מקורות וחשיבות">
            <button
              type="button"
              className={`${styles.chip} ${urgentOnly ? styles.chipSelected : ''}`}
              onClick={() => setUrgentOnly((current) => !current)}
              aria-pressed={urgentOnly}
            >
              דחופים בלבד
            </button>
            <span className={styles.filterDivider} aria-hidden="true" />
            {sourceFilters.map((source) => (
              <button
                type="button"
                key={source}
                className={`${styles.chip} ${selectedSource === source ? styles.chipSelected : ''}`}
                onClick={() => setSelectedSource((current) => (current === source ? 'כל המקורות' : source))}
                aria-pressed={selectedSource === source}
              >
                {source}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.chip} ${selectedSource === 'כל המקורות' ? styles.chipSelected : ''}`}
              onClick={() => setSelectedSource('כל המקורות')}
              aria-pressed={selectedSource === 'כל המקורות'}
            >
              כל המקורות
            </button>
          </div>
        </section>

        <section className={styles.newsCard} aria-label="כל המבזקים">
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <span className={styles.sectionIcon}>
                <img src={sectionIcon} width="28" height="28" alt="" />
              </span>
              <h2>כל המבזקים</h2>
            </div>
          </div>

          {pendingItems.length > 0 && (
            <button type="button" className={styles.newUpdates} onClick={acceptUpdates}>
              <span>{pendingItems.length} מבזקים חדשים</span>
              <img src={arrowUpIcon} width="10" height="12" alt="" />
            </button>
          )}

          <div className={styles.flashList} ref={listRef} aria-live="polite">
            {loading ? (
              <p className={styles.message}>טוען מבזקים…</p>
            ) : feed.error && suppliedItems === undefined && displayedItems.length === 0 ? (
              <p className={styles.message}>לא ניתן לטעון מבזקים כרגע</p>
            ) : groupedItems.length === 0 ? (
              <p className={styles.message}>לא נמצאו מבזקים</p>
            ) : (
              groupedItems.map((group) => (
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
                      onSelect={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
          <div className={styles.listFade} aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}

export default AllNewsPage;