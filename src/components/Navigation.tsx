
import { Search, BookOpen, BarChart3, Sparkles, Home } from 'lucide-react';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations';
  onViewChange: (view: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations') => void;
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
    }
  ];

  return (
    <div className="mb-8">
      <nav className="glass-card rounded-2xl p-2">
        <div className="flex flex-wrap justify-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center px-5 py-3 rounded-xl font-medium transition-all duration-300 group ${
                  isActive
                    ? 'gradient-primary text-white shadow-lg transform scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-5 h-5 mr-2 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`} />
                
                <span className="font-semibold">{item.label}</span>
                
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
