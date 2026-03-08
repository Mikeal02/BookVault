import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Star, Clock, TrendingUp, Trophy, Flame, ChevronRight,
  ChevronLeft, Download, Share2, Sparkles, BarChart3, Heart, Zap,
  Calendar, Award, Target
} from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface ReadingWrappedProps {
  books: Book[];
  currentUser: string;
}

// ── Slide data builder ──
const buildWrappedData = (books: Book[]) => {
  const year = new Date().getFullYear();
  const finished = books.filter(b => b.readingStatus === 'finished');
  const reading = books.filter(b => b.readingStatus === 'reading');
  const totalPages = books.reduce((s, b) => s + (b.pageCount || 0), 0);
  const totalMinutes = books.reduce((s, b) => s + (b.timeSpentReading || 0), 0);
  const avgRating = finished.length > 0
    ? finished.filter(b => b.personalRating).reduce((s, b) => s + (b.personalRating || 0), 0) / Math.max(1, finished.filter(b => b.personalRating).length)
    : 0;

  // Top genres
  const genreCounts: Record<string, number> = {};
  books.forEach(b => b.categories?.forEach(c => { genreCounts[c] = (genreCounts[c] || 0) + 1; }));
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top authors
  const authorCounts: Record<string, number> = {};
  books.forEach(b => b.authors?.forEach(a => { authorCounts[a] = (authorCounts[a] || 0) + 1; }));
  const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Reading by month
  const monthlyData: Record<string, number> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  months.forEach(m => { monthlyData[m] = 0; });
  finished.forEach(b => {
    const d = b.dateFinished ? new Date(b.dateFinished) : b.dateAdded ? new Date(b.dateAdded) : null;
    if (d && d.getFullYear() === year) {
      monthlyData[months[d.getMonth()]]++;
    }
  });

  // Best month
  const bestMonth = Object.entries(monthlyData).sort((a, b) => b[1] - a[1])[0];

  // Highest rated
  const topRated = [...finished].filter(b => b.personalRating).sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0)).slice(0, 3);

  // Longest book
  const longest = [...finished].sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];

  // Fastest read (most pages per time)
  const fastest = [...finished].filter(b => b.pageCount && b.timeSpentReading).sort((a, b) => {
    const rateA = (a.pageCount || 0) / (a.timeSpentReading || 1);
    const rateB = (b.pageCount || 0) / (b.timeSpentReading || 1);
    return rateB - rateA;
  })[0];

  return {
    year, finished: finished.length, reading: reading.length, totalBooks: books.length,
    totalPages, totalMinutes, avgRating, topGenres, topAuthors, monthlyData, months,
    bestMonth, topRated, longest, fastest,
  };
};

// ── Animated Counter for slides ──
const SlideCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const animated = useAnimatedCounter(value, 1500);
  return <span className="tabular-nums">{animated}{suffix}</span>;
};

// ── Individual Slides ──

