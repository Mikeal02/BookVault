
import { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, ExternalLink, ShoppingCart, Clock, Play, Settings, Layers, Tablet, BookMarked, Globe, Users, MapPin, Brain, Sparkles } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';


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
    return <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-36 h-52 sm:w-48 sm:h-72 rounded-xl shadow-2xl" />;
  }

  return (
    <img
      src={book.imageLinks.thumbnail}
      alt={book.title}
      className="w-36 h-52 sm:w-48 sm:h-72 object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
};

export const BookDetailsModal = ({
  book,
  onClose,
  onAddToBookshelf,
  onRemoveFromBookshelf,
  onUpdateBook,
  onStartReadingSession,
  onManageBook,
  onAIInsights,
  isInBookshelf
}: BookDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'purchase'>('overview');

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-warning fill-current'
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).getFullYear().toString();
  };

  const purchaseLinks = [
    {
      name: 'Google Books',
      url: book.infoLink || `https://books.google.com/books?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`,
      icon: '🔍',
      className: 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
    },
    {
      name: 'Google Play Books',
      url: book.buyLinks?.googlePlay || `https://play.google.com/store/search?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&c=books`,
      icon: '📱',
      className: 'bg-success/10 hover:bg-success/20 text-success border border-success/20'
    },
    {
      name: 'Amazon',
      url: book.buyLinks?.amazon || `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&i=digital-text`,
      icon: '📦',
      className: 'bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20'
    },
    {
      name: 'Barnes & Noble',
      url: book.buyLinks?.barnes || `https://www.barnesandnoble.com/s/${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`,
      icon: '📚',
      className: 'bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20'
    }
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl flex flex-col shadow-2xl animate-scale-in border border-border/80 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          overscrollBehavior: 'contain',
          maxHeight: '92dvh',
          height: 'auto',
        }}
      >
        {/* Top accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary z-10" />
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 flex-shrink-0 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2 pr-8 line-clamp-2">
                {book.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">
                By {book.authors?.join(', ') || 'Unknown Author'}
              </p>
              
              {/* Personal Info for Bookshelf Books */}
              {isInBookshelf && (book.readingStatus || book.personalRating || book.tags?.length) && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {book.readingStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      book.readingStatus === 'finished' ? 'bg-success/20 text-success' :
                      book.readingStatus === 'reading' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {book.readingStatus === 'not-read' ? '📚 To Read' : 
                       book.readingStatus === 'reading' ? '📖 Reading' : '✅ Finished'}
                    </span>
                  )}
                  {book.personalRating && book.personalRating > 0 && (
                    <div className="flex items-center bg-warning/10 px-3 py-1 rounded-full">
                      <span className="text-xs sm:text-sm text-warning mr-1">My Rating:</span>
                      <div className="flex">
                        {renderStars(book.personalRating)}
                      </div>
                    </div>
                  )}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {book.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs sm:text-sm">
                          #{tag}
                        </span>
                      ))}
                      {book.tags.length > 3 && (
                        <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">+{book.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-muted/50 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📖 Overview
                </button>
                <button
                  onClick={() => setActiveTab('purchase')}
                  className={`flex items-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeTab === 'purchase'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Purchase
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors duration-200 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', overflowY: 'scroll' }}>
            <div className="flex flex-col lg:flex-row">
              {/* Book Cover */}
              <div className="lg:w-1/3 p-4 sm:p-6 flex justify-center lg:justify-start bg-gradient-to-b from-muted/30 to-transparent flex-shrink-0">
                <div className="relative group">
                  <ModalCoverImage book={book} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick Info Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-xs sm:text-sm space-y-1">
                      {book.pageCount && (
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-1">📄</span>
                          {book.pageCount} pages
                        </div>
                      )}
                      {book.averageRating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-warning fill-current mr-1" />
                          <span className="text-muted-foreground">
                            {book.averageRating}/5
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="lg:w-2/3 p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Personal Notes (if in bookshelf) */}
                    {isInBookshelf && (book.myThoughts || book.notes) && (
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">💭</span>
                          My Personal Notes
                        </h4>
                        {book.myThoughts && (
                          <div className="mb-3">
                            <span className="text-xs sm:text-sm font-medium text-primary block mb-1">My Thoughts:</span>
                            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap bg-card/50 rounded p-3">{book.myThoughts}</p>
                          </div>
                        )}
                        {book.notes && (
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-primary block mb-1">Notes:</span>
                            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap bg-card/50 rounded p-3">{book.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Book Description */}
                    {book.description && (
                      <div className="bg-card/50 rounded-xl p-4 sm:p-5 border border-border">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">📚</span>
                          About this book
                        </h4>
                        <div 
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none text-xs sm:text-sm"
                          dangerouslySetInnerHTML={{ __html: book.description }}
                        />
                      </div>
                    )}

                    {/* Series Info */}
                    {book.seriesName && (
                      <div className="bg-accent/5 rounded-xl p-4 sm:p-5 border border-accent/10">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center text-sm sm:text-base">
                          <Layers className="w-4 h-4 mr-2 text-accent" />
                          Part of a Series
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{book.seriesName}</span>
                          {book.seriesPosition && <span> — Book #{book.seriesPosition}</span>}
                        </p>
                      </div>
                    )}

                    {/* Availability & Format */}
                    {(book.isEbook || book.hasEpub || book.hasPdf || book.freeReading || book.retailPrice || book.saleability) && (
                      <div className="bg-primary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <Tablet className="w-4 h-4 mr-2 text-primary" />
                          Availability & Formats
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {book.isEbook && (
                            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5">
                              <Tablet className="w-3 h-3" /> eBook Available
                            </span>
                          )}
                          {book.hasEpub && (
                            <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">ePub</span>
                          )}
                          {book.hasPdf && (
                            <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">PDF</span>
                          )}
                          {book.freeReading && (
                            <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium flex items-center gap-1.5">
                              <BookMarked className="w-3 h-3" /> Free to Borrow
                            </span>
                          )}
                          {book.saleability === 'FREE' && (
                            <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium">Free</span>
                          )}
                          {book.saleability === 'FOR_PREORDER' && (
                            <span className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium">Pre-order</span>
                          )}
                        </div>
                        {(book.retailPrice || book.listPrice) && (
                          <div className="flex items-center gap-3 text-sm">
                            {book.retailPrice && (
                              <span className="font-semibold text-foreground">
                                {book.retailPrice.currencyCode === 'USD' ? '$' : book.retailPrice.currencyCode + ' '}{book.retailPrice.amount.toFixed(2)}
                              </span>
                            )}
                            {book.listPrice && book.retailPrice && book.listPrice.amount > book.retailPrice.amount && (
                              <span className="text-muted-foreground line-through text-xs">
                                ${book.listPrice.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Preview */}
                    {(book.textSnippet || book.firstSentence) && (
                      <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border border-border">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">📝</span>
                          Preview
                        </h4>
                        {book.firstSentence && (
                          <div className="mb-3">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Opening Line</span>
                            <p className="text-sm text-foreground italic mt-1 border-l-2 border-primary/30 pl-3">
                              "{book.firstSentence}"
                            </p>
                          </div>
                        )}
                        {book.textSnippet && (
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Excerpt</span>
                            <p className="text-sm text-muted-foreground mt-1">{book.textSnippet}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Book Details */}
                    <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border border-border">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center text-sm sm:text-base">
                        <span className="mr-2">ℹ️</span>
                        Book Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {book.publishedDate && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Published</span>
                            <span className="text-foreground">{formatDate(book.publishedDate)}</span>
                          </div>
                        )}
                        {book.publisher && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Publisher</span>
                            <span className="text-foreground truncate">{book.publisher}</span>
                          </div>
                        )}
                        {book.pageCount && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Pages</span>
                            <span className="text-foreground">{book.pageCount}</span>
                          </div>
                        )}
                        {book.language && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Language</span>
                            <span className="text-foreground capitalize">{book.language}</span>
                          </div>
                        )}
                        {book.isbn13 && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">ISBN-13</span>
                            <span className="text-foreground font-mono text-xs">{book.isbn13}</span>
                          </div>
                        )}
                        {book.editionCount && book.editionCount > 1 && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Editions</span>
                            <span className="text-foreground">{book.editionCount} editions</span>
                          </div>
                        )}
                        {book.readingDifficulty && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground w-16">Level</span>
                            <span className={`text-foreground capitalize px-2 py-0.5 rounded text-xs font-medium ${
                              book.readingDifficulty === 'easy' ? 'bg-success/10 text-success' :
                              book.readingDifficulty === 'moderate' ? 'bg-primary/10 text-primary' :
                              'bg-secondary/10 text-secondary'
                            }`}>
                              {book.readingDifficulty === 'easy' ? 'Quick Read' : book.readingDifficulty === 'moderate' ? 'Standard' : 'Deep Read'}
                            </span>
                          </div>
                        )}
                        {book.maturityRating && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Maturity</span>
                            <span className="text-foreground">{book.maturityRating === 'MATURE' ? '🔞 Mature' : '✅ All Ages'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject People & Places */}
                    {(book.subjectPeople?.length || book.subjectPlaces?.length) && (
                      <div className="bg-secondary/5 rounded-xl p-4 sm:p-5 border border-secondary/10">
                        <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Featured In</h4>
                        {book.subjectPeople && book.subjectPeople.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                              <Users className="w-3.5 h-3.5" /> Characters & People
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {book.subjectPeople.map((person, i) => (
                                <span key={i} className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-medium">{person}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {book.subjectPlaces && book.subjectPlaces.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> Places & Settings
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {book.subjectPlaces.map((place, i) => (
                                <span key={i} className="px-2.5 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium">{place}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating */}
                    {book.averageRating && (
                      <div className="bg-warning/10 rounded-xl p-4 sm:p-5 border border-warning/20">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">⭐</span>
                          Community Rating
                        </h4>
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <div className="flex space-x-1">
                            {renderStars(book.averageRating)}
                          </div>
                          <span className="text-base sm:text-lg font-bold text-warning">
                            {book.averageRating}/5
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            ({book.ratingsCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {book.categories && book.categories.length > 0 && (
                      <div className="bg-primary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">🏷️</span>
                          Categories
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {book.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium hover:bg-primary/20 transition-colors"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reading Progress (if in bookshelf) */}
                    {isInBookshelf && book.readingProgress !== undefined && (
                      <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-xl p-4 sm:p-5 border border-success/20">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">📊</span>
                          Reading Progress
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="w-full bg-muted rounded-full h-3">
                                <div 
                                  className="gradient-primary h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${book.readingProgress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-base sm:text-lg font-bold text-success">
                              {Math.round(book.readingProgress)}%
                            </span>
                          </div>
                          {book.timeSpentReading && book.timeSpentReading > 0 && (
                            <div className="flex items-center text-xs sm:text-sm text-success bg-card/50 rounded p-2">
                              <Clock className="w-4 h-4 mr-2" />
                              Total reading time: {Math.floor(book.timeSpentReading / 60)}h {book.timeSpentReading % 60}m
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'purchase' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center text-sm sm:text-base">
                        <span className="mr-2">🛒</span>
                        Where to Buy
                      </h4>
                      <div className="grid gap-3 sm:gap-4">
                        {purchaseLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${link.className} flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:shadow-md`}
                          >
                            <div className="flex items-center">
                              <span className="text-xl sm:text-2xl mr-3">{link.icon}</span>
                              <div>
                                <span className="font-semibold text-sm sm:text-base">{link.name}</span>
                                <p className="text-xs opacity-75 mt-0.5 sm:mt-1">
                                  {link.name === 'Google Books' ? 'Read preview & info' :
                                   link.name === 'Google Play Books' ? 'Digital books & audiobooks' :
                                   link.name === 'Amazon' ? 'Print & digital editions' :
                                   'Print & digital books'}
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center text-sm sm:text-base">
                        <span className="mr-2">💡</span>
                        Smart Shopping Tips
                      </h4>
                      <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <li>• Compare prices across different platforms</li>
                        <li>• Check your local library's digital collection first</li>
                        <li>• Look for bundle deals on series or related books</li>
                        <li>• Consider audiobook versions for multitasking</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border/60 bg-gradient-to-r from-primary/3 via-muted/20 to-secondary/3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              {book.previewLink && (
                <a
                  href={book.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 bg-primary/10 rounded-lg hover:bg-primary/20"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Preview Book
                </a>
              )}
            </div>

            <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-3">
              {onAIInsights && (
                <Button
                  onClick={onAIInsights}
                  size="sm"
                  variant="outline"
                  className="border-accent/30 text-accent hover:bg-accent/10 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  AI Insights
                </Button>
              )}
              {isInBookshelf && onStartReadingSession && (
                <Button
                  onClick={onStartReadingSession}
                  size="sm"
                  className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Start Reading
                </Button>
              )}

              {isInBookshelf && onManageBook && (
                <Button
                  onClick={onManageBook}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Manage
                </Button>
              )}
              
              {isInBookshelf ? (
                <Button
                  onClick={() => onRemoveFromBookshelf(book.id)}
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={() => onAddToBookshelf(book)}
                  size="sm"
                  className="gradient-secondary text-secondary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Add to Library
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
