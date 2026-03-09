
import { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, ExternalLink, ShoppingCart, Clock, Play, Settings, Layers, Tablet, BookMarked, Globe, Users, MapPin, Brain, Sparkles, Loader2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { enrichBook, findSimilarBooks } from '@/services/googleBooks';
import { motion } from 'framer-motion';


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
  const [enrichedBook, setEnrichedBook] = useState<Book>(book);
  const [isEnriching, setIsEnriching] = useState(false);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Auto-enrich book with richer metadata on mount
  useEffect(() => {
    let cancelled = false;
    const doEnrich = async () => {
      setIsEnriching(true);
      try {
        const enriched = await enrichBook(book);
        if (!cancelled) setEnrichedBook(enriched);
      } catch {
        // Silently fail - we still have original book data
      } finally {
        if (!cancelled) setIsEnriching(false);
      }
    };
    doEnrich();
    return () => { cancelled = true; };
  }, [book.id]);

  // Fetch similar books
  useEffect(() => {
    let cancelled = false;
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const results = await findSimilarBooks(book, 10);
        if (!cancelled) setSimilarBooks(results);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoadingSimilar(false);
      }
    };
    fetchSimilar();
    return () => { cancelled = true; };
  }, [book.id]);

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

  // Use enriched data for display, original book for callbacks
  const displayBook = enrichedBook;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="frosted-panel rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl flex flex-col shadow-2xl animate-scale-in relative overflow-hidden"
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
                {displayBook.title}
                {isEnriching && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin text-muted-foreground" />}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">
                By {displayBook.authors?.join(', ') || 'Unknown Author'}
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
                  <ModalCoverImage book={displayBook} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick Info Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-xs sm:text-sm space-y-1">
                      {displayBook.pageCount && (
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-1">📄</span>
                          {displayBook.pageCount} pages
                        </div>
                      )}
                      {displayBook.averageRating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-warning fill-current mr-1" />
                          <span className="text-muted-foreground">
                            {displayBook.averageRating}/5
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
                    {isInBookshelf && (displayBook.myThoughts || displayBook.notes) && (
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">💭</span>
                          My Personal Notes
                        </h4>
                        {displayBook.myThoughts && (
                          <div className="mb-3">
                            <span className="text-xs sm:text-sm font-medium text-primary block mb-1">My Thoughts:</span>
                            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap bg-card/50 rounded p-3">{displayBook.myThoughts}</p>
                          </div>
                        )}
                        {displayBook.notes && (
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-primary block mb-1">Notes:</span>
                            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap bg-card/50 rounded p-3">{displayBook.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Book Description */}
                    {displayBook.description && (
                      <div className="bg-card/50 rounded-xl p-4 sm:p-5 border border-border">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">📚</span>
                          About this book
                        </h4>
                        <div 
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none text-xs sm:text-sm"
                          dangerouslySetInnerHTML={{ __html: displayBook.description }}
                        />
                      </div>
                    )}

                    {/* Series Info */}
                    {displayBook.seriesName && (
                      <div className="bg-accent/5 rounded-xl p-4 sm:p-5 border border-accent/10">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center text-sm sm:text-base">
                          <Layers className="w-4 h-4 mr-2 text-accent" />
                          Part of a Series
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{displayBook.seriesName}</span>
                          {displayBook.seriesPosition && <span> — Book #{displayBook.seriesPosition}</span>}
                        </p>
                      </div>
                    )}

                    {/* Availability & Format */}
                    {(displayBook.isEbook || displayBook.hasEpub || displayBook.hasPdf || displayBook.freeReading || displayBook.retailPrice || displayBook.saleability) && (
                      <div className="bg-primary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <Tablet className="w-4 h-4 mr-2 text-primary" />
                          Availability & Formats
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {displayBook.isEbook && (
                            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5">
                              <Tablet className="w-3 h-3" /> eBook Available
                            </span>
                          )}
                          {displayBook.hasEpub && (
                            <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">ePub</span>
                          )}
                          {displayBook.hasPdf && (
                            <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">PDF</span>
                          )}
                          {displayBook.freeReading && (
                            <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium flex items-center gap-1.5">
                              <BookMarked className="w-3 h-3" /> Free to Borrow
                            </span>
                          )}
                          {displayBook.saleability === 'FREE' && (
                            <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium">Free</span>
                          )}
                          {displayBook.saleability === 'FOR_PREORDER' && (
                            <span className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium">Pre-order</span>
                          )}
                        </div>
                        {(displayBook.retailPrice || displayBook.listPrice) && (
                          <div className="flex items-center gap-3 text-sm">
                            {displayBook.retailPrice && (
                              <span className="font-semibold text-foreground">
                                {displayBook.retailPrice.currencyCode === 'USD' ? '$' : displayBook.retailPrice.currencyCode + ' '}{displayBook.retailPrice.amount.toFixed(2)}
                              </span>
                            )}
                            {displayBook.listPrice && displayBook.retailPrice && displayBook.listPrice.amount > displayBook.retailPrice.amount && (
                              <span className="text-muted-foreground line-through text-xs">
                                ${displayBook.listPrice.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Preview */}
                    {(displayBook.textSnippet || displayBook.firstSentence) && (
                      <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border border-border">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">📝</span>
                          Preview
                        </h4>
                        {displayBook.firstSentence && (
                          <div className="mb-3">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Opening Line</span>
                            <p className="text-sm text-foreground italic mt-1 border-l-2 border-primary/30 pl-3">
                              "{displayBook.firstSentence}"
                            </p>
                          </div>
                        )}
                        {displayBook.textSnippet && (
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Excerpt</span>
                            <p className="text-sm text-muted-foreground mt-1">{displayBook.textSnippet}</p>
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
                        {displayBook.publishedDate && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Published</span>
                            <span className="text-foreground">{formatDate(displayBook.publishedDate)}</span>
                          </div>
                        )}
                        {displayBook.publisher && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Publisher</span>
                            <span className="text-foreground truncate">{displayBook.publisher}</span>
                          </div>
                        )}
                        {displayBook.pageCount && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Pages</span>
                            <span className="text-foreground">{displayBook.pageCount}</span>
                          </div>
                        )}
                        {displayBook.language && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Language</span>
                            <span className="text-foreground capitalize">{displayBook.language}</span>
                          </div>
                        )}
                        {displayBook.isbn13 && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">ISBN-13</span>
                            <span className="text-foreground font-mono text-xs">{displayBook.isbn13}</span>
                          </div>
                        )}
                        {displayBook.editionCount && displayBook.editionCount > 1 && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Editions</span>
                            <span className="text-foreground">{displayBook.editionCount} editions</span>
                          </div>
                        )}
                        {displayBook.readingDifficulty && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground w-16">Level</span>
                            <span className={`text-foreground capitalize px-2 py-0.5 rounded text-xs font-medium ${
                              displayBook.readingDifficulty === 'easy' ? 'bg-success/10 text-success' :
                              displayBook.readingDifficulty === 'moderate' ? 'bg-primary/10 text-primary' :
                              'bg-secondary/10 text-secondary'
                            }`}>
                              {displayBook.readingDifficulty === 'easy' ? 'Quick Read' : displayBook.readingDifficulty === 'moderate' ? 'Standard' : 'Deep Read'}
                            </span>
                          </div>
                        )}
                        {displayBook.maturityRating && (
                          <div className="flex items-center p-2 bg-card rounded gap-2">
                            <span className="font-medium text-muted-foreground w-20">Maturity</span>
                            <span className="text-foreground">{displayBook.maturityRating === 'MATURE' ? '🔞 Mature' : '✅ All Ages'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject People & Places */}
                    {(displayBook.subjectPeople?.length || displayBook.subjectPlaces?.length) && (
                      <div className="bg-secondary/5 rounded-xl p-4 sm:p-5 border border-secondary/10">
                        <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Featured In</h4>
                        {displayBook.subjectPeople && displayBook.subjectPeople.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                              <Users className="w-3.5 h-3.5" /> Characters & People
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {displayBook.subjectPeople.map((person, i) => (
                                <span key={i} className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-medium">{person}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {displayBook.subjectPlaces && displayBook.subjectPlaces.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> Places & Settings
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {displayBook.subjectPlaces.map((place, i) => (
                                <span key={i} className="px-2.5 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium">{place}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating */}
                    {displayBook.averageRating && (
                      <div className="bg-warning/10 rounded-xl p-4 sm:p-5 border border-warning/20">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">⭐</span>
                          Community Rating
                        </h4>
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <div className="flex space-x-1">
                            {renderStars(displayBook.averageRating)}
                          </div>
                          <span className="text-base sm:text-lg font-bold text-warning">
                            {displayBook.averageRating}/5
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            ({displayBook.ratingsCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {displayBook.categories && displayBook.categories.length > 0 && (
                      <div className="bg-primary/5 rounded-xl p-4 sm:p-5 border border-primary/10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                          <span className="mr-2">🏷️</span>
                          Categories
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {displayBook.categories.map((category, index) => (
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
                    {isInBookshelf && displayBook.readingProgress !== undefined && (
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
                                  style={{ width: `${displayBook.readingProgress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-base sm:text-lg font-bold text-success">
                              {Math.round(displayBook.readingProgress)}%
                            </span>
                          </div>
                          {displayBook.timeSpentReading && displayBook.timeSpentReading > 0 && (
                            <div className="flex items-center text-xs sm:text-sm text-success bg-card/50 rounded p-2">
                              <Clock className="w-4 h-4 mr-2" />
                              Total reading time: {Math.floor(displayBook.timeSpentReading / 60)}h {displayBook.timeSpentReading % 60}m
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

            {/* You Might Also Like */}
            {(similarBooks.length > 0 || loadingSimilar) && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-2xl p-4 sm:p-5 border border-primary/10 relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h4 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      You Might Also Like
                    </h4>
                    {loadingSimilar && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>

                  <div className="relative z-10">
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                      {loadingSimilar && similarBooks.length === 0 && (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex-shrink-0 w-[120px] snap-start">
                            <div className="aspect-[2/3] rounded-xl skeleton-gold mb-2" />
                            <div className="h-3 w-3/4 rounded skeleton-gold mb-1" />
                            <div className="h-2.5 w-1/2 rounded skeleton-gold" />
                          </div>
                        ))
                      )}
                      {similarBooks.map((similar, idx) => (
                        <motion.div
                          key={similar.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          className="flex-shrink-0 w-[120px] snap-start group/similar cursor-pointer"
                          onClick={() => {
                            onAddToBookshelf(similar);
                          }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-border/40 group-hover/similar:ring-primary/30 transition-all duration-300 shadow-sm group-hover/similar:shadow-lg mb-2">
                            {similar.imageLinks?.thumbnail ? (
                              <img
                                src={similar.imageLinks.thumbnail}
                                alt={similar.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/similar:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <BookCoverPlaceholder title={similar.title} author={similar.authors?.[0]} className="w-full h-full" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover/similar:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2">
                              <span className="px-2 py-1 bg-background/95 backdrop-blur-sm rounded-full text-[10px] font-semibold text-primary flex items-center gap-1 shadow-md">
                                <Plus className="w-2.5 h-2.5" /> Add
                              </span>
                            </div>
                            {similar.averageRating && similar.averageRating >= 4 && (
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-background/90 backdrop-blur-sm rounded-full flex items-center gap-0.5">
                                <Star className="w-2 h-2 text-primary fill-primary" />
                                <span className="text-[9px] font-bold">{similar.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <h5 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover/similar:text-primary transition-colors">
                            {similar.title}
                          </h5>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {similar.authors?.[0] || 'Unknown'}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border/60 bg-gradient-to-r from-primary/3 via-muted/20 to-secondary/3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              {displayBook.previewLink && (
                <a
                  href={displayBook.previewLink}
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
