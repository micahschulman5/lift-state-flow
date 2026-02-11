import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Check, 
  Timer,
  RotateCcw,
  Plus,
  Info,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useActiveWorkout, useExercises, useSetEntries, useSettings, usePlannedWorkouts, useRoutines } from '@/hooks/useWorkoutData';
import { Exercise, SetEntry, WorkoutExercise } from '@/types/workout';
import { WorkoutExercisePicker } from '@/components/WorkoutExercisePicker';
import { QuickExerciseForm } from '@/components/QuickExerciseForm';
import { ExerciseInfoModal } from '@/components/ExerciseInfoModal';
import { ExerciseTargetsModal } from '@/components/ExerciseTargetsModal';
import { SaveAsRoutineModal } from '@/components/SaveAsRoutineModal';
import { CardioWorkoutView } from '@/components/CardioWorkoutView';
import * as db from '@/lib/db';

type WorkoutPhase = 'exercise' | 'rest' | 'complete' | 'empty' | 'cardio';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const { activeWorkout, update, completeSet, end, addExerciseToWorkout } = useActiveWorkout();
  const { exercises, addExercise, refresh: refreshExercises } = useExercises();
  const { getLastSet } = useSetEntries();
  const { settings } = useSettings();
  const { updatePlannedWorkout } = usePlannedWorkouts();
  const { addRoutine } = useRoutines();
  
  const [phase, setPhase] = useState<WorkoutPhase>('exercise');
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [inSetTime, setInSetTime] = useState(0);
  const [inSetTimerRunning, setInSetTimerRunning] = useState(false);
  
  // Set entry form state
  const [reps, setReps] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [rpe, setRpe] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [lastSetData, setLastSetData] = useState<SetEntry | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  // Modal states
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showQuickExerciseForm, setShowQuickExerciseForm] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [showSaveAsRoutine, setShowSaveAsRoutine] = useState(false);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<Exercise | null>(null);
  
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inSetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current exercise from workoutExercises
  const currentWorkoutExercise: WorkoutExercise | undefined = activeWorkout?.workoutExercises[activeWorkout.currentExerciseIndex];
  
  const currentExercise = currentWorkoutExercise 
    ? exercises.find(e => e.id === currentWorkoutExercise.exerciseId)
    : null;

  // Check if this is a free workout with no exercises or cardio exercise
  useEffect(() => {
    if (activeWorkout && activeWorkout.workoutExercises.length === 0 && phase !== 'complete') {
      setPhase('empty');
    } else if (activeWorkout && activeWorkout.workoutExercises.length > 0 && phase === 'empty') {
      // Check if current exercise is cardio
      if (currentExercise?.type === 'cardio') {
        setPhase('cardio');
      } else {
        setPhase('exercise');
      }
    }
  }, [activeWorkout?.workoutExercises.length, phase, currentExercise?.type]);
  
  // Load last set data for auto-fill only when exercise changes (not between sets)
  const prevExerciseIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentExercise && currentExercise.id !== prevExerciseIdRef.current) {
      prevExerciseIdRef.current = currentExercise.id;
      getLastSet(currentExercise.id).then(lastSet => {
        setLastSetData(lastSet || null);
        if (lastSet) {
          if (currentExercise.type === 'reps' && lastSet.reps) {
            setReps(String(lastSet.reps));
          }
          if (currentExercise.type === 'time' && lastSet.duration) {
            setDuration(String(lastSet.duration));
          }
          if (lastSet.weight) {
            setWeight(String(lastSet.weight));
          }
        }
      });
    }
  }, [currentExercise, getLastSet]);

  // Rest timer
  useEffect(() => {
    if (phase === 'rest' && restTimeLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setPhase('exercise');
            playNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, [phase, restTimeLeft]);

  // In-set timer for time-based exercises
  useEffect(() => {
    if (inSetTimerRunning) {
      inSetTimerRef.current = setInterval(() => {
        setInSetTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (inSetTimerRef.current) {
        clearInterval(inSetTimerRef.current);
      }
    };
  }, [inSetTimerRunning]);

  const playNotification = useCallback(() => {
    if (settings.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 200);
      } catch {
        // Fallback: do nothing if audio fails
      }
    }
    
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Rest Complete!', {
        body: 'Time for your next set',
        icon: '/pwa-192x192.png',
        tag: 'rest-complete',
      });
    }
  }, [settings]);

  const handleCompleteSet = async () => {
    if (!activeWorkout || !currentExercise || !currentWorkoutExercise) return;
    
    const entryData: Omit<SetEntry, 'id' | 'completedAt'> = {
      sessionId: activeWorkout.session.id,
      exerciseId: currentExercise.id,
      setIndex: activeWorkout.currentSetIndex,
      reps: currentExercise.type === 'reps' ? parseInt(reps) || undefined : undefined,
      duration: currentExercise.type === 'time' ? (inSetTime || parseInt(duration) || undefined) : undefined,
      weight: parseFloat(weight) || undefined,
      rpe: parseInt(rpe) || undefined,
      notes: notes || undefined,
    };
    
    await completeSet(entryData);
    
    // Reset form
    setNotes('');
    setRpe('');
    setInSetTime(0);
    setInSetTimerRunning(false);
    
    // Check if we need to advance
    const isLastSet = activeWorkout.currentSetIndex >= currentWorkoutExercise.targetSets - 1;
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.workoutExercises.length - 1;
    
    if (isLastSet && isLastExercise) {
      // Workout complete!
      setPhase('complete');
    } else if (isLastSet) {
      // Move to next exercise
      update({
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
      // Use rest between exercises from the routine or default
      const restTime = activeWorkout.routine?.restBetweenExercises || settings.defaultRestBetweenExercises;
      setRestTimeLeft(restTime);
      setPhase('rest');
    } else {
      // Next set
      update({
        currentSetIndex: activeWorkout.currentSetIndex + 1,
      });
      setRestTimeLeft(currentWorkoutExercise.restBetweenSets);
      setPhase('rest');
    }
  };

  const handleSkipSet = () => {
    if (!activeWorkout || !currentWorkoutExercise) return;
    
    const isLastSet = activeWorkout.currentSetIndex >= currentWorkoutExercise.targetSets - 1;
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.workoutExercises.length - 1;
    
    if (isLastSet && isLastExercise) {
      setPhase('complete');
    } else if (isLastSet) {
      update({
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
    } else {
      update({
        currentSetIndex: activeWorkout.currentSetIndex + 1,
      });
    }
  };

  const handleSkipExercise = () => {
    if (!activeWorkout) return;
    
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.workoutExercises.length - 1;
    
    if (isLastExercise) {
      setPhase('complete');
    } else {
      update({
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
    }
  };

  const handleSkipRest = () => {
    setRestTimeLeft(0);
    setPhase('exercise');
  };

  const handleEndWorkout = async () => {
    if (!activeWorkout) return;
    
    await end('completed');
    
    // Update planned workout if linked
    if (activeWorkout.session.plannedWorkoutId) {
      await updatePlannedWorkout(activeWorkout.session.plannedWorkoutId, {
        status: 'completed',
        sessionId: activeWorkout.session.id,
      });
    }
    
    navigate('/');
  };

  const handleAbandonWorkout = async () => {
    await end('abandoned');
    navigate('/');
  };

  // Handle adding exercise from picker
  const handleExerciseSelected = (exercise: Exercise) => {
    setSelectedExerciseForAdd(exercise);
    setShowExercisePicker(false);
    setShowTargetsModal(true);
  };

  // Handle quick exercise creation
  const handleQuickExerciseCreated = async (exercise: Exercise) => {
    await db.saveExercise(exercise);
    await refreshExercises();
    setShowQuickExerciseForm(false);
    setSelectedExerciseForAdd(exercise);
    setShowTargetsModal(true);
  };

  // Handle confirming exercise targets
  const handleTargetsConfirmed = (targets: { sets: number; reps?: number; duration?: number; rest: number }) => {
    if (!selectedExerciseForAdd || !activeWorkout) return;
    
    addExerciseToWorkout(selectedExerciseForAdd.id, targets);
    
    // If this was the first exercise in a free workout, move to appropriate phase
    if (phase === 'empty') {
      if (selectedExerciseForAdd.type === 'cardio') {
        setPhase('cardio');
      } else {
        setPhase('exercise');
      }
    }
    
    setShowTargetsModal(false);
    setSelectedExerciseForAdd(null);
  };

  // Handle cardio completion
  const handleCardioComplete = async (entry: Omit<SetEntry, 'id' | 'completedAt'>) => {
    if (!activeWorkout) return;
    
    await completeSet(entry);
    
    // Check if there are more exercises
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.workoutExercises.length - 1;
    
    if (isLastExercise) {
      setPhase('complete');
    } else {
      update({
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
      // Check next exercise type
      const nextExerciseId = activeWorkout.workoutExercises[activeWorkout.currentExerciseIndex + 1]?.exerciseId;
      const nextExercise = exercises.find(e => e.id === nextExerciseId);
      if (nextExercise?.type === 'cardio') {
        setPhase('cardio');
      } else {
        const restTime = activeWorkout.routine?.restBetweenExercises || settings.defaultRestBetweenExercises;
        setRestTimeLeft(restTime);
        setPhase('rest');
      }
    }
  };

  // Handle saving free workout as routine
  const handleSaveAsRoutine = async (name: string, routineNotes?: string) => {
    if (!activeWorkout) return;
    
    await addRoutine({
      name,
      exercises: activeWorkout.workoutExercises.map(we => ({
        exerciseId: we.exerciseId,
        targetSets: we.targetSets,
        targetReps: we.targetReps,
        targetDuration: we.targetDuration,
        restBetweenSets: we.restBetweenSets,
      })),
      restBetweenExercises: settings.defaultRestBetweenExercises,
      notes: routineNotes,
    });
    
    setShowSaveAsRoutine(false);
    handleEndWorkout();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeWorkout) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No active workout</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Workout complete screen
  if (phase === 'complete') {
    const totalSets = activeWorkout.completedSets.length;
    const duration = Math.round((Date.now() - activeWorkout.session.startedAt) / 1000 / 60);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-success/20 to-background"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 rounded-full bg-success flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-success-foreground" />
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-muted-foreground mb-8">
          {activeWorkout.routine?.name || 'Free Workout'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="display-lg text-primary">{totalSets}</p>
            <p className="text-sm text-muted-foreground">Sets</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="display-lg text-primary">{duration}</p>
            <p className="text-sm text-muted-foreground">Minutes</p>
          </div>
        </div>
        
        <div className="w-full max-w-xs space-y-3">
          {/* Save as routine option for free workouts */}
          {activeWorkout.isFreeWorkout && activeWorkout.workoutExercises.length > 0 && (
            <Button 
              variant="outline"
              size="lg" 
              className="w-full tap-target"
              onClick={() => setShowSaveAsRoutine(true)}
            >
              <Save className="w-5 h-5 mr-2" />
              Save as Routine
            </Button>
          )}
          
          <Button 
            size="lg" 
            className="w-full tap-target bg-gradient-primary"
            onClick={handleEndWorkout}
          >
            Done
          </Button>
        </div>
        
        <SaveAsRoutineModal
          isOpen={showSaveAsRoutine}
          onClose={() => setShowSaveAsRoutine(false)}
          onSave={handleSaveAsRoutine}
          exerciseCount={activeWorkout.workoutExercises.length}
        />
      </motion.div>
    );
  }

  // Empty workout (free workout with no exercises yet)
  if (phase === 'empty') {
    return (
      <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="tap-target flex items-center justify-center text-destructive"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <p className="text-sm font-medium">Free Workout</p>
          </div>
          
          <div className="w-12" />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Add Your First Exercise</h2>
            <p className="text-muted-foreground">
              Choose from your library or create a new one
            </p>
          </div>
          
          <Button
            size="lg"
            className="tap-target bg-gradient-primary"
            onClick={() => setShowExercisePicker(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Exercise
          </Button>
        </div>
        
        {/* End workout confirmation */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowEndConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold mb-2">End Workout?</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't logged any sets yet.
                </p>
                
                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full tap-target"
                    onClick={handleAbandonWorkout}
                  >
                    Discard Workout
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full tap-target"
                    onClick={() => setShowEndConfirm(false)}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Modals */}
        <WorkoutExercisePicker
          exercises={exercises}
          isOpen={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={handleExerciseSelected}
          onCreateNew={() => {
            setShowExercisePicker(false);
            setShowQuickExerciseForm(true);
          }}
        />
        
        <QuickExerciseForm
          isOpen={showQuickExerciseForm}
          onClose={() => setShowQuickExerciseForm(false)}
          onSave={handleQuickExerciseCreated}
        />
        
        <ExerciseTargetsModal
          exercise={selectedExerciseForAdd}
          isOpen={showTargetsModal}
          onClose={() => {
            setShowTargetsModal(false);
            setSelectedExerciseForAdd(null);
          }}
          onConfirm={handleTargetsConfirmed}
          defaultRest={settings.defaultRestBetweenSets}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={() => setShowEndConfirm(true)}
          className="tap-target flex items-center justify-center text-destructive"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {activeWorkout.routine?.name || 'Free Workout'}
          </p>
          <p className="text-xs text-muted-foreground">
            Exercise {activeWorkout.currentExerciseIndex + 1} of {activeWorkout.workoutExercises.length}
          </p>
        </div>
        
        <button
          onClick={handleSkipExercise}
          className="tap-target flex items-center justify-center text-muted-foreground"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {phase === 'rest' ? (
            // Rest phase
            <motion.div
              key="rest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rest/10 to-background"
            >
              <Timer className="w-12 h-12 text-rest mb-4 animate-timer-pulse" />
              <p className="text-muted-foreground mb-2">Rest Time</p>
              <p className="display-xl text-rest mb-8">{formatTime(restTimeLeft)}</p>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="tap-target"
                  onClick={() => setRestTimeLeft(prev => prev + 30)}
                >
                  +30s
                </Button>
                <Button
                  size="lg"
                  className="tap-target bg-rest text-rest-foreground"
                  onClick={handleSkipRest}
                >
                  Skip Rest
                </Button>
              </div>
            </motion.div>
          ) : phase === 'cardio' && currentExercise ? (
            // Cardio phase
            <CardioWorkoutView
              key="cardio"
              exercise={currentExercise}
              sessionId={activeWorkout.session.id}
              settings={settings}
              onComplete={handleCardioComplete}
              onSkip={handleSkipExercise}
            />
          ) : (
            // Exercise phase
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col p-6 overflow-auto"
            >
              {/* Exercise info */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{currentExercise?.name || 'Unknown Exercise'}</h1>
                  {currentExercise && (
                    <button
                      onClick={() => setShowExerciseInfo(true)}
                      className="tap-target p-1"
                    >
                      <Info className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <p className="text-lg text-primary font-semibold">
                  Set {activeWorkout.currentSetIndex + 1} of {currentWorkoutExercise?.targetSets || 0}
                </p>
                {currentExercise?.type === 'reps' && currentWorkoutExercise?.targetReps && (
                  <p className="text-muted-foreground">Target: {currentWorkoutExercise.targetReps} reps</p>
                )}
                {currentExercise?.type === 'time' && currentWorkoutExercise?.targetDuration && (
                  <p className="text-muted-foreground">Target: {formatTime(currentWorkoutExercise.targetDuration)}</p>
                )}
              </div>
              
              {/* Last set reference */}
              {lastSetData && (
                <div className="bg-surface rounded-xl p-3 mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Previous</p>
                  <p className="text-sm">
                    {lastSetData.weight && `${lastSetData.weight} ${settings.weightUnit} × `}
                    {lastSetData.reps && `${lastSetData.reps} reps`}
                    {lastSetData.duration && formatTime(lastSetData.duration)}
                    {lastSetData.rpe && ` @ RPE ${lastSetData.rpe}`}
                  </p>
                </div>
              )}
              
              {/* In-set timer for time-based */}
              {currentExercise?.type === 'time' && (
                <div className="bg-surface rounded-2xl p-6 mb-6 text-center">
                  <p className="display-xl mb-4">{formatTime(inSetTime)}</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant={inSetTimerRunning ? 'destructive' : 'default'}
                      size="lg"
                      className="tap-target"
                      onClick={() => setInSetTimerRunning(!inSetTimerRunning)}
                    >
                      {inSetTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="tap-target"
                      onClick={() => {
                        setInSetTime(0);
                        setInSetTimerRunning(false);
                      }}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Set entry form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {currentExercise?.type === 'reps' && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Reps</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className="text-xl font-bold text-center tap-target"
                        placeholder="0"
                      />
                    </div>
                  )}
                  
                  {currentExercise?.type === 'time' && !inSetTimerRunning && inSetTime === 0 && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Duration (sec)</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="text-xl font-bold text-center tap-target"
                        placeholder="0"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Weight ({settings.weightUnit})</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="text-xl font-bold text-center tap-target"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">RPE (1-10)</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="10"
                      value={rpe}
                      onChange={(e) => setRpe(e.target.value)}
                      className="tap-target"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Notes</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="tap-target"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-auto pt-6 space-y-3">
                <Button
                  size="lg"
                  className="w-full tap-target bg-gradient-success text-success-foreground font-semibold text-lg"
                  onClick={handleCompleteSet}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Complete Set
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full tap-target text-muted-foreground"
                  onClick={handleSkipSet}
                >
                  Skip Set
                </Button>
                
                {/* Add Exercise button */}
                <Button
                  variant="outline"
                  className="w-full tap-target"
                  onClick={() => setShowExercisePicker(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* End workout confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">End Workout?</h2>
              <p className="text-muted-foreground mb-6">
                You've completed {activeWorkout.completedSets.length} sets so far.
              </p>
              
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full tap-target bg-gradient-success"
                  onClick={handleEndWorkout}
                >
                  Save & Finish
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full tap-target"
                  onClick={handleAbandonWorkout}
                >
                  Abandon Workout
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full tap-target"
                  onClick={() => setShowEndConfirm(false)}
                >
                  Continue Workout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <WorkoutExercisePicker
        exercises={exercises}
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleExerciseSelected}
        onCreateNew={() => {
          setShowExercisePicker(false);
          setShowQuickExerciseForm(true);
        }}
      />
      
      <QuickExerciseForm
        isOpen={showQuickExerciseForm}
        onClose={() => setShowQuickExerciseForm(false)}
        onSave={handleQuickExerciseCreated}
      />
      
      <ExerciseInfoModal
        exercise={currentExercise}
        isOpen={showExerciseInfo}
        onClose={() => setShowExerciseInfo(false)}
      />
      
      <ExerciseTargetsModal
        exercise={selectedExerciseForAdd}
        isOpen={showTargetsModal}
        onClose={() => {
          setShowTargetsModal(false);
          setSelectedExerciseForAdd(null);
        }}
        onConfirm={handleTargetsConfirmed}
        defaultRest={settings.defaultRestBetweenSets}
      />
    </div>
  );
}
