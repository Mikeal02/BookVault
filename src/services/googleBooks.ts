
import { Book } from '@/types/book';

// === API Endpoints ===
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

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

// === Relevance Scoring ===
// Weighted scoring: cover availability, ratings, metadata completeness
const computeRelevanceScore = (book: Book, queryTerms: string[]): number => {
  let score = 0;

  // Cover availability (high weight)
  if (book.imageLinks?.thumbnail) score += 30;

  // Ratings quality
  if (book.averageRating) {
    score += book.averageRating * 4; // up to 20
  }
  if (book.ratingsCount) {
    score += Math.min(20, Math.log10(book.ratingsCount + 1) * 5);
  }

  // Metadata completeness
  if (book.description) score += 5;
  if (book.pageCount) score += 3;
  if (book.categories?.length) score += 3;
  if (book.publishedDate) score += 2;
  if (book.publisher) score += 2;

  // Title/author match quality
  const titleLower = book.title.toLowerCase();
  const authorLower = (book.authors?.[0] || '').toLowerCase();
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 15;
    if (titleLower.startsWith(term)) score += 10;
    if (authorLower.includes(term)) score += 10;
  }

  // Recency bonus (slight preference for newer books)
  if (book.publishedDate) {
    const year = parseInt(book.publishedDate);
    if (year > 2020) score += 5;
    else if (year > 2010) score += 3;
    else if (year > 2000) score += 1;
  }

  return score;
};

// === Transformers ===
const transformOpenLibraryBook = (item: any): Book => {
  const covers = buildCoverUrls(item);
  const authors = item.author_name || [];
  const title = item.title || 'Unknown Title';
  const buyLinks = generatePurchaseLinks(title, authors[0]);
  const id = item.key?.replace('/works/', 'ol_') || `ol_${Math.random().toString(36).slice(2)}`;

  return {
    id,
    title,
    authors,
    description: item.first_sentence?.value || item.subtitle || undefined,
    publishedDate: item.first_publish_year?.toString(),
    publisher: item.publisher?.[0],
    pageCount: item.number_of_pages_median || undefined,
    categories: item.subject?.slice(0, 5) || [],
    imageLinks: covers.thumbnail ? covers : undefined,
    averageRating: item.ratings_average ? Math.round(item.ratings_average * 10) / 10 : undefined,
    ratingsCount: item.ratings_count || undefined,
    language: item.language?.[0] === 'eng' ? 'en' : item.language?.[0],
    previewLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    infoLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
    buyLinks,
  };
};

const transformGoogleBookToBook = (item: any): Book => {
  const { volumeInfo } = item;
  const buyLinks = generatePurchaseLinks(volumeInfo.title, volumeInfo.authors?.[0]);

  let thumbnail = volumeInfo.imageLinks?.thumbnail;
  let smallThumbnail = volumeInfo.imageLinks?.smallThumbnail;

  if (thumbnail) {
    thumbnail = thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=3');
  }
  if (smallThumbnail) {
    smallThumbnail = smallThumbnail.replace('http://', 'https://');
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
  };
};

// === Search Functions ===
const searchOpenLibrary = async (query: string, limit: number = 100): Promise<Book[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: Math.min(limit, 100).toString(),
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count,ratings_average,isbn,subtitle',
    });

    const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params}`);
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
    const response = await fetch(
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

export interface SearchFilters {
  sortBy?: 'relevance' | 'newest' | 'rating' | 'popularity';
  category?: 'all' | 'fiction' | 'non-fiction' | 'science' | 'history' | 'biography' | 'technology';
  yearRange?: { min?: number; max?: number };
  minRating?: number;
  language?: string;
  hasCovers?: boolean;
}

export const searchBooks = async (query: string, maxResults: number = 40, filters?: SearchFilters): Promise<Book[]> => {
  try {
    const searchQuery = query.trim();
    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    // Build category-qualified queries
    let olQuery = searchQuery;
    let gbQuery = searchQuery;
    
    if (filters?.category && filters.category !== 'all') {
      const subjectMap: Record<string, string> = {
        'fiction': 'fiction',
        'non-fiction': 'nonfiction',
        'science': 'science',
        'history': 'history',
        'biography': 'biography',
        'technology': 'technology computers',
      };
      const subject = subjectMap[filters.category] || filters.category;
      olQuery = `${searchQuery} subject:${subject}`;
      gbQuery = `${searchQuery}+subject:${subject}`;
    }

    // Search both APIs in parallel
    const [openLibResults, googleResults] = await Promise.all([
      searchOpenLibrary(olQuery, Math.min(maxResults * 2, 100)),
      searchGoogleBooks(gbQuery, 40),
    ]);

    // Merge: Google first for better covers, Open Library for breadth
    const all = [...googleResults, ...openLibResults];

    // Deduplicate by normalized title+author
    const seen = new Set<string>();
    const deduped = all.filter(book => {
      const key = `${book.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(book.authors[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Apply filters
    let filtered = deduped;

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

    // Sort by weighted relevance score
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

    return filtered.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

export const searchPopularBooks = async (category?: string, maxResults: number = 20): Promise<Book[]> => {
  const query = category ? `subject:${category}` : 'fiction bestseller popular';
  return searchBooks(query, maxResults);
};

const generatePurchaseLinks = (title: string, author?: string) => {
  const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
  return {
    googlePlay: `https://play.google.com/store/search?q=${searchQuery}&c=books`,
    amazon: `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`,
    barnes: `https://www.barnesandnoble.com/s/${searchQuery}`,
  };
};
