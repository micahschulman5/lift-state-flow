import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Exercise, ExerciseType, EquipmentType, MuscleGroup } from '@/types/workout';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface QuickExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}

const equipmentTypes: { value: EquipmentType; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bands', label: 'Bands' },
  { value: 'other', label: 'Other' },
];

const muscleGroups: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'core', label: 'Core' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'cardio', label: 'Cardio' },
];

export function QuickExerciseForm({ isOpen, onClose, onSave }: QuickExerciseFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('reps');
  const [equipment, setEquipment] = useState<EquipmentType>('barbell');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('chest');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;

    const exercise: Exercise = {
      id: uuidv4(),
      name: name.trim(),
      type,
      equipment,
      primaryMuscles: [{ muscle: primaryMuscle, weight: 1 }],
      secondaryMuscles: [],
      movementPatterns: [],
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSave(exercise);
    
    // Reset form
    setName('');
    setType('reps');
    setEquipment('barbell');
    setPrimaryMuscle('chest');
    setNotes('');
  };

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
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-semibold">Quick Add Exercise</h2>
            <button onClick={onClose} className="tap-target p-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bench Press"
                className="tap-target"
              />
            </div>

            {/* Type toggle */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setType('reps')}
                  className={cn(
                    "py-3 rounded-xl font-medium transition-colors tap-target",
                    type === 'reps'
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                  )}
                >
                  Reps
                </button>
                <button
                  onClick={() => setType('time')}
                  className={cn(
                    "py-3 rounded-xl font-medium transition-colors tap-target",
                    type === 'time'
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                  )}
                >
                  Time
                </button>
                <button
                  onClick={() => {
                    setType('cardio');
                    setPrimaryMuscle('cardio');
                  }}
                  className={cn(
                    "py-3 rounded-xl font-medium transition-colors tap-target",
                    type === 'cardio'
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                  )}
                >
                  Cardio
                </button>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setEquipment(value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      equipment === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary muscle */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Primary Muscle</label>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPrimaryMuscle(value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      primaryMuscle === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Notes / Cues (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Form tips, cues, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Save button */}
          <div className="border-t border-border p-4 pb-safe">
            <Button 
              className="w-full tap-target bg-gradient-success"
              onClick={handleSave}
              disabled={!name.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Create & Add to Workout
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
