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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (query: string, filters?: SearchFilters): string => {
  return `${query.toLowerCase().trim()}|${JSON.stringify(filters || {})}`;
};

const getCached = (key: string): Book[] | null => {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key: string, data: Book[]) => {
  // Evict oldest entries if cache gets too large
  if (searchCache.size > 100) {
    const oldest = Array.from(searchCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 20; i++) searchCache.delete(oldest[i][0]);
  }
  searchCache.set(key, { data, timestamp: Date.now() });
};

// === Retry with exponential backoff ===
const fetchWithRetry = async (url: string, maxRetries = 2): Promise<Response> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) return response;
      // Don't retry 4xx client errors
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

// === Cover Image Resolution ===
const getOpenLibraryCover = (coverId?: number, isbn?: string, olid?: string): string | undefined => {
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  if (olid) return `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`;
  return undefined;
};

const getGoogleBooksCover = (isbn?: string): string | undefined => {
  if (!isbn) return undefined;
  return `https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&source=gbs_api&vid=ISBN${isbn}`;
};

const buildCoverUrls = (item: any): { thumbnail?: string; smallThumbnail?: string } => {
  const coverId = item.cover_i;
  const isbn13 = item.isbn?.[0];
  const isbn10 = item.isbn?.find((i: string) => i.length === 10);
  const bestIsbn = isbn13 || isbn10;
  const olid = item.edition_key?.[0];

  const primary = getOpenLibraryCover(coverId, bestIsbn, olid);
  const fallback = getGoogleBooksCover(bestIsbn);

  const thumbnail = primary || fallback;
  if (!thumbnail) return {};

  return {
    thumbnail,
    smallThumbnail: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : thumbnail,
  };
};

// === Reading difficulty estimation ===
const estimateReadingDifficulty = (pageCount?: number, subjects?: string[]): 'easy' | 'moderate' | 'advanced' | undefined => {
  if (!pageCount && !subjects?.length) return undefined;
  
  const hardSubjects = ['philosophy', 'mathematics', 'physics', 'quantum', 'advanced', 'academic', 'theoretical'];
  const easySubjects = ['children', 'juvenile', 'young adult', 'comics', 'graphic novel', 'picture book'];
  
  const subjectsLower = (subjects || []).map(s => s.toLowerCase());
  
  if (easySubjects.some(es => subjectsLower.some(s => s.includes(es)))) return 'easy';
  if (hardSubjects.some(hs => subjectsLower.some(s => s.includes(hs)))) return 'advanced';
  if (pageCount && pageCount > 600) return 'advanced';
  if (pageCount && pageCount < 200) return 'easy';
  return 'moderate';
};

