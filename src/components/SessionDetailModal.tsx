import { useState, useEffect } from 'react';
import { X, Trash2, Save, Edit2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/NumberInput';
import { WorkoutSession, SetEntry, Exercise, AppSettings } from '@/types/workout';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SessionDetailModalProps {
  session: WorkoutSession;
  sessionSets: SetEntry[];
  exercises: Exercise[];
  routineName?: string;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSet: (entry: SetEntry) => Promise<void>;
  onDeleteSet: (entryId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

export function SessionDetailModal({
  session,
  sessionSets,
  exercises,
  routineName,
  settings,
  isOpen,
  onClose,
  onUpdateSet,
  onDeleteSet,
  onDeleteSession,
}: SessionDetailModalProps) {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editedSets, setEditedSets] = useState<Record<string, Partial<SetEntry>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  // Group sets by exercise
  const setsByExercise = sessionSets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) {
      acc[set.exerciseId] = [];
    }
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<string, SetEntry[]>);

  const getExerciseName = (exerciseId: string) => {
    return exercises.find(e => e.id === exerciseId)?.name || 'Unknown Exercise';
  };

  const getExerciseType = (exerciseId: string) => {
    return exercises.find(e => e.id === exerciseId)?.type || 'reps';
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditSet = (set: SetEntry) => {
    setEditingSetId(set.id);
    setEditedSets(prev => ({
      ...prev,
      [set.id]: { ...set },
    }));
  };

  const handleSaveSet = async (setId: string) => {
    const original = sessionSets.find(s => s.id === setId);
    const edits = editedSets[setId];
    if (original && edits) {
      await onUpdateSet({ ...original, ...edits });
    }
    setEditingSetId(null);
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
  };

  const handleDeleteSetClick = (setId: string) => {
    setDeletingSetId(setId);
  };

  const confirmDeleteSet = async () => {
    if (deletingSetId) {
      await onDeleteSet(deletingSetId);
      setDeletingSetId(null);
    }
  };

  const handleDeleteSession = async () => {
    await onDeleteSession(session.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const updateEditedSet = (setId: string, field: keyof SetEntry, value: number) => {
    setEditedSets(prev => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value,
      },
    }));
  };

  if (!isOpen || !session) return null;

  const duration = session.endedAt 
    ? Math.round((session.endedAt - session.startedAt) / 1000 / 60)
    : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-background safe-top safe-bottom">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{routineName || 'Workout'}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(session.startedAt), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button onClick={onClose} className="tap-target p-2">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex-shrink-0 px-4 py-3 bg-card border-b border-border flex gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold">{duration} min</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sets</p>
            <p className="font-semibold">{sessionSets.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Exercises</p>
            <p className="font-semibold">{Object.keys(setsByExercise).length}</p>
          </div>
        </div>

        {/* Sets list */}
        <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
          {Object.entries(setsByExercise).map(([exerciseId, sets]) => {
            const exerciseType = getExerciseType(exerciseId);
            
            return (
              <div key={exerciseId} className="space-y-2">
                <h3 className="font-semibold text-foreground">{getExerciseName(exerciseId)}</h3>
                
                {sets.sort((a, b) => a.setIndex - b.setIndex).map(set => {
                  const isEditing = editingSetId === set.id;
                  const editData = editedSets[set.id] || set;
                  
                  return (
                    <div
                      key={set.id}
                      className="bg-card rounded-xl p-4 border border-border"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Set {set.setIndex + 1}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveSet(set.id)}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {exerciseType === 'reps' ? (
                              <>
                                <div>
                                  <label className="text-xs text-muted-foreground">Reps</label>
                                  <NumberInput
                                    value={editData.reps ?? 0}
                                    onValueChange={(v) => updateEditedSet(set.id, 'reps', v)}
                                    min={0}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Weight ({settings.weightUnit})</label>
                                  <NumberInput
                                    value={editData.weight ?? 0}
                                    onValueChange={(v) => updateEditedSet(set.id, 'weight', v)}
                                    min={0}
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            ) : (
                              <div>
                                <label className="text-xs text-muted-foreground">Duration (sec)</label>
                                <NumberInput
                                  value={editData.duration ?? 0}
                                  onValueChange={(v) => updateEditedSet(set.id, 'duration', v)}
                                  min={0}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-muted-foreground w-12">
                              Set {set.setIndex + 1}
                            </span>
                            {exerciseType === 'reps' ? (
                              <span className="font-semibold">
                                {set.reps} reps × {set.weight || 0} {settings.weightUnit}
                              </span>
                            ) : exerciseType === 'cardio' ? (
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {set.duration ? formatDuration(set.duration) : '—'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {[
                                    set.distance && `${set.distance} ${settings.distanceUnit}`,
                                    set.speed && `${set.speed} ${settings.distanceUnit === 'miles' ? 'mph' : 'kph'}`,
                                    set.incline && `${set.incline}% incline`,
                                  ].filter(Boolean).join(' • ')}
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold">
                                {set.duration} sec
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditSet(set)}
                              className="tap-target p-2 rounded-lg hover:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteSetClick(set.id)}
                              className="tap-target p-2 rounded-lg hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {sessionSets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No sets recorded for this workout
            </div>
          )}
        </div>

        {/* Delete session button */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Workout
          </Button>
        </div>
      </div>

      {/* Delete set confirmation */}
      <AlertDialog open={!!deletingSetId} onOpenChange={() => setDeletingSetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Set?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this set from your workout history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSet} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete session confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Workout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workout and all {sessionSets.length} sets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
