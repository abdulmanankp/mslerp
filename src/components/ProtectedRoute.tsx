import { useAuth } from "@/contexts/useAuth";
import { Navigate } from "react-router-dom";
import type { AppUserPermissions } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof AppUserPermissions;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { session, loading, userRole, userPermissions } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/msl-logo.webp" alt="MSL" className="w-12 h-12 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = userRole === "admin";
  const hasAppAccess = !!userPermissions?.appAccess;
  const hasRequiredPermission = requiredPermission ? !!userPermissions?.[requiredPermission] : true;

  if (!isAdmin && !hasAppAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">App Is Coming Soon For You</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account is active, but admin access is required to use the full app right now.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please contact admin to assign app admin role and permissions.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !hasRequiredPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Permission Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account does not have permission for this section.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
