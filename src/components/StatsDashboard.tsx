
import { useMemo } from 'react';
import { Book, ReadingStats } from '@/types/book';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { BookOpen, Target, Clock, TrendingUp, Award, Calendar, Users, Zap } from 'lucide-react';

interface StatsDashboardProps {
  books: Book[];
  currentUser: string;
}

export const StatsDashboard = ({ books, currentUser }: StatsDashboardProps) => {
  const stats = useMemo(() => {
    const finishedBooks = books.filter(book => book.readingStatus === 'finished');
    const readingBooks = books.filter(book => book.readingStatus === 'reading');
    const totalPages = books.reduce((sum, book) => sum + (book.pageCount || 0), 0);
    const totalReadingTime = books.reduce((sum, book) => sum + (book.timeSpentReading || 0), 0);
    
    const ratedBooks = books.filter(book => book.personalRating && book.personalRating > 0);
    const averageRating = ratedBooks.length > 0 
      ? ratedBooks.reduce((sum, book) => sum + (book.personalRating || 0), 0) / ratedBooks.length 
      : 0;

    const genreCount: Record<string, number> = {};
    books.forEach(book => {
      book.categories?.forEach(category => {
        genreCount[category] = (genreCount[category] || 0) + 1;
      });
    });
    const favoriteGenre = Object.entries(genreCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentYear, i).toLocaleString('default', { month: 'short' });
      const monthBooks = finishedBooks.filter(book => {
        if (!book.dateFinished) return false;
        const finishDate = new Date(book.dateFinished);
        return finishDate.getFullYear() === currentYear && finishDate.getMonth() === i;
      });
      return {
        month,
        books: monthBooks.length,
        pages: monthBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0),
        time: monthBooks.reduce((sum, book) => sum + (book.timeSpentReading || 0), 0)
      };
    });

    const statusData = [
      { name: 'Finished', value: finishedBooks.length, color: '#14b8a6' },
      { name: 'Reading', value: readingBooks.length, color: '#f97316' },
      { name: 'To Read', value: books.filter(book => book.readingStatus === 'not-read').length, color: '#94a3b8' }
    ];

    const genreData = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([genre, count]) => ({ genre, count }));

    return {
      totalBooks: books.length,
      finishedBooks: finishedBooks.length,
      readingBooks: readingBooks.length,
      totalPages,
      totalReadingTime,
      averageRating,
      favoriteGenre,
      monthlyData,
      statusData,
      genreData,
      booksThisYear: finishedBooks.filter(book => {
        if (!book.dateFinished) return false;
        return new Date(book.dateFinished).getFullYear() === currentYear;
      }).length
    };
  }, [books]);

  const StatCard = ({ icon: Icon, title, value, subtitle, variant = 'primary' }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
  }) => {
    const variantStyles = {
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-secondary/10 text-secondary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
    };

    return (
      <div className="stat-card glass-card hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${variantStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text-mixed mb-2">
          Reading Analytics
        </h2>
        <p className="text-muted-foreground">
          Your personal reading insights for {currentUser}
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          title="Total Books"
          value={stats.totalBooks}
          subtitle={`${stats.finishedBooks} completed`}
          variant="primary"
        />
        <StatCard
          icon={Target}
          title="Books This Year"
          value={stats.booksThisYear}
          subtitle={`${Math.round((stats.booksThisYear / 12) * 10) / 10} per month avg`}
          variant="secondary"
        />
        <StatCard
          icon={Clock}
          title="Reading Time"
          value={`${Math.floor(stats.totalReadingTime / 60)}h ${stats.totalReadingTime % 60}m`}
          subtitle={`${Math.round(stats.totalReadingTime / Math.max(stats.finishedBooks, 1))} min avg per book`}
          variant="success"
        />
        <StatCard
          icon={Award}
          title="Average Rating"
          value={stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5` : 'N/A'}
          subtitle={`${books.filter(b => b.personalRating && b.personalRating > 0).length} books rated`}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={TrendingUp}
          title="Total Pages"
          value={stats.totalPages.toLocaleString()}
          subtitle={`${Math.round(stats.totalPages / Math.max(stats.finishedBooks, 1))} avg per book`}
          variant="primary"
        />
        <StatCard
          icon={Users}
          title="Favorite Genre"
          value={stats.favoriteGenre}
          subtitle={`${stats.genreData[0]?.count || 0} books in this genre`}
          variant="secondary"
        />
        <StatCard
          icon={Zap}
          title="Currently Reading"
          value={stats.readingBooks}
          subtitle={stats.readingBooks > 0 ? 'Keep it up!' : 'Time to start a new book!'}
          variant="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Reading Progress */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Monthly Reading Progress ({new Date().getFullYear()})
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="books"
                  stroke="#14b8a6"
                  fill="url(#colorBooks)"
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reading Status Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Reading Status Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {stats.statusData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Genre Distribution */}
      {stats.genreData.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary" />
            Top Genres
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.genreData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category"
                  dataKey="genre"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorGenre)"
                  radius={[0, 8, 8, 0]}
                />
                <defs>
                  <linearGradient id="colorGenre" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reading Goals Section */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary" />
          Reading Goals & Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Annual Goal</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                {Math.round((stats.booksThisYear / 24) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.booksThisYear / 24) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.booksThisYear} of 24 books
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Reading Streak</span>
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.readingBooks > 0 ? '🔥 ' : ''}
              {Math.max(stats.readingBooks * 7, 1)} days
            </p>
            <p className="text-xs text-muted-foreground">Keep reading daily!</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Next Milestone</span>
              <Award className="w-4 h-4 text-highlight" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {Math.ceil((stats.finishedBooks + 1) / 5) * 5} Books
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.ceil((stats.finishedBooks + 1) / 5) * 5 - stats.finishedBooks} books to go
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
