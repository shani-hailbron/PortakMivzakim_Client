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
  context/NewsFeedContext.jsx   ← מקור הנתונים המשותף (משיכה מהערוצים כל 30 שניות)
  services/newsApi.js
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
2. **המיקרו־פרונט טוען בעצמו (מומלץ)** – עוטפים את הפורטל ב־`NewsFeedProvider`, וכל הרכיבים חולקים מקור נתונים אחד: הערוצים נשאלים פעם אחת כל 30 שניות, ולא כל רכיב בנפרד.
   ```jsx
   import NewsFeedProvider from 'PortalMivzakim_Client/NewsFeedProvider';
   import NewsTickerContainer from 'PortalMivzakim_Client/NewsTickerContainer';
   import AllNewsPage from 'PortalMivzakim_Client/AllNewsPage';

   <NewsFeedProvider>            {/* refreshMs={30000} כברירת מחדל */}
     <Portal>
       <NewsTickerContainer />   {/* בפס */}
       <AllNewsPage />           {/* בעמוד המבזקים */}
     </Portal>
   </NewsFeedProvider>
   ```
   בלי `NewsFeedProvider` הרכיבים עדיין עובדים: כל אחד יוצר לעצמו מקור נתונים (ואז `refreshMs` שלו קובע את התדירות), אבל כל אחד שולח בקשות משלו.

   בתוך המיקרו־פרונט הנתונים נגישים לכל רכיב עם `useNewsFeed()` מ־`src/context/NewsFeedContext.jsx`:
   `{ items, loading, error, updatedAt, reload, refreshMs }`.

ה־remote חושף `./NewsTicker`, `./NewsTickerContainer`, `./AllNewsPage` ו־`./NewsFeedProvider`. השם ב־Webpack הוא `PortalMivzakim_Client`, ולכן כך יש להגדיר אותו ב־`remotes` של כל host.

הגדרות הסביבות נמצאות ב־`env.config.js`. מקור המבזקים:

- `MIVZAKIM_API_URL` בזמן build – שירות המבזקים הפנימי (`Mivzakim/GetList`, עם `credentials: 'include'`).
- אחרת – ישירות מהערוצים (`SERVICES.MIVZAKIM.NEWS_SOURCES`). ערוץ שנכשל מדולג, והשאר ממשיכים להופיע.

| מקור | מאיפה | הערה |
|---|---|---|
| חדשות 12 | "צ'אט הכתבים" – מסד ה־Firebase שהאתר של N12 קורא ממנו (`channel-2-news`) | לא פיד רשמי לשימוש חיצוני; עלול להשתנות או להיסגר. לא צריך הפניה בשרת. |
| ערוץ 14 | 30 הכתבות האחרונות מממשק ה־WordPress הרשמי (`c14.co.il/wp-json/wp/v2/posts`), מכל הקטגוריות | אין לערוץ 14 פיד מבזקים. לא צריך הפניה בשרת. |
| וויינט | RSS מבזקים | |
| וויינט ספורט | RSS מדור הספורט | |
| הארץ | RSS "הכתבות האחרונות" | אין להארץ פיד מבזקים |
| ישראל היום | RSS כללי, מסונן למדור החדשות (`/news/`) | אין לישראל היום פיד מבזקים |

### הפניות RSS בשרת (חובה בסביבות dev / test / lrn / prod)

הערוצים לא מתירים קריאה ישירה מהדפדפן (אין להם CORS, ו־ynet אף מחזירים 403 כשיש כותרת `Origin`).
לכן האפליקציה פונה לנתיבים בשרת שלנו, והשרת צריך להעביר אותם לערוץ. בפיתוח מקומי שרת ה־webpack עושה זאת בעצמו (`devServer.proxy` ב־`webpack.config.js`). בשאר הסביבות צריך להגדיר את ההפניות האלה בשרת שמארח את האפליקציה:

| נתיב בשרת שלנו | כתובת היעד |
|---|---|
| `/rss/ynet-news` | `https://www.ynet.co.il/Integration/StoryRss1854.xml` |
| `/rss/ynet-sport` | `https://www.ynet.co.il/Integration/StoryRss3.xml` |
| `/rss/haaretz` | `https://www.haaretz.co.il/srv/rss---feedly` |
| `/rss/israelhayom` | `https://www.israelhayom.co.il/rss.xml` |

הפורטל רץ על IIS: קובץ הגדרות מוכן, כולל דרישות מוקדמות ופקודות התקנה, נמצא ב־[deploy/iis/web.config](deploy/iis/web.config).

בהפניה יש להסיר מהבקשה את הכותרות `Origin`, `Referer` ו־`Cookie`. אחרת ynet מחזירים 403, ועוגיות הפורטל נשלחות לאתר חיצוני.
אפשר גם להחליף כל כתובת בזמן build דרך משתני הסביבה `N12_DESK_URL`, `CHANNEL_14_URL`, `YNET_RSS_URL`, `YNET_SPORT_RSS_URL`, `HAARETZ_RSS_URL` ו־`ISRAEL_HAYOM_RSS_URL`.

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
