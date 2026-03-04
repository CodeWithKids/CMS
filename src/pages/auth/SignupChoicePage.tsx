import { Link } from "react-router-dom";
import { Building2, GraduationCap, Users, Church, ChevronRight } from "lucide-react";

const LOGO_SRC = "/cwk-icon.png";

const OPTIONS = [
  {
    to: "/signup/school",
    label: "School",
    description: "Register your school to view learners and invoices.",
    icon: GraduationCap,
  },
  {
    to: "/signup/parent",
    label: "Parent",
    description: "Create an account to view your children's sessions and invoices.",
    icon: Users,
  },
  {
    to: "/signup/organisation",
    label: "Organisation",
    description: "Register your organisation (NGO, company, or other).",
    icon: Building2,
  },
  {
    to: "/signup/miradi",
    label: "Miradi",
    description: "Register your FCP (Compassion International Frontline Church Partner).",
    icon: Church,
  },
];

export default function SignupChoicePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo and branding – same structure as login for consistency */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            aria-label="Code With Kids home"
          >
            <img
              src={LOGO_SRC}
              alt="Code With Kids"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl"
              width={64}
              height={64}
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-6">Sign up</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">I'm signing up as...</p>
        </div>

        {/* Options card */}
        <div className="bg-card rounded-2xl border shadow-lg p-4 sm:p-5 space-y-3">
          {OPTIONS.map(({ to, label, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 w-full py-4 px-4 rounded-xl border bg-background hover:bg-muted/50 hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors text-left no-underline text-foreground group"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-base">{label}</span>
                <span className="text-sm text-muted-foreground font-normal block mt-0.5">
                  {description}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0" aria-hidden />
            </Link>
          ))}
        </div>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
