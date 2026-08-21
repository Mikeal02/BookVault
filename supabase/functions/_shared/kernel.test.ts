import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as v from "./validate.ts";
import { consume, resetRateLimits } from "./ratelimit.ts";
import { redact } from "./log.ts";
import { readJsonBody, requestIdOf, fail } from "./http.ts";

Deno.test("validator strips unknown keys and enforces bounds", () => {
  const schema = v.object({
    mode: v.literalUnion("chat", "recommend"),
    limit: v.withDefault(v.number({ min: 1, max: 10, int: true }), 5),
  });
  const parsed = schema.parse({ mode: "chat", evil: "<script>", limit: 3 });
  assert(parsed.ok);
  assertEquals(parsed.value, { mode: "chat", limit: 3 });
});

Deno.test("validator rejects invalid enum and out-of-range numbers", () => {
  const schema = v.object({ mode: v.literalUnion("chat"), limit: v.number({ max: 10 }) });
  const parsed = schema.parse({ mode: "hack", limit: 999 });
  assert(!parsed.ok);
  assertEquals(Object.keys(v.flatten(parsed.issues)).sort(), ["body.limit", "body.mode"]);
});

Deno.test("array validator caps input length and drops invalid items", () => {
  // The cap applies to the incoming array, then invalid entries are dropped.
  const parsed = v.array(v.string({ min: 1 }), { max: 3 }).parse(["a", 5, "b", "c", "d"]);
  assert(parsed.ok);
  assertEquals(parsed.value, ["a", "b"]);
});

Deno.test("rate limiter blocks over budget and reports retry-after", () => {
  resetRateLimits();
  const rule = { name: "test", max: 3, windowMs: 60_000 };
  assert(consume(rule, "user-1").allowed);
  assert(consume(rule, "user-1", 2).allowed);
  const blocked = consume(rule, "user-1");
  assertEquals(blocked.allowed, false);
  assert(blocked.retryAfterSeconds > 0);
  // Budgets are per identity.
  assert(consume(rule, "user-2").allowed);
});

Deno.test("logger redacts secrets, tokens and DSNs", () => {
  const out = redact({
    authorization: "Bearer abc.def.ghi",
    note: "connect via postgresql://user:pw@host:5432/db",
    nested: { api_key: "sk-live-123", ok: 1 },
  }) as Record<string, unknown>;
  assertEquals(out.authorization, "[redacted]");
  assert(String(out.note).includes("[redacted-dsn]"));
  assertEquals((out.nested as Record<string, unknown>).api_key, "[redacted]");
});

Deno.test("readJsonBody enforces the byte ceiling", async () => {
  const big = new Request("http://x", { method: "POST", body: JSON.stringify({ a: "x".repeat(1000) }) });
  assertEquals((await readJsonBody(big, 100)).ok, false);
  const good = new Request("http://x", { method: "POST", body: JSON.stringify({ a: 1 }) });
  const parsed = await readJsonBody(good, 1000);
  assert(parsed.ok);
});

Deno.test("requestId echoes safe client value and rejects junk", () => {
  const safe = requestIdOf(new Request("http://x", { headers: { "x-request-id": "abc-123-def-456" } }));
  assertEquals(safe, "abc-123-def-456");
  const junk = requestIdOf(new Request("http://x", { headers: { "x-request-id": "bad id <script>" } }));
  assert(junk.length === 36);
});

Deno.test("error envelope carries code, CORS and no-store headers", async () => {
  const res = fail("rate_limited", "Slow down", { requestId: "rid-12345678" });
  assertEquals(res.status, 429);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(res.headers.get("Cache-Control"), "no-store");
  assertEquals((await res.json()).code, "rate_limited");
});