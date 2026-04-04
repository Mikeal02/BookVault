
import { useState } from 'react';
import { Search, BookOpen, Filter, Settings, FileText, Bot, LayoutGrid, List, LayoutList, Layers, Calendar, Image, SlidersHorizontal } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { BookManagementModal } from './BookManagementModal';
import { NotesExport } from './NotesExport';
import { AIBookChat } from './AIBookChat';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { EmptyState } from './EmptyState';
import { VaultSwitcher } from './VaultSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Vault } from '@/hooks/useVaults';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { BookManagementModal } from './BookManagementModal';
import { NotesExport } from './NotesExport';
import { AIBookChat } from './AIBookChat';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

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
    'from-[hsl(222,72%,52%)] to-[hsl(250,65%,42%)]',
    'from-[hsl(340,65%,58%)] to-[hsl(320,55%,45%)]',
    'from-[hsl(162,68%,36%)] to-[hsl(170,60%,28%)]',
    'from-[hsl(38,92%,52%)] to-[hsl(28,80%,42%)]',
    'from-[hsl(280,60%,55%)] to-[hsl(260,55%,42%)]',
    'from-[hsl(190,70%,45%)] to-[hsl(200,65%,35%)]',
    'from-[hsl(10,80%,55%)] to-[hsl(0,70%,42%)]',
  ];

  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden" style={{ perspective: '1000px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/40 rounded-2xl" />
        {[0, 1].map(row => {
          const rowBooks = books.slice(row * Math.ceil(books.length / 2), (row + 1) * Math.ceil(books.length / 2));
          if (rowBooks.length === 0) return null;
          return (
            <div key={row} className="relative">
              <div className="flex items-end gap-[2px] overflow-x-auto px-6 pt-6 pb-0 min-h-[200px]">
                {rowBooks.map((book, i) => {
                  const height = Math.max(150, Math.min(200, (book.pageCount || 250) * 0.45));
                  const width = Math.max(30, Math.min(52, (book.pageCount || 250) * 0.12));
                  return (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 40, rotateY: -25 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ delay: (row * rowBooks.length + i) * 0.025, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => onSelect(book)}
                      onDoubleClick={() => onManage(book)}
                      className="group cursor-pointer flex-shrink-0 relative"
                      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
                    >
                      <motion.div
                        whileHover={{ rotateY: -15, translateY: -8, translateZ: 10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div
                          className={`relative bg-gradient-to-b ${spineColors[i % spineColors.length]} rounded-[2px] shadow-lg group-hover:shadow-xl transition-shadow`}
                          style={{ width: `${width}px`, height: `${height}px` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <span
                              className="text-[9px] font-bold text-white/90 drop-shadow-sm whitespace-nowrap"
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: `${height - 20}px`, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {book.title}
                            </span>
                          </div>
                          <div className="absolute top-2 left-0 right-0 h-px bg-white/15" />
                          <div className="absolute bottom-2 left-0 right-0 h-px bg-white/15" />
                          <div className="absolute top-0 right-0 w-[4px] h-full bg-black/20 rounded-r-[2px]" />
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/25 rounded-t-[2px]" />
                          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/10" />
                        </div>
                        <div
                          className="absolute top-0 h-full bg-card/90 border border-border/40 rounded-r-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden"
                          style={{ left: `${width}px`, width: `${Math.max(60, width * 2)}px`, transformOrigin: 'left center', transform: 'rotateY(-5deg)' }}
                        >
                          {book.imageLinks?.thumbnail ? (
                            <img src={book.imageLinks.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-1">
                              <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full text-[8px]" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        <p className="font-semibold">{book.title}</p>
                        <p className="opacity-70 text-[10px]">{book.authors?.[0]}</p>
                        {book.readingStatus === 'finished' && <p className="text-success text-[10px] mt-0.5">✓ Finished</p>}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="relative h-4 mx-2">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-800/40 via-amber-900/30 to-amber-950/20 dark:from-amber-800/20 dark:via-amber-900/15 dark:to-amber-950/10 rounded-b-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)]" />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-700/20 to-transparent" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Timeline View ──
const TimelineView = ({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) => {
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
    <div className="relative pl-10">
      <div className="absolute left-4 top-0 bottom-0 w-[2px]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-secondary/50 to-transparent rounded-full" />
        <motion.div
          className="absolute left-0 w-[2px] h-8 bg-gradient-to-b from-primary to-transparent rounded-full"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {entries.map(([month, monthBooks], gi) => (
        <motion.div
          key={month}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: gi * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 relative"
        >
          <div className="absolute -left-[26px] top-1 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: gi * 0.08 + 0.1, type: 'spring', stiffness: 300 }}
              className="w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] ring-4 ring-background"
            />
          </div>
          <div className="glass-card rounded-xl p-4 ml-2">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="gradient-text">{month}</span>
              <span className="text-[10px] text-muted-foreground font-normal">({monthBooks.length} book{monthBooks.length > 1 ? 's' : ''})</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {monthBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onSelect(book)}
                  className="flex-shrink-0 w-28 cursor-pointer group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-border/40 group-hover:ring-primary/50 transition-all duration-300 shadow-sm group-hover:shadow-xl mb-1.5">
                    {book.imageLinks?.thumbnail ? (
                      <img src={book.imageLinks.thumbnail} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full" />
                    )}
                    {book.readingStatus === 'finished' && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-success/90 flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">✓</span>
                      </div>
                    )}
                    {book.readingStatus === 'reading' && book.readingProgress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${book.readingProgress}%` }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">{book.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{book.authors?.[0]}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ── Cover Wall View ──
const CoverWallView = ({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) => {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2.5 space-y-2.5">
      {books.map((book, i) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.015, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => onSelect(book)}
          className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            {book.imageLinks?.thumbnail ? (
              <img src={book.imageLinks.thumbnail} alt={book.title} className="w-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110" loading="lazy" />
            ) : (
              <div className="aspect-[2/3]">
                <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full rounded-xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-end p-3">
              <motion.div initial={{ y: 8, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="w-full">
                <p className="text-xs font-bold text-background line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[10px] text-background/70 mt-0.5">{book.authors?.[0]}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {book.readingStatus === 'finished' && <span className="px-1.5 py-0.5 rounded-full bg-success/90 text-[9px] font-bold text-white">✓ Done</span>}
                  {book.readingStatus === 'reading' && <span className="px-1.5 py-0.5 rounded-full bg-primary/90 text-[9px] font-bold text-white">{Math.round(book.readingProgress || 0)}%</span>}
                  {book.personalRating && book.personalRating > 0 && <span className="text-[10px] text-warning">{'★'.repeat(book.personalRating)}</span>}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ── List View ──
const ListView = ({ books, onSelect, onManage }: { books: Book[]; onSelect: (b: Book) => void; onManage: (b: Book) => void }) => (
  <div className="space-y-2">
    {books.map((book, i) => (
      <motion.div
        key={book.id}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => onSelect(book)}
        className="flex items-center gap-4 p-3.5 rounded-xl glass-card hover:border-primary/15 cursor-pointer group transition-all duration-200"
      >
        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-border/40">
          {book.imageLinks?.thumbnail ? (
            <img src={book.imageLinks.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-full h-full text-[8px]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{book.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.authors?.join(', ')}</p>
          {book.readingStatus === 'reading' && book.readingProgress !== undefined && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${book.readingProgress}%` }} />
              </div>
              <span className="text-[10px] font-bold text-primary">{Math.round(book.readingProgress)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {book.personalRating ? (
            <span className="text-xs text-warning font-bold">{'★'.repeat(book.personalRating)}</span>
          ) : null}
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
            book.readingStatus === 'finished' ? 'bg-success/10 text-success' :
            book.readingStatus === 'reading' ? 'bg-primary/10 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {book.readingStatus === 'finished' ? '✓ Done' : book.readingStatus === 'reading' ? 'Reading' : 'To Read'}
          </span>
        </div>
      </motion.div>
    ))}
  </div>
);

// ── Compact Table View ──
const CompactView = ({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border/50">
          <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Book</th>
          <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Author</th>
          <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</th>
          <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Rating</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, i) => (
          <motion.tr
            key={book.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onSelect(book)}
            className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors group"
          >
            <td className="px-4 py-3">
              <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{book.title}</p>
            </td>
            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
              <p className="line-clamp-1 text-xs">{book.authors?.[0]}</p>
            </td>
            <td className="px-4 py-3">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                book.readingStatus === 'finished' ? 'bg-success/10 text-success' :
                book.readingStatus === 'reading' ? 'bg-primary/10 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {book.readingStatus === 'finished' ? 'Done' : book.readingStatus === 'reading' ? 'Reading' : 'TBR'}
              </span>
            </td>
            <td className="px-4 py-3 hidden md:table-cell">
              {book.personalRating ? <span className="text-warning text-xs">{'★'.repeat(book.personalRating)}</span> : <span className="text-muted-foreground/40">—</span>}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const MyBookshelf = ({ books, onBookSelect, onRemoveFromBookshelf, onUpdateBook, onManageBook }: MyBookshelfProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'dateAdded'>('title');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-read' | 'reading' | 'finished'>('all');
  const [showExport, setShowExport] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal({ threshold: 0.05 });

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

  const statusCounts = {
    all: books.length,
    'not-read': books.filter(b => b.readingStatus === 'not-read').length,
    reading: books.filter(b => b.readingStatus === 'reading').length,
    finished: books.filter(b => b.readingStatus === 'finished').length,
  };

  return (
    <div className="space-y-5">
      {/* Header — scroll revealed */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 18 }}
        animate={headerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-md logo-glow flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold gradient-text">My Library</h2>
            <p className="text-xs text-muted-foreground/60 font-medium">
              <span className="text-primary font-bold">{books.length}</span> books · <span className="text-success font-bold">{statusCounts.finished}</span> finished · <span className="text-warning font-bold">{statusCounts.reading}</span> reading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all chip"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all chip"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
        </div>
      </motion.div>

      {/* Search, filter, view controls — all in one refined panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card surface-card rounded-2xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by title, author, or tag…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="pl-8 pr-8 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="title">Title A–Z</option>
              <option value="author">Author</option>
              <option value="rating">Rating</option>
              <option value="dateAdded">Date Added</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-muted/50 border border-border/60 rounded-xl">
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  viewMode === mode
                    ? 'text-primary'
                    : 'text-muted-foreground/50 hover:text-foreground'
                }`}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="shelf-view-active"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg"
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  />
                )}
                <Icon className="relative z-10 w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {(['all', 'reading', 'finished', 'not-read'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                filterStatus === status
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filterStatus === status && (
                <motion.div
                  layoutId="status-filter-bg"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                />
              )}
              <span className="relative z-10 capitalize">
                {status === 'not-read' ? 'To Read' : status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                {' '}
                <span className={`${filterStatus === status ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
                  {statusCounts[status]}
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      {filteredBooks.length !== books.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground/60 px-1"
        >
          Showing <span className="font-bold text-primary">{filteredBooks.length}</span> of {books.length} books
        </motion.p>
      )}

      {/* Book grid / view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.5), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <BookCard
                    book={book}
                    onSelect={() => onBookSelect(book)}
                    onRemoveFromBookshelf={() => onRemoveFromBookshelf(book.id)}
                    isInBookshelf={true}
                    showAddButton={false}
                  />
                </motion.div>
              ))}
            </div>
          )}
          {viewMode === 'list' && <ListView books={filteredBooks} onSelect={onBookSelect} onManage={onManageBook} />}
          {viewMode === 'compact' && <CompactView books={filteredBooks} onSelect={onBookSelect} />}
          {viewMode === 'spine' && <SpineView books={filteredBooks} onSelect={onBookSelect} onManage={onManageBook} />}
          {viewMode === 'timeline' && <TimelineView books={filteredBooks} onSelect={onBookSelect} />}
          {viewMode === 'wall' && <CoverWallView books={filteredBooks} onSelect={onBookSelect} />}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {showExport && (
        <NotesExport books={books} onClose={() => setShowExport(false)} />
      )}
      {showAIChat && (
        <AIBookChat books={books} onClose={() => setShowAIChat(false)} />
      )}
    </div>
  );
};
