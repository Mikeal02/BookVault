import { supabase } from '@/integrations/supabase/client';
import { createLogger } from './logger';

const log = createLogger('audit');

export type AuditAction = 'add' | 'update' | 'remove';

export interface AuditEntry {
  id: string;
  user_id: string;
  book_id: string;
  book_title: string | null;
  action: AuditAction;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface LogParams {
  userId: string;
  bookId: string;
  bookTitle?: string | null;
  action: AuditAction;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget audit log writer. Failures must never block UX.
 */
export async function logBookAction(params: LogParams): Promise<void> {
  try {
    const { error } = await supabase.from('book_audit_log').insert({
      user_id: params.userId,
      book_id: params.bookId,
      book_title: params.bookTitle ?? null,
      action: params.action,
      changes: params.changes ?? null,
      metadata: {
        ...(params.metadata ?? {}),
        client_ts: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
    });
    if (error) log.warn('logBookAction insert failed', error);
  } catch (err) {
    log.warn('logBookAction threw', err);
  }
}

/**
 * Diff two book objects and return only fields that actually changed.
 */
export function diffBooks(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  keys: string[]
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of keys) {
    const a = before[key];
    const b = after[key];
    const equal = JSON.stringify(a) === JSON.stringify(b);
    if (!equal) changes[key] = { from: a, to: b };
  }
  return changes;
}

export async function fetchAuditLog(opts: {
  scope: 'self' | 'all';
  limit?: number;
  action?: AuditAction | 'all';
}): Promise<AuditEntry[]> {
  let query = supabase
    .from('book_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.action && opts.action !== 'all') query = query.eq('action', opts.action);

  const { data, error } = await query;
  if (error) {
    log.error('fetchAuditLog failed', error);
    return [];
  }
  return (data || []) as AuditEntry[];
}