
import { useState, useRef, useCallback } from 'react';
import { Share2, Download, BookOpen, Star, Calendar, Clock, TrendingUp, Trophy, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';

interface SocialSharingProps {
  books: Book[];
}

const CARD_THEMES = [
  { name: 'Midnight', bg: 'from-[hsl(220,30%,12%)] to-[hsl(250,25%,18%)]', accent: 'hsl(170,60%,50%)', text: 'white' },
  { name: 'Sunset', bg: 'from-[hsl(20,80%,50%)] to-[hsl(340,70%,45%)]', accent: 'hsl(45,100%,70%)', text: 'white' },
  { name: 'Forest', bg: 'from-[hsl(150,30%,15%)] to-[hsl(170,40%,20%)]', accent: 'hsl(80,70%,60%)', text: 'white' },
  { name: 'Ocean', bg: 'from-[hsl(210,50%,20%)] to-[hsl(230,60%,30%)]', accent: 'hsl(190,80%,60%)', text: 'white' },
];

const getReadingStats = (books: Book[]) => {
  const totalBooks = books.length;
  const finished = books.filter(b => b.readingStatus === 'finished').length;
  const reading = books.filter(b => b.readingStatus === 'reading').length;
  const totalPages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0);
  const totalMinutes = books.reduce((sum, b) => sum + (b.timeSpentReading || 0), 0);
  const avgRating = books.filter(b => b.personalRating).reduce((sum, b, _, arr) => sum + (b.personalRating || 0) / arr.length, 0);
  const topGenres = getTopGenres(books);
  const topAuthors = getTopAuthors(books);
  const currentYear = new Date().getFullYear();
  const booksThisYear = books.filter(b => {
    const added = b.dateAdded ? new Date(b.dateAdded).getFullYear() : 0;
    return added === currentYear;
  }).length;

  return { totalBooks, finished, reading, totalPages, totalMinutes, avgRating, topGenres, topAuthors, booksThisYear };
};

const getTopGenres = (books: Book[]): string[] => {
  const counts: Record<string, number> = {};
  books.forEach(b => b.categories?.forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
};

const getTopAuthors = (books: Book[]): string[] => {
  const counts: Record<string, number> = {};
  books.forEach(b => b.authors?.forEach(a => { counts[a] = (counts[a] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
};

// Book Card component for sharing a single book
const ShareableBookCard = ({ book, theme }: { book: Book; theme: typeof CARD_THEMES[0] }) => {
  return (
    <div className={`w-[400px] h-[520px] bg-gradient-to-br ${theme.bg} rounded-2xl p-6 flex flex-col relative overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: theme.accent }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5" style={{ background: theme.accent }} />

      {/* Book cover */}
      <div className="flex justify-center mb-4">
        {book.imageLinks?.thumbnail ? (
          <img src={book.imageLinks.thumbnail} alt={book.title} className="w-28 h-40 object-cover rounded-lg shadow-2xl" />
        ) : (
          <div className="w-28 h-40 rounded-lg shadow-2xl flex items-center justify-center" style={{ background: theme.accent + '33' }}>
            <BookOpen className="w-10 h-10" style={{ color: theme.accent }} />
          </div>
        )}
      </div>

      {/* Book info */}
      <h3 className="text-xl font-bold text-center mb-1 line-clamp-2" style={{ color: theme.text }}>{book.title}</h3>
      <p className="text-sm text-center opacity-70 mb-4" style={{ color: theme.text }}>
        by {book.authors?.join(', ') || 'Unknown'}
      </p>

      {/* Rating */}
      {book.personalRating && book.personalRating > 0 && (
        <div className="flex justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-5 h-5 ${i < book.personalRating! ? 'fill-current' : 'opacity-30'}`}
              style={{ color: theme.accent }} />
          ))}
        </div>
      )}

      {/* Thoughts */}
      {book.myThoughts && (
        <div className="flex-1 min-h-0">
          <p className="text-xs italic opacity-80 text-center line-clamp-4 px-2" style={{ color: theme.text }}>
            "{book.myThoughts}"
          </p>
        </div>
      )}

      {/* Status badge */}
      <div className="mt-auto flex justify-center">
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: theme.accent + '33', color: theme.accent }}>
          {book.readingStatus === 'finished' ? '✅ Finished' : book.readingStatus === 'reading' ? '📖 Reading' : '📚 To Read'}
        </span>
      </div>

      {/* Branding */}
      <div className="mt-3 text-center">
        <p className="text-[10px] opacity-40" style={{ color: theme.text }}>Shared from BookVault</p>
      </div>
    </div>
  );
};

