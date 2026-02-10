
import { useState } from 'react';
import { Search, BookOpen, Filter, Settings, FileText, Bot, LayoutGrid, List, LayoutList } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { BookManagementModal } from './BookManagementModal';
import { NotesExport } from './NotesExport';
import { AIBookChat } from './AIBookChat';

interface MyBookshelfProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  onRemoveFromBookshelf: (bookId: string) => void;
  onUpdateBook: (book: Book) => void;
  onManageBook: (book: Book) => void;
}

export const MyBookshelf = ({ books, onBookSelect, onRemoveFromBookshelf, onUpdateBook, onManageBook }: MyBookshelfProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'dateAdded'>('title');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-read' | 'reading' | 'finished'>('all');
  const [showExport, setShowExport] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

  const filteredBooks = books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        book.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || book.readingStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.authors[0] || '').localeCompare(b.authors[0] || '');
        case 'rating':
          return (b.personalRating || 0) - (a.personalRating || 0);
        case 'dateAdded':
          return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
        default:
          return 0;
      }
    });

  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full gradient-primary/20 flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-muted-foreground mb-2">
          Your library awaits
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start building your personal collection by searching and adding books that inspire you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or tags..."
              className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-foreground placeholder-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-foreground"
              >
                <option value="all">All Books</option>
                <option value="not-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-foreground"
            >
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="rating">Sort by My Rating</option>
              <option value="dateAdded">Sort by Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {filteredBooks.length} of {books.length} books
          {filterStatus !== 'all' && ` (${filterStatus.replace('-', ' ')})`}
        </div>
        <div className="flex gap-2 items-center">
          {/* View Mode Toggle */}
          <div className="flex bg-muted/50 rounded-lg p-0.5">
            {[
              { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
              { mode: 'list' as const, icon: LayoutList, label: 'List' },
              { mode: 'compact' as const, icon: List, label: 'Compact' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 glass-card border border-border rounded-xl hover:bg-muted/50 transition-all text-sm font-medium text-foreground"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export Notes</span>
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-secondary text-white rounded-xl transition-all text-sm font-medium shadow-lg hover:opacity-90"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Books Display */}
      {filteredBooks.length > 0 ? (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <div key={book.id} className="group">
                  <BookCard
                    book={book}
                    onSelect={() => onBookSelect(book)}
                    onRemoveFromBookshelf={() => onRemoveFromBookshelf(book.id)}
                    isInBookshelf={true}
                    showAddButton={false}
                  />
                  <button
                    onClick={() => onManageBook(book)}
                    className="w-full mt-2 py-2 px-4 gradient-primary text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:opacity-90"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 hover-lift cursor-pointer group"
                  onClick={() => onBookSelect(book)}
                >
                  <img
                    src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground line-clamp-1">{book.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{book.authors?.join(', ')}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        book.readingStatus === 'finished' ? 'bg-success/20 text-success' :
                        book.readingStatus === 'reading' ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {book.readingStatus === 'not-read' ? 'To Read' : book.readingStatus === 'reading' ? 'Reading' : 'Finished'}
                      </span>
                      {book.personalRating && book.personalRating > 0 && (
                        <span className="text-xs text-warning">{'★'.repeat(book.personalRating)}</span>
                      )}
                      {book.pageCount && (
                        <span className="text-xs text-muted-foreground">{book.pageCount} pages</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onManageBook(book); }}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'compact' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Title</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Author</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Rating</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Pages</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => onBookSelect(book)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                            alt=""
                            className="w-8 h-12 object-cover rounded flex-shrink-0"
                          />
                          <span className="font-medium text-sm line-clamp-1">{book.title}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell line-clamp-1">
                        {book.authors?.[0] || 'Unknown'}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          book.readingStatus === 'finished' ? 'bg-success/20 text-success' :
                          book.readingStatus === 'reading' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {book.readingStatus === 'not-read' ? 'To Read' : book.readingStatus === 'reading' ? 'Reading' : 'Done'}
                        </span>
                      </td>
                      <td className="p-3 text-sm hidden lg:table-cell">
                        {book.personalRating && book.personalRating > 0
                          ? <span className="text-warning">{'★'.repeat(book.personalRating)}</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {book.pageCount || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onManageBook(book); }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            No books found matching "{searchQuery}"
            {filterStatus !== 'all' && ` in ${filterStatus.replace('-', ' ')} status`}
          </p>
        </div>
      )}

      {/* Modals */}
      {showExport && <NotesExport books={books} onClose={() => setShowExport(false)} />}
      {showAIChat && <AIBookChat books={books} onClose={() => setShowAIChat(false)} />}
    </div>
  );
};
