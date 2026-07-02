import { Book } from '@/types/book';

// === API Endpoints ===
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

// === In-memory cache ===
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<Book[]>>();
const enrichmentCache = new Map<string, CacheEntry<Partial<Book>>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ENRICH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (query: string, filters?: SearchFilters): string => {
  return `${query.toLowerCase().trim()}|${JSON.stringify(filters || {})}`;
};

const getCached = <T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = <T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, maxSize = 100) => {
  if (cache.size > maxSize) {
    const oldest = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 20; i++) cache.delete(oldest[i][0]);
  }
  cache.set(key, { data, timestamp: Date.now() });
};

// === Retry with exponential backoff ===
const fetchWithRetry = async (url: string, maxRetries = 2): Promise<Response> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) return response;
      if (response.status === 429) throw new Error('429 Rate limit exceeded');
      if (response.status >= 500) throw new Error(`${response.status} Server error`);
      if (response.status >= 400 && response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }
  throw lastError || new Error('Request failed');
};

// === Cover Image Resolution (multi-resolution strategy) ===
const getOpenLibraryCover = (coverId?: number, isbn?: string, olid?: string, size: 'S' | 'M' | 'L' = 'L'): string | undefined => {
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
  if (olid) return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
  return undefined;
};

const getGoogleBooksCover = (isbn?: string, zoom = 1): string | undefined => {
  if (!isbn) return undefined;
  return `https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=${zoom}&source=gbs_api&vid=ISBN${isbn}`;
};

const getGoogleBooksIdCover = (googleId: string, zoom = 3): string => {
  return `https://books.google.com/books/content?id=${googleId}&printsec=frontcover&img=1&zoom=${zoom}&source=gbs_api`;
};

const buildCoverUrls = (item: any): { thumbnail?: string; smallThumbnail?: string } => {
  const coverId = item.cover_i;
  const isbn13 = item.isbn?.[0];
  const isbn10 = item.isbn?.find((i: string) => i.length === 10);
  const bestIsbn = isbn13 || isbn10;
  const olid = item.edition_key?.[0];

  const primary = getOpenLibraryCover(coverId, bestIsbn, olid, 'L');
  const fallback = getGoogleBooksCover(bestIsbn, 3);

  const thumbnail = primary || fallback;
  if (!thumbnail) return {};

  return {
    thumbnail,
    smallThumbnail: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : thumbnail,
  };
};

// === Reading difficulty estimation (enhanced) ===
const estimateReadingDifficulty = (pageCount?: number, subjects?: string[]): 'easy' | 'moderate' | 'advanced' | undefined => {
  if (!pageCount && !subjects?.length) return undefined;
  
  const hardSubjects = ['philosophy', 'mathematics', 'physics', 'quantum', 'advanced', 'academic', 'theoretical', 'graduate', 'doctoral', 'treatise'];
  const easySubjects = ['children', 'juvenile', 'young adult', 'comics', 'graphic novel', 'picture book', 'board book', 'easy reader'];
  
  const subjectsLower = (subjects || []).map(s => s.toLowerCase());
  
  if (easySubjects.some(es => subjectsLower.some(s => s.includes(es)))) return 'easy';
  if (hardSubjects.some(hs => subjectsLower.some(s => s.includes(hs)))) return 'advanced';
  if (pageCount && pageCount > 600) return 'advanced';
  if (pageCount && pageCount < 200) return 'easy';
  return 'moderate';
};

// === Estimated reading time (words per minute model) ===
const estimateReadingMinutes = (pageCount?: number, difficulty?: 'easy' | 'moderate' | 'advanced'): number | undefined => {
  if (!pageCount) return undefined;
  const wordsPerPage = 250;
  const wpm = difficulty === 'easy' ? 280 : difficulty === 'advanced' ? 180 : 230;
  return Math.round((pageCount * wordsPerPage) / wpm);
};

// === Series detection from Open Library (enhanced patterns) ===
const detectSeries = (item: any): { seriesName?: string; seriesPosition?: number } => {
  const subtitle = item.subtitle || '';
  const title = item.title || '';
  const combined = `${title} ${subtitle}`;
  
  const patterns = [
    /(?:book|vol(?:ume)?\.?|part|#)\s*(\d+)\s*(?:of|in|:)\s*(?:the\s+)?(.+?)(?:\s+series)?$/i,
    /\((.+?)(?:\s+series)?,?\s*#?(\d+)\)/i,
    /\((.+?)\s+book\s+(\d+)\)/i,
    /:\s*(.+?)\s+(?:book|vol)\s+(\d+)/i,
    /(.+?)\s+trilogy,?\s*(?:book\s+)?#?(\d+)/i,
    /(.+?)\s+saga,?\s*(?:book\s+)?#?(\d+)/i,
    /(.+?)\s+chronicles?,?\s*(?:book\s+)?#?(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) {
      const num = parseInt(match[1]) || parseInt(match[2]);
      const name = isNaN(parseInt(match[1])) ? match[1] : match[2];
      if (name && num) {
        return { seriesName: name.trim(), seriesPosition: num };
      }
    }
  }
  
  return {};
};

// === Relevance Scoring (enhanced with decay & completeness) ===
const computeRelevanceScore = (book: Book, queryTerms: string[]): number => {
  let score = 0;
  
  // Cover & metadata completeness (weighted)
  if (book.imageLinks?.thumbnail) score += 30;
  if (book.averageRating) score += book.averageRating * 5;
  if (book.ratingsCount) score += Math.min(25, Math.log10(book.ratingsCount + 1) * 6);
  if (book.description && book.description.length > 200) score += 12;
  else if (book.description && book.description.length > 100) score += 8;
  else if (book.description) score += 4;
  if (book.pageCount) score += 3;
  if (book.categories?.length) score += 4;
  if (book.publishedDate) score += 2;
  if (book.publisher) score += 2;
  if (book.isEbook) score += 3;
  if (book.seriesName) score += 5;
  if (book.textSnippet) score += 2;
  if (book.isbn13 || book.isbn10) score += 3;
  if (book.editionCount && book.editionCount > 10) score += 5;
  if (book.language === 'en') score += 3; // English preference boost

  // Title/author match quality
  const titleLower = book.title.toLowerCase();
  const authorLower = (book.authors?.[0] || '').toLowerCase();
  const fullQuery = queryTerms.join(' ');
  
  if (titleLower === fullQuery) score += 50;
  else if (titleLower.startsWith(fullQuery)) score += 30;
  else if (titleLower.includes(fullQuery)) score += 20;
  
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 15;
    if (titleLower.startsWith(term)) score += 10;
    if (authorLower.includes(term)) score += 12;
    // Check categories too
    if (book.categories?.some(c => c.toLowerCase().includes(term))) score += 5;
  }

  // Recency bonus (decay curve)
  if (book.publishedDate) {
    const year = parseInt(book.publishedDate);
    const currentYear = new Date().getFullYear();
    if (year >= currentYear) score += 10;
    else if (year >= currentYear - 1) score += 8;
    else if (year >= currentYear - 3) score += 5;
    else if (year >= currentYear - 10) score += 3;
    else if (year >= currentYear - 20) score += 1;
  }

  // Penalize books without covers
  if (!book.imageLinks?.thumbnail) score -= 15;
  // Penalize books without authors
  if (!book.authors?.length || book.authors[0] === 'Unknown Author') score -= 10;

  return score;
};

