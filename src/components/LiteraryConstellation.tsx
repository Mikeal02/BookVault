import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';
import { Book } from '@/types/book';

interface LiteraryConstellationProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

type Node = {
  id: string;
  book: Book;
  x: number; y: number;
  vx: number; vy: number;
  cluster: string;
  r: number;
};
type Edge = { source: string; target: string; kind: 'author' | 'category'; weight: number };

const CLUSTER_COLORS: Record<string, string> = {
  fiction: '210 80% 65%',
  mystery: '0 70% 60%',
  fantasy: '270 70% 65%',
  scifi: '180 70% 55%',
  romance: '340 70% 65%',
  history: '30 60% 55%',
  philosophy: '50 70% 55%',
  science: '160 60% 50%',
  business: '20 70% 55%',
  poetry: '290 60% 65%',
  other: '0 0% 60%',
};

const clusterOf = (book: Book): string => {
  const cats = (book.categories || []).join(' ').toLowerCase();
  if (/mystery|crime|thriller|noir|detective/.test(cats)) return 'mystery';
  if (/fantasy|magic|myth/.test(cats)) return 'fantasy';
  if (/sci|space|cyber/.test(cats)) return 'scifi';
  if (/romance|love/.test(cats)) return 'romance';
  if (/history|biograph|memoir/.test(cats)) return 'history';
  if (/philosoph|religion|spirit/.test(cats)) return 'philosophy';
  if (/science|tech|math|physics/.test(cats)) return 'science';
  if (/business|economic|finance|self/.test(cats)) return 'business';
  if (/poetry|verse|drama/.test(cats)) return 'poetry';
  if (/fiction|novel|literary/.test(cats)) return 'fiction';
  return 'other';
};

