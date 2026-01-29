import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ExerciseTargetsModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targets: { sets: number; reps?: number; duration?: number; rest: number }) => void;
  defaultRest: number;
}

export function ExerciseTargetsModal({ 
  exercise, 
  isOpen, 
  onClose, 
  onConfirm,
  defaultRest = 90 
}: ExerciseTargetsModalProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [duration, setDuration] = useState(30);
  const [rest, setRest] = useState<number | null>(null);
  
  // Initialize rest from defaultRest only once when modal opens
  const effectiveRest = rest ?? defaultRest;

  const handleConfirm = () => {
    if (!exercise) return;
    
    // For cardio exercises, we use 1 set and no reps/duration targets
    const isCardio = exercise.type === 'cardio';
    
    onConfirm({
      sets: isCardio ? 1 : sets,
      reps: exercise.type === 'reps' ? reps : undefined,
      duration: exercise.type === 'time' ? duration : undefined,
      rest: isCardio ? 0 : effectiveRest,
    });

    // Reset for next exercise
    setSets(3);
    setReps(10);
    setDuration(30);
    setRest(null);
  };

  if (!isOpen || !exercise) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm bg-card rounded-2xl p-6 max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-1">{exercise.name}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {exercise.type === 'cardio' 
              ? 'Ready to start cardio session' 
              : 'Set targets for this exercise'}
          </p>

          {exercise.type === 'cardio' ? (
            // Cardio - no configuration needed, just confirm
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Track duration, incline, speed, and distance during your session
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sets */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Sets</label>
                <div className="flex items-center justify-between bg-surface rounded-xl p-2">
                  <button
                    onClick={() => setSets(Math.max(1, sets - 1))}
                    className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold">{sets}</span>
                  <button
                    onClick={() => setSets(sets + 1)}
                    className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Reps or Duration */}
              {exercise.type === 'reps' ? (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Target Reps</label>
                  <div className="flex items-center justify-between bg-surface rounded-xl p-2">
                    <button
                      onClick={() => setReps(Math.max(1, reps - 1))}
                      className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold">{reps}</span>
                    <button
                      onClick={() => setReps(reps + 1)}
                      className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Target Duration (seconds)</label>
                  <div className="flex items-center justify-between bg-surface rounded-xl p-2">
                    <button
                      onClick={() => setDuration(Math.max(5, duration - 5))}
                      className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold">{duration}s</span>
                    <button
                      onClick={() => setDuration(duration + 5)}
                      className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Rest */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Rest Between Sets (seconds)</label>
                <div className="flex items-center justify-between bg-surface rounded-xl p-2">
                  <button
                    onClick={() => setRest(Math.max(0, effectiveRest - 15))}
                    className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold">{effectiveRest}s</span>
                  <button
                    onClick={() => setRest(effectiveRest + 15)}
                    className="tap-target w-12 h-12 rounded-lg bg-card flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6"> 
            <Button variant="outline" className="flex-1 tap-target" onClick={onClose}>  
              Cancel  
            </Button>  
            <Button className="flex-1 tap-target bg-gradient-primary" onClick={handleConfirm}>  
              <Check className="w-4 h-4 mr-2" />  
              Add  
            </Button>  
          </div>  
        </motion.div>  
      </motion.div>  
    </AnimatePresence>  
  );
}