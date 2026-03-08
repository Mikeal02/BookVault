
import { useState } from 'react';
import { Star, Plus, Trash2, Calendar, User, BookOpen } from 'lucide-react';
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

  return (
    <div className="group relative glass-card rounded-xl overflow-hidden cursor-pointer hover-lift">
      <div onClick={onSelect} className="p-4">
        {/* Cover with 3:4 aspect ratio */}
        <div className="relative mb-4 overflow-hidden rounded-lg aspect-[3/4]">
          <CoverImage book={book} className="w-full h-full rounded-lg" />
          {/* Hover overlay with book icon */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
            <div className="w-10 h-10 rounded-full bg-background/90 flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
          {/* Rating badge */}
          {book.averageRating && book.averageRating >= 4 && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center gap-1">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-semibold text-foreground">{book.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 leading-snug tracking-tight">
            {book.title}
          </h3>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="line-clamp-1 font-medium">{book.authors?.join(', ') || 'Unknown Author'}</span>
          </div>

          {book.publishedDate && (
            <div className="text-xs text-muted-foreground/70">
              {new Date(book.publishedDate).getFullYear()}
            </div>
          )}

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

          {book.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
              {book.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleActionClick}
          disabled={showAddButton && isInBookshelf}
          className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            showAddButton
              ? isInBookshelf
                ? 'bg-success/10 text-success border border-success/20 cursor-not-allowed'
                : 'gradient-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow-md'
              : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground'
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
