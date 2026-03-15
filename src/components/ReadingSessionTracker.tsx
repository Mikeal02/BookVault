
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Clock, BookOpen, Target, X, Zap, TrendingUp } from 'lucide-react';
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
  duration: number;
  pagesRead: number;
  notes?: string;
}

const CircularProgress = ({ time, goalMinutes = 30 }: { time: number; goalMinutes?: number }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const minutes = time / 60;
  const progress = Math.min(minutes / goalMinutes, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg className="progress-ring w-full h-full" viewBox="0 0 200 200">
        {/* Background track */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        {/* Progress arc */}
        <motion.circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="progress-ring-circle"
        />
        {/* Glow dot at the end of progress */}
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-mono font-bold tracking-tight text-foreground">
          {formatTime(time)}
        </span>
        <span className="text-xs text-muted-foreground mt-1 font-medium">
          {progress >= 1 ? '🎉 Goal reached!' : `${Math.round(progress * 100)}% of ${goalMinutes}min goal`}
        </span>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ReadingSessionTracker = ({ book, onSessionComplete, onClose }: ReadingSessionTrackerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const startSession = () => {
    setIsActive(true);
    if (!startTime) setStartTime(new Date());
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const endSession = () => {
    if (startTime && time > 0) {
      const endTime = new Date();
      const duration = Math.ceil(time / 60);
      onSessionComplete({
        bookId: book.id,
        startTime,
        endTime,
        duration: Math.max(duration, 1),
        pagesRead,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  const readingSpeed = time > 60 && pagesRead > 0 ? ((pagesRead / (time / 60)) * 60).toFixed(1) : null;
  const estimatedFinish = pagesRead > 0 && book.pageCount && book.currentPage !== undefined
    ? Math.ceil(((book.pageCount - (book.currentPage || 0) - pagesRead) / pagesRead) * (time / 60))
    : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92dvh] flex flex-col shadow-2xl border border-border relative overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary z-10" />

        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Reading Session
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-border/50">
              {book.imageLinks?.thumbnail ? (
                <img src={book.imageLinks.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm line-clamp-1">{book.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{book.authors?.join(', ') || 'Unknown Author'}</p>
              {book.pageCount && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Page {book.currentPage || 0} of {book.pageCount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-5 space-y-5">
            {/* Circular Timer */}
            <CircularProgress time={time} goalMinutes={30} />

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <AnimatePresence mode="wait">
                {!isActive ? (
                  <motion.div key="start" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <Button onClick={startSession} size="lg" className="bg-success hover:bg-success/90 text-success-foreground rounded-xl px-8 shadow-lg">
                      <Play className="w-5 h-5 mr-2" />
                      {time > 0 ? 'Resume' : 'Start'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="pause" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <Button onClick={pauseSession} size="lg" className="bg-warning hover:bg-warning/90 text-warning-foreground rounded-xl px-8 shadow-lg">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              {time > 0 && !isActive && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Button onClick={endSession} size="lg" variant="destructive" className="rounded-xl px-6 shadow-lg">
                    <Square className="w-4 h-4 mr-2" />
                    End
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Live Stats */}
            {time > 30 && (
              <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {readingSpeed && (
                  <div className="glass-card rounded-xl p-3 text-center">
                    <Zap className="w-4 h-4 text-warning mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{readingSpeed}</p>
                    <p className="text-[10px] text-muted-foreground">pages/hour</p>
                  </div>
                )}
                {estimatedFinish && estimatedFinish > 0 && (
                  <div className="glass-card rounded-xl p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{estimatedFinish}min</p>
                    <p className="text-[10px] text-muted-foreground">to finish book</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pages Read */}
            <div className="space-y-1.5">
              <label className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Pages Read
              </label>
              <input
                type="number"
                value={pagesRead || ''}
                onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground text-sm"
                placeholder="How many pages?"
                min={0}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                Session Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none text-foreground text-sm"
                rows={2}
                placeholder="Key takeaways or memorable quotes..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          {time > 0 && (
            <Button size="sm" onClick={endSession} className="gradient-primary text-primary-foreground">
              Save Session
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
