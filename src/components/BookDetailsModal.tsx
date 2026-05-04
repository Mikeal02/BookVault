import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X, Star, Plus, Trash2, ExternalLink, ShoppingCart, Clock, Play, Settings,
  Layers, Tablet, BookMarked, Globe, Users, MapPin, Brain, Sparkles, Loader2,
  BookOpen, Hash, Copy, Check, ChevronDown, Calendar, Building2, Languages,
  ScrollText, Tags, Library, Quote, ShieldCheck, BookCopy,
} from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { enrichBook, findSimilarBooks } from '@/services/googleBooks';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BookDetailsModalProps {
  book: Book;
  onClose: () => void;
  onAddToBookshelf: (book: Book) => void;
  onRemoveFromBookshelf: (bookId: string) => void;
  onUpdateBook: (book: Book) => void;
  onStartReadingSession?: () => void;
  onManageBook?: () => void;
  onAIInsights?: () => void;
  isInBookshelf: boolean;
}

const ModalCoverImage = ({ book }: { book: Book }) => {
  const [failed, setFailed] = useState(false);
  if (!book.imageLinks?.thumbnail || failed) {
    return (
      <BookCoverPlaceholder
        title={book.title}
        author={book.authors?.[0]}
        className="w-32 h-48 sm:w-44 sm:h-64 rounded-xl shadow-2xl"
      />
    );
  }
  return (
    <img
      src={book.imageLinks.thumbnail}
      alt={book.title}
      className="w-32 h-48 sm:w-44 sm:h-64 object-cover rounded-xl shadow-2xl ring-1 ring-border/40 transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
};

type Section = 'overview' | 'about' | 'details' | 'similar' | 'purchase';

const SECTIONS: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'about', label: 'About', icon: ScrollText },
  { id: 'details', label: 'Details', icon: Library },
  { id: 'similar', label: 'Similar', icon: Sparkles },
  { id: 'purchase', label: 'Buy', icon: ShoppingCart },
];

const renderStars = (rating: number) =>
  [...Array(5)].map((_, i) => (
    <Star
      key={i}
      className={`w-3.5 h-3.5 ${
        i < Math.floor(rating) ? 'text-warning fill-current' : 'text-muted-foreground/25'
      }`}
    />
  ));

const formatYear = (d?: string) => (d ? new Date(d).getFullYear().toString() : '—');

const CopyChip = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copied`);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          toast.error('Copy failed');
        }
      }}
      className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-mono text-foreground transition-colors"
      title={`Copy ${label}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />}
    </button>
  );
};

