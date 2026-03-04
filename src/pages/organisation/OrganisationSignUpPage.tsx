import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrganizationType } from "@/types";
import { isApiEnabled, organisationsSignup } from "@/lib/api";
import { ApiError } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 6;

export type SignupVariant = "organisation" | "school" | "miradi";

const VARIANT_CONFIG: Record<
  SignupVariant,
  { title: string; subtitle: string; defaultType: OrganizationType; formLabel: string }
> = {
  organisation: {
    title: "Create organisation account",
    subtitle: "Register your organisation (NGO, company, or other) to get access to view your learners and invoices.",
    defaultType: "other",
    formLabel: "Sign up your organisation",
  },
  school: {
    title: "Create school account",
    subtitle: "Register your school to get access to view your learners, attendance, and invoices.",
    defaultType: "school",
    formLabel: "Sign up your school",
  },
  miradi: {
    title: "Create FCP account",
    subtitle: "Register your FCP (Compassion International Frontline Church Partner) to get access to view your learners and programme details.",
    defaultType: "church",
    formLabel: "Sign up your FCP",
  },
};

function getSignupVariant(pathname: string): SignupVariant {
  if (pathname.includes("/signup/school")) return "school";
  if (pathname.includes("/signup/miradi")) return "miradi";
  return "organisation";
}

export default function OrganisationSignUpPage() {
  const location = useLocation();
  const variant = useMemo(() => getSignupVariant(location.pathname), [location.pathname]);
  const config = VARIANT_CONFIG[variant];

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    organisationName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    location: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    const nameLabel =
      variant === "school" ? "School name" : variant === "miradi" ? "FCP name" : "Organisation name";
    if (!form.organisationName.trim()) {
      nextErrors.organisationName = `${nameLabel} is required.`;
    }
    if (!form.contactPerson.trim()) {
      nextErrors.contactPerson = "Contact person is required.";
    }
    if (!form.contactEmail.trim()) {
      nextErrors.contactEmail = "Contact email is required.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail.trim())) {
      nextErrors.contactEmail = "Please enter a valid email address.";
    }
    if (form.contactPhone.trim()) {
      const phone = form.contactPhone.trim();
      if (!phone.startsWith("+254")) {
        nextErrors.contactPhone = "Phone must start with +254 (e.g. +254 712 345 678).";
      } else {
        const digitsAfter254 = phone.slice(4).replace(/\D/g, "");
        if (digitsAfter254.length !== 9) {
          nextErrors.contactPhone = "Enter a valid Kenyan number: +254 followed by 9 digits (e.g. 712 345 678).";
        }
      }
    }
    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (isApiEnabled()) {
      setSubmitting(true);
      try {
        await organisationsSignup({
          signupType: variant,
          organisationName: form.organisationName.trim(),
          type: config.defaultType,
          contactPerson: form.contactPerson.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim() || null,
          location: form.location.trim() || null,
          password: form.password.trim(),
        });
        setSubmitted(true);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Registration failed. Please try again.";
        const isNetwork = msg.includes("fetch") || msg.includes("Network");
        setSubmitError(
          isNetwork
            ? "Could not reach the server. Check that the API is running (e.g. npm run dev in the server folder) and try again."
            : msg
        );
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Request submitted</h1>
          <p className="text-muted-foreground mt-2">
            An admin will review your signup and approve your account. You will be able to log in with your contact email and password once approved. You will then be linked to your sessions and learners.
          </p>
          <Button asChild className="mt-6">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            aria-label="Code With Kids home"
          >
            <img
              src="/cwk-icon.png"
              alt="Code With Kids"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl"
              width={64}
              height={64}
            />
          </Link>
          <p className="text-muted-foreground mt-2">{config.title}</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-1">{config.formLabel}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {config.subtitle} Set a password to create your login and sign in after registering.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{submitError}</p>
            )}
            <div>
              <Label htmlFor="org-name">
                {variant === "school" ? "School name" : variant === "miradi" ? "FCP name" : "Organisation name"}
              </Label>
              <Input
                id="org-name"
                placeholder="e.g. Riverside Academy"
                value={form.organisationName}
                onChange={(e) => setForm((f) => ({ ...f, organisationName: e.target.value }))}
                className="mt-1"
              />
              {errors.organisationName && (
                <p className="mt-1 text-xs text-destructive">{errors.organisationName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact-person">Contact person</Label>
              <Input
                id="contact-person"
                placeholder="Full name"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                className="mt-1"
              />
              {errors.contactPerson && (
                <p className="mt-1 text-xs text-destructive">{errors.contactPerson}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="admin@school.org"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                className="mt-1"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-destructive">{errors.contactEmail}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                className="mt-1"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-destructive">{errors.contactPhone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City or address"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={form.password}
                required
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                required
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Request access"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
