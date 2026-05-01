/**
 * Lightweight performance instrumentation:
 * - measure(name, fn): times sync/async work, logs >threshold ms
 * - reportWebVitals(): captures LCP, CLS, INP via PerformanceObserver
 * Designed to be a thin shim over the browser Performance API — no deps.
 */

import { createLogger } from './logger';

const log = createLogger('perf');
const SLOW_MS = 250;

export async function measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const dur = performance.now() - start;
    if (dur >= SLOW_MS) log.warn(`slow:${name}`, { ms: Math.round(dur) });
    else log.debug(`${name}`, { ms: Math.round(dur) });
    return result;
  } catch (err) {
    const dur = performance.now() - start;
    log.error(`failed:${name}`, { ms: Math.round(dur), err });
    throw err;
  }
}

export function reportWebVitals() {
  if (typeof PerformanceObserver === 'undefined') return;

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (last) log.info('LCP', { ms: Math.round(last.renderTime || last.loadTime || 0) });
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  // CLS (cumulative)
  try {
    let cls = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
      log.debug('CLS', { value: Number(cls.toFixed(3)) });
    });
    clsObs.observe({ type: 'layout-shift', buffered: true });
  } catch {}

  // Long tasks (>50ms blocking)
  try {
    const longObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        log.warn('long-task', { ms: Math.round(entry.duration) });
      }
    });
    longObs.observe({ type: 'longtask', buffered: true });
  } catch {}
}