
import { useState, useEffect, useMemo } from 'react';
import { Search, Clock, TrendingUp, X, Filter, SortAsc, Sparkles, BookOpen, Star } from 'lucide-react';
import { searchBooks } from '@/services/googleBooks';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { Button } from '@/components/ui/button';

interface EnhancedBookSearchProps {
  onBookSelect: (book: Book) => void;
  onAddToBookshelf: (book: Book) => void;
  isInBookshelf: (bookId: string) => boolean;
}

const popularSearches = [
  'Atomic Habits', 'The Seven Husbands of Evelyn Hugo', 'Project Hail Mary',
  'Dune', 'Where the Crawdads Sing', 'The Silent Patient', 'Educated',
  'Becoming', 'The Midnight Library', 'Circe', 'The Thursday Murder Club',
  'Klara and the Sun', 'The Invisible Life of Addie LaRue'
];

const getRotatedPopularSearches = () => {
  const shuffled = [...popularSearches].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8);
};

export const EnhancedBookSearch = ({ onBookSelect, onAddToBookshelf, isInBookshelf }: EnhancedBookSearchProps) => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'rating'>('relevance');
  const [filterBy, setFilterBy] = useState<'all' | 'fiction' | 'non-fiction'>('all');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(12);
  const [displayedPopularSearches, setDisplayedPopularSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('bookapp_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    setDisplayedPopularSearches(getRotatedPopularSearches());
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('bookapp_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    setError(null);
    saveRecentSearch(searchQuery.trim());

    try {
      // Build subject-qualified query for better filtering
      let queryStr = searchQuery;
      if (filterBy === 'fiction') queryStr = `${searchQuery} subject:fiction`;
      if (filterBy === 'non-fiction') queryStr = `${searchQuery} subject:nonfiction`;

      let results = await searchBooks(queryStr, 40);

      results = results.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return (parseInt(b.publishedDate || '0') || 0) - (parseInt(a.publishedDate || '0') || 0);
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            return 0;
        }
      });

      setBooks(results);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to search books. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('bookapp_recent_searches', JSON.stringify(updated));
  };

  const refreshPopularSearches = () => {
    setDisplayedPopularSearches(getRotatedPopularSearches());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredBooks = useMemo(() => {
    if (!query.trim()) return books;
    const q = query.toLowerCase();
    return books.filter(book => {
      const title = book.title.toLowerCase();
      const author = book.authors?.join(' ').toLowerCase() || '';
      return title.includes(q) || author.includes(q);
    });
  }, [books, query]);

  const paginatedBooks = useMemo(() => {
    return filteredBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);
  }, [filteredBooks, currentPage, booksPerPage]);

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  return (
    <div className="space-y-6">
      {/* Enhanced Search Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold gradient-text-mixed mb-2">
            Discover Amazing Books
          </h2>
          <p className="text-muted-foreground">
            Search through millions of books and find your next favorite read
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-lg text-foreground placeholder-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-8 py-4 gradient-primary text-white hover:opacity-90 rounded-xl shadow-lg text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Enhanced Search Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
              {recentSearches.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <button
                          onClick={() => {
                            setQuery(search);
                            handleSearch(search);
                          }}
                          className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded hover:bg-muted/50"
                        >
                          <BookOpen className="w-4 h-4 inline mr-2" />
                          {search}
                        </button>
                        <button
                          onClick={() => clearRecentSearch(search)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">Popular Searches</span>
                  </div>
                  <button
                    onClick={refreshPopularSearches}
                    className="text-xs text-primary hover:text-primary/80 flex items-center"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {displayedPopularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      className="text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded hover:bg-muted/50 flex items-center"
                    >
                      <Star className="w-3 h-3 mr-2 text-highlight" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters and Sorting */}
      {books.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="all">All Books</option>
                  <option value="fiction">Fiction</option>
                  <option value="non-fiction">Non-Fiction</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                {filteredBooks.length} results • Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-center text-destructive bg-destructive/10 p-6 rounded-xl border border-destructive/20">
          <div className="flex items-center justify-center mb-2">
            <X className="w-6 h-6 mr-2" />
            <span className="font-semibold">Search Error</span>
          </div>
          <p>{error}</p>
          <Button
            onClick={() => handleSearch()}
            className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Search Results */}
      {filteredBooks.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedBooks.map((book, index) => (
              <div key={book.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <BookCard
                  book={book}
                  onSelect={() => onBookSelect(book)}
                  onAddToBookshelf={() => onAddToBookshelf(book)}
                  isInBookshelf={isInBookshelf(book.id)}
                  showAddButton={true}
                />
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8">
              <div className="flex items-center space-x-2 glass-card rounded-xl p-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50 border-border"
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'gradient-primary text-white'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50 border-border"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Empty States */}
      {query && !loading && filteredBooks.length === 0 && !error ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <div className="max-w-md mx-auto">
            <Search className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-3">No books found</h3>
            <p className="text-muted-foreground mb-6">
              Try searching with different keywords or browse our popular searches
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {displayedPopularSearches.slice(0, 4).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
