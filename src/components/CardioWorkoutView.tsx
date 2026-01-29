import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, Mountain, Zap, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise, SetEntry, AppSettings } from '@/types/workout';

interface CardioWorkoutViewProps {
  exercise: Exercise;
  sessionId: string;
  settings: AppSettings;
  onComplete: (entry: Omit<SetEntry, 'id' | 'completedAt'>) => Promise<void>;
  onSkip: () => void;
}

export function CardioWorkoutView({
  exercise,
  sessionId,
  settings,
  onComplete,
  onSkip,
}: CardioWorkoutViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [incline, setIncline] = useState<string>('0');
  const [speed, setSpeed] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    pausedTimeRef.current = 0;
  };

  const handleComplete = async () => {
    setIsRunning(false);
    
    const entryData: Omit<SetEntry, 'id' | 'completedAt'> = {
      sessionId,
      exerciseId: exercise.id,
      setIndex: 0,
      duration: elapsedTime || undefined,
      incline: parseFloat(incline) || undefined,
      speed: parseFloat(speed) || undefined,
      distance: parseFloat(distance) || undefined,
      notes: notes || undefined,
    };
    
    await onComplete(entryData);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedUnit = settings.distanceUnit === 'miles' ? 'mph' : 'kph';
  const distanceLabel = settings.distanceUnit === 'miles' ? 'mi' : 'km';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col p-6 overflow-auto"
    >
      {/* Exercise info */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{exercise.name}</h1>
        <p className="text-muted-foreground">Cardio Session</p>
      </div>
      
      {/* Stopwatch display */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent rounded-3xl p-8 mb-6 text-center">
        <p className="text-6xl font-mono font-bold text-primary mb-6">
          {formatTime(elapsedTime)}
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button
            variant={isRunning ? 'destructive' : 'default'}
            size="lg"
            className="tap-target w-20 h-20 rounded-full"
            onClick={handleToggle}
          >
            {isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="tap-target w-20 h-20 rounded-full"
            onClick={handleReset}
            disabled={isRunning && elapsedTime === 0}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Cardio settings */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Mountain className="w-4 h-4" />
              Incline %
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={incline}
              onChange={(e) => setIncline(e.target.value)}
              className="text-lg font-semibold text-center tap-target"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Speed ({speedUnit})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="text-lg font-semibold text-center tap-target"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Distance ({distanceLabel})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="text-lg font-semibold text-center tap-target"
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Notes</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="tap-target"
            placeholder="Optional notes..."
          />
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-auto pt-6 space-y-3">
        <Button
          size="lg"
          className="w-full tap-target bg-gradient-success text-success-foreground font-semibold text-lg"
          onClick={handleComplete}
          disabled={elapsedTime === 0 && !distance}
        >
          <Check className="w-5 h-5 mr-2" />
          Complete Cardio
        </Button>
        
        <Button
          variant="ghost"
          className="w-full tap-target text-muted-foreground"
          onClick={onSkip}
        >
          Skip
        </Button>
      </div>
    </motion.div>
  );
}
