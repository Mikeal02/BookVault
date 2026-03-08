import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Heart, Timer } from 'lucide-react';

interface FloatingActionButtonProps {
  onAddBook: () => void;
  onStartSession: () => void;
  onLogMood: () => void;
}

const actions = [
  { id: 'add', label: 'Add Book', icon: Search, color: 'bg-primary text-primary-foreground shadow-primary/25' },
  { id: 'session', label: 'Start Session', icon: Timer, color: 'bg-success text-success-foreground shadow-success/25' },
  { id: 'mood', label: 'Log Mood', icon: Heart, color: 'bg-secondary text-secondary-foreground shadow-secondary/25' },
] as const;

export const FloatingActionButton = ({ onAddBook, onStartSession, onLogMood }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (id: string) => {
    setIsOpen(false);
    if (id === 'add') onAddBook();
    else if (id === 'session') onStartSession();
    else if (id === 'mood') onLogMood();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action items */}
        <AnimatePresence>
          {isOpen && actions.map((action, i) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 10 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handleAction(action.id)}
              className="flex items-center gap-3"
            >
              <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200`}>
                <action.icon className="w-5 h-5" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full gradient-mixed flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </>
  );
};
