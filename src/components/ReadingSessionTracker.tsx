
import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, BookOpen, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReadingSessionTrackerProps {
  book: Book;
  onSessionComplete: (sessionData: ReadingSession) => void;
  onClose: () => void;
}

interface ReadingSession {
  bookId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  pagesRead: number;
  notes?: string;
}

export const ReadingSessionTracker = ({ book, onSessionComplete, onClose }: ReadingSessionTrackerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const startSession = () => {
    setIsActive(true);
    setStartTime(new Date());
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const endSession = () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // in minutes

      const sessionData: ReadingSession = {
        bookId: book.id,
        startTime,
        endTime,
        duration,
        pagesRead,
        notes
      };

      onSessionComplete(sessionData);
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Reading Session</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <img
              src={book.imageLinks?.thumbnail || '/placeholder.svg'}
              alt={book.title}
              className="w-12 h-16 object-cover rounded shadow-md"
            />
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground">
                {book.authors?.join(', ') || 'Unknown Author'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-primary mb-2">
                {formatTime(time)}
              </div>
              <p className="text-muted-foreground">Reading Time</p>
            </div>

            {/* Controls */}
            <div className="flex justify-center flex-wrap gap-3">
              {!isActive ? (
                <Button
                  onClick={startSession}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Reading
                </Button>
              ) : (
                <Button
                  onClick={pauseSession}
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {time > 0 && (
                <Button
                  onClick={endSession}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End Session
                </Button>
              )}
            </div>

            {/* Pages Read */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-foreground">
                <BookOpen className="w-4 h-4 mr-2" />
                Pages Read
              </label>
              <input
                type="number"
                value={pagesRead}
                onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="How many pages did you read?"
              />
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-foreground">
                <Target className="w-4 h-4 mr-2" />
                Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground"
                rows={3}
                placeholder="Thoughts, insights, or memorable quotes from this session..."
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end space-x-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
