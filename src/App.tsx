import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { startOfflineSync } from "@/lib/offlineSync";
import { syncMobileReminders } from "@/lib/mobileReminders";
import { useTasks, usePresidentSchedules } from "@/hooks/useFirebaseData";
import { useAuth } from "@/contexts/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import Districts from "./pages/Districts";
import DistrictProfile from "./pages/DistrictProfile";
import Universities from "./pages/Universities";
import UniversityProfile from "./pages/UniversityProfile";
import MadadgarTeams from "./pages/MadadgarTeams";
import MadadgarTeamProfile from "./pages/MadadgarTeamProfile";
import Coordinators from "./pages/Coordinators";
import Activities from "./pages/Activities";
import Goals from "./pages/Goals";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import MeetingReport from "./pages/MeetingReport";
import UniversityMeetingReport from "./pages/UniversityMeetingReport";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import Vision12K from "./pages/Vision12K";
import UniversityAnalytics from "./pages/UniversityAnalytics";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import PresidentSchedule from "./pages/PresidentSchedule";
import MarkaziTeam from "./pages/MarkaziTeam";
import NotFound from "./pages/NotFound";

const QUERY_CACHE_KEY = "msl-erp-query-cache-v1";

function loadPersistedQueryCache() {
  if (typeof window === "undefined") return undefined;

  try {
    const cached = window.localStorage.getItem(QUERY_CACHE_KEY);
    if (!cached) return undefined;
    return JSON.parse(cached);
  } catch {
    return undefined;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data instantly on re-navigation; refetch silently in background
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime:    7 * 24 * 60 * 60 * 1000,  // keep cache 7 days for offline fallback
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
      retry: 1,
    },
  },
});

const persistedCache = loadPersistedQueryCache();
if (persistedCache) {
  hydrate(queryClient, persistedCache);
}

let lastPersistedSignature = "";
queryClient.getQueryCache().subscribe(() => {
  if (typeof window === "undefined") return;

  try {
    const dehydrated = dehydrate(queryClient);
    const serialized = JSON.stringify(dehydrated);
    if (serialized === lastPersistedSignature) return;
    lastPersistedSignature = serialized;
    window.localStorage.setItem(QUERY_CACHE_KEY, serialized);
  } catch {
    // Ignore storage failures so the app still works in restricted browsers.
  }
});

const App = () => {
  useEffect(() => {
    const cleanup = startOfflineSync();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <MobileReminderSync />
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/zones" element={<ProtectedRoute><Zones /></ProtectedRoute>} />
              <Route path="/districts" element={<ProtectedRoute><Districts /></ProtectedRoute>} />
              <Route path="/districts/:id" element={<ProtectedRoute><DistrictProfile /></ProtectedRoute>} />
              <Route path="/universities" element={<ProtectedRoute requiredPermission="canMonitorUniversityAnalytics"><Universities /></ProtectedRoute>} />
              <Route path="/universities/:id" element={<ProtectedRoute requiredPermission="canMonitorUniversityAnalytics"><UniversityProfile /></ProtectedRoute>} />
              <Route path="/madadgar-teams" element={<ProtectedRoute><MadadgarTeams /></ProtectedRoute>} />
              <Route path="/madadgar-teams/:id" element={<ProtectedRoute><MadadgarTeamProfile /></ProtectedRoute>} />
              <Route path="/coordinators" element={<ProtectedRoute><Coordinators /></ProtectedRoute>} />
              <Route path="/markazi-team" element={<ProtectedRoute><MarkaziTeam /></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
              <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />
              <Route path="/meetings/:meetingId/report/:districtId" element={<ProtectedRoute><MeetingReport /></ProtectedRoute>} />
              <Route path="/university-meetings/:meetingId/report/:universityId" element={<ProtectedRoute requiredPermission="canManageUniversityRecords"><UniversityMeetingReport /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/president-schedule" element={<ProtectedRoute><PresidentSchedule /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/vision12k" element={<ProtectedRoute><Vision12K /></ProtectedRoute>} />
              <Route path="/university-analytics" element={<ProtectedRoute requiredPermission="canMonitorUniversityAnalytics"><UniversityAnalytics /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

function MobileReminderSync() {
  const { user } = useAuth();
  const { data: tasks = [] } = useTasks({ enabled: !!user });
  const { data: schedules = [] } = usePresidentSchedules({ enabled: !!user });

  useEffect(() => {
    if (!user) return;
    void syncMobileReminders(tasks, schedules);
  }, [user, tasks, schedules]);

  return null;
}

export default App;
