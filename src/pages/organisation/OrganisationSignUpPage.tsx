import { useState } from "react";
import { Link } from "react-router-dom";
import { Code, Building2 } from "lucide-react";
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
import type { OrganizationType } from "@/types";

const ORGANISATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "school", label: "School" },
  { value: "church", label: "Church" },
  { value: "NGO", label: "NGO" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other" },
];

export default function OrganisationSignUpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    organisationName: "",
    type: "school" as OrganizationType,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    location: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Thank you for registering</h1>
          <p className="text-muted-foreground mt-2">
            We&apos;ve received your request. Our team will be in touch to set up your organisation portal so you can view your learners&apos; details.
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
          <Link to="/" className="inline-flex items-center gap-2 text-foreground">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Code className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Code With Kids</span>
          </Link>
          <p className="text-muted-foreground mt-2">Organisation portal sign-up</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-1">Sign up your school or organisation</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Register to get access to view details of your learners (attendance, progress, and more).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organisation name</Label>
              <Input
                id="org-name"
                required
                placeholder="e.g. Riverside Academy"
                value={form.organisationName}
                onChange={(e) => setForm((f) => ({ ...f, organisationName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as OrganizationType }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANISATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contact-person">Contact person</Label>
              <Input
                id="contact-person"
                required
                placeholder="Full name"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"
                required
                placeholder="admin@school.org"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+27 ..."
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                className="mt-1"
              />
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
            <Button type="submit" className="w-full">
              Request access
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
