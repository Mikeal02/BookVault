
import { Search, BookOpen, BarChart3, Sparkles, Home, User, Quote, Heart, Shuffle, Music } from 'lucide-react';
import { DatabaseSyncButton } from './DatabaseSyncButton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'randomizer' | 'atmosphere';
  onViewChange: (view: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'randomizer' | 'atmosphere') => void;
  bookshelfCount: number;
}

export const Navigation = ({ currentView, onViewChange, bookshelfCount }: NavigationProps) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: Home,
      description: 'Your reading overview'
    },
    {
      id: 'search' as const,
      label: 'Discover',
      icon: Search,
      description: 'Find new books'
    },
    {
      id: 'recommendations' as const,
      label: 'For You',
      icon: Sparkles,
      description: 'Personalized picks'
    },
    {
      id: 'shelf' as const,
      label: 'Library',
      icon: BookOpen,
      badge: bookshelfCount,
      description: `${bookshelfCount} books`
    },
    {
      id: 'stats' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Reading insights'
    },
    {
      id: 'quotes' as const,
      label: 'Quotes',
      icon: Quote,
      description: 'Your quote collection'
    },
    {
      id: 'mood' as const,
      label: 'Mood',
      icon: Heart,
      description: 'Reading mood journal'
    },
    {
      id: 'randomizer' as const,
      label: 'TBR Spin',
      icon: Shuffle,
      description: 'Pick your next read'
    },
    {
      id: 'atmosphere' as const,
      label: 'Ambience',
      icon: Music,
      description: 'Reading soundscapes'
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      description: 'Your profile'
    }
  ];

  return (
    <div className="mb-6 sm:mb-8 w-full overflow-hidden">
      <nav className="glass-card rounded-2xl p-1.5 sm:p-2 w-full">
        <div className="flex items-center gap-1 sm:gap-2 w-full">
          <ScrollArea className="flex-1 w-full">
            <div className="flex gap-1 sm:gap-2 pb-2 w-max min-w-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`relative flex items-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium transition-all duration-300 group whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'gradient-primary text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                    
                    <span className="hidden xs:inline font-semibold text-xs sm:text-sm ml-1 sm:ml-1.5 md:ml-2">{item.label}</span>
                    
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`ml-1 sm:ml-1.5 md:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip - hidden on mobile */}
                    <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                    </div>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5 mt-1" />
          </ScrollArea>
          <div className="border-l border-border/50 pl-1 sm:pl-2 ml-0.5 sm:ml-2 flex-shrink-0">
            <DatabaseSyncButton />
          </div>
        </div>
      </nav>
    </div>
  );
};
