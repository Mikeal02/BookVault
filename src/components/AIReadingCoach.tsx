import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Loader2, RefreshCw, Zap, Target, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIReadingCoachProps {
  books: Book[];
  userId?: string;
}

export const AIReadingCoach = ({ books, userId }: AIReadingCoachProps) => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setInsights('');

    try {
      // Fetch recent sessions
      let sessions: any[] = [];
      if (userId) {
        const { data } = await supabase
          .from('reading_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('session_date', { ascending: false })
          .limit(20);
        sessions = data || [];
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-reading-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            books: books.map(b => ({
              title: b.title,
              authors: b.authors,
              categories: b.categories,
              readingStatus: b.readingStatus,
              personalRating: b.personalRating,
              readingProgress: b.readingProgress,
              pageCount: b.pageCount,
              currentPage: b.currentPage,
              dateFinished: b.dateFinished,
              dateStarted: b.dateStarted,
              timeSpentReading: b.timeSpentReading,
            })),
            readingSessions: sessions,
          }),
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) { toast.error('Rate limited — try again in a moment'); setLoading(false); return; }
        if (resp.status === 402) { toast.error('AI usage limit reached'); setLoading(false); return; }
        throw new Error('Failed to get insights');
      }

      // Stream SSE
      const reader = resp.body!.getReader();
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
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setInsights(accumulated);
            }
          } catch {}
        }
      }

      setHasLoaded(true);
    } catch (err) {
      console.error('Reading coach error:', err);
      toast.error('Failed to get coaching insights');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll while streaming
  useEffect(() => {
    if (loading && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [insights, loading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Reading Coach
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized insights about your reading habits
          </p>
        </div>
        <Button
          onClick={fetchInsights}
          disabled={loading}
          className="gradient-primary text-primary-foreground rounded-xl press-depth"
          size="sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : hasLoaded ? (
            <><RefreshCw className="w-4 h-4 mr-2" /> Refresh</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Get Insights</>
          )}
        </Button>
      </div>

      {!hasLoaded && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="elite-card rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            Your Personal Reading Coach
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Get AI-powered insights about your reading patterns, personalized challenges, and smart recommendations based on your library.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6">
            {[
              { icon: TrendingUp, label: 'Pace Analysis' },
              { icon: Target, label: 'Weekly Goals' },
              { icon: BookOpen, label: 'Read Next' },
              { icon: Zap, label: 'Smart Tips' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <Button onClick={fetchInsights} className="gradient-primary text-primary-foreground rounded-xl shadow-lg press-depth px-8">
            <Sparkles className="w-4 h-4 mr-2" /> Analyze My Reading
          </Button>
        </motion.div>
      )}

      {(loading || hasLoaded) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="elite-card rounded-2xl overflow-hidden"
        >
          <div className="h-[2px] bg-gradient-to-r from-primary via-secondary to-primary" />
          <div ref={contentRef} className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto ai-response">
            {insights ? (
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(insights) }} />
            ) : loading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Analyzing your reading patterns...</span>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Simple markdown to HTML
function formatMarkdown(md: string): string {
  return md
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<ul><\/p><p>/g, '<ul>')
    .replace(/<\/ul><\/p><p>/g, '</ul><p>');
}
