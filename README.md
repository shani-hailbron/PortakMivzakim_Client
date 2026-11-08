# Portal Mivzakim Client – React 17 + Webpack 5 Module Federation

מיקרו־פרונט עם שני רכיבים נפרדים: פס מבזקים קומפקטי ומסך “כל המבזקים”. מסך החדשות כולל את אזור התוכן בלבד, ללא Header או Sidebar של הפורטל.

## הרצה

```bash
npm install
npm start              # פיתוח: http://localhost:8890
npm run build          # בנייה לסביבת prod לתיקיית build
npm run build:dev
npm run build:test
npm run build:lrn
npm run serve:remote
```

ה־remote זמין בכתובת `http://localhost:8890/remoteEntry.js`. בשרת הפיתוח `/` ו־`/ticker` מציגים את מסך כל המבזקים; `/ticker-bar` מציג את הפס הקומפקטי. לחיצה על הפס מעבירה אל `/ticker`.

## מבנה

```
src/
  index.js
  App.jsx
  bootstrap.js
  index.css
  index.html
  components/
    AllNews/                    ← מסך כל המבזקים
    NewsTicker/                 ← פס המבזקים
    NewsTickerContainer/        ← טעינת נתונים עבור הפס
    NewsTickerItem/             ← פריט בפס
  hooks/useNewsFeed.js
  services/newsApi.js
  mocks/news.mock.js
  assets/
webpack.config.js
.babelrc
env.config.js
```

## חיבור לנתוני הפורטל

יש שתי אפשרויות:

1. **ה־host מעביר את הנתונים**:
   ```jsx
  import NewsTicker from 'PortalMivzakim_Client/NewsTicker';
   <NewsTicker items={newsFromServer} />
   ```
2. **המיקרו־פרונט טוען בעצמו**:
   ```jsx
  import NewsTickerContainer from 'PortalMivzakim_Client/NewsTickerContainer';
   <NewsTickerContainer refreshMs={60000} />
   ```

מסך כל החדשות נצרך בנפרד:

```jsx
import AllNewsPage from 'PortalMivzakim_Client/AllNewsPage';
<AllNewsPage />
```

ה־remote חושף `./NewsTicker`, `./NewsTickerContainer` ו־`./AllNewsPage`. השם ב־Webpack הוא `PortalMivzakim_Client`, ולכן כך יש להגדיר אותו ב־`remotes` של כל host.

הגדרות הסביבות נמצאות ב־`env.config.js`. כתובת ריקה תחת `SERVICES.MIVZAKIM.URL` מציגה mock; שירות אמיתי מוגדר באמצעות `MIVZAKIM_API_URL` בזמן build. הקריאה משתמשת ב־`Mivzakim/GetList` וב־`credentials: 'include'`.

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
    PortalMivzakim_Client: 'PortalMivzakim_Client@http://localhost:8890/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '17.0.2' },
    'react-dom': { singleton: true, requiredVersion: '17.0.2' },
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
