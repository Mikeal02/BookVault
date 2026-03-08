import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Calendar, Target } from 'lucide-react';
import { Book } from '@/types/book';

interface ReadingPaceCardProps {
  books: Book[];
  readingGoal: number;
}

export const ReadingPaceCard = ({ books, readingGoal }: ReadingPaceCardProps) => {
  const pace = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(currentYear, 0, 1).getTime()) / 86400000) + 1;
    const totalDaysInYear = ((currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0) ? 366 : 365;
    const daysRemaining = totalDaysInYear - dayOfYear;

    const finishedThisYear = books.filter(b => {
      if (b.readingStatus !== 'finished' || !b.dateFinished) return false;
      return new Date(b.dateFinished).getFullYear() === currentYear;
    });

    const booksCompleted = finishedThisYear.length;
    const booksPerDay = dayOfYear > 0 ? booksCompleted / dayOfYear : 0;
    const projectedTotal = Math.round(booksPerDay * totalDaysInYear);
    const booksNeeded = Math.max(0, readingGoal - booksCompleted);
    const daysPerBookNeeded = booksNeeded > 0 && daysRemaining > 0 ? Math.round(daysRemaining / booksNeeded) : 0;

    // Average pages per day
    const totalPages = finishedThisYear.reduce((s, b) => s + (b.pageCount || 0), 0);
    const pagesPerDay = dayOfYear > 0 ? Math.round(totalPages / dayOfYear) : 0;

    // Monthly breakdown (last 3 months)
    const monthlyBreakdown: { month: string; count: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const count = finishedThisYear.filter(b => {
        const fd = new Date(b.dateFinished!);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      }).length;
      monthlyBreakdown.push({ month: monthName, count });
    }

    // Trend: compare last month vs month before
    const trend = monthlyBreakdown.length >= 2
      ? monthlyBreakdown[monthlyBreakdown.length - 1].count - monthlyBreakdown[monthlyBreakdown.length - 2].count
      : 0;

    return {
      booksCompleted,
      projectedTotal,
      booksNeeded,
      daysPerBookNeeded,
      pagesPerDay,
      monthlyBreakdown,
      trend,
      onTrack: projectedTotal >= readingGoal,
      percentOfYear: Math.round((dayOfYear / totalDaysInYear) * 100),
    };
  }, [books, readingGoal]);

  const TrendIcon = pace.trend > 0 ? TrendingUp : pace.trend < 0 ? TrendingDown : Minus;
  const trendColor = pace.trend > 0 ? 'text-success' : pace.trend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <motion.div
      className="glass-card rounded-2xl p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Reading Pace
        </h3>
        <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          {pace.trend > 0 ? '+' : ''}{pace.trend} vs last month
        </div>
      </div>

      {/* Pace metrics */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-3 bg-muted/30 rounded-xl">
          <p className="text-2xl font-black tabular-nums">{pace.projectedTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">Projected year</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-xl">
          <p className="text-2xl font-black tabular-nums">{pace.pagesPerDay}</p>
          <p className="text-xs text-muted-foreground mt-1">Pages/day</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-xl">
          <p className="text-2xl font-black tabular-nums">{pace.daysPerBookNeeded || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Days/book needed</p>
        </div>
      </div>

      {/* Monthly sparkline */}
      <div className="flex items-end gap-2 h-16 mb-3">
        {pace.monthlyBreakdown.map((m, i) => {
          const maxCount = Math.max(...pace.monthlyBreakdown.map(x => x.count), 1);
          const height = Math.max((m.count / maxCount) * 100, 8);
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t-lg gradient-primary"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
              />
              <span className="text-[10px] text-muted-foreground">{m.month}</span>
            </div>
          );
        })}
      </div>

      {/* On track indicator */}
      <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
        pace.onTrack
          ? 'bg-success/10 text-success'
          : 'bg-warning/10 text-warning'
      }`}>
        <Target className="w-4 h-4" />
        {pace.onTrack
          ? `On track! You'll likely finish ${pace.projectedTotal} books this year.`
          : `${pace.booksNeeded} more books needed to reach your goal of ${readingGoal}.`
        }
      </div>
    </motion.div>
  );
};
