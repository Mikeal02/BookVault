/**
 * Centralized React Query client with sensible defaults + optional
 * localStorage persistence for cross-session caching.
 */

import { QueryClient } from '@tanstack/react-query';
import { isFlagEnabled } from './featureFlags';
import { createLogger } from './logger';

const log = createLogger('query');

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,                // 1 min — avoid refetch storms
      gcTime: 30 * 60_000,              // 30 min in cache
      retry: (failureCount, err: any) => {
        // Don't retry 4xx; retry up to 2x for network/5xx
        const status = err?.status ?? err?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      onError: (err) => log.error('mutation failed', err),
    },
  },
});

const PERSIST_KEY = 'app_query_cache_v1';
const PERSIST_MAX_BYTES = 500_000; // ~500KB cap

/**
 * Lightweight persister: serialize whitelisted query keys to localStorage
 * on a debounced cadence. Avoids @tanstack/query-persist-client dep.
 */
export const installQueryPersistence = (allowedKeys: string[] = []) => {
  if (!isFlagEnabled('persistentQueryCache') || typeof localStorage === 'undefined') return;

  // Hydrate
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const dump = JSON.parse(raw) as Array<{ key: unknown; data: unknown; ts: number }>;
      for (const entry of dump) {
        const keyArr = entry.key as unknown[];
        const head = String(keyArr?.[0] ?? '');
        if (!allowedKeys.length || allowedKeys.includes(head)) {
          queryClient.setQueryData(keyArr as any, entry.data);
        }
      }
    }
  } catch (err) {
    log.warn('hydrate failed', err);
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        const cache = queryClient.getQueryCache().getAll();
        const dump = cache
          .filter(q => {
            if (!allowedKeys.length) return true;
            const head = String(q.queryKey[0] ?? '');
            return allowedKeys.includes(head);
          })
          .filter(q => q.state.data !== undefined && q.state.status === 'success')
          .map(q => ({ key: q.queryKey, data: q.state.data, ts: q.state.dataUpdatedAt }));
        const json = JSON.stringify(dump);
        if (json.length <= PERSIST_MAX_BYTES) {
          localStorage.setItem(PERSIST_KEY, json);
        }
      } catch (err) {
        log.warn('persist failed', err);
      }
    }, 1500);
  };

  queryClient.getQueryCache().subscribe(schedule);
};