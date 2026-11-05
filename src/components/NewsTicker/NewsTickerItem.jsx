import React from 'react';
import separatorIcon from '../../assets/separator.svg';
import styles from './NewsTicker.module.css';

const timeFormatter = new Intl.DateTimeFormat('he-IL', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : String(value);
}

/**
 * One news item: "source · time", then the headline, then a dot separator.
 * @param {object}  props
 * @param {object}  props.item          { id, title, source, publishedAt, url? }
 * @param {boolean} props.showSeparator turned off for the last item
 * @param {boolean} props.focusable     items in the duplicated copy are not focusable
 */
export function NewsTickerItem({ item, showSeparator, focusable }) {
  const content = (
    <>
      {/* RTL order: source · time, then the headline */}
      <p className={styles.meta}>
        {item.source} · <time dateTime={toDate(item.publishedAt)?.toISOString()}>{formatTime(item.publishedAt)}</time>
      </p>
      <p className={styles.title}>{item.title}</p>
    </>
  );

  return (
    <li className={styles.item}>
      {item.url ? (
        <a
          className={styles.link}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={focusable ? undefined : -1}
        >
          {content}
        </a>
      ) : (
        content
      )}
      {showSeparator && <img className={styles.separator} src={separatorIcon} width={12} height={4} alt="" />}
    </li>
  );
}

export default NewsTickerItem;