// === Transformers ===
// === Normalization: produces a consistent, render-safe Book shape ===
const stripHtml = (s?: string): string | undefined => {
  if (!s) return undefined;
  const cleaned = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || undefined;
};

const cleanStr = (s?: string): string | undefined => {
  if (typeof s !== 'string') return undefined;
  const t = s.replace(/\s+/g, ' ').trim();
  return t || undefined;
};

const dedupeArr = (arr?: any[], max = 20): string[] | undefined => {
  if (!Array.isArray(arr)) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const v = cleanStr(String(raw ?? ''));
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out.length ? out : undefined;
};

const cleanIsbn = (s?: string): string | undefined => {
  if (!s) return undefined;
  const t = s.replace(/[^0-9Xx]/g, '').toUpperCase();
  return t.length === 10 || t.length === 13 ? t : undefined;
};

const normalizeLanguage = (l?: string): string | undefined => {
  if (!l) return undefined;
  const v = l.trim().toLowerCase();
  if (v === 'eng') return 'en';
  return v.length >= 2 ? v.slice(0, 5) : undefined;
};

const normalizeYear = (d?: string): string | undefined => {
  if (!d) return undefined;
  const m = String(d).match(/\d{4}/);
  if (!m) return undefined;
  const y = parseInt(m[0], 10);
  if (y < 100 || y > new Date().getFullYear() + 2) return d.trim() || undefined;
  return d.trim();
};

