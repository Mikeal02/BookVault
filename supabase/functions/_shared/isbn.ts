/**
 * ISBN normalization helpers shared by the book-search edge function and its tests.
 * Pure functions only — safe to import from a Deno test without booting a server.
 */

/** Strip separators/whitespace and upper-case the ISBN-10 check char. Returns null when it isn't a well-formed ISBN. */
export const normalizeIsbn = (input: unknown): string | null => {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (cleaned.length === 10) {
    // Only the final character may be 'X'.
    return /^[0-9]{9}[0-9X]$/.test(cleaned) ? cleaned : null;
  }
  if (cleaned.length === 13) {
    return /^[0-9]{13}$/.test(cleaned) ? cleaned : null;
  }
  return null;
};

/** Convert a valid ISBN-10 to its ISBN-13 (978 prefix) equivalent. */
export const isbn10To13 = (isbn10: string): string | null => {
  const normalized = normalizeIsbn(isbn10);
  if (!normalized || normalized.length !== 10) return null;
  const core = `978${normalized.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${core}${check}`;
};

/** Convert a 978-prefixed ISBN-13 to its ISBN-10 equivalent. */
export const isbn13To10 = (isbn13: string): string | null => {
  const normalized = normalizeIsbn(isbn13);
  if (!normalized || normalized.length !== 13 || !normalized.startsWith("978")) return null;
  const core = normalized.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(core[i]) * (10 - i);
  }
  const remainder = (11 - (sum % 11)) % 11;
  return `${core}${remainder === 10 ? "X" : remainder}`;
};

/**
 * All ISBN spellings worth querying for one input, most-specific first.
 * Providers index editions inconsistently, so trying both widths avoids empty results.
 */
export const isbnVariants = (input: unknown): string[] => {
  const normalized = normalizeIsbn(input);
  if (!normalized) return [];
  const alternate = normalized.length === 10 ? isbn10To13(normalized) : isbn13To10(normalized);
  return alternate && alternate !== normalized ? [normalized, alternate] : [normalized];
};