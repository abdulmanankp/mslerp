import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Building2,
  GraduationCap,
  HandHelping,
  Users,
  Activity,
  Target,
  Calendar,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/zones", icon: MapPin, label: "Zones" },
  { to: "/districts", icon: Building2, label: "Districts" },
  { to: "/universities", icon: GraduationCap, label: "Universities" },
  { to: "/madadgar-teams", icon: HandHelping, label: "Madadgar Teams" },
  { to: "/coordinators", icon: Users, label: "Coordinators" },
  { to: "/activities", icon: Activity, label: "Activities" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/meetings", icon: Calendar, label: "Meetings" },
  { to: "/tasks", icon: ClipboardList, label: "Tasks" },
  { to: "/president-schedule", icon: CalendarDays, label: "President Schedule" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const displayName = user?.email?.split("@")[0] || "User";
  const roleLabel = userRole || "User";

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden bg-card shadow-md border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img src="/msl-logo.webp" alt="MSL Logo" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <h2 className="font-bold text-sm tracking-tight text-sidebar-foreground">MSL ERP</h2>
                <p className="text-[10px] text-sidebar-foreground/50 font-medium">Management Portal</p>
              </div>
            </div>
          )}
          {collapsed && (
            <img src="/msl-logo.webp" alt="MSL Logo" className="w-9 h-9 rounded-xl object-contain mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-2">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "lg:justify-center lg:px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "drop-shadow-sm")} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with user info & logout */}
        <div className={cn("border-t border-sidebar-border shrink-0", collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center ring-2 ring-primary/30 shrink-0">
              <span className="text-xs font-bold text-primary">{displayName.slice(0, 2).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/40 font-medium capitalize">{roleLabel}</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full mt-2 h-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
