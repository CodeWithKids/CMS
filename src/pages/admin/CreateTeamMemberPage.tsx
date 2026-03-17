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
import { ArrowLeft, UserPlus, AlertCircle, Building2, UserRound, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isApiEnabled,
  adminAccountsCreate,
  adminCreateOrganisationAccount,
  ApiError,
} from "@/lib/api";
import type { UserRole } from "@/types";

const MIN_PASSWORD_LENGTH = 6;

type AccountType = "team" | "parent" | "organisation";

const TEAM_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "educator", label: "Educator" },
  { value: "finance", label: "Finance" },
  { value: "partnerships", label: "Partnerships" },
  { value: "marketing", label: "Marketing" },
  { value: "social_media", label: "Social media" },
  { value: "ld_manager", label: "L&D Manager" },
];

const ORG_TYPES: { value: "school" | "organisation" | "miradi" | "other"; label: string }[] = [
  { value: "school", label: "School" },
  { value: "organisation", label: "Organisation" },
  { value: "miradi", label: "FCP / Miradi" },
  { value: "other", label: "Other" },
];

export default function CreateTeamMemberPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<AccountType>("team");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teamForm, setTeamForm] = useState({
    name: "",
    email: "",
    role: "educator" as UserRole,
    password: "",
    confirmPassword: "",
  });
  const [parentForm, setParentForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [orgForm, setOrgForm] = useState({
    organisationName: "",
    type: "organisation" as "school" | "organisation" | "miradi" | "other",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateTeam = () => {
    const e: Record<string, string> = {};
    if (!teamForm.name.trim()) e.name = "Name is required.";
    if (!teamForm.email.trim()) e.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(teamForm.email.trim())) e.email = "Please enter a valid email.";
    if (teamForm.password.length < MIN_PASSWORD_LENGTH) e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (teamForm.password !== teamForm.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const validateParent = () => {
    const e: Record<string, string> = {};
    if (!parentForm.name.trim()) e.name = "Name is required.";
    if (!parentForm.email.trim()) e.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentForm.email.trim())) e.email = "Please enter a valid email.";
    if (parentForm.password.length < MIN_PASSWORD_LENGTH) e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (parentForm.password !== parentForm.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const validateOrg = () => {
    const e: Record<string, string> = {};
    if (!orgForm.organisationName.trim()) e.organisationName = "Organisation name is required.";
    if (!orgForm.contactPerson.trim()) e.contactPerson = "Contact person is required.";
    if (!orgForm.contactEmail.trim()) e.contactEmail = "Contact email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(orgForm.contactEmail.trim())) e.contactEmail = "Please enter a valid email.";
    if (orgForm.password.length < MIN_PASSWORD_LENGTH) e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (orgForm.password !== orgForm.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const e2 = validateTeam();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setErrors({});
    if (!isApiEnabled()) {
      toast({ title: "API not configured", description: "Enable the API to create accounts.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await adminAccountsCreate({
        name: teamForm.name.trim(),
        email: teamForm.email.trim(),
        role: teamForm.role,
        password: teamForm.password,
      });
      toast({ title: "Team member created", description: `${teamForm.name} can log in with their email and the password you set.` });
      navigate("/admin/account-approvals");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not create team member.";
      setError(msg);
      toast({ title: "Creation failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const e2 = validateParent();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setErrors({});
    if (!isApiEnabled()) {
      toast({ title: "API not configured", description: "Enable the API to create accounts.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await adminAccountsCreate({
        name: parentForm.name.trim(),
        email: parentForm.email.trim(),
        role: "parent",
        password: parentForm.password,
      });
      toast({ title: "Parent account created", description: `${parentForm.name} can log in with their email and the password you set.` });
      navigate("/admin/account-approvals");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not create parent account.";
      setError(msg);
      toast({ title: "Creation failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const e2 = validateOrg();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setErrors({});
    if (!isApiEnabled()) {
      toast({ title: "API not configured", description: "Enable the API to create accounts.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await adminCreateOrganisationAccount({
        organisationName: orgForm.organisationName.trim(),
        type: orgForm.type,
        contactPerson: orgForm.contactPerson.trim(),
        contactEmail: orgForm.contactEmail.trim(),
        contactPhone: orgForm.contactPhone.trim() || undefined,
        location: orgForm.location.trim() || undefined,
        password: orgForm.password,
      });
      toast({
        title: "Organisation account created",
        description:
          "They can log in with the contact email and the password you set. View all organisations on the Partners page.",
      });
      navigate("/admin/account-approvals");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not create organisation account.";
      setError(msg);
      toast({ title: "Creation failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/account-approvals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-muted-foreground">
            Create a team member, parent, or organisation account. They will log in with the email and password you set. To add a learner, use the{" "}
            <Link to="/admin/learners" className="text-primary hover:underline font-medium">Learners</Link> page.
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
            <UserPlus className="w-5 h-5" /> New account
          </CardTitle>
          <CardDescription>Choose the type of account to create.</CardDescription>
          <div className="pt-2">
            <Label className="text-muted-foreground text-xs">Account type</Label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">
                  <span className="flex items-center gap-2"><UserRound className="w-4 h-4" /> Team member (educator, finance, etc.)</span>
                </SelectItem>
                <SelectItem value="parent">
                  <span className="flex items-center gap-2"><UserRound className="w-4 h-4" /> Parent</span>
                </SelectItem>
                <SelectItem value="organisation">
                  <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Organisation / School / FCP</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {accountType === "team" && (
            <form onSubmit={handleSubmitTeam} className="space-y-4">
              <div>
                <Label htmlFor="tm-name">Full name</Label>
                <Input id="tm-name" value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Jane Doe" className="mt-1" />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="tm-email">Email (login)</Label>
                <Input id="tm-email" type="email" value={teamForm.email} onChange={(e) => setTeamForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className="mt-1" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label>Role</Label>
                <Select value={teamForm.role} onValueChange={(v) => setTeamForm((f) => ({ ...f, role: v as UserRole }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tm-pw">Password</Label>
                <Input id="tm-pw" type="password" autoComplete="new-password" value={teamForm.password} onChange={(e) => setTeamForm((f) => ({ ...f, password: e.target.value }))} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} className="mt-1" />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="tm-confirm">Confirm password</Label>
                <Input id="tm-confirm" type="password" autoComplete="new-password" value={teamForm.confirmPassword} onChange={(e) => setTeamForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" className="mt-1" />
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create team member"}</Button>
                <Button type="button" variant="outline" asChild><Link to="/admin/account-approvals">Cancel</Link></Button>
              </div>
            </form>
          )}

          {accountType === "parent" && (
            <form onSubmit={handleSubmitParent} className="space-y-4">
              <div>
                <Label htmlFor="p-name">Full name</Label>
                <Input id="p-name" value={parentForm.name} onChange={(e) => setParentForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. John Parent" className="mt-1" />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="p-email">Email (login)</Label>
                <Input id="p-email" type="email" value={parentForm.email} onChange={(e) => setParentForm((f) => ({ ...f, email: e.target.value }))} placeholder="parent@example.com" className="mt-1" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="p-pw">Password</Label>
                <Input id="p-pw" type="password" autoComplete="new-password" value={parentForm.password} onChange={(e) => setParentForm((f) => ({ ...f, password: e.target.value }))} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} className="mt-1" />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="p-confirm">Confirm password</Label>
                <Input id="p-confirm" type="password" autoComplete="new-password" value={parentForm.confirmPassword} onChange={(e) => setParentForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" className="mt-1" />
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create parent account"}</Button>
                <Button type="button" variant="outline" asChild><Link to="/admin/account-approvals">Cancel</Link></Button>
              </div>
            </form>
          )}

          {accountType === "organisation" && (
            <form onSubmit={handleSubmitOrg} className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organisation name</Label>
                <Input id="org-name" value={orgForm.organisationName} onChange={(e) => setOrgForm((f) => ({ ...f, organisationName: e.target.value }))} placeholder="e.g. Riverside School" className="mt-1" />
                {errors.organisationName && <p className="mt-1 text-xs text-destructive">{errors.organisationName}</p>}
              </div>
              <div>
                <Label>Type</Label>
                <Select value={orgForm.type} onValueChange={(v) => setOrgForm((f) => ({ ...f, type: v as typeof orgForm.type }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="org-contact">Contact person</Label>
                <Input id="org-contact" value={orgForm.contactPerson} onChange={(e) => setOrgForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. Jane Director" className="mt-1" />
                {errors.contactPerson && <p className="mt-1 text-xs text-destructive">{errors.contactPerson}</p>}
              </div>
              <div>
                <Label htmlFor="org-email">Contact email (login)</Label>
                <Input id="org-email" type="email" value={orgForm.contactEmail} onChange={(e) => setOrgForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@school.org" className="mt-1" />
                {errors.contactEmail && <p className="mt-1 text-xs text-destructive">{errors.contactEmail}</p>}
              </div>
              <div>
                <Label htmlFor="org-phone">Contact phone (optional)</Label>
                <Input id="org-phone" type="tel" value={orgForm.contactPhone} onChange={(e) => setOrgForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="+254..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="org-location">Location (optional)</Label>
                <Input id="org-location" value={orgForm.location} onChange={(e) => setOrgForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Nairobi" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="org-pw">Password</Label>
                <Input id="org-pw" type="password" autoComplete="new-password" value={orgForm.password} onChange={(e) => setOrgForm((f) => ({ ...f, password: e.target.value }))} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} className="mt-1" />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="org-confirm">Confirm password</Label>
                <Input id="org-confirm" type="password" autoComplete="new-password" value={orgForm.confirmPassword} onChange={(e) => setOrgForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" className="mt-1" />
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create organisation account"}</Button>
                <Button type="button" variant="outline" asChild><Link to="/admin/account-approvals">Cancel</Link></Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GraduationCap className="w-4 h-4 shrink-0" />
        <span>To create a <strong>learner</strong> (student), go to the <Link to="/admin/learners" className="text-primary hover:underline font-medium">Learners</Link> page and add a new learner there.</span>
      </div>
    </div>
  );
}
