/**
 * Example usage of Code With Kids design system.
 * Use these patterns in features (e.g. Events UI, landing sections).
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cwkPageHeader, cwkPageHeaderAccent, cwkHeroSection, cwkLogoGradient } from "@/lib/cwk-theme";
import { cn } from "@/lib/utils";

export function CwkThemeExample() {
  return (
    <div className={cn("rounded-2xl border p-8", cwkHeroSection)}>
      {/* Page header: navy text + pink accent underline */}
      <h1 className={cn("text-2xl font-bold mb-1", cwkPageHeader)}>
        <span className={cwkPageHeaderAccent}>Upcoming events</span>
      </h1>
      <p className="text-cwk-navy/80 text-sm mb-6">
        Browse CWK events. Parents and organisations can register learners from their portals.
      </p>

      {/* CTAs: primary (CWK pink) and secondary (CWK teal) */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button variant="default">Register learner</Button>
        <Button variant="secondary">View all events</Button>
      </div>

      {/* Accent badge (yellow) */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">New</Badge>
        <Badge variant="accent">Featured</Badge>
      </div>

      {/* Optional: logo-style gradient bar */}
      <div className={cn("mt-6 h-1 rounded-full opacity-80", cwkLogoGradient)} />
    </div>
  );
}