export const LiteraryConstellation = ({ books, onBookSelect }: LiteraryConstellationProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, setTick] = useState(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const panRef = useRef<{ x: number; y: number } | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<Node | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const VIEW_W = 1200;
  const VIEW_H = 760;

  // Build nodes + edges
  useMemo(() => {
    const nodes: Node[] = books.map((b, i) => {
      const angle = (i / books.length) * Math.PI * 2;
      const radius = 200 + Math.random() * 80;
      const rating = b.personalRating || b.averageRating || 3;
      return {
        id: b.id,
        book: b,
        x: VIEW_W / 2 + Math.cos(angle) * radius,
        y: VIEW_H / 2 + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        cluster: clusterOf(b),
        r: 6 + rating * 1.6,
      };
    });

    // Edges: shared author or shared primary category
    const edges: Edge[] = [];
    const authorMap: Record<string, string[]> = {};
    const catMap: Record<string, string[]> = {};
    books.forEach(b => {
      (b.authors || []).forEach(a => {
        const key = a.toLowerCase().trim();
        (authorMap[key] = authorMap[key] || []).push(b.id);
      });
      (b.categories || []).slice(0, 1).forEach(c => {
        const key = c.toLowerCase().split('/')[0].trim();
        (catMap[key] = catMap[key] || []).push(b.id);
      });
    });
    const addPairs = (group: string[], kind: 'author' | 'category', weight: number) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          edges.push({ source: group[i], target: group[j], kind, weight });
        }
      }
    };
    Object.values(authorMap).forEach(g => { if (g.length > 1 && g.length <= 8) addPairs(g, 'author', 0.06); });
    Object.values(catMap).forEach(g => { if (g.length > 1 && g.length <= 12) addPairs(g, 'category', 0.02); });

    nodesRef.current = nodes;
    edgesRef.current = edges;
    return null;
  }, [books]);

  // Force simulation loop
  useEffect(() => {
    if (!nodesRef.current.length) return;
    let alpha = 1;
    const step = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      alpha *= 0.992;
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 0.01;
          const force = (600 * alpha) / d2;
          const fx = dx * force, fy = dy * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }
      // Link attraction
      const idx: Record<string, Node> = {};
      nodes.forEach(n => (idx[n.id] = n));
      edges.forEach(e => {
        const a = idx[e.source], b = idx[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 110;
        const diff = (d - target) * e.weight * alpha;
        const fx = (dx / d) * diff, fy = (dy / d) * diff;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });
      // Center gravity
      nodes.forEach(n => {
        n.vx += (VIEW_W / 2 - n.x) * 0.0015;
        n.vy += (VIEW_H / 2 - n.y) * 0.0015;
        n.vx *= 0.82; n.vy *= 0.82;
        if (!(draggingRef.current && draggingRef.current.id === n.id)) {
          n.x += n.vx; n.y += n.vy;
        }
      });
      setTick(t => t + 1);
      if (alpha > 0.02) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [books]);

  // Pan + zoom
  const screenToWorld = (sx: number, sy: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((sx - rect.left) / rect.width) * VIEW_W;
    const py = ((sy - rect.top) / rect.height) * VIEW_H;
    return { x: (px - transform.x) / transform.k, y: (py - transform.y) / transform.k };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform(t => ({ ...t, k: Math.max(0.4, Math.min(2.5, t.k * (1 + delta))) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect') {
      panRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panRef.current) {
      setTransform(t => ({ ...t, x: e.clientX - panRef.current!.x, y: e.clientY - panRef.current!.y }));
    } else if (draggingRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      const node = nodesRef.current.find(n => n.id === draggingRef.current!.id);
      if (node) { node.x = w.x; node.y = w.y; node.vx = 0; node.vy = 0; }
    }
  };

  const handleMouseUp = () => {
    panRef.current = null;
    draggingRef.current = null;
  };

  const reset = () => setTransform({ x: 0, y: 0, k: 1 });

  const visibleNodes = filter ? nodesRef.current.filter(n => n.cluster === filter) : nodesRef.current;
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edgesRef.current.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  // Cluster legend counts
  const clusterCounts = useMemo(() => {
    const c: Record<string, number> = {};
    nodesRef.current.forEach(n => (c[n.cluster] = (c[n.cluster] || 0) + 1));
    return c;
  }, [books, nodesRef.current.length]);

  if (books.length === 0) {
    return (
      <div className="card-hairline frame-brackets p-12 text-center">
        <Atom className="w-12 h-12 mx-auto text-primary/40 mb-4" />
        <p className="text-sm text-muted-foreground">Add books to your shelf to see your literary constellation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Masthead */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          <span className="numeral">№ 00</span>
          <span className="h-px flex-1 bg-border/60" />
          <span>Literary Constellation</span>
          <span className="h-px w-12 bg-primary/60" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight italic gold-underline inline-block">
          A Map of Your Shelves
        </h1>
        <p className="text-sm text-muted-foreground/80 max-w-xl">
          {books.length} volumes drawn together by shared authors and overlapping themes — drag, pan, and zoom to inspect the threads.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
        <button onClick={() => setTransform(t => ({ ...t, k: Math.min(2.5, t.k * 1.2) }))} className="px-2.5 py-1.5 border border-border rounded-sm hover:border-primary/60 hover:text-primary transition-colors flex items-center gap-1.5">
          <ZoomIn className="w-3 h-3" /> In
        </button>
        <button onClick={() => setTransform(t => ({ ...t, k: Math.max(0.4, t.k / 1.2) }))} className="px-2.5 py-1.5 border border-border rounded-sm hover:border-primary/60 hover:text-primary transition-colors flex items-center gap-1.5">
          <ZoomOut className="w-3 h-3" /> Out
        </button>
        <button onClick={reset} className="px-2.5 py-1.5 border border-border rounded-sm hover:border-primary/60 hover:text-primary transition-colors flex items-center gap-1.5">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <span className="text-muted-foreground/50 ml-2"><Filter className="w-3 h-3 inline mr-1" /> Filter</span>
        <button onClick={() => setFilter(null)} className={`px-2 py-1 rounded-sm border transition-colors ${filter === null ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>All</button>
        {Object.entries(clusterCounts).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
          <button
            key={k}
            onClick={() => setFilter(f => f === k ? null : k)}
            className={`px-2 py-1 rounded-sm border transition-colors flex items-center gap-1.5 ${filter === k ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${CLUSTER_COLORS[k]})` }} />
            {k} <span className="numeral opacity-60">{n}</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="card-hairline frame-brackets relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, hsl(var(--background)) 0%, hsl(var(--card)) 100%)' }}>
        <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 z-10">
          <span className="numeral">№ 01</span> — Volumes & Threads
        </div>
        <div className="absolute top-3 right-4 text-[10px] numeral text-muted-foreground/50 z-10">
          {visibleNodes.length} nodes · {visibleEdges.length} threads · {Math.round(transform.k * 100)}%
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-[640px] cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <radialGradient id="star-glow">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* background catch */}
          <rect width={VIEW_W} height={VIEW_H} fill="transparent" />

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Edges */}
            {visibleEdges.map((e, i) => {
              const a = nodesRef.current.find(n => n.id === e.source);
              const b = nodesRef.current.find(n => n.id === e.target);
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={e.kind === 'author' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={e.kind === 'author' ? 1.2 : 0.6}
                  strokeOpacity={e.kind === 'author' ? 0.45 : 0.25}
                />
              );
            })}
            {/* Nodes */}
            {visibleNodes.map(n => (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(h => h?.id === n.id ? null : h)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  draggingRef.current = { id: n.id, offsetX: 0, offsetY: 0 };
                }}
                onClick={() => onBookSelect(n.book)}
              >
                <circle r={n.r + 6} fill="url(#star-glow)" opacity={hover?.id === n.id ? 1 : 0.5} />
                <circle
                  r={n.r}
                  fill={`hsl(${CLUSTER_COLORS[n.cluster]} / 0.85)`}
                  stroke="hsl(var(--primary))"
                  strokeWidth={hover?.id === n.id ? 1.5 : 0.5}
                  strokeOpacity={hover?.id === n.id ? 1 : 0.4}
                />
                {hover?.id === n.id && (
                  <text x={0} y={-n.r - 8} textAnchor="middle" className="fill-foreground" style={{ fontSize: 11, fontStyle: 'italic' }}>
                    {n.book.title.length > 36 ? n.book.title.slice(0, 33) + '…' : n.book.title}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>

        {/* Hover detail */}
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md card-hairline p-4 backdrop-blur-md"
            style={{ background: 'hsl(var(--card) / 0.92)' }}
          >
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: `hsl(${CLUSTER_COLORS[hover.cluster]})` }} />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">{hover.cluster}</div>
                <div className="font-display italic text-lg leading-tight truncate">{hover.book.title}</div>
                <div className="text-xs text-muted-foreground/70 truncate">{(hover.book.authors || []).join(', ') || 'Unknown'}</div>
                <div className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest">Click to open</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};