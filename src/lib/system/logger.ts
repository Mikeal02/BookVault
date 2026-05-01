/**
 * Structured logger with levels, namespaces, and ring-buffer history.
 * - Levels: debug | info | warn | error
 * - In production, debug/info are silenced; warn+error keep going to console.
 * - Last 200 events are retained in-memory and dispatched as 'app:log' CustomEvents
 *   so dev tools / Sentry-style sinks can subscribe without coupling.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  ns: string;
  msg: string;
  data?: unknown;
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const isDev = import.meta.env.DEV;
const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'warn';
const HISTORY_MAX = 200;

const history: LogEntry[] = [];

const shouldLog = (lvl: LogLevel) => LEVELS[lvl] >= LEVELS[MIN_LEVEL];

const emit = (entry: LogEntry) => {
  history.push(entry);
  if (history.length > HISTORY_MAX) history.shift();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:log', { detail: entry }));
  }
};

const fmt = (ns: string, lvl: LogLevel) => `%c[${ns}]%c ${lvl}`;
const styleNs = 'color:#14b8a6;font-weight:600';
const styleLvl = 'color:#94a3b8';

export const createLogger = (namespace: string) => {
  const log = (level: LogLevel, msg: string, data?: unknown) => {
    if (!shouldLog(level)) return;
    const entry: LogEntry = { ts: Date.now(), level, ns: namespace, msg, data };
    emit(entry);
    if (typeof console !== 'undefined') {
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      if (data !== undefined) fn(fmt(namespace, level), styleNs, styleLvl, msg, data);
      else fn(fmt(namespace, level), styleNs, styleLvl, msg);
    }
  };
  return {
    debug: (m: string, d?: unknown) => log('debug', m, d),
    info: (m: string, d?: unknown) => log('info', m, d),
    warn: (m: string, d?: unknown) => log('warn', m, d),
    error: (m: string, d?: unknown) => log('error', m, d),
  };
};

export const getLogHistory = (): readonly LogEntry[] => history;
export const clearLogHistory = () => { history.length = 0; };

export const logger = createLogger('app');