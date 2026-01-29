import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Plus, 
  Clock,
  Dumbbell,
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { RoutinePicker } from '@/components/RoutinePicker';
import { useRoutines, useActiveWorkout, useSessions, usePlannedWorkouts } from '@/hooks/useWorkoutData';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Routine } from '@/types/workout';

export default function Home() {
  const navigate = useNavigate();
  const { routines, loading: routinesLoading } = useRoutines();
  const { activeWorkout, start, startFreeWorkout } = useActiveWorkout();
  const { sessions } = useSessions();
  const { plannedWorkouts } = usePlannedWorkouts();
  
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  
  // Check for existing active workout
  if (activeWorkout) {
    navigate('/workout');
    return null;
  }
  
  // Get today's planned workout
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysPlanned = plannedWorkouts.find(pw => pw.scheduledDate === todayStr && pw.status === 'planned');
  const todaysRoutine = todaysPlanned ? routines.find(r => r.id === todaysPlanned.routineId) : null;
  
  // Get this week's stats
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= weekStart && sessionDate <= weekEnd && s.status === 'completed';
  });

  const handleStartRoutine = async (routine: Routine) => {
    setShowRoutinePicker(false);
    await start(routine);
    navigate('/workout');
  };

  const handleStartFreeWorkout = async () => {
    await startFreeWorkout();
    navigate('/workout');
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = ((end || Date.now()) - start) / 1000 / 60;
    return `${Math.round(duration)} min`;
  };

  // Recent sessions for display
  const recentSessions = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 3);

  return (
    <Layout>
      <div className="p-4 space-y-6 safe-top">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-3xl font-bold">Iron Flow</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        
        {/* Today's planned workout */}
        {todaysRoutine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6"
          >
            <div className="relative z-10">
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">Today's Workout</p>
              <h2 className="text-2xl font-bold text-primary-foreground mb-4">{todaysRoutine.name}</h2>
              
              <Button
                size="lg"
                variant="secondary"
                className="tap-target font-semibold"
                onClick={() => handleStartRoutine(todaysRoutine)}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Start Now
              </Button>
            </div>
            
            {/* Decorative element */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-primary-foreground/10" />
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary-foreground/10" />
          </motion.div>
        )}
        
        {/* Main CTAs */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowRoutinePicker(true)}
            className="w-full bg-card rounded-2xl p-5 flex items-center gap-4 tap-target text-left border-2 border-transparent hover:border-primary/50 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Start from Routine</p>
              <p className="text-sm text-muted-foreground">Use a saved workout template</p>
            </div>
            <Play className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleStartFreeWorkout}
            className="w-full bg-card rounded-2xl p-5 flex items-center gap-4 tap-target text-left border-2 border-transparent hover:border-primary/50 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center">
              <Plus className="w-7 h-7 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Start Free Workout</p>
              <p className="text-sm text-muted-foreground">Build as you go</p>
            </div>
            <Play className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
        
        {/* Week stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-2xl p-4">
            <Dumbbell className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{thisWeekSessions.length}</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </div>
          
          <div className="bg-card rounded-2xl p-4">
            <ListChecks className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{routines.length}</p>
            <p className="text-xs text-muted-foreground">Routines</p>
          </div>
          
          <div className="bg-card rounded-2xl p-4">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{sessions.filter(s => s.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </motion.div>
        
        {/* Recent activity */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/history')}
              >
                See all
              </Button>
            </div>
            
            <div className="space-y-2">
              {recentSessions.map((session) => {
                const routine = routines.find(r => r.id === session.routineId);
                return (
                  <div
                    key={session.id}
                    className="bg-card rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{routine?.name || 'Free Workout'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.startedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatDuration(session.startedAt, session.endedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Quick access to routines */}
        {routines.length === 0 && !routinesLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card border-2 border-dashed border-border rounded-2xl p-6 text-center"
          >
            <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No routines yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a routine to get started faster</p>
            <Button onClick={() => navigate('/routines/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Routine
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Routine picker modal */}
      <RoutinePicker
        routines={routines}
        isOpen={showRoutinePicker}
        onClose={() => setShowRoutinePicker(false)}
        onSelect={handleStartRoutine}
      />
    </Layout>
  );
}
