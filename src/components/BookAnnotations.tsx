
import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, BookOpen, FileText, Quote, Bookmark, Search, Filter, Download, Edit3, X, Check, Hash } from 'lucide-react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Annotation {
  id: string;
  book_id: string;
  content: string;
  annotation_type: string;
  chapter: string | null;
  page_number: number | null;
  color: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface BookAnnotationsProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

const ANNOTATION_TYPES = [
  { value: 'note', label: 'Note', icon: FileText, color: '#14b8a6' },
  { value: 'highlight', label: 'Highlight', icon: Edit3, color: '#f97316' },
  { value: 'chapter_marker', label: 'Chapter', icon: Bookmark, color: '#8b5cf6' },
  { value: 'quote', label: 'Quote', icon: Quote, color: '#ec4899' },
];

const HIGHLIGHT_COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#22c55e', '#06b6d4', '#f43f5e'];

export const BookAnnotations = ({ books, onBookSelect }: BookAnnotationsProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Form state
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('note');
  const [newChapter, setNewChapter] = useState('');
  const [newPage, setNewPage] = useState('');
  const [newColor, setNewColor] = useState('#14b8a6');

  useEffect(() => {
    loadAnnotations();
  }, []);

  const loadAnnotations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('book_annotations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnotation = async () => {
    if (!newContent.trim() || !selectedBook) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('book_annotations').insert({
        user_id: user.id,
        book_id: selectedBook,
        content: newContent.trim(),
        annotation_type: newType,
        chapter: newChapter.trim() || null,
        page_number: newPage ? parseInt(newPage) : null,
        color: newColor,
      });

      if (error) throw error;
      toast.success('Annotation saved!');
      resetForm();
      loadAnnotations();
    } catch (error) {
      console.error('Error creating annotation:', error);
      toast.error('Failed to save annotation');
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      const { error } = await supabase.from('book_annotations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Annotation deleted');
      loadAnnotations();
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  const toggleFavorite = async (id: string, currentFav: boolean) => {
    try {
      const { error } = await supabase.from('book_annotations').update({ is_favorite: !currentFav }).eq('id', id);
      if (error) throw error;
      loadAnnotations();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const updateAnnotation = async (id: string) => {
    try {
      const { error } = await supabase.from('book_annotations').update({
        content: editContent,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      toast.success('Updated!');
      loadAnnotations();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const resetForm = () => {
    setNewContent('');
    setNewType('note');
    setNewChapter('');
    setNewPage('');
    setNewColor('#14b8a6');
    setSelectedBook('');
    setShowAddForm(false);
  };

  const exportAnnotations = () => {
    const filtered = getFilteredAnnotations();
    const markdown = filtered.map(a => {
      const book = books.find(b => b.id === a.book_id);
      const typeLabel = ANNOTATION_TYPES.find(t => t.value === a.annotation_type)?.label || a.annotation_type;
      return `## ${book?.title || 'Unknown'}\n**${typeLabel}**${a.chapter ? ` — Ch: ${a.chapter}` : ''}${a.page_number ? ` — p.${a.page_number}` : ''}\n\n${a.content}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'book-annotations.md';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Annotations exported!');
  };

  const getFilteredAnnotations = () => {
    return annotations.filter(a => {
      const matchesBook = filterBook === 'all' || a.book_id === filterBook;
      const matchesType = filterType === 'all' || a.annotation_type === filterType;
      const matchesSearch = !searchQuery || a.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBook && matchesType && matchesSearch;
    });
  };

  const getBookById = (bookId: string) => books.find(b => b.id === bookId);
  const filteredAnnotations = getFilteredAnnotations();

  const annotationStats = {
    total: annotations.length,
    notes: annotations.filter(a => a.annotation_type === 'note').length,
    highlights: annotations.filter(a => a.annotation_type === 'highlight').length,
    quotes: annotations.filter(a => a.annotation_type === 'quote').length,
    favorites: annotations.filter(a => a.is_favorite).length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-3" />
            <div className="h-20 bg-muted rounded" />
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
            <div className="p-3 gradient-secondary rounded-xl text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text-mixed">Book Annotations</h2>
              <p className="text-muted-foreground mt-1">
                Notes, highlights, quotes & chapter markers • {annotationStats.total} total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAnnotations} disabled={annotations.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-white shadow-lg hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[
            { label: 'Total', value: annotationStats.total, icon: FileText, color: 'primary' },
            { label: 'Notes', value: annotationStats.notes, icon: Edit3, color: 'primary' },
            { label: 'Highlights', value: annotationStats.highlights, icon: Bookmark, color: 'secondary' },
            { label: 'Quotes', value: annotationStats.quotes, icon: Quote, color: 'warning' },
            { label: 'Favorites', value: annotationStats.favorites, icon: Star, color: 'highlight' },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/30 rounded-xl p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 text-${stat.color}`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              New Annotation
            </h3>
            <div className="space-y-4">
              {/* Book selector */}
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              >
                <option value="">Select a book...</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>{book.title} — {book.authors?.[0]}</option>
                ))}
              </select>

              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {ANNOTATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => { setNewType(type.value); setNewColor(type.color); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      newType === type.value
                        ? 'text-white shadow-lg'
                        : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                    }`}
                    style={newType === type.value ? { backgroundColor: type.color } : {}}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Chapter / Page */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="Chapter (optional)"
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    placeholder="Page #"
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Color picker for highlights */}
              {newType === 'highlight' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  {HIGHLIGHT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={newType === 'quote' ? 'Enter the quote...' : newType === 'chapter_marker' ? 'Chapter summary or key points...' : 'Write your note...'}
                rows={4}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground placeholder-muted-foreground"
              />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={createAnnotation} disabled={!newContent.trim() || !selectedBook} className="gradient-primary text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Save Annotation
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {annotations.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search annotations..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
            <select
              value={filterBook}
              onChange={(e) => setFilterBook(e.target.value)}
              className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground"
            >
              <option value="all">All Books</option>
              {books.filter(b => annotations.some(a => a.book_id === b.id)).map(book => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground"
            >
              <option value="all">All Types</option>
              {ANNOTATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Annotations List */}
      {filteredAnnotations.length > 0 ? (
        <div className="space-y-3">
          {filteredAnnotations.map((annotation, index) => {
            const book = getBookById(annotation.book_id);
            const typeInfo = ANNOTATION_TYPES.find(t => t.value === annotation.annotation_type) || ANNOTATION_TYPES[0];
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={annotation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4 group"
                style={{ borderLeft: `4px solid ${annotation.color}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: annotation.color + '20' }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: annotation.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {book && (
                        <button
                          onClick={() => onBookSelect(book)}
                          className="text-sm font-medium text-primary hover:underline line-clamp-1"
                        >
                          {book.title}
                        </button>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: annotation.color + '20', color: annotation.color }}>
                        {typeInfo.label}
                      </span>
                      {annotation.chapter && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="w-3 h-3" />{annotation.chapter}
                        </span>
                      )}
                      {annotation.page_number && (
                        <span className="text-xs text-muted-foreground">p.{annotation.page_number}</span>
                      )}
                    </div>

                    {editingId === annotation.id ? (
                      <div className="flex gap-2 mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none text-foreground"
                          rows={3}
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => updateAnnotation(annotation.id)} className="gradient-primary text-white">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed ${annotation.annotation_type === 'quote' ? 'italic border-l-2 border-muted pl-3' : ''}`}>
                        {annotation.annotation_type === 'quote' && '"'}
                        {annotation.content}
                        {annotation.annotation_type === 'quote' && '"'}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => toggleFavorite(annotation.id, annotation.is_favorite)}
                      className={`p-1.5 rounded-lg transition-colors ${annotation.is_favorite ? 'text-warning bg-warning/10' : 'text-muted-foreground hover:text-warning hover:bg-warning/10'}`}
                    >
                      <Star className={`w-4 h-4 ${annotation.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => { setEditingId(annotation.id); setEditContent(annotation.content); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : annotations.length > 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No annotations match your filters</p>
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FileText className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-3">No annotations yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start annotating your books with notes, highlights, quotes, and chapter markers
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Annotation
          </Button>
        </div>
      )}
    </div>
  );
};
