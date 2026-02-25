import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import { mockUsers, getLearnerByUserId } from "@/mockData";
import { Code, ChevronRight } from "lucide-react";

const MAKERSPACE_LOGIN_ERROR =
  "Only active Makerspace members can log in. Please check your membership.";

const PARENT_MEMBERSHIP_ERROR =
  "Your parent membership is not active. Please renew your membership to access the portal.";

export default function LoginPage() {
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Code className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Code With Kids</h1>
          <p className="text-muted-foreground mt-2">STEM Education Operations System</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-lg">
          <label className="block text-sm font-medium mb-2">Select a user to log in as:</label>
          <select
            value={selectedUserId}
            onChange={(e) => { setSelectedUserId(e.target.value); setError(null); }}
            className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {mockUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {error && (
            <p className="text-sm text-destructive mb-4 px-3 py-2 rounded-lg bg-destructive/10" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Sign In <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            This is a demo login. Select any role to explore the system.
          </p>
          <p className="text-sm text-center mt-3">
            <Link to="/signup/organisation" className="text-primary hover:underline">
              Sign up your school or organisation
            </Link>
            {" "}to view your learners&apos; details.
          </p>
        </div>
      </div>
    </div>
  );
}
