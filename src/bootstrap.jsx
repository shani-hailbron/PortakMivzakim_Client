import React from 'react';
import ReactDOM from 'react-dom/client';
import { NewsTickerContainer } from './components/NewsTicker';

// Standalone dev page – the host app does NOT use this file.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ padding: 24, background: '#f7fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <NewsTickerContainer />
    </div>
  </React.StrictMode>,
);
