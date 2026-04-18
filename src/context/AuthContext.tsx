import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getDemoLoginUsers } from "@/lib/demoLoginUsers";
import {
  isApiEnabled,
  authLogin,
  authMe,
  authLogout,
  setAccessToken,
  clearAccessToken,
  type LoginResponse,
} from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { isHybridBackendConfigured } from "@/lib/runtimeBackend";

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

const SUPPORTED_ROLES: UserRole[] = [
  "admin",
  "educator",
  "finance",
  "student",
  "parent",
  "organisation",
  "partnerships",
  "marketing",
  "social_media",
  "ld_manager",
];

const SUPPORTED_USER_STATUSES = ["pending", "active", "rejected"] as const;
const SUPPORTED_MEMBERSHIP_STATUSES = ["active", "inactive", "expired"] as const;

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && SUPPORTED_ROLES.includes(value as UserRole);
}

function isUserStatus(value: unknown): value is AppUser["status"] {
  return typeof value === "string" && SUPPORTED_USER_STATUSES.includes(value as (typeof SUPPORTED_USER_STATUSES)[number]);
}

function isMembershipStatus(value: unknown): value is AppUser["membershipStatus"] {
  return (
    typeof value === "string" &&
    SUPPORTED_MEMBERSHIP_STATUSES.includes(value as (typeof SUPPORTED_MEMBERSHIP_STATUSES)[number])
  );
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

async function supabaseUserToAppUser(user: SupabaseUser): Promise<AppUser> {
  const client = getSupabaseClient();
  const { data: profile, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;

  const raw = (profile as Record<string, unknown> | null) ?? {};
  const roleRaw = raw.role;
  const statusRaw = raw.status;
  const organizationIdRaw = raw.organization_id ?? raw.organizationId;
  const membershipStatusRaw = raw.membership_status ?? raw.membershipStatus;
  const avatarIdRaw = raw.avatar_id ?? raw.avatarId;
  const fullNameRaw = raw.name ?? user.user_metadata?.full_name;
  const emailRaw = raw.email ?? user.email;

  const name = stringOrUndefined(fullNameRaw) ?? stringOrUndefined(user.email)?.split("@")[0] ?? "CWK User";

  return {
    id: user.id,
    name,
    role: isUserRole(roleRaw) ? roleRaw : "educator",
    email: stringOrUndefined(emailRaw),
    status: isUserStatus(statusRaw) ? statusRaw : undefined,
    organizationId: stringOrUndefined(organizationIdRaw) ?? null,
    membershipStatus: isMembershipStatus(membershipStatusRaw) ? membershipStatusRaw : undefined,
    avatarId: stringOrUndefined(avatarIdRaw),
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

  // When any API call returns 401, clear user and token so UI redirects to login
  useEffect(() => {
    const handler = () => {
      clearAccessToken();
      localStorage.removeItem("cwk_user");
      setCurrentUser(null);
    };
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, []);

  // When API is enabled and we have a token but no user (e.g. page refresh), restore session
  useEffect(() => {
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      const syncSupabaseSession = async () => {
        const { data, error } = await client.auth.getSession();
        if (error || !data.session?.user) {
          localStorage.removeItem("cwk_user");
          setCurrentUser(null);
          return;
        }
        try {
          const user = await supabaseUserToAppUser(data.session.user);
          setCurrentUser(user);
        } catch {
          setCurrentUser(null);
        }
      };

      void syncSupabaseSession();
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          localStorage.removeItem("cwk_user");
          setCurrentUser(null);
          return;
        }
        void supabaseUserToAppUser(session.user)
          .then((u) => setCurrentUser(u))
          .catch(() => setCurrentUser(null));
      });
      return () => data.subscription.unsubscribe();
    }

    if (!isApiEnabled() || currentUser) return;
    const token = localStorage.getItem("cwk_token");
    if (!token) return;
    void authMe(token)
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
    const user = getDemoLoginUsers().find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    if (!isSupabaseEnabled() && !isApiEnabled()) {
      return {
        ok: false as const,
        error:
          "Sign-in is not configured for this app build. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or VITE_API_URL, in your hosting environment and redeploy.",
      };
    }

    if (isSupabaseEnabled()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          return { ok: false as const, error: error.message || "Invalid email or password." };
        }
        if (!data.user) {
          return { ok: false as const, error: "No user returned from Supabase." };
        }
        const user = await supabaseUserToAppUser(data.user);
        setCurrentUser(user);
        return { ok: true as const, user };
      } catch {
        return { ok: false as const, error: "Invalid email or password." };
      }
    }

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
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      void client.auth.signOut();
    }
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
      if ("avatarId" in partial && !isHybridBackendConfigured()) {
        const u = getDemoLoginUsers().find((x) => x.id === prev.id);
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
