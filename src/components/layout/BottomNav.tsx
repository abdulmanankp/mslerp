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
  UsersRound,
  UserCog,
  Activity,
  Target,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const primaryNav = [
  { to: "/",          icon: LayoutDashboard, label: "Home" },
  { to: "/districts", icon: Building2,       label: "Districts" },
  { to: "/meetings",  icon: Calendar,        label: "Meetings" },
  { to: "/tasks",     icon: ClipboardList,   label: "Tasks" },
];

const moreNav = [
  { to: "/zones",               icon: MapPin,        label: "Zones"       },
  { to: "/universities",        icon: GraduationCap, label: "Universities"},
  { to: "/madadgar-teams",      icon: HandHelping,   label: "Madadgar"    },
  { to: "/coordinators",        icon: Users,         label: "Coordinators"},
  { to: "/markazi-team",        icon: UsersRound,    label: "Markazi Team"},
  { to: "/users",               icon: UserCog,       label: "Users"       },
  { to: "/activities",          icon: Activity,      label: "Activities"  },
  { to: "/goals",               icon: Target,        label: "Goals"       },
  { to: "/president-schedule",  icon: CalendarDays,  label: "Schedule"    },
  { to: "/analytics",           icon: BarChart3,     label: "Analytics"   },
  { to: "/settings",            icon: Settings,      label: "Settings"    },
];

export default function BottomNav() {
  const location  = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const isMoreActive = moreNav.some((item) => isActive(item.to));

  return (
    <>
      {/* ─── Bottom Bar ─────────────────────────────────────────── */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-200",
          moreOpen && "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-4 mb-4 rounded-[24px] border border-[#d8e5de] bg-white/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(8,46,32,0.12)]">
          <div className="grid grid-cols-5 gap-1 p-1.5">

            {primaryNav.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl h-[60px] transition-all duration-200",
                    active ? "bg-[#eef7f2]" : "hover:bg-[#f5faf7]"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all duration-200",
                      active
                        ? "h-9 w-9 bg-[#014f35] text-white"
                        : "h-9 w-9 text-[#17392c]"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "transition-all duration-200",
                        active ? "h-[18px] w-[18px]" : "h-[18px] w-[18px] text-[#17392c]/85"
                      )}
                      strokeWidth={2}
                    />
                  </div>

                  <span className={cn(
                    "mt-1 text-[10px] font-semibold tracking-tight",
                    active ? "text-[#014f35]" : "text-[#385b4c]"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* ── More button ── */}
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl h-[60px] transition-all duration-200",
                isMoreActive ? "bg-[#eef7f2]" : "hover:bg-[#f5faf7]"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-200",
                  isMoreActive
                    ? "h-9 w-9 bg-[#014f35] text-white"
                    : "h-9 w-9"
                )}
              >
                <MoreHorizontal
                  className={cn(
                    "transition-all duration-200",
                    isMoreActive
                      ? "h-[18px] w-[18px]"
                      : "h-[18px] w-[18px] text-[#17392c]/85"
                  )}
                  strokeWidth={2}
                />
              </div>

              <span className={cn(
                "mt-1 text-[10px] font-semibold tracking-tight",
                isMoreActive ? "text-[#014f35]" : "text-[#385b4c]"
              )}>
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
          className="lg:hidden h-[100dvh] rounded-none px-0 pt-0 border-t-0 bg-gradient-to-b from-[#fbfdfb] to-[#f1f6f3] [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-[#dce9e2]/80 bg-white/70 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
              <span className="text-xs font-semibold text-[#4f6a5c]">Navigation</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-[#385b4c] hover:bg-[#edf5f0]"
              onClick={() => setMoreOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 pt-4 pb-8 space-y-4 overflow-y-auto h-[calc(100dvh-56px)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight text-[#12231a]">More Navigation</h3>
              <span className="text-[11px] text-[#476354]">{moreNav.length} items</span>
            </div>

            {/* Professional list */}
            <div className="rounded-2xl border border-[#d4e3da] bg-white/85 p-2">
              {moreNav.map((item, index) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    style={{ animationDelay: `${index * 35}ms` }}
                    className={cn(
                      "animate-in fade-in-0 slide-in-from-bottom-2 flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:translate-x-0.5 active:scale-[0.985]",
                      active
                        ? "bg-[#edf7f1] text-[#014f35] ring-1 ring-[#cce2d7]"
                        : "text-[#013122] hover:bg-[#f5faf7]"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                      active ? "bg-[#014f35] text-white shadow-sm" : "bg-[#f1f6f3] text-[#295443]"
                    )}>
                      <item.icon className="h-[17px] w-[17px]" strokeWidth={2} />
                    </div>
                    <span className="flex-1 text-[13px] font-semibold leading-tight">{item.label}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4",
                      active ? "text-[#014f35]" : "text-[#7c9a8b]"
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
