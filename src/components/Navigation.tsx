
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, BarChart3, Sparkles, Home, User, Quote, Heart,
  Music, Menu, Trophy, GitCompareArrows, FolderOpen, FileText, Share2,
  Library, PenTool, Compass, ChevronDown
} from 'lucide-react';
import { DatabaseSyncButton } from './DatabaseSyncButton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'atmosphere' | 'challenges' | 'comparison' | 'lists' | 'annotations' | 'sharing';
  onViewChange: (view: NavigationProps['currentView']) => void;
  bookshelfCount: number;
}

const navGroups = [
  {
    label: 'Home',
    items: [
      { id: 'dashboard' as const, label: 'Dashboard', icon: Home, description: 'Your reading overview' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'search' as const, label: 'Search', icon: Search, description: 'Find new books' },
      { id: 'recommendations' as const, label: 'For You', icon: Sparkles, description: 'Personalized picks' },
      { id: 'comparison' as const, label: 'Compare', icon: GitCompareArrows, description: 'Compare books' },
    ],
  },
  {
    label: 'Library',
    items: [
      { id: 'shelf' as const, label: 'Bookshelf', icon: BookOpen, description: 'Your collection' },
      { id: 'lists' as const, label: 'Lists', icon: FolderOpen, description: 'Reading collections' },
      { id: 'annotations' as const, label: 'Notes', icon: FileText, description: 'Book annotations' },
      { id: 'quotes' as const, label: 'Quotes', icon: Quote, description: 'Quote collection' },
    ],
  },
  {
    label: 'Activity',
    items: [
      { id: 'stats' as const, label: 'Analytics', icon: BarChart3, description: 'Reading insights' },
      { id: 'challenges' as const, label: 'Challenges', icon: Trophy, description: 'Earn XP & badges' },
      { id: 'mood' as const, label: 'Mood', icon: Heart, description: 'Mood journal' },
    ],
  },
  {
    label: 'More',
    items: [
      { id: 'atmosphere' as const, label: 'Ambience', icon: Music, description: 'Reading soundscapes' },
      { id: 'sharing' as const, label: 'Share', icon: Share2, description: 'Share your reading' },
      { id: 'profile' as const, label: 'Profile', icon: User, description: 'Your profile' },
    ],
  },
];

const allItems = navGroups.flatMap(g => g.items);

export const Navigation = ({ currentView, onViewChange, bookshelfCount }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: typeof allItems[number]['id']) => {
    onViewChange(id);
    setMobileMenuOpen(false);
  };

  const currentLabel = allItems.find(i => i.id === currentView)?.label || 'Dashboard';

  return (
    <div className="mb-6 sm:mb-8 w-full">
      {/* ─── Mobile Navigation ─── */}
      <div className="md:hidden">
        <nav className="glass-card rounded-2xl p-2">
          <div className="flex items-center justify-between gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background">
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-lg font-display font-bold gradient-text">Navigation</h2>
                  </div>
                  <ScrollArea className="flex-1 px-3 py-2">
                    {navGroups.map((group) => (
                      <div key={group.label} className="mb-3">
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {group.label}
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{item.label}</span>
                                {item.id === 'shelf' && bookshelfCount > 0 && (
                                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {bookshelfCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="p-4 border-t border-border">
                    <DatabaseSyncButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex justify-center">
              <span className="text-sm font-semibold text-foreground">{currentLabel}</span>
            </div>

            <DatabaseSyncButton />
          </div>
        </nav>
      </div>

      {/* ─── Desktop Navigation ─── */}
      <div className="hidden md:block">
        <nav className="glass-card rounded-2xl p-1.5 relative overflow-hidden ring-1 ring-border/30">
          {/* Top + bottom accent lines */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-secondary/15 to-transparent" />

          <div className="flex items-center gap-0">
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-0 pb-0.5">
                {navGroups.map((group, gi) => (
                  <div key={group.label} className="flex items-center">
                    {/* Group separator */}
                    {gi > 0 && (
                      <div className="w-px h-5 bg-border/40 mx-1 flex-shrink-0" />
                    )}

                    {/* Group items */}
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-200 group whitespace-nowrap flex-shrink-0 text-[13px] ${
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="nav-active-pill"
                              className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                              transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} />
                            <span>{item.label}</span>
                            {item.id === 'shelf' && bookshelfCount > 0 && (
                              <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                              }`}>
                                {bookshelfCount}
                              </span>
                            )}
                          </span>

                          {/* Tooltip */}
                          <div className="hidden lg:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {item.description}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
