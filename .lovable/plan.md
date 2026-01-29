

# Start Workout Hub & Free Workout Mode

## Overview

Transform the app's main screen into a "Start Workout" hub with two primary paths (routine-based and free workout), and enable dynamic exercise management during active workouts. This maintains routines as an option while supporting flexible, on-the-fly workout building.

---

## Architecture Changes

### Data Model Updates

The current `ActiveWorkoutState` stores a required `routine` field. We need to make this optional to support free workouts:

```text
ActiveWorkoutState (updated):
├── session: WorkoutSession
├── routine?: Routine           // Optional - only for routine-based workouts
├── workoutExercises: WorkoutExercise[]  // NEW - dynamic exercise list
├── currentExerciseIndex: number
├── currentSetIndex: number
├── completedSets: SetEntry[]
├── restTimerEnd?: number
├── isPaused: boolean
└── isFreeWorkout: boolean      // NEW - flag for free workout mode
```

A new `WorkoutExercise` type extends `RoutineExercise` with runtime info:

```text
WorkoutExercise:
├── exerciseId: string
├── targetSets: number
├── targetReps?: number
├── targetDuration?: number
├── restBetweenSets: number
└── addedDuringWorkout?: boolean  // NEW - tracks mid-workout additions
```

---

## Component Changes

### 1. Home Page → Start Workout Hub

Replace the current dashboard with a focused workout launcher:

```text
┌─────────────────────────────────────┐
│     Iron Flow                       │
│     [date]                          │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🎯 START FROM ROUTINE        │  │
│  │  Use a saved workout template │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  ➕ START FREE WORKOUT        │  │
│  │  Build as you go              │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  Today's Planned (if any)          │
│  ┌─────────────────────────────┐   │
│  │ Push Day    [Start]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Activity (condensed)       │
└─────────────────────────────────────┘
```

### 2. Routine Picker Modal

When "Start from Routine" is tapped, show a bottom sheet with:
- Search/filter for routines
- List of saved routines with exercise count
- Quick-start buttons

### 3. Active Workout Enhancements

Add new controls to the workout screen:

```text
┌─────────────────────────────────────┐
│  [X]   Push Day / Free Workout  [≫]│
├─────────────────────────────────────┤
│                                     │
│        Bench Press                  │
│        Set 2 of 4                   │
│        Target: 10 reps              │
│                     [ℹ]             │  ← Info button
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Previous: 80kg × 10 @ RPE 8    ││
│  └─────────────────────────────────┘│
│                                     │
│     [Reps]  [Weight]  [RPE]        │
│                                     │
│     ┌──────────────────────┐        │
│     │   ✓ Complete Set     │        │
│     └──────────────────────┘        │
│     Skip Set                        │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  + Add Exercise               │  │  ← NEW button
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 4. In-Workout Exercise Picker

A modal accessible via "Add Exercise" button:

```text
┌─────────────────────────────────────┐
│     Add Exercise                    │
│  ┌─────────────────────────────────┐│
│  │ 🔍 Search...            [Filter]││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Bench Press              [+]       │
│  Barbell • Chest                    │
│─────────────────────────────────────│
│  Incline DB Press         [+]       │
│  Dumbbell • Chest                   │
│─────────────────────────────────────│
│  ...                                │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │  + Create New Exercise        │  │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 5. Quick Exercise Creator

Streamlined form for creating exercises mid-workout:
- Name (required)
- Type toggle (reps/time)
- Equipment (single select)
- Primary muscle (single select for speed)
- Optional: notes/cues
- Skips secondary muscles and movement patterns for speed

### 6. Exercise Info Modal

Accessible via "ℹ" button during workout:

```text
┌─────────────────────────────────────┐
│     Bench Press              [Edit] │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ [Exercise image/GIF]           ││
│  └─────────────────────────────────┘│
│                                     │
│  Equipment: Barbell                 │
│  Muscles: Chest, Triceps, Shoulders │
│  Pattern: Push, Horizontal          │
│                                     │
│  Notes:                             │
│  "Retract scapula, arch back,       │
│   drive through heels..."           │
│                                     │
│         [Close]                     │
└─────────────────────────────────────┘
```

### 7. Save Free Workout as Routine

At workout completion (for free workouts only):

