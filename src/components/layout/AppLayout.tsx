import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import BottomNav from "./BottomNav";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();

  const pageTitle = (() => {
    const path = location.pathname;
    if (path === "/") return "Home";
    if (path.startsWith("/districts")) return "District";
    if (path.startsWith("/meetings")) return "Meeting";
    if (path.startsWith("/tasks")) return "Tasks";
    if (path.startsWith("/zones")) return "Zones";
    if (path.startsWith("/universities")) return "Universities";
    if (path.startsWith("/coordinators")) return "Coordinators";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/settings")) return "Profile";
    if (path.startsWith("/users")) return "Users";
    if (path.startsWith("/goals")) return "Goals";
    if (path.startsWith("/activities")) return "Activities";
    if (path.startsWith("/markazi-team")) return "Markazi Team";
    if (path.startsWith("/madadgar-teams")) return "Madadgar";
    if (path.startsWith("/president-schedule")) return "Schedule";
    return "MSL ERP";
  })();

  const displayName = user?.email?.split("@")[0] || "User";

  const avatarThemes = [
    "bg-[#f4c7b8] text-[#4a231a]",
    "bg-[#c8e6c9] text-[#103b1f]",
    "bg-[#d1c4e9] text-[#2b1a4a]",
    "bg-[#ffe0b2] text-[#4a2b11]",
    "bg-[#b3e5fc] text-[#08374d]",
    "bg-[#f8bbd0] text-[#4d1a2f]",
  ];

  const seedSource = userProfile?.email || user?.email || displayName;
  const avatarTheme = avatarThemes[
    Array.from(seedSource).reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarThemes.length
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fbf8] via-[#f2f8f4] to-[#edf6f1]">
      <AppSidebar />
      <header className="fixed inset-x-0 top-0 z-40 lg:hidden">
        <div className="w-full border-b border-white/10 bg-gradient-to-r from-[#014f35] via-[#0a5d41] to-[#123f2e] text-white shadow-[0_10px_28px_rgba(1,79,53,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/msl-logo.webp" alt="MSL Logo" className="h-10 w-10 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/70">MSL ERP</p>
                <h1 className="truncate text-[15px] font-semibold leading-tight">{pageTitle}</h1>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/18 active:scale-95"
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-9 w-9 border border-white/20">
                    <AvatarImage src={undefined} alt={displayName} />
                    <AvatarFallback className={cn("text-xs font-semibold", avatarTheme)}>
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#d7e5dd] p-2 shadow-xl">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="text-sm font-semibold text-[#123226]">{displayName}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user?.email || "Profile"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 focus:bg-[#edf7f1]"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className={cn("transition-all duration-300 lg:ml-64 min-h-screen")}>
        <div className="p-4 md:p-6 lg:p-8 pt-24 lg:pt-6 pb-28 lg:pb-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
