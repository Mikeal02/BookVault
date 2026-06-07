import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Sparkles, Maximize2, Minimize2, Filter, Layers, Pause, Play, Zap, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';

/**
 * BibliothecaNexus — A physics-simulated knowledge graph of the user's library.
 *
 * Each book is a node. Edges form when books share authors / genres / subjects /
 * era / language. A Verlet-style force solver runs at 60fps with:
 *  - Spring forces along edges (weighted by semantic similarity)
 *  - Coulomb repulsion between every node pair
 *  - Centripetal pull toward the canvas centre
 *  - Cluster-attractor wells per genre (toggleable)
 *  - Viscous damping
 * Interactions: drag to reposition, scroll to zoom, hover for halo, click for
 * detail panel, double-click to "freeze" a node, R to reset, space to pause.
 */

interface Props {
  books: Book[];
  onBookSelect?: (book: Book) => void;
}

type Node = {
  id: string;
  book: Book;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  cluster: string;
  pinned: boolean;
  mass: number;
};

type Edge = { a: number; b: number; w: number; kind: 'author' | 'genre' | 'subject' | 'era' };

const clusterFromBook = (b: Book): string => {
  const c = b.mainCategory || b.categories?.[0] || 'Uncategorized';
  return c.split('/')[0].trim();
};

const hashHue = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
};

const eraOf = (b: Book): string => {
  const y = parseInt(b.publishedDate?.slice(0, 4) || '0', 10);
  if (!y) return 'unknown';
  if (y < 1900) return 'pre-1900';
  return `${Math.floor(y / 10) * 10}s`;
};

