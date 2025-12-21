
import { useState } from 'react';
import { X, Star, Save, Tag, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    { value: 'not-read', label: 'To Read', color: 'bg-gray-100 text-gray-700' },
    { value: 'reading', label: 'Reading', color: 'bg-blue-100 text-blue-700' },
    { value: 'finished', label: 'Finished', color: 'bg-green-100 text-green-700' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Book</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Book Info */}
          <div className="flex items-start space-x-4">
            <img
              src={book.imageLinks?.thumbnail || '/placeholder.svg'}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg shadow-md"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{book.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                by {book.authors?.join(', ') || 'Unknown Author'}
              </p>
            </div>
          </div>

          {/* Reading Status */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <BookOpen className="w-4 h-4 mr-2" />
              Reading Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setReadingStatus(status.value as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    readingStatus === status.value
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
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
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Star className="w-4 h-4 mr-2" />
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
                    className={`w-8 h-8 ${
                      star <= personalRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {personalRating > 0 ? `${personalRating}/5` : 'Not rated'}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm">Add</Button>
            </div>
          </div>

          {/* My Thoughts */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="w-4 h-4 mr-2" />
              My Thoughts
            </label>
            <Textarea
              value={myThoughts}
              onChange={(e) => setMyThoughts(e.target.value)}
              placeholder="What did you think about this book? Share your thoughts, favorite quotes, or memorable moments..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes, reading goals, or reminders..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
