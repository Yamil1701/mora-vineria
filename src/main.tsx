import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/app.css';

const LocalApp = lazy(() => import('./local/LocalApp'));
const localMode = new URLSearchParams(window.location.search).get('mode') === 'local';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {localMode ? <Suspense fallback={<p className="m2-note" role="status">Abriendo registros locales…</p>}><LocalApp /></Suspense> : <App />}
  </React.StrictMode>,
);
