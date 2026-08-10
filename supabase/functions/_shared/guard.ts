/**
 * Request pipeline shared by every edge function:
 * preflight -> method allowlist -> JWT auth -> rate limit -> body cap -> schema
 * -> structured logging -> uniform error envelope.
 *
 * Usage:
 *   serve(withGuard({ fn: "my-fn", rate: { name: "my-fn", max: 20, windowMs: 60_000 },
 *                     schema: v.object({ ... }) }, async ({ body, user, log }) => json(...)));
 */
import { authenticate, hasRole, type AuthedUser } from "./auth.ts";
import { fail, json, preflight, readJsonBody, requestIdOf, baseHeaders } from "./http.ts";
import { createLogger, type Logger } from "./log.ts";
import { consume, enterFlight, exitFlight, rateHeaders, type RateRule } from "./ratelimit.ts";
import type { Validator } from "./validate.ts";
import { flatten } from "./validate.ts";

export interface GuardContext<T> {
  readonly req: Request;
  readonly body: T;
  readonly user: AuthedUser;
  readonly log: Logger;
  readonly requestId: string;
}

export interface GuardOptions<T> {
  /** Function name used in logs. */
  readonly fn: string;
  readonly rate: RateRule;
  readonly schema?: Validator<T>;
  readonly methods?: readonly string[];
  readonly maxBodyBytes?: number;
  /** Require a role (checked server-side via has_role). */
  readonly requireRole?: "admin" | "moderator" | "user";
  /** Rate-limit cost for this request; lets expensive endpoints spend more budget. */
  readonly cost?: (body: T) => number;
}

const DEFAULT_MAX_BODY = 256 * 1024;

export const withGuard = <T>(
  options: GuardOptions<T>,
  handler: (ctx: GuardContext<T>) => Promise<Response>,
) => {
  const methods = options.methods ?? ["POST"];

  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return preflight();

    const requestId = requestIdOf(req);
    const log = createLogger(options.fn, requestId);
    const startedAt = Date.now();

    if (!methods.includes(req.method)) {
      return fail("method_not_allowed", "Method not allowed", { requestId });
    }

    const user = await authenticate(req);
    if (!user) {
      log.warn("auth rejected", { method: req.method });
      return fail("unauthorized", "Unauthorized", { requestId });
    }

    if (options.requireRole && !(await hasRole(user, options.requireRole))) {
      log.warn("role denied", { userId: user.userId, required: options.requireRole });
      return fail("forbidden", "You do not have access to this operation", { requestId });
    }

    const parsedBody = await readJsonBody(req, options.maxBodyBytes ?? DEFAULT_MAX_BODY);
    if (!parsedBody.ok) {
      return fail(parsedBody.code, parsedBody.code === "payload_too_large" ? "Request body is too large" : "Request body must be valid JSON", { requestId });
    }

    let body = parsedBody.value as T;
    if (options.schema) {
      const validated = options.schema.parse(parsedBody.value, "body");
      if (!validated.ok) {
        log.warn("validation failed", { userId: user.userId, issues: flatten(validated.issues) });
        return fail("invalid_body", "Request validation failed", {
          requestId,
          details: flatten(validated.issues),
        });
      }
      body = validated.value;
    }

    const cost = Math.max(1, Math.round(options.cost?.(body) ?? 1));
    const decision = consume(options.rate, user.userId, cost);
    if (!decision.allowed) {
      log.warn("rate limited", { userId: user.userId, bucket: options.rate.name, cost });
      return fail("rate_limited", "Too many requests. Please slow down.", {
        requestId,
        headers: rateHeaders(decision),
      });
    }

    enterFlight(options.rate, user.userId);
    try {
      const response = await handler({ req, body, user, log: log.child({ userId: user.userId }), requestId });
      log.info("handled", { status: response.status, ms: Date.now() - startedAt });
      // Ensure kernel headers are present even if a handler builds its own Response.
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries({ ...baseHeaders(requestId), ...rateHeaders(decision) })) {
        if (!headers.has(key)) headers.set(key, value);
      }
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      log.error("unhandled failure", {
        ms: Date.now() - startedAt,
        name: error instanceof Error ? error.name : "unknown",
        detail: error instanceof Error ? error.message : String(error),
      });
      // Generic message only: internal details stay in the logs.
      return fail("internal_error", "Something went wrong. Please try again.", { requestId });
    } finally {
      exitFlight(options.rate, user.userId);
    }
  };
};

export { json, fail };