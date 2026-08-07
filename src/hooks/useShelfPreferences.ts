import { useCallback, useEffect, useState } from 'react';

export type ShelfSortKey = 'title' | 'author' | 'rating' | 'dateAdded' | 'dateFinished' | 'progress' | 'pages';
export type ShelfSortDir = 'asc' | 'desc';
export type ShelfStatus = 'all' | 'not-read' | 'reading' | 'finished';
export type ShelfViewMode = 'grid' | 'list' | 'compact' | 'spine' | 'timeline' | 'wall';

export interface ShelfPreferences {
  sortBy: ShelfSortKey;
  sortDir: ShelfSortDir;
  filterStatus: ShelfStatus;
  viewMode: ShelfViewMode;
  minRating: number;
  activeTags: string[];
  showAdvanced: boolean;
}

export const DEFAULT_SHELF_PREFERENCES: ShelfPreferences = {
  sortBy: 'title',
  sortDir: 'asc',
  filterStatus: 'all',
  viewMode: 'grid',
  minRating: 0,
  activeTags: [],
  showAdvanced: false,
};

const STORAGE_KEY = 'bookapp_shelf_preferences_v1';

const read = (): ShelfPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHELF_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<ShelfPreferences>;
    return {
      ...DEFAULT_SHELF_PREFERENCES,
      ...parsed,
      activeTags: Array.isArray(parsed.activeTags) ? parsed.activeTags.filter(t => typeof t === 'string') : [],
      minRating: Math.min(5, Math.max(0, Number(parsed.minRating) || 0)),
    };
  } catch {
    return DEFAULT_SHELF_PREFERENCES;
  }
};

/** Bookshelf search/sort/filter controls, persisted locally across sessions. */
export const useShelfPreferences = () => {
  const [prefs, setPrefs] = useState<ShelfPreferences>(DEFAULT_SHELF_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable (private mode / quota) — preferences stay in-memory */
    }
  }, [prefs, hydrated]);

  const update = useCallback(<K extends keyof ShelfPreferences>(key: K, value: ShelfPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setPrefs(prev => ({
      ...prev,
      activeTags: prev.activeTags.includes(tag)
        ? prev.activeTags.filter(t => t !== tag)
        : [...prev.activeTags, tag],
    }));
  }, []);

  const reset = useCallback(() => {
    setPrefs(prev => ({ ...DEFAULT_SHELF_PREFERENCES, viewMode: prev.viewMode, showAdvanced: prev.showAdvanced }));
  }, []);

  return { prefs, update, toggleTag, reset };
};