```text
┌─────────────────────────────────────┐
│        ✓ Workout Complete!          │
│                                     │
│        12 sets • 45 minutes         │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  💾 Save as Routine           │  │  ← NEW option
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │       Done                    │  │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types/workout.ts` | Modify | Add `WorkoutExercise`, update `ActiveWorkoutState` |
| `src/hooks/useWorkoutData.ts` | Modify | Update `useActiveWorkout` for free workout support |
| `src/pages/Home.tsx` | Rewrite | Transform to Start Workout hub |
| `src/pages/ActiveWorkout.tsx` | Modify | Add exercise button, info modal, picker integration |
| `src/components/RoutinePicker.tsx` | Create | Modal for selecting routine to start |
| `src/components/WorkoutExercisePicker.tsx` | Create | In-workout exercise picker with search/filter |
| `src/components/QuickExerciseForm.tsx` | Create | Streamlined exercise creation during workout |
| `src/components/ExerciseInfoModal.tsx` | Create | Display exercise details and notes |
| `src/components/SaveAsRoutineModal.tsx` | Create | Save completed free workout as routine |

---

## Implementation Sequence

### Phase 1: Data Layer Updates
1. Update `ActiveWorkoutState` type to support optional routine and `workoutExercises` array
2. Modify `useActiveWorkout` hook:
   - Add `startFreeWorkout()` function
   - Add `addExerciseToWorkout(exercise, targets)` function
   - Add `removeExerciseFromWorkout(index)` function (optional)
   - Update `start()` to populate `workoutExercises` from routine

### Phase 2: Start Workout Hub
3. Create `RoutinePicker` component with routine list and search
4. Rewrite `Home.tsx` as the Start Workout hub with two primary CTAs
5. Integrate routine picker and free workout launch

### Phase 3: Active Workout Enhancements
6. Create `WorkoutExercisePicker` component (reuses filter logic from Exercises page)
7. Create `QuickExerciseForm` component for fast exercise creation
8. Create `ExerciseInfoModal` component
9. Update `ActiveWorkout.tsx`:
   - Add "Add Exercise" button
   - Add info button per exercise
   - Handle dynamic `workoutExercises` array instead of `routine.exercises`
   - Support adding exercises at end of workout

### Phase 4: Post-Workout Features
10. Create `SaveAsRoutineModal` component
11. Update workout completion screen to offer "Save as Routine" for free workouts

---

## Technical Details

### Starting a Free Workout

```typescript
const startFreeWorkout = async () => {
  const session: WorkoutSession = {
    id: uuidv4(),
    startedAt: Date.now(),
    status: 'active',
  };
  await db.saveSession(session);

  const state: ActiveWorkoutState = {
    session,
    workoutExercises: [], // Empty - user adds as they go
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: [],
    isPaused: false,
    isFreeWorkout: true,
  };
  save(state);
  return state;
};
```

### Adding Exercise Mid-Workout

```typescript
const addExerciseToWorkout = (
  exercise: Exercise,
  targets: { sets: number; reps?: number; duration?: number; rest: number }
) => {
  if (!activeWorkout) return;

  const newWorkoutExercise: WorkoutExercise = {
    exerciseId: exercise.id,
    targetSets: targets.sets,
    targetReps: targets.reps,
    targetDuration: targets.duration,
    restBetweenSets: targets.rest,
    addedDuringWorkout: true,
  };

  const updated = {
    ...activeWorkout,
    workoutExercises: [...activeWorkout.workoutExercises, newWorkoutExercise],
  };
  save(updated);
};
```

### Exercise Info Storage

Exercise notes/cues are already supported in the `Exercise.notes` field. The info modal will display:
- `exercise.notes` - User-configured cues and tips
- `exercise.primaryMuscles` / `exercise.secondaryMuscles`
- `exercise.equipment`
- `exercise.mediaBlob` - Image/GIF if uploaded

Editing from the info modal will navigate to `/exercises/:id` or open an inline edit form.

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Free workout with 0 exercises | Show "Add your first exercise" prompt, block set completion until exercise added |
| Mid-workout exercise creation fails | Show error toast, keep picker open |
| Routine workout + add extra exercise | Appends to `workoutExercises`, marks as `addedDuringWorkout: true` |
| Save free workout as routine | Creates routine from `workoutExercises`, excluding incomplete exercises |
| Resume interrupted free workout | Loads from localStorage like routine workouts |

---

## Summary

This plan enables flexible workout modes while keeping the existing routine system intact. Users can:
- Start a structured workout from a saved routine
- Start an empty "free workout" and add exercises on the fly
- Add exercises mid-workout regardless of how the workout started
- Create new exercises without leaving the workout
- View exercise info/cues during sets
- Save a completed free workout as a reusable routine

