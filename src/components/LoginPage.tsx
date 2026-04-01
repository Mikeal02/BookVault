
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, User, BookOpen, Mail, Lock, Eye, EyeOff, Sparkles, Library, Star, ArrowRight, Quote, TrendingUp, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface LoginPageProps {
  onLogin: () => void;
}

const floatingElements = [
  { icon: BookOpen, className: 'top-[8%] left-[4%]', size: 'w-20 h-20', delay: 0, duration: 12, yRange: 12 },
  { icon: Book, className: 'top-[18%] right-[6%]', size: 'w-14 h-14', delay: 2, duration: 14, yRange: 10 },
  { icon: Library, className: 'bottom-[12%] right-[8%]', size: 'w-28 h-28', delay: 3, duration: 16, yRange: 14 },
  { icon: Sparkles, className: 'top-[50%] left-[2%]', size: 'w-12 h-12', delay: 1, duration: 10, yRange: 8 },
  { icon: Star, className: 'bottom-[8%] left-[15%]', size: 'w-10 h-10', delay: 4, duration: 11, yRange: 6 },
  { icon: Quote, className: 'top-[70%] right-[3%]', size: 'w-8 h-8', delay: 5, duration: 13, yRange: 10 },
];

const quotes = [
  { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
];

const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-muted/10 border border-border/40 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-muted/15 transition-all duration-300 text-foreground placeholder-muted-foreground/35 text-sm outline-none";

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } },
};

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(i => (i + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) toast.error(error.message || 'Failed to sign in with Google');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Layered animated backgrounds */}
      <div className="absolute inset-0 mesh-gradient-animate" />
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="aurora-container">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>

      {/* Radial spotlight effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_70%)]" />

      {/* Floating elements with parallax-like depth */}
      {floatingElements.map(({ icon: Icon, className, size, delay, duration, yRange }, i) => (
        <motion.div
          key={i}
          className={`absolute ${className} opacity-[0.035]`}
          animate={{
            y: [-yRange, yRange, -yRange],
            rotate: [-4, 4, -4],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          <Icon className={`${size} text-primary`} />
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[460px]">
          {/* Brand header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="flex justify-center mb-5"
              initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: 'backOut' }}
            >
              <div className="relative group cursor-pointer">
                {/* Multi-layer glow */}
                <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-primary/12 via-secondary/6 to-primary/12 blur-3xl animate-pulse-soft" />
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/12 blur-xl transition-all duration-700 group-hover:blur-2xl group-hover:from-primary/30 group-hover:to-secondary/20" />
                <motion.div
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl p-4 sm:p-5 logo-glow ring-1 ring-white/10"
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain drop-shadow-lg" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl font-display font-bold mb-1.5 gradient-text-mixed glow-text"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              BookVault
            </motion.h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={isSignUp ? 'signup' : 'signin'}
                className="text-muted-foreground/55 text-sm tracking-wide font-medium"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                {isSignUp ? 'Create your reading sanctuary' : 'Welcome back, reader'}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Main card with layered glassmorphism */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ambient card glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/15 via-border/30 to-secondary/10 blur-[0.5px]" />

            <div className="relative frosted-panel rounded-2xl p-6 sm:p-8 border border-border/30 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)]">
              {/* Google sign-in */}
              <motion.div variants={stagger.item} initial="initial" animate="animate">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 mb-5 flex items-center justify-center gap-2.5 border-border/50 hover:bg-muted/30 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-sm h-auto rounded-xl group active:scale-[0.98]"
                >
                  {isGoogleLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground/20 border-t-foreground" />
                  ) : (
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span className="font-semibold">Continue with Google</span>
                </Button>
              </motion.div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-3 bg-card text-muted-foreground/40 uppercase tracking-[0.2em] font-medium">or with email</span>
                </div>
              </div>

              {/* Form with staggered fields */}
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-3.5"
                variants={stagger.container}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div
                      key="username-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-3.5">
                        <label htmlFor="username" className="block text-[10px] font-semibold text-muted-foreground/50 mb-1.5 uppercase tracking-[0.15em]">
                          Your Name
                        </label>
                        <div className={`relative group rounded-xl transition-shadow duration-300 ${focusedField === 'username' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]' : ''}`}>
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 w-4 h-4 group-focus-within:text-primary transition-colors duration-300" />
                          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)}
                            className={inputClasses}
                            placeholder="Enter your name" autoComplete="name" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={stagger.item}>
                  <label htmlFor="email" className="block text-[10px] font-semibold text-muted-foreground/50 mb-1.5 uppercase tracking-[0.15em]">
                    Email Address
                  </label>
                  <div className={`relative group rounded-xl transition-shadow duration-300 ${focusedField === 'email' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]' : ''}`}>
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 w-4 h-4 group-focus-within:text-primary transition-colors duration-300" />
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      className={inputClasses}
                      placeholder="you@example.com" required autoComplete="email" />
                  </div>
                </motion.div>

                <motion.div variants={stagger.item}>
                  <label htmlFor="password" className="block text-[10px] font-semibold text-muted-foreground/50 mb-1.5 uppercase tracking-[0.15em]">
                    Password
                  </label>
                  <div className={`relative group rounded-xl transition-shadow duration-300 ${focusedField === 'password' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]' : ''}`}>
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 w-4 h-4 group-focus-within:text-primary transition-colors duration-300" />
                    <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                      className={`${inputClasses} !pr-11`}
                      placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                      required autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground/70 transition-colors duration-200 p-0.5">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={stagger.item} className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm gradient-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 press-depth flex items-center justify-center gap-2 group"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.975 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current/20 border-t-current" />
                        {isSignUp ? 'Creating Account...' : 'Signing in...'}
                      </div>
                    ) : (
                      <>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>

              {/* Toggle */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-muted-foreground/45 text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    onClick={toggleMode}
                    className="ml-1.5 text-primary hover:text-primary/80 font-bold transition-colors duration-200 animated-underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Rotating quote */}
          <motion.div
            className="mt-8 text-center max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="space-y-1"
              >
                <p className="text-[12px] text-muted-foreground/30 italic leading-relaxed">
                  "{quotes[quoteIndex].text}"
                </p>
                <p className="text-[10px] text-muted-foreground/20 font-medium tracking-wide">
                  — {quotes[quoteIndex].author}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {[
              { icon: Shield, label: 'Secure' },
              { icon: TrendingUp, label: 'Track Progress' },
              { icon: Sparkles, label: 'AI Powered' },
            ].map((feat, i) => (
              <motion.span
                key={feat.label}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 font-medium tracking-wide uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <feat.icon className="w-3 h-3" />
                {feat.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
