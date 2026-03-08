
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, BarChart3, Sparkles, Home, User, Quote, Heart,
  Music, Menu, Trophy, GitCompareArrows, FolderOpen, FileText, Share2,
  ChevronRight, X, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { DatabaseSyncButton } from './DatabaseSyncButton';
import { ThemePalettePicker } from './ThemePalettePicker';
import { ThemeToggle } from './ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationProps {
  currentView: 'dashboard' | 'search' | 'shelf' | 'stats' | 'recommendations' | 'profile' | 'quotes' | 'mood' | 'atmosphere' | 'challenges' | 'comparison' | 'lists' | 'annotations' | 'sharing';
  onViewChange: (view: NavigationProps['currentView']) => void;
  bookshelfCount: number;
  onLogout?: () => void;
  currentUser?: string;
}

type ViewId = NavigationProps['currentView'];
type NavItem = { id: ViewId; label: string; icon: any; description: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Your reading overview' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'search', label: 'Search', icon: Search, description: 'Find new books' },
      { id: 'recommendations', label: 'For You', icon: Sparkles, description: 'Personalized picks' },
      { id: 'comparison', label: 'Compare', icon: GitCompareArrows, description: 'Compare books' },
    ],
  },
  {
    label: 'Library',
    items: [
      { id: 'shelf', label: 'Bookshelf', icon: BookOpen, description: 'Your collection' },
      { id: 'lists', label: 'Lists', icon: FolderOpen, description: 'Reading collections' },
      { id: 'annotations', label: 'Notes', icon: FileText, description: 'Book annotations' },
      { id: 'quotes', label: 'Quotes', icon: Quote, description: 'Quote collection' },
    ],
  },
  {
    label: 'Activity',
    items: [
      { id: 'stats', label: 'Analytics', icon: BarChart3, description: 'Reading insights' },
      { id: 'challenges', label: 'Challenges', icon: Trophy, description: 'Earn XP & badges' },
      { id: 'mood', label: 'Mood', icon: Heart, description: 'Mood journal' },
    ],
  },
  {
    label: 'More',
    items: [
      { id: 'atmosphere', label: 'Ambience', icon: Music, description: 'Reading soundscapes' },
      { id: 'sharing', label: 'Share', icon: Share2, description: 'Share your reading' },
      { id: 'profile', label: 'Profile', icon: User, description: 'Your profile' },
    ],
  },
];

const allItems = navGroups.flatMap(g => g.items);

const SIDEBAR_COLLAPSED_KEY = 'bookvault_sidebar_collapsed';

export const Navigation = ({ currentView, onViewChange, bookshelfCount, onLogout, currentUser }: NavigationProps) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentView]);

  const handleNavClick = (id: ViewId) => {
    onViewChange(id);
    setMobileOpen(false);
  };

  const currentLabel = allItems.find(i => i.id === currentView)?.label || 'Dashboard';
  const CurrentIcon = allItems.find(i => i.id === currentView)?.icon || Home;

  // ─── MOBILE: Top bar + overlay drawer ───
  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 glass-frosted border-b border-border/50">
          <div className="flex items-center h-14 px-3 gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 p-1">
                <img src="/favicon.ico" alt="BookVault" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <CurrentIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{currentLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <ThemePalettePicker />
              <ThemeToggle />
            </div>
          </div>
        </div>
        {/* Spacer for fixed header */}
        <div className="h-14" />

        {/* Mobile overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.nav
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 z-[70] w-[280px] bg-card border-r border-border flex flex-col"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center p-1.5">
                      <img src="/favicon.ico" alt="BookVault" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-display text-base font-bold gradient-text">BookVault</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMobileOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Nav groups */}
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {navGroups.map((group) => (
                      <div key={group.label} className="mb-2">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                          {group.label}
                        </div>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = currentView === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavClick(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                                isActive
                                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                              }`}
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                              <span className="flex-1 text-left">{item.label}</span>
                              {item.id === 'shelf' && bookshelfCount > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {bookshelfCount}
                                </span>
                              )}
                              {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Drawer footer */}
                <div className="p-3 border-t border-border/50 space-y-2">
                  <DatabaseSyncButton />
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── DESKTOP: Persistent sidebar ───
  return (
    <motion.nav
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/50"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary opacity-60" />

      {/* Logo + collapse toggle */}
      <div className="flex items-center h-16 px-3 border-b border-border/40 gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
          <img src="/favicon.ico" alt="BookVault" className="w-full h-full object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="font-display text-base font-bold gradient-text whitespace-nowrap overflow-hidden"
            >
              BookVault
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-lg ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {/* Nav items */}
      <ScrollArea className="flex-1 py-2">
        <div className={collapsed ? 'px-2 space-y-1' : 'px-3 space-y-1'}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 select-none">
                  {group.label}
                </div>
              )}
              {collapsed && <div className="h-px bg-border/30 mx-1 my-2" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`relative w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2'} rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      {/* Active indicator pill */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-primary/8 border border-primary/15 rounded-xl"
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                      )}
                      {/* Active left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-bar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                      )}
                      <Icon className={`relative z-10 w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isActive ? 'text-primary scale-110' : 'group-hover:scale-105'}`} />
                      {!collapsed && (
                        <span className="relative z-10 flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!collapsed && item.id === 'shelf' && bookshelfCount > 0 && (
                        <span className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {bookshelfCount}
                        </span>
                      )}
                    </button>

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                        {item.id === 'shelf' && bookshelfCount > 0 && (
                          <span className="ml-1.5 text-[10px] opacity-70">({bookshelfCount})</span>
                        )}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom section */}
      <div className={`border-t border-border/40 ${collapsed ? 'p-2' : 'p-3'} space-y-2 flex-shrink-0`}>
        {!collapsed && <DatabaseSyncButton />}
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center'} gap-1`}>
          <ThemePalettePicker />
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
};
