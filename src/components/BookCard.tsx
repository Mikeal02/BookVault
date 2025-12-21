
import { Star, Plus, Trash2, Calendar, User } from 'lucide-react';
import { Book } from '@/types/book';

interface BookCardProps {
  book: Book;
  onSelect: () => void;
  onAddToBookshelf?: () => void;
  onRemoveFromBookshelf?: () => void;
  isInBookshelf: boolean;
  showAddButton: boolean;
}

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
    <div className="glass-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer hover-lift">
      <div onClick={onSelect} className="p-4">
        <div className="relative mb-4">
          <img
            src={book.imageLinks?.thumbnail || '/placeholder.svg'}
            alt={book.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight">
            {book.title}
          </h3>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            <span className="line-clamp-1">{book.authors?.join(', ') || 'Unknown Author'}</span>
          </div>

          {book.publishedDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{new Date(book.publishedDate).getFullYear()}</span>
            </div>
          )}

          {book.averageRating && (
            <div className="flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(book.averageRating!)
                        ? 'text-highlight fill-current'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-xs text-muted-foreground">
                ({book.ratingsCount || 0})
              </span>
            </div>
          )}

          {book.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {book.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleActionClick}
          disabled={showAddButton && isInBookshelf}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center ${
            showAddButton
              ? isInBookshelf
                ? 'bg-success/20 text-success cursor-not-allowed'
                : 'gradient-primary text-white hover:opacity-90 shadow-md hover:shadow-lg'
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg'
          }`}
        >
          {showAddButton ? (
            isInBookshelf ? (
              <>
                <Star className="w-4 h-4 mr-2 fill-current" />
                In Library
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Shelf
              </>
            )
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </>
          )}
        </button>
      </div>
    </div>
  );
};
