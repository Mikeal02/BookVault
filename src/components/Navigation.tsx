
import { useState } from 'react';
import { Search, BookOpen, BarChart3, Sparkles, Home, User, Quote, Heart, Shuffle, Music, Menu, X, Trophy, GitCompareArrows } from 'lucide-react';
import { DatabaseSyncButton } from './DatabaseSyncButton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'randomizer' | 'atmosphere' | 'challenges' | 'comparison';
  onViewChange: (view: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'randomizer' | 'atmosphere' | 'challenges' | 'comparison') => void;
  bookshelfCount: number;
}

export const Navigation = ({ currentView, onViewChange, bookshelfCount }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home, description: 'Your reading overview' },
    { id: 'search' as const, label: 'Discover', icon: Search, description: 'Find new books' },
    { id: 'recommendations' as const, label: 'For You', icon: Sparkles, description: 'Personalized picks' },
    { id: 'shelf' as const, label: 'Library', icon: BookOpen, badge: bookshelfCount, description: `${bookshelfCount} books` },
    { id: 'stats' as const, label: 'Analytics', icon: BarChart3, description: 'Reading insights' },
    { id: 'quotes' as const, label: 'Quotes', icon: Quote, description: 'Your quote collection' },
    { id: 'mood' as const, label: 'Mood', icon: Heart, description: 'Reading mood journal' },
    { id: 'randomizer' as const, label: 'TBR Spin', icon: Shuffle, description: 'Pick your next read' },
    { id: 'atmosphere' as const, label: 'Ambience', icon: Music, description: 'Reading soundscapes' },
    { id: 'challenges' as const, label: 'Challenges', icon: Trophy, description: 'Earn XP & badges' },
    { id: 'comparison' as const, label: 'Compare', icon: GitCompareArrows, description: 'Compare books' },
    { id: 'profile' as const, label: 'Profile', icon: User, description: 'Your profile' }
  ];

  const handleNavClick = (id: typeof navItems[number]['id']) => {
    onViewChange(id);
    setMobileMenuOpen(false);
  };

  const NavButton = ({ item, isMobile = false }: { item: typeof navItems[number]; isMobile?: boolean }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    if (isMobile) {
      return (
        <button
          onClick={() => handleNavClick(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive
              ? 'gradient-primary text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
              isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {item.badge}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 group whitespace-nowrap flex-shrink-0 ${
          isActive
            ? 'gradient-primary text-white shadow-lg'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        <span className="font-semibold text-sm">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full transition-colors ${
            isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            {item.badge}
          </span>
        )}
        <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {item.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
        </div>
      </button>
    );
  };

  return (
    <div className="mb-6 sm:mb-8 w-full">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <nav className="glass-card rounded-2xl p-2">
          <div className="flex items-center justify-between gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-bold gradient-text">Navigation</h2>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <NavButton key={item.id} item={item} isMobile />
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border">
                    <DatabaseSyncButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex justify-center">
              <span className="text-sm font-semibold text-muted-foreground">
                {navItems.find(item => item.id === currentView)?.label}
              </span>
            </div>

            <DatabaseSyncButton />
          </div>
        </nav>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <nav className="glass-card rounded-2xl p-1.5">
          <div className="flex items-center gap-1">
            <ScrollArea className="flex-1">
              <div className="flex gap-1 pb-1">
                {navItems.map((item) => (
                  <NavButton key={item.id} item={item} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
            <div className="border-l border-border/50 pl-2 ml-1 flex-shrink-0">
              <DatabaseSyncButton />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};
