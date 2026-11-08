import React from 'react';
import separatorIcon from '../../assets/separator.svg';
import styles from '../NewsTicker/NewsTicker.module.css';

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

export function NewsTickerItem({ item, showSeparator, focusable }) {
  const content = (
    <>
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