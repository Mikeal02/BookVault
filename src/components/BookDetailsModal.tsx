
import { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, ExternalLink, ShoppingCart, Clock, Play, Settings } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BookDetailsModalProps {
  book: Book;
  onClose: () => void;
  onAddToBookshelf: (book: Book) => void;
  onRemoveFromBookshelf: (bookId: string) => void;
  onUpdateBook: (book: Book) => void;
  onStartReadingSession?: () => void;
  onManageBook?: () => void;
  isInBookshelf: boolean;
}

export const BookDetailsModal = ({
  book,
  onClose,
  onAddToBookshelf,
  onRemoveFromBookshelf,
  onUpdateBook,
  onStartReadingSession,
  onManageBook,
  isInBookshelf
}: BookDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'purchase'>('overview');

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
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
      className: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    },
    {
      name: 'Google Play Books',
      url: book.buyLinks?.googlePlay || `https://play.google.com/store/search?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&c=books`,
      icon: '📱',
      className: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
    },
    {
      name: 'Amazon',
      url: book.buyLinks?.amazon || `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}&i=digital-text`,
      icon: '📦',
      className: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
    },
    {
      name: 'Barnes & Noble',
      url: book.buyLinks?.barnes || `https://www.barnesandnoble.com/s/${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`,
      icon: '📚',
      className: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
    }
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 pr-8">
                {book.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                By {book.authors?.join(', ') || 'Unknown Author'}
              </p>
              
              {/* Personal Info for Bookshelf Books */}
              {isInBookshelf && (book.readingStatus || book.personalRating || book.tags?.length) && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {book.readingStatus && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      book.readingStatus === 'finished' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      book.readingStatus === 'reading' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {book.readingStatus === 'not-read' ? '📚 To Read' : 
                       book.readingStatus === 'reading' ? '📖 Reading' : '✅ Finished'}
                    </span>
                  )}
                  {book.personalRating && book.personalRating > 0 && (
                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 mr-1">My Rating:</span>
                      <div className="flex">
                        {renderStars(book.personalRating)}
                      </div>
                    </div>
                  )}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {book.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                      {book.tags.length > 3 && (
                        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">+{book.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-white/60 dark:bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📖 Overview
                </button>
                <button
                  onClick={() => setActiveTab('purchase')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'purchase'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Purchase
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Book Cover */}
          <div className="lg:w-1/3 p-6 flex justify-center lg:justify-start bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 flex-shrink-0">
            <div className="relative group">
              <img
                src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                alt={book.title}
                className="w-48 h-72 object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Quick Info Overlay */}
              <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-sm space-y-1">
                  {book.pageCount && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="mr-1">📄</span>
                      {book.pageCount} pages
                    </div>
                  )}
                  {book.averageRating && (
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {book.averageRating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Book Details - Fixed Scroll Area */}
          <div className="lg:w-2/3 flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(95vh-300px)]">
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Personal Notes (if in bookshelf) */}
                    {isInBookshelf && (book.myThoughts || book.notes) && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center">
                          <span className="mr-2">💭</span>
                          My Personal Notes
                        </h4>
                        {book.myThoughts && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300 block mb-1">My Thoughts:</span>
                            <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap bg-white/50 dark:bg-gray-800/50 rounded p-3">{book.myThoughts}</p>
                          </div>
                        )}
                        {book.notes && (
                          <div>
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300 block mb-1">Notes:</span>
                            <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap bg-white/50 dark:bg-gray-800/50 rounded p-3">{book.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Book Description */}
                    {book.description && (
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <span className="mr-2">📚</span>
                          About this book
                        </h4>
                        <div 
                          className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: book.description }}
                        />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="mr-2">ℹ️</span>
                        Book Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {book.publishedDate && (
                          <div className="flex items-center p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Published:</span>
                            <span className="text-gray-900 dark:text-white">{formatDate(book.publishedDate)}</span>
                          </div>
                        )}
                        {book.publisher && (
                          <div className="flex items-center p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Publisher:</span>
                            <span className="text-gray-900 dark:text-white">{book.publisher}</span>
                          </div>
                        )}
                        {book.pageCount && (
                          <div className="flex items-center p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Pages:</span>
                            <span className="text-gray-900 dark:text-white">{book.pageCount}</span>
                          </div>
                        )}
                        {book.language && (
                          <div className="flex items-center p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Language:</span>
                            <span className="text-gray-900 dark:text-white capitalize">{book.language}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    {book.averageRating && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center">
                          <span className="mr-2">⭐</span>
                          Community Rating
                        </h4>
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            {renderStars(book.averageRating)}
                          </div>
                          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                            {book.averageRating}/5
                          </span>
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">
                            ({book.ratingsCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {book.categories && book.categories.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                          <span className="mr-2">🏷️</span>
                          Categories
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {book.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reading Progress (if in bookshelf) */}
                    {isInBookshelf && book.readingProgress !== undefined && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
                          <span className="mr-2">📊</span>
                          Reading Progress
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="w-full bg-green-200 dark:bg-green-700 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${book.readingProgress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {Math.round(book.readingProgress)}%
                            </span>
                          </div>
                          {book.timeSpentReading && book.timeSpentReading > 0 && (
                            <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-white/50 dark:bg-gray-800/50 rounded p-2">
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
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="mr-2">🛒</span>
                        Where to Buy
                      </h4>
                      <div className="grid gap-4">
                        {purchaseLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${link.className} flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md`}
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{link.icon}</span>
                              <div>
                                <span className="font-semibold">{link.name}</span>
                                <p className="text-xs opacity-75 mt-1">
                                  {link.name === 'Google Books' ? 'Read preview & info' :
                                   link.name === 'Google Play Books' ? 'Digital books & audiobooks' :
                                   link.name === 'Amazon' ? 'Print & digital editions' :
                                   'Print & digital books'}
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                        <span className="mr-2">💡</span>
                        Smart Shopping Tips
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Compare prices across different platforms</li>
                        <li>• Check your local library's digital collection first</li>
                        <li>• Look for bundle deals on series or related books</li>
                        <li>• Consider audiobook versions for multitasking</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              {book.previewLink && (
                <a
                  href={book.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Book
                </a>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {isInBookshelf && onStartReadingSession && (
                <Button
                  onClick={onStartReadingSession}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Reading Session
                </Button>
              )}

              {isInBookshelf && onManageBook && (
                <Button
                  onClick={onManageBook}
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Book
                </Button>
              )}
              
              {isInBookshelf ? (
                <Button
                  onClick={() => onRemoveFromBookshelf(book.id)}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from Library
                </Button>
              ) : (
                <Button
                  onClick={() => onAddToBookshelf(book)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
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
