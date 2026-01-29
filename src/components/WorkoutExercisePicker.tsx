import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Filter, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise, MuscleGroup, EquipmentType } from '@/types/workout';
import { cn } from '@/lib/utils';

interface WorkoutExercisePickerProps {
  exercises: Exercise[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  onCreateNew: () => void;
}

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'
];

const equipmentTypes: EquipmentType[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other'
];

export function WorkoutExercisePicker({ 
  exercises, 
  isOpen, 
  onClose, 
  onSelect, 
  onCreateNew 
}: WorkoutExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | null>(null);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(term));
    }

    if (muscleFilter) {
      result = result.filter(e => 
        e.primaryMuscles.some(m => m.muscle === muscleFilter) ||
        e.secondaryMuscles.some(m => m.muscle === muscleFilter)
      );
    }

    if (equipmentFilter) {
      result = result.filter(e => e.equipment === equipmentFilter);
    }

    return result;
  }, [exercises, search, muscleFilter, equipmentFilter]);

  const clearFilters = () => {
    setMuscleFilter(null);
    setEquipmentFilter(null);
  };

  const hasActiveFilters = muscleFilter || equipmentFilter;

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
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-semibold">Add Exercise</h2>
            <button onClick={onClose} className="tap-target p-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search + Filter toggle */}
          <div className="px-4 pb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pb-3"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 px-4">Muscle Group</p>
                    <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
                      {muscleGroups.map(muscle => (
                        <button
                          key={muscle}
                          onClick={() => setMuscleFilter(muscleFilter === muscle ? null : muscle)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize whitespace-nowrap shrink-0",
                            muscleFilter === muscle
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface text-muted-foreground"
                          )}
                        >
                          {muscle}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 px-4">Equipment</p>
                    <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
                      {equipmentTypes.map(equip => (
                        <button
                          key={equip}
                          onClick={() => setEquipmentFilter(equipmentFilter === equip ? null : equip)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize whitespace-nowrap shrink-0",
                            equipmentFilter === equip
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface text-muted-foreground"
                          )}
                        >
                          {equip}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <div className="px-4">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise list */}
          <div className="flex-1 overflow-auto px-4">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  {exercises.length === 0 ? 'No exercises in library' : 'No matching exercises'}
                </p>
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Exercise
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredExercises.map((exercise) => (
                  <motion.button
                    key={exercise.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(exercise)}
                    className="w-full bg-surface rounded-xl p-4 flex items-center justify-between tap-target text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {exercise.mediaBlob ? (
                        <img
                          src={URL.createObjectURL(exercise.mediaBlob)}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {exercise.equipment} • {exercise.primaryMuscles[0]?.muscle || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-primary shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Create new button (sticky at bottom) */}
          <div className="border-t border-border p-4 pb-safe">
            <Button 
              variant="outline" 
              className="w-full tap-target"
              onClick={onCreateNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Exercise
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
