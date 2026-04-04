import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Vault {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useVaults = (userId: string | undefined) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadVaults = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading vaults:', error);
      setLoading(false);
      return;
    }

    let vaultList = (data || []) as Vault[];

    // Auto-create default vault if none exist
    if (vaultList.length === 0) {
      const { data: newVault, error: createError } = await supabase
        .from('vaults')
        .insert({ user_id: userId, name: 'My Library', icon: '📚', color: '#14b8a6', sort_order: 0 })
        .select()
        .single();

      if (!createError && newVault) {
        vaultList = [newVault as Vault];
      }
    }

    setVaults(vaultList);
    // Default to "All" (null) on first load
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  const createVault = useCallback(async (name: string, icon: string = '📚', color: string = '#14b8a6', description?: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('vaults')
      .insert({ user_id: userId, name, icon, color, description: description || null, sort_order: vaults.length })
      .select()
      .single();

    if (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault');
      return null;
    }

    const vault = data as Vault;
    setVaults(prev => [...prev, vault]);
    toast.success(`"${name}" vault created!`);
    return vault;
  }, [userId, vaults.length]);

  const updateVault = useCallback(async (vaultId: string, updates: Partial<Pick<Vault, 'name' | 'icon' | 'color' | 'description'>>) => {
    if (!userId) return;
    const { error } = await supabase
      .from('vaults')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', vaultId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating vault:', error);
      toast.error('Failed to update vault');
      return;
    }

    setVaults(prev => prev.map(v => v.id === vaultId ? { ...v, ...updates } : v));
    toast.success('Vault updated');
  }, [userId]);

  const deleteVault = useCallback(async (vaultId: string) => {
    if (!userId) return;
    // First unassign books from this vault
    await supabase
      .from('user_books')
      .update({ vault_id: null })
      .eq('user_id', userId)
      .eq('vault_id', vaultId);

    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting vault:', error);
      toast.error('Failed to delete vault');
      return;
    }

    setVaults(prev => prev.filter(v => v.id !== vaultId));
    if (activeVaultId === vaultId) setActiveVaultId(null);
    toast.success('Vault deleted');
  }, [userId, activeVaultId]);

  const assignBookToVault = useCallback(async (bookId: string, vaultId: string | null) => {
    if (!userId) return;
    const { error } = await supabase
      .from('user_books')
      .update({ vault_id: vaultId })
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error assigning book to vault:', error);
      toast.error('Failed to move book');
      return;
    }

    const vaultName = vaultId ? vaults.find(v => v.id === vaultId)?.name : 'All Books';
    toast.success(`Moved to ${vaultName}`);
  }, [userId, vaults]);

  return {
    vaults,
    activeVaultId,
    setActiveVaultId,
    loading,
    createVault,
    updateVault,
    deleteVault,
    assignBookToVault,
    loadVaults,
  };
};
