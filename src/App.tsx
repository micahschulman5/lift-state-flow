import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Exercises from "./pages/Exercises";
import ExerciseForm from "./pages/ExerciseForm";
import Routines from "./pages/Routines";
import RoutineForm from "./pages/RoutineForm";
import ActiveWorkout from "./pages/ActiveWorkout";
import CalendarPage from "./pages/Calendar";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/new" element={<ExerciseForm />} />
          <Route path="/exercises/:id" element={<ExerciseForm />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/routines/new" element={<RoutineForm />} />
          <Route path="/routines/:id" element={<RoutineForm />} />
          <Route path="/workout" element={<ActiveWorkout />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
