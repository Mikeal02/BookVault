/**
 * HTTP kernel: one canonical CORS surface, security headers, response envelopes
 * and error taxonomy shared by every edge function.
 */

export const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-request-id",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/** Defence-in-depth headers. Edge responses are JSON/streams, never rendered as HTML. */
export const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-site",
};

export const baseHeaders = (requestId?: string): Record<string, string> => ({
  ...corsHeaders,
  ...securityHeaders,
  ...(requestId ? { "x-request-id": requestId } : {}),
});

export const preflight = (): Response => new Response(null, { headers: corsHeaders });

export const json = (body: unknown, status = 200, requestId?: string): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders(requestId), "Content-Type": "application/json" },
  });

/** Error codes are stable contract values; messages stay generic so internals never leak. */
export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "method_not_allowed"
  | "invalid_body"
  | "payload_too_large"
  | "rate_limited"
  | "upstream_error"
  | "misconfigured"
  | "internal_error";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  method_not_allowed: 405,
  invalid_body: 400,
  payload_too_large: 413,
  rate_limited: 429,
  upstream_error: 502,
  misconfigured: 500,
  internal_error: 500,
};

export const fail = (
  code: ErrorCode,
  message?: string,
  opts: { requestId?: string; details?: unknown; headers?: Record<string, string> } = {},
): Response =>
  new Response(
    JSON.stringify({
      error: message ?? code.replace(/_/g, " "),
      code,
      requestId: opts.requestId,
      ...(opts.details === undefined ? {} : { details: opts.details }),
    }),
    {
      status: STATUS[code],
      headers: {
        ...baseHeaders(opts.requestId),
        "Content-Type": "application/json",
        ...(opts.headers ?? {}),
      },
    },
  );

/** Correlates client, edge log lines and upstream calls. */
export const requestIdOf = (req: Request): string => {
  const provided = req.headers.get("x-request-id");
  if (provided && /^[A-Za-z0-9._-]{8,64}$/.test(provided)) return provided;
  return crypto.randomUUID();
};

/** Read a JSON body with a hard byte ceiling so a huge payload can't exhaust the isolate. */
export const readJsonBody = async (
  req: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; code: "invalid_body" | "payload_too_large" }> => {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, code: "payload_too_large" };

  const raw = new Uint8Array(await req.arrayBuffer());
  if (raw.byteLength > maxBytes) return { ok: false, code: "payload_too_large" };
  if (raw.byteLength === 0) return { ok: true, value: {} };

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(raw)) };
  } catch {
    return { ok: false, code: "invalid_body" };
  }
};