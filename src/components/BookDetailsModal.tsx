import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X, Star, Plus, Trash2, ExternalLink, ShoppingCart, Clock, Play, Settings,
  Layers, Tablet, BookMarked, Globe, Users, MapPin, Brain, Sparkles, Loader2,
  BookOpen, Hash, Copy, Check, ChevronDown, Calendar, Building2, Languages,
  ScrollText, Tags, Library, Quote, ShieldCheck, BookCopy, History, FileText,
  UserCircle2, Ruler, Weight, ListTree, Link2, Eye, Headphones, BookOpenCheck,
  Globe2, BarChart3, TrendingUp,
} from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { enrichBook, findSimilarBooks } from '@/services/googleBooks';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
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
        className="w-20 h-28 sm:w-28 sm:h-40 rounded-lg shadow-xl"
      />
    );
  }
  return (
    <img
      src={book.imageLinks.thumbnail}
      alt={book.title}
      className="w-20 h-28 sm:w-28 sm:h-40 object-cover rounded-lg shadow-xl ring-1 ring-border/40 transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
};

type Section = 'overview' | 'about' | 'compendium' | 'details' | 'similar' | 'purchase';

const SECTIONS: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'about', label: 'About', icon: ScrollText },
  { id: 'compendium', label: 'Compendium', icon: ListTree },
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
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<Section, HTMLElement | null>>({
    overview: null, about: null, compendium: null, details: null, similar: null, purchase: null,
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
    const onScroll = () => {
      setIsHeroCollapsed(root.scrollTop > 60);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
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
    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', onScroll);
    };
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
      className="fixed inset-0 modal-overlay-noir flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="frosted-panel rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl flex flex-col shadow-2xl animate-scale-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain', height: '92dvh', maxHeight: '92dvh' }}
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

          <motion.div
            initial={false}
            animate={{
              maxHeight: isHeroCollapsed ? 0 : 600,
              opacity: isHeroCollapsed ? 0 : 1,
              paddingTop: isHeroCollapsed ? 0 : undefined,
              paddingBottom: isHeroCollapsed ? 0 : undefined,
            }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
            className="relative"
          >
          <div className="relative p-3 sm:p-5 flex gap-3 sm:gap-5">
            {/* Cover */}
            <div className="group flex-shrink-0">
              <ModalCoverImage book={displayBook} />
            </div>

            {/* Title + facts */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {displayBook.seriesName && (
                    <div className="eyebrow-tick mb-2">
                      <Layers className="w-3 h-3" />
                      <span>{displayBook.seriesName}{displayBook.seriesPosition && ` · № ${displayBook.seriesPosition}`}</span>
                    </div>
                  )}
                  <h2 className="h-editorial text-xl sm:text-3xl text-foreground line-clamp-2 italic">
                    <span className="gold-underline not-italic font-semibold">{displayBook.title}</span>
                    {isEnriching && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin text-muted-foreground" />}
                  </h2>
                  {displayBook.subtitle && (
                    <p className="text-sm sm:text-base text-foreground/75 italic mt-1.5 line-clamp-2">{displayBook.subtitle}</p>
                  )}
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 tracking-[0.16em] uppercase font-semibold">
                    by <span className="text-foreground/90">{displayBook.authors?.join(', ') || 'Unknown Author'}</span>
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 sm:mt-2.5 text-[11px] sm:text-xs">
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
              <div className="flex flex-wrap gap-1.5 mt-2">
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
          </motion.div>

          {/* Compact title bar when collapsed */}
          <motion.div
            initial={false}
            animate={{
              maxHeight: isHeroCollapsed ? 64 : 0,
              opacity: isHeroCollapsed ? 1 : 0,
            }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
            className="relative"
          >
            <div className="px-4 sm:px-5 py-2.5 flex items-center gap-3 border-b border-border/30">
              {displayBook.imageLinks?.thumbnail && (
                <img
                  src={displayBook.imageLinks.thumbnail}
                  alt=""
                  className="w-8 h-11 object-cover rounded-sm ring-1 ring-border/40 flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-serif italic text-sm sm:text-base text-foreground truncate">
                  {displayBook.title}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">
                  {displayBook.authors?.join(', ')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted/70 rounded-full transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

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
            <div className="section-marker">
              <span className="serial-numeral">№ 01</span>
              <h3 className="h-editorial text-xl text-foreground italic">At a Glance</h3>
            </div>
            {/* At a Glance — elite info-density stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {displayBook.averageRating && (
                <GlanceStat
                  icon={Star}
                  label="Rating"
                  value={displayBook.averageRating.toFixed(1)}
                  sub={displayBook.ratingsCount ? `${displayBook.ratingsCount.toLocaleString()} reviews` : undefined}
                  accent="warning"
                />
              )}
              {displayBook.pageCount && (
                <GlanceStat
                  icon={BookOpen}
                  label="Length"
                  value={`${displayBook.pageCount} pp`}
                  sub={displayBook.wordCountEstimate ? `~${(displayBook.wordCountEstimate / 1000).toFixed(0)}k words` : undefined}
                />
              )}
              {readingTimeLabel && (
                <GlanceStat
                  icon={Clock}
                  label="Read time"
                  value={`~${readingTimeLabel}`}
                  sub={displayBook.readingDifficulty ? `${displayBook.readingDifficulty} pace` : undefined}
                />
              )}
              {(displayBook.originalPublicationYear || displayBook.publishedDate) && (
                <GlanceStat
                  icon={History}
                  label="First published"
                  value={(displayBook.originalPublicationYear || formatYear(displayBook.publishedDate))!.toString()}
                  sub={displayBook.editionCount && displayBook.editionCount > 1 ? `${displayBook.editionCount} editions` : undefined}
                />
              )}
            </div>
            <div className="ornament-rule"><span>❦</span></div>

            {displayBook.firstSentence && (
              <div className="relative card-hairline frame-brackets p-6">
                <span className="cross-mark" />
                <span className="serial-numeral">№ 01 — Incipit</span>
                <p className="h-editorial italic text-base sm:text-xl text-foreground mt-2 leading-snug">
                  <span aria-hidden className="text-primary mr-1">“</span>{displayBook.firstSentence}<span aria-hidden className="text-primary ml-1">”</span>
                </p>
              </div>
            )}

            {displayBook.textSnippet && !displayBook.firstSentence && (
              <div className="card-hairline frame-brackets p-4">
                <span className="serial-numeral">№ 01 — Excerpt</span>
                <p className="h-editorial italic text-sm text-foreground/90 mt-1.5 leading-relaxed">“{displayBook.textSnippet}”</p>
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
            <div className="section-marker">
              <span className="serial-numeral">№ 02</span>
              <h3 className="h-editorial text-xl text-foreground italic">About this book</h3>
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

            {displayBook.authorBio && (
              <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-4 border border-secondary/15">
                <div className="flex items-start gap-3">
                  {displayBook.authorPhotoUrl ? (
                    <img
                      src={displayBook.authorPhotoUrl}
                      alt={displayBook.authors?.[0] || 'Author portrait'}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-md ring-1 ring-border/40 flex-shrink-0 bg-muted"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-md bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <UserCircle2 className="w-8 h-8 text-secondary/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>About {displayBook.authors?.[0] || 'the author'}</span>
                    </h4>
                    <div className="text-[10.5px] text-muted-foreground tracking-wide mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      {displayBook.authorPersonalName && displayBook.authorPersonalName !== displayBook.authors?.[0] && (
                        <span>né {displayBook.authorPersonalName}</span>
                      )}
                      {displayBook.authorBirthDate && <span>b. {displayBook.authorBirthDate}</span>}
                      {displayBook.authorDeathDate && <span>d. {displayBook.authorDeathDate}</span>}
                      {displayBook.authorWorkCount && <span>{displayBook.authorWorkCount.toLocaleString()} works</span>}
                      {displayBook.authorTopWork && <span className="italic truncate">top: {displayBook.authorTopWork}</span>}
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed mt-2 whitespace-pre-wrap">{displayBook.authorBio}</p>
                    {displayBook.authorAlternateNames?.length ? (
                      <div className="mt-2 text-[10.5px] text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider">Also known as: </span>
                        {displayBook.authorAlternateNames.join(' · ')}
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {displayBook.authorWikipediaUrl && (
                        <a href={displayBook.authorWikipediaUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                          Wikipedia <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {displayBook.authorLinks?.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline">
                          {l.title} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

            {displayBook.subjectTimes && displayBook.subjectTimes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <History className="w-3 h-3" /> Eras & Periods
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayBook.subjectTimes.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-warning/10 text-warning rounded-md text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* COMPENDIUM — exhaustive API data */}
          <section
            data-section="compendium"
            ref={el => { sectionRefs.current.compendium = el; }}
            className="space-y-5 scroll-mt-2"
          >
            <div className="section-marker">
              <span className="serial-numeral">№ 03</span>
              <h3 className="h-editorial text-xl text-foreground italic">Compendium</h3>
            </div>

            {/* Reader community stats */}
            {displayBook.readerStats && (
              displayBook.readerStats.wantToRead + displayBook.readerStats.currentlyReading + displayBook.readerStats.alreadyRead > 0
            ) && (
              <div>
                <SubHeading icon={TrendingUp}>Reader community</SubHeading>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Want to read" value={displayBook.readerStats.wantToRead} accent="primary" />
                  <StatTile label="Reading now" value={displayBook.readerStats.currentlyReading} accent="warning" />
                  <StatTile label="Already read" value={displayBook.readerStats.alreadyRead} accent="success" />
                </div>
              </div>
            )}

            {/* Ratings histogram */}
            {displayBook.ratingsHistogram && (
              Object.values(displayBook.ratingsHistogram).some(v => v > 0)
            ) && (
              <div>
                <SubHeading icon={BarChart3}>Ratings distribution</SubHeading>
                <RatingsHistogram data={displayBook.ratingsHistogram} />
              </div>
            )}

            {/* Physical edition */}
            {(displayBook.physicalFormat || displayBook.physicalDimensions || displayBook.weight ||
              displayBook.pagination || displayBook.printedPageCount) && (
              <div>
                <SubHeading icon={Ruler}>Physical edition</SubHeading>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <DetailItem icon={BookCopy} label="Format" value={displayBook.physicalFormat} />
                  <DetailItem icon={Ruler} label="Dimensions" value={displayBook.physicalDimensions} />
                  <DetailItem icon={Weight} label="Weight" value={displayBook.weight} />
                  <DetailItem icon={FileText} label="Pagination" value={displayBook.pagination} />
                  {displayBook.printedPageCount && (
                    <DetailItem icon={BookOpen} label="Printed pages" value={displayBook.printedPageCount.toString()} />
                  )}
                </div>
              </div>
            )}

            {/* Publishing footprint */}
            {(displayBook.byStatement || displayBook.copyrightDate || displayBook.firstPublishDate ||
              displayBook.publishPlaces?.length) && (
              <div>
                <SubHeading icon={Building2}>Publishing footprint</SubHeading>
                <div className="space-y-2">
                  {displayBook.byStatement && (
                    <div className="text-sm text-foreground/85 italic">{displayBook.byStatement}</div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {displayBook.firstPublishDate && <span><strong className="text-foreground">First published:</strong> {displayBook.firstPublishDate}</span>}
                    {displayBook.copyrightDate && <span><strong className="text-foreground">© </strong>{displayBook.copyrightDate}</span>}
                  </div>
                  {displayBook.publishPlaces?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {displayBook.publishPlaces.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-muted/60 text-foreground/80 rounded-md text-xs">
                          <MapPin className="w-3 h-3 inline mr-1 text-muted-foreground" />{p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Contributors */}
            {displayBook.contributors?.length ? (
              <div>
                <SubHeading icon={Users}>Contributors</SubHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {displayBook.contributors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/40 rounded-md text-xs">
                      <UserCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{c.name}</span>
                      {c.role && <span className="text-muted-foreground italic">· {c.role}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Classifications */}
            {(displayBook.deweyDecimal?.length || displayBook.lcClassifications?.length) && (
              <div>
                <SubHeading icon={Library}>Library classifications</SubHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayBook.deweyDecimal?.length ? (
                    <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/15">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Dewey Decimal</div>
                      <div className="font-mono text-sm text-foreground">{displayBook.deweyDecimal.join(' · ')}</div>
                    </div>
                  ) : null}
                  {displayBook.lcClassifications?.length ? (
                    <div className="bg-secondary/5 rounded-lg p-2.5 border border-secondary/15">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">LC Classification</div>
                      <div className="font-mono text-sm text-foreground">{displayBook.lcClassifications.join(' · ')}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Table of contents */}
            {displayBook.tableOfContents?.length ? (
              <div>
                <SubHeading icon={ListTree}>Table of contents</SubHeading>
                <ol className="space-y-1 bg-card rounded-xl p-3 border border-border max-h-72 overflow-y-auto">
                  {displayBook.tableOfContents.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-sm" style={{ paddingLeft: `${(t.level || 0) * 12}px` }}>
                      {t.label && <span className="text-[10px] font-mono text-muted-foreground">{t.label}</span>}
                      <span className="text-foreground/85 flex-1 truncate">{t.title}</span>
                      {t.pagenum && <span className="text-[10px] text-muted-foreground tabular-nums">p. {t.pagenum}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Excerpts */}
            {displayBook.excerpts?.length ? (
              <div>
                <SubHeading icon={Quote}>Excerpts</SubHeading>
                <div className="space-y-2">
                  {displayBook.excerpts.map((e, i) => (
                    <blockquote key={i} className="card-hairline p-3 text-sm italic text-foreground/85 border-l-2 border-primary/40">
                      <span className="text-primary mr-1">“</span>{e.text}<span className="text-primary ml-1">”</span>
                      {e.comment && <div className="not-italic text-[10.5px] text-muted-foreground mt-1.5">— {e.comment}</div>}
                    </blockquote>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Access & permissions (Google accessInfo) */}
            {(displayBook.viewability || displayBook.publicDomain !== undefined ||
              displayBook.textToSpeechAllowed !== undefined || displayBook.quoteSharingAllowed !== undefined ||
              displayBook.embeddable !== undefined || displayBook.readingModes || displayBook.country) && (
              <div>
                <SubHeading icon={Eye}>Access &amp; permissions</SubHeading>
                <div className="flex flex-wrap gap-1.5">
                  {displayBook.viewability && displayBook.viewability !== 'NO_PAGES' && (
                    <PermBadge icon={Eye} label={`View: ${displayBook.viewability.replace('_', ' ').toLowerCase()}`} tone="primary" />
                  )}
                  {displayBook.publicDomain && <PermBadge icon={Globe2} label="Public domain" tone="success" />}
                  {displayBook.embeddable && <PermBadge icon={BookOpenCheck} label="Embeddable" tone="primary" />}
                  {displayBook.textToSpeechAllowed && <PermBadge icon={Headphones} label="Text-to-speech" tone="success" />}
                  {displayBook.quoteSharingAllowed && <PermBadge icon={Quote} label="Quote sharing" tone="success" />}
                  {displayBook.readingModes?.text && <PermBadge icon={FileText} label="Text mode" tone="muted" />}
                  {displayBook.readingModes?.image && <PermBadge icon={Eye} label="Scanned pages" tone="muted" />}
                  {displayBook.panelizationSummary?.containsEpubBubbles && <PermBadge icon={ScrollText} label="ePub speech bubbles" tone="muted" />}
                  {displayBook.panelizationSummary?.containsImageBubbles && <PermBadge icon={ScrollText} label="Image speech bubbles" tone="muted" />}
                  {displayBook.country && <PermBadge icon={Globe2} label={`Region: ${displayBook.country}`} tone="muted" />}
                  {displayBook.printType && <PermBadge icon={BookCopy} label={displayBook.printType} tone="muted" />}
                </div>
              </div>
            )}

            {/* External links */}
            {displayBook.externalLinks?.length ? (
              <div>
                <SubHeading icon={Link2}>External resources</SubHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {displayBook.externalLinks.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/70 text-sm transition-colors group">
                      <span className="truncate text-foreground/85 group-hover:text-primary">{l.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Cover gallery */}
            {displayBook.coverIds?.length && displayBook.coverIds.length > 1 ? (
              <div>
                <SubHeading icon={BookCopy}>Cover gallery</SubHeading>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {displayBook.coverIds.map((id) => (
                    <img
                      key={id}
                      src={`https://covers.openlibrary.org/b/id/${id}-M.jpg`}
                      alt="Edition cover"
                      className="h-32 w-auto rounded-md ring-1 ring-border/40 object-cover flex-shrink-0 bg-muted"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Identifiers extras */}
            {displayBook.otherIdentifiers?.length ? (
              <div>
                <SubHeading icon={Hash}>Other identifiers</SubHeading>
                <div className="flex flex-wrap gap-2">
                  {displayBook.otherIdentifiers.map((id, i) => (
                    <CopyChip key={i} label={id.type} value={id.identifier} />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Provenance footer */}
            {(displayBook.contentVersion || displayBook.latestRevision || displayBook.revisionCount) && (
              <div className="text-[10.5px] text-muted-foreground/80 italic flex flex-wrap gap-x-3 gap-y-0.5">
                {displayBook.contentVersion && <span>Content version: <span className="font-mono">{displayBook.contentVersion}</span></span>}
                {displayBook.latestRevision && <span>OL revision: <span className="font-mono">{displayBook.latestRevision}</span></span>}
              </div>
            )}
          </section>

          {/* DETAILS */}
          <section
            data-section="details"
            ref={el => { sectionRefs.current.details = el; }}
            className="space-y-4 scroll-mt-2"
          >
            <div className="section-marker">
              <span className="serial-numeral">№ 04</span>
              <h3 className="h-editorial text-xl text-foreground italic">Publication &amp; Identifiers</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DetailItem icon={Calendar} label="Published" value={formatYear(displayBook.publishedDate)} />
              {displayBook.originalPublicationYear && (
                <DetailItem icon={History} label="First published" value={displayBook.originalPublicationYear.toString()} />
              )}
              <DetailItem icon={Building2} label="Publisher" value={displayBook.publisher} />
              <DetailItem icon={BookOpen} label="Pages" value={displayBook.pageCount?.toString()} />
              {displayBook.wordCountEstimate && (
                <DetailItem icon={FileText} label="Word count" value={`~${displayBook.wordCountEstimate.toLocaleString()}`} />
              )}
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

            {(displayBook.dataConfidence !== undefined || displayBook.dataSources?.length) && (
              <div className="flex items-center justify-between gap-3 text-[11px] bg-muted/20 rounded-lg p-2.5 border border-border/50">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span className="font-semibold uppercase tracking-wider">Data accuracy</span>
                  {displayBook.dataConfidence !== undefined && (
                    <span className="text-foreground tabular-nums">
                      {Math.round(displayBook.dataConfidence * 100)}%
                    </span>
                  )}
                </div>
                {displayBook.dataSources && displayBook.dataSources.length > 0 && (
                  <div className="flex items-center gap-1">
                    {displayBook.dataSources.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono uppercase">
                        {s === 'google' ? 'Google' : s === 'openlibrary' ? 'OpenLib' : 'Wiki'}
                      </span>
                    ))}
                  </div>
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
            <div className="section-marker">
              <span className="serial-numeral">№ 04</span>
              <h3 className="h-editorial text-xl text-foreground italic flex-1">Kindred Volumes</h3>
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
            <div className="section-marker">
              <span className="serial-numeral">№ 05</span>
              <h3 className="h-editorial text-xl text-foreground italic">Acquire &amp; Borrow</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {purchaseLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hairline frame-brackets flex items-center justify-between p-3.5 group/buy"
                >
                  <span className="serial-numeral absolute top-2 left-3">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-3">{link.icon}</span>
                    <div className="min-w-0">
                      <div className="h-editorial text-base text-foreground truncate group-hover/buy:text-primary transition-colors">{link.name}</div>
                      <div className="text-[10px] text-muted-foreground tracking-[0.14em] uppercase font-semibold truncate mt-0.5">{link.desc}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 text-primary/60 group-hover/buy:text-primary transition-colors" />
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
    <div className="card-hairline frame-brackets flex items-start gap-2 p-3">
      <Icon className="w-3.5 h-3.5 text-primary/70 mt-1 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="editorial-num text-base text-foreground truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
};

const GlanceStat = ({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: 'primary' | 'warning' | 'success';
}) => {
  const accentClass =
    accent === 'warning' ? 'text-warning' :
    accent === 'success' ? 'text-success' :
    'text-primary';
  return (
    <div className="relative card-hairline frame-brackets p-3.5">
      <span className="cross-mark" />
      <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className={`w-3 h-3 ${accentClass}`} />
        {label}
      </div>
      <div className="mt-2 editorial-num text-2xl text-foreground leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-[10px] text-muted-foreground/80 truncate italic">{sub}</div>}
    </div>
  );
};

const SubHeading = ({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-1.5 mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
    <Icon className="w-3 h-3 text-primary" />
    {children}
  </div>
);

const StatTile = ({
  label, value, accent = 'primary',
}: { label: string; value: number; accent?: 'primary' | 'warning' | 'success' }) => {
  const tone =
    accent === 'warning' ? 'text-warning bg-warning/10 border-warning/20' :
    accent === 'success' ? 'text-success bg-success/10 border-success/20' :
    'text-primary bg-primary/10 border-primary/20';
  return (
    <div className={`rounded-lg border p-2.5 text-center ${tone}`}>
      <div className="editorial-num text-xl leading-none tabular-nums">{value.toLocaleString()}</div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
};

const RatingsHistogram = ({
  data,
}: { data: { 1: number; 2: number; 3: number; 4: number; 5: number } }) => {
  const max = Math.max(data[1], data[2], data[3], data[4], data[5], 1);
  const total = data[1] + data[2] + data[3] + data[4] + data[5];
  return (
    <div className="space-y-1.5 bg-card rounded-xl p-3 border border-border">
      {[5, 4, 3, 2, 1].map(n => {
        const v = data[n as 1 | 2 | 3 | 4 | 5];
        const pct = (v / max) * 100;
        const share = total ? Math.round((v / total) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2 text-[11px]">
            <span className="w-6 flex items-center gap-0.5 text-muted-foreground tabular-nums">
              {n}<span className="text-warning">★</span>
            </span>
            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 text-right tabular-nums text-muted-foreground">
              {v.toLocaleString()} <span className="opacity-60">· {share}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PermBadge = ({
  icon: Icon, label, tone = 'muted',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: 'primary' | 'success' | 'muted';
}) => {
  const cls =
    tone === 'primary' ? 'bg-primary/10 text-primary border-primary/20' :
    tone === 'success' ? 'bg-success/10 text-success border-success/20' :
    'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-medium ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};
