export interface ThemeOption {
    id: string;
    name: string;
    emoji: string;
    preview: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }

export const themes: ThemeOption[] = [
    { id: 'goodreads-heritage', name: 'Heritage Catalog', emoji: '📗', preview: { primary: '#409D69', secondary: '#00635D', accent: '#382110' } },
    { id: 'espresso-stacks', name: 'Espresso Stacks', emoji: '☕', preview: { primary: '#5C3A21', secondary: '#409D69', accent: '#F2C511' } },
    { id: 'teal-shelves', name: 'Teal Shelves', emoji: '📘', preview: { primary: '#00635D', secondary: '#409D69', accent: '#F4F1EA' } },
    { id: 'honey-ratings', name: 'Honey Ratings', emoji: '⭐', preview: { primary: '#D4A017', secondary: '#409D69', accent: '#382110' } },
    { id: 'linen-shelf', name: 'Linen Shelf', emoji: '📜', preview: { primary: '#6B8F71', secondary: '#8B6914', accent: '#E8E0D4' } },
    { id: 'moss-library', name: 'Moss Library', emoji: '🌿', preview: { primary: '#2F6B4F', secondary: '#1A4A44', accent: '#C4A35A' } },
  ];

export const themeVars: Record<string, Record<string, string>> = {
    'goodreads-heritage': {
      '--primary': '148 42% 43%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '176 100% 19%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '24 56% 18%',
      '--accent-foreground': '40 31% 96%',
      '--ring': '148 42% 43%',
      '--highlight': '48 90% 51%',
      '--success': '148 42% 38%',
      '--sidebar-primary': '148 42% 48%',
      '--sidebar-ring': '148 42% 48%',
    },

    'espresso-stacks': {
      '--primary': '24 48% 24%',
      '--primary-foreground': '40 31% 96%',
      '--secondary': '148 42% 43%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '48 90% 51%',
      '--accent-foreground': '24 28% 10%',
      '--ring': '24 48% 24%',
      '--highlight': '48 90% 51%',
      '--success': '148 42% 38%',
      '--sidebar-primary': '48 90% 51%',
      '--sidebar-ring': '48 90% 51%',
    },

    'teal-shelves': {
      '--primary': '176 100% 19%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '148 42% 43%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '40 31% 94%',
      '--accent-foreground': '24 28% 12%',
      '--ring': '176 100% 19%',
      '--highlight': '48 90% 51%',
      '--success': '148 42% 40%',
      '--sidebar-primary': '176 50% 42%',
      '--sidebar-ring': '176 50% 42%',
    },

    'honey-ratings': {
      '--primary': '43 80% 42%',
      '--primary-foreground': '24 28% 10%',
      '--secondary': '148 42% 43%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '24 56% 18%',
      '--accent-foreground': '40 31% 96%',
      '--ring': '43 80% 42%',
      '--highlight': '48 90% 51%',
      '--success': '148 42% 38%',
      '--sidebar-primary': '43 80% 48%',
      '--sidebar-ring': '43 80% 48%',
    },

    'linen-shelf': {
      '--primary': '132 18% 50%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '40 74% 32%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '36 28% 86%',
      '--accent-foreground': '24 28% 16%',
      '--ring': '132 18% 50%',
      '--highlight': '43 70% 48%',
      '--success': '132 22% 40%',
      '--sidebar-primary': '132 18% 55%',
      '--sidebar-ring': '132 18% 55%',
    },

    'moss-library': {
      '--primary': '152 38% 30%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '174 48% 20%',
      '--secondary-foreground': '0 0% 100%',
      '--accent': '40 48% 56%',
      '--accent-foreground': '24 28% 10%',
      '--ring': '152 38% 30%',
      '--highlight': '40 55% 52%',
      '--success': '152 38% 36%',
      '--sidebar-primary': '152 38% 42%',
      '--sidebar-ring': '152 38% 42%',
    },
  };