const upgradeHttps = (u?: string): string | undefined =>
  u ? u.replace(/^http:\/\//i, 'https://') : undefined;

const normalizeImageLinks = (
  links: Book['imageLinks'] | undefined
): Book['imageLinks'] | undefined => {
  if (!links) return undefined;
  const out: NonNullable<Book['imageLinks']> = {};
  (['thumbnail', 'smallThumbnail', 'small', 'medium', 'large', 'extraLarge'] as const).forEach(k => {
    const v = upgradeHttps(links[k]);
    if (v) out[k] = v;
  });
  // Cascade fallback so consumers never get an empty gap.
  const best = out.extraLarge || out.large || out.medium || out.small || out.thumbnail || out.smallThumbnail;
  if (!best) return undefined;
  if (!out.thumbnail) out.thumbnail = best;
  if (!out.smallThumbnail) out.smallThumbnail = out.small || out.thumbnail;
  return out;
};

const clampRating = (r?: number): number | undefined => {
  if (typeof r !== 'number' || !isFinite(r)) return undefined;
  return Math.round(Math.max(0, Math.min(5, r)) * 10) / 10;
};

const nonNegInt = (n?: number): number | undefined => {
  if (typeof n !== 'number' || !isFinite(n) || n < 0) return undefined;
  return Math.round(n);
};

/**
 * Normalizes a raw Book (from any source) into a consistent, render-safe shape.
 * Guarantees: trimmed strings, HTML-free prose, deduped arrays, https covers,
 * clamped numeric ranges, canonical ISBN/language, non-null authors array.
 */
export const normalizeBook = (raw: Book): Book => {
  const authors = dedupeArr(raw.authors, 12) ?? ['Unknown Author'];
  const categories = dedupeArr(raw.categories, 8);
  const subjects = dedupeArr(raw.subjects, 16);
  const subjectPlaces = dedupeArr(raw.subjectPlaces, 8);
  const subjectPeople = dedupeArr(raw.subjectPeople, 8);
  const subjectTimes = dedupeArr(raw.subjectTimes, 8);
  const tags = dedupeArr(raw.tags, 20);
  const awards = dedupeArr(raw.awards, 10);
  const authorAlternateNames = dedupeArr(raw.authorAlternateNames, 8);

  const description = stripHtml(raw.description);
  const textSnippet = stripHtml(raw.textSnippet);
  const firstSentence = stripHtml(raw.firstSentence);
  const authorBio = stripHtml(raw.authorBio);

  const isbn10 = cleanIsbn(raw.isbn10);
  const isbn13 = cleanIsbn(raw.isbn13);

  const imageLinks = normalizeImageLinks(raw.imageLinks);
  const sources = raw.dataSources?.length ? Array.from(new Set(raw.dataSources)) : undefined;

  return {
    ...raw,
    title: cleanStr(raw.title) || 'Unknown Title',
    subtitle: cleanStr(raw.subtitle),
    authors,
    description,
    textSnippet,
    firstSentence,
    authorBio,
    publisher: cleanStr(raw.publisher),
    publishedDate: normalizeYear(raw.publishedDate),
    language: normalizeLanguage(raw.language),
    categories,
    mainCategory: cleanStr(raw.mainCategory) || categories?.[0],
    subjects,
    subjectPlaces,
    subjectPeople,
    subjectTimes,
    tags,
    awards,
    authorAlternateNames,
    pageCount: nonNegInt(raw.pageCount),
    printedPageCount: nonNegInt(raw.printedPageCount),
    averageRating: clampRating(raw.averageRating),
    ratingsCount: nonNegInt(raw.ratingsCount),
    editionCount: nonNegInt(raw.editionCount),
    translationCount: nonNegInt(raw.translationCount),
    wordCountEstimate: nonNegInt(raw.wordCountEstimate),
    isbn10,
    isbn13,
    imageLinks,
    previewLink: upgradeHttps(raw.previewLink),
    infoLink: upgradeHttps(raw.infoLink),
    canonicalVolumeLink: upgradeHttps(raw.canonicalVolumeLink),
    webReaderLink: upgradeHttps(raw.webReaderLink),
    authorPhotoUrl: upgradeHttps(raw.authorPhotoUrl),
    authorWikipediaUrl: upgradeHttps(raw.authorWikipediaUrl),
    wikipediaUrl: upgradeHttps(raw.wikipediaUrl),
    dataSources: sources,
    dataConfidence: typeof raw.dataConfidence === 'number'
      ? Math.max(0, Math.min(1, Math.round(raw.dataConfidence * 100) / 100))
      : undefined,
  };
};

const transformOpenLibraryBook = (item: any): Book => {
  const covers = buildCoverUrls(item);
  const authors = item.author_name || [];
  const title = item.title || 'Unknown Title';
  const buyLinks = generatePurchaseLinks(title, authors[0]);
  const id = item.key?.replace('/works/', 'ol_') || `ol_${Math.random().toString(36).slice(2)}`;
  const isbn13 = item.isbn?.find((i: string) => i.length === 13);
  const isbn10 = item.isbn?.find((i: string) => i.length === 10);
  const subjects = item.subject?.slice(0, 10) || [];
  const series = detectSeries(item);
  const difficulty = estimateReadingDifficulty(item.number_of_pages_median, subjects);

  const base: Book = {
    id,
    title,
    authors,
    description: item.first_sentence?.value || item.subtitle || undefined,
    publishedDate: item.first_publish_year?.toString(),
    publisher: item.publisher?.[0],
    pageCount: item.number_of_pages_median || undefined,
    categories: subjects.slice(0, 5),
    imageLinks: covers.thumbnail ? covers : undefined,
    averageRating: item.ratings_average ? Math.round(item.ratings_average * 10) / 10 : undefined,
    ratingsCount: item.ratings_count || undefined,
    language: item.language?.[0] === 'eng' ? 'en' : item.language?.[0],
    previewLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    infoLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    buyLinks,
    editionCount: item.edition_count || undefined,
    firstSentence: item.first_sentence?.value || undefined,
    isbn10: isbn10 || undefined,
    isbn13: isbn13 || undefined,
    subjects,
    subjectPlaces: item.subject_place?.slice(0, 5) || undefined,
    subjectPeople: item.person?.slice(0, 5) || item.subject_people?.slice(0, 5) || undefined,
    subjectTimes: item.subject_time?.slice(0, 5) || undefined,
    freeReading: item.has_fulltext || false,
    readingDifficulty: difficulty,
    originalPublicationYear: item.first_publish_year || undefined,
    dataSources: ['openlibrary'],
    dataConfidence: 0.55,
    ...series,
  };
  return normalizeBook(base);
};

const transformGoogleBookToBook = (item: any): Book => {
  const { volumeInfo, saleInfo, searchInfo, accessInfo } = item;
  const buyLinks = generatePurchaseLinks(volumeInfo.title, volumeInfo.authors?.[0]);

  let thumbnail = volumeInfo.imageLinks?.thumbnail;
  let smallThumbnail = volumeInfo.imageLinks?.smallThumbnail;

  // Upgrade to highest quality covers
  if (thumbnail) {
    thumbnail = thumbnail.replace('http://', 'https://').replace(/zoom=\d/, 'zoom=3');
  }
  // Also build a direct high-res cover from the Google Books ID
  if (!thumbnail || thumbnail.includes('zoom=1')) {
    thumbnail = getGoogleBooksIdCover(item.id, 3);
  }
  if (smallThumbnail) {
    smallThumbnail = smallThumbnail.replace('http://', 'https://');
  }
  const upgradeImg = (u?: string) =>
    u ? u.replace('http://', 'https://') : undefined;
  const imageLinks = volumeInfo.imageLinks
    ? {
        thumbnail,
        smallThumbnail,
        small: upgradeImg(volumeInfo.imageLinks.small),
        medium: upgradeImg(volumeInfo.imageLinks.medium),
        large: upgradeImg(volumeInfo.imageLinks.large),
        extraLarge: upgradeImg(volumeInfo.imageLinks.extraLarge),
      }
    : thumbnail
    ? { thumbnail, smallThumbnail }
    : undefined;

  const identifiers = volumeInfo.industryIdentifiers || [];
  const isbn13 = identifiers.find((id: any) => id.type === 'ISBN_13')?.identifier;
  const isbn10 = identifiers.find((id: any) => id.type === 'ISBN_10')?.identifier;
  const otherIdentifiers = identifiers
    .filter((id: any) => id.type !== 'ISBN_13' && id.type !== 'ISBN_10')
    .map((id: any) => ({ type: id.type, identifier: id.identifier }));

  const seriesInfo = volumeInfo.seriesInfo;
  let seriesName: string | undefined;
  let seriesPosition: number | undefined;
  if (seriesInfo?.shortSeriesBookTitle) {
    seriesName = seriesInfo.shortSeriesBookTitle;
    seriesPosition = parseInt(seriesInfo.bookDisplayNumber || '') || undefined;
  }

  if (!seriesName) {
    const detected = detectSeries({ title: volumeInfo.title, subtitle: volumeInfo.subtitle });
    seriesName = detected.seriesName;
    seriesPosition = detected.seriesPosition;
  }

  let textSnippet = searchInfo?.textSnippet;
  if (textSnippet) {
    textSnippet = textSnippet.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }

  const difficulty = estimateReadingDifficulty(volumeInfo.pageCount, volumeInfo.categories);

  const base: Book = {
    id: item.id,
    title: volumeInfo.title || 'Unknown Title',
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || ['Unknown Author'],
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    publisher: volumeInfo.publisher,
    pageCount: volumeInfo.pageCount,
    printedPageCount: volumeInfo.printedPageCount,
    categories: volumeInfo.categories,
    mainCategory: volumeInfo.mainCategory,
    imageLinks,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    language: volumeInfo.language,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
    canonicalVolumeLink: volumeInfo.canonicalVolumeLink,
    webReaderLink: accessInfo?.webReaderLink,
    buyLinks,
    buyLink: saleInfo?.buyLink,
    isEbook: saleInfo?.isEbook || false,
    hasEpub: saleInfo?.epub?.isAvailable || false,
    hasPdf: saleInfo?.pdf?.isAvailable || false,
    listPrice: saleInfo?.listPrice || undefined,
    retailPrice: saleInfo?.retailPrice || undefined,
    saleability: saleInfo?.saleability as Book['saleability'] || undefined,
    country: saleInfo?.country || accessInfo?.country,
    viewability: accessInfo?.viewability,
    embeddable: accessInfo?.embeddable,
    publicDomain: accessInfo?.publicDomain,
    textToSpeechAllowed: accessInfo?.textToSpeechPermission === 'ALLOWED',
    quoteSharingAllowed: accessInfo?.quoteSharingAllowed,
    readingModes: volumeInfo.readingModes,
    printType: volumeInfo.printType,
    contentVersion: volumeInfo.contentVersion,
    panelizationSummary: volumeInfo.panelizationSummary,
    textSnippet,
    maturityRating: volumeInfo.maturityRating as Book['maturityRating'] || undefined,
    isbn10,
    isbn13,
    otherIdentifiers: otherIdentifiers.length ? otherIdentifiers : undefined,
    seriesName,
    seriesPosition,
    readingDifficulty: difficulty,
    dataSources: ['google'],
    dataConfidence: 0.7,
  };
  return normalizeBook(base);
};

// === Search Functions ===
const searchOpenLibrary = async (query: string, limit: number = 100): Promise<Book[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: Math.min(limit, 100).toString(),
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count,ratings_average,isbn,subtitle,edition_count,has_fulltext,subject_place,person,subject_people',
    });

    const response = await fetchWithRetry(`${OPEN_LIBRARY_SEARCH_URL}?${params}`);
    if (!response.ok) throw new Error('Open Library request failed');

    const data = await response.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    return data.docs
      .filter((item: any) => item.title && item.author_name?.length)
      .map(transformOpenLibraryBook);
  } catch (error) {
    console.error('Open Library search failed:', error);
    return [];
  }
};

