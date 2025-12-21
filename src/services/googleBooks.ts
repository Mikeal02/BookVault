
import { Book, GoogleBookResponse, GoogleBookItem } from '@/types/book';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

export const searchBooks = async (query: string, maxResults: number = 40): Promise<Book[]> => {
  try {
    // Enhanced search with better parameters for finding popular books
    const searchQuery = query.trim();
    
    // Try multiple search strategies for better results
    const searchStrategies = [
      `intitle:${searchQuery}`, // Exact title match
      searchQuery, // General search
      `${searchQuery} bestseller`, // Include bestseller keyword
    ];
    
    let allResults: Book[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        const response = await fetch(
          `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(strategy)}&maxResults=${maxResults}&orderBy=relevance&printType=books&langRestrict=en`
        );

        if (response.ok) {
          const data: GoogleBookResponse = await response.json();
          if (data.items) {
            const books = data.items.map(transformGoogleBookToBook);
            allResults.push(...books);
          }
        }
      } catch (error) {
        console.error(`Search strategy ${strategy} failed:`, error);
      }
      
      // If we have enough results, stop searching
      if (allResults.length >= maxResults) break;
    }

    // Remove duplicates by book ID
    const uniqueBooks = allResults.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    );

    // Sort by rating and ratings count for better results
    const sortedBooks = uniqueBooks.sort((a, b) => {
      const scoreA = (a.averageRating || 0) * Math.log10((a.ratingsCount || 1) + 1);
      const scoreB = (b.averageRating || 0) * Math.log10((b.ratingsCount || 1) + 1);
      return scoreB - scoreA;
    });

    return sortedBooks.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

// Search for popular/trending books
export const searchPopularBooks = async (category?: string, maxResults: number = 20): Promise<Book[]> => {
  const popularQueries = [
    'bestseller 2024',
    'new york times bestseller',
    'most popular books',
    'award winning fiction',
    'book club favorites',
  ];
  
  const query = category 
    ? `${category} bestseller` 
    : popularQueries[Math.floor(Math.random() * popularQueries.length)];
    
  return searchBooks(query, maxResults);
};

const transformGoogleBookToBook = (item: GoogleBookItem): Book => {
  const { volumeInfo, saleInfo } = item;
  
  // Generate purchase links
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

const generatePurchaseLinks = (title: string, author?: string) => {
  const searchQuery = encodeURIComponent(`${title} ${author || ''}`.trim());
  
  return {
    googlePlay: `https://play.google.com/store/search?q=${searchQuery}&c=books`,
    amazon: `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`,
    barnes: `https://www.barnesandnoble.com/s/${searchQuery}?Ntk=P_key_Contributor_List&Ns=P_Sales_Rank&Ntx=mode+matchall`,
  };
};
