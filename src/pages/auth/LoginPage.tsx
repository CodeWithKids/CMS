import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import { mockUsers, getLearnerByUserId } from "@/mockData";
import { isApiEnabled } from "@/lib/api";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const LOGO_SRC = "/cwk-icon.png";

const MAKERSPACE_LOGIN_ERROR =
  "Only active Makerspace members can log in. Please check your membership.";

const PARENT_MEMBERSHIP_ERROR =
  "Your parent membership is not active. Please renew your membership to access the portal.";

export default function LoginPage() {
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const useApi = isApiEnabled();

  const handleDemoLogin = () => {
    setError(null);
    const user = mockUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    if (user.role === "student") {
      const learner = getLearnerByUserId(user.id);
      if (!learner || learner.programType !== "MAKERSPACE" || learner.membershipStatus !== "active") {
        setError(MAKERSPACE_LOGIN_ERROR);
        return;
      }
    }

    if (user.role === "parent") {
      if (user.membershipStatus !== "active") {
        setError(PARENT_MEMBERSHIP_ERROR);
        return;
      }
    }

    login(selectedUserId);
    navigate(getRoleDashboard(user.role));
  };

  const handleApiLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginWithCredentials(email.trim(), password);
    setLoading(false);
    if (result?.ok && result.user) {
      navigate(getRoleDashboard(result.user.role));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo – match signup pages */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            aria-label="Code With Kids home"
          >
            <img
              src={LOGO_SRC}
              alt="Code With Kids"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl mx-auto"
              width={64}
              height={64}
            />
          </Link>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            STEM Education Operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-lg p-5 sm:p-6">
          <h1 className="text-xl font-semibold mb-1">Log in</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Enter your email and password to access your account.
          </p>

          {useApi ? (
            <form onSubmit={handleApiLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="mt-0"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="mt-0"
                />
              </div>
              {error && (
                <p
                  className="text-sm text-destructive px-3 py-2 rounded-lg bg-destructive/10"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? "Signing in…" : "Sign in"} <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-user">Select a user to log in as</Label>
                <select
                  id="demo-user"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setError(null);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {mockUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p
                  className="text-sm text-destructive px-3 py-2 rounded-lg bg-destructive/10"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                type="button"
                onClick={handleDemoLogin}
                className="w-full gap-2"
              >
                Sign in <ChevronRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Demo mode: select any role to explore the system.
              </p>
            </div>
          )}

          <p className="text-sm text-center mt-5 pt-4 border-t text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
