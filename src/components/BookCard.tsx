
import { useState } from 'react';
import { Star, Plus, Trash2, BookOpen, Layers, Tablet, BookMarked } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';

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
      {!loaded && (
        <div className="absolute inset-0 skeleton-gold rounded-lg" />
      )}
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

export const BookCard = ({
  book,
  onSelect,
  onAddToBookshelf,
  onRemoveFromBookshelf,
  isInBookshelf,
  showAddButton
}: BookCardProps) => {
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showAddButton && onAddToBookshelf && !isInBookshelf) {
      onAddToBookshelf();
    } else if (!showAddButton && onRemoveFromBookshelf) {
      onRemoveFromBookshelf();
    }
  };

  const difficultyColors = {
    easy: 'bg-success/10 text-success',
    moderate: 'bg-primary/10 text-primary',
    advanced: 'bg-secondary/10 text-secondary',
  };

  return (
    <div className="group relative glass-card rounded-2xl overflow-hidden cursor-pointer hover-lift transition-all duration-400">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary/40 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
      <div onClick={onSelect} className="p-4">
        {/* Cover with 3:4 aspect ratio */}
        <div className="relative mb-3 overflow-hidden rounded-lg aspect-[3/4] ring-1 ring-border/50 group-hover:ring-primary/20 transition-all duration-300">
          <CoverImage book={book} className="w-full h-full rounded-lg" />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-end justify-center pb-4">
            <div className="w-10 h-10 rounded-full bg-background/95 flex items-center justify-center backdrop-blur-sm shadow-lg border border-primary/20">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Top-left badges: series, ebook */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {book.seriesName && (
              <div className="px-1.5 py-0.5 rounded bg-accent/90 backdrop-blur-sm text-accent-foreground flex items-center gap-0.5">
                <Layers className="w-2.5 h-2.5" />
                <span className="text-[9px] font-semibold">
                  {book.seriesPosition ? `#${book.seriesPosition}` : 'Series'}
                </span>
              </div>
            )}
            {book.isEbook && (
              <div className="px-1.5 py-0.5 rounded bg-primary/90 backdrop-blur-sm text-primary-foreground flex items-center gap-0.5">
                <Tablet className="w-2.5 h-2.5" />
                <span className="text-[9px] font-semibold">eBook</span>
              </div>
            )}
            {book.freeReading && (
              <div className="px-1.5 py-0.5 rounded bg-success/90 backdrop-blur-sm text-success-foreground flex items-center gap-0.5">
                <BookMarked className="w-2.5 h-2.5" />
                <span className="text-[9px] font-semibold">Free</span>
              </div>
            )}
          </div>

          {/* Rating badge top-right */}
          {book.averageRating && book.averageRating >= 3.5 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center gap-0.5">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-[10px] font-semibold text-foreground">{book.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 leading-snug tracking-tight">
            {book.title}
          </h3>
          
          <div className="text-xs text-muted-foreground font-medium line-clamp-1">
            {book.authors?.join(', ') || 'Unknown Author'}
          </div>

          {/* Reading progress for shelf books */}
          {book.readingStatus === 'reading' && book.readingProgress !== undefined && book.readingProgress > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(book.readingProgress, 100)}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-primary">{Math.round(book.readingProgress)}%</span>
            </div>
          )}
          {book.readingStatus === 'finished' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
              <Star className="w-2.5 h-2.5 fill-current" /> Completed
            </span>
          )}

          {/* Series + year row */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
            {book.publishedDate && (
              <span>{new Date(book.publishedDate).getFullYear()}</span>
            )}
            {book.seriesName && (
              <>
                <span>·</span>
                <span className="text-accent font-medium truncate">{book.seriesName}</span>
              </>
            )}
            {book.editionCount && book.editionCount > 1 && (
              <>
                <span>·</span>
                <span>{book.editionCount} eds</span>
              </>
            )}
          </div>

          {/* Rating stars */}
          {book.averageRating && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(book.averageRating!)
                        ? 'text-primary fill-primary'
                        : 'text-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              {book.ratingsCount && (
                <span className="text-[10px] text-muted-foreground/60">
                  ({book.ratingsCount > 1000 ? `${(book.ratingsCount / 1000).toFixed(1)}k` : book.ratingsCount})
                </span>
              )}
            </div>
          )}

          {/* Availability + difficulty badges */}
          <div className="flex flex-wrap gap-1">
            {book.readingDifficulty && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${difficultyColors[book.readingDifficulty]}`}>
                {book.readingDifficulty === 'easy' ? 'Quick Read' : book.readingDifficulty === 'moderate' ? 'Standard' : 'Deep Read'}
              </span>
            )}
            {book.retailPrice && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-medium">
                {book.retailPrice.currencyCode === 'USD' ? '$' : book.retailPrice.currencyCode}{book.retailPrice.amount.toFixed(2)}
              </span>
            )}
            {book.hasEpub && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-medium">
                ePub
              </span>
            )}
          </div>

          {/* Text snippet or first sentence */}
          {(book.textSnippet || book.firstSentence || book.description) && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
              {(book.textSnippet || book.firstSentence || book.description || '').replace(/<[^>]*>/g, '')}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleActionClick}
          disabled={showAddButton && isInBookshelf}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            showAddButton
              ? isInBookshelf
                ? 'bg-success/10 text-success border border-success/20 cursor-not-allowed'
                : 'gradient-primary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg hover:scale-[1.02]'
              : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground hover:scale-[1.02]'
          }`}
        >
          {showAddButton ? (
            isInBookshelf ? (
              <>
                <Star className="w-3.5 h-3.5 fill-current" />
                In Library
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add to Shelf
              </>
            )
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </>
          )}
        </button>
      </div>
    </div>
  );
};
