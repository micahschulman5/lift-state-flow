import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/types/workout';
import { useNavigate } from 'react-router-dom';

interface ExerciseInfoModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExerciseInfoModal({ exercise, isOpen, onClose }: ExerciseInfoModalProps) {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (exercise?.mediaBlob) {
      const url = URL.createObjectURL(exercise.mediaBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [exercise?.mediaBlob]);

  const handleEdit = () => {
    if (exercise) {
      onClose();
      navigate(`/exercises/${exercise.id}`);
    }
  };

  if (!isOpen || !exercise) return null;

  const allMuscles = [
    ...exercise.primaryMuscles.map(m => ({ ...m, isPrimary: true })),
    ...exercise.secondaryMuscles.map(m => ({ ...m, isPrimary: false })),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-semibold">{exercise.name}</h2>
            <div className="flex items-center gap-1">
              <button onClick={handleEdit} className="tap-target p-2">
                <Edit className="w-5 h-5 text-primary" />
              </button>
              <button onClick={onClose} className="tap-target p-2">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-4 pb-safe">
            {/* Image */}
            {imageUrl ? (
              <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-surface">
                <img
                  src={imageUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-surface flex items-center justify-center">
                <Dumbbell className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            {/* Info cards */}
            <div className="space-y-3">
              {/* Equipment & Type */}
              <div className="bg-surface rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                    <p className="font-medium capitalize">{exercise.equipment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-medium capitalize">{exercise.type}-based</p>
                  </div>
                </div>
              </div>

              {/* Muscles */}
              {allMuscles.length > 0 && (
                <div className="bg-surface rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-2">Muscle Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {allMuscles.map(({ muscle, weight, isPrimary }) => (
                      <span
                        key={muscle}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isPrimary
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {muscle} {weight < 1 && `(${Math.round(weight * 100)}%)`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Movement patterns */}
              {exercise.movementPatterns.length > 0 && (
                <div className="bg-surface rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-2">Movement Patterns</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.movementPatterns.map(pattern => (
                      <span
                        key={pattern}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {exercise.notes && (
                <div className="bg-surface rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-2">Notes & Cues</p>
                  <p className="text-sm whitespace-pre-wrap">{exercise.notes}</p>
                </div>
              )}
            </div>

            <div className="py-4">
              <Button
                variant="outline"
                className="w-full tap-target"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Exercise
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
