import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Exercise,
  Routine,
  PlannedWorkout,
  WorkoutSession,
  WorkoutExercise,
  SetEntry,
  AppSettings,
  ActiveWorkoutState,
} from '@/types/workout';
import * as db from '@/lib/db';

// Hook for exercises
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getAllExercises();
    setExercises(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveExercise(newExercise);
    await refresh();
    return newExercise;
  };

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
    const existing = await db.getExercise(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      await db.saveExercise(updated);
      await refresh();
    }
  };

  const removeExercise = async (id: string) => {
    await db.deleteExercise(id);
    await refresh();
  };

  return { exercises, loading, refresh, addExercise, updateExercise, removeExercise };
}

// Hook for routines
export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getAllRoutines();
    setRoutines(data.reverse()); // Most recent first
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRoutine = async (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveRoutine(newRoutine);
    await refresh();
    return newRoutine;
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    const existing = await db.getRoutine(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      await db.saveRoutine(updated);
      await refresh();
    }
  };

  const removeRoutine = async (id: string) => {
    await db.deleteRoutine(id);
    await refresh();
  };

  return { routines, loading, refresh, addRoutine, updateRoutine, removeRoutine };
}

// Hook for planned workouts
export function usePlannedWorkouts() {
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getAllPlannedWorkouts();
    setPlannedWorkouts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getByMonth = async (year: number, month: number) => {
    return db.getPlannedWorkoutsByMonth(year, month);
  };

  const addPlannedWorkout = async (planned: Omit<PlannedWorkout, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlanned: PlannedWorkout = {
      ...planned,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.savePlannedWorkout(newPlanned);
    await refresh();
    return newPlanned;
  };

  const updatePlannedWorkout = async (id: string, updates: Partial<PlannedWorkout>) => {
    const existing = await db.getAllPlannedWorkouts().then(all => all.find(p => p.id === id));
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      await db.savePlannedWorkout(updated);
      await refresh();
    }
  };

  const removePlannedWorkout = async (id: string) => {
    await db.deletePlannedWorkout(id);
    await refresh();
  };

  return { plannedWorkouts, loading, refresh, getByMonth, addPlannedWorkout, updatePlannedWorkout, removePlannedWorkout };
}

// Hook for workout sessions
export function useSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getAllSessions();
    setSessions(data.reverse()); // Most recent first
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getByMonth = async (year: number, month: number) => {
    return db.getSessionsByMonth(year, month);
  };

  const startSession = async (routineId?: string, plannedWorkoutId?: string) => {
    const session: WorkoutSession = {
      id: uuidv4(),
      routineId,
      plannedWorkoutId,
      startedAt: Date.now(),
      status: 'active',
    };
    await db.saveSession(session);
    await refresh();
    return session;
  };

  const endSession = async (id: string, status: 'completed' | 'abandoned') => {
    const existing = await db.getSession(id);
    if (existing) {
      const updated = { ...existing, endedAt: Date.now(), status };
      await db.saveSession(updated);
      await refresh();
    }
  };

  const getActiveSession = async () => {
    return db.getActiveSession();
  };

  return { sessions, loading, refresh, getByMonth, startSession, endSession, getActiveSession };
}

// Hook for set entries
export function useSetEntries() {
  const getBySession = async (sessionId: string) => {
    return db.getSetEntriesBySession(sessionId);
  };

  const getByExercise = async (exerciseId: string) => {
    return db.getSetEntriesByExercise(exerciseId);
  };

  const getLastSet = async (exerciseId: string) => {
    return db.getLastSetForExercise(exerciseId);
  };

  const addSetEntry = async (entry: Omit<SetEntry, 'id' | 'completedAt'>) => {
    const newEntry: SetEntry = {
      ...entry,
      id: uuidv4(),
      completedAt: Date.now(),
    };
    await db.saveSetEntry(newEntry);
    return newEntry;
  };

  const getAll = async () => {
    return db.getAllSetEntries();
  };

  return { getBySession, getByExercise, getLastSet, addSetEntry, getAll };
}

