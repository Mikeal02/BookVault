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
  { id: 'cosmic-aurora', name: 'Cosmic Aurora', emoji: '🌌', preview: { primary: '#6D5BFF', secondary: '#2EE6A6', accent: '#00D4FF' } },
  { id: 'ember-voltage', name: 'Ember Voltage', emoji: '🔥', preview: { primary: '#FF3D3D', secondary: '#FF8A00', accent: '#FFD166' } },
  { id: 'neon-noir', name: 'Neon Noir', emoji: '🖤', preview: { primary: '#0F0F14', secondary: '#1F1F2E', accent: '#8A2BE2' } },
  { id: 'arctic-pulse', name: 'Arctic Pulse', emoji: '🌊', preview: { primary: '#00B4D8', secondary: '#48CAE4', accent: '#90E0EF' } },
  { id: 'eden-glow', name: 'Eden Glow', emoji: '🌿', preview: { primary: '#2D6A4F', secondary: '#52B788', accent: '#B7E4C7' } },
  { id: 'sunset-mirage', name: 'Sunset Mirage', emoji: '🌇', preview: { primary: '#FF5F6D', secondary: '#FFC371', accent: '#6A82FB' } },
];

const themeVars: Record<string, Record<string, string>> = {
  // 🌌 Cosmic Aurora — neon space glow
  'cosmic-aurora': {
    '--primary': '260 100% 70%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '160 85% 55%',
    '--secondary-foreground': '0 0% 8%',

    '--accent': '195 100% 55%',
    '--accent-foreground': '0 0% 10%',

    '--ring': '260 100% 70%',
    '--highlight': '160 90% 60%',
    '--success': '140 60% 45%',

    '--sidebar-primary': '260 100% 70%',
    '--sidebar-ring': '260 100% 70%',
  },

  // 🔥 Ember Voltage — cinematic fire energy
  'ember-voltage': {
    '--primary': '0 100% 62%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '30 100% 55%',
    '--secondary-foreground': '0 0% 10%',

    '--accent': '45 100% 60%',
    '--accent-foreground': '0 0% 10%',

    '--ring': '0 100% 62%',
    '--highlight': '30 100% 60%',
    '--success': '140 60% 45%',

    '--sidebar-primary': '0 100% 62%',
    '--sidebar-ring': '0 100% 62%',
  },

  // 🖤 Neon Noir — cyberpunk dark glow
  'neon-noir': {
    '--primary': '270 100% 60%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '240 20% 18%',
    '--secondary-foreground': '0 0% 100%',

    '--accent': '290 100% 65%',
    '--accent-foreground': '0 0% 100%',

    '--ring': '270 100% 60%',
    '--highlight': '290 100% 65%',
    '--success': '160 70% 45%',

    '--sidebar-primary': '270 100% 60%',
    '--sidebar-ring': '270 100% 60%',
  },

  // 🌊 Arctic Pulse — clean futuristic ice tech
  'arctic-pulse': {
    '--primary': '195 100% 50%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '190 80% 60%',
    '--secondary-foreground': '210 30% 10%',

    '--accent': '200 100% 70%',
    '--accent-foreground': '210 30% 10%',

    '--ring': '195 100% 50%',
    '--highlight': '190 90% 65%',
    '--success': '150 60% 45%',

    '--sidebar-primary': '195 100% 50%',
    '--sidebar-ring': '195 100% 50%',
  },

  // 🌿 Eden Glow — vibrant nature alive UI
  'eden-glow': {
    '--primary': '150 70% 40%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '140 55% 55%',
    '--secondary-foreground': '0 0% 10%',

    '--accent': '120 60% 70%',
    '--accent-foreground': '0 0% 10%',

    '--ring': '150 70% 40%',
    '--highlight': '140 60% 60%',
    '--success': '160 60% 45%',

    '--sidebar-primary': '150 70% 40%',
    '--sidebar-ring': '150 70% 40%',
  },

  // 🌇 Sunset Mirage — cinematic warm gradient feel
  'sunset-mirage': {
    '--primary': '10 100% 65%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '40 100% 60%',
    '--secondary-foreground': '0 0% 10%',

    '--accent': '230 100% 65%',
    '--accent-foreground': '0 0% 100%',

    '--ring': '10 100% 65%',
    '--highlight': '40 100% 65%',
    '--success': '140 55% 45%',

    '--sidebar-primary': '10 100% 65%',
    '--sidebar-ring': '10 100% 65%',
  },
};
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
