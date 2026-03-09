
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, User, BookOpen, Mail, Lock, Eye, EyeOff, Sparkles, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) toast.error(error.message || 'Failed to sign in with Google');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) { toast.error('Please enter your name'); setIsLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { username: username.trim() } }
        });
        if (error) {
          toast.error(error.message.includes('already registered') ? 'This email is already registered. Please sign in instead.' : error.message);
          return;
        }
        if (data.user) {
          await supabase.from('profiles').upsert({ user_id: data.user.id, username: username.trim(), email: email.trim() });
          toast.success('Account created successfully!');
          onLogin();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
          return;
        }
        if (data.user) { toast.success('Welcome back!'); onLogin(); }
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Premium animated mesh background */}
      <div className="absolute inset-0 mesh-gradient-animate" />
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="aurora-container">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>
      
      {/* Floating book decorations — staggered depths */}
      <motion.div
        className="absolute top-[12%] left-[6%] opacity-[0.05]"
        animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <BookOpen className="w-28 h-28 text-primary" />
      </motion.div>
      <motion.div
        className="absolute top-[25%] right-[6%] opacity-[0.04]"
        animate={{ y: [6, -6, 6], rotate: [2, -2, 2] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <Book className="w-20 h-20 text-secondary" />
      </motion.div>
      <motion.div
        className="absolute bottom-[18%] right-[12%] opacity-[0.04]"
        animate={{ y: [8, -8, 8], rotate: [3, -3, 3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <Library className="w-36 h-36 text-secondary" />
      </motion.div>
      <motion.div
        className="absolute top-[58%] left-[4%] opacity-[0.03]"
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Sparkles className="w-16 h-16 text-primary" />
      </motion.div>
      <motion.div
        className="absolute bottom-[8%] left-[20%] opacity-[0.03]"
        animate={{ y: [-4, 4, -4], x: [-3, 3, -3] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <Star className="w-12 h-12 text-highlight" />
      </motion.div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand */}
          <div className="text-center mb-10">
            <motion.div
              className="flex justify-center mb-7"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "backOut" }}
            >
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/8 to-primary/15 blur-2xl animate-pulse-soft" />
                {/* Inner glow ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 blur-md" />
                <div className="relative w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl p-4 logo-glow">
                  <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              </div>
            </motion.div>
            <motion.h1
              className="text-4xl sm:text-5xl font-display font-bold mb-2 gradient-text-mixed glow-text"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              BookVault
            </motion.h1>
            <motion.p
              className="text-muted-foreground/60 text-sm tracking-wide font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {isSignUp ? 'Create your reading sanctuary' : 'Welcome back, reader'}
            </motion.p>
          </div>

          {/* Card with gradient border */}
          <motion.div
            className="gradient-border rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="frosted-panel rounded-2xl p-7 sm:p-8">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3.5 mb-6 flex items-center justify-center gap-2.5 border-border hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 text-sm h-auto rounded-xl"
              >
                {isGoogleLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span className="font-semibold">Continue with Google</span>
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full luxury-divider"></div>
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-4 bg-card text-muted-foreground/60 uppercase tracking-wider font-medium">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="username" className="block text-[10px] font-semibold text-muted-foreground/70 mb-2 uppercase tracking-widest">
                      Your Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors duration-200" />
                      <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-muted/15 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary/40 focus:bg-muted/25 transition-all duration-300 text-foreground placeholder-muted-foreground/40 text-sm"
                        placeholder="Enter your name" autoComplete="name" />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[10px] font-semibold text-muted-foreground/70 mb-2 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors duration-200" />
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-muted/15 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary/40 focus:bg-muted/25 transition-all duration-300 text-foreground placeholder-muted-foreground/40 text-sm"
                      placeholder="you@example.com" required autoComplete="email" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[10px] font-semibold text-muted-foreground/70 mb-2 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors duration-200" />
                    <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-muted/15 border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary/40 focus:bg-muted/25 transition-all duration-300 text-foreground placeholder-muted-foreground/40 text-sm"
                      placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                      required autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm gradient-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl press-depth">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing in...'}
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-7 text-center">
                <p className="text-muted-foreground/60 text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setEmail(''); setPassword(''); setUsername(''); }}
                    className="ml-2 text-primary hover:text-primary/80 font-bold transition-colors animated-underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer features — premium pill badges */}
          <motion.div
            className="mt-10 flex items-center justify-center gap-3 flex-wrap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              { icon: Book, label: 'Search Books' },
              { icon: BookOpen, label: 'Track Progress' },
              { icon: Sparkles, label: 'AI Insights' },
            ].map((feat, i) => (
              <motion.span
                key={feat.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30 text-[11px] text-muted-foreground/50 font-medium backdrop-blur-sm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <feat.icon className="w-3 h-3" />
                {feat.label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
