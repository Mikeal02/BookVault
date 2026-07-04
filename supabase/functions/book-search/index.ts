import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

type DataSource = "google" | "openlibrary";

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  mainCategory?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
  buyLink?: string;
  buyLinks?: Record<string, string>;
  isEbook?: boolean;
  hasEpub?: boolean;
  hasPdf?: boolean;
  saleability?: string;
  freeReading?: boolean;
  textSnippet?: string;
  firstSentence?: string;
  isbn10?: string;
  isbn13?: string;
  subjects?: string[];
  subjectPlaces?: string[];
  subjectPeople?: string[];
  editionCount?: number;
  originalPublicationYear?: number;
  dataSources?: DataSource[];
  dataConfidence?: number;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanStr = (value?: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || undefined;
};

const stripHtml = (value?: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return cleanStr(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&[a-z]+;/gi, " ")
  );
};

const dedupe = (values?: unknown[], max = 20): string[] | undefined => {
  if (!Array.isArray(values)) return undefined;
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const cleaned = cleanStr(String(value ?? ""));
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
    if (output.length >= max) break;
  }
  return output.length ? output : undefined;
};

const cleanIsbn = (isbn?: unknown): string | undefined => {
  if (typeof isbn !== "string") return undefined;
  const cleaned = isbn.replace(/[^0-9Xx]/g, "").toUpperCase();
  return cleaned.length === 10 || cleaned.length === 13 ? cleaned : undefined;
};

const https = (url?: string): string | undefined => url?.replace(/^http:\/\//i, "https://");

const nonNegativeInt = (value?: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
};

const rating = (value?: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(Math.max(0, Math.min(5, value)) * 10) / 10;
};

const normalizeLanguage = (value?: unknown): string | undefined => {
  const cleaned = cleanStr(typeof value === "string" ? value : undefined)?.toLowerCase();
  if (!cleaned) return undefined;
  return cleaned === "eng" ? "en" : cleaned.slice(0, 5);
};

const normalizeBook = (book: Book): Book => {
  const categories = dedupe(book.categories, 8);
  const subjects = dedupe(book.subjects, 16);
  const sources = book.dataSources?.length ? [...new Set(book.dataSources)] : undefined;
  const imageLinks = book.imageLinks
    ? Object.fromEntries(
        Object.entries(book.imageLinks)
          .map(([key, value]) => [key, https(value)])
          .filter(([, value]) => Boolean(value))
      ) as Book["imageLinks"]
    : undefined;

  return {
    ...book,
    title: cleanStr(book.title) || "Unknown Title",
    subtitle: cleanStr(book.subtitle),
    authors: dedupe(book.authors, 12) ?? ["Unknown Author"],
    description: stripHtml(book.description),
    textSnippet: stripHtml(book.textSnippet),
    firstSentence: stripHtml(book.firstSentence),
    publisher: cleanStr(book.publisher),
    categories,
    mainCategory: cleanStr(book.mainCategory) || categories?.[0],
    subjects,
    subjectPlaces: dedupe(book.subjectPlaces, 8),
    subjectPeople: dedupe(book.subjectPeople, 8),
    pageCount: nonNegativeInt(book.pageCount),
    averageRating: rating(book.averageRating),
    ratingsCount: nonNegativeInt(book.ratingsCount),
    editionCount: nonNegativeInt(book.editionCount),
    originalPublicationYear: nonNegativeInt(book.originalPublicationYear),
    isbn10: cleanIsbn(book.isbn10),
    isbn13: cleanIsbn(book.isbn13),
    language: normalizeLanguage(book.language),
    imageLinks,
    previewLink: https(book.previewLink),
    infoLink: https(book.infoLink),
    canonicalVolumeLink: https(book.canonicalVolumeLink),
    buyLink: https(book.buyLink),
    dataSources: sources,
    dataConfidence: typeof book.dataConfidence === "number" ? Math.max(0, Math.min(1, book.dataConfidence)) : undefined,
  };
};

const fetchJson = async (url: string, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "LovableBookSearch/1.0 (+https://lovable.dev)",
      },
    });
    const text = await response.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
};

const getOpenLibraryCover = (coverId?: number, isbn?: string, olid?: string, size: "S" | "M" | "L" = "L") => {
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
  if (olid) return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
  return undefined;
};

