import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Upload,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useExercises } from '@/hooks/useWorkoutData';
import { 
  Exercise, 
  ExerciseType, 
  EquipmentType, 
  MuscleGroup, 
  MovementPattern,
  MuscleWeight
} from '@/types/workout';
import { cn } from '@/lib/utils';

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other'
];

const MUSCLE_OPTIONS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'
];

const MOVEMENT_OPTIONS: MovementPattern[] = [
  'push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isometric'
];

export default function ExerciseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { exercises, addExercise, updateExercise, removeExercise } = useExercises();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('reps');
  const [equipment, setEquipment] = useState<EquipmentType>('barbell');
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleWeight[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleWeight[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<MovementPattern[]>([]);
  const [notes, setNotes] = useState('');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing exercise
  useEffect(() => {
    if (isEditing) {
      const exercise = exercises.find(e => e.id === id);
      if (exercise) {
        setName(exercise.name);
        setType(exercise.type);
        setEquipment(exercise.equipment);
        setPrimaryMuscles(exercise.primaryMuscles);
        setSecondaryMuscles(exercise.secondaryMuscles);
        setMovementPatterns(exercise.movementPatterns);
        setNotes(exercise.notes || '');
        if (exercise.mediaBlob) {
          setMediaBlob(exercise.mediaBlob);
          setMediaPreview(URL.createObjectURL(exercise.mediaBlob));
        }
      }
    }
  }, [id, isEditing, exercises]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      setMediaBlob(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaBlob(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  const togglePrimaryMuscle = (muscle: MuscleGroup) => {
    const existing = primaryMuscles.find(m => m.muscle === muscle);
    if (existing) {
      setPrimaryMuscles(primaryMuscles.filter(m => m.muscle !== muscle));
    } else {
      setPrimaryMuscles([...primaryMuscles, { muscle, weight: 0.5 }]);
      // Remove from secondary if added to primary
      setSecondaryMuscles(secondaryMuscles.filter(m => m.muscle !== muscle));
    }
  };

  const toggleSecondaryMuscle = (muscle: MuscleGroup) => {
    // Don't allow if already in primary
    if (primaryMuscles.find(m => m.muscle === muscle)) return;
    
    const existing = secondaryMuscles.find(m => m.muscle === muscle);
    if (existing) {
      setSecondaryMuscles(secondaryMuscles.filter(m => m.muscle !== muscle));
    } else {
      setSecondaryMuscles([...secondaryMuscles, { muscle, weight: 0.3 }]);
    }
  };

  const updateMuscleWeight = (
    muscle: MuscleGroup, 
    weight: number, 
    isPrimary: boolean
  ) => {
    if (isPrimary) {
      setPrimaryMuscles(primaryMuscles.map(m => 
        m.muscle === muscle ? { ...m, weight: Math.max(0, Math.min(1, weight)) } : m
      ));
    } else {
      setSecondaryMuscles(secondaryMuscles.map(m => 
        m.muscle === muscle ? { ...m, weight: Math.max(0, Math.min(1, weight)) } : m
      ));
    }
  };

  const toggleMovement = (pattern: MovementPattern) => {
    if (movementPatterns.includes(pattern)) {
      setMovementPatterns(movementPatterns.filter(p => p !== pattern));
    } else {
      setMovementPatterns([...movementPatterns, pattern]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter an exercise name');
      return;
    }
    
    if (primaryMuscles.length === 0) {
      alert('Please select at least one primary muscle');
      return;
    }
    
    setSaving(true);
    
    try {
      const exerciseData = {
        name: name.trim(),
        type,
        equipment,
        primaryMuscles,
        secondaryMuscles,
        movementPatterns,
        notes: notes.trim() || undefined,
        mediaBlob: mediaBlob || undefined,
        mediaType: mediaBlob?.type.includes('gif') ? 'gif' as const : 'image' as const,
      };
      
      if (isEditing) {
        await updateExercise(id, exerciseData);
      } else {
        await addExercise(exerciseData);
      }
      
      navigate('/exercises');
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isEditing) {
      await removeExercise(id);
      navigate('/exercises');
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="tap-target flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="font-semibold">
            {isEditing ? 'Edit Exercise' : 'New Exercise'}
          </h1>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="tap-target"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-6 pb-24">
        {/* Name */}
        <div>
          <label className="text-sm font-medium mb-2 block">Exercise Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bench Press"
            className="tap-target"
          />
        </div>
        
        {/* Type toggle */}
        <div>
          <label className="text-sm font-medium mb-2 block">Exercise Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType('reps')}
              className={cn(
                "p-4 rounded-xl text-center tap-target transition-colors",
                type === 'reps' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card"
              )}
            >
              <p className="font-medium">Reps-Based</p>
              <p className="text-sm opacity-80">Count repetitions</p>
            </button>
            <button
              onClick={() => setType('time')}
              className={cn(
                "p-4 rounded-xl text-center tap-target transition-colors",
                type === 'time' 
                  ? "bg-rest text-rest-foreground" 
                  : "bg-card"
              )}
            >
              <p className="font-medium">Time-Based</p>
              <p className="text-sm opacity-80">Duration exercises</p>
            </button>
          </div>
        </div>
        
        {/* Equipment */}
        <div>
          <label className="text-sm font-medium mb-2 block">Equipment</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(equip => (
              <button
                key={equip}
                onClick={() => setEquipment(equip)}
                className={cn(
                  "px-4 py-2 rounded-full capitalize transition-colors tap-target",
                  equipment === equip
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                {equip}
              </button>
            ))}
          </div>
        </div>
        
        {/* Primary muscles */}
        <div>
          <label className="text-sm font-medium mb-2 block">Primary Muscles</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {MUSCLE_OPTIONS.map(muscle => {
              const isSelected = primaryMuscles.some(m => m.muscle === muscle);
              return (
                <button
                  key={muscle}
                  onClick={() => togglePrimaryMuscle(muscle)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
          
          {/* Weight sliders for primary muscles */}
          {primaryMuscles.length > 0 && (
            <div className="space-y-2 bg-card rounded-xl p-3">
              {primaryMuscles.map(({ muscle, weight }) => (
                <div key={muscle} className="flex items-center gap-3">
                  <span className="text-sm capitalize w-24">{muscle}</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => updateMuscleWeight(muscle, parseFloat(e.target.value), true)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10">{Math.round(weight * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Secondary muscles */}
        <div>
          <label className="text-sm font-medium mb-2 block">Secondary Muscles</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {MUSCLE_OPTIONS.filter(m => !primaryMuscles.some(pm => pm.muscle === m)).map(muscle => {
              const isSelected = secondaryMuscles.some(m => m.muscle === muscle);
              return (
                <button
                  key={muscle}
                  onClick={() => toggleSecondaryMuscle(muscle)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                    isSelected
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card"
                  )}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Movement patterns */}
        <div>
          <label className="text-sm font-medium mb-2 block">Movement Patterns</label>
          <div className="flex flex-wrap gap-2">
            {MOVEMENT_OPTIONS.map(pattern => {
              const isSelected = movementPatterns.includes(pattern);
              return (
                <button
                  key={pattern}
                  onClick={() => toggleMovement(pattern)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm capitalize transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "bg-card"
                  )}
                >
                  {pattern}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Media upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Image / GIF</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {mediaPreview ? (
            <div className="relative">
              <img
                src={mediaPreview}
                alt="Exercise preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 tap-target"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tap to upload image</p>
            </button>
          )}
        </div>
        
        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Form cues, tips, etc."
            rows={3}
          />
        </div>
        
        {/* Delete button */}
        {isEditing && (
          <div className="pt-4 border-t border-border">
            {showDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Are you sure? This cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Exercise
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
