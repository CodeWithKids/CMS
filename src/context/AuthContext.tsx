import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/types";
import { mockUsers } from "@/mockData";
import {
  isApiEnabled,
  authLogin,
  authMe,
  authLogout,
  setAccessToken,
  clearAccessToken,
  type LoginResponse,
} from "@/lib/api";

function apiUserToAppUser(u: LoginResponse["user"] | null | undefined): AppUser {
  if (!u || typeof u !== "object" || !("id" in u) || !("role" in u)) {
    throw new Error("Invalid user object from server");
  }
  return {
    id: u.id,
    name: u.name,
    role: u.role as AppUser["role"],
    email: u.email ?? undefined,
    status: (u.status as AppUser["status"]) ?? undefined,
    organizationId: u.organizationId ?? undefined,
    membershipStatus: (u.membershipStatus as AppUser["membershipStatus"]) ?? undefined,
    avatarId: u.avatarId ?? undefined,
  };
}

interface AuthContextType {
  currentUser: AppUser | null;
  /** Demo/mock: log in by user id (no API). */
  login: (userId: string) => void;
  /** API: log in with email and password; stores token and user. */
  loginWithCredentials: (email: string, password: string) => Promise<
    | { ok: true; user: AppUser }
    | { ok: false; error: string }
  >;
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
        return JSON.parse(saved) as AppUser;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("cwk_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("cwk_user");
    }
  }, [currentUser]);

  // When API is enabled and we have a token but no user (e.g. page refresh), restore session
  useEffect(() => {
    if (!isApiEnabled() || currentUser) return;
    const token = localStorage.getItem("cwk_token");
    if (!token) return;
    authMe(token)
      .then((data) => {
        // Backend may return the user object directly or as { user }
        const user = data && typeof data === "object" && "user" in data ? (data as { user: LoginResponse["user"] }).user : data;
        if (!user) {
          clearAccessToken();
          localStorage.removeItem("cwk_user");
          return;
        }
        setCurrentUser(apiUserToAppUser(user));
      })
      .catch(() => {
        clearAccessToken();
        localStorage.removeItem("cwk_user");
      });
  }, []);

  const login = useCallback((userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    try {
      const res = await authLogin(email, password);
      if (!res?.user) {
        return { ok: false as const, error: "Invalid response from server." };
      }
      setAccessToken(res.accessToken);
      const user = apiUserToAppUser(res.user);
      setCurrentUser(user);
      return { ok: true as const, user };
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "body" in e && e.body && typeof (e.body as { message?: string }).message === "string"
          ? (e.body as { message: string }).message
          : "Invalid email or password.";
      return { ok: false as const, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    if (isApiEnabled()) {
      authLogout();
      clearAccessToken();
    }
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<Pick<AppUser, "avatarId" | "name" | "email">>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...partial };
      if ("avatarId" in partial) {
        const u = mockUsers.find((x) => x.id === prev.id);
        if (u) (u as AppUser).avatarId = partial.avatarId;
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        loginWithCredentials,
        logout,
        updateUser,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRoleDashboard(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: "/admin/dashboard",
    educator: "/educator/dashboard",
    finance: "/finance/dashboard",
    student: "/student/dashboard",
    parent: "/parent/dashboard",
    organisation: "/organisation/dashboard",
    partnerships: "/partnerships/dashboard",
    marketing: "/marketing/dashboard",
    social_media: "/social-media/dashboard",
    ld_manager: "/ld/dashboard",
  };
  return map[role];
}
