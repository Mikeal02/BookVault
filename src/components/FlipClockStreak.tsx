import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

interface FlipClockStreakProps {
  value: number;
  label?: string;
}

const FlipDigit = ({ digit, delay = 0 }: { digit: string; delay?: number }) => {
  return (
    <div className="relative w-8 h-12 sm:w-10 sm:h-14 overflow-hidden rounded-lg bg-card border border-border/50 shadow-md">
      {/* Top half */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={digit}
            initial={{ y: -20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 20, opacity: 0, rotateX: 90 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl sm:text-2xl font-bold tabular-nums gradient-text"
            style={{ perspective: '200px' }}
          >
            {digit}
          </motion.span>
        </AnimatePresence>
      </div>
      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border/30" />
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
    </div>
  );
};

export const FlipClockStreak = ({ value, label = 'Day Streak' }: FlipClockStreakProps) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    // Animate from 0 to value
    const timer = setTimeout(() => setDisplayed(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const digits = String(displayed).padStart(3, '0').split('');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {digits.map((d, i) => (
          <FlipDigit key={`${i}-${d}`} digit={d} delay={i * 0.1} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
        <Flame className="w-4 h-4 streak-flame" />
        <span>{label}</span>
      </div>
    </div>
  );
};
