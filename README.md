# פס מבזקים – מיקרו־פרונט (React + Webpack 5 Module Federation)

מימוש של הקומפוננטה "פס מבזקים" מפיגמה (node `976:993`), ב-React JavaScript.

## הרצה

```bash
npm install
npm start              # פיתוח: http://localhost:5001
npm run build          # בנייה לתיקיית dist
npm run serve:remote   # הגשת גרסת production על פורט 5001
```

ה-remote זמין בכתובת: `http://localhost:5001/remoteEntry.js`

## מבנה

```
src/
  index.js                     ← נקודת כניסה (async boundary ל-Module Federation)
  bootstrap.jsx                ← עמוד פיתוח עצמאי בלבד
  components/NewsTicker/
    NewsTicker.jsx             ← הקומפוננטה (מקבלת items)
    NewsTickerItem.jsx         ← פריט בודד
    NewsTickerContainer.jsx    ← גרסה שטוענת את הנתונים בעצמה
    NewsTicker.module.css      ← עיצוב + משתני העיצוב מפיגמה
    fonts.js                   ← גופן Rubik
    index.js                   ← מה שנחשף ל-host
  hooks/useNewsFeed.js         ← טעינה + רענון תקופתי
  services/newsApi.js          ← ← כאן מחברים את ה-API האמיתי
  mocks/news.mock.js           ← נתוני דמה מהעיצוב
  assets/                      ← אייקונים
webpack.config.js
babel.config.json
```

## חיבור ל-DATA האמיתי

יש שתי אפשרויות:

1. **ה-host מעביר את הנתונים** (מומלץ אם ה-host כבר מושך אותם):
   ```jsx
   import NewsTicker from 'newsTicker/NewsTicker';
   <NewsTicker items={newsFromServer} />
   ```
2. **המיקרו־פרונט טוען בעצמו**: מעתיקים את `.env.example` ל-`.env`, ממלאים את `NEWS_API_URL`,
   ומתאימים את שמות השדות בפונקציה `mapApiItem` שבקובץ `src/services/newsApi.js`. אחר כך משתמשים ב-
   ```jsx
   import NewsTickerContainer from 'newsTicker/NewsTickerContainer';
   <NewsTickerContainer refreshMs={60000} />
   ```

כל עוד ה-API לא מוגדר, מוצגים נתוני הדמה מהעיצוב (`src/mocks/news.mock.js`).

מבנה פריט:

```js
{
  id: '1',                              // מזהה ייחודי
  title: 'כותרת המבזק',                 // כותרת
  source: 'ynet',                       // מקור
  publishedAt: '2026-11-04T10:42:00',   // מוצג כ-HH:mm
  url: 'https://...'                    // אופציונלי – הופך את הפריט לקישור
}
```

## הגדרת ה-host (Webpack)

```js
const { ModuleFederationPlugin } = require('webpack').container;

new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    newsTicker: 'newsTicker@http://localhost:5001/remoteEntry.js',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});
```

ב-host צריך גם async boundary: קובץ הכניסה מכיל רק `import('./bootstrap');`.

## Props

| Prop | ברירת מחדל | תיאור |
|---|---|---|
| `items` | – | רשימת המבזקים |
| `label` | `"מבזקים"` | טקסט התגית |
| `speed` | `50` | מהירות גלילה (פיקסלים לשנייה) |
| `emptyText` | `""` | טקסט כשאין פריטים |
| `className` | – | מחלקה נוספת לעטיפה |

## התנהגות לפי הגדרות העיצוב

- Fade בקצה השמאלי במקום חיתוך מילים.
- כפתור עצירה/הפעלה 32×32 עם aria-label "עצירת המבזקים" / "הפעלת המבזקים" (WCAG 2.2.2).
- במצב עצירה הנקודה החיה מעומעמת.
- כשמוגדר `prefers-reduced-motion` הפס מתחיל במצב עצירה.
- הגלילה נעצרת גם בריחוף עכבר ובפוקוס מקלדת.
- רוחב FILL: הרכיב תופס את כל רוחב ההורה.
- צבעים ומרווחים מוגדרים כמשתני CSS בראש `NewsTicker.module.css`, וה-host יכול לדרוס אותם.
