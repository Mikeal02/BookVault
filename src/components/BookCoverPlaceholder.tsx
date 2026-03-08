
import { BookOpen } from 'lucide-react';

interface BookCoverPlaceholderProps {
  title: string;
  author?: string;
  className?: string;
}

const stringToColor = (str: string): { bg: string; accent: string } => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 25%, 18%)`,
    accent: `hsl(${hue}, 35%, 35%)`,
  };
};

export const BookCoverPlaceholder = ({ title, author, className = '' }: BookCoverPlaceholderProps) => {
  const colors = stringToColor(title + (author || ''));
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={`flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${colors.bg}, ${colors.accent})` }}
    >
      {/* Decorative border frame */}
      <div className="absolute inset-3 border border-white/10 rounded-sm" />
      
      {/* Top ornament line */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-px bg-white/20" />
      
      <BookOpen className="w-6 h-6 mb-2 text-white/25" />
      <span className="text-xl font-display font-semibold tracking-widest text-white/70">{initials}</span>
      <p className="text-[9px] mt-3 px-4 text-center leading-tight text-white/50 line-clamp-2 max-w-[85%] uppercase tracking-wider font-sans">
        {title}
      </p>
      {author && (
        <p className="text-[8px] mt-1.5 text-white/30 text-center line-clamp-1 max-w-[80%] font-sans tracking-wide">{author}</p>
      )}
      
      {/* Bottom ornament line */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-px bg-white/20" />
    </div>
  );
};
