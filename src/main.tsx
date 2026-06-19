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
const savedTheme =
  localStorage.getItem("bookapp_color_theme") || "cosmic-aurora";

const themeVars = {
  "cosmic-aurora": {
    "--primary": "260 100% 70%",
    "--secondary": "160 85% 55%",
    "--accent": "195 100% 55%",
    "--ring": "260 100% 70%",
    "--highlight": "160 90% 60%",
    "--sidebar-primary": "260 100% 70%",
    "--sidebar-ring": "260 100% 70%",
  },

  "ember-voltage": {
    "--primary": "0 100% 62%",
    "--secondary": "30 100% 55%",
    "--accent": "45 100% 60%",
    "--ring": "0 100% 62%",
    "--highlight": "30 100% 60%",
    "--sidebar-primary": "0 100% 62%",
    "--sidebar-ring": "0 100% 62%",
  },

  "neon-noir": {
    "--primary": "270 100% 60%",
    "--secondary": "240 20% 18%",
    "--accent": "290 100% 65%",
    "--ring": "270 100% 60%",
    "--highlight": "290 100% 65%",
    "--sidebar-primary": "270 100% 60%",
    "--sidebar-ring": "270 100% 60%",
  },

  "arctic-pulse": {
    "--primary": "195 100% 50%",
    "--secondary": "190 80% 60%",
    "--accent": "200 100% 70%",
    "--ring": "195 100% 50%",
    "--highlight": "190 90% 65%",
    "--sidebar-primary": "195 100% 50%",
    "--sidebar-ring": "195 100% 50%",
  },

  "eden-glow": {
    "--primary": "150 70% 40%",
    "--secondary": "140 55% 55%",
    "--accent": "120 60% 70%",
    "--ring": "150 70% 40%",
    "--highlight": "140 60% 60%",
    "--sidebar-primary": "150 70% 40%",
    "--sidebar-ring": "150 70% 40%",
  },

  "sunset-mirage": {
    "--primary": "10 100% 65%",
    "--secondary": "40 100% 60%",
    "--accent": "230 100% 65%",
    "--ring": "10 100% 65%",
    "--highlight": "40 100% 65%",
    "--sidebar-primary": "10 100% 65%",
    "--sidebar-ring": "10 100% 65%",
  },
};

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
