import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { EnhancedBookSearch } from '@/components/EnhancedBookSearch';
import { BookRecommendations } from '@/components/BookRecommendations';
import { MyBookshelf } from '@/components/MyBookshelf';
import { Navigation } from '@/components/Navigation';
import { BookDetailsModal } from '@/components/BookDetailsModal';
import { ReadingSessionTracker } from '@/components/ReadingSessionTracker';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatsDashboard } from '@/components/StatsDashboard';
import { BookManagementModal } from '@/components/BookManagementModal';
import { ReadingDashboard } from '@/components/ReadingDashboard';
import { ProfileSection } from '@/components/ProfileSection';
import { QuoteCollection } from '@/components/QuoteCollection';
import { ReadingMoodJournal } from '@/components/ReadingMoodJournal';
import { TBRRandomizer } from '@/components/TBRRandomizer';
import { ReadingAtmosphere } from '@/components/ReadingAtmosphere';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'randomizer' | 'atmosphere'>('dashboard');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [managingBook, setManagingBook] = useState<Book | null>(null);
  const [readingSessionBook, setReadingSessionBook] = useState<Book | null>(null);
  const [bookshelf, setBookshelf] = useState<Book[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer loading user data to avoid deadlock
          setTimeout(() => {
            loadUserData(session.user);
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
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
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profile) {
        setCurrentUser(profile.username || profile.email || 'Reader');
        
        // Only show onboarding if profile exists but has no genres AND no reading goal set (meaning never completed or skipped)
        // Once user skips, we set reading_goal to 12 as default, so this won't trigger again
        if (!profile.favorite_genres && profile.reading_goal === null) {
          setShowOnboarding(true);
        }
      } else {
        setCurrentUser(authUser.email?.split('@')[0] || 'Reader');
        // New users without a profile will get onboarding
        setShowOnboarding(true);
      }

      // Load user books
      const { data: userBooks, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', authUser.id);

      if (error) {
        console.error('Error loading books:', error);
      } else if (userBooks) {
        const books: Book[] = userBooks.map(ub => ({
          id: ub.book_id,
          title: ub.title,
          authors: ub.authors || [],
          description: ub.description || undefined,
          publishedDate: ub.published_date || undefined,
          publisher: ub.publisher || undefined,
          pageCount: ub.page_count || undefined,
          categories: ub.categories || undefined,
          imageLinks: ub.thumbnail_url ? { thumbnail: ub.thumbnail_url } : undefined,
          averageRating: ub.average_rating ? Number(ub.average_rating) : undefined,
          ratingsCount: ub.ratings_count || undefined,
          language: ub.language || undefined,
          previewLink: ub.preview_link || undefined,
          infoLink: ub.info_link || undefined,
          readingStatus: (ub.reading_status as 'not-read' | 'reading' | 'finished') || 'not-read',
          personalRating: ub.personal_rating || undefined,
          readingProgress: ub.reading_progress || 0,
          currentPage: ub.current_page || 0,
          timeSpentReading: ub.time_spent_reading || 0,
          notes: ub.notes || undefined,
          myThoughts: ub.my_thoughts || undefined,
          tags: ub.tags || [],
          dateAdded: ub.date_added || undefined,
          dateStarted: ub.date_started || undefined,
          dateFinished: ub.date_finished || undefined,
        }));
        setBookshelf(books);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Auth state listener will handle the rest
  };

  const handleOnboardingComplete = async (preferences: any) => {
    if (!user) return;
    
    try {
      await supabase.from('profiles').upsert({
        user_id: user.id,
        favorite_genres: preferences.genres || [],
        reading_goal: preferences.readingGoal || 12,
        preferred_reading_time: preferences.preferredTime || 'evening',
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
    
    // Save default values to prevent onboarding from showing again
    try {
      await supabase.from('profiles').upsert({
        user_id: user.id,
        reading_goal: 12, // Set default reading goal to mark onboarding as completed/skipped
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

  const addToBookshelf = async (book: Book) => {
    if (!user) return;

    const bookData = {
      user_id: user.id,
      book_id: book.id,
      title: book.title,
      authors: book.authors,
      description: book.description,
      published_date: book.publishedDate,
      publisher: book.publisher,
      page_count: book.pageCount,
      categories: book.categories,
      thumbnail_url: book.imageLinks?.thumbnail,
      average_rating: book.averageRating,
      ratings_count: book.ratingsCount,
      language: book.language,
      preview_link: book.previewLink,
      info_link: book.infoLink,
      reading_status: 'not-read',
      personal_rating: 0,
      reading_progress: 0,
      current_page: 0,
      time_spent_reading: 0,
      notes: '',
      my_thoughts: '',
      tags: [],
      date_added: new Date().toISOString()
    };

    const { error } = await supabase.from('user_books').insert(bookData);

    if (error) {
      if (error.code === '23505') {
        toast.error('This book is already in your library');
      } else {
        console.error('Error adding book:', error);
        toast.error('Failed to add book');
      }
      return;
    }

    const bookWithDefaults: Book = {
      ...book,
      dateAdded: new Date().toISOString(),
      readingStatus: 'not-read',
      tags: [],
      notes: '',
      myThoughts: '',
      personalRating: 0,
      readingProgress: 0,
      timeSpentReading: 0,
      currentPage: 0
    };
    
    setBookshelf(prev => [...prev, bookWithDefaults]);
    toast.success('Book added to your library!');
  };

  const updateBookInShelf = async (updatedBook: Book) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_books')
      .update({
        reading_status: updatedBook.readingStatus,
        personal_rating: updatedBook.personalRating,
        reading_progress: updatedBook.readingProgress,
        current_page: updatedBook.currentPage,
        time_spent_reading: updatedBook.timeSpentReading,
        notes: updatedBook.notes,
        my_thoughts: updatedBook.myThoughts,
        tags: updatedBook.tags,
        date_started: updatedBook.dateStarted,
        date_finished: updatedBook.dateFinished,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('book_id', updatedBook.id);

    if (error) {
      console.error('Error updating book:', error);
      toast.error('Failed to update book');
      return;
    }

    setBookshelf(prev => prev.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
    toast.success('Book updated!');
  };

  const removeFromBookshelf = async (bookId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      return;
    }

    setBookshelf(prev => prev.filter(book => book.id !== bookId));
    toast.success('Book removed from library');
  };

  const isInBookshelf = (bookId: string) => {
    return bookshelf.some(book => book.id === bookId);
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

      // Save reading session
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-soft p-3">
            <img src="/favicon.ico" alt="BookVault" className="w-full h-full object-contain" />
          </div>
          <p className="text-xl font-medium text-foreground">Loading BookVault...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="blob-1 -top-60 -right-60 opacity-30" />
      <div className="blob-2 -bottom-60 -left-60 opacity-20" />
      
      <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 md:w-14 sm:h-12 md:h-14 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-float p-1.5 sm:p-2 flex-shrink-0">
              <img src="/favicon.ico" alt="BookVault" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text-mixed">
                BookVault
              </h1>
              <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base truncate">
                Your personal reading sanctuary
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 glass-card text-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>

        <Navigation 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          bookshelfCount={bookshelf.length} 
        />

        {/* Main Content */}
        <div className="animate-fade-in">
          {currentView === 'dashboard' && (
            <ReadingDashboard
              books={bookshelf}
              currentUser={currentUser}
              onViewChange={setCurrentView}
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

          {currentView === 'randomizer' && (
            <TBRRandomizer books={bookshelf} onBookSelect={handleBookSelect} />
          )}

          {currentView === 'atmosphere' && (
            <ReadingAtmosphere books={bookshelf} />
          )}
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
      </div>
    </div>
  );
};

export default Index;
