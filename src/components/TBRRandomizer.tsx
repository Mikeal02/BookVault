import { useState, useRef } from 'react';
import { Book } from '@/types/book';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shuffle, BookOpen, Sparkles, RotateCcw, Play, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TBRRandomizerProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

export const TBRRandomizer = ({ books, onBookSelect }: TBRRandomizerProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [spinHistory, setSpinHistory] = useState<Book[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  const tbrBooks = books.filter(b => b.readingStatus === 'not-read');
  
  // Track previously selected books to avoid repetition
  const [previousSelections, setPreviousSelections] = useState<Set<string>>(new Set());
  
  const spinWheel = () => {
    if (tbrBooks.length === 0 || isSpinning) return;
    
    setIsSpinning(true);
    setSelectedBook(null);
    
    // Get available books (excluding recently selected ones)
    let availableBooks = tbrBooks.filter(book => !previousSelections.has(book.id));
    
    // If all books have been selected, reset the exclusion list
    if (availableBooks.length === 0) {
      availableBooks = tbrBooks;
      setPreviousSelections(new Set());
    }
    
    // Use crypto for better randomness
    const getSecureRandom = () => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1);
    };
    
    // Shuffle the available books using Fisher-Yates algorithm
    const shuffledBooks = [...availableBooks];
    for (let i = shuffledBooks.length - 1; i > 0; i--) {
      const j = Math.floor(getSecureRandom() * (i + 1));
      [shuffledBooks[i], shuffledBooks[j]] = [shuffledBooks[j], shuffledBooks[i]];
    }
    
    // Pick the first book from shuffled array (truly random)
    const finalBook = shuffledBooks[0];
    
    // Rapid cycling animation
    let currentIndex = 0;
    const totalCycles = 20 + Math.floor(getSecureRandom() * 10);
    let cycleCount = 0;
    let intervalTime = 80;
    
    const runCycle = () => {
      currentIndex = (currentIndex + 1) % tbrBooks.length;
      setSelectedBook(tbrBooks[currentIndex]);
      cycleCount++;
      
      if (cycleCount >= totalCycles) {
        // Final selection with delay for drama
        setTimeout(() => {
          setSelectedBook(finalBook);
          setSpinHistory(prev => [finalBook, ...prev.slice(0, 4)]);
          setPreviousSelections(prev => new Set([...prev, finalBook.id]));
          setIsSpinning(false);
        }, 300);
      } else {
        // Gradually slow down the animation
        intervalTime = Math.min(intervalTime + 5, 200);
        setTimeout(runCycle, intervalTime);
      }
    };
    
    runCycle();
  };

  const getRandomColor = (index: number) => {
    const colors = [
      'from-teal-500 to-cyan-500',
      'from-orange-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-blue-500 to-indigo-500',
      'from-yellow-500 to-orange-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text-mixed flex items-center justify-center gap-3">
          <Shuffle className="w-7 h-7 sm:w-8 sm:h-8" />
          TBR Randomizer
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Can't decide what to read next? Let fate decide!
        </p>
      </div>

      {tbrBooks.length === 0 ? (
        <Card className="glass-card border-dashed max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No unread books</h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xs">
              Add some books to your TBR pile to use the randomizer!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Wheel Display */}
          <div className="flex flex-col items-center gap-6">
            {/* Circular Book Display */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border-2 border-secondary/20" />
              
              {/* Book Slots */}
              <div 
                ref={wheelRef}
                className="absolute inset-4 rounded-full bg-gradient-to-br from-card to-muted overflow-hidden shadow-xl"
              >
                {tbrBooks.slice(0, 8).map((book, index) => {
                  const angle = (index * 360) / Math.min(tbrBooks.length, 8);
                  const isSelected = selectedBook?.id === book.id;
                  
                  return (
                    <div
                      key={book.id}
                      className={`absolute w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                        isSelected ? 'ring-4 ring-primary scale-110 z-10' : ''
                      }`}
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px) sm:translateY(-100px) rotate(-${angle}deg)`,
                      }}
                    >
                      {book.imageLinks?.thumbnail ? (
                        <img 
                          src={book.imageLinks.thumbnail} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getRandomColor(index)} flex items-center justify-center`}>
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Center Button */}
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className={`absolute inset-[30%] rounded-full gradient-primary text-white font-bold shadow-xl flex flex-col items-center justify-center transition-all hover:scale-105 disabled:opacity-70 ${
                  isSpinning ? 'animate-pulse' : ''
                }`}
              >
                {isSpinning ? (
                  <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                ) : (
                  <>
                    <Play className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-[10px] sm:text-xs mt-1">SPIN</span>
                  </>
                )}
              </button>
            </div>

            {/* Selected Book Display */}
            <AnimatePresence mode="wait">
              {selectedBook && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="w-full max-w-md"
                >
                  <Card className="glass-card overflow-hidden border-2 border-primary">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4 justify-center">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-primary">Your Next Read!</span>
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </div>
                      
                      <div className="flex gap-4">
                        {selectedBook.imageLinks?.thumbnail ? (
                          <img 
                            src={selectedBook.imageLinks.thumbnail} 
                            alt={selectedBook.title}
                            className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg line-clamp-2">{selectedBook.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedBook.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          {selectedBook.pageCount && (
                            <Badge variant="secondary" className="mt-2">
                              {selectedBook.pageCount} pages
                            </Badge>
                          )}
                          
                          <Button 
                            onClick={() => onBookSelect(selectedBook)}
                            className="mt-3 w-full gradient-primary text-white"
                            size="sm"
                          >
                            Start Reading
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin Again Button */}
            {selectedBook && !isSpinning && (
              <Button
                onClick={spinWheel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Not feeling it? Spin again!
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            <Card className="glass-card text-center p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{tbrBooks.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Books in TBR</p>
            </Card>
            <Card className="glass-card text-center p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{spinHistory.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Times Spun</p>
            </Card>
            <Card className="glass-card text-center p-3 sm:p-4 col-span-2 sm:col-span-1">
              <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">
                {tbrBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Pages</p>
            </Card>
          </div>

          {/* Recent Spins */}
          {spinHistory.length > 0 && (
            <Card className="glass-card max-w-lg mx-auto">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Recent Picks</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {spinHistory.map((book, index) => (
                    <div 
                      key={`${book.id}-${index}`}
                      className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => onBookSelect(book)}
                    >
                      {book.imageLinks?.thumbnail ? (
                        <img 
                          src={book.imageLinks.thumbnail}
                          alt={book.title}
                          className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shadow"
                        />
                      ) : (
                        <div className={`w-10 h-14 sm:w-12 sm:h-16 bg-gradient-to-br ${getRandomColor(index)} rounded flex items-center justify-center`}>
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
