import React, { useEffect, useState } from 'react';
import { NewsFeedProvider } from './context/NewsFeedContext';
import NewsTickerContainer from './components/NewsTickerContainer/NewsTickerContainer';
import { AllNewsPage } from './components/AllNews/AllNewsPage';

// "/" (and "/ticker-bar") shows the ticker bar; clicking the bar opens the all-news page at ALL_NEWS_PATH.
const ALL_NEWS_PATH = '/ticker';

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

export default function App() {
  const [path, setPath] = useState(currentPath);

  // Browser back / forward buttons.
  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to) => {
    if (currentPath() !== to) window.history.pushState(null, '', to);
    setPath(to);
  };

  // One shared feed for the whole app: the channels are polled once (every 30s),
  // and moving between the ticker and the all-news page doesn't start over.
  return (
    <NewsFeedProvider>
      {path === ALL_NEWS_PATH ? (
        <AllNewsPage />
      ) : (
        <NewsTickerContainer
          allNewsUrl={ALL_NEWS_PATH}
          onOpenAllNews={() => navigate(ALL_NEWS_PATH)}
        />
      )}
    </NewsFeedProvider>
  );
}
