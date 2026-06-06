
import { useState, useEffect, useMemo } from 'react';
import { Search, Clock, TrendingUp, X, SortAsc, Sparkles, Star, Sliders, BookOpen, ArrowRight,
  Tablet, BookMarked, Languages, Users, Calendar, Layers, Globe2, BarChart3, FileText, Gauge } from 'lucide-react';
import { searchBooks, SearchFilters } from '@/services/googleBooks';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
  { value: 'all', label: 'All', icon: '📚' },
  { value: 'fiction', label: 'Fiction', icon: '📖' },
  { value: 'non-fiction', label: 'Non-Fiction', icon: '📘' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'history', label: 'History', icon: '🏛️' },
  { value: 'biography', label: 'Biography', icon: '👤' },
  { value: 'technology', label: 'Technology', icon: '💻' },
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
        sortBy, category,
        minRating: minRating > 0 ? minRating : undefined,
        hasCovers, ebookOnly, freeOnly,
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

  const refreshPopularSearches = () => setDisplayedPopularSearches(getRotatedPopularSearches());

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginatedBooks = useMemo(() => {
    return books.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);
  }, [books, currentPage, booksPerPage]);

  const totalPages = Math.ceil(books.length / booksPerPage);

  const activeFilterCount = [
    category !== 'all', minRating > 0, hasCovers, sortBy !== 'relevance', ebookOnly, freeOnly,
  ].filter(Boolean).length;

  const resultStats = useMemo(() => {
    if (!books.length) return null;
    const withRating = books.filter(b => b.averageRating);
    const avgRating = withRating.length ? (withRating.reduce((a, b) => a + (b.averageRating || 0), 0) / withRating.length).toFixed(1) : null;
    const withEbook = books.filter(b => b.isEbook || b.hasEpub).length;
    const withFree = books.filter(b => b.freeReading || b.saleability === 'FREE').length;
    return { total: books.length, avgRating, withEbook, withFree };
  }, [books]);

  // ── Elite analytics over the search result set ──
  const resultInsights = useMemo(() => {
    if (!books.length) return null;

    const ratings = books.map(b => b.averageRating).filter((r): r is number => typeof r === 'number');
    const ratingsCount = books.reduce((acc, b) => acc + (b.ratingsCount || 0), 0);
    const avgRating = ratings.length ? ratings.reduce((a, n) => a + n, 0) / ratings.length : 0;
    const topRated = [...books].filter(b => b.averageRating).sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 3);

    const pageCounts = books.map(b => b.pageCount).filter((p): p is number => typeof p === 'number' && p > 0);
    const avgPages = pageCounts.length ? Math.round(pageCounts.reduce((a, n) => a + n, 0) / pageCounts.length) : 0;
    const totalPages = pageCounts.reduce((a, n) => a + n, 0);

    // Author leaderboard
    const authorMap = new Map<string, number>();
    books.forEach(b => b.authors?.forEach(a => authorMap.set(a, (authorMap.get(a) || 0) + 1)));
    const topAuthors = [...authorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Category leaderboard
    const catMap = new Map<string, number>();
    books.forEach(b => b.categories?.forEach(c => {
      const head = c.split('/')[0]?.trim();
      if (head) catMap.set(head, (catMap.get(head) || 0) + 1);
    }));
    const topCategories = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    // Languages
    const langMap = new Map<string, number>();
    books.forEach(b => { if (b.language) langMap.set(b.language, (langMap.get(b.language) || 0) + 1); });
    const languages = [...langMap.entries()].sort((a, b) => b[1] - a[1]);

    // Decade timeline
    const decadeMap = new Map<number, number>();
    books.forEach(b => {
      const y = b.publishedDate ? parseInt(b.publishedDate.slice(0, 4), 10) : NaN;
      if (!isNaN(y)) {
        const d = Math.floor(y / 10) * 10;
        decadeMap.set(d, (decadeMap.get(d) || 0) + 1);
      }
    });
    const decadeBuckets = [...decadeMap.entries()].sort((a, b) => a[0] - b[0]);
    const decadeMax = Math.max(1, ...decadeBuckets.map(([, n]) => n));

    // Formats / availability
    const ebookCount = books.filter(b => b.isEbook || b.hasEpub || b.hasPdf).length;
    const epubCount = books.filter(b => b.hasEpub).length;
    const pdfCount = books.filter(b => b.hasPdf).length;
    const freeCount = books.filter(b => b.freeReading || b.saleability === 'FREE').length;
    const previewCount = books.filter(b => b.viewability && b.viewability !== 'NO_PAGES').length;
    const publicDomainCount = books.filter(b => b.publicDomain).length;
    const matureCount = books.filter(b => b.maturityRating === 'MATURE').length;

    // Difficulty mix
    const easy = books.filter(b => b.readingDifficulty === 'easy').length;
    const moderate = books.filter(b => b.readingDifficulty === 'moderate').length;
    const advanced = books.filter(b => b.readingDifficulty === 'advanced').length;

    // Rating histogram (0–5)
    const histogram = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      const idx = Math.min(4, Math.max(0, Math.floor(r) - 1));
      histogram[idx]++;
    });
    const histMax = Math.max(1, ...histogram);

    // Series & publishers
    const seriesCount = books.filter(b => b.seriesName).length;
    const publisherMap = new Map<string, number>();
    books.forEach(b => { if (b.publisher) publisherMap.set(b.publisher, (publisherMap.get(b.publisher) || 0) + 1); });
    const topPublishers = [...publisherMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      total: books.length, ratingsCount, avgRating, topRated,
      avgPages, totalPages, pageSampleSize: pageCounts.length,
      topAuthors, topCategories, languages,
      decadeBuckets, decadeMax,
      ebookCount, epubCount, pdfCount, freeCount, previewCount, publicDomainCount, matureCount,
      easy, moderate, advanced,
      histogram, histMax,
      seriesCount, topPublishers,
      authorDiversity: authorMap.size,
      categoryDiversity: catMap.size,
    };
  }, [books]);

  return (
    <div className="space-y-6">
      {/* ─── Search Hero ─── */}
      <div className="glass-card rounded-2xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Multi-source search engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">
            Discover Your Next Read
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Search across millions of books from Open Library & Google Books with intelligent ranking
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by title, author, or ISBN..."
                className="w-full pl-11 pr-10 py-3.5 bg-muted/30 border border-border/80 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-foreground placeholder-muted-foreground text-sm shadow-sm focus:shadow-md"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3.5 gradient-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-sm font-semibold h-auto text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  <span className="hidden sm:inline">Searching</span>
                </div>
              ) : (
                <span className="flex items-center gap-1.5">Search <ArrowRight className="w-3.5 h-3.5" /></span>
              )}
            </Button>
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto border border-border"
              >
                {recentSearches.length > 0 && (
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center mb-2.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Recent</span>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((search, index) => (
                        <div key={index} className="flex items-center justify-between group">
                          <button
                            onClick={() => { setQuery(search); handleSearch(search); }}
                            className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
                          >
                            {search}
                          </button>
                          <button onClick={() => clearRecentSearch(search)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all">
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
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Trending</span>
                    </div>
                    <button onClick={refreshPopularSearches} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {displayedPopularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => { setQuery(search); handleSearch(search); }}
                        className="text-left text-sm text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50 truncate"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Elite Results Intelligence Panel ─── */}
      {resultInsights && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="glass-card rounded-2xl overflow-hidden border border-border/60"
        >
          {/* Header strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Result Intelligence</div>
                <div className="text-sm font-display font-semibold text-foreground">
                  {resultInsights.total} books · {resultInsights.authorDiversity} authors · {resultInsights.categoryDiversity} genres
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {resultInsights.ratingsCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {resultInsights.ratingsCount > 1000 ? `${(resultInsights.ratingsCount / 1000).toFixed(1)}k` : resultInsights.ratingsCount} reader votes
                </span>
              )}
              {resultInsights.totalPages > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {(resultInsights.totalPages / 1000).toFixed(0)}k total pages
                </span>
              )}
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/40">
            <div className="bg-card/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Star className="w-3 h-3" /> Avg Rating</div>
              <div className="text-xl font-display font-bold text-foreground mt-0.5">
                {resultInsights.avgRating ? resultInsights.avgRating.toFixed(2) : '—'}
                <span className="text-[10px] text-muted-foreground font-normal ml-1">/ 5</span>
              </div>
            </div>
            <div className="bg-card/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Avg Length</div>
              <div className="text-xl font-display font-bold text-foreground mt-0.5">
                {resultInsights.avgPages || '—'}
                <span className="text-[10px] text-muted-foreground font-normal ml-1">pp</span>
              </div>
            </div>
            <div className="bg-card/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Tablet className="w-3 h-3" /> Digital</div>
              <div className="text-xl font-display font-bold text-foreground mt-0.5">
                {Math.round((resultInsights.ebookCount / resultInsights.total) * 100)}%
                <span className="text-[10px] text-muted-foreground font-normal ml-1">eBook</span>
              </div>
            </div>
            <div className="bg-card/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><BookMarked className="w-3 h-3" /> Free / OA</div>
              <div className="text-xl font-display font-bold text-success mt-0.5">
                {resultInsights.freeCount + resultInsights.publicDomainCount}
                <span className="text-[10px] text-muted-foreground font-normal ml-1">titles</span>
              </div>
            </div>
          </div>

          {/* Visual breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40">
            {/* Rating histogram */}
            <div className="bg-card/60 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2.5 flex items-center gap-1.5">
                <Gauge className="w-3 h-3" /> Rating Distribution
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {resultInsights.histogram.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / resultInsights.histMax) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                      className="w-full bg-gradient-to-t from-primary/60 to-primary rounded-sm min-h-[2px]"
                      title={`${count} books rated ${i + 1}★`}
                    />
                    <span className="text-[9px] text-muted-foreground">{i + 1}★</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decade timeline */}
            <div className="bg-card/60 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Publication Era
              </div>
              {resultInsights.decadeBuckets.length > 0 ? (
                <div className="flex items-end gap-0.5 h-16">
                  {resultInsights.decadeBuckets.map(([decade, count], i) => (
                    <div key={decade} className="flex-1 flex flex-col items-center gap-1 group/bar">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(count / resultInsights.decadeMax) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className="w-full bg-gradient-to-t from-secondary/50 to-secondary rounded-sm min-h-[2px] group-hover/bar:from-primary group-hover/bar:to-primary transition-colors"
                        title={`${count} books from ${decade}s`}
                      />
                      {resultInsights.decadeBuckets.length <= 12 && (
                        <span className="text-[8px] text-muted-foreground rotate-0">{`'${String(decade).slice(2)}`}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic h-16 flex items-center">No date data</div>
              )}
            </div>

            {/* Difficulty / format mix */}
            <div className="bg-card/60 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Reading Mix
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Quick', val: resultInsights.easy, color: 'bg-success' },
                  { label: 'Standard', val: resultInsights.moderate, color: 'bg-primary' },
                  { label: 'Deep', val: resultInsights.advanced, color: 'bg-secondary' },
                ].map((row, i) => {
                  const pct = resultInsights.total ? (row.val / resultInsights.total) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="text-foreground font-semibold">{row.val}</span>
                      </div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                          className={`h-full ${row.color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Author + Genre leaderboards */}
          {(resultInsights.topAuthors.length > 0 || resultInsights.topCategories.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40">
              {resultInsights.topAuthors.length > 0 && (
                <div className="bg-card/60 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Featured Authors
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resultInsights.topAuthors.map(([name, count]) => (
                      <button
                        key={name}
                        onClick={() => { setQuery(name); handleSearch(name); }}
                        className="group/chip flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 hover:bg-primary/10 hover:text-primary text-xs text-foreground transition-colors border border-border/40"
                      >
                        <span className="truncate max-w-[140px]">{name}</span>
                        <span className="text-[10px] text-muted-foreground group-hover/chip:text-primary font-semibold">×{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {resultInsights.topCategories.length > 0 && (
                <div className="bg-card/60 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Top Genres
                  </div>
                  <div className="space-y-1.5">
                    {resultInsights.topCategories.map(([cat, count]) => {
                      const pct = (count / resultInsights.total) * 100;
                      return (
                        <div key={cat} className="group/cat">
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-foreground truncate">{cat}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                              className="h-full bg-gradient-to-r from-primary/60 to-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Facets footer */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-border/40 bg-muted/15 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {resultInsights.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3" />
                {resultInsights.languages.slice(0, 4).map(([l, n]) => `${l.toUpperCase()} ${n}`).join(' · ')}
              </span>
            )}
            {resultInsights.epubCount > 0 && <span>· {resultInsights.epubCount} ePub</span>}
            {resultInsights.pdfCount > 0 && <span>· {resultInsights.pdfCount} PDF</span>}
            {resultInsights.previewCount > 0 && <span>· {resultInsights.previewCount} previewable</span>}
            {resultInsights.publicDomainCount > 0 && <span className="text-success">· {resultInsights.publicDomainCount} public domain</span>}
            {resultInsights.seriesCount > 0 && <span>· {resultInsights.seriesCount} in series</span>}
            {resultInsights.matureCount > 0 && <span className="text-destructive/80">· {resultInsights.matureCount} mature</span>}
            {resultInsights.topPublishers.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                {resultInsights.topPublishers.map(([p, n]) => `${p} ${n}`).join(' · ')}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Filters Bar ─── */}
      {books.length > 0 && (
        <div className="glass-card rounded-xl p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-1.5 text-xs rounded-lg ${activeFilterCount > 0 ? 'border-primary text-primary' : ''}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      category === cat.value
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as any); if (query) handleSearch(); }}
                      className="px-2.5 py-1.5 bg-muted/40 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/30 text-foreground"
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
                      className="px-2.5 py-1.5 bg-muted/40 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/30 text-foreground"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={3}>3+ Stars</option>
                      <option value={3.5}>3.5+ Stars</option>
                      <option value={4}>4+ Stars</option>
                      <option value={4.5}>4.5+ Stars</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input type="checkbox" checked={hasCovers} onChange={(e) => { setHasCovers(e.target.checked); if (query) handleSearch(); }} className="rounded border-border accent-primary" />
                    With covers
                  </label>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input type="checkbox" checked={ebookOnly} onChange={(e) => { setEbookOnly(e.target.checked); if (query) handleSearch(); }} className="rounded border-border accent-primary" />
                    eBooks only
                  </label>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input type="checkbox" checked={freeOnly} onChange={(e) => { setFreeOnly(e.target.checked); if (query) handleSearch(); }} className="rounded border-border accent-primary" />
                    Free to read
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div className="text-center text-destructive bg-destructive/5 p-6 rounded-xl border border-destructive/10">
          <p className="text-sm mb-3">{error}</p>
          <Button onClick={() => handleSearch()} variant="outline" size="sm" className="border-destructive/20 text-destructive">Try Again</Button>
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && books.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <BookCardSkeleton count={10} />
        </div>
      )}

      {/* ─── Results Grid ─── */}
      {books.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <BookCard
                  book={book}
                  onSelect={() => onBookSelect(book)}
                  onAddToBookshelf={() => onAddToBookshelf(book)}
                  isInBookshelf={isInBookshelf(book.id)}
                  showAddButton={true}
                />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8">
              <div className="flex items-center gap-1 glass-card rounded-xl p-1.5">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="ghost" size="sm" className="text-xs rounded-lg">
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
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="ghost" size="sm" className="text-xs rounded-lg">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {query && !loading && books.length === 0 && !error && (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-display font-semibold text-foreground mb-1">No books found</p>
          <p className="text-sm text-muted-foreground">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
};
