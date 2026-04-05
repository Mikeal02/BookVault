import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface AnimatedProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}

export const AnimatedProgressRing = ({
  progress,
  size = 140,
  strokeWidth = 8,
  label,
  sublabel,
  color,
}: AnimatedProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  const gradientId = useMemo(() => `ring-grad-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        {/* Animated progress arc */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color || 'hsl(var(--primary))'} />
            <stop offset="100%" stopColor={color ? color : 'hsl(var(--secondary))'} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        {/* Glowing dot at the tip */}
        {progress > 2 && (
          <motion.circle
            cx={size / 2}
            cy={strokeWidth / 2}
            r={strokeWidth / 2 + 2}
            fill={color || 'hsl(var(--primary))'}
            opacity={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 2, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: `rotate(${(progress / 100) * 360}deg)`,
            }}
          />
        )}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black tabular-nums gradient-text"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {Math.round(progress)}%
        </motion.span>
        {label && (
          <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</span>
        )}
        {sublabel && (
          <span className="text-[9px] text-muted-foreground/60">{sublabel}</span>
        )}
      </div>
    </div>
  );
};
