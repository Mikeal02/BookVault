import { useState, useMemo } from 'react';
import { 
  GitCompareArrows, X, BookOpen, Star, Clock, Calendar, 
  Tag, TrendingUp, ChevronDown, ArrowRight, Scale
} from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BookComparisonProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

export const BookComparison = ({ books, onBookSelect }: BookComparisonProps) => {
  const [bookA, setBookA] = useState<Book | null>(null);
  const [bookB, setBookB] = useState<Book | null>(null);
  const [selectingFor, setSelectingFor] = useState<'a' | 'b' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.authors?.some(a => a.toLowerCase().includes(q))
    );
  }, [books, searchQuery]);

  const comparison = useMemo(() => {
    if (!bookA || !bookB) return null;

    const metrics = [
      {
        label: 'Page Count',
        icon: BookOpen,
        valueA: bookA.pageCount || 0,
        valueB: bookB.pageCount || 0,
        format: (v: number) => `${v} pages`,
        higher: 'neutral' as const,
      },
      {
        label: 'Your Rating',
        icon: Star,
        valueA: bookA.personalRating || 0,
        valueB: bookB.personalRating || 0,
        format: (v: number) => v > 0 ? `${v}/5 ⭐` : 'Not rated',
        higher: 'better' as const,
      },
      {
        label: 'Community Rating',
        icon: TrendingUp,
        valueA: bookA.averageRating || 0,
        valueB: bookB.averageRating || 0,
        format: (v: number) => v > 0 ? `${v.toFixed(1)}/5` : 'N/A',
        higher: 'better' as const,
      },
      {
        label: 'Reading Time',
        icon: Clock,
        valueA: bookA.timeSpentReading || 0,
        valueB: bookB.timeSpentReading || 0,
        format: (v: number) => v > 0 ? `${Math.floor(v / 60)}h ${v % 60}m` : 'Not tracked',
        higher: 'neutral' as const,
      },
      {
        label: 'Progress',
        icon: TrendingUp,
        valueA: bookA.readingProgress || 0,
        valueB: bookB.readingProgress || 0,
        format: (v: number) => `${Math.round(v)}%`,
        higher: 'better' as const,
      },
    ];

    return metrics;
  }, [bookA, bookB]);

  const BookSlot = ({ book, side, onSelect }: { book: Book | null; side: 'a' | 'b'; onSelect: () => void }) => (
    <div 
      onClick={onSelect}
      className={`glass-card rounded-2xl p-6 cursor-pointer transition-all hover-lift ${
        selectingFor === side ? 'ring-2 ring-primary shadow-lg' : ''
      } ${!book ? 'border-2 border-dashed border-border' : ''}`}
    >
      {book ? (
        <div className="text-center">
          <img
            src={book.imageLinks?.thumbnail || '/placeholder.svg'}
            alt={book.title}
            className="w-24 h-36 object-cover rounded-xl mx-auto shadow-lg mb-4"
          />
          <h4 className="font-semibold text-foreground line-clamp-2 text-sm">{book.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{book.authors?.join(', ')}</p>
          {book.readingStatus && (
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
              book.readingStatus === 'finished' ? 'bg-success/20 text-success' :
              book.readingStatus === 'reading' ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {book.readingStatus === 'not-read' ? 'To Read' : book.readingStatus === 'reading' ? 'Reading' : 'Finished'}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); side === 'a' ? setBookA(null) : setBookB(null); }}
            className="mt-3 text-xs text-muted-foreground"
          >
            <X className="w-3 h-3 mr-1" /> Change
          </Button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Select a book</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Click to choose</p>
        </div>
      )}
    </div>
  );

  if (books.length < 2) {
    return (
      <div className="text-center py-16 glass-card rounded-2xl">
        <Scale className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">Need More Books</h3>
        <p className="text-muted-foreground text-sm">Add at least 2 books to your library to compare them</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text-mixed mb-2">Book Comparison</h2>
        <p className="text-muted-foreground">Compare two books side by side</p>
      </div>

      {/* Book Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <BookSlot book={bookA} side="a" onSelect={() => setSelectingFor('a')} />
        <div className="hidden sm:flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-lg">
            <GitCompareArrows className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <BookSlot book={bookB} side="b" onSelect={() => setSelectingFor('b')} />
      </div>

      {/* Book Selection Dropdown */}
      <AnimatePresence>
        {selectingFor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Select Book {selectingFor === 'a' ? 'A' : 'B'}</h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectingFor(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library..."
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm mb-3 text-foreground placeholder:text-muted-foreground"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {filteredBooks.map(book => (
                <button
                  key={book.id}
                  onClick={() => {
                    if (selectingFor === 'a') setBookA(book);
                    else setBookB(book);
                    setSelectingFor(null);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <img
                    src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                    alt={book.title}
                    className="w-8 h-12 object-cover rounded flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{book.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{book.authors?.[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Results */}
      {comparison && bookA && bookB && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Comparison Results
          </h3>

          <div className="space-y-3">
            {comparison.map((metric, i) => {
              const Icon = metric.icon;
              const aWins = metric.higher === 'better' && metric.valueA > metric.valueB;
              const bWins = metric.higher === 'better' && metric.valueB > metric.valueA;
              const tie = metric.valueA === metric.valueB;

              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {metric.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className={`text-right font-semibold text-sm ${aWins ? 'text-success' : ''}`}>
                      {metric.format(metric.valueA)}
                      {aWins && <span className="ml-1">✓</span>}
                    </div>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <div className={`text-left font-semibold text-sm ${bWins ? 'text-success' : ''}`}>
                      {bWins && <span className="mr-1">✓</span>}
                      {metric.format(metric.valueB)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Categories Comparison */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Genre Overlap
            </h4>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
              <div className="space-y-1">
                {bookA.categories?.map(c => (
                  <span key={c} className={`block text-xs px-2 py-1 rounded ${
                    bookB.categories?.includes(c) ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {c}
                  </span>
                )) || <span className="text-xs text-muted-foreground">No categories</span>}
              </div>
              <div className="flex items-center">
                <div className="w-px h-full bg-border" />
              </div>
              <div className="space-y-1">
                {bookB.categories?.map(c => (
                  <span key={c} className={`block text-xs px-2 py-1 rounded ${
                    bookA.categories?.includes(c) ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {c}
                  </span>
                )) || <span className="text-xs text-muted-foreground">No categories</span>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
