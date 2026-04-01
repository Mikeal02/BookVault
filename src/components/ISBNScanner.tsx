import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, BookOpen, Plus, Keyboard, ScanBarcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { Book } from '@/types/book';
import { fetchBookByISBN } from '@/services/googleBooks';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { toast } from 'sonner';

interface ISBNScannerProps {
  onBookFound: (book: Book) => void;
  onAddToBookshelf: (book: Book) => void;
  isInBookshelf: (bookId: string) => boolean;
}

type ScanMode = 'camera' | 'manual';
type ScanState = 'idle' | 'scanning' | 'found' | 'not-found' | 'error';

export const ISBNScanner = ({ onBookFound, onAddToBookshelf, isInBookshelf }: ISBNScannerProps) => {
  const [mode, setMode] = useState<ScanMode>('manual');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [manualISBN, setManualISBN] = useState('');
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number>(0);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearInterval(scanIntervalRef.current);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
        setScanState('scanning');

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const isbn = barcodes[0].rawValue;
              clearInterval(scanIntervalRef.current);
              handleISBNLookup(isbn);
            }
          } catch { /* ignore frame errors */ }
        }, 500);
      } else {
        setCameraError('Barcode detection is not supported in this browser. Please enter the ISBN manually.');
        setScanState('idle');
        setMode('manual');
        stopCamera();
      }
    } catch (err: any) {
      setCameraError(err.message || 'Could not access camera');
      setMode('manual');
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [mode, startCamera, stopCamera]);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleISBNLookup = async (isbn: string) => {
    const cleaned = isbn.replace(/[-\s]/g, '');
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      toast.error('Please enter a valid 10 or 13 digit ISBN');
      return;
    }

    setScanState('scanning');
    setFoundBook(null);
    setErrorMessage('');

    try {
      const book = await fetchBookByISBN(cleaned);
      if (book) {
        setFoundBook(book);
        setScanState('found');
        onBookFound(book);
      } else {
        setScanState('not-found');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        setErrorMessage('API rate limit reached. Please try again in a few minutes.');
      } else if (msg.includes('500') || msg.includes('503')) {
        setErrorMessage('Book lookup service is temporarily unavailable. Please try again shortly.');
      } else {
        setErrorMessage('Could not look up this ISBN. Please check your connection and try again.');
      }
      setScanState('error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualISBN.trim()) {
      handleISBNLookup(manualISBN.trim());
    }
  };

  const handleAddBook = () => {
    if (foundBook) {
      onAddToBookshelf(foundBook);
    }
  };

  const resetScanner = () => {
    setScanState('idle');
    setFoundBook(null);
    setManualISBN('');
  };

  const alreadyInLibrary = foundBook ? isInBookshelf(foundBook.id) : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-mixed flex items-center justify-center shadow-lg"
        >
          <ScanBarcode className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-display font-bold gradient-text-mixed">ISBN Scanner</h2>
        <p className="text-sm text-muted-foreground mt-1">Scan a barcode or enter an ISBN to instantly add books</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted/40 rounded-xl p-0.5 gap-0.5">
          {[
            { m: 'camera' as ScanMode, icon: Camera, label: 'Camera' },
            { m: 'manual' as ScanMode, icon: Keyboard, label: 'Manual' },
          ].map(({ m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); resetScanner(); }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode === m && (
                <motion.div
                  layoutId="scanner-mode"
                  className="absolute inset-0 bg-card shadow-sm rounded-lg border border-border/50"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      <AnimatePresence mode="wait">
        {mode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3] max-w-lg mx-auto">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan overlay */}
              {scanState === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-1/3 border-2 border-primary/60 rounded-xl relative">
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                  </div>
                  <p className="absolute bottom-4 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    Point at a barcode...
                  </p>
                </div>
              )}
            </div>
            {cameraError && (
              <p className="text-sm text-destructive text-center mt-3">{cameraError}</p>
            )}
          </motion.div>
        )}

        {/* Manual Entry */}
        {mode === 'manual' && (
          <motion.form
            key="manual"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleManualSubmit}
            className="max-w-md mx-auto"
          >
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <label className="block text-sm font-medium text-foreground">Enter ISBN</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={manualISBN}
                  onChange={e => setManualISBN(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder="978-0-13-468599-1"
                  className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground font-mono text-lg tracking-wider"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualISBN.trim() || scanState === 'scanning'}
                className="w-full py-3 gradient-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scanState === 'scanning' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Looking up...</>
                ) : (
                  <><ScanBarcode className="w-4 h-4" /> Look Up Book</>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {scanState === 'found' && foundBook && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card rounded-2xl p-6 max-w-lg mx-auto"
          >
            <div className="flex items-center gap-2 mb-4 text-success">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Book Found!</span>
            </div>
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-border/40 shadow-md">
                  {foundBook.imageLinks?.thumbnail ? (
                    <img src={foundBook.imageLinks.thumbnail} alt={foundBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookCoverPlaceholder title={foundBook.title} author={foundBook.authors?.[0]} className="w-full h-full" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground line-clamp-2">{foundBook.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{foundBook.authors?.join(', ')}</p>
                {foundBook.publishedDate && (
                  <p className="text-xs text-muted-foreground/60 mt-1">{foundBook.publishedDate}</p>
                )}
                {foundBook.pageCount && (
                  <p className="text-xs text-muted-foreground/60">{foundBook.pageCount} pages</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddBook}
                    disabled={alreadyInLibrary}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      alreadyInLibrary
                        ? 'bg-success/10 text-success border border-success/20 cursor-default'
                        : 'gradient-primary text-primary-foreground hover:opacity-90 shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {alreadyInLibrary ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> In Library</>
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Add to Library</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={resetScanner}
              className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Scan another book
            </button>
          </motion.div>
        )}

        {scanState === 'not-found' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
            <p className="text-foreground font-semibold">No book found</p>
            <p className="text-sm text-muted-foreground mt-1">Try double-checking the ISBN or searching manually.</p>
            <button
              onClick={resetScanner}
              className="mt-4 px-6 py-2 text-sm font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {scanState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again in a moment.</p>
            <button
              onClick={resetScanner}
              className="mt-4 px-6 py-2 text-sm font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent scans hint */}
      {scanState === 'idle' && mode === 'manual' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground/50 max-w-sm mx-auto"
        >
          <p>💡 The ISBN is usually found on the back cover above the barcode, or on the copyright page.</p>
        </motion.div>
      )}
    </div>
  );
};
