
import { useState } from 'react';
import { Book, User, BookOpen, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username.trim()
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            username: username.trim(),
            email: email.trim()
          });
          
          toast.success('Account created successfully!');
          onLogin();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success('Welcome back!');
          onLogin();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="blob-1 -top-40 -right-40" />
      <div className="blob-2 -bottom-40 -left-40" />
      <div className="blob-3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-16 h-16 rounded-2xl gradient-primary opacity-20 animate-float" />
      <div className="absolute top-40 right-32 w-12 h-12 rounded-full gradient-secondary opacity-20 animate-float-delayed" />
      <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-3xl gradient-mixed opacity-15 animate-float" />
      <div className="absolute bottom-20 right-20 w-14 h-14 rounded-xl gradient-primary opacity-20 animate-float-delayed" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-float">
                  <Book className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="gradient-text-mixed">BookVault</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {isSignUp ? 'Create your reading sanctuary' : 'Welcome back, reader'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-in">
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder-muted-foreground"
                  placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg gradient-primary text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing in...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setUsername('');
                }}
                className="ml-2 text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Book className="w-4 h-4 text-primary" />
                </div>
                Search Books
              </span>
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-secondary" />
                </div>
                Track Progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