const IntroSlide = ({ user, data }: { user: string; data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6 relative">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="w-24 h-24 rounded-3xl gradient-mixed flex items-center justify-center mb-6 shadow-2xl"
    >
      <BookOpen className="w-12 h-12 text-white" />
    </motion.div>
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="text-4xl font-display font-black mb-2"
    >
      <span className="gradient-text">{user}'s</span>
    </motion.h1>
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="text-5xl font-display font-black gradient-text-coral mb-4"
    >
      {data.year} Wrapped
    </motion.h2>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-muted-foreground text-lg"
    >
      Your year in reading, beautifully summarized
    </motion.p>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"
    >
      <span>Swipe to explore</span>
      <ChevronRight className="w-4 h-4 animate-bounce-gentle" />
    </motion.div>
  </div>
);

const BigNumberSlide = ({ data }: { data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6">
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
      <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
    </motion.div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-lg text-muted-foreground mb-2">This year you read</motion.p>
    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
      className="text-8xl font-display font-black gradient-text mb-2">
      <SlideCounter value={data.finished} />
    </motion.div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      className="text-2xl font-bold text-foreground mb-6">books</motion.p>
    
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
      className="grid grid-cols-3 gap-6 w-full max-w-sm">
      {[
        { icon: Target, label: 'Pages', value: data.totalPages.toLocaleString() },
        { icon: Clock, label: 'Hours', value: Math.round(data.totalMinutes / 60).toString() },
        { icon: Star, label: 'Avg Rating', value: data.avgRating ? data.avgRating.toFixed(1) : '—' },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }}
          className="text-center">
          <s.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xl font-black text-foreground">{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

const GenresSlide = ({ data }: { data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full px-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <BarChart3 className="w-10 h-10 text-secondary mx-auto mb-4" />
    </motion.div>
    <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-2xl font-display font-bold mb-1 text-center">Your Top Genres</motion.h3>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      className="text-sm text-muted-foreground mb-8 text-center">What you loved reading most</motion.p>
    
    <div className="w-full max-w-sm space-y-3">
      {data.topGenres.map(([genre, count], i) => (
        <motion.div
          key={genre}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.15 }}
          className="flex items-center gap-3"
        >
          <span className="text-2xl font-black gradient-text-mixed w-8 text-right">#{i + 1}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">{genre}</span>
              <span className="text-xs text-muted-foreground">{count} books</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / (data.topGenres[0]?.[1] || 1)) * 100}%` }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full gradient-mixed"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    {data.topGenres.length === 0 && (
      <p className="text-muted-foreground text-sm">Add categories to your books to see genre stats!</p>
    )}
  </div>
);

const AuthorsSlide = ({ data }: { data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full px-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <Heart className="w-10 h-10 text-secondary mx-auto mb-4" />
    </motion.div>
    <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-2xl font-display font-bold mb-1 text-center">Favorite Authors</motion.h3>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      className="text-sm text-muted-foreground mb-8 text-center">The writers who shaped your year</motion.p>
    
    <div className="w-full max-w-sm space-y-4">
      {data.topAuthors.map(([author, count], i) => (
        <motion.div
          key={author}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.12 }}
          className="glass-card rounded-xl p-4 flex items-center gap-4"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${
            i === 0 ? 'gradient-primary text-white' : i === 1 ? 'gradient-secondary text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{author}</p>
            <p className="text-xs text-muted-foreground">{count} book{count > 1 ? 's' : ''}</p>
          </div>
          {i === 0 && <Trophy className="w-5 h-5 text-warning" />}
        </motion.div>
      ))}
    </div>
  </div>
);

const MonthlySlide = ({ data }: { data: ReturnType<typeof buildWrappedData> }) => {
  const maxVal = Math.max(...Object.values(data.monthlyData), 1);
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Calendar className="w-10 h-10 text-primary mx-auto mb-4" />
      </motion.div>
      <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-2xl font-display font-bold mb-1">Reading Timeline</motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground mb-8">Books finished each month</motion.p>
      
      <div className="w-full max-w-md flex items-end gap-1 h-40">
        {data.months.map((month, i) => {
          const val = data.monthlyData[month] || 0;
          const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <motion.div
              key={month}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col items-center justify-end"
            >
              {val > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="text-[10px] font-bold text-primary mb-1"
                >{val}</motion.span>
              )}
              <div
                className={`w-full rounded-t-md transition-colors ${val > 0 ? 'gradient-mixed' : 'bg-muted/30'}`}
                style={{ height: '100%', minHeight: '4px' }}
              />
              <span className="text-[9px] text-muted-foreground mt-1 font-medium">{month}</span>
            </motion.div>
          );
        })}
      </div>
      
      {data.bestMonth && data.bestMonth[1] > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          className="mt-6 glass-card rounded-xl px-5 py-3 text-center">
          <p className="text-xs text-muted-foreground">Your best month was</p>
          <p className="text-lg font-bold gradient-text">{data.bestMonth[0]} — {data.bestMonth[1]} book{data.bestMonth[1] > 1 ? 's' : ''}</p>
        </motion.div>
      )}
    </div>
  );
};

const HighlightsSlide = ({ data }: { data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full px-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <Award className="w-10 h-10 text-warning mx-auto mb-4" />
    </motion.div>
    <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-2xl font-display font-bold mb-6">Highlights</motion.h3>
    
    <div className="w-full max-w-sm space-y-4">
      {data.topRated.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">⭐ Highest Rated</p>
          <p className="font-semibold text-foreground">{data.topRated[0].title}</p>
          <p className="text-xs text-muted-foreground">{data.topRated[0].authors?.[0]}</p>
          <div className="flex gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < (data.topRated[0].personalRating || 0) ? 'text-warning fill-warning' : 'text-muted'}`} />
            ))}
          </div>
        </motion.div>
      )}
      
      {data.longest && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
          className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">📖 Longest Book</p>
          <p className="font-semibold text-foreground">{data.longest.title}</p>
          <p className="text-xs text-muted-foreground">{data.longest.pageCount?.toLocaleString()} pages</p>
        </motion.div>
      )}

      {data.fastest && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}
          className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">⚡ Speed Read</p>
          <p className="font-semibold text-foreground">{data.fastest.title}</p>
          <p className="text-xs text-muted-foreground">
            {Math.round((data.fastest.pageCount || 0) / Math.max((data.fastest.timeSpentReading || 1) / 60, 1))} pages/hr
          </p>
        </motion.div>
      )}
    </div>
  </div>
);

