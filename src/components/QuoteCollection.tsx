import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quote, Plus, Heart, Share2, Trash2, BookOpen, Sparkles, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SavedQuote {
  id: string;
  text: string;
  pageNumber?: number;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  createdAt: string;
  isFavorite: boolean;
  theme: 'classic' | 'modern' | 'warm' | 'ocean' | 'sunset' | 'forest';
}

interface QuoteCollectionProps {
  books: Book[];
}

const quoteThemes = {
  classic: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
    text: 'text-amber-900 dark:text-amber-100',
    accent: 'border-amber-300 dark:border-amber-700',
  },
  modern: {
    bg: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900',
    text: 'text-slate-800 dark:text-slate-100',
    accent: 'border-slate-300 dark:border-slate-600',
  },
  warm: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30',
    text: 'text-rose-900 dark:text-rose-100',
    accent: 'border-rose-300 dark:border-rose-700',
  },
  ocean: {
    bg: 'bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30',
    text: 'text-teal-900 dark:text-teal-100',
    accent: 'border-teal-300 dark:border-teal-700',
  },
  sunset: {
    bg: 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
    text: 'text-red-900 dark:text-red-100',
    accent: 'border-red-300 dark:border-red-700',
  },
  forest: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30',
    text: 'text-emerald-900 dark:text-emerald-100',
    accent: 'border-emerald-300 dark:border-emerald-700',
  },
};

export const QuoteCollection = ({ books }: QuoteCollectionProps) => {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<SavedQuote['theme']>('classic');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedQuotes = localStorage.getItem('book-quotes');
    if (savedQuotes) {
      setQuotes(JSON.parse(savedQuotes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('book-quotes', JSON.stringify(quotes));
  }, [quotes]);

  const handleAddQuote = () => {
    if (!newQuote.trim() || !selectedBookId) {
      toast.error('Please enter a quote and select a book');
      return;
    }

    const book = books.find(b => b.id === selectedBookId);
    if (!book) return;

    const quote: SavedQuote = {
      id: Date.now().toString(),
      text: newQuote.trim(),
      pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.authors?.[0] || 'Unknown Author',
      bookCover: book.imageLinks?.thumbnail,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      theme: selectedTheme,
    };

    setQuotes(prev => [quote, ...prev]);
    setNewQuote('');
    setPageNumber('');
    setSelectedBookId('');
    setIsAddingQuote(false);
    toast.success('Quote saved! ✨');
  };

  const toggleFavorite = (id: string) => {
    setQuotes(prev =>
      prev.map(q => (q.id === id ? { ...q, isFavorite: !q.isFavorite } : q))
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    toast.success('Quote deleted');
  };

  const copyQuote = async (quote: SavedQuote) => {
    const text = `"${quote.text}"\n— ${quote.bookAuthor}, ${quote.bookTitle}${quote.pageNumber ? ` (p. ${quote.pageNumber})` : ''}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Quote copied to clipboard!');
  };

  const exportQuotes = () => {
    const text = quotes
      .map(q => `"${q.text}"\n— ${q.bookAuthor}, ${q.bookTitle}${q.pageNumber ? ` (p. ${q.pageNumber})` : ''}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-book-quotes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Quotes exported!');
  };

  const filteredQuotes = quotes.filter(q => {
    if (filterBook !== 'all' && q.bookId !== filterBook) return false;
    if (showFavoritesOnly && !q.isFavorite) return false;
    return true;
  });

  const booksWithQuotes = [...new Set(quotes.map(q => q.bookId))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text-mixed flex items-center gap-3">
            <Quote className="w-7 h-7 sm:w-8 sm:h-8" />
            Quote Collection
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Save and share your favorite book quotes
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {quotes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportQuotes}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <Dialog open={isAddingQuote} onOpenChange={setIsAddingQuote}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Quote</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Save a Quote
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Book</label>
                  <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book from your library" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-popover border z-[100]">
                      {books.map(book => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Quote</label>
                  <Textarea
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="Enter the quote..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Page Number</label>
                    <Input
                      type="number"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Card Theme</label>
                    <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as SavedQuote['theme'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-[100]">
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="ocean">Ocean</SelectItem>
                        <SelectItem value="sunset">Sunset</SelectItem>
                        <SelectItem value="forest">Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Theme Preview */}
                {newQuote && (
                  <div className={`p-4 rounded-xl border-2 ${quoteThemes[selectedTheme].bg} ${quoteThemes[selectedTheme].accent}`}>
                    <p className={`text-sm italic ${quoteThemes[selectedTheme].text}`}>
                      "{newQuote}"
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleAddQuote} 
                  className="w-full gradient-primary text-white"
                  disabled={!newQuote.trim() || !selectedBookId}
                >
                  Save Quote
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      {quotes.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={filterBook} onValueChange={setFilterBook}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by book" />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-[100]">
              <SelectItem value="all">All Books</SelectItem>
              {booksWithQuotes.map(bookId => {
                const quote = quotes.find(q => q.bookId === bookId);
                return (
                  <SelectItem key={bookId} value={bookId}>
                    {quote?.bookTitle}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="flex items-center gap-2"
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </Button>
        </div>
      )}

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base max-w-md px-4">
              Start building your collection of memorable passages from your favorite books
            </p>
            <Button onClick={() => setIsAddingQuote(true)} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Quote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredQuotes.map((quote, index) => {
            const theme = quoteThemes[quote.theme];
            return (
              <Card
                key={quote.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${theme.bg} border-2 ${theme.accent} animate-fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Quote Icon */}
                  <Quote className={`w-6 h-6 sm:w-8 sm:h-8 ${theme.text} opacity-30 mb-3`} />
                  
                  {/* Quote Text */}
                  <blockquote className={`text-base sm:text-lg font-serif italic leading-relaxed mb-4 ${theme.text}`}>
                    "{quote.text}"
                  </blockquote>
                  
                  {/* Book Info */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-current/10">
                    {quote.bookCover ? (
                      <img 
                        src={quote.bookCover} 
                        alt={quote.bookTitle}
                        className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-14 sm:w-12 sm:h-16 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm sm:text-base truncate ${theme.text}`}>
                        {quote.bookTitle}
                      </p>
                      <p className={`text-xs sm:text-sm opacity-70 ${theme.text}`}>
                        {quote.bookAuthor}
                      </p>
                      {quote.pageNumber && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Page {quote.pageNumber}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => toggleFavorite(quote.id)}
                    >
                      <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${quote.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => copyQuote(quote)}
                    >
                      {copiedId === quote.id ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {quotes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Card className="glass-card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{quotes.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Quotes</p>
          </Card>
          <Card className="glass-card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{quotes.filter(q => q.isFavorite).length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Favorites</p>
          </Card>
          <Card className="glass-card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">{booksWithQuotes.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Books Quoted</p>
          </Card>
          <Card className="glass-card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold gradient-text-mixed">
              {Math.round(quotes.reduce((acc, q) => acc + q.text.length, 0) / quotes.length) || 0}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Avg. Length</p>
          </Card>
        </div>
      )}
    </div>
  );
};
