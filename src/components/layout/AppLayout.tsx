import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("transition-all duration-300 lg:ml-64 min-h-screen")}>
        <div className="p-4 md:p-6 lg:p-8 pt-4 lg:pt-6 pb-28 lg:pb-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
