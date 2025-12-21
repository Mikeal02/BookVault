
import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Book, Target, Flame, Trophy } from 'lucide-react';
import { Book as BookType } from '@/types/book';

interface EnhancedReadingCalendarProps {
  books: BookType[];
}

interface CalendarDay {
  date: Date;
  count: number;
  books: BookType[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const EnhancedReadingCalendar = ({ books }: EnhancedReadingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');

  const calendarData = useMemo(() => {
    if (viewMode === 'year') {
      return generateYearHeatmap(books);
    } else {
      return generateMonthCalendar(books, currentDate);
    }
  }, [books, currentDate, viewMode]);

  const stats = useMemo(() => {
    const finishedBooks = books.filter(book => book.readingStatus === 'finished');
    const totalDays = finishedBooks.length;
    const currentYear = new Date().getFullYear();
    const thisYearBooks = finishedBooks.filter(book => 
      book.dateFinished && new Date(book.dateFinished).getFullYear() === currentYear
    );
    
    return {
      totalReadingDays: totalDays,
      thisYearDays: thisYearBooks.length,
      currentStreak: calculateStreak(finishedBooks),
      longestStreak: calculateLongestStreak(finishedBooks)
    };
  }, [books]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
    if (count === 1) return 'bg-green-200 dark:bg-green-900/40 hover:bg-green-300 dark:hover:bg-green-800/60';
    if (count === 2) return 'bg-green-300 dark:bg-green-800/60 hover:bg-green-400 dark:hover:bg-green-700/80';
    if (count === 3) return 'bg-green-400 dark:bg-green-700/80 hover:bg-green-500 dark:hover:bg-green-600';
    return 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reading Activity</h3>
            <p className="text-gray-600 dark:text-gray-400">Track your daily reading habits</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === 'year'
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Month
            </button>
          </div>

          {/* Month Navigation (only for month view) */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Days</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalReadingDays}</p>
            </div>
            <Book className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">This Year</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.thisYearDays}</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.currentStreak}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Best Streak</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.longestStreak}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Calendar Display */}
      <div className="overflow-x-auto">
        {viewMode === 'year' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Less</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div key={level} className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`} />
                ))}
              </div>
              <span>More</span>
            </div>
            <div className="grid grid-cols-53 gap-1 min-w-max">
              {calendarData.map((day: any, index: number) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm transition-all duration-200 cursor-pointer ${getHeatmapColor(day.count)}`}
                  title={`${day.date}: ${day.count} books read`}
                />
              ))}
            </div>
          </div>
        ) : (
          <MonthlyCalendarView data={calendarData} getHeatmapColor={getHeatmapColor} />
        )}
      </div>
    </div>
  );
};

// Monthly Calendar Component
const MonthlyCalendarView = ({ data, getHeatmapColor }: any) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {data.map((day: CalendarDay, index: number) => (
          <div
            key={index}
            className={`aspect-square rounded-lg p-2 transition-all duration-200 cursor-pointer border ${
              day.isCurrentMonth 
                ? getHeatmapColor(day.count) + ' border-gray-200 dark:border-gray-700'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
            } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
            title={`${day.date.toDateString()}: ${day.count} books read`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {day.date.getDate()}
            </div>
            {day.count > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {day.count} book{day.count !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
const generateYearHeatmap = (books: BookType[]) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);

  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const count = books.filter(book => {
      if (!book.dateFinished) return false;
      const bookDate = new Date(book.dateFinished);
      return bookDate.toDateString() === date.toDateString();
    }).length;

    data.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }

  return data;
};

const generateMonthCalendar = (books: BookType[], currentDate: Date): CalendarDay[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: CalendarDay[] = [];
  const today = new Date();
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayBooks = books.filter(book => {
      if (!book.dateFinished) return false;
      const bookDate = new Date(book.dateFinished);
      return bookDate.toDateString() === date.toDateString();
    });
    
    days.push({
      date,
      count: dayBooks.length,
      books: dayBooks,
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  
  return days;
};

const calculateStreak = (books: BookType[]) => {
  const finishedDates = books
    .filter(book => book.dateFinished)
    .map(book => new Date(book.dateFinished!))
    .sort((a, b) => b.getTime() - a.getTime());

  if (finishedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < finishedDates.length; i++) {
    const daysDiff = Math.floor((today.getTime() - finishedDates[i].getTime()) / msPerDay);
    
    if (i === 0 && daysDiff <= 1) {
      streak = 1;
    } else if (i > 0) {
      const prevDaysDiff = Math.floor((today.getTime() - finishedDates[i-1].getTime()) / msPerDay);
      if (Math.abs(daysDiff - prevDaysDiff) <= 1) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
};

const calculateLongestStreak = (books: BookType[]) => {
  const finishedDates = books
    .filter(book => book.dateFinished)
    .map(book => new Date(book.dateFinished!))
    .sort((a, b) => a.getTime() - b.getTime());

  if (finishedDates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let i = 1; i < finishedDates.length; i++) {
    const daysDiff = Math.floor((finishedDates[i].getTime() - finishedDates[i-1].getTime()) / msPerDay);
    
    if (daysDiff <= 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(longestStreak, currentStreak);
};