const searchGoogleBooks = async (query: string, limit: number = 40): Promise<Book[]> => {
  try {
    const response = await fetchWithRetry(
      `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=${Math.min(limit, 40)}&orderBy=relevance&printType=books`
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map(transformGoogleBookToBook);
  } catch {
    return [];
  }
};

// === Fetch single book by ID (for enrichment) ===
export const fetchBookById = async (bookId: string): Promise<Book | null> => {
  try {
    if (bookId.startsWith('ol_')) {
      const workId = bookId.replace('ol_', '');
      const response = await fetchWithRetry(`https://openlibrary.org/works/${workId}.json`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        id: bookId,
        title: data.title || 'Unknown',
        authors: [],
        description: typeof data.description === 'string' ? data.description : data.description?.value,
        subjects: data.subjects?.slice(0, 10),
        subjectPlaces: data.subject_places?.slice(0, 5),
        subjectPeople: data.subject_people?.slice(0, 5),
      };
    } else {
      const response = await fetchWithRetry(`${GOOGLE_BOOKS_API_URL}/${bookId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return transformGoogleBookToBook(data);
    }
  } catch {
    return null;
  }
};

// === Enrich a book with full metadata from both APIs ===
export const enrichBook = async (book: Book): Promise<Book> => {
  const cacheKey = `enrich_${book.id}`;
  const cached = getCached(enrichmentCache, cacheKey, ENRICH_CACHE_TTL);
  if (cached) return { ...book, ...cached };

  const enrichments: Partial<Book> = {};
  const sources = new Set<'google' | 'openlibrary' | 'wikipedia'>(book.dataSources || []);

  try {
    const promises: Promise<void>[] = [];

    // If it's a Google Books ID, fetch full volume info
    if (!book.id.startsWith('ol_') && (!book.description || book.description.length < 100)) {
      promises.push(
        fetchWithRetry(`${GOOGLE_BOOKS_API_URL}/${book.id}`)
          .then(r => r.json())
          .then(data => {
            if (data.volumeInfo) {
              const full = transformGoogleBookToBook(data);
              sources.add('google');
              if (full.description && (full.description.length > (book.description?.length || 0))) {
                enrichments.description = full.description;
              }
              if (full.pageCount && !book.pageCount) enrichments.pageCount = full.pageCount;
              if (full.categories?.length && !book.categories?.length) enrichments.categories = full.categories;
              if (full.averageRating && !book.averageRating) enrichments.averageRating = full.averageRating;
              if (full.ratingsCount && !book.ratingsCount) enrichments.ratingsCount = full.ratingsCount;
              if (full.publisher && !book.publisher) enrichments.publisher = full.publisher;
              if (full.isEbook) enrichments.isEbook = full.isEbook;
              if (full.hasEpub) enrichments.hasEpub = full.hasEpub;
              if (full.hasPdf) enrichments.hasPdf = full.hasPdf;
              if (full.listPrice) enrichments.listPrice = full.listPrice;
              if (full.retailPrice) enrichments.retailPrice = full.retailPrice;
              if (full.saleability) enrichments.saleability = full.saleability;
              if (full.seriesName && !book.seriesName) {
                enrichments.seriesName = full.seriesName;
                enrichments.seriesPosition = full.seriesPosition;
              }
            }
          })
          .catch(() => {})
      );
    }

    // Cross-reference with Open Library using ISBN for richer subjects/people/places
    const isbn = book.isbn13 || book.isbn10;
    if (isbn && (!book.subjects?.length || !book.subjectPeople?.length)) {
      promises.push(
        fetchWithRetry(`${OPEN_LIBRARY_SEARCH_URL}?isbn=${isbn}&limit=1&fields=key,subject,subject_place,subject_time,person,first_sentence,edition_count,has_fulltext,number_of_pages_median,ratings_average,ratings_count,first_publish_year,author_key,author_name`)
          .then(r => r.json())
          .then(data => {
            const doc = data.docs?.[0];
            if (doc) {
              sources.add('openlibrary');
              if (doc.subject?.length && !book.subjects?.length) enrichments.subjects = doc.subject.slice(0, 10);
              if (doc.subject_place?.length && !book.subjectPlaces?.length) enrichments.subjectPlaces = doc.subject_place.slice(0, 5);
              if (doc.subject_time?.length && !book.subjectTimes?.length) enrichments.subjectTimes = doc.subject_time.slice(0, 5);
              if ((doc.person?.length || doc.subject_people?.length) && !book.subjectPeople?.length) {
                enrichments.subjectPeople = (doc.person || doc.subject_people)?.slice(0, 5);
              }
              if (doc.first_sentence?.value && !book.firstSentence) enrichments.firstSentence = doc.first_sentence.value;
              if (doc.edition_count && !book.editionCount) enrichments.editionCount = doc.edition_count;
              if (doc.has_fulltext) enrichments.freeReading = true;
              if (doc.number_of_pages_median && !book.pageCount) enrichments.pageCount = doc.number_of_pages_median;
              if (doc.first_publish_year && !book.originalPublicationYear) {
                enrichments.originalPublicationYear = doc.first_publish_year;
              }
              // Translation count proxy via edition_count
              if (doc.edition_count && doc.edition_count > 5 && !book.translationCount) {
                enrichments.translationCount = Math.round(doc.edition_count / 4);
              }
              // Author OL enrichment (full bio + photo + dates + links)
              const authorKey = doc.author_key?.[0];
              if (authorKey) {
                promises.push(
                  fetchWithRetry(`https://openlibrary.org/authors/${authorKey}.json`)
                    .then(r => r.json())
                    .then(adata => {
                      const bio = typeof adata.bio === 'string' ? adata.bio : adata.bio?.value;
                      if (bio && !book.authorBio) enrichments.authorBio = bio.split('\n').filter(Boolean).slice(0, 4).join('\n\n').slice(0, 1400);
                      if (adata.birth_date) enrichments.authorBirthDate = adata.birth_date;
                      if (adata.death_date) enrichments.authorDeathDate = adata.death_date;
                      if (adata.wikipedia) enrichments.authorWikipediaUrl = adata.wikipedia;
                      if (adata.personal_name) enrichments.authorPersonalName = adata.personal_name;
                      if (adata.alternate_names?.length) enrichments.authorAlternateNames = adata.alternate_names.slice(0, 6);
                      if (adata.top_work) enrichments.authorTopWork = adata.top_work;
                      if (adata.photos?.[0] && adata.photos[0] !== -1) {
                        enrichments.authorPhotoUrl = `https://covers.openlibrary.org/a/id/${adata.photos[0]}-M.jpg`;
                      } else {
                        enrichments.authorPhotoUrl = `https://covers.openlibrary.org/a/olid/${authorKey}-M.jpg`;
                      }
                      if (Array.isArray(adata.links)) {
                        enrichments.authorLinks = adata.links
                          .filter((l: any) => l?.url && l?.title)
                          .slice(0, 6)
                          .map((l: any) => ({ title: l.title, url: l.url }));
                      }
                    })
                    .catch(() => {})
                );
                // Author works count
                promises.push(
                  fetchWithRetry(`https://openlibrary.org/authors/${authorKey}/works.json?limit=1`)
                    .then(r => r.json())
                    .then(wdata => {
                      if (typeof wdata.size === 'number') enrichments.authorWorkCount = wdata.size;
                    })
                    .catch(() => {})
                );
              }
              // Resolve work key from ISBN lookup so we can pull work/editions/ratings/bookshelves
              const workKey: string | undefined = doc.key?.replace('/works/', '');
              if (workKey) {
                promises.push(fetchWorkBundle(workKey, enrichments, sources));
              }
            }
          })
          .catch(() => {})
      );
    }

    // If book ID is already an OL work key, fetch the work bundle directly
    if (book.id.startsWith('ol_')) {
      const workKey = book.id.replace('ol_', '');
      promises.push(fetchWorkBundle(workKey, enrichments, sources));
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
      // Run any author follow-ups added during the first wave
      await Promise.allSettled(promises);
    }

    // Compute derived fields from enriched data
    const mergedPageCount = enrichments.pageCount || book.pageCount;
    const mergedSubjects = enrichments.subjects || book.subjects;
    if (!book.readingDifficulty && (mergedPageCount || mergedSubjects?.length)) {
      enrichments.readingDifficulty = estimateReadingDifficulty(mergedPageCount, mergedSubjects);
    }
    // Word count estimate (industry avg ~250 words/page)
    if (mergedPageCount && !book.wordCountEstimate) {
      enrichments.wordCountEstimate = Math.round(mergedPageCount * 250);
    }

    // Compute data confidence
    enrichments.dataSources = Array.from(sources);
    let confidence = 0;
    if (sources.has('google')) confidence += 0.45;
    if (sources.has('openlibrary')) confidence += 0.35;
    const merged = { ...book, ...enrichments };
    if (merged.imageLinks?.thumbnail) confidence += 0.05;
    if (merged.description && merged.description.length > 200) confidence += 0.05;
    if (merged.isbn13 || merged.isbn10) confidence += 0.05;
    if (merged.averageRating && merged.ratingsCount && merged.ratingsCount > 50) confidence += 0.05;
    enrichments.dataConfidence = Math.min(1, Math.round(confidence * 100) / 100);

    setCache(enrichmentCache, cacheKey, enrichments, 200);
  } catch {
    // Enrichment failed silently
  }

  return normalizeBook({ ...book, ...enrichments });
};

