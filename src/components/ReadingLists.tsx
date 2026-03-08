
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, BookOpen, GripVertical, ChevronDown, ChevronRight, MoreHorizontal, FolderPlus, X, Check, Palette } from 'lucide-react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingList {
  id: string;
  name: string;
  description: string | null;
  cover_color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  items: ReadingListItem[];
}

interface ReadingListItem {
  id: string;
  book_id: string;
  sort_order: number;
  notes: string | null;
  added_at: string;
}

interface ReadingListsProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

const LIST_ICONS = ['📚', '🔥', '⭐', '💎', '🌙', '🎯', '🏆', '🌊', '🌺', '🎭', '🧠', '💡', '🚀', '🎨', '📖', '🌟'];
const LIST_COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1', '#eab308', '#22c55e'];

export const ReadingLists = ({ books, onBookSelect }: ReadingListsProps) => {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<string | null>(null);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIcon, setNewListIcon] = useState('📚');
  const [newListColor, setNewListColor] = useState('#14b8a6');
  const [showAddBookTo, setShowAddBookTo] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: listsData, error: listsError } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');

      if (listsError) throw listsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('reading_list_items')
        .select('*')
        .in('list_id', (listsData || []).map(l => l.id))
        .order('sort_order');

      if (itemsError) throw itemsError;

      const enrichedLists: ReadingList[] = (listsData || []).map(list => ({
        ...list,
        items: (itemsData || []).filter(item => item.list_id === list.id)
      }));

      setLists(enrichedLists);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('reading_lists').insert({
        user_id: user.id,
        name: newListName.trim(),
        description: newListDescription.trim() || null,
        icon: newListIcon,
        cover_color: newListColor,
        sort_order: lists.length
      });

      if (error) throw error;
      toast.success('Reading list created!');
      setNewListName('');
      setNewListDescription('');
      setNewListIcon('📚');
      setNewListColor('#14b8a6');
      setShowCreateForm(false);
      loadLists();
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from('reading_lists').delete().eq('id', listId);
      if (error) throw error;
      toast.success('List deleted');
      loadLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  const addBookToList = async (listId: string, bookId: string) => {
    try {
      const list = lists.find(l => l.id === listId);
      const { error } = await supabase.from('reading_list_items').insert({
        list_id: listId,
        book_id: bookId,
        sort_order: list?.items.length || 0
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Book already in this list');
        } else throw error;
        return;
      }
      toast.success('Book added to list!');
      setShowAddBookTo(null);
      loadLists();
    } catch (error) {
      console.error('Error adding book to list:', error);
      toast.error('Failed to add book');
    }
  };

  const removeBookFromList = async (itemId: string) => {
    try {
      const { error } = await supabase.from('reading_list_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Book removed from list');
      loadLists();
    } catch (error) {
      console.error('Error removing book:', error);
    }
  };

  const getBookById = (bookId: string) => books.find(b => b.id === bookId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-primary rounded-xl text-white shadow-lg">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text-mixed">Reading Lists</h2>
              <p className="text-muted-foreground mt-1">
                Organize your library into curated collections • {lists.length} lists
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gradient-primary text-white shadow-lg hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New List
          </Button>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New List
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-border hover:border-primary/50 transition-colors"
                  style={{ backgroundColor: newListColor + '20' }}
                >
                  {newListIcon}
                </button>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name (e.g., Summer Reads 2026)"
                  className="flex-1 px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                />
              </div>

              {showIconPicker && (
                <div className="p-3 bg-muted/30 rounded-xl space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {LIST_ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => { setNewListIcon(icon); setShowIconPicker(false); }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors ${newListIcon === icon ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LIST_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewListColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${newListColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground placeholder-muted-foreground"
              />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button onClick={createList} disabled={!newListName.trim()} className="gradient-primary text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Create List
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists */}
      {lists.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FolderPlus className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-3">No reading lists yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create curated collections like "Summer Reads", "Sci-Fi Classics", or "Must-Read Non-Fiction"
          </p>
          <Button onClick={() => setShowCreateForm(true)} className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list, index) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* List Header */}
              <div
                className="p-5 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedList(expandedList === list.id ? null : list.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: list.cover_color + '20' }}
                    >
                      {list.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{list.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {list.items.length} book{list.items.length !== 1 ? 's' : ''} 
                        {list.description && ` • ${list.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setShowAddBookTo(showAddBookTo === list.id ? null : list.id); }}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {expandedList === list.id ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Mini book covers preview */}
                {expandedList !== list.id && list.items.length > 0 && (
                  <div className="flex -space-x-3 mt-3">
                    {list.items.slice(0, 6).map((item) => {
                      const book = getBookById(item.book_id);
                      return (
                        <img
                          key={item.id}
                          src={book?.imageLinks?.thumbnail || '/placeholder.svg'}
                          alt=""
                          className="w-10 h-14 object-cover rounded-md shadow-md border-2 border-card"
                        />
                      );
                    })}
                    {list.items.length > 6 && (
                      <div className="w-10 h-14 rounded-md shadow-md border-2 border-card bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        +{list.items.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add Book Dropdown */}
              <AnimatePresence>
                {showAddBookTo === list.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-4 overflow-hidden"
                  >
                    <div className="bg-muted/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Add a book from your library:</p>
                      {books.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No books in your library yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {books
                            .filter(b => !list.items.some(item => item.book_id === b.id))
                            .map(book => (
                              <button
                                key={book.id}
                                onClick={() => addBookToList(list.id, book.id)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                              >
                                <img
                                  src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                                  alt=""
                                  className="w-8 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{book.authors?.join(', ')}</p>
                                </div>
                                <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded Book List */}
              <AnimatePresence>
                {expandedList === list.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    {list.items.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">This list is empty. Add books from your library!</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        {list.items.map((item, idx) => {
                          const book = getBookById(item.book_id);
                          if (!book) return (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 text-sm text-muted-foreground">
                              <span className="w-6 text-center font-mono text-xs">{idx + 1}</span>
                              <span>Book not in library (removed)</span>
                              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => removeBookFromList(item.id)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                              onClick={() => onBookSelect(book)}
                            >
                              <span className="w-6 text-center font-mono text-xs text-muted-foreground">{idx + 1}</span>
                              <img
                                src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                                alt=""
                                className="w-10 h-14 object-cover rounded-md shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{book.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{book.authors?.join(', ')}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                book.readingStatus === 'finished' ? 'bg-success/20 text-success' :
                                book.readingStatus === 'reading' ? 'bg-primary/20 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {book.readingStatus === 'not-read' ? 'To Read' : book.readingStatus === 'reading' ? 'Reading' : 'Done'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 text-destructive"
                                onClick={(e) => { e.stopPropagation(); removeBookFromList(item.id); }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
