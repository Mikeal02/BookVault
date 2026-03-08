import { useState, useRef, useEffect, useCallback } from 'react';
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
  Tractor,
  Snowflake,
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
  audioUrl: string;
}

interface ReadingAtmosphereProps {
  books: Book[];
}

// Ambient sound generator using Web Audio API for reliable playback
class AmbientSoundGenerator {
  private audioContext: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;
  
  private getCtx() {
    if (!this.audioContext) this.audioContext = new AudioContext();
    return this.audioContext;
  }

  createRain(): { gain: GainNode; stop: () => void } {
    const ctx = this.getCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    
    // Brown noise for rain
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + (0.02 * white)) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // High-pass filter for rain character
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    
    return { gain, stop: () => { source.stop(); } };
  }

  createFireplace(): { gain: GainNode; stop: () => void } {
    const ctx = this.getCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    
    // Crackle noise
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() > 0.97 ? (Math.random() * 2 - 1) * 0.5 : (Math.random() * 2 - 1) * 0.01;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    
    return { gain, stop: () => { source.stop(); } };
  }

  createOcean(): { gain: GainNode; stop: () => void } {
    const ctx = this.getCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    
    // Pink noise for ocean
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        // Add wave modulation
        data[i] *= 0.5 + 0.5 * Math.sin(i / (ctx.sampleRate * 4));
        b6 = white * 0.115926;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    
    return { gain, stop: () => { source.stop(); } };
  }

  createWind(): { gain: GainNode; stop: () => void } {
    const ctx = this.getCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    
    // Filtered white noise for wind
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (0.3 + 0.7 * Math.sin(i / (ctx.sampleRate * 6)));
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.value = 400;
    bpFilter.Q.value = 0.5;
    source.connect(bpFilter);
    bpFilter.connect(gain);
    source.start();
    
    return { gain, stop: () => { source.stop(); } };
  }

  createIce(): { gain: GainNode; stop: () => void } {
    const ctx = this.getCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    
    // Sparse crackle + wind undertone
    const bufferSize = 3 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const base = (Math.random() * 2 - 1) * 0.02;
      const crackle = Math.random() > 0.995 ? (Math.random() * 2 - 1) * 0.8 : 0;
      data[i] = base + crackle;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    
    return { gain, stop: () => { source.stop(); } };
  }
}

const soundGen = new AmbientSoundGenerator();

// Sound configuration
const soundscapes: SoundOption[] = [
  { 
    id: 'rain', name: 'Gentle Rain', icon: CloudRain, 
    color: 'from-blue-500 to-cyan-500',
    genres: ['mystery', 'thriller', 'noir', 'drama'],
    description: 'Soft rainfall on a window',
    audioUrl: '__synth__'
  },
  { 
    id: 'fireplace', name: 'Cozy Fireplace', icon: Flame, 
    color: 'from-orange-500 to-red-500',
    genres: ['romance', 'historical', 'fantasy', 'fiction'],
    description: 'Crackling fire warmth',
    audioUrl: '__synth__'
  },
  { 
    id: 'ocean', name: 'Ocean Waves', icon: Waves, 
    color: 'from-teal-500 to-blue-500',
    genres: ['romance', 'adventure', 'travel', 'beach'],
    description: 'Gentle waves on shore',
    audioUrl: '__synth__'
  },
  { 
    id: 'Farm', name: 'Farm Ambience', icon: Tractor, 
    color: 'from-amber-500 to-orange-500',
    genres: ['contemporary', 'urban', 'slice of life', 'literary'],
    description: 'Daytime Farm Ambience',
    audioUrl: '/mp3_files/Farm.mp3'
  },
  { 
    id: 'night', name: 'Night Ambience', icon: Moon, 
    color: 'from-indigo-500 to-purple-500',
    genres: ['horror', 'mystery', 'thriller', 'supernatural'],
    description: 'Crickets and night sounds',
    audioUrl: '/mp3_files/night.mp3'
  },
  { 
    id: 'wind', name: 'Gentle Wind', icon: Wind, 
    color: 'from-slate-400 to-gray-500',
    genres: ['drama', 'contemporary', 'literary', 'philosophical'],
    description: 'Soft breeze through trees',
    audioUrl: '__synth__'
  },
  { 
    id: 'birds', name: 'Morning Birds', icon: Bird, 
    color: 'from-yellow-400 to-orange-400',
    genres: ['romance', 'feel good', 'comedy', 'light'],
    description: 'Cheerful birdsong',
    audioUrl: '/mp3_files/bird.mp3'
  },
  { 
    id: 'ice', name: 'Ice Ambience', icon: Snowflake, 
    color: 'from-cyan-400 to-blue-400',
    genres: ['adventure', 'fantasy', 'nature', 'outdoors'],
    description: 'Ice cracking and winter sounds',
    audioUrl: '__synth__'
  },
];

