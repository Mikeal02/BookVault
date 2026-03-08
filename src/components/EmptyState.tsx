import { motion } from 'framer-motion';
import { BookOpen, Search, Quote, Heart, BarChart3, Music, Trophy, FileText, Share2 } from 'lucide-react';

interface EmptyStateProps {
  type: 'books' | 'search' | 'quotes' | 'mood' | 'stats' | 'atmosphere' | 'challenges' | 'annotations' | 'sharing' | 'generic';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const icons: Record<EmptyStateProps['type'], any> = {
  books: BookOpen,
  search: Search,
  quotes: Quote,
  mood: Heart,
  stats: BarChart3,
  atmosphere: Music,
  challenges: Trophy,
  annotations: FileText,
  sharing: Share2,
  generic: BookOpen,
};

export const EmptyState = ({ type, title, description, action }: EmptyStateProps) => {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Animated icon circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="w-12 h-12 text-primary/60" />
          </motion.div>
        </div>
        {/* Decorative dots */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-secondary/30"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-primary/30"
        />
      </motion.div>

      <h3 className="text-xl font-display font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>

      {action && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 gradient-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};
