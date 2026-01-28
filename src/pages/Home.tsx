import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play, 
  ChevronRight, 
  Dumbbell,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useRoutines, useActiveWorkout, useSessions, usePlannedWorkouts } from '@/hooks/useWorkoutData';
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const { routines, loading: routinesLoading } = useRoutines();
  const { start } = useActiveWorkout();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { plannedWorkouts } = usePlannedWorkouts();
  
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
  
  // Get recent sessions
  const recentSessions = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 3);

  const handleStartRoutine = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      await start(routine);
      navigate('/workout');
    }
  };

  const handleQuickStart = () => {
    if (todaysRoutine) {
      handleStartRoutine(todaysRoutine.id);
    } else if (routines.length > 0) {
      handleStartRoutine(routines[0].id);
    } else {
      navigate('/routines/new');
    }
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = ((end || Date.now()) - start) / 1000 / 60;
    return `${Math.round(duration)} min`;
  };

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
        
        {/* Quick start card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6"
        >
          <div className="relative z-10">
            {todaysRoutine ? (
              <>
                <p className="text-primary-foreground/80 text-sm font-medium mb-1">Today's Workout</p>
                <h2 className="text-2xl font-bold text-primary-foreground mb-4">{todaysRoutine.name}</h2>
              </>
            ) : (
              <>
                <p className="text-primary-foreground/80 text-sm font-medium mb-1">Ready to train?</p>
                <h2 className="text-2xl font-bold text-primary-foreground mb-4">
                  {routines.length > 0 ? 'Start a workout' : 'Create your first routine'}
                </h2>
              </>
            )}
            
            <Button
              size="lg"
              variant="secondary"
              className="tap-target font-semibold"
              onClick={handleQuickStart}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              {routines.length > 0 ? 'Start Now' : 'Create Routine'}
            </Button>
          </div>
          
          {/* Decorative element */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-primary-foreground/10" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary-foreground/10" />
        </motion.div>
        
        {/* Week stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4"
          >
            <Dumbbell className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{thisWeekSessions.length}</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl p-4"
          >
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{sessions.filter(s => s.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4"
          >
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="display-md">{routines.length}</p>
            <p className="text-xs text-muted-foreground">Routines</p>
          </motion.div>
        </div>
        
        {/* Routines section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your Routines</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate('/routines/new')}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          {routinesLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : routines.length === 0 ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => navigate('/routines/new')}
              className="w-full bg-card border-2 border-dashed border-border rounded-2xl p-6 text-center tap-target"
            >
              <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">Create your first routine</p>
              <p className="text-sm text-muted-foreground">Add exercises and start training</p>
            </motion.button>
          ) : (
            <div className="space-y-3">
              {routines.slice(0, 3).map((routine, index) => (
                <motion.button
                  key={routine.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStartRoutine(routine.id)}
                  className="w-full bg-card rounded-2xl p-4 flex items-center justify-between tap-target text-left"
                >
                  <div>
                    <p className="font-semibold">{routine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {routine.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </motion.button>
              ))}
              
              {routines.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full tap-target text-muted-foreground"
                  onClick={() => navigate('/routines')}
                >
                  View all {routines.length} routines
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Recent activity */}
        {recentSessions.length > 0 && (
          <div>
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
              {recentSessions.map((session, index) => {
                const routine = routines.find(r => r.id === session.routineId);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{routine?.name || 'Workout'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.startedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatDuration(session.startedAt, session.endedAt)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
