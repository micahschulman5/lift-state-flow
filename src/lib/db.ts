import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { 
  Exercise, 
  Routine, 
  PlannedWorkout, 
  WorkoutSession, 
  SetEntry,
  AppSettings,
  DB_NAME,
  DB_VERSION
} from '@/types/workout';

interface IronFlowDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: {
      'by-name': string;
      'by-equipment': string;
      'by-updated': number;
    };
  };
  routines: {
    key: string;
    value: Routine;
    indexes: {
      'by-name': string;
      'by-updated': number;
    };
  };
  plannedWorkouts: {
    key: string;
    value: PlannedWorkout;
    indexes: {
      'by-date': string;
      'by-routine': string;
      'by-status': string;
    };
  };
  sessions: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-started': number;
      'by-routine': string;
      'by-status': string;
    };
  };
  setEntries: {
    key: string;
    value: SetEntry;
    indexes: {
      'by-session': string;
      'by-exercise': string;
      'by-completed': number;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbInstance: IDBPDatabase<IronFlowDB> | null = null;

// Default exercises to seed on first DB creation
const DEFAULT_EXERCISES: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: "Barbell Bench Press", type: "reps", equipment: "barbell", primaryMuscles: [ { muscle: "chest", weight: 0.65 }, { muscle: "triceps", weight: 0.25 } ], secondaryMuscles: [{ muscle: "shoulders", weight: 0.10 }], movementPatterns: ["push"], mediaUrl: "/exercises/bench-press.gif" },
  { name: "Incline Dumbbell Press", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "chest", weight: 0.60 }], secondaryMuscles: [ { muscle: "shoulders", weight: 0.25 }, { muscle: "triceps", weight: 0.15 } ], movementPatterns: ["push"] },
  { name: "Push-Up", type: "reps", equipment: "bodyweight", primaryMuscles: [{ muscle: "chest", weight: 0.55 }], secondaryMuscles: [ { muscle: "triceps", weight: 0.25 }, { muscle: "shoulders", weight: 0.15 }, { muscle: "core", weight: 0.05 } ], movementPatterns: ["push"] },
  { name: "Pull-Up", type: "reps", equipment: "bodyweight", primaryMuscles: [{ muscle: "back", weight: 0.65 }], secondaryMuscles: [ { muscle: "biceps", weight: 0.20 }, { muscle: "forearms", weight: 0.10 }, { muscle: "core", weight: 0.05 } ], movementPatterns: ["pull"] },
  { name: "Lat Pulldown", type: "reps", equipment: "machine", primaryMuscles: [{ muscle: "back", weight: 0.65 }], secondaryMuscles: [ { muscle: "biceps", weight: 0.25 }, { muscle: "forearms", weight: 0.10 } ], movementPatterns: ["pull"] },
  { name: "Seated Cable Row", type: "reps", equipment: "cable", primaryMuscles: [{ muscle: "back", weight: 0.70 }], secondaryMuscles: [ { muscle: "biceps", weight: 0.20 }, { muscle: "forearms", weight: 0.10 } ], movementPatterns: ["pull"] },
  { name: "Barbell Overhead Press", type: "reps", equipment: "barbell", primaryMuscles: [{ muscle: "shoulders", weight: 0.60 }], secondaryMuscles: [ { muscle: "triceps", weight: 0.25 }, { muscle: "core", weight: 0.15 } ], movementPatterns: ["push"] },
  { name: "Dumbbell Lateral Raise", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "shoulders", weight: 0.85 }], secondaryMuscles: [{ muscle: "core", weight: 0.15 }], movementPatterns: ["isometric"] },
  { name: "Dumbbell Bicep Curl", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "biceps", weight: 0.85 }], secondaryMuscles: [{ muscle: "forearms", weight: 0.15 }], movementPatterns: ["pull"] },
  { name: "Hammer Curl", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "biceps", weight: 0.70 }], secondaryMuscles: [{ muscle: "forearms", weight: 0.30 }], movementPatterns: ["pull"] },
  { name: "Triceps Pushdown", type: "reps", equipment: "cable", primaryMuscles: [{ muscle: "triceps", weight: 0.85 }], secondaryMuscles: [{ muscle: "forearms", weight: 0.15 }], movementPatterns: ["push"] },
  { name: "Overhead Triceps Extension", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "triceps", weight: 0.85 }], secondaryMuscles: [{ muscle: "core", weight: 0.15 }], movementPatterns: ["isometric"] },
  { name: "Barbell Back Squat", type: "reps", equipment: "barbell", primaryMuscles: [ { muscle: "quads", weight: 0.50 }, { muscle: "glutes", weight: 0.35 } ], secondaryMuscles: [ { muscle: "hamstrings", weight: 0.10 }, { muscle: "core", weight: 0.05 } ], movementPatterns: ["squat"] },
  { name: "Front Squat", type: "reps", equipment: "barbell", primaryMuscles: [{ muscle: "quads", weight: 0.60 }], secondaryMuscles: [ { muscle: "glutes", weight: 0.25 }, { muscle: "core", weight: 0.15 } ], movementPatterns: ["squat"] },
  { name: "Barbell Deadlift", type: "reps", equipment: "barbell", primaryMuscles: [ { muscle: "glutes", weight: 0.40 }, { muscle: "hamstrings", weight: 0.35 } ], secondaryMuscles: [ { muscle: "back", weight: 0.15 }, { muscle: "forearms", weight: 0.10 } ], movementPatterns: ["hinge"] },
  { name: "Romanian Deadlift", type: "reps", equipment: "barbell", primaryMuscles: [{ muscle: "hamstrings", weight: 0.55 }], secondaryMuscles: [ { muscle: "glutes", weight: 0.30 }, { muscle: "back", weight: 0.15 } ], movementPatterns: ["hinge"] },
  { name: "Walking Lunge", type: "reps", equipment: "dumbbell", primaryMuscles: [ { muscle: "quads", weight: 0.45 }, { muscle: "glutes", weight: 0.40 } ], secondaryMuscles: [ { muscle: "hamstrings", weight: 0.10 }, { muscle: "core", weight: 0.05 } ], movementPatterns: ["lunge"] },
  { name: "Leg Press", type: "reps", equipment: "machine", primaryMuscles: [{ muscle: "quads", weight: 0.60 }], secondaryMuscles: [ { muscle: "glutes", weight: 0.30 }, { muscle: "hamstrings", weight: 0.10 } ], movementPatterns: ["squat"] },
  { name: "Standing Calf Raise", type: "reps", equipment: "machine", primaryMuscles: [{ muscle: "calves", weight: 0.90 }], secondaryMuscles: [{ muscle: "core", weight: 0.10 }], movementPatterns: ["isometric"] },
  { name: "Plank", type: "time", equipment: "bodyweight", primaryMuscles: [{ muscle: "core", weight: 0.90 }], secondaryMuscles: [{ muscle: "shoulders", weight: 0.10 }], movementPatterns: ["isometric"] },
  { name: "Hanging Leg Raise", type: "reps", equipment: "bodyweight", primaryMuscles: [{ muscle: "core", weight: 0.85 }], secondaryMuscles: [{ muscle: "forearms", weight: 0.15 }], movementPatterns: ["hinge"] },
  { name: "Russian Twist", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "core", weight: 0.85 }], secondaryMuscles: [{ muscle: "shoulders", weight: 0.15 }], movementPatterns: ["rotation"] },
  { name: "Jump Rope", type: "time", equipment: "other", primaryMuscles: [{ muscle: "cardio", weight: 0.70 }], secondaryMuscles: [ { muscle: "calves", weight: 0.20 }, { muscle: "core", weight: 0.10 } ], movementPatterns: ["carry"] },
  { name: "Burpees", type: "reps", equipment: "bodyweight", primaryMuscles: [{ muscle: "cardio", weight: 0.50 }], secondaryMuscles: [ { muscle: "quads", weight: 0.20 }, { muscle: "chest", weight: 0.15 }, { muscle: "core", weight: 0.15 } ], movementPatterns: ["rotation"] },
  // Cardio exercises
  { name: "Treadmill", type: "cardio", equipment: "machine", primaryMuscles: [{ muscle: "cardio", weight: 0.80 }], secondaryMuscles: [ { muscle: "quads", weight: 0.10 }, { muscle: "calves", weight: 0.10 } ], movementPatterns: ["carry"] },
  { name: "Stationary Bike", type: "cardio", equipment: "machine", primaryMuscles: [{ muscle: "cardio", weight: 0.75 }], secondaryMuscles: [ { muscle: "quads", weight: 0.15 }, { muscle: "hamstrings", weight: 0.10 } ], movementPatterns: ["carry"] },
  { name: "Elliptical", type: "cardio", equipment: "machine", primaryMuscles: [{ muscle: "cardio", weight: 0.70 }], secondaryMuscles: [ { muscle: "quads", weight: 0.15 }, { muscle: "glutes", weight: 0.15 } ], movementPatterns: ["carry"] },
  { name: "Rowing Machine", type: "cardio", equipment: "machine", primaryMuscles: [{ muscle: "cardio", weight: 0.60 }], secondaryMuscles: [ { muscle: "back", weight: 0.25 }, { muscle: "biceps", weight: 0.15 } ], movementPatterns: ["pull"] },
  { name: "Stair Climber", type: "cardio", equipment: "machine", primaryMuscles: [{ muscle: "cardio", weight: 0.70 }], secondaryMuscles: [ { muscle: "glutes", weight: 0.20 }, { muscle: "quads", weight: 0.10 } ], movementPatterns: ["carry"] },
  { name: "Outdoor Run", type: "cardio", equipment: "bodyweight", primaryMuscles: [{ muscle: "cardio", weight: 0.85 }], secondaryMuscles: [ { muscle: "quads", weight: 0.10 }, { muscle: "calves", weight: 0.05 } ], movementPatterns: ["carry"] },
  { name: "Walking", type: "cardio", equipment: "bodyweight", primaryMuscles: [{ muscle: "cardio", weight: 0.60 }], secondaryMuscles: [ { muscle: "quads", weight: 0.25 }, { muscle: "glutes", weight: 0.15 } ], movementPatterns: ["carry"] },
  // Additional exercises with media
  { name: "Barbell Preacher Curl", type: "reps", equipment: "barbell", primaryMuscles: [{ muscle: "biceps", weight: 0.90 }], secondaryMuscles: [{ muscle: "forearms", weight: 0.10 }], movementPatterns: ["pull"], mediaUrl: "/exercises/preacher-curl.gif" },
  { name: "Dumbbell Row", type: "reps", equipment: "dumbbell", primaryMuscles: [{ muscle: "back", weight: 0.70 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }, { muscle: "forearms", weight: 0.10 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-3.gif" },
  { name: "Workout 1", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-1.webp" },
  { name: "Workout 2", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-2.webp" },
  { name: "Workout 3", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-4.webp" },
  { name: "Workout 4", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-5.webp" },
  { name: "Workout 5", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-6.webp" },
  { name: "Workout 6", type: "reps", equipment: "other", primaryMuscles: [{ muscle: "back", weight: 0.80 }], secondaryMuscles: [{ muscle: "biceps", weight: 0.20 }], movementPatterns: ["pull"], mediaUrl: "/exercises/back-workout-7.webp" },
];

export async function getDB(): Promise<IDBPDatabase<IronFlowDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<IronFlowDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Exercises store
      if (!db.objectStoreNames.contains('exercises')) {
        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
        exerciseStore.createIndex('by-name', 'name');
        exerciseStore.createIndex('by-equipment', 'equipment');
        exerciseStore.createIndex('by-updated', 'updatedAt');

        // Seed default exercises on initial creation
        try {
          for (const ex of DEFAULT_EXERCISES) {
            const newExercise: Exercise = {
              ...ex,
              id: uuidv4(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            } as Exercise;
            exerciseStore.add(newExercise);
          }
        } catch (err) {
          // ignore seeding errors during upgrade
          console.warn('Failed to seed default exercises', err);
        }
      }

      // Routines store
      if (!db.objectStoreNames.contains('routines')) {
        const routineStore = db.createObjectStore('routines', { keyPath: 'id' });
        routineStore.createIndex('by-name', 'name');
        routineStore.createIndex('by-updated', 'updatedAt');
      }

      // Planned workouts store
      if (!db.objectStoreNames.contains('plannedWorkouts')) {
        const plannedStore = db.createObjectStore('plannedWorkouts', { keyPath: 'id' });
        plannedStore.createIndex('by-date', 'scheduledDate');
        plannedStore.createIndex('by-routine', 'routineId');
        plannedStore.createIndex('by-status', 'status');
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-started', 'startedAt');
        sessionStore.createIndex('by-routine', 'routineId');
        sessionStore.createIndex('by-status', 'status');
      }

      // Set entries store
      if (!db.objectStoreNames.contains('setEntries')) {
        const setStore = db.createObjectStore('setEntries', { keyPath: 'id' });
        setStore.createIndex('by-session', 'sessionId');
        setStore.createIndex('by-exercise', 'exerciseId');
        setStore.createIndex('by-completed', 'completedAt');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Exercise operations
export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAllFromIndex('exercises', 'by-name');
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get('exercises', id);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const db = await getDB();
  await db.put('exercises', exercise);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('exercises', id);
}

// Routine operations
export async function getAllRoutines(): Promise<Routine[]> {
  const db = await getDB();
  return db.getAllFromIndex('routines', 'by-updated');
}

export async function getRoutine(id: string): Promise<Routine | undefined> {
  const db = await getDB();
  return db.get('routines', id);
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const db = await getDB();
  await db.put('routines', routine);
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('routines', id);
}

// Planned Workout operations
export async function getAllPlannedWorkouts(): Promise<PlannedWorkout[]> {
  const db = await getDB();
  return db.getAll('plannedWorkouts');
}

export async function getPlannedWorkoutsByMonth(year: number, month: number): Promise<PlannedWorkout[]> {
  const db = await getDB();
  const all = await db.getAll('plannedWorkouts');
  return all.filter(pw => {
    const date = new Date(pw.scheduledDate);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

export async function savePlannedWorkout(planned: PlannedWorkout): Promise<void> {
  const db = await getDB();
  await db.put('plannedWorkouts', planned);
}

export async function deletePlannedWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('plannedWorkouts', id);
}

// Session operations
export async function getAllSessions(): Promise<WorkoutSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-started');
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-status', 'active');
  return all[0];
}

export async function getSessionsByMonth(year: number, month: number): Promise<WorkoutSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-started');
  return all.filter(s => {
    const date = new Date(s.startedAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

// Set entry operations
export async function getSetEntriesBySession(sessionId: string): Promise<SetEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('setEntries', 'by-session', sessionId);
}

export async function getSetEntriesByExercise(exerciseId: string): Promise<SetEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('setEntries', 'by-exercise', exerciseId);
}

export async function getLastSetForExercise(exerciseId: string): Promise<SetEntry | undefined> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('setEntries', 'by-exercise', exerciseId);
  return entries.sort((a, b) => b.completedAt - a.completedAt)[0];
}

export async function saveSetEntry(entry: SetEntry): Promise<void> {
  const db = await getDB();
  await db.put('setEntries', entry);
}

export async function deleteSetEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('setEntries', id);
}

export async function getAllSetEntries(): Promise<SetEntry[]> {
  const db = await getDB();
  return db.getAll('setEntries');
}

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const result = await db.get('settings', 'user-settings');
  if (result) {
    // Remove the id field we added for storage
    const { ...settings } = result as AppSettings & { id?: string };
    return settings;
  }
  return undefined;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  // Store with an id key for IndexedDB
  await db.put('settings', { ...settings, id: 'user-settings' } as AppSettings & { id: string });
}

// Analytics queries
export async function getWeeklyMuscleVolume(weekStart: Date): Promise<Record<string, number>> {
  const db = await getDB();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const allEntries = await db.getAll('setEntries');
  const weekEntries = allEntries.filter(e => 
    e.completedAt >= weekStart.getTime() && e.completedAt < weekEnd.getTime()
  );
  
  const exercises = await db.getAll('exercises');
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  
  const volume: Record<string, number> = {};
  
  for (const entry of weekEntries) {
    const exercise = exerciseMap.get(entry.exerciseId);
    if (!exercise) continue;
    
    const setVolume = (entry.reps || 1) * (entry.weight || 0);
    
    for (const muscle of exercise.primaryMuscles) {
      volume[muscle.muscle] = (volume[muscle.muscle] || 0) + setVolume * muscle.weight;
    }
    for (const muscle of exercise.secondaryMuscles) {
      volume[muscle.muscle] = (volume[muscle.muscle] || 0) + setVolume * muscle.weight;
    }
  }
  
  return volume;
}

export async function getExerciseHistory(exerciseId: string): Promise<SetEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('setEntries', 'by-exercise', exerciseId);
  return entries.sort((a, b) => a.completedAt - b.completedAt);
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultRestBetweenSets: 90,
  defaultRestBetweenExercises: 120,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  weightUnit: 'lbs',
  distanceUnit: 'miles',
};