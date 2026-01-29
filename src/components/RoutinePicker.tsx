import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, X, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Routine } from '@/types/workout';
import { cn } from '@/lib/utils';

interface RoutinePickerProps {
  routines: Routine[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (routine: Routine) => void;
}

export function RoutinePicker({ routines, isOpen, onClose, onSelect }: RoutinePickerProps) {
  const [search, setSearch] = useState('');

  const filteredRoutines = useMemo(() => {
    if (!search.trim()) return routines;
    const term = search.toLowerCase();
    return routines.filter(r => r.name.toLowerCase().includes(term));
  }, [routines, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-semibold">Choose Routine</h2>
            <button onClick={onClose} className="tap-target p-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search routines..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Routine list */}
          <div className="flex-1 overflow-auto px-4 pb-safe">
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {routines.length === 0 ? 'No routines yet' : 'No matching routines'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredRoutines.map((routine) => (
                  <motion.button
                    key={routine.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(routine)}
                    className="w-full bg-surface rounded-xl p-4 flex items-center justify-between tap-target text-left"
                  >
                    <div>
                      <p className="font-semibold">{routine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