const SummarySlide = ({ user, data }: { user: string; data: ReturnType<typeof buildWrappedData> }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6">
    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
      className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-2xl">
      <Trophy className="w-10 h-10 text-white" />
    </motion.div>
    
    <motion.h3 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="text-3xl font-display font-black gradient-text-mixed mb-2">
      That's a wrap, {user}!
    </motion.h3>
    
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      className="text-muted-foreground mb-8 max-w-sm">
      {data.finished} books, {data.totalPages.toLocaleString()} pages, and countless adventures. Here's to an even better {data.year + 1}! 📚
    </motion.p>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
      {[
        { label: 'Books', value: data.finished, icon: BookOpen },
        { label: 'Pages', value: data.totalPages, icon: Target },
        { label: 'Hours', value: Math.round(data.totalMinutes / 60), icon: Clock },
        { label: 'Genres', value: data.topGenres.length, icon: BarChart3 },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 + i * 0.1 }}
          className="glass-card rounded-xl p-3 text-center">
          <s.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-black text-foreground">{s.value.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>

    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
      className="text-[11px] text-muted-foreground/50">
      Generated by BookVault • {data.year}
    </motion.p>
  </div>
);

// ── Slide backgrounds ──
const slideBackgrounds = [
  'from-primary/5 via-background to-secondary/5',
  'from-primary/10 via-background to-background',
  'from-secondary/10 via-background to-background',
  'from-accent/5 via-background to-secondary/5',
  'from-primary/5 via-background to-accent/5',
  'from-warning/5 via-background to-primary/5',
  'from-secondary/5 via-background to-primary/5',
];

// ── Progress dots ──
const ProgressDots = ({ total, current }: { total: number; current: number }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          width: i === current ? 24 : 8,
          backgroundColor: i === current ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
        }}
        transition={{ duration: 0.3 }}
        className="h-2 rounded-full"
      />
    ))}
  </div>
);

// ── Main Component ──
export const ReadingWrapped = ({ books, currentUser }: ReadingWrappedProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const data = useMemo(() => buildWrappedData(books), [books]);

  const slides = [
    <IntroSlide key="intro" user={currentUser} data={data} />,
    <BigNumberSlide key="numbers" data={data} />,
    <GenresSlide key="genres" data={data} />,
    <AuthorsSlide key="authors" data={data} />,
    <MonthlySlide key="monthly" data={data} />,
    <HighlightsSlide key="highlights" data={data} />,
    <SummarySlide key="summary" user={currentUser} data={data} />,
  ];

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= slides.length - 1) { setAutoPlay(false); return prev; }
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, slides.length]);

  const next = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const prev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null, scale: 2, useCORS: true, allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `bookvault-wrapped-${data.year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error('Download failed:', err); }
  }, [data.year]);

  const shareCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `bookvault-wrapped-${data.year}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `My ${data.year} Reading Wrapped`, text: `I read ${data.finished} books this year! 📚` });
        } else {
          const link = document.createElement('a');
          link.download = `bookvault-wrapped-${data.year}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      });
    } catch (err) { console.error('Share failed:', err); }
  }, [data.year, data.finished]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-black gradient-text-mixed mb-1"
        >
          📚 Your {data.year} Reading Wrapped
        </motion.h2>
        <p className="text-sm text-muted-foreground">A beautiful look back at your reading year</p>
      </div>

      {/* Slide Container */}
      <div className="max-w-lg mx-auto">
        <div
          ref={cardRef}
          className={`relative bg-gradient-to-br ${slideBackgrounds[currentSlide % slideBackgrounds.length]} rounded-3xl overflow-hidden border border-border/30 shadow-2xl`}
          style={{ minHeight: '520px' }}
        >
          {/* Aurora background */}
          <div className="aurora-container opacity-30">
            <div className="aurora-blob-1" />
            <div className="aurora-blob-2" />
          </div>

          {/* Slide content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 h-full"
              style={{ minHeight: '520px' }}
            >
              {slides[currentSlide]}
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows — overlaid on card */}
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground disabled:opacity-20 hover:bg-card transition-all shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            disabled={currentSlide === slides.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground disabled:opacity-20 hover:bg-card transition-all shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="mt-4">
          <ProgressDots total={slides.length} current={currentSlide} />
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-4 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCurrentSlide(0); setAutoPlay(true); }}
            className="gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto Play
          </Button>
          <Button size="sm" onClick={downloadCard} className="gap-2 gradient-primary text-white">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={shareCard} className="gap-2">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
