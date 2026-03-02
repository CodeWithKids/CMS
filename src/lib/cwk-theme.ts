/**
 * Code With Kids design tokens.
 * Use in features (e.g. Events UI) for consistent brand colors.
 * Tailwind: use cwk-* classes (bg-cwk-pink, text-cwk-navy) or semantic tokens (bg-primary, text-accent).
 */

export const cwkTheme = {
  colors: {
    pink: "#F85A7A",
    yellow: "#F9C846",
    teal: "#21B29A",
    navy: "#17324A",
    cream: "#FFF7E6",
    white: "#FFFFFF",
  },
} as const;

export type CwkColorKey = keyof typeof cwkTheme.colors;

/** Tailwind class for CWK logo-style gradient (pink → yellow). */
export const cwkLogoGradient = "bg-gradient-to-r from-cwk-pink to-cwk-yellow";

/** Hero section: soft cream background with navy text. */
export const cwkHeroSection =
  "bg-cwk-cream text-cwk-navy border-cwk-navy/10";

/** Primary CTA: use default Button (already CWK pink via CSS vars). */
export const cwkCtaPrimary = "bg-primary text-primary-foreground hover:bg-primary/90";

/** Secondary CTA: teal outline. */
export const cwkCtaSecondary =
  "border-2 border-cwk-teal text-cwk-teal hover:bg-cwk-teal hover:text-white";

/** Accent highlight (yellow) for badges or labels. */
export const cwkAccentBadge =
  "bg-cwk-yellow/20 text-cwk-navy border border-cwk-yellow/40";

/** Page header with navy title and pink accent underline. */
export const cwkPageHeader = "text-cwk-navy";
export const cwkPageHeaderAccent = "border-b-2 border-cwk-pink pb-1";
