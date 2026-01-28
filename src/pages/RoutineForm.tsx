import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  GripVertical,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRoutines, useExercises, useSettings } from '@/hooks/useWorkoutData';
import { RoutineExercise, Exercise } from '@/types/workout';
import { cn } from '@/lib/utils';

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
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={re.restBetweenSets}
                            onChange={(e) => updateRoutineExercise(index, { restBetweenSets: parseInt(e.target.value) || 60 })}
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
          <Input
            type="number"
            inputMode="numeric"
            value={restBetweenExercises}
            onChange={(e) => setRestBetweenExercises(parseInt(e.target.value) || 60)}
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
      {showExercisePicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setShowExercisePicker(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Add Exercise</h2>
            </div>
            
            <div className="overflow-auto max-h-[60vh] p-4">
              {exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No exercises yet</p>
                  <Button onClick={() => navigate('/exercises/new')}>
                    Create Exercise
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {exercises.map(exercise => (
                    <button
                      key={exercise.id}
                      onClick={() => addExerciseToRoutine(exercise)}
                      className="w-full bg-surface rounded-xl p-4 flex items-center justify-between tap-target text-left"
                    >
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {exercise.equipment} • {exercise.type === 'time' ? 'Time-based' : 'Reps-based'}
                        </p>
                      </div>
                      {exercise.type === 'time' && (
                        <Timer className="w-5 h-5 text-rest" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