const transformOpenLibraryBook = (item: any): Book => {
  const isbn13 = item.isbn?.find((value: string) => cleanIsbn(value)?.length === 13);
  const isbn10 = item.isbn?.find((value: string) => cleanIsbn(value)?.length === 10);
  const bestIsbn = isbn13 || isbn10 || item.isbn?.[0];
  const olid = item.edition_key?.[0];
  const cover = getOpenLibraryCover(item.cover_i, bestIsbn, olid, "L");
  const subjects = item.subject?.slice(0, 12) || [];
  const authors = item.author_name || [];
  const title = item.title || "Unknown Title";
  const author = authors[0];

  return normalizeBook({
    id: item.key?.replace("/works/", "ol_") || `ol_${crypto.randomUUID()}`,
    title,
    subtitle: item.subtitle,
    authors,
    description: item.first_sentence?.value || item.first_sentence?.[0] || item.subtitle,
    publishedDate: item.first_publish_year?.toString(),
    publisher: item.publisher?.[0],
    pageCount: item.number_of_pages_median,
    categories: subjects.slice(0, 6),
    imageLinks: cover ? { thumbnail: cover, smallThumbnail: getOpenLibraryCover(item.cover_i, bestIsbn, olid, "M") || cover } : undefined,
    averageRating: item.ratings_average,
    ratingsCount: item.ratings_count,
    language: item.language?.[0],
    previewLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    infoLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    buyLinks: {
      amazon: `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${author || ""}`.trim())}`,
    },
    editionCount: item.edition_count,
    firstSentence: item.first_sentence?.value || item.first_sentence?.[0],
    isbn10,
    isbn13,
    subjects,
    subjectPlaces: item.subject_place?.slice(0, 5),
    subjectPeople: (item.person || item.subject_people)?.slice(0, 5),
    freeReading: Boolean(item.has_fulltext),
    originalPublicationYear: item.first_publish_year,
    dataSources: ["openlibrary"],
    dataConfidence: 0.6,
  });
};

const transformGoogleBook = (item: any): Book => {
  const volumeInfo = item.volumeInfo || {};
  const saleInfo = item.saleInfo || {};
  const accessInfo = item.accessInfo || {};
  const identifiers = volumeInfo.industryIdentifiers || [];
  const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13")?.identifier;
  const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10")?.identifier;
  const thumbnail = volumeInfo.imageLinks?.thumbnail
    ? https(volumeInfo.imageLinks.thumbnail.replace(/zoom=\d/, "zoom=3"))
    : `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=3&source=gbs_api`;

  return normalizeBook({
    id: item.id,
    title: volumeInfo.title || "Unknown Title",
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || [],
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    publisher: volumeInfo.publisher,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    mainCategory: volumeInfo.mainCategory,
    imageLinks: thumbnail ? {
      thumbnail,
      smallThumbnail: https(volumeInfo.imageLinks?.smallThumbnail) || thumbnail,
      small: https(volumeInfo.imageLinks?.small),
      medium: https(volumeInfo.imageLinks?.medium),
      large: https(volumeInfo.imageLinks?.large),
      extraLarge: https(volumeInfo.imageLinks?.extraLarge),
    } : undefined,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    language: volumeInfo.language,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
    canonicalVolumeLink: volumeInfo.canonicalVolumeLink,
    buyLink: saleInfo.buyLink,
    isEbook: saleInfo.isEbook,
    hasEpub: saleInfo.epub?.isAvailable,
    hasPdf: saleInfo.pdf?.isAvailable,
    saleability: saleInfo.saleability,
    textSnippet: item.searchInfo?.textSnippet,
    isbn10,
    isbn13,
    dataSources: ["google"],
    dataConfidence: 0.75,
    ...(accessInfo.webReaderLink ? { webReaderLink: accessInfo.webReaderLink } : {}),
  } as Book);
};

const searchOpenLibrary = async (query: string, limit: number): Promise<{ books: Book[]; error?: string }> => {
  const fields = "key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count,ratings_average,isbn,subtitle,edition_count,has_fulltext,subject_place,person,subject_people";
  const params = new URLSearchParams({ q: query, limit: String(Math.min(limit, 100)), fields });
  const result = await fetchJson(`${OPEN_LIBRARY_SEARCH_URL}?${params}`, 16000);
  if (!result.ok) return { books: [], error: `Open Library returned ${result.status}` };
  const docs = Array.isArray(result.body?.docs) ? result.body.docs : [];
  return {
    books: docs
      .filter((item: any) => item.title && item.author_name?.length)
      .map(transformOpenLibraryBook),
  };
};

const searchGoogleBooks = async (query: string, limit: number): Promise<{ books: Book[]; error?: string; needsApiKey?: boolean }> => {
  const apiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY") || Deno.env.get("BOOKS_API_KEY");
  const params = new URLSearchParams({
    q: query,
    maxResults: String(Math.min(limit, 40)),
    orderBy: "relevance",
    printType: "books",
  });
  if (apiKey) params.set("key", apiKey);
  const result = await fetchJson(`${GOOGLE_BOOKS_API_URL}?${params}`, 12000);
  if (!result.ok) {
    return {
      books: [],
      error: `Google Books returned ${result.status}`,
      needsApiKey: result.status === 429 || result.status === 403,
    };
  }
  const items = Array.isArray(result.body?.items) ? result.body.items : [];
  return { books: items.map(transformGoogleBook) };
};

const relevanceScore = (book: Book, terms: string[]) => {
  const title = book.title.toLowerCase();
  const author = (book.authors?.[0] || "").toLowerCase();
  const fullQuery = terms.join(" ");
  let score = 0;
  if (title === fullQuery) score += 70;
  else if (title.startsWith(fullQuery)) score += 45;
  else if (title.includes(fullQuery)) score += 30;
  for (const term of terms) {
    if (title.includes(term)) score += 18;
    if (author.includes(term)) score += 12;
  }
  if (book.imageLinks?.thumbnail) score += 12;
  if (book.averageRating) score += book.averageRating * 4;
  if (book.ratingsCount) score += Math.min(25, Math.log10(book.ratingsCount + 1) * 8);
  if (book.language === "en") score += 3;
  return score;
};

const mergeAndSort = (books: Book[], query: string, maxResults: number) => {
  const seen = new Map<string, Book>();
  for (const book of books) {
    const key = `${book.title.toLowerCase().replace(/[^a-z0-9]/g, "")}-${(book.authors?.[0] || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, book);
      continue;
    }
    seen.set(key, normalizeBook({
      ...existing,
      description: (existing.description?.length || 0) >= (book.description?.length || 0) ? existing.description : book.description,
      imageLinks: existing.imageLinks || book.imageLinks,
      averageRating: existing.averageRating || book.averageRating,
      ratingsCount: Math.max(existing.ratingsCount || 0, book.ratingsCount || 0) || undefined,
      pageCount: existing.pageCount || book.pageCount,
      categories: (existing.categories?.length || 0) >= (book.categories?.length || 0) ? existing.categories : book.categories,
      subjects: (existing.subjects?.length || 0) >= (book.subjects?.length || 0) ? existing.subjects : book.subjects,
      isbn10: existing.isbn10 || book.isbn10,
      isbn13: existing.isbn13 || book.isbn13,
      dataSources: [...(existing.dataSources || []), ...(book.dataSources || [])],
      dataConfidence: Math.max(existing.dataConfidence || 0, book.dataConfidence || 0),
    }));
  }
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 1);
  return [...seen.values()]
    .sort((a, b) => relevanceScore(b, terms) - relevanceScore(a, terms))
    .slice(0, maxResults)
    .map(normalizeBook);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ books: [], error: "Method not allowed" }, 405);

  try {
    const { query, maxResults = 40 } = await req.json().catch(() => ({}));
    const searchQuery = cleanStr(query);
    if (!searchQuery) return json({ books: [], sources: [], errors: [] });

    const [openLibrary, google] = await Promise.allSettled([
      searchOpenLibrary(searchQuery, Math.min(Number(maxResults) * 2 || 80, 100)),
      searchGoogleBooks(searchQuery, 40),
    ]);

    const openLibraryValue = openLibrary.status === "fulfilled" ? openLibrary.value : { books: [], error: "Open Library request failed" };
    const googleValue = google.status === "fulfilled" ? google.value : { books: [], error: "Google Books request failed" };
    const books = mergeAndSort([...googleValue.books, ...openLibraryValue.books], searchQuery, Number(maxResults) || 40);
    const errors = [openLibraryValue.error, googleValue.error].filter(Boolean);
    const sources = [
      openLibraryValue.books.length ? "openlibrary" : null,
      googleValue.books.length ? "google" : null,
    ].filter(Boolean);

    return json({
      books,
      sources,
      errors,
      googleNeedsApiKey: Boolean(googleValue.needsApiKey),
    });
  } catch (error) {
    console.error("book-search error", error);
    return json({
      books: [],
      sources: [],
      errors: [error instanceof Error ? error.message : "Book search failed"],
      fallback: true,
    });
  }
});