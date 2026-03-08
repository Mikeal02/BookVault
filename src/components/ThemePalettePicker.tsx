import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useThemePalette, themes } from '@/hooks/useThemePalette';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export const ThemePalettePicker = () => {
  const { currentTheme, setTheme } = useThemePalette();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl glass-card">
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Color Theme</p>
        <div className="space-y-1.5">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                currentTheme === theme.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: theme.preview.primary }} />
                <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: theme.preview.secondary }} />
              </div>
              <span className="text-sm font-medium flex-1 text-left">{theme.name}</span>
              {currentTheme === theme.id && (
                <Check className="w-3.5 h-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
