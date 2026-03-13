import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  ClipboardList,
  MoreHorizontal,
  MapPin,
  GraduationCap,
  HandHelping,
  Users,
  Activity,
  Target,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/useAuth";

const primaryNav = [
  { to: "/",           icon: LayoutDashboard, label: "Home",      color: "text-violet-500", bg: "bg-violet-500/15" },
  { to: "/districts",  icon: Building2,       label: "Districts", color: "text-blue-500",   bg: "bg-blue-500/15"   },
  { to: "/meetings",   icon: Calendar,        label: "Meetings",  color: "text-emerald-500",bg: "bg-emerald-500/15"},
  { to: "/tasks",      icon: ClipboardList,   label: "Tasks",     color: "text-amber-500",  bg: "bg-amber-500/15"  },
];

const moreNav = [
  { to: "/zones",               icon: MapPin,        label: "Zones"       },
  { to: "/universities",        icon: GraduationCap, label: "Universities"},
  { to: "/madadgar-teams",      icon: HandHelping,   label: "Madadgar"    },
  { to: "/coordinators",        icon: Users,         label: "Coordinators"},
  { to: "/activities",          icon: Activity,      label: "Activities"  },
  { to: "/goals",               icon: Target,        label: "Goals"       },
  { to: "/president-schedule",  icon: CalendarDays,  label: "Schedule"    },
  { to: "/analytics",           icon: BarChart3,     label: "Analytics"   },
  { to: "/settings",            icon: Settings,      label: "Settings"    },
];

export default function BottomNav() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const displayName = user?.email?.split("@")[0] || "User";

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const isMoreActive = moreNav.some((item) => isActive(item.to));

  const handleSignOut = async () => {
    setMoreOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* ─── Bottom Bar ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="mx-3 mb-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/60 shadow-[0_-2px_32px_rgba(0,0,0,0.14)]">
          <div className="flex items-stretch px-1 py-1">

            {primaryNav.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 relative"
                  style={{ minHeight: 62 }}
                >
                  {/* Sliding top-pill indicator */}
                  <span
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ease-out",
                      active ? "w-8 opacity-100" : "w-0 opacity-0"
                    )}
                    style={{ background: "hsl(var(--primary))" }}
                  />

                  {/* Icon bubble */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-[34px] rounded-xl transition-all duration-300 ease-out",
                      active ? `${item.bg} scale-105` : "scale-100"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "transition-all duration-300",
                        active
                          ? `h-[22px] w-[22px] ${item.color}`
                          : "h-5 w-5 text-muted-foreground/70"
                      )}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-tight transition-all duration-300",
                      active ? "text-foreground" : "text-muted-foreground/60"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* ── More button ── */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 relative"
              style={{ minHeight: 62 }}
            >
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ease-out",
                  isMoreActive ? "w-8 opacity-100" : "w-0 opacity-0"
                )}
                style={{ background: "hsl(var(--primary))" }}
              />
              <div
                className={cn(
                  "flex items-center justify-center w-11 h-[34px] rounded-xl transition-all duration-300 ease-out",
                  isMoreActive ? "bg-primary/15 scale-105" : "scale-100"
                )}
              >
                <MoreHorizontal
                  className={cn(
                    "transition-all duration-300",
                    isMoreActive
                      ? "h-[22px] w-[22px] text-primary"
                      : "h-5 w-5 text-muted-foreground/70"
                  )}
                  strokeWidth={isMoreActive ? 2.25 : 1.75}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight transition-all duration-300",
                  isMoreActive ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                More
              </span>
            </button>

          </div>
        </div>
      </nav>

      {/* ─── More Drawer (bottom sheet) ─────────────────────────── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden h-auto rounded-t-3xl px-0 pt-0 border-t-0"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-5">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="px-4 pb-8 space-y-4">
            {/* User card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/50 flex items-center justify-center ring-2 ring-primary/25 shrink-0">
                <span className="text-sm font-bold text-primary">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole || "User"}</p>
              </div>
            </div>

            {/* 3-col grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {moreNav.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all duration-200 active:scale-95",
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-[22px] w-[22px]",
                        active ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="text-[11px] font-semibold text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15 active:scale-[0.98] transition-all duration-200"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
