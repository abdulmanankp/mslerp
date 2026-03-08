import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/districts" element={<Districts />} />
          <Route path="/districts/:id" element={<DistrictProfile />} />
          <Route path="/coordinators" element={<Coordinators />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/meetings/:meetingId/report/:districtId" element={<MeetingReport />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
