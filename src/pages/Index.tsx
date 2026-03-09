import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginPage } from '@/components/LoginPage';
import { Navigation } from '@/components/Navigation';
import { BookDetailsModal } from '@/components/BookDetailsModal';
import { ReadingSessionTracker } from '@/components/ReadingSessionTracker';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BookManagementModal } from '@/components/BookManagementModal';
import { ReadingDashboard } from '@/components/ReadingDashboard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CommandPalette } from '@/components/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useBookshelf } from '@/hooks/useBookshelf';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for better initial load
const EnhancedBookSearch = lazy(() => import('@/components/EnhancedBookSearch').then(m => ({ default: m.EnhancedBookSearch })));
const BookRecommendations = lazy(() => import('@/components/BookRecommendations').then(m => ({ default: m.BookRecommendations })));
const MyBookshelf = lazy(() => import('@/components/MyBookshelf').then(m => ({ default: m.MyBookshelf })));
const StatsDashboard = lazy(() => import('@/components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const ProfileSection = lazy(() => import('@/components/ProfileSection').then(m => ({ default: m.ProfileSection })));
const QuoteCollection = lazy(() => import('@/components/QuoteCollection').then(m => ({ default: m.QuoteCollection })));
const ReadingMoodJournal = lazy(() => import('@/components/ReadingMoodJournal').then(m => ({ default: m.ReadingMoodJournal })));
const ReadingAtmosphere = lazy(() => import('@/components/ReadingAtmosphere').then(m => ({ default: m.ReadingAtmosphere })));
const ReadingChallenges = lazy(() => import('@/components/ReadingChallenges').then(m => ({ default: m.ReadingChallenges })));
const BookComparison = lazy(() => import('@/components/BookComparison').then(m => ({ default: m.BookComparison })));
const ReadingLists = lazy(() => import('@/components/ReadingLists').then(m => ({ default: m.ReadingLists })));
const BookAnnotations = lazy(() => import('@/components/BookAnnotations').then(m => ({ default: m.BookAnnotations })));
const SocialSharing = lazy(() => import('@/components/SocialSharing').then(m => ({ default: m.SocialSharing })));
const AIBookInsights = lazy(() => import('@/components/AIBookInsights').then(m => ({ default: m.AIBookInsights })));
const ISBNScanner = lazy(() => import('@/components/ISBNScanner').then(m => ({ default: m.ISBNScanner })));
const ReadingWrapped = lazy(() => import('@/components/ReadingWrapped').then(m => ({ default: m.ReadingWrapped })));
const GoodreadsImport = lazy(() => import('@/components/GoodreadsImport').then(m => ({ default: m.GoodreadsImport })));
const LiveReadingTimer = lazy(() => import('@/components/LiveReadingTimer').then(m => ({ default: m.LiveReadingTimer })));
const AIReadingCoach = lazy(() => import('@/components/AIReadingCoach').then(m => ({ default: m.AIReadingCoach })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const SIDEBAR_COLLAPSED_KEY = 'bookvault_sidebar_collapsed';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'atmosphere' | 'challenges' | 'comparison' | 'lists' | 'annotations' | 'sharing' | 'scanner' | 'wrapped' | 'import' | 'timer' | 'coach'>('dashboard');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [managingBook, setManagingBook] = useState<Book | null>(null);
  const [readingSessionBook, setReadingSessionBook] = useState<Book | null>(null);
  const [insightsBook, setInsightsBook] = useState<Book | null>(null);
  const { bookshelf, setBookshelf, loadBooks, addBook: addToBookshelf, updateBook: updateBookInShelf, removeBook: removeFromBookshelf, isInBookshelf } = useBookshelf(user?.id);
  const [readingGoal, setReadingGoal] = useState<number>(12);
  const isMobile = useIsMobile();

  // Keyboard shortcuts
  const navViews = ['dashboard', 'search', 'shelf', 'stats', 'recommendations', 'quotes', 'mood', 'atmosphere', 'challenges'] as const;
  useKeyboardShortcuts(
    navViews.map((view, i) => ({
      key: String(i + 1),
      handler: () => setCurrentView(view),
      description: `Navigate to ${view}`,
    })).concat([
      { key: '/', handler: () => setCurrentView('search'), description: 'Focus search' },
      { key: 'Escape', handler: () => { setSelectedBook(null); setManagingBook(null); setReadingSessionBook(null); setInsightsBook(null); setCommandPaletteOpen(false); }, description: 'Close modals' },
    ])
  );

  // ⌘K / Ctrl+K for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Read sidebar collapsed state for layout offset
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  // Listen for sidebar collapse changes
  useEffect(() => {
    const check = () => setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
    const interval = setInterval(check, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user);
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profile) {
        setCurrentUser(profile.username || profile.email || 'Reader');
        setReadingGoal(profile.reading_goal || 12);
        
        if (!profile.favorite_genres && profile.reading_goal === null) {
          setShowOnboarding(true);
        }
      } else {
        setCurrentUser(authUser.email?.split('@')[0] || 'Reader');
        setShowOnboarding(true);
      }

      await loadBooks(authUser.id);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {};

  const handleOnboardingComplete = async (preferences: any) => {
    if (!user) return;
    
    try {
      await supabase.from('profiles').upsert({
        user_id: user.id,
        favorite_genres: preferences.favoriteGenres || [],
        reading_goal: preferences.readingGoal || 12,
        preferred_reading_time: preferences.preferredReadingTime || 'evening',
        updated_at: new Date().toISOString()
      });
      
      setShowOnboarding(false);
      toast.success('Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleOnboardingSkip = async () => {
    if (!user) return;
    
    try {
      await supabase.from('profiles').upsert({
        user_id: user.id,
        reading_goal: 12,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving skip state:', error);
    }
    
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentUser('');
    setBookshelf([]);
    setShowOnboarding(false);
    toast.success('Logged out successfully');
  };

  const handleReadingSessionComplete = async (sessionData: any) => {
    if (!user) return;

    const book = bookshelf.find(b => b.id === sessionData.bookId);
    if (book) {
      const updatedBook = {
        ...book,
        timeSpentReading: (book.timeSpentReading || 0) + sessionData.duration,
        currentPage: (book.currentPage || 0) + sessionData.pagesRead,
        readingProgress: book.pageCount 
          ? Math.min(100, ((book.currentPage || 0) + sessionData.pagesRead) / book.pageCount * 100)
          : 0
      };
      await updateBookInShelf(updatedBook);

      await supabase.from('reading_sessions').insert({
        user_id: user.id,
        book_id: sessionData.bookId,
        duration_minutes: sessionData.duration,
        pages_read: sessionData.pagesRead,
        notes: sessionData.notes
      });
    }
    setReadingSessionBook(null);
  };

  const handleBookSelect = (book: Book) => {
    const bookshelfBook = bookshelf.find(b => b.id === book.id);
    setSelectedBook(bookshelfBook || book);
  };

  const handleManageBook = (book: Book) => {
    const bookshelfBook = bookshelf.find(b => b.id === book.id);
    setManagingBook(bookshelfBook || book);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-animate" />
        <div className="aurora-container">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
        </div>
        <div className="relative text-center">
          {/* Animated concentric rings */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border border-secondary/15 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '16s' }} />
            <div className="absolute inset-4 rounded-full border border-primary/8 animate-spin-slow" style={{ animationDuration: '24s' }} />
            <div className="absolute inset-6 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl gradient-primary flex items-center justify-center p-4 shadow-xl animate-pulse-soft logo-glow">
                <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text-mixed mb-2">BookVault</h1>
          <p className="text-sm text-muted-foreground/70 font-medium tracking-wide">Your reading sanctuary</p>
          <div className="mt-5 w-32 h-1 mx-auto rounded-full overflow-hidden bg-muted/50">
            <div className="h-full gradient-primary rounded-full loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="blob-1 -top-60 -right-60 opacity-25" />
      <div className="blob-2 -bottom-60 -left-60 opacity-15" />
      <div className="blob-3 top-1/2 left-1/3 opacity-10" />

      {/* Sidebar Navigation */}
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        bookshelfCount={bookshelf.length}
        onLogout={handleLogout}
        currentUser={currentUser}
        userEmail={user?.email}
      />

      {/* Main content area — offset by sidebar width */}
      <div
        className="relative z-10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
          {/* Page header is handled by each section component */}

          {/* Main Content with page transitions */}
          <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Suspense fallback={<LazyFallback />}>
              {currentView === 'dashboard' && (
                <ReadingDashboard
                  books={bookshelf}
                  currentUser={currentUser}
                  onViewChange={setCurrentView}
                  readingGoal={readingGoal}
                />
              )}
              
              {currentView === 'search' && (
                <EnhancedBookSearch
                  onBookSelect={handleBookSelect}
                  onAddToBookshelf={addToBookshelf}
                  isInBookshelf={isInBookshelf}
                />
              )}
              
              {currentView === 'recommendations' && (
                <BookRecommendations
                  userBooks={bookshelf}
                  onBookSelect={handleBookSelect}
                  onAddToBookshelf={addToBookshelf}
                  isInBookshelf={isInBookshelf}
                />
              )}
              
              {currentView === 'shelf' && (
                <MyBookshelf
                  books={bookshelf}
                  onBookSelect={handleBookSelect}
                  onRemoveFromBookshelf={removeFromBookshelf}
                  onUpdateBook={updateBookInShelf}
                  onManageBook={handleManageBook}
                />
              )}
              
              {currentView === 'stats' && (
                <StatsDashboard 
                  books={bookshelf} 
                  currentUser={currentUser}
                />
              )}

              {currentView === 'profile' && (
                <ProfileSection
                  books={bookshelf}
                  currentUser={currentUser}
                  userEmail={user?.email}
                  userId={user?.id}
                />
              )}

              {currentView === 'quotes' && (
                <QuoteCollection books={bookshelf} />
              )}

              {currentView === 'mood' && (
                <ReadingMoodJournal books={bookshelf} />
              )}

              {currentView === 'atmosphere' && (
                <ReadingAtmosphere books={bookshelf} />
              )}

              {currentView === 'challenges' && (
                <ReadingChallenges books={bookshelf} />
              )}

              {currentView === 'comparison' && (
                <BookComparison books={bookshelf} onBookSelect={handleBookSelect} />
              )}

              {currentView === 'lists' && (
                <ReadingLists books={bookshelf} onBookSelect={handleBookSelect} />
              )}

              {currentView === 'annotations' && (
                <BookAnnotations books={bookshelf} onBookSelect={handleBookSelect} />
              )}

              {currentView === 'sharing' && (
                <SocialSharing books={bookshelf} />
              )}

              {currentView === 'scanner' && (
                <ISBNScanner
                  onBookFound={handleBookSelect}
                  onAddToBookshelf={addToBookshelf}
                  isInBookshelf={isInBookshelf}
                />
              )}

              {currentView === 'wrapped' && (
                <ReadingWrapped books={bookshelf} currentUser={currentUser} />
              )}

              {currentView === 'import' && (
                <GoodreadsImport
                  onImportBooks={async (books) => {
                    for (const book of books) {
                      await addToBookshelf(book);
                    }
                  }}
                  existingBookIds={new Set(bookshelf.map(b => b.id))}
                />
              )}

              {currentView === 'timer' && (
                <LiveReadingTimer
                  books={bookshelf}
                  onSessionComplete={handleReadingSessionComplete}
                />
              )}

              {currentView === 'coach' && (
                <AIReadingCoach books={bookshelf} userId={user?.id} />
              )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
          </ErrorBoundary>
        </div>
      </div>

      {/* Modals */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAddToBookshelf={addToBookshelf}
          onRemoveFromBookshelf={removeFromBookshelf}
          onUpdateBook={updateBookInShelf}
          onStartReadingSession={() => {
            setReadingSessionBook(selectedBook);
            setSelectedBook(null);
          }}
          onManageBook={() => {
            setManagingBook(selectedBook);
            setSelectedBook(null);
          }}
          isInBookshelf={isInBookshelf(selectedBook.id)}
          onAIInsights={() => {
            setInsightsBook(selectedBook);
            setSelectedBook(null);
          }}
        />
      )}

      {managingBook && (
        <BookManagementModal
          book={managingBook}
          onClose={() => setManagingBook(null)}
          onSave={updateBookInShelf}
        />
      )}

      {readingSessionBook && (
        <ReadingSessionTracker
          book={readingSessionBook}
          onSessionComplete={handleReadingSessionComplete}
          onClose={() => setReadingSessionBook(null)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddBook={() => setCurrentView('search')}
        onScanISBN={() => setCurrentView('scanner')}
        onStartSession={() => {
          const readingBook = bookshelf.find(b => b.readingStatus === 'reading');
          if (readingBook) {
            setReadingSessionBook(readingBook);
          } else {
            toast.info('Start reading a book first to begin a session');
          }
        }}
        onLogMood={() => setCurrentView('mood')}
      />

      {/* AI Book Insights Modal */}
      {insightsBook && (
        <AIBookInsights
          book={insightsBook}
          userBooks={bookshelf}
          onClose={() => setInsightsBook(null)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        onBookSelect={handleBookSelect}
        books={bookshelf}
      />
    </div>
  );
};

export default Index;
