import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/types";
import { mockUsers } from "@/mockData";

interface AuthContextType {
  currentUser: AppUser | null;
  login: (userId: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<Pick<AppUser, "avatarId" | "name" | "email">>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("cwk_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("cwk_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("cwk_user");
    }
  }, [currentUser]);

  const login = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const updateUser = (partial: Partial<Pick<AppUser, "avatarId" | "name" | "email">>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper: get role-based home path
export function getRoleDashboard(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: "/admin/dashboard",
    educator: "/educator/dashboard",
    finance: "/finance/dashboard",
    student: "/student/dashboard",
    parent: "/parent/dashboard",
    organisation: "/organisation/dashboard",
  };
  return map[role];
}
