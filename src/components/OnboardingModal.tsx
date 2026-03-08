
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
          <div className="w-24 h-24 mx-auto mb-6 gradient-mixed rounded-full flex items-center justify-center shadow-lg">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg">
              Track your reading journey, discover new books, and achieve your reading goals.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
                <p className="text-sm text-muted-foreground">Track Books</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-secondary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-sm text-muted-foreground">Set Goals</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-sm text-muted-foreground">Get Recommendations</p>
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
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  preferences.favoriteGenres.includes(genre)
                    ? 'gradient-mixed text-white shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          {preferences.favoriteGenres.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-primary font-medium">
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
              className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-xl font-bold text-foreground"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-6xl font-bold gradient-text min-w-[120px]">
                {preferences.readingGoal}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Books this year
              </p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, readingGoal: Math.min(100, preferences.readingGoal + 1) })}
              className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-xl font-bold text-foreground"
            >
              +
            </button>
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <p className="text-sm text-primary">
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
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                preferences.preferredReadingTime === time.value
                  ? 'gradient-mixed text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in relative">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary z-10" />
        
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-foreground font-display">
              {steps[currentStep].title}
            </h2>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 
                    index < currentStep ? 'bg-primary/40' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-2 hover:bg-muted rounded-full transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-muted-foreground mb-6">
            {steps[currentStep].description}
          </p>
          {steps[currentStep].content}
        </div>

        <div className="p-6 border-t border-border flex justify-between">
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
            className="gradient-primary text-primary-foreground disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next Step'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
