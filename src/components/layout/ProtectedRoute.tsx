import { Navigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getRoleDashboard(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
