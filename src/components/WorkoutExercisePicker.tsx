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
  const [muscleFilters, setMuscleFilters] = useState<MuscleGroup[]>([]);
  const [equipmentFilters, setEquipmentFilters] = useState<EquipmentType[]>([]);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(term));
    }

    if (muscleFilters.length > 0) {
      result = result.filter(e => 
        e.primaryMuscles.some(m => muscleFilters.includes(m.muscle)) ||
        e.secondaryMuscles.some(m => muscleFilters.includes(m.muscle))
      );
    }

    if (equipmentFilters.length > 0) {
      result = result.filter(e => equipmentFilters.includes(e.equipment));
    }

    return result;
  }, [exercises, search, muscleFilters, equipmentFilters]);

  const clearFilters = () => {
    setMuscleFilters([]);
    setEquipmentFilters([]);
  };

  const toggleMuscleFilter = (muscle: MuscleGroup) => {
    setMuscleFilters(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const toggleEquipmentFilter = (equip: EquipmentType) => {
    setEquipmentFilters(prev => 
      prev.includes(equip) 
        ? prev.filter(e => e !== equip)
        : [...prev, equip]
    );
  };

  const hasActiveFilters = muscleFilters.length > 0 || equipmentFilters.length > 0;

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
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(true)}
              className="shrink-0 relative"
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </div>

          {/* Active filter chips (inline preview) */}
          {hasActiveFilters && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
              {muscleFilters.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscleFilter(muscle)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground capitalize"
                >
                  {muscle}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {equipmentFilters.map(equip => (
                <button
                  key={equip}
                  onClick={() => toggleEquipmentFilter(equip)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground capitalize"
                >
                  {equip}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Modal */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col rounded-t-3xl"
                onClick={() => setShowFilters(false)}
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex flex-col h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Filter Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="tap-target p-2">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Filter Content - Scrollable */}
                  <div className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Muscle Group */}
                    <div>
                      <p className="text-sm font-medium mb-3">Muscle Group <span className="text-muted-foreground font-normal">(multi-select)</span></p>
                      <div className="grid grid-cols-3 gap-2">
                        {muscleGroups.map(muscle => (
                          <button
                            key={muscle}
                            onClick={() => toggleMuscleFilter(muscle)}
                            className={cn(
                              "px-3 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize tap-target",
                              muscleFilters.includes(muscle)
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface text-muted-foreground"
                            )}
                          >
                            {muscle}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <p className="text-sm font-medium mb-3">Equipment <span className="text-muted-foreground font-normal">(multi-select)</span></p>
                      <div className="grid grid-cols-2 gap-2">
                        {equipmentTypes.map(equip => (
                          <button
                            key={equip}
                            onClick={() => toggleEquipmentFilter(equip)}
                            className={cn(
                              "px-3 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize tap-target",
                              equipmentFilters.includes(equip)
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface text-muted-foreground"
                            )}
                          >
                            {equip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="p-4 border-t border-border flex gap-3 pb-safe">
                    <Button
                      variant="outline"
                      className="flex-1 tap-target"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                    >
                      Clear All
                    </Button>
                    <Button
                      className="flex-1 tap-target"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </motion.div>
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
