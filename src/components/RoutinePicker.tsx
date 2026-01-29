import { useState, useMemo } from 'react';
import { Search, Play, X, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Routine } from '@/types/workout';

interface RoutinePickerProps {
  routines: Routine[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (routine: Routine) => void;
}

export function RoutinePicker({ routines, isOpen, onClose, onSelect }: RoutinePickerProps) {
  const [search, setSearch] = useState('');

  const filteredRoutines = useMemo(() => {
    if (!search.trim()) return routines;
    const term = search.toLowerCase();
    return routines.filter(r => r.name.toLowerCase().includes(term));
  }, [routines, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">Choose Routine</h2>
        <button onClick={onClose} className="tap-target p-2">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routines..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Routine list */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {filteredRoutines.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {routines.length === 0 ? 'No routines yet' : 'No matching routines'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRoutines.map((routine) => (
              <button
                key={routine.id}
                onClick={() => onSelect(routine)}
                className="w-full bg-card rounded-xl p-4 flex items-center justify-between tap-target text-left border border-border"
              >
                <div>
                  <p className="font-semibold">{routine.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Play className="w-5 h-5 fill-current" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
