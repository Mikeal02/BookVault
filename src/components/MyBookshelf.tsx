
import { useState } from 'react';
import { Search, BookOpen, Filter, Settings, FileText, Bot, LayoutGrid, List, LayoutList, Layers, Calendar, Image } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { BookManagementModal } from './BookManagementModal';
import { NotesExport } from './NotesExport';
import { AIBookChat } from './AIBookChat';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

interface MyBookshelfProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  onRemoveFromBookshelf: (bookId: string) => void;
  onUpdateBook: (book: Book) => void;
  onManageBook: (book: Book) => void;
}

type ViewMode = 'grid' | 'list' | 'compact' | 'spine' | 'timeline' | 'wall';

const viewModes = [
  { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
  { mode: 'list' as ViewMode, icon: LayoutList, label: 'List' },
  { mode: 'compact' as ViewMode, icon: List, label: 'Table' },
  { mode: 'spine' as ViewMode, icon: Layers, label: 'Spine' },
  { mode: 'timeline' as ViewMode, icon: Calendar, label: 'Timeline' },
  { mode: 'wall' as ViewMode, icon: Image, label: 'Wall' },
];

// ── Spine View ──
const SpineView = ({ books, onSelect, onManage }: { books: Book[]; onSelect: (b: Book) => void; onManage: (b: Book) => void }) => {
  const spineColors = [
    'from-primary/80 to-primary/60',
    'from-secondary/80 to-secondary/60',
    'from-accent/80 to-accent/60',
    'from-success/80 to-success/60',
    'from-warning/80 to-warning/60',
    'from-primary/60 to-secondary/40',
    'from-secondary/60 to-accent/40',
  ];

  return (
    <div className="relative">
      {/* Shelf background */}
      <div className="bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl p-6 border border-border/30">
        <div className="flex items-end gap-1 overflow-x-auto pb-4 min-h-[220px]">
          {books.map((book, i) => {
            const height = Math.max(140, Math.min(220, (book.pageCount || 250) * 0.5));
            const width = Math.max(28, Math.min(48, (book.pageCount || 250) * 0.1));
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 40, rotateY: -30 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onSelect(book)}
                className="group cursor-pointer flex-shrink-0 relative"
                style={{ perspective: '400px' }}
              >
                <div
                  className={`relative bg-gradient-to-b ${spineColors[i % spineColors.length]} rounded-sm shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-[-2deg]`}
                  style={{ width: `${width}px`, height: `${height}px` }}
                >
                  {/* Spine text */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <span
                      className="text-[9px] font-bold text-primary-foreground whitespace-nowrap"
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        maxHeight: `${height - 16}px`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {book.title}
                    </span>
                  </div>
                  {/* 3D edge */}
                  <div className="absolute top-0 right-0 w-[3px] h-full bg-black/10 rounded-r-sm" />
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 rounded-t-sm" />
                </div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <p className="font-semibold">{book.title}</p>
                  <p className="opacity-70 text-[10px]">{book.authors?.[0]}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Shelf plank */}
        <div className="h-3 bg-gradient-to-b from-border/60 to-border/30 rounded-b-lg shadow-inner -mx-2" />
      </div>
    </div>
  );
};

// ── Timeline View ──
const TimelineView = ({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) => {
  // Group books by month
  const grouped = books.reduce((acc, book) => {
    const date = book.dateAdded || book.dateFinished || book.dateStarted;
    const key = date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown Date';
    if (!acc[key]) acc[key] = [];
    acc[key].push(book);
    return acc;
  }, {} as Record<string, Book[]>);

  const entries = Object.entries(grouped).sort((a, b) => {
    const dateA = new Date(a[1][0]?.dateAdded || 0);
    const dateB = new Date(b[1][0]?.dateAdded || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/30 to-transparent" />

      {entries.map(([month, monthBooks], gi) => (
        <motion.div
          key={month}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: gi * 0.1, duration: 0.4 }}
          className="mb-8 relative"
        >
          {/* Dot on timeline */}
          <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />

          <h3 className="text-sm font-bold text-foreground mb-3">{month}</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {monthBooks.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: gi * 0.1 + i * 0.05 }}
                onClick={() => onSelect(book)}
                className="flex-shrink-0 w-24 cursor-pointer group"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-border/40 group-hover:ring-primary/40 transition-all shadow-sm group-hover:shadow-lg mb-1.5">
                  {book.imageLinks?.thumbnail ? (
                    <img src={book.imageLinks.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full" />
                  )}
                </div>
                <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{book.authors?.[0]}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ── Cover Wall View (Masonry) ──
const CoverWallView = ({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) => {
  // Simple masonry: alternate between 2 sizes
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2 space-y-2">
      {books.map((book, i) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => onSelect(book)}
          className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
        >
          <div className="relative">
            {book.imageLinks?.thumbnail ? (
              <img
                src={book.imageLinks.thumbnail}
                alt={book.title}
                className="w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[2/3]">
                <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full rounded-xl" />
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-3">
              <div>
                <p className="text-xs font-bold text-background line-clamp-2">{book.title}</p>
                <p className="text-[10px] text-background/70">{book.authors?.[0]}</p>
                {book.readingStatus === 'finished' && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-success/90 text-[9px] font-bold text-white">✓ Done</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const MyBookshelf = ({ books, onBookSelect, onRemoveFromBookshelf, onUpdateBook, onManageBook }: MyBookshelfProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'dateAdded'>('title');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-read' | 'reading' | 'finished'>('all');
  const [showExport, setShowExport] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        case 'title': return a.title.localeCompare(b.title);
        case 'author': return (a.authors[0] || '').localeCompare(b.authors[0] || '');
        case 'rating': return (b.personalRating || 0) - (a.personalRating || 0);
        case 'dateAdded': return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
        default: return 0;
      }
    });

  if (books.length === 0) {
    return (
      <EmptyState
        type="books"
        title="Your library awaits"
        description="Start building your personal collection by searching and adding books that inspire you."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or tags..."
              className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-foreground placeholder-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-foreground"
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
              className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-foreground"
            >
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="rating">Sort by My Rating</option>
              <option value="dateAdded">Sort by Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary and View Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {filteredBooks.length} of {books.length} books
          {filterStatus !== 'all' && ` (${filterStatus.replace('-', ' ')})`}
        </div>
        <div className="flex gap-2 items-center">
          {/* View Mode Toggle — elite with animation */}
          <div className="flex bg-muted/40 rounded-xl p-0.5 gap-0.5">
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  viewMode === mode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={label}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="view-mode-active"
                    className="absolute inset-0 bg-card shadow-sm rounded-lg border border-border/50"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-2 glass-card border border-border rounded-xl hover:bg-muted/50 transition-all text-sm font-medium text-foreground"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            className="flex items-center gap-2 px-3 py-2 gradient-secondary text-white rounded-xl transition-all text-sm font-medium shadow-lg hover:opacity-90"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
        </div>
      </div>

      {/* Books Display with animated view transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
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
                <div className="space-y-2">
                  {filteredBooks.map((book, i) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)] cursor-pointer group transition-all"
                      onClick={() => onBookSelect(book)}
                    >
                      <img
                        src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0 transition-transform group-hover:scale-105"
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
                    </motion.div>
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
                              <img src={book.imageLinks?.thumbnail || '/placeholder.svg'} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                              <span className="font-medium text-sm line-clamp-1">{book.title}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell line-clamp-1">{book.authors?.[0] || 'Unknown'}</td>
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
                            {book.personalRating && book.personalRating > 0 ? <span className="text-warning">{'★'.repeat(book.personalRating)}</span> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{book.pageCount || '—'}</td>
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

              {viewMode === 'spine' && (
                <SpineView books={filteredBooks} onSelect={onBookSelect} onManage={onManageBook} />
              )}

              {viewMode === 'timeline' && (
                <TimelineView books={filteredBooks} onSelect={onBookSelect} />
              )}

              {viewMode === 'wall' && (
                <CoverWallView books={filteredBooks} onSelect={onBookSelect} />
              )}
            </>
          ) : (
            <EmptyState
              type="search"
              title="No books found"
              description={`No books matching "${searchQuery}"${filterStatus !== 'all' ? ` in ${filterStatus.replace('-', ' ')} status` : ''}`}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {showExport && <NotesExport books={books} onClose={() => setShowExport(false)} />}
      {showAIChat && <AIBookChat books={books} onClose={() => setShowAIChat(false)} />}
    </div>
  );
};
