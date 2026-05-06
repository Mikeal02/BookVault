import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Trash2, Star, FileText, Quote, Bookmark, Search, Download, Edit3, X, Check, Hash,
  Sparkles, Tag, Filter, LayoutGrid, List as ListIcon, Network, Calendar as CalIcon,
  ArrowUpDown, BookOpen, Brain, Loader2, Copy, ChevronDown, Wand2, Eye,
} from 'lucide-react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Annotation {
  id: string;
  book_id: string;
  content: string;
  annotation_type: string;
  chapter: string | null;
  page_number: number | null;
  color: string;
  is_favorite: boolean;
  tags: string[] | null;
  sentiment: string | null;
  created_at: string;
  updated_at: string;
}

interface BookAnnotationsProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

const ANNOTATION_TYPES = [
  { value: 'note', label: 'Note', icon: FileText, color: '#14b8a6' },
  { value: 'highlight', label: 'Highlight', icon: Edit3, color: '#f97316' },
  { value: 'chapter_marker', label: 'Chapter', icon: Bookmark, color: '#8b5cf6' },
  { value: 'quote', label: 'Quote', icon: Quote, color: '#ec4899' },
];

const SENTIMENTS = [
  { value: 'insightful', label: '💡 Insightful' },
  { value: 'positive', label: '✨ Positive' },
  { value: 'neutral', label: '⚪ Neutral' },
  { value: 'critical', label: '⚡ Critical' },
  { value: 'question', label: '❓ Question' },
];

const HIGHLIGHT_COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#22c55e', '#06b6d4', '#f43f5e'];

type ViewMode = 'cards' | 'compact' | 'graph' | 'timeline';
type SortMode = 'recent' | 'oldest' | 'book' | 'page' | 'favorites';
type SynthMode = 'synthesize' | 'cluster' | 'flashcards' | 'essay';

