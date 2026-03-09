
import { useState, useRef, useCallback } from 'react';
import { Star, Plus, Trash2, BookOpen, Layers, Tablet, BookMarked, Clock } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { motion } from 'framer-motion';

interface BookCardProps {
  book: Book;
  onSelect: () => void;
  onAddToBookshelf?: () => void;
  onRemoveFromBookshelf?: () => void;
  isInBookshelf: boolean;
  showAddButton: boolean;
}

const CoverImage = ({ book, className }: { book: Book; className?: string }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!book.imageLinks?.thumbnail || failed) {
    return <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className={className || ''} />;
  }

  return (
    <div className={`relative ${className || ''}`}>
      {!loaded && <div className="absolute inset-0 skeleton-gold rounded-lg" />}
      <img
        src={book.imageLinks.thumbnail}
        alt={book.title}
        className={`object-cover w-full h-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-px">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-primary fill-primary' : i < rating ? 'text-primary fill-primary/40' : 'text-muted-foreground/20'
        }`}
      />
    ))}
  </div>
);

// 3D tilt hook
const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, []);

  return { ref, style, handleMove, handleLeave };
};

export const BookCard = ({ book, onSelect, onAddToBookshelf, onRemoveFromBookshelf, isInBookshelf, showAddButton }: BookCardProps) => {
  const { ref: tiltRef, style: tiltStyle, handleMove, handleLeave } = useTilt();

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showAddButton && onAddToBookshelf && !isInBookshelf) onAddToBookshelf();
    else if (!showAddButton && onRemoveFromBookshelf) onRemoveFromBookshelf();
  };

  const difficultyLabel: Record<string, string> = { easy: 'Quick Read', moderate: 'Standard', advanced: 'Deep Read' };
  const difficultyStyle: Record<string, string> = {
    easy: 'bg-success/10 text-success',
    moderate: 'bg-primary/10 text-primary',
    advanced: 'bg-secondary/10 text-secondary',
  };

  const estimatedTime = book.pageCount ? Math.round(book.pageCount / 40) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div
        ref={tiltRef}
        style={tiltStyle}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
      >
        {/* Top accent shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary/40 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-10" />
        
        {/* Card shine sweep */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-2xl">
          <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
        </div>

        <div onClick={onSelect} className="p-3.5">
          {/* Cover with 3D depth */}
          <div className="relative mb-3 overflow-hidden rounded-xl aspect-[2/3] ring-1 ring-border/40 group-hover:ring-primary/25 transition-all duration-300 shadow-sm group-hover:shadow-xl">
            <CoverImage book={book} className="w-full h-full rounded-xl" />

            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/95 backdrop-blur-sm text-xs font-medium text-primary shadow-lg border border-primary/20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <BookOpen className="w-3.5 h-3.5" />
                View Details
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {book.seriesName && (
                <span className="px-1.5 py-0.5 rounded-md bg-accent/90 backdrop-blur-sm text-accent-foreground flex items-center gap-0.5 text-[9px] font-semibold">
                  <Layers className="w-2.5 h-2.5" />
                  {book.seriesPosition ? `#${book.seriesPosition}` : 'Series'}
                </span>
              )}
              {book.isEbook && (
                <span className="px-1.5 py-0.5 rounded-md bg-primary/90 backdrop-blur-sm text-primary-foreground flex items-center gap-0.5 text-[9px] font-semibold">
                  <Tablet className="w-2.5 h-2.5" />
                  eBook
                </span>
              )}
              {book.freeReading && (
                <span className="px-1.5 py-0.5 rounded-md bg-success/90 backdrop-blur-sm text-success-foreground flex items-center gap-0.5 text-[9px] font-semibold">
                  <BookMarked className="w-2.5 h-2.5" />
                  Free
                </span>
              )}
            </div>

            {book.averageRating && book.averageRating >= 3.5 && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/60 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                <span className="text-[10px] font-bold text-foreground">{book.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 leading-snug tracking-tight">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground font-medium line-clamp-1">
              {book.authors?.join(', ') || 'Unknown Author'}
            </p>

            {book.readingStatus === 'reading' && book.readingProgress !== undefined && book.readingProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(book.readingProgress, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
                <span className="text-[10px] font-bold text-primary tabular-nums">{Math.round(book.readingProgress)}%</span>
              </div>
            )}
            {book.readingStatus === 'finished' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                <Star className="w-2.5 h-2.5 fill-current" /> Completed
              </span>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 flex-wrap">
              {book.publishedDate && <span>{new Date(book.publishedDate).getFullYear()}</span>}
              {book.pageCount && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{book.pageCount}p</span>
                </>
              )}
              {estimatedTime && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{estimatedTime}h</span>
                </>
              )}
            </div>

            {book.averageRating && (
              <div className="flex items-center gap-1.5">
                <RatingStars rating={book.averageRating} />
                {book.ratingsCount && (
                  <span className="text-[10px] text-muted-foreground/50">
                    ({book.ratingsCount > 1000 ? `${(book.ratingsCount / 1000).toFixed(1)}k` : book.ratingsCount})
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {book.readingDifficulty && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium ${difficultyStyle[book.readingDifficulty]}`}>
                  {difficultyLabel[book.readingDifficulty]}
                </span>
              )}
              {book.retailPrice && (
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[9px] font-medium">
                  {book.retailPrice.currencyCode === 'USD' ? '$' : book.retailPrice.currencyCode}{book.retailPrice.amount.toFixed(2)}
                </span>
              )}
            </div>

            {(book.textSnippet || book.firstSentence || book.description) && (
              <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-relaxed">
                {(book.textSnippet || book.firstSentence || book.description || '').replace(/<[^>]*>/g, '').slice(0, 120)}
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="px-3.5 pb-3.5">
          <button
            onClick={handleActionClick}
            disabled={showAddButton && isInBookshelf}
            className={`w-full py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              showAddButton
                ? isInBookshelf
                  ? 'bg-success/10 text-success border border-success/20 cursor-default'
                  : 'gradient-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow-md active:scale-[0.98]'
                : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground active:scale-[0.98]'
            }`}
          >
            {showAddButton ? (
              isInBookshelf ? (
                <><Star className="w-3 h-3 fill-current" />In Library</>
              ) : (
                <><Plus className="w-3 h-3" />Add to Shelf</>
              )
            ) : (
              <><Trash2 className="w-3 h-3" />Remove</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
