import { useState, useEffect, useCallback } from 'react';
import { themes, themeVars, ThemeOption } from '@/themes/themeConfig';

interface UseThemeResult {
  currentTheme: string;
  setTheme: (theme: string) => void;
  themes: ThemeOption[];
}



export function useThemePalette(): UseThemeResult {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const stored = localStorage.getItem('bookapp_color_theme');
    if (stored && themes.some(t => t.id === stored)) return stored;
    return 'cosmic-aurora';
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
  }, [currentTheme, applyTheme]);

  return { currentTheme, setTheme, themes };
}
