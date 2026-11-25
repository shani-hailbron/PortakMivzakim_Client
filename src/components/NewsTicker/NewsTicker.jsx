import React, { useLayoutEffect, useRef, useState } from 'react';
import { LiveDotIcon, TickerPlayIcon } from '../../assets';
import { NewsTickerItem } from '../NewsTickerItem/NewsTickerItem';
import styles from './NewsTicker.module.css';

/**
 * Breaking-news ticker ("פס מבזקים") – implemented from Figma node 976:993.
 * - Fade on the left edge instead of cutting words.
 * - 32×32 pause/play button (WCAG 2.2.2).
 * - Always starts moving (prefers-reduced-motion is ignored – see the note on `paused`).
 * - Paused → live dot is dimmed.
 *
 * @param {object}  props
 * @param {Array}   props.items      the real news data: [{ id, title, source, publishedAt, url? }]
 * @param {string}  [props.label]    tag label (default "מבזקים")
 * @param {number}  [props.speed]    scroll speed in px/second (default 50)
 * @param {string}  [props.emptyText] shown while items is empty (loading / no news)
 * @param {string}  [props.className]
 */
export function NewsTicker({
  items = [],
  label = 'מבזקים',
  speed = 50,
  emptyText = '',
  className,
  allNewsUrl = '/ticker',
  onOpenAllNews,
}) {
  // Always starts moving. Not tied to prefers-reduced-motion: on the internal network
  // (GPO / Citrix / RDP) Windows reports it for every user, which kept the ticker stopped.
  // Users can still stop it with the pause button (WCAG 2.2.2).
  const [paused, setPaused] = useState(false);
  const [repeat, setRepeat] = useState(1);
  const [duration, setDuration] = useState(40);
  const viewportRef = useRef(null);
  const copyRef = useRef(null);

  // Make one copy at least as wide as the viewport (seamless loop) and keep a constant speed.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const copy = copyRef.current;
    if (!viewport || !copy || items.length === 0) return undefined;

    const measure = () => {
      const copyWidth = copy.getBoundingClientRect().width;
      if (!copyWidth) return;
      const setWidth = copyWidth / repeat;
      const needed = Math.max(1, Math.ceil(viewport.clientWidth / setWidth));
      if (needed !== repeat) {
        setRepeat(needed);
        return;
      }
      setDuration(copyWidth / speed);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(copy);
    return () => ro.disconnect();
  }, [items, repeat, speed]);

  const sequence = Array.from({ length: repeat }, () => items).flat();

  const navigateToAllNews = () => {
    if (onOpenAllNews) {
      onOpenAllNews();
      return;
    }
    window.location.assign(allNewsUrl);
  };

  const handleTickerClick = (event) => {
    if (event.target.closest('button')) return;
    if (event.target.closest('a')) event.preventDefault();
    navigateToAllNews();
  };

  const handleLabelClick = (event) => {
    event.stopPropagation();
    if (!onOpenAllNews) return;
    event.preventDefault();
    onOpenAllNews();
  };

  const renderCopy = (copyIndex) => (
    <ul
      key={copyIndex}
      ref={copyIndex === 0 ? copyRef : undefined}
      className={styles.copy}
      aria-hidden={copyIndex === 0 ? undefined : true}
    >
      {sequence.map((item, i) => (
        <NewsTickerItem
          key={`${copyIndex}-${i}-${item.id}`}
          item={item}
          focusable={copyIndex === 0 && i < items.length}
          // Last item in the strip has no separator (per design).
          showSeparator={!(copyIndex === 1 && i === sequence.length - 1)}
        />
      ))}
    </ul>
  );

  const rootClass = [styles.root, paused ? styles.paused : '', className || ''].filter(Boolean).join(' ');

  return (
    <section className={rootClass} aria-label={label} dir="rtl" onClick={handleTickerClick}>
      <div className={styles.tag}>
        <LiveDotIcon className={styles.liveDot} width={6} height={6} aria-hidden="true" />
        <a className={styles.tagLink} href={allNewsUrl} onClick={handleLabelClick}>
          {label}
        </a>
      </div>

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'הפעלת המבזקים' : 'עצירת המבזקים'}
      >
        {paused ? (
          <TickerPlayIcon className={styles.playIcon} width={12} height={12} aria-hidden="true" />
        ) : (
          <span className={styles.icon} aria-hidden="true">
            <span className={styles.bar} />
            <span className={styles.bar} />
          </span>
        )}
      </button>

      <div ref={viewportRef} className={styles.viewport}>
        {items.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          <div className={styles.track} style={{ '--nt-duration': `${duration}s` }}>
            {renderCopy(0)}
            {renderCopy(1)}
          </div>
        )}
      </div>

      <div className={styles.fade} aria-hidden="true" />
    </section>
  );
}

export default NewsTicker;
