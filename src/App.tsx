import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import Districts from "./pages/Districts";
import DistrictProfile from "./pages/DistrictProfile";
import Coordinators from "./pages/Coordinators";
import Activities from "./pages/Activities";
import Goals from "./pages/Goals";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import MeetingReport from "./pages/MeetingReport";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/zones" element={<ProtectedRoute><Zones /></ProtectedRoute>} />
            <Route path="/districts" element={<ProtectedRoute><Districts /></ProtectedRoute>} />
            <Route path="/districts/:id" element={<ProtectedRoute><DistrictProfile /></ProtectedRoute>} />
            <Route path="/coordinators" element={<ProtectedRoute><Coordinators /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
            <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />
            <Route path="/meetings/:meetingId/report/:districtId" element={<ProtectedRoute><MeetingReport /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
