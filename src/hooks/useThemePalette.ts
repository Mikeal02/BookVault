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
  // Each palette: Primary · Secondary · Background · Surface · Accent · Border
  { id: 'slate-professional', name: 'Slate Professional', emoji: '🪨', preview: { primary: '#3F5063', secondary: '#6B7A8F', accent: '#7C8A6B' } },
  { id: 'nordic-steel',       name: 'Nordic Steel',       emoji: '❄️', preview: { primary: '#3B5A72', secondary: '#5E7689', accent: '#8FA3B3' } },
  { id: 'forest-sage',        name: 'Forest Sage',        emoji: '🌿', preview: { primary: '#4A6552', secondary: '#7A8A78', accent: '#A89B7A' } },
  { id: 'graphite-amber',     name: 'Graphite Amber',     emoji: '🌫️', preview: { primary: '#3D4145', secondary: '#6D6F73', accent: '#B0905A' } },
  { id: 'stone-clay',         name: 'Stone Clay',         emoji: '🏺', preview: { primary: '#5C4A42', secondary: '#8A7A6F', accent: '#A89078' } },
  { id: 'midnight-ink',       name: 'Midnight Ink',       emoji: '🌙', preview: { primary: '#2E3A4D', secondary: '#525F73', accent: '#8A95A6' } },
];

const themeVars: Record<string, Record<string, string>> = {
  // Slate Professional — Primary #3F5063 · Secondary #6B7A8F · Accent #7C8A6B
  'slate-professional': {
    '--primary': '213 22% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '215 14% 49%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '80 13% 48%',
    '--accent-foreground': '0 0% 100%',
    '--ring': '213 22% 32%',
    '--highlight': '80 16% 52%',
    '--success': '152 22% 38%',
    '--sidebar-primary': '213 22% 32%',
    '--sidebar-ring': '213 22% 32%',
  },
  // Nordic Steel — Primary #3B5A72 · Secondary #5E7689 · Accent #8FA3B3
  'nordic-steel': {
    '--primary': '207 32% 34%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '207 19% 45%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '208 18% 63%',
    '--accent-foreground': '210 30% 18%',
    '--ring': '207 32% 34%',
    '--highlight': '208 22% 58%',
    '--success': '162 24% 38%',
    '--sidebar-primary': '207 32% 34%',
    '--sidebar-ring': '207 32% 34%',
  },
  // Forest Sage — Primary #4A6552 · Secondary #7A8A78 · Accent #A89B7A
  'forest-sage': {
    '--primary': '138 16% 34%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '110 8% 51%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '42 24% 57%',
    '--accent-foreground': '138 22% 18%',
    '--ring': '138 16% 34%',
    '--highlight': '42 26% 54%',
    '--success': '138 22% 36%',
    '--sidebar-primary': '138 16% 34%',
    '--sidebar-ring': '138 16% 34%',
  },
  // Graphite Amber — Primary #3D4145 · Secondary #6D6F73 · Accent #B0905A
  'graphite-amber': {
    '--primary': '210 5% 26%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '220 3% 44%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '35 36% 53%',
    '--accent-foreground': '210 8% 16%',
    '--ring': '210 5% 26%',
    '--highlight': '35 38% 50%',
    '--success': '152 22% 36%',
    '--sidebar-primary': '210 5% 26%',
    '--sidebar-ring': '210 5% 26%',
  },
  // Stone Clay — Primary #5C4A42 · Secondary #8A7A6F · Accent #A89078
  'stone-clay': {
    '--primary': '17 16% 31%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '24 11% 49%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '28 22% 56%',
    '--accent-foreground': '17 22% 18%',
    '--ring': '17 16% 31%',
    '--highlight': '28 24% 52%',
    '--success': '142 18% 38%',
    '--sidebar-primary': '17 16% 31%',
    '--sidebar-ring': '17 16% 31%',
  },
  // Midnight Ink — Primary #2E3A4D · Secondary #525F73 · Accent #8A95A6
  'midnight-ink': {
    '--primary': '215 25% 24%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '215 16% 39%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '215 13% 60%',
    '--accent-foreground': '215 28% 16%',
    '--ring': '215 25% 24%',
    '--highlight': '215 18% 56%',
    '--success': '162 22% 38%',
    '--sidebar-primary': '215 25% 24%',
    '--sidebar-ring': '215 25% 24%',
  },
};

export function useThemePalette(): UseThemeResult {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const stored = localStorage.getItem('bookapp_color_theme');
    if (stored && themes.some(t => t.id === stored)) return stored;
    return 'slate-professional';
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