// === Fetch Open Library work bundle: work doc, editions, ratings, bookshelves ===
const fetchWorkBundle = async (
  workKey: string,
  enrichments: Partial<Book>,
  sources: Set<'google' | 'openlibrary' | 'wikipedia'>
): Promise<void> => {
  const base = `https://openlibrary.org/works/${workKey}`;
  const settled = await Promise.allSettled([
    fetchWithRetry(`${base}.json`).then(r => r.json()),
    fetchWithRetry(`${base}/editions.json?limit=20`).then(r => r.json()),
    fetchWithRetry(`${base}/ratings.json`).then(r => r.json()),
    fetchWithRetry(`${base}/bookshelves.json`).then(r => r.json()),
  ]);

  const [workRes, editionsRes, ratingsRes, shelvesRes] = settled;

  // Work document
  if (workRes.status === 'fulfilled' && workRes.value) {
    const work = workRes.value;
    sources.add('openlibrary');
    const desc = typeof work.description === 'string' ? work.description : work.description?.value;
    if (desc && (!enrichments.description || enrichments.description.length < desc.length)) {
      enrichments.description = desc;
    }
    if (work.subtitle && !enrichments.subtitle) enrichments.subtitle = work.subtitle;
    if (work.first_publish_date) enrichments.firstPublishDate = work.first_publish_date;
    if (work.subjects?.length && !enrichments.subjects?.length) {
      enrichments.subjects = work.subjects.slice(0, 16);
    }
    if (work.subject_places?.length && !enrichments.subjectPlaces?.length) {
      enrichments.subjectPlaces = work.subject_places.slice(0, 10);
    }
    if (work.subject_people?.length && !enrichments.subjectPeople?.length) {
      enrichments.subjectPeople = work.subject_people.slice(0, 10);
    }
    if (work.subject_times?.length && !enrichments.subjectTimes?.length) {
      enrichments.subjectTimes = work.subject_times.slice(0, 10);
    }
    if (work.dewey_decimal_class?.length) enrichments.deweyDecimal = work.dewey_decimal_class.slice(0, 4);
    if (work.lc_classifications?.length) enrichments.lcClassifications = work.lc_classifications.slice(0, 4);
    if (Array.isArray(work.excerpts) && work.excerpts.length) {
      enrichments.excerpts = work.excerpts
        .map((e: any) => ({
          text: typeof e.excerpt === 'string' ? e.excerpt : e.excerpt?.value,
          comment: e.comment,
          author: e.author?.key,
        }))
        .filter((e: any) => e.text)
        .slice(0, 4);
    }
    if (Array.isArray(work.links) && work.links.length) {
      enrichments.externalLinks = work.links
        .filter((l: any) => l?.url && l?.title)
        .slice(0, 8)
        .map((l: any) => ({ title: l.title, url: l.url }));
    }
    if (Array.isArray(work.covers) && work.covers.length) {
      enrichments.coverIds = work.covers.filter((c: any) => typeof c === 'number' && c > 0).slice(0, 6);
    }
    if (typeof work.latest_revision === 'number') enrichments.latestRevision = work.latest_revision;
    if (typeof work.revision === 'number') enrichments.revisionCount = work.revision;
  }

  // Editions list — first edition with rich physical metadata wins
  if (editionsRes.status === 'fulfilled' && editionsRes.value?.entries?.length) {
    const entries: any[] = editionsRes.value.entries;
    if (!enrichments.editionCount && typeof editionsRes.value.size === 'number') {
      enrichments.editionCount = editionsRes.value.size;
    }
    const pickFirst = (key: string) => entries.find(e => e?.[key])?.[key];
    const physicalFormat = pickFirst('physical_format');
    const physicalDimensions = pickFirst('physical_dimensions');
    const weight = pickFirst('weight');
    const pagination = pickFirst('pagination');
    const publishPlaces = pickFirst('publish_places');
    const byStatement = pickFirst('by_statement');
    const copyrightDate = pickFirst('copyright_date');
    const contributors = pickFirst('contributors');
    const toc = entries.find(e => Array.isArray(e?.table_of_contents) && e.table_of_contents.length)?.table_of_contents;

    if (physicalFormat) enrichments.physicalFormat = physicalFormat;
    if (physicalDimensions) enrichments.physicalDimensions = physicalDimensions;
    if (weight) enrichments.weight = weight;
    if (pagination) enrichments.pagination = pagination;
    if (Array.isArray(publishPlaces)) enrichments.publishPlaces = publishPlaces.slice(0, 6);
    if (byStatement) enrichments.byStatement = byStatement;
    if (copyrightDate) enrichments.copyrightDate = copyrightDate;
    if (Array.isArray(contributors)) {
      enrichments.contributors = contributors
        .filter((c: any) => c?.name)
        .slice(0, 8)
        .map((c: any) => ({ name: c.name, role: c.role }));
    }
    if (Array.isArray(toc)) {
      enrichments.tableOfContents = toc
        .filter((t: any) => t?.title || t?.label)
        .slice(0, 40)
        .map((t: any) => ({
          title: typeof t.title === 'string' ? t.title : t.title?.value || t.label,
          label: t.label,
          level: typeof t.level === 'number' ? t.level : undefined,
          pagenum: t.pagenum,
        }));
    }
  }

  // Ratings histogram
  if (ratingsRes.status === 'fulfilled' && ratingsRes.value?.counts) {
    const c = ratingsRes.value.counts;
    enrichments.ratingsHistogram = {
      1: c['1'] || 0,
      2: c['2'] || 0,
      3: c['3'] || 0,
      4: c['4'] || 0,
      5: c['5'] || 0,
    };
    if (!enrichments.averageRating && typeof ratingsRes.value.summary?.average === 'number') {
      enrichments.averageRating = Math.round(ratingsRes.value.summary.average * 10) / 10;
    }
    if (!enrichments.ratingsCount && typeof ratingsRes.value.summary?.count === 'number') {
      enrichments.ratingsCount = ratingsRes.value.summary.count;
    }
  }

  // Reading log stats
  if (shelvesRes.status === 'fulfilled' && shelvesRes.value?.counts) {
    const c = shelvesRes.value.counts;
    enrichments.readerStats = {
      wantToRead: c.want_to_read || 0,
      currentlyReading: c.currently_reading || 0,
      alreadyRead: c.already_read || 0,
    };
  }
};

