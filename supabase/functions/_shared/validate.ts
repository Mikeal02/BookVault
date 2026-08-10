/**
 * Dependency-free structural validator. Parsing is coercive-by-rejection: anything
 * not explicitly allowed is dropped, so unvalidated client fields never reach
 * prompts, upstream APIs or the database.
 */

export type Issue = { path: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };
export interface Validator<T> {
  parse(input: unknown, path?: string): Result<T>;
}

const bad = (path: string, message: string): Result<never> => ({ ok: false, issues: [{ path, message }] });

export const string = (opts: { min?: number; max?: number; pattern?: RegExp; trim?: boolean } = {}): Validator<string> => ({
  parse(input, path = "value") {
    if (typeof input !== "string") return bad(path, "must be a string");
    const value = opts.trim === false ? input : input.trim();
    if (opts.min !== undefined && value.length < opts.min) return bad(path, `must be at least ${opts.min} characters`);
    if (opts.max !== undefined && value.length > opts.max) return bad(path, `must be at most ${opts.max} characters`);
    if (opts.pattern && !opts.pattern.test(value)) return bad(path, "has an invalid format");
    return { ok: true, value };
  },
});

/** Truncates instead of failing — for free-form prose fed to a model. */
export const text = (max: number): Validator<string> => ({
  parse(input, path = "value") {
    if (typeof input !== "string") return bad(path, "must be a string");
    return { ok: true, value: input.slice(0, max) };
  },
});

export const number = (opts: { min?: number; max?: number; int?: boolean } = {}): Validator<number> => ({
  parse(input, path = "value") {
    if (typeof input !== "number" || !Number.isFinite(input)) return bad(path, "must be a finite number");
    if (opts.int && !Number.isInteger(input)) return bad(path, "must be an integer");
    if (opts.min !== undefined && input < opts.min) return bad(path, `must be >= ${opts.min}`);
    if (opts.max !== undefined && input > opts.max) return bad(path, `must be <= ${opts.max}`);
    return { ok: true, value: input };
  },
});

export const boolean = (): Validator<boolean> => ({
  parse(input, path = "value") {
    return typeof input === "boolean" ? { ok: true, value: input } : bad(path, "must be a boolean");
  },
});

export const literalUnion = <T extends string>(...allowed: T[]): Validator<T> => ({
  parse(input, path = "value") {
    return typeof input === "string" && (allowed as string[]).includes(input)
      ? { ok: true, value: input as T }
      : bad(path, `must be one of: ${allowed.join(", ")}`);
  },
});

/** Array with a hard cap. Items failing validation are dropped, not fatal. */
export const array = <T>(item: Validator<T>, opts: { max: number; min?: number } = { max: 100 }): Validator<T[]> => ({
  parse(input, path = "value") {
    if (!Array.isArray(input)) return bad(path, "must be an array");
    const value: T[] = [];
    for (const raw of input.slice(0, opts.max)) {
      const parsed = item.parse(raw, `${path}[]`);
      if (parsed.ok) value.push(parsed.value);
    }
    if (opts.min !== undefined && value.length < opts.min) return bad(path, `must contain at least ${opts.min} valid items`);
    return { ok: true, value };
  },
});

export const optional = <T>(inner: Validator<T>): Validator<T | undefined> => ({
  parse(input, path = "value") {
    if (input === undefined || input === null) return { ok: true, value: undefined };
    return inner.parse(input, path);
  },
});

export const withDefault = <T>(inner: Validator<T>, fallback: T): Validator<T> => ({
  parse(input, path = "value") {
    if (input === undefined || input === null) return { ok: true, value: fallback };
    return inner.parse(input, path);
  },
});

/** Object with an unknown-key strip. Extra client fields are silently discarded. */
export const object = <S extends Record<string, Validator<unknown>>>(
  shape: S,
): Validator<{ [K in keyof S]: S[K] extends Validator<infer U> ? U : never }> => ({
  parse(input, path = "body") {
    if (!input || typeof input !== "object" || Array.isArray(input)) return bad(path, "must be an object");
    const source = input as Record<string, unknown>;
    const issues: Issue[] = [];
    const value: Record<string, unknown> = {};
    for (const [key, validator] of Object.entries(shape)) {
      const parsed = validator.parse(source[key], `${path}.${key}`);
      if (parsed.ok) {
        if (parsed.value !== undefined) value[key] = parsed.value;
      } else {
        issues.push(...parsed.issues);
      }
    }
    if (issues.length) return { ok: false, issues };
    // deno-lint-ignore no-explicit-any
    return { ok: true, value: value as any };
  },
});

/** Passthrough for user-owned records handed to a model as labelled data. */
export const record = (maxKeys = 60): Validator<Record<string, unknown>> => ({
  parse(input, path = "value") {
    if (!input || typeof input !== "object" || Array.isArray(input)) return bad(path, "must be an object");
    return {
      ok: true,
      value: Object.fromEntries(Object.entries(input as Record<string, unknown>).slice(0, maxKeys)),
    };
  },
});

export const flatten = (issues: Issue[]): Record<string, string> =>
  Object.fromEntries(issues.map((i) => [i.path, i.message]));