export const BookDetailsModal = ({
  book,
  onClose,
  onAddToBookshelf,
  onRemoveFromBookshelf,
  onStartReadingSession,
  onManageBook,
  onAIInsights,
  isInBookshelf,
}: BookDetailsModalProps) => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [enrichedBook, setEnrichedBook] = useState<Book>(book);
  const [isEnriching, setIsEnriching] = useState(false);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<Section, HTMLDivElement | null>>({
    overview: null, about: null, details: null, similar: null, purchase: null,
  });

  // Auto-enrich
  useEffect(() => {
    let cancelled = false;
    setIsEnriching(true);
    enrichBook(book)
      .then(e => { if (!cancelled) setEnrichedBook(e); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsEnriching(false); });
    return () => { cancelled = true; };
  }, [book.id]);

  // Similar books
  useEffect(() => {
    let cancelled = false;
    setLoadingSimilar(true);
    findSimilarBooks(book, 12)
      .then(r => { if (!cancelled) setSimilarBooks(r); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSimilar(false); });
    return () => { cancelled = true; };
  }, [book.id]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Section scrollspy
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      entries => {
        // Pick the entry with highest intersection ratio
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.getAttribute('data-section') as Section;
          if (id) setActiveSection(id);
        }
      },
      { root, rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [enrichedBook.id]);

  const scrollToSection = useCallback((id: Section) => {
    const el = sectionRefs.current[id];
    const root = scrollRef.current;
    if (!el || !root) return;
    setActiveSection(id);
    root.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
  }, []);

  const displayBook = enrichedBook;

  const estimatedMinutes = useMemo(() => {
    if (!displayBook.pageCount) return undefined;
    const wpm = displayBook.readingDifficulty === 'easy' ? 280 : displayBook.readingDifficulty === 'advanced' ? 180 : 230;
    return Math.round((displayBook.pageCount * 250) / wpm);
  }, [displayBook.pageCount, displayBook.readingDifficulty]);

  const readingTimeLabel = useMemo(() => {
    if (!estimatedMinutes) return null;
    const h = Math.floor(estimatedMinutes / 60);
    const m = estimatedMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [estimatedMinutes]);

  const purchaseLinks = useMemo(() => ([
    {
      name: 'Google Books',
      url: book.infoLink || `https://books.google.com/books?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`,
      icon: '🔍',
      desc: 'Read preview & info',
      className: 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20',
    },
    {
      name: 'Google Play Books',
      url: book.buyLinks?.googlePlay || `https://play.google.com/store/search?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&c=books`,
      icon: '📱',
      desc: 'Digital books & audiobooks',
      className: 'bg-success/10 hover:bg-success/20 text-success border-success/20',
    },
    {
      name: 'Amazon',
      url: book.buyLinks?.amazon || `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&i=digital-text`,
      icon: '📦',
      desc: 'Print & digital editions',
      className: 'bg-warning/10 hover:bg-warning/20 text-warning border-warning/20',
    },
    {
      name: 'Barnes & Noble',
      url: book.buyLinks?.barnes || `https://www.barnesandnoble.com/s/${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`,
      icon: '📚',
      desc: 'Print & digital books',
      className: 'bg-secondary/10 hover:bg-secondary/20 text-secondary border-secondary/20',
    },
  ]), [book]);

  const description = displayBook.description?.replace(/<[^>]*>/g, '') || '';
  const isLongDesc = description.length > 480;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="frosted-panel rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl flex flex-col shadow-2xl animate-scale-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain', maxHeight: '92dvh', height: 'auto' }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary z-20" />

        {/* ─── HERO ─── */}
        <div className="relative flex-shrink-0 overflow-hidden">
          {/* Blurred cover backdrop */}
          {displayBook.imageLinks?.thumbnail && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url(${displayBook.imageLinks.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(36px) saturate(1.4)',
                transform: 'scale(1.2)',
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background/95" />

          <div className="relative p-4 sm:p-6 flex gap-4 sm:gap-6">
            {/* Cover */}
            <div className="group flex-shrink-0">
              <ModalCoverImage book={displayBook} />
            </div>

            {/* Title + facts */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {displayBook.seriesName && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent mb-1.5">
                      <Layers className="w-3 h-3" />
                      {displayBook.seriesName}
                      {displayBook.seriesPosition && <span className="text-muted-foreground">· #{displayBook.seriesPosition}</span>}
                    </div>
                  )}
                  <h2 className="font-display text-xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight line-clamp-3">
                    {displayBook.title}
                    {isEnriching && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin text-muted-foreground" />}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
                    by <span className="text-foreground font-medium">{displayBook.authors?.join(', ') || 'Unknown Author'}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted/70 rounded-full transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Key facts strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-sm">
                {displayBook.averageRating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{renderStars(displayBook.averageRating)}</div>
                    <span className="font-semibold text-foreground">{displayBook.averageRating.toFixed(1)}</span>
                    {displayBook.ratingsCount ? (
                      <span className="text-muted-foreground">
                        ({displayBook.ratingsCount > 1000 ? `${(displayBook.ratingsCount / 1000).toFixed(1)}k` : displayBook.ratingsCount})
                      </span>
                    ) : null}
                  </div>
                )}
                {displayBook.pageCount && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" /> {displayBook.pageCount} pages
                  </div>
                )}
                {readingTimeLabel && (
                  <div className="flex items-center gap-1 text-muted-foreground" title="Estimated reading time">
                    <Clock className="w-3.5 h-3.5" /> ~{readingTimeLabel}
                  </div>
                )}
                {displayBook.publishedDate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" /> {formatYear(displayBook.publishedDate)}
                  </div>
                )}
                {displayBook.language && (
                  <div className="flex items-center gap-1 text-muted-foreground uppercase">
                    <Languages className="w-3.5 h-3.5" /> {displayBook.language}
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {displayBook.isEbook && (
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold flex items-center gap-1">
                    <Tablet className="w-3 h-3" /> eBook
                  </span>
                )}
                {displayBook.hasEpub && <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold">ePub</span>}
                {displayBook.hasPdf && <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold">PDF</span>}
                {displayBook.freeReading && (
                  <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-semibold flex items-center gap-1">
                    <BookMarked className="w-3 h-3" /> Free to Borrow
                  </span>
                )}
                {displayBook.saleability === 'FREE' && <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-semibold">Free</span>}
                {displayBook.saleability === 'FOR_PREORDER' && <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-semibold">Pre-order</span>}
                {displayBook.maturityRating === 'MATURE' && (
                  <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Mature
                  </span>
                )}
                {displayBook.readingDifficulty && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                    displayBook.readingDifficulty === 'easy' ? 'bg-success/10 text-success' :
                    displayBook.readingDifficulty === 'moderate' ? 'bg-primary/10 text-primary' :
                    'bg-secondary/10 text-secondary'
                  }`}>
                    <Brain className="w-3 h-3" />
                    {displayBook.readingDifficulty === 'easy' ? 'Quick Read' : displayBook.readingDifficulty === 'moderate' ? 'Standard' : 'Deep Read'}
                  </span>
                )}
                {isInBookshelf && displayBook.readingStatus && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    displayBook.readingStatus === 'finished' ? 'bg-success/15 text-success' :
                    displayBook.readingStatus === 'reading' ? 'bg-primary/15 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {displayBook.readingStatus === 'not-read' ? '📚 To Read' :
                     displayBook.readingStatus === 'reading' ? '📖 Reading' : '✅ Finished'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sticky section nav ─── */}
          <div className="relative border-t border-border/40 bg-background/85 backdrop-blur-md">
            <div className="flex overflow-x-auto scrollbar-thin px-3 sm:px-4">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                    {isActive && (
                      <motion.div
                        layoutId="modal-section-underline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── SCROLL CONTENT ─── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* OVERVIEW: opening line + personal notes + progress */}
          <section
            data-section="overview"
            ref={el => { sectionRefs.current.overview = el; }}
            className="space-y-4 scroll-mt-2"
          >
            {displayBook.firstSentence && (
              <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-5 border border-primary/10">
                <Quote className="absolute top-3 right-3 w-8 h-8 text-primary/15" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Opening Line</span>
                <p className="font-display italic text-base sm:text-lg text-foreground mt-2 leading-relaxed">
                  "{displayBook.firstSentence}"
                </p>
              </div>
            )}

            {displayBook.textSnippet && !displayBook.firstSentence && (
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Excerpt</span>
                <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed italic">"{displayBook.textSnippet}"</p>
              </div>
            )}

            {isInBookshelf && (displayBook.myThoughts || displayBook.notes) && (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <span>💭</span> My Personal Notes
                </h4>
                {displayBook.myThoughts && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Thoughts</span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-1 leading-relaxed">{displayBook.myThoughts}</p>
                  </div>
                )}
                {displayBook.notes && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Notes</span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-1 leading-relaxed">{displayBook.notes}</p>
                  </div>
                )}
              </div>
            )}

            {isInBookshelf && displayBook.readingProgress !== undefined && displayBook.readingProgress > 0 && (
              <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-xl p-4 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">📊 Reading Progress</h4>
                  <span className="text-base font-bold text-success tabular-nums">{Math.round(displayBook.readingProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayBook.readingProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full gradient-primary"
                  />
                </div>
                {displayBook.timeSpentReading && displayBook.timeSpentReading > 0 && (
                  <div className="flex items-center text-xs text-success mt-2">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {Math.floor(displayBook.timeSpentReading / 60)}h {displayBook.timeSpentReading % 60}m total
                  </div>
                )}
              </div>
            )}

            {isInBookshelf && displayBook.tags && displayBook.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayBook.tags.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ABOUT */}
          <section
            data-section="about"
            ref={el => { sectionRefs.current.about = el; }}
            className="space-y-4 scroll-mt-2"
          >
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">About this book</h3>
            </div>

            {description ? (
              <div className="bg-card rounded-xl p-5 border border-border">
                <div className={`prose prose-sm max-w-none text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap ${
                  !descExpanded && isLongDesc ? 'line-clamp-[10]' : ''
                }`}>
                  {description}
                </div>
                {isLongDesc && (
                  <button
                    onClick={() => setDescExpanded(v => !v)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {descExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic px-1">No description available.</div>
            )}

            {displayBook.categories && displayBook.categories.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Tags className="w-3 h-3" /> Categories
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayBook.categories.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(displayBook.subjectPeople?.length || displayBook.subjectPlaces?.length) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayBook.subjectPeople && displayBook.subjectPeople.length > 0 && (
                  <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/10">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Users className="w-3 h-3" /> People
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {displayBook.subjectPeople.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-md text-xs font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {displayBook.subjectPlaces && displayBook.subjectPlaces.length > 0 && (
                  <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <MapPin className="w-3 h-3" /> Places
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {displayBook.subjectPlaces.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent rounded-md text-xs font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* DETAILS */}
          <section
            data-section="details"
            ref={el => { sectionRefs.current.details = el; }}
            className="space-y-4 scroll-mt-2"
          >
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Publication & Identifiers</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DetailItem icon={Calendar} label="Published" value={formatYear(displayBook.publishedDate)} />
              <DetailItem icon={Building2} label="Publisher" value={displayBook.publisher} />
              <DetailItem icon={BookOpen} label="Pages" value={displayBook.pageCount?.toString()} />
              <DetailItem icon={Globe} label="Language" value={displayBook.language?.toUpperCase()} />
              {displayBook.editionCount && displayBook.editionCount > 1 && (
                <DetailItem icon={BookCopy} label="Editions" value={`${displayBook.editionCount}`} />
              )}
              {readingTimeLabel && (
                <DetailItem icon={Clock} label="Read time" value={`~${readingTimeLabel}`} />
              )}
            </div>

            {(displayBook.isbn13 || displayBook.isbn10) && (
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Hash className="w-3 h-3" /> ISBN
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayBook.isbn13 && <CopyChip label="ISBN-13" value={displayBook.isbn13} />}
                  {displayBook.isbn10 && <CopyChip label="ISBN-10" value={displayBook.isbn10} />}
                </div>
              </div>
            )}

            {(displayBook.retailPrice || displayBook.listPrice) && (
              <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg p-3 border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</span>
                {displayBook.retailPrice && (
                  <span className="font-semibold text-foreground">
                    {displayBook.retailPrice.currencyCode === 'USD' ? '$' : displayBook.retailPrice.currencyCode + ' '}
                    {displayBook.retailPrice.amount.toFixed(2)}
                  </span>
                )}
                {displayBook.listPrice && displayBook.retailPrice && displayBook.listPrice.amount > displayBook.retailPrice.amount && (
                  <span className="text-muted-foreground line-through text-xs">
                    ${displayBook.listPrice.amount.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* SIMILAR */}
          <section
            data-section="similar"
            ref={el => { sectionRefs.current.similar = el; }}
            className="space-y-3 scroll-mt-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">You Might Also Like</h3>
              </div>
              {loadingSimilar && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin -mx-1 px-1">
              {loadingSimilar && similarBooks.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[120px] snap-start">
                    <div className="aspect-[2/3] rounded-xl skeleton-gold mb-2" />
                    <div className="h-3 w-3/4 rounded skeleton-gold mb-1" />
                    <div className="h-2.5 w-1/2 rounded skeleton-gold" />
                  </div>
                ))}
              {similarBooks.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className="flex-shrink-0 w-[120px] snap-start group/sim cursor-pointer"
                  onClick={() => onAddToBookshelf(s)}
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-border/40 group-hover/sim:ring-primary/40 transition-all shadow-sm group-hover/sim:shadow-lg mb-2">
                    {s.imageLinks?.thumbnail ? (
                      <img src={s.imageLinks.thumbnail} alt={s.title} className="w-full h-full object-cover transition-transform duration-300 group-hover/sim:scale-105" loading="lazy" />
                    ) : (
                      <BookCoverPlaceholder title={s.title} author={s.authors?.[0]} className="w-full h-full" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover/sim:opacity-100 transition-opacity flex items-end justify-center pb-2">
                      <span className="px-2 py-1 bg-background/95 backdrop-blur-sm rounded-full text-[10px] font-semibold text-primary flex items-center gap-1 shadow-md">
                        <Plus className="w-2.5 h-2.5" /> Add
                      </span>
                    </div>
                    {s.averageRating && s.averageRating >= 4 && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-background/90 backdrop-blur-sm rounded-full flex items-center gap-0.5">
                        <Star className="w-2 h-2 text-primary fill-primary" />
                        <span className="text-[9px] font-bold">{s.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <h5 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover/sim:text-primary transition-colors">{s.title}</h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{s.authors?.[0] || 'Unknown'}</p>
                </motion.div>
              ))}
              {!loadingSimilar && similarBooks.length === 0 && (
                <div className="text-sm text-muted-foreground italic">No similar titles found.</div>
              )}
            </div>
          </section>

          {/* PURCHASE */}
          <section
            data-section="purchase"
            ref={el => { sectionRefs.current.purchase = el; }}
            className="space-y-3 scroll-mt-2"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Where to Buy or Borrow</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {purchaseLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link.className} flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{link.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{link.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{link.desc}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="p-3 sm:p-4 border-t border-border/60 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {displayBook.previewLink && (
                <a
                  href={displayBook.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </a>
              )}
            </div>

            <div className="flex items-center flex-wrap justify-center gap-2">
              {onAIInsights && (
                <Button onClick={onAIInsights} size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Insights
                </Button>
              )}
              {isInBookshelf && onStartReadingSession && (
                <Button onClick={onStartReadingSession} size="sm" className="gradient-primary text-primary-foreground shadow-lg text-xs">
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Start Reading
                </Button>
              )}
              {isInBookshelf && onManageBook && (
                <Button onClick={onManageBook} variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
                  <Settings className="w-3.5 h-3.5 mr-1.5" /> Manage
                </Button>
              )}
              {isInBookshelf ? (
                <Button onClick={() => onRemoveFromBookshelf(book.id)} variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                </Button>
              ) : (
                <Button onClick={() => onAddToBookshelf(book)} size="sm" className="gradient-secondary text-secondary-foreground shadow-lg text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to Library
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) => {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-lg border border-border/60">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground truncate">{value}</div>
      </div>
    </div>
  );
};
