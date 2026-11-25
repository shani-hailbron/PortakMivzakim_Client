const environmentPrefixes = {
  local: 'dev-',
  dev: 'dev-',
  test: 'test-',
  lrn: 'lrn-',
  prod: '',
};

function toJson(values) {
  return Object.entries(values).reduce((result, [key, value]) => {
    result[key] = value && typeof value === 'object' ? JSON.stringify(value) : value;
    return result;
  }, {});
}

function getEnvVariables(environment = 'local') {
  if (!Object.prototype.hasOwnProperty.call(environmentPrefixes, environment)) {
    throw new Error(`Unknown deployment environment: ${environment}`);
  }

  return toJson({
    SVIVA: { sviva: environmentPrefixes[environment] },
    SERVICES: {
      MIVZAKIM: {
        // Internal mivzakim API. When set it is used instead of the RSS feeds below.
        URL: process.env.MIVZAKIM_API_URL || '',
        // Channels read directly. TYPE: 'rss' (default), 'n12-desk' or 'wordpress'.
        // RSS URLs are paths on our own server that proxy to the channel (the channels don't
        // allow CORS) – see devServer.proxy in webpack.config.js.
        NEWS_SOURCES: {
          N12: {
            NAME: 'חדשות 12',
            TYPE: 'n12-desk',
            // N12 "צ'אט הכתבים": the Firebase DB n12.co.il reads its mivzakim from. Not an official
            // public feed – N12 may change or close it. Allows CORS, so no proxy is needed.
            URL: process.env.N12_DESK_URL || 'https://channel-2-news.firebaseio.com/desk12.json',
            LIMIT: 30,
          },
          CHANNEL_14: {
            NAME: 'ערוץ 14',
            TYPE: 'wordpress',
            // Channel 14 has no mivzakim feed; this is the latest posts from its standard
            // WordPress REST API (all categories). Allows CORS, so no proxy is needed.
            URL: process.env.CHANNEL_14_URL || 'https://www.c14.co.il/wp-json/wp/v2/posts',
            LIMIT: 30,
          },
          YNET: {
            NAME: 'וויינט',
            // Locally the MFE's own dev server (8899) proxies it, so it also works inside the host app.
            URL: process.env.YNET_RSS_URL || (environment === 'local' ? 'http://localhost:8899/rss/ynet-news' : '/rss/ynet-news'),
          },
          YNET_SPORT: {
            NAME: 'וויינט ספורט',
            // Ynet's sport section feed (no separate sport-mivzakim feed exists).
            URL: process.env.YNET_SPORT_RSS_URL || (environment === 'local' ? 'http://localhost:8899/rss/ynet-sport' : '/rss/ynet-sport'),
          },
          HAARETZ: {
            NAME: 'הארץ',
            // Haaretz has no dedicated mivzakim feed; this is its "latest articles" feed.
            URL: process.env.HAARETZ_RSS_URL || (environment === 'local' ? 'http://localhost:8899/rss/haaretz' : '/rss/haaretz'),
          },
          ISRAEL_HAYOM: {
            NAME: 'ישראל היום',
            // Israel Hayom has no mivzakim RSS (its site reads them from an internal Firebase DB).
            // This is the general feed (sport, horoscopes, food...), so only the news section is kept.
            URL: process.env.ISRAEL_HAYOM_RSS_URL || (environment === 'local' ? 'http://localhost:8899/rss/israelhayom' : '/rss/israelhayom'),
            LINK_PATH_PREFIXES: ['/news/'],
          },
        },
        METHODS: {
          GET_MIVZAKIM: 'Mivzakim/GetList',
          // Optional: endpoint that saves read mivzakim on the server (POST { ids }). Empty = browser only.
          MARK_AS_READ: process.env.MIVZAKIM_MARK_AS_READ_METHOD || '',
        },
      },
    },
    URLS: {},
  });
}

module.exports = { getEnvVariables };