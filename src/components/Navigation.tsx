
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, BarChart3, Sparkles, Home, User, Quote, Heart, Music, Menu, Trophy, GitCompareArrows, FolderOpen, FileText, Share2 } from 'lucide-react';
import { DatabaseSyncButton } from './DatabaseSyncButton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'atmosphere' | 'challenges' | 'comparison' | 'lists' | 'annotations' | 'sharing';
  onViewChange: (view: NavigationProps['currentView']) => void;
  bookshelfCount: number;
}

export const Navigation = ({ currentView, onViewChange, bookshelfCount }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home, description: 'Your reading overview' },
    { id: 'search' as const, label: 'Discover', icon: Search, description: 'Find new books' },
    { id: 'recommendations' as const, label: 'For You', icon: Sparkles, description: 'Personalized picks' },
    { id: 'shelf' as const, label: 'Library', icon: BookOpen, badge: bookshelfCount, description: `${bookshelfCount} books` },
    { id: 'lists' as const, label: 'Lists', icon: FolderOpen, description: 'Reading collections' },
    { id: 'annotations' as const, label: 'Notes', icon: FileText, description: 'Book annotations' },
    { id: 'stats' as const, label: 'Analytics', icon: BarChart3, description: 'Reading insights' },
    { id: 'quotes' as const, label: 'Quotes', icon: Quote, description: 'Your quote collection' },
    { id: 'mood' as const, label: 'Mood', icon: Heart, description: 'Reading mood journal' },
    { id: 'atmosphere' as const, label: 'Ambience', icon: Music, description: 'Reading soundscapes' },
    { id: 'challenges' as const, label: 'Challenges', icon: Trophy, description: 'Earn XP & badges' },
    { id: 'comparison' as const, label: 'Compare', icon: GitCompareArrows, description: 'Compare books' },
    { id: 'sharing' as const, label: 'Share', icon: Share2, description: 'Share your reading' },
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
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
            isActive
              ? 'bg-primary/10 text-primary border-l-3 border-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Icon className="w-4.5 h-4.5 flex-shrink-0" />
          <span className="text-sm">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
              isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
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
        className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 group whitespace-nowrap flex-shrink-0 text-sm ${
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-pill"
            className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <Icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} />
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
              isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {item.badge}
            </span>
          )}
        </span>
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
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r border-border bg-background">
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-lg font-display font-bold gradient-text">Navigation</h2>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-0.5">
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
              <span className="text-sm font-semibold text-foreground">
                {navItems.find(item => item.id === currentView)?.label}
              </span>
            </div>

            <DatabaseSyncButton />
          </div>
        </nav>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <nav className="glass-card rounded-2xl p-1.5 relative overflow-hidden">
          {/* Subtle gradient accent along bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="flex items-center gap-0.5">
            <ScrollArea className="flex-1">
              <div className="flex gap-0.5 pb-0.5">
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
