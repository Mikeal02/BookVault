import { useEffect, useMemo, useState } from 'react';
import { ScrollText, RefreshCw, Filter, Plus, Pencil, Trash2, Shield, User as UserIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { fetchAuditLog, type AuditEntry, type AuditAction } from '@/lib/system/auditLog';
import { onEvent } from '@/lib/system/eventBus';
import { cn } from '@/lib/utils';

const actionMeta: Record<AuditAction, { icon: typeof Plus; label: string; cls: string }> = {
  add: { icon: Plus, label: 'Added', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  update: { icon: Pencil, label: 'Updated', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  remove: { icon: Trash2, label: 'Removed', cls: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
};

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function downloadCsv(entries: AuditEntry[]) {
  const header = ['timestamp', 'user_id', 'action', 'book_id', 'book_title', 'changes'];
  const rows = entries.map(e => [
    e.created_at,
    e.user_id,
    e.action,
    e.book_id,
    (e.book_title ?? '').replace(/"/g, '""'),
    JSON.stringify(e.changes ?? {}).replace(/"/g, '""'),
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${c}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditLogPanel() {
  const { isAdmin } = useAdminCheck();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'self' | 'all'>('self');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchAuditLog({ scope, action: actionFilter, limit: 250 });
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, actionFilter]);

  // Auto-refresh when book mutations happen while panel is open
  useEffect(() => {
    if (!open) return;
    const offs = [
      onEvent('book:added', () => void load()),
      onEvent('book:updated', () => void load()),
      onEvent('book:removed', () => void load()),
    ];
    return () => offs.forEach(off => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, actionFilter]);

  const stats = useMemo(() => {
    const acc = { add: 0, update: 0, remove: 0 };
    entries.forEach(e => { acc[e.action] = (acc[e.action] || 0) + 1; });
    return acc;
  }, [entries]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ScrollText className="h-4 w-4" />
          Audit Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Book Activity Audit Log
            {isAdmin && (
              <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Immutable trail of every add, update, and remove action on your books.
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {isAdmin && (
            <Tabs value={scope} onValueChange={(v) => setScope(v as 'self' | 'all')}>
              <TabsList className="h-8">
                <TabsTrigger value="self" className="gap-1 text-xs">
                  <UserIcon className="h-3 w-3" /> Mine
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-1 text-xs">
                  <Shield className="h-3 w-3" /> All Users
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as typeof actionFilter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="add">Added</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="remove">Removed</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden gap-1 text-xs text-muted-foreground sm:flex">
              <Badge variant="secondary" className="gap-1">
                <Plus className="h-3 w-3" /> {stats.add}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Pencil className="h-3 w-3" /> {stats.update}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Trash2 className="h-3 w-3" /> {stats.remove}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => downloadCsv(entries)} disabled={!entries.length} className="h-8 gap-1">
              <Download className="h-3 w-3" /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-8 gap-1">
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </div>

        {/* Entries */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading && entries.length === 0 ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No audit entries yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add, update, or remove a book to see activity here.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-3 py-4">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" aria-hidden />
              {entries.map((entry) => {
                const meta = actionMeta[entry.action];
                const Icon = meta.icon;
                const changeKeys = entry.changes ? Object.keys(entry.changes) : [];
                return (
                  <li key={entry.id} className="relative flex gap-3">
                    <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border', meta.cls)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {entry.book_title || entry.book_id}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground" title={new Date(entry.created_at).toLocaleString()}>
                          {formatRelative(entry.created_at)}
                        </span>
                      </div>
                      {changeKeys.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {changeKeys.slice(0, 6).map(k => (
                            <Badge key={k} variant="outline" className="font-mono text-[10px]">
                              {k}
                            </Badge>
                          ))}
                          {changeKeys.length > 6 && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              +{changeKeys.length - 6}
                            </Badge>
                          )}
                        </div>
                      )}
                      {scope === 'all' && (
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                          user: {entry.user_id.slice(0, 8)}…
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}