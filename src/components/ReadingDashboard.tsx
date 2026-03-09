import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { FlipClockStreak } from './FlipClockStreak';
import { ReadingHeatmap } from './ReadingHeatmap';
import { ReadingPaceCard } from './ReadingPaceCard';
import { MonthlyReportCard } from './MonthlyReportCard';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, Target, Clock, TrendingUp, Award, Calendar, 
  Flame, Zap, Star, Trophy, ChevronRight, Sparkles, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ── Sparkle Particles Component ──
const SparkleParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 3,
      opacity: Math.random() * 0.5 + 0.2,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/60"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{
            opacity: [0, p.opacity, 0],
            scale: [0.5, 1.2, 0.5],
            y: [0, -12, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* A few larger golden sparkles */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={`star-${i}`}
          className="absolute text-highlight/50"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            opacity: [0, 0.7, 0],
            scale: [0.3, 1, 0.3],
            rotate: [0, 180],
          }}
          transition={{
            duration: 4 + i * 0.5,
            delay: i * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      ))}
    </div>
  );
};

interface ReadingDashboardProps {
  books: Book[];
  currentUser: string;
  onViewChange: (view: 'search' | 'shelf' | 'stats' | 'recommendations' | 'challenges' | 'lists' | 'annotations') => void;
  readingGoal?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const parallaxOffsets = [0, -8, -16, -8]; // staggered depths

const AnimatedStatValue = ({ value, suffix }: { value: number; suffix: string }) => {
  const animated = useAnimatedCounter(value, 1200);
  return (
    <p className="text-3xl font-black mb-1 tracking-tight tabular-nums">
      {animated}{suffix}
    </p>
  );
};

const ParallaxStatsGrid = ({ stats }: { stats: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const statItems = [
    { icon: BookOpen, label: 'Total Books', value: stats.totalBooks, bgClass: 'bg-primary/10', iconClass: 'text-primary', suffix: '' },
    { icon: Target, label: 'Completed', value: stats.finishedBooks, bgClass: 'bg-success/10', iconClass: 'text-success', suffix: '' },
    { icon: Clock, label: 'Reading Time', value: Math.floor(stats.totalReadingTime / 60), bgClass: 'bg-secondary/10', iconClass: 'text-secondary', suffix: 'h' },
    { icon: Zap, label: 'Currently Reading', value: stats.readingBooks, bgClass: 'bg-warning/10', iconClass: 'text-warning', suffix: '' },
  ];

  const y0 = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const y1 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y3 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const yValues = [y0, y1, y2, y3];

  return (
    <div ref={ref} className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          style={{ y: yValues[index] }}
          className="stat-card glass-card hover-lift rounded-2xl"
        >
          <div className={`w-12 h-12 rounded-xl ${stat.bgClass} flex items-center justify-center mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.iconClass}`} />
          </div>
          <AnimatedStatValue value={stat.value} suffix={stat.suffix} />
          <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export const ReadingDashboard = ({ books, currentUser, onViewChange, readingGoal: userGoal = 12 }: ReadingDashboardProps) => {
  const [realStreak, setRealStreak] = useState<number | null>(null);
  const [weeklySessionData, setWeeklySessionData] = useState<{ day: string; minutes: number; pages: number }[]>([]);

  // Calculate real streak and weekly data from reading_sessions
  useEffect(() => {
    const buildEmptyWeek = () => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push({ day: dayNames[d.getDay()], minutes: 0, pages: 0 });
      }
      return result;
    };

    const loadSessionData = async () => {
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('session_date, duration_minutes, pages_read')
        .order('session_date', { ascending: false })
        .limit(200);

      if (!sessions || sessions.length === 0) {
        setRealStreak(0);
        setWeeklySessionData(buildEmptyWeek());
        return;
      }

      // Calculate streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDates = new Set(
        sessions.map(s => {
          const d = new Date(s.session_date!);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );
      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        if (sessionDates.has(checkDate.getTime())) {
          streak++;
        } else if (i === 0) {
          continue;
        } else {
          break;
        }
      }
      setRealStreak(streak);

      // Build weekly data from real sessions
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData: Record<string, { minutes: number; pages: number }> = {};
      dayNames.forEach(d => { weekData[d] = { minutes: 0, pages: 0 }; });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      sessions.forEach(s => {
        const d = new Date(s.session_date!);
        if (d >= sevenDaysAgo) {
          const dayName = dayNames[d.getDay()];
          weekData[dayName].minutes += s.duration_minutes || 0;
          weekData[dayName].pages += s.pages_read || 0;
        }
      });

      // Build array starting from today going back 7 days
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const name = dayNames[d.getDay()];
        result.push({ day: name, minutes: weekData[name].minutes, pages: weekData[name].pages });
      }
      setWeeklySessionData(result);
    };
    loadSessionData();
  }, []);

  const stats = useMemo(() => {
    const finishedBooks = books.filter(book => book.readingStatus === 'finished');
    const readingBooks = books.filter(book => book.readingStatus === 'reading');
    const totalReadingTime = books.reduce((sum, book) => sum + (book.timeSpentReading || 0), 0);
    const currentYear = new Date().getFullYear();
    // Use real streak from DB, fallback to estimate
    const streak = realStreak !== null ? realStreak : (readingBooks.length > 0 ? Math.max(readingBooks.length * 5, 7) : 0);
    
    const genreCount: Record<string, number> = {};
    books.forEach(book => {
      book.categories?.forEach(category => {
        genreCount[category] = (genreCount[category] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // Use real session data if available, else show zeros
    const weeklyData = weeklySessionData.length > 0 ? weeklySessionData : Array.from({ length: 7 }, (_, i) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: dayNames[d.getDay()], minutes: 0, pages: 0 };
    });

    const statusData = [
      { name: 'Finished', value: finishedBooks.length, color: 'hsl(162 68% 36%)' },
      { name: 'Reading', value: readingBooks.length, color: 'hsl(222 72% 52%)' },
      { name: 'To Read', value: books.filter(book => book.readingStatus === 'not-read').length, color: 'hsl(340 65% 58%)' }
    ].filter(d => d.value > 0);

    const achievements = [
      { id: 1, name: 'First Book', icon: BookOpen, unlocked: finishedBooks.length >= 1, description: 'Finish your first book' },
      { id: 2, name: 'Bookworm', icon: Trophy, unlocked: finishedBooks.length >= 5, description: 'Finish 5 books' },
      { id: 3, name: 'Speed Reader', icon: Zap, unlocked: totalReadingTime >= 600, description: 'Read for 10 hours total' },
      { id: 4, name: 'Consistent', icon: Flame, unlocked: streak >= 7, description: 'Maintain a 7-day streak' },
    ];

    const booksThisYear = finishedBooks.filter(book => {
      if (!book.dateFinished) return false;
      return new Date(book.dateFinished).getFullYear() === currentYear;
    }).length;

    const recentBooks = books
      .filter(book => book.dateAdded)
      .sort((a, b) => new Date(b.dateAdded!).getTime() - new Date(a.dateAdded!).getTime())
      .slice(0, 3);

    return {
      totalBooks: books.length,
      finishedBooks: finishedBooks.length,
      readingBooks: readingBooks.length,
      totalReadingTime,
      streak,
      topGenres,
      weeklyData,
      statusData,
      achievements,
      booksThisYear,
      recentBooks,
      goalProgress: Math.min((booksThisYear / userGoal) * 100, 100),
      readingGoal: userGoal,
    };
  }, [books, realStreak, weeklySessionData, userGoal]);

  if (books.length === 0) {
    return (
      <motion.div
        className="relative overflow-hidden rounded-3xl glass-card p-12 text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="aurora-container">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
          <div className="aurora-blob-3" />
        </div>
        <div className="relative z-10">
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text-mixed mb-3">
            Welcome to BookVault, {currentUser}!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Start your reading journey by searching for books and building your personal library.
          </p>
          <button
            onClick={() => onViewChange('search')}
            className="px-8 py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold hover-scale shadow-lg"
          >
            Discover Books
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        className="relative overflow-hidden rounded-3xl glass-card p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Aurora effect */}
        <div className="aurora-container">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
          <div className="aurora-blob-3" />
        </div>
        {/* Sparkle particles */}
        <SparkleParticles />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              <span className="gradient-text">Welcome back,</span>{' '}
              <span className="gradient-text-coral">{currentUser}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              You're on a roll! Keep reading to reach your yearly goal.
            </p>
          </div>
          
          {stats.streak > 0 && (
            <motion.div
              className="flex items-center gap-5 glass p-5 rounded-2xl border border-secondary/20"
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <FlipClockStreak value={stats.streak} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats Grid with Parallax */}
      <ParallaxStatsGrid stats={stats} />

      {/* Currently Reading Spotlight */}
      {stats.readingBooks > 0 && (() => {
        const currentBooks = books.filter(b => b.readingStatus === 'reading').slice(0, 2);
        return (
          <motion.div
            className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Flame className="w-5 h-5 text-warning" />
              Currently Reading
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {currentBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  className="flex gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => onViewChange('shelf')}
                >
                  <div className="w-16 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow ring-1 ring-border/30">
                    {book.imageLinks?.thumbnail ? (
                      <img src={book.imageLinks.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-sm line-clamp-1">{book.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.authors?.join(', ')}</p>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                        <span>{book.currentPage || 0} / {book.pageCount || '?'} pages</span>
                        <span className="font-bold text-primary">{Math.round(book.readingProgress || 0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full gradient-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(book.readingProgress || 0, 100)}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <motion.div
          className="lg:col-span-2 glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Reading Activity
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(222 72% 52%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(222 72% 52%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(222 72% 52%)"
                  strokeWidth={3}
                  fill="url(#colorMinutes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Reading Status */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Library Status
          </h3>
          {stats.statusData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {stats.statusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground font-medium">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No books yet</p>
          )}
        </motion.div>
      </div>

      {/* Reading Pace & Monthly Report */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ReadingPaceCard books={books} readingGoal={userGoal} />
        <MonthlyReportCard books={books} />
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Annual Goal Progress */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {new Date().getFullYear()} Reading Goal
            </h3>
            <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              {stats.booksThisYear}/{stats.readingGoal} books
            </span>
          </div>
          
          <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
            <motion.div 
              className="absolute inset-y-0 left-0 rounded-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${stats.goalProgress}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              {Math.round(stats.goalProgress)}% complete
            </span>
            <span className="text-muted-foreground">
              {Math.max(0, stats.readingGoal - stats.booksThisYear)} books to go
            </span>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.achievements.map((achievement) => (
              <motion.div 
                key={achievement.id}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'bg-primary/8 border-primary/25 shadow-sm' 
                    : 'bg-muted/50 border-transparent opacity-40'
                }`}
                whileHover={achievement.unlocked ? { scale: 1.03 } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'gradient-primary shadow-sm' : 'bg-muted'
                  }`}>
                    <achievement.icon className={`w-5 h-5 ${achievement.unlocked ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reading Heatmap */}
      <ReadingHeatmap books={books} />

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { view: 'challenges' as const, icon: Trophy, gradient: 'gradient-secondary', title: 'Challenges', desc: 'Earn XP & badges' },
          { view: 'stats' as const, icon: TrendingUp, gradient: 'gradient-primary', title: 'Analytics', desc: 'Deep reading insights' },
          { view: 'recommendations' as const, icon: Sparkles, gradient: 'bg-gradient-to-br from-warning to-warning/70', title: 'For You', desc: 'Personalized picks' },
          { view: 'lists' as const, icon: BookOpen, gradient: 'bg-gradient-to-br from-accent to-primary', title: 'Reading Lists', desc: 'Curated collections' },
          { view: 'annotations' as const, icon: Star, gradient: 'bg-gradient-to-br from-secondary to-secondary/70', title: 'Annotations', desc: 'Notes & highlights' },
        ].map((item, i) => (
          <motion.button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className="glass-card rounded-2xl p-5 text-left hover-lift transition-all group"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`w-10 h-10 rounded-xl ${item.gradient} flex items-center justify-center mb-3 shadow-lg`}>
              <item.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h4 className="font-bold text-sm">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 group-hover:text-primary transition-all" />
          </motion.button>
        ))}
      </div>

      {/* Recently Added Books */}
      {stats.recentBooks.length > 0 && (
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" />
              Recently Added
            </h3>
            <button
              onClick={() => onViewChange('shelf')}
              className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.recentBooks.map((book, i) => (
              <motion.div
                key={book.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer group"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                onClick={() => onViewChange('shelf')}
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                  {book.imageLinks?.thumbnail ? (
                    <img src={book.imageLinks.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm line-clamp-1">{book.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.authors?.join(', ')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
