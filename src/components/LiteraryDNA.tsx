import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dna, Sparkles, RefreshCw, Download, Share2 } from 'lucide-react';
import { Book } from '@/types/book';
import { toast } from 'sonner';

interface LiteraryDNAProps {
  books: Book[];
}

// ── Canonical genre buckets (radial axes) ──
const GENRE_AXES: { key: string; label: string; match: RegExp }[] = [
  { key: 'fiction',    label: 'Fiction',     match: /fiction|novel|literary/i },
  { key: 'mystery',    label: 'Mystery',     match: /mystery|crime|thriller|detective|noir/i },
  { key: 'fantasy',    label: 'Fantasy',     match: /fantasy|magic|myth/i },
  { key: 'scifi',      label: 'Sci-Fi',      match: /science fiction|sci[- ]?fi|cyber|space/i },
  { key: 'romance',    label: 'Romance',     match: /romance|love/i },
  { key: 'history',    label: 'History',     match: /history|historical|biography|memoir/i },
  { key: 'philosophy', label: 'Philosophy',  match: /philosophy|essays|religion|spirit/i },
  { key: 'science',    label: 'Science',     match: /science|technology|math|physics|computer/i },
  { key: 'business',   label: 'Business',    match: /business|economics|finance|self[- ]help|productivity/i },
  { key: 'poetry',     label: 'Poetry',      match: /poetry|verse|drama|theatre/i },
];

const ARCHETYPES = [
  { id: 'wanderer',    name: 'The Eclectic Wanderer',   tagline: 'A connoisseur of distant shelves.',           tone: 'Diversity above all.' },
  { id: 'scholar',     name: 'The Patient Scholar',     tagline: 'A keeper of weighty volumes.',                tone: 'Depth over breadth.' },
  { id: 'romancier',   name: 'The Quiet Romantic',      tagline: 'Letters of the heart, unhurried.',            tone: 'Sentiment in chapters.' },
  { id: 'sleuth',      name: 'The Midnight Sleuth',     tagline: 'Marginalia of motive and shadow.',            tone: 'Plot above all.' },
  { id: 'mystic',      name: 'The Drifting Mystic',     tagline: 'Wandering corridors of myth.',                tone: 'Worlds beyond ours.' },
  { id: 'archivist',   name: 'The Ledger Archivist',    tagline: 'Records, dates, and ink in order.',           tone: 'Discipline incarnate.' },
  { id: 'voyager',     name: 'The Voracious Voyager',   tagline: 'A reader without a season.',                  tone: 'Tempo above all.' },
  { id: 'curator',     name: 'The Discerning Curator',  tagline: 'Only the finest are admitted.',               tone: 'Quality over quantity.' },
];

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};

