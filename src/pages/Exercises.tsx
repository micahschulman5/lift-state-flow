import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  X,
  Dumbbell,
  Timer,
  ChevronRight,
  Image as ImageIcon } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/Layout';
import { useExercises } from '@/hooks/useWorkoutData';
import {
  Exercise,
  EquipmentType,
  MuscleGroup,
  MovementPattern } from
'@/types/workout';
import { cn } from '@/lib/utils';

const EQUIPMENT_OPTIONS: EquipmentType[] = [
'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other'];


const MUSCLE_OPTIONS: MuscleGroup[] = [
'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'];


const MOVEMENT_OPTIONS: MovementPattern[] = [
'push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isometric'];


export default function Exercises() {
  const navigate = useNavigate();
  const { exercises, loading } = useExercises();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<MovementPattern[]>([]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase();
        if (!exercise.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Equipment filter
      if (selectedEquipment.length > 0) {
        if (!selectedEquipment.includes(exercise.equipment)) {
          return false;
        }
      }

      // Muscle filter
      if (selectedMuscles.length > 0) {
        const exerciseMuscles = [
        ...exercise.primaryMuscles.map((m) => m.muscle),
        ...exercise.secondaryMuscles.map((m) => m.muscle)];

        if (!selectedMuscles.some((m) => exerciseMuscles.includes(m))) {
          return false;
        }
      }

      // Movement filter
      if (selectedMovements.length > 0) {
        if (!selectedMovements.some((m) => exercise.movementPatterns.includes(m))) {
          return false;
        }
      }

      return true;
    });
  }, [exercises, search, selectedEquipment, selectedMuscles, selectedMovements]);

  const hasActiveFilters = selectedEquipment.length > 0 || selectedMuscles.length > 0 || selectedMovements.length > 0;

  const clearFilters = () => {
    setSelectedEquipment([]);
    setSelectedMuscles([]);
    setSelectedMovements([]);
  };

  const toggleFilter = <T extends string,>(
  value: T,
  selected: T[],
  setSelected: React.Dispatch<React.SetStateAction<T[]>>) =>
  {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-4 safe-top">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">Exercises</h1>
          <Button
            size="sm"
            onClick={() => navigate('/exercises/new')}
            className="tap-target bg-foreground text-background hover:bg-foreground/90 font-semibold">

            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Search and filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 tap-target" />

          </div>
          <Button
            variant={hasActiveFilters ? 'default' : 'outline'}
            size="icon"
            className="tap-target shrink-0"
            onClick={() => setShowFilters(!showFilters)}>

            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Filter panel */}
        <AnimatePresence>
          {showFilters &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">

              <div className="bg-card rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Filters</p>
                  {hasActiveFilters &&
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                }
                </div>
                
                {/* Equipment */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((equip) =>
                  <button
                    key={equip}
                    onClick={() => toggleFilter(equip, selectedEquipment, setSelectedEquipment)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                      selectedEquipment.includes(equip) ?
                      "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>

                        {equip}
                      </button>
                  )}
                  </div>
                </div>
                
                {/* Muscles */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Muscle Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_OPTIONS.map((muscle) =>
                  <button
                    key={muscle}
                    onClick={() => toggleFilter(muscle, selectedMuscles, setSelectedMuscles)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                      selectedMuscles.includes(muscle) ?
                      "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>

                        {muscle}
                      </button>
                  )}
                  </div>
                </div>
                
                {/* Movement patterns */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Movement Pattern</p>
                  <div className="flex flex-wrap gap-2">
                    {MOVEMENT_OPTIONS.map((movement) =>
                  <button
                    key={movement}
                    onClick={() => toggleFilter(movement, selectedMovements, setSelectedMovements)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                      selectedMovements.includes(movement) ?
                      "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>

                        {movement}
                      </button>
                  )}
                  </div>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
        
        {/* Exercise count */}
        <p className="text-sm text-muted-foreground">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </p>
        
        {/* Exercise list */}
        {loading ?
        <div className="space-y-3">
            {[1, 2, 3].map((i) =>
          <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
          )}
          </div> :
        filteredExercises.length === 0 ?
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12">

            {exercises.length === 0 ?
          <>
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">No exercises yet</p>
                <p className="text-sm text-muted-foreground mb-4">Add your first exercise to get started</p>
                <Button onClick={() => navigate('/exercises/new')}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Exercise
                </Button>
              </> :

          <>
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">No matches found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </>
          }
          </motion.div> :

        <div className="space-y-2">
            {filteredExercises.map((exercise, index) =>
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            onClick={() => navigate(`/exercises/${exercise.id}`)} />

          )}
          </div>
        }
      </div>
    </Layout>);

}

function ExerciseCard({
  exercise,
  index,
  onClick




}: {exercise: Exercise;index: number;onClick: () => void;}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load image blob if available
  useState(() => {
    if (exercise.mediaBlob) {
      const url = URL.createObjectURL(exercise.mediaBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  });

  const primaryMuscle = exercise.primaryMuscles[0]?.muscle;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 tap-target text-left">

      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-primary-foreground">
        {imageUrl ?
        <img src={imageUrl} alt="" className="w-full h-full object-cover" /> :

        <Dumbbell className="w-6 h-6 text-muted-foreground" />
        }
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{exercise.name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{exercise.equipment}</span>
          {primaryMuscle &&
          <>
              <span>•</span>
              <span className="capitalize">{primaryMuscle}</span>
            </>
          }
        </div>
      </div>
      
      {/* Type indicator */}
      <div className="shrink-0">
        {exercise.type === 'time' ?
        <Timer className="w-5 h-5 text-rest" /> :

        <Dumbbell className="w-5 h-5 text-primary" />
        }
      </div>
    </motion.button>);

}