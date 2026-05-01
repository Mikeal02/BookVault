import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals, isFlagEnabled, logger } from './lib/system'

if (isFlagEnabled('webVitals')) reportWebVitals();

// Global safety nets — capture unhandled errors into the logger.
window.addEventListener('error', (e) => {
  logger.error('window.error', { message: e.message, source: e.filename, line: e.lineno });
});
window.addEventListener('unhandledrejection', (e) => {
  logger.error('unhandledrejection', { reason: String(e.reason) });
});

// Register service worker for offline shell (PWA).
if (isFlagEnabled('pwa') && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* non-fatal */});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
