import { useMemo } from 'react';
import { Book } from '@/types/book';
import { Calendar, Flame } from 'lucide-react';

interface ReadingHeatmapProps {
  books: Book[];
}

export const ReadingHeatmap = ({ books }: ReadingHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Last 52 weeks
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    // Build a map of reading activity from book data
    const activityMap = new Map<string, number>();

    books.forEach(book => {
      // Add activity for date_added
      if (book.dateAdded) {
        const key = book.dateAdded.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 2);
      }
      // Add activity for date_started
      if (book.dateStarted) {
        const key = book.dateStarted.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 3);
      }
      // Add activity for date_finished
      if (book.dateFinished) {
        const key = book.dateFinished.slice(0, 10);
        activityMap.set(key, (activityMap.get(key) || 0) + 5);
      }
      // Simulate some reading activity for currently reading books
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

    // Generate weeks data
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

    return { weeks, totalActivity, activeDays };
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

  const levelColors = [
    'bg-muted',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary',
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Reading Activity
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Flame className="w-4 h-4 text-secondary" />
            <span className="font-medium">{heatmapData.activeDays}</span>
            <span>active days</span>
          </div>
        </div>
      </div>

      {/* Month Labels */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex mb-1 pl-8">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{ position: 'relative', left: `${m.col * 14}px`, width: 0 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="flex gap-0.5">
            {/* Day Labels */}
            <div className="flex flex-col gap-0.5 mr-1 justify-start">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <span key={i} className="text-[10px] text-muted-foreground h-[12px] leading-[12px]">
                  {d}
                </span>
              ))}
            </div>

            {/* Weeks */}
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }, (_, di) => {
                  const day = week.find(d => d.date.getDay() === di);
                  if (!day) return <div key={di} className="w-[12px] h-[12px]" />;
                  
                  return (
                    <div
                      key={di}
                      className={`w-[12px] h-[12px] rounded-[2px] ${levelColors[day.level]} transition-colors cursor-default`}
                      title={`${day.date.toLocaleDateString()}: ${day.count} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-muted-foreground mr-1">Less</span>
            {levelColors.map((color, i) => (
              <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${color}`} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
