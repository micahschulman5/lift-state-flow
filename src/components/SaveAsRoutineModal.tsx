import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SaveAsRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, notes?: string) => void;
  exerciseCount: number;
}

export function SaveAsRoutineModal({ 
  isOpen, 
  onClose, 
  onSave,
  exerciseCount 
}: SaveAsRoutineModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), notes.trim() || undefined);
    setName('');
    setNotes('');
  };

  if (!isOpen) return null;

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-card rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Save as Routine</h2>
            <button onClick={onClose} className="tap-target p-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Save this workout as a reusable routine with {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Routine Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Push Day"
                className="tap-target"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this routine..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 tap-target" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 tap-target bg-gradient-primary" 
              onClick={handleSave}
              disabled={!name.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
