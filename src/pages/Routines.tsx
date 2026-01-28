import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Dumbbell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useRoutines, useActiveWorkout, useExercises } from '@/hooks/useWorkoutData';
import { Routine } from '@/types/workout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Routines() {
  const navigate = useNavigate();
  const { routines, loading, removeRoutine, addRoutine } = useRoutines();
  const { exercises } = useExercises();
  const { start } = useActiveWorkout();
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartRoutine = async (routine: Routine) => {
    await start(routine);
    navigate('/workout');
  };

  const handleDuplicate = async (routine: Routine) => {
    await addRoutine({
      name: `${routine.name} (Copy)`,
      exercises: routine.exercises,
      restBetweenExercises: routine.restBetweenExercises,
      notes: routine.notes,
    });
  };

  const handleDelete = async (id: string) => {
    await removeRoutine(id);
    setDeletingId(null);
  };

  const getExerciseNames = (routine: Routine) => {
    return routine.exercises
      .map(re => exercises.find(e => e.id === re.exerciseId)?.name || 'Unknown')
      .slice(0, 3)
      .join(', ') + (routine.exercises.length > 3 ? '...' : '');
  };

  return (
    <Layout>
      <div className="p-4 space-y-4 safe-top">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">Routines</h1>
          <Button
            size="sm"
            onClick={() => navigate('/routines/new')}
            className="tap-target"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
        
        {/* Routines list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : routines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">No routines yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first workout routine</p>
            <Button onClick={() => navigate('/routines/new')}>
              <Plus className="w-4 h-4 mr-1" />
              Create Routine
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {routines.map((routine, index) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl p-4"
              >
                {deletingId === routine.id ? (
                  <div className="space-y-3">
                    <p className="text-sm">Delete "{routine.name}"?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDeletingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(routine.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => handleStartRoutine(routine)}
                      className="flex-1 text-left tap-target"
                    >
                      <p className="font-semibold mb-1">{routine.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {routine.exercises.length} exercises
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {getExerciseNames(routine)}
                      </p>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="tap-target text-primary"
                        onClick={() => handleStartRoutine(routine)}
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="tap-target">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/routines/${routine.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(routine)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingId(routine.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
