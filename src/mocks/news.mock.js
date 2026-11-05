/**
 * Placeholder data taken from the Figma design.
 * Used only when no real API is configured (see services/newsApi.js).
 *
 * Item shape:
 * {
 *   id: string,                 // unique id
 *   title: string,              // headline
 *   source: string,             // source / outlet
 *   publishedAt: string | Date, // displayed as HH:mm
 *   url?: string                // optional – item becomes a link
 * }
 */
export const mockNews = [
  { id: '1', title: 'בנק ישראל הותיר את הריבית ללא שינוי', source: 'ynet', publishedAt: '2026-11-04T10:42:00' },
  { id: '2', title: 'צפי לגשמים ברוב אזורי הארץ בסוף השבוע', source: 'כאן חדשות', publishedAt: '2026-11-04T10:15:00' },
  { id: '3', title: 'משרד התחבורה: שינויים בקווי הרכבת החל מיום ראשון', source: 'וואלה', publishedAt: '2026-11-04T09:58:00' },
  { id: '4', title: 'נפתח מועד ההגשה למלגות הסטודנטים לשנה הבאה', source: 'מעריב', publishedAt: '2026-11-04T09:30:00' },
];
