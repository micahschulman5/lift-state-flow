import { openDB, DBSchema, IDBPDatabase } from 'idb';
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

// Planned workout operations
export async function getAllPlannedWorkouts(): Promise<PlannedWorkout[]> {
  const db = await getDB();
  return db.getAllFromIndex('plannedWorkouts', 'by-date');
}

export async function getPlannedWorkoutsByDate(date: string): Promise<PlannedWorkout[]> {
  const db = await getDB();
  return db.getAllFromIndex('plannedWorkouts', 'by-date', date);
}

export async function getPlannedWorkoutsByMonth(year: number, month: number): Promise<PlannedWorkout[]> {
  const db = await getDB();
  const all = await db.getAll('plannedWorkouts');
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  return all.filter(pw => pw.scheduledDate >= startDate && pw.scheduledDate <= endDate);
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
  const sessions = await db.getAllFromIndex('sessions', 'by-status', 'active');
  return sessions[0];
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
export const DEFAULT_SETTINGS: AppSettings = {
  defaultRestBetweenSets: 90,
  defaultRestBetweenExercises: 120,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app-settings');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'app-settings' } as AppSettings & { id: string });
}

// Analytics queries
export async function getWeeklyMuscleVolume(
  startDate: Date, 
  endDate: Date
): Promise<Map<string, number>> {
  const db = await getDB();
  const entries = await db.getAll('setEntries');
  const exercises = await db.getAll('exercises');
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  
  const volumeMap = new Map<string, number>();
  
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  for (const entry of entries) {
    if (entry.completedAt >= startTime && entry.completedAt <= endTime) {
      const exercise = exerciseMap.get(entry.exerciseId);
      if (exercise) {
        const weight = entry.weight || 0;
        const reps = entry.reps || 1;
        const volume = weight * reps;
        
        for (const muscle of exercise.primaryMuscles) {
          const current = volumeMap.get(muscle.muscle) || 0;
          volumeMap.set(muscle.muscle, current + volume * muscle.weight);
        }
        for (const muscle of exercise.secondaryMuscles) {
          const current = volumeMap.get(muscle.muscle) || 0;
          volumeMap.set(muscle.muscle, current + volume * muscle.weight * 0.5);
        }
      }
    }
  }
  
  return volumeMap;
}

export async function getExerciseHistory(
  exerciseId: string,
  limit?: number
): Promise<SetEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('setEntries', 'by-exercise', exerciseId);
  const sorted = entries.sort((a, b) => b.completedAt - a.completedAt);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getSessionsByMonth(year: number, month: number): Promise<WorkoutSession[]> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  
  const startDate = new Date(year, month - 1, 1).getTime();
  const endDate = new Date(year, month, 0, 23, 59, 59).getTime();
  
  return all.filter(s => s.startedAt >= startDate && s.startedAt <= endDate);
}
