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
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Volume2,
  Vibrate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useActiveWorkout, useExercises, useSetEntries, useSettings, usePlannedWorkouts } from '@/hooks/useWorkoutData';
import { Exercise, SetEntry } from '@/types/workout';

type WorkoutPhase = 'exercise' | 'rest' | 'complete';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const { activeWorkout, update, completeSet, end } = useActiveWorkout();
  const { exercises } = useExercises();
  const { getLastSet } = useSetEntries();
  const { settings } = useSettings();
  const { updatePlannedWorkout } = usePlannedWorkouts();
  
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
  
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inSetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get current exercise
  const currentExercise = activeWorkout 
    ? exercises.find(e => e.id === activeWorkout.routine.exercises[activeWorkout.currentExerciseIndex]?.exerciseId)
    : null;
  
  const currentRoutineExercise = activeWorkout?.routine.exercises[activeWorkout.currentExerciseIndex];
  
  // Load last set data for auto-fill
  useEffect(() => {
    if (currentExercise) {
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
  }, [currentExercise, getLastSet, activeWorkout?.currentSetIndex]);

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
      // Create a simple beep using Web Audio API
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
    if (!activeWorkout || !currentExercise || !currentRoutineExercise) return;
    
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
    const isLastSet = activeWorkout.currentSetIndex >= currentRoutineExercise.targetSets - 1;
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.routine.exercises.length - 1;
    
    if (isLastSet && isLastExercise) {
      // Workout complete!
      setPhase('complete');
    } else if (isLastSet) {
      // Move to next exercise
      update({
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
      setRestTimeLeft(activeWorkout.routine.restBetweenExercises);
      setPhase('rest');
    } else {
      // Next set
      update({
        currentSetIndex: activeWorkout.currentSetIndex + 1,
      });
      setRestTimeLeft(currentRoutineExercise.restBetweenSets);
      setPhase('rest');
    }
  };

  const handleSkipSet = () => {
    if (!activeWorkout || !currentRoutineExercise) return;
    
    const isLastSet = activeWorkout.currentSetIndex >= currentRoutineExercise.targetSets - 1;
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.routine.exercises.length - 1;
    
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
    
    const isLastExercise = activeWorkout.currentExerciseIndex >= activeWorkout.routine.exercises.length - 1;
    
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
        <p className="text-muted-foreground mb-8">{activeWorkout.routine.name}</p>
        
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
        
        <Button 
          size="lg" 
          className="w-full max-w-xs tap-target bg-gradient-primary"
          onClick={handleEndWorkout}
        >
          Done
        </Button>
      </motion.div>
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
          <p className="text-sm text-muted-foreground">{activeWorkout.routine.name}</p>
          <p className="text-xs text-muted-foreground">
            Exercise {activeWorkout.currentExerciseIndex + 1} of {activeWorkout.routine.exercises.length}
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
          ) : (
            // Exercise phase
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col p-6"
            >
              {/* Exercise info */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">{currentExercise?.name || 'Unknown Exercise'}</h1>
                <p className="text-lg text-primary font-semibold">
                  Set {activeWorkout.currentSetIndex + 1} of {currentRoutineExercise?.targetSets || 0}
                </p>
                {currentExercise?.type === 'reps' && currentRoutineExercise?.targetReps && (
                  <p className="text-muted-foreground">Target: {currentRoutineExercise.targetReps} reps</p>
                )}
                {currentExercise?.type === 'time' && currentRoutineExercise?.targetDuration && (
                  <p className="text-muted-foreground">Target: {formatTime(currentRoutineExercise.targetDuration)}</p>
                )}
              </div>
              
              {/* Last set reference */}
              {lastSetData && (
                <div className="bg-surface rounded-xl p-3 mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Previous</p>
                  <p className="text-sm">
                    {lastSetData.weight && `${lastSetData.weight}kg × `}
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
                    <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
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
    </div>
  );
}
