/**
 * Per-identity sliding-window limiter with a token-cost model, plus a short-term
 * concurrency cap. In-memory per edge isolate: cheap, best-effort abuse braking.
 */

export interface RateRule {
  /** Bucket name; keeps unrelated endpoints from sharing a budget. */
  readonly name: string;
  /** Max accumulated cost per window. */
  readonly max: number;
  /** Window length in milliseconds. */
  readonly windowMs: number;
  /** Max simultaneous in-flight requests per identity (optional). */
  readonly maxConcurrent?: number;
}

export interface RateDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
  readonly limit: number;
}

interface Entry {
  events: Array<{ at: number; cost: number }>;
  inFlight: number;
}

const buckets = new Map<string, Map<string, Entry>>();
const MAX_IDENTITIES = 10_000;

const bucketFor = (name: string) => {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }
  return bucket;
};

const entryFor = (rule: RateRule, identity: string): Entry => {
  const bucket = bucketFor(rule.name);
  if (bucket.size > MAX_IDENTITIES) bucket.clear();
  let entry = bucket.get(identity);
  if (!entry) {
    entry = { events: [], inFlight: 0 };
    bucket.set(identity, entry);
  }
  return entry;
};

export const consume = (rule: RateRule, identity: string, cost = 1): RateDecision => {
  const now = Date.now();
  const entry = entryFor(rule, identity);
  entry.events = entry.events.filter((e) => now - e.at < rule.windowMs);

  const used = entry.events.reduce((sum, e) => sum + e.cost, 0);
  const oldest = entry.events[0]?.at ?? now;
  const retryAfterSeconds = Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000));

  if (rule.maxConcurrent !== undefined && entry.inFlight >= rule.maxConcurrent) {
    return { allowed: false, remaining: Math.max(0, rule.max - used), retryAfterSeconds: 1, limit: rule.max };
  }
  if (used + cost > rule.max) {
    return { allowed: false, remaining: Math.max(0, rule.max - used), retryAfterSeconds, limit: rule.max };
  }

  entry.events.push({ at: now, cost });
  return { allowed: true, remaining: Math.max(0, rule.max - used - cost), retryAfterSeconds: 0, limit: rule.max };
};

export const enterFlight = (rule: RateRule, identity: string) => {
  entryFor(rule, identity).inFlight += 1;
};

export const exitFlight = (rule: RateRule, identity: string) => {
  const entry = entryFor(rule, identity);
  entry.inFlight = Math.max(0, entry.inFlight - 1);
};

export const rateHeaders = (decision: RateDecision): Record<string, string> => ({
  "X-RateLimit-Limit": String(decision.limit),
  "X-RateLimit-Remaining": String(decision.remaining),
  ...(decision.allowed ? {} : { "Retry-After": String(decision.retryAfterSeconds) }),
});

/** Test hook: drop all accumulated state. */
export const resetRateLimits = () => buckets.clear();