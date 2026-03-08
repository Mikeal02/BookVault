
import { BookOpen } from 'lucide-react';

interface BookCoverPlaceholderProps {
  title: string;
  author?: string;
  className?: string;
}

// Generate a deterministic color from a string
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 35%)`;
};

export const BookCoverPlaceholder = ({ title, author, className = '' }: BookCoverPlaceholderProps) => {
  const bgColor = stringToColor(title + (author || ''));
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={`flex flex-col items-center justify-center text-white relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)` }}
    >
      {/* Decorative lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 right-4 h-px bg-white" />
        <div className="absolute bottom-4 left-4 right-4 h-px bg-white" />
        <div className="absolute top-4 bottom-4 left-4 w-px bg-white" />
        <div className="absolute top-4 bottom-4 right-4 w-px bg-white" />
      </div>

      <BookOpen className="w-8 h-8 mb-2 opacity-40" />
      <span className="text-2xl font-bold tracking-wider opacity-80">{initials}</span>
      <p className="text-[10px] mt-2 px-3 text-center leading-tight opacity-70 line-clamp-2 max-w-[90%]">
        {title}
      </p>
      {author && (
        <p className="text-[9px] mt-1 opacity-50 text-center line-clamp-1 max-w-[80%]">{author}</p>
      )}
    </div>
  );
};
