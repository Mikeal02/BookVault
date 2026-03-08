import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Link2, CalendarCheck, X, Loader2, BookOpen, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { toast } from 'sonner';

interface AIBookInsightsProps {
  book: Book;
  userBooks: Book[];
  onClose: () => void;
}

type InsightType = 'insights' | 'connections' | 'reading-plan';

const insightOptions: { type: InsightType; label: string; icon: typeof Brain; description: string }[] = [
  { type: 'insights', label: 'Deep Analysis', icon: Brain, description: 'Themes, significance & tips' },
  { type: 'connections', label: 'Book Connections', icon: Link2, description: 'Links to your library' },
  { type: 'reading-plan', label: 'Reading Plan', icon: CalendarCheck, description: 'Personalized schedule' },
];

export const AIBookInsights = ({ book, userBooks, onClose }: AIBookInsightsProps) => {
  const [activeType, setActiveType] = useState<InsightType | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [content]);

  const fetchInsight = useCallback(async (type: InsightType) => {
    setActiveType(type);
    setContent('');
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-book-insights`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          book: { title: book.title, authors: book.authors, description: book.description, categories: book.categories, pageCount: book.pageCount },
          type,
          userBooks: userBooks.slice(0, 20).map(b => ({ title: b.title, authors: b.authors, categories: b.categories })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error('Rate limit reached. Please try again in a moment.');
        if (resp.status === 402) throw new Error('AI credits exhausted. Please add credits in Settings.');
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch { /* partial JSON */ }
        }
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
      setLoading(false);
    }
  }, [book, userBooks]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary z-10" />

        {/* Header */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-mixed flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Book Insights</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{book.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {content && (
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Insight Type Selector */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-2">
            {insightOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => fetchInsight(opt.type)}
                disabled={loading}
                className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                  activeType === opt.type
                    ? 'border-primary/30 bg-primary/10 shadow-sm'
                    : 'border-border hover:border-primary/20 hover:bg-muted/50'
                } disabled:opacity-50`}
              >
                <opt.icon className={`w-4 h-4 mb-1.5 ${activeType === opt.type ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-5 min-h-[200px]">
          {!activeType && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
              </motion.div>
              <p className="text-muted-foreground text-sm">Select an insight type above to get AI-powered analysis</p>
            </div>
          )}

          {loading && !content && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <span className="text-muted-foreground text-sm">Analyzing {book.title}...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-destructive text-sm mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => activeType && fetchInsight(activeType)}>
                Try Again
              </Button>
            </div>
          )}

          {content && (
            <motion.div
              className="ai-response prose prose-sm max-w-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          )}

          {loading && content && (
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 gradient-text-mixed" style="display:inline-block">$1</h2><br/>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="text-sm ml-4 list-none flex items-center gap-2"><span class="text-success">✓</span> <span class="line-through text-muted-foreground">$1</span></li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="text-sm ml-4 list-none flex items-center gap-2"><span class="text-muted-foreground">○</span> $1</li>')
    .replace(/^- (.+)$/gm, '<li class="text-sm ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-sm ml-4 list-decimal">$1. $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
