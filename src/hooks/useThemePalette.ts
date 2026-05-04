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
  { id: 'sapphire-rose', name: 'Twilight Linen',  emoji: '📜', preview: { primary: '#3A4A6B', secondary: '#C8A48C', accent: '#5A6B85' } },
  { id: 'emerald-gold',  name: 'Eucalyptus Cream',emoji: '🌿', preview: { primary: '#506B5C', secondary: '#D4B896', accent: '#6B8576' } },
  { id: 'violet-amber',  name: 'Lavender Honey',  emoji: '💜', preview: { primary: '#5E5478', secondary: '#D4B080', accent: '#76698C' } },
  { id: 'ocean-coral',   name: 'Driftwood Bay',   emoji: '🌊', preview: { primary: '#456578', secondary: '#D4A48C', accent: '#5C7A8C' } },
  { id: 'forest-peach',  name: 'Sage Apricot',    emoji: '🍑', preview: { primary: '#5C7A66', secondary: '#E0B89C', accent: '#76907E' } },
  { id: 'midnight-gold', name: 'Indigo Wheat',    emoji: '🌾', preview: { primary: '#3F4866', secondary: '#C8B084', accent: '#5A6480' } },
  { id: 'crimson-slate', name: 'Terracotta Mist', emoji: '🏺', preview: { primary: '#8C5A56', secondary: '#8A9A94', accent: '#A0726E' } },
  { id: 'teal-pink',     name: 'Mint Rosewater',  emoji: '🌸', preview: { primary: '#4A7A76', secondary: '#D4A0A8', accent: '#629490' } },
];

const themeVars: Record<string, Record<string, string>> = {
  'sapphire-rose': {
    '--primary': '220 28% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '24 38% 66%',
    '--secondary-foreground': '220 30% 18%',
    '--accent': '218 20% 44%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '220 28% 32%',
    '--highlight': '24 42% 60%',
    '--success': '162 28% 36%',
    '--sidebar-primary': '220 28% 32%',
    '--sidebar-ring': '220 28% 32%',
  },
  'emerald-gold': {
    '--primary': '148 16% 36%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '32 42% 72%',
    '--secondary-foreground': '148 22% 20%',
    '--accent': '148 14% 46%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '148 16% 36%',
    '--highlight': '32 46% 64%',
    '--success': '148 28% 38%',
    '--sidebar-primary': '148 16% 36%',
    '--sidebar-ring': '148 16% 36%',
  },
  'violet-amber': {
    '--primary': '258 18% 40%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '36 42% 66%',
    '--secondary-foreground': '258 22% 22%',
    '--accent': '258 16% 50%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '258 18% 40%',
    '--highlight': '36 46% 60%',
    '--success': '162 26% 38%',
    '--sidebar-primary': '258 18% 40%',
    '--sidebar-ring': '258 18% 40%',
  },
  'ocean-coral': {
    '--primary': '202 28% 36%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '18 42% 70%',
    '--secondary-foreground': '202 32% 20%',
    '--accent': '202 22% 46%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '202 28% 36%',
    '--highlight': '18 46% 64%',
    '--success': '162 26% 38%',
    '--sidebar-primary': '202 28% 36%',
    '--sidebar-ring': '202 28% 36%',
  },
  'forest-peach': {
    '--primary': '138 18% 42%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '22 52% 76%',
    '--secondary-foreground': '138 24% 22%',
    '--accent': '138 16% 52%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '138 18% 42%',
    '--highlight': '22 50% 68%',
    '--success': '138 30% 38%',
    '--sidebar-primary': '138 18% 42%',
    '--sidebar-ring': '138 18% 42%',
  },
  'midnight-gold': {
    '--primary': '226 24% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '40 38% 66%',
    '--secondary-foreground': '226 28% 18%',
    '--accent': '226 16% 42%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '226 24% 32%',
    '--highlight': '40 44% 60%',
    '--success': '162 26% 38%',
    '--sidebar-primary': '226 24% 32%',
    '--sidebar-ring': '226 24% 32%',
  },
  'crimson-slate': {
    '--primary': '12 28% 44%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '170 14% 58%',
    '--secondary-foreground': '12 30% 22%',
    '--accent': '12 22% 52%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '12 28% 44%',
    '--highlight': '170 22% 54%',
    '--success': '162 26% 38%',
    '--sidebar-primary': '12 28% 44%',
    '--sidebar-ring': '12 28% 44%',
  },
  'teal-pink': {
    '--primary': '174 24% 38%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '350 38% 74%',
    '--secondary-foreground': '174 28% 22%',
    '--accent': '174 20% 48%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '174 24% 38%',
    '--highlight': '350 42% 68%',
    '--success': '160 28% 38%',
    '--sidebar-primary': '174 24% 38%',
    '--sidebar-ring': '174 24% 38%',
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
      Object.keys(themeVars[id]).forEach(prop => {
        root.style.removeProperty(prop);
      });
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