// === Fetch book by ISBN (for barcode scanning / direct lookup) ===
export const fetchBookByISBN = async (isbn: string): Promise<Book | null> => {
  const results = await Promise.allSettled([
    fetchWithRetry(`${OPEN_LIBRARY_SEARCH_URL}?isbn=${isbn}&limit=1&fields=key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count,ratings_average,isbn,subtitle,edition_count,has_fulltext`),
    fetchWithRetry(`${GOOGLE_BOOKS_API_URL}?q=isbn:${isbn}&maxResults=1`),
  ]);

  const [olResult, gbResult] = results;
  let book: Book | null = null;

  if (gbResult.status === 'fulfilled' && gbResult.value.ok) {
    const data = await gbResult.value.json();
    if (data.items?.[0]) {
      book = transformGoogleBookToBook(data.items[0]);
    }
  }

  if (olResult.status === 'fulfilled' && olResult.value.ok) {
    const data = await olResult.value.json();
    if (data.docs?.[0]) {
      const olBook = transformOpenLibraryBook(data.docs[0]);
      if (book) {
        book = {
          ...book,
          description: book.description || olBook.description,
          imageLinks: book.imageLinks || olBook.imageLinks,
          subjects: olBook.subjects?.length ? olBook.subjects : book.subjects,
          subjectPlaces: olBook.subjectPlaces || book.subjectPlaces,
          subjectPeople: olBook.subjectPeople || book.subjectPeople,
          editionCount: olBook.editionCount || book.editionCount,
          freeReading: olBook.freeReading || book.freeReading,
          firstSentence: olBook.firstSentence || book.firstSentence,
        };
      } else {
        book = olBook;
      }
    }
  }

  // If both failed, propagate the error
  if (!book && olResult.status === 'rejected' && gbResult.status === 'rejected') {
    throw gbResult.reason || olResult.reason;
  }

  return book;
};

