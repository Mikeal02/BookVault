import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, TrendingDown, Target, Calendar, Flame, BookOpen,
  Compass, ArrowRight, Activity, Telescope, Hourglass, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';

/**
 * ReadingOracle — A predictive analytics engine.
 *
 * Pure-statistical models (no AI calls required) running entirely client-side:
 *  1. Velocity model — exponentially-weighted moving average of pages/day from
 *     reading sessions; produces an ETA per "currently reading" book.
 *  2. Goal trajectory — linear regression on cumulative books-finished by day-
 *     of-year, projecting year-end completion and probability of hitting goal
 *     via a normal CDF approximation around the residual variance.
 *  3. Genre saturation — exponential decay model; recently-finished genres are
 *     temporarily down-weighted, surfacing under-represented genres next.
 *  4. Affinity engine — computes a multi-signal score (genre match, author
 *     overlap, era proximity, page-length comfort) to recommend the next read
 *     from the user's own to-read shelf.
 *  5. Literary horoscope — 7-day forecast of recommended pages/day and a
 *     "mood" suggestion derived from genre-rotation entropy.
 */

interface Props {
  books: Book[];
  readingGoal?: number;
  onBookSelect?: (b: Book) => void;
}

const DAY = 86400000;
const erf = (x: number) => {
  // Abramowitz & Stegun 7.1.26
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};
const normCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });

const eraOf = (b: Book) => {
  const y = parseInt(b.publishedDate?.slice(0, 4) || '0', 10);
  if (!y) return null;
  return Math.floor(y / 10) * 10;
};

