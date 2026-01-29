import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  TrendingUp, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { SessionDetailModal } from '@/components/SessionDetailModal';
import { useExercises, useSessions, useSetEntries, useRoutines, useSettings } from '@/hooks/useWorkoutData';
import { SetEntry, Exercise, MuscleGroup, WorkoutSession } from '@/types/workout';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: 'hsl(0, 70%, 50%)',
  back: 'hsl(200, 70%, 50%)',
  shoulders: 'hsl(40, 70%, 50%)',
  biceps: 'hsl(280, 70%, 50%)',
  triceps: 'hsl(320, 70%, 50%)',
  forearms: 'hsl(160, 70%, 50%)',
  core: 'hsl(60, 70%, 50%)',
  quads: 'hsl(100, 70%, 50%)',
  hamstrings: 'hsl(140, 70%, 50%)',
  glutes: 'hsl(180, 70%, 50%)',
  calves: 'hsl(220, 70%, 50%)',
  cardio: 'hsl(260, 70%, 50%)',
};

export default function History() {
  const { exercises } = useExercises();
  const { sessions, refresh: refreshSessions, deleteSession } = useSessions();
  const { routines } = useRoutines();
  const { settings } = useSettings();
  const { getAll, getByExercise, getBySession, updateSetEntry, deleteSetEntry } = useSetEntries();
  
  const [allEntries, setAllEntries] = useState<SetEntry[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<SetEntry[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  // Session detail modal state
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [selectedSessionSets, setSelectedSessionSets] = useState<SetEntry[]>([]);

  // Load all entries
  useEffect(() => {
    getAll().then(setAllEntries);
  }, []);

  // Load selected exercise history
  useEffect(() => {
    if (selectedExercise) {
      getByExercise(selectedExercise).then(entries => {
        setExerciseHistory(entries.sort((a, b) => a.completedAt - b.completedAt));
      });
    }
  }, [selectedExercise]);

  // Handle session click
  const handleSessionClick = async (session: WorkoutSession) => {
    const sets = await getBySession(session.id);
    setSelectedSessionSets(sets);
    setSelectedSession(session);
  };

  // Handle update set
  const handleUpdateSet = async (entry: SetEntry) => {
    await updateSetEntry(entry);
    // Refresh the session sets
    const sets = await getBySession(entry.sessionId);
    setSelectedSessionSets(sets);
    // Refresh all entries for charts
    getAll().then(setAllEntries);
  };

  // Handle delete set
  const handleDeleteSet = async (entryId: string) => {
    await deleteSetEntry(entryId);
    // Refresh the session sets
    if (selectedSession) {
      const sets = await getBySession(selectedSession.id);
      setSelectedSessionSets(sets);
    }
    // Refresh all entries
    getAll().then(setAllEntries);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    setSelectedSession(null);
    // Refresh all entries
    getAll().then(setAllEntries);
  };

  // Calculate weekly muscle volume
  const weeklyMuscleVolume = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const volumeMap = new Map<MuscleGroup, number>();
    
    for (const entry of allEntries) {
      if (entry.completedAt >= weekStart.getTime() && entry.completedAt <= weekEnd.getTime()) {
        const exercise = exercises.find(e => e.id === entry.exerciseId);
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
    
    return Array.from(volumeMap.entries())
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);
  }, [allEntries, exercises]);

  // Prepare chart data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return [];
    
    // Group by date and get best set per day
    const byDate = new Map<string, SetEntry>();
    
    for (const entry of exerciseHistory) {
      const dateKey = format(new Date(entry.completedAt), 'MM/dd');
      const existing = byDate.get(dateKey);
      
      if (!existing || (entry.weight || 0) > (existing.weight || 0)) {
        byDate.set(dateKey, entry);
      }
    }
    
    return Array.from(byDate.entries())
      .map(([date, entry]) => ({
        date,
        weight: entry.weight || 0,
        reps: entry.reps || 0,
        duration: entry.duration || 0,
      }))
      .slice(-10); // Last 10 data points
  }, [selectedExercise, exerciseHistory, exercises]);

  // Export functions
  const exportJSON = () => {
    const data = {
      exercises,
      routines,
      sessions,
      setEntries: allEntries,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironflow-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'Duration (sec)', 'RPE', 'Notes'];
    
    const rows = allEntries
      .sort((a, b) => b.completedAt - a.completedAt)
      .map(entry => {
        const exercise = exercises.find(e => e.id === entry.exerciseId);
        return [
          format(new Date(entry.completedAt), 'yyyy-MM-dd HH:mm'),
          exercise?.name || 'Unknown',
          entry.setIndex + 1,
          entry.weight || '',
          entry.reps || '',
          entry.duration || '',
          entry.rpe || '',
          entry.notes || '',
        ].join(',');
      });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironflow-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedExerciseData = selectedExercise ? exercises.find(e => e.id === selectedExercise) : null;

  return (
    <Layout>
      <div className="p-4 space-y-6 safe-top pb-24">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">History</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="tap-target"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportJSON}
              className="tap-target"
            >
              JSON
            </Button>
          </div>
        </div>
        
        {/* Weekly muscle volume */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Weekly Muscle Volume</h2>
          
          {weeklyMuscleVolume.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Complete workouts to see your volume breakdown</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-4 space-y-3">
              {weeklyMuscleVolume.map(({ muscle, volume }, index) => {
                const maxVolume = weeklyMuscleVolume[0]?.volume || 1;
                const percentage = (volume / maxVolume) * 100;
                
                return (
                  <motion.div
                    key={muscle}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{muscle}</span>
                      <span className="text-muted-foreground">{volume.toLocaleString()} kg</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: MUSCLE_COLORS[muscle] }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Exercise progress chart */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Exercise Progress</h2>
          
          {/* Exercise selector */}
          <button
            onClick={() => setShowExerciseSelector(!showExerciseSelector)}
            className="w-full bg-card rounded-xl p-4 flex items-center justify-between tap-target mb-3"
          >
            <span className={selectedExerciseData ? 'font-medium' : 'text-muted-foreground'}>
              {selectedExerciseData?.name || 'Select an exercise'}
            </span>
            {showExerciseSelector ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {showExerciseSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-card rounded-xl overflow-hidden mb-3"
            >
              <div className="max-h-60 overflow-auto">
                {exercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setSelectedExercise(exercise.id);
                      setShowExerciseSelector(false);
                    }}
                    className={cn(
                      "w-full p-3 text-left border-b border-border last:border-0 tap-target",
                      selectedExercise === exercise.id && "bg-primary/10"
                    )}
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Chart */}
          {selectedExercise && chartData.length > 0 ? (
            <div className="bg-card rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Weight over time</span>
              </div>
            </div>
          ) : selectedExercise ? (
            <div className="bg-card rounded-2xl p-6 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No data yet for this exercise</p>
            </div>
          ) : null}
        </div>
        
        {/* Recent sessions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
          
          {sessions.filter(s => s.status === 'completed').length === 0 ? (
            <div className="bg-card rounded-2xl p-6 text-center">
              <p className="text-muted-foreground">No completed workouts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions
                .filter(s => s.status === 'completed')
                .slice(0, 10)
                .map((session, index) => {
                  const routine = routines.find(r => r.id === session.routineId);
                  const sessionSets = allEntries.filter(e => e.sessionId === session.id);
                  const duration = session.endedAt 
                    ? Math.round((session.endedAt - session.startedAt) / 1000 / 60)
                    : 0;
                  
                  return (
                    <motion.button
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="w-full bg-card rounded-xl p-4 tap-target text-left border border-border hover:border-primary/50 transition-colors"
                      onClick={() => handleSessionClick(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{routine?.name || 'Free Workout'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.startedAt), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{sessionSets.length} sets</p>
                            <p>{duration} min</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      
      {/* Session detail modal */}
      <SessionDetailModal
        session={selectedSession!}
        sessionSets={selectedSessionSets}
        exercises={exercises}
        routineName={selectedSession ? routines.find(r => r.id === selectedSession.routineId)?.name : undefined}
        settings={settings}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onUpdateSet={handleUpdateSet}
        onDeleteSet={handleDeleteSet}
        onDeleteSession={handleDeleteSession}
      />
    </Layout>
  );
}
