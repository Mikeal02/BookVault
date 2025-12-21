
import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reading Session</h2>
          <div className="flex items-center space-x-3">
            <img
              src={book.imageLinks?.thumbnail || '/placeholder.svg'}
              alt={book.title}
              className="w-12 h-16 object-cover rounded shadow-md"
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{book.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {book.authors?.join(', ') || 'Unknown Author'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">
              {formatTime(time)}
            </div>
            <p className="text-gray-600 dark:text-gray-400">Reading Time</p>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={startSession}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Reading
              </Button>
            ) : (
              <Button
                onClick={pauseSession}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                size="lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            
            {time > 0 && (
              <Button
                onClick={endSession}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                End Session
              </Button>
            )}
          </div>

          {/* Pages Read */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <BookOpen className="w-4 h-4 mr-2" />
              Pages Read
            </label>
            <input
              type="number"
              value={pagesRead}
              onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="How many pages did you read?"
            />
          </div>

          {/* Session Notes */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Target className="w-4 h-4 mr-2" />
              Session Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Thoughts, insights, or memorable quotes from this session..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