export const LiteraryDNA = ({ books }: LiteraryDNAProps) => {
  const [seed, setSeed] = useState(0);

  const metrics = useMemo(() => {
    const totalBooks = books.length || 1;
    const finished = books.filter(b => b.readingStatus === 'finished');
    const reading = books.filter(b => b.readingStatus === 'reading');

    // Genre vector
    const counts: Record<string, number> = {};
    GENRE_AXES.forEach(g => (counts[g.key] = 0));
    let categorised = 0;
    books.forEach(b => {
      (b.categories || []).forEach(cat => {
        GENRE_AXES.forEach(g => {
          if (g.match.test(cat)) {
            counts[g.key] += 1;
            categorised += 1;
          }
        });
      });
    });
    const max = Math.max(1, ...Object.values(counts));
    const vector = GENRE_AXES.map(g => ({ ...g, value: counts[g.key] / max }));

    // Author diversity (Simpson index inverted: 0 = single author, 1 = all unique)
    const authorTally: Record<string, number> = {};
    books.forEach(b => (b.authors || []).forEach(a => { authorTally[a] = (authorTally[a] || 0) + 1; }));
    const authorTotal = Object.values(authorTally).reduce((s, n) => s + n, 0) || 1;
    const simpson = Object.values(authorTally).reduce((s, n) => s + (n / authorTotal) ** 2, 0);
    const diversity = 1 - simpson;

    // Era distribution by decade (latest 60 years)
    const decades: Record<string, number> = {};
    books.forEach(b => {
      const year = parseInt(String(b.publishedDate || '').slice(0, 4));
      if (!isNaN(year)) {
        const d = Math.floor(year / 10) * 10;
        decades[d] = (decades[d] || 0) + 1;
      }
    });
    const decadeArr = Object.entries(decades).map(([d, n]) => ({ decade: +d, count: n })).sort((a, b) => a.decade - b.decade);

    // Page-length preference
    const pages = books.map(b => b.pageCount || 0).filter(n => n > 0);
    const avgPages = pages.length ? Math.round(pages.reduce((s, n) => s + n, 0) / pages.length) : 0;
    const longReads = pages.filter(p => p >= 500).length;

    // Rating bias
    const rated = books.filter(b => typeof b.personalRating === 'number' && b.personalRating! > 0);
    const avgRating = rated.length ? rated.reduce((s, b) => s + (b.personalRating || 0), 0) / rated.length : 0;
    const ratingBias = rated.length ? (avgRating - 3) / 2 : 0; // -1..+1

    // Completion velocity (finished / added in last 365d)
    const yearAgo = Date.now() - 365 * 86400000;
    const recentAdded = books.filter(b => b.dateAdded && new Date(b.dateAdded).getTime() > yearAgo).length;
    const recentFinished = finished.filter(b => b.dateFinished && new Date(b.dateFinished).getTime() > yearAgo).length;
    const tempo = recentAdded ? recentFinished / recentAdded : finished.length / totalBooks;

    // Determine dominant genre
    const sortedGenres = [...vector].sort((a, b) => b.value - a.value);
    const dominant = sortedGenres[0];
    const secondary = sortedGenres[1];

    // Pick archetype
    let archetype = ARCHETYPES[0];
    if (avgPages > 400 && longReads >= 3) archetype = ARCHETYPES[1];
    else if (diversity > 0.75 && categorised > 4) archetype = ARCHETYPES[0];
    else if (dominant?.key === 'romance') archetype = ARCHETYPES[2];
    else if (dominant?.key === 'mystery') archetype = ARCHETYPES[3];
    else if (dominant?.key === 'fantasy' || dominant?.key === 'scifi') archetype = ARCHETYPES[4];
    else if (recentFinished >= 12) archetype = ARCHETYPES[6];
    else if (avgRating >= 4.3 && rated.length >= 5) archetype = ARCHETYPES[7];
    else if (recentAdded > 0 && tempo < 0.3) archetype = ARCHETYPES[5];

    // Signature hash → 8-char hex for editorial flavour
    let h = 2166136261;
    const seedStr = `${totalBooks}-${dominant?.key}-${archetype.id}-${Math.round(avgPages)}-${Math.round(diversity * 100)}-${seed}`;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const signature = (h >>> 0).toString(16).padStart(8, '0').toUpperCase();

    return {
      totalBooks: books.length,
      finishedCount: finished.length,
      readingCount: reading.length,
      vector, sortedGenres, dominant, secondary,
      diversity, decadeArr, avgPages, longReads,
      avgRating, ratingBias, tempo, recentFinished, recentAdded,
      archetype, signature,
    };
  }, [books, seed]);

  // ── Radial geometry ──
  const SIZE = 440;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 170;
  const axes = metrics.vector;
  const stepAngle = 360 / axes.length;

  const innerPolyPoints = axes
    .map((a, i) => polar(CX, CY, R * a.value, i * stepAngle).join(','))
    .join(' ');

  const rings = [0.25, 0.5, 0.75, 1].map(r => R * r);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generated: new Date().toISOString(),
      signature: metrics.signature,
      archetype: metrics.archetype.name,
      dominant: metrics.dominant?.label,
      secondary: metrics.secondary?.label,
      diversityIndex: metrics.diversity,
      averagePages: metrics.avgPages,
      averageRating: metrics.avgRating,
      completionTempo: metrics.tempo,
      genreVector: metrics.vector.map(v => ({ axis: v.label, weight: v.value })),
      decadeDistribution: metrics.decadeArr,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literary-dna-${metrics.signature}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('DNA report exported');
  };

  const handleShare = async () => {
    const text = `My Literary DNA — ${metrics.archetype.name} · Signature ${metrics.signature}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Literary DNA', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  if (books.length === 0) {
    return (
      <div className="card-hairline frame-brackets p-12 text-center">
        <Dna className="w-12 h-12 mx-auto text-primary/40 mb-4" />
        <p className="text-sm text-muted-foreground">Add books to your shelf to generate your Literary DNA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Masthead ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          <span className="numeral">№ 00</span>
          <span className="h-px flex-1 bg-border/60" />
          <span>Literary DNA</span>
          <span className="h-px w-12 bg-primary/60" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight italic gold-underline inline-block">
          Your Reading Fingerprint
        </h1>
        <p className="text-sm text-muted-foreground/80 max-w-xl">
          A composite portrait of your library — synthesised from {metrics.totalBooks} volumes across genre, era, tempo, and judgement.
        </p>
      </div>

      {/* ── Archetype Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card-hairline frame-brackets p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end relative">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary/70 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>Archetype № 01</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl italic tracking-tight">{metrics.archetype.name}</h2>
            <p className="text-sm text-muted-foreground italic">"{metrics.archetype.tagline}"</p>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest pt-1">{metrics.archetype.tone}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">Signature</div>
            <div className="font-mono text-2xl text-primary tracking-[0.2em]">{metrics.signature}</div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setSeed(s => s + 1)} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Recompute
              </button>
              <button onClick={handleShare} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Share
              </button>
              <button onClick={handleExport} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Radial Fingerprint ── */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
        <div className="card-hairline frame-brackets p-6 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-4">
            <span className="numeral">№ 02</span> — Genre Spectrum
          </div>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[440px] aspect-square">
            <defs>
              <radialGradient id="dna-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              </radialGradient>
            </defs>
            {/* Rings */}
            {rings.map((r, i) => (
              <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="hsl(var(--border))" strokeOpacity={0.4} strokeDasharray={i === rings.length - 1 ? '0' : '2 4'} />
            ))}
            {/* Axes */}
            {axes.map((_, i) => {
              const [x, y] = polar(CX, CY, R, i * stepAngle);
              return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="hsl(var(--border))" strokeOpacity={0.3} />;
            })}
            {/* Filled polygon */}
            <motion.polygon
              points={innerPolyPoints}
              fill="url(#dna-fill)"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
            {/* Vertices */}
            {axes.map((a, i) => {
              const [x, y] = polar(CX, CY, R * a.value, i * stepAngle);
              return (
                <motion.circle
                  key={a.key}
                  cx={x} cy={y} r={3.5}
                  fill="hsl(var(--primary))"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                />
              );
            })}
            {/* Labels */}
            {axes.map((a, i) => {
              const [x, y] = polar(CX, CY, R + 22, i * stepAngle);
              return (
                <text
                  key={a.key} x={x} y={y}
                  textAnchor="middle" dominantBaseline="middle"
                  className="fill-foreground/70"
                  style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}
                >
                  {a.label}
                </text>
              );
            })}
            {/* Center fleuron */}
            <text x={CX} y={CY + 4} textAnchor="middle" className="fill-primary/60" style={{ fontSize: 18 }}>❦</text>
          </svg>
          <div className="text-[10px] text-muted-foreground/50 mt-3 italic">
            Dominant: {metrics.dominant?.label || '—'} · Secondary: {metrics.secondary?.label || '—'}
          </div>
        </div>

        {/* ── Quantitative ledger ── */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DnaMetric n="03" label="Author Diversity" value={Math.round(metrics.diversity * 100) + '%'} sub="Simpson inverted" />
            <DnaMetric n="04" label="Avg. Volume" value={metrics.avgPages ? `${metrics.avgPages}p` : '—'} sub={`${metrics.longReads} long reads`} />
            <DnaMetric n="05" label="Tempo" value={Math.round(metrics.tempo * 100) + '%'} sub={`${metrics.recentFinished}/${metrics.recentAdded} last year`} />
            <DnaMetric n="06" label="Rating Bias" value={metrics.avgRating ? metrics.avgRating.toFixed(2) : '—'} sub={metrics.ratingBias > 0.2 ? 'Generous' : metrics.ratingBias < -0.2 ? 'Severe' : 'Even-handed'} />
          </div>

          {/* Era timeline */}
          <div className="card-hairline frame-brackets p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-4">
              <span className="numeral">№ 07</span> — Temporal Distribution
            </div>
            {metrics.decadeArr.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">No dated volumes available.</p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {metrics.decadeArr.map((d, i) => {
                  const max = Math.max(...metrics.decadeArr.map(x => x.count));
                  const h = (d.count / max) * 100;
                  return (
                    <div key={d.decade} className="flex-1 flex flex-col items-center gap-1 group">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full bg-gradient-to-t from-primary/60 to-primary/20 group-hover:from-primary group-hover:to-primary/40 transition-colors rounded-t-sm relative"
                        title={`${d.decade}s · ${d.count} books`}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] numeral text-primary opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                      </motion.div>
                      <span className="text-[8px] text-muted-foreground/60 numeral">'{String(d.decade).slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strand bars */}
          <div className="card-hairline frame-brackets p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-4">
              <span className="numeral">№ 08</span> — Genre Strands
            </div>
            <div className="space-y-2">
              {metrics.sortedGenres.filter(g => g.value > 0).slice(0, 6).map((g, i) => (
                <div key={g.key} className="flex items-center gap-3">
                  <span className="text-[10px] numeral text-muted-foreground/60 w-8">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs uppercase tracking-widest w-24 truncate">{g.label}</span>
                  <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${g.value * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-primary/70 to-primary"
                    />
                  </div>
                  <span className="text-[10px] numeral text-primary/70 w-10 text-right">{Math.round(g.value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DnaMetric = ({ n, label, value, sub }: { n: string; label: string; value: string; sub: string }) => (
  <div className="card-hairline p-4 relative">
    <span className="absolute top-2 right-3 text-[9px] numeral text-muted-foreground/40">№ {n}</span>
    <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">{label}</div>
    <div className="font-display italic text-2xl text-foreground mt-1">{value}</div>
    <div className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</div>
  </div>
);