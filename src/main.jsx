import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA Installation
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloadedForUpdate = false;
  if (hadController) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedForUpdate) return;
      reloadedForUpdate = true;
      window.location.reload();
    });
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        console.log('PWA ServiceWorker registered with scope:', reg.scope);
        reg.update().catch((err) => console.warn('PWA update check failed:', err));
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration failed:', err);
      });
  });
}
