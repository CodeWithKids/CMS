import { Navigate, Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  finance: "Finance",
  educator: "Educator",
  student: "Student",
  parent: "Parent",
  organisation: "Organisation",
  partnerships: "Partnerships",
  marketing: "Marketing",
  social_media: "Social media",
  ld_manager: "L&D Manager",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    const home = getRoleDashboard(currentUser.role);
     const viewerRoleLabel = ROLE_LABELS[currentUser.role];
     const allowedLabels = Array.from(
       new Set(allowedRoles.map((r) => ROLE_LABELS[r]))
     );
     const allowedText =
       allowedLabels.length === 1
         ? allowedLabels[0]
         : `${allowedLabels.slice(0, -1).join(", ")} or ${
             allowedLabels[allowedLabels.length - 1]
           }`;

    return (
      <div className="page-container">
        <div className="max-w-md rounded-xl border bg-card p-8">
          <h1 className="text-lg font-semibold mb-2">You don&apos;t have access</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This page is only available to {allowedText} in CWK Hub. You&apos;re
            currently signed in as <span className="font-medium">{viewerRoleLabel}</span>, so you
            can&apos;t open this URL.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Use the navigation on the left, or go back to your own dashboard.
          </p>
          <Link
            to={home}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
