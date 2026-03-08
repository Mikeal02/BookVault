import { useState, useEffect, useCallback } from 'react';

interface UseThemeResult {
  currentTheme: string;
  setTheme: (theme: string) => void;
  themes: ThemeOption[];
}

interface ThemeOption {
  id: string;
  name: string;
  preview: { primary: string; secondary: string; bg: string };
}

export const themes: ThemeOption[] = [
  { id: 'sapphire-rose', name: 'Sapphire & Rose', preview: { primary: '#3366CC', secondary: '#D4517D', bg: '#0D0F14' } },
  { id: 'emerald-gold', name: 'Emerald & Gold', preview: { primary: '#10B981', secondary: '#F59E0B', bg: '#0A0F0D' } },
  { id: 'violet-amber', name: 'Violet & Amber', preview: { primary: '#8B5CF6', secondary: '#F97316', bg: '#0E0B14' } },
  { id: 'ocean-coral', name: 'Ocean & Coral', preview: { primary: '#0EA5E9', secondary: '#F43F5E', bg: '#0A0E14' } },
  { id: 'forest-peach', name: 'Forest & Peach', preview: { primary: '#059669', secondary: '#FB923C', bg: '#0A0F0C' } },
];

const themeVars: Record<string, Record<string, string>> = {
  'sapphire-rose': {}, // default, no overrides needed
  'emerald-gold': {
    '--primary': '162 68% 36%',
    '--secondary': '38 92% 52%',
    '--accent': '162 60% 30%',
    '--ring': '162 68% 36%',
    '--sidebar-primary': '162 68% 36%',
    '--sidebar-ring': '162 68% 36%',
  },
  'violet-amber': {
    '--primary': '263 70% 58%',
    '--secondary': '25 95% 53%',
    '--accent': '263 60% 50%',
    '--ring': '263 70% 58%',
    '--sidebar-primary': '263 70% 58%',
    '--sidebar-ring': '263 70% 58%',
  },
  'ocean-coral': {
    '--primary': '199 89% 48%',
    '--secondary': '347 77% 50%',
    '--accent': '199 80% 42%',
    '--ring': '199 89% 48%',
    '--sidebar-primary': '199 89% 48%',
    '--sidebar-ring': '199 89% 48%',
  },
  'forest-peach': {
    '--primary': '160 84% 39%',
    '--secondary': '27 96% 61%',
    '--accent': '160 74% 33%',
    '--ring': '160 84% 39%',
    '--sidebar-primary': '160 84% 39%',
    '--sidebar-ring': '160 84% 39%',
  },
};

export function useThemePalette(): UseThemeResult {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('bookapp_color_theme') || 'sapphire-rose';
  });

  const applyTheme = useCallback((themeId: string) => {
    const root = document.documentElement;
    
    // Reset to defaults first (remove custom properties)
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
