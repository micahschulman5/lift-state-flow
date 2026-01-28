import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Check,
  X,
  Calendar as CalendarIcon,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { usePlannedWorkouts, useRoutines, useSessions } from '@/hooks/useWorkoutData';
import { PlannedWorkout } from '@/types/workout';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isPast
} from 'date-fns';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  
  const { plannedWorkouts, addPlannedWorkout, updatePlannedWorkout, removePlannedWorkout, getByMonth } = usePlannedWorkouts();
  const { routines } = useRoutines();
  const { sessions, getByMonth: getSessionsByMonth } = useSessions();
  
  const [monthPlanned, setMonthPlanned] = useState<PlannedWorkout[]>([]);
  const [monthSessions, setMonthSessions] = useState<any[]>([]);

  // Load data for current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    getByMonth(year, month).then(setMonthPlanned);
    getSessionsByMonth(year, month).then(setMonthSessions);
  }, [currentMonth, plannedWorkouts, sessions]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate streak
  const calculateStreak = () => {
    const completedSessions = sessions
      .filter(s => s.status === 'completed')
      .map(s => format(new Date(s.startedAt), 'yyyy-MM-dd'))
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort()
      .reverse();
    
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    let checkDate = today;
    
    for (const date of completedSessions) {
      if (date === checkDate || date === format(subMonths(new Date(checkDate), 0), 'yyyy-MM-dd')) {
        streak++;
        checkDate = format(new Date(new Date(date).getTime() - 86400000), 'yyyy-MM-dd');
      } else if (date < checkDate) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // Get day status
  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = monthPlanned.find(p => p.scheduledDate === dateStr);
    const hasSession = monthSessions.some(s => 
      format(new Date(s.startedAt), 'yyyy-MM-dd') === dateStr && s.status === 'completed'
    );
    
    if (hasSession || planned?.status === 'completed') {
      return 'completed';
    }
    if (planned?.status === 'missed') {
      return 'missed';
    }
    if (planned?.status === 'planned') {
      return isPast(date) && !isToday(date) ? 'overdue' : 'planned';
    }
    return null;
  };

  const handleAddPlannedWorkout = async (routineId: string) => {
    if (!selectedDate) return;
    
    await addPlannedWorkout({
      routineId,
      scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
      status: 'planned',
    });
    
    setShowRoutinePicker(false);
    setSelectedDate(null);
  };

  const handleMarkMissed = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = monthPlanned.find(p => p.scheduledDate === dateStr);
    
    if (planned) {
      await updatePlannedWorkout(planned.id, { status: 'missed' });
    }
  };

  const handleReschedule = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = monthPlanned.find(p => p.scheduledDate === dateStr);
    
    if (planned) {
      // Move to tomorrow
      const tomorrow = format(new Date(date.getTime() + 86400000), 'yyyy-MM-dd');
      await updatePlannedWorkout(planned.id, { scheduledDate: tomorrow });
    }
  };

  const handleRemovePlanned = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = monthPlanned.find(p => p.scheduledDate === dateStr);
    
    if (planned) {
      await removePlannedWorkout(planned.id);
    }
  };

  // Count workouts this month
  const workoutsThisMonth = monthSessions.filter(s => s.status === 'completed').length;

  return (
    <Layout>
      <div className="p-4 space-y-6 safe-top">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-warning rounded-2xl p-4"
          >
            <Flame className="w-6 h-6 text-warning-foreground mb-2" />
            <p className="display-md text-warning-foreground">{streak}</p>
            <p className="text-sm text-warning-foreground/80">Day streak</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl p-4"
          >
            <CalendarIcon className="w-6 h-6 text-primary mb-2" />
            <p className="display-md">{workoutsThisMonth}</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </motion.div>
        </div>
        
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="tap-target"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="tap-target"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Calendar grid */}
        <div className="bg-card rounded-2xl p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const status = getDayStatus(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <motion.button
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center relative tap-target text-sm",
                    !isCurrentMonth && "opacity-30",
                    isSelected && "ring-2 ring-primary",
                    isToday(day) && "font-bold",
                    status === 'completed' && "bg-success/20",
                    status === 'missed' && "bg-destructive/20",
                    status === 'planned' && "bg-primary/10",
                    status === 'overdue' && "bg-warning/20"
                  )}
                >
                  <span className={cn(
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Status indicator */}
                  {status && (
                    <div className={cn(
                      "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                      status === 'completed' && "bg-success",
                      status === 'missed' && "bg-destructive",
                      status === 'planned' && "bg-primary",
                      status === 'overdue' && "bg-warning"
                    )} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Missed</span>
          </div>
        </div>
        
        {/* Selected day actions */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{format(selectedDate, 'EEEE, MMM d')}</h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {(() => {
                const status = getDayStatus(selectedDate);
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const planned = monthPlanned.find(p => p.scheduledDate === dateStr);
                const routine = planned ? routines.find(r => r.id === planned.routineId) : null;
                
                if (status === 'completed') {
                  return (
                    <div className="flex items-center gap-2 text-success">
                      <Check className="w-5 h-5" />
                      <span>Workout completed!</span>
                    </div>
                  );
                }
                
                if (status === 'missed') {
                  return (
                    <div className="text-sm text-muted-foreground">
                      Marked as missed
                    </div>
                  );
                }
                
                if (status === 'planned' || status === 'overdue') {
                  return (
                    <div className="space-y-3">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Planned: </span>
                        {routine?.name || 'Unknown routine'}
                      </p>
                      
                      {status === 'overdue' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReschedule(selectedDate)}
                            className="flex-1"
                          >
                            Move to tomorrow
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleMarkMissed(selectedDate)}
                            className="flex-1"
                          >
                            Mark missed
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePlanned(selectedDate)}
                        className="w-full text-muted-foreground"
                      >
                        Remove planned workout
                      </Button>
                    </div>
                  );
                }
                
                return (
                  <Button
                    onClick={() => setShowRoutinePicker(true)}
                    className="w-full tap-target"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan a workout
                  </Button>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Routine picker modal */}
      {showRoutinePicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setShowRoutinePicker(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Select Routine</h2>
            </div>
            
            <div className="overflow-auto max-h-[60vh] p-4">
              {routines.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No routines yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {routines.map(routine => (
                    <button
                      key={routine.id}
                      onClick={() => handleAddPlannedWorkout(routine.id)}
                      className="w-full bg-surface rounded-xl p-4 text-left tap-target"
                    >
                      <p className="font-medium">{routine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {routine.exercises.length} exercises
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
