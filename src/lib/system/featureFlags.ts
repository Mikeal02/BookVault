/**
 * Tiny feature-flag registry. Defaults baked in code; runtime overrides
 * read from localStorage key `app_flags` (JSON object). Toggle from devtools:
 *   localStorage.setItem('app_flags', JSON.stringify({ pwa: true }))
 */

export interface FeatureFlags {
  pwa: boolean;
  persistentQueryCache: boolean;
  webVitals: boolean;
  experimentalAI: boolean;
}

const DEFAULTS: FeatureFlags = {
  pwa: true,
  persistentQueryCache: true,
  webVitals: true,
  experimentalAI: false,
};

let cached: FeatureFlags | null = null;

export const getFlags = (): FeatureFlags => {
  if (cached) return cached;
  let overrides: Partial<FeatureFlags> = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('app_flags') : null;
    if (raw) overrides = JSON.parse(raw);
  } catch {}
  cached = { ...DEFAULTS, ...overrides };
  return cached;
};

export const isFlagEnabled = <K extends keyof FeatureFlags>(flag: K): boolean => getFlags()[flag];

export const setFlag = <K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]) => {
  const next = { ...getFlags(), [flag]: value };
  cached = next;
  try { localStorage.setItem('app_flags', JSON.stringify(next)); } catch {}
};