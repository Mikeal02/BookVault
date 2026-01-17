import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  Zap, 
  CloudRain, 
  Sun, 
  Moon, 
  Flame,
  Snowflake,
  BookOpen,
  Plus,
  Calendar,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface MoodEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  mood: string;
  moodEmoji: string;
  intensity: number; // 1-5
  notes?: string;
  chapter?: string;
  createdAt: string;
}

interface ReadingMoodJournalProps {
  books: Book[];
}

const moodOptions = [
  { value: 'excited', label: 'Excited', emoji: '🤩', icon: Zap, color: 'bg-yellow-500' },
  { value: 'happy', label: 'Happy', emoji: '😊', icon: Smile, color: 'bg-green-500' },
  { value: 'peaceful', label: 'Peaceful', emoji: '😌', icon: Sun, color: 'bg-blue-400' },
  { value: 'romantic', label: 'Romantic', emoji: '🥰', icon: Heart, color: 'bg-pink-500' },
  { value: 'inspired', label: 'Inspired', emoji: '✨', icon: Flame, color: 'bg-orange-500' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔', icon: Moon, color: 'bg-indigo-500' },
  { value: 'melancholy', label: 'Melancholy', emoji: '😢', icon: CloudRain, color: 'bg-slate-500' },
  { value: 'tense', label: 'Tense', emoji: '😰', icon: Snowflake, color: 'bg-cyan-500' },
  { value: 'sad', label: 'Sad', emoji: '😔', icon: Frown, color: 'bg-gray-500' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', icon: Meh, color: 'bg-gray-400' },
];

export const ReadingMoodJournal = ({ books }: ReadingMoodJournalProps) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [chapter, setChapter] = useState('');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');

  useEffect(() => {
    const savedEntries = localStorage.getItem('reading-mood-journal');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('reading-mood-journal', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = () => {
    if (!selectedBookId || !selectedMood) {
      toast.error('Please select a book and mood');
      return;
    }

    const book = books.find(b => b.id === selectedBookId);
    const mood = moodOptions.find(m => m.value === selectedMood);
    if (!book || !mood) return;

    const entry: MoodEntry = {
      id: Date.now().toString(),
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.imageLinks?.thumbnail,
      mood: mood.value,
      moodEmoji: mood.emoji,
      intensity,
      notes: notes.trim() || undefined,
      chapter: chapter.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setEntries(prev => [entry, ...prev]);
    setSelectedBookId('');
    setSelectedMood('');
    setIntensity(3);
    setNotes('');
    setChapter('');
    setIsAddingEntry(false);
    toast.success('Mood logged! 📖');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  const filteredEntries = entries.filter(e => {
    if (filterBook !== 'all' && e.bookId !== filterBook) return false;
    if (filterMood !== 'all' && e.mood !== filterMood) return false;
    return true;
  });

  const getMoodStats = () => {
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);
  };

  const moodStats = getMoodStats();
  const topMood = moodStats[0];
  const booksWithEntries = [...new Set(entries.map(e => e.bookId))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text-mixed flex items-center gap-3">
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" />
            Reading Mood Journal
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track how books make you feel
          </p>
        </div>
        
        <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Log Mood</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                How are you feeling?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">What are you reading?</label>
                <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-popover border z-[100]">
                    {books.filter(b => b.readingStatus === 'reading').length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Currently Reading</div>
                        {books.filter(b => b.readingStatus === 'reading').map(book => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">All Books</div>
                    {books.map(book => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">How does it make you feel?</label>
                <div className="grid grid-cols-5 gap-2">
                  {moodOptions.map(mood => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                        selectedMood === mood.value
                          ? 'border-primary bg-primary/10 scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl block">{mood.emoji}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 block truncate">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Intensity (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      onClick={() => setIntensity(i)}
                      className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${
                        intensity >= i
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Chapter/Section (optional)</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g., Chapter 5"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What's happening in the story? Why do you feel this way?"
                  className="min-h-[80px] resize-none"
                />
              </div>

              <Button 
                onClick={handleAddEntry} 
                className="w-full gradient-primary text-white"
                disabled={!selectedBookId || !selectedMood}
              >
                Log This Mood
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mood Overview */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="glass-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{entries.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Mood Entries</p>
          </Card>
          <Card className="glass-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{booksWithEntries.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Books Tracked</p>
          </Card>
          <Card className="glass-card p-3 sm:p-4 text-center">
            {topMood && (
              <>
                <p className="text-2xl sm:text-3xl">{moodOptions.find(m => m.value === topMood.mood)?.emoji}</p>
                <p className="text-xs sm:text-sm text-muted-foreground capitalize">Top Mood</p>
              </>
            )}
          </Card>
          <Card className="glass-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">
              {(entries.reduce((acc, e) => acc + e.intensity, 0) / entries.length).toFixed(1)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Avg Intensity</p>
          </Card>
        </div>
      )}

      {/* Mood Distribution */}
      {moodStats.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Mood Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {moodStats.slice(0, 6).map(stat => {
                const mood = moodOptions.find(m => m.value === stat.mood);
                if (!mood) return null;
                return (
                  <Badge 
                    key={stat.mood}
                    variant="secondary"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                  >
                    <span className="mr-1">{mood.emoji}</span>
                    {mood.label}: {stat.count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={filterBook} onValueChange={setFilterBook}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by book" />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-[100]">
              <SelectItem value="all">All Books</SelectItem>
              {booksWithEntries.map(bookId => {
                const entry = entries.find(e => e.bookId === bookId);
                return (
                  <SelectItem key={bookId} value={bookId}>
                    {entry?.bookTitle}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by mood" />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-[100]">
              <SelectItem value="all">All Moods</SelectItem>
              {moodOptions.map(mood => (
                <SelectItem key={mood.value} value={mood.value}>
                  {mood.emoji} {mood.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Entries Timeline */}
      {filteredEntries.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No mood entries yet</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base max-w-md px-4">
              Start tracking how your books make you feel and discover patterns in your reading emotions
            </p>
            <Button onClick={() => setIsAddingEntry(true)} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Log Your First Mood
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredEntries.map((entry, index) => {
            const mood = moodOptions.find(m => m.value === entry.mood);
            const MoodIcon = mood?.icon || Meh;
            
            return (
              <Card 
                key={entry.id} 
                className="glass-card overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Book Cover */}
                    {entry.bookCover ? (
                      <img 
                        src={entry.bookCover} 
                        alt={entry.bookTitle}
                        className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-lg shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 sm:w-14 sm:h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{entry.bookTitle}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`${mood?.color} text-white text-xs`}>
                              <span className="mr-1">{entry.moodEmoji}</span>
                              {mood?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Intensity: {entry.intensity}/5
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Chapter */}
                      {entry.chapter && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          📖 {entry.chapter}
                        </p>
                      )}

                      {/* Notes */}
                      {entry.notes && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                          {entry.notes}
                        </p>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
