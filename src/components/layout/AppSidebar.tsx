import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Building2,
  GraduationCap,
  HandHelping,
  Users,
  UsersRound,
  UserCog,
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
  { to: "/markazi-team", icon: UsersRound, label: "Markazi Team" },
  { to: "/users", icon: UserCog, label: "Users" },
  { to: "/activities", icon: Activity, label: "Activities" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/meetings", icon: Calendar, label: "Meetings" },
  { to: "/tasks", icon: ClipboardList, label: "Tasks" },
  { to: "/president-schedule", icon: CalendarDays, label: "President Schedule" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/university-analytics", icon: BarChart3, label: "University Analytics" },
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

      {/* Mobile toggle — hidden on mobile/tablet since BottomNav handles navigation */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 hidden bg-card shadow-md border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-transparent text-sidebar-foreground transition-all duration-300 flex flex-col p-3",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#0a6a49]/30 bg-gradient-to-b from-[#014f35] via-[#013726] to-[#0b1f18] shadow-[0_14px_40px_rgba(1,79,53,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-1.5 ring-1 ring-white/20">
                <img src="/msl-logo.webp" alt="MSL Logo" className="w-7 h-7 rounded-md object-contain" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight text-white">MSL ERP</h2>
                <p className="text-[10px] text-emerald-100/70 font-medium">Management Portal</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="rounded-xl bg-white/15 p-1.5 ring-1 ring-white/20 mx-auto">
              <img src="/msl-logo.webp" alt="MSL Logo" className="w-7 h-7 rounded-md object-contain" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7 text-emerald-100/80 hover:text-white hover:bg-white/10"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/50 px-3 mb-2">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-white text-[#014f35] shadow-lg shadow-black/20"
                    : "text-emerald-100/80 hover:bg-white/10 hover:text-white",
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
        <div className={cn("border-t border-white/10 shrink-0", collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/15 shrink-0">
              <span className="text-xs font-bold text-white">{displayName.slice(0, 2).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-emerald-100/65 font-medium capitalize">{roleLabel}</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-100/75 hover:text-white hover:bg-white/10 shrink-0"
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
              className="w-full mt-2 h-8 text-emerald-100/75 hover:text-white hover:bg-white/10"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
        </div>
      </aside>
    </>
  );
}