export const BibliothecaNexus = ({ books, onBookSelect }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const viewRef = useRef({ zoom: 1, ox: 0, oy: 0 });
  const dragRef = useRef<{ idx: number | null; px: number; py: number; panning: boolean }>({
    idx: null, px: 0, py: 0, panning: false,
  });
  const hoverRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 800, h: 600 });

  const [paused, setPaused] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<Set<Edge['kind']>>(new Set(['author', 'genre', 'subject', 'era']));
  const [tick, setTick] = useState(0); // forces re-render of overlay UI

  // ── Build graph from books ────────────────────────────────────────────────
  const { nodes, edges, clusters } = useMemo(() => {
    const ns: Node[] = books.map((b, i) => {
      const cluster = clusterFromBook(b);
      const angle = (i / Math.max(1, books.length)) * Math.PI * 2;
      const r = 180 + Math.random() * 60;
      return {
        id: b.id,
        book: b,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        vx: 0, vy: 0,
        r: 6 + Math.min(14, Math.log2((b.pageCount || 100) + 1)),
        hue: hashHue(cluster),
        cluster,
        pinned: false,
        mass: 1 + Math.log2((b.pageCount || 100) + 1) / 10,
      };
    });

    const idxById = new Map(ns.map((n, i) => [n.id, i]));
    const es: Edge[] = [];
    const seen = new Set<string>();
    const pushEdge = (a: number, b: number, w: number, kind: Edge['kind']) => {
      if (a === b) return;
      const key = a < b ? `${a}-${b}-${kind}` : `${b}-${a}-${kind}`;
      if (seen.has(key)) return;
      seen.add(key);
      es.push({ a, b, w, kind });
    };

    // Author edges
    const byAuthor = new Map<string, number[]>();
    ns.forEach((n, i) => n.book.authors?.forEach(a => {
      const k = a.toLowerCase().trim();
      if (!k) return;
      if (!byAuthor.has(k)) byAuthor.set(k, []);
      byAuthor.get(k)!.push(i);
    }));
    byAuthor.forEach(arr => {
      for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++)
          pushEdge(arr[i], arr[j], 1.0, 'author');
    });

    // Genre edges (same cluster) — weighted, sparser
    const byGenre = new Map<string, number[]>();
    ns.forEach((n, i) => {
      if (!byGenre.has(n.cluster)) byGenre.set(n.cluster, []);
      byGenre.get(n.cluster)!.push(i);
    });
    byGenre.forEach(arr => {
      // Sparsify: connect each node to nearest 2 in cluster (by index)
      for (let i = 0; i < arr.length; i++) {
        for (let k = 1; k <= 2 && i + k < arr.length; k++) {
          pushEdge(arr[i], arr[i + k], 0.45, 'genre');
        }
      }
    });

    // Subject overlap edges
    const subjIdx = new Map<string, number[]>();
    ns.forEach((n, i) => {
      const subs = [...(n.book.subjects || []), ...(n.book.categories || [])].slice(0, 8);
      subs.forEach(s => {
        const k = s.toLowerCase().trim();
        if (!k || k.length < 3) return;
        if (!subjIdx.has(k)) subjIdx.set(k, []);
        subjIdx.get(k)!.push(i);
      });
    });
    subjIdx.forEach(arr => {
      if (arr.length < 2 || arr.length > 12) return; // skip noise
      for (let i = 0; i < Math.min(arr.length, 4); i++)
        for (let j = i + 1; j < Math.min(arr.length, 4); j++)
          pushEdge(arr[i], arr[j], 0.35, 'subject');
    });

    // Era edges
    const byEra = new Map<string, number[]>();
    ns.forEach((n, i) => {
      const e = eraOf(n.book);
      if (e === 'unknown') return;
      if (!byEra.has(e)) byEra.set(e, []);
      byEra.get(e)!.push(i);
    });
    byEra.forEach(arr => {
      for (let i = 0; i < arr.length - 1; i++) pushEdge(arr[i], arr[i + 1], 0.25, 'era');
    });

    const clusters = Array.from(new Set(ns.map(n => n.cluster))).sort();
    return { nodes: ns, edges: es, clusters };
  }, [books]);

  // Sync refs whenever graph changes
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }));
    edgesRef.current = edges;
  }, [nodes, edges]);

  // ── Resize ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      const dpr = window.devicePixelRatio || 1;
      cv.width = rect.width * dpr;
      cv.height = rect.height * dpr;
      cv.style.width = `${rect.width}px`;
      cv.style.height = `${rect.height}px`;
      const ctx = cv.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ── Physics + Render loop ──────────────────────────────────────────────────
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;

    const step = () => {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const { w, h } = sizeRef.current;
      const cx = w / 2, cy = h / 2;

      if (!paused && ns.length) {
        // Edge springs
        for (const e of es) {
          if (!edgeFilter.has(e.kind)) continue;
          const A = ns[e.a], B = ns[e.b];
          const dx = B.x - A.x, dy = B.y - A.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          const ideal = 80 + (1 - e.w) * 80;
          const k = 0.0025 * e.w;
          const f = (dist - ideal) * k;
          const fx = (dx / dist) * f, fy = (dy / dist) * f;
          if (!A.pinned) { A.vx += fx / A.mass; A.vy += fy / A.mass; }
          if (!B.pinned) { B.vx -= fx / B.mass; B.vy -= fy / B.mass; }
        }

        // Coulomb repulsion — O(n²) but capped at <600 nodes
        const cap = Math.min(ns.length, 600);
        for (let i = 0; i < cap; i++) {
          const A = ns[i];
          for (let j = i + 1; j < cap; j++) {
            const B = ns[j];
            const dx = B.x - A.x, dy = B.y - A.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) d2 = 1;
            if (d2 > 90000) continue;
            const f = 380 / d2;
            const d = Math.sqrt(d2);
            const fx = (dx / d) * f, fy = (dy / d) * f;
            if (!A.pinned) { A.vx -= fx / A.mass; A.vy -= fy / A.mass; }
            if (!B.pinned) { B.vx += fx / B.mass; B.vy += fy / B.mass; }
          }
        }

        // Cluster attractor wells + centripetal
        const clusterCenters = new Map<string, { x: number; y: number; n: number }>();
        if (showClusters) {
          clusters.forEach((c, i) => {
            const angle = (i / clusters.length) * Math.PI * 2;
            const R = Math.min(w, h) * 0.32;
            clusterCenters.set(c, { x: Math.cos(angle) * R, y: Math.sin(angle) * R, n: 0 });
          });
        }

        for (const n of ns) {
          if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
          // Center pull
          n.vx += -n.x * 0.0015;
          n.vy += -n.y * 0.0015;
          if (showClusters) {
            const cc = clusterCenters.get(n.cluster);
            if (cc) {
              n.vx += (cc.x - n.x) * 0.004;
              n.vy += (cc.y - n.y) * 0.004;
            }
          }
          // Damping
          n.vx *= 0.86;
          n.vy *= 0.86;
          // Integrate
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // ── Render ──────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);
      const v = viewRef.current;
      ctx.save();
      ctx.translate(cx + v.ox, cy + v.oy);
      ctx.scale(v.zoom, v.zoom);

      // Cluster halos
      if (showClusters) {
        clusters.forEach((c, i) => {
          const angle = (i / clusters.length) * Math.PI * 2;
          const R = Math.min(w, h) * 0.32;
          const cxC = Math.cos(angle) * R;
          const cyC = Math.sin(angle) * R;
          const hue = hashHue(c);
          const grd = ctx.createRadialGradient(cxC, cyC, 0, cxC, cyC, 140);
          grd.addColorStop(0, `hsla(${hue}, 70%, 55%, 0.10)`);
          grd.addColorStop(1, `hsla(${hue}, 70%, 55%, 0)`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(cxC, cyC, 140, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Edges
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const hov = hoverRef.current;
      for (const e of es) {
        if (!edgeFilter.has(e.kind)) continue;
        const A = ns[e.a], B = ns[e.b];
        if (!A || !B) continue;
        const isHi = hov !== null && (e.a === hov || e.b === hov);
        const baseAlpha = 0.06 + e.w * 0.10;
        const alpha = isHi ? Math.min(0.85, baseAlpha + 0.5) : baseAlpha;
        const hue = e.kind === 'author' ? 30 : e.kind === 'genre' ? 200 : e.kind === 'subject' ? 280 : 140;
        ctx.strokeStyle = `hsla(${hue}, 65%, 60%, ${alpha})`;
        ctx.lineWidth = isHi ? 1.4 : 0.6;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < ns.length; i++) {
        const n = ns[i];
        const isHov = hov === i;
        const isSel = selected?.id === n.id;
        // Glow ring
        if (isHov || isSel || n.pinned) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${n.hue}, 80%, 60%, 0.18)`;
          ctx.fill();
        }
        // Disc
        const grd = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, 0, n.x, n.y, n.r);
        grd.addColorStop(0, `hsl(${n.hue}, 75%, 70%)`);
        grd.addColorStop(1, `hsl(${n.hue}, 65%, 42%)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        // Border
        ctx.lineWidth = isSel ? 2 : isHov ? 1.5 : 0.6;
        ctx.strokeStyle = isSel ? '#fff' : `hsla(${n.hue}, 70%, 85%, 0.6)`;
        ctx.stroke();
        // Pin indicator
        if (n.pinned) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }

      // Labels
      if (showLabels && v.zoom > 0.85) {
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = 'hsla(0, 0%, 90%, 0.75)';
        ctx.textAlign = 'center';
        for (const n of ns) {
          if (n.r < 8 && hov !== null && ns[hov]?.id !== n.id) continue;
          const label = n.book.title.length > 22 ? n.book.title.slice(0, 20) + '…' : n.book.title;
          ctx.fillText(label, n.x, n.y + n.r + 12);
        }
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused, edgeFilter, showClusters, showLabels, clusters, selected]);

  // ── Pointer / wheel handlers ──────────────────────────────────────────────
  const toWorld = useCallback((clientX: number, clientY: number) => {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const v = viewRef.current;
    const { w, h } = sizeRef.current;
    return {
      x: (clientX - rect.left - w / 2 - v.ox) / v.zoom,
      y: (clientY - rect.top - h / 2 - v.oy) / v.zoom,
    };
  }, []);

  const findNode = useCallback((wx: number, wy: number) => {
    const ns = nodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      const n = ns[i];
      const dx = wx - n.x, dy = wy - n.y;
      if (dx * dx + dy * dy <= (n.r + 4) * (n.r + 4)) return i;
    }
    return null;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    const { x, y } = toWorld(e.clientX, e.clientY);
    const idx = findNode(x, y);
    if (idx !== null) {
      dragRef.current = { idx, px: e.clientX, py: e.clientY, panning: false };
      nodesRef.current[idx].pinned = true;
    } else {
      dragRef.current = { idx: null, px: e.clientX, py: e.clientY, panning: true };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const { x, y } = toWorld(e.clientX, e.clientY);
    const hi = findNode(x, y);
    if (hi !== hoverRef.current) { hoverRef.current = hi; setTick(t => t + 1); }
    if (d.idx !== null) {
      const n = nodesRef.current[d.idx];
      n.x = x; n.y = y; n.vx = 0; n.vy = 0;
    } else if (d.panning) {
      const dx = e.clientX - d.px, dy = e.clientY - d.py;
      viewRef.current.ox += dx;
      viewRef.current.oy += dy;
      d.px = e.clientX; d.py = e.clientY;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    // Detect "click" (no drag) → select; release pin
    const moved = Math.hypot(e.clientX - d.px, e.clientY - d.py);
    if (d.idx !== null) {
      const n = nodesRef.current[d.idx];
      if (moved < 4) {
        setSelected(n.book);
        n.pinned = false;
      }
      // Otherwise leave pinned where user dropped it
    }
    dragRef.current = { idx: null, px: 0, py: 0, panning: false };
  };
  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const i = findNode(x, y);
    if (i !== null) {
      nodesRef.current[i].pinned = !nodesRef.current[i].pinned;
      setTick(t => t + 1);
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    const v = viewRef.current;
    const before = v.zoom;
    const next = Math.max(0.3, Math.min(3, v.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    // Zoom toward cursor
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const mx = e.clientX - rect.left - w / 2;
    const my = e.clientY - rect.top - h / 2;
    v.ox = mx - ((mx - v.ox) * next) / before;
    v.oy = my - ((my - v.oy) * next) / before;
    v.zoom = next;
  };

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
      if (e.key === 'r' || e.key === 'R') {
        viewRef.current = { zoom: 1, ox: 0, oy: 0 };
        nodesRef.current.forEach((n, i) => {
          const angle = (i / nodesRef.current.length) * Math.PI * 2;
          const r = 200 + Math.random() * 60;
          n.x = Math.cos(angle) * r; n.y = Math.sin(angle) * r;
          n.vx = 0; n.vy = 0; n.pinned = false;
        });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const edgeCount = edges.filter(e => edgeFilter.has(e.kind)).length;
    const density = nodes.length > 1
      ? ((edgeCount / (nodes.length * (nodes.length - 1) / 2)) * 100).toFixed(2)
      : '0.00';
    // Degree per node
    const deg = new Map<string, number>();
    edges.forEach(e => {
      if (!edgeFilter.has(e.kind)) return;
      deg.set(nodes[e.a]?.id ?? '', (deg.get(nodes[e.a]?.id ?? '') ?? 0) + 1);
      deg.set(nodes[e.b]?.id ?? '', (deg.get(nodes[e.b]?.id ?? '') ?? 0) + 1);
    });
    const ranked = [...deg.entries()]
      .map(([id, d]) => ({ book: nodes.find(n => n.id === id)?.book, d }))
      .filter(x => x.book)
      .sort((a, b) => b.d - a.d)
      .slice(0, 5);
    return { edgeCount, density, ranked };
  }, [nodes, edges, edgeFilter]);

  const hoveredBook = hoverRef.current !== null ? nodesRef.current[hoverRef.current]?.book : null;

  if (books.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Atom className="w-16 h-16 mx-auto text-primary/40 mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Bibliotheca Nexus</h2>
          <p className="text-muted-foreground">Add books to your library to visualize the hidden connections between authors, genres, and ideas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={fullscreen ? 'fixed inset-0 z-[80] bg-background' : ''}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Atom className="w-5 h-5 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">Bibliotheca Nexus</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            A live physics simulation of {nodes.length} books, {stats.edgeCount} semantic connections.
            Drag · scroll · double-click to pin · <kbd className="px-1 rounded bg-muted text-[10px]">Space</kbd> pause · <kbd className="px-1 rounded bg-muted text-[10px]">R</kbd> reset
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPaused(p => !p)}>
            {paused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden"
          style={{ height: fullscreen ? 'calc(100vh - 180px)' : '70vh', minHeight: 500 }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
            onWheel={onWheel}
          />
          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredBook && (
              <motion.div
                key={hoveredBook.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 left-3 max-w-xs p-3 rounded-xl glass-frosted border border-border/60 shadow-lg pointer-events-none"
              >
                <p className="text-sm font-semibold leading-tight">{hoveredBook.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{hoveredBook.authors?.join(', ')}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {hoveredBook.categories?.slice(0, 3).map(c => (
                    <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Edge legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {(['author', 'genre', 'subject', 'era'] as const).map(k => {
              const active = edgeFilter.has(k);
              const hue = k === 'author' ? 30 : k === 'genre' ? 200 : k === 'subject' ? 280 : 140;
              return (
                <button
                  key={k}
                  onClick={() => {
                    const s = new Set(edgeFilter);
                    if (s.has(k)) s.delete(k); else s.add(k);
                    setEdgeFilter(s);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-full border transition ${
                    active ? 'border-transparent text-white' : 'border-border/60 text-muted-foreground bg-background/60'
                  }`}
                  style={active ? { background: `hsl(${hue}, 65%, 50%)` } : undefined}
                >
                  {k}
                </button>
              );
            })}
          </div>
          {/* Toolbar */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            <button
              onClick={() => setShowClusters(s => !s)}
              className={`p-2 rounded-lg border ${showClusters ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background/70 border-border/60'}`}
              title="Cluster wells"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowLabels(s => !s)}
              className={`p-2 rounded-lg border ${showLabels ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background/70 border-border/60'}`}
              title="Labels"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                viewRef.current = { zoom: 1, ox: 0, oy: 0 };
              }}
              className="p-2 rounded-lg border bg-background/70 border-border/60"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 p-4 bg-card/50">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Network Vitals</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-display font-bold">{nodes.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nodes</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{stats.edgeCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Edges</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{clusters.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Clusters</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{stats.density}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Density</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-4 bg-card/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Central Works
            </h3>
            <ol className="space-y-2">
              {stats.ranked.map((r, i) => (
                <li key={r.book!.id}>
                  <button
                    className="w-full text-left text-xs flex items-center gap-2 hover:text-primary transition"
                    onClick={() => setSelected(r.book!)}
                  >
                    <span className="numeral text-muted-foreground w-4">{i + 1}</span>
                    <span className="flex-1 truncate">{r.book!.title}</span>
                    <span className="text-[10px] text-muted-foreground numeral">{r.d}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-border/60 p-4 bg-card/50">
            <h3 className="text-sm font-semibold mb-3">Clusters</h3>
            <div className="flex flex-wrap gap-1.5">
              {clusters.slice(0, 14).map(c => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-1 rounded-full"
                  style={{ background: `hsla(${hashHue(c)}, 65%, 50%, 0.15)`, color: `hsl(${hashHue(c)}, 65%, 55%)` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/60 shadow-2xl max-w-md w-full p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.authors?.join(', ')}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selected.imageLinks?.thumbnail && (
                <img src={selected.imageLinks.thumbnail} alt="" className="w-24 rounded-lg my-3 shadow" />
              )}
              <p className="text-xs text-muted-foreground line-clamp-4">{selected.description}</p>
              <div className="mt-4 flex gap-2">
                {onBookSelect && (
                  <Button size="sm" onClick={() => { onBookSelect(selected); setSelected(null); }}>
                    Open details
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BibliothecaNexus;