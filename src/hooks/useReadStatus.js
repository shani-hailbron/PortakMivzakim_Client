import { useCallback, useEffect, useState } from 'react';
import { isItemRead, markAsRead, subscribeReadStatus } from '../services/readStatus';

/**
 * Read / unread state of mivzakim, kept in sync across components (current session only).
 * @returns {{ isRead: (item) => boolean, markAsRead: (idOrIds) => void }}
 */
export function useReadStatus() {
  const [, setVersion] = useState(0);

  useEffect(() => subscribeReadStatus(() => setVersion((v) => v + 1)), []);

  const isRead = useCallback((item) => isItemRead(item), []);

  return { isRead, markAsRead };
}
