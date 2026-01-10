import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, Wifi, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncResult {
  profiles: { exported: number; imported: number; errors?: number };
  user_books: { exported: number; imported: number; errors?: number };
  reading_sessions: { exported: number; imported: number; errors?: number };
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'testing';

const LAST_SYNC_KEY = 'bookvault_last_sync';

export const DatabaseSyncButton = () => {
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<'import' | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      setLastSync(stored);
    }
  }, []);

  const testConnection = async () => {
    setStatus('testing');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsConnected(false);
        toast.error('You must be logged in');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('sync-external-db', {
        body: { action: 'test', userId: user.id },
      });

      if (error) throw error;
      
      const connected = data?.connected ?? false;
      setIsConnected(connected);
      
      if (connected) {
        toast.success('External database connected successfully');
      } else {
        toast.error('Could not connect to external database');
      }
      
      return connected;
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      toast.error('Connection test failed');
      return false;
    } finally {
      setStatus('idle');
    }
  };

  const handleSync = async (direction: 'export' | 'import' | 'both') => {
    // For import, show confirmation dialog
    if (direction === 'import') {
      setPendingDirection('import');
      setShowImportConfirm(true);
      return;
    }

    await performSync(direction);
  };

  const performSync = async (direction: 'export' | 'import' | 'both') => {
    setStatus('syncing');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to sync');
        setStatus('error');
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-external-db', {
        body: { direction, userId: user.id },
      });

      if (error) throw error;

      if (data.success) {
        const results = data.results as SyncResult;
        setStatus('success');
        setIsConnected(true);
        
        // Save last sync time
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, now);
        setLastSync(now);
        
        // Build detailed message
        const directionLabel = direction === 'both' ? 'Two-way sync' : direction === 'export' ? 'Export' : 'Import';
        const totalExported = results.profiles.exported + results.user_books.exported + results.reading_sessions.exported;
        const totalImported = results.profiles.imported + results.user_books.imported + results.reading_sessions.imported;
        const totalErrors = (results.profiles.errors || 0) + (results.user_books.errors || 0) + (results.reading_sessions.errors || 0);
        
        const duration = data.duration_ms ? `(${(data.duration_ms / 1000).toFixed(1)}s)` : '';
        
        toast.success(
          <div className="space-y-1">
            <p className="font-semibold">{directionLabel} completed! {duration}</p>
            {(direction === 'export' || direction === 'both') && totalExported > 0 && (
              <p className="text-sm opacity-90">
                ↑ Exported: {results.user_books.exported} books, {results.reading_sessions.exported} sessions
              </p>
            )}
            {(direction === 'import' || direction === 'both') && totalImported > 0 && (
              <p className="text-sm opacity-90">
                ↓ Imported: {results.user_books.imported} books, {results.reading_sessions.imported} sessions
              </p>
            )}
            {totalExported === 0 && totalImported === 0 && (
              <p className="text-sm opacity-90">Everything is already in sync</p>
            )}
            {totalErrors > 0 && (
              <p className="text-sm text-amber-500">⚠ {totalErrors} items had errors</p>
            )}
          </div>
        );

        // Reset success status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const errorMsg = data.error || 'Sync failed';
        // Check for common URL format error
        if (errorMsg.includes('Invalid database URL') || errorMsg.includes('postgresql://')) {
          toast.error(
            <div className="space-y-1">
              <p className="font-semibold">Invalid Database URL</p>
              <p className="text-sm opacity-90">
                The EXTERNAL_DB_URL must be a valid PostgreSQL connection string.
              </p>
              <p className="text-xs opacity-75 font-mono">
                Format: postgresql://user:pass@host:port/dbname
              </p>
            </div>
          );
        } else {
          throw new Error(errorMsg);
        }
        setStatus('error');
        setIsConnected(false);
        setTimeout(() => setStatus('idle'), 5000);
        return;
      }
    } catch (error) {
      console.error('Sync error:', error);
      setStatus('error');
      setIsConnected(false);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset error status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const formatLastSync = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
      case 'testing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'testing':
        return 'Testing...';
      case 'success':
        return 'Synced!';
      case 'error':
        return 'Sync Failed';
      default:
        return 'Sync';
    }
  };

  // Don't render if not admin or still loading
  if (isAdminLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <TooltipProvider>
      <>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={status === 'syncing' || status === 'testing'}
                  className={`gap-2 transition-colors ${
                    status === 'success' ? 'border-green-500/50 text-green-600' :
                    status === 'error' ? 'border-destructive/50 text-destructive' : ''
                  }`}
                >
                  {getStatusIcon()}
                  <span className="hidden sm:inline">{getButtonText()}</span>
                  <Shield className="h-3 w-3 text-amber-500" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col gap-1">
              <span className="font-medium flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-500" />
                Database Sync (Admin Only)
              </span>
              {lastSync && (
                <span className="text-xs opacity-75 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last sync: {formatLastSync(lastSync)}
                </span>
              )}
              {isConnected !== null && (
                <span className={`text-xs flex items-center gap-1 ${isConnected ? 'text-green-500' : 'text-destructive'}`}>
                  <Wifi className="h-3 w-3" />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-amber-600 flex items-center gap-1 border-b border-border mb-1">
              <Shield className="h-3 w-3" />
              Admin Feature
            </div>
            <DropdownMenuItem onClick={() => handleSync('both')} className="gap-2 cursor-pointer">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span>Two-way Sync</span>
                <span className="text-xs text-muted-foreground">Merge data from both databases</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSync('export')} className="gap-2 cursor-pointer">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span>Export</span>
                <span className="text-xs text-muted-foreground">Push local data to external DB</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSync('import')} className="gap-2 cursor-pointer">
              <ArrowDown className="h-4 w-4 text-amber-500" />
              <div className="flex flex-col">
                <span>Import</span>
                <span className="text-xs text-muted-foreground">Pull data from external DB</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={testConnection} className="gap-2 cursor-pointer">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Test Connection</span>
                <span className="text-xs text-muted-foreground">Verify external DB access</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import from External Database?</AlertDialogTitle>
              <AlertDialogDescription>
                This will merge data from your external database into your local library. 
                Existing records with the same ID will be updated with external data.
                <br /><br />
                <strong>Note:</strong> This action is safe but may overwrite local changes for matching records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDirection(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowImportConfirm(false);
                  if (pendingDirection) {
                    performSync(pendingDirection);
                    setPendingDirection(null);
                  }
                }}
              >
                Import Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  );
};