// === Series detection from Open Library ===
const detectSeries = (item: any): { seriesName?: string; seriesPosition?: number } => {
  const subtitle = item.subtitle || '';
  const title = item.title || '';
  const combined = `${title} ${subtitle}`;
  
  const patterns = [
    /(?:book|vol(?:ume)?\.?|part|#)\s*(\d+)\s*(?:of|in|:)\s*(?:the\s+)?(.+?)(?:\s+series)?$/i,
    /\((.+?)(?:\s+series)?,?\s*#?(\d+)\)/i,
    /\((.+?)\s+book\s+(\d+)\)/i,
    /:\s*(.+?)\s+(?:book|vol)\s+(\d+)/i,
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

// === Relevance Scoring (enhanced) ===
const computeRelevanceScore = (book: Book, queryTerms: string[]): number => {
  let score = 0;
  
  // Cover & metadata completeness
  if (book.imageLinks?.thumbnail) score += 30;
  if (book.averageRating) score += book.averageRating * 5;
  if (book.ratingsCount) score += Math.min(25, Math.log10(book.ratingsCount + 1) * 6);
  if (book.description && book.description.length > 100) score += 8;
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

  // Title/author match quality
  const titleLower = book.title.toLowerCase();
  const authorLower = (book.authors?.[0] || '').toLowerCase();
  const fullQuery = queryTerms.join(' ');
  
  // Exact title match gets massive boost
  if (titleLower === fullQuery) score += 50;
  else if (titleLower.startsWith(fullQuery)) score += 30;
  
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 15;
    if (titleLower.startsWith(term)) score += 10;
    if (authorLower.includes(term)) score += 12;
  }

  // Recency bonus
  if (book.publishedDate) {
    const year = parseInt(book.publishedDate);
    if (year >= 2024) score += 8;
    else if (year >= 2020) score += 5;
    else if (year >= 2010) score += 3;
    else if (year >= 2000) score += 1;
  }

  // Penalize books without covers
  if (!book.imageLinks?.thumbnail) score -= 15;

  return score;
};

// === Transformers ===
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

  return {
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
    freeReading: item.has_fulltext || false,
    readingDifficulty: estimateReadingDifficulty(item.number_of_pages_median, subjects),
    ...series,
  };
};

const transformGoogleBookToBook = (item: any): Book => {
  const { volumeInfo, saleInfo, searchInfo } = item;
  const buyLinks = generatePurchaseLinks(volumeInfo.title, volumeInfo.authors?.[0]);

  let thumbnail = volumeInfo.imageLinks?.thumbnail;
  let smallThumbnail = volumeInfo.imageLinks?.smallThumbnail;

  if (thumbnail) {
    thumbnail = thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=3');
  }
  if (smallThumbnail) {
    smallThumbnail = smallThumbnail.replace('http://', 'https://');
  }

  const identifiers = volumeInfo.industryIdentifiers || [];
  const isbn13 = identifiers.find((id: any) => id.type === 'ISBN_13')?.identifier;
  const isbn10 = identifiers.find((id: any) => id.type === 'ISBN_10')?.identifier;

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

  return {
    id: item.id,
    title: volumeInfo.title || 'Unknown Title',
    authors: volumeInfo.authors || ['Unknown Author'],
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    publisher: volumeInfo.publisher,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    imageLinks: thumbnail ? { thumbnail, smallThumbnail } : undefined,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    language: volumeInfo.language,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
    buyLinks,
    isEbook: saleInfo?.isEbook || false,
    hasEpub: saleInfo?.epub?.isAvailable || false,
    hasPdf: saleInfo?.pdf?.isAvailable || false,
    listPrice: saleInfo?.listPrice || undefined,
    retailPrice: saleInfo?.retailPrice || undefined,
    saleability: saleInfo?.saleability as Book['saleability'] || undefined,
    textSnippet,
    maturityRating: volumeInfo.maturityRating as Book['maturityRating'] || undefined,
    isbn10,
    isbn13,
    seriesName,
    seriesPosition,
    readingDifficulty: estimateReadingDifficulty(volumeInfo.pageCount, volumeInfo.categories),
  };
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
      // Open Library work
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
      // Google Books
      const response = await fetchWithRetry(`${GOOGLE_BOOKS_API_URL}/${bookId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return transformGoogleBookToBook(data);
    }
  } catch {
    return null;
  }
};

// === Fetch book by ISBN (for barcode scanning / direct lookup) ===
export const fetchBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    const [olResponse, gbResponse] = await Promise.allSettled([
      fetchWithRetry(`${OPEN_LIBRARY_SEARCH_URL}?isbn=${isbn}&limit=1&fields=key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count,ratings_average,isbn,subtitle,edition_count,has_fulltext`),
      fetchWithRetry(`${GOOGLE_BOOKS_API_URL}?q=isbn:${isbn}&maxResults=1`),
    ]);

    let book: Book | null = null;

    if (gbResponse.status === 'fulfilled' && gbResponse.value.ok) {
      const data = await gbResponse.value.json();
      if (data.items?.[0]) {
        book = transformGoogleBookToBook(data.items[0]);
      }
    }

    if (olResponse.status === 'fulfilled' && olResponse.value.ok) {
      const data = await olResponse.value.json();
      if (data.docs?.[0]) {
        const olBook = transformOpenLibraryBook(data.docs[0]);
        if (book) {
          // Merge OL data into Google data
          book = {
            ...book,
            description: book.description || olBook.description,
            imageLinks: book.imageLinks || olBook.imageLinks,
            subjects: olBook.subjects?.length ? olBook.subjects : book.subjects,
            editionCount: olBook.editionCount || book.editionCount,
            freeReading: olBook.freeReading || book.freeReading,
          };
        } else {
          book = olBook;
        }
      }
    }

    return book;
  } catch {
    return null;
  }
};

export interface SearchFilters {
  sortBy?: 'relevance' | 'newest' | 'rating' | 'popularity';
  category?: 'all' | 'fiction' | 'non-fiction' | 'science' | 'history' | 'biography' | 'technology';
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
    const cached = getCached(cacheKey);
    if (cached) return cached.slice(0, maxResults);

    let olQuery = searchQuery;
    let gbQuery = searchQuery;
    
    if (filters?.category && filters.category !== 'all') {
      const subjectMap: Record<string, string> = {
        'fiction': 'fiction', 'non-fiction': 'nonfiction', 'science': 'science',
        'history': 'history', 'biography': 'biography', 'technology': 'technology computers',
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

    const result = filtered.slice(0, maxResults);
    
    // Cache the results
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

export const searchPopularBooks = async (category?: string, maxResults: number = 20): Promise<Book[]> => {
  const query = category ? `subject:${category}` : 'fiction bestseller popular';
  return searchBooks(query, maxResults);
};

// === Clear search cache ===
export const clearSearchCache = () => {
  searchCache.clear();
};

const generatePurchaseLinks = (title: string, author?: string) => {
  const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
  return {
    googlePlay: `https://play.google.com/store/search?q=${searchQuery}&c=books`,
    amazon: `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`,
    barnes: `https://www.barnesandnoble.com/s/${searchQuery}`,
  };
};
