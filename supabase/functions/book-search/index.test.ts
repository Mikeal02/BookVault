import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isbn10To13, isbn13To10, isbnVariants, normalizeIsbn } from "../_shared/isbn.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/book-search`;

// Live provider calls need an authenticated caller. Set TEST_USER_EMAIL / TEST_USER_PASSWORD
// in .env to run the end-to-end lookups; the pure normalization tests always run.
const TEST_USER_EMAIL = Deno.env.get("TEST_USER_EMAIL");
const TEST_USER_PASSWORD = Deno.env.get("TEST_USER_PASSWORD");
const canRunLive = Boolean(TEST_USER_EMAIL && TEST_USER_PASSWORD);

/** The same physical book expressed in every format a scanner or a human might produce. */
const ATOMIC_HABITS = {
  isbn13: "9780735211292",
  isbn13Dashed: "978-0-7352-1129-2",
  isbn13Spaced: "978 0 7352 1129 2",
  isbn10: "0735211299",
  isbn10Dashed: "0-7352-1129-9",
};

Deno.test("normalizeIsbn accepts every separator style", () => {
  assertEquals(normalizeIsbn("978-0-7352-1129-2"), "9780735211292");
  assertEquals(normalizeIsbn("978 0 7352 1129 2"), "9780735211292");
  assertEquals(normalizeIsbn(" 9780735211292 "), "9780735211292");
  assertEquals(normalizeIsbn("0-7352-1129-9"), "0735211299");
  assertEquals(normalizeIsbn("080442957x"), "080442957X");
});

Deno.test("normalizeIsbn rejects malformed input", () => {
  assertEquals(normalizeIsbn("12345"), null);
  assertEquals(normalizeIsbn("97807352112921"), null);
  assertEquals(normalizeIsbn("X780735211292"), null);
  assertEquals(normalizeIsbn(undefined), null);
  assertEquals(normalizeIsbn(9780735211292), null);
});

Deno.test("ISBN-10 and ISBN-13 conversions round-trip", () => {
  assertEquals(isbn10To13("0735211299"), "9780735211292");
  assertEquals(isbn13To10("9780735211292"), "0735211299");
  assertEquals(isbn10To13("080442957X"), "9780804429573");
  assertEquals(isbn13To10("9780804429573"), "080442957X");
});

Deno.test("isbnVariants always yields both widths for a lookup", () => {
  assertEquals(isbnVariants("978-0-7352-1129-2"), ["9780735211292", "0735211299"]);
  assertEquals(isbnVariants("0-7352-1129-9"), ["0735211299", "9780735211292"]);
  assertEquals(isbnVariants("nope"), []);
});

const signIn = async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_USER_EMAIL!,
    password: TEST_USER_PASSWORD!,
  });
  if (error || !data.session) throw new Error(`Test sign-in failed: ${error?.message}`);
  return data.session.access_token;
};

const lookup = async (token: string, isbn: string) => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isbn }),
  });
  const body = await response.json();
  return { status: response.status, body };
};

Deno.test({
  name: "edge function requires authentication for ISBN lookups",
  fn: async () => {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ isbn: ATOMIC_HABITS.isbn13 }),
    });
    const body = await response.json();
    assertEquals(response.status, 401);
    assertEquals(body.error, "Unauthorized");
  },
});

Deno.test({
  name: "every ISBN format returns at least one book",
  ignore: !canRunLive,
  fn: async () => {
    const token = await signIn();
    for (const [label, isbn] of Object.entries(ATOMIC_HABITS)) {
      const { status, body } = await lookup(token, isbn);
      assertEquals(status, 200, `${label} returned ${status}`);
      assert(Array.isArray(body.books), `${label} did not return a books array`);
      assert(body.books.length > 0, `${label} (${isbn}) returned no books: ${JSON.stringify(body.errors)}`);
      const first = body.books[0];
      assert(typeof first.title === "string" && first.title.length > 0, `${label} returned a book without a title`);
      assert(Array.isArray(first.authors), `${label} returned a book without authors`);
    }
  },
});

Deno.test({
  name: "different formats of the same ISBN resolve to the same title",
  ignore: !canRunLive,
  fn: async () => {
    const token = await signIn();
    const titles = new Set<string>();
    for (const isbn of [ATOMIC_HABITS.isbn13, ATOMIC_HABITS.isbn13Dashed, ATOMIC_HABITS.isbn10]) {
      const { body } = await lookup(token, isbn);
      assert(body.books?.length > 0, `${isbn} returned no books`);
      titles.add(String(body.books[0].title).toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
    assertEquals(titles.size, 1, `Formats disagreed on the title: ${[...titles].join(", ")}`);
  },
});

Deno.test({
  name: "malformed ISBNs are rejected with 400",
  ignore: !canRunLive,
  fn: async () => {
    const token = await signIn();
    for (const bad of ["12345", "abcdefghij", "97807352112921"]) {
      const { status, body } = await lookup(token, bad);
      assertEquals(status, 400, `${bad} was not rejected`);
      assertEquals(body.books.length, 0);
    }
  },
});