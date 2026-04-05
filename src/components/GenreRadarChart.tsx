import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Book } from '@/types/book';

interface GenreRadarChartProps {
  books: Book[];
  size?: number;
}

export const GenreRadarChart = ({ books, size = 220 }: GenreRadarChartProps) => {
  const genreData = useMemo(() => {
    const count: Record<string, number> = {};
    books.forEach(b => {
      b.categories?.forEach(c => {
        const genre = c.split('/')[0].trim();
        count[genre] = (count[genre] || 0) + 1;
      });
    });
    return Object.entries(count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 10) + '…' : name, value }));
  }, [books]);

  if (genreData.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const maxVal = Math.max(...genreData.map(d => d.value));
  const n = genreData.length;
  const angleStep = (2 * Math.PI) / n;

  // Concentric rings
  const rings = [0.25, 0.5, 0.75, 1];

  // Data polygon points
  const dataPoints = genreData.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / maxVal) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="radar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>

        {/* Grid rings */}
        {rings.map((r, i) => (
          <polygon
            key={i}
            points={genreData
              .map((_, j) => {
                const angle = j * angleStep - Math.PI / 2;
                const radius = r * maxR;
                return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {/* Axes */}
        {genreData.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              opacity={0.4}
            />
          );
        })}

        {/* Data polygon */}
        <motion.path
          d={polygonPath}
          fill="url(#radar-fill)"
          stroke="url(#radar-stroke)"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
          />
        ))}

        {/* Labels */}
        {genreData.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = maxR + 18;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="hsl(var(--muted-foreground))"
              fontSize={9}
              fontWeight={600}
              fontFamily="DM Sans, sans-serif"
            >
              {d.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
