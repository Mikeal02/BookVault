import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals, isFlagEnabled, logger } from './lib/system'
import { themeVars } from '@/themes/themeConfig';
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
const savedTheme =
  localStorage.getItem("bookapp_color_theme") || "cosmic-aurora";

const vars = themeVars[savedTheme as keyof typeof themeVars];

if (vars) {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  document.documentElement.setAttribute(
    "data-color-theme",
    savedTheme
  );
}
createRoot(document.getElementById("root")!).render(<App />);
