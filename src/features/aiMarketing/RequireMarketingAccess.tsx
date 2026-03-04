import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { canViewAiMarketing } from "./permissions";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getRoleDashboard } from "@/context/AuthContext";

function AccessDeniedPage() {
  const { currentUser } = useAuth();
  const dashboardPath = currentUser ? getRoleDashboard(currentUser.role) : "/login";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Access denied</h1>
        <p className="text-muted-foreground text-sm mb-6">
          You don’t have permission to view the AI Marketing area. This section is for Marketing & Strategy and authorised roles.
        </p>
        <Button asChild variant="outline">
          <Link to={dashboardPath}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

interface RequireMarketingAccessProps {
  children: ReactNode;
}

export function RequireMarketingAccess({ children }: RequireMarketingAccessProps) {
  const { currentUser } = useAuth();

  if (!currentUser || !canViewAiMarketing(currentUser.role)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