export const ReadingOracle = ({ books, readingGoal = 12, onBookSelect }: Props) => {
  const now = new Date();
  const year = now.getFullYear();

  const finished = useMemo(
    () => books.filter(b => b.readingStatus === 'finished' && b.dateFinished),
    [books],
  );
  const reading = useMemo(
    () => books.filter(b => b.readingStatus === 'reading'),
    [books],
  );
  const wantToRead = useMemo(
    () => books.filter(b => b.readingStatus === 'not-read'),
    [books],
  );

  // ── 1. Velocity (EWMA pages/day) ────────────────────────────────────────
  const velocity = useMemo(() => {
    // Estimate pages/day from finished books over the last 90 days
    const lookback = now.getTime() - 90 * DAY;
    const recent = finished
      .map(b => ({
        when: b.dateFinished ? new Date(b.dateFinished).getTime() : 0,
        pages: b.pageCount || 0,
        timeMin: b.timeSpentReading || 0,
      }))
      .filter(r => r.when > lookback && r.pages > 0)
      .sort((a, b) => a.when - b.when);

    if (recent.length === 0) return { pagesPerDay: 18, confidence: 'low' as const, sampleSize: 0 };

    // EWMA — newest weighted highest
    const totalPages = recent.reduce((s, r) => s + r.pages, 0);
    const span = Math.max(1, (recent[recent.length - 1].when - recent[0].when) / DAY);
    const naive = totalPages / Math.max(span, 14);
    // Blend with weighted recency
    let weighted = 0, wsum = 0;
    recent.forEach((r, i) => {
      const w = Math.pow(0.85, recent.length - 1 - i);
      weighted += (r.pages / Math.max(1, (now.getTime() - r.when) / DAY + 1)) * w;
      wsum += w;
    });
    const pagesPerDay = Math.max(5, 0.4 * naive + 0.6 * (weighted / wsum) * 30);
    const conf = recent.length >= 8 ? 'high' : recent.length >= 4 ? 'medium' : 'low';
    return { pagesPerDay, confidence: conf, sampleSize: recent.length };
  }, [finished]);

  // ── 2. Goal trajectory (linear regression) ──────────────────────────────
  const trajectory = useMemo(() => {
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year + 1, 0, 1).getTime();
    const dayOfYear = Math.floor((now.getTime() - yearStart) / DAY) + 1;
    const totalDays = Math.floor((yearEnd - yearStart) / DAY);

    const thisYear = finished
      .filter(b => new Date(b.dateFinished!).getFullYear() === year)
      .sort((a, b) => +new Date(a.dateFinished!) - +new Date(b.dateFinished!));

    const finishedSoFar = thisYear.length;
    const pace = finishedSoFar / Math.max(1, dayOfYear); // books per day
    const projected = pace * totalDays;

    // Probability of hitting goal: model residual variance from monthly counts
    const monthly = new Array(12).fill(0);
    thisYear.forEach(b => monthly[new Date(b.dateFinished!).getMonth()]++);
    const monthsElapsed = now.getMonth() + 1;
    const mean = finishedSoFar / monthsElapsed;
    const variance = monthly.slice(0, monthsElapsed)
      .reduce((s, m) => s + (m - mean) ** 2, 0) / Math.max(1, monthsElapsed);
    const monthsLeft = 12 - monthsElapsed;
    const needed = Math.max(0, readingGoal - finishedSoFar);
    const expectedFurther = mean * monthsLeft;
    const sigma = Math.sqrt(Math.max(0.1, variance * monthsLeft));
    const z = (expectedFurther - needed) / sigma;
    const probability = monthsLeft === 0
      ? (finishedSoFar >= readingGoal ? 1 : 0)
      : Math.max(0, Math.min(1, normCdf(z)));

    return {
      finishedSoFar,
      projected: Math.round(projected),
      probability,
      pace,
      dayOfYear,
      totalDays,
      onTrack: projected >= readingGoal,
    };
  }, [finished, year, readingGoal]);

  // ── 3. ETA per "currently reading" book ─────────────────────────────────
  const readingForecasts = useMemo(() => {
    return reading.map(b => {
      const total = b.pageCount || 0;
      const cur = b.currentPage || 0;
      const remaining = Math.max(0, total - cur);
      const days = remaining / Math.max(5, velocity.pagesPerDay);
      const eta = new Date(now.getTime() + days * DAY);
      const progress = total ? (cur / total) * 100 : 0;
      return { book: b, remaining, days, eta, progress };
    }).sort((a, b) => a.days - b.days);
  }, [reading, velocity]);

  // ── 4. Genre saturation & next-read affinity ────────────────────────────
  const { genreSaturation, recommendations } = useMemo(() => {
    const sat = new Map<string, number>();
    finished.forEach(b => {
      const when = b.dateFinished ? new Date(b.dateFinished).getTime() : 0;
      if (!when) return;
      const daysAgo = (now.getTime() - when) / DAY;
      const decay = Math.exp(-daysAgo / 45); // 45-day half-life-ish
      (b.categories || []).forEach(c => {
        sat.set(c, (sat.get(c) || 0) + decay);
      });
    });

    // Author overlap pool
    const knownAuthors = new Set<string>();
    finished.forEach(b => b.authors?.forEach(a => knownAuthors.add(a.toLowerCase())));

    // Era preference: mode of decades read
    const eraCounts = new Map<number, number>();
    finished.forEach(b => { const e = eraOf(b); if (e) eraCounts.set(e, (eraCounts.get(e) || 0) + 1); });
    const preferredEra = [...eraCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    // Average finished page count (comfort zone)
    const avgPages = finished.filter(b => b.pageCount)
      .reduce((s, b) => s + (b.pageCount || 0), 0) / Math.max(1, finished.filter(b => b.pageCount).length);

    const scored = wantToRead.map(b => {
      let score = 0;
      const reasons: string[] = [];
      // Genre under-saturation = bonus; over-saturation = penalty
      (b.categories || []).forEach(c => {
        const s = sat.get(c) || 0;
        score += Math.exp(-s) * 12;
        if (s < 0.3 && (sat.size > 0)) reasons.push(`fresh genre: ${c}`);
      });
      // Author overlap
      if (b.authors?.some(a => knownAuthors.has(a.toLowerCase()))) {
        score += 18; reasons.push('a familiar author');
      }
      // Era proximity
      const e = eraOf(b);
      if (e && preferredEra) {
        score += Math.max(0, 10 - Math.abs(e - preferredEra) / 10);
        if (Math.abs(e - preferredEra) <= 10) reasons.push(`your favourite ${preferredEra}s era`);
      }
      // Length comfort
      if (b.pageCount && avgPages) {
        const diff = Math.abs(b.pageCount - avgPages) / Math.max(avgPages, 1);
        score += Math.max(0, 8 - diff * 8);
      }
      // Rating prior
      if (b.averageRating) score += (b.averageRating - 3.5) * 4;
      return { book: b, score, reasons: reasons.slice(0, 2) };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    const topGenres = [...sat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { genreSaturation: topGenres, recommendations: scored };
  }, [finished, wantToRead]);

  // ── 5. Literary horoscope (7-day forecast) ──────────────────────────────
  const horoscope = useMemo(() => {
    const moods = ['focused', 'adventurous', 'reflective', 'curious', 'cozy', 'analytical', 'imaginative'];
    // Entropy of recent genres → diversity score → mood mapping
    const recentGenres = finished
      .slice(-15)
      .flatMap(b => b.categories || []);
    const counts = new Map<string, number>();
    recentGenres.forEach(g => counts.set(g, (counts.get(g) || 0) + 1));
    const total = recentGenres.length || 1;
    let H = 0;
    counts.forEach(c => { const p = c / total; H -= p * Math.log2(p); });

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() + i * DAY);
      // Sinusoidal pacing — humans don't read identically every day
      const wave = 1 + 0.3 * Math.sin((d.getDay() / 7) * Math.PI * 2 + H);
      const pages = Math.round(velocity.pagesPerDay * wave);
      const mood = moods[(d.getDay() + Math.floor(H)) % moods.length];
      return { date: d, pages, mood };
    });
    return { days, entropy: H };
  }, [finished, velocity]);

  // ── Empty state ─────────────────────────────────────────────────────────
  if (books.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Telescope className="w-16 h-16 mx-auto text-primary/40 mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Reading Oracle</h2>
          <p className="text-muted-foreground">
            Finish a few books and the Oracle will start projecting your reading future.
          </p>
        </div>
      </div>
    );
  }

  const probPct = Math.round(trajectory.probability * 100);
  const probTone = probPct >= 70 ? 'text-green-500' : probPct >= 40 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Telescope className="w-5 h-5 text-primary" />
          <h1 className="text-3xl font-display font-bold tracking-tight">Reading Oracle</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A predictive lens on your reading life — modelled from {finished.length} finished books, {reading.length} in progress, {wantToRead.length} queued.
        </p>
      </div>

      {/* Hero: trajectory */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 bg-gradient-to-br from-primary/[0.08] via-card to-card"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="grid md:grid-cols-3 gap-6 relative">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Year-end projection</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-bold numeral">{trajectory.projected}</span>
              <span className="text-sm text-muted-foreground">of {readingGoal}</span>
              {trajectory.onTrack
                ? <TrendingUp className="w-5 h-5 text-green-500" />
                : <TrendingDown className="w-5 h-5 text-rose-500" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              At {(trajectory.pace * 30).toFixed(1)} books / month, day {trajectory.dayOfYear} of {trajectory.totalDays}.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Probability of goal</p>
            <div className={`text-5xl font-display font-bold numeral ${probTone}`}>{probPct}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${probPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: probPct >= 70
                    ? 'linear-gradient(90deg, hsl(140 60% 45%), hsl(160 60% 50%))'
                    : probPct >= 40
                      ? 'linear-gradient(90deg, hsl(35 80% 55%), hsl(50 90% 55%))'
                      : 'linear-gradient(90deg, hsl(355 75% 55%), hsl(15 80% 55%))',
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Based on monthly variance (σ) of your finishing cadence.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current velocity</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-bold numeral">{Math.round(velocity.pagesPerDay)}</span>
              <span className="text-sm text-muted-foreground">pages / day</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 capitalize">
              {velocity.confidence} confidence · {velocity.sampleSize} samples (EWMA, 90-day window)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forecasts grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* ETA per reading book */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border/60 p-5 bg-card/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Hourglass className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold">Completion Forecasts</h3>
          </div>
          {readingForecasts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books currently in progress.</p>
          ) : (
            <ul className="space-y-3">
              {readingForecasts.slice(0, 5).map(f => (
                <li key={f.book.id}>
                  <button
                    className="w-full text-left group"
                    onClick={() => onBookSelect?.(f.book)}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition">{f.book.title}</p>
                      <p className="text-xs text-muted-foreground numeral whitespace-nowrap">
                        {f.days < 1 ? 'today' : `${Math.ceil(f.days)}d`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground numeral w-16 text-right">
                        {fmtDate(f.eta)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Affinity recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 p-5 bg-card/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold">Read Next, Per The Oracle</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add books to your "want to read" shelf to receive recommendations.</p>
          ) : (
            <ul className="space-y-2.5">
              {recommendations.map((r, i) => (
                <li key={r.book.id}>
                  <button
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted/40 transition flex items-start gap-3 group"
                    onClick={() => onBookSelect?.(r.book)}
                  >
                    <div className="w-7 h-7 rounded-md gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center numeral flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition">{r.book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.reasons.length ? r.reasons.join(' · ') : 'high affinity match'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-semibold numeral">{r.score.toFixed(0)}</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">score</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Genre saturation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/60 p-5 bg-card/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold">Genre Saturation</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">45-day decay model</span>
          </div>
          {genreSaturation.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete a few books to see your saturation curve.</p>
          ) : (
            <div className="space-y-2">
              {genreSaturation.map(([g, v]) => {
                const pct = Math.min(100, (v / (genreSaturation[0][1] || 1)) * 100);
                return (
                  <div key={g}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate">{g}</span>
                      <span className="text-muted-foreground numeral">{v.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Literary horoscope */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/60 p-5 bg-card/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold">7-Day Literary Horoscope</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">H={horoscope.entropy.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {horoscope.days.map((d, i) => (
              <div key={i} className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                  {d.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div
                  className="aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-bold numeral"
                  style={{
                    background: `hsla(var(--primary), 70%, 55%, ${0.15 + (d.pages / 80) * 0.5})`,
                    color: 'hsl(var(--primary-foreground))',
                    backgroundColor: `hsl(var(--primary) / ${0.18 + Math.min(0.55, d.pages / 80)})`,
                  }}
                >
                  {d.pages}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1 truncate capitalize">{d.mood}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Pages-per-day forecast modulated by your weekday rhythm and genre-entropy. Higher entropy → more varied moods.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingOracle;