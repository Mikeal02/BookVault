import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useThemePalette, themes } from '@/hooks/useThemePalette';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export const ThemePalettePicker = () => {
  const { currentTheme, setTheme } = useThemePalette();
  const activeTheme = themes.find(t => t.id === currentTheme);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl glass-card group relative overflow-hidden">
          {/* Live color indicator ring */}
          {activeTheme && (
            <div
              className="absolute inset-1.5 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${activeTheme.preview.primary}, ${activeTheme.preview.secondary})`,
              }}
            />
          )}
          <Palette className="w-4 h-4 relative z-10" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end" sideOffset={8}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color Theme</p>
          <span className="text-xs text-muted-foreground/60">{themes.length} palettes</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {themes.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/25 shadow-sm'
                    : 'hover:bg-muted/60 ring-1 ring-transparent'
                }`}
              >
                {/* 3-color swatch */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div
                    className="w-5 h-5 rounded-full ring-1 ring-border/40 shadow-sm transition-transform duration-200"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full ring-1 ring-border/40 shadow-sm -ml-1.5 transition-transform duration-200"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full ring-1 ring-border/40 shadow-sm -ml-1 transition-transform duration-200"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>

                {/* Name + emoji */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-sm">{theme.emoji}</span>
                  <span className="text-sm font-medium truncate">{theme.name}</span>
                </div>

                {/* Check indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Preview bar */}
        {activeTheme && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${activeTheme.preview.primary} 0%, ${activeTheme.preview.accent} 50%, ${activeTheme.preview.secondary} 100%)`,
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
