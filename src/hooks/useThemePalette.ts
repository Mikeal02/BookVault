import { useState, useEffect, useCallback } from 'react';

interface UseThemeResult {
  currentTheme: string;
  setTheme: (theme: string) => void;
  themes: ThemeOption[];
}

interface ThemeOption {
  id: string;
  name: string;
  emoji: string;
  preview: { primary: string; secondary: string; accent: string };
}

export const themes: ThemeOption[] = [
  { id: 'sapphire-rose', name: 'Editorial Ink', emoji: '📜', preview: { primary: '#1E2A4A', secondary: '#B8893E', accent: '#2A3A5E' } },
  { id: 'emerald-gold',  name: 'Forest Library',  emoji: '🌿', preview: { primary: '#2F5246', secondary: '#A07A3E', accent: '#3D6B5C' } },
  { id: 'violet-amber',  name: 'Aubergine Dusk',  emoji: '🌆', preview: { primary: '#3E3656', secondary: '#A07A52', accent: '#564B72' } },
  { id: 'ocean-coral',   name: 'Coastal Mist',    emoji: '🌫️', preview: { primary: '#3A5366', secondary: '#B08A7A', accent: '#4F6E84' } },
  { id: 'forest-peach',  name: 'Sage & Linen',    emoji: '🍃', preview: { primary: '#4A6B57', secondary: '#C8A78A', accent: '#5C8270' } },
  { id: 'midnight-gold', name: 'Slate & Brass',   emoji: '🕯️', preview: { primary: '#3B4253', secondary: '#A88452', accent: '#4E5668' } },
  { id: 'crimson-slate', name: 'Burgundy Stone',  emoji: '🍷', preview: { primary: '#6B3A3F', secondary: '#7E7468', accent: '#824850' } },
  { id: 'teal-pink',     name: 'Sea Glass',       emoji: '🪟', preview: { primary: '#3B6B6A', secondary: '#B58A8A', accent: '#4F8584' } },
];

const themeVars: Record<string, Record<string, string>> = {
  'sapphire-rose': {}, // default, no overrides
  'emerald-gold': {
    '--primary': '162 28% 26%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '36 38% 44%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '162 24% 32%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '162 28% 26%',
    '--highlight': '36 50% 50%',
    '--success': '152 38% 32%',
    '--sidebar-primary': '162 28% 26%',
    '--sidebar-ring': '162 28% 26%',
  },
  'violet-amber': {
    '--primary': '258 22% 30%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '28 32% 48%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '258 18% 38%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '258 22% 30%',
    '--highlight': '36 48% 52%',
    '--success': '162 32% 34%',
    '--sidebar-primary': '258 22% 30%',
    '--sidebar-ring': '258 22% 30%',
  },
  'ocean-coral': {
    '--primary': '205 28% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '18 28% 56%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '205 24% 40%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '205 28% 32%',
    '--highlight': '36 48% 52%',
    '--success': '162 32% 34%',
    '--sidebar-primary': '205 28% 32%',
    '--sidebar-ring': '205 28% 32%',
  },
  'forest-peach': {
    '--primary': '152 22% 36%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '28 32% 64%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '152 20% 44%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '152 22% 36%',
    '--highlight': '28 40% 56%',
    '--success': '140 32% 34%',
    '--sidebar-primary': '152 22% 36%',
    '--sidebar-ring': '152 22% 36%',
  },
  'midnight-gold': {
    '--primary': '224 18% 28%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '36 36% 46%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '224 16% 36%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '224 18% 28%',
    '--highlight': '36 50% 50%',
    '--success': '162 32% 34%',
    '--sidebar-primary': '224 18% 28%',
    '--sidebar-ring': '224 18% 28%',
  },
  'crimson-slate': {
    '--primary': '354 28% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '30 12% 46%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '354 22% 40%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '354 28% 32%',
    '--highlight': '20 36% 50%',
    '--success': '162 32% 34%',
    '--sidebar-primary': '354 28% 32%',
    '--sidebar-ring': '354 28% 32%',
  },
  'teal-pink': {
    '--primary': '178 22% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '350 22% 60%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '178 20% 40%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '178 22% 32%',
    '--highlight': '350 30% 56%',
    '--success': '160 32% 34%',
    '--sidebar-primary': '178 22% 32%',
    '--sidebar-ring': '178 22% 32%',
  },
};

export function useThemePalette(): UseThemeResult {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('bookapp_color_theme') || 'sapphire-rose';
  });

  const applyTheme = useCallback((themeId: string) => {
    const root = document.documentElement;
    
    // Reset all custom properties from all themes
    Object.keys(themeVars).forEach(id => {
      if (id !== 'sapphire-rose') {
        Object.keys(themeVars[id]).forEach(prop => {
          root.style.removeProperty(prop);
        });
      }
    });

    // Apply new theme vars
    const vars = themeVars[themeId];
    if (vars) {
      Object.entries(vars).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
    }

    // Set a data attribute for CSS-level theme targeting
    root.setAttribute('data-color-theme', themeId);
  }, []);

  const setTheme = useCallback((themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('bookapp_color_theme', themeId);
    applyTheme(themeId);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  return { currentTheme, setTheme, themes };
}
