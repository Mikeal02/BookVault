
import { useState, useEffect, useMemo } from 'react';
import { Search, Clock, TrendingUp, X, Filter, SortAsc, Sparkles, BookOpen, Star, Sliders } from 'lucide-react';
import { searchBooks, SearchFilters } from '@/services/googleBooks';
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

const categories = [
  { value: 'all', label: 'All' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'biography', label: 'Biography' },
  { value: 'technology', label: 'Technology' },
] as const;

export const EnhancedBookSearch = ({ onBookSelect, onAddToBookshelf, isInBookshelf }: EnhancedBookSearchProps) => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(12);
  const [displayedPopularSearches, setDisplayedPopularSearches] = useState<string[]>([]);

  // Filters
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('relevance');
  const [category, setCategory] = useState<SearchFilters['category']>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [hasCovers, setHasCovers] = useState(false);
  const [ebookOnly, setEbookOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bookapp_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
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
      const filters: SearchFilters = {
        sortBy,
        category,
        minRating: minRating > 0 ? minRating : undefined,
        hasCovers,
        ebookOnly,
        freeOnly,
      };

      const results = await searchBooks(searchQuery, 40, filters);
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

  const paginatedBooks = useMemo(() => {
    return books.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);
  }, [books, currentPage, booksPerPage]);

  const totalPages = Math.ceil(books.length / booksPerPage);

  const activeFilterCount = [
    category !== 'all',
    minRating > 0,
    hasCovers,
    sortBy !== 'relevance',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-card rounded-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-2">
            Discover Your Next Read
          </h2>
          <p className="text-muted-foreground text-sm">
            Search across millions of books from multiple sources
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4.5 h-4.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-11 pr-10 py-3.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-foreground placeholder-muted-foreground text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3.5 gradient-primary text-primary-foreground hover:opacity-90 rounded-lg shadow-sm font-medium h-auto"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="hidden sm:inline">Searching</span>
                </div>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto border border-border">
              {recentSearches.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
                  </div>
                  <div className="space-y-0.5">
                    {recentSearches.map((search, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <button
                          onClick={() => { setQuery(search); handleSearch(search); }}
                          className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-muted/50"
                        >
                          {search}
                        </button>
                        <button
                          onClick={() => clearRecentSearch(search)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trending</span>
                  </div>
                  <button
                    onClick={refreshPopularSearches}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {displayedPopularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => { setQuery(search); handleSearch(search); }}
                      className="text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-muted/50 truncate"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      {books.length > 0 && (
        <div className="glass-card rounded-xl p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-1.5 text-xs ${activeFilterCount > 0 ? 'border-primary text-primary' : ''}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Category pills */}
              <div className="flex gap-1 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => { setCategory(cat.value); if (query) handleSearch(); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      category === cat.value
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {books.length} results
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); if (query) handleSearch(); }}
                  className="px-2.5 py-1.5 bg-muted/40 border border-border rounded-md text-xs focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={minRating}
                  onChange={(e) => { setMinRating(Number(e.target.value)); if (query) handleSearch(); }}
                  className="px-2.5 py-1.5 bg-muted/40 border border-border rounded-md text-xs focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={3.5}>3.5+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCovers}
                  onChange={(e) => { setHasCovers(e.target.checked); if (query) handleSearch(); }}
                  className="rounded border-border"
                />
                With covers only
              </label>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-destructive bg-destructive/5 p-6 rounded-xl border border-destructive/10">
          <p className="text-sm mb-3">{error}</p>
          <Button onClick={() => handleSearch()} variant="outline" size="sm" className="border-destructive/20 text-destructive">
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {books.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedBooks.map((book, index) => (
              <div key={book.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8">
              <div className="flex items-center gap-1 glass-card rounded-lg p-1.5">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Previous
                </Button>
                
                <div className="flex gap-0.5">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages || pageNum < 1) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground'
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
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {query && !loading && books.length === 0 && !error && (
        <div className="text-center py-16 glass-card rounded-xl">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-display font-semibold text-muted-foreground mb-2">No books found</h3>
          <p className="text-sm text-muted-foreground mb-6">Try different keywords or browse trending searches</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {displayedPopularSearches.slice(0, 4).map((search, index) => (
              <button
                key={index}
                onClick={() => { setQuery(search); handleSearch(search); }}
                className="px-3 py-1.5 bg-primary/5 text-primary rounded-md text-xs font-medium hover:bg-primary/10 transition-colors border border-primary/10"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
