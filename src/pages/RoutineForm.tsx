import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  GripVertical,
  Timer,
  Search,
  Filter,
  X,
  Dumbbell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/NumberInput';
import { useRoutines, useExercises, useSettings } from '@/hooks/useWorkoutData';
import { RoutineExercise, Exercise, MuscleGroup, EquipmentType } from '@/types/workout';
import { cn } from '@/lib/utils';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'
];

const equipmentTypes: EquipmentType[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other'
];

export default function RoutineForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { routines, addRoutine, updateRoutine } = useRoutines();
  const { exercises } = useExercises();
  const { settings } = useSettings();
  
  const [name, setName] = useState('');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [restBetweenExercises, setRestBetweenExercises] = useState(settings.defaultRestBetweenExercises);
  const [notes, setNotes] = useState('');
  
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Exercise picker filters
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [muscleFilters, setMuscleFilters] = useState<MuscleGroup[]>([]);
  const [equipmentFilters, setEquipmentFilters] = useState<EquipmentType[]>([]);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (exerciseSearch.trim()) {
      const term = exerciseSearch.toLowerCase();
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
  }, [exercises, exerciseSearch, muscleFilters, equipmentFilters]);

  const hasActiveFilters = muscleFilters.length > 0 || equipmentFilters.length > 0;

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

  const closeExercisePicker = () => {
    setShowExercisePicker(false);
    setExerciseSearch('');
    setShowFilters(false);
    clearFilters();
  };

  // Load existing routine
  useEffect(() => {
    if (isEditing) {
      const routine = routines.find(r => r.id === id);
      if (routine) {
        setName(routine.name);
        setRoutineExercises(routine.exercises);
        setRestBetweenExercises(routine.restBetweenExercises);
        setNotes(routine.notes || '');
      }
    }
  }, [id, isEditing, routines]);

  const addExerciseToRoutine = (exercise: Exercise) => {
    const newRoutineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      targetSets: 3,
      targetReps: exercise.type === 'reps' ? 10 : undefined,
      targetDuration: exercise.type === 'time' ? 30 : undefined,
      restBetweenSets: settings.defaultRestBetweenSets,
    };
    setRoutineExercises([...routineExercises, newRoutineExercise]);
    setShowExercisePicker(false);
  };

  const updateRoutineExercise = (index: number, updates: Partial<RoutineExercise>) => {
    setRoutineExercises(routineExercises.map((re, i) => 
      i === index ? { ...re, ...updates } : re
    ));
  };

  const removeRoutineExercise = (index: number) => {
    setRoutineExercises(routineExercises.filter((_, i) => i !== index));
    setEditingExerciseIndex(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }
    
    if (routineExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    
    setSaving(true);
    
    try {
      const routineData = {
        name: name.trim(),
        exercises: routineExercises,
        restBetweenExercises,
        notes: notes.trim() || undefined,
      };
      
      if (isEditing) {
        await updateRoutine(id, routineData);
      } else {
        await addRoutine(routineData);
      }
      
      navigate('/');
    } catch (error) {
      console.error('Failed to save routine:', error);
      alert('Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const getExercise = (exerciseId: string) => exercises.find(e => e.id === exerciseId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="tap-target flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="font-semibold">
            {isEditing ? 'Edit Routine' : 'New Routine'}
          </h1>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="tap-target"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-6 pb-24">
        {/* Name */}
        <div>
          <label className="text-sm font-medium mb-2 block">Routine Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Push Day, Full Body"
            className="tap-target"
          />
        </div>
        
        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Exercises</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExercisePicker(true)}
              className="tap-target"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          
          {routineExercises.length === 0 ? (
            <button
              onClick={() => setShowExercisePicker(true)}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center tap-target"
            >
              <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Add your first exercise</p>
            </button>
          ) : (
            <Reorder.Group
              axis="y"
              values={routineExercises}
              onReorder={setRoutineExercises}
              className="space-y-2"
            >
              {routineExercises.map((re, index) => {
                const exercise = getExercise(re.exerciseId);
                const isEditing = editingExerciseIndex === index;
                
                return (
                  <Reorder.Item
                    key={re.exerciseId + index}
                    value={re}
                    className="bg-card rounded-xl overflow-hidden"
                  >
                    <div
                      className="p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing"
                      onClick={() => setEditingExerciseIndex(isEditing ? null : index)}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{exercise?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {re.targetSets} sets × {re.targetReps ? `${re.targetReps} reps` : formatTime(re.targetDuration || 0)}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRoutineExercise(index);
                        }}
                        className="p-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Expanded edit form */}
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-border p-4 space-y-4 bg-surface"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Sets</label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={re.targetSets}
                              onChange={(e) => updateRoutineExercise(index, { targetSets: parseInt(e.target.value) || 1 })}
                              className="tap-target"
                            />
                          </div>
                          
                          {exercise?.type === 'reps' ? (
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={re.targetReps || ''}
                                onChange={(e) => updateRoutineExercise(index, { targetReps: parseInt(e.target.value) || undefined })}
                                className="tap-target"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Duration (sec)</label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={re.targetDuration || ''}
                                onChange={(e) => updateRoutineExercise(index, { targetDuration: parseInt(e.target.value) || undefined })}
                                className="tap-target"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Rest Between Sets (sec)</label>
                          <NumberInput
                            value={re.restBetweenSets}
                            onValueChange={(next) => updateRoutineExercise(index, { restBetweenSets: next })}
                            min={0}
                            className="tap-target"
                          />
                        </div>
                      </motion.div>
                    )}
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </div>
        
        {/* Rest between exercises */}
        <div>
          <label className="text-sm font-medium mb-2 block">Rest Between Exercises (sec)</label>
          <NumberInput
            value={restBetweenExercises}
            onValueChange={setRestBetweenExercises}
            min={0}
            className="tap-target"
          />
        </div>
        
        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this routine"
            rows={3}
          />
        </div>
      </div>
      
      {/* Exercise picker modal */}
      <AnimatePresence>
        {showExercisePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={closeExercisePicker}
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
                <button onClick={closeExercisePicker} className="tap-target p-2">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Search + Filter toggle */}
              <div className="px-4 pb-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
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
              {showFilters && (
                <div
                  className="fixed inset-0 bg-background z-[60] flex flex-col overflow-hidden safe-top safe-bottom"
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
                </div>
              )}


              {/* Exercise list */}
              <div className="flex-1 overflow-auto px-4">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {exercises.length === 0 ? 'No exercises in library' : 'No matching exercises'}
                    </p>
                    <Button onClick={() => navigate('/exercises/new')}>
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
                        onClick={() => {
                          addExerciseToRoutine(exercise);
                          closeExercisePicker();
                        }}
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
                  onClick={() => navigate('/exercises/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Exercise
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