// Hook for settings
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(db.DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getSettings();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    await db.saveSettings(updated);
    setSettings(updated);
  };

  return { settings, loading, refresh, updateSettings };
}

// Hook for active workout state (stored in localStorage for quick access)
const ACTIVE_WORKOUT_KEY = 'ironflow-active-workout';

export function useActiveWorkout() {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (stored) {
      try {
        setActiveWorkout(JSON.parse(stored));
      } catch {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      }
    }
    setLoading(false);
  }, []);

  const save = useCallback((state: ActiveWorkoutState | null) => {
    if (state) {
      localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    }
    setActiveWorkout(state);
  }, []);

  const start = async (routine: Routine) => {
    const session: WorkoutSession = {
      id: uuidv4(),
      routineId: routine.id,
      startedAt: Date.now(),
      status: 'active',
    };
    await db.saveSession(session);

    // Convert routine exercises to workout exercises
    const workoutExercises: WorkoutExercise[] = routine.exercises.map(ex => ({
      ...ex,
      addedDuringWorkout: false,
    }));

    const state: ActiveWorkoutState = {
      session,
      routine,
      workoutExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      isPaused: false,
      isFreeWorkout: false,
    };
    save(state);
    return state;
  };

  const startFreeWorkout = async () => {
    const session: WorkoutSession = {
      id: uuidv4(),
      startedAt: Date.now(),
      status: 'active',
    };
    await db.saveSession(session);

    const state: ActiveWorkoutState = {
      session,
      workoutExercises: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      isPaused: false,
      isFreeWorkout: true,
    };
    save(state);
    return state;
  };

  const addExerciseToWorkout = (
    exerciseId: string,
    targets: { sets: number; reps?: number; duration?: number; rest: number }
  ) => {
    if (!activeWorkout) return null;

    const newWorkoutExercise: WorkoutExercise = {
      exerciseId,
      targetSets: targets.sets,
      targetReps: targets.reps,
      targetDuration: targets.duration,
      restBetweenSets: targets.rest,
      addedDuringWorkout: true,
    };

    const updated = {
      ...activeWorkout,
      workoutExercises: [...activeWorkout.workoutExercises, newWorkoutExercise],
    };
    save(updated);
    return updated;
  };

  const update = (updates: Partial<ActiveWorkoutState>) => {
    if (activeWorkout) {
      const updated = { ...activeWorkout, ...updates };
      save(updated);
      return updated;
    }
    return null;
  };

  const completeSet = async (entry: Omit<SetEntry, 'id' | 'completedAt'>) => {
    const newEntry: SetEntry = {
      ...entry,
      id: uuidv4(),
      completedAt: Date.now(),
    };
    await db.saveSetEntry(newEntry);

    if (activeWorkout) {
      const updated = {
        ...activeWorkout,
        completedSets: [...activeWorkout.completedSets, newEntry],
      };
      save(updated);
      return { state: updated, entry: newEntry };
    }
    return null;
  };

  const end = async (status: 'completed' | 'abandoned') => {
    if (activeWorkout) {
      const session = {
        ...activeWorkout.session,
        endedAt: Date.now(),
        status,
      };
      await db.saveSession(session);
      save(null);
    }
  };

  const clear = () => {
    save(null);
  };

  return { activeWorkout, loading, start, startFreeWorkout, addExerciseToWorkout, update, completeSet, end, clear };
}

// Analytics hook
export function useAnalytics() {
  const getWeeklyVolume = async (startDate: Date, endDate: Date) => {
    return db.getWeeklyMuscleVolume(startDate, endDate);
  };

  const getExerciseHistory = async (exerciseId: string, limit?: number) => {
    return db.getExerciseHistory(exerciseId, limit);
  };

  return { getWeeklyVolume, getExerciseHistory };
}
