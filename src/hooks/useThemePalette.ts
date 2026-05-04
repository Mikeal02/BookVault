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
  { id: 'emerald-gold', name: 'Emerald & Gold', emoji: '🌿', preview: { primary: '#10B981', secondary: '#F59E0B', accent: '#059669' } },
  { id: 'violet-amber', name: 'Violet & Amber', emoji: '🔮', preview: { primary: '#8B5CF6', secondary: '#F97316', accent: '#A78BFA' } },
  { id: 'ocean-coral', name: 'Ocean & Coral', emoji: '🌊', preview: { primary: '#0EA5E9', secondary: '#F43F5E', accent: '#38BDF8' } },
  { id: 'forest-peach', name: 'Forest & Peach', emoji: '🌲', preview: { primary: '#059669', secondary: '#FB923C', accent: '#34D399' } },
  { id: 'midnight-gold', name: 'Midnight & Gold', emoji: '✨', preview: { primary: '#6366F1', secondary: '#EAB308', accent: '#818CF8' } },
  { id: 'crimson-slate', name: 'Crimson & Slate', emoji: '🔥', preview: { primary: '#DC2626', secondary: '#64748B', accent: '#EF4444' } },
  { id: 'teal-pink', name: 'Teal & Pink', emoji: '🩷', preview: { primary: '#14B8A6', secondary: '#EC4899', accent: '#2DD4BF' } },
];

const themeVars: Record<string, Record<string, string>> = {
  'sapphire-rose': {}, // default, no overrides
  'emerald-gold': {
    '--primary': '162 68% 36%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '38 92% 52%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '162 60% 30%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '162 68% 36%',
    '--highlight': '48 90% 55%',
    '--success': '152 72% 32%',
    '--sidebar-primary': '162 68% 36%',
    '--sidebar-ring': '162 68% 36%',
  },
  'violet-amber': {
    '--primary': '263 70% 58%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '25 95% 53%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '263 60% 50%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '263 70% 58%',
    '--highlight': '38 92% 55%',
    '--success': '162 62% 34%',
    '--sidebar-primary': '263 70% 58%',
    '--sidebar-ring': '263 70% 58%',
  },
  'ocean-coral': {
    '--primary': '199 89% 48%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '347 77% 50%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '199 80% 42%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '199 89% 48%',
    '--highlight': '38 90% 55%',
    '--success': '162 68% 34%',
    '--sidebar-primary': '199 89% 48%',
    '--sidebar-ring': '199 89% 48%',
  },
  'forest-peach': {
    '--primary': '160 84% 39%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '27 96% 61%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '160 74% 33%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '160 84% 39%',
    '--highlight': '27 90% 55%',
    '--success': '140 72% 32%',
    '--sidebar-primary': '160 84% 39%',
    '--sidebar-ring': '160 84% 39%',
  },
  'midnight-gold': {
    '--primary': '239 84% 67%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '48 96% 53%',
    '--secondary-foreground': '0 0% 8%',
    '--accent': '239 74% 60%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '239 84% 67%',
    '--highlight': '48 96% 53%',
    '--success': '162 68% 36%',
    '--sidebar-primary': '239 84% 67%',
    '--sidebar-ring': '239 84% 67%',
  },
  'crimson-slate': {
    '--primary': '0 72% 50%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '215 16% 47%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '0 62% 44%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '0 72% 50%',
    '--highlight': '0 80% 58%',
    '--success': '162 68% 36%',
    '--sidebar-primary': '0 72% 50%',
    '--sidebar-ring': '0 72% 50%',
  },
  'teal-pink': {
    '--primary': '173 80% 40%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '330 81% 60%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '173 70% 34%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '173 80% 40%',
    '--highlight': '330 70% 55%',
    '--success': '160 72% 34%',
    '--sidebar-primary': '173 80% 40%',
    '--sidebar-ring': '173 80% 40%',
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
