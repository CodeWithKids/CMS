import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiEnabled, parentsSignup } from "@/lib/api";
import { ApiError } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 6;

export default function ParentSignUpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactPhone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
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
        await parentsSignup({
          name: form.name.trim(),
          email: form.email.trim(),
          contactPhone: form.contactPhone.trim() || undefined,
          password: form.password,
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
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Request submitted</h1>
          <p className="text-muted-foreground mt-2">
            An admin will review your signup and approve your account. You will be able to log in with your email and password once approved. Activate your membership to access the full portal.
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
          <p className="text-muted-foreground mt-2">Create parent account</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-1">Sign up as a parent</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create an account to view your children&apos;s sessions, attendance, and invoices. You can log in once your membership is active.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{submitError}</p>
            )}
            <div>
              <Label htmlFor="parent-name">Full name</Label>
              <Input
                id="parent-name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="parent-email">Email</Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="parent-phone">Contact phone</Label>
              <Input
                id="parent-phone"
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
              <Label htmlFor="parent-password">Password</Label>
              <Input
                id="parent-password"
                type="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1"
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="parent-confirm">Confirm password</Label>
              <Input
                id="parent-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Create account"}
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
