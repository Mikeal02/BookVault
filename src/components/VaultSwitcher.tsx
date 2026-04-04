import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Pencil, Trash2, Library, Check } from 'lucide-react';
import { Vault } from '@/hooks/useVaults';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const VAULT_ICONS = ['📚', '🎓', '💼', '🔬', '📖', '🎨', '🧠', '💡', '🌍', '⚡', '🏛️', '🧪'];
const VAULT_COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#10b981', '#6366f1'];

interface VaultSwitcherProps {
  vaults: Vault[];
  activeVaultId: string | null;
  onSelect: (vaultId: string | null) => void;
  onCreate: (name: string, icon: string, color: string, description?: string) => Promise<Vault | null>;
  onUpdate: (vaultId: string, updates: Partial<Pick<Vault, 'name' | 'icon' | 'color' | 'description'>>) => Promise<void>;
  onDelete: (vaultId: string) => Promise<void>;
}

export const VaultSwitcher = ({ vaults, activeVaultId, onSelect, onCreate, onUpdate, onDelete }: VaultSwitcherProps) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editVault, setEditVault] = useState<Vault | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#14b8a6');
  const [description, setDescription] = useState('');

  const activeVault = vaults.find(v => v.id === activeVaultId);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), icon, color, description.trim() || undefined);
    setShowCreate(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editVault || !name.trim()) return;
    await onUpdate(editVault.id, { name: name.trim(), icon, color, description: description.trim() || null });
    setEditVault(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setIcon('📚');
    setColor('#14b8a6');
    setDescription('');
  };

  const openEdit = (vault: Vault) => {
    setName(vault.name);
    setIcon(vault.icon);
    setColor(vault.color);
    setDescription(vault.description || '');
    setEditVault(vault);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 hover:border-primary/30 transition-all text-sm font-medium group">
            <span className="text-base">{activeVault?.icon || '📚'}</span>
            <span className="text-foreground truncate max-w-[140px]">
              {activeVault?.name || 'All Vaults'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-2">
          <DropdownMenuItem
            onClick={() => onSelect(null)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer"
          >
            <Library className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 font-medium">All Vaults</span>
            {activeVaultId === null && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {vaults.map(vault => (
            <DropdownMenuItem
              key={vault.id}
              onClick={() => onSelect(vault.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer group/item"
            >
              <span className="text-base">{vault.icon}</span>
              <span className="flex-1 font-medium truncate">{vault.name}</span>
              {activeVaultId === vault.id && <Check className="w-4 h-4 text-primary" />}
              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(vault); }}
                  className="p-1 rounded hover:bg-muted"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
                {vaults.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(vault.id); }}
                    className="p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Vault</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editVault} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditVault(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-display">
              {editVault ? 'Edit Vault' : 'Create New Vault'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Academic, Fiction, Work..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Description (optional)</label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's this vault for?"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {VAULT_ICONS.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      icon === i ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {VAULT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditVault(null); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={editVault ? handleUpdate : handleCreate} disabled={!name.trim()}>
                {editVault ? 'Save Changes' : 'Create Vault'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
