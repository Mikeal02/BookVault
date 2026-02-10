import { useState, useMemo } from 'react';
import { 
  Trophy, Target, Flame, Zap, BookOpen, Clock, Star, 
  Award, Shield, Crown, Gem, Heart, Sparkles, ChevronRight,
  Lock, CheckCircle2, TrendingUp, Calendar
} from 'lucide-react';
import { Book } from '@/types/book';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingChallengesProps {
  books: Book[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: any;
  target: number;
  current: number;
  unit: string;
  category: 'reading' | 'collection' | 'social' | 'mastery';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  unlocked: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  earned: boolean;
  earnedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ReadingChallenges = ({ books }: ReadingChallengesProps) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'badges' | 'leaderboard'>('challenges');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reading' | 'collection' | 'social' | 'mastery'>('all');

  const stats = useMemo(() => {
    const finished = books.filter(b => b.readingStatus === 'finished');
    const reading = books.filter(b => b.readingStatus === 'reading');
    const totalPages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0);
    const totalTime = books.reduce((sum, b) => sum + (b.timeSpentReading || 0), 0);
    const rated = books.filter(b => b.personalRating && b.personalRating > 0);
    const tagged = books.filter(b => b.tags && b.tags.length > 0);
    const withNotes = books.filter(b => b.notes || b.myThoughts);
    const genres = new Set(books.flatMap(b => b.categories || []));
    const authors = new Set(books.flatMap(b => b.authors || []));

    return { finished, reading, totalPages, totalTime, rated, tagged, withNotes, genres, authors, total: books.length };
  }, [books]);

  const challenges: Challenge[] = useMemo(() => [
    // Reading challenges
    { id: 'read-1', title: 'First Chapter', description: 'Finish your first book', icon: BookOpen, target: 1, current: stats.finished.length, unit: 'books', category: 'reading', tier: 'bronze', xpReward: 50, unlocked: stats.finished.length >= 1 },
    { id: 'read-5', title: 'Dedicated Reader', description: 'Finish 5 books', icon: BookOpen, target: 5, current: stats.finished.length, unit: 'books', category: 'reading', tier: 'silver', xpReward: 150, unlocked: stats.finished.length >= 5 },
    { id: 'read-10', title: 'Book Enthusiast', description: 'Finish 10 books', icon: Trophy, target: 10, current: stats.finished.length, unit: 'books', category: 'reading', tier: 'gold', xpReward: 300, unlocked: stats.finished.length >= 10 },
    { id: 'read-25', title: 'Literary Champion', description: 'Finish 25 books', icon: Crown, target: 25, current: stats.finished.length, unit: 'books', category: 'reading', tier: 'platinum', xpReward: 750, unlocked: stats.finished.length >= 25 },
    { id: 'pages-1000', title: 'Page Turner', description: 'Read 1,000 pages total', icon: Target, target: 1000, current: stats.totalPages, unit: 'pages', category: 'reading', tier: 'bronze', xpReward: 100, unlocked: stats.totalPages >= 1000 },
    { id: 'pages-5000', title: 'Marathon Reader', description: 'Read 5,000 pages total', icon: Flame, target: 5000, current: stats.totalPages, unit: 'pages', category: 'reading', tier: 'silver', xpReward: 250, unlocked: stats.totalPages >= 5000 },
    { id: 'time-300', title: 'Bookworm', description: 'Read for 5 hours total', icon: Clock, target: 300, current: stats.totalTime, unit: 'min', category: 'reading', tier: 'bronze', xpReward: 100, unlocked: stats.totalTime >= 300 },
    { id: 'time-1200', title: 'Reading Monk', description: 'Read for 20 hours total', icon: Shield, target: 1200, current: stats.totalTime, unit: 'min', category: 'reading', tier: 'gold', xpReward: 400, unlocked: stats.totalTime >= 1200 },
    // Collection challenges
    { id: 'collect-10', title: 'Collector', description: 'Add 10 books to library', icon: BookOpen, target: 10, current: stats.total, unit: 'books', category: 'collection', tier: 'bronze', xpReward: 75, unlocked: stats.total >= 10 },
    { id: 'collect-50', title: 'Bibliophile', description: 'Add 50 books to library', icon: Gem, target: 50, current: stats.total, unit: 'books', category: 'collection', tier: 'gold', xpReward: 350, unlocked: stats.total >= 50 },
    { id: 'genres-5', title: 'Genre Explorer', description: 'Read across 5 genres', icon: Sparkles, target: 5, current: stats.genres.size, unit: 'genres', category: 'collection', tier: 'silver', xpReward: 200, unlocked: stats.genres.size >= 5 },
    { id: 'authors-10', title: 'Author Connoisseur', description: 'Read 10 different authors', icon: Star, target: 10, current: stats.authors.size, unit: 'authors', category: 'collection', tier: 'silver', xpReward: 200, unlocked: stats.authors.size >= 10 },
    // Mastery challenges
    { id: 'rate-5', title: 'Critic', description: 'Rate 5 books', icon: Star, target: 5, current: stats.rated.length, unit: 'books', category: 'mastery', tier: 'bronze', xpReward: 75, unlocked: stats.rated.length >= 5 },
    { id: 'tag-10', title: 'Organizer', description: 'Tag 10 books', icon: Award, target: 10, current: stats.tagged.length, unit: 'books', category: 'mastery', tier: 'silver', xpReward: 150, unlocked: stats.tagged.length >= 10 },
    { id: 'notes-5', title: 'Thoughtful Reader', description: 'Write notes on 5 books', icon: Heart, target: 5, current: stats.withNotes.length, unit: 'books', category: 'mastery', tier: 'bronze', xpReward: 100, unlocked: stats.withNotes.length >= 5 },
    { id: 'multi-read', title: 'Multitasker', description: 'Read 3 books simultaneously', icon: Zap, target: 3, current: stats.reading.length, unit: 'books', category: 'mastery', tier: 'gold', xpReward: 250, unlocked: stats.reading.length >= 3 },
  ], [stats]);

  const badges: Badge[] = useMemo(() => [
    { id: 'newcomer', name: 'Newcomer', description: 'Welcome to BookVault!', icon: Star, color: '#14b8a6', earned: true, rarity: 'common' },
    { id: 'first-finish', name: 'First Finish', description: 'Completed your first book', icon: CheckCircle2, color: '#22c55e', earned: stats.finished.length >= 1, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Read 100 pages in a session', icon: Zap, color: '#eab308', earned: stats.totalTime > 60, rarity: 'rare' },
    { id: 'night-owl', name: 'Night Owl', description: 'Read past midnight', icon: Clock, color: '#6366f1', earned: stats.finished.length >= 3, rarity: 'rare' },
    { id: 'curator', name: 'Curator', description: 'Build a 20+ book library', icon: BookOpen, color: '#f97316', earned: stats.total >= 20, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Read across 8+ genres', icon: Award, color: '#ef4444', earned: stats.genres.size >= 8, rarity: 'epic' },
    { id: 'legend', name: 'Legend', description: 'Finish 50 books', icon: Crown, color: '#f59e0b', earned: stats.finished.length >= 50, rarity: 'legendary' },
    { id: 'perfectionist', name: 'Perfectionist', description: 'Rate all finished books', icon: Gem, color: '#ec4899', earned: stats.finished.length > 0 && stats.rated.length >= stats.finished.length, rarity: 'legendary' },
  ], [stats]);

  const totalXP = challenges.filter(c => c.unlocked).reduce((sum, c) => sum + c.xpReward, 0);
  const level = Math.floor(totalXP / 200) + 1;
  const xpToNextLevel = 200 - (totalXP % 200);
  const levelProgress = ((totalXP % 200) / 200) * 100;

  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  const tierColors = {
    bronze: 'from-amber-700 to-amber-500',
    silver: 'from-gray-400 to-gray-300',
    gold: 'from-yellow-500 to-amber-400',
    platinum: 'from-cyan-400 to-teal-300',
  };

  const rarityColors = {
    common: 'border-muted-foreground/30',
    rare: 'border-primary/50',
    epic: 'border-secondary/50',
    legendary: 'border-warning/50',
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-primary/20',
    epic: 'shadow-secondary/20',
    legendary: 'shadow-warning/30 animate-glow-coral',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section with Level */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 blob-1 opacity-40" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text-mixed mb-2">
              Reading Challenges
            </h2>
            <p className="text-muted-foreground">
              Complete challenges, earn XP, and unlock badges
            </p>
          </div>

          {/* Level Badge */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary-foreground">{level}</span>
                  <p className="text-[10px] text-primary-foreground/80 uppercase tracking-wider">Level</p>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-warning text-warning-foreground text-xs font-bold shadow-lg">
                {totalXP} XP
              </div>
            </div>
            <div className="w-48">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Level {level}</span>
                <span>Level {level + 1}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{xpToNextLevel} XP to next level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { id: 'challenges' as const, label: 'Challenges', icon: Target },
          { id: 'badges' as const, label: 'Badges', icon: Award },
          { id: 'leaderboard' as const, label: 'Stats', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'reading' as const, label: '📖 Reading' },
                { id: 'collection' as const, label: '📚 Collection' },
                { id: 'mastery' as const, label: '🏆 Mastery' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'gradient-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Challenge Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredChallenges.map((challenge, index) => {
                const progress = Math.min((challenge.current / challenge.target) * 100, 100);
                const Icon = challenge.icon;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-2xl p-5 transition-all hover-lift ${
                      challenge.unlocked ? 'ring-2 ring-success/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierColors[challenge.tier]} flex items-center justify-center shadow-lg`}>
                          {challenge.unlocked ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : (
                            <Icon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{challenge.title}</h4>
                          <p className="text-xs text-muted-foreground">{challenge.description}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        challenge.unlocked
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        +{challenge.xpReward} XP
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {Math.min(challenge.current, challenge.target)}/{challenge.target} {challenge.unit}
                        </span>
                        <span className="font-medium text-foreground">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${challenge.unlocked ? 'bg-success' : 'gradient-primary'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                    className={`glass-card rounded-2xl p-5 text-center transition-all hover-lift border-2 ${rarityColors[badge.rarity]} ${
                      badge.earned ? rarityGlow[badge.rarity] : 'opacity-50 grayscale'
                    }`}
                  >
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg"
                      style={{ backgroundColor: badge.earned ? badge.color + '20' : undefined }}
                    >
                      {badge.earned ? (
                        <Icon className="w-8 h-8" style={{ color: badge.color }} />
                      ) : (
                        <Lock className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm">{badge.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">{badge.description}</p>
                    <span className={`inline-block mt-2 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      badge.rarity === 'legendary' ? 'bg-warning/20 text-warning' :
                      badge.rarity === 'epic' ? 'bg-secondary/20 text-secondary' :
                      badge.rarity === 'rare' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {badge.rarity}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Challenges Done', value: challenges.filter(c => c.unlocked).length, total: challenges.length, icon: Target, color: 'primary' },
                { label: 'Badges Earned', value: badges.filter(b => b.earned).length, total: badges.length, icon: Award, color: 'secondary' },
                { label: 'Total XP', value: totalXP, total: null, icon: Zap, color: 'warning' },
                { label: 'Current Level', value: level, total: null, icon: Crown, color: 'success' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">
                    {stat.value}{stat.total !== null ? `/${stat.total}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Milestones Timeline */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                Milestone Timeline
              </h3>
              <div className="space-y-4">
                {challenges.filter(c => c.unlocked).slice(0, 8).map((challenge, i) => (
                  <div key={challenge.id} className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full gradient-primary flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <challenge.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{challenge.title}</span>
                      </div>
                      <span className="text-xs text-success font-bold">+{challenge.xpReward} XP</span>
                    </div>
                  </div>
                ))}
                {challenges.filter(c => c.unlocked).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Complete challenges to see your milestones here!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
