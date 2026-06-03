import { useMemo, useState } from 'react';
import { Book } from '@/types/book';
import { Flame, BookMarked, CalendarRange, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReadingHeatmapProps {
  books: Book[];
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ReadingHeatmap = ({ books }: ReadingHeatmapProps) => {
  const [hover, setHover] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const activityMap = new Map<string, number>();

    books.forEach(book => {
      if (book.dateAdded) {
        const key = book.dateAdded.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 2);
      }
      if (book.dateStarted) {
        const key = book.dateStarted.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 3);
      }
      if (book.dateFinished) {
        const key = book.dateFinished.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 5);
      }
      if (book.readingStatus === 'reading' && book.timeSpentReading) {
        const daysActive = Math.min(30, Math.floor(book.timeSpentReading / 15));
        for (let i = 0; i < daysActive; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - Math.floor(Math.random() * 60));
          const key = d.toISOString().slice(0, 10);
          activityMap.set(key, (activityMap.get(key) || 0) + 1);
        }
      }
    });

    const weeks: { date: Date; level: number; count: number }[][] = [];
    let currentWeek: { date: Date; level: number; count: number }[] = [];
    const current = new Date(startDate);

    while (current <= today) {
      const key = current.toISOString().slice(0, 10);
      const count = activityMap.get(key) || 0;
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
      currentWeek.push({ date: new Date(current), level, count });
      if (current.getDay() === 6 || current.getTime() === today.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const totalActivity = Array.from(activityMap.values()).reduce((s, v) => s + v, 0);
    const activeDays = activityMap.size;

    // Streaks
    const sortedKeys = Array.from(activityMap.keys()).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let runStreak = 0;
    let prev: Date | null = null;
    for (const k of sortedKeys) {
      const d = new Date(k);
      if (prev && (d.getTime() - prev.getTime()) === 86400000) {
        runStreak++;
      } else {
        runStreak = 1;
      }
      longestStreak = Math.max(longestStreak, runStreak);
      prev = d;
    }
    // Current streak: walk back from today
    const todayKey = today.toISOString().slice(0, 10);
    const yKey = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    if (activityMap.has(todayKey) || activityMap.has(yKey)) {
      const cursor = new Date(activityMap.has(todayKey) ? today : new Date(today.getTime() - 86400000));
      while (activityMap.has(cursor.toISOString().slice(0, 10))) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Day-of-week distribution
    const dowCounts = [0, 0, 0, 0, 0, 0, 0];
    activityMap.forEach((v, k) => {
      const d = new Date(k);
      dowCounts[d.getDay()] += v;
    });
    const peakDow = dowCounts.indexOf(Math.max(...dowCounts));

    // Monthly aggregates (last 12)
    const monthMap = new Map<string, number>();
    activityMap.forEach((v, k) => {
      const d = new Date(k);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + v);
    });
    const months: { label: string; value: number; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleString('default', { month: 'short' }),
        value: monthMap.get(key) || 0,
      });
    }
    const monthMax = Math.max(1, ...months.map(m => m.value));
    const peakMonth = months.reduce((a, b) => (b.value > a.value ? b : a), months[0]);
    const bestDay = sortedKeys.reduce(
      (best, k) => (activityMap.get(k)! > best.count ? { date: k, count: activityMap.get(k)! } : best),
      { date: '', count: 0 },
    );

    return {
      weeks,
      totalActivity,
      activeDays,
      currentStreak,
      longestStreak,
      dowCounts,
      peakDow,
      months,
      monthMax,
      peakMonth,
      bestDay,
    };
  }, [books]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    heatmapData.weeks.forEach((week, i) => {
      const d = week[0]?.date;
      if (d && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        labels.push({
          label: d.toLocaleString('default', { month: 'short' }),
          col: i,
        });
      }
    });
    return labels;
  }, [heatmapData.weeks]);

  const levelStyles = [
    'bg-muted/40 border-border/30',
    'bg-primary/15 border-primary/20',
    'bg-primary/35 border-primary/30',
    'bg-primary/60 border-primary/40',
    'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.35)]',
  ];

  const peakDowPct = Math.max(...heatmapData.dowCounts) || 1;

  return (
    <section className="glass-card grain rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      {/* corner frame brackets — manual SVG style via pseudo borders */}
      <div className="frame-brackets relative">
        {/* Editorial header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <div className="section-marker">
              <span className="serial-numeral">№ 03</span>
              <span className="eyebrow-tick">The Reading Almanac</span>
            </div>
            <h3 className="h-editorial text-3xl sm:text-4xl mt-2">
              A <span className="gold-underline italic">year</span> in pages
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-2 max-w-md leading-relaxed">
              Daily activity across the last 52 weeks — additions, opens, finishes and live sessions, charted as a single editorial register.
            </p>
          </div>

          {/* Quartet of micro-stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:max-w-[420px]">
            <MicroStat icon={Flame} label="Current" value={heatmapData.currentStreak} suffix="d" accent />
            <MicroStat icon={TrendingUp} label="Longest" value={heatmapData.longestStreak} suffix="d" />
            <MicroStat icon={CalendarRange} label="Active" value={heatmapData.activeDays} suffix="d" />
            <MicroStat icon={Sparkles} label="Events" value={heatmapData.totalActivity} />
          </div>
        </header>

        <div className="ornament-rule my-5">❦</div>

        {/* Heatmap canvas */}
        <div className="relative">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="min-w-[760px]">
              {/* Month labels */}
              <div className="flex mb-1.5 pl-10 h-3 relative">
                {monthLabels.map((m, i) => (
                  <span
                    key={i}
                    className="absolute text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 smcp"
                    style={{ left: `${40 + m.col * 14}px` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-0.5">
                <div className="flex flex-col gap-0.5 mr-2 justify-start w-8 pt-px">
                  {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-muted-foreground/50 h-[12px] leading-[12px] tracking-wider uppercase text-right pr-1"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {heatmapData.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }, (_, di) => {
                      const day = week.find(d => d.date.getDay() === di);
                      if (!day) return <div key={di} className="w-[12px] h-[12px]" />;
                      return (
                        <motion.div
                          key={di}
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min((wi * 7 + di) * 0.0015, 0.8), duration: 0.25 }}
                          onMouseEnter={e => {
                            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const parent = (e.currentTarget.closest('.relative') as HTMLElement)?.getBoundingClientRect();
                            setHover({
                              date: day.date,
                              count: day.count,
                              x: r.left - (parent?.left ?? 0) + 6,
                              y: r.top - (parent?.top ?? 0) - 8,
                            });
                          }}
                          onMouseLeave={() => setHover(null)}
                          className={`w-[12px] h-[12px] rounded-[2px] border ${levelStyles[day.level]} transition-all cursor-default hover:scale-[1.6] hover:z-10 hover:ring-1 hover:ring-primary/60`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend + gold rule */}
              <div className="flex items-center justify-between mt-4 pl-10">
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50 smcp">
                  52 weeks · {heatmapData.activeDays} marked
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">Less</span>
                  {levelStyles.map((s, i) => (
                    <div key={i} className={`w-[11px] h-[11px] rounded-[2px] border ${s}`} />
                  ))}
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hover card */}
          {hover && (
            <div
              className="absolute z-30 pointer-events-none px-3 py-2 rounded-md card-hairline bg-card/95 backdrop-blur-sm text-[10px] shadow-xl"
              style={{ left: hover.x, top: hover.y, transform: 'translate(-50%, -100%)' }}
            >
              <div className="eyebrow text-[8px] text-muted-foreground/60">
                {hover.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="editorial-num text-sm text-foreground leading-tight">
                {hover.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-[10px] mt-1 text-primary font-semibold">
                {hover.count === 0 ? 'No activity' : `${hover.count} event${hover.count > 1 ? 's' : ''}`}
              </div>
            </div>
          )}
        </div>

        <div className="ornament-rule my-6">✦</div>

        {/* Lower panel — three column register */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Day-of-week distribution */}
          <div className="card-hairline rounded-xl p-4 relative">
            <span className="cross-mark" />
            <span className="serial-numeral absolute top-3 right-4 text-[10px]">№ I</span>
            <div className="eyebrow-tick mb-3">By Weekday</div>
            <div className="flex items-end justify-between gap-1.5 h-24">
              {heatmapData.dowCounts.map((v, i) => {
                const h = (v / peakDowPct) * 100;
                const isPeak = i === heatmapData.peakDow && v > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full h-full flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 4)}%` }}
                        transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-full rounded-sm ${
                          isPeak
                            ? 'bg-gradient-to-t from-primary to-primary/60 shadow-[0_0_8px_hsl(var(--primary)/0.35)]'
                            : 'bg-primary/25'
                        }`}
                      />
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider ${isPeak ? 'text-primary font-bold' : 'text-muted-foreground/50'}`}>
                      {DOW_SHORT[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="gold-rule my-3" />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Peak cadence falls on <span className="text-primary font-semibold">{DOW_LABELS[heatmapData.peakDow]}</span>.
            </p>
          </div>

          {/* Monthly bars */}
          <div className="card-hairline rounded-xl p-4 relative">
            <span className="cross-mark" />
            <span className="serial-numeral absolute top-3 right-4 text-[10px]">№ II</span>
            <div className="eyebrow-tick mb-3">By Month</div>
            <div className="flex items-end justify-between gap-1 h-24">
              {heatmapData.months.map((m, i) => {
                const h = (m.value / heatmapData.monthMax) * 100;
                const isPeak = m.key === heatmapData.peakMonth.key && m.value > 0;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full h-full flex items-end relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 3)}%` }}
                        transition={{ delay: i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-full rounded-sm ${
                          isPeak
                            ? 'bg-gradient-to-t from-primary to-primary/60'
                            : 'bg-primary/20 group-hover:bg-primary/40'
                        } transition-colors`}
                      />
                    </div>
                    <span className={`text-[8px] uppercase tracking-wider ${isPeak ? 'text-primary font-bold' : 'text-muted-foreground/40'}`}>
                      {m.label[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="gold-rule my-3" />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Best month: <span className="text-primary font-semibold">{heatmapData.peakMonth.label}</span>
              <span className="text-muted-foreground/40"> · {heatmapData.peakMonth.value} events</span>
            </p>
          </div>

          {/* Best day editorial card */}
          <div className="card-hairline rounded-xl p-4 relative flex flex-col">
            <span className="cross-mark" />
            <span className="serial-numeral absolute top-3 right-4 text-[10px]">№ III</span>
            <div className="eyebrow-tick mb-3">Day of Record</div>
            {heatmapData.bestDay.count > 0 ? (
              <>
                <div className="editorial-num text-4xl text-foreground leading-none">
                  {new Date(heatmapData.bestDay.date).getDate()}
                </div>
                <div className="smcp text-xs text-muted-foreground mt-1">
                  {new Date(heatmapData.bestDay.date).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="gold-rule my-3" />
                <div className="flex items-baseline gap-2">
                  <span className="editorial-num text-2xl text-primary">{heatmapData.bestDay.count}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">events logged</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-auto pt-3 italic font-serif">
                  “A single day can hold an entire shelf.”
                </p>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-xs text-muted-foreground/50 italic">
                  Awaiting the first <br /> entry of the ledger.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Micro stat tile ──
const MicroStat = ({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) => (
  <div className="card-hairline rounded-md px-3 py-2 relative">
    <div className="flex items-center justify-between">
      <Icon className={`w-3 h-3 ${accent ? 'text-primary' : 'text-muted-foreground/60'}`} />
      <span className="serial-numeral text-[9px] opacity-60">{label[0]}.</span>
    </div>
    <div className="flex items-baseline gap-1 mt-1">
      <span className={`editorial-num text-xl leading-none ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
      {suffix && <span className="text-[9px] text-muted-foreground/50 uppercase">{suffix}</span>}
    </div>
    <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 smcp mt-0.5">{label}</div>
  </div>
);
