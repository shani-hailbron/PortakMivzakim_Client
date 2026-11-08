import React from 'react';
import NewsTickerContainer from './components/NewsTickerContainer/NewsTickerContainer';
import { AllNewsPage } from './components/AllNews/AllNewsPage';

export default function App() {
  const isTickerBarRoute = window.location.pathname.replace(/\/$/, '') === '/ticker-bar';
  return isTickerBarRoute ? <NewsTickerContainer /> : <AllNewsPage />;
}