export interface SearchFilters {
  sortBy?: 'relevance' | 'newest' | 'rating' | 'popularity';
  category?: 'all' | 'fiction' | 'non-fiction' | 'science' | 'history' | 'biography' | 'technology' | 'self-help' | 'mystery' | 'romance' | 'fantasy';
  yearRange?: { min?: number; max?: number };
  minRating?: number;
  language?: string;
  hasCovers?: boolean;
  ebookOnly?: boolean;
  freeOnly?: boolean;
}

export const searchBooks = async (query: string, maxResults: number = 40, filters?: SearchFilters): Promise<Book[]> => {
  try {
    const searchQuery = query.trim();
    if (!searchQuery) return [];
    
    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    // Check cache first
    const cacheKey = getCacheKey(searchQuery, filters);
    const cached = getCached(searchCache, cacheKey, CACHE_TTL);
    if (cached) return cached.slice(0, maxResults);

    let olQuery = searchQuery;
    let gbQuery = searchQuery;
    
    if (filters?.category && filters.category !== 'all') {
      const subjectMap: Record<string, string> = {
        'fiction': 'fiction', 'non-fiction': 'nonfiction', 'science': 'science',
        'history': 'history', 'biography': 'biography', 'technology': 'technology computers',
        'self-help': 'self-help', 'mystery': 'mystery thriller', 'romance': 'romance',
        'fantasy': 'fantasy',
      };
      const subject = subjectMap[filters.category] || filters.category;
      olQuery = `${searchQuery} subject:${subject}`;
      gbQuery = `${searchQuery}+subject:${subject}`;
    }

    // Fire both APIs in parallel with graceful degradation
    const [openLibResults, googleResults] = await Promise.allSettled([
      searchOpenLibrary(olQuery, Math.min(maxResults * 2, 100)),
      searchGoogleBooks(gbQuery, 40),
    ]);

    const olBooks = openLibResults.status === 'fulfilled' ? openLibResults.value : [];
    const gbBooks = googleResults.status === 'fulfilled' ? googleResults.value : [];

    // Merge with Google first for richer metadata
    const all = [...gbBooks, ...olBooks];

    // Deduplicate by normalized title+author, merging enhanced fields
    const seen = new Map<string, Book>();
    for (const book of all) {
      const key = `${book.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(book.authors[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const existing = seen.get(key);
      if (existing) {
        seen.set(key, {
          ...existing,
          description: (existing.description?.length || 0) > (book.description?.length || 0) ? existing.description : book.description,
          imageLinks: existing.imageLinks || book.imageLinks,
          averageRating: existing.averageRating || book.averageRating,
          ratingsCount: Math.max(existing.ratingsCount || 0, book.ratingsCount || 0) || undefined,
          pageCount: existing.pageCount || book.pageCount,
          isEbook: existing.isEbook || book.isEbook,
          hasEpub: existing.hasEpub || book.hasEpub,
          hasPdf: existing.hasPdf || book.hasPdf,
          listPrice: existing.listPrice || book.listPrice,
          retailPrice: existing.retailPrice || book.retailPrice,
          saleability: existing.saleability || book.saleability,
          textSnippet: existing.textSnippet || book.textSnippet,
          firstSentence: existing.firstSentence || book.firstSentence,
          maturityRating: existing.maturityRating || book.maturityRating,
          editionCount: existing.editionCount || book.editionCount,
          seriesName: existing.seriesName || book.seriesName,
          seriesPosition: existing.seriesPosition || book.seriesPosition,
          subjects: (existing.subjects?.length || 0) > (book.subjects?.length || 0) ? existing.subjects : book.subjects,
          subjectPlaces: existing.subjectPlaces || book.subjectPlaces,
          subjectPeople: existing.subjectPeople || book.subjectPeople,
          freeReading: existing.freeReading || book.freeReading,
          readingDifficulty: existing.readingDifficulty || book.readingDifficulty,
          isbn10: existing.isbn10 || book.isbn10,
          isbn13: existing.isbn13 || book.isbn13,
          publisher: existing.publisher || book.publisher,
          publishedDate: existing.publishedDate || book.publishedDate,
          categories: (existing.categories?.length || 0) > (book.categories?.length || 0) ? existing.categories : book.categories,
        });
      } else {
        seen.set(key, book);
      }
    }

    let filtered = Array.from(seen.values());

    // Apply filters
    if (filters?.yearRange?.min || filters?.yearRange?.max) {
      filtered = filtered.filter(book => {
        if (!book.publishedDate) return false;
        const year = parseInt(book.publishedDate);
        if (isNaN(year)) return false;
        if (filters.yearRange?.min && year < filters.yearRange.min) return false;
        if (filters.yearRange?.max && year > filters.yearRange.max) return false;
        return true;
      });
    }

    if (filters?.minRating) {
      filtered = filtered.filter(book => (book.averageRating || 0) >= filters.minRating!);
    }

    if (filters?.language && filters.language !== 'all') {
      filtered = filtered.filter(book => book.language === filters.language);
    }

    if (filters?.hasCovers) {
      filtered = filtered.filter(book => book.imageLinks?.thumbnail);
    }

    if (filters?.ebookOnly) {
      filtered = filtered.filter(book => book.isEbook || book.hasEpub || book.hasPdf);
    }

    if (filters?.freeOnly) {
      filtered = filtered.filter(book => book.freeReading || book.saleability === 'FREE');
    }

    // Sort
    const sortBy = filters?.sortBy || 'relevance';
    if (sortBy === 'relevance') {
      filtered.sort((a, b) => computeRelevanceScore(b, queryTerms) - computeRelevanceScore(a, queryTerms));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => (parseInt(b.publishedDate || '0') || 0) - (parseInt(a.publishedDate || '0') || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'popularity') {
      filtered.sort((a, b) => (b.ratingsCount || 0) - (a.ratingsCount || 0));
    }

    const result = filtered.slice(0, maxResults).map(normalizeBook);
    
    // Cache the results
    setCache(searchCache, cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

// === Trending / Popular books with category support ===
export const searchPopularBooks = async (category?: string, maxResults: number = 20): Promise<Book[]> => {
  const query = category ? `subject:${category}` : 'fiction bestseller popular';
  return searchBooks(query, maxResults);
};

// === Fetch trending books by curated queries ===
export const fetchTrendingBooks = async (limit = 12): Promise<Book[]> => {
  const trendingQueries = [
    'bestseller 2025 fiction',
    'most popular books 2025',
    'award winning novels',
  ];
  const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
  return searchBooks(randomQuery, limit, { hasCovers: true, sortBy: 'popularity' });
};

// === Find similar books to a given book ===
export const findSimilarBooks = async (book: Book, limit = 8): Promise<Book[]> => {
  const queries: string[] = [];
  
  // Build intelligent queries from book metadata
  if (book.categories?.length) {
    queries.push(`subject:${book.categories[0]}`);
  }
  if (book.seriesName) {
    queries.push(book.seriesName);
  }
  if (book.authors?.[0] && book.authors[0] !== 'Unknown Author') {
    queries.push(`inauthor:${book.authors[0]}`);
  }
  if (book.subjects?.length) {
    queries.push(book.subjects.slice(0, 2).join(' '));
  }

  if (queries.length === 0) {
    // Fallback: use title keywords
    const titleWords = book.title.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    queries.push(titleWords.join(' '));
  }

  // Run first 2 queries in parallel
  const results = await Promise.allSettled(
    queries.slice(0, 2).map(q => searchBooks(q, limit))
  );

  const allBooks: Book[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allBooks.push(...r.value);
  }

  // Dedupe and remove the original book
  const seen = new Set<string>();
  seen.add(book.id);
  return allBooks.filter(b => {
    if (seen.has(b.id)) return false;
    const key = b.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(b.id);
    seen.add(key);
    return true;
  }).slice(0, limit);
};

// === Clear search cache ===
export const clearSearchCache = () => {
  searchCache.clear();
  enrichmentCache.clear();
};

const generatePurchaseLinks = (title: string, author?: string) => {
  const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
  return {
    googlePlay: `https://play.google.com/store/search?q=${searchQuery}&c=books`,
    amazon: `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`,
    barnes: `https://www.barnesandnoble.com/s/${searchQuery}`,
  };
};
