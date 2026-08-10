/**
 * Structured, redacting logger. Every line is JSON with a request id so edge logs
 * can be correlated without ever printing tokens, keys or user content.
 */

const SENSITIVE_KEY = /(authorization|api[-_]?key|token|secret|password|cookie|jwt|connection[-_]?string|db[-_]?url)/i;
const BEARER = /Bearer\s+[A-Za-z0-9._-]+/gi;
const LONG_TOKEN = /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const POSTGRES_URL = /postgres(?:ql)?:\/\/[^\s"']+/gi;

export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") {
    const masked = value
      .replace(BEARER, "Bearer [redacted]")
      .replace(LONG_TOKEN, "[redacted-token]")
      .replace(POSTGRES_URL, "[redacted-dsn]");
    return masked.length > 300 ? `${masked.slice(0, 300)}…` : masked;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 40)
        .map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1)]),
    );
  }
  return value;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  readonly requestId: string;
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}

export const createLogger = (
  fn: string,
  requestId: string,
  bound: Record<string, unknown> = {},
): Logger => {
  const emit = (level: LogLevel, msg: string, meta?: Record<string, unknown>) => {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      fn,
      requestId,
      msg,
      ...(redact({ ...bound, ...(meta ?? {}) }) as Record<string, unknown>),
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };

  return {
    requestId,
    debug: (m, meta) => emit("debug", m, meta),
    info: (m, meta) => emit("info", m, meta),
    warn: (m, meta) => emit("warn", m, meta),
    error: (m, meta) => emit("error", m, meta),
    child: (meta) => createLogger(fn, requestId, { ...bound, ...meta }),
  };
};