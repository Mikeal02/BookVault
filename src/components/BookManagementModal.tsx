
import { useState, useEffect } from 'react';
import { X, Star, Save, Tag, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BookManagementModalProps {
  book: Book;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
}

export const BookManagementModal = ({ book, onClose, onSave }: BookManagementModalProps) => {
  const [readingStatus, setReadingStatus] = useState<'not-read' | 'reading' | 'finished'>(
    book.readingStatus || 'not-read'
  );
  const [personalRating, setPersonalRating] = useState(book.personalRating || 0);
  const [myThoughts, setMyThoughts] = useState(book.myThoughts || '');
  const [notes, setNotes] = useState(book.notes || '');
  const [tags, setTags] = useState<string[]>(book.tags || []);
  const [newTag, setNewTag] = useState('');

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

  const handleSave = () => {
    const updatedBook: Book = {
      ...book,
      readingStatus,
      personalRating,
      myThoughts,
      notes,
      tags,
      dateFinished: readingStatus === 'finished' && !book.dateFinished 
        ? new Date().toISOString() 
        : book.dateFinished
    };
    onSave(updatedBook);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const statusOptions = [
    { value: 'not-read', label: 'To Read', color: 'bg-muted text-muted-foreground' },
    { value: 'reading', label: 'Reading', color: 'bg-primary/10 text-primary' },
    { value: 'finished', label: 'Finished', color: 'bg-success/10 text-success' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Manage Book</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Book Info */}
              <div className="flex items-start space-x-3 sm:space-x-4">
                <img
                  src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                  alt={book.title}
                  className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    by {book.authors?.join(', ') || 'Unknown Author'}
                  </p>
                </div>
              </div>

              {/* Reading Status */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <BookOpen className="w-4 h-4 mr-2 text-primary" />
                  Reading Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setReadingStatus(status.value as any)}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                        readingStatus === status.value
                          ? 'gradient-primary text-primary-foreground shadow-lg'
                          : `${status.color} hover:shadow-md`
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Rating */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Star className="w-4 h-4 mr-2 text-warning" />
                  My Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setPersonalRating(star)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 ${
                          star <= personalRating
                            ? 'text-warning fill-current'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs sm:text-sm text-muted-foreground">
                    {personalRating > 0 ? `${personalRating}/5` : 'Not rated'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Tag className="w-4 h-4 mr-2 text-secondary" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm bg-secondary/10 text-secondary"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-secondary/70 hover:text-secondary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs sm:text-sm text-muted-foreground">No tags yet</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-foreground placeholder:text-muted-foreground"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm" variant="outline">Add</Button>
                </div>
              </div>

              {/* My Thoughts */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                  My Thoughts
                </label>
                <Textarea
                  value={myThoughts}
                  onChange={(e) => setMyThoughts(e.target.value)}
                  placeholder="What did you think about this book? Share your thoughts, favorite quotes, or memorable moments..."
                  className="min-h-[100px] resize-none bg-muted/30 border-border text-sm"
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Calendar className="w-4 h-4 mr-2 text-accent" />
                  Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes, reading goals, or reminders..."
                  className="min-h-[80px] resize-none bg-muted/30 border-border text-sm"
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/30 flex justify-end space-x-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} size="sm" className="text-xs sm:text-sm">
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" className="gradient-primary text-primary-foreground text-xs sm:text-sm">
            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
