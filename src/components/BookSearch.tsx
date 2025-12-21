
import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { searchBooks } from '@/services/googleBooks';

interface BookSearchProps {
  onBookSelect: (book: Book) => void;
  onAddToBookshelf: (book: Book) => void;
  isInBookshelf: (bookId: string) => boolean;
}

export const BookSearch = ({ onBookSelect, onAddToBookshelf, isInBookshelf }: BookSearchProps) => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setBooks([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const results = await searchBooks(searchQuery);
      setBooks(results);
    } catch (error) {
      setError('Failed to search books. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg shadow-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5 animate-spin" />
        )}
      </div>

      {error && (
        <div className="text-center text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </div>
      )}

      {books.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={() => onBookSelect(book)}
              onAddToBookshelf={() => onAddToBookshelf(book)}
              isInBookshelf={isInBookshelf(book.id)}
              showAddButton={true}
            />
          ))}
        </div>
      )}

      {query && !isLoading && books.length === 0 && !error && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No books found for "{query}"</p>
          <p className="text-sm mt-2">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  );
};
