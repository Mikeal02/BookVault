import { useState, useMemo, useEffect } from 'react';
import { 
  User, Mail, Calendar, Target, BookOpen, Clock, Trophy, 
  Flame, Star, TrendingUp, Award, Edit3, Save, X, Camera,
  Sparkles, Zap, Heart, BarChart3, Library, Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';

interface ProfileSectionProps {
  books: Book[];
  currentUser: string;
  userEmail?: string;
  userId?: string;
}

interface UserProfile {
  username: string;
  email: string;
  favorite_genres: string[];
  reading_goal: number;
  preferred_reading_time: string;
  bio?: string;
  avatar_url?: string;
}

export const ProfileSection = ({ books, currentUser, userEmail, userId }: ProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    username: currentUser,
    email: userEmail || '',
    favorite_genres: [],
    reading_goal: 24,
    preferred_reading_time: 'evening',
    bio: ''
  });
  const [editedProfile, setEditedProfile] = useState(profile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        const loadedProfile = {
          username: data.username || currentUser,
          email: data.email || userEmail || '',
          favorite_genres: data.favorite_genres || [],
          reading_goal: data.reading_goal || 24,
          preferred_reading_time: data.preferred_reading_time || 'evening',
          bio: '' // Bio is stored in local state only for now
        };
        setProfile(loadedProfile);
        setEditedProfile(loadedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedProfile.username,
          favorite_genres: editedProfile.favorite_genres,
          reading_goal: editedProfile.reading_goal,
          preferred_reading_time: editedProfile.preferred_reading_time,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const stats = useMemo(() => {
    const finishedBooks = books.filter(b => b.readingStatus === 'finished');
    const readingBooks = books.filter(b => b.readingStatus === 'reading');
    const totalPages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0);
    const totalReadingTime = books.reduce((sum, b) => sum + (b.timeSpentReading || 0), 0);
    const avgRating = finishedBooks.length > 0
      ? finishedBooks.reduce((sum, b) => sum + (b.personalRating || 0), 0) / finishedBooks.length
      : 0;

    // Genre distribution
    const genreCount: Record<string, number> = {};
    books.forEach(book => {
      book.categories?.forEach(cat => {
        genreCount[cat] = (genreCount[cat] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Reading streak (simulated)
    const streak = readingBooks.length > 0 ? Math.max(readingBooks.length * 5, 7) : 0;

    // Monthly reading
    const currentYear = new Date().getFullYear();
    const booksThisYear = finishedBooks.filter(b => {
      if (!b.dateFinished) return false;
      return new Date(b.dateFinished).getFullYear() === currentYear;
    }).length;

    return {
      totalBooks: books.length,
      finishedBooks: finishedBooks.length,
      readingBooks: readingBooks.length,
      totalPages,
      totalReadingTime,
      avgRating,
      topGenres,
      streak,
      booksThisYear,
      goalProgress: Math.min((booksThisYear / (profile.reading_goal || 24)) * 100, 100)
    };
  }, [books, profile.reading_goal]);

  const achievements = useMemo(() => [
    { id: 1, name: 'First Steps', description: 'Add your first book', icon: BookOpen, unlocked: books.length >= 1, color: '#14b8a6' },
    { id: 2, name: 'Bookworm', description: 'Finish 5 books', icon: Trophy, unlocked: stats.finishedBooks >= 5, color: '#f97316' },
    { id: 3, name: 'Library Builder', description: 'Have 20+ books', icon: Library, unlocked: books.length >= 20, color: '#8b5cf6' },
    { id: 4, name: 'Speed Reader', description: 'Read for 10+ hours', icon: Zap, unlocked: stats.totalReadingTime >= 600, color: '#eab308' },
    { id: 5, name: 'Dedicated', description: '7-day reading streak', icon: Flame, unlocked: stats.streak >= 7, color: '#ef4444' },
    { id: 6, name: 'Critic', description: 'Rate 10+ books', icon: Star, unlocked: books.filter(b => b.personalRating && b.personalRating > 0).length >= 10, color: '#f59e0b' },
    { id: 7, name: 'Goal Crusher', description: 'Complete yearly goal', icon: Target, unlocked: stats.goalProgress >= 100, color: '#22c55e' },
    { id: 8, name: 'Avid Reader', description: 'Finish 25 books', icon: Award, unlocked: stats.finishedBooks >= 25, color: '#6366f1' },
  ], [books, stats]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const genreChartData = stats.topGenres.map(([name, value], index) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    value,
    fill: ['#14b8a6', '#f97316', '#8b5cf6', '#eab308', '#ef4444'][index]
  }));

  const readingTimeLabel = useMemo(() => {
    const times: Record<string, { emoji: string; label: string }> = {
      morning: { emoji: '🌅', label: 'Morning Person' },
      afternoon: { emoji: '☀️', label: 'Afternoon Reader' },
      evening: { emoji: '🌆', label: 'Evening Wind-down' },
      night: { emoji: '🌙', label: 'Night Owl' }
    };
    return times[profile.preferred_reading_time] || times.evening;
  }, [profile.preferred_reading_time]);

  const genreOptions = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy',
    'Biography', 'History', 'Self-Help', 'Business', 'Psychology', 'Philosophy',
    'Thriller', 'Adventure', 'Horror', 'Poetry', 'Drama', 'Comedy'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl glass-card">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute top-0 right-0 w-80 h-80 blob-1 opacity-30" />
        <div className="absolute bottom-0 left-0 w-60 h-60 blob-2 opacity-20" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-gray-800">
                <span className="text-5xl font-bold text-white">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editedProfile.username}
                      onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      placeholder="Tell us about your reading journey..."
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} className="gradient-primary text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => { setIsEditing(false); setEditedProfile(profile); }}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                    <h1 className="text-4xl lg:text-5xl font-bold gradient-text-mixed">
                      {profile.username || currentUser}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="rounded-full hover:bg-primary/10"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-muted-foreground mb-4">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email || userEmail}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member since 2024
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary">
                      {readingTimeLabel.emoji} {readingTimeLabel.label}
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-foreground/80 max-w-2xl flex items-start gap-2">
                      <Quote className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      {profile.bio}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-4">
              <div className="glass p-4 rounded-2xl text-center min-w-[100px]">
                <div className="text-3xl font-bold gradient-text">{stats.totalBooks}</div>
                <div className="text-xs text-muted-foreground">Books</div>
              </div>
              <div className="glass p-4 rounded-2xl text-center min-w-[100px]">
                <div className="text-3xl font-bold gradient-text-coral">{stats.finishedBooks}</div>
                <div className="text-xs text-muted-foreground">Finished</div>
              </div>
              <div className="glass p-4 rounded-2xl text-center min-w-[100px]">
                <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-secondary" />
                  {stats.streak}
                </div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Total Pages', value: stats.totalPages.toLocaleString(), color: 'primary' },
          { icon: Clock, label: 'Reading Time', value: `${Math.floor(stats.totalReadingTime / 60)}h`, color: 'secondary' },
          { icon: Star, label: 'Avg Rating', value: stats.avgRating.toFixed(1), color: 'warning' },
          { icon: Trophy, label: 'Achievements', value: `${unlockedCount}/${achievements.length}`, color: 'success' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`glass-card p-6 rounded-2xl hover-lift stagger-${index + 1}`}
          >
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reading Goal + Genre Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Annual Goal */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {new Date().getFullYear()} Reading Goal
            </h3>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditedProfile({ ...editedProfile, reading_goal: Math.max(1, editedProfile.reading_goal - 1) })}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  -
                </button>
                <span className="font-bold text-lg w-8 text-center">{editedProfile.reading_goal}</span>
                <button
                  onClick={() => setEditedProfile({ ...editedProfile, reading_goal: editedProfile.reading_goal + 1 })}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  +
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {stats.booksThisYear}/{profile.reading_goal} books
              </span>
            )}
          </div>

          <div className="relative">
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#goalGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.goalProgress / 100) * 553} 553`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(174, 72%, 40%)" />
                      <stop offset="100%" stopColor="hsl(12, 85%, 62%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{Math.round(stats.goalProgress)}%</span>
                  <span className="text-sm text-muted-foreground">Complete</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {stats.booksThisYear >= profile.reading_goal ? (
              <span className="text-success font-medium">🎉 Goal achieved! Amazing work!</span>
            ) : (
              <span>{profile.reading_goal - stats.booksThisYear} books to go</span>
            )}
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            Favorite Genres
          </h3>

          {genreChartData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genreChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {genreChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-sm text-muted-foreground">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Add books to see your genre distribution
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preferred Genres (Editable) */}
      {isEditing && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-secondary" />
            Preferred Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  const newGenres = editedProfile.favorite_genres.includes(genre)
                    ? editedProfile.favorite_genres.filter(g => g !== genre)
                    : [...editedProfile.favorite_genres, genre];
                  setEditedProfile({ ...editedProfile, favorite_genres: newGenres });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  editedProfile.favorite_genres.includes(genre)
                    ? 'gradient-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-primary" />
          Achievements
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {unlockedCount} of {achievements.length} unlocked
          </span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? 'border-transparent bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-800/30 shadow-lg'
                  : 'border-dashed border-muted bg-muted/30 opacity-60'
              }`}
            >
              {achievement.unlocked && (
                <div 
                  className="absolute inset-0 rounded-xl opacity-20"
                  style={{ background: `linear-gradient(135deg, ${achievement.color}40, transparent)` }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                    achievement.unlocked ? 'shadow-lg' : ''
                  }`}
                  style={{ 
                    background: achievement.unlocked 
                      ? `linear-gradient(135deg, ${achievement.color}, ${achievement.color}cc)`
                      : 'hsl(var(--muted))'
                  }}
                >
                  <achievement.icon className={`w-7 h-7 ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <h4 className="font-semibold text-sm">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reading Preferences Summary */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          Reading Insights
        </h3>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-4xl mb-2">📖</div>
            <p className="text-2xl font-bold">{Math.round(stats.totalPages / Math.max(stats.finishedBooks, 1))}</p>
            <p className="text-sm text-muted-foreground">Avg Pages/Book</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-4xl mb-2">⏱️</div>
            <p className="text-2xl font-bold">{Math.round(stats.totalReadingTime / Math.max(stats.finishedBooks, 1))}</p>
            <p className="text-sm text-muted-foreground">Avg Mins/Book</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-2xl font-bold">{stats.readingBooks}</p>
            <p className="text-sm text-muted-foreground">Currently Reading</p>
          </div>
        </div>
      </div>
    </div>
  );
};
