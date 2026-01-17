import { useState, useRef, useEffect } from 'react';
import { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Music, 
  CloudRain, 
  Flame, 
  Wind, 
  Bird, 
  Coffee,
  Moon,
  Sun,
  Waves,
  TreePine,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface SoundOption {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  genres: string[];
  description: string;
}

interface ReadingAtmosphereProps {
  books: Book[];
}

const soundscapes: SoundOption[] = [
  { 
    id: 'rain', 
    name: 'Gentle Rain', 
    icon: CloudRain, 
    color: 'from-blue-500 to-cyan-500',
    genres: ['mystery', 'thriller', 'noir', 'drama'],
    description: 'Soft rainfall on a window'
  },
  { 
    id: 'fireplace', 
    name: 'Cozy Fireplace', 
    icon: Flame, 
    color: 'from-orange-500 to-red-500',
    genres: ['romance', 'historical', 'fantasy', 'fiction'],
    description: 'Crackling fire warmth'
  },
  { 
    id: 'forest', 
    name: 'Forest Ambience', 
    icon: TreePine, 
    color: 'from-green-500 to-emerald-500',
    genres: ['adventure', 'fantasy', 'nature', 'outdoors'],
    description: 'Birds and rustling leaves'
  },
  { 
    id: 'ocean', 
    name: 'Ocean Waves', 
    icon: Waves, 
    color: 'from-teal-500 to-blue-500',
    genres: ['romance', 'adventure', 'travel', 'beach'],
    description: 'Gentle waves on shore'
  },
  { 
    id: 'cafe', 
    name: 'Coffee Shop', 
    icon: Coffee, 
    color: 'from-amber-500 to-orange-500',
    genres: ['contemporary', 'urban', 'slice of life', 'literary'],
    description: 'Quiet cafe murmurs'
  },
  { 
    id: 'night', 
    name: 'Night Ambience', 
    icon: Moon, 
    color: 'from-indigo-500 to-purple-500',
    genres: ['horror', 'mystery', 'thriller', 'supernatural'],
    description: 'Crickets and night sounds'
  },
  { 
    id: 'wind', 
    name: 'Gentle Wind', 
    icon: Wind, 
    color: 'from-slate-400 to-gray-500',
    genres: ['drama', 'contemporary', 'literary', 'philosophical'],
    description: 'Soft breeze through trees'
  },
  { 
    id: 'birds', 
    name: 'Morning Birds', 
    icon: Bird, 
    color: 'from-yellow-400 to-orange-400',
    genres: ['romance', 'feel good', 'comedy', 'light'],
    description: 'Cheerful birdsong'
  },
];

export const ReadingAtmosphere = ({ books }: ReadingAtmosphereProps) => {
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [suggestedSounds, setSuggestedSounds] = useState<string[]>([]);

  // Simulated audio context (in real app, would use Web Audio API)
  const audioContextRef = useRef<any>(null);

  const currentlyReading = books.filter(b => b.readingStatus === 'reading');

  useEffect(() => {
    // Get sound suggestions based on current book genres
    if (currentBook?.categories) {
      const bookGenres = currentBook.categories.map(c => c.toLowerCase());
      const suggested = soundscapes
        .filter(sound => sound.genres.some(g => bookGenres.some(bg => bg.includes(g))))
        .slice(0, 3)
        .map(s => s.id);
      setSuggestedSounds(suggested.length > 0 ? suggested : ['rain', 'fireplace']);
    } else {
      setSuggestedSounds(['rain', 'fireplace']);
    }
  }, [currentBook]);

  const toggleSound = (soundId: string) => {
    setActiveSounds(prev => {
      const next = new Set(prev);
      if (next.has(soundId)) {
        next.delete(soundId);
      } else {
        next.add(soundId);
        if (!volumes[soundId]) {
          setVolumes(v => ({ ...v, [soundId]: 50 }));
        }
      }
      return next;
    });
  };

  const updateVolume = (soundId: string, value: number[]) => {
    setVolumes(prev => ({ ...prev, [soundId]: value[0] }));
  };

  const stopAll = () => {
    setActiveSounds(new Set());
  };

  const applySuggested = () => {
    setActiveSounds(new Set(suggestedSounds));
    suggestedSounds.forEach(id => {
      if (!volumes[id]) {
        setVolumes(v => ({ ...v, [id]: 50 }));
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text-mixed flex items-center gap-3">
            <Music className="w-7 h-7 sm:w-8 sm:h-8" />
            Reading Atmosphere
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Immersive soundscapes for your reading sessions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {activeSounds.size > 0 && (
            <Button variant="outline" onClick={stopAll} className="text-destructive">
              Stop All
            </Button>
          )}
        </div>
      </div>

      {/* Book Selection */}
      {currentlyReading.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              Match to Your Book
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentlyReading.map(book => (
                <button
                  key={book.id}
                  onClick={() => setCurrentBook(book)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    currentBook?.id === book.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {book.imageLinks?.thumbnail ? (
                    <img 
                      src={book.imageLinks.thumbnail}
                      alt={book.title}
                      className="w-8 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate max-w-24 sm:max-w-32">{book.title}</span>
                </button>
              ))}
            </div>
            
            {currentBook && suggestedSounds.length > 0 && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Suggested for "{currentBook.title}"</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedSounds.map(id => {
                    const sound = soundscapes.find(s => s.id === id);
                    if (!sound) return null;
                    const Icon = sound.icon;
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {sound.name}
                      </Badge>
                    );
                  })}
                  <Button size="sm" onClick={applySuggested} className="ml-2">
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Master Volume */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Master Volume</p>
              <Slider
                value={[masterVolume]}
                onValueChange={(v) => setMasterVolume(v[0])}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
            </div>
            <span className="text-sm text-muted-foreground w-10 text-right">{masterVolume}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Sound Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {soundscapes.map(sound => {
          const Icon = sound.icon;
          const isActive = activeSounds.has(sound.id);
          const volume = volumes[sound.id] || 50;
          
          return (
            <Card
              key={sound.id}
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
                isActive 
                  ? `ring-2 ring-primary shadow-lg` 
                  : 'hover:shadow-md hover:-translate-y-1'
              }`}
              onClick={() => toggleSound(sound.id)}
            >
              {/* Background Gradient */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${sound.color} transition-opacity ${
                  isActive ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                }`}
              />
              
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${sound.color}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {isActive ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                
                <h4 className="font-semibold text-sm sm:text-base">{sound.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sound.description}</p>
                
                {/* Volume Slider (only when active) */}
                {isActive && (
                  <div 
                    className="mt-3 pt-3 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Slider
                      value={[volume]}
                      onValueChange={(v) => updateVolume(sound.id, v)}
                      max={100}
                      step={1}
                      className="w-full"
                      disabled={isMuted}
                    />
                    <p className="text-xs text-center text-muted-foreground mt-1">{volume}%</p>
                  </div>
                )}
              </CardContent>
              
              {/* Playing Indicator */}
              {isActive && !isMuted && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-1 bg-primary rounded-full animate-pulse`}
                      style={{
                        height: `${8 + i * 4}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Active Mix */}
      {activeSounds.size > 0 && (
        <Card className="glass-card border-primary/50">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Your Current Mix
            </h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(activeSounds).map(id => {
                const sound = soundscapes.find(s => s.id === id);
                if (!sound) return null;
                const Icon = sound.icon;
                return (
                  <Badge 
                    key={id}
                    variant="secondary"
                    className={`flex items-center gap-1 cursor-pointer hover:bg-destructive/10 ${
                      isMuted ? 'opacity-50' : ''
                    }`}
                    onClick={() => toggleSound(id)}
                  >
                    <Icon className="w-3 h-3" />
                    {sound.name}
                    <span className="text-[10px] ml-1">×</span>
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isMuted ? '🔇 Muted' : '🎵 Click sounds to remove from mix'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="glass-card bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            Reading Atmosphere Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Combine 2-3 sounds for a richer atmosphere</li>
            <li>• Match sounds to your book's setting for immersion</li>
            <li>• Rain + Fireplace is perfect for cozy reading</li>
            <li>• Lower volumes help maintain focus on reading</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
