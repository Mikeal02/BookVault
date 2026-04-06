
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ArrowLeft, BookOpen, Fingerprint } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface LoginPageProps {
  onLogin: () => void;
  onBackToLanding?: () => void;
}

const quotes = [
  { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
];

export const LoginPage = ({ onLogin, onBackToLanding }: LoginPageProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'password'>('email');

  // Mouse parallax for background orbs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const orbX1 = useTransform(mouseX, [0, 1], [-15, 15]);
  const orbY1 = useTransform(mouseY, [0, 1], [-15, 15]);
  const orbX2 = useTransform(mouseX, [0, 1], [10, -10]);
  const orbY2 = useTransform(mouseY, [0, 1], [10, -10]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex(i => (i + 1) % quotes.length), 6000);
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
    
    // Multi-step: first validate email, then proceed to password
    if (step === 'email') {
      if (!email.trim()) { toast.error('Please enter your email'); return; }
      setStep('password');
      return;
    }

    if (!password.trim()) { toast.error('Please enter your password'); return; }
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
    setStep('email');
  };

  const inputClasses = "w-full pl-11 pr-4 py-4 bg-background/50 border border-border/30 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background/80 transition-all duration-400 text-foreground placeholder-muted-foreground/30 text-sm outline-none backdrop-blur-sm";

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-background flex">
      {/* Left panel — Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 mesh-gradient-animate" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        {/* Parallax orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px]"
          style={{ x: orbX1, y: orbY1, top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-secondary/8 blur-[80px]"
          style={{ x: orbX2, y: orbY2, bottom: '10%', right: '10%' }}
        />

        <div className="absolute inset-0 dot-grid opacity-[0.03]" />

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-primary/15 blur-xl animate-pulse-soft" />
                <div className="relative w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center p-3 shadow-2xl logo-glow ring-1 ring-white/10">
                  <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold gradient-text-mixed">BookVault</h1>
                <p className="text-xs text-muted-foreground/40 tracking-widest uppercase font-medium">Reading Sanctuary</p>
              </div>
            </div>

            {/* Rotating quote */}
            <div className="mb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="border-l-2 border-primary/30 pl-6">
                    <p className="text-lg font-display italic text-foreground/60 leading-relaxed mb-3">
                      "{quotes[quoteIndex].text}"
                    </p>
                    <p className="text-sm text-muted-foreground/40 font-medium">
                      — {quotes[quoteIndex].author}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Trust points */}
            <div className="space-y-3">
              {[
                { icon: Sparkles, text: 'AI-powered reading insights' },
                { icon: BookOpen, text: 'Track unlimited books & sessions' },
                { icon: Fingerprint, text: 'Secure & private by default' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-3 text-muted-foreground/40"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary/60" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        
        {/* Mobile parallax orbs */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] lg:hidden"
          style={{ x: orbX1, y: orbY1, top: '5%', right: '-10%' }}
        />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Back button (if coming from landing) */}
          {onBackToLanding && (
            <motion.button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-sm text-muted-foreground/40 hover:text-foreground mb-8 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </motion.button>
          )}

          {/* Mobile logo */}
          <motion.div
            className="lg:hidden flex items-center gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center p-2.5 shadow-lg logo-glow">
              <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text-mixed">BookVault</h1>
              <p className="text-[10px] text-muted-foreground/30 tracking-widest uppercase">Reading Sanctuary</p>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-sm text-muted-foreground/50">
                  {isSignUp ? 'Start your reading journey today' : 'Sign in to continue your reading journey'}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Google */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-4 flex items-center justify-center gap-3 border-border/30 hover:bg-muted/20 hover:border-primary/20 transition-all duration-300 text-sm h-auto rounded-2xl group"
            >
              {isGoogleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground/20 border-t-foreground" />
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span className="font-medium">Continue with Google</span>
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-background text-muted-foreground/30 uppercase tracking-[0.25em] font-medium">or</span>
            </div>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {isSignUp && (
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground/40 mb-2 tracking-wide">
                        Full Name
                      </label>
                      <div className={`relative group rounded-2xl transition-shadow duration-300 ${focusedField === 'username' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]' : ''}`}>
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/25 w-4 h-4 group-focus-within:text-primary/60 transition-colors" />
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)}
                          className={inputClasses} placeholder="Your name" autoComplete="name" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground/40 mb-2 tracking-wide">
                      Email Address
                    </label>
                    <div className={`relative group rounded-2xl transition-shadow duration-300 ${focusedField === 'email' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]' : ''}`}>
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/25 w-4 h-4 group-focus-within:text-primary/60 transition-colors" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                        className={inputClasses} placeholder="you@example.com" required autoComplete="email" autoFocus />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-sm gradient-primary text-primary-foreground shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="password-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Email preview */}
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/20 border border-border/20 text-left group hover:bg-muted/30 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-primary/50" />
                    <span className="text-sm text-foreground/70 flex-1 truncate">{email}</span>
                    <span className="text-[10px] text-muted-foreground/30 group-hover:text-primary/50 transition-colors">Change</span>
                  </button>

                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground/40 mb-2 tracking-wide">
                      Password
                    </label>
                    <div className={`relative group rounded-2xl transition-shadow duration-300 ${focusedField === 'password' ? 'shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]' : ''}`}>
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/25 w-4 h-4 group-focus-within:text-primary/60 transition-colors" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses} !pr-12`}
                        placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
                        required autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} autoFocus />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-foreground/50 transition-colors p-0.5">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-sm gradient-primary text-primary-foreground shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current/20 border-t-current" />
                        {isSignUp ? 'Creating...' : 'Signing in...'}
                      </div>
                    ) : (
                      <>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Toggle mode */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-muted-foreground/40 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button onClick={toggleMode} className="ml-1.5 text-primary hover:text-primary/80 font-semibold transition-colors">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </motion.div>

          {/* Mobile quote */}
          <motion.div
            className="lg:hidden mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground/25 italic"
              >
                "{quotes[quoteIndex].text}" — {quotes[quoteIndex].author}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
