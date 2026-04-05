import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface ReadingVelocityGaugeProps {
  pagesPerDay: number;
  maxPages?: number;
}

export const ReadingVelocityGauge = ({ pagesPerDay, maxPages = 100 }: ReadingVelocityGaugeProps) => {
  const clamped = Math.min(pagesPerDay, maxPages);
  const pct = clamped / maxPages;
  // Arc from -135° to +135° (270° sweep)
  const startAngle = -135;
  const endAngle = startAngle + pct * 270;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const strokeW = 10;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${largeArc} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  };

  const speedLabel = pagesPerDay === 0 ? 'Idle' : pagesPerDay < 10 ? 'Casual' : pagesPerDay < 30 ? 'Steady' : pagesPerDay < 60 ? 'Fast' : 'Blazing';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="velocity-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" />
              <stop offset="50%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <path
            d={arcPath(-135, 135)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeW}
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* Value arc */}
          {pct > 0 && (
            <motion.path
              d={arcPath(startAngle, endAngle)}
              fill="none"
              stroke="url(#velocity-grad)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          )}
          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const angle = toRad(-135 + t * 270);
            const inner = r - strokeW / 2 - 4;
            const outer = r - strokeW / 2 - 10;
            return (
              <line
                key={i}
                x1={cx + inner * Math.cos(angle)}
                y1={cy + inner * Math.sin(angle)}
                x2={cx + outer * Math.cos(angle)}
                y2={cy + outer * Math.sin(angle)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                opacity={0.3}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
            className="flex items-center gap-1"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-2xl font-black tabular-nums gradient-text">
              {Math.round(pagesPerDay)}
            </span>
          </motion.div>
          <span className="text-[10px] text-muted-foreground font-semibold">pages/day</span>
        </div>
      </div>
      <motion.span
        className="chip text-[10px]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {speedLabel} Reader
      </motion.span>
    </div>
  );
};