export const ReadingAtmosphere = ({ books }: ReadingAtmosphereProps) => {
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [suggestedSounds, setSuggestedSounds] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Store audio elements (mp3) and synth nodes
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const synthRefs = useRef<Record<string, { gain: GainNode; stop: () => void }>>({});

  const currentlyReading = books.filter(b => b.readingStatus === 'reading');

  // Initialize mp3-based audio elements only
  useEffect(() => {
    soundscapes.forEach(sound => {
      if (sound.audioUrl !== '__synth__' && !audioRefs.current[sound.id]) {
        const audio = new Audio(sound.audioUrl);
        audio.loop = true;
        audio.preload = 'none';
        audioRefs.current[sound.id] = audio;
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => { audio.pause(); audio.src = ''; });
      Object.values(synthRefs.current).forEach(s => { try { s.stop(); } catch {} });
      audioRefs.current = {};
      synthRefs.current = {};
    };
  }, []);

  // Update volumes
  useEffect(() => {
    const vol = (id: string) => {
      const iv = volumes[id] || 50;
      return isMuted ? 0 : (masterVolume / 100) * (iv / 100);
    };
    Object.entries(audioRefs.current).forEach(([id, audio]) => { audio.volume = vol(id); });
    Object.entries(synthRefs.current).forEach(([id, synth]) => { synth.gain.gain.value = vol(id); });
  }, [masterVolume, volumes, isMuted]);

  // Get sound suggestions based on current book genres
  useEffect(() => {
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

  const startSynth = (soundId: string): { gain: GainNode; stop: () => void } => {
    switch (soundId) {
      case 'rain': return soundGen.createRain();
      case 'fireplace': return soundGen.createFireplace();
      case 'ocean': return soundGen.createOcean();
      case 'wind': return soundGen.createWind();
      case 'ice': return soundGen.createIce();
      default: return soundGen.createRain();
    }
  };

  const toggleSound = useCallback(async (soundId: string) => {
    const sound = soundscapes.find(s => s.id === soundId);
    if (!sound) return;
    const isSynth = sound.audioUrl === '__synth__';

    if (activeSounds.has(soundId)) {
      // Stop
      if (isSynth && synthRefs.current[soundId]) {
        try { synthRefs.current[soundId].stop(); } catch {}
        delete synthRefs.current[soundId];
      } else if (audioRefs.current[soundId]) {
        audioRefs.current[soundId].pause();
        audioRefs.current[soundId].currentTime = 0;
      }
      setActiveSounds(prev => { const n = new Set(prev); n.delete(soundId); return n; });
    } else {
      // Start
      setLoadingStates(prev => ({ ...prev, [soundId]: true }));
      if (!volumes[soundId]) setVolumes(v => ({ ...v, [soundId]: 50 }));
      const iv = volumes[soundId] || 50;
      const vol = isMuted ? 0 : (masterVolume / 100) * (iv / 100);

      try {
        if (isSynth) {
          const synth = startSynth(soundId);
          synth.gain.gain.value = vol;
          synthRefs.current[soundId] = synth;
        } else {
          const audio = audioRefs.current[soundId];
          if (audio) { audio.volume = vol; await audio.play(); }
        }
        setActiveSounds(prev => new Set([...prev, soundId]));
      } catch (error) {
        console.error('Error playing audio:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [soundId]: false }));
      }
    }
  }, [activeSounds, volumes, masterVolume, isMuted]);

  const updateVolume = useCallback((soundId: string, value: number[]) => {
    const newVolume = value[0];
    setVolumes(prev => ({ ...prev, [soundId]: newVolume }));
    
    const audio = audioRefs.current[soundId];
    if (audio) {
      audio.volume = isMuted ? 0 : (masterVolume / 100) * (newVolume / 100);
    }
  }, [masterVolume, isMuted]);

  const stopAll = useCallback(() => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setActiveSounds(new Set());
  }, []);

  const applySuggested = useCallback(async () => {
    // First stop all current sounds
    stopAll();
    
    // Then start suggested sounds
    for (const id of suggestedSounds) {
      const audio = audioRefs.current[id];
      if (audio) {
        if (!volumes[id]) {
          setVolumes(v => ({ ...v, [id]: 50 }));
        }
        const individualVolume = volumes[id] || 50;
        audio.volume = isMuted ? 0 : (masterVolume / 100) * (individualVolume / 100);
        try {
          await audio.play();
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
    setActiveSounds(new Set(suggestedSounds));
  }, [suggestedSounds, volumes, masterVolume, isMuted, stopAll]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text-mixed flex items-center gap-2 sm:gap-3">
            <Music className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
            <span className="truncate">Reading Atmosphere</span>
          </h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
            Immersive soundscapes for your reading sessions
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {activeSounds.size > 0 && (
            <Button variant="outline" onClick={stopAll} className="text-destructive text-xs sm:text-sm px-3">
              Stop All
            </Button>
          )}
        </div>
      </div>

      {/* Book Selection */}
      {currentlyReading.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Match to Your Book
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex flex-wrap gap-2">
              {currentlyReading.map(book => (
                <button
                  key={book.id}
                  onClick={() => setCurrentBook(book)}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all ${
                    currentBook?.id === book.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {book.imageLinks?.thumbnail ? (
                    <img 
                      src={book.imageLinks.thumbnail}
                      alt={book.title}
                      className="w-6 h-9 sm:w-8 sm:h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-6 h-9 sm:w-8 sm:h-12 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium truncate max-w-20 sm:max-w-32">{book.title}</span>
                </button>
              ))}
            </div>
            
            {currentBook && suggestedSounds.length > 0 && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">Suggested for "{currentBook.title}"</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {suggestedSounds.map(id => {
                    const sound = soundscapes.find(s => s.id === id);
                    if (!sound) return null;
                    const Icon = sound.icon;
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">
                        <Icon className="w-3 h-3" />
                        <span className="hidden xs:inline">{sound.name}</span>
                      </Badge>
                    );
                  })}
                  <Button size="sm" onClick={applySuggested} className="ml-1 sm:ml-2 h-6 sm:h-7 text-xs px-2 sm:px-3">
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
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium mb-2">Master Volume</p>
              <Slider
                value={[masterVolume]}
                onValueChange={(v) => setMasterVolume(v[0])}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground w-8 sm:w-10 text-right flex-shrink-0">{masterVolume}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Sound Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {soundscapes.map(sound => {
          const Icon = sound.icon;
          const isActive = activeSounds.has(sound.id);
          const isLoading = loadingStates[sound.id];
          const volume = volumes[sound.id] || 50;
          
          return (
            <Card
              key={sound.id}
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
                isActive 
                  ? `ring-2 ring-primary shadow-lg` 
                  : 'hover:shadow-md hover:-translate-y-1'
              }`}
              onClick={() => !isLoading && toggleSound(sound.id)}
            >
              {/* Background Gradient */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${sound.color} transition-opacity ${
                  isActive ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                }`}
              />
              
              <CardContent className="p-3 sm:p-4 relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${sound.color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : isActive ? (
                    <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  ) : (
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                
                <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate">{sound.name}</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{sound.description}</p>
                
                {/* Volume Slider (only when active) */}
                {isActive && (
                  <div 
                    className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border"
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
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">{volume}%</p>
                  </div>
                )}
              </CardContent>
              
              {/* Playing Indicator */}
              {isActive && !isMuted && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-0.5 sm:w-1 bg-primary rounded-full animate-pulse`}
                      style={{
                        height: `${6 + i * 3}px`,
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
          <CardContent className="p-3 sm:p-4">
            <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              Your Current Mix
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Array.from(activeSounds).map(id => {
                const sound = soundscapes.find(s => s.id === id);
                if (!sound) return null;
                const Icon = sound.icon;
                return (
                  <Badge 
                    key={id}
                    variant="secondary"
                    className={`flex items-center gap-1 cursor-pointer hover:bg-destructive/10 text-xs ${
                      isMuted ? 'opacity-50' : ''
                    }`}
                    onClick={() => toggleSound(id)}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden xs:inline">{sound.name}</span>
                    <span className="text-[10px] ml-0.5 sm:ml-1">×</span>
                  </Badge>
                );
              })}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
              {isMuted ? '🔇 Muted' : '🎵 Click sounds to remove from mix'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="glass-card bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-3 sm:p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Sun className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
            Reading Atmosphere Tips
          </h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
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
