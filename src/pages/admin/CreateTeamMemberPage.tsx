import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isApiEnabled, adminAccountsCreate } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/types";

const MIN_PASSWORD_LENGTH = 6;

const TEAM_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "educator", label: "Educator" },
  { value: "finance", label: "Finance" },
  { value: "partnerships", label: "Partnerships" },
  { value: "marketing", label: "Marketing" },
  { value: "social_media", label: "Social media" },
  { value: "ld_manager", label: "L&D Manager" },
];

export default function CreateTeamMemberPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "educator" as UserRole,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters. Share this securely with the team member.`;
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    if (!isApiEnabled()) {
      toast({
        title: "API not configured",
        description: "Enable the API to create team members.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await adminAccountsCreate({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
      });
      toast({
        title: "Team member created",
        description: `${form.name} can now log in with their email and the password you set. Share the password securely.`,
      });
      navigate("/admin/account-approvals");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create team member. Try again.";
      setError(message);
      toast({ title: "Creation failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/account-approvals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create team member</h1>
          <p className="text-muted-foreground">
            Invite a team member (educator, finance, partnerships, etc.). They will log in with the email and password you set. Team accounts are created by admin only—no public signup.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> New team member
          </CardTitle>
          <CardDescription>
            Set a temporary password and share it securely with the person. They can change it after first login (if you add that flow later).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tm-name">Full name</Label>
              <Input
                id="tm-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Jane Doe"
                className="mt-1"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="tm-email">Email (login)</Label>
              <Input
                id="tm-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@codewithkids.afrika"
                className="mt-1"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tm-password">Temporary password</Label>
              <Input
                id="tm-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                className="mt-1"
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="tm-confirm">Confirm password</Label>
              <Input
                id="tm-confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat password"
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create team member"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/account-approvals">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
