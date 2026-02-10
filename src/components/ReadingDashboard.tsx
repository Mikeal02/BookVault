import { useMemo } from 'react';
import { ReadingHeatmap } from './ReadingHeatmap';
import { Book } from '@/types/book';
import { 
  BookOpen, Target, Clock, TrendingUp, Award, Calendar, 
  Flame, Zap, Star, Trophy, ChevronRight, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReadingDashboardProps {
  books: Book[];
  currentUser: string;
  onViewChange: (view: 'search' | 'shelf' | 'stats' | 'recommendations' | 'challenges') => void;
}

export const ReadingDashboard = ({ books, currentUser, onViewChange }: ReadingDashboardProps) => {
  const stats = useMemo(() => {
    const finishedBooks = books.filter(book => book.readingStatus === 'finished');
    const readingBooks = books.filter(book => book.readingStatus === 'reading');
    const totalReadingTime = books.reduce((sum, book) => sum + (book.timeSpentReading || 0), 0);
    const currentYear = new Date().getFullYear();
    
    // Calculate reading streak (simulated based on current reading books)
    const streak = readingBooks.length > 0 ? Math.max(readingBooks.length * 5, 7) : 0;
    
    // Get favorite genres
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

    // Weekly reading data
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
      return {
        day,
        minutes: Math.floor(Math.random() * 60) + 15,
        pages: Math.floor(Math.random() * 30) + 10
      };
    });

    // Reading status for pie chart
    const statusData = [
      { name: 'Finished', value: finishedBooks.length, color: '#14b8a6' },
      { name: 'Reading', value: readingBooks.length, color: '#f97316' },
      { name: 'To Read', value: books.filter(book => book.readingStatus === 'not-read').length, color: '#94a3b8' }
    ].filter(d => d.value > 0);

    // Achievements
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

    // Recent activity
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
      goalProgress: Math.min((booksThisYear / 24) * 100, 100)
    };
  }, [books]);

  if (books.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl glass-card p-12 text-center">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center animate-float">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text-mixed mb-3">
            Welcome to BookVault, {currentUser}!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Start your reading journey by searching for books and building your personal library.
          </p>
          <button
            onClick={() => onViewChange('search')}
            className="px-8 py-4 rounded-2xl gradient-primary text-white font-semibold hover-scale shadow-lg"
          >
            Discover Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 blob-1 opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 blob-2 opacity-40" />
        
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
          
          {/* Streak Badge */}
          {stats.streak > 0 && (
            <div className="flex items-center gap-4 glass p-4 rounded-2xl">
              <div className="relative">
                <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center animate-pulse-soft">
                  <Flame className="w-8 h-8 text-white streak-flame" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center">
                  <span className="text-xs font-bold text-secondary">{stats.streak}</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-lg">{stats.streak} Day Streak</p>
                <p className="text-sm text-muted-foreground">Keep it going!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Total Books', value: stats.totalBooks, color: 'primary', suffix: '' },
          { icon: Target, label: 'Completed', value: stats.finishedBooks, color: 'success', suffix: '' },
          { icon: Clock, label: 'Reading Time', value: Math.floor(stats.totalReadingTime / 60), color: 'secondary', suffix: 'h' },
          { icon: Zap, label: 'Currently Reading', value: stats.readingBooks, color: 'warning', suffix: '' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`stat-card glass-card hover-lift stagger-${index + 1} animate-fade-in-up`}
            style={{ animationFillMode: 'both' }}
          >
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <p className="text-3xl font-bold mb-1">
              {stat.value}{stat.suffix}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
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
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  fill="url(#colorMinutes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reading Status */}
        <div className="glass-card rounded-2xl p-6">
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
                    <span className="text-sm text-muted-foreground">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No books yet</p>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Annual Goal Progress */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {new Date().getFullYear()} Reading Goal
            </h3>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {stats.booksThisYear}/24 books
            </span>
          </div>
          
          <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="absolute inset-y-0 left-0 rounded-full gradient-primary transition-all duration-1000"
              style={{ width: `${stats.goalProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {Math.round(stats.goalProgress)}% complete
            </span>
            <span className="text-muted-foreground">
              {24 - stats.booksThisYear} books to go
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-3 rounded-xl border transition-all ${
                  achievement.unlocked 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-muted/50 border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'gradient-primary' : 'bg-muted'
                  }`}>
                    <achievement.icon className={`w-5 h-5 ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reading Heatmap */}
      <ReadingHeatmap books={books} />

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => onViewChange('challenges')}
          className="glass-card rounded-2xl p-5 text-left hover-lift transition-all group"
        >
          <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center mb-3 shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-sm">Challenges</h4>
          <p className="text-xs text-muted-foreground mt-1">Earn XP & badges</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={() => onViewChange('stats')}
          className="glass-card rounded-2xl p-5 text-left hover-lift transition-all group"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-sm">Analytics</h4>
          <p className="text-xs text-muted-foreground mt-1">Deep reading insights</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={() => onViewChange('recommendations')}
          className="glass-card rounded-2xl p-5 text-left hover-lift transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center mb-3 shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-sm">For You</h4>
          <p className="text-xs text-muted-foreground mt-1">Personalized picks</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Recently Added Books */}
      {stats.recentBooks.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" />
              Recently Added
            </h3>
            <button 
              onClick={() => onViewChange('shelf')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.recentBooks.map((book) => (
              <div 
                key={book.id}
                className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => onViewChange('shelf')}
              >
                <img
                  src={book.imageLinks?.thumbnail || '/placeholder.svg'}
                  alt={book.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium line-clamp-2 text-sm">{book.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {book.authors?.join(', ')}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    book.readingStatus === 'finished' 
                      ? 'bg-success/20 text-success' 
                      : book.readingStatus === 'reading'
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {book.readingStatus === 'not-read' ? 'To Read' : book.readingStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
