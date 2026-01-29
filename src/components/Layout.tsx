import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Library, 
  Settings,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveWorkout } from '@/hooks/useWorkoutData';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Dumbbell, label: 'Home' },
  { path: '/exercises', icon: Library, label: 'Exercises' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/history', icon: BarChart3, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { activeWorkout } = useActiveWorkout();
  
  // Hide nav during active workout
  const isWorkoutActive = location.pathname === '/workout';
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className={cn(
        "flex-1 overflow-auto no-scrollbar",
        !isWorkoutActive && "pb-20"
      )}>
        {children}
      </main>
      
      {/* Active workout indicator */}
      {activeWorkout && !isWorkoutActive && (
        <Link to="/workout">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-20 left-4 right-4 bg-gradient-primary rounded-2xl p-4 shadow-lg glow-primary z-40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground fill-current" />
                </div>
                <div>
                  <p className="font-semibold text-primary-foreground">Workout in progress</p>
                  <p className="text-sm text-primary-foreground/80">{activeWorkout.routine?.name || 'Free Workout'}</p>
                </div>
              </div>
              <span className="text-primary-foreground font-medium">Resume →</span>
            </div>
          </motion.div>
        </Link>
      )}
      
      {/* Bottom navigation */}
      {!isWorkoutActive && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 tap-target px-3 py-2 rounded-xl transition-all",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <Icon className="w-6 h-6" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </motion.div>
                  <span className="text-2xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
