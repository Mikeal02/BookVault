
import { Book } from '@/types/book';

// Open Library API - completely free, no API key needed, no rate limits
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS_URL = 'https://covers.openlibrary.org/b/olid';

// Also use Google Books as fallback when Open Library lacks data
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

const transformOpenLibraryBook = (item: any): Book => {
  const coverId = item.cover_i;
  const olid = item.edition_key?.[0]; // e.g. OL1234M
  
  const thumbnail = coverId 
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : olid
    ? `${OPEN_LIBRARY_COVERS_URL}/${olid}-M.jpg`
    : undefined;

  const authors = item.author_name || [];
  const title = item.title || 'Unknown Title';
  const buyLinks = generatePurchaseLinks(title, authors[0]);
  
  // Create a stable unique ID from Open Library key
  const id = item.key?.replace('/works/', 'ol_') || `ol_${Math.random().toString(36).slice(2)}`;

  return {
    id,
    title,
    authors,
    description: item.first_sentence?.value || item.description || undefined,
    publishedDate: item.first_publish_year?.toString(),
    publisher: item.publisher?.[0],
    pageCount: item.number_of_pages_median || undefined,
    categories: item.subject?.slice(0, 5) || [],
    imageLinks: thumbnail ? { thumbnail, smallThumbnail: thumbnail.replace('-M.jpg', '-S.jpg') } : undefined,
    averageRating: undefined, // Open Library doesn't have ratings
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

  return {
    id: item.id,
    title: volumeInfo.title || 'Unknown Title',
    authors: volumeInfo.authors || ['Unknown Author'],
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    publisher: volumeInfo.publisher,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    imageLinks: volumeInfo.imageLinks,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    language: volumeInfo.language,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
    buyLinks,
  };
};

export const searchBooks = async (query: string, maxResults: number = 40): Promise<Book[]> => {
  try {
    const searchQuery = query.trim();
    
    // PRIMARY: Use Open Library - unlimited, no API key, massive catalog
    const openLibResults = await searchOpenLibrary(searchQuery, maxResults);
    
    if (openLibResults.length >= 5) {
      return openLibResults;
    }
    
    // FALLBACK: Try Google Books if Open Library returns too few results
    const googleResults = await searchGoogleBooks(searchQuery, maxResults - openLibResults.length);
    
    // Merge and deduplicate by title+author
    const all = [...openLibResults, ...googleResults];
    const seen = new Set<string>();
    return all.filter(book => {
      const key = `${book.title.toLowerCase()}-${book.authors[0]?.toLowerCase() || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, maxResults);
    
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

const searchOpenLibrary = async (query: string, limit: number = 40): Promise<Book[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: Math.min(limit, 100).toString(),
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_key,publisher,number_of_pages_median,subject,language,first_sentence,ratings_count',
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

const searchGoogleBooks = async (query: string, limit: number = 20): Promise<Book[]> => {
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

export const searchPopularBooks = async (category?: string, maxResults: number = 20): Promise<Book[]> => {
  const query = category ? `subject:${category}` : 'fiction bestseller popular';
  return searchBooks(query, maxResults);
};

const generatePurchaseLinks = (title: string, author?: string) => {
  const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
  return {
    googlePlay: `https://play.google.com/store/search?q=${searchQuery}&c=books`,
    amazon: `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`,
    barnes: `https://www.barnesandnoble.com/s/${searchQuery}?Ntk=P_key_Contributor_List&Ns=P_Sales_Rank&Ntx=mode+matchall`,
  };
};