// Year-in-Review card
const YearInReviewCard = ({ books, theme }: { books: Book[]; theme: typeof CARD_THEMES[0] }) => {
  const stats = getReadingStats(books);
  const year = new Date().getFullYear();

  return (
    <div className={`w-[400px] h-[560px] bg-gradient-to-br ${theme.bg} rounded-2xl p-6 flex flex-col relative overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute top-4 right-4 w-40 h-40 rounded-full opacity-5" style={{ background: theme.accent }} />
      <div className="absolute bottom-8 left-8 w-20 h-20 rounded-full opacity-5" style={{ background: theme.accent }} />

      {/* Header */}
      <div className="text-center mb-5">
        <p className="text-sm font-medium opacity-60 mb-1" style={{ color: theme.text }}>📚 My Reading Journey</p>
        <h2 className="text-3xl font-black" style={{ color: theme.accent }}>{year} in Books</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox icon={BookOpen} label="Books Read" value={stats.finished.toString()} accent={theme.accent} textColor={theme.text} />
        <StatBox icon={TrendingUp} label="Total Pages" value={stats.totalPages.toLocaleString()} accent={theme.accent} textColor={theme.text} />
        <StatBox icon={Clock} label="Hours Reading" value={Math.round(stats.totalMinutes / 60).toString()} accent={theme.accent} textColor={theme.text} />
        <StatBox icon={Star} label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} accent={theme.accent} textColor={theme.text} />
      </div>

      {/* Top genres */}
      {stats.topGenres.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold opacity-60 mb-2" style={{ color: theme.text }}>TOP GENRES</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topGenres.map((g, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: theme.accent + '22', color: theme.accent }}>
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top authors */}
      {stats.topAuthors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold opacity-60 mb-2" style={{ color: theme.text }}>FAVORITE AUTHORS</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topAuthors.map((a, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: theme.accent + '22', color: theme.accent }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Library size */}
      <div className="mt-auto text-center">
        <p className="text-sm opacity-60" style={{ color: theme.text }}>
          {stats.totalBooks} books in library • {stats.reading} currently reading
        </p>
      </div>

      {/* Branding */}
      <div className="mt-3 text-center">
        <p className="text-[10px] opacity-40" style={{ color: theme.text }}>Generated by BookVault</p>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, accent, textColor }: { icon: any; label: string; value: string; accent: string; textColor: string }) => (
  <div className="rounded-xl p-3 text-center" style={{ background: accent + '11' }}>
    <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" style={{ color: accent }} />
    <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
    <p className="text-[10px] opacity-60" style={{ color: textColor }}>{label}</p>
  </div>
);

export const SocialSharing = ({ books }: SocialSharingProps) => {
  const [cardType, setCardType] = useState<'book' | 'year'>('year');
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [themeIndex, setThemeIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedBook = books.find(b => b.id === selectedBookId) || books[0];
  const theme = CARD_THEMES[themeIndex];

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = cardType === 'year' ? `bookvault-${new Date().getFullYear()}-review.png` : `bookvault-${selectedBook?.title || 'book'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
  }, [cardType, selectedBook]);

  const shareCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'bookvault-share.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Reading Journey', text: 'Check out my reading stats from BookVault!' });
        } else {
          // Fallback: download
          const link = document.createElement('a');
          link.download = 'bookvault-share.png';
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text-mixed flex items-center gap-2">
              <Share2 className="w-6 h-6" />
              Share Your Reading
            </h2>
            <p className="text-muted-foreground mt-1">Create beautiful shareable cards of your books and reading journey</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Card type selector */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">CARD TYPE</h3>
            <div className="flex gap-2">
              <Button
                variant={cardType === 'year' ? 'default' : 'outline'}
                onClick={() => setCardType('year')}
                className="flex-1"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Year in Review
              </Button>
              <Button
                variant={cardType === 'book' ? 'default' : 'outline'}
                onClick={() => setCardType('book')}
                className="flex-1"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Book Card
              </Button>
            </div>
          </div>

          {/* Theme selector */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> THEME
            </h3>
            <div className="flex gap-2">
              {CARD_THEMES.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setThemeIndex(i)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    themeIndex === i ? 'ring-2 ring-primary shadow-md scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-full h-6 rounded bg-gradient-to-r ${t.bg} mb-1`} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Book selector (for book card type) */}
          {cardType === 'book' && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">SELECT BOOK</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {books.map(book => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                      selectedBookId === book.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    {book.imageLinks?.thumbnail ? (
                      <img src={book.imageLinks.thumbnail} alt="" className="w-8 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.authors?.[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={downloadCard} className="flex-1 gradient-primary text-white">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={shareCard} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Card preview */}
        <div className="flex items-start justify-center">
          <div ref={cardRef} className="shadow-2xl rounded-2xl">
            {cardType === 'book' && selectedBook ? (
              <ShareableBookCard book={selectedBook} theme={theme} />
            ) : (
              <YearInReviewCard books={books} theme={theme} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
