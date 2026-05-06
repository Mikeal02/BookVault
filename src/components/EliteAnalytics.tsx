import { useMemo, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, TrendingUp, Target, Sparkles, Calendar, Clock, BarChart3, Users,
  ChevronDown, ChevronUp, Download, Layers, Zap, Award, BookOpen, Loader2, ArrowUp, ArrowDown,
  Globe, Flame, Brain, Library,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ZAxis,
  RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis, Radar, RadarChart, PolarRadiusAxis,
  ReferenceLine, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface EliteAnalyticsProps {
  books: Book[];
  currentUser: string;
  readingGoal?: number;
}

type TimeRange = '30d' | '90d' | '6m' | '1y' | 'all';
type Tab = 'overview' | 'velocity' | 'genres' | 'patterns' | 'forecast' | 'compare';

interface Session {
  session_date: string;
  duration_minutes: number;
  pages_read: number | null;
  book_id: string;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 24px hsl(var(--background)/0.5)',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

const linReg = (xs: number[], ys: number[]) => {
  const n = xs.length; if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
  const sx = xs.reduce((s, v) => s + v, 0);
  const sy = ys.reduce((s, v) => s + v, 0);
  const sxy = xs.reduce((s, v, i) => s + v * ys[i], 0);
  const sxx = xs.reduce((s, v) => s + v * v, 0);
  const slope = (n * sxy - sx * sy) / Math.max(1, (n * sxx - sx * sx));
  return { slope, intercept: (sy - slope * sx) / n };
};

const renderMd = (text: string): JSX.Element => {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((l, i) => {
        if (l.startsWith('## ')) return <h3 key={i} className="text-lg font-bold mt-3">{l.slice(3)}</h3>;
        if (l.startsWith('- ') || l.startsWith('* ')) return <div key={i} className="pl-4 text-muted-foreground">• {fmt(l.slice(2))}</div>;
        if (l.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{fmt(l)}</p>;
      })}
    </div>
  );
};
const fmt = (t: string) => {
  const parts: (string | JSX.Element)[] = [];
  let r = t; let k = 0;
  while (r.length) {
    const m = r.match(/\*\*(.+?)\*\*/);
    if (!m) { parts.push(r); break; }
    if (m.index! > 0) parts.push(r.slice(0, m.index));
    parts.push(<strong key={k++} className="text-foreground font-semibold">{m[1]}</strong>);
    r = r.slice(m.index! + m[0].length);
  }
  return <>{parts}</>;
};

export const EliteAnalytics = ({ books, currentUser, readingGoal = 12 }: EliteAnalyticsProps) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<TimeRange>('1y');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('reading_sessions').select('session_date,duration_minutes,pages_read,book_id')
          .eq('user_id', user.id).order('session_date', { ascending: false }).limit(2000);
        setSessions((data || []) as Session[]);
      } finally { setLoadingSessions(false); }
    })();
  }, []);

  // ── Range filter cutoff ──
  const cutoff = useMemo(() => {
    const d = new Date();
    if (range === '30d') d.setDate(d.getDate() - 30);
    else if (range === '90d') d.setDate(d.getDate() - 90);
    else if (range === '6m') d.setMonth(d.getMonth() - 6);
    else if (range === '1y') d.setFullYear(d.getFullYear() - 1);
    else d.setFullYear(d.getFullYear() - 100);
    return d;
  }, [range]);

  const finished = useMemo(() => books.filter(b => b.readingStatus === 'finished'), [books]);
  const reading = useMemo(() => books.filter(b => b.readingStatus === 'reading'), [books]);

  // ── Velocity (rolling 7-day pages/min per day) ──
  const dailySeries = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(cutoff); start.setHours(0, 0, 0, 0);
    const days: { date: string; pages: number; minutes: number; sessions: number; ts: number }[] = [];
    const map = new Map<string, { pages: number; minutes: number; sessions: number }>();
    sessions.forEach(s => {
      const d = new Date(s.session_date); if (d < start) return;
      const k = d.toISOString().slice(0, 10);
      const e = map.get(k) || { pages: 0, minutes: 0, sessions: 0 };
      e.pages += s.pages_read || 0; e.minutes += s.duration_minutes || 0; e.sessions += 1;
      map.set(k, e);
    });
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      const e = map.get(k) || { pages: 0, minutes: 0, sessions: 0 };
      days.push({ date: k, ...e, ts: d.getTime() });
    }
    // 7-day rolling
    return days.map((d, i) => {
      const w = days.slice(Math.max(0, i - 6), i + 1);
      const avgPages = w.reduce((s, x) => s + x.pages, 0) / w.length;
      const avgMinutes = w.reduce((s, x) => s + x.minutes, 0) / w.length;
      return { ...d, displayDate: d.date.slice(5), rollingPages: Math.round(avgPages * 10) / 10, rollingMinutes: Math.round(avgMinutes) };
    });
  }, [sessions, cutoff]);

  // ── Forecast (linear regression of cumulative pages) ──
  const forecast = useMemo(() => {
    if (dailySeries.length < 7) return null;
    let cum = 0;
    const xs: number[] = []; const ys: number[] = [];
    const cumulative = dailySeries.map((d, i) => {
      cum += d.pages;
      xs.push(i); ys.push(cum);
      return { displayDate: d.displayDate, actual: cum, forecast: null as number | null, ts: d.ts };
    });
    const { slope, intercept } = linReg(xs, ys);
    // Project 30 more days
    const result = [...cumulative];
    const last = dailySeries[dailySeries.length - 1];
    for (let i = 1; i <= 30; i++) {
      const t = last.ts + i * 24 * 3600 * 1000;
      const d = new Date(t);
      result.push({
        displayDate: d.toISOString().slice(5, 10),
        actual: null as any,
        forecast: Math.max(0, slope * (xs.length - 1 + i) + intercept),
        ts: t,
      });
    }
    // Fill forecast from current point
    result[xs.length - 1].forecast = cum;
    return { points: result, slope, projection30d: Math.round(slope * 30) };
  }, [dailySeries]);

  // ── Year-end goal projection ──
  const yearEndProjection = useMemo(() => {
    const yr = new Date().getFullYear();
    const startYr = new Date(yr, 0, 1);
    const today = new Date();
    const daysIn = Math.floor((today.getTime() - startYr.getTime()) / (24 * 3600 * 1000)) + 1;
    const daysLeft = Math.max(1, 365 - daysIn);
    const finishedYr = finished.filter(b => b.dateFinished && new Date(b.dateFinished).getFullYear() === yr);
    const rate = finishedYr.length / Math.max(1, daysIn);
    const projected = Math.round(rate * 365);
    const pace = projected >= readingGoal ? 'on-track' : 'behind';
    const needed = Math.max(0, readingGoal - finishedYr.length);
    const daysPerNeeded = needed > 0 ? Math.floor(daysLeft / needed) : 0;
    return { finishedYr: finishedYr.length, projected, pace, daysLeft, needed, daysPerNeeded };
  }, [finished, readingGoal]);

  // ── Genre evolution by year ──
  const genreEvolution = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    const allGenres = new Set<string>();
    finished.forEach(b => {
      if (!b.dateFinished) return;
      const y = new Date(b.dateFinished).getFullYear();
      byYear[y] = byYear[y] || {};
      b.categories?.forEach(c => {
        const key = c.split(' / ')[0]; // top genre
        allGenres.add(key);
        byYear[y][key] = (byYear[y][key] || 0) + 1;
      });
    });
    const years = Object.keys(byYear).map(Number).sort();
    const topGenres = Array.from(new Set(
      Object.values(byYear).flatMap(g => Object.entries(g).sort(([, a], [, b]) => b - a).slice(0, 5).map(([k]) => k))
    )).slice(0, 6);
    const data = years.map(y => {
      const row: any = { year: y };
      topGenres.forEach(g => row[g] = byYear[y][g] || 0);
      return row;
    });
    return { data, genres: topGenres };
  }, [finished]);

  // ── Day-of-week + hour-of-day heatmap ──
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    sessions.forEach(s => {
      const d = new Date(s.session_date);
      grid[d.getDay()][d.getHours()] += s.duration_minutes || 0;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [sessions]);

  // ── Author diversity ──
  const diversity = useMemo(() => {
    const authorCount = new Map<string, number>();
    finished.forEach(b => b.authors?.forEach(a => authorCount.set(a, (authorCount.get(a) || 0) + 1)));
    const totalAuthors = authorCount.size;
    const repeatAuthors = Array.from(authorCount.values()).filter(c => c > 1).length;
    const top = Array.from(authorCount.entries()).sort(([, a], [, b]) => b - a).slice(0, 5);
    const langSet = new Set(books.map(b => b.language).filter(Boolean));
    return { totalAuthors, repeatAuthors, topAuthors: top, languages: langSet.size };
  }, [finished, books]);

  // ── Year-over-year ──
  const yoy = useMemo(() => {
    const yr = new Date().getFullYear();
    const counts: Record<number, { books: number; pages: number }> = {};
    finished.forEach(b => {
      if (!b.dateFinished) return;
      const y = new Date(b.dateFinished).getFullYear();
      counts[y] = counts[y] || { books: 0, pages: 0 };
      counts[y].books += 1;
      counts[y].pages += b.pageCount || 0;
    });
    const years = Object.keys(counts).map(Number).sort();
    const data = years.map(y => ({ year: y, books: counts[y].books, pages: counts[y].pages }));
    const cur = counts[yr]?.books || 0;
    const prev = counts[yr - 1]?.books || 0;
    const delta = prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
    return { data, currentYear: cur, prevYear: prev, deltaPct: delta };
  }, [finished]);

  // ── Page distribution ──
  const pageDist = useMemo(() => {
    const buckets = [
      { range: '0-150', min: 0, max: 150, count: 0 },
      { range: '150-300', min: 150, max: 300, count: 0 },
      { range: '300-450', min: 300, max: 450, count: 0 },
      { range: '450-600', min: 450, max: 600, count: 0 },
      { range: '600+', min: 600, max: Infinity, count: 0 },
    ];
    finished.forEach(b => {
      const p = b.pageCount || 0;
      const bucket = buckets.find(x => p >= x.min && p < x.max);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [finished]);

  // ── Rating distribution ──
  const ratingDist = useMemo(() => {
    const r = [0, 0, 0, 0, 0];
    books.forEach(b => { if (b.personalRating && b.personalRating >= 1 && b.personalRating <= 5) r[b.personalRating - 1]++; });
    return r.map((count, i) => ({ stars: i + 1, count }));
  }, [books]);

  // ── Reading consistency (Gini-like) ──
  const consistency = useMemo(() => {
    if (dailySeries.length === 0) return { score: 0, activeDays: 0, totalDays: 0 };
    const activeDays = dailySeries.filter(d => d.minutes > 0).length;
    const score = Math.round((activeDays / dailySeries.length) * 100);
    return { score, activeDays, totalDays: dailySeries.length };
  }, [dailySeries]);

  // ── AI narrative insights ──
  const generateAiInsight = async () => {
    setAiLoading(true); setAiInsight(''); setShowAi(true);
    try {
      const ctx = {
        totalBooks: books.length,
        finishedThisYear: yearEndProjection.finishedYr,
        projectedYearEnd: yearEndProjection.projected,
        goal: readingGoal,
        consistency: consistency.score,
        activeDays: consistency.activeDays,
        totalDays: consistency.totalDays,
        topGenres: genreEvolution.genres.slice(0, 3),
        topAuthors: diversity.topAuthors.slice(0, 3).map(([a]) => a),
        rollingPagesPerDay: dailySeries[dailySeries.length - 1]?.rollingPages || 0,
        currentlyReading: reading.length,
        languagesRead: diversity.languages,
        slopePages: forecast?.slope ? Math.round(forecast.slope * 10) / 10 : 0,
      };
      const URL_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-book-chat`;
      const resp = await fetch(URL_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Analyze these reading metrics and produce a concise narrative insight (300 words max) in markdown with sections ## Snapshot, ## Strengths, ## Watch-outs, ## Next Move. Metrics: ${JSON.stringify(ctx)}` }],
          systemPrompt: 'You are an elite reading analytics coach. Be specific, concrete, and motivating. Use markdown.',
          mode: 'analyze',
        }),
      });
      if (!resp.ok || !resp.body) throw new Error('AI unavailable');
      const reader = resp.body.getReader(); const dec = new TextDecoder();
      let buf = ''; let so = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim(); if (j === '[DONE]') { buf = ''; break; }
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { so += c; setAiInsight(so); }
          } catch { buf = line + '\n' + buf; break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'AI insights failed');
    } finally { setAiLoading(false); }
  };

  // ── Export CSV ──
  const exportCsv = () => {
    const rows = [['date', 'pages', 'minutes', 'sessions', 'rolling_pages_7d', 'rolling_minutes_7d']];
    dailySeries.forEach(d => rows.push([d.date, String(d.pages), String(d.minutes), String(d.sessions), String(d.rollingPages), String(d.rollingMinutes)]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `reading-analytics-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported analytics CSV');
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-primary rounded-xl text-white shadow-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text-mixed">Elite Analytics</h2>
              <p className="text-muted-foreground text-sm mt-1">Forecasts · evolution · patterns · AI narrative</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={range} onChange={e => setRange(e.target.value as TimeRange)} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground">
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
            <button onClick={exportCsv} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground hover:bg-muted flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />CSV
            </button>
            <button onClick={generateAiInsight} disabled={aiLoading} className="px-3 py-2 gradient-primary text-white rounded-lg text-sm flex items-center gap-1.5 shadow-lg disabled:opacity-50">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}AI Insight
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 overflow-x-auto pb-1">
          {([
            { v: 'overview', l: 'Overview', i: Activity },
            { v: 'velocity', l: 'Velocity', i: Zap },
            { v: 'genres', l: 'Genre Evolution', i: Layers },
            { v: 'patterns', l: 'Patterns', i: Calendar },
            { v: 'forecast', l: 'Forecast', i: TrendingUp },
            { v: 'compare', l: 'YoY Compare', i: BarChart3 },
          ] as const).map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              <t.i className="w-3.5 h-3.5" />{t.l}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insight panel */}
      <AnimatePresence>
        {showAi && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 gradient-primary rounded-lg text-white"><Brain className="w-4 h-4" /></div>
                <h3 className="font-bold">AI Reading Narrative</h3>
                {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              <button onClick={() => setShowAi(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-muted/20 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              {aiInsight ? renderMd(aiInsight) : <p className="text-sm text-muted-foreground italic">Generating personalized insights...</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab Content ── */}
      {tab === 'overview' && (
        <OverviewTab
          books={books} finished={finished} reading={reading} yearEndProjection={yearEndProjection}
          consistency={consistency} diversity={diversity} pageDist={pageDist} ratingDist={ratingDist}
          dailySeries={dailySeries} loadingSessions={loadingSessions}
        />
      )}
      {tab === 'velocity' && (
        <VelocityTab dailySeries={dailySeries} loadingSessions={loadingSessions} consistency={consistency} />
      )}
      {tab === 'genres' && (
        <GenreEvolutionTab data={genreEvolution.data} genres={genreEvolution.genres} books={books} />
      )}
      {tab === 'patterns' && (
        <PatternsTab heatmap={heatmap} dayLabels={dayLabels} sessions={sessions} />
      )}
      {tab === 'forecast' && (
        <ForecastTab forecast={forecast} yearEndProjection={yearEndProjection} readingGoal={readingGoal} />
      )}
      {tab === 'compare' && (
        <CompareTab yoy={yoy} />
      )}
    </div>
  );
};

// ──────────────────── TABS ────────────────────

const KPI = ({ icon: Icon, label, value, sub, accent = 'primary', trend }: any) => (
  <div className="glass-card rounded-2xl p-5 hover-lift relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${accent}/10 rounded-full blur-2xl pointer-events-none`} />
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 bg-${accent}/15 rounded-xl`}>
        <Icon className={`w-4 h-4 text-${accent}`} />
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-xs flex items-center gap-1 font-semibold ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-black tabular-nums">{value}</p>
    <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground/70 mt-1">{sub}</p>}
  </div>
);

const OverviewTab = ({ books, finished, reading, yearEndProjection, consistency, diversity, pageDist, ratingDist, dailySeries, loadingSessions }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={BookOpen} label="Total Books" value={books.length} sub={`${finished.length} finished`} accent="primary" />
        <KPI icon={Target} label="Year Projection" value={yearEndProjection.projected} sub={`Goal ${yearEndProjection.finishedYr}/${yearEndProjection.finishedYr + (yearEndProjection.projected - yearEndProjection.finishedYr)}`} accent={yearEndProjection.pace === 'on-track' ? 'success' : 'warning'} />
        <KPI icon={Activity} label="Consistency" value={`${consistency.score}%`} sub={`${consistency.activeDays}/${consistency.totalDays} active days`} accent="secondary" />
        <KPI icon={Globe} label="Author Diversity" value={diversity.totalAuthors} sub={`${diversity.languages} languages`} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Daily Reading Pulse</h3>
          {loadingSessions ? <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="rollingMinutes" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} name="7-day avg minutes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-warning" />Rating Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="stars" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="hsl(var(--warning))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Library className="w-4 h-4 text-primary" />Page Length Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-secondary" />Top Authors</h3>
          {diversity.topAuthors.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No authors recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {diversity.topAuthors.map(([author, count]: [string, number], i: number) => {
                const pct = (count / diversity.topAuthors[0][1]) * 100;
                return (
                  <div key={author}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{author}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{diversity.repeatAuthors}</span> authors with multiple books · <span className="font-semibold text-foreground">{diversity.languages}</span> languages
          </div>
        </div>
      </div>
    </div>
  );
};

const VelocityTab = ({ dailySeries, loadingSessions, consistency }: any) => {
  const totalMin = dailySeries.reduce((s: number, d: any) => s + d.minutes, 0);
  const totalPages = dailySeries.reduce((s: number, d: any) => s + d.pages, 0);
  const peakDay = dailySeries.reduce((p: any, d: any) => d.minutes > (p?.minutes || 0) ? d : p, null);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Clock} label="Total Time" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} accent="primary" />
        <KPI icon={BookOpen} label="Total Pages" value={totalPages} accent="secondary" />
        <KPI icon={Flame} label="Peak Day" value={peakDay ? `${peakDay.minutes}m` : '—'} sub={peakDay?.date} accent="warning" />
        <KPI icon={Activity} label="Consistency" value={`${consistency.score}%`} accent="success" />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Reading Velocity (7-Day Rolling Average)</h3>
        {loadingSessions ? <div className="h-80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="rollingMinutes" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Minutes (7-day avg)" />
                <Line yAxisId="right" type="monotone" dataKey="rollingPages" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={false} name="Pages (7-day avg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Sessions Scatter (effort vs. output)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" dataKey="minutes" name="Minutes" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="number" dataKey="pages" name="Pages" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <ZAxis type="number" range={[60, 60]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={dailySeries.filter((d: any) => d.minutes > 0)} fill="hsl(var(--primary))" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const GenreEvolutionTab = ({ data, genres, books }: any) => {
  const genreData = useMemo(() => {
    const m: Record<string, number> = {};
    books.forEach((b: Book) => b.categories?.forEach(c => {
      const k = c.split(' / ')[0]; m[k] = (m[k] || 0) + 1;
    }));
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 8).map(([g, c]) => ({ genre: g, count: c, fullMark: Math.max(...Object.values(m)) }));
  }, [books]);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Genre Evolution by Year</h3>
        {data.length === 0 ? <p className="text-sm text-muted-foreground italic">Mark books as finished with dates to see evolution.</p> : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [v, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {genres.map((g: string, i: number) => (
                  <Area key={g} type="monotone" dataKey={g} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Genre Reach Radar</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={genreData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="genre" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Radar dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const PatternsTab = ({ heatmap, dayLabels, sessions }: any) => {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />When You Read (Day × Hour heatmap)</h3>
        {sessions.length === 0 ? <p className="text-sm text-muted-foreground italic">No reading sessions yet.</p> : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="flex gap-1 mb-1 ml-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-[9px] text-center text-muted-foreground">{h % 3 === 0 ? `${h}` : ''}</div>
                ))}
              </div>
              {heatmap.grid.map((row: number[], di: number) => (
                <div key={di} className="flex items-center gap-1 mb-1">
                  <div className="w-9 text-[10px] text-muted-foreground">{dayLabels[di]}</div>
                  {row.map((v, hi) => {
                    const intensity = v === 0 ? 0 : Math.min(1, 0.2 + 0.8 * (v / heatmap.max));
                    return (
                      <div key={hi} className="flex-1 aspect-square rounded-sm border border-border/30"
                        style={{ backgroundColor: v === 0 ? 'hsl(var(--muted)/0.3)' : `hsl(var(--primary)/${intensity})` }}
                        title={`${dayLabels[di]} ${hi}:00 — ${v} min`} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map(o => (
            <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(var(--primary)/${o})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

const ForecastTab = ({ forecast, yearEndProjection, readingGoal }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Target} label="Annual Goal" value={readingGoal} accent="primary" />
        <KPI icon={BookOpen} label="Finished YTD" value={yearEndProjection.finishedYr} accent="success" />
        <KPI icon={TrendingUp} label="Year Projection" value={yearEndProjection.projected} sub={yearEndProjection.pace === 'on-track' ? 'On track ✓' : 'Behind pace'} accent={yearEndProjection.pace === 'on-track' ? 'success' : 'warning'} />
        <KPI icon={Calendar} label="Days Until 1 Book" value={yearEndProjection.daysPerNeeded || '—'} sub={`${yearEndProjection.needed} books to goal`} accent="secondary" />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Cumulative Pages — 30-Day Forecast</h3>
        {!forecast ? <p className="text-sm text-muted-foreground italic">Need at least 7 days of session data for forecasting.</p> : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.points}>
                <defs>
                  <linearGradient id="actualG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#actualG)" name="Actual" />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--secondary))" strokeDasharray="6 4" strokeWidth={2.5} fill="url(#forecastG)" name="Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {forecast && (
          <p className="text-xs text-muted-foreground mt-3">
            Trajectory: <span className="text-foreground font-semibold">~{Math.round(forecast.slope * 7)} pages/week</span> · 30-day projection: <span className="text-foreground font-semibold">+{forecast.projection30d} pages</span>
          </p>
        )}
      </div>
    </div>
  );
};

const CompareTab = ({ yoy }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KPI icon={BookOpen} label={`This Year (${new Date().getFullYear()})`} value={yoy.currentYear} accent="primary" trend={yoy.deltaPct} />
        <KPI icon={Calendar} label={`Last Year (${new Date().getFullYear() - 1})`} value={yoy.prevYear} accent="secondary" />
        <KPI icon={TrendingUp} label="Year-over-Year Change" value={`${yoy.deltaPct >= 0 ? '+' : ''}${yoy.deltaPct}%`} accent={yoy.deltaPct >= 0 ? 'success' : 'warning'} />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Books Finished by Year</h3>
        {yoy.data.length === 0 ? <p className="text-sm text-muted-foreground italic">No finished books with dates yet.</p> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoy.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="books" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Pages Read by Year</h3>
        {yoy.data.length === 0 ? <p className="text-sm text-muted-foreground italic">—</p> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yoy.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="pages" stroke="hsl(var(--secondary))" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};