import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Clock, Star, TrendingUp, Award } from 'lucide-react';
import { Book } from '@/types/book';

interface MonthlyReportCardProps {
  books: Book[];
}

export const MonthlyReportCard = ({ books }: MonthlyReportCardProps) => {
  const report = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const booksThisMonth = books.filter(b => {
      if (!b.dateFinished || b.readingStatus !== 'finished') return false;
      const d = new Date(b.dateFinished);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const booksPrevMonth = books.filter(b => {
      if (!b.dateFinished || b.readingStatus !== 'finished') return false;
      const d = new Date(b.dateFinished);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const pagesThisMonth = booksThisMonth.reduce((s, b) => s + (b.pageCount || 0), 0);
    const pagesPrevMonth = booksPrevMonth.reduce((s, b) => s + (b.pageCount || 0), 0);

    const avgRating = booksThisMonth.length > 0
      ? booksThisMonth.reduce((s, b) => s + (b.personalRating || 0), 0) / booksThisMonth.length
      : 0;

    // Top genre this month
    const genreCounts: Record<string, number> = {};
    booksThisMonth.forEach(b => b.categories?.forEach(c => {
      genreCounts[c] = (genreCounts[c] || 0) + 1;
    }));
    const topGenre = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    const monthName = now.toLocaleString('default', { month: 'long' });

    return {
      monthName,
      booksCount: booksThisMonth.length,
      prevBooksCount: booksPrevMonth.length,
      pages: pagesThisMonth,
      prevPages: pagesPrevMonth,
      avgRating: avgRating.toFixed(1),
      topGenre,
      topBook: booksThisMonth.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0))[0],
      change: booksThisMonth.length - booksPrevMonth.length,
    };
  }, [books]);

  const changeColor = report.change > 0 ? 'text-success' : report.change < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <motion.div
      className="glass-card rounded-2xl p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {report.monthName} Report
        </h3>
        <span className={`text-sm font-semibold ${changeColor}`}>
          {report.change > 0 ? '+' : ''}{report.change} vs last month
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: BookOpen, label: 'Books Read', value: report.booksCount, sub: `${report.prevBooksCount} last month` },
          { icon: TrendingUp, label: 'Pages', value: report.pages.toLocaleString(), sub: `${report.prevPages.toLocaleString()} prev` },
          { icon: Star, label: 'Avg Rating', value: report.avgRating === '0.0' ? 'N/A' : `${report.avgRating}/5`, sub: 'Your avg score' },
          { icon: Award, label: 'Top Genre', value: report.topGenre, sub: 'Most read' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="p-3 bg-muted/30 rounded-xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.08 }}
          >
            <item.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-lg font-black">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {report.topBook && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
          <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
            {report.topBook.imageLinks?.thumbnail ? (
              <img src={report.topBook.imageLinks.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">⭐ Book of the month</p>
            <p className="text-sm font-bold line-clamp-1">{report.topBook.title}</p>
            <p className="text-xs text-muted-foreground">{report.topBook.authors?.join(', ')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
