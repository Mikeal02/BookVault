import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SyncResult {
  profiles: { exported: number; imported: number };
  user_books: { exported: number; imported: number };
  reading_sessions: { exported: number; imported: number };
}

export const DatabaseSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (direction: 'export' | 'import' | 'both') => {
    setIsSyncing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to sync');
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-external-db', {
        body: { direction, userId: user.id },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const results = data.results as SyncResult;
        const directionLabel = direction === 'both' ? 'Two-way sync' : direction === 'export' ? 'Export' : 'Import';
        
        let message = `${directionLabel} completed!\n`;
        
        if (direction === 'export' || direction === 'both') {
          message += `Exported: ${results.profiles.exported} profiles, ${results.user_books.exported} books, ${results.reading_sessions.exported} sessions. `;
        }
        if (direction === 'import' || direction === 'both') {
          message += `Imported: ${results.profiles.imported} profiles, ${results.user_books.imported} books, ${results.reading_sessions.imported} sessions.`;
        }
        
        toast.success(message);
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isSyncing}
          className="gap-2"
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {isSyncing ? 'Syncing...' : 'Sync Database'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSync('both')} className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Two-way Sync
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSync('export')} className="gap-2">
          <ArrowUp className="h-4 w-4" />
          Export to External DB
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSync('import')} className="gap-2">
          <ArrowDown className="h-4 w-4" />
          Import from External DB
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
