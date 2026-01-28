// Core data types for the workout app

export type ExerciseType = 'reps' | 'time';

export type EquipmentType = 
  | 'barbell' 
  | 'dumbbell' 
  | 'cable' 
  | 'machine' 
  | 'bodyweight' 
  | 'kettlebell' 
  | 'bands' 
  | 'other';

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'core' 
  | 'quads' 
  | 'hamstrings' 
  | 'glutes' 
  | 'calves'
  | 'cardio';

export type MovementPattern = 
  | 'push' 
  | 'pull' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'carry' 
  | 'rotation' 
  | 'isometric';

export type MovementPlane = 'horizontal' | 'vertical' | 'lateral';

export interface MuscleWeight {
  muscle: MuscleGroup;
  weight: number; // 0-1
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  equipment: EquipmentType;
  primaryMuscles: MuscleWeight[];
  secondaryMuscles: MuscleWeight[];
  movementPatterns: MovementPattern[];
  movementPlane?: MovementPlane;
  notes?: string;
  mediaBlob?: Blob;
  mediaType?: 'image' | 'gif';
  createdAt: number;
  updatedAt: number;
}

export interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps?: number; // for reps-based
  targetDuration?: number; // seconds, for time-based
  restBetweenSets: number; // seconds
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  restBetweenExercises: number; // seconds
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlannedWorkout {
  id: string;
  routineId: string;
  scheduledDate: string; // YYYY-MM-DD
  status: 'planned' | 'completed' | 'missed' | 'skipped';
  sessionId?: string; // links to completed session
  createdAt: number;
  updatedAt: number;
}

export interface SetEntry {
  id: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  reps?: number;
  duration?: number; // seconds
  weight?: number;
  rpe?: number; // 1-10
  notes?: string;
  completedAt: number;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  plannedWorkoutId?: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'completed' | 'abandoned';
  notes?: string;
}

// Active workout state types
export interface ActiveWorkoutState {
  session: WorkoutSession;
  routine: Routine;
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: SetEntry[];
  restTimerEnd?: number;
  inSetTimerStart?: number;
  isPaused: boolean;
  pausedAt?: number;
}

// Settings
export interface AppSettings {
  defaultRestBetweenSets: number;
  defaultRestBetweenExercises: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
}

// Database schema version
export const DB_VERSION = 1;
export const DB_NAME = 'ironflow-db';
