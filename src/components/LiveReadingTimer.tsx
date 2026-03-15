import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, BookOpen, Clock, Zap, Timer, ChevronDown, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';

interface LiveReadingTimerProps {
  books: Book[];
  onSessionComplete: (data: { bookId: string; duration: number; pagesRead: number; notes: string }) => void;
}

type TimerState = 'idle' | 'running' | 'paused' | 'autopause';

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const LiveReadingTimer = ({ books, onSessionComplete }: LiveReadingTimerProps) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [state, setState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [pagesRead, setPagesRead] = useState(0);
  const [notes, setNotes] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = useRef(Date.now());
  const AUTO_PAUSE_MS = 5 * 60 * 1000; // 5 min inactivity

  const readingBooks = books.filter(b => b.readingStatus === 'reading');

  // Auto-select first reading book
  useEffect(() => {
    if (!selectedBook && readingBooks.length > 0) {
      setSelectedBook(readingBooks[0]);
    }
  }, [readingBooks]);

  // Timer tick
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [state]);

  // Auto-pause on inactivity
  useEffect(() => {
    if (state !== 'running') return;
    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current > AUTO_PAUSE_MS) {
        setState('autopause');
      }
    }, 10000);
    return () => clearInterval(checkActivity);
  }, [state]);

  // Track activity
  useEffect(() => {
    const resetActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('touchstart', resetActivity);
    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
    };
  }, []);

  const start = () => { setState('running'); lastActivityRef.current = Date.now(); };
  const pause = () => setState('paused');
  const resume = () => { setState('running'); lastActivityRef.current = Date.now(); };
  const stop = () => { setState('idle'); setShowComplete(true); };

  const finishSession = () => {
    if (selectedBook) {
      onSessionComplete({
        bookId: selectedBook.id,
        duration: Math.ceil(elapsed / 60),
        pagesRead,
        notes,
      });
    }
    setElapsed(0);
    setPagesRead(0);
    setNotes('');
    setShowComplete(false);
    setState('idle');
  };

  const speed = elapsed > 0 && pagesRead > 0
    ? ((pagesRead / elapsed) * 3600).toFixed(1)
    : null;

  const eta = selectedBook?.pageCount && pagesRead > 0 && elapsed > 0
    ? (() => {
        const remaining = (selectedBook.pageCount - (selectedBook.currentPage || 0) - pagesRead);
        const secsPerPage = elapsed / pagesRead;
        const mins = Math.ceil((remaining * secsPerPage) / 60);
        return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : 'Almost done!';
      })()
    : null;

  // Ring progress
  const circumference = 2 * Math.PI * 52;
  const maxSession = 120 * 60; // 2h max for visual
  const progress = Math.min(elapsed / maxSession, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Live Reading Timer</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your reading sessions in real-time</p>
        </div>
      </div>

      {/* Book picker */}
      <div className="elite-card rounded-2xl p-4">
        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-2 block">
          Reading
        </label>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {selectedBook ? (
            <>
              {selectedBook.imageLinks?.thumbnail ? (
                <img src={selectedBook.imageLinks.thumbnail} className="w-8 h-12 object-cover rounded-md" alt="" />
              ) : (
                <div className="w-8 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">{selectedBook.title}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedBook.authors?.join(', ')}</p>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Select a book to read...</span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                {readingBooks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No books currently marked as "reading"</p>
                )}
                {readingBooks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBook(b); setShowPicker(false); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                      selectedBook?.id === b.id ? 'bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium truncate">{b.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer display */}
      <div className="elite-card rounded-2xl p-6 sm:p-8 flex flex-col items-center">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6">
          <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring-circle"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl sm:text-4xl font-mono font-bold tabular-nums ${
              state === 'autopause' ? 'text-warning animate-pulse' : 'text-foreground'
            }`}>
              {formatTime(elapsed)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {state === 'idle' ? 'Ready' : state === 'running' ? 'Reading' : state === 'autopause' ? 'Auto-paused' : 'Paused'}
            </span>
          </div>
        </div>

        {state === 'autopause' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-warning/10 rounded-xl text-warning text-xs font-medium mb-4"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            No activity detected — timer paused
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          {state === 'idle' && (
            <Button onClick={start} disabled={!selectedBook} className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl shadow-lg press-depth">
              <Play className="w-5 h-5 mr-2" /> Start Reading
            </Button>
          )}
          {state === 'running' && (
            <>
              <Button onClick={pause} variant="outline" className="px-6 py-3 rounded-xl press-depth">
                <Pause className="w-5 h-5 mr-2" /> Pause
              </Button>
              <Button onClick={stop} variant="outline" className="px-6 py-3 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 press-depth">
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            </>
          )}
          {(state === 'paused' || state === 'autopause') && (
            <>
              <Button onClick={resume} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg press-depth">
                <Play className="w-5 h-5 mr-2" /> Resume
              </Button>
              <Button onClick={stop} variant="outline" className="px-6 py-3 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 press-depth">
                <Square className="w-4 h-4 mr-2" /> Finish
              </Button>
            </>
          )}
        </div>

        {/* Live stats */}
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-4 mt-6 w-full max-w-sm"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Timer className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</span>
              </div>
              <p className="text-sm font-bold tabular-nums">{Math.ceil(elapsed / 60)} min</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-warning" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Speed</span>
              </div>
              <p className="text-sm font-bold tabular-nums">{speed ? `${speed} p/h` : '—'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-success" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ETA</span>
              </div>
              <p className="text-sm font-bold tabular-nums">{eta || '—'}</p>
            </div>
          </motion.div>
        )}

        {/* Pages input */}
        {state !== 'idle' && (
          <div className="mt-4 w-full max-w-sm">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1.5 block">
              Pages read so far
            </label>
            <input
              type="number"
              min={0}
              value={pagesRead || ''}
              onChange={e => setPagesRead(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm text-center font-mono tabular-nums"
            />
          </div>
        )}
      </div>

      {/* Session complete modal */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowComplete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="frosted-panel rounded-2xl p-6 w-full max-w-md space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-success" />
                </div>
                <h3 className="text-lg font-display font-bold">Session Complete!</h3>
                <p className="text-2xl font-mono font-bold text-primary mt-1">{formatTime(elapsed)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1.5 block">
                    Pages read
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pagesRead || ''}
                    onChange={e => setPagesRead(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1.5 block">
                    Session notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm resize-none"
                    placeholder="What stood out in this session?"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowComplete(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground rounded-xl press-depth" onClick={finishSession}>
                  Save Session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