// ── Inline markdown renderer (lightweight) ──
const renderMarkdown = (text: string): JSX.Element => {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold mt-3 text-foreground">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="text-base font-semibold mt-2 text-foreground">{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="pl-4 text-muted-foreground">• {formatInline(line.slice(2))}</div>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{formatInline(line)}</p>;
      })}
    </div>
  );
};
const formatInline = (text: string): JSX.Element => {
  const parts: (string | JSX.Element)[] = [];
  let r = text;
  let k = 0;
  while (r.length) {
    const b = r.match(/\*\*(.+?)\*\*/);
    const c = r.match(/\[#(\d+)\]/);
    const matches = [b && { t: 'b', m: b }, c && { t: 'c', m: c }].filter(Boolean) as any[];
    if (!matches.length) { parts.push(r); break; }
    matches.sort((a, b) => (a.m.index || 0) - (b.m.index || 0));
    const f = matches[0];
    const idx = f.m.index || 0;
    if (idx > 0) parts.push(r.slice(0, idx));
    if (f.t === 'b') parts.push(<strong key={k++} className="text-foreground font-semibold">{f.m[1]}</strong>);
    else parts.push(<span key={k++} className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 text-primary text-xs font-mono mx-0.5">#{f.m[1]}</span>);
    r = r.slice(idx + f.m[0].length);
  }
  return <>{parts}</>;
};

export const BookAnnotations = ({ books, onBookSelect }: BookAnnotationsProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [filterBook, setFilterBook] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSynthPanel, setShowSynthPanel] = useState(false);
  const [synthMode, setSynthMode] = useState<SynthMode>('synthesize');
  const [synthOutput, setSynthOutput] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Form
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('note');
  const [newChapter, setNewChapter] = useState('');
  const [newPage, setNewPage] = useState('');
  const [newColor, setNewColor] = useState('#14b8a6');
  const [newTags, setNewTags] = useState('');
  const [newSentiment, setNewSentiment] = useState<string>('');

  useEffect(() => { loadAnnotations(); }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadAnnotations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('book_annotations').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnnotations((data || []) as Annotation[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createAnnotation = async () => {
    if (!newContent.trim() || !selectedBook) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const tagsArr = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from('book_annotations').insert({
        user_id: user.id,
        book_id: selectedBook,
        content: newContent.trim(),
        annotation_type: newType,
        chapter: newChapter.trim() || null,
        page_number: newPage ? parseInt(newPage) : null,
        color: newColor,
        tags: tagsArr,
        sentiment: newSentiment || null,
      });
      if (error) throw error;
      toast.success('Annotation saved');
      resetForm();
      loadAnnotations();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save');
    }
  };

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase.from('book_annotations').delete().eq('id', id);
    if (error) return toast.error('Delete failed');
    toast.success('Deleted');
    loadAnnotations();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} annotation(s)?`)) return;
    const { error } = await supabase.from('book_annotations').delete().in('id', Array.from(selectedIds));
    if (error) return toast.error('Bulk delete failed');
    toast.success(`${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    loadAnnotations();
  };

  const bulkFavorite = async (fav: boolean) => {
    if (selectedIds.size === 0) return;
    const { error } = await supabase.from('book_annotations').update({ is_favorite: fav }).in('id', Array.from(selectedIds));
    if (error) return toast.error('Update failed');
    toast.success(`${selectedIds.size} updated`);
    setSelectedIds(new Set());
    loadAnnotations();
  };

  const toggleFavorite = async (id: string, currentFav: boolean) => {
    const { error } = await supabase.from('book_annotations').update({ is_favorite: !currentFav }).eq('id', id);
    if (error) return;
    loadAnnotations();
  };

  const updateAnnotation = async (id: string) => {
    const { error } = await supabase.from('book_annotations').update({
      content: editContent, updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return toast.error('Update failed');
    setEditingId(null);
    toast.success('Updated');
    loadAnnotations();
  };

  const resetForm = () => {
    setNewContent(''); setNewType('note'); setNewChapter(''); setNewPage('');
    setNewColor('#14b8a6'); setSelectedBook(''); setNewTags(''); setNewSentiment('');
    setShowAddForm(false);
  };

  // ── Filtering & sorting ──
  const allTags = useMemo(() => {
    const s = new Set<string>();
    annotations.forEach(a => a.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [annotations]);

  const filtered = useMemo(() => {
    const list = annotations.filter(a => {
      if (filterBook !== 'all' && a.book_id !== filterBook) return false;
      if (filterType !== 'all' && a.annotation_type !== filterType) return false;
      if (filterTag !== 'all' && !(a.tags?.includes(filterTag))) return false;
      if (filterSentiment !== 'all' && a.sentiment !== filterSentiment) return false;
      if (filterFavorites && !a.is_favorite) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inContent = a.content.toLowerCase().includes(q);
        const inTags = a.tags?.some(t => t.toLowerCase().includes(q));
        const inChapter = a.chapter?.toLowerCase().includes(q);
        if (!inContent && !inTags && !inChapter) return false;
      }
      return true;
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortMode) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'book': {
          const ta = books.find(bk => bk.id === a.book_id)?.title || '';
          const tb = books.find(bk => bk.id === b.book_id)?.title || '';
          return ta.localeCompare(tb);
        }
        case 'page': return (a.page_number || 0) - (b.page_number || 0);
        case 'favorites': return Number(b.is_favorite) - Number(a.is_favorite);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return sorted;
  }, [annotations, filterBook, filterType, filterTag, filterSentiment, filterFavorites, searchQuery, sortMode, books]);

  const stats = useMemo(() => ({
    total: annotations.length,
    notes: annotations.filter(a => a.annotation_type === 'note').length,
    highlights: annotations.filter(a => a.annotation_type === 'highlight').length,
    quotes: annotations.filter(a => a.annotation_type === 'quote').length,
    chapters: annotations.filter(a => a.annotation_type === 'chapter_marker').length,
    favorites: annotations.filter(a => a.is_favorite).length,
    tags: allTags.length,
    books: new Set(annotations.map(a => a.book_id)).size,
  }), [annotations, allTags]);

  // ── Activity heatmap (last 12 weeks) ──
  const heatmap = useMemo(() => {
    const days = 84;
    const buckets: { date: Date; count: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const map = new Map<string, number>();
    annotations.forEach(a => {
      const d = new Date(a.created_at); d.setHours(0, 0, 0, 0);
      const k = d.toISOString().slice(0, 10);
      map.set(k, (map.get(k) || 0) + 1);
    });
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      buckets.push({ date: d, count: map.get(d.toISOString().slice(0, 10)) || 0 });
    }
    return buckets;
  }, [annotations]);

  // ── Selection ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filtered.map(a => a.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // ── Export ──
  const buildExport = (format: 'markdown' | 'json' | 'anki' | 'obsidian' | 'csv') => {
    const items = filtered;
    if (format === 'json') return { content: JSON.stringify(items, null, 2), mime: 'application/json', ext: 'json' };
    if (format === 'csv') {
      const rows = [['Book', 'Type', 'Chapter', 'Page', 'Tags', 'Sentiment', 'Favorite', 'Created', 'Content']];
      items.forEach(a => {
        const book = books.find(b => b.id === a.book_id);
        rows.push([
          book?.title || '', a.annotation_type, a.chapter || '', String(a.page_number || ''),
          (a.tags || []).join(';'), a.sentiment || '', a.is_favorite ? 'yes' : '',
          new Date(a.created_at).toISOString(),
          `"${a.content.replace(/"/g, '""')}"`,
        ]);
      });
      return { content: rows.map(r => r.join(',')).join('\n'), mime: 'text/csv', ext: 'csv' };
    }
    if (format === 'anki') {
      // Front \t Back \t Tags
      const lines = items.map(a => {
        const book = books.find(b => b.id === a.book_id);
        const front = `${book?.title || 'Book'}${a.chapter ? ` — ${a.chapter}` : ''}${a.page_number ? ` (p.${a.page_number})` : ''}`;
        const back = a.content.replace(/\t/g, ' ').replace(/\n/g, '<br>');
        const tags = ['bookvault', a.annotation_type, ...(a.tags || [])].join(' ');
        return `${front}\t${back}\t${tags}`;
      });
      return { content: lines.join('\n'), mime: 'text/tab-separated-values', ext: 'tsv' };
    }
    if (format === 'obsidian') {
      const grouped: Record<string, Annotation[]> = {};
      items.forEach(a => { (grouped[a.book_id] ||= []).push(a); });
      const out: string[] = [];
      Object.entries(grouped).forEach(([bid, anns]) => {
        const book = books.find(b => b.id === bid);
        out.push(`# ${book?.title || 'Unknown'}`);
        out.push(`> ${book?.authors?.join(', ') || ''}`);
        out.push('');
        anns.forEach(a => {
          out.push(`## ${ANNOTATION_TYPES.find(t => t.value === a.annotation_type)?.label} ${a.chapter ? `— ${a.chapter}` : ''} ${a.page_number ? `(p.${a.page_number})` : ''}`);
          out.push(a.content);
          if (a.tags?.length) out.push(`\n${a.tags.map(t => `#${t.replace(/\s+/g, '-')}`).join(' ')}`);
          out.push('\n---\n');
        });
      });
      return { content: out.join('\n'), mime: 'text/markdown', ext: 'md' };
    }
    // markdown default
    const md = items.map(a => {
      const book = books.find(b => b.id === a.book_id);
      const typeLabel = ANNOTATION_TYPES.find(t => t.value === a.annotation_type)?.label || a.annotation_type;
      const tagLine = a.tags?.length ? `\n*Tags:* ${a.tags.map(t => `\`${t}\``).join(' ')}` : '';
      return `## ${book?.title || 'Unknown'}\n**${typeLabel}**${a.chapter ? ` — Ch: ${a.chapter}` : ''}${a.page_number ? ` — p.${a.page_number}` : ''}${a.is_favorite ? ' ⭐' : ''}\n\n${a.content}${tagLine}\n\n---\n`;
    }).join('\n');
    return { content: md, mime: 'text/markdown', ext: 'md' };
  };

  const doExport = (format: 'markdown' | 'json' | 'anki' | 'obsidian' | 'csv') => {
    const { content, mime, ext } = buildExport(format);
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${format}-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  // ── AI synthesis ──
  const runSynthesis = async () => {
    const target = selectedIds.size > 0 ? annotations.filter(a => selectedIds.has(a.id)) : filtered;
    if (target.length === 0) return toast.error('No annotations to synthesize');
    if (target.length > 80) toast.message('Using first 80 annotations for synthesis');

    setSynthLoading(true);
    setSynthOutput('');
    setShowSynthPanel(true);

    try {
      const payload = target.slice(0, 80).map(a => ({
        annotation_type: a.annotation_type,
        content: a.content,
        chapter: a.chapter,
        page_number: a.page_number,
        book_title: books.find(b => b.id === a.book_id)?.title || 'Unknown',
      }));
      const URL_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-annotation-synthesis`;
      const resp = await fetch(URL_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ annotations: payload, mode: synthMode }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error('No stream');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let so = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') { buf = ''; break; }
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { so += c; setSynthOutput(so); }
          } catch { buf = line + '\n' + buf; break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Synthesis failed');
    } finally {
      setSynthLoading(false);
    }
  };

  const copySynth = () => {
    navigator.clipboard.writeText(synthOutput);
    toast.success('Copied');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const heatMax = Math.max(1, ...heatmap.map(h => h.count));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-secondary rounded-xl text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text-mixed">Annotations Studio</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {stats.total} annotations across {stats.books} books · {stats.tags} tags
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setSynthMode('synthesize'); runSynthesis(); }} disabled={annotations.length === 0}>
              <Sparkles className="w-4 h-4 mr-2" />AI Synthesize
            </Button>
            <div className="relative" ref={exportRef}>
              <Button variant="outline" onClick={() => setShowExportMenu(s => !s)} disabled={annotations.length === 0}>
                <Download className="w-4 h-4 mr-2" />Export <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    {(['markdown', 'json', 'csv', 'anki', 'obsidian'] as const).map(f => (
                      <button key={f} onClick={() => doExport(f)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors capitalize">
                        {f === 'anki' ? 'Anki (.tsv)' : f === 'obsidian' ? 'Obsidian (.md)' : `${f}`}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />New
            </Button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Notes', value: stats.notes },
            { label: 'Highlights', value: stats.highlights },
            { label: 'Quotes', value: stats.quotes },
            { label: 'Chapters', value: stats.chapters },
            { label: 'Favorites', value: stats.favorites },
            { label: 'Books', value: stats.books },
          ].map(s => (
            <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity heatmap */}
        {annotations.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CalIcon className="w-3 h-3" />Activity · last 12 weeks
              </p>
              <p className="text-xs text-muted-foreground">{heatmap.reduce((s, h) => s + h.count, 0)} entries</p>
            </div>
            <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, minmax(0,1fr))' }}>
              {heatmap.map((d, i) => {
                const intensity = d.count === 0 ? 0 : Math.min(1, 0.25 + 0.75 * (d.count / heatMax));
                return (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm border border-border/30"
                    style={{ backgroundColor: d.count === 0 ? 'hsl(var(--muted) / 0.3)' : `hsl(var(--primary) / ${intensity})` }}
                    title={`${d.date.toLocaleDateString()}: ${d.count}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Synth Panel ── */}
      <AnimatePresence>
        {showSynthPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden border border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 gradient-primary rounded-lg text-white">
                  <Brain className="w-4 h-4" />
                </div>
                <h3 className="font-bold">AI Synthesis</h3>
                {synthLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              <div className="flex items-center gap-2">
                {synthOutput && !synthLoading && (
                  <Button size="sm" variant="ghost" onClick={copySynth}><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</Button>
                )}
                <button onClick={() => setShowSynthPanel(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { v: 'synthesize' as SynthMode, l: 'Synthesize', i: Brain },
                { v: 'cluster' as SynthMode, l: 'Cluster', i: Network },
                { v: 'flashcards' as SynthMode, l: 'Flashcards', i: Wand2 },
                { v: 'essay' as SynthMode, l: 'Essay', i: FileText },
              ]).map(m => (
                <button
                  key={m.v}
                  onClick={() => { setSynthMode(m.v); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    synthMode === m.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground'
                  }`}
                >
                  <m.i className="w-3 h-3" />{m.l}
                </button>
              ))}
              <Button size="sm" onClick={runSynthesis} disabled={synthLoading} className="ml-auto gradient-primary text-white">
                {synthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 mr-1" />Run</>}
              </Button>
            </div>
            <div className="bg-muted/20 rounded-xl p-4 max-h-[420px] overflow-y-auto border border-border/40">
              {synthOutput ? renderMarkdown(synthOutput) : (
                <p className="text-sm text-muted-foreground italic">
                  {synthLoading ? 'Generating…' : 'Click Run to synthesize. Selection: ' + (selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} filtered`)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Form ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />New Annotation
            </h3>
            <div className="space-y-4">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground"
              >
                <option value="">Select a book...</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title} — {b.authors?.[0]}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {ANNOTATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => { setNewType(type.value); setNewColor(type.color); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      newType === type.value ? 'text-white shadow-lg' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                    }`}
                    style={newType === type.value ? { backgroundColor: type.color } : {}}
                  >
                    <type.icon className="w-4 h-4" />{type.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input type="text" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} placeholder="Chapter (optional)" className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground" />
                <input type="number" value={newPage} onChange={(e) => setNewPage(e.target.value)} placeholder="Page" className="w-32 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground" />
              </div>
              <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Tags, comma-separated (e.g. theme, hero's-journey, important)" className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground" />
              <div className="flex flex-wrap gap-2">
                {SENTIMENTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setNewSentiment(newSentiment === s.value ? '' : s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      newSentiment === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
              {newType === 'highlight' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={newType === 'quote' ? 'Enter the quote...' : 'Write your note...'}
                rows={4}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground resize-none"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={createAnnotation} disabled={!newContent.trim() || !selectedBook} className="gradient-primary text-white">
                  <Check className="w-4 h-4 mr-2" />Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ── */}
      {annotations.length > 0 && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content, tags, chapters..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground"
              />
            </div>
            <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
              {([
                { v: 'cards', i: LayoutGrid }, { v: 'compact', i: ListIcon },
                { v: 'timeline', i: CalIcon }, { v: 'graph', i: Network },
              ] as const).map(({ v, i: Icon }) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`p-2 rounded-lg transition-all ${viewMode === v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(s => !s)}>
              <Filter className="w-3.5 h-3.5 mr-1.5" />Filters
            </Button>
            <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground">
              <option value="recent">Sort: Recent</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="book">Sort: Book</option>
              <option value="page">Sort: Page</option>
              <option value="favorites">Sort: Favorites</option>
            </select>
          </div>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 lg:grid-cols-5 gap-2 overflow-hidden"
              >
                <select value={filterBook} onChange={e => setFilterBook(e.target.value)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground">
                  <option value="all">All Books</option>
                  {books.filter(b => annotations.some(a => a.book_id === b.id)).map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground">
                  <option value="all">All Types</option>
                  {ANNOTATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground" disabled={allTags.length === 0}>
                  <option value="all">All Tags</option>
                  {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground">
                  <option value="all">Any Sentiment</option>
                  {SENTIMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => setFilterFavorites(f => !f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${filterFavorites ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-muted/50 border border-border text-muted-foreground'}`}>
                  <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-current' : ''}`} />Favorites only
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection toolbar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-wrap items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl"
              >
                <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
                <Button size="sm" variant="ghost" onClick={selectAll}>Select all visible</Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => bulkFavorite(true)}><Star className="w-3.5 h-3.5 mr-1" />Favorite</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSynthMode('synthesize'); runSynthesis(); }}><Sparkles className="w-3.5 h-3.5 mr-1" />Synthesize</Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {annotations.length}
          </p>
        </div>
      )}

      {/* ── Annotations Display ── */}
      {filtered.length > 0 ? (
        viewMode === 'timeline' ? (
          <TimelineView items={filtered} books={books} selectedIds={selectedIds} toggleSelect={toggleSelect} onBookSelect={onBookSelect} />
        ) : viewMode === 'graph' ? (
          <GraphView items={filtered} books={books} allTags={allTags} onBookSelect={onBookSelect} />
        ) : (
          <div className={viewMode === 'compact' ? 'space-y-2' : 'space-y-3'}>
            {filtered.map((annotation, index) => {
              const book = books.find(b => b.id === annotation.book_id);
              const typeInfo = ANNOTATION_TYPES.find(t => t.value === annotation.annotation_type) || ANNOTATION_TYPES[0];
              const TypeIcon = typeInfo.icon;
              const isSelected = selectedIds.has(annotation.id);
              const compact = viewMode === 'compact';
              return (
                <motion.div
                  key={annotation.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  className={`glass-card rounded-xl ${compact ? 'p-3' : 'p-4'} group transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  style={{ borderLeft: `4px solid ${annotation.color}` }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox" checked={isSelected} onChange={() => toggleSelect(annotation.id)}
                      className="mt-1.5 w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`} style={{ backgroundColor: annotation.color + '20' }}>
                      <TypeIcon className="w-4 h-4" style={{ color: annotation.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {book && (
                          <button onClick={() => onBookSelect(book)} className="text-sm font-medium text-primary hover:underline line-clamp-1">{book.title}</button>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: annotation.color + '20', color: annotation.color }}>{typeInfo.label}</span>
                        {annotation.chapter && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />{annotation.chapter}</span>
                        )}
                        {annotation.page_number && <span className="text-xs text-muted-foreground">p.{annotation.page_number}</span>}
                        {annotation.sentiment && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">{SENTIMENTS.find(s => s.value === annotation.sentiment)?.label || annotation.sentiment}</span>
                        )}
                      </div>
                      {editingId === annotation.id ? (
                        <div className="flex gap-2 mt-2">
                          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none text-foreground" rows={3} />
                          <div className="flex flex-col gap-1">
                            <Button size="sm" onClick={() => updateAnnotation(annotation.id)} className="gradient-primary text-white"><Check className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed ${compact ? 'line-clamp-2' : ''} ${annotation.annotation_type === 'quote' ? 'italic border-l-2 border-muted pl-3' : ''}`}>
                          {annotation.annotation_type === 'quote' && '"'}{annotation.content}{annotation.annotation_type === 'quote' && '"'}
                        </p>
                      )}
                      {annotation.tags && annotation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {annotation.tags.map(t => (
                            <button key={t} onClick={() => setFilterTag(t)} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />{t}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => toggleFavorite(annotation.id, annotation.is_favorite)} className={`p-1.5 rounded-lg ${annotation.is_favorite ? 'text-warning bg-warning/10' : 'text-muted-foreground hover:text-warning hover:bg-warning/10'}`}>
                        <Star className={`w-4 h-4 ${annotation.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => { setEditingId(annotation.id); setEditContent(annotation.content); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteAnnotation(annotation.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : annotations.length > 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No annotations match your filters</p>
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FileText className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-3">No annotations yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Capture notes, highlights, quotes & chapter markers — then synthesize with AI.</p>
          <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />Add Your First Annotation
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Timeline view ──
const TimelineView = ({
  items, books, selectedIds, toggleSelect, onBookSelect,
}: {
  items: Annotation[]; books: Book[]; selectedIds: Set<string>; toggleSelect: (id: string) => void; onBookSelect: (b: Book) => void;
}) => {
  const groups = useMemo(() => {
    const m: Record<string, Annotation[]> = {};
    items.forEach(a => {
      const key = new Date(a.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      (m[key] ||= []).push(a);
    });
    return Object.entries(m);
  }, [items]);
  return (
    <div className="space-y-6">
      {groups.map(([month, anns]) => (
        <div key={month} className="relative pl-6 border-l-2 border-border">
          <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-primary" />
          <h4 className="font-semibold text-foreground mb-3 -mt-1">{month} <span className="text-xs text-muted-foreground font-normal">· {anns.length}</span></h4>
          <div className="space-y-2">
            {anns.map(a => {
              const book = books.find(b => b.id === a.book_id);
              const t = ANNOTATION_TYPES.find(x => x.value === a.annotation_type) || ANNOTATION_TYPES[0];
              return (
                <div key={a.id} className="glass-card rounded-lg p-3 flex gap-3 items-start" style={{ borderLeft: `3px solid ${a.color}` }}>
                  <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="mt-1 w-3.5 h-3.5 rounded accent-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {book && <button onClick={() => onBookSelect(book)} className="text-primary hover:underline truncate">{book.title}</button>}
                      <span>·</span><span>{t.label}</span>
                      <span className="ml-auto">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-3">{a.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Graph view (tag co-occurrence summary) ──
const GraphView = ({ items, books, allTags, onBookSelect }: { items: Annotation[]; books: Book[]; allTags: string[]; onBookSelect: (b: Book) => void }) => {
  const tagFreq = useMemo(() => {
    const m = new Map<string, { count: number; bookIds: Set<string> }>();
    items.forEach(a => a.tags?.forEach(t => {
      if (!m.has(t)) m.set(t, { count: 0, bookIds: new Set() });
      const e = m.get(t)!; e.count++; e.bookIds.add(a.book_id);
    }));
    return Array.from(m.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [items]);

  if (tagFreq.length === 0) {
    return (
      <div className="text-center py-12 glass-card rounded-2xl">
        <Network className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Add tags to your annotations to see the knowledge graph</p>
      </div>
    );
  }

  const maxCount = tagFreq[0][1].count;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Tag Knowledge Map</h3>
        <span className="text-xs text-muted-foreground ml-auto">{tagFreq.length} tags · {items.length} annotations</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {tagFreq.map(([tag, info]) => {
          const scale = 0.85 + (info.count / maxCount) * 0.6;
          const opacity = 0.4 + (info.count / maxCount) * 0.6;
          return (
            <div
              key={tag}
              className="rounded-full px-4 py-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors cursor-default"
              style={{ fontSize: `${scale}rem`, opacity }}
              title={`${info.count} annotations across ${info.bookIds.size} books`}
            >
              <span className="font-semibold text-primary">#{tag}</span>
              <span className="text-xs text-muted-foreground ml-2">×{info.count}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Books with most annotations</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(items.reduce((acc, a) => { acc[a.book_id] = (acc[a.book_id] || 0) + 1; return acc; }, {} as Record<string, number>))
            .sort(([, a], [, b]) => b - a).slice(0, 6).map(([bid, count]) => {
              const book = books.find(b => b.id === bid);
              if (!book) return null;
              return (
                <button key={bid} onClick={() => onBookSelect(book)} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors text-left">
                  <span className="text-sm font-medium truncate flex-1">{book.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary ml-2">{count}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};