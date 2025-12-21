
import { useState } from 'react';
import { Search, BookOpen, Filter, Settings, FileText, Bot } from 'lucide-react';
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
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {filteredBooks.length} of {books.length} books
          {filterStatus !== 'all' && ` (${filterStatus.replace('-', ' ')})`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 glass-card border border-border rounded-xl hover:bg-muted/50 transition-all text-sm font-medium text-foreground"
          >
            <FileText className="w-4 h-4" />
            Export Notes
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-secondary text-white rounded-xl transition-all text-sm font-medium shadow-lg hover:opacity-90"
          >
            <Bot className="w-4 h-4" />
            AI Assistant
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
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
