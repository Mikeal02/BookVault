
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Shield, TrendingUp, Brain, Library, BarChart3, Zap, Star, ArrowRight, ChevronDown, Quote, Users, Globe, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onGetStarted: () => void;
}

const stats = [
  { value: '50K+', label: 'Books Tracked' },
  { value: '12K+', label: 'Active Readers' },
  { value: '4.9', label: 'App Rating', icon: Star },
  { value: '99.9%', label: 'Uptime' },
];

const features = [
  {
    icon: Library,
    title: 'Multi-Vault Library',
    description: 'Organize your books into separate vaults for work, study, and pleasure reading.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'AI Reading Coach',
    description: 'Get personalized recommendations and insights powered by advanced AI models.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track reading velocity, genre evolution, and progress with beautiful visualizations.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Smart Annotations',
    description: 'Highlight, annotate, and export citations in APA, MLA, or Chicago format.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: Globe,
    title: 'Social Sharing',
    description: 'Share your reading journey, create wrapped summaries, and inspire others.',
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: Layers,
    title: 'Reading Lists',
    description: 'Curate themed collections, set challenges, and randomize your TBR pile.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
  },
];

const testimonials = [
  { text: "BookVault transformed how I track my reading. The AI insights are mind-blowing.", author: "Sarah K.", role: "Avid Reader" },
  { text: "The best reading app I've ever used. The analytics alone are worth it.", author: "Marcus T.", role: "Book Blogger" },
  { text: "Citation export saved me hours of work on my thesis. Essential for academics.", author: "Dr. Emily R.", role: "Researcher" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }),
};

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={index}
      variants={fadeUp}
      className="group relative"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-border/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative frosted-panel rounded-2xl p-6 sm:p-8 border border-border/20 hover:border-border/40 transition-all duration-500 h-full">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
          <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
};

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIndex(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-40px" });
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-40px" });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between frosted-panel rounded-2xl px-6 py-3 border border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center p-1.5 logo-glow">
              <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg gradient-text-mixed">BookVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onGetStarted} className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button size="sm" onClick={onGetStarted} className="gradient-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              Get Started Free
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center px-6 pt-24"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Backgrounds */}
        <div className="absolute inset-0 mesh-gradient-animate" />
        <div className="aurora-container">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
          <div className="aurora-blob-3" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.5)_70%)]" />
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: 'backOut' }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute -inset-12 rounded-full bg-gradient-to-br from-primary/15 via-secondary/8 to-primary/15 blur-3xl animate-pulse-soft" />
              <div className="relative w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center p-4 shadow-2xl logo-glow ring-1 ring-white/10">
                <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Reading Platform
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="gradient-text-mixed glow-text">Your Reading,</span>
            <br />
            <span className="text-foreground">Elevated.</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            Track, analyze, and supercharge your reading journey with AI insights, 
            beautiful analytics, and a library that feels like home.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="gradient-primary text-primary-foreground rounded-xl px-8 py-6 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all group"
            >
              Start Reading Free
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-xl px-8 py-6 text-base border-border/40 hover:bg-muted/20"
            >
              See Features
              <ChevronDown className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground/30" />
        </motion.div>
      </motion.section>

      {/* Social proof stats */}
      <section ref={statsRef} className="relative py-20 px-6 border-y border-border/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-3xl sm:text-4xl font-display font-bold gradient-text-mixed mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground/50 font-medium tracking-wide uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="features" ref={featuresRef} className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={fadeUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold tracking-wide mb-4">
              <Layers className="w-3.5 h-3.5" />
              Feature-Rich Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything a reader <span className="gradient-text-mixed">needs</span>
            </h2>
            <p className="text-muted-foreground/60 max-w-xl mx-auto">
              From AI-powered insights to academic citations, BookVault has every tool to transform your reading experience.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 px-6 border-t border-border/10">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-10 h-10 text-primary/20 mx-auto mb-8" />
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xl sm:text-2xl font-display italic text-foreground/80 leading-relaxed mb-6">
                "{testimonials[testimonialIndex].text}"
              </p>
              <div>
                <p className="font-semibold text-foreground">{testimonials[testimonialIndex].author}</p>
                <p className="text-sm text-muted-foreground/50">{testimonials[testimonialIndex].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === testimonialIndex ? 'bg-primary w-6' : 'bg-muted-foreground/20'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
          variants={fadeUp}
        >
          <div className="relative frosted-panel rounded-3xl p-12 sm:p-16 border border-border/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Ready to <span className="gradient-text-mixed">transform</span> your reading?
              </h2>
              <p className="text-muted-foreground/60 mb-8 max-w-lg mx-auto">
                Join thousands of readers who track, analyze, and elevate their reading journey with BookVault.
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="gradient-primary text-primary-foreground rounded-xl px-10 py-6 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all group"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center p-1">
              <img src="/favicon.png" alt="BookVault" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground/50">BookVault</span>
          </div>
          <p className="text-xs text-muted-foreground/30">© 2026 BookVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
