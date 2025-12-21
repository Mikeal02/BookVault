
import { useState } from 'react';
import { X, BookOpen, Target, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingModalProps {
  onComplete: (preferences: UserPreferences) => void;
  onSkip: () => void;
}

interface UserPreferences {
  favoriteGenres: string[];
  readingGoal: number;
  preferredReadingTime: string;
}

export const OnboardingModal = ({ onComplete, onSkip }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteGenres: [],
    readingGoal: 12,
    preferredReadingTime: 'evening'
  });

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy',
    'Biography', 'History', 'Self-Help', 'Business', 'Psychology', 'Philosophy',
    'Thriller', 'Adventure', 'Horror', 'Poetry', 'Drama', 'Comedy'
  ];

  const readingTimes = [
    { value: 'morning', label: 'Morning Person', emoji: '🌅' },
    { value: 'afternoon', label: 'Afternoon Reader', emoji: '☀️' },
    { value: 'evening', label: 'Evening Wind-down', emoji: '🌆' },
    { value: 'night', label: 'Night Owl', emoji: '🌙' }
  ];

  const steps = [
    {
      title: 'Welcome to BookVault! 📚',
      description: 'Your personal reading sanctuary awaits. Let\'s customize your experience to help you discover amazing books.',
      content: (
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Track your reading journey, discover new books, and achieve your reading goals.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track Books</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set Goals</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get Recommendations</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'What genres do you love? 📚',
      description: 'Select your favorite genres to get personalized book recommendations tailored just for you.',
      content: (
        <div className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  const newGenres = preferences.favoriteGenres.includes(genre)
                    ? preferences.favoriteGenres.filter(g => g !== genre)
                    : [...preferences.favoriteGenres, genre];
                  setPreferences({ ...preferences, favoriteGenres: newGenres });
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  preferences.favoriteGenres.includes(genre)
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          {preferences.favoriteGenres.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Selected: {preferences.favoriteGenres.length} genre{preferences.favoriteGenres.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Set your reading goal 🎯',
      description: 'How many books would you like to read this year? You can always adjust this later.',
      content: (
        <div className="py-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => setPreferences({ ...preferences, readingGoal: Math.max(1, preferences.readingGoal - 1) })}
              className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xl font-bold"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 min-w-[120px]">
                {preferences.readingGoal}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Books this year
              </p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, readingGoal: Math.min(100, preferences.readingGoal + 1) })}
              className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xl font-bold"
            >
              +
            </button>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Tip: Start with a realistic goal. You can always increase it as you build your reading habit!
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'When do you prefer to read? 🕐',
      description: 'This helps us send you reading reminders at the perfect time for you.',
      content: (
        <div className="space-y-3 py-4">
          {readingTimes.map((time) => (
            <button
              key={time.value}
              onClick={() => setPreferences({ ...preferences, preferredReadingTime: time.value })}
              className={`w-full p-4 rounded-lg text-left transition-all duration-200 hover:scale-102 ${
                preferences.preferredReadingTime === time.value
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{time.emoji}</span>
                <div>
                  <div className="font-medium">{time.label}</div>
                  <div className="text-sm opacity-75">
                    {time.value === 'morning' && 'Start your day with a good book'}
                    {time.value === 'afternoon' && 'Perfect lunch break reading'}
                    {time.value === 'evening' && 'Unwind with your favorite stories'}
                    {time.value === 'night' && 'Late night page-turner sessions'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(preferences);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return preferences.favoriteGenres.length > 0;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {steps[currentStep].title}
            </h2>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-purple-500' : 
                    index < currentStep ? 'bg-purple-300' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {steps[currentStep].description}
          </p>
          {steps[currentStep].content}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={onSkip}>
              Skip Setup
            </Button>
          </div>
          <Button 
            onClick={nextStep} 
            disabled={!canProceed()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next Step'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
