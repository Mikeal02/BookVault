
import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Heart, TrendingUp, Shuffle, Filter } from 'lucide-react';
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { searchBooks } from '@/services/googleBooks';
import { Button } from '@/components/ui/button';

interface BookRecommendationsProps {
  userBooks: Book[];
  onBookSelect: (book: Book) => void;
  onAddToBookshelf: (book: Book) => void;
  isInBookshelf: (bookId: string) => boolean;
}

export const BookRecommendations = ({ 
  userBooks, 
  onBookSelect, 
  onAddToBookshelf, 
  isInBookshelf 
}: BookRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'similar' | 'trending' | 'genre'>('similar');
  const [showFilters, setShowFilters] = useState(false);

  const getPopularBookQueries = (type: string) => {
    const popularBooks: Record<string, string[][]> = {
      similar: [
        ['The Great Gatsby', 'To Kill a Mockingbird', '1984 George Orwell'],
        ['Harry Potter', 'The Lord of the Rings', 'The Hunger Games'],
        ['Pride and Prejudice', 'Jane Eyre', 'Little Women'],
        ['The Catcher in the Rye', 'The Alchemist Paulo Coelho', 'Life of Pi']
      ],
      genre: [
        ['Stephen King', 'Agatha Christie mystery', 'James Patterson thriller'],
        ['Colleen Hoover romance', 'Nicholas Sparks', 'Nora Roberts'],
        ['Brandon Sanderson fantasy', 'Patrick Rothfuss', 'Sarah J Maas'],
        ['Malcolm Gladwell', 'Brene Brown', 'Atomic Habits James Clear']
      ],
      trending: [
        ['Fourth Wing Rebecca Yarros', 'Tomorrow and Tomorrow and Tomorrow', 'Lessons in Chemistry'],
        ['It Ends with Us Colleen Hoover', 'The Seven Husbands of Evelyn Hugo', 'Where the Crawdads Sing'],
        ['Project Hail Mary Andy Weir', 'The Midnight Library Matt Haig', 'Circe Madeline Miller'],
        ['Atomic Habits', 'The Silent Patient', 'A Court of Thorns and Roses']
      ]
    };
    
    const typeQueries = popularBooks[type] || popularBooks.trending;
    return typeQueries[Math.floor(Math.random() * typeQueries.length)];
  };

  useEffect(() => {
    generateRecommendations();
  }, [userBooks, recommendationType]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    try {
      let searchQueries: string[] = [];

      switch (recommendationType) {
        case 'similar':
          if (userBooks.length > 0) {
            const topRatedBooks = userBooks
              .filter(book => (book.personalRating || 0) >= 4)
              .slice(0, 2);
            
            if (topRatedBooks.length > 0) {
              searchQueries = topRatedBooks.map(book => 
                book.authors?.[0] || book.title
              );
            }
          }
          
          if (searchQueries.length === 0) {
            searchQueries = getPopularBookQueries('similar');
          }
          break;

        case 'genre':
          if (userBooks.length > 0) {
            const genres = userBooks
              .flatMap(book => book.categories || [])
              .reduce((acc, genre) => {
                acc[genre] = (acc[genre] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
            
            const topGenres = Object.entries(genres)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([genre]) => `${genre} bestseller`);
            
            if (topGenres.length > 0) {
              searchQueries = topGenres;
            }
          }
          
          if (searchQueries.length === 0) {
            searchQueries = getPopularBookQueries('genre');
          }
          break;

        case 'trending':
          searchQueries = getPopularBookQueries('trending');
          break;
      }

      const allRecommendations: Book[] = [];
      
      for (const query of searchQueries) {
        try {
          const results = await searchBooks(query, 15);
          const filtered = results.filter(book => 
            !isInBookshelf(book.id) && 
            book.imageLinks?.thumbnail &&
            book.averageRating && book.averageRating >= 3.5
          );
          allRecommendations.push(...filtered);
        } catch (error) {
          console.error(`Failed to search for ${query}:`, error);
        }
      }

      const sortedByQuality = allRecommendations
        .filter((book, index, self) => 
          index === self.findIndex(b => b.id === book.id)
        )
        .sort((a, b) => {
          const scoreA = (a.averageRating || 0) * Math.log10((a.ratingsCount || 1) + 1);
          const scoreB = (b.averageRating || 0) * Math.log10((b.ratingsCount || 1) + 1);
          return scoreB - scoreA;
        });

      const topBooks = sortedByQuality.slice(0, 20);
      const shuffled = topBooks.sort(() => Math.random() - 0.5).slice(0, 12);

      setRecommendations(shuffled);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationTitle = () => {
    switch (recommendationType) {
      case 'similar':
        return 'Based on Your Favorites';
      case 'genre':
        return 'More in Your Favorite Genres';
      case 'trending':
        return 'Trending Now';
      default:
        return 'Recommended for You';
    }
  };

  const getRecommendationIcon = () => {
    switch (recommendationType) {
      case 'similar':
        return <Heart className="w-5 h-5" />;
      case 'genre':
        return <Sparkles className="w-5 h-5" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 gradient-primary rounded-xl text-white shadow-lg">
              {getRecommendationIcon()}
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text-mixed">
                {getRecommendationTitle()}
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover your next great read • {recommendations.length} books found
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <Button
              onClick={generateRecommendations}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-secondary/30 text-secondary hover:bg-secondary/10"
            >
              <Shuffle className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Shuffle
            </Button>

            <Button
              onClick={generateRecommendations}
              disabled={loading}
              className="gradient-primary text-white shadow-lg hover:opacity-90"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'similar', label: 'Similar to My Books', icon: Heart },
                { type: 'genre', label: 'My Favorite Genres', icon: Sparkles },
                { type: 'trending', label: 'Trending & Popular', icon: TrendingUp }
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setRecommendationType(type as any)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    recommendationType === type
                      ? 'gradient-primary text-white shadow-lg'
                      : 'bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-80 rounded-xl mb-4"></div>
              <div className="bg-muted h-4 rounded mb-2"></div>
              <div className="bg-muted h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((book, index) => (
            <div key={book.id} className="group relative animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <BookCard
                book={book}
                onSelect={() => onBookSelect(book)}
                onAddToBookshelf={() => onAddToBookshelf(book)}
                isInBookshelf={isInBookshelf(book.id)}
                showAddButton={true}
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="gradient-secondary text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                  ✨ Recommended
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl">
          <div className="max-w-md mx-auto">
            <Sparkles className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-3">No recommendations available</h3>
            <p className="text-muted-foreground mb-6">
              {userBooks.length === 0 
                ? 'Add some books to your library to get personalized recommendations!'
                : 'Try refreshing or switching recommendation types to discover new books'
              }
            </p>
            <Button 
              onClick={generateRecommendations}
              className="gradient-primary text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
