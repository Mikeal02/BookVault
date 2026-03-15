import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, BookOpen, BarChart3, Sparkles, User, Quote, Heart,
  Music, Trophy, GitCompareArrows, FolderOpen, FileText, Share2,
  ScanBarcode, Gift, ArrowRight, Command, Hash
} from 'lucide-react';
import { Book } from '@/types/book';
import { searchBooks } from '@/services/googleBooks';

type ViewId = 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'atmosphere' | 'challenges' | 'comparison' | 'lists' | 'annotations' | 'sharing' | 'scanner' | 'wrapped';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewId) => void;
  onBookSelect: (book: Book) => void;
  books: Book[];
}

const navItems: { id: ViewId; label: string; icon: any; keywords: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, keywords: 'home overview stats' },
  { id: 'search', label: 'Search Books', icon: Search, keywords: 'find discover lookup' },
  { id: 'shelf', label: 'My Bookshelf', icon: BookOpen, keywords: 'library collection' },
  { id: 'stats', label: 'Analytics', icon: BarChart3, keywords: 'statistics insights data' },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles, keywords: 'for you suggest picks' },
  { id: 'profile', label: 'Profile', icon: User, keywords: 'account settings user' },
  { id: 'quotes', label: 'Quotes', icon: Quote, keywords: 'excerpts passages' },
  { id: 'mood', label: 'Mood Journal', icon: Heart, keywords: 'feelings emotions diary' },
  { id: 'atmosphere', label: 'Ambience', icon: Music, keywords: 'sounds music reading' },
  { id: 'challenges', label: 'Challenges', icon: Trophy, keywords: 'goals badges achievements' },
  { id: 'comparison', label: 'Compare Books', icon: GitCompareArrows, keywords: 'versus side by side' },
  { id: 'lists', label: 'Reading Lists', icon: FolderOpen, keywords: 'collections organize' },
  { id: 'annotations', label: 'Annotations', icon: FileText, keywords: 'notes highlights' },
  { id: 'sharing', label: 'Share', icon: Share2, keywords: 'social export' },
  { id: 'scanner', label: 'ISBN Scanner', icon: ScanBarcode, keywords: 'barcode scan' },
  { id: 'wrapped', label: 'Reading Wrapped', icon: Gift, keywords: 'year review summary' },
];

export const CommandPalette = ({ open, onClose, onNavigate, onBookSelect, books }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [apiResults, setApiResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setApiResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter nav items
  const filteredNav = navItems.filter(item => {
    const q = query.toLowerCase();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || item.keywords.includes(q);
  });

  // Filter bookshelf
  const filteredBooks = query.length >= 2
    ? books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.authors?.some(a => a.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  // API search for non-bookshelf books
  useEffect(() => {
    if (query.length < 3) { setApiResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchBooks(query, 5);
        setApiResults(results.filter(r => !books.some(b => b.id === r.id)));
      } catch { setApiResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, books]);

  // Build results list
  type ResultItem = { type: 'nav'; data: typeof navItems[0] } | { type: 'book'; data: Book; source: 'library' | 'search' };
  const results: ResultItem[] = [
    ...filteredNav.map(n => ({ type: 'nav' as const, data: n })),
    ...filteredBooks.map(b => ({ type: 'book' as const, data: b, source: 'library' as const })),
    ...apiResults.map(b => ({ type: 'book' as const, data: b, source: 'search' as const })),
  ];

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(Math.max(0, results.length - 1));
  }, [results.length]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback((item: ResultItem) => {
    if (item.type === 'nav') {
      onNavigate(item.data.id);
    } else {
      onBookSelect(item.data);
    }
    onClose();
  }, [onNavigate, onBookSelect, onClose]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && results[activeIndex]) { e.preventDefault(); handleSelect(results[activeIndex]); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, activeIndex, results, handleSelect, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl mx-4 frosted-panel rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
              placeholder="Search books, navigate, or type a command..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground border border-border/50">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
            {results.length === 0 && !searching && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {/* Navigation section */}
            {filteredNav.length > 0 && query.length < 3 && (
              <div className="mb-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  Navigate
                </div>
              </div>
            )}

            {results.map((item, idx) => {
              // Section headers
              const prevItem = results[idx - 1];
              const showLibHeader = item.type === 'book' && item.source === 'library' && (!prevItem || prevItem.type === 'nav');
              const showSearchHeader = item.type === 'book' && item.source === 'search' && (!prevItem || (prevItem.type === 'book' && prevItem.source === 'library') || prevItem.type === 'nav');

              return (
                <div key={`${item.type}-${item.type === 'nav' ? item.data.id : item.data.id}`}>
                  {showLibHeader && (
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mt-1">
                      Your Library
                    </div>
                  )}
                  {showSearchHeader && (
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mt-1">
                      Search Results {searching && <span className="animate-pulse">...</span>}
                    </div>
                  )}
                  <button
                    data-index={idx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      idx === activeIndex
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {item.type === 'nav' ? (
                      <>
                        <item.data.icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-left font-medium">{item.data.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                      </>
                    ) : (
                      <>
                        {item.data.imageLinks?.thumbnail ? (
                          <img src={item.data.imageLinks.thumbnail} alt="" className="w-8 h-11 object-cover rounded-md flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-11 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate text-[13px]">{item.data.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{item.data.authors?.join(', ') || 'Unknown'}</p>
                        </div>
                        {item.source === 'library' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-success/10 text-success">
                            In Library
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              );
            })}

            {searching && (
              <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                Searching books...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/40 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono">esc</kbd> close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
